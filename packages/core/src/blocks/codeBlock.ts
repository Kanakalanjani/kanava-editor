import { defineBlock } from "../extensions/defineBlock.js";

/**
 * Code block — monospace text with a language attribute.
 */
export const CodeBlock = defineBlock({
  name: "codeBlock",
  label: "Code",
  icon: "</>",
  description: "Monospaced code block",
  group: "text",
  convertible: true,
  spec: {
    group: "blockBody",
    content: "text*",
    marks: "",
    code: true,
    isolating: true,
    attrs: {
      language: { default: "plain" },
    },
    parseDOM: [
      {
        tag: "pre",
        preserveWhitespace: "full" as const,
        getAttrs(dom) {
          const el = dom as HTMLElement;
          const code = el.querySelector("code");
          const lang = code?.getAttribute("data-language") || "plain";
          return { language: lang };
        },
      },
    ],
    toDOM(node) {
      return [
        "pre",
        { class: "kanava-code-block" },
        ["code", { "data-language": node.attrs.language }, 0],
      ];
    },
  },
});
