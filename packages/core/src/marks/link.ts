import { defineMark } from "../extensions/defineMark.js";
import { toggleMark } from "prosemirror-commands";
import type { Schema, Mark } from "prosemirror-model";
import type { Command } from "prosemirror-state";

/**
 * Link mark — inline hyperlink.
 */
export const Link = defineMark({
  name: "link",
  label: "Link",
  icon: "🔗",
  spec: {
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
  },
  commands: (schema: Schema) => ({
    toggleLink: (attrs?: { href: string; target?: string; rel?: string }): Command => {
      return (state, dispatch) => {
        const linkMark = schema.marks.link;
        const { from, to, empty } = state.selection;

        let hasLink = false;
        state.doc.nodesBetween(from, to, (node) => {
          if (linkMark.isInSet(node.marks)) {
            hasLink = true;
          }
        });

        if (hasLink) {
          return toggleMark(linkMark)(state, dispatch);
        }

        if (!attrs?.href) return false;
        if (empty) return false;

        return toggleMark(linkMark, attrs)(state, dispatch);
      };
    },
  }),
});
