/**
 * Block split / merge / dissolve commands.
 *
 * - splitBlockNode   — Enter inside a block creates a new sibling.
 * - handleBlockBackspace — Backspace at start merges with previous text block.
 * - handleBlockDelete   — Delete at end merges with next text block.
 * - dissolveEmptyColumn — Removes a column after all its blocks are deleted.
 *
 * Extracted from block.ts for modularity.
 */

import type { Command, Transaction } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import type { Node as PMNode } from "prosemirror-model";
import { handleBackspaceInColumn } from "./columns.js";
import { findPreviousTextBlock, findNextTextBlock, isTextBlock } from "./traversal.js";

/**
 * Dissolve a column after a block has been removed from it.
 * If the column is now empty:
 *   - If ≤2 columns remain → dissolve the entire columnLayout
 *   - If >2 columns → remove just this column
 *
 * This function modifies the transaction in place.
 */
export function dissolveEmptyColumn(
    tr: Transaction,
    doc: PMNode,
    columnPos: number
): void {
    const $col = doc.resolve(columnPos + 1);

    let colDepth = -1;
    for (let d = $col.depth; d >= 0; d--) {
        if ($col.node(d).type.name === "column") {
            colDepth = d;
            break;
        }
    }
    if (colDepth === -1) return;

    const column = $col.node(colDepth);
    if (column.childCount > 0) return;

    const colLayoutDepth = colDepth - 1;
    if (colLayoutDepth < 0) return;
    const colLayout = $col.node(colLayoutDepth);
    if (colLayout.type.name !== "columnLayout") return;

    const wrapperDepth = colLayoutDepth - 1;
    if (wrapperDepth < 0) return;
    if ($col.node(wrapperDepth).type.name !== "blockNode") return;

    const wrapperPos = $col.before(wrapperDepth);
    const wrapperEnd = $col.after(wrapperDepth);
    const colIndex = $col.index(colLayoutDepth);

    if (colLayout.childCount <= 2) {
        const blocks: PMNode[] = [];
        colLayout.forEach((col, _offset, i) => {
            if (i !== colIndex) {
                col.forEach((block) => blocks.push(block));
            }
        });

        if (blocks.length === 0) {
            const schema = doc.type.schema;
            blocks.push(
                schema.nodes.blockNode.create(
                    { id: "" },
                    schema.nodes.paragraph.create()
                )
            );
        }

        tr.replaceWith(wrapperPos, wrapperEnd, blocks);
    } else {
        const mappedColPos = $col.before(colDepth);
        const mappedColEnd = $col.after(colDepth);
        tr.delete(mappedColPos, mappedColEnd);
    }
}

/**
 * Split a blockNode at the cursor position.
 * When Enter is pressed inside a blockBody (paragraph, heading, etc.),
 * we create a new sibling blockNode with a paragraph.
 */
export const splitBlockNode: Command = (state, dispatch) => {
    const { $from, $to } = state.selection;

    if (!(state.selection instanceof TextSelection)) return false;

    let blockBodyDepth = -1;
    for (let d = $from.depth; d >= 0; d--) {
        if ($from.node(d).type.spec.group?.includes("blockBody")) {
            blockBodyDepth = d;
            break;
        }
    }
    if (blockBodyDepth === -1) return false;

    const blockNodeDepth = blockBodyDepth - 1;
    if (blockNodeDepth < 0) return false;
    const blockNode = $from.node(blockNodeDepth);
    if (blockNode.type.name !== "blockNode") return false;

    if (!dispatch) return true;

    const schema = state.schema;
    const blockNodeEnd = $from.after(blockNodeDepth);

    const blockBody = $from.node(blockBodyDepth);
    const blockBodyType = blockBody.type;
    const atEnd = $from.pos === $from.end(blockBodyDepth);
    const isEmpty = blockBody.content.size === 0;

    const continuableTypes = new Set([
        "bulletListItem",
        "numberedListItem",
        "checklistItem",
    ]);
    const isContinuable = continuableTypes.has(blockBodyType.name);

    if (isEmpty && isContinuable) {
        const tr = state.tr;
        const bodyPos = $from.before(blockBodyDepth);
        tr.setNodeMarkup(bodyPos, schema.nodes.paragraph);
        dispatch(tr.scrollIntoView());
        return true;
    }

    let newBodyNode: PMNode;
    if (isContinuable) {
        const nextAttrs: Record<string, any> = {};
        if (blockBodyType.name === "numberedListItem") {
            nextAttrs.order = (blockBody.attrs.order ?? 1) + 1;
        }
        if (blockBodyType.name === "checklistItem") {
            nextAttrs.checked = false;
        }
        newBodyNode = blockBodyType.create(nextAttrs);
    } else {
        newBodyNode = schema.nodes.paragraph.create();
    }

    if (isEmpty || atEnd) {
        const newBlockNode = schema.nodes.blockNode.create({ id: "" }, newBodyNode);
        const tr = state.tr.insert(blockNodeEnd, newBlockNode);

        const newPos = blockNodeEnd + 2;
        tr.setSelection(TextSelection.create(tr.doc, newPos));
        dispatch(tr.scrollIntoView());
        return true;
    }

    const tr = state.tr;

    const contentAfter = blockBody.cut($from.pos - $from.start(blockBodyDepth));

    tr.delete($from.pos, $from.end(blockBodyDepth));

    let splitBodyNode: PMNode;
    if (isContinuable) {
        const nextAttrs: Record<string, any> = {};
        if (blockBodyType.name === "numberedListItem") {
            nextAttrs.order = (blockBody.attrs.order ?? 1) + 1;
        }
        if (blockBodyType.name === "checklistItem") {
            nextAttrs.checked = false;
        }
        splitBodyNode = blockBodyType.create(nextAttrs, contentAfter.content);
    } else {
        splitBodyNode = schema.nodes.paragraph.create(null, contentAfter.content);
    }
    const splitBlock = schema.nodes.blockNode.create({ id: "" }, splitBodyNode);

    const endPos = tr.mapping.map(blockNodeEnd);
    tr.insert(endPos, splitBlock);

    tr.setSelection(TextSelection.create(tr.doc, endPos + 2));
    dispatch(tr.scrollIntoView());
    return true;
};

/**
 * Handle Backspace at the start of a blockBody.
 * Cross-column sequential merge: finds the nearest text-content block
 * above in sequential order and merges inline content into it.
 */
export const handleBlockBackspace: Command = (state, dispatch) => {
    const { $from } = state.selection;

    if (!(state.selection instanceof TextSelection)) return false;
    if (!state.selection.empty) return false;

    let blockBodyDepth = -1;
    for (let d = $from.depth; d >= 0; d--) {
        if ($from.node(d).type.spec.group?.includes("blockBody")) {
            blockBodyDepth = d;
            break;
        }
    }
    if (blockBodyDepth === -1) return false;

    const atStart = $from.pos === $from.start(blockBodyDepth);
    if (!atStart) return false;

    const blockNodeDepth = blockBodyDepth - 1;
    if (blockNodeDepth < 0) return false;
    const blockNode = $from.node(blockNodeDepth);
    if (blockNode.type.name !== "blockNode") return false;

    let inColumn = false;
    for (let d = blockNodeDepth - 1; d >= 0; d--) {
        if ($from.node(d).type.name === "column") {
            inColumn = true;
            break;
        }
    }

    const blockBody = $from.node(blockBodyDepth);
    if (blockBody.type.name !== "paragraph") {
        if (!dispatch) return true;
        const tr = state.tr;
        const bodyPos = $from.before(blockBodyDepth);
        tr.setNodeMarkup(bodyPos, state.schema.nodes.paragraph);
        dispatch(tr.scrollIntoView());
        return true;
    }

    const blockGroupDepth = blockNodeDepth - 1;
    if (blockGroupDepth < 0) return false;
    const blockGroup = $from.node(blockGroupDepth);
    if (blockGroup.type.name !== "blockGroup" && blockGroup.type.name !== "column") {
        if (blockGroup.type.name !== "blockGroup") return false;
    }

    let nestingDepth = 0;
    for (let d = $from.depth; d >= 0; d--) {
        if ($from.node(d).type.name === "blockGroup") nestingDepth++;
    }

    if (nestingDepth > 1 && !inColumn) {
        return false;
    }

    const blockNodePos = $from.before(blockNodeDepth);
    const currentBody = $from.node(blockBodyDepth);

    const prevBlock = findPreviousTextBlock(state, blockNodePos, blockNodeDepth);

    if (!prevBlock) {
        return false;
    }

    if (!dispatch) return true;

    const tr = state.tr;
    const prevBody = prevBlock.node.firstChild!;
    const prevBodyEndPos = prevBlock.pos + 1 + prevBody.nodeSize - 1;

    if (currentBody.content.size === 0 && blockNode.childCount === 1) {
        tr.delete(blockNodePos, $from.after(blockNodeDepth));
        const cursorPos = tr.mapping.map(prevBodyEndPos);
        try {
            tr.setSelection(TextSelection.create(tr.doc, cursorPos));
        } catch { /* fallback */ }
    } else {
        const contentToMerge = currentBody.content;
        const blockNodeEnd = $from.after(blockNodeDepth);

        if (contentToMerge.size > 0) {
            tr.insert(prevBodyEndPos, contentToMerge);
        }

        const mappedFrom = tr.mapping.map(blockNodePos);
        const mappedTo = tr.mapping.map(blockNodeEnd);
        tr.delete(mappedFrom, mappedTo);

        const cursorPos = tr.mapping.map(prevBodyEndPos);
        try {
            tr.setSelection(TextSelection.create(tr.doc, cursorPos));
        } catch { /* fallback */ }
    }

    dispatch(tr.scrollIntoView());
    return true;
};

/**
 * Handle Delete at the end of a blockBody.
 * Finds the next text-content block (crossing column boundaries)
 * and merges its inline content into the current block.
 */
export const handleBlockDelete: Command = (state, dispatch) => {
    const { $from } = state.selection;

    if (!(state.selection instanceof TextSelection)) return false;
    if (!state.selection.empty) return false;

    let blockBodyDepth = -1;
    for (let d = $from.depth; d >= 0; d--) {
        if ($from.node(d).type.spec.group?.includes("blockBody")) {
            blockBodyDepth = d;
            break;
        }
    }
    if (blockBodyDepth === -1) return false;

    const atEnd = $from.pos === $from.end(blockBodyDepth);
    if (!atEnd) return false;

    const blockNodeDepth = blockBodyDepth - 1;
    if (blockNodeDepth < 0) return false;
    const blockNode = $from.node(blockNodeDepth);
    if (blockNode.type.name !== "blockNode") return false;

    const blockNodePos = $from.before(blockNodeDepth);

    const nextBlock = findNextTextBlock(state, blockNodePos, blockNodeDepth, blockNode);
    if (!nextBlock) return false;

    if (!dispatch) return true;

    const tr = state.tr;
    const cursorPos = $from.pos;

    const nextBody = nextBlock.node.firstChild!;
    const nextBodyContent = nextBody.content;
    const nextBlockEnd = nextBlock.pos + nextBlock.node.nodeSize;

    if (nextBodyContent.size > 0) {
        tr.insert($from.pos, nextBodyContent);
    }

    const mappedFrom = tr.mapping.map(nextBlock.pos);
    const mappedTo = tr.mapping.map(nextBlockEnd);
    tr.delete(mappedFrom, mappedTo);

    try {
        tr.setSelection(TextSelection.create(tr.doc, cursorPos));
    } catch { /* fallback */ }

    dispatch(tr.scrollIntoView());
    return true;
};
