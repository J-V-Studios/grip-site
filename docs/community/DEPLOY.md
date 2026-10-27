# Community builds — deploy and smoke test

End-to-end checklist for the visitor community feature: Supabase Edge Function orchestrator, static site env, and optional live agent run.

## Prerequisites

- Supabase project with migrations applied (`community_handles`, `community_builds`, `community_gallery`, RLS as in repo migrations).
- Cursor Cloud Agents API key (Basic auth username for `CURSOR_API_KEY`).
- GitHub repo access for agent PRs (`J-V-Studios/grip-site` or set `COMMUNITY_REPO_URL` secret).

## 1. Edge Function secrets (Supabase dashboard or CLI)

Set these on the `community-orchestrator` function — **never** commit real values or put them in `.env.production` (that file is public for Astro).

| Secret | Required | Purpose |
| --- | --- | --- |
| `CURSOR_API_KEY` | Yes | Launch planner/builder Cloud Agents |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Orchestrator DB writes (handles, builds, gallery) |
| `EDIT_CODE_PEPPER` | Recommended | Extra entropy mixed into edit-code hashes |
| `COMMUNITY_REPO_URL` | No | Defaults to `https://github.com/J-V-Studios/grip-site` |

```bash
# Example (replace values; run from repo root with Supabase CLI linked)
supabase secrets set \
  CURSOR_API_KEY="..." \
  SUPABASE_SERVICE_ROLE_KEY="..." \
  EDIT_CODE_PEPPER="..." \
  --project-ref YOUR_PROJECT_REF

supabase functions deploy community-orchestrator --project-ref YOUR_PROJECT_REF
```

Note the deployed URL:

`https://YOUR_PROJECT.supabase.co/functions/v1/community-orchestrator`

## 2. Static site (GitHub Pages / CI)

In repo or hosting env (not committed secrets):

| Variable | Required | Purpose |
| --- | --- | --- |
| `PUBLIC_SUPABASE_URL` | Yes | Existing anon client |
| `PUBLIC_SUPABASE_ANON_KEY` | Yes | Existing anon client |
| `PUBLIC_COMMUNITY_ORCHESTRATOR_URL` | Yes | **Only new** `PUBLIC_*` var for community UI |

Copy from `.env.example`, build with `bun run build`, deploy `dist/` as usual.

Local dev: `.env` with the same `PUBLIC_*` values; `bun run dev` → `/community`.

## 3. Smoke tests (manual)

### Without secrets (local / CI)

- [x] `bun run test` — includes `community-moderation` unit tests
- [x] `bun run check`, `bun run lint`, `bun run build`
- [x] `bun run test:e2e` — `/community` hub heading smoke

### Requires deployed orchestrator + secrets

- [ ] **Deploy** `community-orchestrator` and confirm secrets above
- [ ] Set `PUBLIC_COMMUNITY_ORCHESTRATOR_URL` on the site build
- [ ] **Claim** a test handle on `/community`; save the returned edit code
- [ ] **Enqueue** harmless prompt: `make a bouncing blue square`
- [ ] Confirm build status progresses (`queued` → `planning` → `building` → `live` or terminal state)
- [ ] Confirm planner/builder agents run; PR branch `community/<handle>-*` only touches `public/community/<handle>/`
- [ ] Confirm PR auto-merges (path guard workflow) and page is live at `/community/<handle>/`
- [ ] **Second enqueue** same handle same UTC day → rejected (429 / daily limit message)
- [ ] **Moderation:** prompt `kill people` → rejected with vibe-check message (`REJECTED_USER_MESSAGE`)

### curl examples (after deploy)

Replace `ORCH_URL` and use a claimed `handle` + `editCode`.

```bash
# Claim
curl -sS -X POST "$ORCH_URL" \
  -H "Authorization: Bearer $ANON_KEY" -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"claim","handle":"smoke-test-7"}'

# Enqueue (harmless)
curl -sS -X POST "$ORCH_URL" \
  -H "Authorization: Bearer $ANON_KEY" -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"enqueue","handle":"smoke-test-7","editCode":"...","prompt":"make a bouncing blue square"}'

# Status
curl -sS -X POST "$ORCH_URL" \
  -H "Authorization: Bearer $ANON_KEY" -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"status","buildId":"..."}'
```

## 4. Moderation source of truth

Rule logic lives in `src/lib/community-moderation.ts` (unit tested). The edge function file `supabase/functions/community-orchestrator/moderation.ts` is a **mirror** — update both when changing rules. Policy narrative: [MODERATION.md](./MODERATION.md).

## 5. Related docs

- [README.md](./README.md) — doc index
- [AGENT_GUIDE.md](./AGENT_GUIDE.md) — planner/builder workflow
- [../superpowers/specs/2026-10-26-community-builds-design.md](../superpowers/specs/2026-10-26-community-builds-design.md) — product spec
