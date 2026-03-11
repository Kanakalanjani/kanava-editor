import { Plugin, PluginKey, NodeSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { Node as PMNode, ResolvedPos } from "prosemirror-model";

/**
 * Drag handle plugin — provides drag-and-drop support for blocks.
 *
 * The actual drag handle UI is rendered inside BlockNodeView (top-left corner,
 * visible on hover). This plugin handles the drop logic for block reordering.
 *
 * Special handling: when a blockNode is dragged OUT of a column, ProseMirror's
 * built-in drop may only copy (not move) because removing the last child would
 * violate column's `blockNode+` constraint. We intercept the drop to:
 *  1. Move the dragged blockNode to the target position.
 *  2. If the source column is now empty:
 *     a. 2 columns → dissolve the entire column layout
 *     b. >2 columns → remove the empty column
 */
export const dragHandlePluginKey = new PluginKey("dragHandle");

/**
 * Check if a resolved position is inside a column node.
 * Returns the depth of the column node, or null if not in a column.
 */
function findColumnDepth($pos: ResolvedPos): number | null {
  for (let d = $pos.depth; d >= 0; d--) {
    if ($pos.node(d).type.name === "column") return d;
  }
  return null;
}

/**
 * Find an insertion position for a blockNode based on visual (DOM-rect)
 * comparison rather than text-position-derived indices.
 *
 * `posAtCoords` is used to identify WHICH container the drop is in, but
 * the insertion index inside that container is determined by comparing
 * `dropY` against child bounding rects.  This avoids the X-coordinate
 * sensitivity of `$drop.index(d)`.
 *
 * @param preferTopLevel If true, skip column-level parents and
 *   prefer the top-level blockGroup (used when dragging OUT of a column).
 */
function findDropTarget(
  view: EditorView,
  $drop: ResolvedPos,
  dropY: number,
  preferTopLevel: boolean,
): number | null {
  for (let d = $drop.depth; d >= 0; d--) {
    const parent = $drop.node(d);
    if (parent.type.name === "blockGroup" || parent.type.name === "column") {
      if (preferTopLevel && parent.type.name === "column") continue;

      const containerStartPos = $drop.start(d);

      // Try DOM-rect-based resolution
      let bestIndex = parent.childCount; // default: append at end
      let childPos = containerStartPos;

      for (let i = 0; i < parent.childCount; i++) {
        const child = parent.child(i);
        const childDOM = view.nodeDOM(childPos);
        if (childDOM && childDOM instanceof HTMLElement) {
          const rect = childDOM.getBoundingClientRect();
          const midY = (rect.top + rect.bottom) / 2;
          if (dropY < midY) {
            bestIndex = i;
            break;
          }
        }
        childPos += child.nodeSize;
      }

      // Convert index to PM position
      let insertPos = containerStartPos;
      for (let i = 0; i < bestIndex; i++) {
        insertPos += parent.child(i).nodeSize;
      }
      return insertPos;
    }
  }
  return null;
}

export function dragHandlePlugin(): Plugin {
  return new Plugin({
    key: dragHandlePluginKey,
    props: {
      handleDrop(view: EditorView, event: DragEvent, slice, moved): boolean {
        // Only intercept if we're moving a NodeSelection (block drag)
        const sel = view.state.selection;
        if (!(sel instanceof NodeSelection) || !moved) return false;

        const draggedNode = sel.node;
        if (draggedNode.type.name !== "blockNode") return false;

        const draggedPos = sel.from;
        const $dragged = view.state.doc.resolve(draggedPos);
        const sourceColumnDepth = findColumnDepth($dragged);

        // Find the drop position
        const dropCoords = { left: event.clientX, top: event.clientY };
        const posResult = view.posAtCoords(dropCoords);
        if (!posResult) return false;

        const $drop = view.state.doc.resolve(posResult.pos);
        const dropColumnDepth = findColumnDepth($drop);

        // Column source + same column → let ProseMirror handle reordering
        if (sourceColumnDepth !== null && dropColumnDepth !== null) {
          const sourceColumnPos = $dragged.before(sourceColumnDepth);
          const dropColumnPos = $drop.before(dropColumnDepth);
          if (sourceColumnPos === dropColumnPos) {
            if ($dragged.node(sourceColumnDepth).childCount > 1) return false;
            return false;
          }
        }

        // Use DOM-rect-based drop target resolution
        const preferTopLevel = sourceColumnDepth !== null && dropColumnDepth === null;
        const insertPos = findDropTarget(view, $drop, event.clientY, preferTopLevel);
        if (insertPos === null) return false;

        // ── Non-column source: simple move with rect-based target ──
        if (sourceColumnDepth === null) {
          const tr = view.state.tr;
          tr.delete(draggedPos, draggedPos + draggedNode.nodeSize);
          const mappedInsertPos = tr.mapping.map(insertPos);
          tr.insert(mappedInsertPos, draggedNode);
          view.dispatch(tr.scrollIntoView());
          return true;
        }

        // ── Column source: handle dissolution / column removal ──

        const sourceColumn = $dragged.node(sourceColumnDepth);
        const isLastInColumn = sourceColumn.childCount === 1;
        const tr = view.state.tr;
        const schema = view.state.schema;

        if (isLastInColumn) {
          // The column will be empty after removing this block.
          // Need to dissolve/remove the column.
          const colLayoutDepth = sourceColumnDepth - 1;
          const wrapperDepth = colLayoutDepth - 1;
          if (wrapperDepth < 0) return false;

          const colLayout = $dragged.node(colLayoutDepth);
          const wrapperPos = $dragged.before(wrapperDepth);
          const wrapperEnd = $dragged.after(wrapperDepth);

          if (colLayout.childCount <= 2) {
            // ── Dissolve: replace entire wrapper with remaining column's blocks ──
            const columnIndex = $dragged.index(colLayoutDepth);
            const remainingIndex = columnIndex === 0 ? 1 : 0;
            const remainingColumn = colLayout.child(remainingIndex);

            // Extract blocks from remaining column
            const blocks: PMNode[] = [];
            remainingColumn.forEach((block) => blocks.push(block));

            // Replace wrapper blockNode with the remaining column's blocks
            tr.replaceWith(wrapperPos, wrapperEnd, blocks);

            // Insert dragged block at mapped target position
            const mappedInsertPos = tr.mapping.map(insertPos);
            tr.insert(mappedInsertPos, draggedNode);
          } else {
            // ── >2 columns: remove just this column ──
            // First insert a temp placeholder so schema is valid during delete
            const emptyBlock = schema.nodes.blockNode.create(
              { id: "" },
              schema.nodes.paragraph.create(),
            );
            tr.insert(draggedPos, emptyBlock);

            // Delete the original dragged block
            const mappedDraggedFrom = tr.mapping.map(draggedPos);
            tr.delete(mappedDraggedFrom, mappedDraggedFrom + draggedNode.nodeSize);

            // Now delete the column that only has the placeholder
            const mappedColumnPos = tr.mapping.map($dragged.before(sourceColumnDepth));
            const mappedColumnEnd = tr.mapping.map($dragged.after(sourceColumnDepth));
            tr.delete(mappedColumnPos, mappedColumnEnd);

            // Insert dragged block at mapped target
            const mappedInsertPos = tr.mapping.map(insertPos);
            tr.insert(mappedInsertPos, draggedNode);
          }
        } else {
          // ── Not the last block in column: simple move ──
          // Delete original first, then insert at target
          tr.delete(draggedPos, draggedPos + draggedNode.nodeSize);
          const mappedInsertPos = tr.mapping.map(insertPos);
          tr.insert(mappedInsertPos, draggedNode);
        }

        view.dispatch(tr);
        return true;
      },
    },
  });
}
