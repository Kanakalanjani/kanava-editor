import type { Node as PMNode } from "prosemirror-model";
import type { EditorView, NodeView as PMNodeView } from "prosemirror-view";
import { KanavaNodeView, type RenderResult } from "./KanavaNodeView.js";

/**
 * NodeView for columnLayout — renders a flex container for columns
 * with draggable resize gutters between columns.
 * @see packages/docs/architecture-columnLayout.md
 *
 * Architecture (Option B): columnLayout lives inside a blockNode wrapper.
 * The wrapper BlockNodeView provides the drag handle, selection decoration,
 * and block-level styles. This view only needs to handle:
 *   - The column grid container
 *   - Resize gutters between columns
 */
export class ColumnLayoutView extends KanavaNodeView {
  private gutterLayer!: HTMLElement;
  private gutters: HTMLElement[] = [];
  private percentLabels: HTMLElement[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private resizing = false;
  private cleanupResize: (() => void) | null = null;

  render(node: PMNode): RenderResult {
    // Outer wrapper — positioned relatively so gutters can be absolute
    const dom = this.el("div", "kanava-column-layout");

    // Inner flex container where ProseMirror renders columns
    const contentDOM = this.el("div", "kanava-column-layout-inner");
    this.applyGap(contentDOM, node);
    dom.appendChild(contentDOM);

    // Gutter overlay layer (sits on top of contentDOM, pointer-events: none)
    this.gutterLayer = this.el("div", "kanava-column-gutter-layer");
    dom.appendChild(this.gutterLayer);

    // Observe resize to reposition gutters
    this.resizeObserver = new ResizeObserver(() => this.positionGutters());
    this.resizeObserver.observe(contentDOM);

    // Observe when ProseMirror adds/removes columns to contentDOM
    this.mutationObserver = new MutationObserver(() => this.rebuildGutters());
    this.mutationObserver.observe(contentDOM, { childList: true });

    // Bug fix: build gutters on next frame for pre-loaded/deserialized content.
    // The MutationObserver misses children added during ProseMirror's initial render.
    requestAnimationFrame(() => this.rebuildGutters());

    return { dom, contentDOM };
  }

  protected onUpdate(_node: PMNode): void {
    // Re-apply gap in case separatorPadding changed
    if (this.contentDOM) {
      this.applyGap(this.contentDOM, _node);
    }
    // Rebuild gutters on update — MutationObserver only catches DOM
    // child additions/removals, but update() can be called from
    // ProseMirror transactions without any DOM mutation (e.g. attr change).
    // Use requestAnimationFrame to batch with any pending layout.
    requestAnimationFrame(() => {
      if (!this.resizing) {
        this.rebuildGutters();
      }
    });
  }

  /**
   * Apply flex gap based on default 16px + separatorPadding attr.
   */
  private applyGap(el: HTMLElement, node: PMNode) {
    const padding = node.attrs.separatorPadding ?? 0;
    el.style.gap = padding > 0 ? `${16 + padding * 2}px` : "";
  }

  /**
   * Rebuild gutter elements based on current column count.
   */
  private rebuildGutters() {
    // Clear existing gutters and percentage labels
    this.gutterLayer.innerHTML = "";
    this.gutters = [];
    this.percentLabels = [];

    const columns = Array.from(this.contentDOM!.children).filter(
      (el) => el.classList.contains("kanava-column")
    );

    // Apply separator style from node attrs
    const sepStyle = this.node.attrs.separatorStyle || "ghost";

    for (let i = 0; i < columns.length - 1; i++) {
      const gutter = this.el("div", "kanava-column-gutter");
      gutter.classList.toggle("kanava-separator-visible", sepStyle === "visible");

      // Keyboard accessibility (B3)
      gutter.setAttribute("tabindex", "0");
      gutter.setAttribute("role", "separator");
      gutter.setAttribute("aria-orientation", "vertical");
      gutter.setAttribute("aria-label", `Resize between column ${i + 1} and ${i + 2}`);

      // Apply custom separator color/width if set
      const sepColor = this.node.attrs.separatorColor;
      const sepWidth = this.node.attrs.separatorWidth;
      if (sepColor) gutter.style.setProperty("--kanava-sep-color", sepColor);
      if (sepWidth) gutter.style.setProperty("--kanava-sep-width", `${sepWidth}px`);

      const leftIndex = i;
      gutter.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.startResize(leftIndex, e);
      });

      // Keyboard: arrow keys resize ±5%, Enter resets (B3)
      gutter.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          e.stopPropagation();
          this.resizeByKeyboard(leftIndex, e.key === "ArrowLeft" ? -0.05 : 0.05);
        } else if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          this.resetAllColumnWidths();
        }
      });

      // Double-click: reset ALL columns to equal widths
      gutter.addEventListener("dblclick", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.resetAllColumnWidths();
      });

      // Right-click: open separator style menu via CustomEvent
      gutter.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = this.getPos();
        if (pos === undefined) return;
        this.view.dom.dispatchEvent(
          new CustomEvent("kanava:separator-menu", {
            bubbles: true,
            detail: {
              pos,
              x: e.clientX,
              y: e.clientY,
              separatorStyle: this.node.attrs.separatorStyle || "ghost",
              separatorColor: this.node.attrs.separatorColor || null,
              separatorWidth: this.node.attrs.separatorWidth ?? 2,
              separatorPadding: this.node.attrs.separatorPadding ?? 0,
            },
          })
        );
      });

      this.gutterLayer.appendChild(gutter);
      this.gutters.push(gutter);
    }

    this.positionGutters();
  }

  /**
   * Position each gutter at the boundary between adjacent columns.
   */
  private positionGutters() {
    // Skip repositioning during active drag — the drag handler owns gutter.style.left
    if (this.resizing) return;

    const columns = Array.from(this.contentDOM!.children).filter(
      (el) => el.classList.contains("kanava-column")
    ) as HTMLElement[];

    // Use the gutter layer's own rect as the coordinate reference,
    // since gutters are positioned inside it (absolute within the
    // relative-positioned .kanava-column-layout parent).
    const layerRect = this.gutterLayer.getBoundingClientRect();

    // Compute the tallest adjacent column pair height for each gutter
    // so the separator only extends to the actual content area.
    const innerRect = this.contentDOM!.getBoundingClientRect();

    for (let i = 0; i < this.gutters.length; i++) {
      if (i >= columns.length - 1) break;
      const leftCol = columns[i];
      const leftRect = leftCol.getBoundingClientRect();
      const rightCol = columns[i + 1];
      const rightRect = rightCol.getBoundingClientRect();

      // Gutter sits at the gap between left column's right edge and right column's left edge
      const gutterCenter = (leftRect.right + rightRect.left) / 2 - layerRect.left;

      // Gutter height = the taller of the two adjacent columns, capped to
      // the inner container height. This prevents separators from extending
      // beyond the actual column content area.
      const gutterHeight = Math.min(
        Math.max(leftRect.height, rightRect.height),
        innerRect.height,
      );

      this.gutters[i].style.left = `${gutterCenter - 6}px`;
      this.gutters[i].style.top = "0";
      this.gutters[i].style.height = `${gutterHeight}px`;
    }
  }

  /**
   * Resize columns by a delta fraction via keyboard (B3).
   * @param leftIndex Index of the left column adjacent to the gutter
   * @param delta Fraction to shift (e.g., -0.05 for 5% leftward)
   */
  private resizeByKeyboard(leftIndex: number, delta: number) {
    const pos = this.getPos();
    if (pos === undefined) return;

    const leftChild = this.node.child(leftIndex);
    const rightChild = this.node.child(leftIndex + 1);
    const totalGrow = (leftChild.attrs.width ?? 1) + (rightChild.attrs.width ?? 1);

    let newLeftGrow = (leftChild.attrs.width ?? 1) + delta * totalGrow;
    let newRightGrow = totalGrow - newLeftGrow;

    // Enforce absolute 60px minimum per column
    const columns = Array.from(this.contentDOM!.children).filter(
      (el) => el.classList.contains("kanava-column")
    ) as HTMLElement[];
    const leftCol = columns[leftIndex];
    const rightCol = columns[leftIndex + 1];
    if (leftCol && rightCol) {
      const pairWidth = leftCol.clientWidth + rightCol.clientWidth;
      if (pairWidth > 0) {
        const leftPx = (newLeftGrow / totalGrow) * pairWidth;
        const rightPx = (newRightGrow / totalGrow) * pairWidth;
        if (leftPx < 60 || rightPx < 60) return;
      }
    }

    this.commitColumnWidths(leftIndex, newLeftGrow, leftIndex + 1, newRightGrow);

    // Flash width labels briefly
    this.showWidthLabels();
    setTimeout(() => this.hideWidthLabels(), 1200);
  }

  /**
   * Show pixel-width labels above each column during resize.
   * Labels turn red when the column is at the 60px minimum.
   */
  private showWidthLabels() {
    this.hideWidthLabels();

    const columns = Array.from(this.contentDOM!.children).filter(
      (el) => el.classList.contains("kanava-column")
    ) as HTMLElement[];

    const layerRect = this.gutterLayer.getBoundingClientRect();

    for (const col of columns) {
      const colRect = col.getBoundingClientRect();
      const widthPx = Math.round(colRect.width);
      const label = document.createElement("div");
      label.className = "kanava-column-pct-label";
      if (widthPx <= 64) label.classList.add("kanava-column-width-label--at-min");
      label.textContent = `${widthPx}px`;

      // Position centered above the column
      label.style.left = `${colRect.left - layerRect.left + colRect.width / 2}px`;

      this.gutterLayer.appendChild(label);
      this.percentLabels.push(label);
    }
  }

  /**
   * Remove width labels.
   */
  private hideWidthLabels() {
    for (const label of this.percentLabels) {
      label.remove();
    }
    this.percentLabels = [];
  }

  /**
   * Begin column resize drag.
   */
  private startResize(leftIndex: number, startEvent: MouseEvent) {
    const columns = Array.from(this.contentDOM!.children).filter(
      (el) => el.classList.contains("kanava-column")
    ) as HTMLElement[];

    if (leftIndex >= columns.length - 1) return;

    // Guard: prevent double-start from double-click
    if (this.resizing) return;
    this.resizing = true;

    // Disconnect ResizeObserver during drag to prevent feedback loop:
    // ResizeObserver fires positionGutters() when flexGrow changes, which
    // overwrites the drag handler's gutter.style.left on every mousemove.
    this.resizeObserver?.disconnect();

    const leftCol = columns[leftIndex];
    const rightCol = columns[leftIndex + 1];

    // Capture the original flex values for this pair so we can preserve
    // the pair's total flex during resize. This prevents other columns
    // from being affected (their flex values stay unchanged).
    const startLeftFlex = parseFloat(leftCol.style.flexGrow) || 1;
    const startRightFlex = parseFloat(rightCol.style.flexGrow) || 1;
    const pairFlex = startLeftFlex + startRightFlex;

    // Use clientWidth (content area only, excludes borders) for accurate tracking
    const totalWidth = leftCol.clientWidth + rightCol.clientWidth;
    const startX = startEvent.clientX;
    const leftStartWidth = leftCol.clientWidth;
    const gutter = this.gutters[leftIndex];

    // Capture initial gutter position for delta-based repositioning
    const gutterStartLeft = parseFloat(gutter?.style.left || "0");

    // Visual feedback
    gutter?.classList.add("is-dragging");

    // Absolute minimum: 60px per column regardless of container size or nesting depth
    const MIN_COL_PX = 60;

    // Show width labels during drag
    this.showWidthLabels();

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const newLeftWidth = Math.max(MIN_COL_PX, Math.min(totalWidth - MIN_COL_PX, leftStartWidth + dx));
      const newRightWidth = totalWidth - newLeftWidth;

      // Compute the fraction of the pair that the left column occupies,
      // then scale by pairFlex so the sum of left + right flex values
      // stays constant. Other columns keep their original flex values.
      const leftFraction = newLeftWidth / totalWidth;
      leftCol.style.flexGrow = String(leftFraction * pairFlex);
      rightCol.style.flexGrow = String((1 - leftFraction) * pairFlex);

      // Position gutter from delta
      if (gutter) {
        const computedDx = newLeftWidth - leftStartWidth;
        gutter.style.left = `${gutterStartLeft + computedDx}px`;

        // Visual feedback when either column is at minimum
        const atMin = newLeftWidth <= MIN_COL_PX + 1 || newRightWidth <= MIN_COL_PX + 1;
        gutter.classList.toggle("kanava-gutter--at-min", atMin);
      }

      // Update width labels in real-time
      this.showWidthLabels();
    };

    const onMouseUp = () => {
      // Clean up handlers FIRST to prevent re-entrant issues
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      this.cleanupResize = null;
      this.resizing = false;

      // Restore cursor and selection
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      this.view.dom.classList.remove("kanava-resizing");
      this.gutters[leftIndex]?.classList.remove("is-dragging");
      this.gutters[leftIndex]?.classList.remove("kanava-gutter--at-min");

      // Reconnect ResizeObserver now that drag is done
      if (this.contentDOM) {
        this.resizeObserver?.observe(this.contentDOM);
      }

      // Reposition all gutters from DOM rects (final truth after drag)
      this.positionGutters();

      // Hide width labels after drag
      this.hideWidthLabels();

      // Commit to ProseMirror
      const leftWidth = parseFloat(leftCol.style.flexGrow) || 1;
      const rightWidth = parseFloat(rightCol.style.flexGrow) || 1;
      this.commitColumnWidths(leftIndex, leftWidth, leftIndex + 1, rightWidth);
    };

    // Store cleanup so destroy() can call it if needed
    this.cleanupResize = onMouseUp;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    // Add class to editor root to disable selection via CSS
    this.view.dom.classList.add("kanava-resizing");
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  /**
   * Commit resized column widths to the ProseMirror document.
   */
  private commitColumnWidths(
    leftIdx: number,
    leftWidth: number,
    rightIdx: number,
    rightWidth: number
  ) {
    const pos = this.getPos();
    if (pos === undefined) return;

    const tr = this.view.state.tr;
    let offset = pos + 1; // inside columnLayout

    for (let i = 0; i <= rightIdx; i++) {
      const child = this.node.child(i);
      if (i === leftIdx) {
        tr.setNodeMarkup(offset, undefined, {
          ...child.attrs,
          width: leftWidth,
        });
      } else if (i === rightIdx) {
        tr.setNodeMarkup(offset, undefined, {
          ...child.attrs,
          width: rightWidth,
        });
      }
      offset += child.nodeSize;
    }

    this.view.dispatch(tr);
  }

  /**
   * Reset ALL columns to equal widths (width: 1).
   * Triggered by double-clicking any gutter.
   */
  private resetAllColumnWidths() {
    const pos = this.getPos();
    if (pos === undefined) return;

    const tr = this.view.state.tr;
    let offset = pos + 1; // inside columnLayout

    for (let i = 0; i < this.node.childCount; i++) {
      const child = this.node.child(i);
      tr.setNodeMarkup(offset, undefined, {
        ...child.attrs,
        width: 1,
      });
      offset += child.nodeSize;
    }

    this.view.dispatch(tr);
  }

  destroy() {
    // If resize is in progress, clean it up
    if (this.cleanupResize) {
      this.cleanupResize();
      this.cleanupResize = null;
    }
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }

  stopEvent(event: Event): boolean {
    const target = event.target as Node;
    // target may be a text node or SVG — walk up to nearest Element
    const el = target instanceof Element ? target : target.parentElement;
    if (!el) {
      return false;
    }
    if (el.closest(".kanava-column-gutter")) {
      // During active resize, block ALL events on gutters so PM
      // doesn't try to update selection or process mouse events
      if (this.resizing) {
        return true;
      }
      // When not resizing, block mousedown, dblclick, contextmenu, and keydown for a11y
      const shouldStop = event.type === "mousedown" || event.type === "dblclick"
        || event.type === "contextmenu" || event.type === "keydown";
      return shouldStop;
    }
    return false;
  }

  ignoreMutation(mutation: MutationRecord | { type: string; target: Node }): boolean {
    const target = mutation.target as HTMLElement;
    if (target.closest?.(".kanava-column-gutter-layer")) {
      return true;
    }
    if (target.closest?.(".kanava-column-gutter")) {
      return true;
    }
    if (target.classList?.contains("kanava-column-layout-inner")) {
      // Ignore attribute mutations on contentDOM (e.g., style changes)
      return mutation.type === "attributes";
    }
    return false;
  }
}

/**
 * NodeView for column — renders a flex item div.
 */
export class ColumnView extends KanavaNodeView {
  render(node: PMNode): RenderResult {
    const dom = this.el("div", "kanava-column");
    dom.style.flexGrow = String(node.attrs.width ?? 1);
    dom.style.flexBasis = "0";
    return { dom, contentDOM: dom };
  }

  protected onUpdate(node: PMNode): void {
    // During active column resize, the drag handler directly sets
    // flexGrow on the DOM elements. Transactions dispatched by other
    // plugins (e.g. ghostRail) would overwrite those values with the
    // stale node attr, causing visible flicker/disconnect. Skip.
    if (this.view.dom.classList.contains("kanava-resizing")) return;
    this.dom.style.flexGrow = String(node.attrs.width ?? 1);
  }

  ignoreMutation(mutation: MutationRecord | { type: string; target: Node }): boolean {
    // Ignore style mutations during column resize drag
    if (mutation.type === "attributes" && mutation.target === this.dom) return true;
    return false;
  }
}
