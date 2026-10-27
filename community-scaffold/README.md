# lilgrip community scaffold

Minimal Vite + React template for visitor mini-pages. Production output is static HTML/JS/CSS suitable for GitHub Pages at `/community/<handle>/`.

## Develop

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
```

Artifacts land in `dist/` (`index.html` + `assets/`).

## Ship into the repo sandbox

From the **repository root** (adjust `HANDLE`):

```bash
HANDLE=yourhandle
DEST=public/community/$HANDLE
cd community-scaffold
bun run build
cd ..
rm -rf "$DEST/assets"
mkdir -p "$DEST"
cp -r community-scaffold/dist/* "$DEST/"
```

Add or update `public/community/$HANDLE/manifest.json` (see [docs/community/SCAFFOLD.md](../docs/community/SCAFFOLD.md)).

Agents may copy this folder to `public/community/<handle>/_src/` and run the same commands from there.
