import type { Command } from "prosemirror-state";
import { NodeSelection } from "prosemirror-state";

/* ------------------------------------------------------------------ */
/*  Image Commands                                                     */
/* ------------------------------------------------------------------ */

/**
 * Returns the image node & pos if the selection is a NodeSelection on
 * an image node. Returns null otherwise.
 */
function getSelectedImage(state: Parameters<Command>[0]) {
  const { selection } = state;
  if (!(selection instanceof NodeSelection)) return null;
  const node = selection.node;
  // Check if this is an image blockBody node
  if (node.type.name !== "image") return null;
  return { node, pos: selection.from };
}

/**
 * Set the alignment of the currently selected image.
 */
export function setImageAlignment(alignment: "left" | "center" | "right"): Command {
  return (state, dispatch) => {
    const img = getSelectedImage(state);
    if (!img) return false;
    if (dispatch) {
      const tr = state.tr.setNodeMarkup(img.pos, undefined, {
        ...img.node.attrs,
        alignment,
      });
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set the CSS filter of the currently selected image.
 */
export function setImageFilter(filter: string): Command {
  return (state, dispatch) => {
    const img = getSelectedImage(state);
    if (!img) return false;
    if (dispatch) {
      const tr = state.tr.setNodeMarkup(img.pos, undefined, {
        ...img.node.attrs,
        filter,
      });
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set the alt text of the currently selected image.
 */
export function setImageAlt(alt: string): Command {
  return (state, dispatch) => {
    const img = getSelectedImage(state);
    if (!img) return false;
    if (dispatch) {
      const tr = state.tr.setNodeMarkup(img.pos, undefined, {
        ...img.node.attrs,
        alt,
      });
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set the width (and proportional height) of the currently selected image.
 * Pass 0 or null to reset to natural size.
 */
export function setImageWidth(width: number | null): Command {
  return (state, dispatch) => {
    const img = getSelectedImage(state);
    if (!img) return false;
    if (dispatch) {
      const attrs = { ...img.node.attrs };
      if (!width || width <= 0) {
        attrs.width = null;
        attrs.height = null;
      } else {
        const oldWidth = attrs.width || 1;
        const oldHeight = attrs.height || 1;
        const ratio = oldHeight / oldWidth;
        attrs.width = Math.round(width);
        attrs.height = Math.round(width * ratio);
      }
      const tr = state.tr.setNodeMarkup(img.pos, undefined, attrs);
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set the caption of the currently selected image.
 */
export function setImageCaption(caption: string): Command {
  return (state, dispatch) => {
    const img = getSelectedImage(state);
    if (!img) return false;
    if (dispatch) {
      const tr = state.tr.setNodeMarkup(img.pos, undefined, {
        ...img.node.attrs,
        caption,
      });
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set crop data on the currently selected image.
 * cropData is an object { x, y, width, height } where values are
 * percentages (0-100). Pass null to remove crop.
 */
export function setImageCrop(
  cropData: { x: number; y: number; width: number; height: number } | null
): Command {
  return (state, dispatch) => {
    const img = getSelectedImage(state);
    if (!img) return false;
    if (dispatch) {
      const tr = state.tr.setNodeMarkup(img.pos, undefined, {
        ...img.node.attrs,
        cropData,
      });
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set the rotation of the currently selected image.
 * Value is in degrees (0-359). Pass 0 to reset rotation.
 */
export function setImageRotation(rotation: number): Command {
  return (state, dispatch) => {
    const img = getSelectedImage(state);
    if (!img) return false;
    if (dispatch) {
      const tr = state.tr.setNodeMarkup(img.pos, undefined, {
        ...img.node.attrs,
        rotation: rotation % 360,
      });
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set the filter intensity of the currently selected image.
 * Value is 0-100, where 100 is full filter effect.
 */
export function setFilterIntensity(intensity: number): Command {
  return (state, dispatch) => {
    const img = getSelectedImage(state);
    if (!img) return false;
    if (dispatch) {
      const tr = state.tr.setNodeMarkup(img.pos, undefined, {
        ...img.node.attrs,
        filterIntensity: Math.max(0, Math.min(100, Math.round(intensity))),
      });
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set individual image adjustments (brightness, contrast, saturation).
 * Values are on a 0-200 scale where 100 = normal.
 * Pass null to reset adjustments.
 */
export function setImageAdjustments(
  adjustments: { brightness: number; contrast: number; saturation: number } | null
): Command {
  return (state, dispatch) => {
    const img = getSelectedImage(state);
    if (!img) return false;
    if (dispatch) {
      const tr = state.tr.setNodeMarkup(img.pos, undefined, {
        ...img.node.attrs,
        adjustments,
      });
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Set the crop shape of the currently selected image.
 * Supported shapes: "rect" (default), "circle", "rounded".
 */
export function setImageCropShape(shape: "rect" | "circle" | "rounded"): Command {
  return (state, dispatch) => {
    const img = getSelectedImage(state);
    if (!img) return false;
    if (dispatch) {
      const tr = state.tr.setNodeMarkup(img.pos, undefined, {
        ...img.node.attrs,
        cropShape: shape,
      });
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Insert an image from a URL at the current cursor position
 * (or replace current selection).
 */
export function insertImageFromUrl(
  src: string,
  alt = "",
  caption = ""
): Command {
  return (state, dispatch) => {
    const imageType = state.schema.nodes.image;
    const blockNodeType = state.schema.nodes.blockNode;
    if (!imageType || !blockNodeType) return false;
    if (dispatch) {
      const imageNode = imageType.create({ src, alt, caption });
      const block = blockNodeType.create({}, imageNode);

      // Find a valid insertion point at a block boundary
      const { $from } = state.selection;
      let insertPos: number | null = null;
      for (let depth = $from.depth; depth >= 1; depth--) {
        if ($from.node(depth).type.name === "blockGroup") {
          // Insert after the current sibling in this blockGroup
          insertPos = $from.after(depth + 1 <= $from.depth ? depth + 1 : depth);
          break;
        }
      }
      if (insertPos == null) {
        // Fallback: end of doc's root blockGroup
        const bg = state.doc.firstChild;
        insertPos = bg ? bg.nodeSize : state.doc.content.size;
      }
      const tr = state.tr.insert(insertPos, block);
      dispatch(tr);
    }
    return true;
  };
}
