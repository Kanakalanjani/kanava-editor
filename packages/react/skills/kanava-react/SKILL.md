---
name: kanava-react
description: Integrate @kanava/editor-react into a React application. Use when setting up the KanavaEditorComponent, using hooks (useKanavaEditor, useToolbarState, useSelectionInfo), or rendering the built-in FormatBar, ContextMenu, and BlockPicker components.
metadata:
  author: kanava
  version: "1.0"
  package: "@kanava/editor-react"
---

# Integrate @kanava/editor-react

## When to use

- Setting up the Kanava editor in a React application
- Using editor hooks for state management
- Rendering the built-in toolbar, context menu, or block picker

## Key files

| File | Purpose |
|------|-------|
| `src/KanavaEditor.tsx` | `<KanavaEditorComponent>` — React wrapper |
| `src/hooks.ts` | `useKanavaEditor`, `useToolbarState`, `useSelectionInfo`, `useIsMarkActive` |
| `src/FormatBar.tsx` | Floating toolbar (text + block modes) |
| `src/FixedToolbar.tsx` | Word-style fixed toolbar |
| `src/ContextMenu.tsx` | Right-click context menu |
| `src/BlockPicker.tsx` | Slash-command block picker |
| `src/ToolbarPrimitives.tsx` | Reusable toolbar atoms |

## Steps: Basic setup

### 1. Install

```sh
npm install @kanava/editor @kanava/editor-react
```

### 2. Render the editor

```tsx
import { KanavaEditorComponent } from "@kanava/editor-react";
import "@kanava/editor/styles/editor.css";

function App() {
  return (
    <KanavaEditorComponent
      onChange={(doc) => console.log(doc)}
      placeholder="Start typing..."
    />
  );
}
```

### 3. Access the editor instance

```tsx
import { useKanavaEditor, KanavaEditorComponent } from "@kanava/editor-react";

function App() {
  const editorRef = useKanavaEditor();

  return (
    <>
      <button onClick={() => editorRef.current?.exec(toggleBold)}>Bold</button>
      <KanavaEditorComponent editorRef={editorRef} />
    </>
  );
}
```

### 4. Subscribe to toolbar state

```tsx
import { useToolbarState } from "@kanava/editor-react";

function MyToolbar({ editor }) {
  const toolbar = useToolbarState(editor);
  if (!toolbar) return null;

  return (
    <div>
      {toolbar.activeMarks.includes("bold") && <span>Bold active</span>}
    </div>
  );
}
```

### 5. Subscribe to selection

```tsx
import { useSelectionInfo, useIsMarkActive } from "@kanava/editor-react";

function SelectionInfo({ editor }) {
  const selection = useSelectionInfo(editor);
  const isBold = useIsMarkActive(editor, "bold");
  // selection.blockType, selection.blockAttrs, selection.empty, etc.
}
```

## Component props

`<KanavaEditorComponent>` accepts all `KanavaEditorOptions` fields as props plus:

| Prop | Type | Purpose |
|------|------|---------|
| `className` | `string` | CSS class for container div |
| `editorRef` | `React.Ref<KanavaEditor>` | Access editor instance |

See `src/KanavaEditor.tsx` for the full `KanavaEditorProps` interface.

## Hooks reference

| Hook | Returns | Purpose |
|------|---------|---------|
| `useKanavaEditor()` | `MutableRefObject<KanavaEditor \| null>` | Editor instance ref |
| `useToolbarState(editor)` | `ToolbarState \| null` | Toolbar/menu state (via `useSyncExternalStore`) |
| `useSelectionInfo(editor)` | `KanavaSelectionInfo \| null` | Selection details |
| `useIsMarkActive(editor, name)` | `boolean` | Whether a mark is active |

## Architecture

```
@kanava/editor (headless)              @kanava/editor-react (UI)
┌─────────────────────────┐          ┌──────────────────────────┐
│ toolbarStatePlugin       │  ─────►  │ useToolbarState() hook    │
│  • activeMarks           │          │ <FormatBar>              │
│  • selectedBlockType     │          │ <ContextMenu>            │
│  • blockToolbarItems[]   │          │ <BlockPicker>            │
└─────────────────────────┘          └──────────────────────────┘
```

Core is headless — it derives what should appear in toolbars. React components only read and render that state. All components are data-driven from `editor.blockDefs` and `editor.markDefs`.
