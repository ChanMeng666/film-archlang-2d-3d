// Fetch every sound in audio/manifest.json, check its SHA-256, and stage it for Remotion.
// Media stays out of git (Mixkit forbids redistributing its files on their own): audio/music,
// audio/sfx and public/audio are gitignored. A file whose hash does not match is deleted and the
// fetch fails; nothing unverified reaches public/.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const manifest = JSON.parse(readFileSync(join(ROOT, "audio/manifest.json"), "utf8"));
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

const index = { files: {} };
let fetched = 0;
for (const a of manifest.assets) {
  const p = join(ROOT, a.path);
  mkdirSync(dirname(p), { recursive: true });
  if (!existsSync(p) || sha(readFileSync(p)) !== a.sha256) {
    const r = await fetch(a.download_url, { headers: { "user-agent": "film-archlang-2d-3d audio fetch" } });
    if (!r.ok) throw new Error(`${a.id}: HTTP ${r.status} from ${a.download_url}`);
    writeFileSync(p, Buffer.from(await r.arrayBuffer()));
    fetched++;
  }
  const got = sha(readFileSync(p));
  if (got !== a.sha256) {
    rmSync(p);
    throw new Error(`${a.id}: SHA-256 ${got} does not match the manifest's ${a.sha256}; file deleted`);
  }
  const pub = join(ROOT, "public/audio", basename(a.path));
  mkdirSync(dirname(pub), { recursive: true });
  copyFileSync(p, pub);
  index.files[a.id] = `audio/${basename(a.path)}`;
  console.log(`audio: ${a.id} ok (${a.sha256.slice(0, 12)}…)`);
}
writeFileSync(join(ROOT, "public/audio/index.json"), JSON.stringify(index, null, 2) + "\n");
console.log(`audio: ${manifest.assets.length} files verified (${fetched} downloaded), staged in public/audio/`);
