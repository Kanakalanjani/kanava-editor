import { defineMark } from "../extensions/defineMark.js";
import type { Schema } from "prosemirror-model";
import type { Command } from "prosemirror-state";

/**
 * Font family mark — applies a custom font family to inline text.
 */
export const FontFamily = defineMark({
  name: "fontFamily",
  label: "Font Family",
  icon: "F",
  spec: {
    attrs: { family: { default: "sans-serif" } },
    parseDOM: [
      {
        tag: "span[style]",
        getAttrs(dom) {
          const el = dom as HTMLElement;
          const family = el.style.fontFamily;
          return family ? { family } : false;
        },
      },
    ],
    toDOM(mark) {
      return ["span", { style: `font-family: ${mark.attrs.family}` }, 0];
    },
  },
  commands: (schema: Schema) => ({
    setFontFamily: (family: string): Command => {
      return (state, dispatch) => {
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
    },
    removeFontFamily: (): Command => {
      return (state, dispatch) => {
        const { from, to } = state.selection;
        if (!dispatch) return true;
        const tr = state.tr;
        tr.removeMark(from, to, schema.marks.fontFamily);
        dispatch(tr);
        return true;
      };
    },
  }),
});
