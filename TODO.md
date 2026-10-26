# TODO — the lilgriper site

Check items off as they ship. Prefer small PRs / commits. Align with `AGENTS.md`, `.cursorrules`, and `OVERVIEW.md`.

## Done

- [x] Goofy redesign: meme splash, remove sightings UI, say-hey pulse

- [x] Vanilla static shell (legacy `index.html`, `styles.css`, `script.js`) — baseline before migration
- [x] Hero, notes, sightings, Supabase, GitHub Pages + `lilgrip.com` (vanilla era)
- [x] Astro 7 scaffold: Bun, TypeScript, Tailwind v4, React islands
- [x] Routes: home + church-apps, fun-apps, about, money placeholders
- [x] `src/lib/` for Supabase + notes/sightings helpers
- [x] Sky/blue theme tokens in `src/styles/global.css`
- [x] Vitest unit tests for lib helpers
- [x] Agent docs refresh: `AGENTS.md`, Astro `.cursorrules`, updated OVERVIEW/README

---

## Migration / cutover

- [x] Wire GitHub Actions CI (lint, check, knip, test, build, e2e) and Pages deploy from `dist/`
- [x] Playwright smoke: home + four subroutes + primary nav
- [x] Remove root vanilla HTML/CSS/JS after green build + smoke (Task 12)
- [ ] Switch GitHub Pages source to **GitHub Actions** (currently legacy `/` on `main`)
- [ ] After Actions switch: remove `publish-legacy-root` CI job + stop committing root publish artifacts (`index.html`, `_astro/`, …)
- [ ] Confirm production `lilgrip.com` custom domain stays attached after Pages switch

## Astro app polish

- [ ] Island files: one-line purpose comment at top of each `*.tsx`
- [ ] Formalize type scale / spacing docs in `OVERVIEW.md` if design settles
- [ ] Normalize form focus rings (keyboard-visible, on-brand)
- [ ] Responsive `srcset` for hero image if weight matters
- [ ] OG image / social preview for link shares

## JavaScript / islands

- [ ] Sightings: client-side image resize/compress before upload
- [ ] Sightings: clearer upload progress and error copy
- [ ] Notes/sightings: duplicate-submit guard
- [ ] Optional: Supabase realtime refresh for notes + sightings
- [ ] Optional: “my sightings” filter using saved hunter name

## Accessibility

- [ ] Keyboard path through forms and file picker
- [ ] Screen reader pass on sightings cards
- [ ] Contrast check (sky/blue/peach on base)
- [ ] `prefers-reduced-motion` verification
- [ ] Form errors via `aria-live` where needed
- [ ] Tap targets ≥ 44–48px on small phones

## Content / product

- [ ] House rules for sightings (consent / chill / no harassment)
- [ ] Grip points rules (flat +10 vs bonuses)
- [ ] Moderation path for bad uploads (needs non-anon tooling)
- [ ] Fill placeholder pages when content exists

## Quality / hygiene

- [ ] Lighthouse pass on Astro build (mobile + desktop)
- [ ] Verify Supabase RLS: anon cannot update/delete rows
- [ ] Document owned tables/buckets in `OVERVIEW.md`
- [ ] knip / audit in CI for unused exports and dependency advisories

## Nice-to-haves (parked)

- [ ] Simple PWA manifest
- [ ] Seasonal skins via CSS variables only
- [ ] Shareable leaderboard image export
