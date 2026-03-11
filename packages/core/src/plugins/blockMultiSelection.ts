import { Plugin, PluginKey, NodeSelection, TextSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { MultiBlockSelection } from "../selections/MultiBlockSelection.js";

export const blockMultiSelectionKey = new PluginKey("blockMultiSelection");

/**
 * Find the position of the enclosing blockNode for a given document position.
 * Returns null if the position is not inside a blockNode.
 */
function findBlockNodePos(view: EditorView, pos: number): number | null {
  const $pos = view.state.doc.resolve(Math.min(pos, view.state.doc.content.size));
  for (let d = $pos.depth; d >= 0; d--) {
    if ($pos.node(d).type.name === "blockNode") {
      return $pos.before(d);
    }
  }
  return null;
}

/**
 * Find the previous/next sibling blockNode position relative to the given blockNode pos.
 * `direction` is -1 for previous, +1 for next.
 */
function findSiblingBlockNodePos(
  view: EditorView,
  blockPos: number,
  direction: -1 | 1,
): number | null {
  const doc = view.state.doc;
  const $pos = doc.resolve(blockPos);
  // The parent of a blockNode is a blockGroup (or column)
  const parent = $pos.parent;
  const indexInParent = $pos.index();
  const siblingIndex = indexInParent + direction;

  if (siblingIndex < 0 || siblingIndex >= parent.childCount) return null;

  // Calculate the position of the sibling
  if (direction === -1) {
    // Previous sibling: walk backwards
    let pos = blockPos;
    const prevNode = parent.child(siblingIndex);
    pos -= prevNode.nodeSize;
    return pos;
  } else {
    // Next sibling: walk forwards
    const currentNode = doc.nodeAt(blockPos);
    if (!currentNode) return null;
    return blockPos + currentNode.nodeSize;
  }
}

/**
 * Plugin that provides Notion-style block multi-selection:
 * - Click-drag across block boundaries → MultiBlockSelection
 * - Shift+Click to extend/create multi-selection
 * - Keyboard: Delete, Backspace, type-to-replace, Escape, Shift+Arrow
 */
export function blockMultiSelectionPlugin(): Plugin {
  let dragStartBlockPos: number | null = null;
  let dragging = false;

  return new Plugin({
    key: blockMultiSelectionKey,

    props: {
      handleDOMEvents: {
        mousedown(view: EditorView, event: MouseEvent): boolean {
          if (event.button !== 0) return false;
          // Don't interfere with Shift+Click (handled in handleClick)
          if (event.shiftKey) return false;

          const posResult = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });
          if (!posResult) return false;

          dragStartBlockPos = findBlockNodePos(view, posResult.pos);
          dragging = false;
          return false; // don't prevent default — let other plugins handle mousedown
        },

        mousemove(view: EditorView, event: MouseEvent): boolean {
          if (!(event.buttons & 1) || dragStartBlockPos === null) return false;

          const posResult = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });
          if (!posResult) return false;

          const currentBlockPos = findBlockNodePos(view, posResult.pos);
          if (currentBlockPos === null) return false;
          if (currentBlockPos === dragStartBlockPos) {
            // Still in the same block — don't switch to multi-selection yet
            // But if we were already in multi-selection (e.g. user dragged back),
            // keep updating the head.
            if (!dragging) return false;
          }

          dragging = true;

          // Dispatch MultiBlockSelection
          const { doc } = view.state;
          const anchorNode = doc.nodeAt(dragStartBlockPos);
          const headNode = doc.nodeAt(currentBlockPos);
          if (!anchorNode || !headNode) return false;

          const sel = new MultiBlockSelection(doc, dragStartBlockPos, currentBlockPos);
          const tr = view.state.tr.setSelection(sel);
          view.dispatch(tr);

          // Prevent native text selection while multi-selecting
          event.preventDefault();
          return true;
        },

        mouseup(_view: EditorView, _event: MouseEvent): boolean {
          dragStartBlockPos = null;
          dragging = false;
          return false;
        },
      },

      /**
       * Shift+Click: extend or create MultiBlockSelection.
       */
      handleClick(view: EditorView, pos: number, event: MouseEvent): boolean {
        if (!event.shiftKey) return false;

        const clickedBlockPos = findBlockNodePos(view, pos);
        if (clickedBlockPos === null) return false;

        const { selection, doc } = view.state;
        let anchorPos: number | null = null;

        if (selection instanceof MultiBlockSelection) {
          anchorPos = selection.anchorBlockPos;
        } else if (selection instanceof NodeSelection) {
          anchorPos = selection.from;
        } else if (selection instanceof TextSelection) {
          anchorPos = findBlockNodePos(view, selection.from);
        }

        if (anchorPos === null || anchorPos === clickedBlockPos) return false;

        // Verify both positions point to blockNodes
        if (
          doc.nodeAt(anchorPos)?.type.name !== "blockNode" ||
          doc.nodeAt(clickedBlockPos)?.type.name !== "blockNode"
        ) {
          return false;
        }

        const sel = new MultiBlockSelection(doc, anchorPos, clickedBlockPos);
        view.dispatch(view.state.tr.setSelection(sel));
        return true;
      },

      /**
       * Keyboard behavior when MultiBlockSelection is active.
       */
      handleKeyDown(view: EditorView, event: KeyboardEvent): boolean {
        const { selection } = view.state;
        if (!(selection instanceof MultiBlockSelection)) return false;

        // Escape → collapse to NodeSelection on anchor block
        if (event.key === "Escape") {
          const tr = view.state.tr.setSelection(
            NodeSelection.create(view.state.doc, selection.anchorBlockPos),
          );
          view.dispatch(tr);
          return true;
        }

        // Delete / Backspace → remove all selected blocks, insert empty paragraph
        if (event.key === "Delete" || event.key === "Backspace") {
          deleteMultiSelection(view);
          return true;
        }

        // Shift+ArrowUp → extend selection upward
        if (event.key === "ArrowUp" && event.shiftKey) {
          const topPos = Math.min(selection.anchorBlockPos, selection.headBlockPos);
          const prev = findSiblingBlockNodePos(view, topPos, -1);
          if (prev !== null && view.state.doc.nodeAt(prev)?.type.name === "blockNode") {
            // Move head upward
            const newHead =
              selection.headBlockPos <= selection.anchorBlockPos ? prev : topPos;
            const sel = new MultiBlockSelection(
              view.state.doc,
              selection.anchorBlockPos,
              newHead === topPos ? topPos : prev,
            );
            view.dispatch(view.state.tr.setSelection(sel));
          }
          return true;
        }

        // Shift+ArrowDown → extend selection downward
        if (event.key === "ArrowDown" && event.shiftKey) {
          const bottomPos = Math.max(selection.anchorBlockPos, selection.headBlockPos);
          const next = findSiblingBlockNodePos(view, bottomPos, 1);
          if (next !== null && view.state.doc.nodeAt(next)?.type.name === "blockNode") {
            const newHead =
              selection.headBlockPos >= selection.anchorBlockPos ? next : bottomPos;
            const sel = new MultiBlockSelection(
              view.state.doc,
              selection.anchorBlockPos,
              newHead === bottomPos ? bottomPos : next,
            );
            view.dispatch(view.state.tr.setSelection(sel));
          }
          return true;
        }

        // ArrowUp / ArrowDown (no shift) → collapse selection and move cursor
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          const targetPos =
            event.key === "ArrowUp"
              ? Math.min(selection.anchorBlockPos, selection.headBlockPos)
              : Math.max(selection.anchorBlockPos, selection.headBlockPos);
          const tr = view.state.tr.setSelection(
            NodeSelection.create(view.state.doc, targetPos),
          );
          view.dispatch(tr);
          return true;
        }

        // Printable character → replace all blocks with a new paragraph containing the char
        if (isPrintableKey(event)) {
          replaceMultiSelectionWithChar(view, event.key);
          return true;
        }

        return false;
      },
    },
  });
}

/**
 * Delete all blocks in the MultiBlockSelection and insert a single empty
 * paragraph. The entire operation is one transaction (undoable).
 */
function deleteMultiSelection(view: EditorView): void {
  const selection = view.state.selection as MultiBlockSelection;
  const { from, to } = selection;
  const { tr, schema } = view.state;

  // Create an empty blockNode > paragraph to replace the selection
  const paragraphType = schema.nodes.paragraph;
  const blockNodeType = schema.nodes.blockNode;
  if (!paragraphType || !blockNodeType) return;

  const emptyPara = blockNodeType.create(null, paragraphType.create());
  tr.replaceWith(from, to, emptyPara);
  // Position cursor inside the new paragraph
  tr.setSelection(TextSelection.near(tr.doc.resolve(from + 2)));
  tr.scrollIntoView();
  view.dispatch(tr);
}

/**
 * Replace multi-selection with a new paragraph containing the typed character.
 */
function replaceMultiSelectionWithChar(view: EditorView, char: string): void {
  const selection = view.state.selection as MultiBlockSelection;
  const { from, to } = selection;
  const { tr, schema } = view.state;

  const paragraphType = schema.nodes.paragraph;
  const blockNodeType = schema.nodes.blockNode;
  if (!paragraphType || !blockNodeType) return;

  const textNode = schema.text(char);
  const newPara = blockNodeType.create(null, paragraphType.create(null, textNode));
  tr.replaceWith(from, to, newPara);
  // Place cursor after the typed character
  tr.setSelection(TextSelection.near(tr.doc.resolve(from + 3)));
  tr.scrollIntoView();
  view.dispatch(tr);
}

/**
 * Check if a keyboard event represents a printable character.
 */
function isPrintableKey(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (event.key.length !== 1) return false;
  return true;
}
