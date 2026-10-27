# gripc compiler CLI

The repo exposes the compiler as:

```bash
bun run gripc -- <command> [args]
```

Implementation: `gripapps/gripc/src/cli.ts`.

## Commands

### `check`

Parse and validate without writing output.

```bash
bun run gripc -- check gripapps/templates/hello.grip
bun run gripc -- check public/community/coolkid/app.grip
```

Exit `0` on success; diagnostics print to stderr on failure.

### `build`

Compile `app.grip`, emit static assets into `--out`, vendor the shared runtime.

```bash
HANDLE=coolkid
OUT=public/community/$HANDLE
bun run gripc -- build $OUT/app.grip --out $OUT --handle $HANDLE
```

Writes:

- `app.grip.js` — compiled app IR
- `index.html` — boot page (CDN runtime with local vendor fallback)
- `manifest.json` — merges handle, title, blurb from `meta`, fresh `builtAt`
- `vendor/gripapps/runtime.js` — copied from `public/gripapps/runtime.js`

### `vendor-runtime`

Copy only the shared runtime into a directory (for repairs or custom layouts).

```bash
bun run gripc -- vendor-runtime --out public/community/coolkid
```

## Agent checklist

1. Author `public/community/<handle>/app.grip`
2. `bun run gripc -- check …`
3. `bun run gripc -- build … --out public/community/<handle> --handle <handle>`
4. Confirm `vendor/gripapps/runtime.js` and `manifest.json` exist beside `index.html`
