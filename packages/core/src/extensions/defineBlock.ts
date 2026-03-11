import type { NodeSpec, Schema, Attrs, Node as PMNode } from "prosemirror-model";
import type { Command } from "prosemirror-state";
import type { InputRule } from "prosemirror-inputrules";
import type { EditorView, NodeView } from "prosemirror-view";
import type { KanavaBlock } from "../api/types.js";

/* ── Toolbar / Context Menu item types ─────────────────────── */

/**
 * Describes a single toolbar item that appears when this block is selected.
 * This is data only — the React layer decides how to render it.
 */
export interface ToolbarItem {
  /** Unique key within this block's toolbar items. */
  key: string;

  /** Icon identifier (string key mapped to icons by the React layer). */
  icon?: string;

  /** Tooltip / accessible label. */
  label: string;

  /** The item type. Default is `"button"`. */
  type?: "button" | "dropdown" | "toggle" | "separator" | "input";

  /**
   * ProseMirror command to execute on click.
   * For `"dropdown"` type, this is the currently-selected command;
   * individual dropdown items use `items[].command`.
   */
  command?: Command;

  /**
   * For `"dropdown"` items — the list of selectable sub-items.
   */
  items?: ToolbarDropdownItem[];

  /**
   * For `"input"` items — configuration for the text/number input.
   */
  inputConfig?: {
    /** Input type: text or number. */
    inputType: "text" | "number";
    /** Placeholder text. */
    placeholder?: string;
    /** Width of the input in px. */
    width?: number;
    /** Read current value from editor state. */
    getValue: (state: import("prosemirror-state").EditorState) => string;
    /** Return a command that sets the new value. */
    onCommit: (value: string) => Command;
  };

  /**
   * Optional function that returns `true` when this item should appear "active".
   * Receives the current editor state.
   */
  isActive?: (state: import("prosemirror-state").EditorState) => boolean;

  /**
   * Optional function that returns `true` when this item is enabled.
   * Defaults to `true` if omitted.
   */
  isEnabled?: (state: import("prosemirror-state").EditorState) => boolean;
}

/** Sub-item inside a `"dropdown"` toolbar item. */
export interface ToolbarDropdownItem {
  key: string;
  label: string;
  icon?: string;
  command: Command;
  /** Returns `true` when this sub-item is the active choice. */
  isActive?: (state: import("prosemirror-state").EditorState) => boolean;
}

/**
 * Describes a context-menu item contributed by a block definition.
 */
export interface ContextMenuItem {
  /** Unique key within this block's context menu items. */
  key: string;

  /** Menu item label text. */
  label: string;

  /** Optional icon identifier. */
  icon?: string;

  /** ProseMirror command to execute. */
  command: Command;

  /**
   * Optional function that returns `true` when this item is enabled.
   * Defaults to `true` if omitted.
   */
  isEnabled?: (state: import("prosemirror-state").EditorState) => boolean;
}

/**
 * Factory signature for creating a NodeView.
 * The `editor` parameter is typed loosely here to avoid circular imports;
 * at runtime it is the `KanavaEditor` instance.
 */
export type NodeViewFactory = (
  node: PMNode,
  view: EditorView,
  getPos: () => number | undefined,
  editor: unknown,
) => NodeView;

/**
 * A variant entry for blocks that support multiple convertible sub-types.
 * For example, Heading defines variants for H1, H2, and H3.
 */
export interface ConvertibleVariant {
  /** Display label in the block-type dropdown / Turn into menu. */
  label: string;
  /** Icon string for UI display. */
  icon: string;
  /** Attrs to pass to `convertBlockType()` for this variant. */
  attrs: Record<string, any>;
  /**
   * Optional divider — if `true`, a visual separator is drawn after this entry
   * in menus that support it.
   */
  divider?: boolean;
}

/**
 * Describes everything about a block type:
 * its ProseMirror schema, optional NodeView, input rules, keymap,
 * commands, continuation behavior, and UI metadata.
 *
 * This is the primary extensibility primitive of Kanava.
 * Third-party developers call `defineBlock()` to register a custom block
 * that works seamlessly with the editor.
 */
export interface BlockDefinition {
  /* ── Identity ────────────────────────────────────────────── */

  /** Unique block name, e.g. `"paragraph"`, `"heading"`, `"myapp:kanban"`. */
  name: string;

  /* ── Schema ──────────────────────────────────────────────── */

  /**
   * Raw ProseMirror `NodeSpec`.
   * The `group` field defaults to `"blockBody"` if not provided.
   */
  spec: NodeSpec;

  /* ── Rendering (optional) ────────────────────────────────── */

  /**
   * Custom NodeView factory.
   * If omitted the default `toDOM` serialisation from `spec` is used.
   */
  nodeView?: NodeViewFactory;

  /* ── Behavior (optional) ─────────────────────────────────── */

  /** Input rules contributed by this block (merged into the global set). */
  inputRules?: (schema: Schema) => InputRule[];

  /** Keybindings contributed by this block (merged into the global keymap). */
  keymap?: (schema: Schema) => Record<string, Command>;

  /**
   * Named commands exposed by this block.
   * `editor.exec(editor.commands.setHeading(2))` etc.
   */
  commands?: (schema: Schema) => Record<string, (...args: any[]) => Command>;

  /* ── List / continuation behavior ────────────────────────── */

  /**
   * When `true`, pressing Enter at the end of this block creates
   * another block of the same type (like list items).
   */
  continuable?: boolean;

  /**
   * Given the previous node, return the attrs for the newly
   * created continuation block.  Defaults to `{}` if omitted.
   */
  continuationAttrs?: (prevNode: PMNode) => Attrs;

  /* ── UI metadata (used by React components, not core) ───── */

  /** Human-readable label shown in block pickers, e.g. `"Heading"`. */
  label?: string;

  /** Short icon string or emoji for UI, e.g. `"H"`, `"•"`. */
  icon?: string;

  /** Short description for block picker UI, e.g. `"Plain text paragraph"`. */
  description?: string;

  /**
   * Logical grouping for UI presentation:
   * `"text"`, `"list"`, `"media"`, `"layout"`, `"advanced"`.
   */
  group?: string;

  /* ── Toolbar / Context Menu (optional, data-driven UI) ──── */

  /**
   * Toolbar items to show when this block type is selected.
   * The React layer renders these in the FormatBar or BlockToolbar.
   */
  toolbar?: ToolbarItem[];

  /**
   * Context menu items contributed by this block type.
   * Appended to the default context menu when this block is right-clicked.
   */
  contextMenu?: ContextMenuItem[];

  /* ── Convertibility (optional) ──────────────────────────── */

  /**
   * Indicates this block can be a target for "Turn into" / block type conversion.
   * Only blocks with `content: "inline*"` are typically convertible.
   *
   * Set to `true` for simple blocks, or provide an array of variant entries
   * for blocks like Heading that have multiple sub-types (H1, H2, H3).
   *
   * When omitted, the block is NOT shown in the "Turn into" menu or
   * block-type dropdown.
   */
  convertible?: boolean | ConvertibleVariant[];

  /* ── Serialisation overrides (optional) ──────────────────── */

  /** Override `docToKanava` conversion for this block type. */
  toKanava?: (node: PMNode) => KanavaBlock;

  /** Override `kanavaToDoc` conversion for this block type. */
  fromKanava?: (block: KanavaBlock, schema: Schema) => PMNode;
}

const BLOCK_DEFAULTS: Partial<BlockDefinition> = {
  continuable: false,
};

/**
 * Create and freeze a `BlockDefinition`.
 * Validates required fields and applies sensible defaults.
 */
export function defineBlock(def: BlockDefinition): BlockDefinition {
  if (!def.name) {
    throw new Error("BlockDefinition requires a `name`.");
  }
  if (!def.spec) {
    throw new Error(`BlockDefinition "${def.name}" requires a \`spec\`.`);
  }

  // Ensure the spec group defaults to "blockBody"
  const spec: NodeSpec = {
    ...def.spec,
    group: def.spec.group ?? "blockBody",
  };

  return Object.freeze({
    ...BLOCK_DEFAULTS,
    ...def,
    spec,
  });
}
