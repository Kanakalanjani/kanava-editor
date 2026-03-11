import { defineBlock } from "../extensions/defineBlock.js";

/**
 * Heading block — supports levels 1-6.
 */
export const Heading = defineBlock({
  name: "heading",
  label: "Heading",
  icon: "H",
  description: "Section heading",
  group: "text",
  convertible: [
    { label: "Heading 1", icon: "H1", attrs: { level: 1 } },
    { label: "Heading 2", icon: "H2", attrs: { level: 2 } },
    { label: "Heading 3", icon: "H3", attrs: { level: 3 }, divider: true },
  ],
  spec: {
    group: "blockBody",
    content: "inline*",
    isolating: true,
    attrs: {
      level: { default: 1 },
    },
    parseDOM: [
      { tag: "h1", attrs: { level: 1 } },
      { tag: "h2", attrs: { level: 2 } },
      { tag: "h3", attrs: { level: 3 } },
      { tag: "h4", attrs: { level: 4 } },
      { tag: "h5", attrs: { level: 5 } },
      { tag: "h6", attrs: { level: 6 } },
    ],
    toDOM(node) {
      const tag = `h${node.attrs.level}` as keyof HTMLElementTagNameMap;
      return [tag, { class: "kanava-heading" }, 0];
    },
  },
});
