// Measure a rendered file's loudness with ffmpeg's EBU R128 meter (true peak on):
//   node scripts/loudness.mjs out/preview-en.mp4
// Prints integrated LUFS, loudness range and true peak, against the targets (-14 LUFS, -1 dBTP).
// Append the numbers to docs/production-log.md by hand; a measurement is not a listen.
import { spawnSync } from "node:child_process";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/loudness.mjs <file.mp4>");
  process.exit(3);
}
const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"], {
  encoding: "utf8",
  maxBuffer: 1 << 28,
});
const tail = r.stderr.slice(r.stderr.lastIndexOf("Summary:"));
const num = (re) => {
  const m = re.exec(tail);
  return m ? Number(m[1]) : NaN;
};
const I = num(/I:\s+(-?[\d.]+) LUFS/);
const LRA = num(/LRA:\s+(-?[\d.]+) LU/);
const TP = num(/Peak:\s+(-?[\d.]+) dBFS/);
if (Number.isNaN(I)) {
  console.error(r.stderr.slice(-2000));
  process.exit(1);
}
console.log(`loudness: ${file}`);
console.log(`  integrated ${I} LUFS (target -14), LRA ${LRA} LU, true peak ${TP} dBTP (ceiling -1)`);
console.log(`  ${Math.abs(I + 14) <= 1 && TP <= -1 ? "within target" : "OUT of target: master it (npm run master -- <file>)"}`);
