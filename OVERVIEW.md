# Project Overview — lilgrip.com (resume)

Personal **resume site** at [https://lilgrip.com](https://lilgrip.com). Light sky/blue theme, Fraunces + Outfit. Built with **Astro 7 + Bun + TypeScript + Tailwind v4**. Static output → GitHub Pages from `dist/`.

**Source of truth:** `src/` + `public/`. Resume copy lives in **`src/data/resume.ts`** (placeholders until real details are supplied).

---

## Current structure

```text
/
├── AGENTS.md
├── .cursorrules
├── package.json / bun.lock
├── astro.config.mjs          # redirects old routes → /
├── public/                   # CNAME, favicon, images
├── src/
│   ├── data/resume.ts        # placeholder resume content
│   ├── pages/index.astro     # resume home only
│   ├── layouts/BaseLayout.astro
│   ├── components/ResumePage.astro
│   ├── components/SiteHeader.astro
│   ├── components/SiteFooter.astro
│   └── styles/global.css     # resume theme tokens
├── tests/unit/               # Vitest (legacy helpers still covered)
├── e2e/smoke.spec.ts
└── .github/workflows/ci.yml
```

### Routes

| Route | Purpose |
| --- | --- |
| `/` | Full resume page |
| `/about/`, `/church-apps/`, `/fun-apps/`, `/money/`, `/community/` | Redirect to `/` |

### Home sections (top → bottom)

| Section | Purpose |
| --- | --- |
| Hero | Name (brand-level), headline, tagline, contact CTAs |
| About | Short bio placeholder |
| Experience | Roles + bullets |
| Projects | Selected work |
| Skills | Languages / tools / strengths |
| Education | School + program |
| Extras | Optional certifications / interests |
| Contact | Mailto / LinkedIn / GitHub |

### Design tokens (`src/styles/global.css`)

| Token | Role |
| --- | --- |
| `--color-base` / `--color-paper` | Soft cool paper background |
| `--color-ink` / `--color-muted` | Body + secondary text |
| `--color-sky` / `--color-deep` | Accent + CTA |
| `--font-display` | Fraunces (name, section titles) |
| `--font-sans` | Outfit (body, UI) |

Motion: hero rise + soft blob drift; section scroll-fade when supported; respects `prefers-reduced-motion`.

### Runtime

- **Build:** Bun, Astro 7, Tailwind v4
- **Fonts:** Google Fonts — Fraunces, Outfit
- **Hosting:** GitHub Pages + `lilgrip.com`
- Legacy Supabase / GripApps code may still exist under `src/lib/` and islands but is **not** mounted on the resume home.

Local: `bun run dev`. Production: `bun run build` → `dist/`.

---

## Editing resume content

1. Open `src/data/resume.ts`.
2. Replace placeholders (`Your Name`, job titles, bullets, links).
3. Leave empty strings for unused contacts (e.g. `phone: ""` hides phone).
4. Rebuild / refresh — layout stays the same.

---

## Deploy notes

- CI builds and publishes `dist/`.
- Do not hand-edit root publish artifacts on `main`; they are overwritten from `dist/`.
