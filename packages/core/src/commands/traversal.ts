/**
 * Traversal helpers for navigating the block tree.
 *
 * These are pure query functions — they never modify state.
 * Extracted from block.ts for modularity.
 */

import type { EditorState } from "prosemirror-state";
import { NodeSelection } from "prosemirror-state";
import type { Node as PMNode, ResolvedPos } from "prosemirror-model";

/**
 * Find the nearest ancestor of a given type name.
 */
export function findAncestor(
    $pos: ResolvedPos,
    typeName: string
): { node: PMNode; pos: number; depth: number } | null {
    for (let d = $pos.depth; d >= 0; d--) {
        const node = $pos.node(d);
        if (node.type.name === typeName) {
            return { node, pos: $pos.before(d), depth: d };
        }
    }
    return null;
}

/**
 * Find the blockNode for the current selection.
 *
 * Handles three cases:
 *  1. **NodeSelection on a blockNode** (drag handle) — the selected node
 *     IS the blockNode; `$from` won't have it as an ancestor.
 *  2. **NodeSelection on a blockBody** (e.g. clicking an image) — blockNode
 *     is a proper ancestor of `$from`.
 *  3. **TextSelection** (cursor inside text) — blockNode is a proper
 *     ancestor of `$from`.
 */
export function findBlockNode(
    state: EditorState
): { node: PMNode; pos: number; depth: number } | null {
    const { selection } = state;

    if (
        selection instanceof NodeSelection &&
        selection.node.type.name === "blockNode"
    ) {
        return {
            node: selection.node,
            pos: selection.from,
            depth: selection.$from.depth + 1,
        };
    }

    return findAncestor(selection.$from, "blockNode");
}

/**
 * Find the blockBody node for the current selection (e.g. paragraph,
 * heading, image).  Used by convertBlockType.
 *
 * Handles NodeSelection on a blockNode (where the body is the first
 * child) as well as the normal cursor-inside-text case.
 */
export function findBlockBody(
    state: EditorState
): { node: PMNode; pos: number; depth: number } | null {
    const { selection } = state;

    if (
        selection instanceof NodeSelection &&
        selection.node.type.name === "blockNode"
    ) {
        const body = selection.node.firstChild;
        if (body && body.type.spec.group?.includes("blockBody")) {
            return {
                node: body,
                pos: selection.from + 1,
                depth: selection.$from.depth + 2,
            };
        }
        return null;
    }

    const { $from } = selection;
    for (let d = $from.depth; d >= 0; d--) {
        const n = $from.node(d);
        if (n.type.spec.group?.includes("blockBody")) {
            return { node: n, pos: $from.before(d), depth: d };
        }
    }
    return null;
}

/**
 * Check if a block body type can hold text (inline*) content.
 * Non-text blocks (image, divider) can't receive merged content.
 */
export function isTextBlock(node: PMNode): boolean {
    const body = node.firstChild;
    if (!body) return false;
    if (body.type.name === "columnLayout") return false;
    if (body.type.spec.atom) return false;
    const contentExpr = body.type.spec.content;
    if (!contentExpr) return false;
    return contentExpr.includes("inline") || contentExpr.includes("text");
}

/**
 * Find the previous text-content blockNode in cross-column sequential order.
 * Walks backward through the document, crossing column boundaries.
 */
export function findPreviousTextBlock(
    state: EditorState,
    blockNodePos: number,
    blockNodeDepth: number
): { pos: number; node: PMNode } | null {
    const $pos = state.doc.resolve(blockNodePos);

    let currentDepth = blockNodeDepth;
    let currentPos = blockNodePos;

    while (currentDepth >= 0) {
        const parent = $pos.node(currentDepth - 1);
        if (!parent) break;

        const indexInParent = state.doc.resolve(currentPos).index(currentDepth - 1);

        if (indexInParent > 0) {
            const $parentStart = state.doc.resolve(currentPos);
            const parentStart = $parentStart.start(currentDepth - 1);

            let offset = 0;
            for (let i = 0; i < indexInParent - 1; i++) {
                offset += parent.child(i).nodeSize;
            }
            const prevSiblingPos = parentStart + offset;
            const prevSibling = parent.child(indexInParent - 1);

            const result = findLastTextBlockIn(state, prevSibling, prevSiblingPos);
            if (result) return result;

            currentPos = prevSiblingPos;
            continue;
        }

        if (parent.type.name === "column" || parent.type.name === "columnLayout" || parent.type.name === "blockNode") {
            currentPos = state.doc.resolve(currentPos).before(currentDepth - 1);
            currentDepth--;
            continue;
        }

        if (parent.type.name === "blockGroup") {
            currentPos = state.doc.resolve(currentPos).before(currentDepth - 1);
            currentDepth--;
            continue;
        }

        break;
    }

    return null;
}

/**
 * Find the last text-content blockNode within a subtree (DFS, rightmost-last).
 */
export function findLastTextBlockIn(
    state: EditorState,
    node: PMNode,
    pos: number
): { pos: number; node: PMNode } | null {
    if (node.type.name === "blockNode") {
        const firstChild = node.firstChild;
        if (firstChild && firstChild.type.name === "columnLayout") {
            return findLastTextBlockIn(state, firstChild, pos + 1);
        }
        if (isTextBlock(node)) {
            return { pos, node };
        }
        return null;
    }

    if (node.type.name === "column" || node.type.name === "columnLayout" || node.type.name === "blockGroup") {
        const positions: { childPos: number; child: PMNode }[] = [];
        node.forEach((child, childOffset) => {
            positions.push({ childPos: pos + 1 + childOffset, child });
        });

        for (let i = positions.length - 1; i >= 0; i--) {
            const result = findLastTextBlockIn(state, positions[i].child, positions[i].childPos);
            if (result) return result;
        }
    }

    return null;
}

/**
 * Find the next text-content blockNode in cross-column sequential order.
 * Walks forward through the document, crossing column boundaries.
 */
export function findNextTextBlock(
    state: EditorState,
    blockNodePos: number,
    blockNodeDepth: number,
    blockNode: PMNode
): { pos: number; node: PMNode } | null {
    const blockNodeEnd = blockNodePos + blockNode.nodeSize;
    const $end = state.doc.resolve(blockNodeEnd);

    let currentDepth = blockNodeDepth;
    let currentEndPos = blockNodeEnd;

    while (currentDepth >= 0) {
        const parent = $end.node(currentDepth - 1);
        if (!parent) break;

        const $cur = state.doc.resolve(currentEndPos);
        const parentDepth = currentDepth - 1;

        let indexInParent: number;
        try {
            indexInParent = $cur.index(parentDepth);
        } catch {
            indexInParent = parent.childCount;
        }

        if (indexInParent < parent.childCount) {
            const parentStart = $cur.start(parentDepth);
            let offset = 0;
            for (let i = 0; i < indexInParent; i++) {
                offset += parent.child(i).nodeSize;
            }
            const nextSiblingPos = parentStart + offset;
            const nextSibling = parent.child(indexInParent);

            const result = findFirstTextBlockIn(state, nextSibling, nextSiblingPos);
            if (result) return result;

            currentEndPos = nextSiblingPos + nextSibling.nodeSize;
            continue;
        }

        if (parent.type.name === "column" || parent.type.name === "columnLayout" || parent.type.name === "blockNode") {
            currentEndPos = $cur.after(parentDepth);
            currentDepth--;
            continue;
        }

        if (parent.type.name === "blockGroup") {
            currentEndPos = $cur.after(parentDepth);
            currentDepth--;
            continue;
        }

        break;
    }

    return null;
}

/**
 * Find the first text-content blockNode within a subtree (DFS, leftmost-first).
 */
export function findFirstTextBlockIn(
    state: EditorState,
    node: PMNode,
    pos: number
): { pos: number; node: PMNode } | null {
    if (node.type.name === "blockNode") {
        const firstChild = node.firstChild;
        if (firstChild && firstChild.type.name === "columnLayout") {
            return findFirstTextBlockIn(state, firstChild, pos + 1);
        }
        if (isTextBlock(node)) {
            return { pos, node };
        }
        return null;
    }

    if (node.type.name === "column" || node.type.name === "columnLayout" || node.type.name === "blockGroup") {
        let offset = 0;
        for (let i = 0; i < node.childCount; i++) {
            const child = node.child(i);
            const childPos = pos + 1 + offset;
            const result = findFirstTextBlockIn(state, child, childPos);
            if (result) return result;
            offset += child.nodeSize;
        }
    }

    return null;
}
