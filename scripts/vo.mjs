// The English voice-over in the owner's cloned voice (docs/narration.md), one ElevenLabs request
// per scene plus one for the S9 spoken brief, following the maker's earlier ElevenLabs pipeline:
//   POST /v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128
//
// Secrets: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID and ELEVENLABS_MODEL come from the gitignored
// .env. They are never printed, logged or written: not to stdout, not to a file, not in an error
// (an error body is redacted before it is shown). The cache key hashes them; the hash reveals nothing.
//
// Cache: audio/vo/<sha256>.mp3 + .json (gitignored: it is the owner's voice), keyed by
// SHA-256 of (text, previous_text, next_text, voice, model, settings, format). A re-run spends
// nothing unless a text changes. Output: data/vo-timing.json (sentence cue times from the character
// alignment; committed), public/audio/vo/*.mp3 for Remotion.
//
// Network only; no browser. On any API error it stops at once (no retry loop).
//   npm run vo            generate what is missing (paid only for uncached texts)
//   npm run vo -- --dry   show what would be sent and its character count; spends nothing
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { NARRATION, VOICE_BRIEF, spokenText } from "../src/copy.ts";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dry = process.argv.includes("--dry");
const FORMAT = "mp3_44100_128";
const SETTINGS = {}; // the voice's own defaults, as tts.ts sends them
const CACHE = join(ROOT, "audio/vo");
const PUB = join(ROOT, "public/audio/vo");

// --- .env, parsed without echoing a value -------------------------------------------------------
function loadEnv() {
  const p = join(ROOT, ".env");
  const env = {};
  if (existsSync(p)) {
    for (const raw of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(raw);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  for (const k of ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID", "ELEVENLABS_MODEL"]) if (process.env[k]) env[k] = process.env[k];
  return env;
}
const env = loadEnv();
const SECRETS = [env.ELEVENLABS_API_KEY, env.ELEVENLABS_VOICE_ID].filter((x) => x && x.length >= 6);
const redact = (s) => SECRETS.reduce((t, x) => t.split(x).join("[redacted]"), String(s));
function die(msg) {
  console.error(`vo: STOP — ${redact(msg)}`);
  process.exit(1);
}
const MODEL = env.ELEVENLABS_MODEL || "eleven_v4";
// previous_text / next_text are sent; if the model rejects them, they are dropped once (and the run
// says so) — never a fall-back to another model. eleven_v3 is known to take neither.
let CONTEXT = !/^eleven_v3/.test(MODEL) && !existsSync(join(ROOT, "audio/vo/context-off"));

// --- the requests ------------------------------------------------------------------------------
const facts = JSON.parse(readFileSync(join(ROOT, "data/facts.json"), "utf8"));
const ids = Object.keys(NARRATION);
const sceneText = (id) => NARRATION[id].map((l) => spokenText(l, facts)).join(" ");
for (const id of ids) if (/\{[a-z0-9_.]+\}/i.test(sceneText(id))) die(`${id}: an unfilled slot in the spoken text (run npm run bake)`);
const jobs = ids.map((id, i) => ({
  id,
  text: sceneText(id),
  previous_text: CONTEXT && i > 0 ? sceneText(ids[i - 1]) : undefined,
  next_text: CONTEXT && i < ids.length - 1 ? sceneText(ids[i + 1]) : undefined,
  sentences: NARRATION[id].map((l) => ({ key: l.key, text: spokenText(l, facts) })),
}));
jobs.push({ id: "brief", text: spokenText(VOICE_BRIEF, facts), sentences: [] });

const keyOf = (j) =>
  createHash("sha256")
    .update(JSON.stringify({ t: j.text, p: j.previous_text ?? null, n: j.next_text ?? null, v: env.ELEVENLABS_VOICE_ID ?? "", m: MODEL, s: SETTINGS, f: FORMAT }))
    .digest("hex");

mkdirSync(CACHE, { recursive: true });
mkdirSync(PUB, { recursive: true });
const todo = jobs.filter((j) => !existsSync(join(CACHE, `${keyOf(j)}.json`)) || !existsSync(join(CACHE, `${keyOf(j)}.mp3`)));
const toSpend = todo.reduce((n, j) => n + j.text.length, 0);
console.log(`vo: ${jobs.length} requests, ${jobs.length - todo.length} cached, ${todo.length} to generate (${toSpend} characters)`);
if (dry) {
  for (const j of jobs) console.log(`  ${j.id.padEnd(5)} ${String(j.text.length).padStart(4)} ch  ${todo.includes(j) ? "NEW " : "cached"}  ${j.text}`);
  process.exit(0);
}
if (todo.length && (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_VOICE_ID)) die("ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID is not set in .env");

let spent = 0;
async function request(j) {
  const body = { text: j.text, model_id: MODEL };
  if (CONTEXT && j.previous_text) body.previous_text = j.previous_text;
  if (CONTEXT && j.next_text) body.next_text = j.next_text;
  try {
    return await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(env.ELEVENLABS_VOICE_ID)}/with-timestamps?output_format=${FORMAT}`, {
      method: "POST",
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    die(`${j.id}: request failed (${e?.message ?? e}); ${spent} characters spent this run`);
  }
}
for (const j of todo) {
  let res = await request(j);
  if (!res.ok) {
    const text = await res.text();
    if (CONTEXT && res.status >= 400 && res.status < 500 && /previous_text|next_text/.test(text)) {
      console.log(`vo: the model rejected previous_text/next_text (HTTP ${res.status}); dropping them for this run, once`);
      CONTEXT = false;
      writeFileSync(join(CACHE, "context-off"), "previous_text/next_text rejected by the model");
      for (const x of jobs) {
        x.previous_text = undefined;
        x.next_text = undefined;
      }
      res = await request(j);
      if (!res.ok) die(`${j.id}: ElevenLabs HTTP ${res.status}: ${(await res.text()).slice(0, 600)}; ${spent} characters spent this run`);
    } else die(`${j.id}: ElevenLabs HTTP ${res.status}: ${text.slice(0, 600)}; ${spent} characters spent this run`);
  }
  const out = await res.json();
  if (!out.audio_base64 || !out.alignment) die(`${j.id}: the response has no audio or no alignment`);
  const k = keyOf(j);
  writeFileSync(join(CACHE, `${k}.mp3`), Buffer.from(out.audio_base64, "base64"));
  writeFileSync(join(CACHE, `${k}.json`), JSON.stringify({ id: j.id, text: j.text, chars: j.text.length, alignment: out.alignment }, null, 1));
  spent += j.text.length;
  console.log(`vo: ${j.id} generated (${j.text.length} characters)`);
}

// --- timing from the character alignment --------------------------------------------------------
function duration(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  return Number(r.stdout.trim());
}
const round3 = (x) => Math.round(x * 1000) / 1000;
const timing = { _note: "Written by scripts/vo.mjs from ElevenLabs character timestamps. Never hand-edit.", scenes: {} };
let totalChars = 0;
for (const j of jobs) {
  const k = keyOf(j);
  const cached = JSON.parse(readFileSync(join(CACHE, `${k}.json`), "utf8"));
  const a = cached.alignment;
  const chars = a.characters;
  const st = a.character_start_times_seconds;
  const en = a.character_end_times_seconds;
  if (chars.join("") !== j.text) die(`${j.id}: the alignment's characters do not spell the text sent`);
  const name = `${j.id}-${k.slice(0, 12)}.mp3`;
  copyFileSync(join(CACHE, `${k}.mp3`), join(PUB, name));
  const dur = round3(duration(join(PUB, name)));
  totalChars += j.text.length;
  if (j.id === "brief") {
    const words = [];
    let cur = null;
    chars.forEach((c, i) => {
      if (/\s/.test(c)) {
        if (cur) words.push(cur);
        cur = null;
        return;
      }
      if (!cur) cur = { word: c, start: st[i], end: en[i] };
      else {
        cur.word += c;
        cur.end = en[i];
      }
    });
    if (cur) words.push(cur);
    timing.brief = { file: `audio/vo/${name}`, duration: dur, chars: j.text.length, hash: k.slice(0, 16), words: words.map((w) => ({ ...w, start: round3(w.start), end: round3(w.end) })) };
    continue;
  }
  let at = 0;
  const sentences = j.sentences.map((s) => {
    const i = j.text.indexOf(s.text, at);
    if (i < 0) die(`${j.id}: sentence ${s.key} not found in the scene text`);
    at = i + s.text.length;
    return { key: s.key, start: round3(st[i]), end: round3(en[i + s.text.length - 1]) };
  });
  timing.scenes[j.id] = { file: `audio/vo/${name}`, duration: dur, chars: j.text.length, hash: k.slice(0, 16), sentences };
}
writeFileSync(join(ROOT, "data/vo-timing.json"), JSON.stringify(timing, null, 2) + "\n");
console.log(`vo: ok — ${spent} characters spent this run; ${totalChars} characters in the whole voice-over; data/vo-timing.json written`);
