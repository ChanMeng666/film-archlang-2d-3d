import React from "react";
import { interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import type { AudioIndex } from "./data";
import { cue, CUT, TL, vo } from "./data";
import { S5_BEATS } from "./s5-state";
import { cueOf, FPS, s5Speed, s7Parts } from "./timings";

/**
 * Levels (linear). The voice leads; the music ducks about 10 dB under speech with 150 ms ramps
 * (docs/narration.md § Generation). Measured, never yet heard: see docs/production-log.md.
 */
export const MIX = { voice: 1.0, music: 0.5, duck: 0.316, whoosh: 0.35, tap: 0.45, click: 0.3, slide: 0.25 };
const RAMP = Math.round(0.15 * FPS);

const S = TL.start;
const s9 = TL.s9;
const parts = s7Parts(TL);

/** Where each effect lands, in master frames, and which fetched file plays there. */
export const CUES: Array<{ at: number; id: string; vol: keyof typeof MIX; why: string }> = [
  { at: S.S0 + cue("S0", "s0_3").from - 4, id: "mixkit-sfx-1486", vol: "whoosh", why: "S0 the plan tilts into 3D" },
  { at: S.S1 + cue("S1", "s1_2").from + 30, id: "kenney-interface-select_001", vol: "click", why: "S1 rings appear" },
  { at: S.S3 + 24, id: "kenney-interface-select_001", vol: "click", why: "S3 room card" },
  { at: S.S5 + 40, id: "kenney-interface-click_001", vol: "click", why: "S5 first finding" },
  { at: S.S5 + 180, id: "kenney-interface-click_001", vol: "click", why: "S5 second finding" },
  { at: S.S5 + 276, id: "kenney-interface-confirmation_001", vol: "click", why: "S5 0 findings" },
  { at: S.S6 + 112, id: "kenney-impact-impactWood_light_001", vol: "tap", why: "S6 furniture lands" },
  { at: S.S6 + 124, id: "kenney-impact-impactWood_light_003", vol: "tap", why: "S6 furniture lands" },
  { at: S.S6 + 136, id: "kenney-impact-impactSoft_medium_001", vol: "tap", why: "S6 furniture lands" },
  { at: S.S7 + Math.round(parts.furnished[1] * 0.55) - 10, id: "mixkit-sfx-1528", vol: "slide", why: "S7 walls rise (replay PHASE.rise)" },
  { at: S.S8 + 6, id: "mixkit-sfx-2408", vol: "whoosh", why: "S8 cards fan out" },
  { at: S.S9 + s9.micClick, id: "kenney-interface-click_001", vol: "click", why: "S9 mic clicked" },
  { at: S.S9 + s9.sessionAt + 8, id: "kenney-interface-select_001", vol: "click", why: "S9 tool call allowed" },
  { at: S.S9 + s9.openAt, id: "kenney-interface-click_001", vol: "click", why: "S9 plan opened" },
  { at: S.S11 + cue("S11", "s11_2").from - 6, id: "mixkit-sfx-2903", vol: "whoosh", why: "S11 end card" },
];

/** Every stretch of master time where a voice speaks: the narration segments and the S9 brief. */
export const SPEECH: Array<[number, number]> = [
  ...TL.scenes.flatMap((s) => s.segments.map((g) => [S[s.id] + g.at, S[s.id] + g.at + Math.round((g.to - g.from) * FPS)] as [number, number])),
  ...(vo.brief ? [[S.S9 + s9.briefAt, S.S9 + s9.briefEnd] as [number, number]] : []),
];

/** 1 in the clear, `MIX.duck` under speech, with RAMP-frame slopes either side. */
export function duckAt(frame: number): number {
  let g = 1;
  for (const [a, b] of SPEECH) {
    const inside = interpolate(frame, [a - RAMP, a, b, b + RAMP], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    g = Math.min(g, 1 - inside * (1 - MIX.duck));
  }
  return g;
}

export const MUSIC_ID = "mixkit-587";

export const Mix: React.FC<{ audio: AudioIndex | null }> = ({ audio }) => {
  const frame = useCurrentFrame();
  const music = audio?.files[MUSIC_ID];
  // The track is 144 s; the film is longer, so the bed loops once from the start of its build.
  const fade = interpolate(frame, [0, 20, TL.total - 75, TL.total - 5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const musicVol = MIX.music * fade * duckAt(frame);
  return (
    <>
      {music ? <Audio src={staticFile(music)} volume={musicVol} loop durationInFrames={TL.total} /> : null}
      {TL.scenes.flatMap((s) => {
        const v = vo.scenes[s.id];
        if (!v) return [];
        return s.segments.map((g, i) => (
          <Sequence key={`${s.id}-${i}`} from={S[s.id] + g.at} durationInFrames={Math.ceil((g.to - g.from) * FPS) + 2} layout="none">
            <Audio src={staticFile(v.file)} volume={MIX.voice} trimBefore={Math.round(g.from * FPS)} />
          </Sequence>
        ));
      })}
      {vo.brief ? (
        <Sequence from={S.S9 + s9.briefAt} durationInFrames={s9.briefEnd - s9.briefAt + 6} layout="none">
          <Audio src={staticFile(vo.brief.file)} volume={MIX.voice} />
        </Sequence>
      ) : null}
      {audio
        ? CUES.map((c, i) =>
            audio.files[c.id] ? (
              <Sequence key={i} from={c.at} durationInFrames={150} layout="none">
                <Audio src={staticFile(audio.files[c.id])} volume={MIX[c.vol]} />
              </Sequence>
            ) : null,
          )
        : null}
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// F8: the 30 s cuts' mix. The same bed, levels, ducking and fades as the master; the voice is the
// cut's Segments of the master's cached files; the effects land on the cut's own beats.

const CS = CUT.start;
const cutS5Speed = s5Speed(CUT.scenes.find((s) => s.id === "S5")?.dur ?? 1);

/** Where each effect lands in the cut, in cut frames. */
export const CUT_CUES: Array<{ at: number; id: string; vol: keyof typeof MIX; why: string }> = [
  { at: CS.S0 + cueOf(CUT, "S0", "s0_3").from - 4, id: "mixkit-sfx-1486", vol: "whoosh", why: "S0 the plan tilts into 3D" },
  { at: CS.S5 + Math.round(S5_BEATS.SELECT_1 / cutS5Speed), id: "kenney-interface-click_001", vol: "click", why: "S5 first finding" },
  { at: CS.S5 + Math.round(S5_BEATS.SELECT_2 / cutS5Speed), id: "kenney-interface-click_001", vol: "click", why: "S5 second finding" },
  { at: CS.S5 + Math.round(276 / cutS5Speed), id: "kenney-interface-confirmation_001", vol: "click", why: "S5 0 findings" },
  { at: CS.S7 + 24, id: "mixkit-sfx-1528", vol: "slide", why: "S7 walls rise (the replay entered at timings S7_CUT_TRIM)" },
  { at: CS.S11 + cueOf(CUT, "S11", "s11_2").from - 6, id: "mixkit-sfx-2903", vol: "whoosh", why: "S11 end card" },
];

/** Every stretch of the cut where the voice speaks. */
export const CUT_SPEECH: Array<[number, number]> = CUT.scenes.flatMap((s) =>
  s.segments.map((g) => [CS[s.id] + g.at, CS[s.id] + g.at + Math.round((g.to - g.from) * FPS)] as [number, number]),
);

/** `duckAt` over the cut's speech. */
export function cutDuckAt(frame: number): number {
  let g = 1;
  for (const [a, b] of CUT_SPEECH) {
    const inside = interpolate(frame, [a - RAMP, a, b, b + RAMP], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    g = Math.min(g, 1 - inside * (1 - MIX.duck));
  }
  return g;
}

export const CutMix: React.FC<{ audio: AudioIndex | null }> = ({ audio }) => {
  const frame = useCurrentFrame();
  const music = audio?.files[MUSIC_ID];
  const fade = interpolate(frame, [0, 20, CUT.total - 75, CUT.total - 5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const musicVol = MIX.music * fade * cutDuckAt(frame);
  return (
    <>
      {music ? <Audio src={staticFile(music)} volume={musicVol} durationInFrames={CUT.total} /> : null}
      {CUT.scenes.flatMap((s) => {
        const v = vo.scenes[s.id];
        if (!v) return [];
        return s.segments.map((g, i) => (
          <Sequence key={`${s.id}-${i}`} from={CS[s.id] + g.at} durationInFrames={Math.ceil((g.to - g.from) * FPS)} layout="none">
            <Audio src={staticFile(v.file)} volume={MIX.voice} trimBefore={Math.round(g.from * FPS)} />
          </Sequence>
        ));
      })}
      {audio
        ? CUT_CUES.map((c, i) =>
            audio.files[c.id] ? (
              <Sequence key={i} from={c.at} durationInFrames={Math.min(150, CUT.total - c.at)} layout="none">
                <Audio src={staticFile(audio.files[c.id])} volume={MIX[c.vol]} />
              </Sequence>
            ) : null,
          )
        : null}
    </>
  );
};
