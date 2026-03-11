---
name: add-mark
description: Add a new inline mark to the Kanava editor. Use when implementing text formatting (e.g., subscript, superscript, font family). Covers defineMark(), schema mark spec, keymap, and barrel exports.
metadata:
  author: kanava
  version: "1.0"
---

# Add a New Mark

## When to use

Use this skill when:
- The user asks to add a new text formatting option
- A new inline decoration is needed (e.g., subscript, font size, custom highlight)
- An existing mark needs modification

## Step-by-step

### 1. Create the mark definition

Create `packages/core/src/marks/{markName}.ts`:

```ts
import { defineMark } from "../extensions/defineMark.js";
import { toggleMark } from "prosemirror-commands";
import type { Schema } from "prosemirror-model";

export const MyMark = defineMark({
  name: "myMark",
  label: "My Mark",
  icon: "M",
  spec: {
    parseDOM: [
      { tag: "span.kanava-my-mark" },
      // Add alternative parseDOM entries for HTML compatibility
    ],
    toDOM() {
      return ["span", { class: "kanava-my-mark" }, 0];
    },
    // For marks with attributes:
    // attrs: { color: { default: null } },
  },
  keymap: (schema: Schema) => ({
    "Mod-Shift-M": toggleMark(schema.marks.myMark),
  }),
  commands: (schema: Schema) => ({
    toggleMyMark: () => toggleMark(schema.marks.myMark),
  }),
});
```

### 2. Register in barrel exports

Edit `packages/core/src/marks/index.ts`:
- Add named export: `export { MyMark } from "./myMark.js";`
- Add to `builtInMarks` array

### 3. Add schema mark definition

Create `packages/core/src/schema/marks/{markName}.ts` if the mark needs special schema handling beyond what `defineMark` provides.

### 4. Add CSS

Edit `packages/core/src/styles/editor.css`:
```css
.kanava-my-mark {
  /* Mark styles */
}
```

### 5. Build and verify

```sh
pnpm -r build
```

## Verification checklist

- [ ] Mark appears in FormatBar when text is selected
- [ ] Keyboard shortcut toggles the mark
- [ ] Mark renders correctly in the editor
- [ ] Mark is preserved on copy/paste
- [ ] Mark can be combined with other marks
- [ ] Undo/redo works
- [ ] Build passes: `pnpm -r build`

## Common mistakes

- Forgetting to add to `builtInMarks` array — mark won't appear in UI
- Using `import` instead of `import type` for type-only imports
- Missing `.js` extension on module imports
- Not adding `parseDOM` entries for standard HTML tags (hurts paste compatibility)
