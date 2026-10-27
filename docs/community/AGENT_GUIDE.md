# Community builds — agent handbook

Cloud Agents that plan or build visitor mini-pages on lilgrip.com must follow this handbook.

**New builds use GripApps.** Start at [`.cursor/skills/gripapps/SKILL.md`](../../.cursor/skills/gripapps/SKILL.md) and [docs/gripapps/AGENT_GUIDE.md](../gripapps/AGENT_GUIDE.md). This document covers sandbox rules and moderation; the GripApps docs cover `app.grip` and `gripc`.

## Modes

### Planner

**When:** Orchestrator passes an elaborated visitor brief (handle, vibe, features).  
**Output:** A markdown plan (`plan_md`) — no file writes required in the repo, or only draft notes if your run allows it.

Planner should specify:

- Page title and one-line blurb for the gallery
- UX sketch (what the visitor sees and does)
- Tech choices **inside** `public/community/<handle>/` (GripApps: scenes, actions, optional `raw_module`; see [COOKBOOK.md](../gripapps/COOKBOOK.md))
- Asset and performance notes (mobile, reduced motion)
- Explicit confirmation that the idea passes [MODERATION.md](./MODERATION.md)

Planner must **not** instruct edits to core site code, other handles, or CI.

### Builder

**When:** Orchestrator passes an approved plan and the target `handle`.  
**Output:** Static files under `public/community/<handle>/` only, plus required `manifest.json`.

Builder steps (GripApps — typical):

1. If replacing a prior build, clear old generated assets in that handle folder (keep folder; do not touch sibling handles).
2. Write or edit `public/community/<handle>/app.grip`.
3. `bun run gripc -- check public/community/<handle>/app.grip`
4. `bun run gripc -- build public/community/<handle>/app.grip --out public/community/<handle> --handle <handle>`
5. Confirm `index.html`, `app.grip.js`, `manifest.json`, and `vendor/gripapps/runtime.js`.

Legacy Vite workflow: [SCAFFOLD.md](./SCAFFOLD.md) (do not use for new builds unless requested).

## Filesystem sandbox

### Allowed writes

- `public/community/<HANDLE>/**` only  
  Examples: `index.html`, `assets/*`, `manifest.json`, `_src/**`

### Forbidden

- Anything under `src/` (Astro app source)
- `public/community/<other-handle>/`
- Root `index.html`, `CNAME`, `astro.config.*`, `package.json` at repo root (unless you are **not** a community agent — you are not)
- `.github/`, `.env*`, secrets, orchestrator config
- Docs outside reading `docs/community/*` for guidance

You may **read** `docs/community/*` and the community skill; do not rewrite them in a community PR.

## manifest.json

Required at `public/community/<handle>/manifest.json`:

```json
{
  "handle": "<handle>",
  "title": "<gallery title>",
  "blurb": "<short description>",
  "builtAt": "<ISO-8601 UTC>"
}
```

Gallery prefers manifest when present; orchestrator syncs DB on live.

## Tone

Lilgrip voice: goofy, chill, meme-friendly. Toy chaos and aesthetic “guns” are OK. Do not build real harm, hate, scams, or sandbox escapes — see [MODERATION.md](./MODERATION.md).

## Do not touch core site

Community pages are isolated static islands. The main Astro site, Supabase wiring, and deploy config must keep working if `public/community/` is deleted entirely.

## Replacing a previous build

For the **same** handle:

1. Remove prior built assets under `public/community/<handle>/` (e.g. old `assets/`, old `index.html`).
2. Deploy the new static output and updated `manifest.json`.
3. Do not modify another creator’s folder.

## Secrets

- **Never** commit or embed `CURSOR_API_KEY`, Supabase service role, or edit codes.
- **Never** add client-side code that exfiltrates tokens or edits the main site.

## Checklist before finishing (builder)

- [ ] All changes under `public/community/<handle>/` only
- [ ] `app.grip` present; `bun run gripc -- check` passes
- [ ] `index.html`, `app.grip.js`, `manifest.json`, `vendor/gripapps/runtime.js` present
- [ ] Static build works without a dev server
- [ ] Plan moderation rules still satisfied
- [ ] Mobile layout sanity; reduced motion considered for flashy motion

## Index

- [README.md](./README.md) — human-oriented overview
- [SCAFFOLD.md](./SCAFFOLD.md) — Vite build and copy steps
- [MODERATION.md](./MODERATION.md) — allow/block policy
