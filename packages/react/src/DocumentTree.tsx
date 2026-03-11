import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { KanavaEditor, DocumentStructureNode, BlockDefinition } from "@kanava/editor";
import { NodeSelection, TextSelection } from "@kanava/editor";

export interface DocumentTreeProps {
  editor: KanavaEditor | null;
  className?: string;
}

/**
 * Resolve an icon for a given block type from the editor's block definitions.
 * Falls back to a generic block icon.
 */
function resolveIcon(
  type: string,
  attrs: Record<string, any>,
  defMap: Map<string, BlockDefinition>
): string {
  if (type === "heading") {
    const level = attrs.level ?? 1;
    return `H${level}`;
  }
  const def = defMap.get(type);
  return def?.icon ?? "□";
}

/**
 * Build a label for a structure node.
 */
function nodeLabel(node: DocumentStructureNode): string {
  if (node.textPreview) return node.textPreview;
  if (node.type === "heading") return `Heading ${node.attrs.level ?? ""}`;
  if (node.type === "divider") return "Divider";
  if (node.type === "image") return "Image";
  if (node.type === "columnLayout") return "Columns";
  // Capitalize type name as fallback
  return node.type.charAt(0).toUpperCase() + node.type.slice(1);
}

/**
 * Find the active block ID based on the current selection anchor position.
 */
function findActiveBlockId(
  anchor: number,
  nodes: DocumentStructureNode[]
): string | null {
  // Walk backwards through nodes- find the last node whose pos <= anchor
  // and whose end >= anchor (the block that contains the cursor)
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i].pos <= anchor) {
      return nodes[i].id || null;
    }
  }
  return null;
}

/**
 * Document Tree — displays the document structure as an outline.
 * Click a node to select it and scroll to it.
 */
export const DocumentTree: React.FC<DocumentTreeProps> = ({
  editor,
  className,
}) => {
  const [nodes, setNodes] = useState<DocumentStructureNode[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Build a map of block definitions for icon resolution
  const defMap = useMemo(() => {
    if (!editor) return new Map<string, BlockDefinition>();
    const map = new Map<string, BlockDefinition>();
    for (const def of editor.blockDefs) {
      map.set(def.name, def);
    }
    return map;
  }, [editor]);

  // Subscribe to document changes to update structure
  useEffect(() => {
    if (!editor) return;
    setNodes(editor.getDocumentStructure());

    const unsubChange = editor.on("change", () => {
      setNodes(editor.getDocumentStructure());
    });

    const unsubSelection = editor.on("selectionChange", (info) => {
      const currentNodes = editor.getDocumentStructure();
      setActiveId(findActiveBlockId(info.anchor, currentNodes));
    });

    return () => {
      unsubChange();
      unsubSelection();
    };
  }, [editor]);

  const handleClick = useCallback(
    (node: DocumentStructureNode) => {
      if (!editor) return;
      const view = editor.pmView;
      const state = view.state;

      const blockNode = state.doc.nodeAt(node.pos);
      if (!blockNode || blockNode.type.name !== "blockNode") return;

      const body = blockNode.firstChild;
      if (body && body.isTextblock) {
        const tr = state.tr.setSelection(
          TextSelection.create(state.doc, node.pos + 2)
        );
        view.dispatch(tr.scrollIntoView());
      } else {
        const tr = state.tr.setSelection(
          NodeSelection.create(state.doc, node.pos)
        );
        view.dispatch(tr.scrollIntoView());
      }
      editor.focus();
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <div className={`kanava-document-tree ${className || ""}`}>
      <div className="kanava-dt-header">Document Outline</div>
      <div className="kanava-dt-list">
        {nodes.length === 0 && (
          <div className="kanava-dt-empty">No blocks</div>
        )}
        {nodes.map((node) => (
          <button
            key={node.id || `pos-${node.pos}`}
            className={`kanava-dt-node${activeId && activeId === node.id ? " kanava-dt-active" : ""}`}
            style={{ paddingLeft: `${8 + node.depth * 16}px` }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleClick(node);
            }}
            type="button"
            title={node.textPreview || node.type}
          >
            <span className="kanava-dt-icon">{resolveIcon(node.type, node.attrs, defMap)}</span>
            <span className="kanava-dt-label">{nodeLabel(node)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

DocumentTree.displayName = "KanavaDocumentTree";
