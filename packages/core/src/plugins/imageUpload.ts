import { Plugin, PluginKey, NodeSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { Schema } from "prosemirror-model";
import { nanoid } from "nanoid";

const imageUploadKey = new PluginKey("kanavaImageUpload");

/**
 * Extracts image files from a DataTransfer object.
 */
function getImageFiles(dataTransfer: DataTransfer): File[] {
  const files: File[] = [];
  for (let i = 0; i < dataTransfer.files.length; i++) {
    const file = dataTransfer.files[i];
    if (file.type.startsWith("image/")) {
      files.push(file);
    }
  }
  return files;
}

/**
 * Insert a placeholder image block at the given position with a loading state.
 * Returns the block ID so we can update it later.
 */
function insertPlaceholderImage(
  view: EditorView,
  schema: Schema,
  pos: number
): string {
  const blockId = nanoid();
  const imageNode = schema.nodes.image.create({
    src: "",
    alt: "",
    width: null,
    height: null,
    caption: "",
  });
  const blockNode = schema.nodes.blockNode.create(
    { id: blockId },
    imageNode
  );

  const tr = view.state.tr.insert(pos, blockNode);
  view.dispatch(tr);
  return blockId;
}

/**
 * Find the position of a blockNode by its ID in the document.
 */
function findBlockById(
  view: EditorView,
  blockId: string
): { pos: number; node: any } | null {
  let result: { pos: number; node: any } | null = null;
  view.state.doc.descendants((node, pos) => {
    if (result) return false;
    if (node.type.name === "blockNode" && node.attrs.id === blockId) {
      result = { pos, node };
      return false;
    }
    return true;
  });
  return result;
}

/**
 * Update the image src in a placeholder block after upload completes.
 */
function updateImageSrc(
  view: EditorView,
  blockId: string,
  src: string
): void {
  const found = findBlockById(view, blockId);
  if (!found) return;

  // The image node is the first child of the blockNode
  const imagePos = found.pos + 1; // skip into blockNode
  const imageNode = found.node.firstChild;
  if (!imageNode || imageNode.type.name !== "image") return;

  const tr = view.state.tr.setNodeMarkup(imagePos, undefined, {
    ...imageNode.attrs,
    src,
  });
  view.dispatch(tr);
}

/**
 * Remove a placeholder block if the upload fails.
 */
function removePlaceholderBlock(
  view: EditorView,
  blockId: string
): void {
  const found = findBlockById(view, blockId);
  if (!found) return;

  const tr = view.state.tr.delete(found.pos, found.pos + found.node.nodeSize);
  view.dispatch(tr);
}

/**
 * Find the insertion position for a new block at or near `pos`.
 * Returns a position at a block boundary in the root blockGroup.
 */
function findInsertionPos(view: EditorView, pos: number): number {
  const $pos = view.state.doc.resolve(pos);

  // Walk up to find the nearest blockNode boundary
  for (let depth = $pos.depth; depth >= 1; depth--) {
    const parentNode = $pos.node(depth);
    if (parentNode.type.name === "blockGroup") {
      // Insert after the current block in this group
      return $pos.after(depth + 1 <= $pos.depth ? depth + 1 : depth);
    }
  }

  // Fallback: end of document
  const blockGroup = view.state.doc.firstChild;
  if (blockGroup) {
    return blockGroup.nodeSize; // end of root blockGroup
  }
  return view.state.doc.content.size;
}

/**
 * Handle the upload of image files.
 */
async function handleImageFiles(
  view: EditorView,
  files: File[],
  onImageUpload: (file: File) => Promise<string>,
  insertPos: number
): Promise<void> {
  for (const file of files) {
    const schema = view.state.schema;
    const blockId = insertPlaceholderImage(view, schema, insertPos);

    // Add loading class to the placeholder
    const found = findBlockById(view, blockId);
    if (found) {
      const dom = view.nodeDOM(found.pos) as HTMLElement | null;
      dom?.classList.add("kanava-image-uploading");
    }

    try {
      const src = await onImageUpload(file);
      updateImageSrc(view, blockId, src);

      // Remove loading class
      const foundAfter = findBlockById(view, blockId);
      if (foundAfter) {
        const dom = view.nodeDOM(foundAfter.pos) as HTMLElement | null;
        dom?.classList.remove("kanava-image-uploading");
      }
    } catch {
      removePlaceholderBlock(view, blockId);
    }
  }
}

/**
 * Plugin that handles image paste and drop events.
 *
 * When an image file is pasted or dropped, this plugin:
 * 1. Inserts a placeholder image block with a loading spinner.
 * 2. Calls the `onImageUpload` callback to upload the file.
 * 3. On success: updates the image's `src` attribute.
 * 4. On failure: removes the placeholder block.
 */
export function imageUploadPlugin(
  onImageUpload: ((file: File) => Promise<string>) | undefined
): Plugin {
  return new Plugin({
    key: imageUploadKey,
    props: {
      handlePaste(view, event) {
        if (!onImageUpload) return false;
        if (!event.clipboardData) return false;

        const files = getImageFiles(event.clipboardData);
        if (files.length === 0) return false;

        event.preventDefault();

        // If the selection is on an empty image block (src === ""),
        // upload into the existing block instead of inserting a new one.
        const sel = view.state.selection;
        if (sel instanceof NodeSelection && files.length === 1) {
          const selectedNode = sel.node;
          // Check for image atom selected directly
          if (
            selectedNode.type.name === "image" &&
            (!selectedNode.attrs.src || selectedNode.attrs.src === "")
          ) {
            const blockNodeDepth = sel.$from.depth - 1;
            if (blockNodeDepth >= 0) {
              const blockNode = sel.$from.node(blockNodeDepth);
              if (blockNode.type.name === "blockNode" && blockNode.attrs.id) {
                const blockId = blockNode.attrs.id as string;
                // Add loading class
                const found = findBlockById(view, blockId);
                if (found) {
                  const dom = view.nodeDOM(found.pos) as HTMLElement | null;
                  dom?.classList.add("kanava-image-uploading");
                }
                onImageUpload(files[0])
                  .then((src) => {
                    updateImageSrc(view, blockId, src);
                    const foundAfter = findBlockById(view, blockId);
                    if (foundAfter) {
                      const dom = view.nodeDOM(foundAfter.pos) as HTMLElement | null;
                      dom?.classList.remove("kanava-image-uploading");
                    }
                  })
                  .catch(() => {
                    // Leave the empty image in place on failure
                    const found2 = findBlockById(view, blockId);
                    if (found2) {
                      const dom = view.nodeDOM(found2.pos) as HTMLElement | null;
                      dom?.classList.remove("kanava-image-uploading");
                    }
                  });
                return true;
              }
            }
          }
          // Check for blockNode selected whose firstChild is an empty image
          if (selectedNode.type.name === "blockNode") {
            const body = selectedNode.firstChild;
            if (
              body &&
              body.type.name === "image" &&
              (!body.attrs.src || body.attrs.src === "")
            ) {
              const blockId = selectedNode.attrs.id as string;
              if (blockId) {
                const found = findBlockById(view, blockId);
                if (found) {
                  const dom = view.nodeDOM(found.pos) as HTMLElement | null;
                  dom?.classList.add("kanava-image-uploading");
                }
                onImageUpload(files[0])
                  .then((src) => {
                    updateImageSrc(view, blockId, src);
                    const foundAfter = findBlockById(view, blockId);
                    if (foundAfter) {
                      const dom = view.nodeDOM(foundAfter.pos) as HTMLElement | null;
                      dom?.classList.remove("kanava-image-uploading");
                    }
                  })
                  .catch(() => {
                    const found2 = findBlockById(view, blockId);
                    if (found2) {
                      const dom = view.nodeDOM(found2.pos) as HTMLElement | null;
                      dom?.classList.remove("kanava-image-uploading");
                    }
                  });
                return true;
              }
            }
          }
        }

        const insertPos = findInsertionPos(view, view.state.selection.from);
        handleImageFiles(view, files, onImageUpload, insertPos);
        return true;
      },

      handleDrop(view, event) {
        if (!onImageUpload) return false;
        const dragEvent = event as DragEvent;
        if (!dragEvent.dataTransfer) return false;

        const files = getImageFiles(dragEvent.dataTransfer);
        if (files.length === 0) return false;

        event.preventDefault();
        const coords = { left: dragEvent.clientX, top: dragEvent.clientY };
        const posResult = view.posAtCoords(coords);
        const insertPos = posResult
          ? findInsertionPos(view, posResult.pos)
          : findInsertionPos(view, view.state.selection.from);

        handleImageFiles(view, files, onImageUpload, insertPos);
        return true;
      },
    },
  });
}
