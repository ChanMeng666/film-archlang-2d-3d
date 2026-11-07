import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { Subtitles } from "./components/Caption";
import { CUT, TimelineContext, type MasterProps } from "./data";
import { useFonts } from "./Master";
import { CutMix } from "./Mix";
import { S0 } from "./scenes/S0";
import { S5 } from "./scenes/S5";
import { S7 } from "./scenes/S7";
import { S11 } from "./scenes/S11";
import { C } from "./theme";
import type { Aspect } from "./timings";

/**
 * F8, the 30 s cut (docs/creative-brief.md § Deliverables: S0 → S5 receipt → S7 → S11): the
 * master's scenes in their `cut` form, timed by the cut's timeline (timings.ts buildCut) through
 * TimelineContext, the voice cut from the master's cached files in whole sentences. `aspect` "9x16"
 * lays each scene out again for the vertical frame; nothing is cropped from the 16:9 one.
 */
const CutFilm: React.FC<MasterProps & { aspect: Aspect }> = ({ captures, audio, aspect }) => {
  useFonts();
  const body: Record<string, React.ReactNode> = {
    S0: <S0 captures={captures} cut aspect={aspect} />,
    S5: <S5 cut aspect={aspect} />,
    S7: <S7 captures={captures} cut aspect={aspect} />,
    S11: <S11 cut aspect={aspect} />,
  };
  return (
    <TimelineContext.Provider value={CUT}>
      <AbsoluteFill style={{ background: C.sheet }}>
        <Series>
          {CUT.scenes.map((s) => (
            <Series.Sequence key={s.id} durationInFrames={s.dur} name={`${s.id} ${s.title}`}>
              {body[s.id]}
              <Subtitles scene={s.id} dark={s.id === "S0" || s.id === "S11"} vertical={aspect === "9x16"} />
            </Series.Sequence>
          ))}
        </Series>
        <CutMix audio={audio} />
      </AbsoluteFill>
    </TimelineContext.Provider>
  );
};

export const Cut30: React.FC<MasterProps> = (p) => <CutFilm {...p} aspect="16x9" />;
export const Cut30Vertical: React.FC<MasterProps> = (p) => <CutFilm {...p} aspect="9x16" />;
