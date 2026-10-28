# GripApps Visual Kit + Enrich Pipeline

**Status:** Approved design (pending implementation plan)  
**Date:** 2026-10-28  
**Branch:** `cursor/gripapps-visual-rich-cddc`  
**Parent:** [2026-10-27-gripapps-design.md](./2026-10-27-gripapps-design.md)

## Problem

Community GripApps (e.g. `shaloob`) compile and run, but feel like text walls + blue rectangle “sprites.” Agents default to `stack { text; button }` because that is the easiest valid path. Atmosphere and mini-games are possible in vocabulary but weak in runtime and absent from skill/templates defaults.

## Goals

1. Make **visually rich, atmospheric** pages the easy default for AI builders.
2. Make **mini-games / canvas play** feel like toys (emoji sprites, score, motion), not CRUD forms.
3. Treat GripLang as **compilable intent + expandable sketch**: a dedicated enrich pass thickens thin drafts before deterministic compile.
4. Keep `gripc check` / `gripc build` **deterministic** (no LLM inside build/CI).

## Non-goals

- Replacing GripApps with freeform Vite/React community scaffolds.
- Silent mid-compile LLM hooks inside `gripc build`.
- Unbounded library installs or network calls from visitor pages beyond pinned, allowed CDNs / vendored assets.
- Forcing every page into three.js.

## Decision summary

| Choice | Decision |
| --- | --- |
| Visual priority | Atmosphere (#2) + mini-games (#3) |
| Approach | **A — Visual kit in GripLang first** |
| Enrich timing | **Builder enrich stage** (`gripc enrich` contract), then deterministic check/build — not a silent compile-time LLM |
| Escalation | Prefer Grip primitives; `raw_module` + pinned libs (e.g. three.js) only when Grip cannot carry the look/feel |

## Architecture

```
draft app.grip  →  enrich (agent)  →  enriched app.grip [+ raw/]  →  gripc check  →  gripc build
                         │
                         └─ enrich-notes.md (what expanded)
```

- **Draft:** short visual Grip (theme + hero and/or canvas required).
- **Enrich:** model walks lines; expands thin UI into themes/motion/canvas play; may add `raw/` + three.js when needed.
- **Check/Build:** pure compile; CI-safe; reproducible.

## Language / runtime kit

### Themes

Named presets (CSS variables: background gradient, surface, accent, text):

- `lilgrip_default`
- `neon_lagoon`
- `barn_night`
- `candy_arcade`
- `deep_space`

### Scene chrome

```grip
scene lagoon {
  vibe neon_lagoon motion bounce
  hero {
    title "Laser Lagoon"
    blurb "toy lasers only"
    emoji "🦈"
  }
  canvas {
    clear "#0b1020"
    sprite cow emoji "🐄"
    sprite shark emoji "🦈"
    score_hud
    particles
  }
}
```

- `vibe <theme>` — scene-level theme override  
- `motion bounce|float|pulse|none` — CSS motion; disabled under `prefers-reduced-motion`  
- `hero` — full-bleed visual block (gradient + title/blurb/emoji), not a flat grey card  

### Canvas play upgrades

- Sprites render **emoji/label**, not unlabeled blue boxes  
- Action/step helpers for motion (`nudge` / position updates via `*_x`/`*_y` as today, plus clearer opcodes if needed)  
- Light tick/drift loop while scene active (paused on reduced motion)  
- `score_hud` + `particles` remain first-class overlays  

### Agent defaults

- Planner/builder **must** pick a theme and open with `hero` and/or `canvas`  
- Final text+button-only apps fail skill checklist (and optional `gripc check --visual`)  
- Default cookbook starter = visual play template; `hello.grip` remains minimal smoke only  

## Enricher contract

### CLI

```bash
bun run gripc -- enrich public/community/<handle>/app.grip
bun run gripc -- check  public/community/<handle>/app.grip
bun run gripc -- build  ... --out public/community/<handle> --handle <handle>
```

`enrich` is an **agent-facing stage** documented in skill/orchestrator prompts. Implementation may be:

- skill-only procedure (agent expands in place), and/or  
- a CLI stub that validates draft + prints enrich checklist until a hosted enrich runner exists  

It must **not** block deterministic `check`/`build` in CI.

### Allowed expansions

| Draft intent | Prefer |
| --- | --- |
| vibe / theme | named theme + CSS vars |
| hero / stage | full-bleed hero + motion |
| play / chase / score | canvas + emoji sprites + hud + particles + actions |
| tap toys | emoji_stage + toast/goto |

### Escalation to raw + libraries

Use `raw_module` + pinned three.js (or similar) only when Grip cannot express the need (true 3D, orbit camera, heavy custom FX). Still sandboxed under `public/community/<handle>/**`. Write `enrich-notes.md` listing escalations.

### Hard limits

- Sandbox writes only under the handle  
- No `eval` of visitor text  
- Honor `prefers-reduced-motion`  
- Enriched `app.grip` must pass `gripc check`  
- Visitor pages: no arbitrary network; pin CDN or vendor assets  

## Docs / skill / orchestrator

Update:

- `.cursor/skills/gripapps/SKILL.md` — draft → enrich → check → build; visual required  
- `docs/gripapps/AGENT_GUIDE.md`, `COOKBOOK.md`, `LANGUAGE.md`, `RUNTIME.md`  
- `supabase/functions/community-orchestrator/cursor.ts` planner/builder prompts  

## Success criteria

1. New agent builds open with atmosphere (theme + hero) and/or a playable canvas with visible emoji sprites.  
2. `shaloob`-class briefs no longer ship as text walls with blank rectangles by default.  
3. `gripc check`/`build` remain offline-deterministic.  
4. Enrich path documented and used by orchestrator builders.  
5. Optional visual lint fails or warns on text+button-only finals.

## Implementation sketch (for later plan)

1. Runtime: themes, hero full-bleed, emoji sprites, motion CSS, tick loop  
2. Parser/validate/codegen for `vibe` / `motion` / hero fields / sprite emoji  
3. Templates + cookbook defaults  
4. Skill + orchestrator prompt retarget  
5. `gripc enrich` contract + visual check flag  
6. Docs + e2e smoke on visual demo  

## Out of scope for v1 of this change

- Auto-calling Cursor API from `gripc` in GitHub Actions  
- Rewriting all existing live community pages  
- Full game physics engine  

## Open follow-ups

- Exact sprite emoji syntax vs attribute spelling in grammar  
- Whether `--visual` is warn (v1) or hard fail (v1.1)  
- Pinned three.js URL / vendor policy detail when first raw 3D template lands  
