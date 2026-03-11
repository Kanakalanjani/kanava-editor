/**
 * GapCursor-aware Enter command.
 *
 * When the selection is a GapCursor (the blinking line ProseMirror shows
 * before/after isolating or non-text nodes), pressing Enter should create
 * a new empty blockNode > paragraph at the gap position and place the
 * cursor inside it.
 *
 * Without this command, GapCursor + Enter does nothing because no built-in
 * PM command checks for GapCursor — they all require TextSelection or
 * NodeSelection.
 */

import type { Command } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import { GapCursor } from "prosemirror-gapcursor";

/**
 * If the selection is a GapCursor, insert a new blockNode > paragraph
 * at the gap position and move the cursor into it.
 */
export const insertBlockAtGapCursor: Command = (state, dispatch) => {
  if (!(state.selection instanceof GapCursor)) return false;

  const { $from } = state.selection;
  const { blockNode, paragraph } = state.schema.nodes;
  if (!blockNode || !paragraph) return false;

  // Find the parent that can accept a blockNode (blockGroup or column)
  let insertDepth = -1;
  for (let d = $from.depth; d >= 0; d--) {
    const parentName = $from.node(d).type.name;
    if (parentName === "blockGroup" || parentName === "column") {
      insertDepth = d;
      break;
    }
  }
  if (insertDepth === -1) return false;

  if (!dispatch) return true;

  // Compute insertion position: position of the child at gap index
  const indexInParent = $from.index(insertDepth);
  const parent = $from.node(insertDepth);
  let insertPos = $from.start(insertDepth);
  const clampedIdx = Math.min(indexInParent, parent.childCount);
  for (let i = 0; i < clampedIdx; i++) {
    insertPos += parent.child(i).nodeSize;
  }

  const newBlock = blockNode.create({ id: "" }, paragraph.create());
  const tr = state.tr.insert(insertPos, newBlock);
  // Cursor inside the new paragraph: insertPos + 1 (into blockNode) + 1 (into paragraph)
  const sel = TextSelection.create(tr.doc, insertPos + 2);
  dispatch(tr.setSelection(sel).scrollIntoView());
  return true;
};
