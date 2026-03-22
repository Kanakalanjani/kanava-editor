# Phase 5: Missing Block Types

> **Priority**: 🔵 Lower — Builds on top of stable core
>
> **Status**: ⬜ Not started
>
> **Depends on**: Phases 1–2

---

## Goal

Fill out the block library so Kanava ships a complete set of content blocks comparable to Notion and Google Docs.

---

## Blocks to Add

### 5.1 — Table Block
- Basic rows × columns table
- Cell-level text editing
- Add/remove rows and columns
- Cell merge deferred to later

### 5.2 — Video Block
- Embed URLs (YouTube, Vimeo, Loom)
- `<iframe>` rendering with responsive aspect ratio
- Alt text / caption support

### 5.3 — Bookmark / Link Preview Block
- URL input → fetch Open Graph metadata
- Renders title, description, image, favicon
- Fallback to plain URL display

### 5.4 — File Attachment Block
- Upload or link to file
- Renders file name, size, download icon
- Configurable via `onFileUpload` callback (like `onImageUpload`)

---

## Implementation Pattern

Each block follows the standard `defineBlock()` pattern:
1. Create `blocks/{name}.ts` with spec, parseDOM, toDOM
2. Create `nodeViews/{Name}NodeView.ts` if custom rendering needed
3. Add to `builtInBlocks`
4. Add toolbar/context menu items
5. Export from `index.ts`

## Verification

- Each block type renders correctly
- Copy/paste preserves content
- Undo/redo works
- Block appears in BlockPicker
- Pagination handles the block correctly
