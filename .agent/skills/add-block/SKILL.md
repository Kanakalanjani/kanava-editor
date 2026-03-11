---
name: add-block
description: Add a new block type to the Kanava editor. Use when implementing a new content block (e.g., paragraph variant, media embed, custom widget). Covers defineBlock(), NodeView, CSS, barrel exports, and editor wiring.
metadata:
  author: kanava
  version: "1.0"
---

# Add a New Block Type

## When to use

Use this skill when:
- The user asks to add a new block type to the editor
- A new content type needs to be supported (e.g., table, embed, callout variant)
- A custom block needs to be created for a consumer's use case

## Prerequisites

Read `.agent/rules/architecture.md` to understand the node hierarchy:
```
doc > blockGroup > blockNode > (blockBody | columnLayout)
```
All user-facing blocks have `spec.group: "blockBody"`.

## Step-by-step

### 1. Create the block definition

Create `packages/core/src/blocks/{blockName}.ts`:

```ts
import { defineBlock } from "../extensions/defineBlock.js";

export const MyBlock = defineBlock({
  name: "myBlock",          // camelCase, unique across all blocks
  label: "My Block",        // Human-readable label for UI
  icon: "📦",               // Emoji or short string for BlockPicker/menus
  group: "text",            // UI group: "text" | "list" | "media" | "layout" | "advanced"
  spec: {
    group: "blockBody",     // ALWAYS "blockBody" — this is required
    content: "inline*",     // "inline*" for text blocks, "" for atom/void blocks
    isolating: true,
    attrs: {
      // Block-specific attributes (NOT visual styling — that lives on blockNode)
    },
    parseDOM: [{ tag: "div.kanava-my-block" }],
    toDOM(node) {
      return ["div", { class: "kanava-my-block" }, 0];
    },
  },
  // Optional fields:
  convertible: true,        // Show in "Turn into" menus (FormatBar + ContextMenu)
  continuable: false,       // Whether Enter at end creates another of same type
  inputRules: (schema) => [],
  keymap: (schema) => ({}),
  commands: (schema) => ({}),
  toolbar: [],              // Block-specific toolbar items
  contextMenu: [],          // Block-specific context menu items
});
```

### 2. Register in barrel exports

Edit `packages/core/src/blocks/index.ts`:
- Add named export: `export { MyBlock } from "./myBlock.js";`
- Add to `builtInBlocks` array: `import { MyBlock } from "./myBlock.js";` then include in array

### 3. Create NodeView (if needed)

If the block needs custom DOM rendering beyond `toDOM`, create `packages/core/src/nodeViews/MyBlockNodeView.ts`:

```ts
import { KanavaNodeView } from "./KanavaNodeView.js";
import type { Node as PMNode } from "prosemirror-model";

export class MyBlockNodeView extends KanavaNodeView {
  render(node: PMNode) {
    const dom = this.el("div", "kanava-my-block");
    const contentDOM = this.el("div", "kanava-my-block-content");
    dom.appendChild(contentDOM);
    return { dom, contentDOM };
  }

  protected onUpdate(node: PMNode): void {
    // Sync DOM with node.attrs changes
  }
}
```

Export from `packages/core/src/nodeViews/index.ts`.

### 4. Wire NodeView in editor

Edit `packages/core/src/editor.ts` — register the NodeView in the `nodeViews` object passed to ProseMirror's EditorView.

### 5. Add CSS

Edit `packages/core/src/styles/editor.css`:
```css
.kanava-my-block {
  /* Block styles */
}
```

### 6. Build and verify

```sh
pnpm -r build
```

## Verification checklist

- [ ] Block appears in BlockPicker when typing `/`
- [ ] Block renders correctly in the editor
- [ ] "Turn into" conversion works (if `convertible: true`)
- [ ] Enter/Backspace/Delete behavior is correct
- [ ] Copy/paste preserves block content
- [ ] Undo/redo works
- [ ] Build passes: `pnpm -r build`

## Common mistakes

- Setting `spec.group` to something other than `"blockBody"` — breaks the schema
- Forgetting `.js` extension on imports
- Using default exports instead of named exports
- Hardcoding block references in React components instead of using `editor.blockDefs`
- Adding visual properties (textAlign, backgroundColor) to the block spec instead of relying on `blockNode` wrapper
- Mutating a block definition after `defineBlock()` — it's `Object.freeze()`'d
- Using `"blockquote"` as a type name — the built-in is named `"quote"`

## Built-in blocks reference

| Constant | `name` | Content | Continuable |
|----------|--------|---------|-------------|
| `Paragraph` | `paragraph` | `inline*` | No |
| `Heading` | `heading` | `inline*` | No |
| `Quote` | `quote` | `inline*` | No |
| `CodeBlock` | `codeBlock` | `text*` | No |
| `Image` | `image` | atom | No |
| `Divider` | `divider` | atom | No |
| `BulletListItem` | `bulletListItem` | `inline*` | Yes |
| `NumberedListItem` | `numberedListItem` | `inline*` | Yes |
| `ChecklistItem` | `checklistItem` | `inline*` | Yes |
| `Toggle` | `toggle` | `inline*` | No |
| `Callout` | `callout` | `inline*` | No |
| `ColumnLayout` | `columnLayout` | structural | No |

> **Source of truth:** `packages/core/src/blocks/index.ts`

## Registration pattern

After creating the block file:

1. Add named export to `packages/core/src/blocks/index.ts`
2. Add to `builtInBlocks` array in the same file
3. Export from `packages/core/src/index.ts` if it should be part of the public API
4. If the block's NodeView needs an import in `editor.ts`, add it to the `nodeViews` object

## Further reading

- Full `BlockDefinition` API: `packages/docs/guide-custom-blocks.md`
- Document model and node hierarchy: `packages/docs/guide-document-model.md`
- Theming custom blocks via CSS: `packages/docs/guide-theming.md`
