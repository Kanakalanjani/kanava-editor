import { defineMark } from "../extensions/defineMark.js";
import type { Schema } from "prosemirror-model";
import type { Command } from "prosemirror-state";

/**
 * Text color mark — applies a foreground color to inline text.
 */
export const TextColor = defineMark({
  name: "textColor",
  label: "Text Color",
  icon: "A",
  spec: {
    attrs: {
      color: { default: null },
    },
    excludes: "textColor",
    parseDOM: [
      {
        style: "color",
        getAttrs(value) {
          return { color: value as string };
        },
      },
    ],
    toDOM(mark) {
      return ["span", { style: `color: ${mark.attrs.color}` }, 0];
    },
  },
  commands: (schema: Schema) => ({
    setTextColor: (color: string): Command => {
      return (state, dispatch) => {
        const { from, to, empty } = state.selection;
        if (empty) return false;
        if (!dispatch) return true;
        const tr = state.tr;
        const mark = schema.marks.textColor.create({ color });
        tr.addMark(from, to, mark);
        dispatch(tr);
        return true;
      };
    },
    removeTextColor: (): Command => {
      return (state, dispatch) => {
        const { from, to } = state.selection;
        if (!dispatch) return true;
        const tr = state.tr;
        tr.removeMark(from, to, schema.marks.textColor);
        dispatch(tr);
        return true;
      };
    },
  }),
});
