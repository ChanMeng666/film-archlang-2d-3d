import React from "react";
import { type CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { Cut30, Cut30Vertical } from "./Cut";
import { CUT, TL, type AudioIndex, type Captures, type MasterProps } from "./data";
import { Master } from "./Master";
import { Poster } from "./Poster";
import { FPS, HEIGHT, VERTICAL, WIDTH } from "./timings";

async function json<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(staticFile(path));
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Read what `npm run capture` and `npm run audio` produced; a missing one shows as pending. */
const withAssets: CalculateMetadataFunction<MasterProps> = async ({ props }) => ({
  props: {
    ...props,
    captures: await json<Captures>("captures/index.json"),
    audio: await json<AudioIndex>("audio/index.json"),
  },
});

export const Root: React.FC = () => (
  <>
    <Composition
      id="MasterEN"
      component={Master}
      durationInFrames={TL.total}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ captures: null, audio: null } satisfies MasterProps}
      calculateMetadata={withAssets}
    />
    {/* F8: the 30 s cuts, 16:9 and 9:16 (laid out again, never cropped). */}
    <Composition
      id="Cut30"
      component={Cut30}
      durationInFrames={CUT.total}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ captures: null, audio: null } satisfies MasterProps}
      calculateMetadata={withAssets}
    />
    <Composition
      id="Cut30Vertical"
      component={Cut30Vertical}
      durationInFrames={CUT.total}
      fps={FPS}
      width={VERTICAL.width}
      height={VERTICAL.height}
      defaultProps={{ captures: null, audio: null } satisfies MasterProps}
      calculateMetadata={withAssets}
    />
    {/* F7: poster and thumbnail (thumbnail = this composition at --scale=0.6667). */}
    <Composition id="Poster" component={Poster} durationInFrames={1} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
