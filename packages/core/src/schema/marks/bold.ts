import type { MarkSpec } from "prosemirror-model";

export const boldSpec: MarkSpec = {
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
};
