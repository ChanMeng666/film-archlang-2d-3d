import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { ViewerStill } from "../components/Media";
import { layout, type Captures } from "../data";
import { C, STAGE_H, ramp } from "../theme";

const COLS = 8;
const FINALE = ["courtyard-house", "hillside-villa"];
/** The finale's 880×800 stills, status text cropped (STILL_HUD_ROWS): 880×730. */
const FIN_H = 730;

/**
 * S10 Gallery: every shipped example (the bake's count), each tile flipping from its compiled plan
 * to its 3D still in a wave, ending on the courtyard house and the hillside villa, large.
 */
export const S10: React.FC<{ captures: Captures | null }> = ({ captures }) => {
  const frame = useCurrentFrame();
  const g = layout.gallery;
  const rows = Math.ceil(g.length / COLS);
  // The grid fills the stage above the subtitle band: 8 columns, as many rows as the bake's count needs.
  const gap = 12;
  const tw = Math.floor((1920 - 40 - (COLS - 1) * gap) / COLS);
  const th = Math.min(Math.floor((STAGE_H - 30 - (rows - 1) * gap) / rows), Math.round(tw * 0.75));
  const gx = (1920 - (COLS * tw + (COLS - 1) * gap)) / 2;
  const gy = (STAGE_H - (rows * th + (rows - 1) * gap)) / 2;
  const finale = ramp(frame, 190, 214);
  return (
    <AbsoluteFill style={{ background: C.sheet }}>
      <AbsoluteFill style={{ opacity: 1 - finale }}>
        {g.map((ex, i) => {
          const c = i % COLS;
          const r = Math.floor(i / COLS);
          const flip = ramp(frame, 40 + (c + r) * 7, 52 + (c + r) * 7);
          const show3d = flip > 0.5;
          const sx = Math.abs(Math.cos(flip * Math.PI));
          const still = captures?.gallery[ex.name];
          return (
            <div
              key={ex.name}
              style={{
                position: "absolute",
                left: gx + c * (tw + gap),
                top: gy + r * (th + gap),
                width: tw,
                height: th,
                borderRadius: 10,
                overflow: "hidden",
                background: "#fff",
                border: `1px solid ${C.rule}`,
                transform: `scaleX(${sx.toFixed(3)})`,
                opacity: ramp(frame, i * 0.8, 10 + i * 0.8),
              }}
            >
              {show3d ? (
                <ViewerStill file={still} what={ex.name} w={tw} h={th} style={{ left: 0, top: 0 }} />
              ) : (
                <Img src={staticFile(ex.svg)} style={{ position: "absolute", inset: 6, width: tw - 12, height: th - 12, objectFit: "contain" }} />
              )}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, top: gy + rows * (th + gap), height: 1 }} />
      </AbsoluteFill>
      {frame >= 190
        ? FINALE.map((name, i) => (
            <div
              key={name}
              style={{
                position: "absolute",
                left: 60 + i * 920,
                top: (STAGE_H - FIN_H) / 2,
                width: 880,
                height: FIN_H,
                borderRadius: 16,
                overflow: "hidden",
                background: "#fff",
                border: `1px solid ${C.rule}`,
                opacity: finale,
              }}
            >
              <ViewerStill file={captures?.gallery[name]} what={name} w={880} h={FIN_H} style={{ left: 0, top: 0 }} />
            </div>
          ))
        : null}
    </AbsoluteFill>
  );
};
