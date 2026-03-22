import type { KanavaDocument } from "@kanava/editor-react";
import { SAMPLE_RESUME } from "./sampleResume.js";
import { MINIMAL_TEMPLATE } from "./minimalTemplate.js";
import { TWO_COLUMN_TEMPLATE } from "./twoColumnTemplate.js";

export interface ResumeTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    document: KanavaDocument;
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
    {
        id: "professional",
        name: "Professional",
        description: "Full-featured layout with contact columns, sections, and skills grid.",
        icon: "📄",
        document: SAMPLE_RESUME,
    },
    {
        id: "minimal",
        name: "Minimal",
        description: "Clean single-column layout. Simple and easy to fill in.",
        icon: "📝",
        document: MINIMAL_TEMPLATE,
    },
    {
        id: "two-column",
        name: "Two-Column",
        description: "Sidebar for contact & skills, main area for experience.",
        icon: "📰",
        document: TWO_COLUMN_TEMPLATE,
    },
];
