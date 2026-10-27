# Community Builds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship lilgrip’s main feature — visitors claim a handle, submit a prompt once per day, and get an auto-shipped sandboxed mini-page at `/community/<handle>/` built by Cursor Cloud Agents.

**Architecture:** Static Astro gallery UI talks to a Supabase Edge Function orchestrator (Cursor API key server-side). Orchestrator moderates → elaborates → launches planner then builder Cloud Agents that may only write `public/community/<handle>/**`. Path-guard CI auto-merges valid community PRs into `main` for Pages deploy.

**Tech Stack:** Astro 7, Bun, TypeScript, Tailwind v4, React 19 islands, Supabase (Postgres + Edge Functions), Cursor Cloud Agents API, GitHub Actions path-guard + auto-merge.

**Spec:** `docs/superpowers/specs/2026-10-26-community-builds-design.md`

## Global Constraints

- Cursor API key **never** in browser, Astro env, or committed files
- One page per handle; rebuild enqueue **once per UTC day**
- Hard sandbox: agents write only `public/community/<handle>/**`
- Advanced frameworks allowed **inside** that folder; ship static output
- Moderation: guns/goofy OK; no killing people / hate / CSAM / scams / sandbox escape
- Auto-merge only path-guarded `community/<handle>-*` branches
- Keep existing site (splash, say-hey, explore) working

## File map (create / modify)

| Path | Responsibility |
| --- | --- |
| `supabase/migrations/*_community.sql` | Tables, RLS, indexes |
| `supabase/functions/community-orchestrator/index.ts` | Claim, edit, enqueue, moderate, elaborate, launch agents, status updates |
| `src/lib/community.ts` | Public gallery fetch helpers (anon) |
| `src/lib/community-schema.ts` | Zod: handle, prompt, statuses |
| `src/pages/community/index.astro` | Gallery + claim/edit shell |
| `src/components/islands/CommunityHub.tsx` | Claim / edit / status React island |
| `src/components/ExploreCards.astro` | Add Community as primary explore card |
| `src/components/SiteHeader.astro` | Nav link Community |
| `public/community/.gitkeep` | Ensure folder exists |
| `.cursor/skills/community-builder/SKILL.md` | Agent skill |
| `docs/community/*.md` | AGENT_GUIDE, SCAFFOLD, MODERATION, README |
| `community-scaffold/` | Template mini-app agents copy |
| `.github/workflows/community-path-guard.yml` | Path guard + auto-merge |
| `tests/unit/community-schema.test.ts` | Schema / handle / limit helpers |
| `e2e/community.spec.ts` | Gallery route smoke |

---

### Task 1: Schema + Zod helpers (TDD)

**Files:**
- Create: `supabase/migrations/20261026_community_builds.sql`
- Create: `src/lib/community-schema.ts`
- Create: `tests/unit/community-schema.test.ts`

**Produces:**
- `normalizeHandle(input: string): string | null`
- `hey…` → `isValidHandle`, `promptSchema`, `BuildStatus` union
- SQL tables `community_creators`, `community_builds` per spec

- [ ] **Step 1:** Write failing unit tests for handle normalization (reject spaces, uppercase→slug, length 3–24) and prompt max 500
- [ ] **Step 2:** Run `bun run test tests/unit/community-schema.test.ts` — expect FAIL
- [ ] **Step 3:** Implement `community-schema.ts` until tests PASS
- [ ] **Step 4:** Write migration SQL (PKs, FKs, checks, RLS: public SELECT of live gallery fields only)
- [ ] **Step 5:** Apply migration via Supabase MCP `apply_migration` (or document CLI)
- [ ] **Step 6:** Commit `feat: community schema and zod helpers`

---

### Task 2: Public gallery data helper

**Files:**
- Create: `src/lib/community.ts`
- Test: extend unit tests or add `tests/unit/community.test.ts` with mocked supabase if needed

**Produces:**
- `fetchLiveCommunityPages(): Promise<CommunityGalleryItem[]>`
- type `CommunityGalleryItem { handle, title, blurb, updatedAt }`

- [ ] **Step 1:** Implement fetch of live builds + creators join for gallery (anon client)
- [ ] **Step 2:** Commit `feat: community gallery fetch helper`

---

### Task 3: Community skill + docs + scaffold

**Files:**
- Create: `.cursor/skills/community-builder/SKILL.md`
- Create: `docs/community/README.md`
- Create: `docs/community/AGENT_GUIDE.md`
- Create: `docs/community/SCAFFOLD.md`
- Create: `docs/community/MODERATION.md`
- Create: `community-scaffold/` (minimal Vite+React template with README build steps outputting to `dist/` → copied to `public/community/<handle>/`)

**Skill must state:**
- Planner vs builder modes
- Allow path `public/community/<HANDLE>/**` only
- Forbidden: `src/`, other handles, `.github/`, secrets
- Require `manifest.json`
- Point to `docs/community/*`
- Tone + moderation summary

- [ ] **Step 1:** Write MODERATION.md with allow/block examples from spec
- [ ] **Step 2:** Write SCAFFOLD.md + working `community-scaffold` that builds static `index.html`
- [ ] **Step 3:** Write AGENT_GUIDE.md + SKILL.md
- [ ] **Step 4:** Commit `docs: community agent skill, guide, and scaffold`

---

### Task 4: Orchestrator Edge Function (claim / edit / enqueue)

**Files:**
- Create: `supabase/functions/community-orchestrator/index.ts`
- Create: `supabase/functions/community-orchestrator/moderation.ts`
- Create: `supabase/functions/community-orchestrator/cursor.ts`
- Create: `.env.example` entries for function secrets (names only)

**Produces HTTP actions (JSON):**
- `POST { action: "claim", handle }` → `{ handle, editCode }` (code once)
- `POST { action: "enqueue", handle, editCode, prompt }` → `{ buildId, status }`
- `GET ?action=status&buildId=` → build row public fields
- `GET ?action=gallery` optional (or keep gallery on anon Supabase)

**Steps:**
- [ ] **Step 1:** Implement claim: validate handle, generate edit code, hash store, return plaintext once
- [ ] **Step 2:** Implement enqueue: verify code, ban check, UTC-day limit, insert build `queued`
- [ ] **Step 3:** Implement moderation stub (keyword/rules first; optional LLM later) — reject sets `rejected`
- [ ] **Step 4:** Implement elaborator (template or LLM) writing `elaborated_brief`
- [ ] **Step 5:** Wire `cursor.ts` to Cloud Agents API create agent (planner prompt referencing skill/docs); persist agent ids; then builder prompt
- [ ] **Step 6:** Document required secrets: `CURSOR_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, repo URL
- [ ] **Step 7:** Commit `feat: community orchestrator edge function`

---

### Task 5: CommunityHub UI + pages

**Files:**
- Create: `src/components/islands/CommunityHub.tsx`
- Create: `src/pages/community/index.astro`
- Modify: `src/components/SiteHeader.astro`
- Modify: `src/components/ExploreCards.astro`
- Create: `public/community/.gitkeep`
- Modify: `e2e/smoke.spec.ts` or add `e2e/community.spec.ts`

**UI:**
- Gallery of live cards
- Claim form + “save your edit code” warning
- Edit form: handle + code + prompt + submit
- Status panel for in-flight builds

- [ ] **Step 1:** Build `CommunityHub` island calling orchestrator URL from `PUBLIC_COMMUNITY_ORCHESTRATOR_URL`
- [ ] **Step 2:** Gallery page loads live items via `fetchLiveCommunityPages`
- [ ] **Step 3:** Add nav + explore card “Community” (main feature)
- [ ] **Step 4:** E2E: `/community` renders heading
- [ ] **Step 5:** Commit `feat: community gallery and claim/edit hub`

---

### Task 6: Path-guard CI + auto-merge

**Files:**
- Create: `.github/workflows/community-path-guard.yml`
- Modify: `.github/workflows/ci.yml` if needed so community-only PRs aren’t blocked incorrectly
- Modify: legacy publish sync to include `public/community` / `community` folder in dist root sync

**Workflow:**
- Trigger: `pull_request` on branches `community/**`
- Job: list changed files; must all match `public/community/<handle>/**` for single handle from branch name `community/<handle>-*`
- Require `index.html` + `manifest.json`
- On success: auto-merge with `GITHUB_TOKEN` (or `COMMUNITY_MERGE_TOKEN`)

- [ ] **Step 1:** Implement path-guard script (bash or node)
- [ ] **Step 2:** Add auto-merge step (permissions: contents/write, pull-requests/write)
- [ ] **Step 3:** Update publish-legacy-root to `cp -a dist/community ./community` when present
- [ ] **Step 4:** Commit `ci: community path guard and auto-merge`

---

### Task 7: End-to-end dry run (staging)

**Files:** none required beyond config

- [ ] **Step 1:** Deploy edge function; set secrets
- [ ] **Step 2:** Claim test handle; enqueue harmless prompt “make a bouncing blue square”
- [ ] **Step 3:** Confirm planner/builder agents run; PR only touches sandbox; auto-merges; page live at `/community/<handle>/`
- [ ] **Step 4:** Confirm second enqueue same UTC day is rejected
- [ ] **Step 5:** Confirm prompt “kill people” is rejected with vibe-check message
- [ ] **Step 6:** Commit any fixes; update `AGENTS.md` / `OVERVIEW.md` / `TODO.md`
- [ ] **Step 7:** Open/update PR summarizing feature

---

## Execution notes

- Prefer **subagent-driven-development**: one task per subagent, review between tasks.
- Do not put `CURSOR_API_KEY` in `.env.production` (that file is PUBLIC for Astro).
- Orchestrator URL is the only new `PUBLIC_*` var for the static site.
- If Cloud Agents API shapes differ slightly from docs, adapt `cursor.ts` to current OpenAPI; keep interfaces stable for the UI.
