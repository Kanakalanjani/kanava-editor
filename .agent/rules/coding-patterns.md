# Coding Patterns & Conventions

## TypeScript

- **Strict mode** enabled. Target: ES2020. Module resolution: `bundler`.
- **Use `import type`** for type-only imports: `import type { Schema } from "prosemirror-model"`.
- **All imports use `.js` extensions** (ESM convention): `import { defineBlock } from "../extensions/defineBlock.js"`.
- **Never use `any`** without justification. Prefer `unknown` or proper typing.
- **Use `const` assertions** and `Object.freeze()` for immutable definitions.

## Block Definitions

New blocks follow this exact pattern:

```ts
import { defineBlock } from "../extensions/defineBlock.js";

export const MyBlock = defineBlock({
  name: "myBlock",          // camelCase, unique
  label: "My Block",        // Human-readable
  icon: "📦",               // Icon for UI
  group: "text",            // UI grouping: "text" | "list" | "media" | "layout" | "advanced"
  spec: {
    group: "blockBody",     // ALWAYS "blockBody" for user-facing blocks
    content: "inline*",     // or empty string for atom blocks
    isolating: true,
    attrs: { /* ... */ },
    parseDOM: [{ tag: "div.kanava-my-block" }],
    toDOM(node) { return ["div", { class: "kanava-my-block" }, 0]; },
  },
  // Optional:
  inputRules: (schema) => [...],
  keymap: (schema) => ({ "Mod-Shift-M": someCommand }),
  commands: (schema) => ({ doThing: (arg) => (state, dispatch) => { ... } }),
  toolbar: [{ key: "my-action", label: "Do Thing", command: someCommand }],
  contextMenu: [{ key: "my-ctx-action", label: "Action", command: someCommand }],
  continuable: false,
  nodeView: (node, view, getPos, editor) => new MyBlockNodeView(node, view, getPos, editor),
});
```

**Checklist when adding a new block:**
1. Create `packages/core/src/blocks/myBlock.ts` using the pattern above
2. Add to `packages/core/src/blocks/index.ts` — both named export and `builtInBlocks` array
3. If it needs a NodeView, create `packages/core/src/nodeViews/MyBlockNodeView.ts` extending `KanavaNodeView`
4. Register the NodeView in `editor.ts` constructor
5. Add CSS styles in `packages/core/src/styles/editor.css` using `kanava-my-block` class name
6. Build: `pnpm -r build`

## Mark Definitions

Same pattern as blocks but with `defineMark()`:

```ts
import { defineMark } from "../extensions/defineMark.js";
import { toggleMark } from "prosemirror-commands";
import type { Schema } from "prosemirror-model";

export const MyMark = defineMark({
  name: "myMark",
  label: "My Mark",
  icon: "M",
  spec: {
    parseDOM: [{ tag: "span.my-mark" }],
    toDOM() { return ["span", { class: "my-mark" }, 0]; },
  },
  keymap: (schema: Schema) => ({
    "Mod-m": toggleMark(schema.marks.myMark),
  }),
  commands: (schema: Schema) => ({
    toggleMyMark: () => toggleMark(schema.marks.myMark),
  }),
});
```

**Checklist:** Same as blocks but in `packages/core/src/marks/` and `builtInMarks` array.

## NodeView Pattern

Always extend `KanavaNodeView`:

```ts
import { KanavaNodeView } from "./KanavaNodeView.js";
import type { Node as PMNode } from "prosemirror-model";

export class MyBlockNodeView extends KanavaNodeView {
  render(node: PMNode) {
    const dom = this.el("div", "kanava-my-block");
    const contentDOM = this.el("div", "kanava-my-block-content");
    dom.appendChild(contentDOM);
    return { dom, contentDOM };
  }

  protected onUpdate(node: PMNode): void {
    // Sync DOM with node attrs
    this.dom.className = `kanava-my-block kanava-my-block-${node.attrs.variant}`;
  }
}
```

- Use `this.el(tag, className?)` helper for DOM creation
- Use `this.setAttrs({ key: value })` to commit attribute changes
- Override `stopEvent()` only when needed (e.g., for interactive elements inside the node)
- Override `ignoreMutation()` to ignore mutations on non-content areas

## Commands

Commands follow ProseMirror's `Command` signature: `(state, dispatch?, view?) => boolean`.

```ts
export function myCommand(arg: string): Command {
  return (state, dispatch) => {
    // 1. Check if applicable → return false if not
    if (!canApply(state)) return false;
    // 2. Build transaction
    if (dispatch) {
      const tr = state.tr;
      // ... modify tr ...
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

// Or as a constant for parameterless commands:
export const mySimpleCommand: Command = (state, dispatch) => { ... };
```

- Schema-dependent logic uses `state.schema.nodes.xxx` or `state.schema.marks.xxx` — never string comparisons.
- Group membership checks use `node.type.spec.group?.includes("blockBody")`.
- The `dispatch` guard (`if (dispatch)`) allows dry-run checks.

## CSS Conventions

- Class prefix: `kanava-` for all classes
- Use CSS custom properties: `var(--kanava-*)` for all theming values
- Block styles: `kanava-{blockname}` (e.g., `kanava-paragraph`, `kanava-heading`)
- UI chrome: `kanava-{component}-{element}` (e.g., `kanava-ctx-item`, `kanava-format-bar`)
- No `!important` unless overriding ProseMirror defaults

## File Naming

- Blocks: `camelCase.ts` matching the `name` field (e.g., `bulletListItem.ts`)
- NodeViews: `PascalCaseView.ts` (e.g., `ImageNodeView.ts`)
- Commands: grouped by domain (`block.ts`, `blockAttrs.ts`, `columns.ts`, `columnBackspace.ts`, `columnNav.ts`, `gapCursorInsert.ts`, `image.ts`, `inlineMarks.ts`, `nesting.ts`, `splitMerge.ts`, `text.ts`, `traversal.ts`)
- Plugins: `camelCase.ts` (e.g., `blockId.ts`, `toolbarState.ts`)
- React components: `PascalCase.tsx` (e.g., `FormatBar.tsx`, `ContextMenu.tsx`)

## Exports

- Named exports only — no default exports
- Barrel files (`index.ts`) re-export everything public
- Use `export type` for type-only exports
