import { defineMark } from "../extensions/defineMark.js";
import { toggleMark } from "prosemirror-commands";
import type { Schema } from "prosemirror-model";

/**
 * Italic mark.
 */
export const Italic = defineMark({
  name: "italic",
  label: "Italic",
  icon: "I",
  spec: {
    parseDOM: [
      { tag: "i" },
      { tag: "em" },
      { style: "font-style=italic" },
    ],
    toDOM() {
      return ["em", 0];
    },
  },
  keymap: (schema: Schema) => ({
    "Mod-i": toggleMark(schema.marks.italic),
  }),
  commands: (schema: Schema) => ({
    toggleItalic: () => toggleMark(schema.marks.italic),
  }),
});
