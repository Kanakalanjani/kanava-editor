import type { MarkSpec } from "prosemirror-model";

export const linkSpec: MarkSpec = {
  attrs: {
    href: { default: "" },
    target: { default: "_blank" },
    rel: { default: "noopener noreferrer" },
  },
  inclusive: false,
  parseDOM: [
    {
      tag: "a[href]",
      getAttrs(dom) {
        const el = dom as HTMLAnchorElement;
        return {
          href: el.getAttribute("href") || "",
          target: el.getAttribute("target") || "_blank",
          rel: el.getAttribute("rel") || "noopener noreferrer",
        };
      },
    },
  ],
  toDOM(mark) {
    return [
      "a",
      {
        href: mark.attrs.href,
        target: mark.attrs.target,
        rel: mark.attrs.rel,
        class: "kanava-link",
      },
      0,
    ];
  },
};
