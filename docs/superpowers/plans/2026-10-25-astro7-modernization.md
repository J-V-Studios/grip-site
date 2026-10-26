# Astro 7 lilgrip.com Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate lilgrip.com from vanilla static HTML into an Astro 7 + Bun + TypeScript + Tailwind v4 site with cooler sky/blue theme, React islands for notes/sightings, agent docs, and advanced CI that deploys to GitHub Pages.

**Architecture:** Static Astro 7 app under `src/` with `public/` assets (`CNAME`, images). Shared `BaseLayout` + components; Supabase I/O in `src/lib/`; Notes and Sightings as React 19 islands. CI on Bun runs Biome, `astro check`, knip, Vitest, build, Playwright smoke; `main` deploys `dist/` to Pages.

**Tech Stack:** Astro 7, Bun, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), React 19, `@supabase/supabase-js`, Vitest, Playwright, Biome, knip, lefthook, GitHub Actions Pages deploy.

**Spec:** `docs/superpowers/specs/2026-10-25-astro7-modernization-design.md`

## Global Constraints

- Astro **7.x**, Bun for install/dev/build (`bunx --bun astro …`)
- Static output only (`output: 'static'`) for GitHub Pages + `lilgrip.com`
- Theme: Catppuccin mocha with **sky/blue primary** — pink is not the brand face
- Preserve routes: `/`, `/church-apps`, `/fun-apps`, `/about`, `/money`
- Preserve features: hero + verse + portrait, explore cards, grip sightings (+10 pts), notes
- Env: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` only (anon/publishable)
- No terminal/hacker chrome; keep chill brand voice
- Path aliases: `@/components`, `@/lib`, `@/styles`
- After Astro parity, delete root `index.html`, `styles.css`, `script.js`, and old sibling HTML pages to avoid dual sources of truth
- Frequent commits; TDD for pure helpers before UI wiring

---

## File structure (target)

| Path | Responsibility |
| --- | --- |
| `package.json` / `bun.lock` | Scripts + deps |
| `astro.config.mjs` | Static site, Tailwind vite plugin, React integration |
| `tsconfig.json` | Strict TS + `@/*` paths |
| `biome.json` | Lint + format |
| `lefthook.yml` | Pre-commit Biome |
| `public/CNAME` | `lilgrip.com` |
| `public/favicon.svg` | Icon |
| `public/images/lilgriper.jpg` | Hero photo |
| `src/styles/global.css` | Tailwind import + `@theme` tokens |
| `src/layouts/BaseLayout.astro` | HTML shell, header/footer slot |
| `src/components/SiteHeader.astro` | Brand + nav |
| `src/components/SiteFooter.astro` | Footer |
| `src/components/Hero.astro` | Home hero |
| `src/components/ExploreCards.astro` | Four explore cards |
| `src/components/PlaceholderPage.astro` | Subpage placeholder pattern |
| `src/components/islands/NotesPanel.tsx` | Notes form + list |
| `src/components/islands/SightingsPanel.tsx` | Sightings form + gallery + board |
| `src/lib/text.ts` | `clean()` |
| `src/lib/sightings.ts` | points aggregate, extFor, photo path helpers |
| `src/lib/supabase.ts` | Browser Supabase client |
| `src/pages/*.astro` | Routes |
| `tests/unit/*.test.ts` | Vitest |
| `e2e/smoke.spec.ts` | Playwright |
| `AGENTS.md`, `.cursorrules`, `OVERVIEW.md`, `TODO.md` | Agent + human docs |
| `.github/workflows/ci.yml` | Quality + test + build + smoke + deploy |

---

### Task 1: Scaffold Astro 7 + Bun toolchain

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `biome.json`, `lefthook.yml`, `src/env.d.ts`, `.gitignore` (Astro defaults)
- Create: `public/CNAME`, move assets into `public/`
- Modify: keep `docs/` intact

**Interfaces:**
- Produces: `bun run dev|build|preview|check|test|test:e2e|lint` scripts; `@/*` path alias

- [ ] **Step 1: Ensure Bun is available**

Run: `bun --version`  
Expected: a Bun version prints (install Bun if missing per https://bun.sh)

- [ ] **Step 2: Scaffold Astro 7 in the repo root without wiping docs**

Prefer creating into a temp dir then merging, or `bunx create-astro@latest .` with careful flags if empty enough. Required result:

```json
{
  "name": "grip-site",
  "type": "module",
  "scripts": {
    "dev": "bunx --bun astro dev",
    "build": "bunx --bun astro build",
    "preview": "bunx --bun astro preview",
    "check": "bunx --bun astro check",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

Install: `astro@^7`, `@astrojs/react`, `react`, `react-dom`, `@types/react`, `@types/react-dom`, `typescript`, `tailwindcss`, `@tailwindcss/vite`, `@supabase/supabase-js`, `vitest`, `@playwright/test`, `@biomejs/biome`, `knip`, `lefthook`, `@types/bun` as needed.

- [ ] **Step 3: Write `astro.config.mjs`**

```js
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://lilgrip.com",
  output: "static",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 4: Write `tsconfig.json` with strict + paths**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  },
  "include": ["src", "tests", "e2e"]
}
```

- [ ] **Step 5: Move static assets**

- `public/CNAME` contents exactly: `lilgrip.com`
- Copy `favicon.svg` → `public/favicon.svg`
- Copy `images/lilgriper.jpg` → `public/images/lilgriper.jpg`

- [ ] **Step 6: Verify build scaffolding**

Run: `bun install && bun run build`  
Expected: `dist/` created without errors (default Astro page OK for now)

- [ ] **Step 7: Commit**

```bash
git add package.json bun.lock astro.config.mjs tsconfig.json biome.json lefthook.yml src public .gitignore
git commit -m "chore: scaffold Astro 7 with Bun and Tailwind v4"
```

---

### Task 2: Global theme tokens (cooler sky/blue)

**Files:**
- Create: `src/styles/global.css`
- Modify: `src/layouts` will import this in Task 3

**Interfaces:**
- Produces: CSS theme tokens `--color-sky`, `--color-blue`, `--color-teal`, `--color-peach`, `--color-mauve`, `--color-base`, `--color-text`, `--color-subtext`

- [ ] **Step 1: Write `src/styles/global.css`**

```css
@import "tailwindcss";

@theme {
  --color-base: #1e1e2e;
  --color-surface: #262637;
  --color-surface-soft: #313244;
  --color-text: #cdd6f4;
  --color-subtext: #a6adc8;
  --color-sky: #89dceb;
  --color-blue: #89b4fa;
  --color-teal: #94e2d5;
  --color-peach: #fab387;
  --color-mauve: #cba6f7;
  --font-sans: "Outfit", "Avenir Next", "Segoe UI", sans-serif;
  --font-display: "Fraunces", Georgia, serif;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--color-base);
  color: var(--color-text);
  font-family: var(--font-sans);
}

img {
  display: block;
  max-width: 100%;
  height: auto;
}
```

- [ ] **Step 2: Confirm pink is not used as primary brand color in this file**

Run: `rg -n "f38ba8|#ff|pink" src/styles/global.css`  
Expected: no pink primary brand hex (peach `#fab387` for chill line only is OK)

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add cooler Catppuccin sky/blue theme tokens"
```

---

### Task 3: Base layout, header, footer

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/SiteHeader.astro`
- Create: `src/components/SiteFooter.astro`

**Interfaces:**
- Consumes: `src/styles/global.css`
- Produces: layout accepting `title`, `description`, default slot

- [ ] **Step 1: Implement `SiteHeader.astro` with nav links**

Links: `/`, `/church-apps`, `/fun-apps`, `/about`, `/money`  
Brand text: `the lilgriper` with `lilgriper` in `text-sky`  
Mark current page with `aria-current="page"` when path matches.

- [ ] **Step 2: Implement `SiteFooter.astro`**

Copy: `the lilgriper · just a chill guy`

- [ ] **Step 3: Implement `BaseLayout.astro`**

Import global CSS + Google fonts (Outfit + Fraunces). Render header, `<main>`, footer. Set `<title>` and meta description from props.

- [ ] **Step 4: Point temporary `src/pages/index.astro` at BaseLayout**

Minimal page proving layout renders.

- [ ] **Step 5: Run build**

Run: `bun run build`  
Expected: success

- [ ] **Step 6: Commit**

```bash
git add src/layouts src/components/SiteHeader.astro src/components/SiteFooter.astro src/pages/index.astro
git commit -m "feat: add BaseLayout with shared header and footer"
```

---

### Task 4: Home hero + explore cards

**Files:**
- Create: `src/components/Hero.astro`
- Create: `src/components/ExploreCards.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Portrait uses `/images/lilgriper.jpg` with `aspect-[3/4] object-cover object-top`
- Cards link to the four subroutes

- [ ] **Step 1: Build `Hero.astro`**

Include eyebrow `lilgrip.com`, h1 `the lilgriper` (sky accent), chill line in peach, blockquote 1 Corinthians 16:14, portrait figure.

- [ ] **Step 2: Build `ExploreCards.astro`**

Four cards: Church Apps, Fun Apps, About, Money?? with short copy matching current site intent.

- [ ] **Step 3: Compose home page**

`index.astro` renders Hero + ExploreCards inside BaseLayout.

- [ ] **Step 4: Build + visual sanity**

Run: `bun run build && bun run preview`  
Open home; confirm portrait not stretched and accents are sky/blue not pink.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.astro src/components/ExploreCards.astro src/pages/index.astro
git commit -m "feat: port home hero and explore cards"
```

---

### Task 5: Subpages

**Files:**
- Create: `src/components/PlaceholderPage.astro`
- Create: `src/pages/church-apps.astro`, `fun-apps.astro`, `about.astro`, `money.astro`

**Interfaces:**
- `PlaceholderPage` props: `eyebrow`, `title`, `lede`, `message`

- [ ] **Step 1: Implement PlaceholderPage**

Message block + link “Back to Home” → `/`

- [ ] **Step 2: Create four pages with approved placeholder copy**

- Church: `Church apps coming soon!`
- Fun: `Fun projects and games coming soon!`
- About: `About page coming soon!`
- Money: `Financial tools and ideas coming soon!`

- [ ] **Step 3: Build**

Run: `bun run build`  
Expected: routes present under `dist/`

- [ ] **Step 4: Commit**

```bash
git add src/components/PlaceholderPage.astro src/pages
git commit -m "feat: add placeholder explore pages"
```

---

### Task 6: Pure helpers with TDD (`clean`, points, ext)

**Files:**
- Create: `src/lib/text.ts`
- Create: `src/lib/sightings.ts`
- Create: `tests/unit/text.test.ts`
- Create: `tests/unit/sightings.test.ts`
- Modify: `package.json` / `vitest.config.ts` if needed

**Interfaces:**
- Produces:
  - `clean(value: string, max: number): string`
  - `aggregatePoints(rows: { hunter: string; points: number }[]): Map<string, number>`
  - `rankedLeaders(rows: …, limit = 10): { hunter: string; points: number }[]`
  - `extFor(file: { name: string; type: string }): string`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/text.test.ts
import { describe, expect, it } from "vitest";
import { clean } from "@/lib/text";

describe("clean", () => {
  it("trims, collapses spaces, and clamps length", () => {
    expect(clean("  hello   world  ", 8)).toBe("hello wo");
  });
});
```

```ts
// tests/unit/sightings.test.ts
import { describe, expect, it } from "vitest";
import { aggregatePoints, extFor, rankedLeaders } from "@/lib/sightings";

describe("sightings helpers", () => {
  it("aggregates points by hunter", () => {
    const map = aggregatePoints([
      { hunter: "a", points: 10 },
      { hunter: "b", points: 10 },
      { hunter: "a", points: 10 },
    ]);
    expect(map.get("a")).toBe(20);
  });

  it("ranks leaders descending", () => {
    const ranked = rankedLeaders([
      { hunter: "a", points: 10 },
      { hunter: "b", points: 30 },
    ]);
    expect(ranked[0]).toEqual({ hunter: "b", points: 30 });
  });

  it("maps jpeg extension", () => {
    expect(extFor({ name: "x.JPEG", type: "image/jpeg" })).toBe("jpg");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `bun run test`  
Expected: FAIL (modules missing)

- [ ] **Step 3: Implement helpers**

```ts
// src/lib/text.ts
export function clean(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}
```

```ts
// src/lib/sightings.ts
export function aggregatePoints(
  rows: { hunter: string; points: number }[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.hunter, (totals.get(row.hunter) ?? 0) + row.points);
  }
  return totals;
}

export function rankedLeaders(
  rows: { hunter: string; points: number }[],
  limit = 10,
): { hunter: string; points: number }[] {
  return [...aggregatePoints(rows).entries()]
    .map(([hunter, points]) => ({ hunter, points }))
    .sort((a, b) => b.points - a.points || a.hunter.localeCompare(b.hunter))
    .slice(0, limit);
}

export function extFor(file: { name: string; type: string }): string {
  const fromName = (file.name.split(".").pop() || "").toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  return map[file.type] || "jpg";
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `bun run test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/text.ts src/lib/sightings.ts tests vitest.config.ts
git commit -m "feat: add tested text and sightings helpers"
```

---

### Task 7: Supabase client + notes/sightings data access

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/notes.ts`
- Extend: `src/lib/sightings.ts` with fetch/insert helpers (keep pure helpers intact)
- Create: `.env.example`

**Interfaces:**
- Produces:
  - `getSupabase(): SupabaseClient`
  - `fetchNotes(): Promise<Note[]>`
  - `insertNote(input: { name: string; body: string }): Promise<{ error: string | null }>`
  - `fetchSightings(): Promise<Sighting[]>`
  - `uploadSightingPhoto(file: File): Promise<{ path: string | null; error: string | null }>`
  - `insertSighting(...): Promise<{ error: string | null }>`
  - `publicPhotoUrl(path: string): string`
- Types: `Note { id, name, body }`, `Sighting { id, hunter, place, photo_path, points, created_at }`

- [ ] **Step 1: Add `.env.example`**

```bash
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_publishable_or_anon_key
```

- [ ] **Step 2: Implement `getSupabase` reading `import.meta.env.PUBLIC_*`**

Throw a clear error if missing when called from the browser island.

- [ ] **Step 3: Implement notes/sightings API wrappers using existing table/bucket names**

Tables/bucket exactly: `lilgrip_comments`, `grip_sightings`, `grip-sightings`.

- [ ] **Step 4: Commit**

```bash
git add src/lib .env.example
git commit -m "feat: add typed Supabase client for notes and sightings"
```

---

### Task 8: React islands — Notes + Sightings

**Files:**
- Create: `src/components/islands/NotesPanel.tsx`
- Create: `src/components/islands/SightingsPanel.tsx`
- Modify: `src/pages/index.astro` to mount islands with `client:load`

**Interfaces:**
- Consumes: lib helpers from Tasks 6–7
- Points per sighting: `10`
- localStorage key: `lilgrip-hunter`

- [ ] **Step 1: Implement NotesPanel**

Load list on mount; submit inserts then refreshes; show hint errors in plain language.

- [ ] **Step 2: Implement SightingsPanel**

Form (hunter, place, photo), points chip, gallery, leaderboard using `rankedLeaders`.

- [ ] **Step 3: Mount on home**

```astro
<NotesPanel client:load />
<SightingsPanel client:load />
```

- [ ] **Step 4: Build**

Run: `bun run build`  
Expected: success with hydrated islands referenced

- [ ] **Step 5: Manual smoke with env set**

Run: `bun run dev` with real `.env`  
Post a note; confirm it appears. Skip photo upload if no camera — still verify empty states render.

- [ ] **Step 6: Commit**

```bash
git add src/components/islands src/pages/index.astro
git commit -m "feat: add Notes and Sightings React islands"
```

---

### Task 9: Agent docs + rules refresh

**Files:**
- Create: `AGENTS.md`
- Modify: `.cursorrules`, `OVERVIEW.md`, `TODO.md`, `README.md`

**Interfaces:**
- `AGENTS.md` is the start-here file described in the spec

- [ ] **Step 1: Write `AGENTS.md`** with commands, map, env, deploy, do/don’t

- [ ] **Step 2: Replace vanilla-only `.cursorrules` with Astro 7 + Bun rules**

Include: sky/blue theme, no pink-primary brand, no terminal chrome, prefer `src/lib` for data.

- [ ] **Step 3: Update OVERVIEW/TODO/README for Astro structure**

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md .cursorrules OVERVIEW.md TODO.md README.md
git commit -m "docs: add agent entrypoint and Astro stack rules"
```

---

### Task 10: Playwright smoke + Vitest already green

**Files:**
- Create: `e2e/smoke.spec.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Write smoke spec**

```ts
import { test, expect } from "@playwright/test";

test("home and explore routes render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /lilgriper/i })).toBeVisible();
  await page.getByRole("link", { name: "Church Apps" }).first().click();
  await expect(page.getByText(/Church apps coming soon/i)).toBeVisible();
  await page.goto("/fun-apps");
  await expect(page.getByText(/Fun projects and games coming soon/i)).toBeVisible();
  await page.goto("/about");
  await expect(page.getByText(/About page coming soon/i)).toBeVisible();
  await page.goto("/money");
  await expect(page.getByText(/Financial tools and ideas coming soon/i)).toBeVisible();
});
```

- [ ] **Step 2: Configure Playwright to run against `bun run preview` on port 4321 after build**

- [ ] **Step 3: Run**

Run: `bun run build && bun run test:e2e`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add e2e playwright.config.ts
git commit -m "test: add Playwright smoke for core routes"
```

---

### Task 11: Advanced CI + Pages deploy

**Files:**
- Create: `.github/workflows/ci.yml`
- Remove obsolete Pages workflow leftovers if conflicting

- [ ] **Step 1: Write CI workflow**

Jobs:
1. `quality` — Bun setup, frozen lockfile, `bun run lint`, `bun run check`, knip, `bun run test`
2. `build` — `bun run build`, upload `dist` artifact
3. `smoke` — needs build, Playwright vs preview
4. `deploy` — `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`, permissions `pages: write` + `id-token: write`, upload-pages-artifact + deploy-pages

Include concurrency cancel; Bun cache; job summaries on failure.

- [ ] **Step 2: Ensure `public/CNAME` remains in build output**

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add Bun quality, smoke, and Pages deploy pipeline"
```

---

### Task 12: Remove legacy vanilla sources

**Files:**
- Delete: root `index.html`, `styles.css`, `script.js`, `about.html`, `church-apps.html`, `fun-apps.html`, `money.html`, old root `favicon.svg` / `images/` if fully moved, old `.nojekyll` only if Pages deploy no longer needs it (Astro/`dist` deploy typically fine without; keep `public/.nojekyll` empty file if required)

- [ ] **Step 1: Confirm Astro build contains all routes and assets**

Run: `bun run build && ls dist && test -f dist/CNAME`

- [ ] **Step 2: Delete legacy files listed above**

- [ ] **Step 3: Re-run unit + e2e**

Run: `bun run test && bun run build && bun run test:e2e`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove legacy vanilla site sources"
```

---

### Task 13: Final verification checklist

- [ ] **Step 1: Run full local gate**

```bash
bun run lint
bun run check
bun run test
bun run build
bun run test:e2e
```

Expected: all green

- [ ] **Step 2: Confirm theme**

Home wordmark/CTAs use sky/blue; peach only on chill line; no pink-dominant chrome

- [ ] **Step 3: Push branch and confirm CI**

Push feature branch; wait for GitHub Actions green; merge/deploy per finishing skill later

- [ ] **Step 4: Commit any doc fixes if needed**

```bash
git commit -m "docs: finalize modernization handoff notes"
```

---

## Spec coverage self-review

| Spec requirement | Task |
| --- | --- |
| Astro 7 + Bun + TS + Tailwind v4 | 1 |
| Cooler sky/blue theme | 2, 4 |
| Base layout / nav / pages | 3–5 |
| Notes + sightings + helpers | 6–8 |
| Agent DX docs/rules | 9 |
| Vitest + Playwright | 6, 10 |
| Advanced CI + Pages deploy | 11 |
| Remove dual vanilla sources | 12 |
| Portrait aspect / no stretch | 4 |
| No terminal chrome | 4–5, 9 |

## Placeholder scan

No TBD/TODO implementation holes remain in task steps; builder-flexible package exact patch versions are intentionally “latest compatible Astro 7 line at install time.”
