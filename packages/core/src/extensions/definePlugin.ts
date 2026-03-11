import type { Plugin, EditorState } from "prosemirror-state";
import type { Schema } from "prosemirror-model";
import type { BlockDefinition } from "./defineBlock.js";
import type { MarkDefinition } from "./defineMark.js";

/**
 * Context passed to plugin factories so they can access
 * the resolved schema and extension metadata.
 */
export interface PluginContext {
  /** The assembled ProseMirror schema (includes custom blocks/marks). */
  schema: Schema;

  /** All resolved block definitions. */
  blockDefs: BlockDefinition[];

  /** All resolved mark definitions. */
  markDefs: MarkDefinition[];

  /** Editor options (placeholder, mode, etc.). */
  options: Record<string, unknown>;
}

/**
 * Describes a plugin that can be registered with the editor.
 */
export interface PluginDefinition {
  /** Unique plugin name, e.g. `"blockId"`, `"placeholder"`. */
  name: string;

  /**
   * Factory that creates one or more ProseMirror `Plugin` instances.
   * Called once during editor construction.
   */
  plugin: (context: PluginContext) => Plugin | Plugin[];
}

/**
 * Create and freeze a `PluginDefinition`.
 */
export function definePlugin(def: PluginDefinition): PluginDefinition {
  if (!def.name) {
    throw new Error("PluginDefinition requires a `name`.");
  }
  if (typeof def.plugin !== "function") {
    throw new Error(`PluginDefinition "${def.name}" requires a \`plugin\` factory function.`);
  }

  return Object.freeze({ ...def });
}
