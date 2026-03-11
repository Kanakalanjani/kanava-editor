---
anchored-to:
  - packages/core/src/editor.ts
  - packages/core/src/editorHelpers.ts
  - packages/core/src/api/types.ts
last-verified: 2025-06-07
---

# Initialization & Configuration Guide

How to create and configure a `KanavaEditor` instance.

## Quick start

```ts
import { KanavaEditor } from "@kanava/editor";

const editor = new KanavaEditor({
  element: document.getElementById("editor")!,
});
```

The constructor accepts a single `KanavaEditorOptions` object. All fields except `element` are optional.

## Options reference

> **Source of truth:** [`KanavaEditorOptions`](../core/src/api/types.ts) interface.

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `element` | `HTMLElement` | — (required) | DOM element to mount the editor in |
| `content` | `KanavaDocument` | empty doc | Initial content |
| `editable` | `boolean` | `true` | Start in read-only mode when `false` |
| `placeholder` | `string` | — | Placeholder text for empty paragraphs |
| `onChange` | `(doc) => void` | — | Called when content changes |
| `onSelectionChange` | `(info) => void` | — | Called when selection changes |
| `mode` | `"pageless" \| "paginated"` | `"pageless"` | Layout mode |
| `pageSize` | `{ width, height }` | — | Page dimensions (paginated mode) |
| `pagination` | `PaginationConfig` | — | Full pagination config (overrides `pageSize`) |
| `blocks` | `BlockDefinition[]` | `builtInBlocks` | Custom block definitions |
| `marks` | `MarkDefinition[]` | `builtInMarks` | Custom mark definitions |
| `onImageUpload` | `(file) => Promise<string>` | — | Image paste/drop handler |
| `documentStyle` | `DocumentStyle` | `{}` | Document-level typography defaults |
| `layoutMode` | `"standard" \| "compact"` | `"standard"` | Spacing density and drag handle style |

## Document style & density presets

`documentStyle` sets defaults via CSS custom properties on the editor root. Per-block attributes override these.

> **Source of truth:** [`DocumentStyle`](../core/src/api/types.ts) interface and [`DENSITY_PRESETS`](../core/src/editorHelpers.ts).

| Preset | `lineHeight` | `paragraphGap` | `fontSize` |
|--------|-------------|---------------|-----------|
| `tight` | 1.2 | 4 px | 14 px |
| `comfortable` | 1.5 | 8 px | 16 px |
| `relaxed` | 1.8 | 16 px | 18 px |

Explicit values override density presets:

```ts
const editor = new KanavaEditor({
  element,
  documentStyle: { density: "tight", lineHeight: 1.4 }, // lineHeight overrides tight's 1.2
});
```

Runtime updates:

```ts
editor.setDocumentStyle({ density: "comfortable" });
editor.getDocumentStyle(); // returns resolved style
```

## Schema building

The editor builds its ProseMirror schema dynamically from the provided block and mark definitions:

```
KanavaEditorOptions.blocks → buildSchema(blocks, marks) → ProseMirror Schema
```

> **Source of truth:** [`buildSchema()`](../core/src/extensions/schemaBuilder.ts) and constructor at [`editor.ts`](../core/src/editor.ts).

If no `blocks` or `marks` are provided, the editor uses `builtInBlocks` (12 types) and `builtInMarks` (12 types). You can extend or replace these arrays to customize the editor.

## Plugin wiring order

The constructor installs plugins in this specific order (order matters for priority):

1. `kanavaInputRules` — markdown-like input rules
2. `kanavaKeymap` — all key bindings
3. `blockIdPlugin` — assigns unique IDs to blocks
4. `listRenumberPlugin` — sequential numbering for ordered lists
5. `placeholderPlugin` — empty-block placeholder text
6. `dragHandlePlugin` — block drag handle overlay
7. `selectionPlugin` — block selection highlighting
8. `ghostRailPlugin` — insert-between-blocks rail
9. `clipboardPlugin` — clipboard sanitization
10. `imageUploadPlugin` — image paste/drop handling
11. `toolbarStatePlugin` — derives toolbar/menu state
12. Pagination plugins (conditional)
13. `history` — undo/redo (ProseMirror built-in)
14. `dropCursor` — drop position indicator
15. `gapCursor` — cursor for positions without content

> **Source of truth:** Plugin array at [editor.ts constructor](../core/src/editor.ts).

## NodeView registration

NodeViews are registered in the constructor's `nodeViews` object. Structural views are always present; block-body views are added from `BlockDefinition.nodeView`:

**Always present:** `blockNode`, `column`, `columnLayout`, `image`, `codeBlock`, `toggle`, `callout`

Custom blocks can provide a `nodeView` factory via `defineBlock()` — see [guide-custom-blocks.md](./guide-custom-blocks.md).

## API methods

> **Source of truth:** [`KanavaEditorAPI`](../core/src/api/types.ts) interface and [`KanavaEditor`](../core/src/editor.ts) class.

| Method | Returns | Purpose |
|--------|---------|---------|
| `getDocument()` | `KanavaDocument` | Get content as Kanava JSON |
| `setDocument(doc)` | `void` | Load content from Kanava JSON |
| `getRawJSON()` | `Record<string,any>` | Get raw ProseMirror JSON (debug) |
| `focus()` | `void` | Focus the editor |
| `blur()` | `void` | Blur the editor |
| `destroy()` | `void` | Destroy the editor instance |
| `isEditable()` | `boolean` | Check editable state |
| `setEditable(bool)` | `void` | Toggle editable state |
| `exec(command)` | `boolean` | Execute a ProseMirror command |
| `chain()` | `CommandChain` | Start a command chain for batching |
| `setDocumentStyle(style)` | `void` | Update document-level styling |
| `getDocumentStyle()` | `DocumentStyle` | Get resolved document style |

### Events

```ts
editor.on("change", (doc) => { /* content changed */ });
editor.on("selectionChange", (info) => { /* selection changed */ });
editor.on("focus", () => { /* editor focused */ });
editor.on("blur", () => { /* editor blurred */ });
```

### Escape hatches

- `editor.pmView` — underlying `ProseMirror EditorView`
- `editor.pmState` — underlying `ProseMirror EditorState`
- `editor.schema` — the built `ProseMirror Schema`
- `editor.blockDefs` — registered block definitions
- `editor.markDefs` — registered mark definitions
