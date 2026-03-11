import { defineBlock } from "../extensions/defineBlock.js";

/**
 * Checklist item — an interactive checkbox with text.
 */
export const ChecklistItem = defineBlock({
  name: "checklistItem",
  label: "Checklist",
  icon: "☑",
  description: "To-do items with checkboxes",
  group: "list",
  continuable: true,
  convertible: true,
  continuationAttrs: () => ({ checked: false }),
  spec: {
    group: "blockBody",
    content: "inline*",
    isolating: true,
    attrs: {
      checked: { default: false },
    },
    parseDOM: [
      {
        tag: "div.kanava-checklist-item",
        getAttrs(dom) {
          const el = dom as HTMLElement;
          const checkbox = el.querySelector("input[type=checkbox]");
          return {
            checked: checkbox ? (checkbox as HTMLInputElement).checked : false,
          };
        },
      },
    ],
    toDOM(node) {
      return [
        "div",
        { class: `kanava-checklist-item ${node.attrs.checked ? "is-checked" : ""}` },
        [
          "input",
          {
            type: "checkbox",
            ...(node.attrs.checked ? { checked: "checked" } : {}),
            contenteditable: "false",
          },
        ],
        ["span", { class: "kanava-checklist-text" }, 0],
      ];
    },
  },
});
