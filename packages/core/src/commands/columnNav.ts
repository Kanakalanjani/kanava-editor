import type { Command } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import type { Node as PMNode, ResolvedPos } from "prosemirror-model";

/**
 * Helper: check whether $pos is at the very start of a column.
 * Returns the column depth if so, else -1.
 */
function atColumnStart($pos: ResolvedPos): number {
  for (let d = $pos.depth; d >= 0; d--) {
    if ($pos.node(d).type.name === "column") {
      // Check if cursor is at the very start of this column
      if ($pos.pos === $pos.start(d)) return d;
      // Walk up through inner nodes — if every ancestor between
      // the column and the cursor is the first child at offset 0,
      // we're at the logical start.
      let atStart = true;
      for (let dd = $pos.depth; dd > d; dd--) {
        if ($pos.parentOffset !== 0 && dd === $pos.depth) {
          atStart = false;
          break;
        }
        if ($pos.index(dd - 1) !== 0) {
          atStart = false;
          break;
        }
      }
      if (atStart && $pos.parentOffset === 0) return d;
      return -1;
    }
  }
  return -1;
}

/**
 * Helper: check whether $pos is at the very end of a column.
 * Returns the column depth if so, else -1.
 */
function atColumnEnd($pos: ResolvedPos): number {
  for (let d = $pos.depth; d >= 0; d--) {
    if ($pos.node(d).type.name === "column") {
      // Check if cursor is at the very end of this column
      if ($pos.pos === $pos.end(d)) return d;
      // Walk up: if every ancestor between column and cursor is the
      // last child at end offset, we are at the logical end.
      let atEnd = true;
      for (let dd = $pos.depth; dd > d; dd--) {
        const parent = $pos.node(dd - 1);
        if (dd === $pos.depth) {
          if ($pos.parentOffset !== $pos.parent.content.size) {
            atEnd = false;
            break;
          }
        }
        if ($pos.index(dd - 1) !== parent.childCount - 1) {
          atEnd = false;
          break;
        }
      }
      if (atEnd && $pos.parentOffset === $pos.parent.content.size) return d;
      return -1;
    }
  }
  return -1;
}

/**
 * When pressing ArrowUp at the very start of a column,
 * jump to the end of the block immediately before the wrapper blockNode
 * that contains the columnLayout.
 */
export const exitColumnUp: Command = (state, dispatch) => {
  const { $from } = state.selection;
  if (!(state.selection instanceof TextSelection)) return false;
  if (!state.selection.empty) return false;

  const colDepth = atColumnStart($from);
  if (colDepth === -1) return false;

  // Only exit from the first column
  const colLayoutDepth = colDepth - 1;
  if (colLayoutDepth < 0) return false;
  const colIndex = $from.index(colLayoutDepth);
  if (colIndex !== 0) return false;

  // The columnLayout is inside a wrapper blockNode (Option B)
  const wrapperDepth = colLayoutDepth - 1;
  if (wrapperDepth < 0) return false;
  if ($from.node(wrapperDepth).type.name !== "blockNode") return false;

  const parentDepth = wrapperDepth - 1;
  if (parentDepth < 0) return false;

  const wrapperPos = $from.before(wrapperDepth);

  if ($from.index(parentDepth) === 0) {
    // Column wrapper is the first block — create an empty paragraph above
    if (!dispatch) return true;
    const { blockNode, paragraph } = state.schema.nodes;
    const newBlock = blockNode.create({ id: "" }, paragraph.create());
    const tr = state.tr.insert(wrapperPos, newBlock);
    const sel = TextSelection.create(tr.doc, wrapperPos + 2);
    dispatch(tr.setSelection(sel).scrollIntoView());
    return true;
  }

  if (!dispatch) return true;

  // Place cursor at the end of the previous node
  const prevPos = wrapperPos - 1;
  try {
    const sel = TextSelection.create(state.doc, prevPos);
    dispatch(state.tr.setSelection(sel).scrollIntoView());
    return true;
  } catch {
    return false;
  }
};

/**
 * When pressing ArrowDown at the very end of the last column,
 * jump to the start of the block immediately after the wrapper blockNode
 * that contains the columnLayout.
 */
export const exitColumnDown: Command = (state, dispatch) => {
  const { $from } = state.selection;
  if (!(state.selection instanceof TextSelection)) return false;
  if (!state.selection.empty) return false;

  const colDepth = atColumnEnd($from);
  if (colDepth === -1) return false;

  // Only exit from the last column
  const colLayoutDepth = colDepth - 1;
  if (colLayoutDepth < 0) return false;
  const colLayout = $from.node(colLayoutDepth);
  const colIndex = $from.index(colLayoutDepth);
  if (colIndex !== colLayout.childCount - 1) return false;

  // The columnLayout is inside a wrapper blockNode (Option B)
  const wrapperDepth = colLayoutDepth - 1;
  if (wrapperDepth < 0) return false;
  if ($from.node(wrapperDepth).type.name !== "blockNode") return false;

  const parentDepth = wrapperDepth - 1;
  if (parentDepth < 0) return false;
  const parentNode = $from.node(parentDepth);

  const wrapperEnd = $from.after(wrapperDepth);

  if ($from.index(parentDepth) >= parentNode.childCount - 1) {
    // Column wrapper is the last block — create an empty paragraph below
    if (!dispatch) return true;
    const { blockNode, paragraph } = state.schema.nodes;
    const newBlock = blockNode.create({ id: "" }, paragraph.create());
    const tr = state.tr.insert(wrapperEnd, newBlock);
    const sel = TextSelection.create(tr.doc, wrapperEnd + 2);
    dispatch(tr.setSelection(sel).scrollIntoView());
    return true;
  }

  if (!dispatch) return true;

  // Place cursor at the start of the next node
  const nextPos = wrapperEnd + 1;
  try {
    const sel = TextSelection.create(state.doc, nextPos);
    dispatch(state.tr.setSelection(sel).scrollIntoView());
    return true;
  } catch {
    return false;
  }
};
