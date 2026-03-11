/**
 * Block-level commands for the Kanava editor.
 *
 * Traversal helpers live in ./traversal.ts.
 * Split / merge / dissolve commands live in ./splitMerge.ts.
 * This file keeps the higher-level block manipulation commands.
 */

import type { Command, EditorState } from "prosemirror-state";
import { TextSelection, NodeSelection } from "prosemirror-state";
import type { Node as PMNode } from "prosemirror-model";
import { findBlockNode, findBlockBody } from "./traversal.js";

// Re-export everything from sub-modules for backward compatibility
export { splitBlockNode, handleBlockBackspace, handleBlockDelete, dissolveEmptyColumn } from "./splitMerge.js";
export {
  findAncestor, findBlockNode, findBlockBody, isTextBlock,
  findPreviousTextBlock, findLastTextBlockIn,
  findNextTextBlock, findFirstTextBlockIn,
} from "./traversal.js";

/**
 * Insert a new block of a given type after the current block.
 */
export function insertBlockAfter(
  blockType: string,
  attrs?: Record<string, any>
): Command {
  return (state, dispatch) => {
    const schema = state.schema;

    const blockInfo = findBlockNode(state);
    if (!blockInfo) return false;

    if (!dispatch) return true;

    const bodyType = schema.nodes[blockType];
    if (!bodyType) return false;

    const body = bodyType.create(attrs);
    const newBlock = schema.nodes.blockNode.create({ id: "" }, body);

    const insertPos = blockInfo.pos + blockInfo.node.nodeSize;
    const tr = state.tr.insert(insertPos, newBlock);

    const cursorPos = insertPos + 2;
    tr.setSelection(TextSelection.create(tr.doc, cursorPos));
    dispatch(tr.scrollIntoView());
    return true;
  };
}

/**
 * Delete the current block (blockNode).
 */
export const deleteCurrentBlock: Command = (state, dispatch) => {
  const blockInfo = findBlockNode(state);
  if (!blockInfo) return false;

  if (!dispatch) return true;

  const tr = state.tr;
  const from = blockInfo.pos;
  const to = from + blockInfo.node.nodeSize;

  tr.delete(from, to);
  dispatch(tr.scrollIntoView());
  return true;
};

/**
 * Convert the current block's body to a different type.
 * e.g. convert paragraph → heading
 */
export function convertBlockType(
  blockType: string,
  attrs?: Record<string, any>
): Command {
  return (state, dispatch) => {
    const schema = state.schema;

    const bodyInfo = findBlockBody(state);
    if (!bodyInfo) return false;

    const targetType = schema.nodes[blockType];
    if (!targetType) return false;

    if (!dispatch) return true;

    const tr = state.tr;
    tr.setNodeMarkup(bodyInfo.pos, targetType, { ...attrs });
    dispatch(tr.scrollIntoView());
    return true;
  };
}

/**
 * Duplicate the current blockNode (Mod-d).
 */
export const duplicateBlock: Command = (state, dispatch) => {
  const blockInfo = findBlockNode(state);
  if (!blockInfo) return false;

  if (!dispatch) return true;

  const { node, pos } = blockInfo;
  const copy = node.type.create(
    { ...node.attrs, id: "" },
    node.content,
    node.marks
  );

  const insertPos = pos + node.nodeSize;
  const tr = state.tr.insert(insertPos, copy);

  tr.setSelection(TextSelection.create(tr.doc, insertPos + 2));
  dispatch(tr.scrollIntoView());
  return true;
};

/**
 * Move the current blockNode up within its parent blockGroup (Mod-Shift-ArrowUp).
 */
export const moveBlockUp: Command = (state, dispatch) => {
  const blockInfo = findBlockNode(state);
  if (!blockInfo) return false;

  const { pos, depth } = blockInfo;
  const parentDepth = depth - 1;
  if (parentDepth < 0) return false;

  const $blockStart = state.doc.resolve(pos);
  const parent = $blockStart.node(parentDepth);
  if (parent.type.name !== "blockGroup") return false;

  const indexInParent = $blockStart.index(parentDepth);
  if (indexInParent === 0) return false;

  if (!dispatch) return true;

  const tr = state.tr;
  const blockNode = blockInfo.node;
  const blockSize = blockNode.nodeSize;

  const prevBlockPos = pos - parent.child(indexInParent - 1).nodeSize;

  tr.delete(pos, pos + blockSize);
  tr.insert(tr.mapping.map(prevBlockPos), blockNode);

  const newPos = tr.mapping.map(prevBlockPos) + 2;
  tr.setSelection(TextSelection.create(tr.doc, Math.min(newPos, tr.doc.content.size - 1)));
  dispatch(tr.scrollIntoView());
  return true;
};

/**
 * Move the current blockNode down within its parent blockGroup (Mod-Shift-ArrowDown).
 */
export const moveBlockDown: Command = (state, dispatch) => {
  const blockInfo = findBlockNode(state);
  if (!blockInfo) return false;

  const { pos, depth } = blockInfo;
  const parentDepth = depth - 1;
  if (parentDepth < 0) return false;

  const $blockStart = state.doc.resolve(pos);
  const parent = $blockStart.node(parentDepth);
  if (parent.type.name !== "blockGroup") return false;

  const indexInParent = $blockStart.index(parentDepth);
  if (indexInParent >= parent.childCount - 1) return false;

  if (!dispatch) return true;

  const tr = state.tr;
  const blockNode = blockInfo.node;
  const blockSize = blockNode.nodeSize;
  const nextBlockSize = parent.child(indexInParent + 1).nodeSize;

  const targetPos = pos + blockSize + nextBlockSize;

  tr.insert(targetPos, blockNode);
  tr.delete(pos, pos + blockSize);

  const newPos = tr.mapping.map(pos + nextBlockSize) + 2;
  tr.setSelection(TextSelection.create(tr.doc, Math.min(newPos, tr.doc.content.size - 1)));
  dispatch(tr.scrollIntoView());
  return true;
};

/**
 * Toggle the collapsed state of a toggle block (Ctrl-Enter / Mod-Enter).
 */
export const toggleCollapseBlock: Command = (state, dispatch) => {
  const { $from } = state.selection;

  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d);
    if (node.type.name === "toggle") {
      if (!dispatch) return true;
      const pos = $from.before(d);
      const tr = state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        collapsed: !node.attrs.collapsed,
      });
      dispatch(tr.scrollIntoView());
      return true;
    }
  }
  return false;
};
