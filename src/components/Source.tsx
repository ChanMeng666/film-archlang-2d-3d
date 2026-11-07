import React from "react";
import { C, FONT } from "../theme";

/**
 * Source text as the film shows it: JetBrains Mono, line numbers, one optional highlighted line and
 * an optional token highlight. It shows the file's own lines; nothing is retyped.
 */
export const Source: React.FC<{
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize?: number;
  scrollLine?: number;
  highlight?: { line: number; opacity: number }[];
  token?: { line: number; col: number; len: number; opacity: number };
  caret?: { line: number; col: number; on: boolean };
  dark?: boolean;
}> = ({ text, x, y, w, h, fontSize = 20, scrollLine = 0, highlight = [], token, caret, dark }) => {
  const lines = text.split("\n");
  const lh = fontSize * 1.55;
  const charW = fontSize * 0.6;
  const gutter = charW * 4;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        overflow: "hidden",
        background: dark ? "#16191f" : C.codeBg,
        border: dark ? "1px solid #262a33" : `1px solid ${C.rule}`,
        borderRadius: 14,
        fontFamily: FONT.mono,
        fontSize,
        color: dark ? "#e8e4da" : C.ink,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 18 - scrollLine * lh, right: 0 }}>
        {lines.map((l, i) => {
          const n = i + 1;
          const hl = highlight.filter((hh) => hh.line === n).reduce((a, hh) => Math.max(a, hh.opacity), 0);
          const comment = /^\s*#/.test(l);
          return (
            <div key={i} style={{ position: "relative", height: lh, lineHeight: `${lh}px`, whiteSpace: "pre" }}>
              {hl > 0 ? (
                <div style={{ position: "absolute", inset: 0, background: C.plum, opacity: 0.14 * hl }} />
              ) : null}
              {hl > 0 ? (
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: C.plum, opacity: hl }} />
              ) : null}
              <span style={{ position: "absolute", left: 0, width: gutter - charW, textAlign: "right", color: dark ? "#5c6270" : "#a8a29a" }}>
                {n}
              </span>
              <span style={{ position: "absolute", left: gutter, color: comment ? (dark ? "#7d8594" : "#8a847a") : undefined }}>{l}</span>
              {token && token.line === n ? (
                <span
                  style={{
                    position: "absolute",
                    left: gutter + token.col * charW - 3,
                    top: 3,
                    height: lh - 6,
                    width: token.len * charW + 6,
                    borderRadius: 5,
                    border: `3px solid ${C.plum}`,
                    opacity: token.opacity,
                  }}
                />
              ) : null}
              {caret && caret.line === n && caret.on ? (
                <span style={{ position: "absolute", left: gutter + caret.col * charW, top: 4, width: 3, height: lh - 8, background: C.plum }} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
