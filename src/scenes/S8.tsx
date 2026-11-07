import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { SCREEN, fill } from "../copy";
import { ViewerStill } from "../components/Media";
import { cue, facts, layout, type Captures } from "../data";
import { C, FONT, ramp } from "../theme";

/**
 * S8 Take it anywhere: five cards, one per exported file of the finished plan. Each thumbnail is
 * rasterised from that file (SVG and DXF by resvg, PDF by pdftoppm, the PNG itself; the GLB by its
 * replay still from `npm run capture`).
 */
export const S8: React.FC<{ captures: Captures | null }> = ({ captures }) => {
  const frame = useCurrentFrame();
  const e = layout.exports;
  const cards: Array<{ k: string; label: string; img?: string; still?: boolean; sub?: string }> = [
    { k: "svg", label: "plan.svg", img: e.thumbs.svg },
    { k: "dxf", label: "plan.dxf", img: e.thumbs.dxf, sub: fill(SCREEN.s8_blocks.en, facts) },
    { k: "pdf", label: "plan.pdf", img: e.thumbs.pdf },
    { k: "png", label: "plan.png", img: e.thumbs.png },
    { k: "glb", label: "plan.glb", still: true },
  ];
  const W = 330;
  const H = 300;
  const gap = 28;
  const total = cards.length * W + (cards.length - 1) * gap;
  return (
    <AbsoluteFill style={{ background: C.sheet }}>
      {cards.map((c, i) => {
        const t = ramp(frame, 6 + i * 6, 40 + i * 6);
        const x0 = 960 - W / 2;
        const x1 = 960 - total / 2 + i * (W + gap);
        const rot = (i - 2) * 6 * (1 - t);
        const D = cue("S8", "s8_2").from;
        const focus = c.k === "dxf" ? ramp(frame, D, D + 20) : 0;
        return (
          <div
            key={c.k}
            style={{
              position: "absolute",
              left: x0 + (x1 - x0) * t,
              top: 190 - focus * 40,
              width: W,
              transform: `rotate(${rot}deg) scale(${1 + focus * 0.18})`,
              zIndex: c.k === "dxf" ? 2 : 1,
              background: "#fff",
              borderRadius: 16,
              border: `2px solid ${focus > 0.5 ? C.plum : C.rule}`,
              boxShadow: "0 8px 34px rgba(17,17,17,0.10)",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative", width: W, height: H, background: "#fff" }}>
              {c.still ? (
                <ViewerStill file={captures?.gallery["laneway-finished"]} what="GLB still" w={W} h={H} style={{ left: 0, top: 0 }} />
              ) : (
                <Img src={staticFile(c.img!)} style={{ position: "absolute", inset: 8, width: W - 16, height: H - 16, objectFit: "contain" }} />
              )}
            </div>
            <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.rule}`, fontFamily: FONT.mono, fontSize: 26, color: C.ink }}>
              {c.label}
              {c.sub ? (
                <div style={{ fontFamily: FONT.sans, fontSize: 18, color: C.muted, marginTop: 4 }}>{c.sub}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
