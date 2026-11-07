import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { SCREEN } from "../copy";
import { Chip } from "../components/Chip";
import { CaptureVideo } from "../components/Media";
import { TL, type Captures } from "../data";
import { S7_CUT_TRIM, s7Parts, type Aspect } from "../timings";
import { C, FONT, V, ramp } from "../theme";

/** From the voice (timings.ts s7Parts): each capture fills its stretch of the scene. */
export const S7_PARTS = s7Parts(TL);
const END = TL.scenes.find((s) => s.id === "S7")!.dur;

/**
 * S7 Into 3D: the official `archlang3d view --replay --video` of furnished-flat.arch, then of
 * two-storey.arch (storeys rise lifted clear, then settle), then a slow turn of the finished
 * preview in the replay's own viewer. Nothing is added to the scene but the camera.
 */
export const S7: React.FC<{ captures: Captures | null; cut?: boolean; aspect?: Aspect }> = ({ captures, cut, aspect }) => {
  const frame = useCurrentFrame();
  const r = captures?.replays ?? {};
  if (cut) {
    const vert = aspect === "9x16";
    return (
      <AbsoluteFill style={{ background: C.sheet }}>
        <AbsoluteFill style={{ opacity: ramp(frame, 0, 10) }}>
          <CaptureVideo file={r["furnished-flat"]?.file} viewer vertical={vert} trimBefore={S7_CUT_TRIM} what="archlang3d view furnished-flat --replay --video" />
        </AbsoluteFill>
        <Chip text={SCREEN.s7_label.en} left={vert ? V.left : 40} top={vert ? V.top + 10 : 34} fontSize={vert ? 26 : 24} opacity={ramp(frame, 6, 18)} />
        <Chip text={SCREEN.cut_3d.en} left={vert ? V.left : 40} top={vert ? V.top + 72 : 90} fontSize={vert ? 30 : 24} opacity={ramp(frame, 6, 18)} plum />
      </AbsoluteFill>
    );
  }
  const part = (a: number, b: number) => ramp(frame, a, a + 12) * (b >= END ? 1 : 1 - ramp(frame, b, b + 12));
  return (
    <AbsoluteFill style={{ background: C.sheet }}>
      <Sequence from={S7_PARTS.furnished[0]} durationInFrames={S7_PARTS.furnished[1] + 12} layout="none">
        <AbsoluteFill style={{ opacity: part(...S7_PARTS.furnished) }}>
          <CaptureVideo file={r["furnished-flat"]?.file} viewer what="archlang3d view furnished-flat --replay --video" />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={S7_PARTS.twoStorey[0]} durationInFrames={S7_PARTS.twoStorey[1] - S7_PARTS.twoStorey[0] + 12} layout="none">
        <AbsoluteFill style={{ opacity: part(...S7_PARTS.twoStorey) }}>
          <CaptureVideo file={r["two-storey"]?.file} viewer what="archlang3d view two-storey --replay --video" />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={S7_PARTS.orbit[0]} layout="none">
        <AbsoluteFill style={{ opacity: part(...S7_PARTS.orbit) }}>
          <CaptureVideo file={captures?.orbit?.file} viewer what="orbit of furnished-flat in the replay viewer" />
        </AbsoluteFill>
      </Sequence>
      {captures?.playground["s7-switch"] ? (
        // The playground's own Plan | 3D switch on the same file (a screen capture of the live site),
        // over the replay's opening, which shows the plan being drawn.
        <Sequence from={0} durationInFrames={110} layout="none">
          <AbsoluteFill style={{ opacity: 1 - ramp(frame, 96, 108) }}>
            <CaptureVideo file={captures.playground["s7-switch"].file} what="playground Plan | 3D switch" fitBg={C.sheet} />
          </AbsoluteFill>
        </Sequence>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 34,
          padding: "8px 18px",
          borderRadius: 10,
          background: "rgba(17,17,17,0.78)",
          color: "#f5f2ea",
          fontFamily: FONT.mono,
          fontSize: 24,
          opacity: ramp(frame, 8, 20),
        }}
      >
        {SCREEN.s7_label.en}
      </div>
    </AbsoluteFill>
  );
};
