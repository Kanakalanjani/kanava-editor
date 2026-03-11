import type { MarkSpec } from "prosemirror-model";

export const textColorSpec: MarkSpec = {
  attrs: {
    color: { default: null },
  },
  excludes: "textColor",  // only excludes itself, not highlight or other marks
  parseDOM: [
    {
      style: "color",
      getAttrs(value) {
        return { color: value as string };
      },
    },
  ],
  toDOM(mark) {
    return ["span", { style: `color: ${mark.attrs.color}` }, 0];
  },
};
