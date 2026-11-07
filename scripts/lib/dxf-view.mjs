// A neutral line viewer for the DXF the core exports: it draws the file's own LINE, ARC, CIRCLE
// and TEXT entities, places each INSERT's block and each DIMENSION's block, all in one ink, and
// lists the named blocks it found. It reads the file; it adds nothing that is not in it. HATCH
// entities are skipped (a line viewer shows lines).

function pairs(text) {
  const t = text.split(/\r?\n/);
  const out = [];
  for (let i = 0; i + 1 < t.length; i += 2) out.push([Number(t[i].trim()), t[i + 1]]);
  return out;
}

/** Split a run of group pairs into entity records: { type, codes: Map<code, value[]> }. */
function records(ps) {
  const recs = [];
  let cur = null;
  for (const [c, v] of ps) {
    if (c === 0) {
      cur = { type: v.trim(), g: [] };
      recs.push(cur);
    } else if (cur) cur.g.push([c, v]);
  }
  return recs;
}
const num = (r, c, d = 0) => {
  const hit = r.g.find(([k]) => k === c);
  return hit ? Number(hit[1]) : d;
};
const str = (r, c) => {
  const hit = r.g.find(([k]) => k === c);
  return hit ? hit[1].trim() : "";
};

export function dxfToSvg(text) {
  const recs = records(pairs(text));
  // sections
  const blocks = new Map();
  const entities = [];
  let section = "";
  let block = null;
  for (let i = 0; i < recs.length; i++) {
    const r = recs[i];
    if (r.type === "SECTION") {
      section = str(r, 2);
      continue;
    }
    if (r.type === "ENDSEC") {
      section = "";
      continue;
    }
    if (section === "BLOCKS") {
      if (r.type === "BLOCK") {
        block = { name: str(r, 2), bx: num(r, 10), by: num(r, 20), ents: [] };
        blocks.set(block.name, block);
      } else if (r.type === "ENDBLK") block = null;
      else if (block) block.ents.push(r);
    } else if (section === "ENTITIES") entities.push(r);
  }

  const prims = [];
  const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const grow = (x, y) => {
    box.x0 = Math.min(box.x0, x);
    box.y0 = Math.min(box.y0, y);
    box.x1 = Math.max(box.x1, x);
    box.y1 = Math.max(box.y1, y);
  };
  // affine transform [a b c d e f]: x' = a x + c y + e, y' = b x + d y + f
  const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const mul = (m, n) => [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
  const I = [1, 0, 0, 1, 0, 0];
  let dimensions = 0;

  function draw(ents, m, depth) {
    if (depth > 8) return;
    for (const r of ents) {
      switch (r.type) {
        case "LINE": {
          const [x1, y1] = apply(m, num(r, 10), num(r, 20));
          const [x2, y2] = apply(m, num(r, 11), num(r, 21));
          prims.push(`<line x1="${f(x1)}" y1="${f(-y1)}" x2="${f(x2)}" y2="${f(-y2)}"/>`);
          grow(x1, y1);
          grow(x2, y2);
          break;
        }
        case "CIRCLE":
        case "ARC": {
          const cx = num(r, 10);
          const cy = num(r, 20);
          const rad = num(r, 40);
          const a0 = r.type === "ARC" ? num(r, 50) : 0;
          let a1 = r.type === "ARC" ? num(r, 51) : 360;
          if (a1 <= a0) a1 += 360;
          const steps = Math.max(8, Math.ceil((a1 - a0) / 10));
          const pts = [];
          for (let k = 0; k <= steps; k++) {
            const a = ((a0 + ((a1 - a0) * k) / steps) * Math.PI) / 180;
            const [x, y] = apply(m, cx + rad * Math.cos(a), cy + rad * Math.sin(a));
            pts.push(`${f(x)},${f(-y)}`);
            grow(x, y);
          }
          prims.push(`<polyline points="${pts.join(" ")}"/>`);
          break;
        }
        case "TEXT": {
          const [x, y] = apply(m, num(r, 10), num(r, 20));
          const h = num(r, 40, 100) * Math.hypot(m[0], m[1]);
          const s = str(r, 1).replace(/&/g, "&amp;").replace(/</g, "&lt;");
          prims.push(`<text x="${f(x)}" y="${f(-y)}" font-size="${f(h)}" stroke="none" fill="#111111">${s}</text>`);
          grow(x, y);
          break;
        }
        case "INSERT": {
          const b = blocks.get(str(r, 2));
          if (!b) break;
          const sx = num(r, 41, 1);
          const sy = num(r, 42, 1);
          const rot = (num(r, 50, 0) * Math.PI) / 180;
          const c = Math.cos(rot);
          const s = Math.sin(rot);
          const local = [c * sx, s * sx, -s * sy, c * sy, num(r, 10), num(r, 20)];
          draw(b.ents, mul(m, mul(local, [1, 0, 0, 1, -b.bx, -b.by])), depth + 1);
          break;
        }
        case "DIMENSION": {
          dimensions++;
          const b = blocks.get(str(r, 2));
          if (b) draw(b.ents, m, depth + 1);
          break;
        }
        default:
          break;
      }
    }
  }
  draw(entities, I, 0);
  const pad = Math.max(box.x1 - box.x0, box.y1 - box.y0) * 0.03;
  const vb = [box.x0 - pad, -box.y1 - pad, box.x1 - box.x0 + 2 * pad, box.y1 - box.y0 + 2 * pad];
  const sw = Math.max(vb[2], vb[3]) / 900;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.map(f).join(" ")}" font-family="Arial">` +
    `<rect x="${f(vb[0])}" y="${f(vb[1])}" width="${f(vb[2])}" height="${f(vb[3])}" fill="#ffffff"/>` +
    `<g fill="none" stroke="#111111" stroke-width="${f(sw)}">${prims.join("")}</g></svg>`;
  const named = [...blocks.keys()].filter((n) => !n.startsWith("*"));
  return { svg, blocks: named, dimensions };
}

function f(n) {
  return String(Math.round(n * 10) / 10);
}
