import { defineBlock } from "../extensions/defineBlock.js";

/**
 * Quote / blockquote block.
 */
export const Quote = defineBlock({
  name: "quote",
  label: "Quote",
  icon: "❝",
  description: "Quoted passage",
  group: "text",
  convertible: true,
  spec: {
    group: "blockBody",
    content: "inline*",
    isolating: true,
    parseDOM: [{ tag: "blockquote" }],
    toDOM() {
      return ["blockquote", { class: "kanava-quote" }, 0];
    },
  },
});
