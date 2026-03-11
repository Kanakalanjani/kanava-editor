import type { Node as PMNode } from "prosemirror-model";
import { KanavaNodeView, type RenderResult } from "./KanavaNodeView.js";

/**
 * NodeView for callout blocks.
 *
 * Renders a colored box with an icon and editable text.
 */
export class CalloutNodeView extends KanavaNodeView {
  private iconEl!: HTMLElement;

  private static iconMap: Record<string, string> = {
    info: "\u2139\uFE0F",
    warning: "\u26A0\uFE0F",
    success: "\u2705",
    error: "\u274C",
  };

  render(node: PMNode): RenderResult {
    const dom = this.el("div", `kanava-callout kanava-callout-${node.attrs.variant}`);
    dom.setAttribute("data-variant", node.attrs.variant);

    // Icon
    this.iconEl = this.el("span", "kanava-callout-icon");
    this.iconEl.contentEditable = "false";
    this.updateIcon(node);

    // Editable text area
    const contentDOM = this.el("span", "kanava-callout-text");

    dom.appendChild(this.iconEl);
    dom.appendChild(contentDOM);

    return { dom, contentDOM };
  }

  private updateIcon(node: PMNode) {
    const icon =
      node.attrs.icon ||
      CalloutNodeView.iconMap[node.attrs.variant] ||
      CalloutNodeView.iconMap.info;
    this.iconEl.textContent = icon;
  }

  protected onUpdate(node: PMNode): void {
    this.dom.className = `kanava-callout kanava-callout-${node.attrs.variant}`;
    this.dom.setAttribute("data-variant", node.attrs.variant);
    this.updateIcon(node);
  }

  ignoreMutation(mutation: MutationRecord | { type: string; target: Node }): boolean {
    if (this.iconEl.contains(mutation.target as Node)) return true;
    return super.ignoreMutation(mutation);
  }
}
