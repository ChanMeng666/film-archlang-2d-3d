// Refuse a heavy step (a browser, a render) while another heavy process runs on this laptop, or
// while memory is short (docs/creative-brief.md § Laptop budget; owner's rule 2026-11-07):
//   - a Blender render running            → do not start
//   - free physical memory under 1 GB     → do not start; wait and log it
//   - free physical memory under 3 GB     → previews run with --concurrency=1 (scripts/preview.mjs)
// Override only on the owner's word: HEAVY_OK=1. Never closes anything.
import { execFileSync } from "node:child_process";
import { freemem } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HEAVY = ["blender.exe"];
export const MIN_FREE_GB = 1;
export const LOW_FREE_GB = 3;

export function busy() {
  if (process.platform !== "win32") return [];
  const out = execFileSync("tasklist", ["/FO", "CSV", "/NH"], { encoding: "utf8" }).toLowerCase();
  return HEAVY.filter((name) => out.includes(`"${name}"`));
}

/** Free physical memory in GB (Win32_OperatingSystem.FreePhysicalMemory on Windows). */
export function freeGB() {
  if (process.platform === "win32") {
    try {
      const kb = execFileSync("powershell", ["-NoProfile", "-Command", "(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory"], { encoding: "utf8" });
      const n = Number(kb.trim());
      if (Number.isFinite(n) && n > 0) return n / 1024 / 1024;
    } catch {
      /* fall through */
    }
  }
  return freemem() / 1024 ** 3;
}

/** Exit 1 with a message when a heavy process is running or memory is short. */
export function guard() {
  if (process.env.HEAVY_OK === "1") return;
  const b = busy();
  if (b.length > 0) {
    console.error(`heavy-guard: ${b.join(", ")} is running; one heavy process at a time. Not starting.`);
    process.exit(1);
  }
  const gb = freeGB();
  if (gb < MIN_FREE_GB) {
    console.error(`heavy-guard: only ${gb.toFixed(2)} GB free (< ${MIN_FREE_GB} GB). Not starting; wait and log it.`);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  guard();
  console.log(`heavy-guard: no other heavy process, ${freeGB().toFixed(2)} GB free; go.`);
}
