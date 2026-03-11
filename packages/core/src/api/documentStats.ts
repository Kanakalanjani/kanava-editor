import type { Node as PMNode } from "prosemirror-model";

/**
 * Document statistics computed from a ProseMirror document.
 */
export interface DocumentStats {
  /** Total number of words */
  wordCount: number;
  /** Total number of characters (excluding whitespace) */
  charCount: number;
  /** Total number of characters (including whitespace) */
  charCountWithSpaces: number;
  /** Estimated reading time in minutes */
  readingTimeMinutes: number;
}

/**
 * Compute document statistics from a ProseMirror document.
 * Walks all text nodes and counts words, characters, and reading time.
 *
 * @param doc - ProseMirror document node.
 * @param wordsPerMinute - Reading speed (default: 200 wpm).
 */
export function getDocumentStats(doc: PMNode, wordsPerMinute = 200): DocumentStats {
  let text = "";

  doc.descendants((node) => {
    if (node.isText && node.text) {
      text += node.text + " ";
    }
    return true;
  });

  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/) : [];
  const charCountWithSpaces = trimmed.length;
  const charCount = trimmed.replace(/\s/g, "").length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words.length / wordsPerMinute));

  return {
    wordCount: words.length,
    charCount,
    charCountWithSpaces,
    readingTimeMinutes,
  };
}
