# GripApps cookbook

Copy and adapt templates from `gripapps/templates/`. Each file is valid `app.grip` source you can check and build.

| Template | File | Idea |
| --- | --- | --- |
| Visual play | [`visual_play.grip`](../../gripapps/templates/visual_play.grip) | Default starter: theme, hero, canvas emoji sprites, score, particles |
| Hello | [`hello.grip`](../../gripapps/templates/hello.grip) | Welcome stack, button, toast action |
| Clicker | [`clicker.grip`](../../gripapps/templates/clicker.grip) | Score state + tap loop |
| Story | [`story.grip`](../../gripapps/templates/story.grip) | Multi-scene narrative |
| Meme stage | [`meme_stage.grip`](../../gripapps/templates/meme_stage.grip) | Emoji stage + vibe/motion |
| Arena | [`arena.grip`](../../gripapps/templates/arena.grip) | Canvas play with emoji sprite + boost action |

## Workflow

1. Copy **`visual_play.grip`** (or another visual template) to `public/community/<handle>/app.grip` (or author in place). Require **`meta.theme`** and **hero and/or canvas**.
2. `bun run gripc -- enrich public/community/<handle>/app.grip` — agent expands thin lines; updates `enrich-notes.md`.
3. `bun run gripc -- check public/community/<handle>/app.grip`
4. `bun run gripc -- check --visual public/community/<handle>/app.grip` — rejects text+button-only.
5. `bun run gripc -- build public/community/<handle>/app.grip --out public/community/<handle> --handle <handle>`

See [COMPILER.md](./COMPILER.md) and [AGENT_GUIDE.md](./AGENT_GUIDE.md).

## Tone

Keep lilgrip energy: goofy, chill, mobile-friendly. Respect [MODERATION.md](../community/MODERATION.md).
