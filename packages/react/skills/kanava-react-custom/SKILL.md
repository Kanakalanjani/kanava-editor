---
name: kanava-react-custom
description: Build custom React toolbar and UI components for @kanava/editor-react. Use when creating custom toolbars, adding toolbar buttons, building custom FormatBar layouts, or creating non-standard UI on top of the Kanava editor.
metadata:
  author: kanava
  version: "1.0"
  package: "@kanava/editor-react"
---

# Custom React UI for @kanava/editor-react

## When to use

- Building a custom toolbar instead of using the built-in FormatBar
- Adding custom toolbar buttons or menu items
- Creating a custom block picker or context menu
- Integrating Kanava UI into an existing design system

## Key files

| File | Purpose |
|------|-------|
| `src/ToolbarPrimitives.tsx` | Reusable atoms: `ToolbarButton`, `ToolbarGroup`, `ToolbarSeparator` |
| `src/hooks.ts` | `useToolbarState`, `useSelectionInfo` — state subscriptions |
| `src/FormatBar.tsx` | Reference implementation of a floating toolbar |
| `src/FixedToolbar.tsx` | Reference implementation of a fixed toolbar |

## Steps: Build a custom toolbar

### 1. Subscribe to toolbar state

```tsx
import { useToolbarState, useKanavaEditor } from "@kanava/editor-react";
import { toggleBold, toggleItalic } from "@kanava/editor";

function MyToolbar() {
  const editorRef = useKanavaEditor();
  const toolbar = useToolbarState(editorRef.current);
  if (!toolbar) return null;

  const isBold = toolbar.activeMarks.includes("bold");
  const isItalic = toolbar.activeMarks.includes("italic");

  return (
    <div className="my-toolbar">
      <button
        className={isBold ? "active" : ""}
        onClick={() => editorRef.current?.exec(toggleBold)}
      >
        B
      </button>
      <button
        className={isItalic ? "active" : ""}
        onClick={() => editorRef.current?.exec(toggleItalic)}
      >
        I
      </button>
    </div>
  );
}
```

### 2. Render block-specific items

Block definitions contribute toolbar items via `BlockDefinition.toolbar`. Access them from toolbar state:

```tsx
function BlockToolbar() {
  const editorRef = useKanavaEditor();
  const toolbar = useToolbarState(editorRef.current);
  if (!toolbar) return null;

  return (
    <>
      {toolbar.blockToolbarItems.map((item) => (
        <button
          key={item.key}
          onClick={() => item.command && editorRef.current?.exec(item.command)}
        >
          {item.icon} {item.label}
        </button>
      ))}
    </>
  );
}
```

### 3. Use ToolbarPrimitives

```tsx
import { ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@kanava/editor-react";

function MyToolbar({ editor }) {
  return (
    <ToolbarGroup>
      <ToolbarButton icon="B" label="Bold" onClick={() => editor.exec(toggleBold)} />
      <ToolbarButton icon="I" label="Italic" onClick={() => editor.exec(toggleItalic)} />
      <ToolbarSeparator />
      <ToolbarButton icon="🔗" label="Link" onClick={() => editor.exec(insertLink)} />
    </ToolbarGroup>
  );
}
```

### 4. Derive mark/block info from definitions

Never hardcode block or mark lists. Use the editor's registries:

```tsx
function MarkToggles({ editor }) {
  const toolbar = useToolbarState(editor);
  if (!toolbar) return null;

  return (
    <>
      {editor.markDefs.map((mark) => (
        <button
          key={mark.name}
          className={toolbar.activeMarks.includes(mark.name) ? "active" : ""}
          onClick={() => {
            const cmd = mark.commands?.(editor.schema)?.[`toggle${mark.name}`];
            if (cmd) editor.exec(cmd());
          }}
        >
          {mark.label || mark.name}
        </button>
      ))}
    </>
  );
}
```

## Architecture rules

1. **Core is headless** — all toolbar state derivation lives in `@kanava/editor`'s `toolbarStatePlugin`
2. **React only reads** — components subscribe via `useToolbarState()` and render
3. **Never hardcode block/mark lists** — derive from `editor.blockDefs` / `editor.markDefs`
4. **Block-specific items come from definitions** — `BlockDefinition.toolbar` and `.contextMenu`
5. **Use `editor.exec(command)` for actions** — don't dispatch ProseMirror transactions directly

## ToolbarState shape

The `ToolbarState` object (from `toolbarStatePlugin`) provides:

| Field | Type | Purpose |
|-------|------|---------|
| `activeMarks` | `string[]` | Currently active mark names |
| `selectedBlockType` | `string \| null` | Current block type name |
| `blockToolbarItems` | `ToolbarItem[]` | Items from current block's `toolbar` |
| `contextMenuItems` | `ContextMenuItem[]` | Items from current block's `contextMenu` |
| `availableActions` | varies | Actions available in current state |

See `@kanava/editor`'s `src/plugins/toolbarState.ts` for the full type.

## Common mistakes

1. **Hardcoding mark names** in UI — use `editor.markDefs` instead
2. **Putting toolbar logic in React** — state derivation belongs in core's `toolbarStatePlugin`
3. **Using `dangerouslySetInnerHTML`** with user content — always use safe rendering
4. **Directly accessing ProseMirror view** — use `editor.exec()` and hooks instead
