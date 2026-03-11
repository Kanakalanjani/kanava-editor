import type { KanavaDocument } from "@kanava/editor-react";

/* ────────────────────────────────────────────────────────────
 * Large Article — 110+ blocks covering diverse block types.
 * Used for performance and pagination stress testing.
 * ──────────────────────────────────────────────────────────── */

function p(id: string, text: string, marks?: Array<{ type: string }>): object {
    return {
        id,
        type: "paragraph",
        attrs: {},
        content: [{ type: "text", text, marks: marks ?? [] }],
        children: [],
    };
}

function h(id: string, level: number, text: string): object {
    return {
        id,
        type: "heading",
        attrs: { level },
        content: [{ type: "text", text, marks: [] }],
        children: [],
    };
}

function bullet(id: string, text: string): object {
    return {
        id,
        type: "bulletListItem",
        attrs: {},
        content: [{ type: "text", text, marks: [] }],
        children: [],
    };
}

function numbered(id: string, order: number, text: string): object {
    return {
        id,
        type: "numberedListItem",
        attrs: { order },
        content: [{ type: "text", text, marks: [] }],
        children: [],
    };
}

function checklist(id: string, text: string, checked = false): object {
    return {
        id,
        type: "checklistItem",
        attrs: { checked },
        content: [{ type: "text", text, marks: [] }],
        children: [],
    };
}

function code(id: string, language: string, text: string): object {
    return {
        id,
        type: "codeBlock",
        attrs: { language },
        content: [{ type: "text", text, marks: [] }],
        children: [],
    };
}

function callout(id: string, variant: string, text: string): object {
    return {
        id,
        type: "callout",
        attrs: { variant, icon: "" },
        content: [{ type: "text", text, marks: [] }],
        children: [],
    };
}

function quote(id: string, text: string): object {
    return {
        id,
        type: "quote",
        attrs: {},
        content: [{ type: "text", text, marks: [] }],
        children: [],
    };
}

function divider(id: string): object {
    return { id, type: "divider", attrs: {}, content: [], children: [] };
}

export const LARGE_ARTICLE_DOC: KanavaDocument = {
    blocks: [
        // ── Section 1: Introduction ─────────────────────────────────
        h("la-h1", 1, "The Comprehensive Guide to Modern Document Editors"),
        p("la-intro1", "Document editors have evolved significantly over the past decade. From simple textarea replacements to full-fledged collaborative platforms, the landscape of rich text editing has changed beyond recognition. This guide explores the architecture, patterns, and best practices behind building a modern block-based editor."),
        p("la-intro2", "We will cover everything from the fundamental data model to advanced features like pagination, real-time collaboration, and custom block types. Whether you are building a CMS, a note-taking app, or a resume builder, the principles discussed here apply universally."),
        callout("la-intro-callout", "info", "This article serves as both a learning resource and a stress test for the Kanava editor. It contains 110+ blocks of varied types to verify rendering, scrolling, and pagination performance."),

        // ── Section 2: Document Model ───────────────────────────────
        h("la-h2-model", 2, "Chapter 1: The Document Model"),
        p("la-model1", "At the heart of every editor lies its document model — the data structure that represents content. The choice of model determines everything: what operations are possible, how collaboration works, and how content is serialized."),
        h("la-h3-tree", 3, "Tree-Based Documents"),
        p("la-tree1", "Modern block editors use a tree structure where the document is a root node containing block nodes, which in turn contain inline content (text with marks) or nested blocks. This hierarchy enables:"),
        bullet("la-tree-b1", "Block-level operations: move, duplicate, delete entire blocks"),
        bullet("la-tree-b2", "Nesting: lists within lists, blocks within toggle blocks"),
        bullet("la-tree-b3", "Structured serialization: clean JSON that maps 1:1 to the visual output"),
        bullet("la-tree-b4", "Schema validation: enforce document structure at the type level"),
        p("la-tree2", "The alternative — flat HTML strings — sacrifices all of these properties. HTML-based editors (like the classic CKEditor 4) struggle with block operations because there is no structural boundary between blocks in a flat string."),
        callout("la-tree-callout", "warning", "Avoid storing editor content as raw HTML. Always use a structured format (JSON, XML) that preserves the block tree. HTML can be generated at render time."),

        h("la-h3-schema", 3, "Schema Design"),
        p("la-schema1", "A schema defines the valid node types and their relationships. In ProseMirror, a schema specifies which nodes can contain which other nodes, what attributes they carry, and how they serialize to and from the DOM."),
        code("la-schema-code", "typescript", `// Example: A simple schema with paragraph and heading
const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*" },
    heading: { group: "block", content: "inline*", attrs: { level: { default: 1 } } },
    text: { group: "inline" },
  },
  marks: {
    bold: {},
    italic: {},
  },
});`),
        p("la-schema2", "Key principles for schema design in block editors:"),
        numbered("la-schema-n1", 1, "Every user-facing block belongs to a single group (e.g., 'blockBody')"),
        numbered("la-schema-n2", 2, "Structural nodes (wrappers, containers) are separate from content nodes"),
        numbered("la-schema-n3", 3, "Inline content is always leaf-level — no blocks inside inline"),
        numbered("la-schema-n4", 4, "Marks (bold, italic, links) are orthogonal to node structure"),

        divider("la-div1"),

        // ── Section 3: Block Types ──────────────────────────────────
        h("la-h2-blocks", 2, "Chapter 2: Block Types Deep Dive"),
        p("la-blocks1", "A block editor is only as useful as its block types. Each block type needs to handle input, rendering, serialization, and toolbar integration. Let's examine the most common block types and their implementation concerns."),

        h("la-h3-para", 3, "Paragraphs and Headings"),
        p("la-para1", "Paragraphs are the workhorse of any document. They accept inline content (text, links, images) and support all text marks. Headings are structurally identical but render with different font sizes and anchor-link IDs."),
        p("la-para2", "Implementation considerations: headings should support levels 1-6 (though most apps only expose 1-3), paragraphs need placeholder text when empty, and both should support text alignment and indentation."),

        h("la-h3-lists", 3, "Lists"),
        p("la-lists1", "Lists come in three flavors: bullet, numbered, and checklist. Each presents unique challenges:"),
        bullet("la-lists-b1", "Bullet lists need nesting with visual indent and marker style changes (disc → circle → square)"),
        bullet("la-lists-b2", "Numbered lists need automatic renumbering when items are added, removed, or reordered"),
        bullet("la-lists-b3", "Checklists need interactive checkboxes that toggle state without entering text editing"),
        p("la-lists2", "The key architectural decision is whether list items are flat (each item is a top-level block) or hierarchical (items contain sub-lists as children). Flat lists are simpler to implement but make nesting operations (Tab/Shift+Tab) harder to reason about."),

        h("la-h3-code", 3, "Code Blocks"),
        p("la-code1", "Code blocks require special handling: they preserve whitespace, disable marks (no bold inside code), and often support syntax highlighting. The language selector adds another layer of UI."),
        code("la-code-example", "javascript", `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Test the function
for (let i = 0; i < 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}`),
        p("la-code2", "Tab handling inside code blocks is particularly tricky. The Tab key normally moves focus out of the editor, but inside a code block it should insert indentation. This requires careful keymap configuration."),

        h("la-h3-media", 3, "Images and Media"),
        p("la-media1", "Image blocks need to handle upload, resize, alignment, and caption. Drop zones and paste-from-clipboard add convenience. Advanced features include crop, filters, and alt-text editing."),
        p("la-media2", "The storage strategy matters: inline base64 bloats the document, URL references require a hosting backend, and blob URLs are only valid during the session. A production editor needs an upload handler that returns persistent URLs."),

        h("la-h3-layout", 3, "Column Layouts"),
        p("la-layout1", "Column layouts allow users to place blocks side-by-side. They add architectural complexity because they introduce a nesting layer: a column layout contains columns, each of which contains blocks."),
        p("la-layout2", "Resize between columns should be smooth (drag the gutter), respect minimum widths (so columns don't collapse), and persist as flex proportions. The resize interaction is one of the most mechanically complex parts of a block editor."),

        divider("la-div2"),

        // ── Section 4: Commands & Transactions ──────────────────────
        h("la-h2-commands", 2, "Chapter 3: Commands and Transactions"),
        p("la-cmd1", "In ProseMirror, every document mutation is a transaction. A command is a function that produces a transaction. Commands are the building blocks of all editor behavior."),
        code("la-cmd-code", "typescript", `// A simple command that wraps selected text in bold
function toggleBold(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { from, to } = state.selection;
  if (from === to) return false; // No selection

  const boldMark = state.schema.marks.bold;
  if (dispatch) {
    const tr = state.tr.addMark(from, to, boldMark.create());
    dispatch(tr);
  }
  return true;
}`),
        p("la-cmd2", "The command signature is important: it takes (state, dispatch?, view?) and returns a boolean. Returning true means the command was applicable. If dispatch is undefined, the command should only check applicability — not apply any changes. This dry-run pattern enables menus to know which commands are currently available."),

        h("la-h3-undo", 3, "Undo/Redo"),
        p("la-undo1", "ProseMirror's history plugin groups transactions into undo steps. By default, adjacent typing operations are merged into a single step. Explicit boundaries can be set by toggling the addToHistory metadata."),
        p("la-undo2", "Not all changes should be undoable. Selection changes, cursor movement, and UI state (toolbar state, scroll position) are excluded. Configuration changes (page size, margins in a paginated editor) are a gray area — Word makes them undoable, but many web editors don't."),
        callout("la-undo-callout", "info", "When implementing setPaginationConfig(), the transaction should use addToHistory: false. This means margin changes are immediate but not undoable — a conscious trade-off for simplicity."),

        h("la-h3-collab", 3, "Collaboration Considerations"),
        p("la-collab1", "Real-time collaboration requires operational transformation (OT) or conflict-free replicated data types (CRDTs). ProseMirror has built-in support for OT via the collab module. Each client sends steps to a central authority, which rebases and broadcasts them."),
        p("la-collab2", "The document model heavily influences collaboration quality. Block-level operations (move, delete block) are easier to merge than character-level operations. This is another reason to prefer a structured block model over flat HTML."),

        divider("la-div3"),

        // ── Section 5: Pagination ───────────────────────────────────
        h("la-h2-pagination", 2, "Chapter 4: Paginated Mode"),
        p("la-page1", "Paginated mode renders the document as fixed-size pages, similar to Google Docs or Microsoft Word. Content is divided into pages based on accumulated block heights, with separators drawn between pages."),
        p("la-page2", "The pagination system works by iterating over all top-level blocks (blockNodes in the outermost blockGroup), measuring their DOM heights, and accumulating them into pages. When the accumulated height exceeds the page content area (page height minus top and bottom margins), a page break decoration is inserted."),

        h("la-h3-page-config", 3, "Page Configuration"),
        p("la-page-config1", "Page configuration includes:"),
        bullet("la-page-cfg-b1", "Page size: Letter (8.5×11\"), A4 (210×297mm), Legal, or custom dimensions"),
        bullet("la-page-cfg-b2", "Margins: top, bottom, left, right — control the content area within the page"),
        bullet("la-page-cfg-b3", "Orientation: portrait or landscape (swaps width and height)"),
        bullet("la-page-cfg-b4", "Header/footer space: reserved areas at the top and bottom of each page"),
        p("la-page-config2", "Changing page size requires re-measuring all blocks because the available width changes, which affects text wrapping and therefore block heights. Changing margins is simpler — it adjusts the content area but does not affect text wrapping (assuming margins are applied as padding on the page wrapper)."),

        h("la-h3-runtime", 3, "Runtime Configuration Updates"),
        p("la-runtime1", "A key challenge is updating page configuration at runtime without destroying the editor. Naive implementations remount the entire editor component when any configuration changes, which destroys undo history, selection state, and plugin states."),
        p("la-runtime2", "The correct approach is a runtime API that dispatches a ProseMirror transaction with configuration metadata. The pagination plugin listens for this metadata and re-calculates page breaks. CSS custom properties handle margin changes visually."),
        code("la-runtime-code", "typescript", `// Runtime config update pattern
editor.setPaginationConfig({
  margins: { top: 72, bottom: 72, left: 96, right: 96 },
});
// This dispatches: tr.setMeta("paginationConfigChanged", mergedConfig)
// The pagination plugin recalculates page breaks, no remount needed`),

        quote("la-runtime-quote", "The best editor APIs are the ones that feel like they do nothing — the content stays, the history stays, only the configuration changes."),

        divider("la-div4"),

        // ── Section 6: Canvas Mode ──────────────────────────────────
        h("la-h2-canvas", 2, "Chapter 5: Canvas Mode"),
        p("la-canvas1", "Canvas mode is an alternative interaction model where single-click selects a block (NodeSelection) and double-click enters text editing. This eliminates the need for drag handles and hover outlines, creating a cleaner visual experience."),
        p("la-canvas2", "The interaction model requires careful event handling. The browser fires mousedown and click as separate events, and ProseMirror has its own handlers for each. The plugin must intercept at the right level to prevent unwanted cursor placement."),

        h("la-h3-events", 3, "Event Handling Chain"),
        p("la-events1", "The event flow for a single click in canvas mode:"),
        numbered("la-events-n1", 1, "Browser fires mousedown → Plugin intercepts, creates NodeSelection, prevents default"),
        numbered("la-events-n2", 2, "Browser fires click → Plugin's handleClick returns true, suppressing PM's click handler"),
        numbered("la-events-n3", 3, "Result: Block is selected with blue outline, no cursor blinks inside"),
        p("la-events2", "For double-click, the plugin detects event.detail >= 2 in the mousedown handler and switches to TextSelection, setting the textEditingActive flag to allow subsequent clicks to reposition the cursor within the block."),
        callout("la-events-callout", "warning", "Always call event.preventDefault() in the mousedown handler when creating a NodeSelection. Without it, the browser's native contenteditable behavior places a caret before ProseMirror can update the DOM."),

        h("la-h3-escape", 3, "Escape to Exit"),
        p("la-escape1", "Pressing Escape while editing text exits text editing mode and returns to block selection. The plugin's handleKeyDown intercepts the Escape key, flips the textEditingActive flag, and dispatches a NodeSelection on the enclosing blockNode."),
        p("la-escape2", "This creates a clean two-mode interaction: block mode (click to select, arrow keys to navigate) and text mode (cursor inside, standard text editing). The transition between modes should feel instant and natural."),

        divider("la-div5"),

        // ── Section 7: Selection Models ─────────────────────────────
        h("la-h2-selection", 2, "Chapter 6: Selection Models"),
        p("la-sel1", "ProseMirror ships with three selection types: TextSelection (cursor or range within text), NodeSelection (a single node is selected), and AllSelection (the entire document). For a block editor, we need a fourth: MultiBlockSelection."),
        p("la-sel2", "MultiBlockSelection tracks a contiguous range of blockNodes. When active, all blocks in the range display a blue highlight, and operations (delete, copy, format) apply to every selected block."),

        h("la-h3-drag", 3, "Drag to Multi-Select"),
        p("la-drag1", "The multi-selection gesture starts when a mousedown+mousemove crosses a block boundary. The plugin tracks the starting block position and, on each mousemove, determines the current block under the cursor. If it differs from the start block, the selection switches to MultiBlockSelection."),
        p("la-drag2", "This is analogous to how Notion handles drag selection. Text selection within a single block uses the standard TextSelection. Only when the drag crosses a block boundary does it switch to block-level selection."),

        h("la-h3-shift", 3, "Shift+Click"),
        p("la-shift1", "Shift+Click extends the current selection to include all blocks between the anchor and the clicked block. If the current selection is a NodeSelection, it upgrades to a MultiBlockSelection. If it is already a MultiBlockSelection, it adjusts the range."),
        p("la-shift2", "The anchor is always the block where the selection started. The head is the most recently clicked or navigated block. This follows the same anchor/head convention as text selections."),

        h("la-h3-keyboard", 3, "Keyboard Operations on Multi-Selection"),
        p("la-kb1", "When multiple blocks are selected:"),
        bullet("la-kb-b1", "Delete/Backspace: Remove all selected blocks, replace with a single empty paragraph"),
        bullet("la-kb-b2", "Ctrl+C: Copy all selected blocks to clipboard as structured content"),
        bullet("la-kb-b3", "Ctrl+X: Cut — copy then delete"),
        bullet("la-kb-b4", "Type any character: Replace all selected blocks with a new paragraph containing the typed character"),
        bullet("la-kb-b5", "Escape: Collapse to a NodeSelection on the first block in the range"),
        p("la-kb2", "Arrow key navigation can extend multi-selection with Shift held (Shift+ArrowDown adds the next block, Shift+ArrowUp adds the previous block). Without Shift, arrows collapse the selection and navigate normally."),

        divider("la-div6"),

        // ── Section 8: Theming ──────────────────────────────────────
        h("la-h2-theme", 2, "Chapter 7: Theming and Styling"),
        p("la-theme1", "A themeable editor uses CSS custom properties for all visual values. This allows consumers to override colors, spacing, typography, and borders without touching the editor's internal CSS."),
        p("la-theme2", "The naming convention follows a pattern: --kanava-{component}-{property}. For example, --kanava-block-border-radius, --kanava-toolbar-bg, --kanava-text-color. This prevents collisions with the host application's custom properties."),

        h("la-h3-density", 3, "Density Presets"),
        p("la-density1", "Kanava supports three density presets that adjust spacing and typography:"),
        numbered("la-density-n1", 1, "Comfortable — Generous spacing, ideal for long-form writing and reading"),
        numbered("la-density-n2", 2, "Compact — Tighter spacing, suitable for dashboards and dense content"),
        numbered("la-density-n3", 3, "Custom — All values can be overridden individually via CSS custom properties"),
        p("la-density2", "Density affects block gap (space between blocks), paragraph line-height, heading margins, and toolbar padding. Switching density at runtime re-renders all blocks with the new spacing values."),

        h("la-h3-dark", 3, "Dark and Light Themes"),
        p("la-dark1", "Themes are implemented as CSS class selectors. The editor root element gets a class like .kanava-theme-light or .kanava-theme-dark, and all custom properties are scoped under that selector."),
        code("la-dark-code", "css", `.kanava-theme-dark {
  --kanava-bg: #1a1a2e;
  --kanava-text: #e0e0e0;
  --kanava-border: #3a3a5c;
  --kanava-toolbar-bg: #252540;
}

.kanava-theme-light {
  --kanava-bg: #ffffff;
  --kanava-text: #1a1a1a;
  --kanava-border: #e0e0e0;
  --kanava-toolbar-bg: #f8f8fa;
}`),

        divider("la-div7"),

        // ── Section 9: Performance ──────────────────────────────────
        h("la-h2-perf", 2, "Chapter 8: Performance Considerations"),
        p("la-perf1", "A document with 100+ blocks should render and scroll smoothly. Performance bottlenecks typically appear in three places: initial render, transaction processing, and decoration computation."),

        h("la-h3-render", 3, "Initial Render"),
        p("la-render1", "ProseMirror creates DOM nodes for the entire document on mount. For large documents (1000+ blocks), this can take noticeable time. Virtualization (only rendering visible blocks) is the standard solution, but it conflicts with browser-native features like Ctrl+F find."),
        p("la-render2", "For documents under 500 blocks, full rendering is fine. The critical optimization is ensuring NodeViews don't trigger unnecessary DOM updates. ProseMirror's update() callback should only modify the DOM when relevant attributes have actually changed."),

        h("la-h3-transactions", 3, "Transaction Processing"),
        p("la-tx1", "Every keystroke produces a transaction. The key is to keep per-transaction plugin computations O(1) or O(log n), not O(n). The toolbarState plugin, for example, should only query marks and attributes at the cursor position — not iterate the entire document."),
        p("la-tx2", "The pagination plugin is the most expensive per-transaction plugin because it needs to measure block heights. However, it can be optimized to only re-measure blocks that were modified in the transaction, using the transaction's step map to identify changed regions."),

        h("la-h3-decorations", 3, "Decoration Performance"),
        p("la-deco1", "Decorations are overlays that ProseMirror renders on top of the document (selection highlights, page break lines, drag hover indicators). Each decoration set is recomputed on every transaction. For multi-block selection, the decoration computation should be efficient:"),
        bullet("la-deco-b1", "Use DecorationSet.create() with a pre-computed array — not incremental map + add/remove"),
        bullet("la-deco-b2", "Cache decoration sets when the selection hasn't changed"),
        bullet("la-deco-b3", "Avoid creating decorations for every node in the document — only for selected/focused blocks"),

        divider("la-div8"),

        // ── Section 10: Conclusion ──────────────────────────────────
        h("la-h2-conclusion", 2, "Conclusion"),
        p("la-conclusion1", "Building a modern block editor is a significant engineering undertaking. The document model, selection system, command architecture, and plugin framework all interact in complex ways. Getting the foundations right — a clean schema, proper command signatures, and efficient plugin computation — makes everything else easier."),
        p("la-conclusion2", "The block editor space continues to evolve. Features like real-time collaboration, AI-assisted writing, and advanced layout (tables, kanban boards, databases) are becoming table stakes. A well-architected editor is one that can accommodate these features without fundamental rewrites."),
        quote("la-conclusion-quote", "An editor is a living document itself — it grows, adapts, and improves with every iteration. Ship early, test with real users, and iterate."),
        callout("la-conclusion-callout", "success", "If this document scrolls smoothly, pagination recalculates correctly on config changes, and all block types render without issues — the editor is performing well under load."),

        // ── Appendix: Checklist ─────────────────────────────────────
        h("la-h2-appendix", 2, "Appendix: Editor Quality Checklist"),
        checklist("la-check1", "Document renders 100+ blocks without lag", false),
        checklist("la-check2", "Page breaks are accurate in paginated mode", false),
        checklist("la-check3", "Margin changes don't destroy undo history", false),
        checklist("la-check4", "Canvas mode: single-click selects block without cursor", false),
        checklist("la-check5", "Scrolling is smooth through the entire document", false),
        checklist("la-check6", "Text formatting works across inline content", false),
        checklist("la-check7", "Block operations (delete, duplicate, move) work reliably", false),
        checklist("la-check8", "Code blocks preserve whitespace and support language selection", false),
        checklist("la-check9", "Toggle blocks expand and collapse correctly", false),
        checklist("la-check10", "Callout variants (info, warning, success) render distinctly", false),
    ] as KanavaDocument["blocks"],
};
