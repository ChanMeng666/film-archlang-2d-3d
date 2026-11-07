// Scene lengths and subtitle cues, in frames at 30 fps, derived from the voice
// (data/vo-timing.json, written by `npm run vo` from ElevenLabs' character timestamps).
// docs/narration.md: dur = max(visual minimum, spoken length + 0.6 s), with 0.25 s of air before
// the first word of each scene. Pure module: Remotion, srt.mjs and the gates all call buildTimeline.

import { NARRATION, type SceneId } from "./copy.ts";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Caption / subtitle fade, frames (docs/build-plan.md F4). */
export const CAPTION_FADE = 8;
const LEAD_S = 0.25;
const TAIL_S = 0.6;

export interface VoSentence {
  key: string;
  start: number;
  end: number;
}
export interface VoScene {
  file: string;
  duration: number;
  chars: number;
  hash: string;
  sentences: VoSentence[];
}
export interface VoBrief {
  file: string;
  duration: number;
  chars: number;
  hash: string;
  words: Array<{ word: string; start: number; end: number }>;
}
export interface VoTiming {
  scenes: Partial<Record<SceneId, VoScene>>;
  brief?: VoBrief;
}

export interface Cue {
  key: string;
  from: number;
  to: number;
}
/** A stretch of a scene's voice file, played from scene frame `at`. */
export interface Segment {
  at: number;
  from: number;
  to: number;
}
export interface SceneTiming {
  id: SceneId;
  title: string;
  dur: number;
  cues: Cue[];
  segments: Segment[];
  /** True when the voice has not been generated and the times are estimates. */
  estimated: boolean;
}
export interface S9Beats {
  micClick: number;
  briefAt: number;
  briefEnd: number;
  sessionAt: number;
  openAt: number;
  tilesAt: number;
}
export interface Timeline {
  scenes: SceneTiming[];
  start: Record<SceneId, number>;
  total: number;
  s9: S9Beats;
  briefWords: Array<{ word: string; from: number; to: number }>;
}

const TITLES: Record<SceneId, string> = {
  S0: "Cold open",
  S1: "The problem",
  S2: "What ArchLang is",
  S3: "Exact numbers",
  S4: "Change one number",
  S5: "It checks itself",
  S6: "Finish the sheet, pick a look",
  S7: "Into 3D",
  S8: "Take it anywhere",
  S9: "Use it inside your AI",
  S10: "Gallery",
  S11: "Honest line + end card",
};

/** What each scene's picture needs at least, frames. */
const VISUAL_MIN: Record<SceneId, number> = {
  S0: 210,
  S1: 300,
  S2: 450,
  S3: 360,
  S4: 360,
  S5: 420,
  S6: 360,
  S7: 600,
  S8: 240,
  S9: 690,
  S10: 300,
  S11: 240,
};

/** Air before the first word: 0.25 s, except S0, whose voice waits for the source to appear. */
const LEAD: Partial<Record<SceneId, number>> = { S0: 1.4 };

const f = (sec: number) => Math.round(sec * FPS);

/** Without a generated voice: an estimate at 2.6 words a second, flagged `estimated`. */
function estimate(id: SceneId): VoScene {
  let t = 0;
  const sentences = NARRATION[id].map((l) => {
    const words = l.en.split(/\s+/).length;
    const s = { key: l.key, start: t, end: t + words / 2.6 };
    t = s.end + 0.35;
    return s;
  });
  return { file: "", duration: t, chars: 0, hash: "", sentences };
}

/** Cues for sentences placed at scene frame `at` (the voice file's 0 s), held until the next one. */
function cuesFor(sentences: VoSentence[], at: number, dur: number): Cue[] {
  return sentences.map((s, i) => {
    const from = at + f(s.start);
    const next = sentences[i + 1];
    const to = Math.min(dur, next ? at + f(next.start) - 2 : at + f(s.end) + 18);
    return { key: s.key, from, to: Math.max(to, from + 15) };
  });
}

export function buildTimeline(vo: VoTiming | null): Timeline {
  const scenes: SceneTiming[] = [];
  let s9: S9Beats = { micClick: 0, briefAt: 0, briefEnd: 0, sessionAt: 0, openAt: 0, tilesAt: 0 };
  let briefWords: Timeline["briefWords"] = [];
  for (const id of Object.keys(NARRATION) as SceneId[]) {
    const v = vo?.scenes[id];
    const voice = v ?? estimate(id);
    const estimated = !v;
    if (id === "S9") {
      // docs/narration.md S9: mic click, the spoken brief, the session, then the narration; the
      // last line lands with the closing tiles.
      const brief = vo?.brief;
      const briefDur = brief?.duration ?? 5.2;
      const micClick = 24;
      const briefAt = 34;
      const briefEnd = briefAt + f(briefDur);
      const sessionAt = briefEnd + 12;
      const [a, b, c] = voice.sentences;
      const narrAt = briefEnd + f(0.5);
      const openAt = sessionAt + 240;
      const segA = { at: narrAt, from: Math.max(0, a.start - 0.05), to: b.end + 0.15 };
      const tilesAt = Math.max(openAt + 75, narrAt + f(b.end - segA.from) + f(0.4));
      const segC = { at: tilesAt + 12, from: Math.max(0, c.start - 0.05), to: Math.min(voice.duration, c.end + 0.25) };
      const dur = Math.max(VISUAL_MIN.S9, segC.at + f(segC.to - segC.from) + f(TAIL_S) + 30);
      const cues: Cue[] = [
        ...cuesFor([a, b], narrAt - f(segA.from), dur).map((cue, i) => (i === 1 ? { ...cue, to: Math.min(cue.to, tilesAt) } : cue)),
        ...cuesFor([c], segC.at - f(segC.from), dur),
      ];
      s9 = { micClick, briefAt, briefEnd, sessionAt, openAt, tilesAt };
      briefWords = (brief?.words ?? []).map((w) => ({ word: w.word, from: briefAt + f(w.start), to: briefAt + f(w.end) }));
      scenes.push({ id, title: TITLES[id], dur, cues, segments: [segA, segC], estimated });
      continue;
    }
    const lead = LEAD[id] ?? LEAD_S;
    const at = f(lead);
    const dur = Math.max(VISUAL_MIN[id], Math.ceil((lead + voice.duration + TAIL_S) * FPS));
    scenes.push({ id, title: TITLES[id], dur, cues: cuesFor(voice.sentences, at, dur), segments: [{ at, from: 0, to: voice.duration }], estimated });
  }
  const start = {} as Record<SceneId, number>;
  let t = 0;
  for (const s of scenes) {
    start[s.id] = t;
    t += s.dur;
  }
  return { scenes, start, total: t, s9, briefWords };
}

/** Every cue on the master timeline, in order. */
export function masterCues(tl: Timeline): Array<Cue & { scene: SceneId; start: number; end: number }> {
  return tl.scenes.flatMap((s) => s.cues.map((c) => ({ ...c, scene: s.id, start: tl.start[s.id] + c.from, end: tl.start[s.id] + c.to })));
}

/** A scene's cue by key (scene-relative frames). */
export function cueOf(tl: Timeline, scene: SceneId, key: string): Cue {
  const c = tl.scenes.find((s) => s.id === scene)?.cues.find((x) => x.key === key);
  if (!c) throw new Error(`no cue ${scene}/${key}`);
  return c;
}

/**
 * S7's three captures, from its voice: the furnished-flat replay until "Several storeys…", the
 * two-storey replay (6.2 s, its whole rise and settle), then the orbit to the end of the scene.
 */
export function s7Parts(tl: Timeline): { furnished: [number, number]; twoStorey: [number, number]; orbit: [number, number] } {
  const s7 = tl.scenes.find((s) => s.id === "S7")!;
  const storeys = cueOf(tl, "S7", "s7_4").from - 6;
  const twoEnd = Math.min(storeys + 186, s7.dur - 90);
  return { furnished: [0, storeys], twoStorey: [storeys, twoEnd], orbit: [twoEnd, s7.dur] };
}

// ---------------------------------------------------------------------------------------------
// F8: the 30 s cut (docs/creative-brief.md § Deliverables: S0 → S5 receipt → S7 → S11), built
// only from the master's cached voice files: whole sentences picked from data/vo-timing.json and
// played as Segments, never a new request and never a splice inside a sentence.

/** Cut frame sizes. The 9:16 cut is laid out again, never a crop of the 16:9 frame. */
export const VERTICAL = { width: 1080, height: 1920 } as const;
export type Aspect = "16x9" | "9x16";

/** Which sentences each scene of the cut speaks, and the air around them (seconds). */
export interface CutPick {
  id: SceneId;
  keys: string[];
  lead: number;
  tail: number;
}
/**
 * The 30 s line set: the cold open's three lines, the S5 receipt (code, line, fix), the S7 "built
 * from the plan" line and the S11 call to action and tagline (production log, F8). s5_2 is left out
 * so the cut stays inside 32 s; the honest lines are carried on screen (copy.ts SCREEN.cut_*).
 */
export const CUT30: CutPick[] = [
  { id: "S0", keys: ["s0_1", "s0_2", "s0_3"], lead: 0.3, tail: 0.1 },
  { id: "S5", keys: ["s5_1"], lead: 0.15, tail: 0 },
  { id: "S7", keys: ["s7_2"], lead: 0.1, tail: 0 },
  { id: "S11", keys: ["s11_2", "s11_3"], lead: 0.1, tail: 0.6 },
];

/**
 * Where a picked run of sentences is cut out of its voice file. The alignment's `end` runs on
 * through the pause to the next sentence's first character, so a boundary sits EDGE seconds before
 * it: inside the pause (gate-facts re-checks each edge with ffmpeg silencedetect). The file's own
 * start and end are used where the run starts or ends the file.
 */
export const CUT_EDGE_S = 0.15;
export function cutSegment(voice: VoScene, keys: string[]): { from: number; to: number } {
  const i0 = voice.sentences.findIndex((s) => s.key === keys[0]);
  const i1 = voice.sentences.findIndex((s) => s.key === keys[keys.length - 1]);
  if (i0 < 0 || i1 < i0 || i1 - i0 + 1 !== keys.length) throw new Error(`cut: ${keys.join(",")} is not a run of whole sentences`);
  keys.forEach((k, j) => {
    if (voice.sentences[i0 + j].key !== k) throw new Error(`cut: ${k} out of order`);
  });
  const from = i0 === 0 ? 0 : Math.max(0, voice.sentences[i0 - 1].end - CUT_EDGE_S);
  const to = i1 === voice.sentences.length - 1 ? voice.duration : Math.min(voice.duration, voice.sentences[i1].end - CUT_EDGE_S);
  return { from, to };
}

/** The cut's timeline: the same shape as the master's, scenes in cut order. */
export function buildCut(vo: VoTiming | null, picks: CutPick[] = CUT30): Timeline {
  const scenes: SceneTiming[] = [];
  for (const p of picks) {
    const v = vo?.scenes[p.id];
    const voice = v ?? estimate(p.id);
    const seg = cutSegment(voice, p.keys);
    const at = f(p.lead);
    const dur = Math.ceil((p.lead + (seg.to - seg.from) + p.tail) * FPS);
    const picked = voice.sentences.filter((s) => p.keys.includes(s.key));
    scenes.push({
      id: p.id,
      title: TITLES[p.id],
      dur,
      cues: cuesFor(picked, at - f(seg.from), dur),
      segments: [{ at, from: seg.from, to: seg.to }],
      estimated: !v,
    });
  }
  const start = {} as Record<SceneId, number>;
  let t = 0;
  for (const s of scenes) {
    start[s.id] = t;
    t += s.dur;
  }
  return { scenes, start, total: t, s9: { micClick: 0, briefAt: 0, briefEnd: 0, sessionAt: 0, openAt: 0, tilesAt: 0 }, briefWords: [] };
}

/**
 * S5 in the cut plays the master's beats faster, so its last beat (the "0 findings" pill) is held
 * S5_PILL_HOLD frames before the scene ends. 1 in the master.
 */
export const S5_LAST_BEAT = 290;
const S5_PILL_HOLD = 18;
export function s5Speed(dur: number): number {
  return (S5_LAST_BEAT + S5_PILL_HOLD) / dur;
}

/**
 * The cuts enter the furnished-flat replay (507 frames) at this frame: the finished plan on the
 * sheet, a second before it tilts and the walls rise; it then runs to its settled view.
 */
export const S7_CUT_TRIM = 275;
