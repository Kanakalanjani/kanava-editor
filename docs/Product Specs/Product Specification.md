# Product Specification: Kanava Editor

> Kanava is an open-source, ProseMirror-based block editor SDK that combines the structural power of Notion with the formatting depth of Google Docs.

---

## 1. Document Modes

### 1.1 Pageless Mode (Infinite Canvas)
- Unlimited vertical expansion
- Web-first content creation
- No page boundaries

### 1.2 Paginated Mode (Document Canvas)
- Fixed page sizes: A4, Letter, Legal, Custom
- Configurable margins (top, right, bottom, left)
- Decoration-based page breaks with atomic block shifting
- Page break attrs: `pageBreakBefore`, `keepWithNext`, `keepLinesTogether`, `widowOrphan`

---

## 2. Block System

### 2.1 Current Blocks (12 types)

| Category | Blocks |
|----------|--------|
| **Text** | Paragraph, Heading (H1–H6), Quote, Code Block |
| **Lists** | Bullet List, Numbered List, Checklist |
| **Media** | Image (upload, resize, crop, filter, caption) |
| **Layout** | Column Layout (2–4+ columns, nesting, resize) |
| **Interactive** | Toggle (collapsible), Callout (info/warning/error/success) |
| **Structural** | Divider |

### 2.2 Planned Blocks
- Table (rows × columns)
- Video (embed URL)
- Bookmark / Link Preview
- File Attachment

See [Phase 5: Block Types](../plans/phases/phase-5-block-types.md)

### 2.3 Block-Level Styling

Every block supports universal styling via the `blockNode` wrapper:

| Property | Status |
|----------|--------|
| Text Alignment (L/C/R/J) | ✅ |
| Background Color | ✅ |
| Spacing (top/bottom margins) | ✅ |
| Line Height | ✅ |
| Padding (top/right/bottom/left) | ✅ |
| Borders (color, width, style, radius) | ✅ |
| First-line Indent | ✅ |
| Letter Spacing | ✅ |

### 2.4 Inline Formatting (12 marks)

| Category | Marks |
|----------|-------|
| **Basic** | Bold, Italic, Underline, Strikethrough, Inline Code |
| **Color** | Text Color, Background Highlight |
| **Links** | Hyperlinks (href, target, rel) |
| **Typography** | Font Size, Font Family, Superscript, Subscript |

---

## 3. Interaction Design

### 3.1 Hover Drag Handle
- 3-dot grip at top-left edge, appears on hover
- `position: absolute` — zero reserved padding
- Click = NodeSelection, Drag = move block

### 3.2 Four Interaction Points
1. **Left Sidebar** (BlockPicker) — drag/click to insert blocks
2. **Top Toolbar** (FixedToolbar) — Word-style formatting ribbon
3. **Floating Toolbar** (FormatBar) — lightweight B/I/U/S on text selection
4. **Right-Click Menu** (ContextMenu) — grouped actions with submenus

### 3.3 Ghost Rail
- Translucent hierarchy lines on hover showing nesting depth
- Smart breadcrumb tooltip via `GhostRail` React component
- Works best in pageless mode; alternative Document Tree sidebar for paginated/canvas layouts

### 3.4 Canvas Mode (Interaction Mode Plugin)
- Click a block → NodeSelection (blue outline, no cursor)
- Double-click → enter text editing inside the block
- Escape → return to block selection
- Eliminates "left-edge tax" — no drag handles, no hover zones needed
- Resume builder uses canvas mode as its default interaction model

### 3.5 Multi-Block Selection
- Click-drag across block boundaries → all intermediate blocks get blue highlight (Notion-style)
- Shift+Click extends block selection range
- Shift+Arrow expands/contracts by one block
- Delete/Backspace removes all selected blocks
- Typing replaces all selected with a new paragraph
- Custom `MultiBlockSelection` ProseMirror Selection class

### 3.6 Document Tree
- Live sidebar panel showing document structure as a collapsible tree
- Click to navigate to any block
- Shows headings, lists, images, columns, etc.
- Powered by `documentStructurePlugin` in core

---

## 4. Document-Level Styling

Global defaults that cascade to all blocks:
- `DocumentStyle` config via `editor.setDocumentStyle()`: line-height, paragraph-gap, font-size, font-family
- Spacing density presets: tight, comfortable, relaxed
- CSS variable chain with per-block override
- Runtime pagination config changes via `editor.setPaginationConfig()` without editor remount

---

## 5. Extension System

### 5.1 `defineBlock()` API
Every block type (including built-ins) uses the same API:
- `spec` — ProseMirror NodeSpec
- `nodeView` — custom rendering
- `toolbar` / `contextMenu` — block-specific actions
- `inputRules` / `keymap` — shortcuts
- `commands` — programmatic control

### 5.2 `defineMark()` API
Same pattern for inline marks.

### 5.3 Custom Blocks
Consumers can add blocks without forking:
```ts
const editor = new KanavaEditor({
  blocks: [...builtInBlocks, MyCustomBlock],
  marks: [...builtInMarks, MyCustomMark],
});
```

---

## 6. Architecture

| Layer | Technology |
|-------|-----------|
| Engine | ProseMirror (direct, no wrapper) |
| Build | tsup (library), Vite (playground) |
| Monorepo | pnpm workspaces |
| Language | TypeScript strict, ES2020 |
| UI | React 18+ |
| CSS | `--kanava-*` custom properties |

See [Architecture Plan](../plans/Architecture%20Plan.md) for full technical details.

---

## 7. Differentiators

| Aspect | Notion | Google Docs | **Kanava** |
|--------|--------|-------------|-----------|
| Block model | ✅ | ❌ | ✅ |
| Doc formatting | Basic | ✅ | ✅ (12 marks, 18 block attrs) |
| Columns | ❌ | ❌ | ✅ First-class (resize, nesting) |
| Pagination | ❌ | ✅ | ✅ Decoration-based |
| Canvas mode | ❌ | ❌ | ✅ Click-to-select interaction |
| Multi-block select | ✅ | ❌ | ✅ Notion-style |
| Extensible | ❌ | ❌ | ✅ `defineBlock()` |
| Open source | ❌ | ❌ | ✅ |