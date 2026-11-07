import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/noto-sans-symbols-2/400.css";
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Series } from "remotion";
import { Subtitles } from "./components/Caption";
import { TL, type MasterProps } from "./data";
import { Mix } from "./Mix";
import { S0 } from "./scenes/S0";
import { S1 } from "./scenes/S1";
import { S2 } from "./scenes/S2";
import { S3 } from "./scenes/S3";
import { S4 } from "./scenes/S4";
import { S5 } from "./scenes/S5";
import { S6 } from "./scenes/S6";
import { S7 } from "./scenes/S7";
import { S8 } from "./scenes/S8";
import { S9 } from "./scenes/S9";
import { S10 } from "./scenes/S10";
import { S11 } from "./scenes/S11";
import { C } from "./theme";

/** Hold the first frame until the fonts the captions use have loaded (no network: @fontsource). */
export function useFonts() {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    // The symbol face loads lazily on first use, so ask for it up front: every frame then has it.
    document.fonts
      .load("16px 'Noto Sans Symbols 2'", "→✓●▸")
      .then(() => document.fonts.ready)
      .then(() => continueRender(h));
  }, [h]);
}

export const Master: React.FC<MasterProps> = ({ captures, audio }) => {
  useFonts();
  const body: Record<string, React.ReactNode> = {
    S0: <S0 captures={captures} />,
    S1: <S1 />,
    S2: <S2 />,
    S3: <S3 />,
    S4: <S4 />,
    S5: <S5 />,
    S6: <S6 />,
    S7: <S7 captures={captures} />,
    S8: <S8 captures={captures} />,
    S9: <S9 />,
    S10: <S10 captures={captures} />,
    S11: <S11 />,
  };
  return (
    <AbsoluteFill style={{ background: C.sheet }}>
      <Series>
        {TL.scenes.map((s) => (
          <Series.Sequence key={s.id} durationInFrames={s.dur} name={`${s.id} ${s.title}`}>
            {body[s.id]}
            <Subtitles scene={s.id} dark={s.id === "S0" || s.id === "S11"} />
          </Series.Sequence>
        ))}
      </Series>
      <Mix audio={audio} />
    </AbsoluteFill>
  );
};
