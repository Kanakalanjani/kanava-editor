import { Schema, type NodeSpec, type MarkSpec } from "prosemirror-model";
import type { BlockDefinition } from "./defineBlock.js";
import type { MarkDefinition } from "./defineMark.js";
import { structuralNodes } from "../schema/structuralNodes.js";

/**
 * Options for `buildSchema`.
 */
export interface BuildSchemaOptions {
  /**
   * Override or extend the structural node specs
   * (doc, blockGroup, blockNode, column, text).
   * Merged over the built-in structural nodes.
   */
  structuralOverrides?: Record<string, NodeSpec>;
}

/**
 * Assemble a ProseMirror `Schema` from block and mark definitions.
 *
 * 1. Starts with the structural nodes that form the document skeleton
 *    (doc, blockGroup, blockNode, column, text).
 * 2. Adds each `BlockDefinition.spec` — its `group` field is used as-is
 *    (defaults to `"blockBody"` via `defineBlock`).
 * 3. Adds each `MarkDefinition.spec`.
 * 4. Returns the assembled `Schema`.
 *
 * This function is the foundation of Kanava's extensibility: by passing
 * different `blocks` and `marks` arrays, the schema includes only what
 * the consumer needs — including custom third-party block types.
 */
export function buildSchema(
  blocks: BlockDefinition[],
  marks: MarkDefinition[],
  options?: BuildSchemaOptions,
): Schema {
  // ── Structural nodes ─────────────────────────────────────
  const nodes: Record<string, NodeSpec> = {
    ...structuralNodes,
    ...(options?.structuralOverrides ?? {}),
  };

  // ── Block definitions → NodeSpec entries ──────────────────
  for (const block of blocks) {
    if (nodes[block.name]) {
      throw new Error(
        `BlockDefinition "${block.name}" conflicts with a structural node of the same name.`,
      );
    }
    nodes[block.name] = block.spec;
  }

  // ── Mark definitions → MarkSpec entries ───────────────────
  const markSpecs: Record<string, MarkSpec> = {};
  for (const mark of marks) {
    markSpecs[mark.name] = mark.spec;
  }

  return new Schema({ nodes, marks: markSpecs });
}
