import type { Command } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import { Fragment, type Node as PMNode } from "prosemirror-model";

/**
 * Indent the current block — move it into the previous sibling's nested blockGroup.
 *
 * Before:
 *   blockGroup
 *     blockChild(A)
 *     blockChild(B)  ← cursor here
 *
 * After:
 *   blockGroup
 *     blockChild(A)
 *       blockGroup
 *         blockChild(B)
 */
export const indentBlock: Command = (state, dispatch) => {
  const { $from } = state.selection;
  const schema = state.schema;

  // Find the blockNode containing the cursor
  let blockNodeDepth = -1;
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type.name === "blockNode") {
      blockNodeDepth = d;
      break;
    }
  }
  if (blockNodeDepth === -1) return false;

  // Find the parent blockGroup
  const blockGroupDepth = blockNodeDepth - 1;
  if (blockGroupDepth < 0) return false;
  const blockGroup = $from.node(blockGroupDepth);
  if (blockGroup.type.name !== "blockGroup") return false;

  // Find index of the current blockNode inside blockGroup
  // We need to find blockChild actually — the wrapper
  // Actually blockNode IS the blockChild in content expression
  const $blockNode = state.doc.resolve($from.before(blockNodeDepth));
  const indexInGroup = $blockNode.index(blockGroupDepth);

  // Can't indent the first child — no previous sibling to nest into
  if (indexInGroup === 0) return false;

  // Cap nesting depth at 6 levels
  let nestingDepth = 0;
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type.name === "blockGroup") nestingDepth++;
  }
  if (nestingDepth >= 6) return false;

  if (!dispatch) return true;

  const tr = state.tr;
  const blockNodePos = $from.before(blockNodeDepth);
  const blockNode = $from.node(blockNodeDepth);
  const blockNodeEnd = $from.after(blockNodeDepth);

  // Find the previous sibling (blockNode or columnLayout)
  let prevChildPos = $from.start(blockGroupDepth);
  for (let i = 0; i < indexInGroup; i++) {
    prevChildPos += blockGroup.child(i).nodeSize;
  }
  // prevChildPos is now at the start of our blockNode
  // The previous sibling starts at:
  const prevChild = blockGroup.child(indexInGroup - 1);
  const prevChildStart = prevChildPos - prevChild.nodeSize;

  // Only nest into blockNode siblings, not columnLayout
  if (prevChild.type.name !== "blockNode") return false;

  // Remove the current block from its position
  tr.delete(blockNodePos, blockNodeEnd);

  // Check if the previous sibling already has a nested blockGroup
  const prevBlockBody = prevChild.firstChild;
  const hasNestedGroup = prevChild.childCount > 1 && prevChild.lastChild?.type.name === "blockGroup";

  if (hasNestedGroup) {
    // Append to existing nested blockGroup
    const nestedGroupEnd = prevChildStart + prevChild.nodeSize - 1; // before blockNode close
    const mappedEnd = tr.mapping.map(nestedGroupEnd);
    tr.insert(mappedEnd, blockNode);
  } else {
    // Create a new blockGroup inside the previous sibling
    const newGroup = schema.nodes.blockGroup.create(null, blockNode);
    const insertPos = prevChildStart + prevChild.nodeSize - 1; // before blockNode close
    const mappedPos = tr.mapping.map(insertPos);
    tr.insert(mappedPos, newGroup);
  }

  // Restore cursor position
  const mapped = tr.mapping.map($from.pos);
  try {
    tr.setSelection(TextSelection.create(tr.doc, mapped));
  } catch {
    // If mapping fails, place at start of doc
    tr.setSelection(TextSelection.create(tr.doc, 1));
  }

  dispatch(tr.scrollIntoView());
  return true;
};

/**
 * Outdent the current block — move it out of its parent blockGroup
 * to become a sibling of the parent's blockNode.
 *
 * Before:
 *   blockGroup
 *     blockChild(A)
 *       blockGroup
 *         blockChild(B)  ← cursor here
 *
 * After:
 *   blockGroup
 *     blockChild(A)
 *     blockChild(B)
 */
export const outdentBlock: Command = (state, dispatch) => {
  const { $from } = state.selection;
  const schema = state.schema;

  // Find the blockNode containing the cursor
  let blockNodeDepth = -1;
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type.name === "blockNode") {
      blockNodeDepth = d;
      break;
    }
  }
  if (blockNodeDepth === -1) return false;

  // Find the parent blockGroup
  const blockGroupDepth = blockNodeDepth - 1;
  if (blockGroupDepth < 0) return false;
  const blockGroup = $from.node(blockGroupDepth);
  if (blockGroup.type.name !== "blockGroup") return false;

  // Find grandparent — must be a blockNode (meaning we are nested)
  const grandparentDepth = blockGroupDepth - 1;
  if (grandparentDepth < 0) return false;
  const grandparent = $from.node(grandparentDepth);
  if (grandparent.type.name !== "blockNode") return false;

  // Find the great-grandparent blockGroup
  const greatGrandparentDepth = grandparentDepth - 1;
  if (greatGrandparentDepth < 0) return false;

  if (!dispatch) return true;

  const tr = state.tr;
  const blockNode = $from.node(blockNodeDepth);
  const blockNodePos = $from.before(blockNodeDepth);
  const blockNodeEnd = $from.after(blockNodeDepth);
  const blockGroupPos = $from.before(blockGroupDepth);

  // Check if this is the only child in the blockGroup
  const isOnlyChild = blockGroup.childCount === 1;

  // Step 1: Insert a copy of the block after the grandparent blockNode
  const grandparentEnd = $from.after(grandparentDepth);
  tr.insert(grandparentEnd, blockNode);

  // Step 2: Delete original — either just the blockNode, or the entire blockGroup if it becomes empty
  if (isOnlyChild) {
    // Delete entire blockGroup to avoid ProseMirror inserting placeholder content
    tr.delete(
      tr.mapping.map(blockGroupPos),
      tr.mapping.map(blockGroupPos + blockGroup.nodeSize)
    );
  } else {
    // Delete just the blockNode
    tr.delete(
      tr.mapping.map(blockNodePos),
      tr.mapping.map(blockNodeEnd)
    );
  }

  // Restore cursor — find the moved block's body
  const mappedInsertPos = tr.mapping.map(grandparentEnd);
  try {
    // +2 to enter blockNode > blockBody
    tr.setSelection(TextSelection.create(tr.doc, mappedInsertPos + 2));
  } catch {
    try {
      tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map($from.pos)));
    } catch {
      tr.setSelection(TextSelection.create(tr.doc, 1));
    }
  }

  dispatch(tr.scrollIntoView());
  return true;
};
