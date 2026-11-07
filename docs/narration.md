# Narration (English voice-over, owner's cloned voice)

Owner decisions, 2026-11-07:

- The film has an English voice-over, generated with the owner's own ElevenLabs voice clone. There
  is no other voice-over.
- The film is for English-speaking viewers only: one master (`MasterEN`), English subtitles, one
  English SRT. There is no Chinese version (owner, 2026-11-07).
- S9 is a **simulated agent session**, not a screen recording: a coded replica of a generic
  coding-agent terminal and a chat window, a simulated cursor, and simulated voice input. A mic
  button pulses, a waveform plays, and the brief is transcribed word by word while the owner's
  cloned voice speaks it. The section "S9 simulated agent session" below sets the rules. The
  `doors.json` text stays as the closing tiles. The new Kenney CC0 sounds are approved.
- S2–S5 stay as replicas that draw the baked SVG, so the picture matches the 1.57.0 pin.

The voice-over replaces the big caption cards. The on-screen text becomes subtitles of what is
spoken, one sentence per cue, timed from ElevenLabs' character timestamps. Labels, the typed
brief, numbers in the picture and the end card stay as they are.

## Rules

- Each sentence is held to the same claims rules as the captions (`docs/creative-brief.md`
  § Claims), and `gate-copy` checks the spoken text and its subtitle.
- Numbers are slots filled from `data/facts.json`, so the bake can never disagree with the voice.
  A `{slot}` in spoken text uses the fact's spoken form (`m²` → "square metres"). Never respell a
  number by hand.
- The founder voice says "I" once (S2). The voice guide asks for a person, not a company voice.
- Do not say "model" or "render". Say "AI" or "your AI".
- Scene lengths follow the voice: `dur = max(visual minimum, spoken length + 0.6 s)`, with
  0.25 s of air before the first word of each scene.

## Script

| Scene | Spoken (en) |
|---|---|
| S0 | One text file. |
| S0 | Compile it, and you get a dimensioned floor plan. |
| S0 | Then the same file stands up in 3D. |
| S1 | AI tools can draw a floor plan that looks right. |
| S1 | But look closer. This bedroom has no door, so you can't walk into it. |
| S1 | {broken.second_spoken} |
| S1 | ArchLang finds both. |
| S2 | I make ArchLang, a language for floor plans. |
| S2 | You, or your AI, write the rooms, walls, doors and windows as plain text. |
| S2 | The compiler turns that text into a drawing. |
| S2 | It's free, and it's open source. |
| S3 | Every area is computed from the walls. |
| S3 | These {knob.lines} lines give {knob.rooms} rooms and {knob.net_m2_spoken} of floor. |
| S3 | And the same text always gives the same drawing, byte for byte. |
| S4 | Change one number, and everything that depends on it follows: the walls, the doors, the furniture, the dimensions. |
| S4 | It even lists what moved: {sweep.changed} things changed, {sweep.held} held, and {sweep.broke} broke. |
| S5 | When something is wrong, you get a code, the exact line, and a suggested fix. |
| S5 | So your AI can read it, and fix the plan on its own. |
| S5 | Reachability and areas are measured. The other checks are advice. |
| S6 | One command furnishes the empty rooms and completes the sheet: title, scale, room schedule and legend. |
| S6 | Then pick a look. |
| S7 | Now switch the same file to 3D. |
| S7 | Walls, doors, windows, floors, stairs and furniture, all built from the plan. |
| S7 | Every 3D element traces back to it, and every solid is closed. |
| S7 | Several storeys stack at their real heights. |
| S7 | It's a preview in flat colours, so no pitched roofs, sections or elevations yet. |
| S8 | Export to SVG, DXF, PDF or PNG, and GLB for the 3D preview. |
| S8 | The DXF comes with real blocks and dimensions. |
| S9 | And you can use it where you already work. |
| S9 | Ask ChatGPT or Claude for a floor plan, and it writes ArchLang and checks it. |
| S9 | One line adds it to your coding agent. |
| S10 | {gallery.count} example plans ship with it. |
| S10 | Every one compiles, and every one stands up in 3D. |
| S11 | These are concept plans to think and decide with, not permit drawings. |
| S11 | Try it free in your browser, at playground dot archlang dot uk. |
| S11 | Designs that compile. |

The S11 subtitle shows the URL as `playground.archlang.uk`; only the voice says "dot".

`SECOND_FINDING` gains a `spoken` field. For `W_FURNITURE_OVER_WINDOW` it is "And this wardrobe
stands in front of the window."

The S1 line "so you can't walk into it" is a reachability claim, one of the three measured facts.
The bake already asserts `reachable: false` for the bedroom.

## S9 simulated agent session (owner decision 2026-11-07)

The owner chose a simulation over a real recording. It stays honest this way:

- **The UI is generic.** It is a neutral terminal and chat panel in the film's own styling. It does
  not copy the look, logo or name of Claude Code, Codex, ChatGPT or any other product. The tiles at
  the end name the products in plain text, as before.
- **The output is real.** Every command the "agent" runs, and every line it prints, comes from
  the pinned CLI run in the bake, saved as `public/baked/agent/*.json|txt`. That covers
  `spec`, `compile … --json`, `describe --json`, `validate --strict --json`, `lint --json`, the fix
  and `finish`. The `.arch` the agent "writes" is a real file in `source/` that produces exactly
  those outputs. A first draft with one real finding, then the fixed file, gives the scene a
  check-and-fix beat. Long JSON may be cropped, never edited. Timing may be sped up.
- **The voice input is the owner's.** The cloned voice speaks the brief (a separate TTS request,
  cached like the narration): "Draw me a one-bed flat, living room and kitchen together, about
  {knob.brief_m2_spoken}, and check it." The transcription appears word by word, timed from the
  character alignment.
- **Mouse.** A simulated cursor clicks the mic, approves a tool call, and opens the result plan,
  which is the baked SVG.
- **A label** in the corner for the whole scene: "Reenactment · real compiler output".
- The narration over S9 stays as in the script. The scene is longer to fit the session: about
  20–24 s, with the narration lines placed after the voice-input beat.
- The storyboard's earlier rule against simulated agent output is replaced by this section for
  S9 only.

## Generation

- Endpoint: `POST https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps`, with
  `output_format=mp3_44100_128`. The call follows the maker's earlier ElevenLabs pipeline.
- Model: `eleven_v4` (owner 2026-11-07: use the newest clone model; tested OK with the clone voice and
  `with-timestamps`, 2026-11-07). Read `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` and `ELEVENLABS_MODEL` from the gitignored
  `.env`. Never print them, and never write them to a log or a file.
- One request per scene (12 in total). Pass `previous_text` / `next_text` so the voice flows across
  cuts.
- Cache each result by SHA-256 of (text, voice id, model, settings) in `audio/vo/` (gitignored: it is
  the owner's voice). Re-running costs nothing unless the text changes. Log the character count
  of each paid run in `docs/production-log.md`.
- Sentence cue times come from the returned character alignment. They are written to
  `data/vo-timing.json` (committed), so the SRTs and subtitles follow the voice.
- Mix: voice leads; ducks the music under speech by about 10 dB with 150 ms ramps; whole mix
  −14 LUFS, −1 dBTP. Until the owner has listened, the mix is measured only.
