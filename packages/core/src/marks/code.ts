import { defineMark } from "../extensions/defineMark.js";
import { toggleMark } from "prosemirror-commands";
import type { Schema } from "prosemirror-model";

/**
 * Inline code mark.
 */
export const Code = defineMark({
  name: "code",
  label: "Code",
  icon: "<>",
  spec: {
    parseDOM: [{ tag: "code" }],
    toDOM() {
      return ["code", { class: "kanava-inline-code" }, 0];
    },
  },
  keymap: (schema: Schema) => ({
    "Mod-e": toggleMark(schema.marks.code),
  }),
  commands: (schema: Schema) => ({
    toggleCode: () => toggleMark(schema.marks.code),
  }),
});
