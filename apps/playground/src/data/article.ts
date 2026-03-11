import type { KanavaDocument } from "@kanava/editor-react";

/**
 * Article Demo — Realistic SDK documentation page.
 */
export const ARTICLE_DOC: KanavaDocument = {
    blocks: [
        {
            id: "a-h1",
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Getting Started with Kanava", marks: [] }],
            children: [],
        },
        {
            id: "a-intro",
            type: "paragraph",
            attrs: {},
            content: [
                {
                    type: "text",
                    text: "Kanava is a modern block-based editor SDK built on ProseMirror. It provides a headless core package and a React wrapper, making it easy to embed a rich document editor into any application.",
                    marks: [],
                },
            ],
            children: [],
        },
        {
            id: "a-callout",
            type: "callout",
            attrs: { variant: "info", icon: "" },
            content: [
                {
                    type: "text",
                    text: "This guide assumes basic familiarity with React and npm/pnpm. The editor works with any bundler (Vite, Webpack, etc).",
                    marks: [],
                },
            ],
            children: [],
        },

        // Installation
        {
            id: "a-h2-install",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Installation", marks: [] }],
            children: [],
        },
        {
            id: "a-install-p",
            type: "paragraph",
            attrs: {},
            content: [
                { type: "text", text: "Install both packages from your registry:", marks: [] },
            ],
            children: [],
        },
        {
            id: "a-install-code",
            type: "codeBlock",
            attrs: { language: "bash" },
            content: [
                { type: "text", text: "pnpm add @kanava/editor @kanava/editor-react", marks: [] },
            ],
            children: [],
        },
        {
            id: "a-install-p2",
            type: "paragraph",
            attrs: {},
            content: [
                { type: "text", text: "Don't forget to import the editor stylesheet in your entry point:", marks: [] },
            ],
            children: [],
        },
        {
            id: "a-install-code2",
            type: "codeBlock",
            attrs: { language: "typescript" },
            content: [
                { type: "text", text: 'import "@kanava/editor/styles/editor.css";', marks: [] },
            ],
            children: [],
        },

        // Quick Start
        {
            id: "a-h2-quick",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Quick Start", marks: [] }],
            children: [],
        },
        {
            id: "a-quick-p1",
            type: "paragraph",
            attrs: {},
            content: [
                { type: "text", text: "The simplest way to get started is with the ", marks: [] },
                { type: "text", text: "KanavaEditorComponent", marks: [{ type: "code" }] },
                { type: "text", text: " React component:", marks: [] },
            ],
            children: [],
        },
        {
            id: "a-quick-code",
            type: "codeBlock",
            attrs: { language: "tsx" },
            content: [
                {
                    type: "text",
                    text: 'import { KanavaEditorComponent } from "@kanava/editor-react";\nimport "@kanava/editor/styles/editor.css";\n\nexport function MyEditor() {\n  return (\n    <KanavaEditorComponent\n      placeholder="Start writing..."\n      onChange={(doc) => console.log(doc)}\n    />\n  );\n}',
                    marks: [],
                },
            ],
            children: [],
        },
        {
            id: "a-quick-p2",
            type: "paragraph",
            attrs: {},
            content: [
                { type: "text", text: "That's it! The editor renders with all built-in blocks (paragraph, heading, lists, code, images, etc.) and all marks (bold, italic, links, etc.).", marks: [] },
            ],
            children: [],
        },

        // Block Types
        {
            id: "a-h2-blocks",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Block Types", marks: [] }],
            children: [],
        },
        {
            id: "a-blocks-p",
            type: "paragraph",
            attrs: {},
            content: [
                { type: "text", text: "Kanava ships with 12 built-in block types. Each block is self-contained and ", marks: [] },
                { type: "text", text: "extensible", marks: [{ type: "bold" }] },
                { type: "text", text: ":", marks: [] },
            ],
            children: [],
        },
        {
            id: "a-blocks-bl1",
            type: "numberedListItem",
            attrs: { order: 1 },
            content: [
                { type: "text", text: "Paragraph", marks: [{ type: "bold" }] },
                { type: "text", text: " — The default text block", marks: [] },
            ],
            children: [],
        },
        {
            id: "a-blocks-bl2",
            type: "numberedListItem",
            attrs: { order: 2 },
            content: [
                { type: "text", text: "Heading", marks: [{ type: "bold" }] },
                { type: "text", text: " — Levels 1–3, with markdown shortcuts (#, ##, ###)", marks: [] },
            ],
            children: [],
        },
        {
            id: "a-blocks-bl3",
            type: "numberedListItem",
            attrs: { order: 3 },
            content: [
                { type: "text", text: "Code Block", marks: [{ type: "bold" }] },
                { type: "text", text: " — Syntax-highlighted with language selector", marks: [] },
            ],
            children: [],
        },
        {
            id: "a-blocks-bl4",
            type: "numberedListItem",
            attrs: { order: 4 },
            content: [
                { type: "text", text: "Image", marks: [{ type: "bold" }] },
                { type: "text", text: " — Drag & drop, paste, resize, crop, and 6 filter presets", marks: [] },
            ],
            children: [],
        },
        {
            id: "a-blocks-bl5",
            type: "numberedListItem",
            attrs: { order: 5 },
            content: [
                { type: "text", text: "Lists", marks: [{ type: "bold" }] },
                { type: "text", text: " — Bullet, numbered, and checklist with nesting", marks: [] },
            ],
            children: [],
        },
        {
            id: "a-blocks-bl6",
            type: "numberedListItem",
            attrs: { order: 6 },
            content: [
                { type: "text", text: "Columns, Toggle, Callout, Quote, Divider", marks: [{ type: "bold" }] },
            ],
            children: [],
        },

        { id: "a-div1", type: "divider", attrs: {}, content: [], children: [] },

        // Paginated Mode
        {
            id: "a-h2-page",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Paginated Mode", marks: [] }],
            children: [],
        },
        {
            id: "a-page-p1",
            type: "paragraph",
            attrs: {},
            content: [
                { type: "text", text: "Kanava supports a ", marks: [] },
                { type: "text", text: "paginated mode", marks: [{ type: "bold" }] },
                {
                    type: "text",
                    text: " that renders your document as a fixed-size page canvas — similar to Google Docs or Microsoft Word. Content is automatically broken into pages, and blocks that exceed a full page height are overflow-locked.",
                    marks: [],
                },
            ],
            children: [],
        },
        {
            id: "a-page-code",
            type: "codeBlock",
            attrs: { language: "tsx" },
            content: [
                {
                    type: "text",
                    text: '<KanavaEditorComponent\n  mode="paginated"\n  pagination={{ pageSize: "Letter" }}\n/>',
                    marks: [],
                },
            ],
            children: [],
        },
        {
            id: "a-page-callout",
            type: "callout",
            attrs: { variant: "warning", icon: "" },
            content: [
                {
                    type: "text",
                    text: "Blocks that exceed the page content height will be locked from further growth. Shrink them or split the content into multiple blocks.",
                    marks: [],
                },
            ],
            children: [],
        },

        // Customization
        {
            id: "a-h2-custom",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Customization", marks: [] }],
            children: [],
        },
        {
            id: "a-custom-p",
            type: "paragraph",
            attrs: {},
            content: [
                { type: "text", text: "The editor is fully extensible via ", marks: [] },
                { type: "text", text: "defineBlock()", marks: [{ type: "code" }] },
                { type: "text", text: " and ", marks: [] },
                { type: "text", text: "defineMark()", marks: [{ type: "code" }] },
                { type: "text", text: ". You can create custom block types with their own schemas, NodeViews, toolbar items, and context menu actions.", marks: [] },
            ],
            children: [],
        },
        {
            id: "a-custom-toggle",
            type: "toggle",
            attrs: { collapsed: false },
            content: [{ type: "text", text: "Example: Custom block definition", marks: [] }],
            children: [
                {
                    id: "a-custom-code",
                    type: "codeBlock",
                    attrs: { language: "typescript" },
                    content: [
                        {
                            type: "text",
                            text: 'import { defineBlock } from "@kanava/editor";\n\nexport const Alert = defineBlock({\n  type: "alert",\n  schema: {\n    content: "inline*",\n    group: "block",\n    attrs: { severity: { default: "info" } },\n  },\n});',
                            marks: [],
                        },
                    ],
                    children: [],
                },
            ],
        },

        // Next Steps
        {
            id: "a-h2-next",
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Next Steps", marks: [] }],
            children: [],
        },
        {
            id: "a-next-cl1",
            type: "checklistItem",
            attrs: { checked: false },
            content: [{ type: "text", text: "Try toggling between pageless and paginated mode", marks: [] }],
            children: [],
        },
        {
            id: "a-next-cl2",
            type: "checklistItem",
            attrs: { checked: false },
            content: [{ type: "text", text: "Try toggling to paginated mode to see page layout in action", marks: [] }],
            children: [],
        },
        {
            id: "a-next-cl3",
            type: "checklistItem",
            attrs: { checked: false },
            content: [{ type: "text", text: "Click View JSON to inspect the document format", marks: [] }],
            children: [],
        },
    ],
};
