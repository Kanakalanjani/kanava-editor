# Kanava Editor — Architecture Plan

## Philosophy

Build **directly on ProseMirror** — no TipTap, no BlockNote. We own every layer. This gives us full control over the schema, rendering, keyboard behavior, and plugin system. We take the best ideas from BlockNote's nesting model but redesign it with our own conventions, API surface, and extension system.

Kanava is a **library** (npm module), not an application. Developers embed it in their own apps using `@kanava/editor` (headless engine) and `@kanava/editor-react` (React UI bindings).

---

## 1. Core Concept: The Block Tree

Every document is a **tree of blocks**. Each block is a container that holds:
1. **One content node** — what the user sees (paragraph, heading, image, etc.)
2. **Zero or more child blocks** — nested underneath (indented content, toggle content, etc.)

This is the fundamental primitive. Columns, tables, callouts — they're all variations of "a block that contains other blocks."

```
Document
├── Block (heading) "Project Plan"
│   ├── Block (paragraph) "Overview..."
│   └── Block (checklist) "Task 1"
├── Block (columns)
│   ├── Column
│   │   └── Block (paragraph) "Left side"
│   └── Column
│       └── Block (image) photo.png
└── Block (paragraph) "Footer text"
```

---

## 2. ProseMirror Schema Design

### 2.1 Node Type Hierarchy

```
doc
└── blockGroup
    └── blockNode+
        ├── blockBody                 (the visible content — paragraph, heading, etc.)
        │   └── blockGroup?           (optional nested children — recursion point)
        └── OR columnLayout           (alternative: side-by-side columns)
            └── column+
                └── blockNode+        (full blocks inside each column)
```

### 2.2 Node Specifications

#### Structural Nodes (defined in `schema/structuralNodes.ts` — never user-defined)

| Node | Content Expression | Group | Key Flags | Purpose |
|---|---|---|---|---|
| `doc` | `"blockGroup"` | topNode | — | Document root |
| `blockGroup` | `"blockChild+"` | `container` | — | Recursive block container |
| `blockNode` | `"(blockBody blockGroup?) \| columnLayout"` | `blockChild block` | `defining` | Universal block wrapper |
| `column` | `"blockNode+"` | `block container` | `isolating` | Single column within a layout |
| `text` | — | `inline` | — | Inline text |
| `hard_break` | — | `inline` | — | Soft line break (Shift+Enter) |

#### Content Nodes (blockBody types — each defined via `defineBlock()`)

| Node | Content | Flags | Purpose |
|---|---|---|---|
| `paragraph` | `"inline*"` | `isolating` | Standard text |
| `heading` | `"inline*"` | `isolating` | H1–H6 via `level` attr |
| `codeBlock` | `"text*"` | `isolating`, `code` | Code with language selector |
| `quote` | `"inline*"` | `isolating` | Blockquote text |
| `image` | `""` (empty) | `atom` | Image with resize/caption/filter |
| `divider` | `""` (empty) | `atom` | Horizontal rule |
| `checklistItem` | `"inline*"` | `isolating` | Task with `checked` attr |
| `bulletListItem` | `"inline*"` | `isolating` | Bullet list item |
| `numberedListItem` | `"inline*"` | `isolating` | Numbered list item |
| `toggle` | `"inline*"` | `isolating` | Collapsible header |
| `callout` | `"inline*"` | `isolating` | Callout with variant icon |
| `columnLayout` | `"column column+"` | — | Side-by-side columns (inside `blockNode`) |

### 2.3 blockNode Attributes

All block-level visual styling lives on the `blockNode` wrapper, not on individual block types. This gives every block automatic access to all style properties.

```ts
attrs: {
  id: { default: "" },                  // Persistent unique ID (set by blockId plugin)
  textAlign: { default: "left" },       // "left" | "center" | "right" | "justify"
  backgroundColor: { default: null },   // CSS color string or null
  spacingTop: { default: 0 },           // Extra top margin (px)
  spacingBottom: { default: 0 },        // Extra bottom margin (px)
  lineHeight: { default: null },        // Line spacing multiplier (null = CSS default)
  paddingTop: { default: 0 },           // Internal padding (px)
  paddingBottom: { default: 0 },
  paddingLeft: { default: 0 },
  paddingRight: { default: 0 },
  borderColor: { default: null },       // Block border color
  borderWidth: { default: 0 },          // Block border width (px)
  borderStyle: { default: "solid" },    // "solid" | "dashed" | "dotted"
  borderRadius: { default: 0 },         // Corner radius (px)
  textIndent: { default: 0 },           // First-line indent (px)
  letterSpacing: { default: 0 },        // Letter spacing (px)
  pageBreakBefore: { default: false },  // Force page break before
  keepWithNext: { default: false },     // Prevent break between this and next
  keepLinesTogether: { default: false },// Prevent break within block
  widowOrphan: { default: 2 },          // Min lines at page start/end
}
```

#### Block-Specific Attrs

```ts
// heading
attrs: { level: { default: 1 } }           // 1-6

// image
attrs: {
  src, alt, width, height, caption,
  filter: { default: "none" },             // CSS filter string
  alignment: { default: "center" },        // "left" | "center" | "right"
  cropData: { default: null },             // { x, y, w, h } normalized 0-1
}

// column
attrs: { width: { default: 1 } }           // flex-grow value

// checklistItem
attrs: { checked: { default: false } }

// codeBlock
attrs: { language: { default: "plain" } }

// callout
attrs: { variant: { default: "info" } }    // "info" | "warning" | "error" | "success"

// toggle
attrs: { collapsed: { default: false } }
```

### 2.4 Inline Schema (Marks)

**Currently implemented:**

| Mark | Key Attrs | Purpose |
|---|---|---|
| `bold` | — | **Bold** |
| `italic` | — | *Italic* |
| `underline` | — | Underline |
| `strike` | — | ~~Strikethrough~~ |
| `code` | — | `inline code` |
| `link` | `href`, `target`, `rel` | Hyperlinks |
| `textColor` | `color` | Font color |
| `highlight` | `color` | Background highlight |

**Typography marks** (implemented):

| Mark | Key Attrs | Purpose |
|---|---|---|
| `fontSize` | `size` | Per-character font size |
| `fontFamily` | `family` | Per-character font family |
| `superscript` | — | Superscript |
| `subscript` | — | Subscript |

---

## 3. Project Structure

```
kanava-editor/
├── packages/
│   ├── core/                          # @kanava/editor — Headless editor engine
│   │   └── src/
│   │       ├── api/                   # Public API types, blockTree serialization, events
│   │       │   ├── types.ts           # KanavaBlock, KanavaBlockStyle, KanavaEditorOptions
│   │       │   ├── blockTree.ts       # ProseMirror doc ↔ Block tree conversion
│   │       │   ├── operations.ts      # CRUD operations on blocks
│   │       │   └── events.ts          # Block change events
│   │       ├── blocks/                # BlockDefinition files (one per block type)
│   │       │   ├── paragraph.ts       # + heading, quote, codeBlock, image, divider,
│   │       │   │                      #   checklistItem, bulletListItem, numberedListItem,
│   │       │   │                      #   toggle, callout, columnLayout
│   │       │   └── index.ts           # builtInBlocks array
│   │       ├── commands/              # ProseMirror commands grouped by domain
│   │       │   ├── block.ts           # Insert, delete, move, convert, backspace merge
│   │       │   ├── blockAttrs.ts      # Block attribute commands + resetBlockFormatting
│   │       │   ├── text.ts            # Text formatting (alignment, color, spacing, marks)
│   │       │   ├── nesting.ts         # Indent/outdent (Tab/Shift+Tab)
│   │       │   ├── columns.ts         # Create/modify column layouts
│   │       │   ├── columnNav.ts       # Arrow key navigation across column boundaries
│   │       │   ├── columnBackspace.ts # Cross-column backspace handling
│   │       │   ├── gapCursorInsert.ts # GapCursor+Enter boundary insertion
│   │       │   ├── image.ts           # Image-specific commands
│   │       │   ├── inlineMarks.ts     # Inline mark toggle helpers
│   │       │   ├── splitMerge.ts      # Block split/merge logic
│   │       │   ├── divider.ts         # Divider attribute commands
│   │       │   └── traversal.ts       # Block traversal commands
│   │       ├── extensions/            # Extension system
│   │       │   ├── defineBlock.ts     # BlockDefinition interface + defineBlock()
│   │       │   ├── defineMark.ts      # MarkDefinition interface + defineMark()
│   │       │   ├── definePlugin.ts    # definePlugin()
│   │       │   └── schemaBuilder.ts   # buildSchema(blocks, marks) → ProseMirror Schema
│   │       ├── marks/                 # MarkDefinition files (one per mark)
│   │       │   ├── bold.ts            # + italic, underline, strike, code, link,
│   │       │   │                      #   textColor, highlight, fontSize, fontFamily,
│   │       │   │                      #   superscript, subscript
│   │       │   └── index.ts           # builtInMarks array (12 marks)
│   │       ├── selections/            # Custom ProseMirror Selection types
│   │       │   └── MultiBlockSelection.ts # Notion-style multi-block selection
│   │       ├── nodeViews/             # Custom ProseMirror NodeViews
│   │       │   ├── KanavaNodeView.ts  # Base class (this.el, this.setAttrs, lifecycle)
│   │       │   ├── BlockNodeView.ts   # blockNode wrapper + drag handle
│   │       │   ├── CodeBlockView.ts   # Code with language selector
│   │       │   ├── ImageNodeView.ts   # Image with resize handles
│   │       │   ├── ColumnLayoutView.ts # Column resize gutter
│   │       │   ├── ToggleNodeView.ts  # Collapsible toggle
│   │       │   └── CalloutNodeView.ts # Callout with variant icon
│   │       ├── plugins/               # ProseMirror plugins
│   │       │   ├── blockId.ts         # Auto-assigns unique IDs to blockNodes
│   │       │   ├── blockMultiSelection.ts # Cross-block drag detection + multi-select
│   │       │   ├── clipboard.ts       # Copy/paste handling
│   │       │   ├── documentStructure.ts # Document tree structure tracking
│   │       │   ├── dragHandle.ts      # Drag handle behavior + structural drop resolution
│   │       │   ├── ghostRail.ts       # Ghost rail hierarchy visualization
│   │       │   ├── imageUpload.ts     # Image paste/drop upload
│   │       │   ├── inputRules.ts      # Markdown shortcuts (# → heading, - → list)
│   │       │   ├── interactionMode.ts # Canvas mode interaction (click=select, dblclick=edit)
│   │       │   ├── keymap.ts          # Block-level keyboard shortcuts
│   │       │   ├── listRenumber.ts    # Auto-renumber numbered list items
│   │       │   ├── pagination.ts      # Decoration-based page breaks
│   │       │   ├── placeholder.ts     # Empty block placeholder text
│   │       │   ├── selection.ts       # Custom selection decorations (node, multi-block)
│   │       │   └── toolbarState.ts    # Reactive toolbar state computation
│   │       ├── schema/                # Structural nodes + mark specs
│   │       │   ├── structuralNodes.ts # doc, blockGroup, blockNode, column, text
│   │       │   ├── schema.ts          # Schema assembly
│   │       │   └── marks/             # ProseMirror MarkSpec definitions
│   │       ├── styles/
│   │       │   └── editor.css         # All CSS (--kanava-* vars, .kanava-* classes)
│   │       ├── editor.ts              # KanavaEditor class — main entry point
│   │       └── index.ts               # Public exports
│   │
│   ├── react/                         # @kanava/editor-react — React UI bindings
│   │   └── src/
│   │       ├── KanavaEditor.tsx        # React wrapper component
│   │       ├── FormatBar.tsx           # Floating toolbar (text + block modes)
│   │       ├── FixedToolbar.tsx        # Word-style formatting ribbon
│   │       ├── ContextMenu.tsx         # Right-click menu with submenus
│   │       ├── BlockPicker.tsx         # Block type picker (categories + search)
│   │       ├── DocumentTree.tsx        # Live document structure tree
│   │       ├── DocumentStats.tsx       # Word/character/block count display
│   │       ├── GhostRail.tsx           # Ghost rail breadcrumb overlay
│   │       ├── ImageEditorModal.tsx    # Image crop/filter/rotate editor
│   │       ├── ImageInsertPopover.tsx  # Image URL/upload insertion
│   │       ├── ParagraphFormatPopover.tsx # Block-level format controls
│   │       ├── ToolbarPrimitives.tsx   # Reusable toolbar atoms
│   │       └── hooks.ts               # useKanavaEditor, useToolbarState, useSelectionInfo
│   │
│   └── docs/                          # Architecture documentation
│
├── apps/
│   ├── playground/                    # Demo app using both packages
│   └── resume-builder/                # Resume builder demo app (canvas mode)
│
├── docs/plans/                        # Design & implementation plans
├── .agent/                            # Agent rules and skills
└── pnpm-workspace.yaml
```

---

## 4. How Nesting Works

### 4.1 The Recursion Pattern

The `blockGroup?` in `blockNode`'s content expression makes nesting **optional and universal**. Any block can have children.

```
blockGroup
  └── blockNode "Item A"
        ├── paragraph: "Parent"       ← blockBody
        └── blockGroup                ← optional children
              └── blockNode "Child"
```

### 4.2 Indent/Outdent (Tab / Shift+Tab)

- **Indent**: Block becomes a child of its previous sibling (max 6 levels, enforced by command logic)
- **Outdent**: Nested block lifts to parent's level
- Maximum nesting depth capped at 6 levels via command logic (schema allows infinite recursion)

---

## 5. How Columns Work (Option B Architecture)

### 5.1 Schema Structure

`columnLayout` lives **inside** a `blockNode` wrapper. This is the "Option B" architecture, chosen because the wrapper `blockNode` provides ID, drag handle, selection decoration, and block styles automatically.

```
blockGroup
└── blockNode (id: "col1")            ← universal wrapper
      └── columnLayout
            ├── column (width: 1)
            │     └── blockNode > paragraph
            └── column (width: 1)
                  └── blockNode > paragraph
```

### 5.2 Column Operations

| Operation | How |
|---|---|
| Create columns | Context menu "Turn into 2/3/4 columns" — wraps content in `blockNode > columnLayout > [column > blockNode+]` |
| Add column | "Add column left/right" in context menu |
| Remove column | Backspace in single empty block → dissolve column → dissolve layout if last |
| Resize columns | Drag gutter between columns → updates `width` attrs (CSS flex-grow) |
| Nesting | Fully supported — columns inside columns, no guard |

### 5.3 Cross-Column Backspace & Delete

Blocks within a `columnLayout` have a **sequential order**: left-to-right by column, top-to-bottom within each column:

```
Column 1: B1, B2, B3
Column 2: B4, B5, B6
Sequential: B1 → B2 → B3 → B4 → B5 → B6
```

- **Backspace** at cursor position 0 merges into the nearest text block *above* in sequential order, skipping non-text blocks (images, dividers)
- **Forward Delete** at end of block merges the nearest text block *below*
- After a merge, if the source column becomes empty → dissolve the column → if only 1 column remains → dissolve the layout back to flat blocks

### 5.4 Column Boundary Navigation

Arrow keys at column boundaries use `exitColumnUp` / `exitColumnDown` commands:
- Arrow up from first block in column → move to block above the `columnLayout`
- Arrow down from last block in column → move to block below the `columnLayout`
- If no valid position exists, fall through to `prosemirror-gapcursor`

---

## 6. Drag & Drop

### 6.1 Hover Drag Handle

A compact 3-dot grip that appears on hover at the top-left of each block. The handle floats above content (`position: absolute`) and requires **zero reserved padding**. Blocks use their full width.

- `BlockNodeView` renders the handle as a `<button>` with `contenteditable="false"`
- On `mousedown`, creates a `NodeSelection` for the entire `blockNode`
- ProseMirror's built-in drag moves the full subtree (content + children)

### 6.2 Drop Cursor

Custom block-aware drop cursor plugin renders a horizontal line between blocks, with handling for column boundaries.

---

## 7. Block-Level Styling

All visual properties live on the `blockNode` wrapper. `BlockNodeView.applyBlockStyles()` maps attrs to inline CSS.

All styling properties are implemented: `textAlign`, `backgroundColor`, `spacingTop/Bottom`, `lineHeight`, `paddingTop/Bottom/Left/Right`, `borderColor/Width/Style/Radius`, `textIndent`, `letterSpacing`, `pageBreakBefore`, `keepWithNext`, `keepLinesTogether`, `widowOrphan`.

Styling commands follow a single pattern: iterate `state.doc.nodesBetween(from, to)`, collect `blockNode` positions, use `tr.setNodeMarkup()` to update attrs.

**Planned** (Phase 1): Document-level styling defaults via `DocumentStyle` config and CSS variable chain. See [Phase 1: Layout Primitives](phases/phase-1-layout-primitives.md).

---

## 8. Toolbar Architecture — Headless Core + Composable React

### 8.1 Core Layer (`@kanava/editor`)

`toolbarStatePlugin` — ProseMirror plugin that computes reactive state on every transaction:

```ts
interface ToolbarState {
  activeMarks: Set<string>;
  selectedBlockType: string | null;
  selectedBlockDef: BlockDefinition | null;
  selectedBlockNode: Node | null;
  blockToolbarItems: ToolbarItem[];
  contextMenuItems: ContextMenuItem[];
}
```

Block definitions carry their own toolbar/context menu items — no hardcoded lists.

### 8.2 React Layer (`@kanava/editor-react`)

```tsx
// Hook for custom UI
const state = useToolbarState(editor);

// Pre-built components
<FormatBar editor={editor} />       // floating, text mode + block mode
<ContextMenu editor={editor} />     // right-click, grouped submenus
<BlockPicker editor={editor} />     // sidebar, data-driven from blockDefs
```

### 8.3 Headless vs Batteries-Included — Both

| Consumer | What they use |
|---|---|
| **Quick start** | Pre-built `<FormatBar />`, `<ContextMenu />`, `<BlockPicker />` |
| **Custom UI** | `useToolbarState()` + own components |
| **Fully custom** | `editor.exec()`, raw ProseMirror |

---

## 9. Pagination System (Implemented ✅)

- **Decoration-based** — page breaks are `Decoration.widget`s, not schema nodes
- **Atomic shifting** — blocks that don't fit shift entirely to next page
- **Overflow lock** — blocks exceeding one full page height are locked via `filterTransaction`
- **Print/export** — CSS `@media print` rules hide chrome and insert CSS page breaks
- **Page sizes** — A4, Letter, Legal, Custom presets
- **Block attrs** — `pageBreakBefore`, `keepWithNext`, `keepLinesTogether`, `widowOrphan`
- **Runtime config** — `editor.setPaginationConfig()` updates margins/size without remounting

---

## 10. Keyboard Behavior

| Key | Context | Behavior |
|---|---|---|
| `Enter` | End of block body text | Create new sibling `blockNode` below |
| `Enter` | End of continuable block (list item) | Continue same block type |
| `Enter` | Empty continuable block | Convert to paragraph |
| `Shift+Enter` | Any text block | Insert soft line break (`hard_break`) |
| `Backspace` | Start of block, nested | Outdent first, then merge with previous |
| `Backspace` | Start of block, in column | Cross-column sequential merge |
| `Delete` | End of block | Forward merge with next text block |
| `Tab` / `Shift+Tab` | Any block | Indent / outdent (max 6 levels) |
| `↑` / `↓` | Column boundary | Exit column, move to block above/below layout |

---

## 11. Extension System

### 11.1 `defineBlock()` API

Every block type (including built-ins) is defined via `defineBlock()`:

```ts
export const MyBlock = defineBlock({
  name: "myBlock",
  label: "My Block",
  icon: "📦",
  group: "text",
  spec: { group: "blockBody", content: "inline*", /* ... */ },
  nodeView: (node, view, getPos, editor) => new MyNodeView(...),
  inputRules: (schema) => [...],
  keymap: (schema) => ({ "Mod-Shift-M": someCommand }),
  commands: (schema) => ({ doThing: (arg) => command }),
  toolbar: [{ key: "action", label: "Do", command }],
  contextMenu: [{ key: "ctx", label: "Action", command }],
  continuable: false,
  convertible: true,
});
```

### 11.2 `defineMark()` API

```ts
export const MyMark = defineMark({
  name: "myMark",
  label: "My Mark",
  icon: "M",
  spec: { parseDOM: [...], toDOM() { ... } },
  keymap: (schema) => ({ "Mod-m": toggleMark(schema.marks.myMark) }),
  commands: (schema) => ({ toggleMyMark: () => toggleMark(schema.marks.myMark) }),
});
```

### 11.3 Schema Builder

```ts
const schema = buildSchema(builtInBlocks, builtInMarks);
// Custom: buildSchema([...builtInBlocks, MyBlock], [...builtInMarks, MyMark]);
```

---

## 12. Data Model (Block Tree JSON)

The high-level API converts the ProseMirror doc into a clean JSON tree:

```json
{
  "blocks": [
    {
      "id": "a1b2c3",
      "type": "heading",
      "attrs": { "level": 1 },
      "style": { "textAlign": "center" },
      "content": [{ "type": "text", "text": "Project Plan", "marks": [] }],
      "children": [
        {
          "id": "d4e5f6",
          "type": "paragraph",
          "attrs": {},
          "content": [{ "type": "text", "text": "Overview text.", "marks": [] }],
          "children": []
        }
      ]
    }
  ]
}
```

Column layouts serialize as `KanavaColumnLayout` with a `columns` array of `KanavaColumn` objects.

---

## 13. Tech Stack

| Layer | Technology |
|---|---|
| Editor engine | ProseMirror |
| Build system | tsup (library), Vite (playground) |
| Monorepo | pnpm workspaces |
| Language | TypeScript strict mode, ES2020 |
| UI bindings | React 18+ |
| Block IDs | nanoid |
| CSS | `--kanava-*` custom properties, `.kanava-` class prefix |
| Testing | Vitest + prosemirror-test-builder (planned) |

---

## 14. Key Differentiators

| Aspect | TipTap | BlockNote | **Kanava** |
|---|---|---|---|
| **Base** | ProseMirror wrapper | Built on TipTap | **Direct ProseMirror** |
| **Nesting** | Manual, per-node | Universal `blockContainer` | Universal `blockNode` |
| **Columns** | None | Add-on package | **First-class** in core |
| **Drag handle** | None | External side menu | **Hover overlay** (zero padding) |
| **Pagination** | None | None | **Built-in** (decoration-based) |
| **Block styling** | Per-node attrs | `DefaultProps` on wrapper | **Universal `blockNode` attrs** + paragraph formatting |
| **Formatting depth** | Basic marks | Basic marks | **MS Word-class** (12 marks, 18 block attrs) |
| **Canvas mode** | None | None | **Built-in** (interactionMode plugin) |
| **Multi-block selection** | None | None | **Built-in** (Notion-style) |
| **Extension API** | `Extension` class | `createBlockSpec` | `defineBlock()` / `defineMark()` |
