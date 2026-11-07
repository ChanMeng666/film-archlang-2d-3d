import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { PlanSvg, planToPx } from "../components/Svg";
import { Source } from "../components/Source";
import { cue, layout } from "../data";
import { C, ramp, window } from "../theme";

const SRC = { x: 50, y: 40, w: 880, h: 860 };
const PLAN = { x: 990, y: 40, w: 880, h: 860 };
const FONT_SIZE = 17;
const SCROLL = 13;

/**
 * S2 What ArchLang is: source left, compiled plan right; three statements light up in turn and a
 * plum connector runs from each to the element it drew (boxes from the compiled scene's shapes).
 */
export const S2: React.FC = () => {
  const frame = useCurrentFrame();
  const lh = FONT_SIZE * 1.55;
  const map = planToPx(layout.knob.viewBox, PLAN);
  // Room, door, window light up across "…write the rooms, walls, doors and windows…".
  const c2 = cue("S2", "s2_2");
  const third = Math.max(70, Math.round((c2.to - c2.from) / 3));
  const slots = [0, 1, 2].map((i) => [c2.from + i * third, c2.from + (i + 1) * third + 20]);
  const active = layout.knob.s2.map((s, i) => ({ ...s, o: window(frame, slots[i][0], slots[i][1], 10) }));
  const enter = ramp(frame, 0, 20);
  return (
    <AbsoluteFill style={{ background: C.sheet, opacity: enter }}>
      <Source
        text={layout.knob.source}
        {...SRC}
        fontSize={FONT_SIZE}
        scrollLine={SCROLL}
        highlight={active.map((a) => ({ line: a.line, opacity: a.o }))}
      />
      <div style={{ position: "absolute", left: PLAN.x, top: PLAN.y, width: PLAN.w, height: PLAN.h, background: "#fff", borderRadius: 12 }} />
      <PlanSvg src={layout.knob.svg} prefix="s2" style={{ left: PLAN.x, top: PLAN.y, width: PLAN.w, height: PLAN.h }} />
      <svg style={{ position: "absolute", inset: 0 }} width={1920} height={1080}>
        {active.map((a) => {
          if (a.o <= 0) return null;
          const ly = SRC.y + 18 + (a.line - 1 - SCROLL) * lh + lh / 2;
          const b = map.box(a.box);
          const pad = 10;
          const tx = b.x + b.w / 2;
          const ty = b.y + b.h / 2;
          const sx = SRC.x + SRC.w - 6;
          const draw = ramp(frame, 0, 1) * a.o;
          return (
            <g key={a.key} opacity={draw}>
              <path
                d={`M ${sx} ${ly} C ${sx + 120} ${ly}, ${tx - 160} ${ty}, ${tx} ${ty}`}
                fill="none"
                stroke={C.plum}
                strokeWidth={4}
              />
              <circle cx={sx} cy={ly} r={7} fill={C.plum} />
              <rect x={b.x - pad} y={b.y - pad} width={b.w + 2 * pad} height={b.h + 2 * pad} rx={8} fill="none" stroke={C.plum} strokeWidth={5} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
