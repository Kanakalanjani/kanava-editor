# @kanava/editor-react

React UI bindings for the Kanava editor. Pre-built components that work out-of-the-box, plus hooks for building custom UI.

## Components

| Component | Type | Purpose |
|-----------|------|---------|
| `KanavaEditorComponent` | Wrapper | Mounts the editor and provides context |
| `FixedToolbar` | Toolbar | Word-style ribbon — block type, font, alignment, paragraph formatting |
| `FormatBar` | Toolbar | Floating bar — B/I/U/S/code/link on text selection |
| `BlockPicker` | Sidebar | Slash-command block type picker |
| `ContextMenu` | Menu | Right-click with grouped actions and submenus |
| `ParagraphFormatPopover` | Popover | 5-tab paragraph formatting (spacing, indent, borders, typography, page) |
| `ImageEditorModal` | Modal | Image crop & rotate editor |

## Primitives

Reusable atoms for building custom toolbar UI:

| Primitive | Purpose |
|-----------|---------|
| `ToolbarButton` | Standard toolbar button |
| `ToolbarGroup` | Visual grouping of buttons |
| `BlockToolbar` | Auto-renders block-specific toolbar items |
| `NumberStepper` | Compact ± input with min/max/step |
| `SelectDropdown` | Dropdown with active-state highlighting |
| `SegmentedControl` | Mutually exclusive button group |

## Hooks

| Hook | Returns |
|------|---------|
| `useKanavaEditor(options)` | `KanavaEditor` instance |
| `useToolbarState(editor)` | Reactive `ToolbarState` (active marks, block type, etc.) |

## Build

```bash
pnpm --filter @kanava/editor-react build    # → dist/ (ESM + DTS)
```

## Documentation

| Guide | What it covers |
|-------|----------------|
| [React Integration](../docs/guide-react-integration.md) | Quick start, hooks, component props |
| [Theming & Styling](../docs/guide-theming.md) | CSS custom properties, density presets |
| [Toolbar Architecture](../docs/architecture-toolbar.md) | Toolbar state plugin, FormatBar, ContextMenu |

## AI Agent Support

This package ships with agent skills for AI coding assistants. The `agents` field in `package.json` points to procedural guides in `skills/`:

- **kanava-react** — Integrate the editor in a React app
- **kanava-react-custom** — Build custom toolbar and UI components
