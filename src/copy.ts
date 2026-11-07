// Every word the film speaks or shows, and nowhere else.
//
// NARRATION is the English voice-over (the owner's cloned voice, docs/narration.md), one sentence
// per cue: `en` is what the voice says, `en_sub` (when present) is how the English subtitle writes
// it (only the URL differs). The film is English only (owner, 2026-11-07). A `{slot}` is filled from
// data/facts.json (written by `npm run bake`); spoken text uses a fact's spoken form
// (`{knob.net_m2_spoken}`). No number is typed here. `trace` names the source that allows the claim
// (docs/creative-brief.md § Claims). `npm run gates` checks every line in every form.
//
// Pure module (no imports): Remotion bundles it, and the Node gates, srt.mjs and vo.mjs import it.

export type SceneId = "S0" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8" | "S9" | "S10" | "S11";

export interface Line {
  en: string;
  trace: string;
}

export interface Spoken extends Line {
  key: string;
  /** The English subtitle when it differs from the spoken words. */
  en_sub?: string;
}

const s = (key: string, en: string, trace: string, en_sub?: string): Spoken => ({ key, en, trace, ...(en_sub ? { en_sub } : {}) });

/** The voice-over, scene by scene, in order. One ElevenLabs request per scene (scripts/vo.mjs). */
export const NARRATION: Record<SceneId, Spoken[]> = {
  S0: [
    s("s0_1", "One text file.", 'README "Floor plans as code"'),
    s("s0_2", "Compile it, and you get a dimensioned floor plan.", "README one-liner"),
    s("s0_3", "Then the same file stands up in 3D.", 'README "Same source, plan and 3D preview"'),
  ],
  S1: [
    s("s1_1", "AI tools can draw a floor plan that looks right.", "pain point P1"),
    s(
      "s1_2",
      "But look closer. This bedroom has no door, so you can't walk into it.",
      "reachability (measured): describe access r_bed reachable false; lint W_ROOM_DISCONNECTED",
    ),
    s("s1_3", "{broken.second_spoken}", "lint --json: W_FURNITURE_OVER_WINDOW on the wardrobe line"),
    s("s1_4", "ArchLang finds both.", "lint --json: the two findings"),
  ],
  S2: [
    s("s2_1", "I make ArchLang, a language for floor plans.", "README; the founder's own voice (voice guide: a person)"),
    s(
      "s2_2",
      "You, or your AI, write the rooms, walls, doors and windows as plain text.",
      "messaging-library ArchLang boilerplate",
    ),
    s("s2_3", "The compiler turns that text into a drawing.", "boilerplate"),
    s("s2_4", "It's free, and it's open source.", "README badge, LICENSE (MIT)"),
  ],
  S3: [
    s("s3_1", "Every area is computed from the walls.", "positioning: exact areas (measured)"),
    s(
      "s3_2",
      "These {knob.lines} lines give {knob.rooms} rooms and {knob.net_m2_spoken} of floor.",
      "describe --json totals; the playground's facts line",
    ),
    s(
      "s3_3",
      "And the same text always gives the same drawing, byte for byte.",
      "positioning: byte-identical determinism (measured); asserted in the bake and gate-facts",
    ),
  ],
  S4: [
    s(
      "s4_1",
      "Change one number, and everything that depends on it follows: the walls, the doors, the furniture, the dimensions.",
      "knob-flat.arch header; CHANGELOG 1.56.0 knobs; impact --set",
    ),
    s(
      "s4_2",
      "It even lists what moved: {sweep.changed} things changed, {sweep.held} held, and {sweep.broke} broke.",
      "archlang impact --set LIVING=<end> --json (changed, held, diagnostics.broke)",
    ),
  ],
  S5: [
    s(
      "s5_1",
      "When something is wrong, you get a code, the exact line, and a suggested fix.",
      'README "It checks itself"',
    ),
    s("s5_2", "So your AI can read it, and fix the plan on its own.", "README; agents doc"),
    s(
      "s5_3",
      "Reachability and areas are measured. The other checks are advice.",
      "positioning: the three measurements; README limits",
    ),
  ],
  S6: [
    s(
      "s6_1",
      "One command furnishes the empty rooms and completes the sheet: title, scale, room schedule and legend.",
      "positioning: arch finish; ADR 0024; the bake asserts each sheet statement",
    ),
    s("s6_2", "Then pick a look.", "CHANGELOG 1.54.0 rendered theme"),
  ],
  S7: [
    s("s7_1", "Now switch the same file to 3D.", "CHANGELOG 1.57.0 Plan | 3D switch"),
    s(
      "s7_2",
      "Walls, doors, windows, floors, stairs and furniture, all built from the plan.",
      "README 3D limits line",
    ),
    s(
      "s7_3",
      "Every 3D element traces back to it, and every solid is closed.",
      'README "checked against the plan"',
    ),
    s("s7_4", "Several storeys stack at their real heights.", "archlang-3d README Replay"),
    s(
      "s7_5",
      "It's a preview in flat colours, so no pitched roofs, sections or elevations yet.",
      "README 3D limits line",
    ),
  ],
  S8: [
    s(
      "s8_1",
      "Export to SVG, DXF, PDF or PNG, and GLB for the 3D preview.",
      "boilerplate; archlang-3d README GLB; the bake exported each",
    ),
    s("s8_2", "The DXF comes with real blocks and dimensions.", "CHANGELOG 1.52.0 DXF blocks; the bake counted them"),
  ],
  S9: [
    s("s9_1", "And you can use it where you already work.", "doors.json"),
    s(
      "s9_2",
      "Ask ChatGPT or Claude for a floor plan, and it writes ArchLang and checks it.",
      "README Try it",
    ),
    s("s9_3", "One line adds it to your coding agent.", "README MCP install; doors.json agent.claudeCodeHttp"),
  ],
  S10: [
    s("s10_1", "{gallery.count} example plans ship with it.", "bake count of examples/*.arch"),
    s("s10_2", "Every one compiles, and every one stands up in 3D.", "bake: compile and archlang3d build ok for each"),
  ],
  S11: [
    s(
      "s11_1",
      "These are concept plans to think and decide with, not permit drawings.",
      "positioning: honest permit answer (short)",
    ),
    s(
      "s11_2",
      "Try it free in your browser, at playground dot archlang dot uk.",
      "README",
      "Try it free in your browser, at playground.archlang.uk.",
    ),
    s("s11_3", "Designs that compile.", "docs site hero (brand line)"),
  ],
};

/** The S9 voice input: the owner's cloned voice speaks the brief (a separate TTS request). */
export const VOICE_BRIEF: Spoken = s(
  "s9_brief",
  "Draw me a one-bed flat, living room and kitchen together, about {knob.brief_m2_spoken}, and check it.",
  "docs/narration.md S9; the brief knob-flat.arch answers (net area rounded to 5 m²)",
);

/** Text on screen that is not spoken (labels, the typed brief, the end card). */
export const SCREEN = {
  s0_prompt: {
    en: "A one-bed flat, living room and kitchen together, about {knob.brief_m2} m².",
    trace: "the brief knob-flat.arch answers; the figure is describe's net area rounded to 5 m²",
  },
  s3_card_area: { en: "Area", trace: "playground room card field" },
  s3_card_size: { en: "Size", trace: "playground room card field" },
  s3_card_use: { en: "Use", trace: "playground room card field" },
  s3_card_neighbours: { en: "Neighbours", trace: "playground room card field" },
  s3_card_openings: { en: "Doors · windows", trace: "playground room card field" },
  s3_net: { en: "net", trace: "describe net_area_m2" },
  s3_centre: { en: "to wall centre lines", trace: "describe area_m2 (the plan's room stamp)" },
  s5_findings: { en: "{broken.findings_after} findings", trace: "lint --json on the fixed plan" },
  s5_fix: { en: "Fix", trace: "lint --json fix field" },
  s7_label: { en: "archlang3d replay · official", trace: "archlang3d view --replay" },
  s8_blocks: {
    en: "{exports.dxf_blocks} blocks · {exports.dxf_dimensions} dimensions",
    trace: "bake: counted in the exported DXF",
  },
  s9_label: { en: "Reenactment · real compiler output", trace: "docs/narration.md S9 rule" },
  s9_you: { en: "You", trace: "generic chat UI label" },
  s9_agent: { en: "Coding agent", trace: "generic chat UI label (no product name)" },
  s9_allow: { en: "Allow", trace: "generic tool-call approval" },
  s9_writes: { en: "writes", trace: "generic tool-call label" },
  s9_edits: { en: "edits", trace: "generic tool-call label" },
  s9_open: { en: "Open plan.svg", trace: "generic link to the compiled file" },
  s9_prompt_title: { en: "The README's prompt for a coding agent", trace: "doors.json agentPrompt" },
  s11_tag: { en: "Designs that compile.", trace: "docs site hero (brand line)" },
  s11_cta1: { en: "Try it free: playground.archlang.uk", trace: "README" },
  s11_cta2: { en: "npx @chanmeng666/archlang", trace: "README" },
  // F8, the 30 s cuts: they have no time for the spoken limits lines (s7_5, s11_1), so the screen
  // says them, short (docs/creative-brief.md § Claims: "says its limits once, plainly").
  cut_3d: { en: "3D preview · flat colours", trace: "brief § Claims: \"3D preview\", never \"3D model\"; README 3D limits line (flat colours)" },
  cut_limits: { en: "Concept plans, not permit drawings.", trace: "positioning: honest permit answer (short); spoken as s11_1 in the master" },
} as const satisfies Record<string, Line>;

/**
 * The second mistake in S1, by the finding code the pinned core reports for it. The bake asserts
 * the code; gate-facts asserts that this table has a row for it.
 */
export const SECOND_FINDING: Record<string, { en: string; spoken: string }> = {
  W_FURNITURE_OVER_WINDOW: {
    en: "And a wardrobe in front of a window.",
    spoken: "And this wardrobe stands in front of the window.",
  },
};

/**
 * S1's ring badges: a 3–5 word plain label beside the code `lint --json` gives, by code. gate-facts
 * asserts a row for every ringed finding.
 */
export const FINDING_LABEL: Record<string, { en: string }> = {
  W_ROOM_DISCONNECTED: { en: "Bedroom has no door" },
  W_ROOM_UNREACHABLE: { en: "Bedroom cannot be reached" },
  W_FURNITURE_OVER_WINDOW: { en: "Wardrobe blocks the window" },
};

/**
 * Cues whose words the screen already carries, so the film shows them once: the end card's call to
 * action (SCREEN.s11_cta1) says what s11_2 says, and its tagline (SCREEN.s11_tag) what s11_3 says. The voice still speaks them and the .srt files keep
 * them; only the burned-in subtitle is left out.
 */
export const SHOWN_ON_SCREEN: Record<string, keyof typeof SCREEN> = { s11_2: "s11_cta1", s11_3: "s11_tag" };

export type ScreenKey = keyof typeof SCREEN;

/** Every spoken line, scenes in order. */
export function allSpoken(): Array<Spoken & { scene: SceneId }> {
  return (Object.keys(NARRATION) as SceneId[]).flatMap((id) => NARRATION[id].map((l) => ({ ...l, scene: id })));
}

/** Read a dotted slot from the facts, with the S1 description slots resolved through SECOND_FINDING. */
export function slot(facts: Record<string, unknown>, path: string): string | undefined {
  const m = /^broken\.second_(en|spoken)$/.exec(path);
  if (m) {
    const code = (facts.broken as { second_code?: string } | undefined)?.second_code;
    const row = code ? SECOND_FINDING[code] : undefined;
    return row ? row[m[1] as "en" | "spoken"] : undefined;
  }
  let v: unknown = facts;
  for (const k of path.split(".")) {
    if (v === null || typeof v !== "object") return undefined;
    v = (v as Record<string, unknown>)[k];
  }
  return typeof v === "number" || typeof v === "string" ? String(v) : undefined;
}

/** Fill every `{slot}`; an unknown slot stays visible as `{slot}` so the gate catches it. */
export function fill(text: string, facts: Record<string, unknown>): string {
  return text.replace(/\{([a-z0-9_.]+)\}/g, (m, p: string) => slot(facts, p) ?? m);
}

/** What the voice says. */
export function spokenText(l: Spoken, facts: Record<string, unknown>): string {
  return fill(l.en, facts);
}

/** The subtitle of a spoken line: its words as spoken, unless `en_sub` writes them differently; a spoken `{x_spoken}` slot stays spoken. */
export function subtitle(l: Spoken, facts: Record<string, unknown>): string {
  return fill(l.en_sub ?? l.en, facts);
}
