import { defineBlock } from "../extensions/defineBlock.js";

/**
 * Paragraph — the default text block.
 */
export const Paragraph = defineBlock({
  name: "paragraph",
  label: "Text",
  icon: "Aa",
  description: "Plain text paragraph",
  group: "text",
  convertible: true,
  spec: {
    group: "blockBody",
    content: "inline*",
    isolating: true,
    parseDOM: [{ tag: "p" }],
    toDOM() {
      return ["p", { class: "kanava-paragraph" }, 0];
    },
  },
});
