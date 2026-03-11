import { Plugin } from "prosemirror-state";
import type { Transaction } from "prosemirror-state";

/**
 * An `appendTransaction` plugin that renumbers consecutive `numberedListItem`
 * blocks within each `blockGroup`. When a numbered list item is added,
 * removed, or reordered, the `order` attrs are corrected automatically.
 *
 * Numbering resets to 1 whenever a non-`numberedListItem` block interrupts
 * the run. Nested blockGroups are handled independently.
 */
export function listRenumberPlugin(): Plugin {
  return new Plugin({
    appendTransaction(transactions, _oldState, newState) {
      if (!transactions.some((tr) => tr.docChanged)) return null;

      let tr: Transaction | null = null;

      newState.doc.descendants((node, pos) => {
        if (node.type.name !== "blockGroup") return true;

        // Walk children of this blockGroup.
        // Each child is a blockNode whose first child is the blockBody.
        let expectedOrder = 1;

        node.forEach((child, offset) => {
          const childPos = pos + 1 + offset;
          const body = child.firstChild;
          if (!body) return;

          if (body.type.name === "numberedListItem") {
            if (body.attrs.order !== expectedOrder) {
              if (!tr) tr = newState.tr;
              // blockBody is at childPos + 1 (first child inside blockNode)
              const bodyPos = childPos + 1;
              tr.setNodeMarkup(bodyPos, undefined, {
                ...body.attrs,
                order: expectedOrder,
              });
            }
            expectedOrder++;
          } else {
            // Non-numbered block resets the counter
            expectedOrder = 1;
          }
        });

        return true; // continue into nested blockGroups
      });

      return tr;
    },
  });
}
