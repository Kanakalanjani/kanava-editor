import type { Command, EditorState } from "prosemirror-state";
import { toggleMark } from "prosemirror-commands";
import type { MarkType, Schema } from "prosemirror-model";

/**
 * Toggle bold mark.
 */
export function toggleBold(schema: Schema): Command {
  return toggleMark(schema.marks.bold);
}

/**
 * Toggle italic mark.
 */
export function toggleItalic(schema: Schema): Command {
  return toggleMark(schema.marks.italic);
}

/**
 * Toggle underline mark.
 */
export function toggleUnderline(schema: Schema): Command {
  return toggleMark(schema.marks.underline);
}

/**
 * Toggle strikethrough mark.
 */
export function toggleStrike(schema: Schema): Command {
  return toggleMark(schema.marks.strike);
}

/**
 * Toggle inline code mark.
 */
export function toggleCode(schema: Schema): Command {
  return toggleMark(schema.marks.code);
}

/**
 * Set or toggle a link mark.
 */
export function toggleLink(
  schema: Schema,
  attrs?: { href: string; target?: string; rel?: string }
): Command {
  return (state, dispatch) => {
    const linkMark = schema.marks.link;
    const { from, to, empty } = state.selection;

    // Check if there's already a link in the selection
    let hasLink = false;
    state.doc.nodesBetween(from, to, (node) => {
      if (linkMark.isInSet(node.marks)) {
        hasLink = true;
      }
    });

    if (hasLink) {
      // Remove the link
      return toggleMark(linkMark)(state, dispatch);
    }

    if (!attrs?.href) return false;
    if (empty) return false;

    return toggleMark(linkMark, attrs)(state, dispatch);
  };
}

/**
 * Set text color for the selection.
 */
export function setTextColor(schema: Schema, color: string): Command {
  return (state, dispatch) => {
    const { from, to, empty } = state.selection;
    if (empty) return false;

    if (!dispatch) return true;

    const tr = state.tr;
    const mark = schema.marks.textColor.create({ color });
    tr.addMark(from, to, mark);
    dispatch(tr);
    return true;
  };
}

/**
 * Remove text color from the selection.
 */
export function removeTextColor(schema: Schema): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;

    if (!dispatch) return true;

    const tr = state.tr;
    tr.removeMark(from, to, schema.marks.textColor);
    dispatch(tr);
    return true;
  };
}

/**
 * Set highlight color for the selection.
 */
export function setHighlight(schema: Schema, color: string): Command {
  return (state, dispatch) => {
    const { from, to, empty } = state.selection;
    if (empty) return false;

    if (!dispatch) return true;

    const tr = state.tr;
    const mark = schema.marks.highlight.create({ color });
    tr.addMark(from, to, mark);
    dispatch(tr);
    return true;
  };
}

/**
 * Remove highlight from the selection.
 */
export function removeHighlight(schema: Schema): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;

    if (!dispatch) return true;

    const tr = state.tr;
    tr.removeMark(from, to, schema.marks.highlight);
    dispatch(tr);
    return true;
  };
}

/**
 * Set text alignment on the current block(s).
 * Targets the `blockNode` wrapper (where textAlign now lives),
 * not individual blockBody nodes.
 */
export function setTextAlign(alignment: "left" | "center" | "right" | "justify"): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;
    const blockNodeType = state.schema.nodes.blockNode;
    if (!blockNodeType) {
      return false;
    }

    // Collect all blockNode positions that contain the selection
    const blockNodes: { pos: number; node: any }[] = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === blockNodeType) {
        // Skip blockNodes wrapping columnLayout — textAlign is CSS-inheritable
        // and would cascade into all column content.
        // But continue descending (return true) to find inner blockNodes in columns.
        if (node.firstChild?.type.name === "columnLayout") {
          return true;
        }
        blockNodes.push({ pos, node });
      }
      return true;
    });

    if (blockNodes.length === 0) return false;

    if (dispatch) {
      const tr = state.tr;
      for (const { pos, node } of blockNodes) {
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          textAlign: alignment,
        });
      }
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set background color on the current block(s).
 * Pass `null` to remove the background.
 */
export function setBlockBackground(color: string | null): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;
    const blockNodeType = state.schema.nodes.blockNode;
    if (!blockNodeType) return false;

    const blockNodes: { pos: number; node: any }[] = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === blockNodeType) {
        blockNodes.push({ pos, node });
        return node.firstChild?.type.name !== "columnLayout";
      }
      return true;
    });

    if (blockNodes.length === 0) return false;

    if (dispatch) {
      const tr = state.tr;
      for (const { pos, node } of blockNodes) {
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          backgroundColor: color,
        });
      }
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set vertical spacing (top/bottom margins) on the current block(s).
 * Values are in pixels. Pass 0 to reset to default.
 */
export function setBlockSpacing(top: number, bottom: number): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;
    const blockNodeType = state.schema.nodes.blockNode;
    if (!blockNodeType) return false;

    const blockNodes: { pos: number; node: any }[] = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === blockNodeType) {
        blockNodes.push({ pos, node });
        return node.firstChild?.type.name !== "columnLayout";
      }
      return true;
    });

    if (blockNodes.length === 0) return false;

    if (dispatch) {
      const tr = state.tr;
      for (const { pos, node } of blockNodes) {
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          spacingTop: top,
          spacingBottom: bottom,
        });
      }
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set line height on the current block(s).
 * Pass `null` to clear (revert to CSS default).
 */
export function setLineHeight(value: number | null): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;
    const blockNodeType = state.schema.nodes.blockNode;
    if (!blockNodeType) return false;

    const blockNodes: { pos: number; node: any }[] = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === blockNodeType) {
        // Skip columnLayout wrappers — lineHeight is CSS-inheritable
        // But continue descending to find inner blockNodes in columns.
        if (node.firstChild?.type.name === "columnLayout") return true;
        blockNodes.push({ pos, node });
      }
      return true;
    });

    if (blockNodes.length === 0) return false;

    if (dispatch) {
      const tr = state.tr;
      for (const { pos, node } of blockNodes) {
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          lineHeight: value,
        });
      }
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set padding on the current block(s).
 * @param side Which side to set padding on.
 * @param value Padding in pixels. Pass 0 to clear.
 */
export function setBlockPadding(side: "top" | "bottom" | "left" | "right", value: number): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;
    const blockNodeType = state.schema.nodes.blockNode;
    if (!blockNodeType) return false;

    const attrKey = `padding${side.charAt(0).toUpperCase()}${side.slice(1)}` as
      "paddingTop" | "paddingBottom" | "paddingLeft" | "paddingRight";

    const blockNodes: { pos: number; node: any }[] = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === blockNodeType) {
        blockNodes.push({ pos, node });
        return node.firstChild?.type.name !== "columnLayout";
      }
      return true;
    });

    if (blockNodes.length === 0) return false;

    if (dispatch) {
      const tr = state.tr;
      for (const { pos, node } of blockNodes) {
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          [attrKey]: value,
        });
      }
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Border attrs that can be updated at once.
 */
export interface BlockBorderAttrs {
  borderColor?: string | null;
  borderWidth?: number;
  borderStyle?: "solid" | "dashed" | "dotted";
  borderRadius?: number;
}

/**
 * Set border properties on the current block(s).
 * Pass partial attrs to update only specific border properties.
 */
export function setBlockBorder(borderAttrs: Partial<BlockBorderAttrs>): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;
    const blockNodeType = state.schema.nodes.blockNode;
    if (!blockNodeType) return false;

    const blockNodes: { pos: number; node: any }[] = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === blockNodeType) {
        blockNodes.push({ pos, node });
        return node.firstChild?.type.name !== "columnLayout";
      }
      return true;
    });

    if (blockNodes.length === 0) return false;

    if (dispatch) {
      const tr = state.tr;
      for (const { pos, node } of blockNodes) {
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          ...borderAttrs,
        });
      }
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set first-line text indent on the current block(s).
 * Pass 0 to clear.
 */
export function setTextIndent(value: number): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;
    const blockNodeType = state.schema.nodes.blockNode;
    if (!blockNodeType) return false;

    const blockNodes: { pos: number; node: any }[] = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === blockNodeType) {
        // Skip columnLayout wrappers — textIndent is CSS-inheritable
        // But continue descending to find inner blockNodes in columns.
        if (node.firstChild?.type.name === "columnLayout") return true;
        blockNodes.push({ pos, node });
      }
      return true;
    });

    if (blockNodes.length === 0) return false;

    if (dispatch) {
      const tr = state.tr;
      for (const { pos, node } of blockNodes) {
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          textIndent: value,
        });
      }
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set letter spacing on the current block(s).
 * Pass 0 to clear.
 */
export function setLetterSpacing(value: number): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;
    const blockNodeType = state.schema.nodes.blockNode;
    if (!blockNodeType) return false;

    const blockNodes: { pos: number; node: any }[] = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === blockNodeType) {
        // Skip columnLayout wrappers — letterSpacing is CSS-inheritable
        // But continue descending to find inner blockNodes in columns.
        if (node.firstChild?.type.name === "columnLayout") return true;
        blockNodes.push({ pos, node });
      }
      return true;
    });

    if (blockNodes.length === 0) return false;

    if (dispatch) {
      const tr = state.tr;
      for (const { pos, node } of blockNodes) {
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          letterSpacing: value,
        });
      }
      dispatch(tr);
    }
    return true;
  };
}

/** Default blockNode attrs — used by resetBlockFormatting to clear overrides. */
const BLOCK_NODE_DEFAULTS: Record<string, any> = {
  textAlign: "left",
  backgroundColor: null,
  spacingTop: 0,
  spacingBottom: 0,
  lineHeight: null,
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
  borderColor: null,
  borderWidth: 0,
  borderStyle: "solid",
  borderRadius: 0,
  textIndent: 0,
  letterSpacing: 0,
  pageBreakBefore: false,
  keepWithNext: false,
  keepLinesTogether: false,
  widowOrphan: 2,
};

/**
 * Clear all direct formatting overrides on the selected blockNode(s),
 * reverting them to document/style defaults. Preserves `id`.
 */
export function resetBlockFormatting(): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;
    const blockNodeType = state.schema.nodes.blockNode;
    if (!blockNodeType) return false;

    const blockNodes: { pos: number; node: any }[] = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === blockNodeType) {
        blockNodes.push({ pos, node });
        return node.firstChild?.type.name !== "columnLayout";
      }
      return true;
    });

    if (blockNodes.length === 0) return false;

    if (dispatch) {
      const tr = state.tr;
      for (const { pos, node } of blockNodes) {
        tr.setNodeMarkup(pos, undefined, {
          ...BLOCK_NODE_DEFAULTS,
          id: node.attrs.id,
        });
      }
      dispatch(tr);
    }
    return true;
  };
}

// Re-exported pagination-related block attr commands (extracted for modularity)
export { setPageBreakBefore, setKeepWithNext, setKeepLinesTogether, setWidowOrphan, collectBlockNodes } from "./blockAttrs.js";

// Re-exported inline mark commands (extracted for modularity)
export { toggleSuperscript, toggleSubscript, setFontSize, removeFontSize, setFontFamily, removeFontFamily } from "./inlineMarks.js";
