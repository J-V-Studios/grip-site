# GripApps

GripApps is the declarative language and toolchain for **Community Builds** on lilgrip.com. Visitors get mini-apps at `/community/<handle>/` compiled from a single `app.grip` source file.

## Docs

| Doc | Purpose |
| --- | --- |
| [LANGUAGE.md](./LANGUAGE.md) | Closed vocabulary (must match `gripapps/gripc/src/tokens.ts`) |
| [COOKBOOK.md](./COOKBOOK.md) | Starter templates in `gripapps/templates/` |
| [COMPILER.md](./COMPILER.md) | `gripc` CLI — check, build, vendor-runtime |
| [RUNTIME.md](./RUNTIME.md) | Browser load order, `GripApps` host API, themes |
| [AGENT_GUIDE.md](./AGENT_GUIDE.md) | Planner vs builder checklist for Cloud Agents |

## Agent entry points

- Skill: [`.cursor/skills/gripapps/SKILL.md`](../../.cursor/skills/gripapps/SKILL.md)
- Moderation (unchanged): [docs/community/MODERATION.md](../community/MODERATION.md)
- Legacy Vite workflow: [docs/community/SCAFFOLD.md](../community/SCAFFOLD.md) — **new builds should use GripApps**

## Sandbox

Community agents write **only** under `public/community/<handle>/`. A GripApps build typically includes:

```text
public/community/<handle>/
  app.grip          # source (required for agent PRs)
  app.grip.js       # compiled IR bundle
  index.html        # boot loader
  manifest.json     # gallery metadata
  vendor/gripapps/runtime.js
```
