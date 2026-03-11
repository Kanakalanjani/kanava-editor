---
anchored-to:
  - packages/react/src/hooks.ts
  - packages/react/src/KanavaEditor.tsx
  - packages/react/src/FormatBar.tsx
  - packages/react/src/ContextMenu.tsx
  - packages/react/src/BlockPicker.tsx
last-verified: 2025-06-07
---

# React Integration Guide

How to use `@kanava/editor-react` to embed and interact with the Kanava editor in a React application.

## Quick start

```tsx
import { KanavaEditorComponent } from "@kanava/editor-react";
import "@kanava/editor/dist/styles.css";

function App() {
  return (
    <KanavaEditorComponent
      onChange={(doc) => console.log(doc)}
      placeholder="Start typing..."
    />
  );
}
```

## `<KanavaEditorComponent>` props

> **Source of truth:** [`KanavaEditor.tsx`](../react/src/KanavaEditor.tsx)

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `initialContent` | `KanavaDocument` | — | Initial content |
| `onChange` | `(doc) => void` | — | Content change callback |
| `onSelectionChange` | `(info) => void` | — | Selection change callback |
| `onFocus` / `onBlur` | `() => void` | — | Focus/blur callbacks |
| `editable` | `boolean` | `true` | Read-only when `false` |
| `placeholder` | `string` | — | Placeholder text |
| `mode` | `"pageless" \| "paginated"` | `"pageless"` | Layout mode |
| `pageSize` | `{ width, height }` | — | Page dimensions (legacy) |
| `pagination` | `PaginationConfig` | — | Full pagination config |
| `className` | `string` | — | CSS class for the container |
| `editorRef` | `React.Ref<KanavaEditor>` | — | Access the editor instance |
| `blocks` | `BlockDefinition[]` | built-ins | Custom blocks |
| `marks` | `MarkDefinition[]` | built-ins | Custom marks |
| `onImageUpload` | `(file) => Promise<string>` | — | Image upload handler |

## Hooks

> **Source of truth:** [`hooks.ts`](../react/src/hooks.ts)

### `useKanavaEditor()`

Returns a `MutableRefObject<KanavaEditor | null>` for accessing the editor instance.

```tsx
const editorRef = useKanavaEditor();
// Pass to <KanavaEditorComponent editorRef={editorRef} />
// Then: editorRef.current?.exec(toggleBold)
```

### `useToolbarState(editor)`

Subscribes to toolbar state changes via `useSyncExternalStore`. Returns a `ToolbarState` object or `null`.

```tsx
const toolbar = useToolbarState(editorRef.current);
if (!toolbar) return null;
// toolbar.activeMarks, toolbar.selectedBlockType, toolbar.blockToolbarItems, etc.
```

The `ToolbarState` is derived in `@kanava/editor`'s [`toolbarStatePlugin`](../core/src/plugins/toolbarState.ts) — React only reads, never derives.

### `useSelectionInfo(editor)`

Subscribes to selection changes. Returns `KanavaSelectionInfo | null`.

```tsx
const selection = useSelectionInfo(editorRef.current);
// selection.activeMarks, selection.blockType, selection.blockAttrs, selection.empty
```

### `useIsMarkActive(editor, markName)`

Convenience wrapper — returns `boolean` for whether a specific mark is active.

```tsx
const isBold = useIsMarkActive(editorRef.current, "bold");
```

## UI components

All components read from `editor.blockDefs` and `editor.markDefs` — no hardcoded block/mark lists.

### FormatBar (floating toolbar)

> **Source of truth:** [`FormatBar.tsx`](../react/src/FormatBar.tsx) and [`architecture-toolbar.md`](./architecture-toolbar.md)

Two modes:
- **Text mode**: mark toggles (bold, italic, …), alignment, text color, highlight
- **Block mode**: block-specific toolbar items from `BlockDefinition.toolbar`

Renders automatically when text is selected. Position is derived from the DOM selection.

### ContextMenu (right-click)

> **Source of truth:** [`ContextMenu.tsx`](../react/src/ContextMenu.tsx)

Notion-style grouped layout with "Turn into" and "Columns" submenus. Items come from:
- Built-in actions (delete, duplicate, copy)
- `BlockDefinition.contextMenu` per block type
- `toolbarState.contextMenuItems` from the plugin

### BlockPicker (slash command)

> **Source of truth:** [`BlockPicker.tsx`](../react/src/BlockPicker.tsx)

Appears when typing `/` at the start of an empty block. Lists all blocks from `editor.blockDefs` grouped by their `group` field ("text", "list", "media", "layout", "advanced").

### FixedToolbar

> **Source of truth:** [`FixedToolbar.tsx`](../react/src/FixedToolbar.tsx)

Word-style always-visible toolbar. Alternative to the floating FormatBar for traditional layouts.

### Other components

| Component | File | Purpose |
|-----------|------|---------|
| `ToolbarPrimitives` | [`ToolbarPrimitives.tsx`](../react/src/ToolbarPrimitives.tsx) | Reusable atoms: `ToolbarButton`, `ToolbarGroup`, `ToolbarSeparator`, etc. |
| `ParagraphFormatPopover` | [`ParagraphFormatPopover.tsx`](../react/src/ParagraphFormatPopover.tsx) | Paragraph formatting (line height, spacing, indent) |
| `SeparatorMenu` | [`SeparatorMenu.tsx`](../react/src/SeparatorMenu.tsx) | Column separator context menu |
| `GhostRail` | [`GhostRail.tsx`](../react/src/GhostRail.tsx) | Ghost rail breadcrumb tooltip (hierarchy path on hover) |
| `ImageInsertPopover` | [`ImageInsertPopover.tsx`](../react/src/ImageInsertPopover.tsx) | Image insertion popover |
| `ImageEditorModal` | [`ImageEditorModal.tsx`](../react/src/ImageEditorModal.tsx) | Image editor modal (crop, filter, adjust, rotate) |

## Architecture principle

```
@kanava/editor (headless)              @kanava/editor-react (UI)
┌─────────────────────────┐          ┌──────────────────────────┐
│ toolbarStatePlugin       │  ─────►  │ useToolbarState() hook    │
│  • activeMarks           │          │                          │
│  • selectedBlockType     │          │ <FormatBar>  (floating)  │
│  • blockToolbarItems[]   │          │ <ContextMenu> (right-click)│
│  • contextMenuItems[]    │          │ <BlockPicker> (slash cmd) │
└─────────────────────────┘          └──────────────────────────┘
```

**Core is headless.** It derives what should appear in toolbars. React components only render that state. No toolbar logic should live in React components.
