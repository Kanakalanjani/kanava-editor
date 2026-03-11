import type { Node as PMNode } from "prosemirror-model";
import { KanavaNodeView, type RenderResult } from "./KanavaNodeView.js";

/**
 * NodeView for toggle (collapsible) blocks.
 *
 * Adds an interactive arrow icon that toggles the `collapsed` attribute.
 */
export class ToggleNodeView extends KanavaNodeView {
  private icon!: HTMLElement;

  render(node: PMNode): RenderResult {
    const dom = this.el("div", "kanava-toggle");
    this.applyCollapsedClass(dom, node);

    // Toggle icon
    this.icon = this.el("span", "kanava-toggle-icon");
    this.icon.contentEditable = "false";
    this.icon.textContent = "\u25B6"; // right-pointing triangle
    this.icon.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleCollapsed();
    });

    // Text content area
    const contentDOM = this.el("span", "kanava-toggle-text");

    dom.appendChild(this.icon);
    dom.appendChild(contentDOM);

    return { dom, contentDOM };
  }

  private applyCollapsedClass(dom: HTMLElement, node: PMNode) {
    if (node.attrs.collapsed) {
      dom.classList.add("is-collapsed");
      dom.classList.remove("is-expanded");
    } else {
      dom.classList.remove("is-collapsed");
      dom.classList.add("is-expanded");
    }
  }

  private toggleCollapsed() {
    this.setAttrs({ collapsed: !this.node.attrs.collapsed });
  }

  protected onUpdate(node: PMNode): void {
    this.applyCollapsedClass(this.dom, node);
  }

  stopEvent(event: Event): boolean {
    const target = event.target as HTMLElement;
    if (this.icon.contains(target)) return true;
    return false;
  }

  ignoreMutation(mutation: MutationRecord | { type: string; target: Node }): boolean {
    if (this.icon.contains(mutation.target as Node)) return true;
    return super.ignoreMutation(mutation);
  }
}
