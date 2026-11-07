import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SCREEN } from "../copy";
import { PlanSvg, planToPx } from "../components/Svg";
import { cue, facts, layout } from "../data";
import { C, FONT, ease, ramp } from "../theme";

const PLAN = { x: 120, y: 40, w: 1000, h: 760 }; // its facts chip ends above the subtitle band
const m = (mm: number) => (mm / 1000).toFixed(mm % 100 === 0 ? 1 : 2);

/**
 * S3 Exact numbers: the living room's facts (the playground's room card fields, from describe),
 * the facts line, then the sheet's room schedule with its NET AREA column (zoomed, not redrawn).
 */
export const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const map = planToPx(layout.knob.viewBox, PLAN);
  const card = layout.knob.roomCard;
  const live = map.box(card.box);
  const cardIn = ramp(frame, 24, 40);
  const F = cue("S3", "s3_2").from;
  const Z = cue("S3", "s3_3").from;
  const factsIn = ramp(frame, F, F + 14);
  const toSheet = ramp(frame, Z - 4, Z + 14);
  const full = layout.knob.sheetViewBox;
  const tgt = layout.knob.scheduleBox;
  // The zoom keeps the frame's 16:9-ish aspect around the schedule.
  const aspect = 1680 / 820;
  const zw = Math.max(tgt.w, tgt.h * aspect) * 1.08;
  const zoomH = zw / aspect;
  const z = { x: tgt.x + tgt.w / 2 - zw / 2, y: tgt.y + tgt.h / 2 - zoomH / 2, w: zw, h: zoomH };
  const t = interpolate(frame, [Z + 20, Z + 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const vb = {
    x: full.x + (z.x - full.x) * t,
    y: full.y + (z.y - full.y) * t,
    w: full.w + (z.w - full.w) * t,
    h: full.h + (z.h - full.h) * t,
  };
  const S = (k: keyof typeof SCREEN) => SCREEN[k].en;
  // Both bases, each labelled (describe's net_area_m2 and area_m2): the plan's own stamp in the room
  // is the centre-line figure, so the card names it beside the net one.
  const area = (
    <>
      <div>{`${card.area_net_m2} m² ${S("s3_net")}`}</div>
      <div style={{ fontSize: 24, lineHeight: 1.35, fontWeight: 500, color: C.ink, marginBottom: 6 }}>{`${card.area_centreline_m2} m² ${S("s3_centre")}`}</div>
    </>
  );
  const rows: Array<[string, React.ReactNode]> = [
    [S("s3_card_area"), area],
    [S("s3_card_size"), `${m(card.size_mm.w)} × ${m(card.size_mm.h)} m`],
    [S("s3_card_use"), card.use],
    [S("s3_card_neighbours"), card.neighbours.join(", ")],
    [S("s3_card_openings"), `${card.doors} · ${card.windows}`],
  ];
  return (
    <AbsoluteFill style={{ background: C.sheet }}>
      <AbsoluteFill style={{ opacity: 1 - toSheet }}>
        <div style={{ position: "absolute", left: PLAN.x, top: PLAN.y, width: PLAN.w, height: PLAN.h, background: "#fff", borderRadius: 12 }} />
        <PlanSvg src={layout.knob.svg} prefix="s3" style={{ left: PLAN.x, top: PLAN.y, width: PLAN.w, height: PLAN.h }} />
        <div
          style={{
            position: "absolute",
            left: live.x,
            top: live.y,
            width: live.w,
            height: live.h,
            border: `5px solid ${C.plum}`,
            borderRadius: 6,
            background: "rgba(128,82,255,0.06)",
            opacity: cardIn,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 1180,
            top: 120,
            width: 680,
            padding: "28px 34px",
            background: C.card,
            borderRadius: 16,
            border: `2px solid ${C.plum}`,
            boxShadow: "0 8px 40px rgba(17,17,17,0.10)",
            opacity: cardIn,
            transform: `translateX(${(1 - cardIn) * 30}px)`,
            fontFamily: FONT.sans,
            color: C.ink,
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 18 }}>{card.name}</div>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "flex", fontSize: 30, lineHeight: 1.6, borderTop: `1px solid ${C.rule}` }}>
              <div style={{ width: 250, flexShrink: 0, color: C.muted }}>{k}</div>
              <div style={{ flex: 1, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: PLAN.x,
            top: PLAN.y + PLAN.h + 16,
            fontFamily: FONT.sans,
            fontSize: 30,
            color: C.ink,
            opacity: factsIn,
            padding: "8px 18px",
            background: "#fff",
            borderRadius: 10,
            border: `1px solid ${C.rule}`,
          }}
        >
          {facts.knob.facts_line}
        </div>
      </AbsoluteFill>
      {frame >= Z - 4 ? (
        <AbsoluteFill style={{ opacity: toSheet }}>
          <div style={{ position: "absolute", left: 120, top: 40, width: 1680, height: 820, background: "#fff", borderRadius: 12 }} />
          <PlanSvg src={layout.knob.sheetSvg} prefix="s3s" viewBox={vb} style={{ left: 120, top: 40, width: 1680, height: 820 }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
