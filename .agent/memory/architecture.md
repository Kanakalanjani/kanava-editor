# Architecture Overview

## Node Hierarchy

```
doc → blockGroup → blockNode* → blockBody (paragraph | heading | ...)
                                  └ blockGroup? (nested children)
```

- **blockNode**: Wrapper carrying `id`, styles (`backgroundColor`, `padding*`, `lineHeight`, `textAlign`, etc.), and pagination attrs (`pageBreakBefore`, `keepWithNext`)
- **blockBody**: Content node (paragraph, heading, codeBlock, etc.)
- **blockGroup**: Container for sibling blocks

## Package Structure

- `@kanava/editor` — Headless editor engine (ProseMirror-based). Zero React deps.
- `@kanava/editor-react` — React UI layer (toolbar, format bar, block picker). Peer-depends on core.
- `apps/playground` — Demo app. Not published.

## Extension Model

- `defineBlock()` → Register custom block types
- `defineMark()` → Register custom inline marks
- `definePlugin()` → Register ProseMirror plugins

All extensions are data-driven: blocks declare toolbar items, context menus, and keyboard shortcuts as data. The React layer renders them.

## Key Plugins

- `interactionModePlugin` — Canvas mode: single-click → NodeSelection, double-click → text editing, Escape → back to select
- `documentStructurePlugin` — Headless plugin that builds flat `DocumentStructureNode[]` on doc changes, drives `<DocumentTree>` sidebar
- `ghostRailPlugin` — Hierarchy indicator decorations (depth-colored borders). Skipped in canvas mode.
- `toolbarStatePlugin` — Derives all toolbar/menu state from ProseMirror editor state
- `paginationPlugin` — Decoration-based page breaks (if paginated)
- `dragHandlePlugin` — 3-dot hover grip, DOM-rect-based `findDropTarget` for drop resolution

## React Components

- `<DocumentTree>` — Sidebar block hierarchy with search and click-to-navigate
- `<BlockPicker>` — Slash-command picker with categories (text/list/media/layout/advanced), search, descriptions
- `<FormatBar>` — Floating toolbar (text mode: marks/alignment; block mode: from `BlockDefinition.toolbar`)
- `<ContextMenu>` — Right-click menu with "Turn into" and "Columns" submenus
- `<FixedToolbar>` — Word-style toolbar with block type, font, marks, alignment, link, ¶ formatting
- `<DocumentStats>` — Word/character/paragraph count

## CSS Architecture

CSS custom properties on `:root` for all visual tokens. Blocks styled via `var(--kanava-*)`. Document-level styles applied via `setDocumentStyle()` → CSS vars on the editor root element.

## Security Model

ProseMirror schema = XSS whitelist. No `innerHTML` anywhere. Schema-declared nodes/marks are the only things created from pasted HTML.
