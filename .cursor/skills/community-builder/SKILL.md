---
name: community-builder
description: Plan or build lilgrip visitor mini-pages under public/community/<handle>/ only. Use for Community Builds planner runs (markdown plan) or builder runs (static files + manifest). Enforces sandbox paths, moderation, manifest.json, and lilgrip tone.
---

# Community builder (lilgrip)

Use this skill when the orchestrator assigns a **Community Build** for a claimed handle on lilgrip.com.

**Read first:** [docs/community/AGENT_GUIDE.md](../../../docs/community/AGENT_GUIDE.md), [SCAFFOLD.md](../../../docs/community/SCAFFOLD.md), [MODERATION.md](../../../docs/community/MODERATION.md).

## Planner vs builder

| Mode | When | Deliverable |
| --- | --- | --- |
| **Planner** | You receive an elaborated visitor brief | Markdown plan: title, blurb, UX, tech inside sandbox, moderation OK |
| **Builder** | You receive an approved plan + `handle` | Static site under `public/community/<handle>/` + `manifest.json` |

Planners do not edit the repo unless explicitly asked to write `plan_md` only. Builders implement the plan and commit static output.

## Path rules (hard)

### Allow (writes)

- `public/community/<HANDLE>/**` only (`index.html`, assets, `manifest.json`, optional `_src/`)

### Deny (never modify in a community run)

- `src/**` and rest of core Astro site
- `public/community/<other-handle>/**`
- Root site files (`index.html`, `CNAME`, configs at repo root)
- `.github/**`, `.env*`, secrets, API keys in static bundles
- Other docs (read `docs/community/*`; do not change them in community PRs)

## manifest.json (required for builder)

Path: `public/community/<handle>/manifest.json`

```json
{
  "handle": "<handle>",
  "title": "<gallery title>",
  "blurb": "<short line>",
  "builtAt": "<ISO-8601 UTC>"
}
```

## Build workflow (builder)

1. Wipe prior **built** files in that handle folder when replacing a build (not other handles).
2. Optional: Vite/React in `public/community/<handle>/_src/` — see [community-scaffold/](../../../community-scaffold/) and [SCAFFOLD.md](../../../docs/community/SCAFFOLD.md).
3. `bun install && bun run build` (or npm); copy `dist/*` → `public/community/<handle>/`.
4. Ensure relative asset paths (`base: './'` in Vite).

## Moderation (summary)

Align with [MODERATION.md](../../../docs/community/MODERATION.md): allow goofy games, memes, toy chaos; block real harm, hate, CSAM, scams, doxxing, spam, and **any sandbox escape**. If the brief or plan fails moderation, stop — do not implement.

## Tone

Lilgrip: goofy, chill, meme-friendly. Mobile-friendly layouts; respect `prefers-reduced-motion` for heavy animation.

## Core site

**Do not touch core site code.** Community pages must be deployable static islands; deleting `public/community/` must not break the main site build.

## Replace same-handle build

Delete old generated assets under that handle’s folder, then copy the new static output and update `manifest.json`. Never overwrite another creator’s directory.
