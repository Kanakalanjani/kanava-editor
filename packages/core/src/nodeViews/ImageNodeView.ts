import type { Node as PMNode } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";
import { KanavaNodeView, type RenderResult } from "./KanavaNodeView.js";
import { IMAGE_FILTERS } from "../blocks/image.js";

/**
 * NodeView for image blocks — renders an image with editable caption,
 * corner resize handles, alignment, and CSS filter support.
 * Atom node (no contentDOM).
 */
export class ImageNodeView extends KanavaNodeView {
  private img!: HTMLImageElement;
  private captionEl!: HTMLElement;
  private figure!: HTMLElement;
  private imgWrap!: HTMLElement;
  // NOTE: These use `!` (no initializer) because render() is called from
  // the super() constructor, BEFORE subclass field initializers run.
  // They are explicitly initialized at the top of render().
  private handles!: HTMLElement[];
  private resizing!: boolean;
  private captionDebounce!: ReturnType<typeof setTimeout> | null;

  render(node: PMNode): RenderResult {
    // Explicitly initialize fields — class field initializers haven't
    // run yet because KanavaNodeView's constructor calls render()
    // before super() returns to this subclass.
    this.handles = [];
    this.resizing = false;
    this.captionDebounce = null;

    const dom = this.el("div", "kanava-image-block");
    dom.contentEditable = "false";

    // Apply alignment class
    this.applyAlignment(dom, node.attrs.alignment);

    // Empty state — inserted from block picker with no source yet.
    // NOTE: do NOT add kanava-image-uploading here; the imageUploadPlugin
    // manages that class externally for actual uploads.
    if (!node.attrs.src) {
      dom.classList.add("kanava-image-empty");
      this.setupEmptyDropZone(dom);

      // On click, emit imageInsert event so React can show insert popover
      dom.addEventListener("click", (e) => {
        e.stopPropagation();
        const pos = this.getPos();
        if (pos === undefined) return;
        (this.editor as any)?.emit("imageInsert", { pos, dom });
      });
    }

    this.img = document.createElement("img") as HTMLImageElement;
    this.img.src = node.attrs.src || "";
    this.img.alt = node.attrs.alt || "";
    this.applyDimensions(node);
    this.applyFilter(node);
    this.img.classList.add("kanava-image");
    this.img.draggable = false;

    // Editable caption
    this.captionEl = this.el("figcaption", "kanava-image-caption");
    this.captionEl.contentEditable = "true";
    this.captionEl.setAttribute("data-placeholder", "Add a caption…");
    this.setupCaption(node);

    this.figure = this.el("figure", "kanava-image-figure");
    // Wrap the image in a position:relative container so resize handles
    // surround only the image, not the caption.
    this.imgWrap = this.el("div", "kanava-image-wrap");
    this.imgWrap.appendChild(this.img);

    // Resize handles (4 corners) — appended inside imgWrap
    this.createResizeHandles();

    this.figure.appendChild(this.imgWrap);
    this.figure.appendChild(this.captionEl);

    dom.appendChild(this.figure);

    // Apply rotation
    this.applyRotation(node);

    // Click to select node
    dom.addEventListener("mousedown", (e) => {
      const target = e.target as HTMLElement;
      // Don't intercept handle clicks or caption editing
      if (target.classList.contains("kanava-image-resize-handle")) return;
      if (target === this.captionEl || this.captionEl.contains(target)) return;

      const pos = this.getPos();
      if (pos === undefined) return;

      // If the block is already node-selected, don't preventDefault —
      // allow the browser's native drag-start to fire.
      const sel = this.view.state.selection;
      if (sel instanceof NodeSelection && sel.from === pos) {
        return;
      }

      e.preventDefault();
      const tr = this.view.state.tr.setSelection(
        NodeSelection.create(this.view.state.doc, pos)
      );
      this.view.dispatch(tr);
    });

    return { dom }; // No contentDOM — atom node
  }

  protected onUpdate(node: PMNode): void {
    this.img.src = node.attrs.src || "";
    this.img.alt = node.attrs.alt || "";
    this.applyDimensions(node);
    this.applyFilter(node);
    this.applyRotation(node);
    this.applyCropShape(node);
    this.applyAlignment(this.dom, node.attrs.alignment);

    // Update caption only if it wasn't changed by the user (avoid cursor jump)
    if (this.captionEl.textContent !== (node.attrs.caption || "")) {
      this.captionEl.textContent = node.attrs.caption || "";
    }
    // Show/hide caption based on content + selection
    this.updateCaptionVisibility();

    // Update empty / loading state
    if (node.attrs.src) {
      this.dom.classList.remove("kanava-image-empty");
      this.dom.classList.remove("kanava-image-uploading");
    } else {
      this.dom.classList.add("kanava-image-empty");
    }
  }

  stopEvent(event: Event): boolean {
    // During active resize, swallow everything to avoid selection changes
    if (this.resizing) return true;

    const target = event.target as HTMLElement;

    // Caption handles its own keyboard/input via DOM listeners — stop PM from processing
    if (target === this.captionEl || this.captionEl.contains(target)) {
      return true;
    }

    // Resize-handle mousedown is already stopPropagation'd but stop for PM too
    if (target.classList.contains("kanava-image-resize-handle")) {
      return true;
    }

    // For empty images: stop drop/paste events so our native DOM handlers
    // fire instead of ProseMirror inserting a new block.
    if (!this.node.attrs.src) {
      const type = event.type;
      if (type === "drop" || type === "paste" || type === "dragover" || type === "dragenter" || type === "dragleave") {
        return true;
      }
    }

    // Let everything else (selection, focus, etc.) pass through to ProseMirror
    return false;
  }

  /* ── Empty image drop zone ─────────────────────────────── */

  /**
   * Attach native drag/drop and paste handlers on an empty image block.
   * When an image file is dropped or pasted, we call the editor's
   * onImageUpload callback and update the block's src attr directly.
   */
  private setupEmptyDropZone(dom: HTMLElement): void {
    // Allow drops
    dom.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dom.classList.add("kanava-image-dragover");
    });

    dom.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dom.classList.remove("kanava-image-dragover");
    });

    dom.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dom.classList.remove("kanava-image-dragover");

      const dt = (e as DragEvent).dataTransfer;
      if (!dt) return;
      const file = this.getFirstImageFile(dt.files);
      if (file) this.handleFileUpload(file);
    });

    // Allow paste
    dom.addEventListener("paste", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ce = e as ClipboardEvent;
      if (!ce.clipboardData) return;
      const file = this.getFirstImageFile(ce.clipboardData.files);
      if (file) this.handleFileUpload(file);
    });
  }

  private getFirstImageFile(files: FileList): File | null {
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith("image/")) return files[i];
    }
    return null;
  }

  private handleFileUpload(file: File): void {
    // Access the editor's onImageUpload callback
    const editorAny = this.editor as any;
    const uploadFn = editorAny?.options?.onImageUpload;
    if (!uploadFn) {
      // No upload callback — try reading as data URL as fallback
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          this.setAttrs({ src: reader.result });
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // Show loading state
    this.dom.classList.add("kanava-image-uploading");

    uploadFn(file)
      .then((src: string) => {
        this.setAttrs({ src });
        this.dom.classList.remove("kanava-image-uploading");
        this.dom.classList.remove("kanava-image-empty");
      })
      .catch(() => {
        this.dom.classList.remove("kanava-image-uploading");
      });
  }

  ignoreMutation(mutation: MutationRecord | { type: string; target: Node }): boolean {
    // Ignore all mutations — atom node manages its own DOM
    return true;
  }

  destroy(): void {
    if (this.captionDebounce) clearTimeout(this.captionDebounce);
  }

  /* ── Alignment ──────────────────────────────────────────── */

  private applyAlignment(dom: HTMLElement, alignment: string): void {
    dom.classList.remove(
      "kanava-image-align-left",
      "kanava-image-align-center",
      "kanava-image-align-right"
    );
    dom.classList.add(`kanava-image-align-${alignment || "center"}`);
  }

  /* ── Filter ─────────────────────────────────────────────── */

  private applyFilter(node: PMNode): void {
    const filterParts: string[] = [];
    const filterKey = node.attrs.filter;
    if (filterKey && filterKey !== "none") {
      const preset = IMAGE_FILTERS[filterKey] ?? filterKey;
      const intensity = (node.attrs.filterIntensity ?? 100) / 100;
      if (preset !== "none" && intensity > 0) {
        const scaled = preset.replace(
          /\(([\d.]+)(%|px|deg)?\)/g,
          (_m: string, val: string, unit: string) =>
            `(${(parseFloat(val) * intensity).toFixed(1)}${unit || ""})`
        );
        filterParts.push(scaled);
      }
    }
    const adj = node.attrs.adjustments;
    if (adj) {
      if (adj.brightness != null && adj.brightness !== 100) filterParts.push(`brightness(${adj.brightness}%)`);
      if (adj.contrast != null && adj.contrast !== 100) filterParts.push(`contrast(${adj.contrast}%)`);
      if (adj.saturation != null && adj.saturation !== 100) filterParts.push(`saturate(${adj.saturation}%)`);
    }
    this.img.style.filter = filterParts.length ? filterParts.join(" ") : "";
    // Also apply crop
    this.applyCrop(node);
  }

  /* ── Crop ───────────────────────────────────────────────── */

  private applyCrop(node: PMNode): void {
    const crop = node.attrs.cropData;
    if (crop) {
      // object-view-box: inset(top right bottom left)
      const top = crop.y;
      const right = 100 - crop.x - crop.width;
      const bottom = 100 - crop.y - crop.height;
      const left = crop.x;
      (this.img.style as any).objectViewBox = `inset(${top}% ${right}% ${bottom}% ${left}%)`;
    } else {
      (this.img.style as any).objectViewBox = "";
    }
  }

  /* ── Crop Shape ───────────────────────────────────────────── */

  private applyCropShape(node: PMNode): void {
    const shape = node.attrs.cropShape || "rect";
    if (shape === "circle") {
      this.img.style.clipPath = "circle(50%)";
      this.img.style.aspectRatio = "1";
      this.img.style.borderRadius = "";
    } else if (shape === "rounded") {
      this.img.style.clipPath = "";
      this.img.style.aspectRatio = "";
      this.img.style.borderRadius = "16px";
    } else {
      this.img.style.clipPath = "";
      this.img.style.aspectRatio = "";
      this.img.style.borderRadius = "";
    }
  }

  /* ── Rotation ─────────────────────────────────────────────── */

  private applyRotation(node: PMNode): void {
    const rotation = node.attrs.rotation || 0;
    // Apply rotation on the <img> only — the caption stays upright.
    if (rotation) {
      this.img.style.transform = `rotate(${rotation}deg)`;
    } else {
      this.img.style.transform = "";
    }
  }

  /* ── Dimensions ─────────────────────────────────────────── */

  private applyDimensions(node: PMNode): void {
    if (node.attrs.width) {
      this.img.style.width = `${node.attrs.width}px`;
    } else {
      this.img.style.width = "";
    }
    if (node.attrs.height) {
      this.img.style.height = `${node.attrs.height}px`;
    } else {
      this.img.style.height = "";
    }
  }

  /* ── Caption ────────────────────────────────────────────── */

  private setupCaption(node: PMNode): void {
    this.captionEl.textContent = node.attrs.caption || "";
    this.updateCaptionVisibility();

    // On input, debounce-commit the caption text
    this.captionEl.addEventListener("input", () => {
      if (this.captionDebounce) clearTimeout(this.captionDebounce);
      this.captionDebounce = setTimeout(() => {
        const text = this.captionEl.textContent || "";
        if (text !== this.node.attrs.caption) {
          this.setAttrs({ caption: text });
        }
      }, 300);
    });

    // Keyboard handling within caption
    this.captionEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.captionEl.blur();
        this.view.focus();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.captionEl.blur();
        this.view.focus();
      } else if (e.key === "Backspace" && !this.captionEl.textContent) {
        // Backspace on empty caption: hide caption, refocus editor
        e.preventDefault();
        this.setAttrs({ caption: "" });
        this.captionEl.blur();
        this.view.focus();
      }
      // Stop propagation so ProseMirror doesn't handle these keys
      e.stopPropagation();
    });

    // Show caption placeholder when focused
    this.captionEl.addEventListener("focus", () => {
      this.captionEl.classList.add("is-focused");
    });
    this.captionEl.addEventListener("blur", () => {
      this.captionEl.classList.remove("is-focused");
      this.updateCaptionVisibility();
      // Commit any pending caption
      if (this.captionDebounce) {
        clearTimeout(this.captionDebounce);
        this.captionDebounce = null;
        const text = this.captionEl.textContent || "";
        if (text !== this.node.attrs.caption) {
          this.setAttrs({ caption: text });
        }
      }
    });
  }

  private updateCaptionVisibility(): void {
    const hasCaption = !!this.node.attrs.caption;
    const isFocused = this.captionEl.classList.contains("is-focused");
    // Show caption when: (a) it has text, or (b) caption is focused, or
    // (c) the image block is node-selected (so user can discover caption).
    // this.dom may be undefined during render() — default to false.
    const imageSelected = !!this.dom?.classList?.contains("ProseMirror-selectednode");
    if (hasCaption || isFocused || imageSelected) {
      this.captionEl.style.display = "";
    } else {
      this.captionEl.style.display = "none";
    }
  }

  /* ── Resize Handles ─────────────────────────────────────── */

  /**
   * Create the 4 corner resize handles.
   */
  private createResizeHandles(): void {
    const corners: Array<{ className: string; cursor: string }> = [
      { className: "kanava-image-resize-handle kanava-resize-nw", cursor: "nwse-resize" },
      { className: "kanava-image-resize-handle kanava-resize-ne", cursor: "nesw-resize" },
      { className: "kanava-image-resize-handle kanava-resize-sw", cursor: "nesw-resize" },
      { className: "kanava-image-resize-handle kanava-resize-se", cursor: "nwse-resize" },
    ];

    for (const corner of corners) {
      const handle = document.createElement("div");
      handle.className = corner.className;
      handle.style.cursor = corner.cursor;

      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.startResize(e, corner.className);
      });

      this.imgWrap.appendChild(handle);
      this.handles.push(handle);
    }
  }

  /**
   * Begin image resize drag from a corner handle.
   */
  private startResize(startEvent: MouseEvent, handleClass: string): void {
    this.resizing = true;

    const startX = startEvent.clientX;
    const startWidth = this.img.offsetWidth || this.img.naturalWidth || 200;
    const startHeight = this.img.offsetHeight || this.img.naturalHeight || 200;
    const aspectRatio = startWidth / startHeight;

    // Which corner determines the direction of dx
    const isLeft = handleClass.includes("nw") || handleClass.includes("sw");

    // Get max width from container
    const containerWidth = this.dom.parentElement?.offsetWidth || 800;
    const minWidth = 50;
    const maxWidth = containerWidth - 40; // leave some padding

    const onMouseMove = (e: MouseEvent) => {
      let dx = e.clientX - startX;
      if (isLeft) dx = -dx; // Dragging left handle inverts dx

      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + dx));
      const newHeight = newWidth / aspectRatio;

      // Apply during drag as preview
      this.img.style.width = `${Math.round(newWidth)}px`;
      this.img.style.height = `${Math.round(newHeight)}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      this.resizing = false;

      // Commit final dimensions to ProseMirror
      const finalWidth = Math.round(this.img.offsetWidth);
      const finalHeight = Math.round(this.img.offsetHeight);
      this.setAttrs({ width: finalWidth, height: finalHeight });
    };

    document.body.style.cursor = handleClass.includes("nw") || handleClass.includes("se")
      ? "nwse-resize" : "nesw-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }
}
