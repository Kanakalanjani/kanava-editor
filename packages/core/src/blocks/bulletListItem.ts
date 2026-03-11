import { defineBlock } from "../extensions/defineBlock.js";

/**
 * Bullet list item — an unordered list entry.
 */
export const BulletListItem = defineBlock({
  name: "bulletListItem",
  label: "Bullet List",
  icon: "•",
  description: "Unordered list item",
  group: "list",
  continuable: true,
  convertible: true,
  spec: {
    group: "blockBody",
    content: "inline*",
    isolating: true,
    parseDOM: [{ tag: "div.kanava-bullet-list-item" }],
    toDOM() {
      return [
        "div",
        { class: "kanava-bullet-list-item" },
        ["span", { class: "kanava-bullet-marker", contenteditable: "false" }, "\u2022"],
        ["span", { class: "kanava-bullet-text" }, 0],
      ];
    },
  },
});
