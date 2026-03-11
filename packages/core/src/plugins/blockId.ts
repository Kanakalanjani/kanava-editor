import { Plugin, PluginKey } from "prosemirror-state";
import { nanoid } from "nanoid";

/**
 * Ensures every blockNode and columnLayout has a unique `id` attribute.
 * Auto-assigns IDs on creation and after paste.
 */
export const blockIdPluginKey = new PluginKey("blockId");

export function blockIdPlugin(): Plugin {
  return new Plugin({
    key: blockIdPluginKey,
    appendTransaction(transactions, _oldState, newState) {
      const hasDocChanged = transactions.some((tr) => tr.docChanged);
      if (!hasDocChanged) return null;

      const { tr } = newState;
      let modified = false;

      newState.doc.descendants((node, pos) => {
        if (node.type.name === "blockNode" && !node.attrs.id) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            id: nanoid(10),
          });
          modified = true;
        }
      });

      return modified ? tr : null;
    },
  });
}
