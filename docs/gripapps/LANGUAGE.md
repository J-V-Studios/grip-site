# GripApps language vocabulary

This document mirrors `gripapps/gripc/src/tokens.ts`. If the compiler and this file disagree, **fix the docs or tokens — do not drift**.

## Top-level keywords

| Keyword | Purpose |
| --- | --- |
| `meta` | Required block: `title`, `blurb`, `theme` |
| `shell` | Optional scalar key/value block |
| `state` | Initial app state (string, number, or boolean values) |
| `scene` | UI scene with an id and a root node tree |
| `action` | Named action with imperative steps |
| `raw_module` | Sandboxed ES module hook (path under `./raw/`) |

## Scene child keywords

| Keyword | Notes |
| --- | --- |
| `stack` | Vertical layout block |
| `grid` | Grid layout block (visible container; children render) |
| `hero` | Hero layout block (visible container; children render) |
| `card` | Card layout block (visible container; children render) |
| `modal` | Modal layout block (visible container; children render) |
| `text` | Static text line |
| `button` | `button <id> label "<text>" -> action <actionId>` (action target required) |
| `toggle` | **Not implemented.** `gripc check` rejects `toggle` |
| `slider` | **Not implemented.** `gripc check` rejects `slider` |
| `tabs` | Tabs layout block (visible container; children render) |
| `toast` | **Scene `toast` is not implemented** and `gripc check` rejects it. Show a message with an action step `toast "..."` |
| `canvas` | Canvas layout block |
| `sprite` | `sprite <id>` |
| `timer` | **Not implemented.** `gripc check` rejects `timer` |
| `score_hud` | Score HUD widget |
| `particles` | Particles widget |
| `image` | `image "<src>"` |
| `emoji_stage` | `emoji_stage "<emoji>"` |
| `clear` | `clear "<color>"` |
| `raw_slot` | `raw_slot <id>` — mount point for `raw_module` |

## Layout block keywords

These scene children take a `{ ... }` body with nested UI nodes:

| Keyword |
| --- |
| `stack` |
| `grid` |
| `hero` |
| `card` |
| `modal` |
| `canvas` |
| `tabs` |

## Theme presets

| Preset |
| --- |
| `lilgrip_default` |

Set in `meta { theme <preset> }`.

## Action steps

Inside `action <id> { ... }`:

| Step | Syntax |
| --- | --- |
| `set` | `set <key> <scalar>` |
| `goto` | `goto <sceneId>` |
| `back` | `back` |
| `toast` | `toast "<message>"` |

## `raw_module` line

```text
raw_module "./raw/my-module.js" export MyThing into slot my_slot
```

- Path must start with `./raw/` and must not contain `..`
- The declaration stays on one line (a following `scene` is not part of the module line)
- `export` names the module export (runtime toasts if that export is not a function)
- `into slot` names a `raw_slot` id in the scene tree
- The runtime loads the module with `new URL(path, document.baseURI)` so the path is page-relative

## Unimplemented interactive widgets

`gripc check` rejects these scene widgets. They are reserved words, not working controls:

| Widget | What to do instead |
| --- | --- |
| `toggle` | Remove it until the runtime supports it |
| `slider` | Remove it until the runtime supports it |
| `timer` | Remove it until the runtime supports it |
| scene `toast` | Action step `toast "..."` |

Layout blocks `stack`, `grid`, `hero`, `card`, `modal`, and `tabs` render as visible containers and show their children. `canvas` renders the play surface.

## Comments

`//` to end of line.

## Minimal example

See `gripapps/templates/hello.grip`.
