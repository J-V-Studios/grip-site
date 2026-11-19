# AGENTS.md — start here

**lilgrip.com** is now a **resume site**: single-page resume with placeholder content in `src/data/resume.ts`. Stack stays **Astro 7 + Bun + TypeScript + Tailwind v4**. Static output deploys to **GitHub Pages** at `https://lilgrip.com`.

**Ship all work in `src/` + `public/`.** Fill real resume details in `src/data/resume.ts` once the look is approved.

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
├── astro.config.mjs          ← site URL, static output, redirects
├── tsconfig.json             ← @/* → src/*
├── public/                   ← static assets (CNAME, favicon, images)
├── src/
│   ├── data/resume.ts        ← placeholder resume content (edit here)
│   ├── pages/index.astro     ← resume home
│   ├── layouts/BaseLayout.astro
│   ├── components/           ← ResumePage, SiteHeader, SiteFooter
│   ├── styles/global.css     ← Tailwind v4 + resume theme tokens
│   ├── components/islands/   ← legacy islands (not on resume home)
│   └── lib/                  ← legacy Supabase helpers (unused on home)
├── tests/unit/               ← Vitest
├── e2e/                      ← Playwright smoke
├── .github/workflows/ci.yml  ← quality, build, smoke, Pages deploy
└── docs/superpowers/         ← specs + plans for big changes
```

## Routes / features

| Route | File | Notes |
| --- | --- | --- |
| `/` | `src/pages/index.astro` | Full resume (hero, about, experience, projects, skills, education, contact) |
| `/about/`, `/church-apps/`, `/fun-apps/`, `/money/`, `/community/` | `astro.config.mjs` redirects | Redirect to `/` |

**Content source of truth:** `src/data/resume.ts` — name, headline, tagline, about, skills, experience, projects, education, contact links, extras.

## Environment

Copy `.env.example` → `.env` (never commit `.env`) if you revive Supabase features.

| Variable | Use |
| --- | --- |
| `PUBLIC_SUPABASE_URL` | Supabase project URL (legacy features) |
| `PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key only |

**Never** put a service-role key in the repo or client bundle.

## Deploy

- CI (`.github/workflows/ci.yml`): quality → build → smoke → on push to `main`, sync `dist/` to the branch root (legacy Pages) and attempt Actions deploy.
- Custom domain: `public/CNAME` → `lilgrip.com`.
- `astro.config.mjs` sets `site: "https://lilgrip.com"` and `output: "static"`.

## Do / don’t

**Do**

- Edit resume copy in `src/data/resume.ts` only (keep layout/components stable unless redesigning).
- Use sky/blue resume theme tokens in `src/styles/global.css`.
- Keep commits small; conventional messages (`feat:`, `fix:`, `docs:`).
- Update `OVERVIEW.md` / `TODO.md` when behavior or structure changes.

**Don’t**

- Reintroduce terminal/hacker chrome or pink-primary brand accent as the main face.
- Add secrets or service-role keys to client code.
- Turn the resume into a multi-page SPA without an explicit ask.
- Reintroduce root `index.html` / `styles.css` / `script.js` as a parallel site.

## Doc order

1. `AGENTS.md` (this file)
2. `.cursorrules`
3. `OVERVIEW.md`
4. `docs/superpowers/specs/` + `plans/`
5. `TODO.md`
