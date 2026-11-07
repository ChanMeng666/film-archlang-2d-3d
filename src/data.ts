// The bake's and the voice's outputs, as the scenes read them. Never typed: data/*.json come from
// `npm run bake` and `npm run vo`.
import factsJson from "../data/facts.json";
import layoutJson from "../data/layout.json";
import voJson from "../data/vo-timing.json";
import { createContext, useContext } from "react";
import { buildCut, buildTimeline, cueOf, type Timeline, type VoTiming } from "./timings";
import type { SceneId } from "./copy";

export const facts = factsJson as unknown as Record<string, unknown> & typeof factsJson;
export const layout = layoutJson;
export const vo = voJson as unknown as VoTiming;
/** Scene lengths and subtitle cues, from the voice. */
export const TL = buildTimeline(vo);
export const cue = (scene: SceneId, key: string) => cueOf(TL, scene, key);
/** The 30 s cut's timeline (F8), from the same voice files. */
export const CUT = buildCut(vo);

/**
 * The timeline a scene is playing in: the master's unless a cut provides its own. Scenes read their
 * cues through useTL / useCue, so one scene component serves the master and the cuts.
 */
export const TimelineContext = createContext<Timeline>(TL);
export const useTL = () => useContext(TimelineContext);
export function useCue(scene: SceneId, key: string) {
  return cueOf(useTL(), scene, key);
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What `npm run capture` produced (public/captures/index.json), or null before it has run. */
export interface Captures {
  replays: Record<string, { file: string; seconds: number; fps: number; frames: number }>;
  orbit?: { file: string; seconds: number; fps: number; frames: number };
  gallery: Record<string, string>;
  playground: Record<string, { file: string; seconds: number }>;
}

/** What `npm run audio` fetched (public/audio/index.json), or null before it has run. */
export interface AudioIndex {
  files: Record<string, string>;
}

export interface MasterProps {
  captures: Captures | null;
  audio: AudioIndex | null;
  [key: string]: unknown;
}
