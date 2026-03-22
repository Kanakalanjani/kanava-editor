# Kanava Editor — Copilot Instructions

## Project

Kanava is a ProseMirror-based block editor library. Monorepo with `@kanava/editor` (headless engine) and `@kanava/editor-react` (React UI bindings).

## Setup & Build

- **Package manager**: pnpm with workspaces
- **Build**: `pnpm -r build` (builds core → react → playground)
- **Dev server**: `pnpm --filter playground dev`
- Always verify with `pnpm -r build` after changes

## Coding Style

- TypeScript strict mode, ES2020 target
- Named exports only — no default exports
- Use `import type` for type-only imports
- All module imports use `.js` extensions: `import { foo } from "./bar.js"`
- PascalCase for exported constants (block/mark definitions): `export const Paragraph = defineBlock({ ... })`
- camelCase for functions: `export function deleteCurrentBlock(): Command { ... }`
- CSS classes prefixed with `kanava-`: `.kanava-paragraph`, `.kanava-format-bar`
- CSS theming via `--kanava-*` custom properties

## Architecture Rules

- Document hierarchy: `doc > blockGroup > blockNode > ((blockBody blockGroup?) | columnLayout)`
- All user blocks have `spec.group: "blockBody"` — structural nodes are separate
- Schema is built dynamically from registered blocks/marks — never import a singleton
- Core package is headless (no DOM/React). All UI in `@kanava/editor-react`
- React components read from `editor.blockDefs` / `editor.markDefs` — no hardcoded block lists
- `columnLayout` always inside `blockNode` (Option B architecture)
- Column nesting is allowed — no guards against it
- Definitions are frozen with `Object.freeze()` — never mutate
- Drag handle: 3-dot hover overlay at top-left, zero reserved padding, `position: absolute`
- Block-level styling lives on `blockNode` wrapper attrs (textAlign, backgroundColor, spacing, plus planned lineHeight, padding, border, indent, letterSpacing)

## Patterns

### Commands
```ts
export function myCommand(param: string): Command {
  return (state, dispatch) => {
    if (!applicable(state)) return false;
    if (dispatch) dispatch(state.tr./* ... */.scrollIntoView());
    return true;
  };
}
```

### Blocks
```ts
export const MyBlock = defineBlock({
  name: "myBlock",
  label: "My Block",
  icon: "📦",
  group: "text",
  spec: { group: "blockBody", content: "inline*", /* ... */ },
});
```

### NodeViews
Extend `KanavaNodeView`. Use `this.el(tag, class)` for DOM, `this.setAttrs()` for updates.

## Detailed Guidance

For extended rules, patterns, and step-by-step task guides, read:

- **Rules**: `.agent/rules/architecture.md`, `coding-patterns.md`, `dont.md`, `workflow.md`
- **Skills**: `.agent/skills/add-block/`, `add-mark/`, `modify-ui/`, `fix-plugin/`
- **Plans**: `docs/plans/MASTER-IMPLEMENTATION-PLAN.md` for project roadmap, `docs/plans/next-implementation-plan.md` for current sprint

## MCP Servers

No project-specific MCP servers are required. Configure MCP integrations (GitHub, etc.) in VS Code settings under `mcp.servers` if needed.
