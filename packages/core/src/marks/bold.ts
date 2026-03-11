import { defineMark } from "../extensions/defineMark.js";
import { toggleMark } from "prosemirror-commands";
import type { Schema } from "prosemirror-model";

/**
 * Bold mark.
 */
export const Bold = defineMark({
  name: "bold",
  label: "Bold",
  icon: "B",
  spec: {
    parseDOM: [
      { tag: "strong" },
      { tag: "b", getAttrs: (node) => (node as HTMLElement).style.fontWeight !== "normal" && null },
      {
        style: "font-weight=400",
        clearMark: (m) => m.type.name === "bold",
      },
      { style: "font-weight", getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null },
    ],
    toDOM() {
      return ["strong", 0];
    },
  },
  keymap: (schema: Schema) => ({
    "Mod-b": toggleMark(schema.marks.bold),
  }),
  commands: (schema: Schema) => ({
    toggleBold: () => toggleMark(schema.marks.bold),
  }),
});
