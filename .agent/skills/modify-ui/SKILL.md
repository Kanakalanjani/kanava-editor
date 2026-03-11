---
name: modify-ui
description: Modify Kanava's React UI components — FormatBar, ContextMenu, BlockPicker, or toolbar primitives. Use when changing toolbar behavior, adding menu items, or updating the React wrapper.
metadata:
  author: kanava
  version: "1.0"
---

# Modify UI Components

## When to use

Use this skill when:
- Adding or changing toolbar/menu items
- Modifying FormatBar behavior or appearance
- Updating ContextMenu structure or actions
- Adding items to BlockPicker
- Changing toolbar state logic

## Architecture

```
@kanava/editor (headless)              @kanava/editor-react (UI)
┌─────────────────────────┐          ┌──────────────────────────┐
│ toolbarStatePlugin       │          │ useToolbarState() hook    │
│  • activeMarks           │  ─────►  │                          │
│  • selectedBlockType     │          │ <FormatBar>  (floating)  │
│  • availableActions[]    │          │ <ContextMenu> (right-click)
│  • blockToolbarItems[]   │          │ <BlockPicker> (slash cmd) │
│  • contextMenuItems[]    │          │ <ToolbarPrimitives>      │
│                          │          │                          │
│ BlockDefinition.toolbar  │          │ ToolbarButton, Group,    │
│ BlockDefinition.context  │          │ Separator, Dropdown      │
└─────────────────────────┘          └──────────────────────────┘
```

## Key files

| File | Purpose |
|------|---------|
| `packages/core/src/plugins/toolbarState.ts` | Headless state derivation |
| `packages/react/src/FormatBar.tsx` | Floating toolbar (text + block modes) |
| `packages/react/src/FixedToolbar.tsx` | Word-style fixed toolbar (always visible) |
| `packages/react/src/ContextMenu.tsx` | Right-click context menu |
| `packages/react/src/BlockPicker.tsx` | Slash-command block picker |
| `packages/react/src/ToolbarPrimitives.tsx` | Reusable toolbar atoms |
| `packages/react/src/ParagraphFormatPopover.tsx` | Paragraph formatting popover |
| `packages/react/src/SeparatorMenu.tsx` | Column separator context menu |
| `packages/react/src/ImageInsertPopover.tsx` | Image insertion popover |
| `packages/react/src/image-editor/` | Image editor modal components (crop, filter, adjust, rotate) |
| `packages/react/src/hooks.ts` | React hooks (`useToolbarState`, etc.) |

## Rules

1. **Never hardcode block/mark lists in React.** Derive from `editor.blockDefs` and `editor.markDefs`.
2. **Toolbar state logic belongs in core.** React components only read and render the state.
3. **Block-specific items come from `BlockDefinition.toolbar` and `BlockDefinition.contextMenu`.**
4. **FormatBar has two modes**: Text mode (mark toggles, alignment) and Block mode (block-specific items).
5. **ContextMenu uses Notion-style grouped layout** with "Turn into" and "Columns" submenus.

## Step-by-step: Adding a toolbar button

### 1. If state logic changes, update core first

Edit `packages/core/src/plugins/toolbarState.ts` to derive the new state field.

### 2. Update the React component

Edit the relevant component in `packages/react/src/`.

### 3. Update architecture docs

Edit `packages/docs/architecture-toolbar.md` to reflect changes.

### 4. Build and verify

```sh
pnpm -r build
```

## Step-by-step: Block-specific toolbar item

### 1. Add to BlockDefinition

In the block's definition file (`packages/core/src/blocks/{block}.ts`):
```ts
toolbar: [
  { key: "my-action", label: "Do Thing", icon: "🔧", command: myCommand },
],
```

### 2. No React changes needed

The `FormatBar` automatically renders items from `BlockDefinition.toolbar` in block mode.

## Verification checklist

- [ ] UI changes render correctly
- [ ] State derivation is correct (check `toolbarState.ts`)
- [ ] No hardcoded block/mark lists introduced
- [ ] `architecture-toolbar.md` updated if behavior changed
- [ ] Build passes: `pnpm -r build`

## Common mistakes

1. **Hardcoding block types in React** — e.g. `if (blockType === "heading")` in FormatBar. Use `editor.blockDefs` and `toolbar.blockToolbarItems` instead.
2. **Putting state derivation in React** — toolbar logic (what's active, what's available) belongs in `toolbarStatePlugin` in core. React only reads and renders.
3. **Forgetting to update architecture docs** — any toolbar behavior change should be reflected in `packages/docs/architecture-toolbar.md`.
4. **Adding UI-only imports to core** — `@kanava/editor` has zero DOM/React dependencies. UI stays in `@kanava/editor-react`.
5. **Not testing FormatBar + FixedToolbar** — both render from the same toolbar state. Changes must work in both.
