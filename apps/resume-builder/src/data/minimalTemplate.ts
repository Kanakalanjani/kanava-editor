import type { KanavaDocument } from "@kanava/editor-react";

/**
 * Minimal template — clean, single-column, no-frills layout.
 */
export const MINIMAL_TEMPLATE: KanavaDocument = {
    blocks: [
        {
            id: "m-name",
            type: "heading",
            attrs: { level: 1 },
            style: { spacingBottom: 2 },
            content: [{ type: "text", text: "Your Name", marks: [] }],
            children: [],
        },
        {
            id: "m-contact",
            type: "paragraph",
            attrs: {},
            style: { spacingBottom: 8 },
            content: [
                {
                    type: "text",
                    text: "email@example.com  •  (555) 000-0000  •  City, State",
                    marks: [{ type: "textColor", attrs: { color: "#888888" } }],
                },
            ],
            children: [],
        },

        { id: "m-div1", type: "divider", attrs: {}, content: [], children: [] },

        {
            id: "m-exp-h",
            type: "heading",
            attrs: { level: 2 },
            style: { spacingTop: 12, spacingBottom: 4 },
            content: [{ type: "text", text: "Experience", marks: [] }],
            children: [],
        },
        {
            id: "m-job1-title",
            type: "heading",
            attrs: { level: 3 },
            style: { spacingBottom: 0 },
            content: [{ type: "text", text: "Job Title", marks: [] }],
            children: [],
        },
        {
            id: "m-job1-meta",
            type: "paragraph",
            attrs: {},
            style: { spacingBottom: 4 },
            content: [
                {
                    type: "text",
                    text: "Year – Year  •  Company Name  •  Location",
                    marks: [{ type: "textColor", attrs: { color: "#888888" } }],
                },
            ],
            children: [],
        },
        {
            id: "m-job1-b1",
            type: "bulletListItem",
            attrs: {},
            content: [{ type: "text", text: "Describe a key accomplishment or responsibility.", marks: [] }],
            children: [],
        },
        {
            id: "m-job1-b2",
            type: "bulletListItem",
            attrs: {},
            content: [{ type: "text", text: "Add another achievement with measurable impact.", marks: [] }],
            children: [],
        },

        { id: "m-div2", type: "divider", attrs: {}, content: [], children: [] },

        {
            id: "m-edu-h",
            type: "heading",
            attrs: { level: 2 },
            style: { spacingTop: 12, spacingBottom: 4 },
            content: [{ type: "text", text: "Education", marks: [] }],
            children: [],
        },
        {
            id: "m-edu-title",
            type: "heading",
            attrs: { level: 3 },
            style: { spacingBottom: 0 },
            content: [{ type: "text", text: "Degree, Field of Study", marks: [] }],
            children: [],
        },
        {
            id: "m-edu-meta",
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

        { id: "m-div3", type: "divider", attrs: {}, content: [], children: [] },

        {
            id: "m-skills-h",
            type: "heading",
            attrs: { level: 2 },
            style: { spacingTop: 12, spacingBottom: 4 },
            content: [{ type: "text", text: "Skills", marks: [] }],
            children: [],
        },
        {
            id: "m-skills",
            type: "paragraph",
            attrs: {},
            content: [
                {
                    type: "text",
                    text: "Skill 1  •  Skill 2  •  Skill 3  •  Skill 4  •  Skill 5",
                    marks: [],
                },
            ],
            children: [],
        },
    ],
};
