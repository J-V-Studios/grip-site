# lilgrip.com — resume

Personal **resume** site at [lilgrip.com](https://lilgrip.com).

**Stack:** Astro 7 + Bun + TypeScript + Tailwind v4. See **`AGENTS.md`** for commands and layout.

## Quick start

```bash
export PATH="$HOME/.bun/bin:$PATH"
bun install
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
| `bun run test:e2e` | Playwright smoke |

## Content

Edit **`src/data/resume.ts`** to replace placeholders (name, experience, projects, links). Layout stays in `src/components/ResumePage.astro`.

## Deploy

- Build output: **`dist/`** (`bun run build`).
- GitHub Pages custom domain: **`public/CNAME`** → `lilgrip.com`.
- `astro.config.mjs`: `site: "https://lilgrip.com"`, `output: "static"`.
