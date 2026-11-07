// The copy gate (docs/storyboard.md § Copy gate): every caption and on-screen line in src/copy.ts,
// (the film is English only), plus the SRT file and docs/post-copy.md when they exist, against the
// brief's banned words and constructions; no `{slot}` left unfilled; every caption placed once and
// on screen long enough to read (1.5 s per 10 words).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NARRATION, SCREEN, SECOND_FINDING, VOICE_BRIEF, allSpoken, fill, spokenText, subtitle } from "../src/copy.ts";
import { CUT30, FPS, buildCut, buildTimeline } from "../src/timings.ts";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const facts = JSON.parse(readFileSync(join(ROOT, "data/facts.json"), "utf8"));
const voPath = join(ROOT, "data/vo-timing.json");
const vo = existsSync(voPath) ? JSON.parse(readFileSync(voPath, "utf8")) : null;
const SCENES = buildTimeline(vo).scenes;

// docs/creative-brief.md § Claims (and the maker's voice notes: banned words).
const EN_BANNED = [
  /\bfirst\b/i, /\bonly\b/i, /missing primitive/i, /replaces? architects?/i, /code beats cad/i,
  /\bdisplace/i, /\breplaces? (cad|bim)\b/i, /\bBIM\b/, /\b3D CAD\b/i, /\brender(s|ed|ing)?\b/i,
  /\bwalk-?through\b/i, /\bmodels?\b/i, /\bcomplian(t|ce)\b/i, /permit-ready/i, /\bcode check/i,
  /passes code/i, /building code/i, /\brevolutionary\b/i, /game-chang/i, /\binsane\b/i, /\bcrazy\b/i,
  /mind-blowing/i, /\bmagic(al)?\b/i, /\bseamless(ly)?\b/i, /\beffortless(ly)?\b/i, /\bunleash/i,
  /\bsupercharge/i, /next-level/i, /cutting-edge/i, /world-class/i, /\bdisrupt/i, /\b10x\b/i,
  /\bparadigm\b/i, /best-in-class/i, /state-of-the-art/i, /\bpowerful\b/i, /\brobust\b/i,
  /blazing/i, /high quality/i, /last chance/i, /limited time/i, /don'?t miss/i, /act now/i,
  /\bbenchmark/i, /\branking\b/i, /\bscore\b/i, /\bclearance\b/i, /walking distance/i, /clear width/i,
];
/**
 * "Not X but Y" and its kin. The S11 permit line is the one allowed "not" (storyboard § Copy gate),
 * and its short on-screen form in the cuts (SCREEN.cut_limits).
 */
const NOT_ALLOWED_IN = new Set(["s11_1", "cut_limits"]);
const EN_NOT = /\bnot\b/i;

const problems = [];
const checkText = (where, text, key) => {
  if (/\{[a-z0-9_.]+\}/i.test(text)) problems.push(`${where}: unfilled slot in "${text}"`);
  for (const re of EN_BANNED) if (re.test(text)) problems.push(`${where}: banned ${re} in "${text}"`);
  if (EN_NOT.test(text) && !NOT_ALLOWED_IN.has(key)) problems.push(`${where}: a "not" construction in "${text}"`);
  // The film is English only (owner, 2026-11-07).
  if (/\p{Script=Han}/u.test(text)) problems.push(`${where}: Chinese text in "${text}"`);
};

let n = 0;
for (const [key, row] of Object.entries(SCREEN)) {
  if (!row.trace || !row.trace.trim()) problems.push(`SCREEN.${key}: no trace`);
  checkText(`SCREEN.${key}.en`, fill(row.en, facts), key);
  n++;
}
// The voice-over: what is spoken, and its subtitle (docs/narration.md § Rules).
for (const row of [...allSpoken(), { ...VOICE_BRIEF, scene: "S9" }]) {
  if (!row.trace || !row.trace.trim()) problems.push(`NARRATION.${row.key}: no trace`);
  checkText(`NARRATION.${row.key}.spoken`, spokenText(row, facts), row.key);
  checkText(`NARRATION.${row.key}.sub_en`, subtitle(row, facts), row.key);
  if (/\d+(\.\d+)?\s*m²/.test(spokenText(row, facts))) problems.push(`NARRATION.${row.key}: the voice would read "m²"; use the fact's _spoken slot`);
  n += 2;
}
const iCount = allSpoken().filter((r) => /\bI\b/.test(spokenText(r, facts))).map((r) => r.key);
if (iCount.length !== 1 || iCount[0] !== "s2_1") problems.push(`narration: the founder says "I" in ${iCount.join(",") || "no line"}; it must be once, in S2`);
for (const [code, row] of Object.entries(SECOND_FINDING)) {
  checkText(`SECOND_FINDING.${code}.en`, row.en, code);
  checkText(`SECOND_FINDING.${code}.spoken`, row.spoken, code);
}

// Every spoken line placed exactly once, and its subtitle long enough to read.
const placed = SCENES.flatMap((sc) => sc.cues.map((c) => ({ ...c, scene: sc.id })));
const byKey = Object.fromEntries(allSpoken().map((r) => [r.key, r]));
for (const key of Object.keys(byKey)) {
  const k = placed.filter((c) => c.key === key).length;
  if (k !== 1) problems.push(`timings: line ${key} is placed ${k} times`);
}
for (const c of placed) {
  const row = byKey[c.key];
  if (!row) {
    problems.push(`timings: cue ${c.key} has no narration line`);
    continue;
  }
  const secs = (c.to - c.from) / FPS;
  const words = subtitle(row, facts).split(/\s+/).filter(Boolean).length;
  const need = Math.max(1.0, 0.15 * words);
  if (secs + 1e-9 < need) problems.push(`timings: ${c.key} shows ${secs.toFixed(2)} s, needs ${need.toFixed(2)} s`);
}
if (!vo) problems.push("timings: data/vo-timing.json missing (npm run vo); scene times are estimates");
for (const s of SCENES) {
  const cs = [...s.cues].sort((a, b) => a.from - b.from);
  for (let i = 0; i < cs.length; i++) {
    if (cs[i].from < 0 || cs[i].to > s.dur) problems.push(`timings: ${cs[i].key} outside ${s.id}`);
    if (i > 0 && cs[i].from < cs[i - 1].to) problems.push(`timings: ${cs[i].key} overlaps ${cs[i - 1].key}`);
  }
}

// F8, the 30 s cuts: the same lines, the same legibility and overlap rules on the cut's own
// timeline; every picked line is a narration line of its scene, placed once; the cut is 28–32 s; and
// the limits the master speaks (s7_5, s11_1) are on screen (docs/creative-brief.md § Claims).
{
  const cut = buildCut(vo);
  const cutPlaced = cut.scenes.flatMap((sc) => sc.cues.map((c) => ({ ...c, scene: sc.id })));
  for (const p of CUT30) {
    for (const key of p.keys) {
      if (!NARRATION[p.id].some((r) => r.key === key)) problems.push(`cut: ${key} is no narration line of ${p.id}`);
      const k = cutPlaced.filter((c) => c.key === key).length;
      if (k !== 1) problems.push(`cut: line ${key} is placed ${k} times`);
    }
  }
  for (const c of cutPlaced) {
    const row = byKey[c.key];
    if (!row) {
      problems.push(`cut: cue ${c.key} has no narration line`);
      continue;
    }
    const secs = (c.to - c.from) / FPS;
    const words = subtitle(row, facts).split(/\s+/).filter(Boolean).length;
    const need = Math.max(1.0, 0.15 * words);
    if (secs + 1e-9 < need) problems.push(`cut: ${c.key} shows ${secs.toFixed(2)} s, needs ${need.toFixed(2)} s`);
  }
  for (const s of cut.scenes) {
    const cs = [...s.cues].sort((a, b) => a.from - b.from);
    for (let i = 0; i < cs.length; i++) {
      if (cs[i].from < 0 || cs[i].to > s.dur) problems.push(`cut: ${cs[i].key} outside ${s.id}`);
      if (i > 0 && cs[i].from < cs[i - 1].to) problems.push(`cut: ${cs[i].key} overlaps ${cs[i - 1].key}`);
    }
  }
  const secs = cut.total / FPS;
  if (secs < 28 || secs > 32) problems.push(`cut: ${secs.toFixed(2)} s, outside 28–32 s`);
  const ids = cut.scenes.map((s) => s.id).join(",");
  if (ids !== "S0,S5,S7,S11") problems.push(`cut: scenes ${ids}, the brief's story is S0,S5,S7,S11`);
  if (!SCREEN.cut_limits || !/permit/i.test(SCREEN.cut_limits.en)) problems.push("cut: no on-screen permit limits line (SCREEN.cut_limits)");
  if (!SCREEN.cut_3d || !/3D preview/.test(SCREEN.cut_3d.en)) problems.push('cut: no on-screen "3D preview" label (SCREEN.cut_3d)');
  n += cutPlaced.length;
}

// Every SRT in out/ and the post copy, when they exist.
const outDir = join(ROOT, "out");
if (existsSync(outDir)) {
  for (const f of readdirSync(outDir).filter((f) => f.endsWith(".srt"))) {
    const text = readFileSync(join(outDir, f), "utf8");
    for (const l of text.split(/\r?\n/)) {
      if (!l.trim() || /^\d+$/.test(l.trim()) || /-->/.test(l)) continue;
      const key = [...allSpoken(), VOICE_BRIEF].find((r) => subtitle(r, facts) === l)?.key ?? "";
      checkText(`out/${f}`, l, key);
    }
    n++;
  }
}
const post = join(ROOT, "docs/post-copy.md");
if (existsSync(post)) {
  for (const l of readFileSync(post, "utf8").split(/\r?\n/)) if (l.trim()) checkText("docs/post-copy.md", l, "");
}

if (problems.length) {
  console.error(`gate-copy: FAIL (${problems.length})`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`gate-copy: ok — ${n} lines checked (spoken, subtitles, screen text), ${placed.length} cues timed from the voice`);
