import type { Node as PMNode, Attrs } from "prosemirror-model";
import type { EditorView, NodeView as PMNodeView } from "prosemirror-view";

/**
 * Result returned by the `render()` method.
 */
export interface RenderResult {
  /** The root DOM element of the NodeView. */
  dom: HTMLElement;
  /**
   * The element ProseMirror should manage content inside.
   * If `undefined` or `null`, the node is treated as atom (no editable content).
   */
  contentDOM?: HTMLElement | null;
}

/**
 * Base class for all Kanava NodeViews.
 *
 * Eliminates boilerplate that every NodeView repeats:
 * - Storing `node`, `view`, `getPos`, `editor`
 * - `dom` / `contentDOM` assignment
 * - Default `update()` that type-checks and delegates to `onUpdate()`
 * - Default `ignoreMutation()` that ignores mutations outside `contentDOM`
 * - Default `stopEvent()` that lets all events through
 * - Helper `setAttrs()` for committing attribute changes
 *
 * Subclasses only need to implement `render()` and optionally
 * override `onUpdate()`, `stopEvent()`, `ignoreMutation()`, and `destroy()`.
 *
 * @example
 * ```ts
 * export class MyBlockView extends KanavaNodeView {
 *   render(node: PMNode) {
 *     const dom = document.createElement("div");
 *     dom.className = "my-block";
 *     const contentDOM = document.createElement("p");
 *     dom.appendChild(contentDOM);
 *     return { dom, contentDOM };
 *   }
 * }
 * ```
 */
export abstract class KanavaNodeView implements PMNodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement | null;

  protected node: PMNode;
  protected view: EditorView;
  protected getPos: () => number | undefined;

  /**
   * The editor instance (typed loosely to avoid circular imports).
   * At runtime this is a `KanavaEditor`.
   */
  protected editor: unknown;

  constructor(
    node: PMNode,
    view: EditorView,
    getPos: () => number | undefined,
    editor?: unknown,
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.editor = editor ?? null;

    const { dom, contentDOM } = this.render(node);
    this.dom = dom;
    this.contentDOM = contentDOM ?? null;
  }

  /* ── Abstract ──────────────────────────────────────────── */

  /**
   * Build the DOM for this NodeView.
   * Called once during construction.
   */
  abstract render(node: PMNode): RenderResult;

  /* ── Default lifecycle ─────────────────────────────────── */

  /**
   * Default update: accepts the node if the type matches,
   * stores the new node, and calls `onUpdate()`.
   */
  update(node: PMNode): boolean {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.onUpdate(node);
    return true;
  }

  /**
   * Hook called after `update()` accepts a new node.
   * Override to sync DOM attributes with the new node.
   */
  protected onUpdate(_node: PMNode): void {}

  /**
   * Default: ignore mutations outside `contentDOM`.
   * Atom nodes (no contentDOM) ignore everything.
   */
  ignoreMutation(mutation: MutationRecord | { type: string; target: Node }): boolean {
    if (mutation.type === "selection") return true;
    if (!this.contentDOM) return true;
    return !this.contentDOM.contains(mutation.target as Node);
  }

  /**
   * Default: let all events through to ProseMirror.
   */
  stopEvent(_event: Event): boolean {
    return false;
  }

  /**
   * Cleanup hook. Override to disconnect observers, remove listeners, etc.
   */
  destroy(): void {}

  /* ── Helpers ───────────────────────────────────────────── */

  /**
   * Commit attribute changes to ProseMirror.
   *
   * ```ts
   * this.setAttrs({ language: "typescript" });
   * ```
   */
  protected setAttrs(attrs: Partial<Attrs>): void {
    const pos = this.getPos();
    if (pos == null) return;
    const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
      ...this.node.attrs,
      ...attrs,
    });
    this.view.dispatch(tr);
  }

  /**
   * Create a DOM element with optional className.
   */
  protected el(tag: string, className?: string): HTMLElement {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
  }
}
