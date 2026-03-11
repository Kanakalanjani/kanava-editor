import { defineMark } from "../extensions/defineMark.js";
import type { Schema } from "prosemirror-model";
import type { Command } from "prosemirror-state";

/**
 * Highlight mark — applies a background color to inline text.
 */
export const Highlight = defineMark({
  name: "highlight",
  label: "Highlight",
  icon: "H",
  spec: {
    attrs: {
      color: { default: "#ffeb3b" },
    },
    excludes: "highlight",
    parseDOM: [
      {
        tag: "mark",
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return { color: el.style.backgroundColor || "#ffeb3b" };
        },
      },
      {
        style: "background-color",
        getAttrs(value) {
          return { color: value as string };
        },
      },
    ],
    toDOM(mark) {
      return ["mark", { style: `background-color: ${mark.attrs.color}` }, 0];
    },
  },
  commands: (schema: Schema) => ({
    setHighlight: (color: string): Command => {
      return (state, dispatch) => {
        const { from, to, empty } = state.selection;
        if (empty) return false;
        if (!dispatch) return true;
        const tr = state.tr;
        const mark = schema.marks.highlight.create({ color });
        tr.addMark(from, to, mark);
        dispatch(tr);
        return true;
      };
    },
    removeHighlight: (): Command => {
      return (state, dispatch) => {
        const { from, to } = state.selection;
        if (!dispatch) return true;
        const tr = state.tr;
        tr.removeMark(from, to, schema.marks.highlight);
        dispatch(tr);
        return true;
      };
    },
  }),
});
