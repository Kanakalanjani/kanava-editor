/**
 * Column-specific backspace and extraction commands.
 * Extracted from columns.ts for modularity.
 */

import type { Command } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import type { Node as PMNode } from "prosemirror-model";

/**
 * Handle Backspace in an empty block inside a column.
 *
 * Behavior:
 * 1. If the block is not empty, or cursor isn't at start → pass through.
 * 2. If the block is not a plain paragraph → convert to paragraph first.
 * 3. If there are sibling blocks in the column → delete this block,
 *    move cursor to end of previous sibling (or start of next).
 * 4. If this is the only block in the column:
 *    - ≤2 columns → dissolve the entire columnLayout, placing remaining
 *      column's blocks into the parent.
 *    - >2 columns → remove just this column.
 *
 * The columnLayout is wrapped in a blockNode (Option B):
 *   blockNode > columnLayout > column+ > blockNode+
 */
export const handleBackspaceInColumn: Command = (state, dispatch) => {
    const { $from } = state.selection;

    if (!(state.selection instanceof TextSelection)) return false;
    if (!state.selection.empty) return false;

    // Find blockBody
    let blockBodyDepth = -1;
    for (let d = $from.depth; d >= 0; d--) {
        if ($from.node(d).type.spec.group?.includes("blockBody")) {
            blockBodyDepth = d;
            break;
        }
    }
    if (blockBodyDepth === -1) return false;

    // Cursor must be at the very start of the blockBody
    if ($from.pos !== $from.start(blockBodyDepth)) return false;

    // Find blockNode parent
    const blockNodeDepth = blockBodyDepth - 1;
    if (blockNodeDepth < 0) return false;
    const blockNode = $from.node(blockNodeDepth);
    if (blockNode.type.name !== "blockNode") return false;

    // Find column ancestor
    let columnDepth = -1;
    for (let d = blockNodeDepth - 1; d >= 0; d--) {
        if ($from.node(d).type.name === "column") {
            columnDepth = d;
            break;
        }
    }
    if (columnDepth === -1) return false;

    const column = $from.node(columnDepth);
    const blockBody = $from.node(blockBodyDepth);

    // If blockBody is not a paragraph, convert to paragraph first
    if (blockBody.type.name !== "paragraph") {
        if (!dispatch) return true;
        const tr = state.tr;
        const bodyPos = $from.before(blockBodyDepth);
        tr.setNodeMarkup(bodyPos, state.schema.nodes.paragraph);
        dispatch(tr.scrollIntoView());
        return true;
    }

    // Only act on empty blocks
    if (blockBody.content.size !== 0) return false;

    // Also only handle blocks without nested children (no blockGroup child)
    if (blockNode.childCount > 1) return false;

    // Find columnLayout ancestor (parent of column)
    const colLayoutDepth = columnDepth - 1;
    if (colLayoutDepth < 0) return false;
    const colLayout = $from.node(colLayoutDepth);
    if (colLayout.type.name !== "columnLayout") return false;

    // Find wrapper blockNode (parent of columnLayout)
    const wrapperDepth = colLayoutDepth - 1;
    if (wrapperDepth < 0) return false;
    if ($from.node(wrapperDepth).type.name !== "blockNode") return false;

    if (!dispatch) return true;

    const tr = state.tr;
    const blockNodePos = $from.before(blockNodeDepth);
    const blockNodeEnd = $from.after(blockNodeDepth);
    const columnPos = $from.before(columnDepth);
    const columnEnd = $from.after(columnDepth);
    const wrapperPos = $from.before(wrapperDepth);
    const wrapperEnd = $from.after(wrapperDepth);
    const blockIndexInColumn = $from.index(columnDepth);

    if (column.childCount > 1) {
        // Case: multiple blocks in this column — just delete this block
        tr.delete(blockNodePos, blockNodeEnd);

        // Move cursor to the end of the previous sibling, or start of next
        if (blockIndexInColumn > 0) {
            const prevBlock = column.child(blockIndexInColumn - 1);
            const prevBlockBody = prevBlock.firstChild!;
            let offset = $from.start(columnDepth);
            for (let i = 0; i < blockIndexInColumn - 1; i++) {
                offset += column.child(i).nodeSize;
            }
            const prevBodyEnd = offset + 1 + prevBlockBody.nodeSize - 1;
            const mapped = tr.mapping.map(prevBodyEnd);
            try {
                tr.setSelection(TextSelection.create(tr.doc, mapped));
            } catch { /* fallback */ }
        } else {
            const nextBodyStart = tr.mapping.map(blockNodePos) + 2;
            try {
                tr.setSelection(TextSelection.create(tr.doc, nextBodyStart));
            } catch { /* fallback */ }
        }

        dispatch(tr.scrollIntoView());
        return true;
    }

    // Case: only block in the column — dissolve the column
    if (colLayout.childCount <= 2) {
        const colIndex = $from.index(colLayoutDepth);
        const blocks: PMNode[] = [];
        colLayout.forEach((col, _offset, i) => {
            if (i !== colIndex) {
                col.forEach((block) => blocks.push(block));
            }
        });

        if (blocks.length === 0) {
            const schema = state.schema;
            blocks.push(
                schema.nodes.blockNode.create(
                    { id: "" },
                    schema.nodes.paragraph.create()
                )
            );
        }

        tr.replaceWith(wrapperPos, wrapperEnd, blocks);

        const cursorPos = wrapperPos + 2;
        try {
            tr.setSelection(TextSelection.create(tr.doc, cursorPos));
        } catch { /* fallback */ }

        dispatch(tr.scrollIntoView());
        return true;
    }

    // >2 columns → remove just this column
    tr.delete(columnPos, columnEnd);

    const colIndex = $from.index(colLayoutDepth);
    if (colIndex > 0) {
        const prevCol = colLayout.child(colIndex - 1);
        let offset = $from.start(colLayoutDepth);
        for (let i = 0; i < colIndex - 1; i++) {
            offset += colLayout.child(i).nodeSize;
        }
        const bodyEnd = offset + prevCol.nodeSize - 1 - 1;
        const mapped = tr.mapping.map(bodyEnd);
        try {
            tr.setSelection(TextSelection.create(tr.doc, mapped));
        } catch { /* fallback */ }
    } else {
        const mapped = tr.mapping.map(columnPos) + 1 + 1 + 1;
        try {
            tr.setSelection(TextSelection.create(tr.doc, mapped));
        } catch { /* fallback */ }
    }

    dispatch(tr.scrollIntoView());
    return true;
};

/**
 * Extract the current block from its parent column.
 * Moves the block to after the wrapper blockNode (which contains the columnLayout)
 * and cleans up empty columns.
 * If the column layout would have only one column left, dissolve the entire layout.
 */
export const extractFromColumn: Command = (state, dispatch) => {
    const { $from } = state.selection;

    // Find the blockNode containing the cursor
    let blockNodeDepth = -1;
    for (let d = $from.depth; d >= 0; d--) {
        if ($from.node(d).type.name === "blockNode") {
            blockNodeDepth = d;
            break;
        }
    }
    if (blockNodeDepth === -1) return false;

    // Find the column ancestor
    let columnDepth = -1;
    for (let d = blockNodeDepth - 1; d >= 0; d--) {
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
    const blockNode = $from.node(blockNodeDepth);
    const blockNodePos = $from.before(blockNodeDepth);
    const blockNodeEnd = $from.after(blockNodeDepth);
    const column = $from.node(columnDepth);
    const wrapperPos = $from.before(wrapperDepth);
    const wrapperEnd = $from.after(wrapperDepth);

    const isOnlyBlockInColumn = column.childCount === 1;
    const hasOnlyTwoColumns = colLayout.childCount === 2;

    if (isOnlyBlockInColumn && hasOnlyTwoColumns) {
        const columnIndex = $from.index(colLayoutDepth);
        const otherColumnIndex = columnIndex === 0 ? 1 : 0;
        const otherColumn = colLayout.child(otherColumnIndex);

        const blocks: PMNode[] = [];
        if (columnIndex === 0) {
            blocks.push(blockNode.copy(blockNode.content));
            otherColumn.forEach((block) => blocks.push(block));
        } else {
            otherColumn.forEach((block) => blocks.push(block));
            blocks.push(blockNode.copy(blockNode.content));
        }

        tr.replaceWith(wrapperPos, wrapperEnd, blocks);

        const newPos = columnIndex === 0 ? wrapperPos + 2 : wrapperPos + otherColumn.content.size + 2 * otherColumn.childCount + 2;
        try {
            tr.setSelection(TextSelection.create(tr.doc, newPos));
        } catch { /* fallback */ }

        dispatch(tr.scrollIntoView());
        return true;
    }

    if (isOnlyBlockInColumn) {
        tr.insert(wrapperEnd, blockNode);
        const columnPos = $from.before(columnDepth);
        tr.delete(columnPos, $from.after(columnDepth));

        const mappedEnd = tr.mapping.map(wrapperEnd);
        try {
            tr.setSelection(TextSelection.create(tr.doc, mappedEnd + 2));
        } catch { /* fallback */ }

        dispatch(tr.scrollIntoView());
        return true;
    }

    // Multiple blocks in column — just move this block out
    tr.insert(wrapperEnd, blockNode);
    tr.delete(tr.mapping.map(blockNodePos), tr.mapping.map(blockNodeEnd));

    const mappedEnd = tr.mapping.map(wrapperEnd);
    try {
        tr.setSelection(TextSelection.create(tr.doc, mappedEnd + 2));
    } catch { /* fallback */ }

    dispatch(tr.scrollIntoView());
    return true;
};
