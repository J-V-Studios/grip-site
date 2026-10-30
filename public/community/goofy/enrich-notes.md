# Enrich checklist — public/community/goofy/app.grip

Draft parses; confirm atmosphere/play below before ship.

Agent expands `app.grip` in place (CLI does not call an LLM). Re-run `gripc enrich` after major edits to refresh this file.

## Required

- [ ] Named `theme` in `meta` (e.g. `neon_lagoon`, `barn_night`, `candy_arcade`, `deep_space`, `lilgrip_default`)
- [ ] Open with **hero** and/or **canvas** and/or **emoji_stage** (not text-wall only)
- [ ] Scene `vibe <theme>` and `motion bounce|float|pulse|none` where it fits
- [ ] Play/chase/score: `canvas` + emoji `sprite` + `score_hud` + `particles` + actions
- [ ] Tap toys: `emoji_stage` + toast/goto actions
- [ ] Enriched `app.grip` passes `gripc check` and `gripc check --visual`
- [ ] Honor `prefers-reduced-motion` (motion is decorative only)

## Escalation (only if Grip cannot carry the look)

- [ ] `raw_module` + pinned lib (e.g. three.js) under the community handle sandbox
- [ ] List escalations in this file under **Escalations**

## Escalations

_(none yet)_

## Workflow

1. Expand Grip in `app.grip` using the items above
2. `gripc check <file>`
3. `gripc check --visual <file>`
4. `gripc build <file> --out <dir> --handle <handle>`
