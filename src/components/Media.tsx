import React from "react";
import { Img, OffthreadVideo, staticFile } from "remotion";
import { C, FONT, STAGE_H, V, VIEWER_BG, VIEWER_COLS_V, VIEWER_ROWS } from "../theme";

/**
 * A capture that `npm run capture` has not produced yet. It says so on screen, so a preview made
 * before the captures can never pass for the finished film; `gate-facts --final` refuses to clear
 * a render while any capture is missing.
 */
export const Pending: React.FC<{ what: string; style?: React.CSSProperties; dark?: boolean }> = ({ what, style, dark }) => (
  <div
    style={{
      position: "absolute",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: dark ? "#1a1d24" : "#ebe6da",
      border: `3px dashed ${dark ? "#3a3f4a" : "#c9c1b0"}`,
      color: dark ? "#9aa0ab" : C.muted,
      fontFamily: FONT.mono,
      fontSize: 26,
      textAlign: "center",
      padding: 20,
      whiteSpace: "pre-line",
      ...style,
    }}
  >
    {`capture pending: ${what}\n(npm run capture)`}
  </div>
);

export const CaptureVideo: React.FC<{
  file: string | undefined;
  what: string;
  trimBefore?: number;
  durationInFrames?: number;
  playbackRate?: number;
  style?: React.CSSProperties;
  /**
   * archlang3d viewer footage: show only VIEWER_ROWS (the status bar cropped out), scaled to fit
   * above the subtitle band, centred on the viewer's background.
   */
  viewer?: boolean;
  /** Any other 1080-row footage fitted whole above the subtitle band, on this background. */
  fitBg?: string;
  /** With `viewer`: the 9:16 frame (VIEWER_COLS_V × VIEWER_ROWS of the footage, full width, centred in V's stage). */
  vertical?: boolean;
}> = ({ file, what, trimBefore, durationInFrames, playbackRate, style, viewer, fitBg, vertical }) => {
  if (!file) return <Pending what={what} style={{ inset: 0, ...style }} />;
  if (viewer && vertical) {
    const k = V.W / (VIEWER_COLS_V.right - VIEWER_COLS_V.left);
    const h = (VIEWER_ROWS.bottom - VIEWER_ROWS.top) * k;
    const top = Math.round(V.top + (V.stageBottom - V.top - h) / 2);
    return (
      <div style={{ position: "absolute", inset: 0, background: VIEWER_BG, ...style }}>
        <div style={{ position: "absolute", left: 0, top, width: V.W, height: h, overflow: "hidden" }}>
          <OffthreadVideo
            src={staticFile(file)}
            muted
            trimBefore={trimBefore}
            durationInFrames={durationInFrames}
            playbackRate={playbackRate}
            style={{ position: "absolute", left: -VIEWER_COLS_V.left * k, top: -VIEWER_ROWS.top * k, width: 1920 * k, height: 1080 * k }}
          />
        </div>
      </div>
    );
  }
  if (viewer || fitBg) {
    const win = viewer ? VIEWER_ROWS : { top: 0, bottom: 1080 };
    const bg = viewer ? VIEWER_BG : fitBg;
    const k = STAGE_H / (win.bottom - win.top);
    const w = 1920 * k;
    return (
      <div style={{ position: "absolute", inset: 0, background: bg, ...style }}>
        <div style={{ position: "absolute", left: (1920 - w) / 2, top: 0, width: w, height: STAGE_H, overflow: "hidden" }}>
          <OffthreadVideo
            src={staticFile(file)}
            muted
            trimBefore={trimBefore}
            durationInFrames={durationInFrames}
            playbackRate={playbackRate}
            style={{ position: "absolute", left: 0, top: -win.top * k, width: w, height: 1080 * k }}
          />
        </div>
      </div>
    );
  }
  return (
    <OffthreadVideo
      src={staticFile(file)}
      muted
      trimBefore={trimBefore}
      durationInFrames={durationInFrames}
      playbackRate={playbackRate}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style }}
    />
  );
};

export const CaptureStill: React.FC<{ file: string | undefined; what: string; style?: React.CSSProperties }> = ({ file, what, style }) => {
  if (!file) return <Pending what={what} style={style} />;
  return <Img src={staticFile(file)} style={{ position: "absolute", objectFit: "cover", ...style }} />;
};

/**
 * Rows at the bottom of an archlang3d still that hold the viewer's status text (rooms, floor area,
 * doors, windows, warnings), by the still's size. The text is CSS-sized, so it is the same height
 * whatever the canvas; the model never draws into it.
 */
export const STILL_HUD_ROWS: Record<string, number> = { "428x300": 34, "880x800": 70, "660x600": 40 };

/**
 * An archlang3d still with its status text cropped off, covering a w×h box (anchored at the top;
 * any excess width is trimmed evenly from the sides, never the model's own rows).
 */
export const ViewerStill: React.FC<{ file: string | undefined; what: string; w: number; h: number; style?: React.CSSProperties }> = ({ file, what, w, h, style }) => {
  if (!file) return <Pending what={what} style={{ width: w, height: h, fontSize: 14, padding: 4, ...style }} />;
  const m = /-(\d+)x(\d+)\.png$/.exec(file);
  const natW = m ? Number(m[1]) : w;
  const natH = m ? Number(m[2]) : h;
  const kept = natH - (STILL_HUD_ROWS[`${natW}x${natH}`] ?? Math.round(natH * 0.12));
  const k = Math.max(w / natW, h / kept);
  return (
    <div style={{ position: "absolute", width: w, height: h, overflow: "hidden", ...style }}>
      <Img src={staticFile(file)} style={{ position: "absolute", left: (w - natW * k) / 2, top: 0, width: natW * k, height: natH * k }} />
    </div>
  );
};
