/**
 * Inline mark commands (superscript, subscript, font-size, font-family).
 * Extracted from text.ts for modularity.
 */

import type { Command } from "prosemirror-state";
import { toggleMark } from "prosemirror-commands";
import type { Schema } from "prosemirror-model";

/** Toggle superscript mark. */
export function toggleSuperscript(schema: Schema): Command {
    return toggleMark(schema.marks.superscript);
}

/** Toggle subscript mark. */
export function toggleSubscript(schema: Schema): Command {
    return toggleMark(schema.marks.subscript);
}

/**
 * Apply a font-size mark to the current selection (or store for next input).
 * @param size CSS size string, e.g. `"14px"` or `"1.2em"`.
 */
export function setFontSize(schema: Schema, size: string): Command {
    return (state, dispatch) => {
        if (!schema.marks.fontSize) return false;
        const mark = schema.marks.fontSize.create({ size });
        if (state.selection.empty) {
            if (dispatch) dispatch(state.tr.addStoredMark(mark));
            return true;
        }
        if (dispatch) {
            dispatch(state.tr.addMark(state.selection.from, state.selection.to, mark));
        }
        return true;
    };
}

/** Remove font-size mark from selection. */
export function removeFontSize(schema: Schema): Command {
    return (state, dispatch) => {
        if (!schema.marks.fontSize) return false;
        if (dispatch) {
            dispatch(state.tr.removeMark(state.selection.from, state.selection.to, schema.marks.fontSize));
        }
        return true;
    };
}

/**
 * Apply a font-family mark to the current selection (or store for next input).
 * @param family CSS font-family string, e.g. `"Georgia, serif"`.
 */
export function setFontFamily(schema: Schema, family: string): Command {
    return (state, dispatch) => {
        if (!schema.marks.fontFamily) return false;
        const mark = schema.marks.fontFamily.create({ family });
        if (state.selection.empty) {
            if (dispatch) dispatch(state.tr.addStoredMark(mark));
            return true;
        }
        if (dispatch) {
            dispatch(state.tr.addMark(state.selection.from, state.selection.to, mark));
        }
        return true;
    };
}

/** Remove font-family mark from selection. */
export function removeFontFamily(schema: Schema): Command {
    return (state, dispatch) => {
        if (!schema.marks.fontFamily) return false;
        if (dispatch) {
            dispatch(state.tr.removeMark(state.selection.from, state.selection.to, schema.marks.fontFamily));
        }
        return true;
    };
}
