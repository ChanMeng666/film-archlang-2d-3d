// Master a rendered film's audio (the video stream is copied, never re-encoded):
//   1. a gentle compressor on the mix (acompressor: threshold -24 dB, ratio 3, attack 5 ms,
//      release 120 ms, makeup 0 dB);
//   2. a two-pass loudnorm to I -14 LUFS, TP -1.5 dBTP, LRA 7 LU (pass 1 measures, pass 2 applies
//      the measured values with linear=true where the target allows it);
//   3. a re-measure of the result with the EBU R128 meter (scripts/loudness.mjs).
//   node scripts/master.mjs out/preview-en.mp4        → out/preview-en-master.mp4
// A measurement, not a listen: nobody has heard the result until the log says so.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const input = process.argv[2];
if (!input || !existsSync(input)) {
  console.error("usage: node scripts/master.mjs <rendered.mp4>");
  process.exit(3);
}
const output = input.replace(/\.mp4$/, "-master.mp4");
const TARGET = { I: -14, TP: -1.5, LRA: 7 };
const COMP = "acompressor=threshold=-24dB:ratio=3:attack=5:release=120:makeup=1";

const ff = (args) => spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8", maxBuffer: 1 << 28 });

function r128(file) {
  const r = ff(["-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const tail = r.stderr.slice(r.stderr.lastIndexOf("Summary:"));
  const num = (re) => Number(re.exec(tail)?.[1]);
  return { I: num(/I:\s+(-?[\d.]+) LUFS/), LRA: num(/LRA:\s+(-?[\d.]+) LU/), TP: num(/Peak:\s+(-?[\d.]+) dBFS/) };
}

const before = r128(input);

// Pass 1: measure after the compressor.
const p1 = ff(["-i", input, "-af", `${COMP},loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}:print_format=json`, "-f", "null", "-"]);
const json = p1.stderr.slice(p1.stderr.lastIndexOf("{"), p1.stderr.lastIndexOf("}") + 1);
let m;
try {
  m = JSON.parse(json);
} catch {
  console.error(p1.stderr.slice(-2000));
  process.exit(1);
}

// Pass 2: apply with the measured values; the video is copied.
const ln =
  `loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}` +
  `:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}` +
  `:offset=${m.target_offset}:linear=true:print_format=json`;
const p2 = ff(["-y", "-i", input, "-map", "0:v", "-map", "0:a", "-c:v", "copy", "-af", `${COMP},${ln}`, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", output]);
if (p2.status !== 0) {
  console.error(p2.stderr.slice(-2000));
  process.exit(1);
}
const j2 = p2.stderr.slice(p2.stderr.lastIndexOf("{"), p2.stderr.lastIndexOf("}") + 1);
let mode = "?";
try {
  mode = JSON.parse(j2).normalization_type;
} catch {
  /* keep "?" */
}

const after = r128(output);
const within = Math.abs(after.I - TARGET.I) <= 1 && after.TP <= -1;
console.log(`master: ${input} → ${output}`);
console.log(`  before  integrated ${before.I} LUFS, LRA ${before.LRA} LU, true peak ${before.TP} dBTP`);
console.log(`  pass 1  after the compressor: ${m.input_i} LUFS, true peak ${m.input_tp} dBTP, LRA ${m.input_lra} LU; loudnorm ${mode}`);
console.log(`  after   integrated ${after.I} LUFS, LRA ${after.LRA} LU, true peak ${after.TP} dBTP (target ${TARGET.I} / ${TARGET.TP})`);
console.log(`  ${within ? "within target" : "OUT of target"} — measured, not listened`);
process.exit(within ? 0 : 2);
