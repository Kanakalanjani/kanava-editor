import type { EditorView } from "prosemirror-view";
import type { EditorState } from "prosemirror-state";
import type { KanavaSelectionInfo } from "./types.js";
import { TextSelection } from "prosemirror-state";

/**
 * Extract selection information from the editor state.
 */
export function getSelectionInfo(state: EditorState): KanavaSelectionInfo {
  const { $from, empty } = state.selection;

  // Determine which marks are active
  const storedMarks = state.storedMarks || $from.marks();
  const activeMarks = storedMarks.map((m) => m.type.name);

  // Find current block type (blockBody) and enclosing blockNode
  let blockType: string | null = null;
  let blockAttrs: Record<string, any> = {};
  let blockNodeAttrs: Record<string, any> | null = null;

  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d);
    if (!blockType && node.type.spec.group?.includes("blockBody")) {
      blockType = node.type.name;
      blockAttrs = { ...node.attrs };
    }
    if (node.type.name === "blockNode") {
      blockNodeAttrs = { ...node.attrs };
      break;
    }
  }

  return {
    activeMarks,
    blockType,
    blockAttrs,
    blockNodeAttrs,
    empty,
    anchor: state.selection.anchor,
    head: state.selection.head,
  };
}

/**
 * Check if a specific mark is active at the current selection.
 */
export function isMarkActive(state: EditorState, markName: string): boolean {
  const { from, $from, to, empty } = state.selection;

  if (empty) {
    const marks = state.storedMarks || $from.marks();
    return marks.some((m) => m.type.name === markName);
  }

  let found = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (node.marks.some((m) => m.type.name === markName)) {
      found = true;
    }
  });

  return found;
}

/**
 * Get the current block type and attributes at the selection.
 */
export function getCurrentBlockInfo(
  state: EditorState
): { type: string; attrs: Record<string, any> } | null {
  const { $from } = state.selection;

  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d);
    if (node.type.spec.group?.includes("blockBody")) {
      return { type: node.type.name, attrs: { ...node.attrs } };
    }
  }

  return null;
}
