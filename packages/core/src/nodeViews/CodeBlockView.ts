import type { Node as PMNode } from "prosemirror-model";
import { KanavaNodeView, type RenderResult } from "./KanavaNodeView.js";

/**
 * NodeView for code blocks — renders a `<pre><code>` with language selector.
 */
export class CodeBlockView extends KanavaNodeView {
  private langSelect!: HTMLSelectElement;

  private static LANGUAGES = [
    "", "javascript", "typescript", "python", "rust", "go",
    "java", "c", "cpp", "csharp", "ruby", "php", "swift",
    "kotlin", "html", "css", "sql", "bash", "json", "yaml",
    "markdown", "xml",
  ] as const;

  render(node: PMNode): RenderResult {
    const dom = this.el("div", "kanava-code-block");

    // Language selector
    const toolbar = this.el("div", "kanava-code-toolbar");
    toolbar.contentEditable = "false";

    this.langSelect = document.createElement("select");
    this.langSelect.classList.add("kanava-code-lang-select");
    for (const lang of CodeBlockView.LANGUAGES) {
      const option = document.createElement("option");
      option.value = lang;
      option.textContent = lang || "Plain text";
      if (lang === (node.attrs.language || "")) {
        option.selected = true;
      }
      this.langSelect.appendChild(option);
    }
    this.langSelect.addEventListener("change", () => {
      this.setAttrs({ language: this.langSelect.value });
    });

    toolbar.appendChild(this.langSelect);
    dom.appendChild(toolbar);

    // Code content area
    const pre = this.el("pre", "kanava-code-pre");
    const code = this.el("code", "kanava-code-content");
    if (node.attrs.language) {
      code.classList.add(`language-${node.attrs.language}`);
    }
    pre.appendChild(code);
    dom.appendChild(pre);

    return { dom, contentDOM: code };
  }

  protected onUpdate(node: PMNode): void {
    // Update language selector
    this.langSelect.value = node.attrs.language || "";

    // Update language class on code element
    if (this.contentDOM) {
      this.contentDOM.className = "kanava-code-content";
      if (node.attrs.language) {
        this.contentDOM.classList.add(`language-${node.attrs.language}`);
      }
    }
  }

  stopEvent(event: Event): boolean {
    // Allow events within the language select
    if (event.target === this.langSelect) return true;
    return false;
  }
}
