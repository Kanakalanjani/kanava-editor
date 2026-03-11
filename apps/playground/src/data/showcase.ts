import type { KanavaDocument } from "@kanava/editor-react";

/**
 * Kitchen Sink — Exercises every block type and every mark.
 */
export const SHOWCASE_DOC: KanavaDocument = {
    blocks: [
        // ── Hero ──
        {
            id: "s-h1",
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Welcome to Kanava Editor", marks: [] }],
            children: [],
        },
        {
            id: "s-intro",
            type: "paragraph",
            attrs: {},
            content: [
                { type: "text", text: "A ", marks: [] },
                { type: "text", text: "block-based", marks: [{ type: "bold" }] },
                { type: "text", text: " canvas editor built on ", marks: [] },
                { type: "text", text: "ProseMirror", marks: [{ type: "italic" }] },
                { type: "text", text: ". Try the ", marks: [] },
                { type: "text", text: "drag handles", marks: [{ type: "underline" }] },
                { type: "text", text: " on the left of each block, ", marks: [] },
                { type: "text", text: "keyboard shortcuts", marks: [{ type: "code" }] },
                { type: "text", text: ", and the block picker in the sidebar.", marks: [] },
            ],
            children: [],
        },

        // ── Text Formatting ──
        {
            id: "s-h2-fmt",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Text Formatting", marks: [] }],
            children: [],
        },
        {
            id: "s-fmt",
            type: "paragraph",
            attrs: {},
            content: [
                { type: "text", text: "Bold", marks: [{ type: "bold" }] },
                { type: "text", text: ", ", marks: [] },
                { type: "text", text: "italic", marks: [{ type: "italic" }] },
                { type: "text", text: ", ", marks: [] },
                { type: "text", text: "underline", marks: [{ type: "underline" }] },
                { type: "text", text: ", ", marks: [] },
                { type: "text", text: "strikethrough", marks: [{ type: "strike" }] },
                { type: "text", text: ", ", marks: [] },
                { type: "text", text: "inline code", marks: [{ type: "code" }] },
                { type: "text", text: ", ", marks: [] },
                {
                    type: "text",
                    text: "colored text",
                    marks: [{ type: "textColor", attrs: { color: "#e74c3c" } }],
                },
                { type: "text", text: ", ", marks: [] },
                {
                    type: "text",
                    text: "highlighted",
                    marks: [{ type: "highlight", attrs: { color: "#ffeaa7" } }],
                },
                { type: "text", text: ", and ", marks: [] },
                {
                    type: "text",
                    text: "links",
                    marks: [{ type: "link", attrs: { href: "https://prosemirror.net" } }],
                },
                { type: "text", text: ".", marks: [] },
            ],
            children: [],
        },
        {
            id: "s-fmt2",
            type: "paragraph",
            attrs: {},
            content: [
                { type: "text", text: "Font sizing: ", marks: [] },
                {
                    type: "text",
                    text: "small",
                    marks: [{ type: "fontSize", attrs: { size: 12 } }],
                },
                { type: "text", text: ", normal, ", marks: [] },
                {
                    type: "text",
                    text: "large",
                    marks: [{ type: "fontSize", attrs: { size: 24 } }],
                },
                { type: "text", text: ". Font family: ", marks: [] },
                {
                    type: "text",
                    text: "monospace",
                    marks: [{ type: "fontFamily", attrs: { family: "monospace" } }],
                },
                { type: "text", text: ". Scientific: E = mc", marks: [] },
                { type: "text", text: "2", marks: [{ type: "superscript" }] },
                { type: "text", text: ", H", marks: [] },
                { type: "text", text: "2", marks: [{ type: "subscript" }] },
                { type: "text", text: "O.", marks: [] },
            ],
            children: [],
        },

        // ── Lists ──
        {
            id: "s-h2-lists",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Lists", marks: [] }],
            children: [],
        },
        {
            id: "s-bl1",
            type: "bulletListItem",
            attrs: {},
            content: [{ type: "text", text: "First bullet point", marks: [] }],
            children: [],
        },
        {
            id: "s-bl2",
            type: "bulletListItem",
            attrs: {},
            content: [{ type: "text", text: "Second bullet point", marks: [] }],
            children: [
                {
                    id: "s-bl2a",
                    type: "bulletListItem",
                    attrs: {},
                    content: [{ type: "text", text: "Nested bullet (press Tab to indent)", marks: [] }],
                    children: [],
                },
            ],
        },
        {
            id: "s-bl3",
            type: "bulletListItem",
            attrs: {},
            content: [{ type: "text", text: "Third bullet point", marks: [] }],
            children: [],
        },
        {
            id: "s-nl1",
            type: "numberedListItem",
            attrs: { order: 1 },
            content: [{ type: "text", text: "First numbered item", marks: [] }],
            children: [],
        },
        {
            id: "s-nl2",
            type: "numberedListItem",
            attrs: { order: 2 },
            content: [{ type: "text", text: "Second numbered item", marks: [] }],
            children: [],
        },
        {
            id: "s-nl3",
            type: "numberedListItem",
            attrs: { order: 3 },
            content: [{ type: "text", text: "Third numbered item", marks: [] }],
            children: [],
        },
        {
            id: "s-cl1",
            type: "checklistItem",
            attrs: { checked: true },
            content: [{ type: "text", text: "Build schema layer", marks: [] }],
            children: [],
        },
        {
            id: "s-cl2",
            type: "checklistItem",
            attrs: { checked: true },
            content: [{ type: "text", text: "Create NodeViews with drag handles", marks: [] }],
            children: [],
        },
        {
            id: "s-cl3",
            type: "checklistItem",
            attrs: { checked: false },
            content: [{ type: "text", text: "Implement slash commands", marks: [] }],
            children: [],
        },

        // ── Quote ──
        {
            id: "s-quote",
            type: "quote",
            attrs: {},
            content: [
                {
                    type: "text",
                    text: "The best way to predict the future is to invent it. — Alan Kay",
                    marks: [],
                },
            ],
            children: [],
        },

        // ── Callouts ──
        {
            id: "s-h2-callout",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Callout Blocks", marks: [] }],
            children: [],
        },
        {
            id: "s-callout-info",
            type: "callout",
            attrs: { variant: "info", icon: "" },
            content: [{ type: "text", text: "This is an info callout — use it for helpful tips.", marks: [] }],
            children: [],
        },
        {
            id: "s-callout-warn",
            type: "callout",
            attrs: { variant: "warning", icon: "" },
            content: [{ type: "text", text: "Warning: Be careful with this operation!", marks: [] }],
            children: [],
        },
        {
            id: "s-callout-ok",
            type: "callout",
            attrs: { variant: "success", icon: "" },
            content: [{ type: "text", text: "Success! Everything is working correctly.", marks: [] }],
            children: [],
        },
        {
            id: "s-callout-err",
            type: "callout",
            attrs: { variant: "error", icon: "" },
            content: [{ type: "text", text: "Error: Something went wrong. Please try again.", marks: [] }],
            children: [],
        },

        // ── Toggle ──
        {
            id: "s-h2-toggle",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Toggle Block", marks: [] }],
            children: [],
        },
        {
            id: "s-toggle",
            type: "toggle",
            attrs: { collapsed: false },
            content: [{ type: "text", text: "Click the arrow to collapse/expand", marks: [] }],
            children: [
                {
                    id: "s-toggle-p",
                    type: "paragraph",
                    attrs: {},
                    content: [
                        { type: "text", text: "Hidden content! You can nest any block type inside a toggle.", marks: [] },
                    ],
                    children: [],
                },
                {
                    id: "s-toggle-bl",
                    type: "bulletListItem",
                    attrs: {},
                    content: [{ type: "text", text: "Even nested lists work inside toggles!", marks: [] }],
                    children: [],
                },
            ],
        },

        // ── Code Block ──
        {
            id: "s-h2-code",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Code Block", marks: [] }],
            children: [],
        },
        {
            id: "s-code",
            type: "codeBlock",
            attrs: { language: "typescript" },
            content: [
                {
                    type: "text",
                    text: 'import { KanavaEditor } from "@kanava/editor";\n\nconst editor = new KanavaEditor({\n  element: document.getElementById("editor")!,\n  mode: "paginated",\n  pagination: { pageSize: "Letter" },\n});',
                    marks: [],
                },
            ],
            children: [],
        },

        // ── Divider ──
        { id: "s-divider", type: "divider", attrs: {}, content: [], children: [] },

        // ── Image ──
        {
            id: "s-h2-img",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Image Block", marks: [] }],
            children: [],
        },
        {
            id: "s-img-intro",
            type: "paragraph",
            attrs: {},
            content: [
                { type: "text", text: "Images support ", marks: [] },
                { type: "text", text: "alignment", marks: [{ type: "bold" }] },
                { type: "text", text: " (left/center/right), ", marks: [] },
                { type: "text", text: "CSS filters", marks: [{ type: "bold" }] },
                { type: "text", text: " (grayscale, sepia, vintage, etc.), ", marks: [] },
                { type: "text", text: "cropping", marks: [{ type: "bold" }] },
                { type: "text", text: ", ", marks: [] },
                { type: "text", text: "rotation", marks: [{ type: "bold" }] },
                { type: "text", text: ", drag-to-resize handles, and editable captions. Click an image to see its toolbar.", marks: [] },
            ],
            children: [],
        },
        {
            id: "s-image-center",
            type: "image",
            attrs: {
                src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop",
                alt: "Mountain landscape — center aligned, no filter",
                width: 500,
                height: 333,
                caption: "Center aligned · No filter · Drag corners to resize",
                filter: "none",
                alignment: "center",
                cropData: null,
            },
            content: [],
            children: [],
        },
        {
            id: "s-image-left",
            type: "image",
            attrs: {
                src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&h=350&fit=crop",
                alt: "Forest path — left aligned with sepia filter",
                width: 280,
                height: 196,
                caption: "Left aligned · Sepia filter applied",
                filter: "sepia",
                alignment: "left",
                cropData: null,
            },
            content: [],
            children: [],
        },
        {
            id: "s-image-right",
            type: "image",
            attrs: {
                src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=500&h=350&fit=crop",
                alt: "Lake sunset — right aligned with vintage filter",
                width: 280,
                height: 196,
                caption: "Right aligned · Vintage filter · All via block attrs",
                filter: "vintage",
                alignment: "right",
                cropData: null,
            },
            content: [],
            children: [],
        },

        // ── Column Layout ──
        {
            id: "s-cols-h",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Column Layout", marks: [] }],
            children: [],
        },
        {
            id: "s-cols-intro",
            type: "paragraph",
            attrs: {},
            content: [
                { type: "text", text: "Columns let you arrange content side-by-side. Each column is independent and supports ", marks: [] },
                { type: "text", text: "any block type", marks: [{ type: "bold" }] },
                { type: "text", text: " — headings, paragraphs, lists, images, and more. Insert columns via the BlockPicker sidebar.", marks: [] },
            ],
            children: [],
        },
        {
            id: "s-cols",
            type: "columnLayout",
            columns: [
                {
                    width: 1,
                    blocks: [
                        {
                            id: "s-col1-h",
                            type: "heading",
                            attrs: { level: 3 },
                            content: [{ type: "text", text: "Left Column", marks: [] }],
                            children: [],
                        },
                        {
                            id: "s-col1-p",
                            type: "paragraph",
                            attrs: {},
                            content: [
                                { type: "text", text: "Drag the gutter between columns to resize.", marks: [] },
                            ],
                            children: [],
                        },
                    ],
                },
                {
                    width: 1,
                    blocks: [
                        {
                            id: "s-col2-h",
                            type: "heading",
                            attrs: { level: 3 },
                            content: [{ type: "text", text: "Right Column", marks: [] }],
                            children: [],
                        },
                        {
                            id: "s-col2-p",
                            type: "paragraph",
                            attrs: {},
                            content: [
                                { type: "text", text: "Each column is independent and can contain any block type.", marks: [] },
                            ],
                            children: [],
                        },
                    ],
                },
            ],
        },

        // ── Block Styling ──
        {
            id: "s-h2-style",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Block Styling", marks: [] }],
            children: [],
        },
        {
            id: "s-styled",
            type: "paragraph",
            attrs: {
                backgroundColor: "#e3f2fd",
                spacingTop: 16,
                spacingBottom: 16,
                paddingTop: 16,
                paddingBottom: 16,
                paddingLeft: 20,
                paddingRight: 20,
                borderColor: "#1565c0",
                borderWidth: 2,
                borderStyle: "solid",
                borderRadius: 8,
                textIndent: 24,
            },
            content: [
                {
                    type: "text",
                    text: "This paragraph has a blue background, padding, an indented first line, and a border — all configured via block-level attributes.",
                    marks: [],
                },
            ],
            children: [],
        },

        // ── Keyboard Shortcuts ──
        {
            id: "s-h2-keys",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Keyboard Shortcuts", marks: [] }],
            children: [],
        },
        {
            id: "s-keys",
            type: "paragraph",
            attrs: {},
            content: [
                { type: "text", text: "Ctrl+B", marks: [{ type: "code" }] },
                { type: "text", text: " Bold  •  ", marks: [] },
                { type: "text", text: "Ctrl+I", marks: [{ type: "code" }] },
                { type: "text", text: " Italic  •  ", marks: [] },
                { type: "text", text: "Ctrl+U", marks: [{ type: "code" }] },
                { type: "text", text: " Underline  •  ", marks: [] },
                { type: "text", text: "Ctrl+D", marks: [{ type: "code" }] },
                { type: "text", text: " Duplicate  •  ", marks: [] },
                { type: "text", text: "Tab", marks: [{ type: "code" }] },
                { type: "text", text: " Indent  •  ", marks: [] },
                { type: "text", text: "Ctrl+Shift+↑/↓", marks: [{ type: "code" }] },
                { type: "text", text: " Move block", marks: [] },
            ],
            children: [],
        },
        {
            id: "s-md",
            type: "paragraph",
            attrs: {},
            content: [
                { type: "text", text: "Markdown shortcuts: ", marks: [{ type: "bold" }] },
                { type: "text", text: "# ", marks: [{ type: "code" }] },
                { type: "text", text: "Heading  •  ", marks: [] },
                { type: "text", text: "> ", marks: [{ type: "code" }] },
                { type: "text", text: "Quote  •  ", marks: [] },
                { type: "text", text: "- ", marks: [{ type: "code" }] },
                { type: "text", text: "Bullet  •  ", marks: [] },
                { type: "text", text: "1. ", marks: [{ type: "code" }] },
                { type: "text", text: "Numbered  •  ", marks: [] },
                { type: "text", text: "[] ", marks: [{ type: "code" }] },
                { type: "text", text: "Checklist  •  ", marks: [] },
                { type: "text", text: "--- ", marks: [{ type: "code" }] },
                { type: "text", text: "Divider  •  ", marks: [] },
                { type: "text", text: "``` ", marks: [{ type: "code" }] },
                { type: "text", text: "Code", marks: [] },
            ],
            children: [],
        },
    ],
};
