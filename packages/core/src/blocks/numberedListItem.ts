import { defineBlock } from "../extensions/defineBlock.js";
import type { Node as PMNode } from "prosemirror-model";

/**
 * Numbered list item — an ordered list entry.
 */
export const NumberedListItem = defineBlock({
  name: "numberedListItem",
  label: "Numbered List",
  icon: "1.",
  description: "Ordered list item",
  group: "list",
  continuable: true,
  convertible: true,
  continuationAttrs: (prevNode: PMNode) => ({
    order: (prevNode.attrs.order ?? 1) + 1,
  }),
  spec: {
    group: "blockBody",
    content: "inline*",
    isolating: true,
    attrs: {
      order: { default: 1 },
    },
    parseDOM: [
      {
        tag: "div.kanava-numbered-list-item",
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return {
            order: parseInt(el.getAttribute("data-order") || "1", 10),
          };
        },
      },
    ],
    toDOM(node) {
      return [
        "div",
        {
          class: "kanava-numbered-list-item",
          "data-order": String(node.attrs.order),
        },
        [
          "span",
          { class: "kanava-number-marker", contenteditable: "false" },
          `${node.attrs.order}.`,
        ],
        ["span", { class: "kanava-number-text" }, 0],
      ];
    },
  },
});
