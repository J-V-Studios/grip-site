# GripApps — Design Spec

**Date:** 2026-10-27  
**Status:** Approved for implementation planning (pending final user review of this file)  
**Site:** lilgrip.com (`J-V-Studios/grip-site`)  
**Goal:** Extremely robust community mini-pages via an AI-first custom language (GripLang), cross-compiler (`gripc`), shared+vendored runtime, and a specialized agent skill that **replaces** freeform community Vite/React builds.

---

## 1. Product summary

Each visitor owns **one** fun community page at `/community/<handle>/`. Content can be almost anything (toys, memes, tools, stories, mini-games). Quality and reliability matter more than stack novelty.

| Rule | Choice |
| --- | --- |
| Primary author | Cursor agents (planner + builder), not end users writing code |
| Source language | **GripLang** (`.grip`) — AI-first, closed vocabulary |
| Compile | **`gripc`** cross-compiler → validated JS + boot shell |
| Runtime | Shared `/gripapps/runtime.js` + **vendored fallback** per handle |
| Escape hatch | Controlled `raw/` modules via host API (not free eval) |
| Agent skill | `.cursor/skills/gripapps/` **replaces** `community-builder` |
| Sandbox | Unchanged: writes only `public/community/<handle>/**` |
| Robustness bar | Compiler + runtime defaults prevent blank/broken pages |

**Non-goals (v1):**
- Human IDE for GripLang (agents are the primary authors)
- Server-side community APIs inside GripApps
- Forcing rewrite of already-live community pages
- Full React/Three as the default path

---

## 2. Architecture

```
visitor prompt
  → orchestrator (moderation + elaborate brief)
  → GripApps PLANNER (skill)
  → GripApps BUILDER (skill)
       writes app.grip (+ optional raw/)
       runs gripc check && gripc build
       vendors runtime into handle folder
  → public/community/<handle>/
  → path-guard (+ gripc check) → auto-merge → Pages
```

### Shipped handle layout

```text
public/community/<handle>/
  index.html              # thin boot shell (loads runtime, mounts app)
  app.grip                # GripLang source (required for new builds)
  app.grip.js             # compiler output (required)
  manifest.json           # gallery metadata (from GripLang meta / gripc)
  vendor/gripapps/        # pinned runtime fallback (required)
    runtime.js
    VERSION
  raw/                    # optional escape-hatch ES modules
```

### Shared runtime (core site)

```text
public/gripapps/
  runtime.js              # current shared runtime
  runtime.js.map          # optional
  VERSION                 # semver or date stamp
```

**Load order (robust):**
1. Try `https://lilgrip.com/gripapps/runtime.js?v=<VERSION>`
2. On failure → `./vendor/gripapps/runtime.js`
3. Boot compiled `app.grip.js`
4. On uncaught errors → runtime error boundary UI (retry), never silent blank page

Community agents **must not** modify `public/gripapps/**` (core). They only vendor a copy into their handle folder.

---

## 3. GripLang (AI-first language)

GripLang exists so Cursor agents can write correct, rich mini-apps with **minimal tokens** and **maximal robustness**.

### Design principles

1. **One obvious way** for each common pattern (no synonym soup).
2. **Verbose, stable keywords** agents can memorize from the skill (`scene`, `button`, `state`, `action`) — avoid clever punctuation.
3. **Closed vocabulary** documented in the skill + language reference; unknown keywords are hard compiler errors.
4. **Templates first:** cookbook recipes (“clicker”, “meme stage”, “story”, “arena”) that agents copy and edit.
5. **Diagnostics agents can fix in one pass:** file + line + expected shape + example fix.
6. **Explicit over implicit** for control flow and state updates.
7. **JSON-serializable state only** (no functions in state).
8. **No `eval`** of visitor text or generated strings as code.

### Conceptual shape

```grip
meta {
  title "Bouncy Blue"
  blurb "a chill square that refuses to sit still"
  theme lilgrip_default
}

shell {
  header on
  vibe goofy
}

state {
  score 0
  alive true
}

scene home {
  stack {
    text "welcome to my page"
    button start label "play" -> action start_game
  }
}

scene game {
  canvas {
    clear "#89dceb"
    // play blocks: sprite, timer, particles, score_hud, ...
  }
}

action start_game {
  set alive true
  goto game
}
```

*(Exact grammar is fixed in the implementation plan / language reference; this shape is normative for v1.)*

### Built-in block families (v1)

| Family | Blocks (illustrative closed set) |
| --- | --- |
| Layout | `stack`, `grid`, `hero`, `card`, `modal` |
| UI | `text`, `button`, `toggle`, `slider`, `tabs`, `toast` |
| Play | `canvas`, `sprite`, `timer`, `score_hud`, `particles` |
| Media | `image`, `emoji_stage` (SFX optional, muted-default mobile) |
| Flow | `goto`, `back`, hash deep-link via scene ids |
| Escape | `raw_module`, `raw_slot` |

### Escape hatch

```grip
raw_module "./raw/extra.js" export mount_hud into slot hud
```

Compiled to a sandboxed host call. Raw modules receive a **small host API** only (`host.ui`, `host.state`, `host.scene`, `host.toast`) — not unrestricted DOM/globals beyond what’s needed to mount into a named slot.

---

## 4. Cross-compiler (`gripc`)

### Location

`gripapps/gripc/` (package in-repo; runnable via `bun`/`node`).

### Commands

| Command | Purpose |
| --- | --- |
| `gripc check <file>` | Type/schema/diagnostics only (CI + agents) |
| `gripc build <file> --out <dir>` | Emit `app.grip.js`, boot `index.html` (if missing), merge `manifest.json` fields from `meta` |
| `gripc vendor-runtime --out <dir>` | Copy current `public/gripapps/*` into `vendor/gripapps/` |

### Compiler responsibilities (robustness)

- Parse GripLang → AST
- Validate closed keywords, scene graph, action names, state types
- Inject runtime safety defaults (reduced-motion wrappers, error boundary hooks)
- Emit versioned compile target the runtime understands (`apiVersion`)
- Fail loud with actionable diagnostics
- Never emit code that `eval`s user strings

### Compatibility

- Runtime supports current + previous `apiVersion` (N and N-1)
- Old live pages without GripLang remain static HTML as shipped; no forced migration

---

## 5. Runtime

### Responsibilities

- Load compiled app
- Render shell + scenes
- Own game/UI loops where declared
- Enforce mobile-friendly defaults and `prefers-reduced-motion`
- Host API for raw modules
- Global error boundary + retry
- Shared/vendored dual-load

### Non-responsibilities

- Network calls to private APIs
- Access outside the handle’s static assets
- Mutating core lilgrip site

### Theming

Default theme tokens align with lilgrip (sky / peach / mauve / chill). GripLang `theme` may pick named presets; arbitrary CSS injection is limited to allowlisted token overrides.

---

## 6. Specialized agent skill & docs

### Skill (replaces community-builder)

Path: `.cursor/skills/gripapps/SKILL.md`

Must cover:

- Planner vs builder modes
- Hard path allow/deny (same sandbox as community builds)
- “Always GripLang first; escape hatch only when plan says so”
- Cookbook template selection
- Exact `gripc` commands
- Moderation pointer (`docs/community/MODERATION.md` remains policy; GripApps docs link it)
- Manifest + vendor-runtime requirements
- Tone: lilgrip goofy/chill

Deprecate/remove `.cursor/skills/community-builder` after GripApps skill ships (redirect stub allowed for one release).

### Docs

| Doc | Purpose |
| --- | --- |
| `docs/gripapps/README.md` | Index |
| `docs/gripapps/LANGUAGE.md` | GripLang reference (AI-oriented, closed vocabulary) |
| `docs/gripapps/COOKBOOK.md` | Copy-paste templates agents start from |
| `docs/gripapps/COMPILER.md` | `gripc` CLI + diagnostics |
| `docs/gripapps/RUNTIME.md` | Load order, host API, themes, error boundary |
| `docs/gripapps/AGENT_GUIDE.md` | Planner/builder handbook (replaces community AGENT_GUIDE for new builds) |

Update `docs/community/*` to point new builds at GripApps; keep moderation + deploy checklists.

### Orchestrator

Planner/builder Cloud Agent prompts must reference `.cursor/skills/gripapps/SKILL.md` and `docs/gripapps/*` instead of the old community-builder Vite path.

---

## 7. CI / auto-merge

Existing community path guard remains. Additions:

1. If `public/community/<handle>/app.grip` exists → run `gripc check` (fail on errors).
2. Require `app.grip.js`, `index.html`, `manifest.json`, `vendor/gripapps/runtime.js` for new GripApps builds.
3. Optional Playwright smoke: open `/community/<handle>/`, assert no error-boundary banner within N seconds.

Main site CI builds/publishes `public/gripapps/` with the rest of Pages.

---

## 8. Robustness bar (definition of done)

A GripApps build is “extremely robust” when:

- Invalid agent output fails at **compile** time with fixable errors
- Runtime never shows a blank white page on throw
- Mobile + reduced-motion work without agent remembering them
- Shared runtime outage does not kill pages (vendored fallback)
- Escape hatch cannot bypass sandbox path rules or inject secrets
- Gallery/manifest stay consistent via `meta` → `gripc` → `manifest.json`

Token efficiency is a supporting goal: agents edit templates and GripLang blocks instead of scaffolding Vite/React trees.

---

## 9. Migration plan

1. Land GripLang + `gripc` + runtime + docs + skill behind the new path.
2. Point orchestrator agent prompts at GripApps skill.
3. Replace/redirect `community-builder` skill.
4. Leave existing community HTML pages untouched.
5. New enqueues produce GripApps layouts only.

---

## 10. Open implementation details (resolved during planning, not product forks)

These are **not** undecided product choices; the implementation plan will pick concrete syntax/grammar and package layout:

- Exact GripLang grammar (parser tech: hand-rolled vs peggy/nearley — prefer simplest maintainable)
- `apiVersion` numbering scheme
- Whether cookbook templates live in `docs/gripapps/cookbook/*.grip` and/or `gripapps/templates/`

---

## 11. Related docs

- [Community builds design](./2026-10-26-community-builds-design.md) — product/sandbox/orchestrator (GripApps sits inside this)
- [Community moderation](../../community/MODERATION.md) — still applies
- Existing scaffold docs become historical once GripApps ships
