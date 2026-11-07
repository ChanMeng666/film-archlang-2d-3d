# Storyboard: master film (196.4 s with the voice-over, 16:9, 30 fps)

**Round 2 (2026-11-07): voice-over.** The film now has an English voice-over in the owner's cloned
voice (`docs/narration.md`, ElevenLabs `eleven_v4`). The spoken script and its
traces live in `src/copy.ts` (`NARRATION`); `docs/narration.md` is the source of the wording. The
caption tables in each scene below are the round-1 captions, kept for their traces; on screen they
are replaced by subtitles of the voice, one sentence per cue, timed from the character timestamps
in `data/vo-timing.json`. Labels, the typed brief, numbers in the picture and the end card stay.
The film is English only, one master (`MasterEN`) (owner, 2026-11-07).

Each scene lists what is on screen and where every pixel comes from. A `{slot}` is filled from
`data/facts.json` at bake time and is never typed by hand. The "Trace" column names the source
that allows the claim (see `docs/creative-brief.md` § Claims).

Scene lengths follow the voice (`src/timings.ts`): `dur = max(visual minimum, spoken length +
0.6 s)`, with 0.25 s of air before the first word (1.4 s in S0, where the voice waits for the
source to appear). Visual beats inside a scene (the plan drawing in S0, the rings in S1, the
statement highlights in S2, the facts line and the schedule in S3, the impact panel in S4, the
theme swaps in S6, the DXF card in S8, the end card in S11) are placed on the sentence that names
them. Times below are generated from the voice and change only when the voice does.

| # | Time | Scene |
|---|---|---|
| S0 | 0:00.0–0:10.5 | Cold open: text → plan → 3D |
| S1 | 0:10.5–0:27.4 | The problem: looks right, isn't |
| S2 | 0:27.4–0:45.8 | What ArchLang is |
| S3 | 0:45.8–1:01.1 | Exact numbers |
| S4 | 1:01.1–1:18.2 | Change one number |
| S5 | 1:18.2–1:35.8 | It checks itself |
| S6 | 1:35.8–1:47.8 | Finish the sheet, pick a look |
| S7 | 1:47.8–2:14.3 | Into 3D |
| S8 | 2:14.3–2:27.8 | Take it anywhere |
| S9 | 2:27.8–2:52.2 | Use it inside your AI (simulated agent session) |
| S10 | 2:52.2–3:02.2 | Gallery |
| S11 | 3:02.2–3:16.4 | Honest line + end card |

S7's three captures share its 26.5 s by the voice: the furnished-flat replay until "Several
storeys…", the two-storey replay (6.2 s), then the orbit (`src/timings.ts` `s7Parts`).

---|---|---|
| S0 | 0:00–0:07 | Cold open: text → plan → 3D |
| S1 | 0:07–0:17 | The problem: looks right, isn't |
| S2 | 0:17–0:32 | What ArchLang is |
| S3 | 0:32–0:44 | Exact numbers |
| S4 | 0:44–0:56 | Change one number |
| S5 | 0:56–1:10 | It checks itself |
| S6 | 1:10–1:22 | Finish the sheet, pick a look |
| S7 | 1:22–1:42 | Into 3D |
| S8 | 1:42–1:50 | Take it anywhere |
| S9 | 1:50–2:02 | Use it inside your AI |
| S10 | 2:02–2:12 | Gallery |
| S11 | 2:12–2:20 | Honest line + end card |

---

## S0 Cold open (0:00–0:07)

**Picture.** Void background. A one-line brief types itself into a plain prompt box:
"A one-bed flat, living room and kitchen together, about {knob.brief_m2} m²." (`brief_m2` is
describe's net area rounded to the nearest 5 m².) Hard cut to `source/knob-flat.arch` scrolling fast
in JetBrains Mono, then the compiled plan draws itself layer by layer (its own SVG layers: floors and
walls, then doors and glazing, then furniture, then dimensions and text). At 0:04 the plan tilts back
and the walls rise: the official `archlang3d` replay of the same file, entered at its t = 0.5.

**Source.** `source/knob-flat.arch` (copied from the core's `examples/`), compiled SVG and
`archlang3d view --replay --video`.

| en | Trace |
|---|---|
| One text file. | README "Floor plans as code" |
| A dimensioned floor plan. | README one-liner |
| The same file, in 3D. | README "Same source, plan and 3D preview" |

## S1 The problem (0:07–0:17)

**Picture.** Sheet background. A plan that looks finished: `source/broken-flat.arch`, a copy of
the knob flat with the bedroom door deleted (so the bedroom cannot be reached) and one more
everyday mistake. Hold 2 s. Then the Checks rings appear on it, as `arch preview --review` draws
them (or the playground's Checks toggle, screen-captured): a ring on the bedroom, a ring on the
second mistake.

**The second mistake** must still compile and draw (an `E_*` error stops the drawing, so it must be
a `W_*` finding). Chosen against core 1.57.0: a 900×600 wardrobe against the bedroom's top wall at
offset 1100, which stands in front of 500 mm of the 1200 mm bedroom window
(`W_FURNITURE_OVER_WINDOW`). Its plain description is the slot `{broken.second_en}`, written once in `src/copy.ts` next to its code.

**The bedroom finding** is `W_ROOM_DISCONNECTED` ("has no door or opening — it can't be entered"):
the pinned core reports that code, not `W_ROOM_UNREACHABLE`, for a room with no door at all. The
bake also asserts describe's access graph gives the bedroom `reachable: false`.

**Source.** `arch preview --review` on `source/broken-flat.arch`. The finding codes on screen
come from `lint --json`. The bake asserts that the bedroom finding is the reachability code and
that the second finding has the code that `src/copy.ts` pairs with its description, so the
captions stay true.

| en | Trace |
|---|---|
| An AI can draw a plan that looks right. | pain point P1 |
| Look closer: a bedroom you can't walk into. {broken.second_en} | P1, reachability (measured) |
| ArchLang finds both. | positioning: reachability is measured; the second is a lint finding |

## S2 What ArchLang is (0:17–0:32)

**Picture.** Split screen: source left, plan right (built as a replica that draws the compiled SVG;
see the production log). Three lines highlight in turn (`room … "Bedroom"`,
`door between …`, `window on …`) and a plum connector runs from each line to the element it made.

**Source.** `source/knob-flat.arch`, compiled SVG; element ids from `describe --json` locate the
connectors.

| en | Trace |
|---|---|
| ArchLang is a language for floor plans. | README |
| You, or your AI, write rooms, walls, doors and windows as plain text. | messaging-library ArchLang boilerplate |
| The compiler turns it into a drawing. | boilerplate |
| Free and open source (MIT). | README badge, LICENSE |

## S3 Exact numbers (0:32–0:44)

**Picture.** The living room is outlined in plum and a card opens with the playground room card's
fields (area net, size, use, neighbours, doors · windows), every value from `describe --json`. The
playground's facts line appears under the drawing, built the way the playground builds it:
"{knob.lines} lines of ArchLang → {knob.rooms} rooms · {knob.net_m2} m² (net)" (today: 45 lines,
4 rooms, 54 m²). Then the room schedule on the sheet, with its NET AREA column: knob-flat after
`finish --only sheet`, zoomed by viewBox (the drawing is not redrawn).

**Source.** Replica that draws the compiled SVG (no playground capture; see the production log);
the numbers are describe's, and gate-facts re-derives them with the CLI.

| en | Trace |
|---|---|
| Every area is computed from the walls. | positioning: exact areas (measured) |
| {knob.lines} lines → {knob.rooms} rooms · {knob.net_m2} m² | describe --json |
| The same text gives the same drawing, byte for byte. | positioning: byte-identical determinism (measured) |

## S4 Change one number (0:44–0:56)

**Picture.** `LIVING` goes from its written value to +30 % (4500 → 5850 mm) in grid steps: a
frame sequence of compiled SVGs, one per step, drawn at one fixed scale. The plan follows: walls,
doors, windows, furniture and dimensions all move. In the source, only the one number changes
(that token is outlined). The net area (describe's, per step) updates under the drawing. Then the
`archlang impact … --set LIVING=5850` summary appears: Changed (21), Held (3), Broke (0).

No slider is drawn: without a playground capture, a drawn slider would be invented UI.

**Source.** The bake compiles every step; the end value lints clean; `impact --set` gives the counts.

| en | Trace |
|---|---|
| Change one number. | README "Change one line, see what moved" |
| Everything that depends on it follows: walls, doors, furniture, dimensions. | knob-flat.arch header; CHANGELOG 1.56.0 knobs |
| And it lists what moved: {sweep.changed} changed, {sweep.held} held, {sweep.broke} broke. | `impact --set` |

"Nothing else moves" was dropped: `impact` shows the bedroom, bath and their contents move 1350 mm
right when the living room widens, so the line was false.

## S5 It checks itself (0:56–1:10)

**Picture.** Back to `broken-flat.arch`. The findings list slides in: each row has its code,
message and fix hint (real text from `lint --json`). The bedroom finding is selected: its ring
pulses, and the caret jumps to the line in the source. A door line is typed in (the fix the hint
gives), the plan recompiles, and the ring disappears. Then the second finding. End on a clean
plan with a small "0 findings" chip.

The second fix is the one the wardrobe's hint gives: "slide it 500 mm along the wall", so the
`offset 1100` token becomes `600`.

**Source.** `lint --json` before and after; `source/broken-flat.fixed.arch` lints clean on its own
(asserted in the bake and again in gate-facts). It keeps the wardrobe, so it is not byte-equal to
`knob-flat.arch`. Built as a replica drawing the compiled SVGs of the three states (broken, door
restored, fixed); the rings are the review sheet's own groups.

| en | Trace |
|---|---|
| Each problem comes back with a code, the exact line, and a fix. | README "It checks itself" |
| Your AI can read it and fix the plan itself. | README; agents doc |
| Reachability and areas are measured. Other checks are advice. | positioning: the three measurements; README limits |

## S6 Finish the sheet, pick a look (1:10–1:22)

**Picture.** A terminal line types: `npx @chanmeng666/archlang finish plan.arch`. The empty rooms
furnish themselves (bed, sofa, table, kitchen run, WC, basin), and the sheet completes: title
block, scale bar, north arrow, room schedule, legend. Then three quick theme swaps of the same plan,
ending on `theme rendered` (soft material tints).

**Source.** `archlang finish` on `source/laneway-bare.arch` (laneway-house.arch with its
furniture and sheet lines removed; finish adds 10 pieces and paper, scale, dims, schedule, legend
and title, leaves no room unresolved, and the result lints clean). knob-flat was tried first and
left four rooms unfurnished. The terminal shows the CLI's own change log for `finish plan.arch`.
Themes: `blueprint`, then `presentation`, then `rendered`, each from a `theme <name>` line added to
a copy of the finished file.

| en | Trace |
|---|---|
| One command furnishes the empty rooms and completes the sheet. | positioning: `arch finish`; ADR 0024 |
| Title, scale, schedule, legend. | finish adds sheet statements |
| Then pick a look. | CHANGELOG 1.54.0 `rendered` theme |

## S7 Into 3D (1:22–1:42)

**Picture.** The playground's Plan | 3D switch is clicked (screen capture): the drawing becomes its
3D preview. Then the official drafting-order replay of `furnished-flat.arch`, full frame: the plan
draws, the walls rise, doors and windows set in, furniture lands. Then `two-storey.arch`: each
storey rises lifted clear of the one below, then they settle to stand on each other. A slow orbit
of the finished GLB closes the scene.

**Source.** `archlang3d view <file> --replay --video` (official replay; furnished-flat 11.6 s,
two-storey 6.2 s). The orbit is the replay's own HTML viewer at t = 1, its free camera turned by a
slow mouse drag (3 px a frame) and screenshotted frame by frame. The Plan | 3D switch is an optional
live-playground capture laid over the replay's opening when it exists. Nothing is added to the scene
apart from the camera and the background.

| en | Trace |
|---|---|
| Switch the same file to 3D. | CHANGELOG 1.57.0 Plan \| 3D switch |
| Walls, doors, windows, floors, stairs and furniture, all from the plan. | README 3D limits line |
| Every 3D element traces to the plan, and every solid is closed. | README "checked against the plan" |
| Several storeys stack at their real heights. | archlang-3d README Replay |
| A 3D preview in flat colours. No pitched roofs, sections or elevations yet. | README 3D limits line |

## S8 Take it anywhere (1:42–1:50)

**Picture.** The finished plan flies into five file cards that fan out: SVG, DXF (open in a
neutral line viewer to show blocks and dimensions), PDF, PNG, GLB. Each card is a real exported
file's thumbnail.

**Source.** `compile -f svg|dxf|pdf|png` and `archlang3d build -o plan.glb` of the finished
laneway house; thumbnails rasterised from the files themselves: SVG by resvg, PDF by pdftoppm, the
PNG itself, the GLB by its replay still, and the DXF by `scripts/lib/dxf-view.mjs`, a neutral line
viewer that draws the file's own LINE, ARC, CIRCLE and TEXT entities, block INSERTs and DIMENSION
blocks in one ink (no third-party DXF viewer is installed; HATCH is not drawn). The DXF card states
the counted named blocks and dimensions.

| en | Trace |
|---|---|
| Export SVG, DXF, PDF and PNG, and GLB for the 3D preview. | boilerplate; archlang-3d README GLB |
| DXF comes with real blocks and dimensions. | CHANGELOG 1.52.0 DXF blocks |

## S9 Use it inside your AI: simulated agent session

Replaces the round-1 S9 (owner decision 2026-11-07; rules in `docs/narration.md` § S9).

**Picture.** A generic chat panel (left) and terminal (right) in the film's own styling: no
product's look, logo or name. Corner label for the whole scene: "Reenactment · real compiler
output". A simulated cursor clicks the mic; the mic pulses and a
waveform plays while the owner's cloned voice speaks the brief, "Draw me a one-bed flat, living room
and kitchen together, about {knob.brief_m2_spoken}, and check it.", transcribed word by word from
its character timestamps. The message is sent; the cursor clicks Allow on the tool call; the
terminal runs, sped up: `spec`, writes `plan.arch`, `compile … --json`, `describe --json --select
totals`, `validate --strict --json` (one finding, `{agent.finding}` = `W_BEDROOM_NO_WINDOW`, exit 2),
edits `plan.arch` (the bedroom window line), `validate` again (clean), `finish plan.arch`, `compile`.
The cursor opens `plan.svg`: the compiled drawing. Then the five `doors.json` tiles and the
one-line `claude mcp add` install.

**Source.** `public/baked/agent/session.json` and `plan.svg`, written by the bake from real runs of
the pinned CLI on `source/agent-draft.arch` (knob-flat without its bedroom window) and the fixed
file; JSON is cropped to named top-level keys in the CLI's own order and indentation, never edited.
`source/doors.json` for the tiles. The narration's first two lines play after the brief, during the
session; the third ("One line adds it…") lands on the tiles.

## S10 Gallery (2:02–2:12)

**Picture.** A grid of the shipped examples, each tile flipping from its plan to its 3D preview
in a wave across the grid, ending on the courtyard house and the hillside villa large.

**Source.** Every example in the pinned core's `examples/` that compiles and that `archlang3d build`
accepts; the count is `{gallery.count}`, computed in the bake. Plans compiled at a size that suits
the tile, and 3D stills from `archlang3d view` captures.

| en | Trace |
|---|---|
| {gallery.count} example plans ship with it. | bake count |
| Each compiles, and each stands up in 3D. | bake: build succeeded for each |

## S11 Honest line + end card (2:12–2:20)

**Picture.** Sheet background, one line of text, then the end card on Void: the ArchLang logo
(master SVG), the line, two calls to action.

| en | Trace |
|---|---|
| Concept plans to think and decide with, not permit drawings. | positioning: honest permit answer (short) |
| Designs that compile. | docs site hero |
| Try it free: playground.archlang.uk | README |
| npx @chanmeng666/archlang | README |

---

## Copy gate

`npm run gate:copy` fails the build when any caption in `src/copy.ts`, the SRT
file or `docs/post-copy.md` contains a banned word or construction from the brief, contains Chinese
text (the film is English only), or when a `{slot}` is left unfilled. The word list comes from the
brief.

The S11 line "not permit drawings" is the one allowed "not" construction: it is the honest
permit answer, and the positioning file puts it above the style rule.
