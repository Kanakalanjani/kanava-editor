import {
  inputRules,
  wrappingInputRule,
  textblockTypeInputRule,
  InputRule,
} from "prosemirror-inputrules";
import type { Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";

/**
 * Creates markdown-like input rules for the Kanava editor.
 *
 * # Heading 1, ## Heading 2, etc.
 * > Blockquote
 * --- Divider
 * ``` Code block
 */
export function kanavaInputRules(schema: Schema): Plugin {
  const rules: InputRule[] = [];

  // Heading rules: # → H1, ## → H2, etc.
  for (let level = 1; level <= 6; level++) {
    const pattern = new RegExp(`^(#{${level}})\\s$`);
    rules.push(
      textblockTypeInputRule(pattern, schema.nodes.heading, { level })
    );
  }

  // Quote: > at start of line
  if (schema.nodes.quote) {
    rules.push(textblockTypeInputRule(/^>\s$/, schema.nodes.quote));
  }

  // Code block: ``` at start of line
  if (schema.nodes.codeBlock) {
    rules.push(
      textblockTypeInputRule(/^```$/, schema.nodes.codeBlock, {
        language: "plain",
      })
    );
  }

  // Horizontal rule: --- at start of line
  if (schema.nodes.divider) {
    rules.push(
      new InputRule(/^---$/, (state, _match, start, end) => {
        // We need to replace the current blockBody with a divider
        const { tr } = state;
        const $start = state.doc.resolve(start);

        // Find the blockBody parent
        const blockBody = $start.node($start.depth);
        if (blockBody.type.name === "paragraph") {
          const blockBodyStart = $start.before($start.depth);
          const blockBodyEnd = $start.after($start.depth);

          tr.replaceWith(
            blockBodyStart,
            blockBodyEnd,
            schema.nodes.divider.create()
          );
          return tr;
        }
        return null;
      })
    );
  }

  // Checklist: [] or [ ] at start of line
  if (schema.nodes.checklistItem) {
    rules.push(
      textblockTypeInputRule(/^\[[\s]?\]\s$/, schema.nodes.checklistItem, {
        checked: false,
      })
    );
    rules.push(
      textblockTypeInputRule(/^\[x\]\s$/i, schema.nodes.checklistItem, {
        checked: true,
      })
    );
  }

  // Bullet list: - or * at start of line
  if (schema.nodes.bulletListItem) {
    rules.push(
      textblockTypeInputRule(/^[-*]\s$/, schema.nodes.bulletListItem)
    );
  }

  // Numbered list: 1. at start of line
  if (schema.nodes.numberedListItem) {
    rules.push(
      textblockTypeInputRule(/^(\d+)\.\s$/, schema.nodes.numberedListItem, (match) => ({
        order: parseInt(match[1], 10),
      }))
    );
  }

  return inputRules({ rules });
}
