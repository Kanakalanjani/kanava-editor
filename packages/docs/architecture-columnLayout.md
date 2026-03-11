---
anchored-to:
  - packages/core/src/nodeViews/ColumnLayoutView.ts
  - packages/core/src/commands/columns.ts
  - packages/core/src/commands/columnBackspace.ts
  - packages/core/src/commands/columnNav.ts
  - packages/core/src/styles/columns.css
  - packages/core/src/schema/structuralNodes.ts
  - packages/core/src/blocks/columnLayout.ts
  - packages/react/src/SeparatorMenu.tsx
last-verified: 2026-03-06
---

# Kanava Editor — Column Layout Architecture

> **Purpose**: End-to-end documentation of the column layout system — schema, NodeViews, resize drag, commands, CSS, API serialization, separator system, and plugin interactions.
>
> **Last updated**: After Phase 9 completion (pixel-width labels, 60px absolute minimum, visual feedback at limits).

---

## 1. Document Hierarchy (Option B)

Column layouts use **Option B architecture**: the `columnLayout` node lives inside a `blockNode` wrapper, not as a sibling.

```
doc
  └── blockGroup
        └── blockNode  ← wrapper (carries id, textAlign, backgroundColor, spacing, etc.)
              └── columnLayout  (attrs: separatorStyle, separatorColor, separatorWidth)
                    ├── column { width: 1 }
                    │     ├── blockNode > paragraph
                    │     └── blockNode > heading
                    └── column { width: 1.5 }
                          └── blockNode > paragraph
```

### Why Option B?

- The wrapper `blockNode` provides a **uniform ID, drag-handle attachment point, selection decoration, and block-level styles** for every top-level element.
- `columnLayout` itself only handles column-specific concerns (separator appearance).
- Column nesting is **allowed** — a `column` can contain a `blockNode > columnLayout > column+` subtree with no depth guard.

### Content expression

```
blockNode:  "(blockBody blockGroup?) | columnLayout"
column:     "blockNode+"
columnLayout: "column column+"
```

A `blockNode` is either a regular `(blockBody blockGroup?)` block or a `columnLayout`. The two branches are mutually exclusive.

---

## 2. Schema Nodes

### 2.1 `column` — `structuralNodes.ts`

| Property | Value |
|----------|-------|
| **group** | `"block container"` |
| **content** | `"blockNode+"` |
| **isolating** | `true` |
| **attrs** | `width: { default: 1 }` — flex-grow ratio |

`toDOM` renders:
```html
<div class="kanava-column" data-width="1" style="flex-grow: 1; flex-basis: 0">
```

`parseDOM` reads `data-width` from `<div class="kanava-column">`.

The `width` attribute is a **flex-grow ratio**, not a pixel value. Two columns with `width: 1` are equal. One with `width: 2` vs `width: 1` gives a 2:1 ratio.

### 2.2 `columnLayout` — `blocks/columnLayout.ts` (via `defineBlock()`)

| Property | Value |
|----------|-------|
| **group** | `"layout"` (not `"blockBody"` — structural) |
| **content** | `"column column+"` (minimum 2 columns) |
| **defining** | `true` |
| **isolating** | `true` |
| **attrs** | `separatorStyle` (`"ghost"` \| `"visible"`), `separatorColor` (CSS color \| null), `separatorWidth` (px, 1–8) |

`toDOM` renders:
```html
<div class="kanava-column-layout" data-separator-style="visible" data-separator-color="#ccc">
```

---

## 3. NodeViews — `nodeViews/ColumnLayoutView.ts`

Two NodeViews are defined in this file: `ColumnLayoutView` (the layout container) and `ColumnView` (individual columns).

### 3.1 ColumnLayoutView

**Extends**: `KanavaNodeView`

#### DOM structure produced by `render()`:

```
div.kanava-column-layout              ← dom (positioned: relative)
  ├── div.kanava-column-layout-inner   ← contentDOM (flex container, ProseMirror renders columns here)
  └── div.kanava-column-gutter-layer   ← gutterLayer (absolute overlay, pointer-events: none)
        ├── div.kanava-column-gutter    ← gutter 0 (between col 0 and col 1)
        ├── div.kanava-column-gutter    ← gutter 1 (between col 1 and col 2)
        └── ...
```

#### Private fields

| Field | Type | Purpose |
|-------|------|---------|
| `gutterLayer` | `HTMLElement` | Absolute overlay for gutter elements |
| `gutters` | `HTMLElement[]` | Array of gutter divs (one per column boundary) |
| `resizeObserver` | `ResizeObserver \| null` | Fires `positionGutters()` when the flex container resizes |
| `mutationObserver` | `MutationObserver \| null` | Fires `rebuildGutters()` when ProseMirror adds/removes column DOM children |
| `resizing` | `boolean` | True during active drag — suppresses other updates |
| `cleanupResize` | `(() => void) \| null` | Stored `onMouseUp` handler for cleanup on destroy |

#### Initialization flow

1. `render()` creates the DOM structure.
2. `ResizeObserver` is attached to `contentDOM` → calls `positionGutters()`.
3. `MutationObserver` is attached to `contentDOM` → calls `rebuildGutters()`.
4. A `requestAnimationFrame` calls `rebuildGutters()` — this is critical for **pre-loaded/deserialized content** where MutationObserver misses the initial ProseMirror render.

#### `onUpdate()`

Called by ProseMirror on every transaction that touches this node. Schedules `rebuildGutters()` via `requestAnimationFrame` **unless `this.resizing` is true** (prevents drag interference).

#### `rebuildGutters()`

1. Clears `gutterLayer.innerHTML` and resets `this.gutters`.
2. Queries `contentDOM.children` filtered by `.kanava-column` class.
3. For each column boundary (count − 1), creates a gutter `<div>`:
   - Sets `.kanava-separator-visible` class if `separatorStyle === "visible"`.
   - Applies custom CSS vars `--kanava-sep-color`, `--kanava-sep-width`.
   - Attaches `mousedown` (start resize), `dblclick` (reset to equal), `contextmenu` (separator menu) listeners.
4. Calls `positionGutters()`.

#### `positionGutters()`

Positions each gutter at the midpoint between adjacent columns:

```
gutterCenter = (leftCol.right + rightCol.left) / 2 − layerRect.left
gutter.style.left = `${gutterCenter − 6}px`   // 6px = half of 12px gutter width
gutter.style.height = `${layerRect.height}px`
```

**Coordinate reference**: Uses `gutterLayer.getBoundingClientRect()` (not `contentDOM`) since gutters are absolutely positioned inside the gutter layer.

**Skipped during resize**: The drag handler owns `gutter.style.left` during active drag, so `positionGutters()` returns early when `this.resizing === true`.

#### `startResize(leftIndex, startEvent)`

Full drag lifecycle:

1. **Guard**: Returns if already `this.resizing === true`.
2. **Disconnect ResizeObserver** — prevents feedback loop where flexGrow changes trigger `positionGutters()` during drag.
3. **Capture initial measurements**:
   - `totalWidth = leftCol.clientWidth + rightCol.clientWidth`
   - `startX = startEvent.clientX`
   - `leftStartWidth = leftCol.clientWidth`
   - `gutterStartLeft = parseFloat(gutter.style.left)`
4. **Set visual feedback**: `document.body.style.cursor = "col-resize"`, `document.body.style.userSelect = "none"`, add `.kanava-resizing` to `view.dom`.
5. **`onMouseMove(e)`**: 
   - `dx = e.clientX − startX`
   - `newLeftWidth = clamp(minWidth, totalWidth − minWidth, leftStartWidth + dx)` (min 10%)
   - Sets `leftCol.style.flexGrow` and `rightCol.style.flexGrow` proportionally
   - Positions gutter via delta: `gutter.style.left = gutterStartLeft + computedDx`
6. **`onMouseUp()`**:
   - Removes document listeners.
   - Clears `this.resizing`, restores cursor/selection.
   - **Reconnects ResizeObserver** on `contentDOM`.
   - Calls `positionGutters()` for final truth.
   - Calls `commitColumnWidths()` to persist to ProseMirror.

#### `commitColumnWidths(leftIdx, leftWidth, rightIdx, rightWidth)`

Walks `this.node.children` to find the correct column offsets, then dispatches a transaction with `tr.setNodeMarkup()` for each affected column, setting the new `width` attr.

#### `resetAllColumnWidths()`

Triggered by double-clicking any gutter. Iterates all columns and sets `width: 1` on each.

#### `stopEvent(event)`

During active resize (`this.resizing === true`), blocks **all** events on gutter elements to prevent ProseMirror from interfering. When not resizing, only blocks `mousedown`, `dblclick`, and `contextmenu`.

#### `ignoreMutation(mutation)`

Returns `true` for:
- Anything inside `.kanava-column-gutter-layer` or `.kanava-column-gutter`
- Attribute mutations on `.kanava-column-layout-inner` (e.g., style changes from flexGrow updates)

#### `destroy()`

Cleans up active resize (calls `cleanupResize()`), disconnects both observers.

---

### 3.2 ColumnView

**Extends**: `KanavaNodeView`

#### `render(node)`

```html
<div class="kanava-column" style="flex-grow: {width}; flex-basis: 0">
```

Sets both `flexGrow` (from `width` attr) and `flexBasis: 0` (ensures proportional sizing regardless of content).

#### `onUpdate(node)`

Syncs `dom.style.flexGrow` from `node.attrs.width`. **Critical guard**: during active column resize (`view.dom.classList.contains("kanava-resizing")`), this is a **no-op**. Without this guard, transactions from other plugins (e.g., ghostRail) would overwrite the drag handler's live flexGrow values with stale node attrs, causing visible flicker/disconnect.

#### `ignoreMutation(mutation)`

Returns `true` for attribute mutations on `this.dom` — prevents ProseMirror from re-rendering when the drag handler modifies `flexGrow` inline.

---

## 4. CSS — `styles/columns.css`

### 4.1 Layout

| Selector | Key Properties |
|----------|---------------|
| `.kanava-column-layout` | `position: relative` (for absolute gutter layer), dashed border on hover |
| `.kanava-column-layout-inner` | `display: flex; gap: 16px; width: 100%` |
| `.kanava-column` | `flex-basis: 0; min-width: 0; overflow: hidden; overflow-wrap: break-word; word-break: break-word` |

### 4.2 Resize gutter

| Selector | Key Properties |
|----------|---------------|
| `.kanava-column-gutter-layer` | `position: absolute; inset: 0; pointer-events: none; z-index: 5` |
| `.kanava-column-gutter` | `position: absolute; width: 12px; cursor: col-resize; pointer-events: auto` |
| `.kanava-column-gutter::after` | 2px accent line (transparent default, blue on hover/drag) |
| `.kanava-column-gutter:hover::after`, `.is-dragging::after` | `background: var(--kanava-accent-color, #4285f4)` |

### 4.3 Resize state (on `<body>` / editor root)

| Selector | Purpose |
|----------|---------|
| `.kanava-resizing, .kanava-resizing *` | `user-select: none !important; cursor: col-resize !important` — prevents text selection during drag |
| `.kanava-resizing .kanava-column` | `overflow: hidden` — forces columns to shrink past content intrinsic width |

### 4.4 Compact mode

`.kanava-layout-compact` variants: removes padding, margins, borders, and reduces gap to 4px.

### 4.5 Content overflow

Images, videos, iframes get `max-width: 100%`. Code blocks and tables get `overflow-x: auto`.

### 4.6 Visible separator

`.kanava-column-gutter.kanava-separator-visible::after` always shows the accent line using `--kanava-sep-color` custom property.

---

## 5. Commands — `commands/columns.ts`

### 5.1 `createColumnLayout(numColumns = 2): Command`

**Purpose**: Wraps the current `blockNode` into a column layout.

**Transform**:
```
Before: blockGroup > blockNode(content)
After:  blockGroup > blockNode(wrapper) > columnLayout > column+ > blockNode+
```

- First column receives the original block's content.
- Remaining columns get empty paragraphs.
- Cursor is placed in the second column's paragraph.

### 5.2 `addColumn: Command`

Appends a new column (with empty paragraph) to the end of the current `columnLayout`.

### 5.3 `addColumnLeft: Command`

Inserts a new column **before** the column containing the cursor.

### 5.4 `addColumnRight: Command`

Inserts a new column **after** the column containing the cursor.

### 5.5 `removeColumn: Command`

Removes the current column. Special behavior:
- **≤2 columns remaining**: Dissolves the entire `columnLayout`. Extracts the remaining column's blocks into the parent `blockGroup`.
- **>2 columns**: Removes just this column. Cursor moves to the adjacent column.

### 5.6 `setColumnWidth(width: number): Command`

Sets the `width` (flex-grow) attr on the column containing the cursor.

---

## 6. Commands — `commands/columnBackspace.ts`

### 6.1 `handleBackspaceInColumn: Command`

Handles Backspace at the start of an empty block inside a column:

1. If block isn't empty or cursor isn't at start → pass through.
2. If block isn't a paragraph → convert to paragraph.
3. If sibling blocks exist → delete this block, move cursor to adjacent.
4. If only block in column:
   - **≤2 columns** → dissolve entire layout.
   - **>2 columns** → remove just this column.

### 6.2 `extractFromColumn: Command`

Extracts the current block from its column and places it **after** the wrapper `blockNode`:

- If only block in column and only 2 columns → dissolve layout, interleave blocks.
- If only block in column and >2 columns → remove column, insert block after layout.
- If multiple blocks in column → move just this block out.

---

## 7. Commands — `commands/columnNav.ts`

### 7.1 `exitColumnUp: Command`

**Trigger**: ArrowUp at the very start of the **first** column.  
**Action**: Moves cursor to the end of the block **before** the wrapper `blockNode`.

### 7.2 `exitColumnDown: Command`

**Trigger**: ArrowDown at the very end of the **last** column.  
**Action**: Moves cursor to the start of the block **after** the wrapper `blockNode`.

### Helper functions

- `atColumnStart($pos)` → column depth or −1
- `atColumnEnd($pos)` → column depth or −1

Both walk the resolve chain checking if the cursor is at the logical start/end of a column, accounting for nested node structure.

---

## 8. API Serialization — `api/blockTree.ts`

### 8.1 PM → KanavaBlock

`blockNodeToKanava()` checks if the first child of a `blockNode` is `columnLayout`. If so, it delegates to `columnLayoutToKanava()`:

```ts
function columnLayoutToKanava(wrapperNode: PMNode): KanavaColumnLayout {
  // Iterates columnLayout.children → KanavaColumn[]
  // Each column: { width, blocks: KanavaBlock[] }
  return { type: "columnLayout", columns, id, styles, separatorStyle, separatorColor, separatorWidth }
}
```

### 8.2 KanavaBlock → PM

`kanavaBlockToNode()` detects `block.type === "columnLayout"` and delegates to `columnLayoutToNode()`:

```ts
function columnLayoutToNode(block: KanavaColumnLayout, schema: Schema): PMNode {
  // Builds: schema.nodes.blockNode.create(attrs, columnLayout)
  // columnLayout = schema.nodes.columnLayout.create(separatorAttrs, columns)
  // Each column = schema.nodes.column.create({ width }, blockNodes)
}
```

### 8.3 Type definitions — `api/types.ts`

```ts
interface KanavaColumnLayout {
  type: "columnLayout";
  id: string;
  columns: KanavaColumn[];
  styles?: KanavaBlockStyles;
  separatorStyle?: "ghost" | "visible";
  separatorColor?: string | null;
  separatorWidth?: number;
}

interface KanavaColumn {
  width: number;
  blocks: KanavaBlock[];
}
```

---

## 9. React Components

### 9.1 SeparatorMenu — `react/src/SeparatorMenu.tsx`

Right-click context menu for column separator customization.

**Event flow**:
1. User right-clicks a gutter → `ColumnLayoutView.rebuildGutters()` attaches a `contextmenu` handler.
2. Handler dispatches `CustomEvent("kanava:separator-menu")` with `{ pos, x, y, separatorStyle, separatorColor, separatorWidth }` in detail.
3. `SeparatorMenu` listens on `editor.pmView.dom` for this custom event.
4. Positions itself relative to the editor container.

**Controls**:
- Style toggle: ghost / visible
- Color picker: 8 preset colors + custom input
- Width slider: 1–8px

**Updates**: Calls `editor.pmView.dispatch(tr.setNodeMarkup(state.pos, undefined, { ...attrs, ...updates }))` on the `columnLayout` node.

---

## 10. Plugin Interactions

### 10.1 Ghost Rail (`plugins/ghostRail.ts`)

Ghost rail adds hierarchy indicator decorations. It **explicitly excludes** column gutter elements:

```ts
// In mouseover handler:
if (closest(".kanava-column-gutter-layer") || closest(".kanava-column-gutter")) return;
```

**Indirect interaction**: Ghost rail dispatches transactions on `mousemove` (throttled ~60ms). Before the drag-flicker fix, these transactions triggered `ColumnView.onUpdate()` which overwrote the drag handler's live `flexGrow`. Now guarded by the `.kanava-resizing` check.

### 10.2 Drag Handle (`plugins/dragHandle.ts`)

The wrapper `blockNode`'s `BlockNodeView` provides the drag handle. Column layouts can be dragged as a whole unit. No interference with resize gutters.

`handleDrop` intercepts **all** `blockNode` drops (not just column-source extractions). Drop target resolution uses `findDropTarget()` — a DOM-rect-based algorithm that compares `dropY` against child bounding rect midpoints to determine insertion index. This is independent of which text character `posAtCoords` resolved to, eliminating X-coordinate sensitivity.

When dragging from inside a column to outside, `preferTopLevel` flag skips column-level parents so the block lands in the top-level `blockGroup`. Same-column reordering passes through to ProseMirror's default handler. Column-source drops still handle dissolution (removing column when last block is extracted).

### 10.5 GapCursor + Enter (`commands/gapCursorInsert.ts`)

When a column layout is at the edge of a `blockGroup`, no text positions exist at the container level — `posAtCoords`, `splitBlockNode`, and other text-position-dependent operations resolve deep inside column content.

The `insertBlockAtGapCursor` command (in the keymap Enter chain) checks for `GapCursor` selection. If found, it creates a `blockNode > paragraph` at the gap position and places the cursor inside. Combined with `exitColumnUp`/`exitColumnDown` (which create paragraphs when arrowing out of boundary columns), this provides full keyboard-driven block insertion before/after column layouts.

### 10.3 Selection (`plugins/selection.ts`)

Adds focused/selected CSS classes via `Decoration.node`. No interference with column resize.

### 10.4 Block ID (`plugins/blockId.ts`)

Ensures every `blockNode` gets a unique `id` attr. Works on the wrapper `blockNode` and all `blockNode` children inside columns.

---

## 11. Editor Wiring — `editor.ts`

NodeViews are registered in the `EditorView` constructor:

```ts
nodeViews: {
  column: (node, view, getPos) =>
    new ColumnView(node, view, getPos as () => number | undefined),
  columnLayout: (node, view, getPos) =>
    new ColumnLayoutView(node, view, getPos as () => number | undefined),
}
```

Note: `columnLayout` is defined via `defineBlock()` (in `blocks/columnLayout.ts`) but its NodeView is registered **manually** in `editor.ts` rather than through the block definition — because it needs the specialized `ColumnLayoutView` with resize gutter logic.

---

## 12. Resize Algorithm Summary

```
mousedown on gutter
  ├── Record: totalWidth, startX, leftStartWidth, gutterStartLeft,
  │          pairFlex (startLeftFlex + startRightFlex)
  ├── Disconnect ResizeObserver
  ├── Add .kanava-resizing to editor root
  │
  ├── mousemove (repeated)
  │     ├── dx = clientX − startX
  │     ├── newLeftWidth = clamp(10%, 90%, leftStartWidth + dx)
  │     ├── leftFraction = newLeftWidth / totalWidth
  │     ├── leftCol.style.flexGrow = leftFraction * pairFlex
  │     ├── rightCol.style.flexGrow = (1 − leftFraction) * pairFlex
  │     └── gutter.style.left = gutterStartLeft + computedDx
  │
  └── mouseup
        ├── Remove event listeners
        ├── Clear .kanava-resizing
        ├── Reconnect ResizeObserver
        ├── positionGutters() (final dom-truth positioning)
        └── commitColumnWidths() → ProseMirror transaction
```

Note: `pairFlex` preserves the combined flex sum of the two adjacent columns being resized. This ensures untouched columns keep their original flex values — fixing the "jump" bug on 3+ column layouts.

### Pixel-width labels and minimum enforcement

During keyboard/mouse resize and on hover (Ctrl+\\), `showWidthLabels()` displays the actual rendered column widths as pixel values ("240px") instead of flex proportions. This is more useful for users who think in absolute dimensions rather than relative ratios.

**60px absolute minimum**:
- `MIN_COL_PX = 60` constant enforced in `onMouseMove` during drag and `resizeByKeyboard()`
- Applies regardless of nesting depth or number of columns
- Replaces previous relative 10% minimum (which could be < 20px in nested/multi-col layouts)

**Visual feedback at minimum**:
- When column width ≤ 64px, label element gets `.kanava-column-width-label--at-min` class (red color `#ef4444`, red border)
- Gutter element gets `.kanava-gutter--at-min` class during drag (`cursor: not-allowed !important`)
- Clear visual signal when further resizing is blocked

### Key invariants during drag

1. **ResizeObserver is disconnected** — prevents feedback loop.
2. **ColumnView.onUpdate() is a no-op** when `.kanava-resizing` is on the editor root — prevents ghost rail / other plugin transactions from overwriting live flexGrow.
3. **CSS `overflow: hidden`** on `.kanava-column` during resize — prevents text content from blocking the slider's movement.
4. **CSS `user-select: none`** on everything during resize — prevents accidental text selection.
5. **`stopEvent()` blocks all events on gutters** during resize — prevents ProseMirror from processing mouse events.

---

## 13. File Reference

| File | Package | Purpose |
|------|---------|---------|
| `schema/structuralNodes.ts` | core | `column` NodeSpec (width attr, flex-grow toDOM) |
| `blocks/columnLayout.ts` | core | `columnLayout` BlockDefinition (separator attrs) |
| `nodeViews/ColumnLayoutView.ts` | core | ColumnLayoutView + ColumnView (resize gutters, drag) |
| `commands/columns.ts` | core | create, add, remove, set-width commands |
| `commands/columnBackspace.ts` | core | Backspace + extract-from-column commands |
| `commands/columnNav.ts` | core | Arrow key column exit commands |
| `commands/gapCursorInsert.ts` | core | GapCursor + Enter block insertion |
| `styles/columns.css` | core | All column layout CSS |
| `api/blockTree.ts` | core | PM ↔ KanavaBlock serialization for columns |
| `api/types.ts` | core | `KanavaColumnLayout`, `KanavaColumn` types |
| `editor.ts` | core | NodeView wiring |
| `plugins/ghostRail.ts` | core | Ghost rail (excludes gutters, indirect interaction) |
| `SeparatorMenu.tsx` | react | Right-click separator customization UI |
