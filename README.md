<p align="center">
  <h1 align="center">Kanava Editor</h1>
  <p align="center">
    A ProseMirror-based block editor SDK — Notion's structure meets Google Docs formatting.
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@kanava/editor"><img src="https://img.shields.io/npm/v/@kanava/editor?label=%40kanava%2Feditor&color=blue" alt="npm @kanava/editor" /></a>
  <a href="https://www.npmjs.com/package/@kanava/editor-react"><img src="https://img.shields.io/npm/v/@kanava/editor-react?label=%40kanava%2Feditor-react&color=blue" alt="npm @kanava/editor-react" /></a>
  <a href="https://github.com/Kanakalanjani/kanava-editor/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" /></a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#packages">Packages</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#contributing">Contributing</a>
</p>

> **Beta** — Kanava is under active development. APIs may change between minor versions until `1.0`.

---

## Features

- **Block-based** — Every content element is a draggable, nestable block
- **MS Word-class formatting** — Line height, padding, borders, indentation, letter spacing
- **Pagination** — Decoration-based page breaks with A4/Letter/Legal/Custom page sizes
- **Columns** — First-class multi-column layouts with resize, nesting, cross-column editing
- **Extensible** — `defineBlock()` / `defineMark()` APIs for custom content types
- **Headless + Batteries** — Use pre-built React UI or build your own with hooks
- **Themeable** — `--kanava-*` CSS custom properties for full visual control

### Block Types

| Text | Lists | Media | Layout | Interactive |
|------|-------|-------|--------|-------------|
| Paragraph | Bullet List | Image | Columns (2–4+) | Toggle |
| Heading (H1–H6) | Numbered List | | Divider | Callout |
| Quote | Checklist | | | |
| Code Block | | | | |

### Inline Marks

Bold, Italic, Underline, Strikethrough, Code, Link, Text Color, Highlight, Font Size, Font Family, Superscript, Subscript

---

## Quick Start

```bash
pnpm add @kanava/editor @kanava/editor-react
```

```tsx
import { KanavaEditorComponent, FormatBar, BlockPicker } from "@kanava/editor-react";
import "@kanava/editor/styles/editor.css";

function App() {
  return (
    <KanavaEditorComponent
      onChange={(doc) => console.log(doc)}
      mode="pageless"
    >
      {(editor) => (
        <>
          <FormatBar editor={editor} />
          <BlockPicker editor={editor} />
        </>
      )}
    </KanavaEditorComponent>
  );
}
```

### Paginated Mode

```tsx
<KanavaEditorComponent
  mode="paginated"
  pagination={{ pageSize: "A4", margins: { top: 72, right: 96, bottom: 72, left: 96 } }}
/>
```

### Custom Blocks

```ts
import { defineBlock } from "@kanava/editor";

const MyBlock = defineBlock({
  name: "myBlock",
  label: "My Block",
  icon: "📦",
  spec: { group: "blockBody", content: "inline*", isolating: true },
  toolbar: [{ key: "action", label: "Do Something", command: myCommand }],
});
```

---

## Packages

| Package | Description | Path |
|---------|-------------|------|
| **`@kanava/editor`** | Headless editor engine — schema, commands, plugins, pagination | [`packages/core`](packages/core) |
| **`@kanava/editor-react`** | React UI bindings — FormatBar, FixedToolbar, BlockPicker, ContextMenu | [`packages/react`](packages/react) |
| **Playground** | Demo app showcasing all features | [`apps/playground`](apps/playground) |

---

## Architecture

```
@kanava/editor                            @kanava/editor-react
┌───────────────────────────┐           ┌──────────────────────────────┐
│ ProseMirror Engine        │           │ React Components             │
│  • Schema (defineBlock)   │           │  • FormatBar (floating)      │
│  • Commands               │  ──────►  │  • FixedToolbar (Word-style) │
│  • Plugins (pagination)   │           │  • BlockPicker (sidebar)     │
│  • NodeViews              │           │  • ContextMenu (right-click) │
│  • ToolbarState (headless)│           │  • useToolbarState() hook    │
└───────────────────────────┘           └──────────────────────────────┘
```

**Key principles:**
- Built directly on ProseMirror (no TipTap wrapper)
- `blockNode` wrapper carries all block-level styles universally
- Pagination uses decorations, not schema nodes
- Every built-in dogfoods `defineBlock()` / `defineMark()`

---

## Documentation

| Guide | What it covers |
|-------|----------------|
| [Initialization & Configuration](packages/docs/guide-initialization.md) | Constructor, options, density, pagination, API methods |
| [Document Model](packages/docs/guide-document-model.md) | JSON format, block tree, serialization, built-in types |
| [Custom Blocks](packages/docs/guide-custom-blocks.md) | defineBlock, NodeView, toolbar items, registration |
| [Theming & Styling](packages/docs/guide-theming.md) | CSS custom properties, density presets, layout modes |
| [React Integration](packages/docs/guide-react-integration.md) | Quick start, hooks, component props |
| [Column Layout](packages/docs/architecture-columnLayout.md) | Column resize, drag, separator, nesting |
| [Toolbar Architecture](packages/docs/architecture-toolbar.md) | Toolbar state plugin, FormatBar, ContextMenu |

---

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Dev server (playground)
pnpm --filter playground dev
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Editor engine | ProseMirror |
| Build | tsup (library), Vite (playground) |
| Monorepo | pnpm workspaces |
| Language | TypeScript strict, ES2020 |
| UI bindings | React 18+ |
| CSS | `--kanava-*` custom properties |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and pull request guidelines.

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

---

## License

[MIT](LICENSE) © 2026 Kanakalanjani
