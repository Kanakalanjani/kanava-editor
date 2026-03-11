/**
 * Block tree serialization — converts between ProseMirror nodes and KanavaDocument JSON.
 * @see packages/docs/guide-document-model.md
 */
import type { Node as PMNode, Fragment } from "prosemirror-model";
import type {
  KanavaBlock,
  KanavaBlockStyle,
  KanavaColumnLayout,
  KanavaColumn,
  KanavaTopLevelBlock,
  KanavaInlineContent,
  KanavaMarkData,
  KanavaDocument,
} from "./types.js";
import type { Schema } from "prosemirror-model";

/**
 * Convert a ProseMirror document to a Kanava document tree.
 */
export function docToKanava(doc: PMNode): KanavaDocument {
  const blocks: KanavaTopLevelBlock[] = [];

  // doc → blockGroup → blockChild+
  const blockGroup = doc.firstChild;
  if (!blockGroup || blockGroup.type.name !== "blockGroup") {
    return { blocks: [] };
  }

  blockGroup.forEach((child) => {
    const block = nodeToBlock(child);
    if (block) blocks.push(block);
  });

  return { blocks };
}

/**
 * Convert a blockChild node (always a blockNode under Option B) to API type.
 * A blockNode contains either (blockBody blockGroup?) or columnLayout.
 */
function nodeToBlock(node: PMNode): KanavaTopLevelBlock | null {
  if (node.type.name === "blockNode") {
    // Check if this blockNode wraps a columnLayout (Option B)
    const firstChild = node.firstChild;
    if (firstChild && firstChild.type.name === "columnLayout") {
      return columnLayoutToKanava(node);
    }
    return blockNodeToKanava(node);
  }
  return null;
}

/**
 * Extract KanavaBlockStyle from a blockNode's attrs.
 * Only includes non-default values.
 */
function extractBlockStyle(attrs: Record<string, any>): KanavaBlockStyle {
  const style: KanavaBlockStyle = {};
  if (attrs.textAlign && attrs.textAlign !== "left") style.textAlign = attrs.textAlign;
  if (attrs.backgroundColor) style.backgroundColor = attrs.backgroundColor;
  if (attrs.spacingTop && attrs.spacingTop > 0) style.spacingTop = attrs.spacingTop;
  if (attrs.spacingBottom && attrs.spacingBottom > 0) style.spacingBottom = attrs.spacingBottom;
  if (attrs.lineHeight != null) style.lineHeight = attrs.lineHeight;
  if (attrs.paddingTop > 0) style.paddingTop = attrs.paddingTop;
  if (attrs.paddingBottom > 0) style.paddingBottom = attrs.paddingBottom;
  if (attrs.paddingLeft > 0) style.paddingLeft = attrs.paddingLeft;
  if (attrs.paddingRight > 0) style.paddingRight = attrs.paddingRight;
  if (attrs.borderColor) style.borderColor = attrs.borderColor;
  if (attrs.borderWidth > 0) style.borderWidth = attrs.borderWidth;
  if (attrs.borderStyle && attrs.borderStyle !== "solid") style.borderStyle = attrs.borderStyle;
  if (attrs.borderRadius > 0) style.borderRadius = attrs.borderRadius;
  if (attrs.textIndent > 0) style.textIndent = attrs.textIndent;
  if (attrs.letterSpacing > 0) style.letterSpacing = attrs.letterSpacing;
  if (attrs.pageBreakBefore) style.pageBreakBefore = attrs.pageBreakBefore;
  if (attrs.keepWithNext) style.keepWithNext = attrs.keepWithNext;
  if (attrs.keepLinesTogether) style.keepLinesTogether = attrs.keepLinesTogether;
  if (attrs.widowOrphan !== undefined && attrs.widowOrphan !== 2) style.widowOrphan = attrs.widowOrphan;
  return style;
}

/**
 * Apply KanavaBlockStyle to blockNode attrs dict.
 */
function applyBlockStyleToAttrs(attrs: Record<string, any>, style?: KanavaBlockStyle): void {
  if (!style) return;
  if (style.textAlign) attrs.textAlign = style.textAlign;
  if (style.backgroundColor) attrs.backgroundColor = style.backgroundColor;
  if (style.spacingTop) attrs.spacingTop = style.spacingTop;
  if (style.spacingBottom) attrs.spacingBottom = style.spacingBottom;
  if (style.lineHeight != null) attrs.lineHeight = style.lineHeight;
  if (style.paddingTop) attrs.paddingTop = style.paddingTop;
  if (style.paddingBottom) attrs.paddingBottom = style.paddingBottom;
  if (style.paddingLeft) attrs.paddingLeft = style.paddingLeft;
  if (style.paddingRight) attrs.paddingRight = style.paddingRight;
  if (style.borderColor) attrs.borderColor = style.borderColor;
  if (style.borderWidth) attrs.borderWidth = style.borderWidth;
  if (style.borderStyle) attrs.borderStyle = style.borderStyle;
  if (style.borderRadius) attrs.borderRadius = style.borderRadius;
  if (style.textIndent) attrs.textIndent = style.textIndent;
  if (style.letterSpacing) attrs.letterSpacing = style.letterSpacing;
  if (style.pageBreakBefore) attrs.pageBreakBefore = style.pageBreakBefore;
  if (style.keepWithNext) attrs.keepWithNext = style.keepWithNext;
  if (style.keepLinesTogether) attrs.keepLinesTogether = style.keepLinesTogether;
  if (style.widowOrphan !== undefined) attrs.widowOrphan = style.widowOrphan;
}

function blockNodeToKanava(node: PMNode): KanavaBlock {
  const body = node.firstChild;

  // Extract block-level style attrs from blockNode wrapper
  const style = extractBlockStyle(node.attrs);

  const block: KanavaBlock = {
    id: node.attrs.id || "",
    type: body?.type.name || "paragraph",
    attrs: { ...(body?.attrs || {}) },
    ...(Object.keys(style).length > 0 ? { style } : {}),
    content: body ? inlineContentToKanava(body) : [],
    children: [],
  };

  // Check for nested blockGroup
  if (node.childCount > 1) {
    const nestedGroup = node.child(1);
    if (nestedGroup.type.name === "blockGroup") {
      nestedGroup.forEach((child) => {
        const childBlock = nodeToBlock(child);
        if (childBlock) {
          block.children.push(childBlock as KanavaBlock);
        }
      });
    }
  }

  return block;
}

/**
 * Convert a wrapper blockNode containing a columnLayout to KanavaColumnLayout.
 * Under Option B, the blockNode wraps the columnLayout and provides the ID + styles.
 */
function columnLayoutToKanava(wrapperNode: PMNode): KanavaColumnLayout {
  const colLayoutNode = wrapperNode.firstChild!;
  const columns: KanavaColumn[] = [];

  colLayoutNode.forEach((col) => {
    if (col.type.name === "column") {
      const blocks: KanavaBlock[] = [];
      col.forEach((blockNode) => {
        if (blockNode.type.name === "blockNode") {
          blocks.push(blockNodeToKanava(blockNode));
        }
      });
      columns.push({
        width: col.attrs.width ?? 1,
        blocks,
      });
    }
  });

  // Extract style from the wrapper blockNode
  const style = extractBlockStyle(wrapperNode.attrs);

  return {
    id: wrapperNode.attrs.id || "",
    type: "columnLayout",
    columns,
    ...(Object.keys(style).length > 0 ? { style } : {}),
  };
}

function inlineContentToKanava(body: PMNode): KanavaInlineContent[] {
  const result: KanavaInlineContent[] = [];

  // Atom nodes (image, divider) have no inline content
  if (body.type.spec.atom) return result;

  body.forEach((child) => {
    if (child.isText && child.text) {
      const marks: KanavaMarkData[] = child.marks.map((m) => ({
        type: m.type.name,
        ...(Object.keys(m.attrs).length > 0 ? { attrs: { ...m.attrs } } : {}),
      }));
      result.push({ type: "text", text: child.text, marks });
    }
  });

  return result;
}

/**
 * Convert a Kanava document tree back to a ProseMirror document.
 */
export function kanavaToDoc(doc: KanavaDocument, schema: Schema): PMNode {
  const blockChildren = doc.blocks.map((block) => blockToNode(block, schema));

  const blockGroup = schema.nodes.blockGroup.create(null, blockChildren);
  return schema.nodes.doc.create(null, blockGroup);
}

function blockToNode(
  block: KanavaTopLevelBlock,
  schema: Schema
): PMNode {
  if (block.type === "columnLayout") {
    return columnLayoutToNode(block as KanavaColumnLayout, schema);
  }
  return blockNodeToNode(block as KanavaBlock, schema);
}

function blockNodeToNode(
  block: KanavaBlock,
  schema: Schema
): PMNode {
  const bodyType = schema.nodes[block.type];
  if (!bodyType) {
    // Fallback to paragraph
    return schema.nodes.blockNode.create(
      { id: block.id },
      schema.nodes.paragraph.create()
    );
  }

  const inlineContent = kanavaInlineToFragment(block.content, schema);
  const body = bodyType.create(block.attrs, inlineContent);

  const children: PMNode[] = [body];

  if (block.children.length > 0) {
    const nestedBlocks = block.children.map((child) =>
      blockToNode(child, schema)
    );
    const nestedGroup = schema.nodes.blockGroup.create(null, nestedBlocks);
    children.push(nestedGroup);
  }

  // Build blockNode attrs: id + style attrs
  const blockNodeAttrs: Record<string, any> = { id: block.id };
  applyBlockStyleToAttrs(blockNodeAttrs, block.style);

  return schema.nodes.blockNode.create(blockNodeAttrs, children);
}

/**
 * Convert a KanavaColumnLayout back to a ProseMirror blockNode > columnLayout.
 */
function columnLayoutToNode(
  layout: KanavaColumnLayout,
  schema: Schema
): PMNode {
  const columns = layout.columns.map((col) => {
    const blocks = col.blocks.map((b) => blockNodeToNode(b, schema));
    return schema.nodes.column.create({ width: col.width }, blocks);
  });

  const colLayoutNode = schema.nodes.columnLayout.create(null, columns);

  // Build wrapper blockNode attrs: id + style
  const blockNodeAttrs: Record<string, any> = { id: layout.id };
  applyBlockStyleToAttrs(blockNodeAttrs, layout.style);

  return schema.nodes.blockNode.create(blockNodeAttrs, colLayoutNode);
}

function kanavaInlineToFragment(
  content: KanavaInlineContent[],
  schema: Schema
): PMNode[] {
  return content.map((item) => {
    const marks = item.marks.map((m) => {
      const markType = schema.marks[m.type];
      return markType.create(m.attrs || {});
    });
    return schema.text(item.text, marks);
  });
}
