# @kanava/editor-react — AI Context

React UI bindings for the Kanava editor. Provides pre-built components (toolbar, menu, block picker) and hooks for building custom UI. Requires `@kanava/editor` as a peer dependency.

## Install and Import

```bash
npm install @kanava/editor @kanava/editor-react
```

```tsx
import { KanavaEditorComponent, FormatBar, BlockPicker } from "@kanava/editor-react";
import "@kanava/editor/styles/editor.css";
```

CSS is imported from `@kanava/editor` (not this package). Path: `@kanava/editor/styles/editor.css`.

## Quick Start

```tsx
function App() {
  return (
    <KanavaEditorComponent
      onChange={(doc) => console.log(doc)}
      placeholder="Start typing..."
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

## Components

| Component | Purpose |
|-----------|---------|
| `KanavaEditorComponent` | React wrapper — mounts editor, provides render prop with editor instance |
| `FormatBar` | Floating toolbar — appears on text selection (B/I/U/S/code/link) |
| `FixedToolbar` | Word-style ribbon — block type, font, alignment, paragraph formatting |
| `BlockPicker` | Slash-command sidebar — type "/" to pick block type |
| `ContextMenu` | Right-click menu — grouped actions with submenus |
| `ParagraphFormatPopover` | 5-tab paragraph formatting (spacing, indent, borders, typography, page) |
| `ImageEditorModal` | Image crop and rotate editor |

## Hooks

| Hook | Returns | Purpose |
|------|---------|---------|
| `useKanavaEditor()` | `MutableRefObject<KanavaEditor>` | Get editor instance ref |
| `useToolbarState(editor)` | `ToolbarState \| null` | Reactive toolbar state (active marks, block type, items) |
| `useSelectionInfo(editor)` | `KanavaSelectionInfo \| null` | Selection details |
| `useIsMarkActive(editor, name)` | `boolean` | Whether a specific mark is active |

## Toolbar Primitives (for custom toolbars)

| Primitive | Purpose |
|-----------|---------|
| `ToolbarButton` | Standard toolbar button with icon, label, active state |
| `ToolbarGroup` | Visual grouping of buttons |
| `BlockToolbar` | Auto-renders block-specific toolbar items from definitions |
| `NumberStepper` | Compact ± input with min/max/step |
| `SelectDropdown` | Dropdown with active-state highlighting |
| `SegmentedControl` | Mutually exclusive button group |

## Architecture

Core (`@kanava/editor`) is headless — it derives toolbar state via `toolbarStatePlugin`. React components subscribe to that state via `useToolbarState()` and render it. Components are data-driven from `editor.blockDefs` and `editor.markDefs`.

Never put toolbar logic in React components. Never hardcode block or mark names — derive from `editor.blockDefs` / `editor.markDefs`.

## Common Mistakes

1. CSS import: use `@kanava/editor/styles/editor.css` — CSS lives in the core package, not this one
2. Hardcoding mark names in UI: use `editor.markDefs` to derive available marks
3. Putting toolbar logic in React: state derivation belongs in core's `toolbarStatePlugin`
4. Using `dangerouslySetInnerHTML` with user content: always use safe DOM rendering
5. Directly accessing ProseMirror view: use `editor.exec()` and hooks instead

## More Detail

For step-by-step procedural guides, read the SKILL.md files in `skills/`:
- `skills/kanava-react/SKILL.md` — React integration setup
- `skills/kanava-react-custom/SKILL.md` — custom toolbar and UI components
