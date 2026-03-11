# Architecture Rules

## Document Model

Kanava is a ProseMirror-based block editor library (npm module, not an application).

### Node Hierarchy

```
doc > blockGroup > blockNode+ > ((blockBody blockGroup?) | columnLayout)
                                                          columnLayout > column+ > blockNode+
```

- **`doc`** — top-level document node, content: `"blockGroup"`
- **`blockGroup`** — container for blocks, content: `"blockChild+"`
- **`blockNode`** — universal wrapper for ALL blocks, content: `"(blockBody blockGroup?) | columnLayout"`, group: `"blockChild block"`. Carries shared attrs: `id`, `textAlign`, `backgroundColor`, `spacingTop`, `spacingBottom`, `lineHeight`, `paddingTop/Bottom/Left/Right`, `borderColor/Width/Style/Radius`, `textIndent`, `letterSpacing`, pagination attrs (`pageBreakBefore`, `keepWithNext`, `keepLinesTogether`, `widowOrphan`)
- **`blockBody`** — the group name for all user-facing block types (paragraph, heading, image, etc.)
- **`columnLayout`** — lives inside `blockNode` (Option B architecture), content: `"column column+"`
- **`column`** — content: `"blockNode+"`, isolating: `true`
- **`text`** — inline text, group: `"inline"`

### Structural vs Extension Nodes

Structural nodes (`doc`, `blockGroup`, `blockNode`, `column`, `text`) are defined in `packages/core/src/schema/structuralNodes.ts`. They are **never** created via `defineBlock()`.

All user-facing block types use `defineBlock()` and have `spec.group: "blockBody"`.

## Package Structure

```
packages/core/   — @kanava/editor — Headless editor engine (ProseMirror, zero UI)
packages/react/  — @kanava/editor-react — React components (FormatBar, ContextMenu, BlockPicker, etc.)
apps/playground/ — Demo app using both packages
```

- Build tool: `tsup` for both packages, `vite` for playground
- Package manager: `pnpm` with workspaces
- Build order: core → react → playground (`pnpm -r build`)

## Key Design Principles

1. **No hardcoded block types in core logic.** Use schema groups, `BlockDefinition` registry, or `node.type` comparisons instead of string literals.
2. **Schema is always derived.** `buildSchema(blocks, marks)` is the only way — never import a singleton schema.
3. **React components are data-driven.** `BlockPicker`, `FormatBar`, `ContextMenu` render from `editor.blockDefs` and `editor.markDefs`.
4. **CSS is themeable.** Use `--kanava-*` CSS variables. Users override variables, not selectors.
5. **ProseMirror is a dependency, not a secret.** `editor.pmView` is accessible. `editor.exec(command)` is sugar.
6. **Every block is a `BlockDefinition`.** Built-in blocks use the same `defineBlock()` API as custom blocks.
7. **Features are opt-in.** Pagination, collaboration are plugins that only load when configured.

## Toolbar & Context Menu Architecture

- **`toolbarStatePlugin`** (core, headless) derives all toolbar/menu state from ProseMirror editor state
- **`useToolbarState(editor)`** (React hook) bridges core → React via `useSyncExternalStore`
- **FormatBar** shows in two modes: Text mode (mark toggles, alignment) or Block mode (from `BlockDefinition.toolbar`)
- **ContextMenu** uses Notion-style grouped layout with "Turn into" and "Columns" submenus. Block-specific items come from `BlockDefinition.contextMenu`.

## Drag Handle

- A 3-dot vertical grip that appears on **hover** at the top-left of each block
- Floats above content (`position: absolute`), requires **zero reserved padding**
- `BlockNodeView` renders as `<button>` with `contenteditable="false"`, `draggable="true"`
- On `mousedown`, creates `NodeSelection` for the entire `blockNode`
- `handleDrop` intercepts ALL `blockNode` drops — uses `findDropTarget()` with DOM-rect Y-midpoint comparison for insertion index (independent of `posAtCoords` text resolution)
- `preferTopLevel` flag skips column parents when dragging OUT of a column

## Column Architecture (Option B)

- `columnLayout` is always wrapped inside a `blockNode`
- Column nesting is enabled (no guard)
- Backspace/delete use cross-column sequential merge model
- `addColumnLeft`/`addColumnRight` replace the old generic `addColumn`
- GapCursor+Enter creates `blockNode > paragraph` at gap positions (handles column layouts at container edges where no text position exists at the wrapper level)

## Inline Marks

Implemented: `bold`, `italic`, `underline`, `strike`, `code`, `link`, `textColor`, `highlight`, `fontSize`, `fontFamily`, `superscript`, `subscript`

## Canvas Mode (interactionMode)

When `canvasMode` is enabled in editor options:
- The `interactionModePlugin` is registered (replaces standard click behavior)
- Single click → `NodeSelection` on the enclosing `blockNode`
- Double click → `TextSelection` (enter text editing within the block)
- Escape → exit text editing, back to `NodeSelection`
- CSS class `kanava-canvas-mode` added to editor root — strips block padding, drag handles, ghost rails, nested indentation borders
- Ghost rail plugin is skipped entirely
- `handleClick` and `handleDoubleClick` props suppress PM’s default click behavior when not in text editing mode
- Blocks with `backgroundColor` get `kanava-block--has-bg` class → min-padding (`8px 16px`) in canvas mode
- Block-level commands (`setTextAlign`, `setBlockBackground`, etc.) skip descending into `columnLayout`/`column` nodes

## Plugins (registered order in editor.ts)

1. `kanavaInputRules` — Markdown-style input rules
2. `kanavaKeymap` — Block/mark shortcuts
3. `blockIdPlugin` — Unique block IDs
4. `listRenumberPlugin` — Auto-renumber ordered lists
5. `placeholderPlugin` — Empty block placeholder text
6. `dragHandlePlugin` — Drop handler
7. `selectionPlugin` — CSS decoration classes for selected/focused blocks
8. `ghostRailPlugin` — Hierarchy rails (skipped in canvas mode)
9. `documentStructurePlugin` — Headless doc tree data (always on)
10. `clipboardPlugin` — Multi-block copy/paste, ID clearing
11. `imageUploadPlugin` — Drag/drop/paste image handling
12. `toolbarStatePlugin` — Derives toolbar/menu state
13. `paginationPlugin` — Page break decorations (if paginated)
14. `interactionModePlugin` — Canvas mode interactions (if canvasMode)
15. `history` — ProseMirror undo/redo
16. `dropCursor` — Drop position indicator
17. `gapCursor` — Cursor at edges of non-editable content

## Package-Level Skills

Package-specific skills are available in the root `.agent/skills/` directory:
- `add-block` — Adding new block types (core)
- `add-mark` — Adding new inline marks (core)
- `fix-plugin` — Fixing or adding ProseMirror commands and plugins (core)
- `modify-ui` — Modifying React UI components (react)
