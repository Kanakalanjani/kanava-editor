import type { KanavaDocument } from "@kanava/editor-react";

/**
 * Sample resume: Sarah Jenkins — Senior Product Designer
 * Modeled after the Stitch "Resume Layout Editor with Ghost Rail" design.
 */
export const SAMPLE_RESUME: KanavaDocument = {
    blocks: [
        // ── Name ──
        {
            id: "r-name",
            type: "heading",
            attrs: { level: 1 },
            style: { spacingBottom: 2 },
            content: [{ type: "text", text: "Sarah Jenkins", marks: [] }],
            children: [],
        },
        // ── Title ──
        {
            id: "r-title",
            type: "heading",
            attrs: { level: 3 },
            style: { spacingBottom: 4 },
            content: [
                {
                    type: "text",
                    text: "Senior Product Designer",
                    marks: [{ type: "textColor", attrs: { color: "#666666" } }],
                },
            ],
            children: [],
        },
        // ── Contact row — 4 columns ──
        {
            id: "r-contact",
            type: "columnLayout",
            style: { spacingBottom: 12 },
            columns: [
                {
                    width: 1,
                    blocks: [
                        {
                            id: "r-c-email",
                            type: "paragraph",
                            attrs: {},
                            content: [
                                { type: "text", text: "sarah.j@example.com", marks: [] },
                            ],
                            children: [],
                        },
                    ],
                },
                {
                    width: 1,
                    blocks: [
                        {
                            id: "r-c-phone",
                            type: "paragraph",
                            attrs: {},
                            content: [
                                { type: "text", text: "+1 (555) 123-4567", marks: [] },
                            ],
                            children: [],
                        },
                    ],
                },
                {
                    width: 1,
                    blocks: [
                        {
                            id: "r-c-loc",
                            type: "paragraph",
                            attrs: {},
                            content: [
                                { type: "text", text: "San Francisco, CA", marks: [] },
                            ],
                            children: [],
                        },
                    ],
                },
                {
                    width: 1,
                    blocks: [
                        {
                            id: "r-c-web",
                            type: "paragraph",
                            attrs: {},
                            content: [
                                { type: "text", text: "portfolio.design", marks: [{ type: "link", attrs: { href: "https://portfolio.design" } }] },
                            ],
                            children: [],
                        },
                    ],
                },
            ],
        },

        // ── Divider ──
        { id: "r-div1", type: "divider", attrs: {}, content: [], children: [] },

        // ── Summary ──
        {
            id: "r-summary-h",
            type: "heading",
            attrs: { level: 2 },
            style: { spacingTop: 12, spacingBottom: 4 },
            content: [{ type: "text", text: "Summary", marks: [] }],
            children: [],
        },
        {
            id: "r-summary",
            type: "paragraph",
            attrs: {},
            content: [
                {
                    type: "text",
                    text: "Award-winning Product Designer with 7+ years of experience in creating user-centered digital products. Proven track record of improving user engagement and streamlining complex workflows. Passionate about design systems and accessibility.",
                    marks: [],
                },
            ],
            children: [],
        },

        // ── Divider ──
        { id: "r-div2", type: "divider", attrs: {}, content: [], children: [] },

        // ── Experience ──
        {
            id: "r-exp-h",
            type: "heading",
            attrs: { level: 2 },
            style: { spacingTop: 12, spacingBottom: 4 },
            content: [{ type: "text", text: "Experience", marks: [] }],
            children: [],
        },

        // ── Job 1 ──
        {
            id: "r-job1-title",
            type: "heading",
            attrs: { level: 3 },
            style: { spacingBottom: 0 },
            content: [{ type: "text", text: "Senior Product Designer", marks: [] }],
            children: [],
        },
        {
            id: "r-job1-meta",
            type: "paragraph",
            attrs: {},
            style: { spacingBottom: 4 },
            content: [
                {
                    type: "text",
                    text: "2020 – Present  •  TechFlow Solutions  •  San Francisco, CA",
                    marks: [{ type: "textColor", attrs: { color: "#888888" } }],
                },
            ],
            children: [],
        },
        {
            id: "r-job1-b1",
            type: "bulletListItem",
            attrs: {},
            content: [
                {
                    type: "text",
                    text: "Led the redesign of the core SaaS platform, resulting in a 25% increase in user retention and a 15% reduction in support tickets.",
                    marks: [],
                },
            ],
            children: [],
        },
        {
            id: "r-job1-b2",
            type: "bulletListItem",
            attrs: {},
            content: [
                {
                    type: "text",
                    text: "Established and maintained a comprehensive design system used by 4 product teams, ensuring consistency and speeding up development by 30%.",
                    marks: [],
                },
            ],
            children: [],
        },
        {
            id: "r-job1-b3",
            type: "bulletListItem",
            attrs: {},
            content: [
                {
                    type: "text",
                    text: "Mentored junior designers and conducted weekly design critiques to foster a collaborative and high-quality design culture.",
                    marks: [],
                },
            ],
            children: [],
        },

        // ── Job 2 ──
        {
            id: "r-job2-title",
            type: "heading",
            attrs: { level: 3 },
            style: { spacingTop: 12, spacingBottom: 0 },
            content: [{ type: "text", text: "Product Designer", marks: [] }],
            children: [],
        },
        {
            id: "r-job2-meta",
            type: "paragraph",
            attrs: {},
            style: { spacingBottom: 4 },
            content: [
                {
                    type: "text",
                    text: "2017 – 2020  •  Creative Pulse Agency  •  New York, NY",
                    marks: [{ type: "textColor", attrs: { color: "#888888" } }],
                },
            ],
            children: [],
        },
        {
            id: "r-job2-b1",
            type: "bulletListItem",
            attrs: {},
            content: [
                {
                    type: "text",
                    text: "Collaborated with cross-functional teams to deliver web and mobile applications for Fortune 500 clients.",
                    marks: [],
                },
            ],
            children: [],
        },
        {
            id: "r-job2-b2",
            type: "bulletListItem",
            attrs: {},
            content: [
                {
                    type: "text",
                    text: "Conducted user research and usability testing to validate design decisions, improving task completion rates by 40%.",
                    marks: [],
                },
            ],
            children: [],
        },

        // ── Divider ──
        { id: "r-div3", type: "divider", attrs: {}, content: [], children: [] },

        // ── Education ──
        {
            id: "r-edu-h",
            type: "heading",
            attrs: { level: 2 },
            style: { spacingTop: 12, spacingBottom: 4 },
            content: [{ type: "text", text: "Education", marks: [] }],
            children: [],
        },
        {
            id: "r-edu-title",
            type: "heading",
            attrs: { level: 3 },
            style: { spacingBottom: 0 },
            content: [{ type: "text", text: "Bachelor of Fine Arts, Interaction Design", marks: [] }],
            children: [],
        },
        {
            id: "r-edu-meta",
            type: "paragraph",
            attrs: {},
            content: [
                {
                    type: "text",
                    text: "2013 – 2017  •  California College of the Arts",
                    marks: [{ type: "textColor", attrs: { color: "#888888" } }],
                },
            ],
            children: [],
        },

        // ── Divider ──
        { id: "r-div4", type: "divider", attrs: {}, content: [], children: [] },

        // ── Skills (2-column layout) ──
        {
            id: "r-skills-h",
            type: "heading",
            attrs: { level: 2 },
            style: { spacingTop: 12, spacingBottom: 4 },
            content: [{ type: "text", text: "Skills", marks: [] }],
            children: [],
        },
        {
            id: "r-skills-cols",
            type: "columnLayout",
            columns: [
                {
                    width: 1,
                    blocks: [
                        {
                            id: "r-sk1",
                            type: "bulletListItem",
                            attrs: {},
                            content: [{ type: "text", text: "Figma & Sketch", marks: [] }],
                            children: [],
                        },
                        {
                            id: "r-sk2",
                            type: "bulletListItem",
                            attrs: {},
                            content: [{ type: "text", text: "Design Systems", marks: [] }],
                            children: [],
                        },
                        {
                            id: "r-sk3",
                            type: "bulletListItem",
                            attrs: {},
                            content: [{ type: "text", text: "User Research", marks: [] }],
                            children: [],
                        },
                        {
                            id: "r-sk4",
                            type: "bulletListItem",
                            attrs: {},
                            content: [{ type: "text", text: "Prototyping", marks: [] }],
                            children: [],
                        },
                    ],
                },
                {
                    width: 1,
                    blocks: [
                        {
                            id: "r-sk5",
                            type: "bulletListItem",
                            attrs: {},
                            content: [{ type: "text", text: "React & TypeScript", marks: [] }],
                            children: [],
                        },
                        {
                            id: "r-sk6",
                            type: "bulletListItem",
                            attrs: {},
                            content: [{ type: "text", text: "Accessibility (WCAG 2.1)", marks: [] }],
                            children: [],
                        },
                        {
                            id: "r-sk7",
                            type: "bulletListItem",
                            attrs: {},
                            content: [{ type: "text", text: "Typography", marks: [] }],
                            children: [],
                        },
                        {
                            id: "r-sk8",
                            type: "bulletListItem",
                            attrs: {},
                            content: [{ type: "text", text: "Motion Design", marks: [] }],
                            children: [],
                        },
                    ],
                },
            ],
        },
    ],
};
