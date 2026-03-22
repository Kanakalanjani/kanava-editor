# Table Block — Research & Planning

> **Status**: Deferred. This document captures research and architectural options for when a table block is implemented.  
> **Created**: 2026-03-08  
> **Context**: Decision 7 from `next-implementation-plan.md`. Tables are not needed for the resume builder right now.

---

## What exists now

No table block. Tables were planned in Phase 5 of the master implementation plan.

---

## Two architectural options

### Option A — Custom structural nodes

Build `table > tableRow > tableCell` as custom ProseMirror nodes, following the same pattern as `columnLayout > column`.

| Aspect | Detail |
|--------|--------|
| How it works | `defineBlock()` pattern: `Table = defineBlock({ name: "table", spec: { content: "tableRow+" } })`, with `tableRow` and `tableCell` as structural nodes |
| Cell selection (multi-cell) | Must build from scratch or skip for v1 |
| Cell merge | Must build from scratch or skip |
| Column resize | Must build from scratch or skip |
| Tab navigation | Custom keymap (Tab → next cell, Shift-Tab → prev cell) |
| Bundle impact | Zero new dependencies |
| Integration effort | M — define nodes, NodeView, commands for add/remove row/column |
| Architectural fit | Perfect — follows `defineBlock()` and existing structural node patterns |

### Option B — prosemirror-tables library

Import the `prosemirror-tables` package and integrate its schema + plugins.

| Aspect | Detail |
|--------|--------|
| How it works | Import `prosemirror-tables`, merge its nodes into `buildSchema()`, add its plugins |
| Cell selection (multi-cell) | Built-in |
| Cell merge | Built-in |
| Column resize | Built-in |
| Tab navigation | Built-in |
| Bundle impact | +15KB gzipped |
| Integration effort | S-M — need to bridge prosemirror-tables' schema conventions with Kanava's `buildSchema()` |
| Architectural fit | Needs adaptation — prosemirror-tables has its own schema/plugin conventions that differ from Kanava's `defineBlock()` |

### Option C — Middle ground (wrapper)

Build a `defineBlock()` wrapper around `prosemirror-tables`' schema. Consumers register "Table" as a standard Kanava block, but under the hood it uses prosemirror-tables.

```ts
// Hypothetical API
export const Table = defineBlock({
  name: "table",
  label: "Table",
  icon: "📊",
  group: "layout",
  // Under the hood: uses prosemirror-tables schema nodes
  spec: prosemirrorTablesAdapter.tableSpec(),
  plugins: prosemirrorTablesAdapter.tablePlugins(),
});
```

This gives consumers the `defineBlock()` API they expect while leveraging prosemirror-tables' battle-tested internals. The bridge between Kanava's `buildSchema()` and prosemirror-tables' schema needs prototyping.

---

## For the resume builder

Resumes use tables for:
- Skills matrices (Skill / Level)
- Simple two-column key-value layouts (Language: English, Location: NYC)
- Occasionally, complex multi-row sections

Cell merge, column resize, and multi-cell selection are **not needed** for v1. A simple table with add/remove row/column suffices.

---

## For npm package competitiveness

Consumers evaluating Kanava vs. Tiptap (which wraps prosemirror-tables) or Notion will expect table support. Starting with custom nodes and upgrading later risks a **schema migration** — the node structure may change, breaking existing documents.

Starting with prosemirror-tables (Option B/C) avoids this risk but adds integration complexity now.

---

## Recommendation (preliminary)

**Option C (wrapper)** is the most promising long-term approach:
- Consumers get the familiar `defineBlock()` API
- Internally uses prosemirror-tables (battle-tested, maintained)
- No schema migration risk when adding merge/resize later
- Requires prototyping the adapter layer

If prototyping shows the wrapper is too complex, fall back to **Option A (custom)** for a minimal table that covers the resume builder's needs.

---

## Implementation sketch (when un-deferred)

1. **Prototype the adapter** — Can prosemirror-tables' node specs be wrapped in Kanava's schema builder?
2. **Define TableBlock** — `defineBlock()` registration with custom NodeView showing table UI
3. **Toolbar integration** — Add "Insert Table" to BlockPicker, with a row×column size picker
4. **Basic commands** — Add row, add column, remove row, remove column, Tab navigation
5. **CSS** — `.kanava-table`, `.kanava-table-row`, `.kanava-table-cell` with proper theming
6. **Advanced features (later)** — Cell merge, column resize, multi-cell selection

---

## Open questions

1. Does the prosemirror-tables adapter approach work technically with Kanava's `buildSchema()`?
2. How do tables interact with pagination (page breaks mid-table)?
3. Should table cells allow block content (nested blocks inside cells) or only inline content?
4. How does the table block integrate with canvas mode / interactionMode?
