import type { NodeSpec } from "prosemirror-model";

/**
 * Structural nodes form the fixed skeleton of every Kanava document.
 * These are never user-defined — they define the recursive
 * block tree structure:
 * @see packages/docs/guide-document-model.md
 *
 *   doc → blockGroup → blockChild+
 *   blockNode → blockBody blockGroup?
 *   column → blockNode+
 *   text (inline)
 *
 * Custom blocks slot into the `blockBody` group.
 */
export const structuralNodes: Record<string, NodeSpec> = {
  doc: {
    content: "blockGroup",
    topNode: true,
  },

  blockGroup: {
    group: "container",
    content: "blockChild+",
    parseDOM: [{ tag: "div.kanava-block-group" }],
    toDOM() {
      return ["div", { class: "kanava-block-group" }, 0];
    },
  },

  blockNode: {
    group: "blockChild block",
    content: "(blockBody blockGroup?) | columnLayout",
    defining: true,
    attrs: {
      id: { default: "" },
      textAlign: { default: "left" },
      backgroundColor: { default: null },
      spacingTop: { default: 0 },
      spacingBottom: { default: 0 },
      lineHeight: { default: null },
      paddingTop: { default: 0 },
      paddingBottom: { default: 0 },
      paddingLeft: { default: 0 },
      paddingRight: { default: 0 },
      borderColor: { default: null },
      borderWidth: { default: 0 },
      borderStyle: { default: "solid" },
      borderRadius: { default: 0 },
      textIndent: { default: 0 },
      letterSpacing: { default: 0 },
      // Pagination control attrs (Phase 7 — stored as data-* attrs, not inline styles)
      pageBreakBefore: { default: false },
      keepWithNext: { default: false },
      keepLinesTogether: { default: false },
      widowOrphan: { default: 2 },
    },
    parseDOM: [
      {
        tag: "div.kanava-block",
        getAttrs(dom) {
          const el = dom as HTMLElement;
          const lh = el.style.lineHeight;
          return {
            id: el.getAttribute("data-block-id") || "",
            textAlign: el.style.textAlign || "left",
            backgroundColor: el.style.backgroundColor || null,
            spacingTop: parseInt(el.style.marginTop || "0", 10),
            spacingBottom: parseInt(el.style.marginBottom || "0", 10),
            lineHeight: lh ? parseFloat(lh) : null,
            paddingTop: parseInt(el.style.paddingTop || "0", 10),
            paddingBottom: parseInt(el.style.paddingBottom || "0", 10),
            paddingLeft: parseInt(el.style.paddingLeft || "0", 10),
            paddingRight: parseInt(el.style.paddingRight || "0", 10),
            borderColor: el.style.borderColor || null,
            borderWidth: parseInt(el.style.borderWidth || "0", 10),
            borderStyle: el.style.borderStyle || "solid",
            borderRadius: parseInt(el.style.borderRadius || "0", 10),
            textIndent: parseInt(el.style.textIndent || "0", 10),
            letterSpacing: parseFloat(el.style.letterSpacing || "0"),
            pageBreakBefore: el.getAttribute("data-page-break-before") === "true",
            keepWithNext: el.getAttribute("data-keep-with-next") === "true",
            keepLinesTogether: el.getAttribute("data-keep-lines-together") === "true",
            widowOrphan: parseInt(el.getAttribute("data-widow-orphan") || "2", 10),
          };
        },
      },
    ],
    toDOM(node) {
      const styleParts: string[] = [];
      const a = node.attrs;
      if (a.textAlign && a.textAlign !== "left") {
        styleParts.push(`text-align: ${a.textAlign}`);
      }
      if (a.backgroundColor) {
        styleParts.push(`background-color: ${a.backgroundColor}`);
      }
      if (a.spacingTop && a.spacingTop > 0) {
        styleParts.push(`margin-top: ${a.spacingTop}px`);
      }
      if (a.spacingBottom && a.spacingBottom > 0) {
        styleParts.push(`margin-bottom: ${a.spacingBottom}px`);
      }
      if (a.lineHeight != null) {
        styleParts.push(`line-height: ${a.lineHeight}`);
      }
      if (a.paddingTop > 0) styleParts.push(`padding-top: ${a.paddingTop}px`);
      if (a.paddingBottom > 0) styleParts.push(`padding-bottom: ${a.paddingBottom}px`);
      if (a.paddingLeft > 0) styleParts.push(`padding-left: ${a.paddingLeft}px`);
      if (a.paddingRight > 0) styleParts.push(`padding-right: ${a.paddingRight}px`);
      if (a.borderWidth > 0 && a.borderColor) {
        styleParts.push(`border: ${a.borderWidth}px ${a.borderStyle} ${a.borderColor}`);
        if (a.borderRadius > 0) styleParts.push(`border-radius: ${a.borderRadius}px`);
      }
      if (a.textIndent > 0) styleParts.push(`text-indent: ${a.textIndent}px`);
      if (a.letterSpacing > 0) styleParts.push(`letter-spacing: ${a.letterSpacing}px`);
      const style = styleParts.length > 0 ? styleParts.join("; ") : undefined;
      // Pagination data attrs (read by pagination plugin, not applied as inline styles)
      const dataAttrs: Record<string, string> = {};
      if (a.pageBreakBefore) dataAttrs["data-page-break-before"] = "true";
      if (a.keepWithNext) dataAttrs["data-keep-with-next"] = "true";
      if (a.keepLinesTogether) dataAttrs["data-keep-lines-together"] = "true";
      if (a.widowOrphan !== 2) dataAttrs["data-widow-orphan"] = String(a.widowOrphan);
      return [
        "div",
        {
          class: "kanava-block",
          "data-block-id": a.id,
          ...(style ? { style } : {}),
          ...dataAttrs,
        },
        0,
      ];
    },
  },

  column: {
    group: "block container",
    content: "blockNode+",
    isolating: true,
    attrs: {
      width: { default: 1 },
    },
    parseDOM: [
      {
        tag: "div.kanava-column",
        getAttrs(dom) {
          const el = dom as HTMLElement;
          const width = el.getAttribute("data-width");
          return { width: width ? Number(width) : 1 };
        },
      },
    ],
    toDOM(node) {
      return [
        "div",
        {
          class: "kanava-column",
          "data-width": String(node.attrs.width),
          style: `flex-grow: ${node.attrs.width}; flex-basis: 0`,
        },
        0,
      ];
    },
  },

  text: {
    group: "inline",
  },

  hard_break: {
    inline: true,
    group: "inline",
    selectable: false,
    parseDOM: [{ tag: "br" }],
    toDOM() {
      return ["br"];
    },
  },
};
