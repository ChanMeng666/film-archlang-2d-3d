import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { PlanSvg } from "../components/Svg";
import { cue, layout } from "../data";
import { C, FONT, ramp } from "../theme";

const TERM = { x: 40, y: 40, w: 840, h: 820 };
const PLAN = { x: 910, y: 40, w: 970, h: 820 };

/**
 * S6 Finish the sheet, pick a look: `finish plan.arch` typed, the CLI's own change log scrolls,
 * the bare plan becomes the finished one; then the same plan in three named themes.
 */
export const S6: React.FC = () => {
  const frame = useCurrentFrame();
  const f = layout.finish;
  const cmd = "$ " + f.command;
  const typed = cmd.slice(0, Math.round(ramp(frame, 6, 50) * cmd.length));
  // The change-log lines ("added …") and the final ✓ line, revealed one by one.
  const log = f.terminal.filter((l) => /^\s*added\b|✓/.test(l));
  const shownN = Math.floor(ramp(frame, 60, 150) * log.length);
  const fin = ramp(frame, 96, 140);
  const themes = f.themes;
  // Three quick theme swaps on "Then pick a look."
  const T0 = cue("S6", "s6_2").from - 20;
  const tIn = (i: number) => ramp(frame, T0 + i * 32, T0 + 10 + i * 32);
  return (
    <AbsoluteFill style={{ background: C.sheet, opacity: ramp(frame, 0, 10) }}>
      <div
        style={{
          position: "absolute",
          left: TERM.x,
          top: TERM.y,
          width: TERM.w,
          height: TERM.h,
          background: "#16191f",
          borderRadius: 14,
          padding: "24px 26px",
          boxSizing: "border-box",
          fontFamily: FONT.mono,
          color: "#e8e4da",
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 18, whiteSpace: "pre-wrap" }}>{typed}</div>
        <div style={{ fontSize: 15.5, lineHeight: 1.55 }}>
          {log.slice(0, shownN).map((l, i) => (
            <div key={i} style={{ whiteSpace: "pre-wrap", color: /✓/.test(l) ? "#b9a3ff" : undefined }}>
              {l.trim().replace(/ — .*$/, "")}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: PLAN.x, top: PLAN.y, width: PLAN.w, height: PLAN.h, background: "#fff", borderRadius: 12 }} />
      <PlanSvg src={f.bareSvg} prefix="s6a" style={{ left: PLAN.x, top: PLAN.y, width: PLAN.w, height: PLAN.h, opacity: 1 - fin }} />
      {frame >= 96 ? (
        <PlanSvg
          src={f.finishedSvg}
          prefix="s6b"
          style={{ left: PLAN.x, top: PLAN.y, width: PLAN.w, height: PLAN.h, opacity: fin }}
          layers={{ "A-FURN": ramp(frame, 110, 150), "A-ANNO": ramp(frame, 130, 170) }}
        />
      ) : null}
      {themes.map((t, i) =>
        frame >= T0 + i * 32 ? (
          <React.Fragment key={t.name}>
            <PlanSvg src={t.svg} prefix={`s6t${i}`} style={{ left: PLAN.x, top: PLAN.y, width: PLAN.w, height: PLAN.h, opacity: tIn(i) }} />
            <div
              style={{
                position: "absolute",
                left: PLAN.x + 24,
                top: PLAN.y + PLAN.h - 70,
                padding: "6px 16px",
                borderRadius: 10,
                background: "#16191f",
                color: "#e8e4da",
                fontFamily: FONT.mono,
                fontSize: 26,
                opacity: tIn(i) * (i === themes.length - 1 ? 1 : 1 - tIn(i + 1)),
              }}
            >
              theme {t.name}
            </div>
          </React.Fragment>
        ) : null,
      )}
    </AbsoluteFill>
  );
};
