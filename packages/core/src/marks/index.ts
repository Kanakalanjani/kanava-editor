import type { MarkDefinition } from "../extensions/defineMark.js";
import { Bold } from "./bold.js";
import { Italic } from "./italic.js";
import { Underline } from "./underline.js";
import { Strike } from "./strike.js";
import { Code } from "./code.js";
import { Link } from "./link.js";
import { TextColor } from "./textColor.js";
import { Highlight } from "./highlight.js";
import { FontSize } from "./fontSize.js";
import { FontFamily } from "./fontFamily.js";
import { Superscript } from "./superscript.js";
import { Subscript } from "./subscript.js";

// ── Individual exports (for cherry-picking) ──────────────────
export { Bold } from "./bold.js";
export { Italic } from "./italic.js";
export { Underline } from "./underline.js";
export { Strike } from "./strike.js";
export { Code } from "./code.js";
export { Link } from "./link.js";
export { TextColor } from "./textColor.js";
export { Highlight } from "./highlight.js";
export { FontSize } from "./fontSize.js";
export { FontFamily } from "./fontFamily.js";
export { Superscript } from "./superscript.js";
export { Subscript } from "./subscript.js";

/**
 * All built-in mark definitions.
 * Pass to `KanavaEditor` or `buildSchema` for the default mark set.
 */
export const builtInMarks: MarkDefinition[] = [
  Bold,
  Italic,
  Underline,
  Strike,
  Code,
  Link,
  TextColor,
  Highlight,
  FontSize,
  FontFamily,
  Superscript,
  Subscript,
];
