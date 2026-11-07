import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FINDING_LABEL } from "../copy";
import { PlanSvg, planToPx } from "../components/Svg";
import { cue, layout, type Box } from "../data";
import { C, FONT, STAGE_H, ramp } from "../theme";

const CARD: Box = { x: 40, y: 20, w: 1840, h: STAGE_H - 40 };
const RED = "#d6261c";

const mix = (a: Box, b: Box, t: number): Box => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t });
const pad = (b: Box, px: number, py: number): Box => ({ x: b.x - px, y: b.y - py, w: b.w + 2 * px, h: b.h + 2 * py });

/**
 * S1 The problem: broken-flat.arch looks finished; then the review rings `arch preview --review`
 * draws (the playground's Checks overlay, lifted from the same review sheet) appear on it, and the
 * camera pushes in on each ring as the voice names it. Each ring gets a badge: the code from
 * `lint --json` (the review sheet's marks) and its plain label (src/copy.ts FINDING_LABEL).
 */
export const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const b = layout.broken;
  // The plan and its dimensions, without the title block and scale bar below them.
  const overview: Box = { x: b.viewBox.x, y: b.viewBox.y, w: b.viewBox.w, h: b.viewBox.h * 0.85 };
  const [m1, m2] = b.marks;
  const r1 = pad(m1.boxes[0], 900, 700);
  const r2 = pad(m2.boxes[0], 1600, 1300);
  // Beats from the voice: rings on "This bedroom has no door", then the wardrobe line, then "finds both".
  const at = cue("S1", "s1_2").from + 30;
  const c3 = cue("S1", "s1_3").from;
  const c4 = cue("S1", "s1_4").from;
  const rings = ramp(frame, at, at + 16);
  let vb = mix(overview, r1, ramp(frame, at + 4, at + 40));
  vb = mix(vb, r2, ramp(frame, c3 - 6, c3 + 30));
  vb = mix(vb, overview, ramp(frame, c4 - 6, c4 + 30));
  const map = planToPx(vb, CARD);
  // During a push-in only the ring in focus carries its badge, beside it; on the pull-back both
  // badges sit in the margins either side of the drawing, level with their rings.
  const back = ramp(frame, c4 + 18, c4 + 30);
  const badges = [
    { m: m1, show: ramp(frame, at + 24, at + 36) * (1 - ramp(frame, c3 - 6, c3 + 4)) + back, side: "left" as const },
    { m: m2, show: ramp(frame, c3 + 14, c3 + 26) * (1 - ramp(frame, c4 - 6, c4 + 4)) + back, side: "right" as const },
  ];
  const overviewPhase = frame >= c4 + 4;
  const drawing = map.box({ x: b.viewBox.x, y: b.viewBox.y, w: b.viewBox.w, h: overview.h });
  const hideTags = ".pg-checks-tags{display:none}";
  return (
    <AbsoluteFill style={{ background: C.sheet }}>
      <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, background: "#ffffff", borderRadius: 12, boxShadow: "0 4px 30px rgba(17,17,17,0.08)" }} />
      <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, overflow: "hidden", borderRadius: 12 }}>
        <PlanSvg src={b.svg} prefix="s1a" viewBox={vb} style={{ left: 0, top: 0, width: CARD.w, height: CARD.h, opacity: 1 - rings }} />
        <PlanSvg src={b.checksSvg} prefix="s1b" viewBox={vb} extraCss={hideTags} style={{ left: 0, top: 0, width: CARD.w, height: CARD.h, opacity: rings }} />
      </div>
      {badges.map(({ m, show, side }) => {
        if (show <= 0) return null;
        const box = map.box(m.boxes[0]);
        const label = FINDING_LABEL[m.code]?.en ?? m.code;
        const right = box.x + box.w + 28;
        const beside = right + 480 <= CARD.x + CARD.w ? { left: right } : { right: 1920 - (box.x - 28) };
        const pos = overviewPhase ? (side === "right" ? { left: drawing.x + drawing.w + 8 } : { right: 1920 - (drawing.x - 8) }) : beside;
        const top = Math.max(CARD.y + 16, Math.min(box.y, CARD.y + CARD.h - 130));
        return (
          <div
            key={m.code}
            style={{
              position: "absolute",
              top,
              ...pos,
              padding: "12px 20px",
              borderRadius: 12,
              background: "#ffffff",
              border: `3px solid ${RED}`,
              boxShadow: "0 6px 24px rgba(17,17,17,0.14)",
              opacity: Math.min(1, show),
              transform: `translateY(${(1 - show) * 12}px)`,
            }}
          >
            <div style={{ fontFamily: FONT.mono, fontSize: 21, fontWeight: 700, color: RED }}>{m.code}</div>
            <div style={{ fontFamily: FONT.sans, fontSize: 31, fontWeight: 700, color: C.ink, marginTop: 2, whiteSpace: "nowrap" }}>{label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
