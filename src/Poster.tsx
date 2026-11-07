import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from "remotion";
import { NARRATION, SCREEN } from "./copy";
import { C, FONT } from "./theme";

/** The replay's moment where the plan has tilted and the walls are rising (5.4 s of 7.9 s). */
export const POSTER_REPLAY_S = 5.4;
/** The replay's bottom rows hold the viewer's status text; the poster crops them off. */
const HUD_ROWS = 70;

const s0_3 = NARRATION.S0.find((l) => l.key === "s0_3")!.en;

/**
 * The poster (1920×1080) and, rendered at 2/3 scale, the thumbnail (1280×720): the official
 * archlang3d replay of the knob flat, half-risen from its plan into 3D, beside the end card's line.
 * Every word is existing, gated copy (s0_1, s0_3, s11_tag, s11_cta1, cut_3d); the picture is the real replay.
 */
export const Poster: React.FC = () => (
  <AbsoluteFill style={{ background: C.sheet }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1180, height: 1080, overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile("captures/replay-knob-flat.mp4")}
        startFrom={Math.round(POSTER_REPLAY_S * 30)}
        muted
        style={{ position: "absolute", left: -350, top: 70, width: 1920, height: 1080, clipPath: `inset(0 0 ${HUD_ROWS}px 0)` }}
      />
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 40,
          padding: "8px 16px",
          borderRadius: 8,
          background: C.plum,
          color: "#fff",
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 26,
        }}
      >
        {SCREEN.cut_3d.en}
      </div>
    </div>
    <div
      style={{
        position: "absolute",
        left: 1180,
        top: 0,
        width: 740,
        height: 1080,
        background: C.void,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 70px",
        boxSizing: "border-box",
        gap: 28,
      }}
    >
      <Img src={staticFile("baked/logo.svg")} style={{ width: 150, height: 150, filter: "invert(95%) sepia(6%) saturate(300%) hue-rotate(5deg)" }} />
      <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 84, lineHeight: 1.05, color: "#f5f2ea" }}>{SCREEN.s11_tag.en}</div>
      <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 40, lineHeight: 1.25, color: "#cfcac0" }}>
        {NARRATION.S0[0].en} {s0_3}
      </div>
      <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 34, color: "#f5f2ea" }}>{SCREEN.s11_cta1.en}</div>
    </div>
  </AbsoluteFill>
);
