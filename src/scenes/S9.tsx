import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SCREEN, VOICE_BRIEF, subtitle } from "../copy";
import { PlanSvg, useText } from "../components/Svg";
import { facts, layout, TL } from "../data";
import { C, FONT, ease, ramp } from "../theme";

/**
 * S9 Use it inside your AI: a simulated agent session (docs/narration.md § S9). The UI is a generic
 * chat and terminal in the film's own styling, with no product's look, logo or name. The brief is
 * the owner's cloned voice, transcribed word by word from its character timestamps. Every command
 * and every output line is the pinned CLI's, run in the bake (public/baked/agent/session.json) on
 * real files (source/agent-draft.arch, source/agent-finished.arch); long output is cropped, never
 * edited, and the session is sped up. The closing tiles are doors.json's own words.
 */

type Step =
  | { kind: "run"; cmd: string; exit: number; out: string[]; finding?: string }
  | { kind: "write"; file: string; text: string }
  | { kind: "edit"; file: string; after: string; add: string };

const CHAT = { x: 40, y: 90, w: 700, h: 800 };
const TERM = { x: 770, y: 90, w: 1110, h: 800 };
const MIC = { x: CHAT.x + CHAT.w - 70, y: CHAT.y + CHAT.h - 62 };
const ALLOW = { x: TERM.x + TERM.w - 140, y: TERM.y + 60 };
const LH = 21;
const FILE_LINES = 9;

/** The terminal's lines, each with the frame it appears at. */
function terminalLines(steps: Step[], at: number, span: number) {
  const out: Array<{ text: string; t: number; tone?: "cmd" | "plum" | "muted" | "add" }> = [];
  const per = span / steps.length;
  steps.forEach((s, i) => {
    const t0 = Math.round(at + i * per);
    if (s.kind === "run") {
      out.push({ text: `$ ${s.cmd}`, t: t0, tone: "cmd" });
      s.out.forEach((l, j) => out.push({ text: l, t: t0 + 6 + Math.round((j * (per - 10)) / Math.max(1, s.out.length)), tone: s.finding && /W_[A-Z_]+/.test(l) ? "plum" : undefined }));
      if (s.exit !== 0) out.push({ text: `exit ${s.exit}`, t: Math.round(t0 + per - 4), tone: "plum" });
    } else if (s.kind === "write") {
      const lines = s.text.split("\n");
      out.push({ text: `● ${SCREEN.s9_writes.en} ${s.file}`, t: t0, tone: "cmd" });
      lines.slice(0, FILE_LINES).forEach((l, j) => out.push({ text: `  ${l}`, t: t0 + 4 + j, tone: "muted" }));
      out.push({ text: `  … (${lines.length - FILE_LINES} more lines)`, t: t0 + 4 + FILE_LINES, tone: "muted" });
    } else {
      out.push({ text: `● ${SCREEN.s9_edits.en} ${s.file}`, t: t0, tone: "cmd" });
      out.push({ text: `  ${s.after}`, t: t0 + 4, tone: "muted" });
      out.push({ text: `+ ${s.add.trimStart()}`, t: t0 + 8, tone: "add" });
    }
  });
  return out;
}

/** A pointer that glides between the places it clicks. */
function cursorAt(frame: number, keys: Array<{ t: number; x: number; y: number }>) {
  let p = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame >= b.t) p = b;
    else if (frame > a.t) {
      const u = interpolate(frame, [Math.max(a.t, b.t - 22), b.t], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
    }
  }
  return { x: p.x, y: p.y };
}

/** A microphone, drawn here (no emoji font is assumed in the render). */
const Mic: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
    <rect x={9} y={3} width={6} height={11} rx={3} fill={color} />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);

export const S9: React.FC = () => {
  const frame = useCurrentFrame();
  const raw = useText(layout.agent.session);
  const b = TL.s9;
  if (!raw) return null;
  const steps = (JSON.parse(raw) as { steps: Step[] }).steps;
  const words = TL.briefWords;
  const brief = subtitle(VOICE_BRIEF, facts);
  const heard = words.filter((w) => w.from <= frame).map((w) => w.word).join(" ");
  const sent = frame >= b.briefEnd + 6;
  const speaking = words.some((w) => frame >= w.from - 1 && frame <= w.to + 1);
  const listening = frame >= b.micClick && frame < b.briefEnd + 6;
  const runAt = b.sessionAt + 16;
  const lines = terminalLines(steps, runAt, b.openAt - runAt - 20).filter((l) => l.t <= frame);
  const visible = Math.floor((TERM.h - 150) / LH);
  const shown = lines.slice(Math.max(0, lines.length - visible));
  const runs = steps.map((s, i) => ({ s, t: Math.round(runAt + (i * (b.openAt - runAt - 20)) / steps.length) }));
  const allowShown = frame >= b.sessionAt && frame < runAt + 6;
  const planIn = ramp(frame, b.openAt + 6, b.openAt + 20);
  const tiles = ramp(frame, b.tilesAt, b.tilesAt + 16);
  const cur = cursorAt(frame, [
    { t: 0, x: 980, y: 760 },
    { t: b.micClick, x: MIC.x + 22, y: MIC.y + 22 },
    { t: b.sessionAt + 8, x: ALLOW.x + 50, y: ALLOW.y + 18 },
    { t: b.openAt, x: TERM.x + 150, y: TERM.y + TERM.h - 40 },
  ]);
  const clicks = [b.micClick, b.sessionAt + 8, b.openAt];
  const ripple = clicks.map((t) => (frame >= t && frame < t + 14 ? (frame - t) / 14 : -1)).find((x) => x >= 0) ?? -1;
  const panel: React.CSSProperties = { position: "absolute", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 34px rgba(17,17,17,0.10)" };
  return (
    <AbsoluteFill style={{ background: C.sheet, opacity: ramp(frame, 0, 10) }}>
      <AbsoluteFill style={{ opacity: 1 - tiles }}>
        {/* Chat */}
        <div style={{ ...panel, left: CHAT.x, top: CHAT.y, width: CHAT.w, height: CHAT.h, background: "#fff", border: `1px solid ${C.rule}`, fontFamily: FONT.sans }}>
          <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.rule}`, fontSize: 24, fontWeight: 700, color: C.ink }}>{SCREEN.s9_agent.en}</div>
          {sent ? (
            <div style={{ margin: "20px 22px 0 90px", padding: "14px 18px", borderRadius: 14, background: "#efeaff", fontFamily: FONT.sans, fontSize: 24, lineHeight: 1.4, color: C.ink }}>
              <div style={{ fontSize: 16, color: C.muted, marginBottom: 4, fontFamily: FONT.sans }}>{SCREEN.s9_you.en} <Mic size={14} color={C.muted} /></div>
              {brief}
            </div>
          ) : null}
          <div style={{ margin: "16px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
            {runs
              .filter((r) => r.t <= frame && r.s.kind !== "write")
              .map((r, i) => (
                <div key={i} style={{ fontFamily: FONT.mono, fontSize: 15, color: C.muted, padding: "6px 10px", borderRadius: 8, background: C.codeBg, border: `1px solid ${C.rule}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  ▸ {r.s.kind === "run" ? r.s.cmd.replace("npx -y @chanmeng666/archlang ", "archlang ") : `${SCREEN.s9_edits.en} plan.arch`}
                  {r.s.kind === "run" && r.s.exit !== 0 ? <span style={{ color: C.plum, fontWeight: 700 }}>{`  exit ${r.s.exit}`}</span> : null}
                </div>
              ))}
          </div>
          {/* Input with the mic and the live transcription */}
          <div style={{ position: "absolute", left: 18, right: 18, bottom: 18, minHeight: 64, borderRadius: 14, border: `2px solid ${listening ? C.plum : C.rule}`, background: "#fff", padding: "12px 80px 12px 16px", fontFamily: FONT.sans, fontSize: 22, lineHeight: 1.35, color: C.ink, boxSizing: "border-box" }}>
            {!sent ? heard : ""}
            {listening && !sent ? <span style={{ display: "inline-block", width: 3, height: 24, marginLeft: 3, background: C.plum, verticalAlign: "middle", opacity: Math.floor(frame / 8) % 2 }} /> : null}
          </div>
          <div style={{ position: "absolute", left: MIC.x - CHAT.x, top: MIC.y - CHAT.y, width: 44, height: 44, borderRadius: 22, background: listening ? C.plum : C.ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, transform: `scale(${listening ? 1 + 0.08 * Math.sin(frame / 3) : 1})` }}>
            <Mic size={24} color="#fff" />
          </div>
          {listening ? (
            <div style={{ position: "absolute", left: 30, right: 100, bottom: 96, height: 50, display: "flex", alignItems: "center", gap: 4 }}>
              {Array.from({ length: 48 }, (_, i) => {
                const amp = speaking ? 0.25 + 0.75 * Math.abs(Math.sin(frame * 0.7 + i * 1.3) * Math.sin(frame * 0.23 + i * 0.37)) : 0.08;
                return <div key={i} style={{ flex: 1, height: `${Math.round(amp * 100)}%`, background: C.plum, borderRadius: 2, opacity: 0.85 }} />;
              })}
            </div>
          ) : null}
        </div>
        {/* Terminal */}
        <div style={{ ...panel, left: TERM.x, top: TERM.y, width: TERM.w, height: TERM.h, background: "#16191f", border: "1px solid #262a33" }}>
          <div style={{ display: "flex", gap: 8, padding: "14px 18px", borderBottom: "1px solid #262a33" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: "#3a3f4a" }} />
            ))}
            <div style={{ marginLeft: 12, fontFamily: FONT.mono, fontSize: 15, color: "#7d8594" }}>~/plan</div>
          </div>
          <div style={{ padding: "12px 20px", fontFamily: FONT.mono, fontSize: 15.5, lineHeight: `${LH}px`, color: "#e8e4da" }}>
            {shown.map((l, i) => (
              <div
                key={i}
                style={{
                  whiteSpace: "pre",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: l.tone === "cmd" ? "#ffffff" : l.tone === "plum" ? "#b9a3ff" : l.tone === "muted" ? "#7d8594" : l.tone === "add" ? "#b9a3ff" : undefined,
                  fontWeight: l.tone === "cmd" || l.tone === "add" ? 700 : 400,
                }}
              >
                {l.text}
              </div>
            ))}
          </div>
          {allowShown ? (
            <div style={{ position: "absolute", left: ALLOW.x - TERM.x - 360, top: ALLOW.y - TERM.y - 10, display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderRadius: 12, background: "#22262e", border: `1px solid ${C.plum}`, fontFamily: FONT.mono, fontSize: 16, color: "#e8e4da" }}>
              <span>▸ archlang spec · compile · validate · finish</span>
              <span style={{ padding: "6px 16px", borderRadius: 8, background: C.plum, color: "#fff", fontFamily: FONT.sans, fontWeight: 700 }}>{SCREEN.s9_allow.en}</span>
            </div>
          ) : null}
          {frame >= b.openAt - 30 ? (
            <div style={{ position: "absolute", left: 20, bottom: 18, padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.plum}`, color: "#b9a3ff", fontFamily: FONT.sans, fontSize: 18, opacity: ramp(frame, b.openAt - 30, b.openAt - 18) }}>
              {SCREEN.s9_open.en}
            </div>
          ) : null}
        </div>
        {/* The plan the session wrote, as the compiler drew it */}
        {frame >= b.openAt + 6 ? (
          <div style={{ ...panel, left: 360, top: 70, width: 1200, height: 840, background: "#fff", border: `2px solid ${C.plum}`, opacity: planIn, transform: `scale(${0.96 + 0.04 * planIn})` }}>
            <PlanSvg src={layout.agent.planSvg} prefix="s9p" style={{ left: 10, top: 10, width: 1180, height: 820 }} />
          </div>
        ) : null}
        {/* Cursor */}
        <svg style={{ position: "absolute", left: cur.x, top: cur.y, overflow: "visible" }} width={30} height={30}>
          {ripple >= 0 ? <circle cx={2} cy={2} r={6 + ripple * 26} fill="none" stroke={C.plum} strokeWidth={3} opacity={1 - ripple} /> : null}
          <path d="M0 0 L0 24 L7 18 L12 29 L16 27 L11 16 L20 16 Z" fill={C.ink} stroke="#fff" strokeWidth={1.5} />
        </svg>
      </AbsoluteFill>
      {/* Closing tiles: the five ways in, as doors.json names them, and the one-line install */}
      {frame >= b.tilesAt ? (
        <AbsoluteFill style={{ opacity: tiles }}>
          {layout.doors.order.map((o, i) => {
            // Equal weight: the five ways in arrive together (a stagger left the last one half-faded).
            const t = ramp(frame, b.tilesAt, b.tilesAt + 16);
            return (
              <div key={o.key} style={{ position: "absolute", left: 140 + i * 340, top: 250 + (1 - t) * 24, width: 300, height: 200, borderRadius: 18, background: "#fff", border: `2px solid ${C.rule}`, boxShadow: "0 8px 30px rgba(17,17,17,0.08)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 22, boxSizing: "border-box", fontFamily: FONT.sans, fontWeight: 700, fontSize: 32, lineHeight: 1.2, color: C.ink, opacity: t }}>
                {o.label}
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 260, right: 260, top: 560, textAlign: "center", fontFamily: FONT.mono, fontSize: 30, padding: "16px 24px", borderRadius: 12, background: "#fff", border: `3px solid ${C.plum}`, color: C.ink, opacity: ramp(frame, b.tilesAt + 20, b.tilesAt + 36) }}>
            $ {layout.doors.mcpLine}
          </div>
        </AbsoluteFill>
      ) : null}
      {/* The label, for the whole scene */}
      <div style={{ position: "absolute", left: 40, top: 26, padding: "8px 16px", borderRadius: 10, background: "rgba(17,17,17,0.82)", color: "#f5f2ea", fontFamily: FONT.sans, fontSize: 22 }}>{SCREEN.s9_label.en}</div>
    </AbsoluteFill>
  );
};
