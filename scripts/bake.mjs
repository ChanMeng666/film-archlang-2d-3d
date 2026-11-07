// The bake: every drawing, fact and file the film shows, produced by the pinned packages.
//
// Reads the pinned @chanmeng666/archlang and @chanmeng666/archlang-3d from node_modules, writes
// public/baked/** (gitignored), data/facts.json (every caption slot), data/layout.json (the
// geometry and text the scenes place) and data/bake-manifest.json (SHA-256 of every output).
// Light work only: node, the compiler, the GLB writer, resvg and pdftoppm. No browser.
//
// Every scene assertion in docs/storyboard.md "Source" lines is checked here and again in
// scripts/gate-facts.mjs; a failed assertion stops the bake.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as core from "@chanmeng666/archlang";
import { buildReviewSheet } from "../node_modules/@chanmeng666/archlang/dist/cli/review.js";
import { readGlbNodes } from "@chanmeng666/archlang-3d/node";
import { Resvg } from "@resvg/resvg-js";
import { dxfToSvg } from "./lib/dxf-view.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CORE = join(ROOT, "node_modules/@chanmeng666/archlang");
const D3 = join(ROOT, "node_modules/@chanmeng666/archlang-3d");
const EXAMPLES = join(CORE, "examples");
const CLI = join(CORE, "dist/cli.js");
const CLI3D = join(D3, "dist/cli.js");
const OUT = join(ROOT, "public/baked");
const SRC = join(ROOT, "source");
const DATA = join(ROOT, "data");

const PINS = { core: "1.57.0", d3: "0.4.0" };

// ---------------------------------------------------------------------------------------------
// helpers

function fail(msg) {
  console.error(`bake: ASSERTION FAILED: ${msg}`);
  process.exit(1);
}
function assert(cond, msg) {
  if (!cond) fail(msg);
}
const read = (p) => readFileSync(p, "utf8");
const lf = (s) => s.replace(/\r\n?/g, "\n");
function write(rel, data) {
  const p = join(OUT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, data);
  return p;
}
/** Run the core CLI; returns { status, stdout, stderr, json }. */
function arch(args, input) {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    input,
    maxBuffer: 1 << 28,
    cwd: ROOT,
  });
  let json;
  if (args.includes("--json")) {
    try {
      json = JSON.parse(r.stdout);
    } catch {
      /* not JSON */
    }
  }
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, json };
}
function arch3d(args) {
  const r = spawnSync(process.execPath, [CLI3D, ...args], { encoding: "utf8", maxBuffer: 1 << 28, cwd: ROOT });
  let json;
  try {
    json = JSON.parse(r.stdout);
  } catch {
    /* not JSON */
  }
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, json };
}
/** The playground's own line count (playground/src/room-facts.ts `sourceLines`). */
function sourceLines(source) {
  if (source === "") return 0;
  const n = source.split(/\r\n|\r|\n/).length;
  return /[\r\n]$/.test(source) ? n - 1 : n;
}
const lines = (s) => s.split("\n");
/** 1-based line of the first line matching `re`; asserts exactly one match. */
function lineOf(source, re, what) {
  const hits = lines(source)
    .map((l, i) => (re.test(l) ? i + 1 : 0))
    .filter(Boolean);
  assert(hits.length === 1, `${what}: expected one line matching ${re}, found ${hits.length}`);
  return hits[0];
}
function viewBoxOf(svg) {
  const m = /viewBox="([^"]+)"/.exec(svg);
  assert(m, "svg has a viewBox");
  const [x, y, w, h] = m[1].trim().split(/\s+/).map(Number);
  return { x, y, w, h };
}
function compileSvg(source, what) {
  const r = arch(["compile", "-", "-o", "-", "-f", "svg"], source);
  assert(r.status === 0 && r.stdout.startsWith("<svg"), `${what} compiles (exit ${r.status}: ${r.stderr.slice(0, 300)})`);
  return r.stdout;
}
function lintJson(source, what) {
  const r = arch(["lint", "-", "--json"], source);
  assert(r.json, `${what}: lint --json parses`);
  return r.json;
}
function describeJson(source, what) {
  const r = arch(["describe", "-", "--json"], source);
  assert(r.json && r.json.ok, `${what}: describe --json ok`);
  return r.json;
}
const findings = (lint) =>
  lint.diagnostics
    .filter((d) => d.severity === "warning")
    .map((d) => ({ code: d.code, message: d.message, fix: d.fix ?? "", hint: (d.hints ?? [])[0] ?? "", line: d.line }));
function png(svg, width) {
  const r = new Resvg(svg, { fitTo: { mode: "width", value: width }, font: { loadSystemFonts: false, defaultFontFamily: "Arial" } });
  return r.render().asPng();
}
/** A box round every point a scene node of `id` draws (the shape, never a guess). */
function elementBox(scene, id) {
  const pts = [];
  const walk = (p) => {
    if (!p) return;
    if (Array.isArray(p.pts)) pts.push(...p.pts);
    for (const k of ["x1", "x2"]) if (typeof p[k] === "number") pts.push({ x: p[k], y: p[k === "x1" ? "y1" : "y2"] });
    if (typeof p.cx === "number") pts.push({ x: p.cx - (p.r ?? 0), y: p.cy - (p.r ?? 0) }, { x: p.cx + (p.r ?? 0), y: p.cy + (p.r ?? 0) });
    if (typeof p.x === "number" && typeof p.w === "number") pts.push({ x: p.x, y: p.y }, { x: p.x + p.w, y: p.y + p.h });
  };
  for (const n of scene.nodes) if (n.elementId === id && n.elementPrimary) walk(n.prim);
  assert(pts.length > 0, `scene draws element ${id}`);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
/** The playground's Checks overlay (playground/src/checks-overlay.ts): the review sheet's own rings. */
function group(svg, id) {
  const open = `<g id="${id}">`;
  const at = svg.indexOf(open);
  assert(at >= 0, `review sheet has <g id="${id}">`);
  const from = at + open.length;
  return svg.slice(from, svg.indexOf("</g>", from));
}
function withChecks(planSvg, source) {
  const sheet = buildReviewSheet(source);
  assert(!("kind" in sheet), "review sheet builds");
  const overlay =
    `<g class="pg-checks" pointer-events="none">` +
    `<g class="pg-checks-rings">${group(sheet.svg, "rv-rings")}</g>` +
    `<g class="pg-checks-tags">${group(sheet.svg, "rv-tags")}</g></g>`;
  const end = planSvg.lastIndexOf("</svg>");
  return { svg: planSvg.slice(0, end) + overlay + planSvg.slice(end), marks: sheet.marks };
}
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const round2 = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------------------------
// 0. pins and a clean output tree

const corePkg = JSON.parse(read(join(CORE, "package.json")));
const d3Pkg = JSON.parse(read(join(D3, "package.json")));
assert(corePkg.version === PINS.core, `core is ${PINS.core} (found ${corePkg.version})`);
assert(d3Pkg.version === PINS.d3, `archlang-3d is ${PINS.d3} (found ${d3Pkg.version})`);
const rootPkg = JSON.parse(read(join(ROOT, "package.json")));
assert(rootPkg.dependencies["@chanmeng666/archlang"] === PINS.core, "package.json pins the core exactly");
assert(rootPkg.dependencies["@chanmeng666/archlang-3d"] === PINS.d3, "package.json pins archlang-3d exactly");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
mkdirSync(SRC, { recursive: true });
mkdirSync(DATA, { recursive: true });

// ---------------------------------------------------------------------------------------------
// 1. sources: copies of shipped examples, and the edited variants with their edits stated

for (const f of ["knob-flat", "furnished-flat", "two-storey", "laneway-house", "courtyard-house", "hillside-villa"]) {
  copyFileSync(join(EXAMPLES, `${f}.arch`), join(SRC, `${f}.arch`));
}
// The logo, byte for byte, where Remotion can serve it (recoloured by CSS only).
copyFileSync(join(ROOT, "brand/archlang-logo-master.svg"), join(OUT, "logo.svg"));
const knobSrc = lf(read(join(SRC, "knob-flat.arch")));

// broken-flat: the knob flat, the bedroom door deleted, and a wardrobe added in front of the
// bedroom window. Both must still compile (W_* findings only).
const DOOR_LINE = "  door between r_live and r_bed  at 900 from end width 800 hinge near end swing into r_bed";
const BED_LINE = '  furniture bed          in r_bed  anchor top-right flush size 1400x2000 label "Bed"';
const WARDROBE_BAD = "  furniture wardrobe     against r_bed.top offset 1100 size 900x600";
const WARDROBE_OK = "  furniture wardrobe     against r_bed.top offset 600 size 900x600";
assert(knobSrc.split("\n").filter((l) => l === DOOR_LINE).length === 1, "knob-flat has the bedroom door line");
assert(knobSrc.split("\n").filter((l) => l === BED_LINE).length === 1, "knob-flat has the bed line");
const HEADER_BROKEN = `# broken-flat.arch: written by scripts/bake.mjs from knob-flat.arch (core examples, MIT).
# Edits, and nothing else:
#   1. deleted: "${DOOR_LINE.trim()}"
#   2. added after the bed: "${WARDROBE_BAD.trim()}"
`;
const HEADER_STEP1 = `# broken-flat.step1.arch: written by scripts/bake.mjs. broken-flat.arch with edit 1 undone:
#   the bedroom door line is back where it was; the wardrobe still stands in front of the window.
`;
const HEADER_FIXED = `# broken-flat.fixed.arch: written by scripts/bake.mjs. broken-flat.arch with both fixes:
#   1. the bedroom door line is back where it was;
#   2. the wardrobe slid 500 mm along the wall (offset 1100 -> 600), as lint's hint says.
`;
const brokenBody = knobSrc
  .split("\n")
  .filter((l) => l !== DOOR_LINE)
  .flatMap((l) => (l === BED_LINE ? [l, WARDROBE_BAD] : [l]))
  .join("\n");
const step1Body = knobSrc
  .split("\n")
  .flatMap((l) => (l === BED_LINE ? [l, WARDROBE_BAD] : [l]))
  .join("\n");
const fixedBody = step1Body.replace(WARDROBE_BAD, WARDROBE_OK);
const brokenSrc = HEADER_BROKEN + brokenBody;
const step1Src = HEADER_STEP1 + step1Body;
const fixedSrc = HEADER_FIXED + fixedBody;
writeFileSync(join(SRC, "broken-flat.arch"), brokenSrc);
writeFileSync(join(SRC, "broken-flat.step1.arch"), step1Src);
writeFileSync(join(SRC, "broken-flat.fixed.arch"), fixedSrc);

// laneway-bare: laneway-house with its furniture and sheet statements removed, so `finish` has work.
const lanewaySrc = lf(read(join(SRC, "laneway-house.arch")));
const SHEET_RE = /^\s*(furniture|title|dims auto|paper|scale|schedule|legend)\b/;
const removed = lanewaySrc.split("\n").filter((l) => SHEET_RE.test(l));
assert(removed.every((l) => !l.includes("{") || l.includes("}")), "laneway: every removed statement is one line");
const HEADER_BARE = `# laneway-bare.arch: written by scripts/bake.mjs from laneway-house.arch (core examples, MIT),
# with every line that starts with furniture, title, dims auto, paper, scale, schedule or legend
# removed (${removed.length} lines), so \`archlang finish\` has rooms to furnish and a sheet to complete.
`;
const bareSrc =
  HEADER_BARE +
  lanewaySrc
    .split("\n")
    .filter((l) => !SHEET_RE.test(l))
    .join("\n");
writeFileSync(join(SRC, "laneway-bare.arch"), bareSrc);

// ---------------------------------------------------------------------------------------------
// 2. S0, S2, S3: the knob flat

const knobSvg = compileSvg(knobSrc, "knob-flat");
write("knob-flat.svg", knobSvg);
const knobDesc = describeJson(knobSrc, "knob-flat");
const knobLint = lintJson(knobSrc, "knob-flat");
assert(findings(knobLint).length === 0, "knob-flat lints clean");
const knobScene = core.compile(knobSrc, { annotate: true }).scene;
const knobVB = viewBoxOf(knobSvg);
const roomById = Object.fromEntries(knobDesc.rooms.map((r) => [r.id, r]));

// S2 connectors: three statements and the element each one drew.
const s2 = [
  { key: "room", line: lineOf(knobSrc, /^\s*room id=r_bed\b/, "S2 room line"), box: roomById.r_bed.bbox },
  {
    key: "door",
    line: lineOf(knobSrc, /^\s*door between r_live and r_bed\b/, "S2 door line"),
    box: elementBox(knobScene, knobDesc.doors.find((d) => d.between.join() === "r_live,r_bed").id),
  },
  {
    key: "window",
    line: lineOf(knobSrc, /^\s*window on r_bed\.top\b/, "S2 window line"),
    box: elementBox(knobScene, knobDesc.windows.find((w) => w.room === "r_bed").id),
  },
];

// S3 room card: the playground's card facts (room-facts.ts), read from describe.
const live = roomById.r_live;
const names = Object.fromEntries(knobDesc.rooms.map((r) => [r.id, r.label]));
const roomCard = {
  name: live.label,
  area_net_m2: live.net_area_m2,
  area_centreline_m2: live.area_m2,
  size_mm: { w: live.bbox.w, h: live.bbox.h },
  use: live.uses.join(", "),
  neighbours: live.adjacent.map((id) => names[id]),
  doors: knobDesc.doors.filter((d) => d.between.includes("r_live")).length,
  windows: knobDesc.windows.filter((w) => w.room === "r_live").length,
  openings: (knobDesc.openings ?? []).filter((o) => o.between.includes("r_live")).length,
  box: live.bbox,
};

// S3 sheet: knob flat with `finish --only sheet` (paper, scale, schedule, legend).
const sheetR = arch(["finish", "-", "-o", "-", "--only", "sheet", "--json"], knobSrc);
assert(sheetR.json && sheetR.json.ok, "finish --only sheet on knob-flat");
const knobSheetSrc = sheetR.json.source ?? null;
assert(typeof knobSheetSrc === "string" && knobSheetSrc.includes("schedule rooms"), "knob sheet source has `schedule rooms`");
const knobSheetSvg = compileSvg(knobSheetSrc, "knob-flat sheet");
assert(/NET AREA/i.test(knobSheetSvg), "knob sheet draws a NET AREA column");
write("knob-flat.sheet.svg", knobSheetSvg);
// Where the schedule sits on the sheet: read off the sheet's own text positions.
function textAt(svg, label) {
  const m = new RegExp(`<text x="([-\\d.]+)" y="([-\\d.]+)" font-size="([\\d.]+)"[^>]*>${label}</text>`).exec(svg);
  assert(m, `sheet text "${label}"`);
  return { x: Number(m[1]), y: Number(m[2]), size: Number(m[3]) };
}
const schedTop = textAt(knobSheetSvg, "ROOM SCHEDULE");
const schedTotal = textAt(knobSheetSvg, "TOTAL");
const schedNet = textAt(knobSheetSvg, "NET AREA \\(m²\\)");
const scheduleBox = {
  x: schedTop.x - 2 * schedTop.size,
  y: schedTop.y - 2 * schedTop.size,
  w: schedNet.x - schedTop.x + 4 * schedTop.size,
  h: schedTotal.y - schedTop.y + 4 * schedTop.size,
};
writeFileSync(join(SRC, "knob-flat.sheet.arch"), `# knob-flat.sheet.arch: written by scripts/bake.mjs: \`archlang finish --only sheet\` on knob-flat.arch.\n${knobSheetSrc}`);

// determinism: the same text twice, the same bytes.
const again = compileSvg(knobSrc, "knob-flat (again)");
assert(sha(again) === sha(knobSvg), "the same source compiles to byte-identical SVG");

// ---------------------------------------------------------------------------------------------
// 3. S4: LIVING from its written value to +30 %, in grid steps, each compiled

const livingLet = /let LIVING = (\d+)/.exec(knobSrc);
const gridM = /^\s*grid (\d+)/m.exec(knobSrc);
assert(livingLet && gridM, "knob-flat has `let LIVING` and `grid`");
const living0 = Number(livingLet[1]);
const grid = Number(gridM[1]);
const living1 = Math.round((living0 * 1.3) / grid) * grid;
const sweep = [];
for (let v = living0; v <= living1; v += grid) {
  const src = knobSrc.replace(`let LIVING = ${living0}`, `let LIVING = ${v}`);
  const svg = compileSvg(src, `LIVING=${v}`);
  write(`sweep/living-${v}.svg`, svg);
  const d = describeJson(src, `LIVING=${v}`);
  sweep.push({ value: v, net_m2: d.totals.net_floor_area_m2, rooms: d.totals.rooms, viewBox: viewBoxOf(svg), file: `baked/sweep/living-${v}.svg` });
}
const endSrc = knobSrc.replace(`let LIVING = ${living0}`, `let LIVING = ${living1}`);
const endLint = lintJson(endSrc, "LIVING end value");
assert(findings(endLint).length === 0, `LIVING = ${living1} lints clean`);
const impact = arch(["impact", join(SRC, "knob-flat.arch"), "--set", `LIVING=${living1}`, "--json"]);
assert(impact.json && impact.json.ok, "impact --set LIVING runs");
const tokenCol = lines(knobSrc)[lineOf(knobSrc, /let LIVING =/, "LIVING let") - 1].indexOf(String(living0));

// ---------------------------------------------------------------------------------------------
// 4. S1, S5: broken flat, its findings, and the fixes

const brokenSvg = compileSvg(brokenSrc, "broken-flat");
const step1Svg = compileSvg(step1Src, "broken-flat step1");
const fixedSvg = compileSvg(fixedSrc, "broken-flat fixed");
const brokenChecks = withChecks(brokenSvg, brokenSrc);
const step1Checks = withChecks(step1Svg, step1Src);
write("broken-flat.svg", brokenSvg);
write("broken-flat.checks.svg", brokenChecks.svg);
write("broken-flat.step1.svg", step1Svg);
write("broken-flat.step1.checks.svg", step1Checks.svg);
write("broken-flat.fixed.svg", fixedSvg);
const lintBefore = lintJson(brokenSrc, "broken-flat");
const lintStep1 = lintJson(step1Src, "broken-flat step1");
const lintAfter = lintJson(fixedSrc, "broken-flat fixed");
write("lint-before.json", JSON.stringify(lintBefore, null, 2));
write("lint-after.json", JSON.stringify(lintAfter, null, 2));
const before = findings(lintBefore);
assert(before.length === 2, `broken-flat has exactly two findings (found ${before.map((f) => f.code).join(",")})`);
const brokenDesc = describeJson(brokenSrc, "broken-flat");
const bedAccess = brokenDesc.access.rooms.find((r) => r.id === "r_bed");
assert(bedAccess && bedAccess.reachable === false, "describe: the bedroom cannot be reached");
const bedLine = lineOf(brokenSrc, /^\s*room id=r_bed\b/, "broken bedroom line");
const reach = before.find((f) => f.line === bedLine);
assert(reach, "a finding sits on the bedroom's line");
assert(["W_ROOM_DISCONNECTED", "W_ROOM_UNREACHABLE"].includes(reach.code), `the bedroom finding is a reachability code (${reach.code})`);
const second = before.find((f) => f !== reach);
assert(second.code === "W_FURNITURE_OVER_WINDOW", `the second finding is W_FURNITURE_OVER_WINDOW (${second.code})`);
assert(second.line === lineOf(brokenSrc, /^\s*furniture wardrobe/, "wardrobe line"), "the second finding sits on the wardrobe line");
assert(/slide it 500 mm/.test(second.hint), "the wardrobe hint says to slide it 500 mm");
const step1 = findings(lintStep1);
assert(step1.length === 1 && step1[0].code === second.code, "after the door fix only the wardrobe finding is left");
assert(findings(lintAfter).length === 0, "broken-flat.fixed.arch lints clean");
assert(brokenChecks.marks.length === 2 && brokenChecks.marks.every((m) => m.ringed.length > 0), "both findings are ringed");
const doorLineFixed = lineOf(step1Src, /^\s*door between r_live and r_bed\b/, "restored door line");
// S5's source panel: the exact text it shows in each state (the broken file; the door line typed
// back in after the front door; the wardrobe slid), each linted as shown, so the line a finding card
// names is the line on screen (gate-facts walks the scene and checks it).
const brokenLines = brokenSrc.split("\n");
const frontIdx = brokenLines.findIndex((l) => /^\s*door id=d_front\b/.test(l));
assert(frontIdx >= 0, "broken-flat has the front door line");
const panel1 = [...brokenLines.slice(0, frontIdx + 1), DOOR_LINE, ...brokenLines.slice(frontIdx + 1)].join("\n");
const panel2 = panel1.replace(WARDROBE_BAD, WARDROBE_OK);
assert(panel2 !== panel1, "S5 panel: the wardrobe line is in the door-fixed text");
const panel = [brokenSrc, panel1, panel2].map((source, i) => ({ source, findings: findings(lintJson(source, `S5 panel state ${i}`)) }));
assert(JSON.stringify(panel[0].findings.map((f) => f.code)) === JSON.stringify(before.map((f) => f.code)), "S5 panel state 0 is the broken file");
assert(panel[1].findings.length === 1 && panel[1].findings[0].code === second.code, "S5 panel state 1: only the wardrobe finding is left");
assert(panel[2].findings.length === 0, "S5 panel state 2 lints clean");

// ---------------------------------------------------------------------------------------------
// 5. S6: finish, then themes

const finR = arch(["finish", "-", "-o", "-", "--json"], bareSrc);
assert(finR.json && finR.json.ok && finR.json.changed, "finish on laneway-bare changes it");
const finishedSrc = finR.json.source;
assert(typeof finishedSrc === "string", "finish --json returns the finished source");
assert((finR.json.unresolved ?? []).length === 0, "finish leaves no room unresolved on laneway-bare");
const furnAdded = finR.json.changes.filter((c) => c.statement === "furniture");
const sheetAdded = finR.json.changes.filter((c) => c.stage === "sheet");
for (const s of ["title", "scale", "schedule", "legend"])
  assert(sheetAdded.some((c) => c.statement === s), `finish adds \`${s}\``);
assert(furnAdded.length >= 6, "finish adds at least six pieces");
writeFileSync(join(SRC, "laneway-finished.arch"), finishedSrc);
// The terminal S6 shows: the CLI's own words for `finish plan.arch`, run on a copy named plan.arch.
const demoDir = join(OUT, "finish-demo");
mkdirSync(demoDir, { recursive: true });
writeFileSync(join(demoDir, "plan.arch"), bareSrc);
const demo = spawnSync(process.execPath, [CLI, "finish", "plan.arch"], { cwd: demoDir, encoding: "utf8" });
assert(demo.status === 0, `finish plan.arch exits 0 (${demo.stderr.slice(0, 200)})`);
assert(lf(read(join(demoDir, "plan.arch"))) === lf(finishedSrc), "finish in place gives the same source as finish --json");
const finishTerminal = lf(demo.stderr + demo.stdout)
  .split("\n")
  .filter((l) => l.trim() !== "");
const bareSvg = compileSvg(bareSrc, "laneway-bare");
const finishedSvg = compileSvg(finishedSrc, "laneway-finished");
assert(findings(lintJson(finishedSrc, "laneway-finished")).length === 0, "laneway-finished lints clean");
write("laneway-bare.svg", bareSvg);
write("laneway-finished.svg", finishedSvg);
const THEMES_SHOWN = ["blueprint", "presentation", "rendered"];
for (const t of THEMES_SHOWN) assert(Object.keys(core.THEMES).includes(t), `theme ${t} exists`);
const themeLineAt = /^(\s*units mm\n)/m;
assert(themeLineAt.test(finishedSrc), "laneway-finished has `units mm`");
const themed = {};
for (const t of THEMES_SHOWN) {
  const src = finishedSrc.replace(themeLineAt, `$1  theme ${t}\n`);
  const svg = compileSvg(src, `theme ${t}`);
  write(`laneway-finished.${t}.svg`, svg);
  themed[t] = `baked/laneway-finished.${t}.svg`;
}

// ---------------------------------------------------------------------------------------------
// 6. S8: exports of the finished plan, and thumbnails rasterised from each file

const finPath = join(SRC, "laneway-finished.arch");
const exp = {};
for (const f of ["svg", "dxf", "pdf", "png"]) {
  const out = join(OUT, `export/plan.${f}`);
  mkdirSync(dirname(out), { recursive: true });
  const r = arch(["compile", finPath, "-o", out, "-f", f, "--json"]);
  assert(r.status === 0 && existsSync(out), `export ${f} (${r.stderr.slice(0, 200)})`);
  exp[f] = { file: `baked/export/plan.${f}`, bytes: readFileSync(out).length };
}
const glbOut = join(OUT, "export/plan.glb");
const g = arch3d(["build", finPath, "-o", glbOut, "--json"]);
assert(g.status === 0 && g.json && g.json.ok, `archlang3d build of the finished plan (${g.stderr.slice(0, 200)})`);
exp.glb = { file: "baked/export/plan.glb", bytes: readFileSync(glbOut).length };
// thumbnails
write("export/thumb-svg.png", png(read(join(OUT, "export/plan.svg")), 640));
write("export/thumb-png.png", png(read(join(OUT, "export/plan.svg")), 640)); // replaced below by the PNG itself, downscaled
{
  // The PNG card shows the exported PNG itself.
  copyFileSync(join(OUT, "export/plan.png"), join(OUT, "export/thumb-png.png"));
}
const dxfText = read(join(OUT, "export/plan.dxf"));
const dxfView = dxfToSvg(dxfText);
write("export/thumb-dxf.svg", dxfView.svg);
write("export/thumb-dxf.png", png(dxfView.svg, 640));
const pdftoppm = spawnSync("pdftoppm", ["-v"], { encoding: "utf8" });
let pdfThumb = false;
if (pdftoppm.error === undefined) {
  const r = spawnSync("pdftoppm", ["-png", "-r", "48", "-singlefile", join(OUT, "export/plan.pdf"), join(OUT, "export/thumb-pdf")], { encoding: "utf8" });
  pdfThumb = r.status === 0 && existsSync(join(OUT, "export/thumb-pdf.png"));
}
assert(pdfThumb, "pdftoppm rasterised the PDF (install poppler: D:\\tools\\poppler)");
const pdfHead = readFileSync(join(OUT, "export/plan.pdf")).subarray(0, 8).toString("latin1");
assert(pdfHead.startsWith("%PDF-"), "the PDF starts with %PDF-");
const glbNodes = await readGlbNodes(new Uint8Array(readFileSync(glbOut)));
const glbKinds = {};
for (const n of glbNodes.nodes) {
  const k = n.name.split(":")[0];
  glbKinds[k] = (glbKinds[k] ?? 0) + 1;
}

// ---------------------------------------------------------------------------------------------
// 7. S7, S10: GLBs and the gallery

const examples = readdirSync(EXAMPLES)
  .filter((f) => f.endsWith(".arch"))
  .map((f) => f.replace(/\.arch$/, ""))
  .sort();
const gallery = [];
mkdirSync(join(OUT, "glb"), { recursive: true });
mkdirSync(join(OUT, "gallery"), { recursive: true });
for (const ex of examples) {
  const p = join(EXAMPLES, `${ex}.arch`);
  const c = arch(["compile", p, "-o", join(OUT, `gallery/${ex}.svg`), "-f", "svg", "--json"]);
  const compiled = c.status === 0 && c.json && c.json.ok;
  const b = arch3d(["build", p, "-o", join(OUT, `glb/${ex}.glb`), "--json"]);
  const built = b.status === 0 && b.json && b.json.ok;
  // Multi-storey plans write one SVG per level (<stem>.L<n>.svg): show the lowest storey.
  let svgFile = `gallery/${ex}.svg`;
  if (compiled && !existsSync(join(OUT, svgFile))) {
    const lv = readdirSync(join(OUT, "gallery")).filter((f) => f.startsWith(`${ex}.L`) && f.endsWith(".svg")).sort();
    assert(lv.length > 0, `${ex}: compile wrote an SVG`);
    svgFile = `gallery/${lv[0]}`;
  }
  if (compiled && built) gallery.push({ name: ex, svg: `baked/${svgFile}`, glb: `baked/glb/${ex}.glb` });
}
for (const need of ["furnished-flat", "two-storey", "knob-flat", "courtyard-house", "hillside-villa"])
  assert(gallery.some((x) => x.name === need), `${need} compiles and builds in 3D`);
const twoStoreyDesc = arch(["describe", join(SRC, "two-storey.arch"), "--json"]).json;
assert(twoStoreyDesc && Array.isArray(twoStoreyDesc.levels), "describe two-storey lists its levels");
const twoStoreyLevels = twoStoreyDesc.levels.length;
assert(twoStoreyLevels >= 2, "two-storey has at least two storeys");

// ---------------------------------------------------------------------------------------------
// 8. S9: the ways in, from the archlang repo's site-shared/doors.json (copied to source/)

const doors = JSON.parse(read(join(SRC, "doors.json")));
const doorOrder = doors.order.readme.map((k) => ({ key: k, label: doors.doors[k].label }));

// ---------------------------------------------------------------------------------------------
// 9. links (the playground opens exactly our file)

const links = {};
for (const f of ["knob-flat", "broken-flat", "furnished-flat"]) {
  const r = arch(["link", join(SRC, `${f}.arch`), "--json"]);
  assert(r.json && r.json.playground, `archlang link ${f}`);
  links[f] = r.json.playground;
}

// ---------------------------------------------------------------------------------------------
// 9b. S9 agent session (docs/narration.md): every command the simulated agent runs, run here for
// real on a real file named plan.arch, its output saved. A first draft with one real finding (the
// knob flat without its bedroom window), the fix (the shipped window line put back), then finish.

const AGENT = join(OUT, "agent");
const AGENT_WORK = join(AGENT, "work");
mkdirSync(AGENT_WORK, { recursive: true });
const BED_WINDOW = "  window on r_bed.top  width 1200";
assert(knobSrc.split("\n").filter((l) => l === BED_WINDOW).length === 1, "knob-flat has the bedroom window line");
const draftSrc = knobSrc
  .split("\n")
  .filter((l) => l !== BED_WINDOW)
  .join("\n");
writeFileSync(join(SRC, "agent-draft.arch"), draftSrc);
const PREFIX = "npx -y @chanmeng666/archlang";
/** Pick top-level keys of a JSON result, in the CLI's own order and indentation (a crop, not an edit). */
function crop(stdout, keys) {
  const j = JSON.parse(stdout);
  const out = {};
  for (const k of Object.keys(j)) if (keys.includes(k)) out[k] = j[k];
  const kept = JSON.stringify(out, null, 2).split("\n");
  const all = Object.keys(j);
  const dropped = all.filter((k) => !keys.includes(k));
  if (!dropped.length) return kept;
  const body = kept.slice(0, -1);
  // The CLI's own line keeps its comma when a cropped key follows it.
  const lastKept = Math.max(...keys.map((k) => all.indexOf(k)));
  if (lastKept < all.length - 1 && body.length > 1) body[body.length - 1] += ",";
  return [...body, `  … (${dropped.length} more keys)`, "}"];
}
function agentRun(args, keep) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: AGENT_WORK, encoding: "utf8", maxBuffer: 1 << 26 });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, lines: keep(r) };
}
writeFileSync(join(AGENT_WORK, "plan.arch"), draftSrc);
const steps = [];
const spec = agentRun(["spec"], (r) => r.stdout.split("\n").filter((l) => l.trim() && !l.startsWith("<!--")).slice(0, 4));
assert(spec.status === 0, "agent: spec runs");
steps.push({ kind: "run", cmd: `${PREFIX} spec`, exit: spec.status, out: [...spec.lines, "…"] });
steps.push({ kind: "write", file: "plan.arch", text: draftSrc });
const c1 = agentRun(["compile", "plan.arch", "-o", "plan.svg", "--json"], (r) => crop(r.stdout, ["ok", "format", "bytes", "diagnostics"]));
assert(c1.status === 0, "agent: the draft compiles");
steps.push({ kind: "run", cmd: `${PREFIX} compile plan.arch -o plan.svg --json`, exit: c1.status, out: c1.lines });
const d1 = agentRun(["describe", "plan.arch", "--json", "--select", "totals"], (r) => crop(r.stdout, ["ok", "totals"]));
assert(d1.status === 0, "agent: describe runs");
steps.push({ kind: "run", cmd: `${PREFIX} describe plan.arch --json --select totals`, exit: d1.status, out: d1.lines });
const v1 = agentRun(["validate", "plan.arch", "--strict", "--json"], (r) => crop(r.stdout, ["summary", "ok", "diagnostics"]));
const v1j = JSON.parse(v1.stdout);
assert(v1.status === 2 && v1j.diagnostics.length === 1 && v1j.diagnostics[0].code === "W_BEDROOM_NO_WINDOW", "agent: the draft has exactly one finding, W_BEDROOM_NO_WINDOW");
steps.push({ kind: "run", cmd: `${PREFIX} validate plan.arch --strict --json`, exit: v1.status, out: v1.lines, finding: v1j.diagnostics[0].code });
const fixedAgentSrc = knobSrc;
writeFileSync(join(AGENT_WORK, "plan.arch"), fixedAgentSrc);
steps.push({ kind: "edit", file: "plan.arch", after: "  window on r_live.top width 1800", add: BED_WINDOW });
const v2 = agentRun(["validate", "plan.arch", "--strict", "--json"], (r) => crop(r.stdout, ["summary", "ok", "diagnostics"]));
assert(v2.status === 0 && JSON.parse(v2.stdout).ok, "agent: the fixed plan validates clean under --strict");
steps.push({ kind: "run", cmd: `${PREFIX} validate plan.arch --strict --json`, exit: v2.status, out: v2.lines });
const fin = agentRun(["finish", "plan.arch"], (r) =>
  lf(r.stderr + r.stdout)
    .split("\n")
    .filter((l) => /^\s*added\b|✓/.test(l))
    .map((l) => l.replace(/ — .*$/, "")),
);
assert(fin.status === 0 && fin.lines.length > 1, "agent: finish runs and adds statements");
steps.push({ kind: "run", cmd: `${PREFIX} finish plan.arch`, exit: fin.status, out: fin.lines });
const c2 = agentRun(["compile", "plan.arch", "-o", "plan.svg", "--json"], (r) => crop(r.stdout, ["ok", "format", "bytes", "diagnostics"]));
assert(c2.status === 0, "agent: the finished plan compiles");
steps.push({ kind: "run", cmd: `${PREFIX} compile plan.arch -o plan.svg --json`, exit: c2.status, out: c2.lines });
const agentFinished = lf(read(join(AGENT_WORK, "plan.arch")));
assert(findings(lintJson(agentFinished, "agent finished")).length === 0, "agent: the finished plan lints clean");
copyFileSync(join(AGENT_WORK, "plan.svg"), join(AGENT, "plan.svg"));
writeFileSync(join(SRC, "agent-finished.arch"), agentFinished);
writeFileSync(join(AGENT, "session.json"), JSON.stringify({ steps }, null, 2) + "\n");
rmSync(AGENT_WORK, { recursive: true, force: true });

// ---------------------------------------------------------------------------------------------
// 10. facts (caption slots) and layout (what the scenes place)

/** A fact's spoken form for the voice (`m²` → "square metres"); derived here, never typed. */
const spokenM2 = (n) => `${n} square metres`;
const knobLines = sourceLines(knobSrc);
const facts = {
  _note: "Written by scripts/bake.mjs. Never hand-edit; re-run `npm run bake`.",
  pins: { core: corePkg.version, archlang3d: d3Pkg.version },
  knob: {
    lines: knobLines,
    rooms: knobDesc.totals.rooms,
    net_m2: knobDesc.totals.net_floor_area_m2,
    brief_m2: Math.round(knobDesc.totals.net_floor_area_m2 / 5) * 5,
    net_m2_spoken: spokenM2(knobDesc.totals.net_floor_area_m2),
    brief_m2_spoken: spokenM2(Math.round(knobDesc.totals.net_floor_area_m2 / 5) * 5),
    facts_line: `${knobLines} lines of ArchLang → ${knobDesc.totals.rooms} rooms · ${knobDesc.totals.net_floor_area_m2} m² (net)`,
  },
  broken: { reach_code: reach.code, second_code: second.code, findings_before: before.length, findings_after: findings(lintAfter).length },
  sweep: {
    let: "LIVING",
    from_mm: living0,
    to_mm: living1,
    steps: sweep.length,
    net_from_m2: sweep[0].net_m2,
    net_to_m2: sweep[sweep.length - 1].net_m2,
    changed: impact.json.changed.length,
    held: impact.json.held.length,
    broke: impact.json.diagnostics.broke.length,
    end_findings: findings(endLint).length,
  },
  finish: { furniture_added: furnAdded.length, sheet_added: sheetAdded.map((c) => c.statement) },
  exports: { formats: ["SVG", "DXF", "PDF", "PNG", "GLB"], dxf_blocks: dxfView.blocks.length, dxf_dimensions: dxfView.dimensions },
  gallery: { count: gallery.length, examples_shipped: examples.length },
  two_storey: { storeys: twoStoreyLevels },
  agent: { finding: v1j.diagnostics[0].code, steps: steps.filter((s) => s.kind === "run").length },
};
assert(facts.gallery.count === facts.gallery.examples_shipped, "every shipped example compiles and builds in 3D");

const layout = {
  _note: "Written by scripts/bake.mjs. Never hand-edit; re-run `npm run bake`.",
  knob: {
    source: knobSrc,
    svg: "baked/knob-flat.svg",
    sheetSvg: "baked/knob-flat.sheet.svg",
    viewBox: knobVB,
    s2,
    roomCard,
    sheetViewBox: viewBoxOf(knobSheetSvg),
    scheduleBox,
  },
  sweep: {
    impactSummary: (Array.isArray(impact.json.summary) ? impact.json.summary : String(impact.json.summary).split("\n")).filter(
      (l) => /^(Lets|Changed|Held|Broke)\b/.test(l),
    ),
    frames: sweep,
    letLine: lineOf(knobSrc, /let LIVING =/, "LIVING"), tokenCol, from: living0, to: living1 },
  broken: {
    source: brokenSrc,
    step1Source: step1Src,
    fixedSource: fixedSrc,
    svg: "baked/broken-flat.svg",
    checksSvg: "baked/broken-flat.checks.svg",
    step1Svg: "baked/broken-flat.step1.svg",
    step1ChecksSvg: "baked/broken-flat.step1.checks.svg",
    fixedSvg: "baked/broken-flat.fixed.svg",
    viewBox: viewBoxOf(brokenSvg),
    findings: before,
    panel,
    marks: brokenChecks.marks.map((m) => ({ n: m.n, code: m.code, boxes: m.ringed.map((r) => r.box) })),
    doorLine: DOOR_LINE.trim(),
    doorLineAt: doorLineFixed,
    wardrobeBad: WARDROBE_BAD.trim(),
    wardrobeOk: WARDROBE_OK.trim(),
  },
  finish: {
    command: "npx @chanmeng666/archlang finish plan.arch",
    terminal: finishTerminal,
    bareSvg: "baked/laneway-bare.svg",
    finishedSvg: "baked/laneway-finished.svg",
    changes: finR.json.changes.map((c) => ({ stage: c.stage, statement: c.statement, text: c.text })),
    themes: THEMES_SHOWN.map((t) => ({ name: t, svg: themed[t] })),
  },
  exports: {
    files: exp,
    thumbs: {
      svg: "baked/export/thumb-svg.png",
      dxf: "baked/export/thumb-dxf.png",
      pdf: "baked/export/thumb-pdf.png",
      png: "baked/export/thumb-png.png",
    },
    dxfBlocks: dxfView.blocks.slice(0, 8),
    glbKinds,
  },
  gallery,
  doors: { order: doorOrder, agentPrompt: doors.agentPrompt, chatgptExample: doors.doors.chatgpt.example, mcpLine: doors.doors.agent.claudeCodeHttp },
  links,
  agent: { session: "baked/agent/session.json", planSvg: "baked/agent/plan.svg", finding: v1j.diagnostics[0].code },
};

writeFileSync(join(DATA, "facts.json"), JSON.stringify(facts, null, 2) + "\n");
writeFileSync(join(DATA, "layout.json"), JSON.stringify(layout, null, 2) + "\n");

// ---------------------------------------------------------------------------------------------
// 11. the manifest: SHA-256 of every output, sorted, so two bakes can be compared byte for byte

function walk(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name), base) : [join(dir, e.name).slice(base.length + 1).replace(/\\/g, "/")],
  );
}
const manifest = { _note: "SHA-256 of every bake output. Two bakes must give the same file.", pins: facts.pins, files: {} };
for (const f of walk(OUT).sort()) manifest.files[`public/baked/${f}`] = sha(readFileSync(join(OUT, f)));
for (const f of ["facts.json", "layout.json"]) manifest.files[`data/${f}`] = sha(readFileSync(join(DATA, f)));
for (const f of readdirSync(SRC).sort()) manifest.files[`source/${f}`] = sha(readFileSync(join(SRC, f)));
writeFileSync(join(DATA, "bake-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

console.log(`bake: ok — ${Object.keys(manifest.files).length} files, manifest ${sha(JSON.stringify(manifest.files)).slice(0, 16)}`);
console.log(`bake: ${facts.knob.facts_line}; gallery ${facts.gallery.count}; sweep ${living0}→${living1} (${sweep.length} steps)`);
