# Things to Avoid

## Never Do

1. **Never import `kanavaSchema` directly.** Use `state.schema` or `editor.schema` instead. The schema is dynamically built from `buildSchema(blocks, marks)`.

2. **Never hardcode block type names as strings in core logic.** Use `state.schema.nodes.paragraph` or `node.type.spec.group?.includes("blockBody")` instead of `node.type.name === "paragraph"`.

3. **Never add structural nodes via `defineBlock()`.** Nodes like `doc`, `blockGroup`, `blockNode`, `column`, `text` are defined in `structuralNodes.ts` and are not user-configurable.

4. **Never put React/DOM code in `@kanava/editor`.** Core is headless — it provides data, commands, and plugins. All UI rendering belongs in `@kanava/editor-react`.

5. **Never add inline styles to ProseMirror `toDOM` output** unless they represent user-controlled values (like `textAlign`). Use CSS classes instead.

6. **Never use default exports.** The entire codebase uses named exports exclusively.

7. **Never mutate a `BlockDefinition` or `MarkDefinition`.** They are frozen with `Object.freeze()`.

8. **Never create circular import dependencies.** Core must not import from React. NodeViews type the editor as `unknown` (not `KanavaEditor`) to avoid circular imports.

9. **Never add `!important` to CSS** unless overriding a ProseMirror default that can't be changed otherwise.

10. **Never hardcode a `builtIn*` array** in React components. Read from `editor.blockDefs` and `editor.markDefs` instead.

11. **Never skip the build verification** after modifying code. Always run `pnpm -r build`.

12. **Never import ProseMirror modules without the `.js` extension.** All imports in the codebase use ESM-style `.js` extensions.

13. **Never add `columnLayout` as a direct child of `blockGroup`.** Under Option B, `columnLayout` is always wrapped in a `blockNode`.

14. **Never guard against column nesting.** The architecture intentionally supports nesting columns inside columns.

15. **Never create new documentation files to summarize changes** unless explicitly requested. Update existing plan documents instead.
