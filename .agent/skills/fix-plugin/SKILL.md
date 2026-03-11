---
name: fix-plugin
description: Fix or add ProseMirror commands and plugins in Kanava editor. Use when debugging editor behavior, fixing keyboard handling, implementing new editor logic, or adding ProseMirror plugins.
metadata:
  author: kanava
  version: "1.0"
---

# Fix or Add Commands & Plugins

## When to use

Use this skill when:
- Fixing a bug in editor behavior (typing, selection, keyboard shortcuts)
- Adding a new ProseMirror command
- Creating or modifying a ProseMirror plugin
- Fixing keymap bindings

## Key files

| Area | Files |
|------|-------|
| Commands | `packages/core/src/commands/{domain}.ts` — grouped by domain (block, blockAttrs, columns, columnBackspace, columnNav, gapCursorInsert, image, inlineMarks, nesting, splitMerge, text, traversal) |
| Plugins | `packages/core/src/plugins/{name}.ts` — one file per plugin |
| Keymap | `packages/core/src/plugins/keymap.ts` — all key bindings |
| Editor | `packages/core/src/editor.ts` — plugin wiring and initialization |

## Command pattern

Commands follow ProseMirror's `(state, dispatch?, view?) => boolean` signature:

```ts
import type { Command } from "prosemirror-state";

export function myCommand(arg: string): Command {
  return (state, dispatch) => {
    // 1. Check if applicable — return false if not
    if (!canApply(state)) return false;

    // 2. Build transaction (only if dispatch provided)
    if (dispatch) {
      const tr = state.tr;
      // ... modify tr ...
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}
```

### Rules for commands

- Use `state.schema.nodes.xxx` / `state.schema.marks.xxx` — never string comparisons
- Group membership: `node.type.spec.group?.includes("blockBody")`
- The `if (dispatch)` guard enables dry-run applicability checks
- Always call `.scrollIntoView()` on the transaction

## Plugin pattern

```ts
import { Plugin, PluginKey } from "prosemirror-state";

export function myPlugin(): Plugin {
  return new Plugin({
    key: new PluginKey("myPlugin"),

    // For state-tracking plugins:
    state: {
      init() { return initialState; },
      apply(tr, prev) { return newState; },
    },

    // For DOM event handling:
    props: {
      handleKeyDown(view, event) { /* ... */ },
      handleDOMEvents: {
        dragover(view, event) { /* ... */ },
      },
      decorations(state) { /* ... */ },
    },

    // For transaction filtering:
    appendTransaction(transactions, oldState, newState) {
      if (!transactions.some(tr => tr.docChanged)) return null;
      // Return a corrective transaction or null
    },
  });
}
```

### Wiring a new plugin

In `packages/core/src/editor.ts`, add the plugin to the plugin array. Order matters — the exact order is:

1. `kanavaInputRules` — markdown-like input rules
2. `kanavaKeymap` — all key bindings
3. `blockIdPlugin` — assigns unique IDs to blocks
4. `listRenumberPlugin` — sequential numbering for ordered lists
5. `placeholderPlugin` — empty-block placeholder text
6. `dragHandlePlugin` — block drag-drop with DOM-rect-based drop positioning
7. `selectionPlugin` — block selection highlighting
8. `ghostRailPlugin` — insert-between-blocks rail
9. `clipboardPlugin` — clipboard sanitization
10. `imageUploadPlugin` — image paste/drop handling
11. `toolbarStatePlugin` — derives toolbar/menu state
12. Pagination plugins (conditional, only if `mode: "paginated"`)
13. `history` — undo/redo (ProseMirror built-in)
14. `dropCursor` — drop position indicator
15. `gapCursor` — cursor for positions without content

> **Source of truth:** Plugin array at `packages/core/src/editor.ts` constructor.

## Diagnostic flow

When debugging a command or plugin issue, follow this sequence:

### 1. Reproduce and inspect state

```ts
// In browser console (editor is available on the playground window):
console.log(editor.pmState.doc.toJSON());      // document structure
console.log(editor.pmState.selection.toJSON()); // selection
console.log(editor.pmState.selection.$from.parent.type.name); // parent block
```

### 2. Check node hierarchy

Kanava's hierarchy is: `doc > blockGroup > blockNode > blockBody`. When debugging:
- Is the selection inside a `blockNode` or at the doc level?
- Is the block inside a `column` (nested in `columnLayout`)?
- Use `$from.depth` and `$from.node(depth)` to walk up the tree.

### 3. Test the command in isolation

```ts
// Dry-run (no dispatch) — returns true if applicable
const canRun = myCommand(editor.pmState);

// Full run
const didRun = myCommand(editor.pmState, editor.pmView.dispatch);
```

### 4. Check common hot spots

| Symptom | Check |
|---------|-------|
| Backspace does nothing | `splitMerge.ts` — `mergeBlockBackward` |
| Delete at end doesn't merge | `splitMerge.ts` — `mergeBlockForward` |
| Enter creates wrong block type | Block's `continuable` / `continuationAttrs` |
| Tab doesn't indent | `nesting.ts` — `indentBlock` / `outdentBlock` |
| Cross-column cursor stuck | `columnNav.ts` — `arrowOutOfColumn` |
| Paste loses formatting | `clipboard.ts` — `transformPastedHTML` |
| Toolbar doesn't update | `toolbarState.ts` — `deriveToolbarState` |

### 5. Verify with build

```sh
pnpm -r build
```

## Common mistakes

- Importing `kanavaSchema` singleton — use `state.schema` instead
- Comparing `node.type.name === "paragraph"` — use `state.schema.nodes.paragraph` references
- Missing `.js` extension on imports
- Forgetting to export new plugin/command from barrel `index.ts`
- Not running `pnpm -r build` after changes
- Using `node.type.name === "blockquote"` — the block is named `quote`
- Forgetting the `if (dispatch)` guard — commands must support dry-run

## Verification

After any command/plugin change, test:
- [ ] Basic typing in a paragraph
- [ ] Block splitting (Enter) and merging (Backspace)
- [ ] Block type conversion ("Turn into" menu)
- [ ] Column operations (create, backspace across, delete across)
- [ ] Undo/redo after each operation
- [ ] Keyboard shortcuts still work
- [ ] Build passes: `pnpm -r build`
