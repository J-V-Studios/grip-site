# Design: lilgrip.com Astro 7 modernization

**Date:** 2026-10-25  
**Status:** Approved in conversation (architecture, toolchain, agent DX, CI, product surface, cooler theme)  
**Owner:** the lilgriper / J-V-Studios/grip-site

---

## Intent and why

Rebuild lilgrip.com from a hand-rolled vanilla multi-page static site into a **cutting-edge, agent-friendly Astro 7** project that still feels chill and personal. The stack should feel modern (Bun, TypeScript, Tailwind v4, automated CI) without turning the product into a corporate dashboard or a terminal/hacker aesthetic.

**Success looks like:**
- Same charm: brand, verse, portrait, explore pages, grip sightings, notes
- Cooler visual theme (sky/blue-led Catppuccin, not pink-led)
- Agents can orient from `AGENTS.md` and ship changes safely via Bun + CI
- `lilgrip.com` keeps working on GitHub Pages via automated deploy

---

## Goals

1. Migrate all current routes and features into Astro 7 + TypeScript.
2. Use Bun for install, dev, build, and CI.
3. Make the repo extremely navigable for agents (docs, structure, rules, scripts).
4. Ship advanced automated CI that checks quality, types, tests, build, smoke, and deploys `main`.
5. Replace pink-primary UI with a cooler sky/blue Catppuccin theme that still has warmth.

## Non-goals

- Building out Church Apps / Fun Apps / About / Money content beyond current placeholders
- Adding user accounts / auth for notes or sightings
- Moving off GitHub Pages or off Supabase
- Introducing a second CSS framework or a full SPA router for marketing pages

## Anti-goals

- Terminal / hacker / “localhost console” chrome returning
- Pink-dominated “candy” look as the brand face
- Framework soup (Next + Remix + etc.) or abandoning static Pages hosting without a clear need
- Secrets or service-role keys in the client

---

## Approaches considered

| Option | Summary | Trade-off |
| --- | --- | --- |
| **A. Astro + TS + Tailwind + Supabase (chosen)** | Multi-page static site, islands for interactivity, GH Pages friendly | Best fit for this product |
| B. Next.js App Router | Full-stack app platform | Heavier; awkward on GH Pages |
| C. Vite + React SPA | Modern SPA tooling | Weaker multi-page/SEO story |

**Decision:** Approach A, upgraded per user direction to **Astro 7**, **Bun**, advanced CI, and cooler theme.

---

## Constraints

- Keep custom domain **lilgrip.com** on GitHub Pages (static `dist/` deploy).
- Preserve Supabase tables `lilgrip_comments`, `grip_sightings`, and bucket `grip-sightings` (anon select/insert).
- Preserve explore destinations: Church Apps, Fun Apps, About, Money??
- Node/Bun environment must satisfy Astro 7 requirements; document in `AGENTS.md`.
- Existing `.cursorrules` vanilla-only ban will be replaced to match this stack.

---

## Architecture

### Repo shape

```text
/
├── AGENTS.md
├── .cursorrules
├── package.json              # Bun scripts
├── bun.lock
├── astro.config.mjs
├── tsconfig.json
├── public/                   # CNAME, favicon, images
├── src/
│   ├── styles/global.css     # Tailwind v4 + @theme tokens
│   ├── layouts/BaseLayout.astro
│   ├── components/           # Header, Hero, ExploreCards, Footer, …
│   ├── components/islands/   # SightingsForm.tsx, NotesForm.tsx, …
│   ├── lib/supabase.ts
│   ├── lib/sightings.ts
│   ├── lib/notes.ts
│   ├── pages/
│   │   ├── index.astro
│   │   ├── church-apps.astro
│   │   ├── fun-apps.astro
│   │   ├── about.astro
│   │   └── money.astro
│   └── env.d.ts
├── tests/                    # Vitest unit tests
├── e2e/                      # Playwright smoke
├── docs/superpowers/specs/
├── docs/superpowers/plans/
├── OVERVIEW.md
├── TODO.md
└── .github/workflows/
    ├── ci.yml
    └── deploy.yml            # or combined with ci (main-only deploy job)
```

### Runtime model

- `output: 'static'` — HTML/CSS/JS assets in `dist/`
- Most UI is Astro (zero JS by default)
- Sightings + Notes use **React 19 islands** with `client:load` (or `client:visible` if sufficient)
- Supabase accessed only via publishable/anon env vars:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`

### Toolchain (locked)

| Layer | Choice |
| --- | --- |
| Framework | Astro 7 |
| Package manager / scripts | Bun (`bun install`, `bun run …`) |
| Astro CLI runtime | `bunx --bun astro …` for dev/build |
| Language | TypeScript (strict) |
| CSS | Tailwind CSS v4 via `@tailwindcss/vite` |
| Islands | React 19 |
| Data | `@supabase/supabase-js` v2 |
| Unit tests | Vitest |
| E2E smoke | Playwright |
| Lint/format | Biome (single pipeline; pedantic but one tool) |
| Unused code | knip in CI |
| Git hooks | lefthook running Biome on staged files |
| Dependency updates | Dependabot or Renovate for Bun + Actions |

**Builder call:** Prefer **Biome** over ESLint+Prettier to avoid dual formatters fighting. Prefer **lefthook** over Husky for Bun-friendly hooks.

---

## Visual theme (cooler)

Catppuccin mocha base; **sky/blue primary**, not pink.

| Role | Token | Value |
| --- | --- | --- |
| Background | `--color-base` | `#1e1e2e` |
| Text | `--color-text` | `#cdd6f4` |
| Muted | `--color-subtext` | `#a6adc8` |
| Primary | `--color-sky` | `#89dceb` |
| Secondary | `--color-blue` | `#89b4fa` |
| Status / cite | `--color-teal` | `#94e2d5` |
| Warm spark | `--color-peach` | `#fab387` (chill line only) |
| Rare accent | `--color-mauve` | `#cba6f7` |

Pink is not the brand face. Gradients use cool sky/blue/mauve haze. Soft motion and whitespace stay.

Portrait: maintain natural aspect (`object-fit: cover`, 3:4), no stretch.

---

## Product surface

### Routes

| Route | Content |
| --- | --- |
| `/` | Hero (brand, chill line, 1 Corinthians 16:14, portrait), explore cards, grip sightings, notes |
| `/church-apps` | Placeholder: “Church apps coming soon!” + back home |
| `/fun-apps` | Placeholder: “Fun projects and games coming soon!” |
| `/about` | Placeholder: “About page coming soon!” |
| `/money` | Placeholder: “Financial tools and ideas coming soon!” |

Shared `BaseLayout`: site header (brand + nav), footer.

### Features to migrate

**Notes**
- Form: name ≤ 24, body ≤ 200
- List latest comments from `lilgrip_comments`
- Anon insert/select only

**Grip sightings**
- Hunter name, optional place, photo upload ≤ 5MB
- +10 points per sighting
- Gallery + leaderboard by hunter
- Storage bucket `grip-sightings`
- Remember hunter name in `localStorage` key `lilgrip-hunter`

**Explore cards**
- Church Apps, Fun Apps, About, Money?? with hover lift

No terminal/node screen.

---

## Agent navigation plan

### Entry order
1. `AGENTS.md` — start here (commands, map, env, rules)
2. `.cursorrules` — enforceable short rules for this stack
3. `OVERVIEW.md` — design system + feature contracts
4. `docs/superpowers/specs/` + `plans/` — big-change history
5. `TODO.md` — living checklist

### `AGENTS.md` must include
- One-paragraph product description
- Exact Bun commands: `install`, `dev`, `build`, `preview`, `check`, `test`, `test:e2e`
- Directory map
- Feature/route map
- Env var names (never commit secrets)
- Deploy: CI builds `dist/`, Pages serves it; `public/CNAME` = `lilgrip.com`
- Do / don’t list (brand, stack boundaries, no service role key)

### Code conventions for agents
- One route per `src/pages/*.astro` file
- Shared chrome in layouts/components only
- All Supabase I/O through `src/lib/`
- Island `*.tsx` files start with a one-line purpose comment
- Path aliases `@/components`, `@/lib`, `@/styles`
- Prefer splitting files that exceed ~200 lines by responsibility

---

## CI / CD (advanced, automated)

### On pull requests and pushes
1. Setup Bun with cache; `bun install --frozen-lockfile`
2. Biome check (format + lint)
3. `astro check` (types)
4. knip (unused exports)
5. Vitest unit tests
6. `bunx --bun astro build`
7. Playwright smoke against preview (home + four subroutes + primary nav)
8. `bun audit` (or equivalent) for dependency advisories
9. Job summary with failures annotated

### On `main` only (after green CI)
- Deploy `dist/` to GitHub Pages via official actions (`upload-pages-artifact` + `deploy-pages`)
- Concurrency group cancels stale runs
- Optional path filter: docs-only changes can skip Playwright

### Local parity
Same script names as CI so agents don’t learn two worlds.

### Dependency automation
Dependabot or Renovate for npm/Bun ecosystem + GitHub Actions.

---

## Testing strategy

- **Vitest:** pure helpers (string cleaning, points aggregation, file extension mapping)
- **Playwright:** smoke routes render; nav links resolve; home shows brand + explore cards
- No requirement for full visual regression in v1 of this modernization

---

## Migration strategy

1. Scaffold Astro 7 app with Bun alongside / replacing root static files.
2. Move assets to `public/`; set `site` + Pages config; keep `CNAME`.
3. Port layouts/pages/components; apply cooler theme tokens.
4. Port notes + sightings into typed lib + React islands.
5. Delete obsolete root `index.html` / `styles.css` / `script.js` once parity is verified (or keep briefly behind a switch — **builder call:** delete after `bun run build` + smoke pass to avoid dual sources of truth).
6. Wire CI/deploy; update `AGENTS.md`, `.cursorrules`, `OVERVIEW.md`, `TODO.md`.
7. Verify production on `lilgrip.com` after first green deploy.

---

## Error handling

- Island forms: disable submit while uploading; show plain-language errors on upload/insert failure
- Empty states for notes/sightings preserved
- CI fails closed on check/test/build/smoke failures; no deploy on red

---

## What’s left to the builder

- Exact Astro 7 / React / Tailwind / Biome package versions at install time (`bun create` / latest compatible)
- Whether CI is one workflow file or `ci.yml` + `deploy.yml` (either fine if checks gate deploy)
- Exact Playwright selector strategy for smoke tests
- Minor spacing/type scale polish within the cooler token set

---

## Approval record

- Approach A chosen; user requested Astro 7 + Bun + cutting-edge tooling
- Advanced automated CI approved
- Cooler sky/blue theme approved (less pink)
- Architecture / agent plan / product surface approved in chat (`approve`)
