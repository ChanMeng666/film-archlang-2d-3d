// Half-scale preview of a master, with the laptop's rules: guarded (no Blender, at least 1 GB free),
// and --concurrency=1 when less than 3 GB is free (else 2); then scripts/master.mjs → *-master.mp4.
//   node scripts/preview.mjs MasterEN out/preview-en.mp4
import { spawnSync } from "node:child_process";
import { freeGB, guard, LOW_FREE_GB } from "./heavy-guard.mjs";

// remotion.exe's OffthreadVideo cache grew past 3.6 GB in S7 (the replay videos) and took free RAM to
// 2.1 GB on 2026-11-07; these caps held the lowest free RAM at 5.2 GB.
export const CACHE_CAPS = ["--offthreadvideo-cache-size-in-bytes=500000000", "--offthreadvideo-video-threads=1", "--media-cache-size-in-bytes=300000000"];

const [comp = "MasterEN", out = "out/preview-en.mp4"] = process.argv.slice(2);
guard();
const gb = freeGB();
const concurrency = gb < LOW_FREE_GB ? 1 : 2;
console.log(`preview: ${comp} → ${out}, ${gb.toFixed(2)} GB free, --concurrency=${concurrency}`);
const r = spawnSync("npx", ["remotion", "render", "src/index.ts", comp, out, "--scale=0.5", `--concurrency=${concurrency}`, ...CACHE_CAPS], {
  stdio: "inherit",
  shell: true,
});
if (r.status !== 0) process.exit(r.status ?? 1);
// Then the audio master (compressor + two-pass loudnorm), writing *-master.mp4 beside it.
const m = spawnSync(process.execPath, ["scripts/master.mjs", out], { stdio: "inherit" });
process.exit(m.status ?? 1);
