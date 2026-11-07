import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Source } from "../components/Source";
import { cue, layout } from "../data";
import { C, FONT, ease, ramp } from "../theme";

const SRC = { x: 50, y: 40, w: 760, h: 820 };
const PLAN = { x: 850, y: 40, w: 1020, h: 720 };
const FONT_SIZE = 16;

/**
 * S4 Change one number: LIVING sweeps from its written value to +30 % in grid steps; each step is
 * its own compiled SVG, drawn at one fixed scale so what moved is what the compiler moved. The
 * source shows the one token that changes; the net area is describe's, step by step.
 */
export const S4: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = layout.sweep.frames;
  const sweepEnd = cue("S4", "s4_1").to - 10;
  const t = interpolate(frame, [60, sweepEnd], [0, frames.length - 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const cur = frames[Math.round(t)];
  // One scale for every step: fitted to the union of all viewBoxes.
  const x0 = Math.min(...frames.map((f) => f.viewBox.x));
  const y0 = Math.min(...frames.map((f) => f.viewBox.y));
  const x1 = Math.max(...frames.map((f) => f.viewBox.x + f.viewBox.w));
  const y1 = Math.max(...frames.map((f) => f.viewBox.y + f.viewBox.h));
  const k = Math.min(PLAN.w / (x1 - x0), PLAN.h / (y1 - y0));
  const vb = cur.viewBox;
  const src = layout.knob.source.replace(`let LIVING = ${layout.sweep.from}`, `let LIVING = ${cur.value}`);
  const line = layout.sweep.letLine;
  const tokenLen = String(cur.value).length;
  const I = cue("S4", "s4_2").from;
  const impactIn = ramp(frame, I, I + 18);
  return (
    <AbsoluteFill style={{ background: C.sheet, opacity: ramp(frame, 0, 14) }}>
      <Source
        text={src}
        {...SRC}
        fontSize={FONT_SIZE}
        scrollLine={6}
        highlight={[{ line, opacity: ramp(frame, 30, 50) }]}
        token={{ line, col: layout.sweep.tokenCol, len: tokenLen, opacity: ramp(frame, 40, 56) }}
      />
      <div style={{ position: "absolute", left: PLAN.x, top: PLAN.y, width: PLAN.w, height: PLAN.h, background: "#fff", borderRadius: 12, overflow: "hidden" }}>
        <Img
          src={staticFile(cur.file)}
          style={{ position: "absolute", left: (vb.x - x0) * k, top: (vb.y - y0) * k, width: vb.w * k, height: vb.h * k }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: PLAN.x,
          top: PLAN.y + PLAN.h + 18,
          display: "flex",
          gap: 28,
          fontFamily: FONT.mono,
          fontSize: 30,
          color: C.ink,
        }}
      >
        <span style={{ padding: "6px 16px", borderRadius: 10, border: `2px solid ${C.plum}`, background: "#fff" }}>
          LIVING = {cur.value}
        </span>
        <span style={{ padding: "6px 16px", borderRadius: 10, border: `1px solid ${C.rule}`, background: "#fff" }}>
          {cur.net_m2} m² (net)
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: SRC.x + 30,
          top: 560,
          width: SRC.w - 60,
          padding: "20px 26px",
          borderRadius: 14,
          background: "#16191f",
          color: "#e8e4da",
          fontFamily: FONT.mono,
          fontSize: 24,
          lineHeight: 1.6,
          opacity: impactIn,
          whiteSpace: "pre",
        }}
      >
        {`$ archlang impact knob-flat.arch --set LIVING=${layout.sweep.to}\n` + layout.sweep.impactSummary.join("\n")}
      </div>
    </AbsoluteFill>
  );
};
