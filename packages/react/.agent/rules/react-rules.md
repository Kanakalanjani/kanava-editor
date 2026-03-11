# React Package Rules

## Ownership

This package (`@kanava/editor-react`) owns all React UI components. It depends on `@kanava/editor` as a peer dependency.

## File Responsibilities

| File | Owns | Does NOT own |
|------|------|-------------|
| `KanavaEditor.tsx` | React wrapper, editor mounting | Editor logic |
| `FormatBar.tsx` | Floating text toolbar (B/I/U/S/code/link) | Block-specific actions |
| `FixedToolbar.tsx` | Word-style ribbon | ProseMirror commands |
| `BlockPicker.tsx` | Slash-command sidebar | Block definitions |
| `ContextMenu.tsx` | Right-click grouped menus | Schema logic |
| `ParagraphFormatPopover.tsx` | 5-tab formatting popover | Core command implementation |
| `ImageEditorModal.tsx` | Crop & rotate modal | Image NodeView |
| `ToolbarPrimitives.tsx` | Reusable atoms (Button, Group, Stepper) | Business logic |
| `hooks.ts` | `useKanavaEditor`, `useToolbarState` | Plugin state computation |
| `index.ts` | Public exports | Internal types |

## Rules

1. **UI only** — no ProseMirror schema or document manipulation
2. **Data-driven from `editor.blockDefs` / `editor.markDefs`** — never hardcode block lists
3. **Use `editor.exec(command)` to dispatch** — never access ProseMirror view directly
4. **Import commands from `@kanava/editor`** — don't import from `prosemirror-*` directly
5. **No default exports** — named exports only
6. **CSS classes use `.kanava-` prefix** — match the core convention
7. **All props interfaces exported** — every component has `FooProps` exported from barrel
8. **`import type` for type-only imports**
