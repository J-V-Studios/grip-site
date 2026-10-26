# Goofy lilgrip redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the classic photo hero and cluttered sightings/notes home with a goofy meme-face splash, playful explore, and a say-hey pulse island.

**Architecture:** Static Astro pages; splash + explore as Astro components; one React island `SayHeyPanel` for the pulse interaction on existing `lilgrip_comments`. Sightings removed from the product surface.

**Tech Stack:** Astro 7, Bun, TypeScript, Tailwind v4, React 19 island, existing Supabase notes helpers.

**Spec:** `docs/superpowers/specs/2026-10-26-goofy-lilgrip-redesign-design.md`

## Global Constraints

- No classic two-column photo hero; meme PFP is the dominant first-viewport visual
- Asset: `public/images/lilgrip-meme.png`
- Remove grip sightings UI from home (and delete island)
- Say hey: one field + send → bloom pulse → quiet list; reuse `src/lib/notes.ts`
- Sky/blue brand-led; goofy tone; `prefers-reduced-motion` respected
- Keep routes `/`, `/church-apps`, `/fun-apps`, `/about`, `/money`
- After build, sync legacy Pages root artifacts for deploy

---

### Task 1: Global goofy motion + atmosphere tokens

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1:** Add atmosphere utilities / keyframes: `meme-float`, `sky-drift`, `explore-tilt`, `hey-bloom`; reduced-motion disables them
- [ ] **Step 2:** Commit `style: add goofy motion and atmosphere tokens`

---

### Task 2: Splash plane (replace Hero)

**Files:**
- Create: `src/components/SplashPlane.astro`
- Delete or stop using: `src/components/Hero.astro`

- [ ] **Step 1:** Build full-bleed splash with meme image, brand overlay, chill line, quiet verse, CTAs to `#explore` and `#say-hey`
- [ ] **Step 2:** Commit `feat: replace hero with goofy meme splash plane`

---

### Task 3: Playful explore + home composition

**Files:**
- Modify: `src/components/ExploreCards.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/layouts/BaseLayout.astro` (optional full-bleed main for splash)

- [ ] **Step 1:** Restyle explore for tilt/wobble hovers; section id `explore`
- [ ] **Step 2:** Home = SplashPlane + Explore + SayHey only (no sightings/notes)
- [ ] **Step 3:** Commit `feat: compose goofy home without sightings`

---

### Task 4: SayHey pulse island

**Files:**
- Create: `src/components/islands/SayHeyPanel.tsx`
- Delete: `src/components/islands/NotesPanel.tsx`, `SightingsPanel.tsx`
- Modify: `src/pages/index.astro`

- [ ] **Step 1:** Implement say-hey form + bloom + quiet list using `fetchNotes` / `insertNote`
- [ ] **Step 2:** Mount `client:load` with id `say-hey`
- [ ] **Step 3:** `bun run build` succeeds
- [ ] **Step 4:** Commit `feat: add say-hey pulse island; remove notes/sightings UI`

---

### Task 5: Docs, e2e, legacy publish sync

**Files:**
- Modify: `AGENTS.md`, `OVERVIEW.md`, `TODO.md`, `.cursorrules` as needed
- Modify: `e2e/smoke.spec.ts` if selectors change
- Sync root publish artifacts from `dist/`

- [ ] **Step 1:** Update agent docs (no sightings on site; meme splash; say hey)
- [ ] **Step 2:** Fix e2e if needed; `bun run lint && bun run check && bun run test && bun run build && bun run test:e2e`
- [ ] **Step 3:** Copy `dist/` publish files to root for legacy Pages
- [ ] **Step 4:** Commit `docs: align site docs with goofy redesign` (+ publish sync if separate)

---

### Task 6: PR

- [ ] Push branch and open/update PR vs `main`
