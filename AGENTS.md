# AGENTS.md — start here

**lilgrip** (`lilgrip.com`) is a chill/goofy personal site: meme splash, explore cards, and a say-hey pulse. The stack is **Astro 7 + Bun + TypeScript + Tailwind v4**, with React islands for Supabase-backed interactivity. Static output deploys to **GitHub Pages** at `https://lilgrip.com`.

**Ship all work in `src/` + `public/`.** The vanilla root HTML/CSS/JS sources have been removed.

## Commands (Bun)

Ensure Bun is on `PATH`: `export PATH="$HOME/.bun/bin:$PATH"`.

| Script | Command | Purpose |
| --- | --- | --- |
| install | `bun install --frozen-lockfile` | Dependencies (CI uses frozen lockfile) |
| dev | `bun run dev` | Astro dev server |
| build | `bun run build` | Production build → `dist/` |
| preview | `bun run preview` | Serve `dist/` locally |
| check | `bun run check` | `astro check` (types) |
| lint | `bun run lint` | Biome format + lint |
| test | `bun run test` | Vitest unit tests |
| test:e2e | `bun run test:e2e` | Playwright smoke |

Optional: `bun run lint:fix`, `bun run knip` (unused exports; also in CI).

## Directory map

```text
/
├── AGENTS.md                 ← you are here
├── .cursorrules              ← short enforceable stack rules
├── OVERVIEW.md               ← design system + feature contracts
├── TODO.md                   ← living checklist
├── package.json / bun.lock
├── astro.config.mjs          ← site URL, static output, React + Tailwind
├── tsconfig.json             ← @/* → src/*
├── public/                   ← static assets (CNAME, favicon, images)
├── src/
│   ├── pages/*.astro         ← one route per file
│   ├── layouts/BaseLayout.astro
│   ├── components/           ← Astro chrome (header, hero, cards, footer)
│   ├── components/islands/   ← React client islands (R3F, Motion, say-hey, scroll)
│   ├── lib/                  ← Supabase client + data helpers (only place for I/O)
│   └── styles/global.css     ← Tailwind v4 + @theme tokens
├── tests/unit/               ← Vitest
├── e2e/                      ← Playwright smoke
├── .github/workflows/ci.yml  ← quality, build, smoke, Pages deploy
└── docs/superpowers/         ← specs + plans for big changes
```

## Routes / features

| Route | File | Notes |
| --- | --- | --- |
| `/` | `src/pages/index.astro` | Splash + R3F field, explore cards, say-hey island |
| `/church-apps/` | `src/pages/church-apps.astro` | Placeholder |
| `/fun-apps/` | `src/pages/fun-apps.astro` | Placeholder |
| `/about/` | `src/pages/about.astro` | Placeholder |
| `/money/` | `src/pages/money.astro` | Placeholder |
| `/community/` | `src/pages/community/index.astro` | Claim handle, enqueue builds, gallery (`CommunityHub.tsx`) |

**Supabase (anon/publishable only):** tables `lilgrip_comments`, `grip_sightings`, `community_gallery` (read); storage bucket `grip-sightings`. Community writes go through the **edge orchestrator** (service role on server only). All client access via `src/lib/`.

**Community:** `docs/community/` (deploy: [DEPLOY.md](./docs/community/DEPLOY.md)); moderation rules in `src/lib/community-moderation.ts` (mirrored in `supabase/functions/community-orchestrator/moderation.ts`).

## Environment

Copy `.env.example` → `.env` (never commit `.env`).

| Variable | Use |
| --- | --- |
| `PUBLIC_SUPABASE_URL` | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key only |
| `PUBLIC_COMMUNITY_ORCHESTRATOR_URL` | Supabase Edge Function URL for claim/enqueue/status |

**Never** put `CURSOR_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `EDIT_CODE_PEPPER` in the repo, `.env.production`, or client bundle.

## Deploy

- CI (`.github/workflows/ci.yml`): quality → build → smoke → on push to `main`, sync `dist/` to the branch root (legacy Pages) and attempt Actions deploy.
- **Pages today:** still “Deploy from a branch” (`main` `/`). Root `CNAME`, `.nojekyll`, `index.html`, `_astro/`, etc. are the **published** site for that mode — do not hand-edit them; they are overwritten from `dist/` by CI.
- **Preferred:** Settings → Pages → Source → **GitHub Actions**, then remove the `publish-legacy-root` job and root publish artifacts.
- Custom domain source of truth in the app: `public/CNAME` → `lilgrip.com`.
- `astro.config.mjs` sets `site: "https://lilgrip.com"` and `output: "static"`.

## Do / don’t

**Do**

- Use sky/blue-led Catppuccin theme tokens in `src/styles/global.css` (`--color-sky`, `--color-blue`).
- Put shared layout in `src/layouts/` and `src/components/`; one route per `src/pages/*.astro`.
- Route all Supabase reads/writes through `src/lib/` (`supabase.ts`, `notes.ts`, `sightings.ts`).
- Start each island `*.tsx` with a one-line comment stating its purpose.
- Use path alias `@/` for imports under `src/`.
- Keep commits small; conventional messages (`feat:`, `fix:`, `docs:`).
- Update `OVERVIEW.md` / `TODO.md` when behavior or structure changes.

**Don’t**

- Reintroduce terminal/hacker chrome or pink-primary brand accent as the main face.
- Add secrets, service-role keys, or non-`PUBLIC_*` Supabase keys to client code.
- Put Supabase calls directly in `.astro` pages or scattered in islands — use `src/lib/`.
- Add a second CSS framework or turn marketing pages into a SPA.
- Reintroduce root `index.html` / `styles.css` / `script.js` as a parallel site.

## Doc order

1. `AGENTS.md` (this file)
2. `.cursorrules`
3. `OVERVIEW.md`
4. `docs/superpowers/specs/` + `plans/`
5. `TODO.md`
