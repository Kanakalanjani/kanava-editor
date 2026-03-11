import { buildSchema } from "../extensions/schemaBuilder.js";
import { builtInBlocks } from "../blocks/index.js";
import { builtInMarks } from "../marks/index.js";

/**
 * The default Kanava editor schema.
 *
 * Built from the full set of built-in blocks and marks via `buildSchema()`.
 * For custom block sets, call `buildSchema(blocks, marks)` directly.
 *
 * Node hierarchy:
 *   doc → blockGroup → blockChild+ (blockNode | columnLayout)
 *   blockNode → blockBody blockGroup?
 *   columnLayout → column column+
 *   column → blockNode+
 *
 * This creates a recursive block tree where any block can
 * optionally contain nested children (via blockGroup).
 */
export const defaultSchema = buildSchema(builtInBlocks, builtInMarks);

/**
 * @deprecated Use `defaultSchema` instead. This alias exists for backward compatibility.
 */
export const kanavaSchema = defaultSchema;

/** Type alias for the schema shape. */
export type KanavaSchema = typeof defaultSchema;
