import type { KanavaDocument } from "@kanava/editor-react";

/**
 * Two-column template — sidebar for contact/skills, main area for experience.
 */
export const TWO_COLUMN_TEMPLATE: KanavaDocument = {
    blocks: [
        {
            id: "tc-name",
            type: "heading",
            attrs: { level: 1 },
            style: { spacingBottom: 2 },
            content: [{ type: "text", text: "Your Name", marks: [] }],
            children: [],
        },
        {
            id: "tc-title",
            type: "heading",
            attrs: { level: 3 },
            style: { spacingBottom: 8 },
            content: [
                {
                    type: "text",
                    text: "Professional Title",
                    marks: [{ type: "textColor", attrs: { color: "#666666" } }],
                },
            ],
            children: [],
        },

        { id: "tc-div1", type: "divider", attrs: {}, content: [], children: [] },

        // ── Two-column body ──
        {
            id: "tc-body",
            type: "columnLayout",
            style: { spacingTop: 8 },
            columns: [
                {
                    // Left sidebar — contact, skills, languages
                    width: 1,
                    blocks: [
                        {
                            id: "tc-contact-h",
                            type: "heading",
                            attrs: { level: 2 },
                            style: { spacingBottom: 4 },
                            content: [{ type: "text", text: "Contact", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-email",
                            type: "paragraph",
                            attrs: {},
                            content: [{ type: "text", text: "✉ email@example.com", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-phone",
                            type: "paragraph",
                            attrs: {},
                            content: [{ type: "text", text: "☎ (555) 000-0000", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-loc",
                            type: "paragraph",
                            attrs: {},
                            style: { spacingBottom: 12 },
                            content: [{ type: "text", text: "📍 City, State", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-skills-h",
                            type: "heading",
                            attrs: { level: 2 },
                            style: { spacingBottom: 4 },
                            content: [{ type: "text", text: "Skills", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-sk1",
                            type: "bulletListItem",
                            attrs: {},
                            content: [{ type: "text", text: "Skill One", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-sk2",
                            type: "bulletListItem",
                            attrs: {},
                            content: [{ type: "text", text: "Skill Two", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-sk3",
                            type: "bulletListItem",
                            attrs: {},
                            content: [{ type: "text", text: "Skill Three", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-sk4",
                            type: "bulletListItem",
                            attrs: {},
                            style: { spacingBottom: 12 },
                            content: [{ type: "text", text: "Skill Four", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-lang-h",
                            type: "heading",
                            attrs: { level: 2 },
                            style: { spacingBottom: 4 },
                            content: [{ type: "text", text: "Languages", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-lang1",
                            type: "paragraph",
                            attrs: {},
                            content: [{ type: "text", text: "English — Native", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-lang2",
                            type: "paragraph",
                            attrs: {},
                            content: [{ type: "text", text: "Spanish — Conversational", marks: [] }],
                            children: [],
                        },
                    ],
                },
                {
                    // Right main — experience, education
                    width: 2,
                    blocks: [
                        {
                            id: "tc-exp-h",
                            type: "heading",
                            attrs: { level: 2 },
                            style: { spacingBottom: 4 },
                            content: [{ type: "text", text: "Experience", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-job1-title",
                            type: "heading",
                            attrs: { level: 3 },
                            style: { spacingBottom: 0 },
                            content: [{ type: "text", text: "Job Title", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-job1-meta",
                            type: "paragraph",
                            attrs: {},
                            style: { spacingBottom: 4 },
                            content: [
                                {
                                    type: "text",
                                    text: "Year – Year  •  Company Name",
                                    marks: [{ type: "textColor", attrs: { color: "#888888" } }],
                                },
                            ],
                            children: [],
                        },
                        {
                            id: "tc-job1-b1",
                            type: "bulletListItem",
                            attrs: {},
                            content: [{ type: "text", text: "Key accomplishment or responsibility.", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-job1-b2",
                            type: "bulletListItem",
                            attrs: {},
                            style: { spacingBottom: 8 },
                            content: [{ type: "text", text: "Another achievement with measurable impact.", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-job2-title",
                            type: "heading",
                            attrs: { level: 3 },
                            style: { spacingBottom: 0 },
                            content: [{ type: "text", text: "Previous Job Title", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-job2-meta",
                            type: "paragraph",
                            attrs: {},
                            style: { spacingBottom: 4 },
                            content: [
                                {
                                    type: "text",
                                    text: "Year – Year  •  Company Name",
                                    marks: [{ type: "textColor", attrs: { color: "#888888" } }],
                                },
                            ],
                            children: [],
                        },
                        {
                            id: "tc-job2-b1",
                            type: "bulletListItem",
                            attrs: {},
                            content: [{ type: "text", text: "Describe a key contribution.", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-job2-b2",
                            type: "bulletListItem",
                            attrs: {},
                            style: { spacingBottom: 12 },
                            content: [{ type: "text", text: "Another notable result.", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-edu-h",
                            type: "heading",
                            attrs: { level: 2 },
                            style: { spacingBottom: 4 },
                            content: [{ type: "text", text: "Education", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-edu-title",
                            type: "heading",
                            attrs: { level: 3 },
                            style: { spacingBottom: 0 },
                            content: [{ type: "text", text: "Degree, Field of Study", marks: [] }],
                            children: [],
                        },
                        {
                            id: "tc-edu-meta",
                            type: "paragraph",
                            attrs: {},
                            content: [
                                {
                                    type: "text",
                                    text: "Year – Year  •  University Name",
                                    marks: [{ type: "textColor", attrs: { color: "#888888" } }],
                                },
                            ],
                            children: [],
                        },
                    ],
                },
            ],
        },
    ],
};
