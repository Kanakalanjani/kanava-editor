# Playground Rules

## Ownership

This app (`apps/playground`) is a Vite-based demo app for visual testing. It is **not published** — it's a development tool.

## Directory Responsibilities

| Directory | Owns | Does NOT own |
|-----------|------|-------------|
| `components/` | Playground-specific UI (EditorShell, etc.) | Reusable editor components |
| `data/` | Sample documents, fixtures | Editor schema/types |
| `hooks/` | App-specific hooks | Core editor hooks |
| `styles.css` | Playground visual overrides | Core editor CSS |

## Rules

1. **Never add reusable editor logic here** — put it in `@kanava/editor` or `@kanava/editor-react`
2. **Playground styles override core CSS** — use `styles.css`, not `editor.css`
3. **Test all block types** — keep sample data covering every block/mark type
4. **Don't import from `prosemirror-*` directly** — use `@kanava/editor` APIs
5. **Keep it simple** — this is for testing, not production
