# @kanava/editor — AI Context

Headless block editor engine built directly on ProseMirror. No TipTap, no BlockNote — zero UI dependencies. This package provides the document model, schema, commands, plugins, and pagination. Pair with `@kanava/editor-react` for pre-built React UI.

## Core Concepts

- **blockNode** wraps every user-facing block. Carries shared attrs: `id`, `textAlign`, `backgroundColor`, `spacingTop`, `spacingBottom`, `lineHeight`, `padding`, `border`, `textIndent`, `letterSpacing`. Never add these attrs to individual block types.
- **blockBody** is the ProseMirror schema group for all user-facing blocks. Every block definition MUST set `spec.group: "blockBody"`.
- **defineBlock()** and **defineMark()** are the extension APIs. All built-in blocks and marks use these same APIs (dogfooding).
- **Pagination** uses ProseMirror decorations, not schema nodes. Pages are visual overlays.
- **Definitions are frozen** with `Object.freeze()` — never mutate after creation.

## Install and Import

```bash
npm install @kanava/editor
```

```ts
import { KanavaEditor, builtInBlocks, builtInMarks, defineBlock, defineMark } from "@kanava/editor";
import "@kanava/editor/styles/editor.css";
```

CSS MUST be imported from `@kanava/editor/styles/editor.css`. There is no other valid CSS path.

## Key Exports

| Export | Type | Purpose |
|--------|------|---------|
| `KanavaEditor` | class | Main editor — `new KanavaEditor({ element, blocks, marks, mode })` |
| `defineBlock()` | function | Define a custom block type |
| `defineMark()` | function | Define a custom inline mark |
| `builtInBlocks` | array | All 12 built-in block definitions |
| `builtInMarks` | array | All 12 built-in mark definitions |
| `toggleBold`, `toggleItalic`, ... | functions | ProseMirror commands for text formatting |
| `editor.exec(cmd)` | method | Execute a ProseMirror command |
| `editor.getDocument()` | method | Get document as `KanavaDocument` JSON |
| `editor.setDocument(doc)` | method | Load a `KanavaDocument` JSON |
| `editor.chain()` | method | Chain multiple commands in one transaction |

## Quick Start

```ts
const editor = new KanavaEditor({
  element: document.getElementById("editor"),
  placeholder: "Start writing...",
  onChange: (doc) => console.log(doc),
});

// Paginated mode
const editor = new KanavaEditor({
  element,
  mode: "paginated",
  pagination: { pageSize: "A4", margins: { top: 72, right: 96, bottom: 72, left: 96 } },
});
```

## Custom Block Template

```ts
const MyBlock = defineBlock({
  name: "myBlock",               // unique name
  label: "My Block",             // display name for UI
  icon: "📦",                    // emoji for menus
  group: "text",                 // UI group: text, list, media, layout, advanced
  spec: {
    group: "blockBody",          // REQUIRED — always "blockBody"
    content: "inline*",          // "inline*" for text blocks, "" for atoms
    isolating: true,
    parseDOM: [{ tag: "div.kanava-my-block" }],
    toDOM() { return ["div", { class: "kanava-my-block" }, 0]; },
  },
  toolbar: [{ key: "action", label: "Do Thing", command: myCommand }],
});

// Register:
const editor = new KanavaEditor({
  element,
  blocks: [...builtInBlocks, MyBlock],
});
```

## Built-in Block Types

paragraph, heading (H1-H6), quote, codeBlock, image, divider, bulletListItem, numberedListItem, checklistItem, toggle, callout, columnLayout

## Built-in Mark Types

bold, italic, underline, strike, code, link, textColor, highlight, fontSize, fontFamily, superscript, subscript

## Common Mistakes

1. CSS path: use `@kanava/editor/styles/editor.css` — NOT `dist/styles.css`
2. Method name: `editor.getDocument()` — NOT `editor.getContent()`
3. Block spec: always set `spec.group: "blockBody"` — blocks without this break the schema
4. Style attrs: textAlign/backgroundColor/spacing go on blockNode — NOT on individual block attrs
5. Cleanup: always call `editor.destroy()` when unmounting

## More Detail

For step-by-step procedural guides, read the SKILL.md files in `skills/`:
- `skills/kanava-core/SKILL.md` — setup and configuration
- `skills/kanava-blocks/SKILL.md` — custom block creation
- `skills/kanava-security/SKILL.md` — security patterns
