import { defineMark } from "../extensions/defineMark.js";
import { toggleMark } from "prosemirror-commands";
import type { Schema } from "prosemirror-model";

/**
 * Underline mark.
 */
export const Underline = defineMark({
  name: "underline",
  label: "Underline",
  icon: "U",
  spec: {
    parseDOM: [
      { tag: "u" },
      { style: "text-decoration=underline" },
    ],
    toDOM() {
      return ["u", 0];
    },
  },
  keymap: (schema: Schema) => ({
    "Mod-u": toggleMark(schema.marks.underline),
  }),
  commands: (schema: Schema) => ({
    toggleUnderline: () => toggleMark(schema.marks.underline),
  }),
});
