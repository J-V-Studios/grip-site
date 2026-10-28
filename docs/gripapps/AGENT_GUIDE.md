# GripApps — agent handbook

Cloud Agents planning or building Community Builds on lilgrip.com should use **GripApps** (not hand-rolled Vite scaffolds) unless the orchestrator explicitly requests legacy scaffold.

**Read first:**

- [`.cursor/skills/gripapps/SKILL.md`](../../.cursor/skills/gripapps/SKILL.md)
- [COOKBOOK.md](./COOKBOOK.md)
- [docs/community/MODERATION.md](../community/MODERATION.md)

## Modes

### Planner

**When:** Orchestrator sends an elaborated visitor brief.  
**Output:** Markdown plan (`plan_md`) — no repo writes required.

Include:

- Gallery title and blurb
- UX sketch (scenes, actions, toys)
- **Named `meta.theme`** and opening **`hero` and/or `canvas`** (or `emoji_stage`); scene **`vibe` / `motion`** where it fits
- GripApps feature choices (`scene` / widgets / optional `raw_module` only when Grip cannot carry the look)
- Moderation pass per [MODERATION.md](../community/MODERATION.md)
- Note that the builder will **draft → enrich → check (incl. `--visual`) → build** under `public/community/<handle>/`

**Reject** plans whose only UI is a flat `stack { text; button }` wall.

### Builder

**When:** Approved plan + `handle`.  
**Output:** Static GripApps build under `public/community/<handle>/` only.

## Filesystem sandbox

### Allowed

- `public/community/<HANDLE>/**` — including `app.grip`, `enrich-notes.md`, built assets, `manifest.json`, optional `raw/`

### Forbidden

- `src/**`, other handles, root configs, `.github/**`, secrets
- Do not rewrite `docs/**` in a community PR (read-only)

## Builder checklist

- [ ] Plan still passes [MODERATION.md](../community/MODERATION.md)
- [ ] Write or update `public/community/<handle>/app.grip` with **`meta.theme`** and **hero and/or canvas** (default starter: [visual_play.grip](../../gripapps/templates/visual_play.grip))
- [ ] `bun run gripc -- enrich public/community/<handle>/app.grip` — expand in place; keep `enrich-notes.md` updated
- [ ] `bun run gripc -- check public/community/<handle>/app.grip`
- [ ] `bun run gripc -- check --visual public/community/<handle>/app.grip` (**required** — fails on text+button-only)
- [ ] `bun run gripc -- build public/community/<handle>/app.grip --out public/community/<handle> --handle <handle>`
- [ ] `index.html`, `app.grip.js`, `manifest.json`, `vendor/gripapps/runtime.js` present
- [ ] All changes stay under `public/community/<handle>/`
- [ ] Mobile-friendly; respect reduced motion for flashy effects

## Replacing a prior build

Remove old generated files in that handle folder (keep `app.grip` if iterating), then rebuild. Never touch another creator’s directory.

## Legacy Vite scaffold

[docs/community/SCAFFOLD.md](../community/SCAFFOLD.md) documents the older `_src` + Vite flow. **New community builds use GripApps** unless told otherwise.
