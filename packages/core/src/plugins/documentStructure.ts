import { Plugin, PluginKey } from "prosemirror-state";
import type { Node as PMNode } from "prosemirror-model";
import type { DocumentStructureNode } from "../api/types.js";

export interface DocumentStructureState {
  nodes: DocumentStructureNode[];
  version: number;
}

export const documentStructureKey = new PluginKey<DocumentStructureState>(
  "documentStructure"
);

/**
 * Walk the ProseMirror document tree and build a flat array of
 * `DocumentStructureNode` entries — one per `blockNode`.
 */
function buildStructure(doc: PMNode): DocumentStructureNode[] {
  const nodes: DocumentStructureNode[] = [];

  function walk(node: PMNode, pos: number, depth: number): void {
    if (node.type.name === "blockNode") {
      const body = node.firstChild;
      const type = body ? body.type.name : "unknown";
      const id: string = node.attrs.id ?? "";
      const attrs: Record<string, any> = body ? { ...body.attrs } : {};

      let textPreview = "";
      if (body && !body.isAtom && body.textContent) {
        textPreview = body.textContent.slice(0, 60);
      }

      nodes.push({ id, type, depth, textPreview, pos, attrs });

      // Recurse into nested blockGroup (second child of blockNode)
      let childOffset = pos + 1; // inside blockNode
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child.type.name === "blockGroup") {
          walkChildren(child, childOffset, depth + 1);
        } else if (child.type.name === "columnLayout") {
          // Walk columns
          let colOffset = childOffset + 1; // inside columnLayout
          for (let c = 0; c < child.childCount; c++) {
            const col = child.child(c);
            // Each column contains blockNodes directly
            walkChildren(col, colOffset, depth + 1);
            colOffset += col.nodeSize;
          }
        }
        childOffset += child.nodeSize;
      }
      return;
    }

    // For container nodes (doc, blockGroup, column), walk children
    if (
      node.type.name === "doc" ||
      node.type.name === "blockGroup" ||
      node.type.name === "column"
    ) {
      walkChildren(node, pos, depth);
    }
  }

  function walkChildren(node: PMNode, pos: number, depth: number): void {
    let childOffset = pos + 1; // skip opening token
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      walk(child, childOffset, depth);
      childOffset += child.nodeSize;
    }
  }

  walk(doc, 0, 0);
  return nodes;
}

/**
 * Headless document-structure plugin.
 *
 * Rebuilds a flat `DocumentStructureNode[]` on every `docChanged` transaction.
 * Read via `documentStructureKey.getState(editorState)`.
 */
export function documentStructurePlugin(): Plugin {
  return new Plugin({
    key: documentStructureKey,

    state: {
      init(_, state) {
        return {
          nodes: buildStructure(state.doc),
          version: 0,
        };
      },

      apply(tr, value) {
        if (!tr.docChanged) return value;
        return {
          nodes: buildStructure(tr.doc),
          version: value.version + 1,
        };
      },
    },
  });
}
