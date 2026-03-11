import { defineMark } from "../extensions/defineMark.js";
import type { Schema } from "prosemirror-model";
import type { Command } from "prosemirror-state";

/**
 * Font size mark — applies a custom font size to inline text.
 */
export const FontSize = defineMark({
  name: "fontSize",
  label: "Font Size",
  icon: "Aa",
  spec: {
    attrs: { size: { default: "16px" } },
    parseDOM: [
      {
        tag: "span[style]",
        getAttrs(dom) {
          const el = dom as HTMLElement;
          const size = el.style.fontSize;
          return size ? { size } : false;
        },
      },
    ],
    toDOM(mark) {
      return ["span", { style: `font-size: ${mark.attrs.size}` }, 0];
    },
  },
  commands: (schema: Schema) => ({
    setFontSize: (size: string): Command => {
      return (state, dispatch) => {
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
    },
    removeFontSize: (): Command => {
      return (state, dispatch) => {
        const { from, to } = state.selection;
        if (!dispatch) return true;
        const tr = state.tr;
        tr.removeMark(from, to, schema.marks.fontSize);
        dispatch(tr);
        return true;
      };
    },
  }),
});
