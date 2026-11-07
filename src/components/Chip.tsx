import React from "react";
import { C, FONT } from "../theme";

/** A small dark label over footage (the S7 replay label's look), e.g. the cuts' "3D preview" chip. */
export const Chip: React.FC<{ text: string; left: number; top: number; opacity: number; fontSize?: number; plum?: boolean }> = ({
  text,
  left,
  top,
  opacity,
  fontSize = 24,
  plum,
}) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      padding: "8px 18px",
      borderRadius: 10,
      background: plum ? C.plum : "rgba(17,17,17,0.78)",
      color: "#f5f2ea",
      fontFamily: FONT.mono,
      fontWeight: plum ? 700 : 400,
      fontSize,
      opacity,
    }}
  >
    {text}
  </div>
);
