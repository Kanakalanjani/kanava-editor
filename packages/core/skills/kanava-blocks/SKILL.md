---
name: kanava-blocks
description: Create custom block types for @kanava/editor using defineBlock(). Use when adding new content blocks (paragraph variants, embeds, widgets), understanding the block definition API, or configuring toolbar and context menu items for custom blocks.
metadata:
  author: kanava
  version: "1.0"
  package: "@kanava/editor"
---

# Custom Blocks with defineBlock()

## When to use

- Adding a new content block type (embed, widget, custom text block)
- Understanding the `BlockDefinition` API
- Adding block-specific toolbar or context menu items
- Configuring input rules or keybindings for a block

## Key files

| File | Purpose |
|------|-------|
| `src/extensions/defineBlock.ts` | `defineBlock()`, `BlockDefinition`, `ToolbarItem`, `ContextMenuItem` |
| `src/blocks/index.ts` | Built-in blocks and `builtInBlocks` array |
| `src/blocks/*.ts` | Individual block definitions (examples to follow) |
| `src/nodeViews/KanavaNodeView.ts` | Base class for custom NodeViews |
| `src/editor.ts` | NodeView registration |

## Steps: Add a custom block

### 1. Define the block

```ts
import { defineBlock } from "@kanava/editor";

export const MyBlock = defineBlock({
  name: "myBlock",
  label: "My Block",
  icon: "📦",
  group: "text",
  spec: {
    group: "blockBody",     // REQUIRED — always "blockBody"
    content: "inline*",     // "inline*" for text, "" for atoms
    isolating: true,
    parseDOM: [{ tag: "div.kanava-my-block" }],
    toDOM() { return ["div", { class: "kanava-my-block" }, 0]; },
  },
  convertible: true,        // Show in "Turn into" menus
});
```

### 2. Pass custom blocks to the editor

```ts
import { KanavaEditor, builtInBlocks } from "@kanava/editor";

const editor = new KanavaEditor({
  element,
  blocks: [...builtInBlocks, MyBlock],
});
```

### 3. Add toolbar items (optional)

```ts
export const MyBlock = defineBlock({
  name: "myBlock",
  // ...
  toolbar: [
    { key: "action", label: "Do Thing", icon: "🔧", command: myCommand },
  ],
  contextMenu: [
    { key: "special", label: "Special Action", command: specialCommand },
  ],
});
```

The FormatBar and ContextMenu render these automatically — no React changes needed.

## Built-in blocks reference

| Constant | `name` | Content | Notes |
|----------|--------|---------|-------|
| `Paragraph` | `paragraph` | `inline*` | Default block |
| `Heading` | `heading` | `inline*` | Variants: H1, H2, H3 |
| `Quote` | `quote` | `inline*` | Note: name is `quote`, NOT `blockquote` |
| `CodeBlock` | `codeBlock` | `text*` | Language attr |
| `Image` | `image` | atom | src, alt, width attrs |
| `Divider` | `divider` | atom | Horizontal rule |
| `BulletListItem` | `bulletListItem` | `inline*` | `continuable: true` |
| `NumberedListItem` | `numberedListItem` | `inline*` | `continuable: true` |
| `ChecklistItem` | `checklistItem` | `inline*` | `continuable: true` |
| `Toggle` | `toggle` | `inline*` | Collapsible |
| `Callout` | `callout` | `inline*` | Info/warning/error/success |
| `ColumnLayout` | `columnLayout` | structural | Not a blockBody |

## BlockDefinition fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `name` | `string` | Yes | Unique name |
| `spec` | `NodeSpec` | Yes | ProseMirror node spec (`group: "blockBody"`) |
| `label` | `string` | No | Display name for UI |
| `icon` | `string` | No | Emoji/icon for menus |
| `group` | `string` | No | UI group: text, list, media, layout, advanced |
| `nodeView` | `NodeViewFactory` | No | Custom rendering |
| `inputRules` | `(schema) => InputRule[]` | No | Markdown-like triggers |
| `keymap` | `(schema) => Record<string, Command>` | No | Key bindings |
| `commands` | `(schema) => Record<string, (...) => Command>` | No | Named commands |
| `convertible` | `boolean \| ConvertibleVariant[]` | No | "Turn into" support |
| `continuable` | `boolean` | No | Enter creates same type |
| `toolbar` | `ToolbarItem[]` | No | Block toolbar items |
| `contextMenu` | `ContextMenuItem[]` | No | Right-click menu items |

Full type definition: `src/extensions/defineBlock.ts`

## Architecture rules

- All user blocks MUST have `spec.group: "blockBody"`
- Visual styling (textAlign, backgroundColor, spacing) lives on `blockNode` wrapper — NOT in block attrs
- Column nesting: blocks can contain `columnLayout` → `column` → `blockNode` → blocks
- Definitions are frozen with `Object.freeze()` — never mutate after creation
- Use named exports only — no default exports
- All imports must use `.js` extension

## Common mistakes

1. `spec.group` not set to `"blockBody"` — breaks schema
2. Adding textAlign/backgroundColor to block attrs — these belong on blockNode
3. Block name `quote` vs `blockquote` — it's `quote`
4. Mutating a definition after `defineBlock()` — object is frozen
5. Forgetting `.js` import extensions
