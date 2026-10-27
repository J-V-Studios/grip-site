# Project Overview — lilgrip / lilgrip.com

Personal site for **lilgrip**. Chill/goofy tone, sky/blue-led Catppuccin theme, meme splash and say-hey pulse. Built with **Astro 7 + Bun + TypeScript + Tailwind v4**; React islands for Supabase-backed forms.

Live: [https://lilgrip.com](https://lilgrip.com)  
Target publish: GitHub Pages from `main`, serving **`dist/`** after Astro build (Actions deploy on green `main`).

**Source of truth:** `src/` + `public/`. Legacy vanilla root HTML/CSS/JS has been removed.

---

## Current structure

```text
/
├── AGENTS.md               # Agent start-here (commands, map, env, deploy)
├── .cursorrules            # Stack rules (Astro 7 + Bun)
├── package.json / bun.lock
├── astro.config.mjs
├── tsconfig.json
├── public/
│   ├── CNAME               # lilgrip.com
│   ├── favicon.svg
│   └── images/lilgriper.jpg
├── src/
│   ├── pages/              # index, community, church-apps, fun-apps, about, money
│   ├── layouts/BaseLayout.astro
│   ├── components/         # SiteHeader, Hero, ExploreCards, SiteFooter, …
│   ├── components/islands/ # NotesPanel, SightingsPanel (React)
│   ├── lib/                # supabase, notes, sightings, text helpers
│   └── styles/global.css   # Tailwind v4 + @theme tokens
├── tests/unit/             # Vitest
├── README.md
├── OVERVIEW.md             # This file
├── TODO.md
├── e2e/
└── .github/workflows/ci.yml
```

### Routes

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/pages/index.astro` | Meme splash, explore, say hey |
| `/church-apps/` | `src/pages/church-apps.astro` | Church apps (placeholder) |
| `/fun-apps/` | `src/pages/fun-apps.astro` | Fun projects (placeholder) |
| `/about/` | `src/pages/about.astro` | About (placeholder) |
| `/money/` | `src/pages/money.astro` | Money?? (placeholder) |
| `/community/` | `src/pages/community/index.astro` | Visitor builds hub + gallery |
| `/community/<handle>/` | `public/community/<handle>/` | Static mini-pages (agent-built) |

Shared chrome: `SiteHeader`, `SiteFooter` via `BaseLayout`.

### Home sections (top → bottom)

| Section | Component | Purpose |
| --- | --- | --- |
| Hero | `Hero.astro` | Brand, chill line, 1 Corinthians 16:14, photo |
| Explore | `ExploreCards.astro` | Links to subroutes |
| Grip sightings | `SightingsPanel.tsx` | Upload photo; points; leaderboard |
| Notes | `NotesPanel.tsx` | Shared public comments |

### Runtime dependencies

- **Build:** Bun, Astro 7, `@astrojs/react`, Tailwind v4
- **Fonts:** Google Fonts — Outfit, Fraunces (see layout)
- **Data:** `@supabase/supabase-js` via `src/lib/supabase.ts`
  - `lilgrip_comments` — notes
  - `grip_sightings` — sightings metadata + points
  - `community_gallery` — live community page metadata (anon read)
  - Storage bucket `grip-sightings` — public photos
- **Community orchestrator:** Supabase Edge Function `community-orchestrator` — claim handle, enqueue build, poll status; secrets on function only (see `docs/community/DEPLOY.md`)
- **Env:** `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_COMMUNITY_ORCHESTRATOR_URL` (see `.env.example`)
- **Hosting:** GitHub Pages + custom domain `lilgrip.com`

Local dev: `bun run dev`. Production artifact: `bun run build` → `dist/`.

---

## Design system

Tokens live in `src/styles/global.css` (`@theme`). Visual direction: **cooler Catppuccin** — sky/blue lead accents, not pink-primary brand.

### Color (Tailwind @theme)

| Token | Role | Value |
| --- | --- | --- |
| `--color-base` | Page background | `#1e1e2e` |
| `--color-surface` / `--color-surface-soft` | Cards / panels | `#262637` / `#313244` |
| `--color-text` | Body | `#cdd6f4` |
| `--color-subtext` | Muted | `#a6adc8` |
| `--color-sky` | Primary accent | `#89dceb` |
| `--color-blue` | Primary accent | `#89b4fa` |
| `--color-teal` | Status / cite | `#94e2d5` |
| `--color-peach` | Warmth | `#fab387` |
| `--color-mauve` | Secondary | `#cba6f7` |

Do **not** reintroduce pink as the primary brand accent — keep sky/blue lead.

### Typography

| Role | Family |
| --- | --- |
| UI / body | Outfit (`--font-sans`) |
| Display quote | Fraunces (`--font-display`) |

Use fluid sizing with Tailwind utilities; gate motion with `prefers-reduced-motion` (e.g. `.motion-rise`).

### Voice & imagery

- Chill, not athletic; no terminal/hacker chrome.
- Hero image: `public/images/lilgriper.jpg`.
- Scripture: 1 Corinthians 16:14 — “Let all that you do be done in love.”

---

## Feature documentation standard

When adding or changing a feature, update this section using:

### Feature: `<name>`

- **User goal:** one sentence.
- **UI location:** component / selectors.
- **Data:** tables, buckets, localStorage keys.
- **Permissions:** anon RLS.
- **Points / side effects:** e.g. `+10` per sighting.
- **Empty / error states:** user-visible copy.
- **A11y:** labels, live regions, keyboard.

### Documented features (current)

#### Notes for lilgrip

- **User goal:** leave a short public note.
- **UI:** `NotesPanel.tsx`.
- **Data:** `lilgrip_comments` via `src/lib/notes.ts`.
- **Permissions:** anon select + insert.
- **Limits:** name ≤ 24, body ≤ 200 (enforced in lib).

#### Grip sightings

- **User goal:** upload a photo when spotting lilgriper IRL; earn grip points.
- **UI:** `SightingsPanel.tsx`.
- **Data:** `grip_sightings` + bucket `grip-sightings` via `src/lib/sightings.ts`; hunter name in `localStorage` (`lilgrip-hunter`).
- **Points:** `+10` per successful sighting; leaderboard by hunter name.
- **Limits:** image size/MIME caps; place length clamp in lib.

#### Explore cards

- **User goal:** reach Church Apps, Fun Apps, About, Money?? from home.
- **UI:** `ExploreCards.astro`.
- **Data:** none.

#### Community builds

- **User goal:** claim a handle, submit one goofy build idea per UTC day, get a static mini-page at `/community/<handle>/`.
- **UI:** `CommunityHub.tsx` on `/community`; live pages under `public/community/<handle>/`.
- **Data:** `community_gallery` (build-time gallery list); orchestrator tables via edge function (`community_handles`, `community_builds`).
- **Permissions:** anon read gallery; claim/enqueue via orchestrator with edit code; no service role in the browser.
- **Moderation:** `src/lib/community-moderation.ts` before agent spend; rejected prompts show vibe-check copy.
- **Deploy:** [docs/community/DEPLOY.md](./docs/community/DEPLOY.md).

---

## Architecture principles

1. Static-first Astro — ship `dist/` to GitHub Pages.
2. One route per `src/pages/*.astro`; shared chrome in layouts/components.
3. Supabase I/O only in `src/lib/`.
4. React islands only where client interactivity is required.
5. Sky/blue-led theme; no terminal chrome; no pink-primary brand face.
6. Agents orient from `AGENTS.md` + `.cursorrules`; keep docs honest during migration.
7. No service-role keys or committed secrets.
