/**
 * Pagination-related block attribute commands.
 * Extracted from text.ts for modularity.
 */

import type { Command, EditorState } from "prosemirror-state";

/** Helper: collect all blockNode positions within the current selection. */
export function collectBlockNodes(state: EditorState): { pos: number; node: any }[] {
    const { from, to } = state.selection;
    const blockNodeType = state.schema.nodes.blockNode;
    if (!blockNodeType) {
        return [];
    }
    const result: { pos: number; node: any }[] = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type === blockNodeType) {
            result.push({ pos, node });
            return node.firstChild?.type.name !== "columnLayout";
        }
        return true;
    });
    return result;
}

/** Set page-break-before on all selected blockNodes. */
export function setPageBreakBefore(value: boolean): Command {
    return (state, dispatch) => {
        const blockNodes = collectBlockNodes(state);
        if (blockNodes.length === 0) return false;
        if (dispatch) {
            const tr = state.tr;
            for (const { pos, node } of blockNodes) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, pageBreakBefore: value });
            }
            dispatch(tr);
        }
        return true;
    };
}

/** Set keep-with-next on all selected blockNodes. */
export function setKeepWithNext(value: boolean): Command {
    return (state, dispatch) => {
        const blockNodes = collectBlockNodes(state);
        if (blockNodes.length === 0) return false;
        if (dispatch) {
            const tr = state.tr;
            for (const { pos, node } of blockNodes) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, keepWithNext: value });
            }
            dispatch(tr);
        }
        return true;
    };
}

/** Set keep-lines-together on all selected blockNodes. */
export function setKeepLinesTogether(value: boolean): Command {
    return (state, dispatch) => {
        const blockNodes = collectBlockNodes(state);
        if (blockNodes.length === 0) return false;
        if (dispatch) {
            const tr = state.tr;
            for (const { pos, node } of blockNodes) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, keepLinesTogether: value });
            }
            dispatch(tr);
        }
        return true;
    };
}

/** Set widow/orphan control value (lines) on all selected blockNodes. */
export function setWidowOrphan(value: number): Command {
    return (state, dispatch) => {
        const blockNodes = collectBlockNodes(state);
        if (blockNodes.length === 0) return false;
        if (dispatch) {
            const tr = state.tr;
            for (const { pos, node } of blockNodes) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, widowOrphan: value });
            }
            dispatch(tr);
        }
        return true;
    };
}
