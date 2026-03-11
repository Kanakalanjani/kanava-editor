---
name: add-command
description: Add a new ProseMirror command to @kanava/editor. Use when implementing editor actions like formatting, block manipulation, or custom behavior.
---

# Add a New Command

## When to use

- Adding a new formatting command (e.g., `setMarginLeft`)
- Adding a new block manipulation command (e.g., `mergeBlocks`)
- Exposing a new editor action for consumers

## Step-by-step

### 1. Choose the right command file

| Domain | File | Examples |
|--------|------|---------|
| Text formatting | `commands/text.ts` | `setTextAlign`, `setLineHeight`, `setFontSize` |
| Block operations | `commands/block.ts` | `insertBlock`, `deleteBlock`, `handleBackspace` |
| Column operations | `commands/columns.ts` | `createColumnLayout`, `addColumnLeft` |
| Nesting | `commands/nesting.ts` | `indentBlock`, `outdentBlock` |
| Image-specific | `commands/image.ts` | `setImageRotation`, `insertImageFromUrl` |

### 2. Write the command

Follow the standard ProseMirror command signature:

```ts
export function myCommand(arg: string): Command {
  return (state, dispatch) => {
    // 1. Validate — return false if command can't apply
    // 2. Compute — find positions, collect nodes
    // 3. Dispatch — build transaction and dispatch if dispatch exists
    const { from, to } = state.selection;
    const tr = state.tr;
    // ... build transaction ...
    if (dispatch) dispatch(tr);
    return true;
  };
}
```

### 3. For block-level commands

Use `collectBlockNodes()` helper to iterate selected blocks:

```ts
import { collectBlockNodes } from "./text.js";

export function setMyAttr(value: number): Command {
  return (state, dispatch) => {
    const blocks = collectBlockNodes(state);
    if (blocks.length === 0) return false;
    if (dispatch) {
      const tr = state.tr;
      for (const { pos, node } of blocks) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, myAttr: value });
      }
      dispatch(tr);
    }
    return true;
  };
}
```

### 4. Export

Add to `packages/core/src/index.ts`.

### 5. Verify

```bash
pnpm -r build
```

## Common mistakes

- Forgetting the `if (dispatch)` guard — commands are called without dispatch to test applicability
- Not returning `false` when the command can't apply
- Modifying the state directly instead of building a transaction
