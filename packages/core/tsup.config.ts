import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    "prosemirror-model",
    "prosemirror-state",
    "prosemirror-view",
    "prosemirror-transform",
    "prosemirror-commands",
    "prosemirror-keymap",
    "prosemirror-history",
    "prosemirror-inputrules",
    "prosemirror-dropcursor",
    "prosemirror-gapcursor",
    "prosemirror-schema-list",
  ],
});
