# Core Package Rules

## Ownership

This package (`@kanava/editor`) owns the headless editor engine. It has **zero React dependencies**.

## Directory Responsibilities

| Directory | Owns | Does NOT own |
|-----------|------|-------------|
| `api/` | Public types, blockTree serialization, events | UI rendering |
| `blocks/` | Block definitions via `defineBlock()` | React components |
| `commands/` | ProseMirror commands | UI state |
| `extensions/` | `defineBlock()`, `defineMark()`, `buildSchema()` | Component APIs |
| `marks/` | Mark definitions via `defineMark()` | Toolbar rendering |
| `nodeViews/` | DOM rendering, lifecycle, attrs sync | React hooks |
| `plugins/` | ProseMirror plugins (blockId, selection, etc.) | React state |
| `schema/` | Structural nodes (doc, blockGroup, blockNode) | Block bodies |
| `styles/` | CSS with `--kanava-*` vars, `.kanava-` classes | Playground styles |

## Rules

1. **No React imports** — this package is framework-agnostic
2. **No default exports** — use named exports only
3. **`.js` extensions** on all relative imports (ESM requirement)
4. **`import type`** for type-only imports
5. **No hardcoded block names** — use `schema.nodes[name]` or group checks
6. **Block-level styles go on `blockNode`** — never on individual blockBody specs
7. **Every new block uses `defineBlock()`** — no raw NodeSpec additions
8. **CSS classes use `.kanava-` prefix** — no BEM, no CSS modules
9. **CSS values use `var(--kanava-*)` variables** — no hardcoded colors/sizes
10. **Commands follow the pattern**: iterate `nodesBetween`, collect positions, `setNodeMarkup`
