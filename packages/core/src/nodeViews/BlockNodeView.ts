import type { Node as PMNode } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";
import { KanavaNodeView, type RenderResult } from "./KanavaNodeView.js";

/**
 * NodeView for blockNode — renders a wrapper div with a hover drag handle
 * (3-dot vertical grip) that floats at the top-left edge of each block,
 * overlapping content. Zero reserved padding.
 */
export class BlockNodeView extends KanavaNodeView {
  private handle!: HTMLElement;
  private railHandle!: HTMLElement;

  render(node: PMNode): RenderResult {
    // Outer wrapper
    const dom = this.el("div", "kanava-block");
    dom.setAttribute("data-block-id", node.attrs.id || "");
    this.applyBlockStyles(dom, node);

    // Hover drag handle — 3-dot vertical grip, floats at top-left edge
    this.handle = document.createElement("button");
    this.handle.className = "kanava-drag-handle";
    this.handle.contentEditable = "false";
    this.handle.setAttribute("draggable", "true");
    this.handle.setAttribute("tabindex", "-1");
    this.handle.setAttribute("aria-label", "Drag to move block");
    this.handle.innerHTML = `<svg width="6" height="14" viewBox="0 0 6 14" fill="currentColor"><circle cx="3" cy="2" r="1.5"/><circle cx="3" cy="7" r="1.5"/><circle cx="3" cy="12" r="1.5"/></svg>`;

    // On mousedown, select the entire blockNode so ProseMirror knows
    // what to drag. Do NOT preventDefault — the browser needs the
    // default mousedown behaviour to later fire dragstart on
    // the draggable handle element.
    this.handle.addEventListener("mousedown", (e) => {
      e.stopPropagation(); // keep PM from repositioning the cursor
      const pos = this.getPos();
      if (pos !== undefined) {
        const tr = this.view.state.tr.setSelection(
          NodeSelection.create(this.view.state.doc, pos)
        );
        this.view.dispatch(tr);
        this.view.focus();
      }
    });

    // Content area — ProseMirror renders blockBody + blockGroup here
    const contentDOM = this.el("div", "kanava-block-content");

    // Ghost Rail handle — hidden by default, shown by ghostRail plugin
    // when the kanava-ghost-rail-active class is present via Decoration.node.
    // Draggable so users can drag-move blocks from any ancestor's rail handle.
    this.railHandle = document.createElement("div");
    this.railHandle.className = "kanava-rail-handle";
    this.railHandle.contentEditable = "false";
    this.railHandle.setAttribute("draggable", "true");
    this.railHandle.title = "Select block";

    // On mousedown, select this entire blockNode so ProseMirror knows
    // what to drag. Do NOT preventDefault — the browser needs the
    // default mousedown behaviour to later fire dragstart.
    this.railHandle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      const pos = this.getPos();
      if (pos !== undefined) {
        const tr = this.view.state.tr.setSelection(
          NodeSelection.create(this.view.state.doc, pos)
        );
        this.view.dispatch(tr);
        this.view.focus();
      }
    });

    dom.appendChild(this.handle);
    dom.appendChild(this.railHandle);
    dom.appendChild(contentDOM);

    return { dom, contentDOM };
  }

  protected onUpdate(node: PMNode): void {
    this.dom.setAttribute("data-block-id", node.attrs.id || "");
    this.applyBlockStyles(this.dom, node);
  }

  /**
   * Apply block-level style attrs as inline styles on the wrapper DOM element.
   */
  private applyBlockStyles(dom: HTMLElement, node: PMNode): void {
    const a = node.attrs;

    // Text alignment
    dom.style.textAlign = a.textAlign && a.textAlign !== "left" ? a.textAlign : "";

    // Background color
    dom.style.backgroundColor = a.backgroundColor || "";
    dom.classList.toggle("kanava-block--has-bg", !!a.backgroundColor);

    // Spacing (top/bottom margins)
    dom.style.marginTop = a.spacingTop && a.spacingTop > 0 ? `${a.spacingTop}px` : "";
    dom.style.marginBottom = a.spacingBottom && a.spacingBottom > 0 ? `${a.spacingBottom}px` : "";

    // Line height
    dom.style.lineHeight = a.lineHeight != null ? String(a.lineHeight) : "";

    // Padding
    dom.style.paddingTop = a.paddingTop > 0 ? `${a.paddingTop}px` : "";
    dom.style.paddingBottom = a.paddingBottom > 0 ? `${a.paddingBottom}px` : "";
    dom.style.paddingLeft = a.paddingLeft > 0 ? `${a.paddingLeft}px` : "";
    dom.style.paddingRight = a.paddingRight > 0 ? `${a.paddingRight}px` : "";

    // Text indent & letter spacing
    dom.style.textIndent = a.textIndent > 0 ? `${a.textIndent}px` : "";
    dom.style.letterSpacing = a.letterSpacing > 0 ? `${a.letterSpacing}px` : "";

    // Border
    if (a.borderWidth > 0 && a.borderColor) {
      dom.style.border = `${a.borderWidth}px ${a.borderStyle} ${a.borderColor}`;
      dom.style.borderRadius = a.borderRadius > 0 ? `${a.borderRadius}px` : "";
    } else {
      dom.style.border = "";
      dom.style.borderRadius = "";
    }

    // Pagination data attrs (read by pagination plugin in Phase 7)
    a.pageBreakBefore
      ? dom.setAttribute("data-page-break-before", "true")
      : dom.removeAttribute("data-page-break-before");
    a.keepWithNext
      ? dom.setAttribute("data-keep-with-next", "true")
      : dom.removeAttribute("data-keep-with-next");
    a.keepLinesTogether
      ? dom.setAttribute("data-keep-lines-together", "true")
      : dom.removeAttribute("data-keep-lines-together");
    if (a.widowOrphan !== 2) {
      dom.setAttribute("data-widow-orphan", String(a.widowOrphan));
    } else {
      dom.removeAttribute("data-widow-orphan");
    }
  }

  // Let ProseMirror handle selection within content, but stop most
  // events on the drag handle — except drag events which must reach
  // ProseMirror so it can serialise and drop the node correctly.
  stopEvent(event: Event): boolean {
    const target = event.target as HTMLElement;
    // Drag handle — stop everything except drag events
    if (this.handle.contains(target)) {
      const t = event.type;
      if (t === "dragstart" || t === "dragend" || t === "drop") {
        return false;
      }
      return true;
    }
    // Rail handle — stop everything except drag events so ProseMirror
    // can serialize and drop the node correctly (same as drag handle)
    if (this.railHandle?.contains(target)) {
      const t = event.type;
      if (t === "dragstart" || t === "dragend" || t === "drop") {
        return false;
      }
      return true;
    }
    return false;
  }

  ignoreMutation(mutation: MutationRecord | { type: string; target: Node }): boolean {
    if (mutation.type === "selection") return true;
    // Ignore mutations in handles
    if (this.handle.contains(mutation.target as Node)) return true;
    if (this.railHandle?.contains(mutation.target as Node)) return true;
    return !this.contentDOM!.contains(mutation.target as Node);
  }
}
