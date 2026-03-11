import { Plugin, PluginKey, type EditorState } from "prosemirror-state";
import { NodeSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { Node as PMNode } from "prosemirror-model";
import type { BlockDefinition } from "../extensions/defineBlock.js";
import type { MarkDefinition } from "../extensions/defineMark.js";
import type { ToolbarItem, ContextMenuItem } from "../extensions/defineBlock.js";
import type { KanavaBlockStyle } from "../api/types.js";

/* ── Public types ──────────────────────────────────────────── */

/**
 * Computed toolbar state derived from the current editor selection.
 * This is a **data-only** representation — no DOM, no React.
 * The React layer subscribes to changes and renders accordingly.
 * @see packages/docs/architecture-toolbar.md
 */
export interface ToolbarState {
  /* ── Mark-level (text formatting) ────────────────────────── */

  /** Set of currently-active mark names at the cursor / selection. */
  activeMarks: Set<string>;

  /** All registered mark definitions (for building mark toolbar). */
  availableMarks: readonly MarkDefinition[];

  /**
   * Mark-level toolbar items (from MarkDefinition.toolbar).
   * These are always shown when text is selected.
   */
  markToolbarItems: readonly ToolbarItem[];

  /* ── Block-level ─────────────────────────────────────────── */

  /** The block-body type name at the current cursor, e.g. `"heading"`, `"image"`. `null` if unresolvable. */
  selectedBlockType: string | null;

  /** The ProseMirror node of the selected block body (for reading attrs). */
  selectedBlockNode: PMNode | null;

  /** The BlockDefinition for the selected block type, or `null`. */
  selectedBlockDef: BlockDefinition | null;

  /**
   * Block-specific toolbar items from the selected BlockDefinition.toolbar.
   * Empty when no block-specific toolbar is defined.
   */
  blockToolbarItems: readonly ToolbarItem[];

  /* ── Context menu ────────────────────────────────────────── */

  /**
   * Context menu items from the selected BlockDefinition.contextMenu.
   * These are appended to the default context menu.
   */
  contextMenuItems: readonly ContextMenuItem[];

  /* ── Selection metadata ──────────────────────────────────── */

  /** `true` if no text is selected (cursor is collapsed). */
  selectionEmpty: boolean;

  /** `true` if the selection is a NodeSelection (e.g. an atom block like image). */
  isNodeSelection: boolean;

  /** Block-level formatting style attrs of the current block, or `null` if unresolvable. */
  blockStyle: KanavaBlockStyle | null;

  /** Active font size from a `fontSize` mark at cursor, e.g. `"14"`. `null` = default/inherited. */
  activeFontSize: string | null;

  /** Active font family from a `fontFamily` mark at cursor, e.g. `"Georgia"`. `null` = default/inherited. */
  activeFontFamily: string | null;
}

/* ── Plugin key ────────────────────────────────────────────── */

export const toolbarStateKey = new PluginKey<ToolbarStateData>("toolbarState");

/** Internal plugin state (mutable between updates). */
interface ToolbarStateData {
  state: ToolbarState;
  /** Listeners that are notified whenever toolbar state changes. */
  listeners: Set<() => void>;
  /** Previous state reference, used to skip redundant listener notifications. */
  prevState: ToolbarState | null;
}

/* ── Helpers ───────────────────────────────────────────────── */

/** Build a map from block name → BlockDefinition for fast lookup. */
function buildBlockDefMap(defs: readonly BlockDefinition[]): Map<string, BlockDefinition> {
  const map = new Map<string, BlockDefinition>();
  for (const d of defs) {
    map.set(d.name, d);
  }
  return map;
}

/** Derive ToolbarState from the current EditorState. */
function deriveToolbarState(
  editorState: EditorState,
  blockDefMap: Map<string, BlockDefinition>,
  markDefs: readonly MarkDefinition[],
): ToolbarState {
  const { selection } = editorState;
  const { $from, empty } = selection;

  // ── Active marks ───────────────────────────────────────────
  const storedMarks = editorState.storedMarks || $from.marks();
  const activeMarks = new Set<string>(storedMarks.map((m) => m.type.name));

  // Also check for marks across a non-empty text selection
  if (!empty) {
    editorState.doc.nodesBetween(selection.from, selection.to, (node) => {
      for (const mark of node.marks) {
        activeMarks.add(mark.type.name);
      }
    });
  }

  // ── Mark toolbar items ────────────────────────────────────
  const markToolbarItems: ToolbarItem[] = [];
  for (const md of markDefs) {
    if (md.toolbar) {
      markToolbarItems.push(...md.toolbar);
    }
  }

  // ── Selected block info ───────────────────────────────────
  let selectedBlockType: string | null = null;
  let selectedBlockNode: PMNode | null = null;
  let selectedBlockDef: BlockDefinition | null = null;
  const isNodeSelection = selection instanceof NodeSelection;

  if (isNodeSelection) {
    const node = (selection as NodeSelection).node;
    if (node.type.spec.group?.includes("blockBody")) {
      // NodeSelection on a blockBody atom (e.g. image click)
      selectedBlockType = node.type.name;
      selectedBlockNode = node;
    } else if (node.type.name === "blockNode") {
      // NodeSelection on the blockNode wrapper (e.g. drag handle).
      // The actual block body is the first child.
      const bodyChild = node.firstChild;
      if (bodyChild && bodyChild.type.spec.group?.includes("blockBody")) {
        selectedBlockType = bodyChild.type.name;
        selectedBlockNode = bodyChild;
      }
    }
  }

  if (!selectedBlockType) {
    // Walk up from cursor to find the enclosing blockBody
    for (let d = $from.depth; d >= 0; d--) {
      const node = $from.node(d);
      if (node.type.spec.group?.includes("blockBody")) {
        selectedBlockType = node.type.name;
        selectedBlockNode = node;
        break;
      }
    }
  }

  if (selectedBlockType) {
    selectedBlockDef = blockDefMap.get(selectedBlockType) ?? null;
  }

  // ── Block toolbar items ───────────────────────────────────
  const blockToolbarItems: readonly ToolbarItem[] = selectedBlockDef?.toolbar ?? [];

  // ── Context menu items ────────────────────────────────────
  const contextMenuItems: readonly ContextMenuItem[] = selectedBlockDef?.contextMenu ?? [];

  // ── Block style (from enclosing blockNode wrapper) ────────
  let blockStyle: KanavaBlockStyle | null = null;
  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d);
    if (node.type.name === "blockNode") {
      const a = node.attrs;
      const s: KanavaBlockStyle = {};
      if (a.textAlign && a.textAlign !== "left") s.textAlign = a.textAlign;
      if (a.backgroundColor) s.backgroundColor = a.backgroundColor;
      if (a.spacingTop > 0) s.spacingTop = a.spacingTop;
      if (a.spacingBottom > 0) s.spacingBottom = a.spacingBottom;
      if (a.lineHeight != null) s.lineHeight = a.lineHeight;
      if (a.paddingTop > 0) s.paddingTop = a.paddingTop;
      if (a.paddingBottom > 0) s.paddingBottom = a.paddingBottom;
      if (a.paddingLeft > 0) s.paddingLeft = a.paddingLeft;
      if (a.paddingRight > 0) s.paddingRight = a.paddingRight;
      if (a.borderColor) s.borderColor = a.borderColor;
      if (a.borderWidth > 0) s.borderWidth = a.borderWidth;
      if (a.borderStyle && a.borderStyle !== "solid") s.borderStyle = a.borderStyle;
      if (a.borderRadius > 0) s.borderRadius = a.borderRadius;
      if (a.textIndent > 0) s.textIndent = a.textIndent;
      if (a.letterSpacing > 0) s.letterSpacing = a.letterSpacing;
      if (a.pageBreakBefore) s.pageBreakBefore = a.pageBreakBefore;
      if (a.keepWithNext) s.keepWithNext = a.keepWithNext;
      if (a.keepLinesTogether) s.keepLinesTogether = a.keepLinesTogether;
      if (a.widowOrphan !== undefined && a.widowOrphan !== 2) s.widowOrphan = a.widowOrphan;
      blockStyle = s;
      break;
    }
  }

  // ── Active font size / family from marks ─────────────────
  let activeFontSize: string | null = null;
  let activeFontFamily: string | null = null;
  const cursorMarks = editorState.storedMarks || $from.marks();
  for (const mark of cursorMarks) {
    if (mark.type.name === "fontSize" && mark.attrs.size) activeFontSize = String(mark.attrs.size);
    if (mark.type.name === "fontFamily" && mark.attrs.family) activeFontFamily = String(mark.attrs.family);
  }
  if (!editorState.storedMarks && !empty && (activeFontSize === null || activeFontFamily === null)) {
    editorState.doc.nodesBetween(selection.from, selection.to, (node) => {
      for (const mark of node.marks) {
        if (activeFontSize === null && mark.type.name === "fontSize") activeFontSize = String(mark.attrs.size);
        if (activeFontFamily === null && mark.type.name === "fontFamily") activeFontFamily = String(mark.attrs.family);
      }
    });
  }

  return {
    activeMarks,
    availableMarks: markDefs,
    markToolbarItems,
    selectedBlockType,
    selectedBlockNode,
    selectedBlockDef,
    blockToolbarItems,
    contextMenuItems,
    selectionEmpty: empty,
    isNodeSelection,
    blockStyle,
    activeFontSize,
    activeFontFamily,
  };
}

/* ── Shallow equality check ─────────────────────────────── */

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function blockStylesEqual(
  a: KanavaBlockStyle | null,
  b: KanavaBlockStyle | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a) as (keyof KanavaBlockStyle)[];
  const keysB = Object.keys(b) as (keyof KanavaBlockStyle)[];
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

function toolbarStatesEqual(a: ToolbarState, b: ToolbarState): boolean {
  return (
    a.selectedBlockType === b.selectedBlockType &&
    a.selectionEmpty === b.selectionEmpty &&
    a.isNodeSelection === b.isNodeSelection &&
    a.activeFontSize === b.activeFontSize &&
    a.activeFontFamily === b.activeFontFamily &&
    a.selectedBlockNode === b.selectedBlockNode &&
    setsEqual(a.activeMarks, b.activeMarks) &&
    blockStylesEqual(a.blockStyle, b.blockStyle)
  );
}

/* ── Plugin factory ────────────────────────────────────────── */

/**
 * Creates the ToolbarState ProseMirror plugin.
 *
 * The plugin computes a `ToolbarState` on every transaction
 * and notifies registered listeners when it changes.
 * This is the headless core of the toolbar system — no DOM, no React.
 *
 * @param blockDefs All registered block definitions.
 * @param markDefs  All registered mark definitions.
 */
export function toolbarStatePlugin(
  blockDefs: readonly BlockDefinition[],
  markDefs: readonly MarkDefinition[],
): Plugin {
  const blockDefMap = buildBlockDefMap(blockDefs);

  return new Plugin<ToolbarStateData>({
    key: toolbarStateKey,

    state: {
      init(_config, editorState) {
        const initial = deriveToolbarState(editorState, blockDefMap, markDefs);
        return {
          state: initial,
          listeners: new Set(),
          prevState: null,
        };
      },

      apply(_tr, pluginState, _oldEditorState, newEditorState) {
        const newToolbarState = deriveToolbarState(newEditorState, blockDefMap, markDefs);
        // Only update the reference if something actually changed.
        // useSyncExternalStore uses Object.is() to compare snapshots,
        // so keeping the same reference prevents unnecessary re-renders.
        if (!toolbarStatesEqual(pluginState.state, newToolbarState)) {
          pluginState.state = newToolbarState;
        }
        return pluginState;
      },
    },

    view() {
      return {
        update(view: EditorView) {
          const data = toolbarStateKey.getState(view.state);
          if (!data) return;
          // Only notify listeners when the state reference actually changed.
          if (data.state !== data.prevState) {
            data.prevState = data.state;
            for (const listener of data.listeners) {
              listener();
            }
          }
        },
      };
    },
  });
}

/* ── Public accessor helpers ───────────────────────────────── */

/**
 * Read the current `ToolbarState` from an EditorState.
 * Returns `null` if the plugin isn't installed.
 */
export function getToolbarState(editorState: EditorState): ToolbarState | null {
  const data = toolbarStateKey.getState(editorState);
  return data?.state ?? null;
}

/**
 * Subscribe to toolbar state changes.
 * Returns an unsubscribe function.
 *
 * @param editorState The current EditorState (must have the plugin installed).
 * @param listener    Callback invoked after every view update.
 */
export function subscribeToolbarState(
  editorState: EditorState,
  listener: () => void,
): () => void {
  const data = toolbarStateKey.getState(editorState);
  if (!data) {
    console.warn("toolbarStatePlugin is not installed — subscribeToolbarState is a no-op.");
    return () => {};
  }
  data.listeners.add(listener);
  return () => {
    data.listeners.delete(listener);
  };
}
