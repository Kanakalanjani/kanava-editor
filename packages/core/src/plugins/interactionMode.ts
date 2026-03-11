import { Plugin, PluginKey, NodeSelection, TextSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

export const interactionModeKey = new PluginKey("interactionMode");

/**
 * interactionMode plugin — Canvas mode interaction model.
 *
 * - Single click on a block → NodeSelection on the enclosing blockNode
 * - Double click on a block → TextSelection (enter text editing)
 * - Escape exits text editing back to block selection
 * - Adds `kanava-canvas-mode` CSS class to the editor root
 *
 * When a block is already NodeSelected, mousedown falls through to
 * ProseMirror so its native drag-and-drop can initiate.
 */
export function interactionModePlugin(): Plugin {
  let textEditingActive = false;

  return new Plugin({
    key: interactionModeKey,

    props: {
      attributes: {
        class: "kanava-canvas-mode",
      },

      /**
       * Suppress ProseMirror's built-in click handler when not text editing,
       * so it doesn't overwrite the NodeSelection with a TextSelection.
       */
      handleClick(_view: EditorView, _pos: number, _event: MouseEvent): boolean {
        return !textEditingActive;
      },

      /**
       * Suppress ProseMirror's built-in double-click handler.
       * Double-click entry into text editing is handled in mousedown.
       */
      handleDoubleClick(_view: EditorView, _pos: number, _event: MouseEvent): boolean {
        return !textEditingActive;
      },

      handleDOMEvents: {
        mousedown(view: EditorView, event: MouseEvent): boolean {
          if (event.button !== 0) return false;

          const coords = { left: event.clientX, top: event.clientY };
          const posResult = view.posAtCoords(coords);
          if (!posResult) return false;

          const pos = posResult.pos;
          const $pos = view.state.doc.resolve(pos);

          // Find the enclosing blockNode
          let clickedBlockPos: number | null = null;
          for (let d = $pos.depth; d >= 0; d--) {
            if ($pos.node(d).type.name === "blockNode") {
              clickedBlockPos = $pos.before(d);
              break;
            }
          }
          if (clickedBlockPos === null) return false;

          // If the clicked block is already NodeSelected, let ProseMirror
          // handle this mousedown so its native drag can initiate.
          const sel = view.state.selection;
          if (sel instanceof NodeSelection && sel.from === clickedBlockPos) {
            return false;
          }

          // Double-click (or triple): enter text editing
          if (event.detail >= 2) {
            for (let d = $pos.depth; d >= 0; d--) {
              const node = $pos.node(d);
              if (node.type.spec.group?.includes("blockBody")) {
                if (node.isAtom) return false;
                textEditingActive = true;
                const tr = view.state.tr.setSelection(
                  TextSelection.create(view.state.doc, pos)
                );
                view.dispatch(tr);
                return true;
              }
            }
            return false;
          }

          // Single click while text-editing
          if (textEditingActive) {
            const { $from } = view.state.selection;

            let currentBlockPos: number | null = null;
            for (let d = $from.depth; d >= 0; d--) {
              if ($from.node(d).type.name === "blockNode") {
                currentBlockPos = $from.before(d);
                break;
              }
            }

            // Same block — let ProseMirror handle cursor repositioning
            if (currentBlockPos !== null && currentBlockPos === clickedBlockPos) {
              return false;
            }

            // Different block — exit text editing, select the new block
            textEditingActive = false;
          }

          // Select the blockNode
          const tr = view.state.tr.setSelection(
            NodeSelection.create(view.state.doc, clickedBlockPos)
          );
          view.dispatch(tr);
          return true;
        },
      },

      handleKeyDown(view: EditorView, event: KeyboardEvent): boolean {
        // Escape: exit text editing → block selection
        if (event.key === "Escape" && textEditingActive) {
          textEditingActive = false;
          const { $from } = view.state.selection;
          for (let d = $from.depth; d >= 0; d--) {
            if ($from.node(d).type.name === "blockNode") {
              const blockPos = $from.before(d);
              const tr = view.state.tr.setSelection(
                NodeSelection.create(view.state.doc, blockPos)
              );
              view.dispatch(tr);
              return true;
            }
          }
        }
        return false;
      },
    },

    view() {
      return {
        update(_view: EditorView) {
          if (!(_view.state.selection instanceof TextSelection)) {
            textEditingActive = false;
          }
        },
      };
    },
  });
}
