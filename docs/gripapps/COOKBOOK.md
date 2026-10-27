# GripApps cookbook

Copy and adapt templates from `gripapps/templates/`. Each file is valid `app.grip` source you can check and build.

| Template | File | Idea |
| --- | --- | --- |
| Hello | [`hello.grip`](../../gripapps/templates/hello.grip) | Welcome stack, button, toast action |
| Clicker | [`clicker.grip`](../../gripapps/templates/clicker.grip) | Score state + tap loop |
| Story | [`story.grip`](../../gripapps/templates/story.grip) | Multi-scene narrative |
| Meme stage | [`meme_stage.grip`](../../gripapps/templates/meme_stage.grip) | Emoji stage + vibes |
| Arena | [`arena.grip`](../../gripapps/templates/arena.grip) | Canvas-style play sketch |

## Workflow

1. Copy a template to `public/community/<handle>/app.grip` (or author in place).
2. `bun run gripc -- check public/community/<handle>/app.grip`
3. `bun run gripc -- build public/community/<handle>/app.grip --out public/community/<handle> --handle <handle>`

See [COMPILER.md](./COMPILER.md) and [AGENT_GUIDE.md](./AGENT_GUIDE.md).

## Tone

Keep lilgrip energy: goofy, chill, mobile-friendly. Respect [MODERATION.md](../community/MODERATION.md).
