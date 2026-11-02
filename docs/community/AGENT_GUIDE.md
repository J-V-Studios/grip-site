# Community builds — agent handbook

Cloud Agents that plan or build visitor mini-pages on lilgrip.com must follow this handbook. The skill at [`.cursor/skills/community-builder/SKILL.md`](../../.cursor/skills/community-builder/SKILL.md) is the short entry point; this document is the full reference.

## Modes

### Planner

**When:** Orchestrator passes an elaborated visitor brief (handle, vibe, features).  
**Output:** A markdown plan (`plan_md`) — no file writes required in the repo, or only draft notes if your run allows it.

Planner should specify:

- Page title and one-line blurb for the gallery
- UX sketch (what the visitor sees and does)
- Tech choices **inside** `public/community/<handle>/` (e.g. Vite + React in `_src`, static output in handle root)
- Asset and performance notes (mobile, reduced motion)
- Explicit confirmation that the idea passes [MODERATION.md](./MODERATION.md)

Planner must **not** instruct edits to core site code, other handles, or CI.

### Builder

**When:** Orchestrator passes an approved plan and the target `handle`.  
**Output:** Static files under `public/community/<handle>/` only, plus required `manifest.json`.

Builder steps (typical):

1. If replacing a prior build, clear old generated assets in that handle folder (keep folder; do not touch sibling handles).
2. Scaffold or edit under `public/community/<handle>/` (optional `_src/`).
3. Run production build; copy `dist/*` into `public/community/<handle>/` (see [SCAFFOLD.md](./SCAFFOLD.md)).
4. Write or update `manifest.json` with handle, title, blurb, `builtAt`.
5. Verify `index.html` loads with relative asset paths.

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
- [ ] `index.html` + `manifest.json` present
- [ ] Static build works without a dev server
- [ ] Plan moderation rules still satisfied
- [ ] Mobile layout sanity; reduced motion considered for flashy motion

## Index

- [README.md](./README.md) — human-oriented overview
- [SCAFFOLD.md](./SCAFFOLD.md) — Vite build and copy steps
- [MODERATION.md](./MODERATION.md) — allow/block policy
