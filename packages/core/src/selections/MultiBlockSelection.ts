import { Selection, TextSelection } from "prosemirror-state";
import type { Mappable } from "prosemirror-transform";
import { Slice } from "prosemirror-model";
import type { Node, ResolvedPos } from "prosemirror-model";

/**
 * A custom Selection representing a contiguous range of selected blockNode
 * positions — Notion-style block multi-selection.
 *
 * The selection stores an anchor (where drag started) and head (where drag
 * currently is). All blockNodes between them are considered selected.
 */
export class MultiBlockSelection extends Selection {
  /** Position of the anchor blockNode (where selection started). */
  readonly anchorBlockPos: number;
  /** Position of the head blockNode (where selection ends). */
  readonly headBlockPos: number;

  constructor(doc: Node, anchorBlockPos: number, headBlockPos: number) {
    const from = Math.min(anchorBlockPos, headBlockPos);
    const toBlockPos = Math.max(anchorBlockPos, headBlockPos);
    const toNode = doc.nodeAt(toBlockPos);
    const to = toNode ? toBlockPos + toNode.nodeSize : toBlockPos + 1;

    super(doc.resolve(from), doc.resolve(to));
    this.anchorBlockPos = anchorBlockPos;
    this.headBlockPos = headBlockPos;
  }

  map(doc: Node, mapping: Mappable): Selection {
    const newAnchor = mapping.map(this.anchorBlockPos);
    const newHead = mapping.map(this.headBlockPos);

    // Validate mapped positions still point to blockNodes
    if (
      newAnchor >= 0 && newAnchor < doc.content.size &&
      newHead >= 0 && newHead < doc.content.size &&
      doc.nodeAt(newAnchor)?.type.name === "blockNode" &&
      doc.nodeAt(newHead)?.type.name === "blockNode"
    ) {
      return new MultiBlockSelection(doc, newAnchor, newHead);
    }

    // Fallback: collapsed text selection near the mapped anchor
    return TextSelection.near(doc.resolve(Math.min(newAnchor, doc.content.size)));
  }

  content(): Slice {
    const { from, to } = this;
    return this.$from.doc.slice(from, to);
  }

  eq(other: Selection): boolean {
    return (
      other instanceof MultiBlockSelection &&
      other.anchorBlockPos === this.anchorBlockPos &&
      other.headBlockPos === this.headBlockPos
    );
  }

  toJSON(): { type: string; anchor: number; head: number } {
    return {
      type: "multiBlock",
      anchor: this.anchorBlockPos,
      head: this.headBlockPos,
    };
  }

  static fromJSON(doc: Node, json: { anchor: number; head: number }): MultiBlockSelection {
    return new MultiBlockSelection(doc, json.anchor, json.head);
  }

  /**
   * Returns the positions of all blockNode nodes within this selection range.
   * Only collects blockNodes that are direct children of the same blockGroup
   * as the anchor and head, ensuring we don't accidentally include deeply
   * nested blockNodes from within columns.
   */
  getSelectedBlockPositions(): number[] {
    const positions: number[] = [];
    const { from, to } = this;
    const doc = this.$from.doc;

    doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === "blockNode") {
        positions.push(pos);
        return false; // don't descend into nested blocks
      }
      return true;
    });

    return positions;
  }
}

Selection.jsonID("multiBlock", MultiBlockSelection);
