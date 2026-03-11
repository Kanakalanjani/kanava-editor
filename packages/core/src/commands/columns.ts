/**
 * Column layout commands — create, add, remove, resize columns.
 * @see packages/docs/architecture-columnLayout.md
 */
import type { Command } from "prosemirror-state";
import { TextSelection, NodeSelection } from "prosemirror-state";
import { Fragment, type Node as PMNode } from "prosemirror-model";

/**
 * Create a column layout from the current block.
 * Wraps the current blockNode into a two-column layout.
 *
 * Before:
 *   blockGroup
 *     blockNode(content)
 *
 * After:
 *   blockGroup
 *     columnLayout
 *       column { width: 1 }
 *         blockNode(content)
 *       column { width: 1 }
 *         blockNode(empty paragraph)
 */
export function createColumnLayout(numColumns = 2): Command {
  return (state, dispatch) => {
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

    if (!dispatch) return true;

    const tr = state.tr;
    const blockNode = $from.node(blockNodeDepth);
    const blockNodePos = $from.before(blockNodeDepth);
    const blockNodeEnd = $from.after(blockNodeDepth);

    // Build columns
    const columns: PMNode[] = [];

    // First column gets the current block's content
    const firstBlock = blockNode.copy(blockNode.content);
    const firstColumn = schema.nodes.column.create(
      { width: 1 },
      firstBlock
    );
    columns.push(firstColumn);

    // Remaining columns get empty paragraphs
    for (let i = 1; i < numColumns; i++) {
      const emptyBlock = schema.nodes.blockNode.create(
        { id: "" },
        schema.nodes.paragraph.create()
      );
      const col = schema.nodes.column.create({ width: 1 }, emptyBlock);
      columns.push(col);
    }

    const colLayout = schema.nodes.columnLayout.create(
      null,
      Fragment.from(columns)
    );

    // Wrap the columnLayout in a blockNode
    const wrapperBlockNode = schema.nodes.blockNode.create(
      { id: "" },
      colLayout
    );

    // Replace the blockNode with the wrapper blockNode > columnLayout
    tr.replaceWith(blockNodePos, blockNodeEnd, wrapperBlockNode);

    // Place cursor inside the second column's paragraph
    // wrapperBlockNode > columnLayout > column > blockNode > paragraph
    const newPos = blockNodePos + 1 // wrapperBlockNode open
      + 1                          // columnLayout open
      + columns[0].nodeSize        // skip first column
      + 1                          // second column open
      + 1                          // blockNode open
      + 1;                         // paragraph open
    try {
      tr.setSelection(TextSelection.create(tr.doc, newPos));
    } catch {
      // fallback
    }

    dispatch(tr.scrollIntoView());
    return true;
  };
}

/**
 * Add a column to an existing column layout.
 */
export const addColumn: Command = (state, dispatch) => {
  const { $from } = state.selection;
  const schema = state.schema;

  // Find the columnLayout ancestor
  let colLayoutDepth = -1;
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type.name === "columnLayout") {
      colLayoutDepth = d;
      break;
    }
  }
  if (colLayoutDepth === -1) return false;

  if (!dispatch) return true;

  const tr = state.tr;
  const colLayoutEnd = $from.after(colLayoutDepth);

  // Create a new column with an empty block
  const emptyBlock = schema.nodes.blockNode.create(
    { id: "" },
    schema.nodes.paragraph.create()
  );
  const newColumn = schema.nodes.column.create({ width: 1 }, emptyBlock);

  // Insert before the closing tag of columnLayout
  tr.insert(colLayoutEnd - 1, newColumn);

  // Place cursor in the new column
  const newPos = colLayoutEnd - 1 + 1 + 1 + 1; // column open + blockNode open + paragraph open
  try {
    tr.setSelection(TextSelection.create(tr.doc, newPos));
  } catch {
    // fallback
  }

  dispatch(tr.scrollIntoView());
  return true;
};

/**
 * Add a column to the left of the column containing the cursor.
 */
export const addColumnLeft: Command = (state, dispatch) => {
  const { $from } = state.selection;
  const schema = state.schema;

  // Find the column ancestor
  let columnDepth = -1;
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type.name === "column") {
      columnDepth = d;
      break;
    }
  }
  if (columnDepth === -1) return false;

  if (!dispatch) return true;

  const tr = state.tr;
  const columnPos = $from.before(columnDepth);

  // Create a new column with an empty block
  const emptyBlock = schema.nodes.blockNode.create(
    { id: "" },
    schema.nodes.paragraph.create()
  );
  const newColumn = schema.nodes.column.create({ width: 1 }, emptyBlock);

  // Insert before the current column
  tr.insert(columnPos, newColumn);

  // Place cursor in the new column
  const newPos = columnPos + 1 + 1 + 1; // column open + blockNode open + paragraph open
  try {
    tr.setSelection(TextSelection.create(tr.doc, newPos));
  } catch { /* fallback */ }

  dispatch(tr.scrollIntoView());
  return true;
};

/**
 * Add a column to the right of the column containing the cursor.
 */
export const addColumnRight: Command = (state, dispatch) => {
  const { $from } = state.selection;
  const schema = state.schema;

  // Find the column ancestor
  let columnDepth = -1;
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type.name === "column") {
      columnDepth = d;
      break;
    }
  }
  if (columnDepth === -1) return false;

  if (!dispatch) return true;

  const tr = state.tr;
  const columnEnd = $from.after(columnDepth);

  // Create a new column with an empty block
  const emptyBlock = schema.nodes.blockNode.create(
    { id: "" },
    schema.nodes.paragraph.create()
  );
  const newColumn = schema.nodes.column.create({ width: 1 }, emptyBlock);

  // Insert after the current column
  tr.insert(columnEnd, newColumn);

  // Place cursor in the new column
  const newPos = columnEnd + 1 + 1 + 1; // column open + blockNode open + paragraph open
  try {
    tr.setSelection(TextSelection.create(tr.doc, newPos));
  } catch { /* fallback */ }

  dispatch(tr.scrollIntoView());
  return true;
};

/**
 * Remove the current column from a column layout.
 * If only 2 columns remain, unwrap the layout entirely.
 */
export const removeColumn: Command = (state, dispatch) => {
  const { $from } = state.selection;

  // Find the column ancestor
  let columnDepth = -1;
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type.name === "column") {
      columnDepth = d;
      break;
    }
  }
  if (columnDepth === -1) return false;

  // Find the columnLayout parent
  const colLayoutDepth = columnDepth - 1;
  if (colLayoutDepth < 0) return false;
  const colLayout = $from.node(colLayoutDepth);
  if (colLayout.type.name !== "columnLayout") return false;

  // Find the wrapper blockNode parent
  const wrapperDepth = colLayoutDepth - 1;
  if (wrapperDepth < 0) return false;
  if ($from.node(wrapperDepth).type.name !== "blockNode") return false;

  if (!dispatch) return true;

  const tr = state.tr;
  const wrapperPos = $from.before(wrapperDepth);
  const wrapperEnd = $from.after(wrapperDepth);

  if (colLayout.childCount <= 2) {
    // Unwrap: replace the wrapper blockNode with the blocks from the remaining column
    const columnIndex = $from.index(colLayoutDepth);
    const remainingIndex = columnIndex === 0 ? 1 : 0;
    const remainingColumn = colLayout.child(remainingIndex);

    // Extract blocks from the remaining column
    const blocks: PMNode[] = [];
    remainingColumn.forEach((block) => {
      blocks.push(block);
    });

    tr.replaceWith(wrapperPos, wrapperEnd, blocks);
    dispatch(tr.scrollIntoView());
    return true;
  }

  // Remove just this column
  const columnPos = $from.before(columnDepth);
  const columnEnd = $from.after(columnDepth);
  tr.delete(columnPos, columnEnd);

  dispatch(tr.scrollIntoView());
  return true;
};

/**
 * Set column width (flex-grow value).
 */
export function setColumnWidth(width: number): Command {
  return (state, dispatch) => {
    const { $from } = state.selection;

    // Find the column ancestor
    let columnDepth = -1;
    for (let d = $from.depth; d >= 0; d--) {
      if ($from.node(d).type.name === "column") {
        columnDepth = d;
        break;
      }
    }
    if (columnDepth === -1) return false;

    if (!dispatch) return true;

    const tr = state.tr;
    const columnPos = $from.before(columnDepth);
    tr.setNodeMarkup(columnPos, undefined, { width });

    dispatch(tr.scrollIntoView());
    return true;
  };
}

// Re-exported column commands (extracted for modularity)
export { handleBackspaceInColumn, extractFromColumn } from "./columnBackspace.js";
