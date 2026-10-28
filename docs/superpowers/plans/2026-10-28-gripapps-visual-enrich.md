# GripApps Visual Kit + Enrich Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make GripApps default to atmospheric, playable community pages — themes, full-bleed heroes, emoji canvas sprites, motion — plus a draft→enrich→deterministic build path for AI agents.

**Architecture:** Extend GripLang + shared runtime with a visual kit (themes, `vibe`/`motion`, richer `hero`/`sprite`). Add `gripc enrich` as an agent-facing contract (checklist/stub first) and skill/orchestrator prompts that require enrich before `check`/`build`. Keep `check`/`build` offline-deterministic.

**Tech Stack:** Existing GripApps stack — TypeScript/`gripc`, Vitest, vanilla `public/gripapps/runtime.js`, Bun, Playwright e2e.

**Spec:** [docs/superpowers/specs/2026-10-28-gripapps-visual-enrich-design.md](../specs/2026-10-28-gripapps-visual-enrich-design.md)

## Global Constraints

- Sandbox writes only under `public/community/<handle>/**` for community agents.
- Community agents must never modify `public/gripapps/**` (core runtime); they only vendor a copy.
- No `eval` of visitor text or generated strings as code.
- State in GripLang must be JSON-serializable only.
- Runtime load order: shared `https://lilgrip.com/gripapps/runtime.js?v=<VERSION>` then `./vendor/gripapps/runtime.js`.
- Do not force-rewrite existing live HTML community pages.
- `gripc check` / `gripc build` remain deterministic (no LLM calls inside them / CI).
- Honor `prefers-reduced-motion` for motion and particle FX.
- Prefer TDD: failing Vitest → implement → pass → commit per task.
- Root test runner: `bun run test`; e2e: `bun run test:e2e`.

## File map (create / modify)

| Path | Responsibility |
| --- | --- |
| `gripapps/gripc/src/tokens.ts` | Theme presets, motion keywords, visual keywords |
| `gripapps/gripc/src/ast.ts` | Scene vibe/motion; hero fields; sprite emoji |
| `gripapps/gripc/src/parse.ts` | Parse `vibe`/`motion`, hero props, `sprite id emoji "..."` |
| `gripapps/gripc/src/validate.ts` | Theme list; optional visual lint helpers |
| `gripapps/gripc/src/visual.ts` | Detect text+button-only apps (for `--visual`) |
| `gripapps/gripc/src/codegen.ts` | Emit new IR fields |
| `gripapps/gripc/src/enrich.ts` | Enrich checklist / stub notes writer |
| `gripapps/gripc/src/cli.ts` | `enrich`, `check --visual` |
| `public/gripapps/runtime.js` | Themes, hero, emoji sprites, motion, light tick |
| `public/gripapps/VERSION` | Bump for CDN cache bust |
| `gripapps/templates/visual_play.grip` | Default visual starter |
| `gripapps/templates/*` | Touch meme/arena for emoji sprites / vibe |
| `docs/gripapps/*` | LANGUAGE, COOKBOOK, RUNTIME, AGENT_GUIDE, README |
| `.cursor/skills/gripapps/SKILL.md` | draft → enrich → check → build |
| `supabase/functions/community-orchestrator/cursor.ts` | Prompt retarget |
| `public/community/gripapps-demo/` | Rebuild demo with visual kit |
| `tests/unit/gripapps/*.test.ts` | Parser/validate/visual/runtime contracts |
| `e2e/gripapps.spec.ts` | Assert hero/canvas/emoji presence |

---

### Task 1: Theme presets + scene `vibe` / `motion` parse

**Files:**
- Modify: `gripapps/gripc/src/tokens.ts`
- Modify: `gripapps/gripc/src/ast.ts`
- Modify: `gripapps/gripc/src/parse.ts`
- Modify: `gripapps/gripc/src/validate.ts`
- Modify: `gripapps/gripc/src/codegen.ts`
- Test: `tests/unit/gripapps/parse-visual.test.ts`

**Interfaces:**
- Consumes: existing `parseGrip`, `THEME_PRESETS`
- Produces:
  - `THEME_PRESETS` includes `lilgrip_default`, `neon_lagoon`, `barn_night`, `candy_arcade`, `deep_space`
  - `MOTION_PRESETS = bounce | float | pulse | none`
  - `SceneBlock = { id, vibe?: string, motion?: string, root }`
  - IR scenes include optional `vibe`, `motion`

- [ ] **Step 1: Write failing parse tests**

```ts
// tests/unit/gripapps/parse-visual.test.ts
import { describe, expect, it } from "vitest";
import { parseGrip } from "../../../gripapps/gripc/src/parse";

const SRC = `
meta {
  title "Vibe"
  blurb "neon"
  theme neon_lagoon
}

scene home {
  vibe neon_lagoon motion bounce
  stack {
    text "hi"
  }
}
`;

describe("parse vibe/motion", () => {
  it("parses scene vibe and motion", () => {
    const r = parseGrip(SRC, "app.grip");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ast.meta.theme).toBe("neon_lagoon");
    expect(r.ast.scenes[0]?.vibe).toBe("neon_lagoon");
    expect(r.ast.scenes[0]?.motion).toBe("bounce");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `bun run test tests/unit/gripapps/parse-visual.test.ts`  
Expected: FAIL (unknown theme and/or missing scene fields)

- [ ] **Step 3: Implement tokens + AST + parse + validate + codegen**

- Extend `THEME_PRESETS` and add `MOTION_PRESETS`
- Extend `SceneBlock` with optional `vibe` / `motion`
- In `parseSceneBlock`, after `scene <id> {`, accept lines `vibe <id>` and `motion <id>` before UI root
- Validate theme + vibe against presets; motion against `MOTION_PRESETS`
- Codegen: pass through on scene IR objects

- [ ] **Step 4: Run tests — expect PASS**

Run: `bun run test tests/unit/gripapps/parse-visual.test.ts`

- [ ] **Step 5: Commit**

```bash
git add gripapps/gripc/src/tokens.ts gripapps/gripc/src/ast.ts gripapps/gripc/src/parse.ts gripapps/gripc/src/validate.ts gripapps/gripc/src/codegen.ts tests/unit/gripapps/parse-visual.test.ts
git commit -m "feat(gripapps): parse scene vibe/motion and theme presets"
```

---

### Task 2: Rich `hero` + `sprite … emoji` parse

**Files:**
- Modify: `gripapps/gripc/src/ast.ts`
- Modify: `gripapps/gripc/src/parse.ts`
- Modify: `gripapps/gripc/src/codegen.ts`
- Modify: `tests/unit/gripapps/parse-visual.test.ts`

**Interfaces:**
- Consumes: Task 1 scene parsing
- Produces:
  - `hero` may be `{ kind:"hero", title?: string, blurb?: string, emoji?: string, children: UiNode[] }`
  - `sprite` may be `{ kind:"sprite", id: string, emoji?: string }`
  - Grammar:
    - inside hero block: `title "…"`, `blurb "…"`, `emoji "…"`, plus nested children
    - `sprite cow emoji "🐄"`

- [ ] **Step 1: Extend failing tests**

```ts
it("parses hero fields and sprite emoji", () => {
  const src = `
meta { title "T" blurb "b" theme lilgrip_default }
scene home {
  vibe lilgrip_default motion none
  stack {
    hero {
      title "Lagoon"
      blurb "toy lasers"
      emoji "🦈"
      text "go"
    }
    canvas {
      clear "#000"
      sprite cow emoji "🐄"
    }
  }
}
`;
  const r = parseGrip(src, "app.grip");
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  // walk AST / or compile and assert IR substrings
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement parse + AST + codegen**

Keep backward compatible: `hero { text … }` without title still works (children only).

- [ ] **Step 4: PASS + commit**

```bash
git commit -m "feat(gripapps): parse hero title/blurb/emoji and sprite emoji"
```

---

### Task 3: Runtime themes, hero, emoji sprites, motion, tick

**Files:**
- Modify: `public/gripapps/runtime.js`
- Modify: `public/gripapps/VERSION` (bump, e.g. `2`)
- Modify: `gripapps/gripc/src/boot-html.ts` / CLI default version if hardcoded
- Test: `tests/unit/gripapps/runtime-visual.test.ts` (source contract tests like existing slots test)

**Interfaces:**
- Consumes: IR with `meta.theme`, scene `vibe`/`motion`, hero fields, sprite.emoji
- Produces: visible themed UI; emoji on canvas sprites; CSS motion class; light drift tick (no-op under reduced motion)

- [ ] **Step 1: Write contract tests**

Assert `runtime.js` contains theme keys `neon_lagoon`, `barn_night`, `candy_arcade`, `deep_space`; `grip-hero-bleed` (or chosen class); draws sprite emoji via `fillText` or overlay; respects `prefers-reduced-motion`.

- [ ] **Step 2: FAIL → implement runtime**

- Expand `THEMES` map with gradients/tokens  
- Apply scene `vibe` over meta theme when present  
- Render hero as full-bleed block using title/blurb/emoji  
- Canvas sprites: draw emoji string at `id_x`/`id_y`  
- Add optional slow drift on sprites when `motion !== none`  
- Bump `VERSION`

- [ ] **Step 3: Re-vendor demo**

```bash
bun run gripc -- build public/community/gripapps-demo/app.grip --out public/community/gripapps-demo --handle gripapps-demo
# also copy public/gripapps/runtime.js → gripapps/runtime.js for Pages CDN path if that convention remains
```

- [ ] **Step 4: PASS + commit**

```bash
git commit -m "feat(gripapps): runtime themes, hero bleed, emoji sprites, motion"
```

---

### Task 4: Visual lint (`check --visual`) + enrich stub

**Files:**
- Create: `gripapps/gripc/src/visual.ts`
- Create: `gripapps/gripc/src/enrich.ts`
- Modify: `gripapps/gripc/src/cli.ts`
- Test: `tests/unit/gripapps/visual.test.ts`

**Interfaces:**
- Consumes: `GripApp` AST
- Produces:
  - `isVisuallyThin(ast): boolean` — true if no `hero`/`canvas`/`emoji_stage` and only text/button stacks
  - `gripc check --visual` → exit 1 with actionable hint when thin
  - `gripc enrich <file>` → writes/updates sibling `enrich-notes.md` with checklist (agent expands Grip; CLI does not call LLM)

- [ ] **Step 1: Failing tests for thin detection**

```ts
it("flags text+button only apps", () => {
  // parse hello-like AST → isVisuallyThin true
});
it("passes visual_play shape", () => {
  // hero+canvas → false
});
```

- [ ] **Step 2: Implement visual.ts + enrich.ts + CLI flags**

`enrich` stub behavior:
1. `gripc check` the file (must parse)
2. Write `enrich-notes.md` next to `app.grip` with required enrich checklist from the spec
3. Print next steps: expand Grip → check → build
4. Exit 0 if parse OK (agent does expansion)

- [ ] **Step 3: PASS + commit**

```bash
git commit -m "feat(gripapps): visual lint and enrich checklist CLI"
```

---

### Task 5: Templates + cookbook default

**Files:**
- Create: `gripapps/templates/visual_play.grip`
- Modify: `gripapps/templates/meme_stage.grip`, `arena.grip` (vibe + emoji sprites)
- Modify: `docs/gripapps/COOKBOOK.md`
- Modify: `public/community/gripapps-demo/app.grip` (switch demo to visual_play-based)

**Interfaces:**
- Consumes: Task 1–3 language/runtime
- Produces: default starter agents copy first

- [ ] **Step 1: Author `visual_play.grip`**

Must include: theme preset, `vibe`, `motion`, `hero` with emoji, `canvas` with emoji sprites, `score_hud`, particles, at least one play action.

- [ ] **Step 2: `gripc check` (+ `--visual`) and build smoke**

```bash
bun run gripc -- check gripapps/templates/visual_play.grip
bun run gripc -- check --visual gripapps/templates/visual_play.grip
bun run gripc -- build gripapps/templates/visual_play.grip --out /tmp/grip-visual --handle visual
```

- [ ] **Step 3: Update cookbook order (visual_play first); rebuild gripapps-demo**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(gripapps): visual_play template and demo"
```

---

### Task 6: Skill, docs, orchestrator prompts

**Files:**
- Modify: `.cursor/skills/gripapps/SKILL.md`
- Modify: `docs/gripapps/AGENT_GUIDE.md`
- Modify: `docs/gripapps/LANGUAGE.md`
- Modify: `docs/gripapps/RUNTIME.md`
- Modify: `docs/gripapps/README.md`
- Modify: `supabase/functions/community-orchestrator/cursor.ts`
- Optionally: `docs/community/DEPLOY.md` note to redeploy after prompt change

**Interfaces:**
- Consumes: enrich + visual kit
- Produces: agents required to draft visual Grip → enrich → check → build

- [ ] **Step 1: Update skill checklist**

Required steps:
1. Draft with theme + hero and/or canvas  
2. `gripc enrich` (expand thin lines; escalate to raw/three.js only if needed; keep notes)  
3. `gripc check` (+ `--visual`)  
4. `gripc build`  

Reject finals that are text+button only.

- [ ] **Step 2: Align LANGUAGE/RUNTIME/COOKBOOK with tokens + runtime**

- [ ] **Step 3: Update planner/builder prompts in `cursor.ts`**

- [ ] **Step 4: Commit**

```bash
git commit -m "docs(gripapps): visual enrich workflow for agents"
```

- [ ] **Step 5: Redeploy `community-orchestrator`** (verify_jwt false) after merge or in same change set if secrets allow

---

### Task 7: E2E + verification + spec status

**Files:**
- Modify: `e2e/gripapps.spec.ts`
- Modify: `docs/superpowers/specs/2026-10-28-gripapps-visual-enrich-design.md` (status → Implemented / caveats)
- Modify: `docs/superpowers/specs/2026-10-27-gripapps-design.md` if needed (pointer to visual enrich)

- [ ] **Step 1: Extend e2e**

- Block CDN or allow it; assert no `.grip-boundary`  
- Assert hero title or `.grip-hero` / bleed class visible  
- Assert canvas or emoji present  
- Keep wave/toast if demo still has it, or adapt to visual_play actions  

- [ ] **Step 2: Full gate**

```bash
bun run test
bun run check
bun run lint
bun run build
bun run test:e2e
bun run gripc -- check --visual gripapps/templates/visual_play.grip
```

- [ ] **Step 3: Commit + push + update PR**

```bash
git commit -m "test(gripapps): visual demo e2e and mark enrich design implemented"
```

---

## Execution handoff

After plan approval, use **subagent-driven-development** (recommended) starting at Task 1. Do not skip visual lint / skill updates — they are what stop agents from regressing to text+button walls.
