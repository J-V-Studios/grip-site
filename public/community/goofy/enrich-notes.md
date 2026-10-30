# Enrich checklist — public/community/goofy/app.grip

Draft parses; atmosphere and play were expanded in place before ship.

Agent expands `app.grip` in place (CLI does not call an LLM). Re-run `gripc enrich` after major edits to refresh this file.

## Required

- [x] Named `theme` in `meta` (`neon_lagoon`)
- [x] Open with **hero** and/or **canvas** and/or **emoji_stage** (not text-wall only)
- [x] Scene `vibe <theme>` and `motion bounce|float|pulse|none` where it fits
- [x] Play/chase/score: `canvas` + emoji `sprite` + `score_hud` + `particles` + actions
- [x] Tap toys: `emoji_stage` + toast/goto actions
- [x] Enriched `app.grip` passes `gripc check` and `gripc check --visual`
- [x] Honor `prefers-reduced-motion` (motion is decorative only)

## What expanded

- Gate (`candy_arcade`, `float`): full-bleed hero, squid `emoji_stage`, three peek cards.
- Track (`neon_lagoon`, `bounce`): hero plus canvas. Emoji sprites for squid, lazer shark, green/red lights, boom, crab, bubble, and star. `score_hud` and `particles`. Eight beat buttons move sprites by `*_x` / `*_y`.
- Finale (`deep_space`, `pulse`): hero and the same canvas as bubble fireworks, plus a bigger-boom beat.
- Lounge (`barn_night`, `float`): hero, shark `emoji_stage`, sticker cards.
- Toasts stay toy-only: sparkle lasers, bubble booms, no harm.
- Motion and particles stay in the Grip runtime, which already skips them when `prefers-reduced-motion: reduce`.

## Escalation (only if Grip cannot carry the look)

- [ ] `raw_module` + pinned lib (e.g. three.js) under the community handle sandbox
- [ ] List escalations in this file under **Escalations**

## Escalations

_(none)_ Grip canvas emoji sprites, themes, hero, and particles carry the look. No `raw_module`.

## Workflow

1. Expand Grip in `app.grip` using the items above
2. `gripc check <file>`
3. `gripc check --visual <file>`
4. `gripc build <file> --out <dir> --handle <handle>`
