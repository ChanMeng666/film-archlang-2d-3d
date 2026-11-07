// out/archlang-2d-3d-en.srt, following the voice: the same cues the film burns in, timed from
// data/vo-timing.json: the words as spoken (the URL written normally), plus the S9 spoken brief.
// The film is English only (owner, 2026-11-07). F8: the same for each 30 s cut, from the cut's own
// timeline (out/cut-30s-en-16x9.srt and out/cut-30s-en-9x16.srt; both cuts share their timing).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { VOICE_BRIEF, allSpoken, subtitle } from "../src/copy.ts";
import { FPS, buildCut, buildTimeline, masterCues } from "../src/timings.ts";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const facts = JSON.parse(readFileSync(join(ROOT, "data/facts.json"), "utf8"));
const vo = JSON.parse(readFileSync(join(ROOT, "data/vo-timing.json"), "utf8"));
const tl = buildTimeline(vo);
const rows = Object.fromEntries([...allSpoken(), VOICE_BRIEF].map((r) => [r.key, r]));

function ts(frame) {
  const ms = Math.round((frame / FPS) * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor((ms % 3600000) / 60000))}:${p(Math.floor((ms % 60000) / 1000))},${p(ms % 1000, 3)}`;
}

const cues = [
  ...masterCues(tl),
  ...(vo.brief ? [{ key: VOICE_BRIEF.key, start: tl.start.S9 + tl.s9.briefAt, end: tl.start.S9 + tl.s9.briefEnd + 6 }] : []),
].sort((a, b) => a.start - b.start);

mkdirSync(join(ROOT, "out"), { recursive: true });
const blocks = cues.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${subtitle(rows[c.key], facts)}\n`);
const file = join(ROOT, "out", "archlang-2d-3d-en.srt");
writeFileSync(file, blocks.join("\n"));
console.log(`srt: ${file} (${blocks.length} cues, ${(tl.total / FPS).toFixed(2)} s)`);

const cut = buildCut(vo);
const cutBlocks = masterCues(cut).map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${subtitle(rows[c.key], facts)}\n`);
for (const name of ["cut-30s-en-16x9.srt", "cut-30s-en-9x16.srt"]) {
  const f = join(ROOT, "out", name);
  writeFileSync(f, cutBlocks.join("\n"));
  console.log(`srt: ${f} (${cutBlocks.length} cues, ${(cut.total / FPS).toFixed(2)} s)`);
}
