# Changelog

## 0.1.0-beta.1

Initial beta release.

### `@kanava/editor`
- Block-based document editor engine built on ProseMirror
- Built-in blocks: paragraph, heading, list, image, code block, callout, toggle, separator, columns
- Built-in marks: bold, italic, underline, strikethrough, code, link, highlight, text color, font size, font family, subscript, superscript
- Pagination system with A4/Letter/Custom page sizes
- Column layout with drag-to-resize
- Ghost rail for inserting blocks between content
- Drag handle for reordering blocks
- Find and replace
- Block multi-selection
- Document serialization (JSON)
- Extension API: `defineBlock()`, `defineMark()`, `definePlugin()`
- CSS theming via `--kanava-*` custom properties

### `@kanava/editor-react`
- `<KanavaEditorComponent />` React wrapper
- `<FormatBar />` floating toolbar
- `<FixedToolbar />` top toolbar
- `<ContextMenu />` right-click menu with submenus
- `<BlockPicker />` slash-command block picker
- `<ImageInsertPopover />` image upload/URL dialog
- `<FindReplaceBar />` find and replace UI
- `<DocumentTree />` document outline
- `<GhostRail />` block insertion rail
- Hooks: `useKanavaEditor()`, `useToolbarState()`, `useSelectionInfo()`
