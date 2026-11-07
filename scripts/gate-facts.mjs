// The facts gate: every slot resolves; data/ matches the bake manifest (nothing hand-edited); the
// storyboard's scene assertions hold, re-checked here with the CLI on the committed sources (a
// second, differently shaped check of what the bake asserted). Light: the compiler only.
//   --final  also require every capture and the audio (before F7, the full render).
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FINDING_LABEL, NARRATION, SCREEN, SECOND_FINDING, SHOWN_ON_SCREEN, VOICE_BRIEF, allSpoken, fill, spokenText, subtitle } from "../src/copy.ts";
import { S5_BEATS, elementOnLine, names, s5View } from "../src/s5-state.ts";
import { CUT30, CUT_EDGE_S, S5_LAST_BEAT, S7_CUT_TRIM, buildCut, buildTimeline, s5Speed } from "../src/timings.ts";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const CLI = join(ROOT, "node_modules/@chanmeng666/archlang/dist/cli.js");
const final = process.argv.includes("--final");
const problems = [];
const ok = (cond, msg) => {
  if (!cond) problems.push(msg);
};
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const cli = (args) => {
  const r = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", cwd: ROOT, maxBuffer: 1 << 26 });
  try {
    return JSON.parse(r.stdout);
  } catch {
    return null;
  }
};

const factsPath = join(ROOT, "data/facts.json");
const manifestPath = join(ROOT, "data/bake-manifest.json");
if (!existsSync(factsPath) || !existsSync(manifestPath)) {
  console.error("gate-facts: FAIL — run `npm run bake` first (data/facts.json or data/bake-manifest.json missing)");
  process.exit(1);
}
const facts = JSON.parse(readFileSync(factsPath, "utf8"));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

// 1. Every slot in every line resolves.
const unfilled = (t) => /\{[a-z0-9_.]+\}/i.test(t);
for (const [k, r] of Object.entries(SCREEN)) ok(!unfilled(fill(r.en, facts)), `SCREEN.${k}.en: a slot does not resolve`);
for (const r of [...allSpoken(), VOICE_BRIEF]) {
  ok(!unfilled(spokenText(r, facts)), `${r.key}: a spoken slot does not resolve`);
  ok(!unfilled(subtitle(r, facts)), `${r.key}: a subtitle slot does not resolve`);
}
// Spoken forms are the bake's derivation of the same numbers.
ok(facts.knob.net_m2_spoken === `${facts.knob.net_m2} square metres`, "knob.net_m2_spoken is not knob.net_m2 in words");
ok(facts.knob.brief_m2_spoken === `${facts.knob.brief_m2} square metres`, "knob.brief_m2_spoken is not knob.brief_m2 in words");

// The voice matches the script: every scene generated, the same sentences, the same character count
// (a changed line with a stale voice fails here; run npm run vo).
const voPath = join(ROOT, "data/vo-timing.json");
if (!existsSync(voPath)) problems.push("data/vo-timing.json missing (npm run vo)");
else {
  const vo = JSON.parse(readFileSync(voPath, "utf8"));
  for (const [id, rows] of Object.entries(NARRATION)) {
    const v = vo.scenes[id];
    const text = rows.map((r) => spokenText(r, facts)).join(" ");
    if (!v) {
      problems.push(`voice: ${id} not generated`);
      continue;
    }
    ok(v.chars === text.length, `voice: ${id} was generated from a different text (${v.chars} vs ${text.length} characters); run npm run vo`);
    ok(JSON.stringify(v.sentences.map((x) => x.key)) === JSON.stringify(rows.map((r) => r.key)), `voice: ${id} sentences differ from NARRATION`);
    ok(v.sentences.every((x, i) => x.end > x.start && (i === 0 || x.start >= v.sentences[i - 1].start)), `voice: ${id} sentence times are not ordered`);
  }
  ok(vo.brief && vo.brief.chars === spokenText(VOICE_BRIEF, facts).length, "voice: the S9 brief is missing or stale");
}

// 2. data/ and source/ are the bake's (never hand-edited); the baked files are there and unchanged.
for (const [rel, want] of Object.entries(manifest.files)) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) {
    problems.push(`${rel}: missing (run \`npm run bake\`)`);
    continue;
  }
  ok(sha(p) === want, `${rel}: differs from the bake manifest (hand-edited, or a stale bake)`);
}

// 3. Pins: package.json, the installed packages and the facts agree.
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const coreV = JSON.parse(readFileSync(join(ROOT, "node_modules/@chanmeng666/archlang/package.json"), "utf8")).version;
const d3V = JSON.parse(readFileSync(join(ROOT, "node_modules/@chanmeng666/archlang-3d/package.json"), "utf8")).version;
ok(pkg.dependencies["@chanmeng666/archlang"] === coreV && coreV === facts.pins.core, `core pin: package ${pkg.dependencies["@chanmeng666/archlang"]}, installed ${coreV}, facts ${facts.pins.core}`);
ok(pkg.dependencies["@chanmeng666/archlang-3d"] === d3V && d3V === facts.pins.archlang3d, `archlang-3d pin: package ${pkg.dependencies["@chanmeng666/archlang-3d"]}, installed ${d3V}, facts ${facts.pins.archlang3d}`);
for (const [name, v] of Object.entries(pkg.dependencies)) if (name.startsWith("@remotion/") || name === "remotion") ok(v === pkg.dependencies.remotion, `${name} ${v} is not remotion ${pkg.dependencies.remotion}`);
for (const v of Object.values({ ...pkg.dependencies, ...pkg.devDependencies })) ok(/^\d+\.\d+\.\d+$/.test(v), `a dependency is not an exact pin: ${v}`);

// 4. Scene assertions, re-derived from the sources with the CLI.
const src = (f) => join(ROOT, "source", f);
// S0/S3: the knob flat's facts line.
const kd = cli(["describe", src("knob-flat.arch"), "--json"]);
ok(kd && kd.totals.rooms === facts.knob.rooms && kd.totals.net_floor_area_m2 === facts.knob.net_m2, "S3: describe totals differ from facts.knob");
const knobText = readFileSync(src("knob-flat.arch"), "utf8");
const lines = knobText.split(/\r\n|\r|\n/).length - (/[\r\n]$/.test(knobText) ? 1 : 0);
ok(lines === facts.knob.lines, `S3: knob-flat.arch has ${lines} lines, facts say ${facts.knob.lines}`);
// S3: the room card shows both area bases, labelled, and each matches describe; the centre-line
// figure is the stamp the plan itself prints in the room.
{
  const rc = JSON.parse(readFileSync(join(ROOT, "data/layout.json"), "utf8")).knob.roomCard;
  const lr = kd?.rooms?.find((r) => r.label === rc.name);
  ok(lr && lr.net_area_m2 === rc.area_net_m2, `S3: card net area ${rc.area_net_m2} is not describe's ${lr?.net_area_m2}`);
  ok(lr && lr.area_m2 === rc.area_centreline_m2, `S3: card centre-line area ${rc.area_centreline_m2} is not describe's ${lr?.area_m2}`);
  const svg = readFileSync(join(ROOT, "public/baked/knob-flat.svg"), "utf8");
  ok(svg.includes(`>${rc.area_centreline_m2} m²<`), `S3: the plan's room stamp is not ${rc.area_centreline_m2} m²`);
  ok(SCREEN.s3_net && SCREEN.s3_centre, "S3: the card's area labels (s3_net, s3_centre) are missing");
}
// S3: byte-identical output, twice.
const c1 = spawnSync(process.execPath, [CLI, "compile", src("knob-flat.arch"), "-o", "-"], { encoding: "utf8" }).stdout;
const c2 = spawnSync(process.execPath, [CLI, "compile", src("knob-flat.arch"), "-o", "-"], { encoding: "utf8" }).stdout;
ok(c1.length > 0 && c1 === c2, "S3: two compiles of the same text differ");
// S1/S5: the broken flat's two findings, the bedroom unreachable, the fixed form clean.
const bl = cli(["lint", src("broken-flat.arch"), "--json"]);
const codes = (bl?.diagnostics ?? []).filter((d) => d.severity === "warning").map((d) => d.code).sort();
ok(codes.length === 2 && codes.includes(facts.broken.reach_code) && codes.includes(facts.broken.second_code), `S1: broken-flat lint gives ${codes.join(",")}`);
ok(["W_ROOM_DISCONNECTED", "W_ROOM_UNREACHABLE"].includes(facts.broken.reach_code), `S1: ${facts.broken.reach_code} is no reachability code`);
ok(Boolean(SECOND_FINDING[facts.broken.second_code]), `S1: src/copy.ts SECOND_FINDING has no row for ${facts.broken.second_code}`);
const bd = cli(["describe", src("broken-flat.arch"), "--json"]);
ok(bd?.access?.rooms?.find((r) => r.id === "r_bed")?.reachable === false, "S1: describe does not say the bedroom is unreachable");
const fl = cli(["lint", src("broken-flat.fixed.arch"), "--json"]);
ok(fl && fl.diagnostics.filter((d) => d.severity === "warning").length === 0 && facts.broken.findings_after === 0, "S5: broken-flat.fixed.arch is not lint-clean");
// S4: the end value lints clean; impact's counts.
ok(facts.sweep.end_findings === 0, "S4: the LIVING end value has findings");
const imp = cli(["impact", src("knob-flat.arch"), "--set", `LIVING=${facts.sweep.to_mm}`, "--json"]);
ok(imp && imp.changed.length === facts.sweep.changed && imp.held.length === facts.sweep.held && imp.diagnostics.broke.length === facts.sweep.broke, "S4: impact counts differ from facts.sweep");
ok(Math.abs(facts.sweep.to_mm / facts.sweep.from_mm - 1.3) < 0.02, "S4: the sweep is not +30 %");
// S6: finish completes the sheet.
for (const s of ["title", "scale", "schedule", "legend"]) ok(facts.finish.sheet_added.includes(s), `S6: finish did not add ${s}`);
ok(facts.finish.furniture_added >= 6, "S6: finish added fewer than six pieces");
// S8: five formats; DXF blocks and dimensions present.
ok(facts.exports.dxf_blocks > 0 && facts.exports.dxf_dimensions > 0, "S8: the DXF has no blocks or no dimensions");
// S10: every shipped example compiles and builds.
ok(facts.gallery.count === facts.gallery.examples_shipped && facts.gallery.count > 0, "S10: not every example compiled and built");
ok(facts.two_storey.storeys >= 2, "S7: two-storey has fewer than two storeys");

// S1: every ringed finding has a plain label for its badge, 3–5 words.
for (const m of JSON.parse(readFileSync(join(ROOT, "data/layout.json"), "utf8")).broken.marks) {
  const row = FINDING_LABEL[m.code];
  ok(Boolean(row?.en), `S1: src/copy.ts FINDING_LABEL has no row for ${m.code}`);
  const n = row?.en.split(/\s+/).length ?? 0;
  ok(n >= 3 && n <= 5, `S1: FINDING_LABEL.${m.code}.en is ${n} words (3–5)`);
}

// A cue left out of the burned-in subtitles must have its URL (or its words) on screen instead, and
// that screen line must be held legible for at least 2.5 s (S11's end card).
for (const [key, screenKey] of Object.entries(SHOWN_ON_SCREEN)) {
  const row = Object.values(NARRATION).flat().find((r) => r.key === key);
  const url = /[a-z0-9-]+(\.[a-z0-9-]+)+\.[a-z]{2,}/i.exec(row?.en_sub ?? row?.en ?? "")?.[0];
  // A cue with a URL: the screen carries the URL. Otherwise the screen carries the subtitle's words.
  const needle = url ?? row?.en_sub ?? row?.en ?? "";
  ok(needle.length > 0 && fill(SCREEN[screenKey].en, facts).includes(fill(needle, facts)), `${key}: SCREEN.${screenKey}.en does not carry "${needle}"`);
}
{
  const tl = buildTimeline(JSON.parse(readFileSync(join(ROOT, "data/vo-timing.json"), "utf8")));
  const s11 = tl.scenes.find((s) => s.id === "S11");
  const E = s11.cues.find((c) => c.key === "s11_2").from - 8;
  ok((s11.dur - (E + 30)) / 30 >= 2.5, `S11: the call to action is fully shown for ${((s11.dur - (E + 30)) / 30).toFixed(1)} s (< 2.5 s)`);
}

// S5: every finding card names the line on screen, and that line holds the element the finding
// names. Walked frame by frame through the scene's own state (src/s5-state.ts), each panel state
// re-linted here with the CLI (the bake's lint is the one the scene shows; this one checks it).
{
  const layoutJ = JSON.parse(readFileSync(join(ROOT, "data/layout.json"), "utf8"));
  const panel = layoutJ.broken.panel;
  const lintText = (text) => {
    const r = spawnSync(process.execPath, [CLI, "lint", "-", "--json"], { input: text, encoding: "utf8", cwd: ROOT, maxBuffer: 1 << 26 });
    try {
      return JSON.parse(r.stdout).diagnostics.filter((d) => d.severity === "warning").map((d) => `${d.code}@${d.line}`);
    } catch {
      return null;
    }
  };
  ok(Array.isArray(panel) && panel.length === 3, "S5: layout.broken.panel is not three states (npm run bake)");
  for (const [i, p] of (panel ?? []).entries())
    ok(JSON.stringify(lintText(p.source)) === JSON.stringify(p.findings.map((f) => `${f.code}@${f.line}`)), `S5: panel state ${i}'s findings are not the lint of its text`);
  const s5dur = buildTimeline(JSON.parse(readFileSync(join(ROOT, "data/vo-timing.json"), "utf8"))).scenes.find((s) => s.id === "S5").dur;
  const bad = new Set();
  for (let fr = 0; fr < s5dur; fr++) {
    const v = s5View(fr, panel, 1);
    const shown = (f) => v.lines[f.line - 1] ?? "";
    const visible = [fr < S5_BEATS.FIXED_1 + 14, fr < S5_BEATS.FIXED_2 + 14];
    v.cards.forEach((f, k) => {
      if (!visible[k]) return;
      const el = elementOnLine(shown(f));
      if (!names(f.message, el)) bad.add(`S5 frame ${fr}: card ${f.code} names line ${f.line} ("${shown(f).trim()}"), which does not hold the element it names`);
    });
    if (fr >= S5_BEATS.SELECT_2 && fr < S5_BEATS.FIXED_2) {
      const wood = v.lines.findIndex((l) => /^\s*furniture wardrobe/.test(l)) + 1;
      if (wood !== v.cards[1].line) bad.add(`S5 frame ${fr}: the wardrobe is on line ${wood}, the card says ${v.cards[1].line}`);
    }
  }
  for (const m of [...bad].slice(0, 5)) problems.push(m);
}

// S9: the agent session's draft has its one real finding; the finished file is clean.
const ad = cli(["validate", src("agent-draft.arch"), "--strict", "--json"]);
ok(ad && ad.diagnostics.length === 1 && ad.diagnostics[0].code === facts.agent.finding, `S9: agent-draft.arch does not give exactly ${facts.agent.finding}`);
// S9: the line the session's validate output names holds the room it names (the written file is
// agent-draft.arch; the terminal shows its first lines and the JSON with this line).
if (ad?.diagnostics?.[0]) {
  const d = ad.diagnostics[0];
  const draftLine = readFileSync(src("agent-draft.arch"), "utf8").split(/\r?\n/)[d.line - 1] ?? "";
  const el = elementOnLine(draftLine);
  ok(names(d.message, el), `S9: validate names line ${d.line} ("${draftLine.trim()}"), which does not hold "${d.message}"`);
}
const af = cli(["validate", src("agent-finished.arch"), "--strict", "--json"]);
ok(af && af.ok === true, "S9: agent-finished.arch does not validate clean under --strict");

// F8, the 30 s cuts. The voice is the master's cached files cut in whole sentences: each cut edge
// lies between the picked sentences and their neighbours, and (a differently shaped check of the
// alignment) inside a real pause in the audio, by ffmpeg silencedetect at -40 dB. The S5 beats all
// play, the S7 replay does not run out, and the end card's call to action is held 2.5 s.
{
  const vo = JSON.parse(readFileSync(join(ROOT, "data/vo-timing.json"), "utf8"));
  const cut = buildCut(vo);
  const silences = (file) => {
    const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "silencedetect=noise=-40dB:d=0.04", "-f", "null", "-"], { encoding: "utf8" });
    if (r.status !== 0) return null;
    const out = [];
    let a = null;
    for (const m of r.stderr.matchAll(/silence_(start|end): (-?[\d.]+)/g)) {
      if (m[1] === "start") a = Number(m[2]);
      else if (a !== null) {
        out.push([a, Number(m[2])]);
        a = null;
      }
    }
    return out;
  };
  let audioChecked = 0;
  for (const p of CUT30) {
    const v = vo.scenes[p.id];
    const sc = cut.scenes.find((x) => x.id === p.id);
    if (!v || !sc) {
      problems.push(`cut: ${p.id} has no voice or no scene`);
      continue;
    }
    const seg = sc.segments[0];
    const i0 = v.sentences.findIndex((x) => x.key === p.keys[0]);
    const i1 = i0 + p.keys.length - 1;
    const prev = v.sentences[i0 - 1];
    const next = v.sentences[i1 + 1];
    ok(sc.segments.length === 1, `cut: ${p.id} has ${sc.segments.length} voice segments`);
    ok(seg.from <= v.sentences[i0].start && (!prev || seg.from > prev.start), `cut: ${p.id} starts at ${seg.from} s, outside the gap before ${p.keys[0]}`);
    ok(seg.to <= v.duration && (!next || seg.to < next.start) && seg.to > v.sentences[i1].start, `cut: ${p.id} ends at ${seg.to} s, outside the gap after ${p.keys[p.keys.length - 1]}`);
    const file = join(ROOT, "public", v.file);
    if (!existsSync(file)) continue;
    const sil = silences(file);
    if (!sil) {
      problems.push(`cut: ffmpeg could not read ${v.file}`);
      continue;
    }
    audioChecked++;
    const inPause = (t) => sil.some(([a, b]) => t >= a + 0.02 && t <= b - 0.02);
    if (prev) ok(inPause(seg.from), `cut: ${p.id} starts at ${seg.from.toFixed(2)} s, which is not in a pause (EDGE ${CUT_EDGE_S} s)`);
    if (next) ok(inPause(seg.to), `cut: ${p.id} ends at ${seg.to.toFixed(2)} s, which is not in a pause (EDGE ${CUT_EDGE_S} s)`);
  }
  if (final) ok(audioChecked === CUT30.length, `final: the cut's voice edges were checked in ${audioChecked} of ${CUT30.length} files (npm run vo / audio)`);
  // S5: the "0 findings" pill (FIXED_2 + 28) is fully in before the cut's S5 ends.
  ok(S5_LAST_BEAT === S5_BEATS.FIXED_2 + 28, `cut: S5_LAST_BEAT ${S5_LAST_BEAT} is not the pill's last beat ${S5_BEATS.FIXED_2 + 28}`);
  const s5 = cut.scenes.find((x) => x.id === "S5");
  ok(s5 && Math.floor((s5.dur - 1) * s5Speed(s5.dur)) >= S5_LAST_BEAT, "cut: S5 ends before its last beat");
  // S7: the furnished-flat replay, entered at S7_CUT_TRIM, lasts the scene.
  const capPath = join(ROOT, "public/captures/index.json");
  if (existsSync(capPath)) {
    const ff = JSON.parse(readFileSync(capPath, "utf8")).replays?.["furnished-flat"];
    const s7 = cut.scenes.find((x) => x.id === "S7");
    ok(ff && s7 && S7_CUT_TRIM + s7.dur <= ff.frames, `cut: the S7 replay (${ff?.frames} frames) runs out before the scene ends (${S7_CUT_TRIM} + ${s7?.dur})`);
  }
  // S11: the call to action is up from E + 30 to the end, at least 2.5 s.
  const s11 = cut.scenes.find((x) => x.id === "S11");
  const E = s11.cues.find((c) => c.key === "s11_2").from - 8;
  ok((s11.dur - (E + 30)) / 30 >= 2.5, `cut: the call to action is fully shown for ${((s11.dur - (E + 30)) / 30).toFixed(1)} s (< 2.5 s)`);
}

// 5. --final: the captures and the audio are in.
if (final) {
  const cap = join(ROOT, "public/captures/index.json");
  if (!existsSync(cap)) problems.push("final: public/captures/index.json missing (npm run capture)");
  else {
    const c = JSON.parse(readFileSync(cap, "utf8"));
    for (const r of ["knob-flat", "furnished-flat", "two-storey"]) ok(Boolean(c.replays?.[r]), `final: replay ${r} missing`);
    ok(Boolean(c.orbit), "final: orbit missing");
    const layout = JSON.parse(readFileSync(join(ROOT, "data/layout.json"), "utf8"));
    for (const g of [...layout.gallery.map((x) => x.name), "laneway-finished"]) ok(Boolean(c.gallery?.[g]), `final: 3D still ${g} missing`);
  }
  ok(existsSync(join(ROOT, "public/audio/index.json")), "final: public/audio/index.json missing (npm run audio)");
}

if (problems.length) {
  console.error(`gate-facts: FAIL (${problems.length})`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`gate-facts: ok — ${Object.keys(manifest.files).length} baked files match the manifest; scene assertions hold${final ? "; captures and audio present" : ""}`);
