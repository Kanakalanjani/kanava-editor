import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

/**
 * Shows placeholder text in empty paragraph blocks.
 */
export const placeholderPluginKey = new PluginKey("placeholder");

export function placeholderPlugin(
  text: string = "Type something..."
): Plugin {
  return new Plugin({
    key: placeholderPluginKey,
    props: {
      decorations(state) {
        const decorations: Decoration[] = [];
        const { doc } = state;

        doc.descendants((node, pos) => {
          // Only show placeholder in empty paragraph nodes
          if (
            node.type.name === "paragraph" &&
            node.childCount === 0
          ) {
            const deco = Decoration.node(pos, pos + node.nodeSize, {
              class: "kanava-placeholder",
              "data-placeholder": text,
            });
            decorations.push(deco);
          }
        });

        return DecorationSet.create(doc, decorations);
      },
    },
  });
}
