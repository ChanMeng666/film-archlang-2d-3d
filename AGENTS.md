# AGENTS.md

Remotion film explaining ArchLang (2D plan + 3D preview). Read `docs/creative-brief.md`, then
`docs/storyboard.md`, then `docs/build-plan.md`.

## Hard rules

- Every plan on screen is compiled by the pinned `@chanmeng666/archlang`; every 3D frame comes from
  the pinned `@chanmeng666/archlang-3d`. No invented geometry, UI or agent output.
- Caption numbers come from `data/facts.json` (written by `npm run bake`), never typed.
- English only (owner, 2026-11-07): one master (`MasterEN`), English subtitles, one English SRT; no
  Chinese anywhere (copy, compositions, fonts, docs).
- Captions live only in `src/copy.ts`. `npm run gates` must pass before any render is shown.
- Claims follow the brief's § Claims: only reachability, exact areas and byte-identical output are
  measurements; no "first/only", no BIM/render/walkthrough/"3D model", no compliance claims.
- `brand/archlang-logo-master.svg` is byte-identical to the archlang repo's. Recolour only.
- Audio: real recordings, licensed, SHA-256 in `audio/manifest.json`; media gitignored.
- Laptop: one heavy process at a time; half-scale previews; full 1080p only on the owner's word.
- Log fallbacks, measurements and open questions in `docs/production-log.md`.
- Commit locally with Conventional Commits; never push or publish without the owner asking.
