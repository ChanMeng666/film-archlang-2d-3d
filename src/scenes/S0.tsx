import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { SCREEN, fill } from "../copy";
import { Chip } from "../components/Chip";
import { CaptureVideo } from "../components/Media";
import { PlanSvg } from "../components/Svg";
import { Source } from "../components/Source";
import { facts, layout, useCue, type Captures } from "../data";
import type { Aspect } from "../timings";
import { C, FONT, STAGE_H, V, ramp } from "../theme";

/**
 * S0 Cold open: brief → source → the compiled plan draws by layer → the official replay rises.
 * `cut` (the 30 s cuts) opens straight on the source, with no brief, and labels the 3D "preview";
 * `aspect` "9x16" lays the same beats out for the vertical frame.
 */
export const S0: React.FC<{ captures: Captures | null; cut?: boolean; aspect?: Aspect }> = ({ captures, cut, aspect }) => {
  const frame = useCurrentFrame();
  const prompt = fill(SCREEN.s0_prompt.en, facts);
  const typed = prompt.slice(0, Math.round(ramp(frame, 2, 36) * prompt.length));
  const src = layout.knob.source;
  const nLines = src.split("\n").length;
  // The plan draws itself: walls, then openings, then fixtures, then dimensions and text.
  // Beats from the voice: the plan draws on "Compile it…", the replay rises on "Then the same file…".
  const P = useCue("S0", "s0_2").from;
  const R = useCue("S0", "s0_3").from;
  const vert = aspect === "9x16";
  // Where the source panel starts and when it starts to scroll: after the brief, or at once in a cut.
  const srcFrom = cut ? 0 : 40;
  const scrollFrom = cut ? 0 : 42;
  const src16 = { x: 260, y: 60, w: 1400, h: STAGE_H - 60, rows: 26 };
  const srcBox = vert ? { x: V.left, y: V.top, w: V.W - 2 * V.left, h: V.stageBottom - V.top, rows: 32 } : src16;
  const card = vert
    ? { left: V.left, top: V.top, width: V.W - 2 * V.left, height: V.stageBottom - V.top }
    : { left: 420, top: 24, width: 1080, height: STAGE_H - 44 };
  const planBox = vert
    ? { left: V.left + 20, top: V.top + 20, width: V.W - 2 * V.left - 40, height: V.stageBottom - V.top - 40 }
    : { left: 440, top: 34, width: 1040, height: STAGE_H - 64 };
  const L = (a: number, b: number) => ramp(frame, P + a, P + b);
  const layers = {
    "A-FLOR": L(0, 12),
    "A-WALL": L(2, 18),
    "A-DOOR": L(20, 32),
    "A-GLAZ": L(20, 32),
    "A-FURN": L(34, 48),
    "A-ANNO-DIMS": L(50, 64),
    "A-ANNO-TEXT": L(50, 64),
    "A-ANNO": L(50, 64),
  };
  const replay = captures?.replays["knob-flat"];
  // Enter the replay where its drawing is fully over the footprints (PHASE.svgIn = 0.5).
  const replayTrim = replay ? Math.round(replay.frames * 0.5) : 0;
  return (
    <AbsoluteFill style={{ background: C.void }}>
      {!cut && frame < 44 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - ramp(frame, 38, 44) }}>
          <div
            style={{
              width: 1300,
              minHeight: 120,
              padding: "30px 40px",
              borderRadius: 18,
              background: "#1a1d24",
              border: "1px solid #2c313b",
              color: "#f5f2ea",
              fontFamily: FONT.sans,
              fontSize: 44,
              lineHeight: 1.35,
            }}
          >
            {typed}
            <span style={{ display: "inline-block", width: 4, height: 46, marginLeft: 4, background: C.plum, verticalAlign: "middle" }} />
          </div>
        </AbsoluteFill>
      ) : null}
      {frame >= srcFrom && frame < P + 8 ? (
        <Source
          text={src}
          x={srcBox.x}
          y={srcBox.y}
          w={srcBox.w}
          h={srcBox.h}
          fontSize={22}
          dark
          scrollLine={ramp(frame, scrollFrom, P + 6) * (nLines - srcBox.rows)}
        />
      ) : null}
      {frame >= P - 8 && frame < R + 20 ? (
        <AbsoluteFill style={{ opacity: ramp(frame, P - 8, P) * (1 - ramp(frame, R + 4, R + 16)) }}>
          {/* Above the subtitle band (theme SAFE_BOTTOM): the plan's title block and scale bar stay clear. */}
          <div style={{ position: "absolute", ...card, background: "#ffffff", borderRadius: 10 }} />
          <PlanSvg src={layout.knob.svg} prefix="s0" layers={layers} style={planBox} />
        </AbsoluteFill>
      ) : null}
      <Sequence from={R - 4} layout="none">
        <AbsoluteFill style={{ opacity: ramp(frame, R - 4, R + 10) }}>
          <CaptureVideo file={replay?.file} viewer vertical={vert} what="archlang3d view knob-flat --replay --video" trimBefore={replayTrim} />
        </AbsoluteFill>
      </Sequence>
      {cut ? <Chip text={SCREEN.cut_3d.en} left={vert ? V.left : 40} top={vert ? V.top + 10 : 34} fontSize={vert ? 30 : 24} opacity={ramp(frame, R + 6, R + 18)} plum /> : null}
    </AbsoluteFill>
  );
};
