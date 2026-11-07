# Creative brief: ArchLang, from plan to 3D

Written 2026-11-07. The film is a feature explainer: it shows what ArchLang does today, now that
the same `.arch` file gives a dimensioned 2D plan and a 3D preview.

## The one idea

**Write a few lines of text. Get a precise floor plan that checks itself, then see it stand up in 3D.**

A viewer who has never heard of ArchLang should come away knowing four things:

1. It is a language for floor plans. You write rooms, walls, doors and windows as text, or your AI does.
2. The compiler draws a dimensioned plan, and it measures exact areas and checks that every room can be reached.
3. When something is wrong, it says what, where, and how to fix it.
4. The same file becomes a 3D preview, and they can try it now: free, open source, in the browser or inside their AI.

## Who it is for

- **Primary:** developers and AI-tool users who ask an agent for a floor plan (Claude, ChatGPT,
  Codex, Gemini, Cursor, VS Code), and people curious about "AI + architecture" on X, LinkedIn and YouTube.
- **Secondary:** self-builders and architecture students who want a quick, exact concept plan.

Plain words throughout. The code is shown as **text you or your AI write**. The film never asks the
viewer to learn a programming language, and it never shows code as the thing being sold.

## What the film must answer

| Viewer question | Scene that answers it |
|---|---|
| P1: AI plans look right but hold visible errors (doors, entrances, stairs). Does this catch them? | S1, S5 |
| P2: How can I tell whether the output is usable? | S3, S5 |
| P4: Which tool is it, is it public, how do I install it? | S9, S11 |
| P6: Can I make fast edits? | S4 |
| P8: Does my AI know what the tool can do? | S2, S9 |

- The first 3 seconds show the payoff: text becomes a plan, and the plan becomes 3D.
- Show proof instead of adjectives: a number, a finding, a real compiler run.
- The film shows ArchLang catching mistakes in its own example plans. It never names, shows or mocks
  another tool.

## Claims: what we may say (hard rules)

Every sentence on screen must trace to the maker's positioning and voice notes (kept privately) or
the archlang repo's README / CHANGELOG. `docs/storyboard.md` gives each caption a source.

**Only these three are stated as measurements:** reachability (every room can be reached), exact
areas, and byte-identical output (the same text gives the same drawing). Every other check is
**advisory**, and the film says so once, on screen, in S5.

**Never on screen, in captions, the title or the post copy:**

- "first", "only", "the missing primitive", "replaces architects", "code beats CAD", or any line
  saying ArchLang displaces CAD or BIM.
- "BIM", "3D CAD", "render", "walkthrough". Say "3D preview", never "3D model", for what
  archlang-3d builds. The voice guardrails ban the word "model" in our copy, so write "AI" or
  "your AI tool" too, never "the model".
- "compliant", "permit-ready", "code check", "passes code", or any building-code claim.
- Any clearance, walking distance or door clear width presented as a measurement.
- Any benchmark, score or ranking of AI tools.
- "Not X but Y" constructions.
- Hype words (revolutionary, game-changing,
  magic, seamless, effortless, powerful, blazing fast and the rest), and fake urgency. Put the
  evidence where the adjective would go: "57 lines → 3 rooms · 45.05 m²", not "precise".

**The film says its limits once, plainly** (S7 and S11): concept plans, not permit drawings; the 3D
preview uses flat colours and has no pitched roofs, sections or elevations yet.

## Product truth on screen

- **No invented architecture.** Every plan on screen is compiled by `@chanmeng666/archlang` from a
  `.arch` file in `source/`, and every 3D frame comes from `@chanmeng666/archlang-3d` (its official
  replay, or its GLB). Sister projects that let Blender or hand animation invent geometry later
  threw that work out.
- **Facts are read, never typed.** Room counts, areas, line counts, finding codes and the example
  count come from `describe --json`, `lint --json` and `wc -l` at bake time, and land in
  `data/facts.json`. Captions use template slots filled from that file.
- **Versions are pinned.** Core `1.57.0` and archlang-3d `0.4.0` from npm (exact versions in
  `package.json`). On a bump, re-bake and re-check, and never hand-edit `data/`.
- **The UI we show is the real UI.** For playground moments (Checks, knobs, room facts, Plan | 3D),
  prefer a Playwright screen capture of `playground.archlang.uk` at a fixed viewport. When a coded
  replica is needed for timing, it must draw the compiled SVG, not a mock-up. The voice guide puts
  a real screen recording ahead of a replica with slogan cards, so slogan-only cards appear just
  twice: the cold open's last line and the end card.

## Look and sound

- Brand: Sheet `#f5f2ea`, Ink `#111111`, Plum `#8052ff` (accent only: highlights, cursor, end card),
  Void `#0f1115` for the cold open and end card. Light-first, matching the sites.
- Type: Inter / Inter Display for captions, JetBrains Mono for source. Captions are large (at least
  44 px at 1080p), one idea per card, on screen for at least 1.5 s per 10 words.
- Logo: `brand/archlang-logo-master.svg`, copied byte for byte from the archlang repo. Recolour by
  CSS only, never redraw.
- Pace: calm and clear, about 140 s for the master. Cuts land on music beats.
- Sound: real, licensed recordings only (Mixkit music, Kenney CC0 interface sounds), fetched by
  script with SHA-256 checks and listed in `audio/CREDITS.md`. No AI-generated music or voice. Mix to
  −14 LUFS integrated and −1 dBTP for social. Say plainly that the mix was checked by measurement
  until the owner has listened.
- **No voice-over in v1.** The captions carry the explanation, because most social video is watched
  muted. A voice-over is a v2 option if the owner wants one (record a real voice; never TTS without
  the owner's say-so).

## Languages

- English only (owner, 2026-11-07): the film is for English-speaking viewers. There is no Chinese
  version, no Chinese subtitles and no Chinese text.
- Master: English captions burned in (`archlang-2d-3d-en-16x9.mp4`), plus an English `.srt`, so
  YouTube can carry soft subtitles.
- Caption text lives in one file, `src/copy.ts`, keyed by scene.

## Deliverables

| File | Size | Length | Notes |
|---|---|---|---|
| `archlang-2d-3d-en-16x9.mp4` | 1920×1080, 30 fps | 196.5 s (planned ~140 s; the voice-over set the pace) | Master |
| `archlang-2d-3d-en.srt` | | | Soft subtitles |
| `cut-30s-en-16x9.mp4` | 1920×1080 | 31.5 s | S0 → S5 receipt → S7 → S11 |
| `cut-30s-en-9x16.mp4` | 1080×1920 | 31.5 s | Re-laid out for vertical, never cropped |
| `poster-16x9.png`, `thumb-1280x720.png` | | | Plan half-risen into 3D, with the line |

The 30 s and 9:16 cuts come after the owner approves the master.

## Laptop budget

The laptop has 15 GB of RAM and an integrated GPU, and it froze once under parallel jobs. Run one
heavy process at a time (one render, one bake, one browser). Iterate with half-scale previews
(`--scale=0.5`, `--concurrency=2`). Render the full 1080p master only when the owner says the laptop
is free.

## What would prove this brief wrong

- Owner review: if the master reads as a feature list rather than a story, cut S8 and S10 and
  merge their content into S7 and S11.
- After posting: if the median watch time is under 15 s, the cold open is not working, so lead the
  30 s cut with the 3D rise instead of the brief.
