# TODO — the lilgriper site

Check items off as they ship. Prefer small PRs / commits. Keep this list aligned with `.cursorrules` and `OVERVIEW.md`.

## Done

- [x] Vanilla static shell (`index.html`, `styles.css`, `script.js`)
- [x] Hero: brand, chill line, 1 Corinthians 16:14, portrait
- [x] Catppuccin-leaning color tokens + responsive layout
- [x] Lilgrip interactive screen + gauges
- [x] Shared notes via Supabase
- [x] GitHub Pages + `lilgrip.com` custom domain wiring
- [x] Removed grip sightings (form, photo upload, points, leaderboard)
- [x] Workspace context files (`.cursorrules`, `OVERVIEW.md`, `TODO.md`)
- [x] Hero portrait keeps its 3:4 ratio (`img { height: auto }` honors the HTML width and height as the aspect ratio)

---

## Wireframing / layout

- [ ] Sketch mobile scroll order: hero → explore → notes (confirm no section fights for the first viewport)
- [ ] Optional sticky mini-nav (brand only) — only if multi-section length becomes hard to scan
- [ ] Empty-state illustrations vs plain copy for notes

## Core styling

- [ ] Formalize remaining design tokens (`--surface0`, `--line`, `--success`) in `:root`
- [ ] Document type scale in `OVERVIEW.md` (H1 / lede / body / mono label)
- [ ] Normalize form focus rings for keyboard users (visible, on-brand)
- [ ] Audit gauge bar markup: move `--level` from HTML attributes to JS `setProperty` (no presentational inline styles)
- [ ] Compress / responsive `srcset` for `images/lilgriper.jpg` if load weight becomes an issue
- [ ] Confirm favicon + social preview look correct on real devices

## JavaScript interactions

- [ ] Split `script.js` into clear regions or tiny modules *without* a bundler (still one entry `script.js`, or ES module imports colocated) if file growth continues
- [ ] Notes: basic rate-limit / duplicate-submit guard
- [ ] Optional: realtime refresh (Supabase channel) for notes

## Accessibility audit

- [ ] Keyboard path through the notes form
- [ ] Screen reader pass on note cards (name, comment)
- [ ] Color contrast check (pink/peach on base)
- [ ] `prefers-reduced-motion` verification for shimmer / bits / halo / counters
- [ ] Form errors announced via `aria-live` where failures happen
- [ ] Ensure tap targets stay ≥ 44–48px on the smallest phones

## Content / product

- [ ] Moderation path for notes (owner-only delete or report) — needs non-anon privileges
- [ ] Refresh README DNS section if Squarespace/GitHub details change

## Quality / launch hygiene

- [ ] Lighthouse pass (perf / a11y / best practices) on mobile + desktop
- [ ] Smoke-test HTTPS enforce on `lilgrip.com` and `www` redirect
- [ ] Verify Supabase RLS: anon cannot update/delete comments
- [ ] Backup note: document which Supabase tables/buckets this site owns

## Nice-to-haves (parked)

- [ ] Offline shell / simple PWA manifest
- [ ] OG image tailored for link previews
- [ ] Seasonal skins via CSS variables only
