import React, { useMemo } from "react";
import type { KanavaEditor } from "@kanava/editor";
import { getDocumentStats, type DocumentStats } from "@kanava/editor";
import { useSelectionInfo } from "./hooks.js";

export interface DocumentStatsProps {
  editor: KanavaEditor | null;
  className?: string;
}

/**
 * Displays document statistics: word count, character count, and reading time.
 * Recomputes on every content change (via selection info subscription which
 * fires after every transaction).
 */
export const DocumentStatsDisplay: React.FC<DocumentStatsProps> = ({ editor, className }) => {
  // Subscribe to selection changes to trigger re-render after doc changes
  const selectionInfo = useSelectionInfo(editor);

  const stats: DocumentStats | null = useMemo(() => {
    if (!editor) return null;
    return getDocumentStats(editor.pmState.doc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, selectionInfo?.anchor]);

  if (!stats) return null;

  return (
    <div className={`kanava-doc-stats ${className || ""}`}>
      <span className="kanava-doc-stats-item">{stats.wordCount} words</span>
      <span className="kanava-doc-stats-sep">·</span>
      <span className="kanava-doc-stats-item">{stats.charCount} chars</span>
      <span className="kanava-doc-stats-sep">·</span>
      <span className="kanava-doc-stats-item">{stats.readingTimeMinutes} min read</span>
    </div>
  );
};

DocumentStatsDisplay.displayName = "DocumentStatsDisplay";
