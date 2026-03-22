---
anchored-to:
  - packages/core/src/plugins/toolbarState.ts
  - packages/react/src/FormatBar.tsx
  - packages/react/src/FixedToolbar.tsx
  - packages/react/src/ContextMenu.tsx
  - packages/react/src/BlockPicker.tsx
  - packages/react/src/ToolbarPrimitives.tsx
  - packages/react/src/hooks.ts
last-verified: 2026-03-20
---

# Kanava Editor — Toolbar & Context Menu Architecture

> **Purpose**: End-to-end documentation of how the Floating Toolbar (FormatBar) and Right-Click Context Menu work, including every file, function, variable, and decision point in the code flow.
>
> **Last updated**: After Context Menu Redesign (Notion-style grouped layout with submenus).

---

## 1. Floating Toolbar (FormatBar) — Complete Flow

### 1.1 Overview

The FormatBar is a floating toolbar that appears in two modes:

| Mode | Trigger | What it shows |
|------|---------|---------------|
| **Text mode** | User selects text (non-empty `TextSelection`) | Block type switcher, alignment, mark toggles (B/I/U/S/code), link, text color, highlight |
| **Block mode** | User clicks an atom node like `image` (creates a `NodeSelection`) | Block-specific toolbar items from `BlockDefinition.toolbar` (e.g. alignment dropdown, filter dropdown for images) |

### 1.2 Component Tree

```
apps/playground/src/App.tsx
└── <FormatBar editor={editor} />                      # packages/react/src/FormatBar.tsx
    ├── useToolbarState(editor)                         # packages/react/src/hooks.ts
    │   └── getToolbarState() / subscribeToolbarState() # packages/core/src/plugins/toolbarState.ts
    ├── [Text mode] → inline rendering of buttons
    │   ├── <ToolbarButton>                             # packages/react/src/ToolbarPrimitives.tsx
    │   ├── <ToolbarGroup>                              # packages/react/src/ToolbarPrimitives.tsx
    │   └── <ToolbarSeparator>                          # packages/react/src/ToolbarPrimitives.tsx
    └── [Block mode] → <BlockToolbar items={...} />     # packages/react/src/ToolbarPrimitives.tsx
        ├── <ToolbarDropdown>                           # packages/react/src/ToolbarPrimitives.tsx
        └── <ToolbarButton>                             # packages/react/src/ToolbarPrimitives.tsx
```

### 1.3 File-by-File Breakdown

---

#### File: `packages/react/src/FormatBar.tsx`

**Exports:** `FormatBar` (React.FC), `FormatBarProps`

**Constants:**
| Variable | Purpose |
|----------|---------|
| `TEXT_COLORS` | Array of `{label, value}` for text color palette (9 entries) |
| `HIGHLIGHT_COLORS` | Array of `{label, value}` for highlight palette (9 entries) |
| `BLOCK_TYPES` | Array of `{label, value, icon, attrs?}` for block type dropdown (9 entries: paragraph, h1–h3, bullet, number, check, quote, code). **Hardcoded** — does not read from `editor.blockDefs`. |
| `CLOSED_DROPDOWNS` | Initial `DropdownState` object with all dropdowns closed |

**Component: `FormatBar`**

Props:
- `editor: KanavaEditor | null` — the editor instance
- `className?: string`

Internal state:
| State variable | Type | Purpose |
|----------------|------|---------|
| `barRef` | `React.RefObject<HTMLDivElement>` | Ref for the floating bar div |
| `visible` | `boolean` | Whether the bar is shown |
| `position` | `{top, left}` | Absolute position relative to editor |
| `dropdown` | `DropdownState` | Which dropdown is open (textColor, highlight, blockType, link) |
| `linkUrl` | `string` | Current URL in the link input |
| `linkInputRef` | `React.RefObject<HTMLInputElement>` | Ref for the link input |

**Key hook:**
```ts
const toolbarState = useToolbarState(editor);
```
This is the bridge from core → React. Returns a `ToolbarState` object (or null).

**Flow: Visibility & Positioning (`updatePosition` callback)**

1. Called on `selectionChange` event (via `editor.on("selectionChange", ...)`) and on `mouseup`/`keyup` DOM events.
2. **NodeSelection path** (image, divider, etc.):
   - Gets the DOM element via `view.nodeDOM(selection.from)`
   - Calculates center-x of the node, places bar 48px above it
   - Sets `visible = true`
3. **TextSelection path**:
   - If selection is empty → `visible = false`
   - Otherwise: gets coords via `view.coordsAtPos(from)` and `view.coordsAtPos(to)`
   - Centers bar horizontally over selection, 48px above
   - Sets `visible = true`

**Flow: Mode Decision (render)**

```ts
const hasBlockToolbar = toolbarState.blockToolbarItems.length > 0;

if (toolbarState.isNodeSelection && hasBlockToolbar) {
  // BLOCK MODE → render <BlockToolbar items={toolbarState.blockToolbarItems} />
} else {
  // TEXT MODE → render inline text formatting buttons
}
```

The decision is:
1. Is it a `NodeSelection`? (checked via `toolbarState.isNodeSelection`)
2. Does the selected block have toolbar items? (checked via `toolbarState.blockToolbarItems.length > 0`)
3. If **both** → Block mode
4. Otherwise → Text mode (even for NodeSelection on blocks without toolbar items)

**Block type active state** (heading level-aware):
```ts
const isActive =
  blockType === bt.value &&
  (!bt.attrs?.level || toolbarState?.selectedBlockNode?.attrs?.level === bt.attrs.level);
```
This ensures H1, H2, H3 highlight independently in the block type dropdown.

**Flow: Text Mode Actions**

| Button | Handler | Command file | Function |
|--------|---------|-------------|----------|
| Block type dropdown | `applyBlockType(type, attrs?)` | `commands/block.ts` | `convertBlockType(type, attrs)` |
| Align left/center/right | `<ToolbarButton command={setTextAlign("left")}>` | `commands/text.ts` | `setTextAlign(alignment)` |
| Bold | `<ToolbarButton command={toggleBold(schema)}>` | `commands/text.ts` | `toggleBold(schema)` |
| Italic | `<ToolbarButton command={toggleItalic(schema)}>` | `commands/text.ts` | `toggleItalic(schema)` |
| Underline | `<ToolbarButton command={toggleUnderline(schema)}>` | `commands/text.ts` | `toggleUnderline(schema)` |
| Strike | `<ToolbarButton command={toggleStrike(schema)}>` | `commands/text.ts` | `toggleStrike(schema)` |
| Code | `<ToolbarButton command={toggleCode(schema)}>` | `commands/text.ts` | `toggleCode(schema)` |
| Link | `toggleDropdown("link")` → `applyLink()` | `commands/text.ts` | `toggleLink(schema, {href})` |
| Remove link | `removeExistingLink()` | `commands/text.ts` | `toggleLink(schema)` (no attrs) |
| Text color | `applyTextColor(color)` | `commands/text.ts` | `setTextColor(schema, color)` or `removeTextColor(schema)` |
| Highlight | `applyHighlight(color)` | `commands/text.ts` | `setHighlight(schema, color)` or `removeHighlight(schema)` |

All commands are executed via `execCmd(cmd)`:
```ts
const execCmd = (cmd: Command) => {
  editor.exec(cmd);   // → editor.view.state → cmd(state, dispatch)
  editor.focus();
};
```

**Flow: Block Mode Actions**

When in block mode, the FormatBar renders:
```tsx
<BlockToolbar items={toolbarState.blockToolbarItems} editor={editor} />
```

The `blockToolbarItems` come from `toolbarState`, which derives them from the `BlockDefinition.toolbar` array of the currently selected block. See section 1.5.

---

#### File: `packages/react/src/hooks.ts`

**Exports:** `useKanavaEditor`, `useToolbarState`, `useSelectionInfo`, `useIsMarkActive`

**`useToolbarState(editor)`** — The core hook for toolbar reactivity.

Uses `useSyncExternalStore` for concurrent-safe reads:
- **subscribe**: calls `subscribeToolbarState(editor.pmState, callback)` from core
- **getSnapshot**: calls `getToolbarState(editor.pmState)` from core
- Returns `ToolbarState | null`

This is how FormatBar and ContextMenu both get reactive access to the toolbar state.

---

#### File: `packages/core/src/plugins/toolbarState.ts`

**Exports:** `toolbarStatePlugin()`, `toolbarStateKey`, `getToolbarState()`, `subscribeToolbarState()`  
**Exported type:** `ToolbarState`

**`ToolbarState` interface:**
| Field | Type | Source |
|-------|------|--------|
| `activeMarks` | `Set<string>` | Derived from `editorState.storedMarks` or `$from.marks()`, plus marks across selection range |
| `availableMarks` | `readonly MarkDefinition[]` | All registered mark definitions |
| `markToolbarItems` | `readonly ToolbarItem[]` | Collected from `MarkDefinition.toolbar` across all marks |
| `selectedBlockType` | `string \| null` | The block body type name at cursor (e.g. `"image"`, `"paragraph"`) |
| `selectedBlockNode` | `PMNode \| null` | The actual ProseMirror node of the block body |
| `selectedBlockDef` | `BlockDefinition \| null` | Looked up from `blockDefMap` by `selectedBlockType` |
| `blockToolbarItems` | `readonly ToolbarItem[]` | From `selectedBlockDef.toolbar ?? []` |
| `contextMenuItems` | `readonly ContextMenuItem[]` | From `selectedBlockDef.contextMenu ?? []` |
| `selectionEmpty` | `boolean` | True if cursor, no text selected |
| `isNodeSelection` | `boolean` | True if selection is `NodeSelection` |

**`deriveToolbarState(editorState, blockDefMap, markDefs)` function:**

This is the core logic that determines what the toolbar shows.

1. **Active marks**: Reads `storedMarks` or `$from.marks()`. For non-empty selections, also walks `doc.nodesBetween(from, to)`.
2. **Mark toolbar items**: Iterates all `markDefs`, collects `md.toolbar` arrays.
3. **Selected block detection** (the critical part):
   - **If `NodeSelection`**: 
     - If selected node's group includes `"blockBody"` → that's the block (e.g. clicking an `image` atom)
     - If selected node is `"blockNode"` → use its first child (the blockBody) — this happens with drag handle selection
   - **If not `NodeSelection` (text cursor)**: walks `$from.depth` upward looking for a node whose group includes `"blockBody"`
4. **Block def lookup**: `blockDefMap.get(selectedBlockType)` → gets the `BlockDefinition`
5. **Toolbar & context items**: `selectedBlockDef.toolbar ?? []` and `selectedBlockDef.contextMenu ?? []`

**`toolbarStatePlugin(blockDefs, markDefs)` factory:**

- Created in `editor.ts` constructor, receives all block and mark definitions
- `state.init`: derives initial toolbar state
- `state.apply`: re-derives on every transaction
- `view.update`: notifies all listeners after view update

**`getToolbarState(editorState)`**: Reads from plugin key, returns `ToolbarState | null`.  
**`subscribeToolbarState(editorState, listener)`**: Registers a callback in the plugin's listener set. Returns unsubscribe function.

---

#### File: `packages/react/src/ToolbarPrimitives.tsx`

**Exports:** `ToolbarButton`, `ToolbarSeparator`, `ToolbarGroup`, `ToolbarDropdown`, `BlockToolbar`

**`ToolbarButton`** — A reusable button that either executes a ProseMirror `command` via `editor.exec(command)` or calls a custom `onClick`.

**`ToolbarDropdown`** — A button + dropdown list. Each item has a `command`, `isActive`, and `label`. Used by block toolbar for alignment/filter dropdowns.

**`BlockToolbar`** — The renderer for block-specific toolbar items. Iterates `items: ToolbarItem[]` and renders:
- `type: "separator"` → `<ToolbarSeparator>`
- `type: "dropdown"` → `<ToolbarDropdown>` (with sub-items)
- Default (`"button"` / `"toggle"`) → `<ToolbarButton>` with `isActive(state)` / `isEnabled(state)` checks

---

#### File: `packages/core/src/extensions/defineBlock.ts`

**Exports:** `defineBlock()`, `BlockDefinition`, `ToolbarItem`, `ToolbarDropdownItem`, `ContextMenuItem`, `NodeViewFactory`

**`ToolbarItem`** interface — data description of a toolbar button/dropdown:
```ts
{ key, icon?, label, type?, command?, items?, isActive?, isEnabled? }
```

**`ContextMenuItem`** interface — data description of a context menu entry:
```ts
{ key, label, icon?, command, isEnabled? }
```

These are pure data — no DOM, no React. The React layer reads them and renders UI.

---

#### File: `packages/core/src/blocks/image.ts`

**Exports:** `Image` (BlockDefinition), `IMAGE_FILTERS`

The Image block definition includes `toolbar` and `contextMenu`:

**`toolbar` array (3 items):**
1. **Alignment dropdown** (`key: "image-align"`, `type: "dropdown"`):
   - 3 sub-items: Left, Center, Right
   - Each calls `setImageAlignment("left"|"center"|"right")` from `commands/image.ts`
   - Each has `isActive` checking `state.selection.node.attrs.alignment`
2. **Filter dropdown** (`key: "image-filter"`, `type: "dropdown"`):
   - 7 sub-items (None, Grayscale, Sepia, Brightness, Contrast, Blur, Vintage)
   - Each calls `setImageFilter(name)` from `commands/image.ts`
   - Each has `isActive` checking `state.selection.node.attrs.filter`
3. **Delete Image** (`key: "image-delete"`):
   - Calls `deleteCurrentBlock` from `commands/block.ts`

**`contextMenu` array: empty** — The Image block defines no context menu items. The standard context menu (Delete, Duplicate, etc.) handles all block-level operations.

---

#### File: `packages/core/src/commands/image.ts`

**Exports:** `setImageAlignment()`, `setImageFilter()`, `setImageAlt()`, `setImageWidth()`, `setImageCaption()`, `setImageCrop()`, `insertImageFromUrl()`

All image commands use the helper `getSelectedImage(state)`:
- Checks `selection instanceof NodeSelection`
- Checks `selection.node.type.name === "image"`
- Returns `{node, pos}` or `null`

Then they use `tr.setNodeMarkup(pos, undefined, {...attrs, newValue})` to update the image node's attributes.

---

#### File: `packages/core/src/commands/text.ts`

**Exports:** Text formatting commands (toggleBold, toggleItalic, toggleUnderline, toggleStrike, toggleCode, toggleLink, setTextColor, removeTextColor, setHighlight, removeHighlight, setTextAlign, setBlockBackground, setBlockSpacing)

The `toggle*` functions use ProseMirror's `toggleMark()`.  
`setTextAlign` targets the `blockNode` ancestor (not blockBody) and sets `textAlign` attr.  
`setBlockBackground` / `setBlockSpacing` also target `blockNode` attrs.

---

#### File: `packages/core/src/editor.ts`

**`KanavaEditor.exec(command)`** — The command execution API:
```ts
exec(command: Command): boolean {
  return command(this.view.state, this.view.dispatch);
}
```

This is the single entry point for all toolbar actions. Both `ToolbarButton` and `ToolbarDropdown` call `editor.exec(cmd)`.

**Constructor** — Wires up `toolbarStatePlugin(this._blockDefs, this._markDefs)` as one of the plugins, which makes the toolbar state available.

---

### 1.4 Complete Flow: User Selects Text → Format Bar Appears → Clicks Bold

```
1. User drags to select text
   → ProseMirror creates a TextSelection
   → dispatchTransaction fires
   → editor emits "selectionChange" event

2. FormatBar's useEffect listener fires:
   editor.on("selectionChange", () => requestAnimationFrame(updatePosition))

3. updatePosition() runs:
   → selection is TextSelection, not empty
   → calculates coords via view.coordsAtPos(from/to)
   → sets position state, visible = true

4. useToolbarState(editor) fires:
   → toolbarStatePlugin.view.update() notifies listeners
   → useSyncExternalStore re-reads getToolbarState()
   → returns ToolbarState with activeMarks, selectedBlockType, etc.

5. FormatBar renders Text mode (isNodeSelection=false || no block toolbar items)
   → Shows bold button: <ToolbarButton active={activeMarks.has("bold")} command={toggleBold(schema)} />

6. User clicks Bold:
   → ToolbarButton.handleClick()
   → editor.exec(toggleBold(schema))
   → toggleMark(schema.marks.bold)(state, dispatch)
   → transaction dispatched, bold mark toggled

7. dispatchTransaction fires:
   → toolbarStatePlugin re-derives state
   → activeMarks now includes "bold"
   → FormatBar re-renders with bold highlighted
```

### 1.5 Complete Flow: User Clicks Image → Block Toolbar Appears → Selects Alignment

```
1. User clicks on an image
   → ImageNodeView.mousedown handler fires
   → Creates NodeSelection at the image's position
   → Dispatches transaction

2. FormatBar.updatePosition() runs:
   → selection instanceof NodeSelection
   → view.nodeDOM(selection.from) returns the image DOM
   → positions bar centered above the image, visible = true

3. toolbarStatePlugin.deriveToolbarState():
   → selection instanceof NodeSelection, node type = "image"
   → selectedBlockType = "image", selectedBlockDef = Image definition
   → blockToolbarItems = Image.toolbar (alignment dropdown + filter dropdown + delete)
   → isNodeSelection = true

4. FormatBar render:
   → toolbarState.isNodeSelection && hasBlockToolbar → true
   → Renders <BlockToolbar items={blockToolbarItems} editor={editor} />

5. BlockToolbar renders:
   → Item 0: "Alignment" type: "dropdown" → <ToolbarDropdown items={[Left,Center,Right]} />
   → Item 1: "Filter" type: "dropdown" → <ToolbarDropdown items={[None,Grayscale,...]} />
   → Item 2: "Delete" type: "button" → <ToolbarButton />

6. User clicks "Alignment" → dropdown opens → clicks "Left"
   → ToolbarDropdown.handleItemClick(item)
   → editor.exec(setImageAlignment("left"))
   → getSelectedImage(state) finds the image
   → tr.setNodeMarkup(pos, undefined, {...attrs, alignment: "left"})
   → dispatch(tr)

7. ImageNodeView.onUpdate(node) fires:
   → applyAlignment(dom, "left") → sets CSS class kanava-image-align-left
   → toolbar re-derives, isActive for "left" now returns true
```

---

## 2. Right-Click Context Menu — Complete Flow

### 2.1 Overview

The context menu uses a **Notion-style grouped layout** with submenus. On right-click anywhere in the editor it shows:

| # | Top-level Item | Type | Description |
|---|----------------|------|-------------|
| 1 | Delete | Action | Deletes the current block |
| 2 | Duplicate | Action | Duplicates the current block |
| — | *divider* | | |
| 3 | Turn into ▸ | Submenu | Block type conversions (9 options) |
| 4 | Columns ▸ | Submenu | Column creation + management |
| — | *divider* | | |
| 5 | Insert below | Action | Inserts an empty paragraph after |
| 6+ | Block-specific | Action(s) | From `BlockDefinition.contextMenu` |

### 2.2 Component Tree

```
apps/playground/src/App.tsx
└── <ContextMenu editor={editor} />                    # packages/react/src/ContextMenu.tsx
    ├── useToolbarState(editor)                         # packages/react/src/hooks.ts
    │   └── getToolbarState() / subscribeToolbarState() # packages/core/src/plugins/toolbarState.ts
    ├── <MenuItemButton>                                # Internal sub-component
    │   ├── <button.kanava-ctx-item>                    # Top-level action or submenu trigger
    │   └── <div.kanava-ctx-submenu>                    # Hover-activated submenu panel
    │       └── <button.kanava-ctx-item> × N            # Submenu items
    └── runCmd(command) → editor.exec(command)           # packages/core/src/editor.ts
```

### 2.3 File-by-File Breakdown

---

#### File: `packages/react/src/ContextMenu.tsx`

**Exports:** `ContextMenu` (React.FC), `ContextMenuProps`

**Imports:**
```ts
import { deleteCurrentBlock, duplicateBlock, insertBlockAfter,
         convertBlockType, createColumnLayout,
         addColumnLeft, addColumnRight } from "@kanava/editor";
```

Note: `moveBlockUp`, `moveBlockDown`, `addColumn`, `removeColumn`, `extractFromColumn` are **not imported** — these operations were removed from the context menu.

Props:
- `editor: KanavaEditor | null`
- `className?: string`

**Types:**

```ts
interface MenuEntry {
  label: string;
  icon: string;
  action?: () => void;
  shortcut?: string;
  divider?: boolean;
  disabled?: boolean;
  children?: MenuEntry[];  // If present, renders a submenu instead of a direct action
}
```

Internal state:
| State variable | Type | Purpose |
|----------------|------|---------|
| `menuRef` | `React.RefObject<HTMLDivElement>` | Ref for the menu div |
| `visible` | `boolean` | Whether the menu is shown |
| `position` | `{top, left}` | Position relative to editor container |
| `inColumn` | `boolean` | Whether cursor is inside a column (enables column-specific options) |
| `openSubmenu` | `string \| null` | Which submenu is currently open (by label), or null |

**Sub-component: `MenuItemButton`**

Renders a single top-level entry. If the entry has `children`, it renders a submenu trigger with `▸` caret and a hover-activated submenu panel.

Props:
- `entry: MenuEntry` — the menu item data
- `onHover: (label: string | null) => void` — callback to open/close submenus
- `openSubmenu: string | null` — currently open submenu label

Hover logic: `onMouseEnter` calls `onHover(entry.label)` for submenu entries, `onHover(null)` for action entries. The parent manages `openSubmenu` state.

**Opening Flow:**

```ts
useEffect(() => {
  dom.addEventListener("contextmenu", handler);
  // handler:
  //   1. preventDefault() — suppress browser context menu
  //   2. Walk $from.depth to check if inside a "column" node → set inColumn
  //   3. Calculate position relative to .kanava-editor-container
  //   4. Clamp to viewport (menuHeight=280, menuWidth=220)
  //   5. setOpenSubmenu(null) — reset any open submenu
  //   6. setVisible(true)
});
```

**Closing Flow:** Mousedown outside or Escape → `closeMenu()` → `setVisible(false)`, `setOpenSubmenu(null)`

**"Turn into" Submenu (9 entries):**

| # | Label | Icon | Command | Disabled when |
|---|-------|------|---------|---------------|
| 1 | Text | ¶ | `convertBlockType("paragraph")` | `blockType === "paragraph"` |
| 2 | Heading 1 | H1 | `convertBlockType("heading", {level: 1})` | `blockType === "heading" && level === 1` |
| 3 | Heading 2 | H2 | `convertBlockType("heading", {level: 2})` | `blockType === "heading" && level === 2` |
| 4 | Heading 3 | H3 | `convertBlockType("heading", {level: 3})` | `blockType === "heading" && level === 3` |
| — | *divider* | | | |
| 5 | Bullet list | • | `convertBlockType("bulletListItem")` | `blockType === "bulletListItem"` |
| 6 | Numbered list | 1. | `convertBlockType("numberedListItem")` | `blockType === "numberedListItem"` |
| 7 | Checklist | ☐ | `convertBlockType("checklistItem")` | `blockType === "checklistItem"` |
| 8 | Quote | ❝ | `convertBlockType("quote")` | `blockType === "quote"` |
| 9 | Code | </> | `convertBlockType("codeBlock")` | `blockType === "codeBlock"` |

**"Columns" Submenu (3–5 entries):**

| # | Label | Icon | Command | Condition |
|---|-------|------|---------|-----------|
| 1 | 2 columns | ▥ | `createColumnLayout(2)` | Always |
| 2 | 3 columns | ▦ | `createColumnLayout(3)` | Always |
| 3 | 4 columns | ⊞ | `createColumnLayout(4)` | Always |
| — | *divider* | | | Only if `inColumn` |
| 4 | Add column left | ⇤ | `addColumnLeft` | Only if `inColumn` |
| 5 | Add column right | ⇥ | `addColumnRight` | Only if `inColumn` |

**Note**: Column nesting is **enabled** — there is no `disabled: inColumn` guard on column creation. Creating columns inside columns is supported per the Option B architecture decision.

**Top-level entries (5 items):**

| # | Label | Icon | Shortcut | Type |
|---|-------|------|----------|------|
| 1 | Delete | 🗑 | Del | Action |
| 2 | Duplicate | ⧉ | Ctrl+D | Action (divider after) |
| 3 | Turn into | ↔ | — | Submenu ▸ |
| 4 | Columns | ▥ | — | Submenu ▸ (divider after) |
| 5 | Insert below | ＋ | — | Action |

**Block-specific items (appended after top-level):**

```ts
const defItems = toolbarState?.contextMenuItems ?? [];
if (defItems.length > 0) {
  entries[entries.length - 1].divider = true;
  for (const item of defItems) {
    const isEnabled = item.isEnabled ? item.isEnabled(editor.pmState) : true;
    entries.push({
      label: item.label,
      icon: item.icon || "•",
      action: () => runCmd(item.command),
      disabled: !isEnabled,
    });
  }
}
```

Items are sourced from `toolbarState.contextMenuItems`, which come from the `BlockDefinition.contextMenu` array of the currently selected block.

**Rendering:**

```tsx
<div className="kanava-context-menu" onMouseLeave={() => setOpenSubmenu(null)}>
  {entries.map((entry, i) => (
    <React.Fragment key={i}>
      <MenuItemButton entry={entry} onHover={setOpenSubmenu} openSubmenu={openSubmenu} />
      {entry.divider && <div className="kanava-ctx-divider" />}
    </React.Fragment>
  ))}
</div>
```

**`runCmd` helper:**
```ts
const runCmd = (cmd: Command) => {
  editor.exec(cmd);
  editor.focus();
  closeMenu();
};
```

---

### 2.4 CSS Structure

The context menu uses these CSS classes in `packages/core/src/styles/editor.css`:

| Class | Purpose |
|-------|---------|
| `.kanava-context-menu` | Absolute-positioned menu container (z-index 100, white bg, border-radius 10px, box-shadow) |
| `.kanava-ctx-item` | Individual menu button (flex row, full-width, hover highlight) |
| `.kanava-ctx-item.disabled` | Greyed out, pointer-events none |
| `.kanava-ctx-item.has-submenu` | Reduced right padding (caret takes the space) |
| `.kanava-ctx-icon` | Icon span (16px wide, text-align center) |
| `.kanava-ctx-label` | Label text (flex-grow) |
| `.kanava-ctx-shortcut` | Right-aligned keyboard shortcut text (smaller, muted) |
| `.kanava-ctx-caret` | Right-pointing `▸` indicator for submenu triggers (10px, #999) |
| `.kanava-ctx-divider` | 1px separator line with vertical margin |
| `.kanava-ctx-item-wrap` | `position: relative` wrapper — anchor point for submenu positioning |
| `.kanava-ctx-submenu` | Absolute-positioned submenu panel (`left: calc(100% + 4px)`, `top: -4px`, same visual styling as parent, min-width 180px, z-index 101) |

---

### 2.5 Complete Flow: User Right-Clicks a Paragraph → Clicks "Duplicate"

```
1. User right-clicks on a paragraph
   → browser fires "contextmenu" event on editor DOM

2. ContextMenu's useEffect handler fires:
   → preventDefault() — suppresses browser menu
   → Walks $from.depth: no "column" ancestor → inColumn = false
   → Positions menu at click coordinates relative to container
   → setVisible(true)

3. useToolbarState(editor) returns ToolbarState:
   → selectedBlockType = "paragraph"
   → contextMenuItems = [] (paragraph has no custom context menu)

4. ContextMenu builds entries:
   → Top-level: Delete, Duplicate, Turn into ▸, Columns ▸, Insert below
   → No block-specific items (empty contextMenuItems)

5. User clicks "Duplicate"
   → runCmd(duplicateBlock) → editor.exec(duplicateBlock)
   → duplicateBlock(state, dispatch) in commands/block.ts
   → findBlockNode(state) → finds the blockNode
   → Copies the node, inserts after, dispatches
   → closeMenu()
```

### 2.6 Complete Flow: User Right-Clicks → Hovers "Turn into" → Clicks "Heading 2"

```
1. Right-click → menu opens (same as 2.5 step 1-4)

2. User hovers over "Turn into" entry:
   → MenuItemButton.onMouseEnter fires
   → onHover("Turn into") → setOpenSubmenu("Turn into")
   → Re-render: "Turn into" entry's isOpen = true
   → Submenu panel appears to the right with 9 block type options

3. User clicks "Heading 2" in the submenu:
   → child button onClick fires
   → runCmd(convertBlockType("heading", { level: 2 }))
   → editor.exec(convertBlockType("heading", { level: 2 }))
   → ProseMirror transaction: changes blockBody type to heading with level=2
   → closeMenu()
```

### 2.7 Complete Flow: User Right-Clicks Inside a Column → Adds Column Right

```
1. Right-click inside a column:
   → contextmenu handler fires
   → Walks $from.depth: finds "column" ancestor → inColumn = true
   → Menu opens

2. Top-level entries: Delete, Duplicate, Turn into ▸, Columns ▸, Insert below
   → "Columns" submenu has 5 items (3 creation + divider + 2 directional)

3. User hovers "Columns" → submenu opens
   → Shows: 2 columns, 3 columns, 4 columns, ─, Add column left, Add column right

4. User clicks "Add column right":
   → runCmd(addColumnRight)
   → Inserts a new column to the right of the current column
   → closeMenu()
```

---

## 3. Design Decisions

### 3.1 Why Submenus Instead of Flat List?

The original context menu had 14+ flat entries (Insert, Duplicate, Delete, Move Up, Move Down, 3 column options, Extract, Add, Remove, Turn into text/heading/bullet/checklist). This was:
- **Cluttered**: too many items competing for attention
- **Poorly organized**: column operations mixed with block conversions
- **Missing options**: no H1/H3 distinction, no numbered list, no quote, no code

The Notion-style redesign:
- **5 top-level items** (compact, scannable)
- **"Turn into" submenu**: 9 block types with proper heading level distinction
- **"Columns" submenu**: creation + directional add (only when relevant)

### 3.2 Why No Move Up/Down?

Move Up/Down was removed because:
- **Drag handle** already provides this (more intuitive, visual)
- **Keyboard shortcuts** `Ctrl+Shift+↑/↓` already available
- Context menu should be for actions without better affordances elsewhere

### 3.3 Why No `disabled: inColumn` on Column Creation?

Column nesting is **enabled by design** (Option B architecture). A block inside a column can be converted to a nested column layout. The `createColumnLayout` command handles this correctly — the nesting guard was removed during the Option B migration.

### 3.4 Image Block Has Empty contextMenu

The Image block defines `contextMenu: []` (empty). All block-level operations (delete, duplicate, etc.) are handled by the standard context menu entries. The Image block's `toolbar` array provides image-specific actions (alignment, filter, delete) in the FormatBar when the image is selected.

---

## 4. Summary of All Files Involved

### FormatBar Flow

| File | Key exports/functions | Role |
|------|----------------------|------|
| `packages/react/src/FormatBar.tsx` | `FormatBar` component | Renders floating bar, decides text vs block mode |
| `packages/react/src/hooks.ts` | `useToolbarState()` | React hook bridging core plugin → React |
| `packages/core/src/plugins/toolbarState.ts` | `toolbarStatePlugin()`, `deriveToolbarState()`, `getToolbarState()`, `subscribeToolbarState()`, `ToolbarState`, `toolbarStateKey` | Core headless state derivation |
| `packages/react/src/ToolbarPrimitives.tsx` | `ToolbarButton`, `ToolbarGroup`, `ToolbarSeparator`, `ToolbarDropdown`, `BlockToolbar` | Reusable toolbar UI atoms |
| `packages/core/src/extensions/defineBlock.ts` | `ToolbarItem`, `ToolbarDropdownItem`, `ContextMenuItem`, `BlockDefinition` | Data types for toolbar/menu items |
| `packages/core/src/blocks/image.ts` | `Image` (BlockDefinition with `toolbar`, empty `contextMenu`) | Image block's toolbar config |
| `packages/core/src/commands/text.ts` | `toggleBold()`, `toggleItalic()`, etc., `setTextAlign()` | Text formatting commands |
| `packages/core/src/commands/image.ts` | `setImageAlignment()`, `setImageFilter()`, `getSelectedImage()` | Image-specific commands |
| `packages/core/src/commands/block.ts` | `convertBlockType()`, `deleteCurrentBlock`, `duplicateBlock` | Block operations used by toolbar |
| `packages/core/src/editor.ts` | `KanavaEditor.exec()`, constructor (wires up plugin) | Command execution |
| `packages/core/src/nodeViews/ImageNodeView.ts` | `ImageNodeView.mousedown` handler | Creates NodeSelection on image click |
| `apps/playground/src/App.tsx` | `<FormatBar editor={editor} />` | Mounts the FormatBar |

### Context Menu Flow

| File | Key exports/functions | Role |
|------|----------------------|------|
| `packages/react/src/ContextMenu.tsx` | `ContextMenu`, `MenuItemButton` (internal) | Renders right-click menu with submenus |
| `packages/react/src/hooks.ts` | `useToolbarState()` | Provides `contextMenuItems` from current block |
| `packages/core/src/plugins/toolbarState.ts` | `deriveToolbarState()` → `contextMenuItems` | Resolves block-specific menu items |
| `packages/core/src/extensions/defineBlock.ts` | `ContextMenuItem` interface | Data shape for menu items |
| `packages/core/src/commands/block.ts` | `insertBlockAfter()`, `deleteCurrentBlock`, `duplicateBlock`, `convertBlockType()` | Standard block commands |
| `packages/core/src/commands/columns.ts` | `createColumnLayout()`, `addColumnLeft`, `addColumnRight` | Column commands |
| `packages/core/src/editor.ts` | `KanavaEditor.exec()` | Command execution |
| `apps/playground/src/App.tsx` | `<ContextMenu editor={editor} />` | Mounts the ContextMenu |

---

## 5. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│  User Interaction                                                    │
│  (text selection, image click, right-click)                          │
└────────┬───────────────────────────────┬─────────────────────────────┘
         │                               │
         ▼                               ▼
┌────────────────────┐          ┌────────────────────┐
│  ProseMirror       │          │  DOM Event          │
│  Selection Change  │          │  (contextmenu)      │
└────────┬───────────┘          └────────┬────────────┘
         │                               │
         ▼                               │
┌────────────────────────────┐           │
│  toolbarStatePlugin        │           │
│  (core, headless)          │           │
│                            │           │
│  deriveToolbarState() ─────┤           │
│    ├─ activeMarks          │           │
│    ├─ selectedBlockType    │           │
│    ├─ selectedBlockDef     │           │
│    ├─ blockToolbarItems    │           │
│    ├─ contextMenuItems     │           │
│    ├─ isNodeSelection      │           │
│    └─ selectionEmpty       │           │
│                            │           │
│  notifies listeners ───────┤           │
└────────────────────────────┘           │
         │                               │
         ▼                               ▼
┌────────────────────┐          ┌────────────────────────────────────┐
│  useToolbarState() │          │  ContextMenu.tsx                    │
│  (React hook)      │          │  (contextmenu event listener)      │
│                    │          │                                     │
│  useSyncExternal   │          │  1. Detect inColumn                │
│  Store             │◀─────── │  2. Build top-level entries         │
└────────┬───────────┘          │  3. Build "Turn into" submenu      │
         │                      │  4. Build "Columns" submenu        │
    ┌────┴────┐                 │  5. Append block-def items         │
    │         │                 │  6. Render MenuItemButton per entry │
    ▼         ▼                 └────────────────┬───────────────────┘
┌────────┐ ┌──────────┐                          │
│FormatBar│ │ContextMenu│                         │
│         │ │ (renders) │                         │
│ Text    │ └──────────┘                          │
│ mode    │                                       │
│ Block   │                                       │
│ mode    │                                       │
└────┬────┘                                       │
     │                                            │
     ▼                                            ▼
┌──────────────────────────────────────────────────────┐
│  editor.exec(command)                                 │
│  → command(state, dispatch)                           │
│  → ProseMirror transaction                            │
│  → view rebuild + toolbarStatePlugin re-derives state │
└──────────────────────────────────────────────────────┘
```

---

## 6. Additional Toolbar Components

Beyond FormatBar and ContextMenu, the React package includes these toolbar-related components that also consume `toolbarStatePlugin` state:

| Component | File | Purpose |
|-----------|------|---------|
| `FixedToolbar` | `packages/react/src/FixedToolbar.tsx` | Word-style ribbon toolbar (block type, font, marks, alignment, link, paragraph formatting). Uses `useToolbarState()` and `useSelectionInfo()`. |
| `FindReplaceBar` | `packages/react/src/FindReplaceBar.tsx` | Search/replace UI. Uses `findReplacePlugin` state via `useFindReplace()` hook. |
| `ZoomControls` | `packages/react/src/ZoomControls.tsx` | Zoom slider/buttons. Reads `editor.getZoom()` and calls `editor.setZoom()`. |
| `DocumentTree` | `packages/react/src/DocumentTree.tsx` | Sidebar block hierarchy tree. Uses `documentStructurePlugin` state, not `toolbarStatePlugin`. |

These components follow the same pattern as FormatBar: headless plugin derives state in core, React hook bridges to the component.
