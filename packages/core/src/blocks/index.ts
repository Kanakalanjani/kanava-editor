import type { BlockDefinition } from "../extensions/defineBlock.js";
import { Paragraph } from "./paragraph.js";
import { Heading } from "./heading.js";
import { CodeBlock } from "./codeBlock.js";
import { Quote } from "./quote.js";
import { Image } from "./image.js";
import { Divider } from "./divider.js";
import { ChecklistItem } from "./checklistItem.js";
import { BulletListItem } from "./bulletListItem.js";
import { NumberedListItem } from "./numberedListItem.js";
import { Toggle } from "./toggle.js";
import { Callout } from "./callout.js";
import { ColumnLayout } from "./columnLayout.js";

// ── Individual exports (for cherry-picking) ──────────────────
export { Paragraph } from "./paragraph.js";
export { Heading } from "./heading.js";
export { CodeBlock } from "./codeBlock.js";
export { Quote } from "./quote.js";
export { Image } from "./image.js";
export { Divider } from "./divider.js";
export { ChecklistItem } from "./checklistItem.js";
export { BulletListItem } from "./bulletListItem.js";
export { NumberedListItem } from "./numberedListItem.js";
export { Toggle } from "./toggle.js";
export { Callout } from "./callout.js";
export { ColumnLayout } from "./columnLayout.js";

/**
 * All built-in block definitions.
 * Pass to `KanavaEditor` or `buildSchema` for the default block set.
 */
export const builtInBlocks: BlockDefinition[] = [
  Paragraph,
  Heading,
  CodeBlock,
  Quote,
  Image,
  Divider,
  ChecklistItem,
  BulletListItem,
  NumberedListItem,
  Toggle,
  Callout,
  ColumnLayout,
];
