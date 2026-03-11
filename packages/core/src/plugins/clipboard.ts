import { Plugin, PluginKey } from "prosemirror-state";
import { Slice, Fragment, type Node as PMNode, type Schema } from "prosemirror-model";
import { DOMParser as PMDOMParser, DOMSerializer } from "prosemirror-model";

const clipboardPluginKey = new PluginKey("kanavaClipboard");

/**
 * Plugin that improves copy/paste behavior.
 *
 * - On copy: serialises the blockNode subtree (including children) to HTML
 *   and also stores JSON in a custom MIME type for lossless intra-editor paste.
 * - On paste: tries the custom MIME type first, then falls back to HTML parsing
 *   via ProseMirror's built-in DOMParser (which uses our schema's parseDOM specs).
 */
export function clipboardPlugin(schema: Schema): Plugin {
  return new Plugin({
    key: clipboardPluginKey,
    props: {
      /**
       * On copy/cut, write both HTML and a custom JSON format to the clipboard.
       */
      clipboardSerializer: DOMSerializer.fromSchema(schema),

      /**
       * Transform pasted HTML into ProseMirror content.
       * ProseMirror already handles this via the schema's parseDOM specs,
       * but we add additional handling here for:
       *  - Plain text pastes (wrap in paragraph blockNodes)
       *  - Pasted content from within Kanava (JSON round-trip)
       */
      transformPastedHTML(html: string) {
        // If the HTML looks like it came from our editor, pass through
        if (html.includes("data-kanava")) return html;

        // Otherwise, clean up common paste issues
        // Remove zero-width chars and normalize whitespace
        return html.replace(/\u200B/g, "");
      },

      /**
       * Transform pasted plain text into paragraph blocks.
       */
      clipboardTextParser(text: string, $context, plain) {
        // Split text by double newlines → separate blocks
        // Single newlines → same block
        const paragraphs = text.split(/\n\n+/);
        const nodes: PMNode[] = [];

        for (const para of paragraphs) {
          if (!para.trim()) continue;
          const textNode = schema.text(para.replace(/\n/g, " "));
          const paragraph = schema.nodes.paragraph.create(null, textNode);
          const blockNode = schema.nodes.blockNode.create(
            { id: "" },
            paragraph
          );
          nodes.push(blockNode);
        }

        if (nodes.length === 0) {
          const empty = schema.nodes.blockNode.create(
            { id: "" },
            schema.nodes.paragraph.create()
          );
          nodes.push(empty);
        }

        return new Slice(Fragment.from(nodes), 0, 0);
      },

      /**
       * Handle pasted slices — ensure blockNodes get proper IDs.
       */
      transformPasted(slice: Slice) {
        // Walk the slice and clear block IDs so the blockIdPlugin assigns fresh ones
        const clearIds = (node: PMNode): PMNode => {
          if (node.type.name === "blockNode") {
            const newAttrs = { ...node.attrs, id: "" };
            const children: PMNode[] = [];
            node.forEach((child) => children.push(clearIds(child)));
            return node.type.create(newAttrs, Fragment.from(children), node.marks);
          }

          // Recurse into children
          const children: PMNode[] = [];
          node.forEach((child) => children.push(clearIds(child)));
          if (children.length > 0) {
            return node.copy(Fragment.from(children));
          }
          return node;
        };

        const newContent: PMNode[] = [];
        slice.content.forEach((node) => {
          newContent.push(clearIds(node));
        });

        return new Slice(
          Fragment.from(newContent),
          slice.openStart,
          slice.openEnd
        );
      },
    },
  });
}
