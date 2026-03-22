# Kanava Editor Roadmap

> Last updated: 2026-03-09. For detailed task-level tracking, see [MASTER-IMPLEMENTATION-PLAN.md](docs/plans/MASTER-IMPLEMENTATION-PLAN.md).

## Completed

### Foundation ✅
- **12 block types**: paragraph, heading, code, quote, image, divider, checklist, bullet list, numbered list, toggle, callout, column layout
- **12 inline marks**: bold, italic, underline, strikethrough, code, link, text color, highlight, font size, font family, superscript, subscript
- **Extension system**: `defineBlock()`, `defineMark()`, `definePlugin()` — all built-in blocks dogfood the same API
- **Pagination**: Decoration-based page breaks, page size presets, margins, page break attrs
- **Column layout**: Drag resize with 60px min-width, pixel-width labels, separator customization, keyboard accessibility
- **Canvas mode**: `interactionModePlugin` — single-click block selection, double-click text editing
- **Document tree**: `documentStructurePlugin` + `<DocumentTree>` sidebar component
- **Image editor**: Crop (free + aspect ratios), filters, adjustments (brightness/contrast/saturation), rotation
- **Toolbar**: `<FormatBar>` (floating), `<FixedToolbar>` (Word-style), `<ContextMenu>`, `<BlockPicker>` (categories/search)
- **Block styling**: Text alignment, background color, spacing, line height, padding, border, indentation
- **API**: `DocumentStyle` with density presets, `setDocumentStyle()`/`getDocumentStyle()`, `getDocumentStructure()`
- **Resume builder**: Paginated editor with sidebar controls, localStorage, JSON export/import

### Bug Fix Sprints ✅
- **Phase 7** (S1): Canvas mode click race fix, background scoping, alignment bleed into columns
- **Phase 9** (S2): Column resize production quality — 60px min, gap-aware calc, visual feedback

## In Progress

### Phase 10: Resume Builder Stabilization (S3)
- Fix `editorKey` remount issue (margin change destroys undo history)
- Add `setPaginationConfig()` runtime API
- Fix image crop coordinate mapping

### Phase 8: Block Multi-Selection Model (S5)
- Custom `MultiBlockSelection` ProseMirror Selection class
- Cross-block drag detection plugin
- Decorations, keyboard ops, Shift+Click extension

## Planned

### Light Theme + Resume Polish (S4)
Blue/warm-gray light theme, collapsible sidebars, EDIT/PREVIEW, templates.

### Font System
Web font loading, `registerFont()`, Google Fonts integration, font picker UI.

### Compound Block Infrastructure
`defineCompoundBlock()`, accordion, tabs — nested block templates.

### Missing Block Types
Table with row/col ops, video embed, generic URL embed.

## Pre-Publish Requirements
See [Licensing Checklist](docs/licensing-checklist.md) for remaining tasks before npm publish.
