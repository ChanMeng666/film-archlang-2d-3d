# Production log

Append-only notes: fallbacks, measurements, open questions.

## 2026-11-07

- Project created. Brief, storyboard and build plan written from the maker's private positioning, voice and research notes and the archlang 1.57.0 / archlang-3d 0.4.0 READMEs and CHANGELOG.

## 2026-11-07 — F1–F6 build (executor session)

### Versions and determinism

- Pins: `@chanmeng666/archlang` 1.57.0, `@chanmeng666/archlang-3d` 0.4.0 (npm, exact). Remotion
  4.0.538 for `remotion`, `@remotion/cli`, `@remotion/media` (released 2026-10-22, 16 days before
  today). React 19.2.9. Fonts: `@fontsource/inter` 5.3.0, `@fontsource/jetbrains-mono` 5.3.0,
  `@fontsource/noto-sans-sc` 5.3.1 (OFL).
- `npm run bake` run twice: identical `data/bake-manifest.json` (149 files, PDF included).
- `npm run gates` green. Each gate was also shown to fail: a post-copy line with "seamless 3D model
  you can render, not a sketch" (4 findings), a hand-edited `knob.net_m2` (manifest and describe
  both caught it), and `--final` without captures or audio.
- `npx remotion compositions`: MasterEN and MasterZH, 1920×1080, 30 fps, 4200 frames (140.00 s).
- SRTs: `out/archlang-2d-3d-en.srt` and `-zh.srt`, 35 cues each; ffmpeg reads both (35 cues out).

### Facts the captions use (data/facts.json)

- knob-flat: 45 lines → 4 rooms · 54 m² (net); brief figure "about 55 m²" (net rounded to 5).
- broken-flat: `W_ROOM_DISCONNECTED` (bedroom) + `W_FURNITURE_OVER_WINDOW` (wardrobe); 0 after fixes.
- LIVING 4500 → 5850 mm in 28 grid steps; net 54 → 63.73 m²; impact: 21 changed, 3 held, 0 broke.
- finish on laneway-bare: 10 pieces; paper, scale, dims, schedule, legend, title.
- DXF: 18 named blocks, 30 dimensions. Gallery: 37 of 37 shipped examples compile and build in 3D.

### Deviations from the storyboard (storyboard updated to match)

1. **S1 bedroom code** is `W_ROOM_DISCONNECTED`, not `W_ROOM_UNREACHABLE`: the pinned core reports
   it for a room with no door. describe's access graph also gives `reachable: false` (asserted).
2. **S1 second mistake**: a 900×600 wardrobe at offset 1100 against the bedroom's top wall, in
   front of 500 mm of the window. The fix is the hint's own "slide it 500 mm" (offset 600), so
   `broken-flat.fixed.arch` keeps the wardrobe and is lint-clean rather than equal to knob-flat.
3. **S0 slot** `{knob.area_m2}` became `{knob.brief_m2}` (net area rounded to 5 m²), since the
   brief says "about". The plan draws by its SVG layers, not element by element.
4. **S3 caption** "…computed from the walls, not estimated." lost "not estimated": the brief bans
   "not X but Y" constructions and allows only the S11 permit "not". zh changed to match.
5. **S4 caption** "Nothing else moves." was false (impact: bedroom and bath move 1350 mm). Replaced
   by the impact counts from facts. The knob slider is not drawn (no capture → no invented UI).
6. **S6 example**: laneway-house (bare copy) instead of knob-flat, where finish left 4 rooms empty.
   Themes shown: blueprint → presentation → rendered.
7. **S7 orbit**: mouse drag of the free camera in the replay's own HTML viewer, not @remotion/three.
8. **S8 DXF thumbnail**: drawn by `scripts/lib/dxf-view.mjs`, a neutral line viewer written here
   (no DXF viewer on the machine). It draws only the file's own entities; HATCH is skipped.
9. **S9 agent capture**: not recorded, so not shown. The scene shows doors.json's own text (ChatGPT
   example prompt, the README agent prompt, the `claude mcp add` line). `source/doors.json` is a
   copy of archlang `site-shared/doors.json` at dbc1d091 (2026-11-06).
10. **S11**: the permit line is shown centre-screen instead of as a bottom caption; it is still a
    caption cue and in the SRTs.

### Fallbacks: replicas instead of playground captures

S2, S3, S4 and S5 are Remotion replicas that draw the baked compiler SVG (inline, by layer), with
real text from `lint --json`, `describe --json`, `impact --json` and the CLI's own `finish` output.
No playground screen capture was made: Blender held the machine for the whole session, and the live
playground deploys from archlang `main`, so a capture can drift from the 1.57.0 pin. The S7
Plan | 3D switch capture is written in `scripts/capture.mjs` (optional; S7 uses it if it exists).

### Audio

- Bed: "Discover" (Mixkit 587), offset 0, fades in over 0.7 s and out over the last 2.3 s.
  Effects: 7 owner-approved files from archlang-cinematic plus 3 new CC0 Kenney interface sounds
  (click_001, select_001, confirmation_001), which the owner has not confirmed yet.
- `npm run audio`: 11 files downloaded and SHA-256-verified; a second run verified all 11 with no
  download.
- Cuts are not yet moved onto the music's beats. **No person has heard the mix.** Loudness has not
  been measured: nothing has been rendered yet (see below).

### Heavy steps NOT run: Blender (PID 16024) was rendering for the whole session

Run these in order, one at a time, only when `Get-Process blender` returns nothing. Each script
checks `scripts/heavy-guard.mjs` itself and refuses while Blender runs.

1. `npm run capture`: 3 replays (`archlang3d view … --replay --video`), the orbit, 40 stills,
   the optional playground switch (uses the Playwright Chromium already in the shared cache,
   156.0.8078.4; no install needed). It can be resumed with `-- --only replays|orbit|stills|playground`.
2. `node scripts/gate-facts.mjs --final`: captures and audio present.
3. `npm run preview`: half-scale MasterEN → `out/preview-en.mp4` (`--scale=0.5 --concurrency=2`).
4. `npm run loudness -- out/preview-en.mp4`: record the integrated LUFS and true peak here; adjust
   `MIX` in `src/Mix.tsx` if it is off -14 LUFS / -1 dBTP, then re-render.
5. `npm run review-stills`: one half-scale still from the middle of each scene → `out/review/`.
6. `npm run preview:zh`: half-scale MasterZH → `out/preview-zh.mp4`.

F7 (full 1080p) and F8 (cuts) are not part of this build.

## 2026-11-07 — Round 2: voice-over, S9 as a simulated agent session

### Voice (ElevenLabs, owner's clone)

- Model `eleven_v4` (per the coordinator's change; the env's model id is read from `.env`, never
  printed). Endpoint `/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128`,
  voice_settings left at the voice's defaults, `previous_text` / `next_text` sent (v4 accepted
  them; the script would have dropped them once and logged it if not).
- **Run 1 (paid): 2,036 characters** in 13 requests (12 scenes + the S9 brief), all HTTP 200.
  No eleven_multilingual_v2 clip was ever generated, so there was nothing stale to drop.
- **Run 2: 0 characters** (all 13 cached by SHA-256 of text, context, voice, model, settings, format).
- Spoken length 172.3 s of narration + 7.4 s brief. Film length follows: **196.4 s (5892 frames)**,
  up from 140 s. S7 is 26.5 s, S9 24.4 s.
- Secrets: values never printed or written; a scan of `data/ scripts/ src/ docs/ audio/manifest.json`
  for the key's prefix found nothing. Clips live in `audio/vo/` (gitignored) and are staged in
  `public/audio/vo/` (gitignored); `data/vo-timing.json` holds only text-derived timing, a
  truncated cache hash and character counts.

### Changes from docs/narration.md and the round-1 build

1. **S0's voice starts at 1.4 s**, not 0.25 s: the typed brief owns the first second, and "One text
   file." lands as the source appears. The plan draws on "Compile it…", the replay rises on "Then
   the same file…".
2. **S9 narration**: lines 1–2 play right after the spoken brief, during the session; line 3 ("One
   line adds it…") is moved to the closing tiles by trimming the same clip (one request, two
   segments). MasterZH subtitles the spoken brief; MasterEN shows its live transcription instead.
3. **S9 commands**: `lint --json` is not run separately; `validate --strict --json` is the CLI's
   parse + resolve + lint gate and carries the finding (`W_BEDROOM_NO_WINDOW`, exit 2). JSON is
   cropped to named top-level keys in the CLI's own order and 2-space indentation (absolute output
   paths are among the cropped keys); the written file shows its first 9 lines and a "… (N more
   lines)" marker. The session is sped up (about 8 s for 9 steps).
4. **S9 draft**: knob-flat without its bedroom window (`source/agent-draft.arch`), so the agent's
   plan is the same flat the brief describes; the fix puts the shipped window line back; `finish`
   then adds paper, scale, schedule and legend.
5. **Music**: the film (196 s) is longer than "Discover" (144 s); the bed loops once. The loop seam
   has not been listened to. It ducks to 0.316 (−10 dB) under every voice span with 150 ms ramps.
6. **S11**: the honest line is now a voiced subtitle over the finished knob-flat sheet; the end card
   arrives on the URL line.
7. The storyboard's per-scene caption tables are kept for their traces; `src/copy.ts` `NARRATION`
   is the live text.

### Loudness, half-scale preview-en (2026-11-07)

`node scripts/loudness.mjs out/preview-en.mp4` (196.4 s, MIX unchanged): **integrated −17.9 LUFS,
LRA 4 LU, true peak −1.2 dBTP**. Target is −14 LUFS / −1 dBTP: 3.9 dB short, with 0.2 dB of peak
headroom.

Levels in `src/Mix.tsx` cannot close it. The voice files are about −20.5 LUFS each with true peaks
−1.3 to −2.9 dBTP (S9 −1.3), a peak-to-loudness ratio of 18–19 dB, so the voice alone at −14 LUFS
would peak near +4.5 dBTP. Meeting both targets needs dynamics: a limiter/compressor on the voice
or the master (e.g. an ffmpeg `loudnorm`/`alimiter` pass after render). Not chosen yet; MIX left
as it was. A measurement, not a listen.

### Audio master (2026-11-07)

`scripts/master.mjs` (`npm run master`; `preview`, `render:en` and `render:zh` run it after the
render and write `*-master.mp4`): video stream-copied; `acompressor` threshold −24 dB, ratio 3,
attack 5 ms, release 120 ms, makeup 0 dB; then a two-pass `loudnorm` to I −14, TP −1.5, LRA 7;
then a re-measure.

| file | before | after compressor (pass 1) | after master |
|---|---|---|---|
| preview-en (pre-fix render) | −17.9 LUFS, −1.2 dBTP, LRA 4 | −24.82 LUFS, −9.82 dBTP, LRA 2.6 | **−14.0 LUFS, −1.4 dBTP, LRA 2.7** |
| preview-zh (pre-fix render) | −17.9 LUFS, −1.2 dBTP, LRA 4 | −24.82 LUFS, −9.82 dBTP, LRA 2.6 | **−14.0 LUFS, −1.4 dBTP, LRA 2.7** |

loudnorm ran in its **dynamic** mode, not linear: after the compressor the mix needs +10.8 dB, and
a linear gain that size would put the peaks over −1.5 dBTP. The true peak measured after AAC
encoding is −1.4, 0.1 dB above the −1.5 target and inside the −1 dBTP ceiling. MIX levels are
unchanged. **Not listened to**: the compression and the dynamic loudnorm on the voice, the music
bed and the effects have only been measured.

### Previews after fix 4 (2026-11-07, evening)

Rendered while the archlang-cinematic 9:16 batch ran (owner: use the spare memory, keep headroom),
`--concurrency=1`. Two runs stopped near frame 4000: remotion.exe's OffthreadVideo cache grew past
3.6 GB over S7's replay videos and free RAM fell to 2.15 GB. With
`--offthreadvideo-cache-size-in-bytes=500000000 --offthreadvideo-video-threads=1
--media-cache-size-in-bytes=300000000` (now in `scripts/preview.mjs`) the lowest free RAM was 5.2 GB.

Master, both languages: −14.0 LUFS, LRA 2.7 LU, true peak −1.4 dBTP. 15 English review stills and 3
Chinese spot checks read. Open: the S9 zh subtitle wraps one character ("检/查。") onto a second
line. Not listened to yet.

## 2026-11-07 — English only (owner decision)

The owner decided the film is for English-speaking viewers only. Chinese is removed completely: the
`MasterZH` composition, the `lang` prop and `Lang` type, every `zh` field in `src/copy.ts`, the zh
branches in the scenes and the subtitle bar, the Noto Sans SC font (`@fontsource/noto-sans-sc`
uninstalled), `preview:zh` and `render:zh`, the zh SRT, and the zh columns and notes in the docs.
`gate-copy` and `gate-facts` keep every English check; `gate-copy` now also fails on any Chinese
text in the copy, the SRT or the post copy. The entries above are history and stay as written.

English output after the change, checked against stills rendered from the commit before it:

- `out/archlang-2d-3d-en.srt` regenerated: byte-identical (SHA-256 c70f0cfd…).
- Half-scale `MasterEN` stills at frames 157, 2610, 4822 and 5678: byte-identical.
- Frame 1603 (S3) differs only inside the facts pill, "45 lines of ArchLang → 4 rooms · 54 m² (net)".
  The "→" (U+2192) is not in the Inter or JetBrains Mono `@fontsource` subsets; it used to come from
  the Noto Sans SC fallback and now comes from a system font Chrome picks. Other glyphs outside
  those subsets may have moved the same way ("✓" in S6, "●" in S9, "→" in terminal and source
  text; not checked frame by frame). The "▸" in the frame-4822 still is unchanged. Open: whether to
  bundle a non-CJK symbol font so those glyphs stop depending on the machine's fonts.

### Symbol font (2026-11-07)

Closes the open item above: `@fontsource/noto-sans-symbols-2@5.2.8` (pinned) sits after Inter and
JetBrains Mono in both stacks and is preloaded before the first frame, so → ✓ ● ▸ no longer fall
back to a system font. Checked on stills f1603, f3054, f4822. The existing preview-en predates it;
the arrow shapes differ slightly, nothing else.

### F7 full render (2026-11-07, owner's go-ahead)

`MasterEN` at 1920×1080, 30 fps, h264 + AAC 48 kHz stereo, 196.5 s, concurrency 1 with the cache
caps, laptop idle (cinematic batch done). Lowest free RAM 6.47 GB. Master
`out/archlang-2d-3d-en-16x9-master.mp4` (38.7 MB, sha256 b8c5d19a520bd3e8…): −14.0 LUFS, LRA 2.7 LU,
true peak −1.4 dBTP. SRT `out/archlang-2d-3d-en.srt`, 37 cues. Spot frames at 20, 100, 150, 190 s
read. Measured, not listened.

## 2026-11-07 — F8: the 30 s cuts (owner's go-ahead after approving the master)

`Cut30` (1920×1080) and `Cut30Vertical` (1080×1920), 942 frames = **31.40 s**, story S0 → S5
receipt → S7 → S11. `npm run render:cut30` / `render:cut30v`; `npm run srt` also writes
`out/cut-30s-en-16x9.srt` and `out/cut-30s-en-9x16.srt` (7 cues each, same timing).

**Voice: the master's cached files only, no ElevenLabs request, no spend.** Whole sentences picked
from `data/vo-timing.json` and played as Segments (`timings.ts` `CUT30`, `buildCut`):

| scene | lines | file seconds | cut seconds (scene start → end) |
|---|---|---|---|
| S0 | s0_1, s0_2, s0_3 | 0.00–8.48 | 0.00–8.90 |
| S5 | s5_1 | 0.00–6.41 | 8.90–15.47 |
| S7 | s7_2 | 3.01–10.53 | 15.47–23.10 |
| S11 | s11_2, s11_3 | 5.77–13.36 | 23.10–31.40 |

The suggested set summed to 34.7 s of voice before any air, so **s5_2 ("So your AI can read it…")
is left out**; the cards on screen carry it. Finding: the alignment's sentence `end` runs on through
the pause to the next sentence's first character, and real onsets come up to 0.11 s before the
alignment `start`. So a cut edge sits 0.15 s before the alignment end (`CUT_EDGE_S`), and
`gate-facts` checks every edge lies between whole sentences and inside a real pause (ffmpeg
silencedetect −40 dB); a red test with the edge moved 0.3 s the other way fails it.

**Claims call.** The brief has the film say its limits once, in S7 and S11; the cut has no time for
the spoken limit lines (s7_5 6.3 s, s11_1 5.9 s). The screen carries them instead: a plum chip
"3D preview · flat colours" on all 3D footage in the cuts (S0's rise, S7), next to S7's existing
"archlang3d replay · official", and "Concept plans, not permit drawings." under the end card. Both
are `SCREEN.cut_*` with traces; `gate-copy` allows the one "not" in `cut_limits` and fails if
either line is missing.

**Picture.** Same scenes with `cut` and `aspect` props, timed through `TimelineContext`. In the
cut, S0 opens on the source with no brief; S5 plays its beats ×1.56 (`s5Speed`) so the "0 findings"
pill is held 18 frames; S7 enters the furnished-flat replay at frame 275 of 507 (the plan on the
sheet, a second before it tilts) and plays to its settled view; S11 opens on the end card. 9:16 is
laid out again: platform UI is assumed over the top 140 px, the bottom 420 px and the right
120 px, so the picture sits in y 140–1270, subtitles (52 px, semibold) have their bottom edge at
y 1500, and text stays in x 40–960. The 3D footage shows capture columns 360–1560 at 0.9×. Tiled
frames of both replays show the model inside those columns throughout, so the model is never cut.
S5 stacks the plan (610 px), the cards (26 px) and a five-line source window that scrolls to the
line each beat is about. The CTA runs over two lines. Review stills (half scale, 10 per cut) were
read; one fix: the vertical S5 plan was too small (`e28d747`).

**Sound.** The master's bed (mixkit-587) from its start, its levels, ducking (−10 dB, 150 ms
ramps) and fades (in 20 frames, out over the last 75). Effects are re-placed on the cut's beats:
the S0 tilt, the S5 clicks and confirmation, the S7 rise, the S11 end card. Cuts follow the
voice; they were **not** moved onto music beats (no beat map exists yet).

**Render.** Full resolution, concurrency 1 with the three cache caps, through the coordinator's
RAM watchdog (`preview-watch.ps1`: 15 s samples, stops at three under 3 GB), one at a time. **This
ran alongside a Blender render** (archlang-cinematic s05, PID 4080, never touched), on the owner's
earlier go-ahead to use spare memory with headroom kept, relayed by the coordinator with
`HEAVY_OK=1`. The three "after" master stills and the review stills also ran beside it. Lowest free
RAM: 4.76 GB (16:9) and 4.98 GB (9:16).

| file | ffprobe | loudness after `master.mjs` |
|---|---|---|
| `out/cut-30s-en-16x9-master.mp4` (12.2 MB, sha256 d9f46c1e…) | h264 1920×1080 30 fps 31.40 s; AAC 48 kHz stereo 31.50 s | −14.0 LUFS, LRA 2.3 LU, TP −1.5 dBTP (before: −17.0 / −1.2) |
| `out/cut-30s-en-9x16-master.mp4` (11.7 MB, sha256 324414b6…) | h264 1080×1920 30 fps 31.40 s; AAC 48 kHz stereo 31.50 s | −14.0 LUFS, LRA 2.3 LU, TP −1.5 dBTP |

Four frames from each final file (3, 12, 20 and 29 s) were extracted and read. **The master is
unchanged**: half-scale `MasterEN` stills at frames 157, 1603 and 5678, rendered from HEAD before
the change and again after it (twice, the second after the S5 fix), are byte-identical
(300522cd…, efe7bc4d…, 85caf109…), and `out/archlang-2d-3d-en.srt` keeps its SHA-256 c70f0cfd….
The cuts have been measured, not listened to.

### Poster and thumbnail (2026-11-07)

The F7 card's poster and thumbnail had not been made. `Poster` composition (`npm run poster`): the
official knob-flat replay at 5.4 s (walls rising, the viewer's status rows cropped) beside the end
card's line; every word is existing gated copy (s0_1, s0_3, s11_tag, s11_cta1, cut_3d). Outputs
`out/poster-16x9.png` (1920×1080) and `out/thumb-1280x720.png`. MasterEN f1603 still unchanged
(efe7bc4d…). Docs brought up to date: README commands, build-plan F7/F8 done, brief lengths.

### Owner approval of the cuts (2026-11-07)

The owner approved both 30 s cuts as they are. The cuts were not lined up with music beats (no beat
map), and that is accepted. Every deliverable in the brief is now made and approved. What's left is
publishing, which waits for the owner's word.
