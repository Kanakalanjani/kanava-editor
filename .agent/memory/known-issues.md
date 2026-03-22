# Known Issues & Gotchas

## Active Bugs

### Bug 2: Cross-Block Text Selection Not Possible (Phase 8) — Partially Addressed
**Root cause**: All blockBody nodes have `isolating: true` — standard block editor behavior.
**Current state**: `MultiBlockSelection` class exists at `packages/core/src/selections/MultiBlockSelection.ts` and `blockMultiSelectionPlugin` exists at `packages/core/src/plugins/blockMultiSelection.ts`. Both are registered and exported. Further UX refinements (drag selection, keyboard ops, decoration polish) remain in Phase 8.
**See**: `docs/plans/phases/phase-8-selection-model.md`

### Bug 6a: Image Crop Coordinate Mismatch (Phase 10)
**Root cause**: Crop drag in `ImageEditorModal.tsx` uses percentage coordinates relative to the preview container, but the preview container's aspect ratio may differ from the actual image.
**Fix**: Use `img.naturalWidth`/`naturalHeight` as the coordinate reference, accounting for `object-fit: contain` display rect.
**File**: `packages/react/src/image-editor/ImageEditorModal.tsx`

### Bug 6b: Margin Change Destroys Undo History (Phase 10)
**Root cause**: `ResumeEditor.tsx` derives `editorKey` from `JSON.stringify({ pageSize, margins })`. Margin change → key change → React remount → ProseMirror and undo history destroyed.
**Fix**: (1) Remove margins from `editorKey`. (2) Use `setPaginationConfig()` runtime method on `KanavaEditor` (exists at `editor.ts:450`). (3) Long-term: make document style changes transactional.
**Files**: `apps/resume-builder/src/components/ResumeEditor.tsx`, `packages/core/src/editor.ts`, `packages/core/src/plugins/pagination.ts`

## Resolved Bugs

### Bug 1: Canvas Mode Click Race Condition — ✅ Fixed (Phase 7, S1)
Added `handleClick` + `handleDoubleClick` props to `interactionModePlugin`. `handleClick` returns `true` when `textEditingActive` is false, suppressing PM's click-to-cursor behavior.

### Bug 3: Background Color Not Edge-to-Edge in Canvas Mode — ✅ Fixed (Phase 7, S1)
`BlockNodeView` toggles `kanava-block--has-bg` class when `backgroundColor` is set. CSS applies `padding: 8px 16px; border-radius: 4px` in canvas mode.

### Bug 4: Column Resize Breaks with 3+ Columns — ✅ Fixed (Phase 9, S2)
`MIN_COL_PX = 60` absolute floor enforced. Gap-aware calculations via `applyGap()`. Visual feedback: `kanava-gutter--at-min` class with red highlighting and `not-allowed` cursor.

### Bug 5: Alignment/Background Bleeds Into All Columns — ✅ Fixed (Phase 7, S1)
All block-level commands (`setTextAlign`, `setBlockBackground`, `setLineHeight`, `setBlockPadding`, `resetBlockFormatting`) check `node.firstChild?.type.name === "columnLayout"` and return `true` (stop descending) for columnLayout nodes.

## ProseMirror Gotchas

- **NodeView class fields**: Use `declare` for class fields that are set in the constructor. Otherwise TypeScript emits initializers that override constructor-set values.
- **getPos type**: `getPos` is typed as `() => number | undefined` (not `() => number`). Always check the return value.
- **Schema is frozen**: Never mutate the schema after creation. Create a new one with `buildSchema()`.

## Editor Gotchas

- **`setDocument()` fail-fast**: Unknown block types throw a `TypeError`. This is intentional — it surfaces schema mismatches immediately.
- **`DocumentStyle` merges**: `setDocumentStyle()` merges with existing style. To reset, pass all fields explicitly.
- **Density vs explicit values**: When `density` is set alongside explicit values (e.g., `lineHeight`), explicit values win.
- **CSS var precedence**: Per-block inline `lineHeight` (from blockNode attrs) overrides `--kanava-line-height` from DocumentStyle.

## Column Layout

### Column resize
Column resize uses a direct mouse-drag model in `ColumnLayoutView.ts`:
- Gutters are rebuilt on `onUpdate()` and positioned via `positionGutters()`
- Drag tracking uses `startResize()` with `onMouseMove`/`onMouseUp` handlers on `document`
- Widths are committed to ProseMirror attrs via `commitColumnWidths()`
- Double-click any gutter to reset all columns to equal widths (`resetAllColumnWidths()`)
- Columns use `overflow: hidden` to reflow content during resize
- Absolute minimum column width: `MIN_COL_PX = 60` enforced on drag and keyboard
- `showWidthLabels()` displays pixel widths during resize, turns red at minimum
- `kanava-gutter--at-min` class toggles visual feedback (red gutter, `not-allowed` cursor)

### Column separator customization
`columnLayout` supports `separatorStyle`, `separatorColor`, and `separatorWidth` attrs. The `SeparatorMenu` React component provides a right-click context menu on gutters for customization.

### Cross-column operations
Backspace/delete across column boundaries use a sequential merge model. Commands are in `columnBackspace.ts` and `columnNav.ts`.

## Ghost Rail

The ghost rail plugin (`ghostRail.ts`) renders hierarchy indicators via ProseMirror decorations (CSS class + custom properties). It uses:
- `buildAncestorChain()` to walk from a position up to the doc root
- `createNodeDecorations()` to create `Decoration.node` with depth-colored left borders
- `mouseover`/`mouseleave` on `handleDOMEvents` for hover tracking
- `handleClick` prop for click-to-select behavior
- A 300ms grace period (`scheduleClear`) to prevent flicker

No external DOM is created — all visual effects are CSS-only through decorations.

## Build Gotchas

- Run `pnpm -r build` (not just core) — React depends on core types.
- The playground Vite build may warn about chunk size > 500KB — this is expected for the ProseMirror bundle.
