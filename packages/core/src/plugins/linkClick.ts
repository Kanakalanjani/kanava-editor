import { Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

/**
 * Link click handler — opens links in a new tab on Ctrl+Click (Cmd+Click on Mac).
 *
 * ProseMirror swallows native `<a>` click behaviour because the editor
 * is `contenteditable`.  This plugin re-enables it for modifier-clicks
 * so users can follow links without leaving the editor.
 */
export function linkClickPlugin(): Plugin {
  return new Plugin({
    props: {
      handleClick(view: EditorView, pos: number, event: MouseEvent): boolean {
        if (!event.ctrlKey && !event.metaKey) return false;

        const { doc } = view.state;
        const $pos = doc.resolve(pos);
        const marks = $pos.marks();

        for (const mark of marks) {
          if (mark.type.name === "link" && mark.attrs.href) {
            const href = mark.attrs.href as string;
            // Only allow http/https/mailto links
            if (/^(https?:|mailto:)/i.test(href)) {
              window.open(href, "_blank", "noopener,noreferrer");
            }
            return true;
          }
        }

        return false;
      },
    },
  });
}
