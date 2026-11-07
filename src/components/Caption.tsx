import React from "react";
import { useCurrentFrame } from "remotion";
import { NARRATION, SHOWN_ON_SCREEN, type SceneId, subtitle } from "../copy";
import { facts, useTL } from "../data";
import { C, FONT, V, window } from "../theme";
import { CAPTION_FADE } from "../timings";

/**
 * Subtitles of the voice: one sentence per cue, timed from the ElevenLabs character timestamps
 * (data/vo-timing.json): the words as spoken (the URL written normally).
 */
export const Subtitles: React.FC<{ scene: SceneId; dark?: boolean; vertical?: boolean }> = ({ scene, dark, vertical }) => {
  const frame = useCurrentFrame();
  const s = useTL().scenes.find((x) => x.id === scene);
  if (!s) return null;
  const rows = NARRATION[scene];
  return (
    <>
      {s.cues.map((c) => {
        if (SHOWN_ON_SCREEN[c.key]) return null;
        const o = window(frame, c.from, c.to, CAPTION_FADE);
        if (o <= 0) return null;
        const row = rows.find((r) => r.key === c.key);
        if (!row) return null;
        return vertical ? (
          <SubtitleBarVertical key={c.key} text={subtitle(row, facts)} dark={dark} opacity={o} />
        ) : (
          <SubtitleBar key={c.key} text={subtitle(row, facts)} dark={dark} opacity={o} />
        );
      })}
    </>
  );
};

export const SubtitleBar: React.FC<{ text: string; dark?: boolean; opacity: number }> = ({ text, dark, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 46,
      display: "flex",
      justifyContent: "center",
      opacity,
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        maxWidth: 1560,
        padding: "10px 26px",
        borderRadius: 10,
        background: dark ? "rgba(15,17,21,0.80)" : "rgba(17,17,17,0.78)",
        color: "#f5f2ea",
        fontFamily: FONT.sans,
        fontWeight: 500,
        fontSize: 44,
        lineHeight: 1.3,
        letterSpacing: 0,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  </div>
);

/**
 * The 9:16 subtitle: larger type for a phone, its bottom edge at V.subBottom (clear of the platform's
 * bottom 20 %), between V.left and V.right (clear of the right-edge buttons); it grows upwards.
 */
export const SubtitleBarVertical: React.FC<{ text: string; dark?: boolean; opacity: number }> = ({ text, dark, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: V.left,
      width: V.right - V.left,
      bottom: V.H - V.subBottom,
      display: "flex",
      justifyContent: "center",
      opacity,
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        padding: "12px 24px",
        borderRadius: 12,
        background: dark ? "rgba(15,17,21,0.80)" : "rgba(17,17,17,0.78)",
        color: "#f5f2ea",
        fontFamily: FONT.sans,
        fontWeight: 600,
        fontSize: 52,
        lineHeight: 1.28,
        letterSpacing: 0,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  </div>
);

export { C };
