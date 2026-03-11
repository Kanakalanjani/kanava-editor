import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { NodeSelection, TextSelection } from "prosemirror-state";
import { MultiBlockSelection } from "../selections/MultiBlockSelection.js";

const selectionPluginKey = new PluginKey("kanavaSelection");

/**
 * Plugin that adds CSS classes to the currently focused blockNode.
 * - Adds `.kanava-block-focused` to the blockNode containing the cursor.
 * - On NodeSelection, adds `.kanava-block-selected` to the selected node.
 */
export function selectionPlugin(): Plugin {
  return new Plugin({
    key: selectionPluginKey,
    props: {
      decorations(state) {
        const decorations: Decoration[] = [];
        const { selection } = state;

        if (selection instanceof NodeSelection) {
          // Node selection — highlight the selected node
          decorations.push(
            Decoration.node(selection.from, selection.to, {
              class: "kanava-block-selected",
            })
          );
        } else if (selection instanceof TextSelection) {
          // Text selection — highlight the parent blockNode
          const { $from } = selection;
          for (let d = $from.depth; d >= 0; d--) {
            if ($from.node(d).type.name === "blockNode") {
              const from = $from.before(d);
              const to = $from.after(d);
              decorations.push(
                Decoration.node(from, to, {
                  class: "kanava-block-focused",
                })
              );
              break;
            }
          }
        } else if (selection instanceof MultiBlockSelection) {
          // Multi-block selection — highlight all selected blockNodes
          const positions = selection.getSelectedBlockPositions();
          for (const pos of positions) {
            const node = state.doc.nodeAt(pos);
            if (node) {
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: "kanava-block-multi-selected",
                })
              );
            }
          }
        }

        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
}
