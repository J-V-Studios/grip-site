# Community mini-app scaffold

Canonical workflow for building static pages that GitHub Pages serves at `/community/<handle>/`.

## Layout in the repo

After a successful build, **only** these paths (for one handle) should change in a community PR:

```text
public/community/<handle>/
  index.html          # required — entry point
  manifest.json       # required — gallery metadata
  assets/             # JS, CSS, images from Vite build
  _src/               # optional — source if you keep it for rebuilds
```

Advanced stacks (Vite, React, Three.js, Motion, etc.) may live under `public/community/<handle>/_src/`. **Commit the built static output** so Pages needs no Node server at runtime.

## Template repo folder

The reference template lives at [`community-scaffold/`](../../community-scaffold/) in this repository. Agents may copy its structure into `_src` under the handle folder or use it as a mental model.

## Build commands (template)

From `community-scaffold/` (or from `public/community/<handle>/_src/` if you copied the template there):

```bash
bun install    # or: npm install
bun run build  # or: npm run build
```

Output goes to `dist/` with `index.html` and `assets/`.

## Copy output into the sandbox

Replace the previous build for the same handle (wipe old assets first, keep or regenerate `manifest.json`):

```bash
HANDLE=coolkid   # lowercase slug from the brief
DEST=public/community/$HANDLE
rm -rf "$DEST/assets"
mkdir -p "$DEST"
cp -r dist/* "$DEST/"
```

Ensure `manifest.json` exists at `$DEST/manifest.json`:

```json
{
  "handle": "coolkid",
  "title": "Laser Squid Arena",
  "blurb": "tiny goofy shooter",
  "builtAt": "2026-10-26T00:00:00.000Z"
}
```

Use the real handle, title, and blurb from the plan; set `builtAt` to the build time in ISO 8601 UTC.

## Vite base path

For subpath hosting at `/community/<handle>/`, set Vite `base` to `./` (relative assets). The template `vite.config.ts` does this by default.

## CI expectations

Community PRs must include:

- `public/community/<handle>/index.html` (non-empty)
- `public/community/<handle>/manifest.json`
- No files outside that handle’s folder

See [design spec §9](../superpowers/specs/2026-10-26-community-builds-design.md).

## Mobile and accessibility basics

- Readable on small screens; tap targets big enough to use
- Respect `prefers-reduced-motion` for heavy animation (see template CSS)
- No dependency on server-side APIs for core page function (static only)
