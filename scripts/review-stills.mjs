// One half-scale still from the middle of every scene (and three S9 beats), for the owner's review, into out/review/.
// Heavy (a browser): refuses while another heavy process runs; renders one still at a time.
//   node scripts/review-stills.mjs
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { buildTimeline } from "../src/timings.ts";
import { guard } from "./heavy-guard.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(join(ROOT, "out/review"), { recursive: true });
const TL = buildTimeline(JSON.parse(readFileSync(join(ROOT, "data/vo-timing.json"), "utf8")));
const SCENES = TL.scenes;
const SCENE_START = TL.start;
// One per scene (its middle), plus three S9 beats: the spoken brief, the session, the closing tiles.
const b = TL.s9;
const SHOTS = [
  ...SCENES.map((s) => ({ id: s.id, frame: SCENE_START[s.id] + Math.floor(s.dur / 2) })),
  ...[Math.floor((b.briefAt + b.briefEnd) / 2), b.sessionAt + 120, b.tilesAt + 30].map((f, i) => ({ id: `S9b${i + 1}`, frame: SCENE_START.S9 + f })),
];
for (const { id, frame } of SHOTS) {
  guard();
  const out = join(ROOT, "out/review", `en-${id}-f${frame}.png`);
  const r = spawnSync("npx", ["remotion", "still", "src/index.ts", "MasterEN", out, `--frame=${frame}`, "--scale=0.5"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log(`review-stills: ${SHOTS.length} stills in out/review/`);
