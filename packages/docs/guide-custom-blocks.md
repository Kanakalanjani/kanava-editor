---
anchored-to:
  - packages/core/src/extensions/defineBlock.ts
  - packages/core/src/blocks/index.ts
  - packages/core/src/nodeViews/KanavaNodeView.ts
  - packages/core/src/editor.ts
last-verified: 2025-06-07
---

# Custom Blocks Guide

How to create custom block types using `defineBlock()` and extend the Kanava editor.

## Overview

Every block in Kanava — including built-ins — is defined via `defineBlock()`. This is the primary extensibility primitive. Custom blocks get the same treatment as built-in blocks: schema generation, node views, input rules, toolbar items, context menu items, and serialization.

## `BlockDefinition` interface

> **Source of truth:** [`defineBlock.ts`](../core/src/extensions/defineBlock.ts)

Key fields:

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Unique name (e.g. `"myBlock"`, `"myapp:kanban"`) |
| `spec` | Yes | ProseMirror `NodeSpec` — `group` defaults to `"blockBody"` |
| `label` | No | Human-readable label for UI |
| `icon` | No | Emoji or string for BlockPicker/menus |
| `group` | No | UI grouping: `"text"`, `"list"`, `"media"`, `"layout"`, `"advanced"` |
| `nodeView` | No | Custom NodeView factory (falls back to `spec.toDOM`) |
| `inputRules` | No | `(schema) => InputRule[]` — merged into global set |
| `keymap` | No | `(schema) => Record<string, Command>` — merged into global keymap |
| `commands` | No | `(schema) => Record<string, (...args) => Command>` — named commands |
| `convertible` | No | `true` or `ConvertibleVariant[]` for "Turn into" menus |
| `continuable` | No | `true` if Enter creates another of same type (list items) |
| `toolbar` | No | `ToolbarItem[]` — block-specific toolbar items |
| `contextMenu` | No | `ContextMenuItem[]` — block-specific context menu items |
| `toKanava` / `fromKanava` | No | Override serialization |

## Step-by-step: Creating a block

### 1. Define the block

Create `packages/core/src/blocks/myBlock.ts`:

```ts
import { defineBlock } from "../extensions/defineBlock.js";

export const MyBlock = defineBlock({
  name: "myBlock",
  label: "My Block",
  icon: "📦",
  group: "text",
  spec: {
    group: "blockBody",     // ALWAYS "blockBody"
    content: "inline*",     // "inline*" for text blocks, "" for atoms
    isolating: true,
    attrs: { /* block-specific attrs — NOT visual styling */ },
    parseDOM: [{ tag: "div.kanava-my-block" }],
    toDOM(node) {
      return ["div", { class: "kanava-my-block" }, 0];
    },
  },
  convertible: true,
});
```

### 2. Register in barrel exports

Edit [`packages/core/src/blocks/index.ts`](../core/src/blocks/index.ts):
- Add named export
- Add to the `builtInBlocks` array

**Important:** You must also add a `declare` statement if the block has custom attrs to make TypeScript aware of the new node. See "TypeScript declare gotcha" below.

### 3. Add NodeView (if needed)

If the block needs custom DOM rendering beyond `toDOM`, create a NodeView extending `KanavaNodeView`:

> **Source of truth:** [`KanavaNodeView.ts`](../core/src/nodeViews/KanavaNodeView.ts)

Key methods:
- `render(node)` — return `{ dom, contentDOM }` 
- `onUpdate(node)` — sync DOM with attrs changes
- `this.el(tag, className)` — create DOM elements
- `this.setAttrs()` — read node attrs

### 4. Wire NodeView in editor

Register in the `nodeViews` object at [`editor.ts`](../core/src/editor.ts) constructor. Block definitions can also provide a `nodeView` factory directly in `defineBlock()`.

### 5. Add CSS

Add styles in `packages/core/src/styles/editor.css` using the `kanava-` prefix.

### 6. Build and verify

```sh
pnpm -r build
```

## TypeScript declare gotcha

When adding a block with custom attrs, you may need to augment ProseMirror's type declarations so `state.schema.nodes.myBlock` is recognized. Without this, TypeScript may not autocomplete your new node type.

For blocks added to `builtInBlocks`, ProseMirror's schema inference should handle it. For dynamically registered blocks, add to the global augmentation if needed.

## Built-in blocks reference

| Constant | `name` | Content | Group | Convertible |
|----------|--------|---------|-------|-------------|
| `Paragraph` | `paragraph` | `inline*` | text | Yes |
| `Heading` | `heading` | `inline*` | text | Variants (H1-H3) |
| `Quote` | `quote` | `inline*` | text | Yes |
| `CodeBlock` | `codeBlock` | `text*` | text | Yes |
| `Image` | `image` | atom | media | No |
| `Divider` | `divider` | atom | media | No |
| `BulletListItem` | `bulletListItem` | `inline*` | list | Yes |
| `NumberedListItem` | `numberedListItem` | `inline*` | list | Yes |
| `ChecklistItem` | `checklistItem` | `inline*` | list | Yes |
| `Toggle` | `toggle` | `inline*` | advanced | Yes |
| `Callout` | `callout` | `inline*` | advanced | Yes |
| `ColumnLayout` | `columnLayout` | structural | layout | No |

> **Source of truth:** [`blocks/index.ts`](../core/src/blocks/index.ts)

**Note:** The block type name is `quote`, not `blockquote`. Use `state.schema.nodes.quote`.

## Block-specific toolbar items

Blocks can contribute data-driven toolbar items via the `toolbar` field. The React `<FormatBar>` automatically renders these in "block mode" when the block is selected — no React changes needed.

> See [architecture-toolbar.md](./architecture-toolbar.md) for the full toolbar state flow.

```ts
export const MyBlock = defineBlock({
  name: "myBlock",
  // ...
  toolbar: [
    { key: "my-action", label: "Do Thing", icon: "🔧", command: myCommand },
    { key: "size", label: "Size", type: "dropdown", items: [
      { key: "sm", label: "Small", command: setSizeCmd("sm") },
      { key: "lg", label: "Large", command: setSizeCmd("lg") },
    ]},
  ],
});
```

## Common mistakes

1. **Setting `spec.group` to anything other than `"blockBody"`** — breaks the schema hierarchy
2. **Adding visual properties to block spec attrs** — textAlign, backgroundColor, spacing belong on `blockNode` wrapper, not the block itself
3. **Forgetting `.js` extension on imports** — required for ESM
4. **Using default exports** — always use named exports
5. **Hardcoding block references in React** — use `editor.blockDefs` instead
6. **Mutating a frozen definition** — `defineBlock()` returns `Object.freeze()`'d objects
