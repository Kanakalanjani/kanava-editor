---
anchored-to:
  - packages/core/src/api/types.ts
  - packages/core/src/api/blockTree.ts
  - packages/core/src/schema/structuralNodes.ts
last-verified: 2025-06-07
---

# Document Model Guide

How Kanava represents documents in JSON and how they map to ProseMirror's internal schema.

## Node hierarchy

```
doc
  └─ blockGroup
       └─ blockNode+
            ├─ blockBody (one of: paragraph, heading, quote, image, …)
            │   └─ inline content (text + marks)
            ├─ blockGroup? (nested children — for lists, toggles)
            └─ columnLayout? (instead of blockBody, for column blocks)
                 └─ column+
                      └─ blockNode+ (recursive)
```

> **Source of truth:** [`structuralNodes.ts`](../core/src/schema/structuralNodes.ts) defines `doc`, `blockGroup`, `blockNode`, `column`, and `columnLayout`.

### Key rules

- **`blockNode`** wraps every block. It carries shared visual attrs: `id`, `textAlign`, `backgroundColor`, `spacingTop`, `spacingBottom`, `lineHeight`, `letterSpacing`, `indent`, plus planned `padding`, `border`.
- **`blockBody`** is the ProseMirror group name for all user-facing block types (paragraph, heading, etc.). Every block created with `defineBlock()` must have `spec.group: "blockBody"`.
- **`columnLayout`** lives inside `blockNode` as an alternative to `blockBody`. Column nesting is allowed — no guards against it.

## Kanava JSON format

The public API uses `KanavaDocument` as the serialization format, distinct from ProseMirror's internal JSON.

> **Source of truth:** [`types.ts`](../core/src/api/types.ts) interfaces and [`blockTree.ts`](../core/src/api/blockTree.ts) for conversion functions.

### `KanavaDocument`

```ts
interface KanavaDocument {
  blocks: KanavaTopLevelBlock[];
}
```

### `KanavaBlock`

```ts
interface KanavaBlock {
  id: string;                  // Unique block ID (assigned by blockIdPlugin)
  type: string;                // Block type name (e.g., "paragraph", "heading")
  attrs?: Record<string, any>; // Block-specific attributes
  style?: KanavaBlockStyle;    // Visual styling (from blockNode wrapper)
  content?: KanavaInlineContent[];  // Inline text + marks
  children?: KanavaBlock[];    // Nested blocks (lists, toggles)
}
```

### `KanavaBlockStyle`

Visual properties stored on the `blockNode` wrapper:

```ts
interface KanavaBlockStyle {
  textAlign?: string;
  backgroundColor?: string;
  spacingTop?: number;
  spacingBottom?: number;
  lineHeight?: number;
  letterSpacing?: number;
  indent?: number;
  // Planned: padding, border
}
```

### `KanavaColumnLayout`

```ts
interface KanavaColumnLayout {
  id: string;
  type: "columnLayout";
  columns: KanavaColumn[];
  style?: KanavaBlockStyle;
}

interface KanavaColumn {
  width?: number;              // Percentage width (default: equal split)
  blocks: KanavaBlock[];       // Content blocks within the column
}
```

### `KanavaInlineContent`

```ts
interface KanavaInlineContent {
  type: "text";
  text: string;
  marks?: KanavaMarkData[];    // Active inline marks
}

interface KanavaMarkData {
  type: string;                // Mark name (e.g., "bold", "link")
  attrs?: Record<string, any>; // Mark-specific attrs (e.g., { href: "..." })
}
```

## Serialization

Two functions convert between ProseMirror nodes and Kanava JSON:

| Function | Signature | Purpose |
|----------|-----------|---------|
| `docToKanava` | `(doc: PMNode) → KanavaDocument` | ProseMirror → Kanava JSON |
| `kanavaToDoc` | `(doc: KanavaDocument, schema: Schema) → PMNode` | Kanava JSON → ProseMirror |

> **Source of truth:** [`blockTree.ts`](../core/src/api/blockTree.ts)

The editor uses these internally:
- `kanavaToDoc` in the constructor to parse `options.content`
- `docToKanava` in `dispatchTransaction` to emit `onChange` events and in `getDocument()`

## Built-in block types

| Name | Type name | Content | Group |
|------|-----------|---------|-------|
| Paragraph | `paragraph` | `inline*` | text |
| Heading | `heading` | `inline*` | text |
| Quote | `quote` | `inline*` | text |
| Code Block | `codeBlock` | `text*` | text |
| Image | `image` | (atom) | media |
| Divider | `divider` | (atom) | media |
| Bullet List | `bulletListItem` | `inline*` | list |
| Numbered List | `numberedListItem` | `inline*` | list |
| Checklist | `checklistItem` | `inline*` | list |
| Toggle | `toggle` | `inline*` | advanced |
| Callout | `callout` | `inline*` | advanced |
| Column Layout | `columnLayout` | (structural) | layout |

> **Source of truth:** [`blocks/index.ts`](../core/src/blocks/index.ts)

## Built-in mark types

| Name | Mark name | Has attrs |
|------|-----------|-----------|
| Bold | `bold` | No |
| Italic | `italic` | No |
| Underline | `underline` | No |
| Strikethrough | `strike` | No |
| Code | `code` | No |
| Link | `link` | `href`, `title` |
| Text Color | `textColor` | `color` |
| Highlight | `highlight` | `color` |
| Font Size | `fontSize` | `size` |
| Font Family | `fontFamily` | `family` |
| Superscript | `superscript` | No |
| Subscript | `subscript` | No |

> **Source of truth:** [`marks/index.ts`](../core/src/marks/index.ts)
