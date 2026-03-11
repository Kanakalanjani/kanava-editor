export { KanavaEditorComponent } from "./KanavaEditor.js";
export type { KanavaEditorProps } from "./KanavaEditor.js";
export { FormatBar } from "./FormatBar.js";
export type { FormatBarProps } from "./FormatBar.js";
export { ImageEditorModal } from "./ImageEditorModal.js";
export type { ImageEditorModalProps } from "./ImageEditorModal.js";
export { ImageInsertPopover } from "./ImageInsertPopover.js";
export type { ImageInsertPopoverProps } from "./ImageInsertPopover.js";
export { FixedToolbar } from "./FixedToolbar.js";
export type { FixedToolbarProps } from "./FixedToolbar.js";
export { ParagraphFormatPopover } from "./ParagraphFormatPopover.js";
export type { ParagraphFormatPopoverProps } from "./ParagraphFormatPopover.js";
export { ContextMenu } from "./ContextMenu.js";
export type { ContextMenuProps } from "./ContextMenu.js";
export { SeparatorMenu } from "./SeparatorMenu.js";
export type { SeparatorMenuProps } from "./SeparatorMenu.js";
export { GhostRail } from "./GhostRail.js";
export type { GhostRailProps } from "./GhostRail.js";
export { BlockPicker } from "./BlockPicker.js";
export type { BlockPickerProps } from "./BlockPicker.js";
export { DocumentTree } from "./DocumentTree.js";
export type { DocumentTreeProps } from "./DocumentTree.js";
export { DocumentStatsDisplay } from "./DocumentStats.js";
export type { DocumentStatsProps } from "./DocumentStats.js";
export { FindReplaceBar } from "./FindReplaceBar.js";
export type { FindReplaceBarProps } from "./FindReplaceBar.js";
export { ZoomControls } from "./ZoomControls.js";
export type { ZoomControlsProps } from "./ZoomControls.js";
export {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  ToolbarDropdown,
  BlockToolbar,
  NumberStepper,
  SelectDropdown,
  SegmentedControl,
} from "./ToolbarPrimitives.js";
export type {
  ToolbarButtonProps,
  ToolbarGroupProps,
  ToolbarDropdownProps,
  BlockToolbarProps,
  NumberStepperProps,
  SelectOption,
  SelectDropdownProps,
  SegmentedOption,
  SegmentedControlProps,
} from "./ToolbarPrimitives.js";
export { useKanavaEditor, useSelectionInfo, useIsMarkActive, useToolbarState, useEditorJSON, useEditorFocused, useBlockAtSelection, useEditorCommand, useFindReplaceState, useZoom } from "./hooks.js";
export type { BlockAtSelection, EditorCommandResult, ZoomState } from "./hooks.js";
export { useRovingTabindex } from "./useRovingTabindex.js";
export { ColorPicker } from "./ColorPicker.js";
export type { ColorPickerProps } from "./ColorPicker.js";
export { FontPicker } from "./FontPicker.js";
export type { FontPickerProps } from "./FontPicker.js";
export { LinkPreviewCard } from "./LinkPreviewCard.js";
export type { LinkPreviewCardProps } from "./LinkPreviewCard.js";
export type { FontOption } from "./FixedToolbar.js";

// Icons
export {
  KanavaIconProvider,
  useIconResolver,
  KanavaIcon,
  defaultIconResolver,
  defaultIconMap,
} from "./icons/index.js";
export type {
  IconProps,
  IconResolver,
  KanavaIconProviderProps,
  KanavaIconComponentProps,
} from "./icons/index.js";

// Re-export core types for convenience
export type {
  KanavaDocument,
  KanavaBlock,
  KanavaColumnLayout,
  KanavaColumn,
  KanavaSelectionInfo,
  KanavaEditorOptions,
  DocumentStyle,
  ToolbarState,
  ToolbarItem,
  ToolbarDropdownItem,
  ContextMenuItem,
  GhostRailAncestor,
} from "@kanava/editor";
export { KanavaEditor } from "@kanava/editor";

// Pagination re-exports
export { PageSizePresets } from "@kanava/editor";
export type {
  PaginationConfig,
  PaginationState,
  PageBreakInfo,
  PageMargins,
  PageSizeName,
} from "@kanava/editor";
export { getDocumentStats } from "@kanava/editor";
export type { DocumentStats } from "@kanava/editor";
