---
name: gripapps
description: Plan or build lilgrip Community Builds with GripApps (app.grip + gripc). Use for orchestrator planner runs (markdown plan) or builder runs (compiled static output under public/community/<handle>/). Enforces sandbox paths, moderation, manifest.json, and lilgrip tone.
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
| **Planner** | Markdown plan: title, blurb, UX, GripApps scenes/actions, moderation OK |
| **Builder** | `app.grip` + `gripc build` output under `public/community/<handle>/` |

## Path rules (hard)

**Allow:** `public/community/<HANDLE>/**` only.

**Deny:** `src/**`, other handles, root site files, `.github/**`, `.env*`, secrets in static bundles.

## Builder workflow

1. Author `public/community/<handle>/app.grip` (start from [gripapps/templates/](../../../gripapps/templates/)).
2. `bun run gripc -- check public/community/<handle>/app.grip`
3. `bun run gripc -- build public/community/<handle>/app.grip --out public/community/<handle> --handle <handle>`
4. Verify `index.html`, `app.grip.js`, `manifest.json`, `vendor/gripapps/runtime.js`.

See [docs/gripapps/COMPILER.md](../../../docs/gripapps/COMPILER.md).

## manifest.json

Written by `gripc build`; must include handle, title, blurb, `builtAt` (ISO-8601 UTC).

## Moderation

Follow [MODERATION.md](../../../docs/community/MODERATION.md). Stop if the brief or plan fails policy.

## Tone

Lilgrip: goofy, chill, meme-friendly. Mobile-friendly; respect `prefers-reduced-motion`.

## Core site

Do not touch core site code. Community pages are static islands.
