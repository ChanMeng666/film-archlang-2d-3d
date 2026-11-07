import { Easing, interpolate } from "remotion";

export const C = {
  sheet: "#f5f2ea",
  ink: "#111111",
  plum: "#8052ff",
  void: "#0f1115",
  muted: "#6b665e",
  rule: "#ddd6c8",
  card: "#ffffff",
  codeBg: "#fbfaf7",
} as const;

export const FONT = {
  // Noto Sans Symbols 2 supplies → ✓ ● ▸, which the bundled Inter and JetBrains Mono subsets lack,
  // so no glyph falls back to a system font (owner 2026-11-07: English only; the CJK font is gone).
  sans: "Inter, 'Noto Sans Symbols 2', sans-serif",
  mono: "'JetBrains Mono', 'Noto Sans Symbols 2', monospace",
} as const;

/** Ease in-out cubic, no bounce (docs/build-plan.md F4). */
export const ease = Easing.inOut(Easing.cubic);

/** 0→1 over [a, b], eased and clamped. */
export function ramp(frame: number, a: number, b: number): number {
  return interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
}

/** 0→1→0: in over [a, a+f], out over [b-f, b]. */
export function window(frame: number, a: number, b: number, f = 8): number {
  return Math.min(ramp(frame, a, a + f), 1 - ramp(frame, b - f, b));
}

/**
 * The subtitle band: the bottom SAFE_BOTTOM px of the 1920×1080 frame belong to the subtitles in
 * every scene; nothing that has to be read or seen sits there. STAGE_H is what is left above it.
 */
export const SAFE_BOTTOM = 170;
export const STAGE_H = 1080 - SAFE_BOTTOM;

/**
 * The archlang3d viewer's footage (replays, orbit): its bottom status bar (rooms, floor area, doors,
 * windows, warnings) starts near row 1030 of the 1080-row capture and the model never draws below
 * row 1020. Scenes show rows VIEWER_ROWS of it, fitted above the subtitle band, on the viewer's own
 * background colour.
 */
export const VIEWER_ROWS = { top: 40, bottom: 1020 } as const;
export const VIEWER_BG = "#f6f5ee";

/**
 * The 9:16 frame (F8 vertical cut, 1080×1920), laid out for phones. Shorts, Reels and TikTok draw
 * their own UI over the top ~140 px, the bottom ~20 % (384 px) and a column of buttons at the right
 * edge, so: the picture sits in V.top…V.stageBottom; the subtitles sit in the band whose bottom edge
 * is V.subBottom (420 px above the frame's foot); text stays between V.left and V.right.
 */
export const V = {
  W: 1080,
  H: 1920,
  top: 140,
  stageBottom: 1270,
  subBottom: 1500,
  left: 40,
  right: 960,
} as const;

/**
 * The archlang3d viewer footage in the 9:16 frame: columns VIEWER_COLS_V of the capture (the model
 * stays inside them in every frame of the knob-flat and furnished-flat replays; checked on tiled
 * frames, production log F8), rows VIEWER_ROWS, scaled to the frame's width.
 */
export const VIEWER_COLS_V = { left: 360, right: 1560 } as const;
