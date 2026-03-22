# Workflow & Process Rules

## Build & Verify

After any code change:
1. Run `pnpm -r build` from the workspace root to verify all three packages compile
2. Check for TypeScript errors across all packages
3. If modifying CSS, visually verify in the playground (`pnpm --filter playground dev`)

## Plan Documentation

The project uses plan documents in `docs/plans/`:

| File | Purpose |
|------|---------|
| `MASTER-IMPLEMENTATION-PLAN.md` | Overall project roadmap (completed + upcoming phases) |
| `Architecture Plan.md` | Core architecture reference (schema, nesting, columns, toolbar, extension system) |
| `phases/phase-1-layout-primitives.md` | Phase 1: Layout Primitives (completed) |
| `phases/phase-2-api-polish.md` | Phase 2: API Polish (completed) |
| `phases/phase-3-ghost-rail.md` | Phase 3: Ghost Rail (completed) |
| `phases/phase-4-compound-blocks.md` | Phase 4: Compound Block Infrastructure (not started) |
| `phases/phase-5-block-types.md` | Phase 5: Missing Block Types (not started) |
| `phases/phase-6-font-system.md` | Phase 6: Font System (not started) |
| `phases/phase-7-canvas-mode-fixes.md` | Phase 7: Canvas Mode Bug Fixes (✅ complete) |
| `phases/phase-8-selection-model.md` | Phase 8: Block Selection Model (not started) |
| `phases/phase-9-column-resize.md` | Phase 9: Column Resize Improvements (✅ complete) |
| `phases/phase-10-resume-builder-stabilization.md` | Phase 10: Resume Builder Stabilization (not started) |
| `column-resize-drag.md` | Column resize drag implementation details |

After completing work:
- Update the relevant plan document(s) — change ⬜ to ✅
- Add notes if the implementation deviated from the plan

## Doc Sync Rules

When changing code, update the corresponding documentation. This table is the single source of truth for code-to-doc relationships:

| When you change… | Update this doc |
|---|---|
| FormatBar, ContextMenu, FixedToolbar, toolbar state | `packages/docs/architecture-toolbar.md` |
| ColumnLayoutView, column commands, separators, columns.css | `packages/docs/architecture-columnLayout.md` |
| Schema structure, blockNode attrs, structuralNodes | `packages/docs/guide-document-model.md` |
| Any block definition or NodeView | `packages/docs/guide-custom-blocks.md` |
| React components, hooks, toolbar primitives | `packages/docs/guide-react-integration.md` |
| Clipboard, parseDOM, link handling, security-relevant code | `.agent/rules/security.md` |
| KanavaEditor constructor, DocumentStyle, init flow | `packages/docs/guide-initialization.md` |
| CSS variables, density presets, theming | `packages/docs/guide-theming.md` |
| Plan phase completion | Relevant `docs/plans/phases/*.md` — change ⬜ to ✅ |

Key source files have `@see` JSDoc tags pointing to their docs. When you see one, treat it as a reminder to check that doc.

### Architecture docs

- `packages/docs/architecture-toolbar.md` — Toolbar & Context Menu architecture
- `packages/docs/architecture-columnLayout.md` — Column layout, resize drag, separators
- `docs/plans/Architecture Plan.md` — Overall architecture reference

## Git Practices

- Commit after each logical unit of work (not after every file change)
- Commit messages: imperative mood, reference the plan phase if applicable
  - `"Add hard_break node and Shift+Enter keymap (Phase A.1)"`
  - `"Fix numbered list renumbering after split (Phase A.2)"`

## File Organization

```
packages/core/src/
  api/         — Public API types, blockTree serialization, events, pagination
  blocks/      — BlockDefinition files (one per block type)
  commands/    — ProseMirror commands grouped by domain:
                   block.ts, blockAttrs.ts, columns.ts, columnBackspace.ts,
                   columnNav.ts, gapCursorInsert.ts, image.ts, inlineMarks.ts,
                   nesting.ts, splitMerge.ts, text.ts, traversal.ts
  extensions/  — defineBlock, defineMark, definePlugin, schemaBuilder
  marks/       — MarkDefinition files (one per mark type)
  nodeViews/   — NodeView implementations:
                   KanavaNodeView.ts (base), BlockNodeView.ts,
                   ColumnLayoutView.ts, ColumnView (in ColumnLayoutView.ts),
                   ImageNodeView.ts, CodeBlockView.ts,
                   ToggleNodeView.ts, CalloutNodeView.ts
  plugins/     — ProseMirror plugins:
                   inputRules.ts, keymap.ts, blockId.ts, listRenumber.ts,
                   placeholder.ts, dragHandle.ts, selection.ts, ghostRail.ts,
                   documentStructure.ts, clipboard.ts, imageUpload.ts,
                   toolbarState.ts, pagination.ts, interactionMode.ts
  schema/      — Structural nodes, schema builder wrapper
  styles/      — CSS files

packages/react/src/
  KanavaEditor.tsx           — React wrapper component
  FormatBar.tsx              — Floating toolbar (text + block modes)
  FixedToolbar.tsx           — Word-style fixed toolbar (always visible)
  ContextMenu.tsx            — Right-click context menu with submenus
  BlockPicker.tsx            — Block picker with categories, search, descriptions
  DocumentTree.tsx           — Sidebar document outline tree
  DocumentStats.tsx          — Word count / reading time display
  ToolbarPrimitives.tsx      — Reusable toolbar atoms (ToolbarButton, etc.)
  ParagraphFormatPopover.tsx — Paragraph formatting popover (spacing, indentation)
  SeparatorMenu.tsx          — Column separator context menu (style, color, width)
  ImageInsertPopover.tsx     — Image insertion popover (URL input)
  ImageEditorModal.tsx       — Image editor modal (re-exports from image-editor/)
  SelectDropdown.tsx         — Generic select dropdown primitive
  NumberStepper.tsx          — Number stepper input primitive
  SegmentedControl.tsx       — Segmented control primitive
  GhostRail.tsx              — Ghost rail breadcrumb tooltip (hierarchy path on hover)
  hooks.ts                   — React hooks (useKanavaEditor, useToolbarState, etc.)
  image-editor/              — Image editor components (crop, filter, adjust, rotate)
```

## Testing Changes

When modifying editor behavior, test these scenarios:
- Basic typing in a paragraph
- Block type conversion (Turn into heading, list, etc.)
- Column creation, nesting, backspace/delete across columns
- Column resize (drag gutter, double-click to reset)
- Image upload, resize, alignment
- Copy/paste across blocks and columns
- Undo/redo after each operation
- Keyboard shortcuts still work (Ctrl+B, Ctrl+I, etc.)
- Ghost rail hierarchy indication on hover
