import { defineBlock } from "../extensions/defineBlock.js";

/**
 * Toggle block — collapsible/accordion.
 * The inline content is the "summary" (always visible).
 * Nested children (via blockGroup) are hidden/shown by toggling `collapsed`.
 */
export const Toggle = defineBlock({
  name: "toggle",
  label: "Toggle",
  icon: "▶",
  description: "Collapsible content section",
  group: "advanced",
  spec: {
    group: "blockBody",
    content: "inline*",
    isolating: true,
    attrs: {
      collapsed: { default: false },
    },
    parseDOM: [
      {
        tag: "div.kanava-toggle",
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return {
            collapsed: el.classList.contains("is-collapsed"),
          };
        },
      },
    ],
    toDOM(node) {
      return [
        "div",
        {
          class: `kanava-toggle ${node.attrs.collapsed ? "is-collapsed" : "is-expanded"}`,
        },
        ["span", { class: "kanava-toggle-icon", contenteditable: "false" }, "\u25B6"],
        ["span", { class: "kanava-toggle-text" }, 0],
      ];
    },
  },
});
