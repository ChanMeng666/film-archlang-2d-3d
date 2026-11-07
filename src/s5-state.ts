// S5's source panel and finding cards at any frame, as data: what text the panel shows, which line
// each card names, and which lines are highlighted. Pure (no React, no Remotion), so the scene draws
// it and scripts/gate-facts.mjs walks it frame by frame.

export const S5_BEATS = {
  SELECT_1: 40,
  TYPE_FROM: 80,
  TYPE_TO: 140,
  FIXED_1: 150,
  SELECT_2: 180,
  EDIT_2: 236,
  FIXED_2: 262,
} as const;

export interface PanelFinding {
  code: string;
  message: string;
  fix: string;
  hint: string;
  line: number;
}
/** One state of the panel: the exact text shown, and `lint --json` of that text (the bake's). */
export interface PanelState {
  source: string;
  findings: PanelFinding[];
}

export interface S5View {
  /** 0 broken, 1 door line typed in, 2 wardrobe slid. */
  state: 0 | 1 | 2;
  /** The panel's lines at this frame (during typing, the door line is partly typed). */
  lines: string[];
  /** 1-based line of the door line being typed back (in states 1 and 2). */
  insertedLine: number;
  /** The two cards: the first finding of the broken file, then the second, each from the lint of the shown state. */
  cards: [PanelFinding, PanelFinding];
}

/**
 * `typed` is the fraction of the door line typed so far (0–1; the scene eases it). The card for the
 * second finding takes its line from the lint of the text on screen: the broken file before the
 * door line appears, the door-fixed file from then on.
 */
export function s5View(frame: number, panel: PanelState[], typed: number): S5View {
  const B = S5_BEATS;
  const state: 0 | 1 | 2 = frame < B.TYPE_FROM ? 0 : frame < B.EDIT_2 ? 1 : 2;
  const p0 = panel[0].source.split("\n");
  const p1 = panel[1].source.split("\n");
  let at = 0;
  while (at < p0.length && p0[at] === p1[at]) at++;
  const insertedLine = at + 1;
  let lines = panel[state].source.split("\n");
  if (state === 1) {
    const full = p1[at];
    const indent = full.length - full.trimStart().length;
    const body = full.slice(indent);
    lines = [...lines];
    lines[at] = full.slice(0, indent) + body.slice(0, Math.round(typed * body.length));
  }
  const [first, second] = panel[0].findings;
  const secondNow = state === 0 ? second : panel[1].findings.find((f) => f.code === second.code) ?? second;
  return { state, lines, insertedLine, cards: [first, secondNow] };
}

/** The element a finding names, as it appears on its line: a room's label or a furniture kind. */
export function elementOnLine(line: string): string | null {
  const furn = /^\s*furniture\s+(\w+)/.exec(line);
  if (furn) return furn[1];
  const room = /^\s*room\b.*\blabel\s+"([^"]+)"/.exec(line);
  if (room) return room[1];
  return null;
}

/** True when `message` names `element` as a whole word ("bed" is not named by "Bedroom"). */
export function names(message: string, element: string | null): boolean {
  if (!element) return false;
  const esc = element.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}_])${esc}($|[^\\p{L}\\p{N}_])`, "iu").test(message);
}
