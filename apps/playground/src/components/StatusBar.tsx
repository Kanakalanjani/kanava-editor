import React from "react";
import type { KanavaSelectionInfo } from "@kanava/editor-react";

interface StatusBarProps {
    selectionInfo: KanavaSelectionInfo | null;
    pageCount?: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ selectionInfo, pageCount }) => (
    <footer className="pg-status">
        {selectionInfo && (
            <span>
                Block: <strong>{selectionInfo.blockType || "—"}</strong>
                {" | "}
                Marks: <strong>{selectionInfo.activeMarks.join(", ") || "none"}</strong>
            </span>
        )}
        {pageCount != null && pageCount > 0 && (
            <span className="pg-status-pages">
                {pageCount} {pageCount === 1 ? "page" : "pages"}
            </span>
        )}
    </footer>
);
