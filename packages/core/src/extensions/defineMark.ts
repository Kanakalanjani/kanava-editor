import type { MarkSpec, Schema } from "prosemirror-model";
import type { Command } from "prosemirror-state";
import type { InputRule } from "prosemirror-inputrules";

/**
 * Describes everything about a mark type:
 * its ProseMirror spec, optional commands, input rules, keymap,
 * and UI metadata.
 */
export interface MarkDefinition {
  /** Unique mark name, e.g. `"bold"`, `"link"`, `"myapp:mention"`. */
  name: string;

  /** Raw ProseMirror `MarkSpec`. */
  spec: MarkSpec;

  /** Named commands exposed by this mark. */
  commands?: (schema: Schema) => Record<string, (...args: any[]) => Command>;

  /** Input rules contributed by this mark. */
  inputRules?: (schema: Schema) => InputRule[];

  /** Keybindings contributed by this mark. */
  keymap?: (schema: Schema) => Record<string, Command>;

  /** Human-readable label for UI, e.g. `"Bold"`. */
  label?: string;

  /** Short icon string or emoji, e.g. `"B"`. */
  icon?: string;

  /**
   * Toolbar items contributed by this mark.
   * Shown in the text-formatting section of the FormatBar.
   */
  toolbar?: import("./defineBlock.js").ToolbarItem[];
}

/**
 * Create and freeze a `MarkDefinition`.
 */
export function defineMark(def: MarkDefinition): MarkDefinition {
  if (!def.name) {
    throw new Error("MarkDefinition requires a `name`.");
  }
  if (!def.spec) {
    throw new Error(`MarkDefinition "${def.name}" requires a \`spec\`.`);
  }

  return Object.freeze({ ...def });
}
