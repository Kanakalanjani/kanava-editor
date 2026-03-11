import type { MarkSpec } from "prosemirror-model";

export const underlineSpec: MarkSpec = {
  parseDOM: [
    { tag: "u" },
    { style: "text-decoration=underline" },
  ],
  toDOM() {
    return ["u", 0];
  },
};
