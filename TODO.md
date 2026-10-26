# TODO — the lilgriper site

Check items off as they ship. Prefer small PRs / commits. Align with `AGENTS.md`, `.cursorrules`, and `OVERVIEW.md`.

## Done

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

- [ ] Wire GitHub Actions CI (lint, check, test, build, optional e2e) and Pages deploy from `dist/`
- [ ] Playwright smoke: home + four subroutes + primary nav
- [ ] Parity check: Astro vs legacy vanilla (features, a11y, mobile)
- [ ] Remove root `index.html`, `styles.css`, `script.js` after green build + smoke (Task 12)
- [ ] Confirm production `lilgrip.com` serves Astro `dist/` after first deploy

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
