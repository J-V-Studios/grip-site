# Community builds documentation

Visitor mini-pages on lilgrip.com live at `/community/<handle>/` as static files under `public/community/<handle>/`. Cursor Cloud Agents plan and build those pages under a strict filesystem sandbox.

**New builds use [GripApps](../gripapps/README.md)** (`app.grip` + `gripc`). The Vite scaffold below is legacy reference only.

## For humans

| Topic | Doc |
| --- | --- |
| Product and architecture | [Community builds design spec](../superpowers/specs/2026-10-26-community-builds-design.md) |
| Moderation (what we allow / block) | [MODERATION.md](./MODERATION.md) |
| Deploy orchestrator + smoke checklist | [DEPLOY.md](./DEPLOY.md) |
| Claim, edit, gallery | Site UI at `/community` (orchestrator + Supabase; see spec) |

## For agents

| Doc | Purpose |
| --- | --- |
| [`.cursor/skills/gripapps/SKILL.md`](../../.cursor/skills/gripapps/SKILL.md) | Skill entry — GripApps planner vs builder |
| [docs/gripapps/AGENT_GUIDE.md](../gripapps/AGENT_GUIDE.md) | Full GripApps agent handbook |
| [docs/gripapps/COOKBOOK.md](../gripapps/COOKBOOK.md) | Templates and build flow |
| [AGENT_GUIDE.md](./AGENT_GUIDE.md) | Community sandbox + moderation (see GripApps guide for builds) |
| [SCAFFOLD.md](./SCAFFOLD.md) | Legacy Vite scaffold (prefer GripApps) |
| [MODERATION.md](./MODERATION.md) | Policy and examples |

## Scaffold template

Reference Vite + React template: [`community-scaffold/`](../../community-scaffold/) at the repo root. Build output is copied into `public/community/<handle>/` per [SCAFFOLD.md](./SCAFFOLD.md).

## Rules (short)

- **One folder per handle:** `public/community/<handle>/**` only in community PRs.
- **Required files:** `index.html`, `manifest.json`.
- **No core site edits:** no `src/`, no other handles, no `.github/` or secrets.
