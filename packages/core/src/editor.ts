import { EditorState, Plugin, Transaction, type Command } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history } from "prosemirror-history";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import type { Schema } from "prosemirror-model";
import { DENSITY_PRESETS, createEmptyDoc, CommandChain } from "./editorHelpers.js";
import { defaultSchema } from "./schema/schema.js";
import { buildSchema } from "./extensions/schemaBuilder.js";
import { builtInBlocks } from "./blocks/index.js";
import { builtInMarks } from "./marks/index.js";
import type { BlockDefinition } from "./extensions/defineBlock.js";
import type { MarkDefinition } from "./extensions/defineMark.js";
import { blockIdPlugin } from "./plugins/blockId.js";
import { placeholderPlugin } from "./plugins/placeholder.js";
import { kanavaKeymap } from "./plugins/keymap.js";
import { kanavaInputRules } from "./plugins/inputRules.js";
import { dragHandlePlugin } from "./plugins/dragHandle.js";
import { selectionPlugin } from "./plugins/selection.js";
import { clipboardPlugin } from "./plugins/clipboard.js";
import { imageUploadPlugin } from "./plugins/imageUpload.js";
import { toolbarStatePlugin } from "./plugins/toolbarState.js";
import { listRenumberPlugin } from "./plugins/listRenumber.js";
import { ghostRailPlugin } from "./plugins/ghostRail.js";
import { interactionModePlugin } from "./plugins/interactionMode.js";
import { documentStructurePlugin, documentStructureKey } from "./plugins/documentStructure.js";
import { blockMultiSelectionPlugin } from "./plugins/blockMultiSelection.js";
import { findReplacePlugin } from "./plugins/findReplace.js";
import { linkClickPlugin } from "./plugins/linkClick.js";
import { paginationPlugin, getPaginationState } from "./plugins/pagination.js";
import type { PaginationConfig, PaginationState } from "./api/pagination.js";
import { resolvePageDimensions, PageSizePresets } from "./api/pagination.js";
import { BlockNodeView } from "./nodeViews/BlockNodeView.js";
import { ColumnLayoutView, ColumnView } from "./nodeViews/ColumnLayoutView.js";
import { ImageNodeView } from "./nodeViews/ImageNodeView.js";
import { CodeBlockView } from "./nodeViews/CodeBlockView.js";
import { ToggleNodeView } from "./nodeViews/ToggleNodeView.js";
import { CalloutNodeView } from "./nodeViews/CalloutNodeView.js";
import { docToKanava, kanavaToDoc } from "./api/blockTree.js";
import { getSelectionInfo } from "./api/operations.js";
import { KanavaEventEmitter } from "./api/events.js";
import type { KanavaEventMap } from "./api/events.js";
import type {
  KanavaEditorOptions,
  KanavaEditorAPI,
  KanavaDocument,
  KanavaSelectionInfo,
  DocumentStyle,
  DocumentStructureNode,
} from "./api/types.js";

/* DENSITY_PRESETS and createEmptyDoc — see editorHelpers.ts */

/**
 * The main Kanava editor class.
 */
export class KanavaEditor implements KanavaEditorAPI {
  private view: EditorView;
  private events: KanavaEventEmitter;
  private _editable: boolean;
  private _schema: Schema;
  private _blockDefs: BlockDefinition[];
  private _markDefs: MarkDefinition[];
  private _options: KanavaEditorOptions;
  private _documentStyle: DocumentStyle;
  private _paginationConfig: PaginationConfig | null;
  private _zoom: number = 1;

  constructor(options: KanavaEditorOptions) {
    this.events = new KanavaEventEmitter();
    this._editable = options.editable ?? true;
    this._options = options;
    this._documentStyle = options.documentStyle ?? {};
    this._paginationConfig = this._resolvePaginationConfig(options);

    // Get extension definitions (use built-ins if not provided)
    this._blockDefs = options.blocks ?? builtInBlocks;
    this._markDefs = options.marks ?? builtInMarks;

    // Build schema from extensions
    this._schema = buildSchema(this._blockDefs, this._markDefs);

    // Build initial document
    let doc;
    if (options.content) {
      try {
        doc = kanavaToDoc(options.content, this._schema);
      } catch {
        doc = createEmptyDoc(this._schema);
      }
    } else {
      doc = createEmptyDoc(this._schema);
    }

    // Collect nodeViews from block definitions
    const nodeViews: Record<string, any> = {
      // Structural nodeViews (always present)
      blockNode: (node: any, view: any, getPos: any) =>
        new BlockNodeView(node, view, getPos as () => number | undefined),
      column: (node: any, view: any, getPos: any) =>
        new ColumnView(node, view, getPos as () => number | undefined),
      columnLayout: (node: any, view: any, getPos: any) =>
        new ColumnLayoutView(node, view, getPos as () => number | undefined),
      // Block-body nodeViews for enhanced rendering
      image: (node: any, view: any, getPos: any) =>
        new ImageNodeView(node, view, getPos as () => number | undefined, this),
      codeBlock: (node: any, view: any, getPos: any) =>
        new CodeBlockView(node, view, getPos as () => number | undefined),
      toggle: (node: any, view: any, getPos: any) =>
        new ToggleNodeView(node, view, getPos as () => number | undefined),
      callout: (node: any, view: any, getPos: any) =>
        new CalloutNodeView(node, view, getPos as () => number | undefined),
    };

    // Add nodeViews from block definitions
    for (const block of this._blockDefs) {
      if (block.nodeView) {
        nodeViews[block.name] = block.nodeView;
      }
    }

    // Create editor state
    const state = EditorState.create({
      doc,
      schema: this._schema,
      plugins: [
        kanavaInputRules(this._schema),
        kanavaKeymap(this._schema),
        blockIdPlugin(),
        listRenumberPlugin(),
        placeholderPlugin(options.placeholder),
        dragHandlePlugin(),
        selectionPlugin(),
        blockMultiSelectionPlugin(),
        ...(options.canvasMode ? [] : [ghostRailPlugin()]),
        documentStructurePlugin(),
        clipboardPlugin(this._schema),
        imageUploadPlugin(options.onImageUpload),
        toolbarStatePlugin(this._blockDefs, this._markDefs),
        ...(this._buildPaginationPlugins(options)),
        ...(options.canvasMode ? [interactionModePlugin()] : []),
        findReplacePlugin(),
        linkClickPlugin(),
        history(),
        dropCursor(),
        gapCursor(),
      ],
    });

    // Create editor view
    this.view = new EditorView(options.element, {
      state,
      editable: () => this._editable,
      nodeViews,
      dispatchTransaction: (tr) => {
        const newState = this.view.state.apply(tr);
        this.view.updateState(newState);

        if (tr.docChanged) {
          const doc = docToKanava(newState.doc);
          this.events.emit("change", doc);
          options.onChange?.(doc);
        }

        if (tr.selectionSet || tr.docChanged) {
          const info = getSelectionInfo(newState);
          this.events.emit("selectionChange", info);
          options.onSelectionChange?.(info);
        }
      },
      handleDOMEvents: {
        focus: () => {
          this.events.emit("focus", undefined);
          return false;
        },
        blur: () => {
          this.events.emit("blur", undefined);
          return false;
        },
      },
      attributes: {
        class: `kanava-editor ${options.mode === "paginated" ? "kanava-paginated" : "kanava-pageless"} kanava-layout-${options.layoutMode ?? "standard"}`,
        "data-kanava": "true",
      },
    });

    // Add paginated layout styles if needed
    if (options.mode === "paginated") {
      const el = options.element;
      const paginationConfig = this._resolvePaginationConfig(options);
      if (paginationConfig) {
        const dims = resolvePageDimensions(paginationConfig);
        el.style.setProperty("--kanava-page-width", `${dims.width}px`);
        el.style.setProperty("--kanava-page-height", `${dims.height}px`);
        el.style.setProperty("--kanava-page-margin-top", `${dims.margins.top}px`);
        el.style.setProperty("--kanava-page-margin-right", `${dims.margins.right}px`);
        el.style.setProperty("--kanava-page-margin-bottom", `${dims.margins.bottom}px`);
        el.style.setProperty("--kanava-page-margin-left", `${dims.margins.left}px`);
      } else if (options.pageSize) {
        // Legacy fallback: just pageSize without full pagination config
        el.style.setProperty("--kanava-page-width", `${options.pageSize.width}px`);
        el.style.setProperty("--kanava-page-height", `${options.pageSize.height}px`);
      }
    }

    // Apply document-level styling (CSS custom properties)
    this._applyDocumentStyle(options.element, this._documentStyle);
  }

  /**
   * Subscribe to editor events.
   */
  on<K extends keyof KanavaEventMap>(
    event: K,
    handler: (data: KanavaEventMap[K]) => void
  ): () => void {
    return this.events.on(event as any, handler as any);
  }

  /**
   * Emit an editor event.
   */
  emit<K extends keyof KanavaEventMap>(
    event: K,
    data: KanavaEventMap[K]
  ): void {
    this.events.emit(event as any, data);
  }

  /**
   * Get the current document as a `KanavaDocument` JSON tree.
   * This is the primary serialization method for saving editor content.
   *
   * @returns The document in Kanava's portable JSON format.
   */
  getDocument(): KanavaDocument {
    return docToKanava(this.view.state.doc);
  }

  /**
   * Replace the editor content with a new `KanavaDocument`.
   * Unknown block/mark types will cause a TypeError (fail-fast).
   *
   * @param doc - The document to load.
   */
  setDocument(doc: KanavaDocument): void {
    const pmDoc = kanavaToDoc(doc, this._schema);
    const newState = EditorState.create({
      doc: pmDoc,
      plugins: this.view.state.plugins,
    });
    this.view.updateState(newState);
  }

  /**
   * Get the raw ProseMirror document JSON (for debugging).
   * Prefer `getDocument()` for serialization.
   */
  getRawJSON(): Record<string, any> {
    return this.view.state.doc.toJSON();
  }

  /** Focus the editor. */
  focus(): void {
    this.view.focus();
  }

  /** Remove focus from the editor. */
  blur(): void {
    (this.view.dom as HTMLElement).blur();
  }

  /**
   * Destroy the editor instance and clean up all event listeners.
   * Call this when unmounting the editor from the DOM.
   */
  destroy(): void {
    this.events.removeAllListeners();
    this.view.destroy();
  }

  /** Returns `true` if the editor is currently editable. */
  isEditable(): boolean {
    return this._editable;
  }

  /**
   * Toggle the editor's editable state.
   * @param editable - `true` to allow editing, `false` for read-only.
   */
  setEditable(editable: boolean): void {
    this._editable = editable;
    // Force view to re-check editable
    this.view.setProps({ editable: () => this._editable });
  }

  /* ── Zoom ─────────────────────────────────────────── */

  /** Minimum zoom level (0.25 = 25%). */
  static readonly ZOOM_MIN = 0.25;
  /** Maximum zoom level (3 = 300%). */
  static readonly ZOOM_MAX = 3;
  /** Default zoom step for zoomIn/zoomOut (0.1 = 10%). */
  static readonly ZOOM_STEP = 0.1;

  /** Get the current zoom level (1 = 100%). */
  getZoom(): number {
    return this._zoom;
  }

  /** Set zoom level. Clamped to [ZOOM_MIN, ZOOM_MAX]. */
  setZoom(level: number): void {
    const clamped = Math.round(
      Math.min(KanavaEditor.ZOOM_MAX, Math.max(KanavaEditor.ZOOM_MIN, level)) * 100,
    ) / 100;
    if (clamped === this._zoom) return;
    this._zoom = clamped;
    this._applyZoom();
    this.events.emit("zoomChange", clamped);
  }

  /** Increase zoom by one step. */
  zoomIn(): void {
    this.setZoom(this._zoom + KanavaEditor.ZOOM_STEP);
  }

  /** Decrease zoom by one step. */
  zoomOut(): void {
    this.setZoom(this._zoom - KanavaEditor.ZOOM_STEP);
  }

  /** Reset zoom to 100%. */
  resetZoom(): void {
    this.setZoom(1);
  }

  /** Apply the current zoom level to the editor element via CSS. */
  private _applyZoom(): void {
    const el = this._options.element;
    if (this._zoom === 1) {
      el.style.removeProperty("zoom");
    } else {
      el.style.zoom = String(this._zoom);
    }
  }

  /**
   * Get the underlying ProseMirror EditorView (escape hatch).
   */
  get pmView(): EditorView {
    return this.view;
  }

  /**
   * Get the underlying ProseMirror EditorState.
   */
  get pmState() {
    return this.view.state;
  }

  /**
   * Get the editor's schema.
   */
  get schema(): Schema {
    return this._schema;
  }

  /**
   * Get the block definitions used by this editor.
   */
  get blockDefs(): readonly BlockDefinition[] {
    return this._blockDefs;
  }

  /**
   * Get the mark definitions used by this editor.
   */
  get markDefs(): readonly MarkDefinition[] {
    return this._markDefs;
  }

  /**
   * Get the editor options (for plugins that need config like onImageUpload).
   */
  get options(): Readonly<KanavaEditorOptions> {
    return this._options;
  }

  /**
   * Get the current pagination state.
   * Returns null if the editor is not in paginated mode.
   */
  get pagination(): PaginationState | null {
    return getPaginationState(this.view.state);
  }

  /** @internal Resolve pagination config from options. */
  private _resolvePaginationConfig(
    options: KanavaEditorOptions,
  ): PaginationConfig | null {
    if (options.pagination) return options.pagination;
    if (options.pageSize) {
      return { pageSize: options.pageSize };
    }
    // Default to Letter if mode is paginated but no size specified
    if (options.mode === "paginated") {
      return { pageSize: "Letter" };
    }
    return null;
  }

  /** @internal Build pagination plugins (empty array if not paginated). */
  private _buildPaginationPlugins(
    options: KanavaEditorOptions,
  ): Plugin[] {
    const config = this._resolvePaginationConfig(options);
    if (!config) return [];
    return [paginationPlugin(config)];
  }

  /**
   * Update the document-level styling at runtime.
   * Merges the provided values with the current style.
   *
   * @param style - Partial DocumentStyle to merge. Density preset is resolved first,
   *                then explicit values override.
   *
   * @example
   * editor.setDocumentStyle({ density: "tight" });
   * editor.setDocumentStyle({ lineHeight: 1.3, paragraphGap: 6 });
   */
  setDocumentStyle(style: Partial<DocumentStyle>): void {
    this._documentStyle = { ...this._documentStyle, ...style };
    this._applyDocumentStyle(this._options.element, this._documentStyle);
  }

  /**
   * Get the current resolved document style.
   * Returns the merged result of density preset + explicit overrides.
   */
  getDocumentStyle(): DocumentStyle {
    return { ...this._documentStyle };
  }

  /**
   * Update pagination configuration at runtime.
   * Changes margins and/or page size without remounting the editor.
   * Undo history and selection state are preserved.
   */
  setPaginationConfig(config: Partial<PaginationConfig>): void {
    if (!this._paginationConfig) return;

    this._paginationConfig = { ...this._paginationConfig, ...config };
    const dims = resolvePageDimensions(this._paginationConfig);

    // Update CSS custom properties
    const el = this._options.element;
    el.style.setProperty("--kanava-page-width", `${dims.width}px`);
    el.style.setProperty("--kanava-page-height", `${dims.height}px`);
    el.style.setProperty("--kanava-page-margin-top", `${dims.margins.top}px`);
    el.style.setProperty("--kanava-page-margin-right", `${dims.margins.right}px`);
    el.style.setProperty("--kanava-page-margin-bottom", `${dims.margins.bottom}px`);
    el.style.setProperty("--kanava-page-margin-left", `${dims.margins.left}px`);

    // Notify the pagination plugin to recalculate page breaks
    const tr = this.view.state.tr.setMeta("paginationConfigChanged", this._paginationConfig);
    tr.setMeta("addToHistory", false);
    this.view.dispatch(tr);
  }

  /**
   * Get the document structure as a flat array of block nodes.
   * Useful for building document outlines or tree navigation.
   */
  getDocumentStructure(): DocumentStructureNode[] {
    const pluginState = documentStructureKey.getState(this.view.state);
    return pluginState ? pluginState.nodes : [];
  }

  /**
   * @internal Apply DocumentStyle as CSS custom properties on the editor root.
   */
  private _applyDocumentStyle(el: HTMLElement, style: DocumentStyle): void {
    // Start from density preset if specified
    const base: Partial<{ lineHeight: number; paragraphGap: number; fontSize: number }> =
      style.density ? { ...DENSITY_PRESETS[style.density] } : {};

    // Explicit values override density preset
    const resolved = {
      lineHeight: style.lineHeight ?? base.lineHeight,
      paragraphGap: style.paragraphGap ?? base.paragraphGap,
      fontSize: style.fontSize ?? base.fontSize,
      fontFamily: style.fontFamily,
    };

    // Apply CSS custom properties (only set if value is defined)
    if (resolved.lineHeight !== undefined) {
      el.style.setProperty("--kanava-line-height", String(resolved.lineHeight));
    }
    if (resolved.paragraphGap !== undefined) {
      el.style.setProperty("--kanava-paragraph-gap", `${resolved.paragraphGap}px`);
    }
    if (resolved.fontSize !== undefined) {
      el.style.setProperty("--kanava-font-size", `${resolved.fontSize}px`);
    }
    if (resolved.fontFamily !== undefined) {
      el.style.setProperty("--kanava-font-family", resolved.fontFamily);
    }
  }

  /**
   * Execute a ProseMirror command immediately.
   * Returns true if the command executed successfully.
   *
   * @example
   * editor.exec(toggleBold);
   * editor.exec((state, dispatch) => { ... });
   */
  exec(command: Command): boolean {
    return command(this.view.state, this.view.dispatch);
  }

  /**
   * Start a command chain for batching multiple commands.
   * Commands are applied sequentially to accumulating state.
   * Call `.run()` to dispatch the final transaction.
   *
   * @example
   * editor.chain()
   *   .command(toggleBold)
   *   .command(toggleItalic)
   *   .run();
   */
  chain(): CommandChain {
    return new CommandChain(this.view);
  }
}

/* CommandChain — see editorHelpers.ts */
export { CommandChain } from "./editorHelpers.js";
