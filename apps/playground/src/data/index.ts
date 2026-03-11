import type { KanavaDocument } from "@kanava/editor-react";

export interface DemoEntry {
    id: string;
    title: string;
    icon: string;
    defaultMode: "pageless" | "paginated";
    content: KanavaDocument;
}

import { SHOWCASE_DOC } from "./showcase";
import { ARTICLE_DOC } from "./article";
import { LARGE_ARTICLE_DOC } from "./largeArticle.js";

export const DEMOS: DemoEntry[] = [
    {
        id: "showcase",
        title: "Kitchen Sink",
        icon: "🧩",
        defaultMode: "pageless",
        content: SHOWCASE_DOC,
    },
    {
        id: "article",
        title: "Article",
        icon: "📄",
        defaultMode: "pageless",
        content: ARTICLE_DOC,
    },
    {
        id: "large-article",
        title: "Large Article (110+ blocks)",
        icon: "📚",
        defaultMode: "paginated",
        content: LARGE_ARTICLE_DOC,
    },
];
