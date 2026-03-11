# @kanava/editor

Headless block editor engine built directly on ProseMirror. No TipTap, no BlockNote — full control over schema, rendering, and behavior.

## What's Inside

```
src/
├── api/           # Public API types, blockTree serialization, events
├── blocks/        # Block definitions (one per type, via defineBlock())
├── commands/      # ProseMirror commands by domain (text, block, columns, nesting)
├── extensions/    # Extension APIs: defineBlock(), defineMark(), schemaBuilder
├── marks/         # Mark definitions (one per type, via defineMark())
├── nodeViews/     # Custom ProseMirror NodeViews (base class + per-block)
├── plugins/       # ProseMirror plugins (blockId, selection, toolbar state, etc.)
├── schema/        # Structural nodes (doc, blockGroup, blockNode, column)
├── styles/        # CSS with --kanava-* custom properties
├── editor.ts      # KanavaEditor class — main entry point
└── index.ts       # Public exports barrel
```

## Key APIs

| API | Purpose |
|-----|---------|
| `KanavaEditor` | Main editor class — `new KanavaEditor({ element, blocks, marks, mode })` |
| `defineBlock()` | Define a block type — spec, nodeView, commands, toolbar items |
| `defineMark()` | Define an inline mark — spec, keymap, commands |
| `editor.exec(cmd)` | Execute a ProseMirror command |
| `editor.chain()` | Chain multiple commands in one transaction |
| `editor.getDocument()` | Get the document as a `KanavaDocument` JSON tree |

## Build

```bash
pnpm --filter @kanava/editor build    # → dist/ (ESM + DTS)
```

## Documentation

| Guide | What it covers |
|-------|----------------|
| [Initialization & Configuration](../docs/guide-initialization.md) | Constructor, options, density, pagination, API methods |
| [Document Model](../docs/guide-document-model.md) | JSON format, block tree, serialization, built-in types |
| [Custom Blocks](../docs/guide-custom-blocks.md) | defineBlock, NodeView, toolbar items, registration |
| [Theming & Styling](../docs/guide-theming.md) | CSS custom properties, density presets, layout modes |
| [Column Layout Architecture](../docs/architecture-columnLayout.md) | Column resize, drag, separator, nesting |
| [Toolbar Architecture](../docs/architecture-toolbar.md) | Toolbar state plugin, FormatBar, ContextMenu |

## AI Agent Support

This package ships with agent skills for AI coding assistants. The `agents` field in `package.json` points to procedural guides in `skills/`:

- **kanava-core** — Initialize and configure the editor
- **kanava-blocks** — Create custom blocks with `defineBlock()`
- **kanava-security** — Security patterns for user-generated content

## Architecture

See [Architecture Plan](../../docs/plans/Architecture%20Plan.md) for full schema and design details.
