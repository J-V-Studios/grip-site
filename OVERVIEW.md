# Project Overview — the lilgriper / lilgrip.com

Personal static site for **the lilgriper**. Chill tone, Catppuccin-inspired colors, light CS/server flavor, shared notes and grip sightings.

Live: [https://lilgrip.com](https://lilgrip.com)  
Repo publish: GitHub Pages from `main` (root).

---

## Current structure

```text
/
├── index.html          # Semantic page shell + all sections
├── styles.css          # Design tokens + layout + components
├── script.js           # ES module: screen, notes, sightings
├── favicon.svg
├── CNAME               # lilgrip.com
├── .nojekyll
├── README.md           # Deploy / DNS notes
├── OVERVIEW.md         # This file — architecture + design system
├── TODO.md             # Checkable roadmap
├── .cursorrules        # AI / contributor hard rules
└── images/
    └── lilgriper.jpg   # Hero portrait
```

### Page sections (top → bottom)

| Section | Markup hook | Purpose |
| --- | --- | --- |
| Hero | `main` + `.intro` + `.portrait` | Brand, chill line, 1 Corinthians 16:14, photo |
| Lilgrip screen | `.panel` / `.screen` | Interactive “node” UI (ping / tls / verse / boot) + gauges |
| Grip sightings | `.sightings` | Upload photo when spotting lilgriper; earn points; leaderboard |
| Notes | `.notes` | Shared public comments |

### Runtime dependencies

- Fonts: Google Fonts — Outfit, Fraunces, JetBrains Mono
- Data: Supabase project (`createClient` from `esm.sh/@supabase/supabase-js@2`)
  - `lilgrip_comments` — notes
  - `grip_sightings` — sightings metadata + points
  - Storage bucket `grip-sightings` — public photos
- Hosting: GitHub Pages + custom domain `lilgrip.com`

No package.json, no build pipeline. The browser loads the three source files directly.

---

## Design system

Fill and refine these tokens as the visual language evolves. Values below match the **current** Catppuccin-mocha-leaning implementation in `styles.css`.

### Color

| Token | Role | Current value | Notes / future |
| --- | --- | --- | --- |
| `--base` | Page background | `#1e1e2e` | Primary surface |
| `--text` | Body text | `#cdd6f4` | |
| `--subtext` | Muted labels | `#a6adc8` | |
| `--pink` | Primary accent / brand | `#f38ba8` | Keep as hero accent |
| `--mauve` | Secondary accent | `#cba6f7` | Eyebrows, chrome |
| `--peach` | Tertiary / warmth | `#fab387` | Chill line, hunter names |
| `--teal` | Status / cite | `#94e2d5` | Online, scripture cite |
| _Placeholder — surface_ | Cards / panels | e.g. `#181825` / `#313244` | Formalize as `--surface0`, `--crust` if expanded |
| _Placeholder — success_ | Live / OK | e.g. `#a6e3a1` | Used in pulse / lights |
| _Placeholder — border_ | Hairlines | `rgba(205, 214, 244, 0.12–0.16)` | Promote to `--line` |

### Typography

| Role | Family | Notes |
| --- | --- | --- |
| UI / body | Outfit | Sans; weights 400 / 560 / 700 |
| Display quote | Fraunces | Serif for scripture blockquote |
| Mono / nerdy UI | JetBrains Mono | Screen chrome, gauges, section labels |
| _Placeholder — scale_ | | Document `clamp()` steps for H1, lede, body, mono labels |

Fluid type already used for the brand name and host wordmark via `clamp(...)`.

### Spacing & layout

| Token idea | Intent | Current practice |
| --- | --- | --- |
| _Page gutter_ | Side margins | `calc(100% - 2.6rem)` desktop; tighter on mobile |
| _Content max_ | Main column | `min(1040px, …)` |
| _Section gap_ | Vertical rhythm | loosely `0.4rem`–`1.4rem` between blocks — formalize later |
| _Radius_ | Cards / screen | ~`0.85rem`–`1.35rem` |
| _Breakpoint_ | Stack layouts | `@media (max-width: 820px)` |
| _Tap target_ | Buttons | `min-height: 48px` |

### Motion

- Entrance: `.rise`
- Screen: shimmer, bit pulse, readout `.pop`
- Photo: soft `.halo`
- Always gate non-essential motion with `prefers-reduced-motion: reduce`

### Voice & imagery

- Chill, not athletic; pink accent stays.
- Hero image: `images/lilgriper.jpg` (full-bleed in portrait frame, not a card collage).
- Scripture: 1 Corinthians 16:14 — “Let all that you do be done in love.”

---

## Feature documentation standard

When adding or changing a feature, update this section (or link a short subsection) using this template:

### Feature: `<name>`

- **User goal:** one sentence.
- **UI location:** section / selectors.
- **Data:** tables, buckets, localStorage keys.
- **Permissions:** who can read/write (anon RLS, etc.).
- **Points / side effects:** e.g. `+10` grip points per sighting.
- **Empty / error states:** copy users see.
- **A11y notes:** labels, live regions, keyboard.

### Documented features (current)

#### Notes for lilgrip

- **User goal:** leave a short public note for the lilgriper.
- **UI:** `#note-form`, `#note-list`.
- **Data:** `lilgrip_comments` (`name`, `body`).
- **Permissions:** anon select + insert.
- **Limits:** name ≤ 24, body ≤ 200.

#### Grip sightings

- **User goal:** if you see the lilgriper IRL, upload a photo and earn grip points.
- **UI:** `#sighting-form`, `#sighting-list`, `#leaderboard`, `#my-points`.
- **Data:** `grip_sightings` + storage `grip-sightings`; hunter name in `localStorage` key `lilgrip-hunter`.
- **Points:** `+10` per successful sighting; leaderboard aggregates by hunter name.
- **Limits:** image ≤ 5MB; jpg/png/webp/heic; place ≤ 80 chars.

#### Lilgrip screen

- **User goal:** playful interactive “server node” for brand/CS flavor.
- **UI:** `.screen` commands `ping` / `tls` / `verse` / `boot`; gauges are decorative/live counters.
- **Data:** none (client-only).

---

## Architecture principles

1. Static first — ship HTML/CSS/JS as the source of truth.
2. One composition for the first viewport: brand + one idea + portrait.
3. Shared state only where everyone must see it (Supabase).
4. No framework drift — see `.cursorrules`.
5. Document as you go — keep `OVERVIEW.md` and `TODO.md` honest.
