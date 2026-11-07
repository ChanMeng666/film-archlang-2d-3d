import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { SCREEN } from "../copy";
import { PlanSvg } from "../components/Svg";
import { layout, useCue } from "../data";
import type { Aspect } from "../timings";
import { C, FONT, V, ramp } from "../theme";

/**
 * S11 The honest line, spoken over the finished sheet (its subtitle carries the words), then the end
 * card on Void as the voice gives the URL: the master logo (recoloured by CSS), the line, two calls
 * to action.
 */
export const S11: React.FC<{ cut?: boolean; aspect?: Aspect }> = ({ cut, aspect }) => {
  const frame = useCurrentFrame();
  const E = useCue("S11", "s11_2").from - 8;
  const T = useCue("S11", "s11_3").from;
  // A cut opens on the end card (its S11 speaks only the call to action and the line).
  const end = cut ? 1 : ramp(frame, E, E + 16);
  const vert = aspect === "9x16";
  // 9:16: the call to action on two lines ("Try it free:" / the URL), so it stays large on a phone.
  const cta = SCREEN.s11_cta1.en;
  const split = cta.indexOf(": ");
  const ctaLines = vert && split > 0 ? [cta.slice(0, split + 1), cta.slice(split + 2)] : [cta];
  return (
    <AbsoluteFill style={{ background: C.sheet }}>
      <AbsoluteFill style={{ opacity: ramp(frame, 0, 12) * (1 - end) }}>
        <div style={{ position: "absolute", left: 360, top: 40, width: 1200, height: 860, background: "#fff", borderRadius: 12 }} />
        <PlanSvg src={layout.knob.sheetSvg} prefix="s11" style={{ left: 370, top: 50, width: 1180, height: 840 }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: C.void,
          opacity: end,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          // 9:16: the column sits between V.left and V.right, clear of the right-edge buttons and the bottom 20 %.
          ...(vert ? { boxSizing: "border-box", padding: `${V.top}px ${V.W - V.right}px ${V.H - V.subBottom}px ${V.left}px` } : { paddingBottom: 80 }),
        }}
      >
        <Img
          src={staticFile("baked/logo.svg")}
          style={{ width: vert ? 260 : 220, height: vert ? 260 : 220, filter: "invert(95%) sepia(6%) saturate(300%) hue-rotate(5deg)", opacity: ramp(frame, E + 10, E + 26) }}
        />
        <div
          style={{
            marginTop: 20,
            fontFamily: FONT.sans,
            fontWeight: 700,
            fontSize: 72,
            color: "#f5f2ea",
            opacity: ramp(frame, E + 18, E + 34),
            transform: `scale(${1 + 0.04 * ramp(frame, T, T + 12)})`,
          }}
        >
          {SCREEN.s11_tag.en}
        </div>
        {/* The call to action, shown once: its subtitle (s11_2) is left out (copy.ts SHOWN_ON_SCREEN). */}
        {ctaLines.map((l, i) => (
          <div
            key={i}
            style={{
              marginTop: i === 0 ? (vert ? 48 : 34) : 4,
              fontFamily: FONT.sans,
              fontWeight: vert && i === 0 ? 500 : 700,
              fontSize: vert ? (i === 0 ? 48 : 60) : 50,
              color: "#ffffff",
              opacity: ramp(frame, E + 20, E + 30),
            }}
          >
            {l}
          </div>
        ))}
        <div
          style={{
            marginTop: 16,
            fontFamily: FONT.mono,
            fontSize: vert ? 38 : 34,
            color: "#ffffff",
            padding: "10px 24px",
            borderRadius: 12,
            border: `2px solid ${C.plum}`,
            opacity: ramp(frame, E + 34, E + 50),
          }}
        >
          {SCREEN.s11_cta2.en}
        </div>
        {cut ? (
          // The cuts' limits line (the master speaks it as s11_1): shown, not spoken.
          <div style={{ marginTop: vert ? 56 : 40, fontFamily: FONT.sans, fontWeight: 500, fontSize: vert ? 36 : 32, color: "#c9c4b8", opacity: ramp(frame, E + 40, E + 56) }}>
            {SCREEN.cut_limits.en}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
