# Community Builds — Design Spec

**Date:** 2026-10-26  
**Status:** Draft for user review  
**Site:** lilgrip.com (`J-V-Studios/grip-site`)  
**Goal:** Main feature — visitors claim a handle, submit a prompt, and get their own auto-shipped mini-page under `/community/<handle>/`, built by Cursor Cloud Agents under hard sandbox rules, with moderation and rate limits.

---

## 1. Product summary

Visitors add fun things to lilgrip.com without touching core site code.

| Rule | Choice |
| --- | --- |
| Ship mode | Auto-ship (no human merge for valid community PRs) |
| Page model | One dedicated mini-page per person: `/community/<handle>/` |
| Ownership | Simple claim: unique handle + secret edit code (no OAuth) |
| Rebuild limit | Once per calendar day (UTC) per handle |
| Isolation | Hard sandbox under `public/community/<handle>/` only |
| Frameworks | Advanced stacks allowed **inside** that sandbox (Vite/React/Three/Motion/etc.), then static output |
| Agent key | Cursor API key server-side only — never in the browser or static Pages bundle |

Tone stays lilgrip: goofy, chill, meme-friendly. Guns-as-aesthetic / toy chaos OK. Real harm / killing people / hate / CSAM / scams / sandbox escapes are not.

---

## 2. Architecture

```text
Browser (Astro static UI)
    │  HTTPS (handle, edit code, prompt)
    ▼
Orchestrator (Supabase Edge Function or equivalent worker)
    │  secrets: CURSOR_API_KEY, SUPABASE_SERVICE_ROLE (or scoped key)
    ├─► Moderation (prompt)
    ├─► Prompt elaborator → rich brief
    ├─► Cursor Cloud Agent — Planner (community skill)
    ├─► Moderation (plan)
    ├─► Cursor Cloud Agent — Builder (community skill)
    ├─► Path-guard CI + auto-merge (community/<handle> only)
    └─► GitHub Pages deploy → live /community/<handle>/
```

### Why this shape

- GitHub Pages stays static; secrets live only in the orchestrator.
- Cloud Agents API (`POST https://api.cursor.com/v1/agents`) already supports repo-scoped runs with API keys.
- Hard path isolation lets auto-ship stay sane: nuke one handle = delete one folder + DB rows.

---

## 3. Site surfaces (UI)

### Routes

| Route | Purpose |
| --- | --- |
| `/community` | Gallery of **live** builds + claim/edit entry |
| `/community/<handle>/` | That creator’s mini-app (static files from `public/community/<handle>/`) |
| Home | New explore card / CTA into Community (main feature signal) |

### Claim / edit

1. **Claim:** user picks a handle → server creates row + returns **edit code once** (user must save it).
2. **Edit:** handle + edit code → new prompt → enqueue build (if daily quota allows).
3. **Status:** queued → planning → building → live | rejected | failed (poll or realtime).

### Gallery card fields

- handle, title (from plan/manifest), short blurb, updated_at, link to page

---

## 4. Data model (Supabase)

### `community_creators`

| Column | Type | Notes |
| --- | --- | --- |
| `handle` | text PK | slug: `^[a-z0-9]([a-z0-9-]{1,22}[a-z0-9])?$` (3–24 chars) |
| `edit_code_hash` | text | Argon2id / scrypt hash of edit code |
| `created_at` | timestamptz | |
| `last_build_at` | timestamptz nullable | used for daily limit |
| `is_banned` | boolean | default false |

### `community_builds`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `handle` | text FK | |
| `status` | text | `queued` \| `moderating` \| `planning` \| `building` \| `live` \| `rejected` \| `failed` |
| `prompt` | text | raw visitor prompt (max ~500 chars) |
| `elaborated_brief` | text nullable | |
| `plan_md` | text nullable | planner output |
| `moderation_notes` | text nullable | why rejected / flags |
| `title` | text nullable | gallery title |
| `blurb` | text nullable | gallery blurb |
| `agent_plan_id` | text nullable | Cursor agent/run ids |
| `agent_build_id` | text nullable | |
| `pr_url` | text nullable | |
| `branch_name` | text nullable | `community/<handle>-<shortId>` |
| `error` | text nullable | |
| `created_at` / `updated_at` | timestamptz | |

### RLS

- Public read: live builds’ **public** fields (handle, title, blurb, updated_at) — not prompts, codes, or agent ids.
- All writes via orchestrator with service role (or signed RPC). Anon clients never see hashes or secrets.

### Rate limit

- At most **one successful enqueue per handle per UTC day**.
- Failed/rejected builds may optionally allow one retry the same day (product default: **no** — keep spend predictable; document as once/day including rejects). **Decision: once/day for any enqueue after a prior enqueue that day.**

---

## 5. Moderation policy

Run **before** Cursor spend (on prompt) and **again** on the plan.

### Allow

- Goofy games, memes, chill toys, aesthetic “guns” / toy weapons, mild chaos, personal doodle pages, music toys, silly 3D, etc.

### Block (reject, no PR)

- Depicting or instructing killing / severe harm to real people
- Hate / slurs targeting protected classes
- Sexual content involving minors (any)
- Scams, phishing, credential theft, malware
- Doxxing / non-consensual personal data
- Attempts to escape sandbox (modify `src/`, other handles, CI secrets, Pages root chrome, steal API keys)
- Spam / SEO junk farms

Guns and “deal with it” energy are fine when not crossed with real-world killing/harm instructions.

Rejected UX: chill copy like “that idea didn’t pass the vibe check” + optional short reason when safe to show.

---

## 6. Orchestrator pipeline

1. Authenticate claim/edit (handle + code verify).
2. Enforce daily limit + `is_banned`.
3. Insert `community_builds` row (`queued`).
4. Moderate prompt → `rejected` or continue.
5. Elaborate prompt into a structured brief (title, vibe, features, tech suggestions inside sandbox).
6. Launch **Planner** Cloud Agent with community skill + brief.
7. Persist `plan_md`; moderate plan → `rejected` or continue.
8. Launch **Builder** Cloud Agent with plan + path constraints.
9. On green path-guard CI → auto-merge → mark `live`; update `last_build_at`, gallery title/blurb from manifest.
10. On failure → `failed` + error string; no merge.

### Secrets

| Secret | Where |
| --- | --- |
| `CURSOR_API_KEY` | Orchestrator only |
| Supabase service role (or narrow RPCs) | Orchestrator only |
| `PUBLIC_SUPABASE_*` | Existing static site for gallery reads |

Never commit Cursor keys. Never inline them into Astro builds.

---

## 7. Filesystem sandbox

### Allowed write paths (builder)

- `public/community/<handle>/**` only  
  (includes `index.html`, assets, nested JS/CSS, `manifest.json`)

### Forbidden

- Anything under `src/`
- Other handles’ folders
- Root `index.html`, `CNAME`, `.github/` (except if a separate maintainer PR — community agents must not)
- `.env*`, secrets, docs outside community agent docs (agents may **read** `docs/community/*` and the skill)

### Manifest (`public/community/<handle>/manifest.json`)

```json
{
  "handle": "coolkid",
  "title": "Laser Squid Arena",
  "blurb": "tiny goofy shooter",
  "builtAt": "2026-10-26T00:00:00.000Z"
}
```

Gallery prefers manifest over DB when both exist; orchestrator syncs DB on live.

### Advanced frameworks

Builders may scaffold Vite + React 19, Three/R3F, Motion, etc. **inside** `public/community/<handle>/_src/` (or similar) and **must** commit the **built static output** that Pages can serve at `/community/<handle>/` without a custom server. Prefer committing build output; optional `_src` for rebuilds is allowed if it stays under the handle folder.

---

## 8. Agent skill & documentation

### Skill (required)

Path: `.cursor/skills/community-builder/SKILL.md`

Must include:

- When to use (planner vs builder)
- Hard path allow/deny lists
- Moderation summary aligned with §5
- Required `manifest.json`
- Tone: lilgrip goofy/chill
- “Do not touch core site”
- Mobile-friendly / reduced-motion basics
- How to replace a previous build for the same handle (wipe folder contents first)

### Docs (required)

| Doc | Purpose |
| --- | --- |
| `docs/community/AGENT_GUIDE.md` | Full handbook for planners/builders |
| `docs/community/SCAFFOLD.md` | Canonical mini-app scaffold + build commands |
| `docs/community/MODERATION.md` | Policy + examples good/bad |
| `docs/community/README.md` | Index for humans |

These docs are the source of truth agents must follow; the skill points at them.

---

## 9. CI / auto-merge

### Path guard job

On PRs with branch prefix `community/`:

1. Fail if any changed file is outside `public/community/<handle>/` for the handle encoded in the branch (or in PR title/body metadata).
2. Fail if more than one handle folder is touched.
3. Require `public/community/<handle>/index.html` and `manifest.json`.
4. On pass: auto-merge (bot) into `main` → existing Pages publish path.

### Main site CI

Unrelated; community PRs should not need full Playwright site suite if only static public files change — keep a light check (path guard + manifest schema). Optional smoke: `index.html` exists and is non-empty.

---

## 10. Security & abuse

- Edit codes: high entropy (e.g. 20+ chars); hashed at rest; rate-limit verify attempts.
- Prompt size cap; strip control characters.
- Orchestrator rate limits by IP + handle.
- Ban flag for abuse.
- Cursor spend: daily enqueue limit is the primary cost control; optional global daily build budget later.
- Auto-merge only for path-guarded community branches.

---

## 11. Non-goals (v1)

- OAuth / GitHub login
- Multiple pages per person
- Community builds editing core lilgrip chrome
- Client-side Cursor API usage
- Guaranteed real-time build completion SLAs
- Human-in-the-loop merge for valid community PRs (explicitly auto-ship)

---

## 12. Implementation phases (high level)

1. **Schema + claim/edit API** + gallery shell (no agents yet)
2. **Moderation + elaborator** + status UI
3. **Community skill + docs + scaffold**
4. **Planner/builder Cloud Agent wiring**
5. **Path-guard CI + auto-merge**
6. **Home CTA / polish / limits**

---

## 13. Success criteria

- Visitor can claim a handle, save edit code, submit a prompt, and see a live page at `/community/<handle>/` without Josiah manually merging.
- A second person cannot overwrite that page without the edit code.
- Same handle cannot enqueue more than once per UTC day.
- A build that tries to modify `src/` never merges.
- Core site remains deployable if all of `public/community/` is deleted.
- Agents have a clear skill + docs package and follow sandbox rules in normal operation.

---

## 14. Open items for implementation plan (not blockers for this spec)

- Exact orchestrator host: Supabase Edge Functions vs Cloudflare Worker (prefer Supabase to match existing stack).
- Exact Cursor API model id / whether planner and builder are two runs or one agent with two prompts.
- Whether `_src` is retained in git or build-only in the agent VM (prefer retaining under handle folder for easier rebuilds).
