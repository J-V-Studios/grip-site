# Community builds — deploy and smoke test

End-to-end checklist for the visitor community feature: Supabase Edge Function orchestrator, static site env, and optional live agent run.

## Prerequisites

- Supabase project `lendvtrjkehanndudjfd` with migrations applied (`community_creators`, `community_builds`, `community_gallery`, RLS as in repo migrations).
- Cursor Cloud Agents API key (Basic auth username for `CURSOR_API_KEY`).
- GitHub repo access for agent PRs (`J-V-Studios/grip-site` or set `COMMUNITY_REPO_URL` secret).

## 1. Edge Function (deployed)

**Live URL:** `https://lendvtrjkehanndudjfd.supabase.co/functions/v1/community-orchestrator`

- Gateway `verify_jwt` is **off** (site uses publishable `sb_publishable_…` keys, which are not JWTs).
- The function authorizes callers by matching the `apikey` header to `SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHABLE_KEYS` (auto-injected by the platform).
- Redeploy from repo: MCP `deploy_edge_function` or `supabase functions deploy community-orchestrator --project-ref lendvtrjkehanndudjfd` (see `supabase/config.toml`).
- **GripApps (required after Task 7+):** planner/builder Cloud Agent prompts live in `supabase/functions/community-orchestrator/cursor.ts`. They point agents at `.cursor/skills/gripapps/SKILL.md`, `docs/gripapps/AGENT_GUIDE.md`, and `docs/gripapps/COOKBOOK.md`, and require `app.grip` + `bun run gripc -- check` / `build` under `public/community/<handle>/`. Redeploy the edge function whenever that file changes so production enqueue runs use GripApps, not the legacy Vite scaffold.

## 2. Edge Function secrets

Set these under [Edge Function secrets](https://supabase.com/dashboard/project/lendvtrjkehanndudjfd/functions/secrets) — **never** commit real values or put them in `.env.production` (that file is public for Astro).

| Secret | Required | Purpose |
| --- | --- | --- |
| `CURSOR_API_KEY` | Yes | Launch planner/builder Cloud Agents (Cursor Dashboard → API Keys). |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto | Injected by Supabase for Edge Functions — do not override unless rotating |
| `EDIT_CODE_PEPPER` | Recommended | Extra entropy mixed into edit-code hashes |
| `COMMUNITY_CI_SECRET` | Recommended | Shared with GitHub Actions secret of the same name so merges can mark builds `live` |
| `COMMUNITY_REPO_URL` | No | Defaults to `https://github.com/J-V-Studios/grip-site` |

```bash
# Example (replace values; run from repo root with Supabase CLI linked)
supabase secrets set \
  CURSOR_API_KEY="..." \
  EDIT_CODE_PEPPER="..." \
  --project-ref lendvtrjkehanndudjfd
```

## 3. Static site (GitHub Pages / CI)

In repo or hosting env (not committed secrets):

| Variable | Required | Purpose |
| --- | --- | --- |
| `PUBLIC_SUPABASE_URL` | Yes | Existing anon client |
| `PUBLIC_SUPABASE_ANON_KEY` | Yes | Existing anon client |
| `PUBLIC_COMMUNITY_ORCHESTRATOR_URL` | Yes | **Only new** `PUBLIC_*` var for community UI |

Copy from `.env.example`, build with `bun run build`, deploy `dist/` as usual.

Local dev: `.env` with the same `PUBLIC_*` values; `bun run dev` → `/community`.

## 4. Smoke tests (manual)

### Without secrets (local / CI)

- [x] `bun run test` — includes `community-moderation` unit tests
- [x] `bun run check`, `bun run lint`, `bun run build`
- [x] `bun run test:e2e` — `/community` hub heading smoke

### Deployed orchestrator (no Cursor key yet)

- [x] **Deploy** `community-orchestrator` (`verify_jwt = false`, apikey gate)
- [x] Set `PUBLIC_COMMUNITY_ORCHESTRATOR_URL` in `.env.production` / CI vars
- [x] **Claim** works (201 + edit code); duplicate handle → 409
- [x] **Moderation:** prompt `kill people` → `rejected` + vibe-check message
- [x] **Second enqueue** same handle same UTC day → 429
- [ ] Set `CURSOR_API_KEY` (+ optional `EDIT_CODE_PEPPER`) in Edge Function secrets
- [ ] **Enqueue** harmless prompt: `make a bouncing blue square` → agents launch
- [ ] Confirm build status progresses (`queued` → `planning` → `building` → `live` or terminal state)
- [ ] Confirm planner/builder agents run; PR branch `community/<handle>-*` only touches `public/community/<handle>/`
- [ ] GripApps builder output: `app.grip`, `app.grip.js`, `index.html`, `manifest.json`, `vendor/gripapps/runtime.js` (path guard + CI `gripc check` when `app.grip` present)
- [ ] Confirm PR auto-merges (path guard workflow) and page is live at `/community/<handle>/`

### curl examples (after deploy)

```bash
ORCH_URL=https://lendvtrjkehanndudjfd.supabase.co/functions/v1/community-orchestrator
# Use the project publishable or legacy anon key on apikey only (not required on Authorization).

# Claim
curl -sS -X POST "$ORCH_URL" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"claim","handle":"smoke-test-7"}'

# Enqueue (harmless)
curl -sS -X POST "$ORCH_URL" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"enqueue","handle":"smoke-test-7","editCode":"...","prompt":"make a bouncing blue square"}'

# Status
curl -sS -G "$ORCH_URL" \
  -H "apikey: $ANON_KEY" \
  --data-urlencode "action=status" \
  --data-urlencode "buildId=..."
```

## 5. Moderation source of truth

Rule logic lives in `src/lib/community-moderation.ts` (unit tested). The edge function file `supabase/functions/community-orchestrator/moderation.ts` is a **mirror** — update both when changing rules. Policy narrative: [MODERATION.md](./MODERATION.md).

## 6. Related docs

- [README.md](./README.md) — doc index
- [AGENT_GUIDE.md](./AGENT_GUIDE.md) — planner/builder workflow
- [../superpowers/specs/2026-10-26-community-builds-design.md](../superpowers/specs/2026-10-26-community-builds-design.md) — product spec
- [../superpowers/specs/2026-10-27-gripapps-design.md](../superpowers/specs/2026-10-27-gripapps-design.md) — GripApps design (implemented)
- [../gripapps/README.md](../gripapps/README.md) — GripLang / `gripc` / runtime docs
