import React, { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import type { Box } from "../data";

const cache = new Map<string, string>();

/** The text of a baked file under public/, loaded once, holding the render until it is in. */
export function useText(path: string): string | null {
  const [text, setText] = useState<string | null>(() => cache.get(path) ?? null);
  const [handle] = useState(() => (cache.has(path) ? null : delayRender(`load ${path}`)));
  useEffect(() => {
    if (handle === null) return;
    fetch(staticFile(path))
      .then((r) => {
        if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
        return r.text();
      })
      .then((t) => {
        cache.set(path, t);
        setText(t);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle, path]);
  return text;
}

/**
 * Prefix every id in an SVG (and every reference to one) so that several inline drawings on one
 * page never share a pattern or a layer id. The drawing itself is untouched.
 */
export function scopeSvg(svg: string, prefix: string): string {
  return svg
    .replace(/\bid="([^"]+)"/g, (_m, id: string) => `id="${prefix}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${prefix}-${id})`)
    .replace(/href="#([^"]+)"/g, (_m, id: string) => `href="#${prefix}-${id}"`)
    .replace(/<svg\b/, '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"');
}

export const LAYERS = ["A-FLOR", "A-WALL", "A-DOOR", "A-GLAZ", "A-FURN", "A-ANNO-DIMS", "A-ANNO-TEXT", "A-ANNO"] as const;

/**
 * A compiled plan, inline, so its layers can be faded one by one (`layers`: opacity per layer id;
 * a layer not named is fully shown). Sized to its box; the viewBox keeps the drawing's scale.
 */
export const PlanSvg: React.FC<{
  src: string;
  prefix: string;
  style?: React.CSSProperties;
  layers?: Partial<Record<string, number>>;
  extraCss?: string;
  /** Show this window of the drawing instead of its own viewBox (a zoom; the drawing is unchanged). */
  viewBox?: Box;
}> = ({ src, prefix, style, layers, extraCss, viewBox }) => {
  const raw = useText(src);
  if (!raw) return null;
  const text = viewBox
    ? raw.replace(/viewBox="[^"]*"/, `viewBox="${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}"`)
    : raw;
  const css = Object.entries(layers ?? {})
    .map(([id, o]) => `#${prefix}-${id}{opacity:${(o ?? 1).toFixed(3)}}`)
    .join("");
  return (
    <div style={{ position: "absolute", ...style }}>
      <style>{css + (extraCss ?? "")}</style>
      <div style={{ width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: scopeSvg(text, prefix) }} />
    </div>
  );
};

/** Map plan millimetres to pixels for a drawing of viewBox `vb` drawn meet-fitted into `frame`. */
export function planToPx(vb: Box, frame: Box) {
  const k = Math.min(frame.w / vb.w, frame.h / vb.h);
  const ox = frame.x + (frame.w - vb.w * k) / 2;
  const oy = frame.y + (frame.h - vb.h * k) / 2;
  return {
    k,
    x: (mm: number) => ox + (mm - vb.x) * k,
    y: (mm: number) => oy + (mm - vb.y) * k,
    box: (b: Box): Box => ({ x: ox + (b.x - vb.x) * k, y: oy + (b.y - vb.y) * k, w: b.w * k, h: b.h * k }),
  };
}
