import { defineBlock } from "../extensions/defineBlock.js";

/**
 * Callout / admonition block.
 * Renders a colored box with an icon.
 * Variants: info, warning, success, error.
 */
export const Callout = defineBlock({
  name: "callout",
  label: "Callout",
  icon: "ℹ",
  description: "Highlighted info box",
  group: "advanced",
  spec: {
    group: "blockBody",
    content: "inline*",
    isolating: true,
    attrs: {
      variant: { default: "info" },
      icon: { default: "" },
    },
    parseDOM: [
      {
        tag: "div.kanava-callout",
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return {
            variant: el.getAttribute("data-variant") || "info",
            icon: el.getAttribute("data-icon") || "",
          };
        },
      },
    ],
    toDOM(node) {
      const iconMap: Record<string, string> = {
        info: "\u2139\uFE0F",
        warning: "\u26A0\uFE0F",
        success: "\u2705",
        error: "\u274C",
      };
      const icon = node.attrs.icon || iconMap[node.attrs.variant] || iconMap.info;
      return [
        "div",
        {
          class: `kanava-callout kanava-callout-${node.attrs.variant}`,
          "data-variant": node.attrs.variant,
          "data-icon": node.attrs.icon,
        },
        [
          "span",
          { class: "kanava-callout-icon", contenteditable: "false" },
          icon,
        ],
        ["span", { class: "kanava-callout-text" }, 0],
      ];
    },
  },
});
