import type { Command } from "prosemirror-state";

/**
 * Set divider attributes on the current block.
 * Works by finding the divider blockBody inside the blockNode at the selection.
 */
export function setDividerAttrs(attrs: {
  color?: string | null;
  thickness?: number;
  width?: number;
  lineStyle?: "solid" | "dashed" | "dotted" | "double";
}): Command {
  return (state, dispatch) => {
    const { $from } = state.selection;

    // Walk up to find the divider node
    for (let d = $from.depth; d >= 0; d--) {
      const node = $from.node(d);
      if (node.type.name === "divider") {
        if (dispatch) {
          const pos = $from.before(d);
          dispatch(
            state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              ...attrs,
            }).scrollIntoView()
          );
        }
        return true;
      }
    }

    // Also handle NodeSelection on blockNode containing a divider
    if (state.selection.constructor.name === "NodeSelection") {
      const selNode = (state.selection as any).node;
      if (selNode?.type.name === "blockNode") {
        const divider = selNode.firstChild;
        if (divider?.type.name === "divider") {
          if (dispatch) {
            const pos = (state.selection as any).from;
            // +1 to get inside blockNode to the divider child position
            dispatch(
              state.tr.setNodeMarkup(pos + 1, undefined, {
                ...divider.attrs,
                ...attrs,
              }).scrollIntoView()
            );
          }
          return true;
        }
      }
    }

    return false;
  };
}
