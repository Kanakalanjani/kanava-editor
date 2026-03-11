import type { MarkSpec } from "prosemirror-model";

export const codeSpec: MarkSpec = {
  parseDOM: [{ tag: "code" }],
  toDOM() {
    return ["code", { class: "kanava-inline-code" }, 0];
  },
};
