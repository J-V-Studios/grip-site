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
| `grid` | Grid layout block |
| `hero` | Hero layout block |
| `card` | Card layout block |
| `modal` | Modal layout block |
| `text` | Static text line |
| `button` | `button <id> label "<text>" -> action <actionId>` |
| `toggle` | `toggle <id>` optional `label` |
| `slider` | `slider <id>` |
| `tabs` | Tabs layout block |
| `toast` | Inline toast message node |
| `canvas` | Canvas layout block |
| `sprite` | `sprite <id>` |
| `timer` | `timer <id>` |
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

- Path must start with `./raw/`
- `export` names the module export
- `into slot` names a `raw_slot` id in the scene tree

## Comments

`//` to end of line.

## Minimal example

See `gripapps/templates/hello.grip`.
