/**
 * Core types for Kanava's block tree API.
 * @see packages/docs/guide-document-model.md
 */
import type { Node as PMNode, Schema, Mark } from "prosemirror-model";
import type { BlockDefinition } from "../extensions/defineBlock.js";
import type { MarkDefinition } from "../extensions/defineMark.js";

/**
 * Block-level visual styling properties.
 * These live on the `blockNode` wrapper (not on individual blockBody types).
 * Only non-default values are serialized.
 */
export interface KanavaBlockStyle {
  textAlign?: "left" | "center" | "right" | "justify";
  backgroundColor?: string | null;
  spacingTop?: number;
  spacingBottom?: number;
  lineHeight?: number | null;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  borderColor?: string | null;
  borderWidth?: number;
  borderStyle?: "solid" | "dashed" | "dotted";
  borderRadius?: number;
  textIndent?: number;
  letterSpacing?: number;
  // Pagination control (Phase 7 prereqs)
  pageBreakBefore?: boolean;
  keepWithNext?: boolean;
  keepLinesTogether?: boolean;
  widowOrphan?: number;
}

export interface KanavaBlock {
  /** Unique block identifier */
  id: string;
  /** Body type (paragraph, heading, codeBlock, etc.) */
  type: string;
  /** Block-specific attributes (from the blockBody node) */
  attrs: Record<string, any>;
  /** Block-level visual styling (from the blockNode wrapper) */
  style?: KanavaBlockStyle;
  /** Inline content (for text blocks) */
  content: KanavaInlineContent[];
  /** Nested child blocks */
  children: KanavaBlock[];
}

export interface KanavaColumnLayout {
  id: string;
  type: "columnLayout";
  columns: KanavaColumn[];
  /** Block-level visual properties (from wrapper blockNode) */
  style?: KanavaBlockStyle;
}

export interface KanavaColumn {
  width: number;
  blocks: KanavaBlock[];
}

export type KanavaTopLevelBlock = KanavaBlock | KanavaColumnLayout;

export interface KanavaInlineContent {
  type: "text";
  text: string;
  marks: KanavaMarkData[];
}

export interface KanavaMarkData {
  type: string;
  attrs?: Record<string, any>;
}

export interface KanavaDocument {
  blocks: KanavaTopLevelBlock[];
}

/**
 * Document-level styling configuration.
 *
 * Sets default typography and spacing for the entire editor.
 * These values are applied as CSS custom properties on the editor root element.
 * Per-block attributes (inline styles) override these defaults.
 *
 * @example
 * ```ts
 * const editor = new KanavaEditor({
 *   element: document.getElementById("editor")!,
 *   documentStyle: { density: "tight" },
 * });
 *
 * // Override individual values:
 * editor.setDocumentStyle({ lineHeight: 1.3, paragraphGap: 6 });
 * ```
 */
export interface DocumentStyle {
  /** Global line-height (default: 1.6). Overridden by per-block lineHeight attr. */
  lineHeight?: number;
  /** Space between blocks in px (default: 2). Maps to `--kanava-paragraph-gap`. */
  paragraphGap?: number;
  /** Default body font-size in px (default: 16). Maps to `--kanava-font-size`. */
  fontSize?: number;
  /** Default font-family (default: system-ui). Maps to `--kanava-font-family`. */
  fontFamily?: string;
  /**
   * Spacing density preset. When set, overrides lineHeight, paragraphGap, and fontSize
   * with preset values. Explicit values take precedence over density.
   *
   * | Preset | lineHeight | paragraphGap | fontSize |
   * |--------|-----------|-------------|---------|
   * | tight | 1.2 | 4px | 14px |
   * | comfortable | 1.5 | 8px | 16px |
   * | relaxed | 1.8 | 16px | 18px |
   */
  density?: "tight" | "comfortable" | "relaxed";
}

/**
 * Editor configuration options.
 */
export interface KanavaEditorOptions {
  /** DOM element to mount the editor in */
  element: HTMLElement;
  /** Initial content */
  content?: KanavaDocument;
  /** Whether to start in read-only mode */
  editable?: boolean;
  /** Placeholder text for empty paragraphs */
  placeholder?: string;
  /** Called when content changes */
  onChange?: (doc: KanavaDocument) => void;
  /** Called when selection changes */
  onSelectionChange?: (selection: KanavaSelectionInfo) => void;
  /** Layout mode */
  mode?: "pageless" | "paginated";
  /** Page dimensions for paginated mode */
  pageSize?: { width: number; height: number };
  /** Full pagination configuration (paginated mode). Overrides pageSize. */
  pagination?: import("./pagination.js").PaginationConfig;
  /** Custom block definitions (defaults to built-in blocks) */
  blocks?: BlockDefinition[];
  /** Custom mark definitions (defaults to built-in marks) */
  marks?: MarkDefinition[];
  /** Called when an image is pasted/dropped. Return the uploaded image URL. */
  onImageUpload?: (file: File) => Promise<string>;
  /**
   * Document-level styling defaults.
   * Applied as CSS custom properties on the editor root element.
   * Per-block attributes override these defaults.
   */
  documentStyle?: DocumentStyle;
  /**
   * Layout mode controlling spacing density and drag handle style.
   * - `"standard"` — Comfortable spacing, visible drag handles (default).
   * - `"compact"` — Zero padding/margin, minimal gaps. For WYSIWYG precision docs (resumes, papers).
   */
  layoutMode?: "standard" | "compact";
  /**
   * Enable canvas mode interaction model.
   * When true, click selects entire blocks (NodeSelection) and
   * double-click enters text editing. Strips hover affordances and
   * drag handles for a clean WYSIWYG experience.
   */
  canvasMode?: boolean;
}

/**
 * A node in the document structure tree.
 * Produced by the `documentStructure` plugin for hierarchy navigation.
 */
export interface DocumentStructureNode {
  /** Block ID from blockNode attrs */
  id: string;
  /** Body type name (paragraph, heading, image, etc.) */
  type: string;
  /** Nesting depth (0-based) */
  depth: number;
  /** Preview of text content (first 60 chars), empty for atoms */
  textPreview: string;
  /** ProseMirror position of the blockNode */
  pos: number;
  /** Block-specific attrs (e.g. heading level) */
  attrs: Record<string, any>;
}

export interface KanavaSelectionInfo {
  /** Active marks at the cursor */
  activeMarks: string[];
  /** Current block type */
  blockType: string | null;
  /** Block attributes (from the blockBody node) */
  blockAttrs: Record<string, any>;
  /** Block-level styling attributes from the enclosing blockNode wrapper, or `null` if not found. */
  blockNodeAttrs: Record<string, any> | null;
  /** Whether selection is empty */
  empty: boolean;
  /** Selection anchor position */
  anchor: number;
  /** Selection head position */
  head: number;
}

export interface KanavaEditorAPI {
  /** Get the document as a JSON structure */
  getDocument(): KanavaDocument;
  /** Load a document from JSON */
  setDocument(doc: KanavaDocument): void;
  /** Get raw ProseMirror JSON (for debugging) */
  getRawJSON(): Record<string, any>;
  /** Focus the editor */
  focus(): void;
  /** Blur the editor */
  blur(): void;
  /** Destroy the editor instance */
  destroy(): void;
  /** Check if the editor is editable */
  isEditable(): boolean;
  /** Set editable state */
  setEditable(editable: boolean): void;
  /** Get the current zoom level (1 = 100%) */
  getZoom(): number;
  /** Set the zoom level */
  setZoom(level: number): void;
  /** Increase zoom by one step */
  zoomIn(): void;
  /** Decrease zoom by one step */
  zoomOut(): void;
  /** Reset zoom to 100% */
  resetZoom(): void;
}
