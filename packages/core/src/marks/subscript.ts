import { defineMark } from "../extensions/defineMark.js";
import { toggleMark } from "prosemirror-commands";
import type { Schema } from "prosemirror-model";

/**
 * Subscript mark — renders text as subscript.
 * Mutually exclusive with superscript.
 */
export const Subscript = defineMark({
  name: "subscript",
  label: "Subscript",
  icon: "X₂",
  spec: {
    excludes: "superscript",
    parseDOM: [{ tag: "sub" }],
    toDOM() {
      return ["sub", 0];
    },
  },
  keymap: (schema: Schema) => ({
    "Mod-Shift-,": toggleMark(schema.marks.subscript),
  }),
  commands: (schema: Schema) => ({
    toggleSubscript: () => toggleMark(schema.marks.subscript),
  }),
});
