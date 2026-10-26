# Goofy lilgrip redesign — Design Spec

**Date:** 2026-10-26  
**Status:** Approved in chat; awaiting written-spec review  
**Branch:** `cursor/dope-lilgrip-redesign-cddc`

## Goal

Make lilgrip.com a **dope, goofy** personal site: meme face front and center, stronger motion, less clutter. Remove grip sightings. Replace the notes panel with a lightweight **“say hey” pulse**.

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| Clutter | Remove grip sightings from the product surface |
| Social | Replace notes panel with one-shot **pulse** “say hey” |
| Energy | Dope showcase motion (not chill-minimal, not max spectacle) |
| First viewport | **No classic hero block** — meme portrait as the page (full-bleed visual plane) with brand overlay |
| Face asset | User’s yellow meme / deal-with-it PFP (not the photo portrait) |
| Tone | Goofy, deal-with-it chill; sky/blue still brand-led |

## Non-goals

- Rebuilding Church/Fun/About/Money beyond light placeholder polish
- Keeping sightings UI, points, photo upload, or leaderboard on the site
- Terminal/hacker chrome
- Pink as primary brand face
- Card-heavy dashboard home

## Information architecture

### Home (`/`)

1. **Splash plane (first viewport)**  
   - Full-bleed goofy atmosphere (sky/blue gradients + subtle drift — not flat).  
   - **Dominant visual:** meme PFP (`public/images/lilgrip-meme.png` or similar), edge-to-edge feel (not an inset card).  
   - Overlay copy only: brand **the lilgriper** (sky on `lilgriper`), one goofy line (“just a chill guy”), optional small verse whisper (1 Cor 16:14 — quiet, not competing with brand).  
   - One CTA group: jump to explore and/or say hey.

2. **Explore**  
   - Four destinations: Church Apps, Fun Apps, About, Money??  
   - Interactive links with playful hover (tilt/wobble) — not a dense card grid dashboard.  
   - One section purpose: pick a path.

3. **Say hey**  
   - Single text field + send.  
   - On submit: **bloom pulse** animation, then message settles into a quiet list below.  
   - Backed by existing Supabase `lilgrip_comments` via `src/lib/notes.ts`.  
   - Name optional / default `anon`; body required; keep `clean()` limits.

### Subpages

Keep placeholder pages; lightly restyle to match goofy tone if cheap. No sightings.

## Visual system

- **Fonts:** Keep Outfit + Fraunces (expressive, already on brand).  
- **Colors:** Catppuccin mocha base; sky/blue primary accents; peach for chill line; mauve/teal secondary. Goofy energy comes from motion + meme art, not a purple-on-white AI default.  
- **Atmosphere:** Layered gradients / soft radial washes behind the meme plane.  
- **Asset:** Replace photo usage with the uploaded meme PNG everywhere the “face” appears (splash + favicon optional later).

## Motion (intentional, ≥4)

| Motion | Where |
| --- | --- |
| Meme float / soft wobble | Splash PFP |
| Sky / gradient drift | Splash background |
| Explore hover tilt / lift | Explore links |
| Hey bloom pulse | Say-hey submit success |

All gated by `prefers-reduced-motion: reduce` (instant or static fallbacks).

## Removals

- Home mount of `SightingsPanel`  
- `SightingsPanel.tsx` (delete or stop shipping)  
- Any home copy/UI for grip points, photo upload, leaderboard  
- Classic `Hero.astro` two-column photo hero — replace with splash plane component  
- Do **not** require deleting Supabase sightings tables (data can remain unused)

## Technical notes

- Stack unchanged: Astro 7, Bun, Tailwind v4, React island only for Say hey.  
- Prefer one new island: `SayHeyPanel.tsx` (or slim rename of NotesPanel).  
- After build, legacy Pages root sync still applies (`publish-legacy-root` on `main`).  
- Keep `public/CNAME` = `lilgrip.com`.

## Success criteria

- First viewport reads as one goofy composition with meme face dominant and brand unmistakable.  
- No sightings UI anywhere on the live site.  
- Say hey: send → bloom → quiet list; still shared via Supabase.  
- Feels more animated and fun without becoming unreadable on mobile.  
- `bun run lint|check|test|build|test:e2e` green; site still publishes.

## Out of scope follow-ups

- Realtime Supabase subscriptions for say-hey  
- Custom meme favicon pass  
- Deeper subpage content  
- Switching Pages source to GitHub Actions (ops, separate)
