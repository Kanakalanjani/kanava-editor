import { defineMark } from "../extensions/defineMark.js";
import { toggleMark } from "prosemirror-commands";
import type { Schema } from "prosemirror-model";

/**
 * Strikethrough mark.
 */
export const Strike = defineMark({
  name: "strike",
  label: "Strikethrough",
  icon: "S",
  spec: {
    parseDOM: [
      { tag: "s" },
      { tag: "del" },
      { tag: "strike" },
      { style: "text-decoration=line-through" },
    ],
    toDOM() {
      return ["s", 0];
    },
  },
  keymap: (schema: Schema) => ({
    "Mod-Shift-s": toggleMark(schema.marks.strike),
  }),
  commands: (schema: Schema) => ({
    toggleStrike: () => toggleMark(schema.marks.strike),
  }),
});
