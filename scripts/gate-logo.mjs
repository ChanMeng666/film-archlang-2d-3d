// The logo gate: brand/archlang-logo-master.svg is byte-identical to the archlang repo's master
// (pinned SHA-256, and the local archlang checkout when it is there), and the copy Remotion serves
// (public/baked/logo.svg) is the same bytes.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const PINNED = "29ee2a6310e7d2fe0120da55b931f378a7e8c148ca5ae3b429553f9eee8656a8";
const ARCHLANG = process.env.ARCHLANG_REPO ?? "D:/github_repository/archlang";
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

const problems = [];
const ours = sha(join(ROOT, "brand/archlang-logo-master.svg"));
if (ours !== PINNED) problems.push(`brand/archlang-logo-master.svg is ${ours}, pinned ${PINNED}`);
const upstream = join(ARCHLANG, "brand/archlang-logo-master.svg");
let note = "archlang checkout not found; pinned hash only";
if (existsSync(upstream)) {
  const theirs = sha(upstream);
  note = `archlang repo ${theirs === ours ? "matches" : "DIFFERS"}`;
  if (theirs !== ours) problems.push(`the archlang repo's logo is ${theirs}`);
}
const served = join(ROOT, "public/baked/logo.svg");
if (existsSync(served) && sha(served) !== ours) problems.push("public/baked/logo.svg differs from the master");

if (problems.length) {
  console.error("gate-logo: FAIL");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`gate-logo: ok — ${ours.slice(0, 16)}… pinned; ${note}`);
