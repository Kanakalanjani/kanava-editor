import { defineBlock } from "../extensions/defineBlock.js";

/**
 * Column layout — a compound block that contains 2+ columns.
 * Lives inside a `blockNode` wrapper (Option B architecture).
 * The wrapper `blockNode` provides the ID, drag handle, selection
 * decoration, and block-level styles.
 */
export const ColumnLayout = defineBlock({
  name: "columnLayout",
  label: "Columns",
  icon: "▥",
  description: "Multi-column layout",
  group: "layout",
  spec: {
    // Not a blockBody — sits directly inside blockNode as an alternative
    // to the (blockBody blockGroup?) branch. See structuralNodes.ts.
    content: "column column+",
    defining: true,
    isolating: true,
    attrs: {
      separatorStyle: { default: "ghost" },  // "ghost" | "visible"
      separatorColor: { default: null },     // CSS color string or null
      separatorWidth: { default: 2 },        // px, 1-8
      separatorPadding: { default: 0 },      // px, 0-24, extra gap around separator
    },
    parseDOM: [
      {
        tag: "div.kanava-column-layout",
        getAttrs(dom: HTMLElement) {
          return {
            separatorStyle: dom.dataset.separatorStyle || "ghost",
            separatorColor: dom.dataset.separatorColor || null,
            separatorWidth: parseInt(dom.dataset.separatorWidth || "2", 10),
            separatorPadding: parseInt(dom.dataset.separatorPadding || "0", 10),
          };
        },
      },
    ],
    toDOM(node: any) {
      const attrs: Record<string, string> = {
        class: "kanava-column-layout",
      };
      if (node.attrs.separatorStyle !== "ghost") {
        attrs["data-separator-style"] = node.attrs.separatorStyle;
      }
      if (node.attrs.separatorColor) {
        attrs["data-separator-color"] = node.attrs.separatorColor;
      }
      if (node.attrs.separatorWidth !== 2) {
        attrs["data-separator-width"] = String(node.attrs.separatorWidth);
      }
      if (node.attrs.separatorPadding > 0) {
        attrs["data-separator-padding"] = String(node.attrs.separatorPadding);
      }
      return ["div", attrs, 0];
    },
  },
});
