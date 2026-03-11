// Kanava Editor — Core Entry Point
// ================================

// Main Editor Class
export { KanavaEditor, CommandChain } from "./editor.js";

// Schema
export { defaultSchema, kanavaSchema } from "./schema/schema.js";
export type { KanavaSchema } from "./schema/schema.js";

// Extension Primitives (for building custom blocks/marks/plugins)
export { defineBlock, type BlockDefinition } from "./extensions/defineBlock.js";
export type { ToolbarItem, ToolbarDropdownItem, ContextMenuItem, ConvertibleVariant } from "./extensions/defineBlock.js";
export { defineMark, type MarkDefinition } from "./extensions/defineMark.js";
export { definePlugin, type PluginDefinition, type PluginContext } from "./extensions/definePlugin.js";
export { buildSchema, type BuildSchemaOptions } from "./extensions/schemaBuilder.js";

// Built-in Blocks
export {
  builtInBlocks,
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
} from "./blocks/index.js";

// Image utilities
export { IMAGE_FILTERS } from "./blocks/image.js";

// Built-in Marks
export {
  builtInMarks,
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
} from "./marks/index.js";

// NodeView Base Class and Built-in NodeViews
export { KanavaNodeView } from "./nodeViews/KanavaNodeView.js";
export { BlockNodeView } from "./nodeViews/BlockNodeView.js";
export { ColumnLayoutView, ColumnView } from "./nodeViews/ColumnLayoutView.js";
export { ImageNodeView } from "./nodeViews/ImageNodeView.js";
export { CodeBlockView } from "./nodeViews/CodeBlockView.js";
export { ToggleNodeView } from "./nodeViews/ToggleNodeView.js";
export { CalloutNodeView } from "./nodeViews/CalloutNodeView.js";

// Commands — Block Operations
export {
  splitBlockNode,
  handleBlockBackspace,
  handleBlockDelete,
  insertBlockAfter,
  deleteCurrentBlock,
  convertBlockType,
  duplicateBlock,
  moveBlockUp,
  moveBlockDown,
  toggleCollapseBlock,
} from "./commands/block.js";

// Commands — Nesting
export { indentBlock, outdentBlock } from "./commands/nesting.js";

// Commands — Divider
export { setDividerAttrs } from "./commands/divider.js";

// Commands — Column Navigation
export { exitColumnUp, exitColumnDown } from "./commands/columnNav.js";

// Commands — Column Layout
export {
  createColumnLayout,
  addColumn,
  addColumnLeft,
  addColumnRight,
  removeColumn,
  setColumnWidth,
  extractFromColumn,
} from "./commands/columns.js";

// Plugins — Ghost Rail
export { ghostRailPlugin, ghostRailPluginKey } from "./plugins/ghostRail.js";
export type { GhostRailAncestor } from "./plugins/ghostRail.js";

// Commands — Text Formatting
export {
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleStrike,
  toggleCode,
  toggleLink,
  setTextColor,
  removeTextColor,
  setHighlight,
  removeHighlight,
  setTextAlign,
  setBlockBackground,
  setBlockSpacing,
  setLineHeight,
  setBlockPadding,
  setBlockBorder,
  setTextIndent,
  setLetterSpacing,
  setPageBreakBefore,
  setKeepWithNext,
  setKeepLinesTogether,
  setWidowOrphan,
  toggleSuperscript,
  toggleSubscript,
  setFontSize,
  removeFontSize,
  setFontFamily,
  removeFontFamily,
  resetBlockFormatting,
} from "./commands/text.js";
export type { BlockBorderAttrs } from "./commands/text.js";

// Commands — Image
export {
  setImageAlignment,
  setImageFilter,
  setImageAlt,
  setImageWidth,
  setImageCaption,
  setImageCrop,
  setImageRotation,
  insertImageFromUrl,
} from "./commands/image.js";

// Block Tree API (JSON ↔ ProseMirror conversion)
export { docToKanava, kanavaToDoc } from "./api/blockTree.js";
export { getSelectionInfo, isMarkActive, getCurrentBlockInfo } from "./api/operations.js";
export { KanavaEventEmitter } from "./api/events.js";
export { getDocumentStats } from "./api/documentStats.js";
export type { DocumentStats } from "./api/documentStats.js";

// Plugins (for advanced customization)
export { selectionPlugin } from "./plugins/selection.js";
export { clipboardPlugin } from "./plugins/clipboard.js";
export { imageUploadPlugin } from "./plugins/imageUpload.js";
export { kanavaInputRules } from "./plugins/inputRules.js";
export { kanavaKeymap } from "./plugins/keymap.js";
export { blockIdPlugin } from "./plugins/blockId.js";
export { placeholderPlugin } from "./plugins/placeholder.js";
export { dragHandlePlugin } from "./plugins/dragHandle.js";
export { listRenumberPlugin } from "./plugins/listRenumber.js";
export { paginationPlugin, getPaginationState } from "./plugins/pagination.js";
export {
  toolbarStatePlugin,
  toolbarStateKey,
  getToolbarState,
  subscribeToolbarState,
} from "./plugins/toolbarState.js";
export type { ToolbarState } from "./plugins/toolbarState.js";

// Plugins — Interaction Mode (Canvas Mode)
export { interactionModePlugin, interactionModeKey } from "./plugins/interactionMode.js";

// Plugins — Block Multi-Selection
export { blockMultiSelectionPlugin, blockMultiSelectionKey } from "./plugins/blockMultiSelection.js";

// Selections
export { MultiBlockSelection } from "./selections/MultiBlockSelection.js";

// Plugins — Document Structure
export { documentStructurePlugin, documentStructureKey } from "./plugins/documentStructure.js";
export type { DocumentStructureState } from "./plugins/documentStructure.js";

// Plugins — Find & Replace
export {
  findReplacePlugin, findReplaceKey,
  getFindReplaceState, subscribeFindReplace,
} from "./plugins/findReplace.js";
export type { FindReplaceState, FindReplaceMatch } from "./plugins/findReplace.js";
export {
  openFindReplace, closeFindReplace,
  setSearchQuery, setReplaceText,
  findNext, findPrev,
  replaceCurrent, replaceAll,
  toggleCaseSensitive, toggleRegex, toggleWholeWord,
} from "./commands/findReplace.js";

// ProseMirror re-exports (for consumers that don't want prosemirror-* directly)
export { NodeSelection, TextSelection } from "prosemirror-state";
export type { Command } from "prosemirror-state";
export { undo, redo } from "prosemirror-history";

// Types
export type {
  KanavaBlock,
  KanavaBlockStyle,
  KanavaColumnLayout,
  KanavaColumn,
  KanavaTopLevelBlock,
  KanavaInlineContent,
  KanavaMarkData,
  KanavaDocument,
  KanavaEditorOptions,
  KanavaSelectionInfo,
  KanavaEditorAPI,
  DocumentStyle,
  DocumentStructureNode,
} from "./api/types.js";
export type { KanavaEventType, KanavaEventMap, ImageEditEventPayload, ImageInsertEventPayload } from "./api/events.js";

// Pagination
export { PageSizePresets, resolvePageDimensions, getPageStyleCSS, DEFAULT_PAGE_MARGINS } from "./api/pagination.js";
export type {
  PaginationConfig,
  PaginationState,
  PageBreakInfo,
  PageMargins,
  PageSizeName,
} from "./api/pagination.js";
