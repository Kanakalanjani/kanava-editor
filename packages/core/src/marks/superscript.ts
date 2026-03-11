import { defineMark } from "../extensions/defineMark.js";
import { toggleMark } from "prosemirror-commands";
import type { Schema } from "prosemirror-model";

/**
 * Superscript mark — renders text as superscript.
 * Mutually exclusive with subscript.
 */
export const Superscript = defineMark({
  name: "superscript",
  label: "Superscript",
  icon: "X²",
  spec: {
    excludes: "subscript",
    parseDOM: [{ tag: "sup" }],
    toDOM() {
      return ["sup", 0];
    },
  },
  keymap: (schema: Schema) => ({
    "Mod-Shift-.": toggleMark(schema.marks.superscript),
  }),
  commands: (schema: Schema) => ({
    toggleSuperscript: () => toggleMark(schema.marks.superscript),
  }),
});
