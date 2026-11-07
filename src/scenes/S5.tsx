import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SCREEN, fill } from "../copy";
import { PlanSvg } from "../components/Svg";
import { Source } from "../components/Source";
import { facts, layout, useTL } from "../data";
import { s5Speed, type Aspect } from "../timings";
import { C, FONT, V, ramp } from "../theme";
import { S5_BEATS, s5View } from "../s5-state";

const SRC = { x: 40, y: 30, w: 820, h: 860 };
const PLAN = { x: 900, y: 30, w: 980, h: 560 };
const LIST = { x: 900, y: 606, w: 980 };
const FONT_SIZE = 15;
/** 16:9 card type sizes: code, message, fix. */
const CARD = { code: 21, msg: 21, fix: 18 };

/** 9:16: the plan on top, the finding cards under it, then a window of the source that follows the line being fixed. */
const VW = V.W - 2 * V.left;
const VERT = {
  plan: { x: V.left, y: V.top, w: VW, h: 610 },
  list: { x: V.left, y: V.top + 626, w: VW },
  src: { x: V.left, y: 1114, w: VW, h: V.stageBottom - 1114 },
  fontSize: 18,
  card: { code: 26, msg: 26, fix: 22 },
};

const { SELECT_1, TYPE_FROM, TYPE_TO, FIXED_1, SELECT_2, EDIT_2, FIXED_2 } = S5_BEATS;

/**
 * S5 It checks itself: the two findings from `lint --json` (code, message, fix), each fixed the way
 * its hint says: the door line typed back in, then the wardrobe slid 500 mm. Each state of the plan
 * is its own compiled SVG; the rings come from the review sheet. The panel shows the bake's exact
 * panel texts, and each card's line comes from linting the text on screen (src/s5-state.ts).
 */
export const S5: React.FC<{ cut?: boolean; aspect?: Aspect }> = ({ cut, aspect }) => {
  // In a cut the scene is shorter than its beats, so they play faster (timings.ts s5Speed).
  const dur = useTL().scenes.find((x) => x.id === "S5")?.dur ?? 1;
  const speed = cut ? s5Speed(dur) : 1;
  const frame = Math.floor(useCurrentFrame() * speed);
  const vert = aspect === "9x16";
  const P = vert ? VERT.plan : PLAN;
  const L = vert ? VERT.list : LIST;
  const SB = vert ? VERT.src : SRC;
  const K = vert ? VERT.card : CARD;
  const b = layout.broken;
  const view = s5View(frame, b.panel, ramp(frame, TYPE_FROM, TYPE_TO));
  const [f1, f2] = view.cards;
  const shown = view.lines;
  const insertedLine = view.insertedLine;
  const doorTypedLen = shown[insertedLine - 1]?.trimStart().length ?? 0;
  const sel1 = ramp(frame, SELECT_1, SELECT_1 + 10) * (1 - ramp(frame, FIXED_1, FIXED_1 + 10));
  const sel2 = ramp(frame, SELECT_2, SELECT_2 + 10) * (1 - ramp(frame, FIXED_2, FIXED_2 + 10));
  const gone1 = ramp(frame, FIXED_1, FIXED_1 + 14);
  const gone2 = ramp(frame, FIXED_2, FIXED_2 + 14);
  const woodTok = shown.findIndex((l) => /^\s*furniture wardrobe/.test(l)) + 1;
  const offCol = shown[woodTok - 1]?.indexOf("offset ") + "offset ".length;
  const caretLine = frame < TYPE_FROM ? f1.line : frame < SELECT_2 ? insertedLine : woodTok;
  const caretCol = frame >= TYPE_FROM && frame < SELECT_2 ? 2 + doorTypedLen : 2;
  const planState = frame < FIXED_1 ? 0 : frame < FIXED_2 ? 1 : 2;
  const cross = (a: number) => ramp(frame, a, a + 12);
  const pulse = 0.75 + 0.25 * Math.sin(frame / 4);
  const S = (k: keyof typeof SCREEN) => fill(SCREEN[k].en, facts);
  const row = (f: typeof f1, sel: number, gone: number, i: number) => (
    <div
      key={f.code}
      style={{
        marginBottom: 12,
        padding: "12px 18px",
        borderRadius: 12,
        background: "#fff",
        border: `${sel > 0.5 ? 3 : 1}px solid ${sel > 0.5 ? C.plum : C.rule}`,
        opacity: ramp(frame, 4 + i * 8, 22 + i * 8) * (1 - gone),
        transform: `translateX(${(1 - ramp(frame, 4 + i * 8, 22 + i * 8)) * 40}px)`,
        fontFamily: FONT.sans,
        color: C.ink,
      }}
    >
      <div style={{ fontFamily: FONT.mono, fontSize: K.code, fontWeight: 700, color: C.plum }}>
        {f.code} · line {f.line}
      </div>
      <div style={{ fontSize: K.msg, lineHeight: 1.35 }}>{f.message}</div>
      <div style={{ fontSize: K.fix, lineHeight: 1.35, color: C.muted, marginTop: 4 }}>
        {S("s5_fix")}: {f.fix.length > 150 ? f.fix.slice(0, f.fix.indexOf(",") > 0 ? f.fix.indexOf(",") : 150) + " …" : f.fix}
      </div>
    </div>
  );
  // 9:16: the source window shows about five lines, so it scrolls to the line each beat is about.
  const vScroll = interpolate(
    frame,
    [0, TYPE_FROM - 14, TYPE_FROM - 2, FIXED_1 + 10, SELECT_2 - 4],
    [f1.line - 2, f1.line - 2, insertedLine - 2, insertedLine - 2, woodTok - 2],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill style={{ background: C.sheet, opacity: ramp(frame, 0, 12) }}>
      <Source
        text={shown.join("\n")}
        {...SB}
        fontSize={vert ? VERT.fontSize : FONT_SIZE}
        scrollLine={vert ? vScroll : 12}
        highlight={[
          { line: f1.line, opacity: sel1 },
          { line: insertedLine, opacity: frame >= TYPE_FROM ? 1 - ramp(frame, FIXED_1 + 10, FIXED_1 + 30) : 0 },
          { line: f2.line, opacity: sel2 },
        ]}
        token={frame >= SELECT_2 && woodTok > 0 ? { line: woodTok, col: offCol, len: frame >= EDIT_2 ? 3 : 4, opacity: sel2 } : undefined}
        caret={{ line: caretLine, col: caretCol, on: frame > SELECT_1 && frame < FIXED_2 + 20 && Math.floor(frame / 8) % 2 === 0 }}
      />
      <div style={{ position: "absolute", left: P.x, top: P.y, width: P.w, height: P.h, background: "#fff", borderRadius: 12 }} />
      <PlanSvg
        src={b.checksSvg}
        prefix="s5a"
        style={{ left: P.x, top: P.y, width: P.w, height: P.h, opacity: planState === 0 ? 1 : 1 - cross(FIXED_1) }}
        extraCss={`.pg-checks{opacity:${(sel1 > 0.5 ? pulse : 1).toFixed(3)}}`}
      />
      {frame >= FIXED_1 ? (
        <PlanSvg
          src={b.step1ChecksSvg}
          prefix="s5b"
          style={{ left: P.x, top: P.y, width: P.w, height: P.h, opacity: cross(FIXED_1) * (1 - cross(FIXED_2)) }}
          extraCss={`.pg-checks{opacity:${(sel2 > 0.5 ? pulse : 1).toFixed(3)}}`}
        />
      ) : null}
      {frame >= FIXED_2 ? (
        <PlanSvg src={b.fixedSvg} prefix="s5c" style={{ left: P.x, top: P.y, width: P.w, height: P.h, opacity: cross(FIXED_2) }} />
      ) : null}
      <div style={{ position: "absolute", left: L.x, top: L.y, width: L.w }}>
        {row(f1, sel1, gone1, 0)}
        {row(f2, sel2, gone2, 1)}
      </div>
      <div
        style={{
          position: "absolute",
          left: P.x + 20,
          top: P.y + 20,
          padding: "10px 22px",
          borderRadius: 999,
          background: C.plum,
          color: "#fff",
          fontFamily: FONT.sans,
          fontWeight: 700,
          fontSize: 30,
          opacity: ramp(frame, FIXED_2 + 16, FIXED_2 + 28),
        }}
      >
        {S("s5_findings")}
      </div>
    </AbsoluteFill>
  );
};
