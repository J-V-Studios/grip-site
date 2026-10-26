# the lilgriper

Personal site for **the lilgriper**, published at [lilgrip.com](https://lilgrip.com).

**Stack:** Astro 7, Bun, TypeScript, Tailwind v4, React islands for notes and sightings. See **`AGENTS.md`** for commands, layout, env vars, and contributor rules.

## Quick start

```bash
export PATH="$HOME/.bun/bin:$PATH"
bun install
cp .env.example .env   # add PUBLIC_SUPABASE_* values
bun run dev
```

| Command | Description |
| --- | --- |
| `bun run dev` | Local dev server |
| `bun run build` | Production build → `dist/` |
| `bun run preview` | Preview production build |
| `bun run check` | Typecheck (`astro check`) |
| `bun run lint` | Biome |
| `bun run test` | Vitest |
| `bun run test:e2e` | Playwright (when configured) |

**Migration:** The Astro app under `src/` is the active codebase. Legacy root HTML/CSS/JS may remain until cutover; do not add features there.

## Environment

Client-safe Supabase vars only (never commit secrets):

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

Details in `.env.example`.

## Deploy

- Build output: **`dist/`** (`bun run build`).
- GitHub Pages custom domain: **`public/CNAME`** → `lilgrip.com`.
- CI/CD workflow (lint, test, build, deploy on green `main`) — see `TODO.md` / specs in `docs/superpowers/`.

## DNS (Squarespace)

`lilgrip.com` DNS is on Squarespace; mail stays on Titan. Change only website records.

For `lilgrip.com` in Squarespace DNS:

- Replace Squarespace `A` records on `@` with GitHub Pages IPs: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
- Point `www` `CNAME` to `j-v-studios.github.io` (not Squarespace ext host).
- Remove Squarespace `HTTPS` record on `@` if it pins old addresses.

Shared notes and sightings live in Supabase; anyone with the site can read public data per RLS.

## Docs

- `AGENTS.md` — start here for agents
- `OVERVIEW.md` — design system and features
- `TODO.md` — roadmap
- `.cursorrules` — stack constraints
