# Kanava Editor — Progress & Deferred Items

> Last updated: 2026-03-09

## Completed Sessions

### Session 1: Phase 1 — Layout Primitives ✅
- `DocumentStyle` type + density presets + `setDocumentStyle()`/`getDocumentStyle()` API
- `--kanava-paragraph-gap` CSS variable chain
- XSS security audit (clipboard, blockTree — schema-based whitelist confirmed)
- Consumer skills: `kanava-core`, `kanava-security`

### Session 2: Phase 2 — API Polish ✅
- JSDoc on `KanavaEditor` public methods
- `DocumentStyle` re-exported from `@kanava/editor-react`
- `package.json` metadata (keywords, license, repo, homepage, engines >=18)
- `agents` field with 3 consumer skills
- `.npmignore` created
- Consumer skill: `kanava-blocks`

### Session 3: Playground Polish + React Skills + Memory ✅
- Density switcher with info popover
- Playground docs (features.md, demo-data.md)
- React consumer skills (kanava-react, kanava-react-custom)
- `.agent/memory/` (architecture, roadmap, known-issues)
- `ROADMAP.md` + `docs/licensing-checklist.md`
- `agents` field in React `package.json`
- Dead CSS cleanup (`.kanava-toolbar-btn` — 26 lines removed)
- Image showcase enhanced (3 images: alignment × filter variants)
- Column layout section with descriptive intro

### Session 4: Image System — Phase A + B ✅
- **A1**: Fixed paste/drop into empty image block — `setupEmptyDropZone()` in `ImageNodeView` with native DOM event handlers
- **A3**: Rotation now applies on `<img>` only — caption stays upright
- **A4**: Caption always visible when image has `src`
- **B0**: Schema: added `filterIntensity` (0-100) and `adjustments` ({brightness, contrast, saturation}) attrs
- **B1**: Filters tab in `ImageEditorModal` — preset thumbnails with per-image preview
- **B2**: Aspect ratio presets for crop (Free / 1:1 / 4:3 / 16:9 / 3:2)
- **B3**: Adjustment sliders (brightness/contrast/saturation, 0-200%)
- **B4**: Live CSS filter preview in modal; `applyFilter()` in NodeView rewritten for intensity + adjustments
- **Commands**: `setFilterIntensity()` and `setImageAdjustments()` added and exported
- **toDOM**: Rotation on `<img>`, filter intensity scaling via regex, adjustments serialized to data attrs

### Session 5: Ghost Rail ✅
- `ghostRailPlugin` (302 lines) — hierarchy indicators via ProseMirror decorations
- `buildAncestorChain()` walks from position to doc root collecting blockNode/columnLayout/column ancestors
- Depth-colored left borders (5-tier cycling: blue, teal, green, purple, orange)
- Hover tracking via `mouseover`/`mouseleave` DOM events with 300ms grace period
- Click-to-select via `handleClick` prop — no stale closures

### Session 6: Column Resize Rework ✅
- Full rework of `ColumnLayoutView.ts` (373 lines) — drag resize with gutter positioning
- `startResize()` with `onMouseMove`/`onMouseUp` handlers on `document`
- `commitColumnWidths()` commits to ProseMirror attrs
- `resetAllColumnWidths()` via double-click on any gutter
- `ColumnView` added for column-level rendering with overflow control
- ResizeObserver feedback loop fix
- Column separator customization: `separatorStyle`, `separatorColor`, `separatorWidth` attrs on `columnLayout`

### Session 7: UI Components ✅
- `SeparatorMenu.tsx` (218 lines) — right-click context menu for column separators (style, color, width)
- `FixedToolbar.tsx` (423 lines) — Word-style toolbar with block type, font, marks, alignment, link, ¶ formatting
- `ParagraphFormatPopover.tsx` — paragraph formatting popover (spacing, indentation)
- `ImageInsertPopover.tsx` — image insertion popover (URL input)
- `image-editor/` subdir refactored into separate panel components (CropPanel, FilterPanel, AdjustPanel, RotatePanel)

### Convergence Sprint 1: Ghost Rail UX ✅
- Ghost rail code complete, UX deferred — vertical rails clip in paginated/canvas layouts
- Ghost rail hierarchy approach evolved into `DocumentTree` sidebar component (Sprint NI-3)

### Convergence Sprint 2: Column Polish ✅
- `separatorPadding` attr on `columnLayout` schema
- Width percentage labels during resize drag
- Min/max column constraints (10%/90%)
- Keyboard accessibility on gutters (`tabindex`, arrow keys)

### NI Sprint 1: Core API + Resume Foundation ✅
- `blockNodeAttrs` in `SelectionInfo` for toolbar state
- `resetBlockFormatting()` command
- Resume builder sidebar controls (LayoutSidebar)
- localStorage persistence + JSON export/import
- `DocumentStats` component
- `BlockPicker` wiring in playground + resume-builder

### NI Sprint 2: Canvas Mode ✅
- `interactionModePlugin` — single-click → NodeSelection, double-click → text editing
- CSS left-edge tax removal (`.kanava-canvas-mode` class)
- Block keyboard shortcuts (Mod-D duplicate, Mod-Shift-Backspace delete, Mod-Shift-Arrow move)

### NI Sprint 3: DocumentTree + Enhanced BlockPicker ✅
- `documentStructurePlugin` — headless plugin that builds flat `DocumentStructureNode[]` on doc changes
- `<DocumentTree>` React component — sidebar block hierarchy with search and click-to-navigate
- Enhanced `<BlockPicker>` — categories (text/list/media/layout/advanced), search, descriptions

### Phase 7: Canvas Mode Bug Fixes (S1) ✅
- **Bug 1 fix**: Added `handleClick` + `handleDoubleClick` props to `interactionModePlugin` — suppresses PM's click-to-cursor when not in text editing mode
- **Bug 3 fix**: Canvas mode background colors get min-padding (`8px 16px`) via `.kanava-block--has-bg` class toggle in `BlockNodeView`
- **Bug 5 fix**: All block-level commands (`setTextAlign`, `setBlockBackground`, `setLineHeight`, etc.) skip descending into `columnLayout`/`column` nodes

### Phase 9: Column Resize Production Quality (S2) ✅
- Absolute min-width `MIN_COL_PX = 60` enforced on both drag and keyboard resize
- Gap-aware calculations via `applyGap()` method
- `showWidthLabels()` — pixel-width labels displayed during resize, color changes at minimum
- Visual feedback: `kanava-gutter--at-min` class, red gutter highlighting, `not-allowed` cursor
- GapCursor+Enter: `insertBlockAtGapCursor` command for column edges
- DOM-rect-based `findDropTarget` for structural drop resolution

### Phase 6-7 Closure: Beta Publish Preparation ✅
- Package rename: `@kanava/core` → `@kanava/editor`, `@kanava/react` → `@kanava/editor-react` (116 files)
- OSS repo setup at `C:\Projects\kanava-editor-npm-oss` → `Kanakalanjani/kanava-editor` (public)
- `sync-to-oss.ps1` (350 lines) — allowlist-based dev→OSS sync with build gate, URL patching, protected paths
- `validate-oss.ps1` — 5-tier validation (source parity, leak detection, package audit, build output, publint)
- `@changesets/cli` installed and configured with `linked` versioning
- CSS distribution: postbuild copy + `./styles/*` subpath export
- `dev:dist` mode: `KANAVA_DIST=1` env var toggles Vite aliases for testing built artifacts
- CHANGELOG.md, community files (CODE_OF_CONDUCT, CONTRIBUTING, SECURITY), comprehensive README
- CI workflows: publish.yml, validate.yml
- npm publish attempted — blocked on auth (granular tokens can't create new packages)

### Phase 8: Block Multi-Selection (Partial) ✅
- `MultiBlockSelection` custom Selection class at `packages/core/src/selections/MultiBlockSelection.ts`
- `blockMultiSelectionPlugin` at `packages/core/src/plugins/blockMultiSelection.ts`
- Both registered in constructor and exported from index
- Further UX refinements (drag selection, decorations, keyboard ops) remain

---

## Deferred / Pending Items

### Image System

| Item | Description | Effort | Priority |
|------|-------------|--------|----------|
| **A2: Image URL input UI** | `insertImageFromUrl()` exists in core but has no UI. Needs popover in BlockPicker or empty image state with Upload / URL / Drag options (Notion-style) | Medium | High |
| **C1: Shape crops** | Circle, rounded rect crop shapes. Needs `cropShape` attr + `clip-path` in NodeView + shape selector in edit modal | Medium | Medium |
| **C2: Rich captions** | Change caption from plain text attr to inline content (`content: "inline*"`). Image becomes non-atom. Major schema change | Large | Low |

### Pre-Publish

| Item | Description | When |
|------|-------------|------|
| ~~`@changesets/cli` setup~~ | ✅ Installed and configured (`.changeset/config.json`, `linked` versioning) | Done |
| `npm audit` | Run `pnpm audit`, resolve findings | Before first npm publish |
| `npm pack --dry-run` | Needs LICENSE file at package roots. Verify tarball contents | Before first npm publish |
| Dead code cleanup | Unused ICON_MAP entries, unused imports. Needs deeper React component audit | Ongoing |
| Full JSDoc on all commands | High-impact JSDoc done. ~40+ individual commands remain — diminishing returns | Ongoing as commands are modified |

### Nice-to-Have

| Item | Description | When |
|------|-------------|------|
| CSS unit support in spacing commands | `"12pt"`, `"1em"` strings. Requires CSS unit parser. Current px numbers sufficient | Future minor release |

---

## Active Work

| Phase | Title | Status | See |
|-------|-------|--------|-----|
| Beta Publish | OSS Repo + npm Publish Prep | 🔄 In progress (auth blocked) | `docs/plans/phase-6-7-closure-implementation-plan.md`, `scripts/sync-to-oss.ps1` |
| Phase 10 | Resume Builder Stabilization | ⬜ Not started | `docs/plans/phases/phase-10-resume-builder-stabilization.md` |
| Phase 8 | Block Multi-Selection Model | 🔄 Partially done | `docs/plans/phases/phase-8-selection-model.md` |

## Future Phases (Not Started)

| Phase | Title | Status | See |
|-------|-------|--------|-----|
| Phase 4 | Compound Block Infrastructure | ⬜ Deferred | `docs/plans/phases/phase-4-compound-blocks.md` |
| Phase 5 | Missing Block Types (Table, Video, Bookmark, File) | ⬜ Deferred | `docs/plans/phases/phase-5-block-types.md` |
| Phase 6 | Font System | ⬜ Deferred | `docs/plans/phases/phase-6-font-system.md` |


