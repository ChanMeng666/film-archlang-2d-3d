// Captures (F3): the official archlang3d replays as MP4, an orbit of the finished preview in the
// replay's own viewer, the 3D stills for the gallery and the export card, and (optional) the
// playground's Plan | 3D switch. Writes public/captures/** and public/captures/index.json.
//
// Heavy: one browser at a time, one step at a time, and never while another heavy process runs
// (scripts/heavy-guard.mjs is checked before every step). Steps already captured are skipped, so a
// run that stopped can be resumed:   npm run capture [-- --only replays|orbit|stills|playground]
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";
import { SWIFTSHADER_ARGS } from "@chanmeng666/archlang-3d/node";
import { guard } from "./heavy-guard.mjs";
import { buildTimeline, cueOf, s7Parts } from "../src/timings.ts";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const CLI3D = join(ROOT, "node_modules/@chanmeng666/archlang-3d/dist/cli.js");
const OUT = join(ROOT, "public/captures");
const FPS = 30;
const only = (() => {
  const i = process.argv.indexOf("--only");
  return i > 0 ? process.argv[i + 1] : null;
})();
const want = (step) => only === null || only === step;
const layout = JSON.parse(readFileSync(join(ROOT, "data/layout.json"), "utf8"));
mkdirSync(OUT, { recursive: true });
const indexPath = join(OUT, "index.json");
const index = existsSync(indexPath)
  ? JSON.parse(readFileSync(indexPath, "utf8"))
  : { replays: {}, gallery: {}, playground: {} };
const save = () => writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} → exit ${r.status}\n${r.stderr?.slice(-1500)}`);
  return r;
}
/** ffprobe a file's duration in seconds. */
function duration(file) {
  const r = run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  return Number(r.stdout.trim());
}

// ---------------------------------------------------------------------------------------------
// 1. Official replays: `archlang3d view <file> --replay -o x.html --video x.mp4`

// Lengths are the scenes' windows, from the voice timeline (src/timings.ts): S0 enters the knob
// replay at t = 0.5 and holds it to the end of the scene; S7's parts (s7Parts).
const TL = buildTimeline(JSON.parse(readFileSync(join(ROOT, "data/vo-timing.json"), "utf8")));
const PARTS = s7Parts(TL);
const s0 = TL.scenes.find((x) => x.id === "S0");
const s0Tail = (s0.dur - cueOf(TL, "S0", "s0_3").from + 8) / FPS;
const sec = (frames) => Math.round((frames / FPS) * 10) / 10;
const REPLAYS = [
  { name: "knob-flat", file: "source/knob-flat.arch", seconds: Math.ceil(2 * s0Tail * 10) / 10 },
  { name: "furnished-flat", file: "source/furnished-flat.arch", seconds: sec(PARTS.furnished[1] - PARTS.furnished[0] + 14) },
  { name: "two-storey", file: "source/two-storey.arch", seconds: 6.2 },
];
if (want("replays")) {
  for (const r of REPLAYS) {
    if (index.replays[r.name]) continue;
    guard();
    const html = join(OUT, `replay-${r.name}.html`);
    const mp4 = join(OUT, `replay-${r.name}.mp4`);
    console.log(`capture: replay ${r.name} (${r.seconds} s)`);
    const res = run(process.execPath, [
      CLI3D, "view", r.file, "--replay", "-o", html, "--video", mp4,
      "--seconds", String(r.seconds), "--fps", String(FPS), "--size", "1920x1080", "--theme", "light", "--json",
    ]);
    const report = JSON.parse(res.stdout);
    const d = duration(mp4);
    if (Math.abs(d - r.seconds) > 0.5) throw new Error(`${r.name}: ${d} s, planned ${r.seconds} s`);
    index.replays[r.name] = { file: `captures/replay-${r.name}.mp4`, seconds: d, fps: FPS, frames: Math.round(d * FPS), keyFrames: report.keyFrames ?? report.video?.keyFrames ?? null };
    save();
  }
}

// ---------------------------------------------------------------------------------------------
// 2 and 3. In the replay's own viewer (the HTML `view` writes): an orbit, and stills at t = 1.

async function withReplayPage(arch, size, fn) {
  const html = join(OUT, `view-${size}-${arch.replace(/[^a-z0-9-]/gi, "_")}.html`);
  run(process.execPath, [CLI3D, "view", arch, "--replay", "-o", html, "--size", size, "--theme", "light", "--json"]);
  const [w, h] = size.split("x").map(Number);
  const browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
  try {
    const page = await browser.newPage({ viewport: { width: w + 40, height: h + 400 }, deviceScaleFactor: 1 });
    await page.addInitScript(() => {
      window.__replayAutoplay = false;
    });
    await page.goto(`file:///${html.replace(/\\/g, "/")}`);
    await page.waitForFunction(() => window.__ready !== undefined);
    await page.evaluate(() => window.__ready);
    await page.evaluate(() => window.__seek(1));
    const canvas = page.locator("#archlang-replay");
    await fn(page, canvas);
  } finally {
    await browser.close();
    rmSync(html, { force: true });
  }
}

const ORBIT = { arch: "source/furnished-flat.arch", seconds: sec(PARTS.orbit[1] - PARTS.orbit[0] + 8), pxPerFrame: 3 };
if (want("orbit") && !index.orbit) {
  guard();
  console.log("capture: orbit of furnished-flat in the replay viewer");
  const dir = join(OUT, "orbit-frames");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  await withReplayPage(ORBIT.arch, "1920x1080", async (page, canvas) => {
    const b = await canvas.boundingBox();
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    const n = Math.round(ORBIT.seconds * FPS);
    for (let i = 0; i < n; i++) {
      await page.mouse.move(cx - (i + 1) * ORBIT.pxPerFrame, cy, { steps: 1 });
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      await canvas.screenshot({ path: join(dir, `f${String(i).padStart(4, "0")}.png`) });
    }
    await page.mouse.up();
  });
  const mp4 = join(OUT, "orbit-furnished-flat.mp4");
  run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "f%04d.png"), "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", mp4]);
  rmSync(dir, { recursive: true, force: true });
  const d = duration(mp4);
  index.orbit = { file: "captures/orbit-furnished-flat.mp4", seconds: d, fps: FPS, frames: Math.round(d * FPS) };
  save();
}

// Stills: every gallery example (tile 214x150, shot at 2x), the two finale plans large, and the
// finished laneway house for the GLB export card.
const STILLS = [
  ...layout.gallery.map((g) => ({ name: g.name, arch: `node_modules/@chanmeng666/archlang/examples/${g.name}.arch`, size: "428x300" })),
  { name: "courtyard-house", arch: "source/courtyard-house.arch", size: "880x800", key: "courtyard-house" },
  { name: "hillside-villa", arch: "source/hillside-villa.arch", size: "880x800", key: "hillside-villa" },
  { name: "laneway-finished", arch: "source/laneway-finished.arch", size: "660x600" },
];
if (want("stills")) {
  mkdirSync(join(OUT, "stills"), { recursive: true });
  for (const s of STILLS) {
    const file = `captures/stills/${s.name}-${s.size}.png`;
    // The finale's large stills replace the tile still for those two names.
    if (existsSync(join(ROOT, "public", file))) {
      index.gallery[s.name] = file;
      continue;
    }
    guard();
    console.log(`capture: still ${s.name} ${s.size}`);
    await withReplayPage(s.arch, s.size, async (_page, canvas) => {
      await canvas.screenshot({ path: join(ROOT, "public", file) });
    });
    index.gallery[s.name] = file;
    save();
  }
}

// ---------------------------------------------------------------------------------------------
// 4. Optional: the playground's Plan | 3D switch on furnished-flat (the link `archlang link` gives).

if (want("playground") && !index.playground["s7-switch"]) {
  guard();
  console.log("capture: playground Plan | 3D switch (live site)");
  const dir = join(OUT, "pg-video");
  rmSync(dir, { recursive: true, force: true });
  const browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
      recordVideo: { dir, size: { width: 1920, height: 1080 } },
    });
    const page = await ctx.newPage();
    await page.goto(layout.links["furnished-flat"]);
    await page.locator(".pz-stage svg").waitFor({ state: "visible", timeout: 30000 });
    await page.waitForFunction(() => !document.documentElement.hasAttribute("data-booting"), null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    const t0 = Date.now();
    await page.locator("#tab-preview3d").click();
    await page.locator("#preview3d.active").waitFor({ timeout: 30000 });
    await page.waitForTimeout(4000);
    const clickAt = (Date.now() - t0) / 1000;
    await ctx.close();
    const webm = (await import("node:fs")).readdirSync(dir).find((f) => f.endsWith(".webm"));
    const mp4 = join(OUT, "playground-s7-switch.mp4");
    // Keep the last 4 s (from just before the click to the 3D tab open).
    const total = duration(join(dir, webm));
    const start = Math.max(0, total - 4 - Math.max(0, clickAt - 4));
    run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-ss", String(start), "-i", join(dir, webm), "-t", "4", "-r", String(FPS), "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", mp4]);
    index.playground["s7-switch"] = { file: "captures/playground-s7-switch.mp4", seconds: duration(mp4) };
    save();
  } catch (e) {
    console.error(`capture: playground switch could not be driven (${e.message}); S7 keeps the replay. Log it in docs/production-log.md.`);
  } finally {
    await browser.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------------------------
// Check (build plan F3): every capture exists and plays, at its planned length ±0.5 s.
for (const [name, r] of Object.entries(index.replays)) {
  const d = duration(join(ROOT, "public", r.file));
  const plan = REPLAYS.find((x) => x.name === name)?.seconds ?? d;
  if (Math.abs(d - plan) > 0.5) throw new Error(`check: ${name} plays ${d} s, planned ${plan} s`);
}
if (index.orbit && Math.abs(duration(join(ROOT, "public", index.orbit.file)) - ORBIT.seconds) > 0.5) throw new Error("check: orbit length");
save();
console.log(`capture: ok — ${Object.keys(index.replays).length} replays, orbit ${index.orbit ? "yes" : "no"}, ${Object.keys(index.gallery).length} stills, playground ${Object.keys(index.playground).length}`);
