---
name: gripapps
description: Plan or build lilgrip Community Builds with GripApps (app.grip + gripc). Use for orchestrator planner runs (markdown plan) or builder runs (compiled static output under public/community/<handle>/). Enforces sandbox paths, moderation, manifest.json, visual enrich workflow, and lilgrip tone.
---

# GripApps (Community Builds)

Use this skill when the orchestrator assigns a **Community Build** for a claimed handle on lilgrip.com.

**Read first:**

- [docs/gripapps/AGENT_GUIDE.md](../../../docs/gripapps/AGENT_GUIDE.md)
- [docs/gripapps/COOKBOOK.md](../../../docs/gripapps/COOKBOOK.md)
- [docs/gripapps/LANGUAGE.md](../../../docs/gripapps/LANGUAGE.md)
- [docs/community/MODERATION.md](../../../docs/community/MODERATION.md)

## Planner vs builder

| Mode | Deliverable |
| --- | --- |
| **Planner** | Markdown plan: title, blurb, UX, GripApps scenes/actions, **named theme + hero and/or canvas play**, moderation OK |
| **Builder** | `app.grip` + enrich pass + `gripc check --visual` + `gripc build` output under `public/community/<handle>/` |

## Path rules (hard)

**Allow:** `public/community/<HANDLE>/**` only.

**Deny:** `src/**`, other handles, root site files, `.github/**`, `.env*`, secrets in static bundles.

## Builder workflow (required order)

1. **Draft** `public/community/<handle>/app.grip` — start from [visual_play.grip](../../../gripapps/templates/visual_play.grip) or another visual template in [gripapps/templates/](../../../gripapps/templates/). **`meta` must set `theme`**; open with **`hero` and/or `canvas`** (or `emoji_stage` for tap toys). Do not ship text+button-only stacks.
2. **`bun run gripc -- enrich public/community/<handle>/app.grip`** — refresh `enrich-notes.md`; expand thin lines in place (themes, `vibe`/`motion`, canvas sprites, hud, particles). Escalate to `raw_module` + pinned libs only when Grip cannot carry the look; note escalations in `enrich-notes.md`.
3. **`bun run gripc -- check public/community/<handle>/app.grip`**
4. **`bun run gripc -- check --visual public/community/<handle>/app.grip`** — must pass; rejects text+button-only finals.
5. **`bun run gripc -- build public/community/<handle>/app.grip --out public/community/<handle> --handle <handle>`**
6. Verify `index.html`, `app.grip.js`, `manifest.json`, `vendor/gripapps/runtime.js`.

See [docs/gripapps/COMPILER.md](../../../docs/gripapps/COMPILER.md).

## manifest.json

Written by `gripc build`; must include handle, title, blurb, `builtAt` (ISO-8601 UTC).

## Moderation

Follow [MODERATION.md](../../../docs/community/MODERATION.md). Stop if the brief or plan fails policy.

## Tone

Lilgrip: goofy, chill, meme-friendly. Mobile-friendly; respect `prefers-reduced-motion`.

## Core site

Do not touch core site code. Community pages are static islands.
