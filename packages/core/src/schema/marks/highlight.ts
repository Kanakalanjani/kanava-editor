import type { MarkSpec } from "prosemirror-model";

export const highlightSpec: MarkSpec = {
  attrs: {
    color: { default: "#ffeb3b" },
  },
  excludes: "highlight",  // only excludes itself, not textColor or other marks
  parseDOM: [
    {
      tag: "mark",
      getAttrs(dom) {
        const el = dom as HTMLElement;
        return { color: el.style.backgroundColor || "#ffeb3b" };
      },
    },
    {
      style: "background-color",
      getAttrs(value) {
        return { color: value as string };
      },
    },
  ],
  toDOM(mark) {
    return ["mark", { style: `background-color: ${mark.attrs.color}` }, 0];
  },
};
