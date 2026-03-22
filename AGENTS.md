# Kanava Editor — Agent Guide

Kanava is a ProseMirror-based block editor SDK shipped as two npm packages (`@kanava/editor` + `@kanava/editor-react`) in a pnpm monorepo.

## Setup & Build

- **Package manager**: pnpm with workspaces
- **Build all**: `pnpm -r build` (builds core -> react -> playground)
- **Dev server**: `pnpm --filter playground dev`
- **Install deps**: `pnpm install`
- **First-time setup**: `pnpm run setup:dev` (wires git hooks + private file protection)
- **No test suite yet** (planned for Phase 10)

Always run `pnpm -r build` after any code change to verify.

## Project Structure

```
packages/core/src/     @kanava/editor — Headless engine (ProseMirror, zero UI)
  api/                 Public API types, blockTree serialization, events
  blocks/              BlockDefinition files (one per block type)
  commands/            ProseMirror commands grouped by domain
  extensions/          defineBlock, defineMark, definePlugin, schemaBuilder
  marks/               MarkDefinition files (one per mark type)
  nodeViews/           NodeView implementations
  plugins/             ProseMirror plugins
  schema/              Structural nodes, schema builder wrapper
  styles/              CSS files

packages/react/src/    @kanava/editor-react — React UI components
  FormatBar.tsx        Floating toolbar (text + block modes)
  ContextMenu.tsx      Right-click context menu with submenus
  BlockPicker.tsx      Slash-command block type picker
  KanavaEditor.tsx     React wrapper component
  ToolbarPrimitives.tsx Reusable toolbar atoms
  hooks.ts             React hooks (useKanavaEditor, useToolbarState)

apps/playground/       Demo app using both packages

apps/resume-builder/   Resume builder demo app
```

## Code Style

- TypeScript strict mode, ES2020 target
- Named exports only — no default exports
- `import type` for type-only imports
- All module imports use `.js` extensions: `import { foo } from "./bar.js"`
- PascalCase for exported constants (block/mark definitions): `export const Paragraph = defineBlock({ ... })`
- camelCase for functions: `export function deleteCurrentBlock(): Command { ... }`
- CSS classes prefixed with `kanava-`: `.kanava-paragraph`, `.kanava-format-bar`
- CSS theming via `--kanava-*` custom properties

## Architecture

### Node hierarchy

```
doc > blockGroup > blockNode+ > ((blockBody blockGroup?) | columnLayout)
                                                          columnLayout > column+ > blockNode+
```

- **`blockNode`** wraps ALL blocks. Carries shared attrs: `id`, `textAlign`, `backgroundColor`, `spacingTop`, `spacingBottom`
- **`blockBody`** is the group name for all user-facing block types
- **`columnLayout`** lives inside `blockNode` (Option B architecture)
- Column nesting is allowed — no guards against it

### Package architecture

```
┌─ @kanava/editor ─────────────────────────────────────────┐
│  defineBlock() / defineMark() / definePlugin()          │
│  buildSchema(blocks, marks) → ProseMirror Schema        │
│  KanavaEditor class → ProseMirror EditorView            │
│  Plugins: blockId, clipboard, dragHandle, imageUpload,  │
│           inputRules, keymap, placeholder, selection,    │
│           toolbarState, listRenumber                     │
│  Commands: block, text, columns, image, nesting          │
└─────────────────────────────────────────────────────────┘
         ↓ headless API (editor.exec, editor.on, etc.)
┌─ @kanava/editor-react ────────────────────────────────────────┐
│  <KanavaEditor /> — React wrapper                       │
│  <FormatBar /> — Floating toolbar                       │
│  <ContextMenu /> — Right-click menu with submenus       │
│  <BlockPicker /> — Slash-command block type picker       │
│  useKanavaEditor() / useToolbarState() hooks             │
└─────────────────────────────────────────────────────────┘
```

### Key design principles

1. No hardcoded block type names in core logic — use schema groups and `BlockDefinition` registry
2. Schema is always derived via `buildSchema(blocks, marks)` — never import a singleton
3. React components are data-driven — render from `editor.blockDefs` / `editor.markDefs`
4. CSS is themeable via `--kanava-*` custom properties
5. `@kanava/editor` has zero DOM/React dependencies — headless only
6. Every block uses `defineBlock()` — built-in blocks dogfood the same API
7. Features are opt-in — pagination, collaboration are plugins loaded only when configured
8. All `.ts` imports use `.js` extensions (ESM convention)
9. Definitions are frozen with `Object.freeze()` — never mutate

## Detailed Rules

Read these before writing code:

| File | What it covers |
|------|----------------|
| `.agent/rules/architecture.md` | Node hierarchy, package structure, design principles, toolbar architecture |
| `.agent/rules/coding-patterns.md` | Block/mark/nodeView/command templates with exact patterns to follow |
| `.agent/rules/dont.md` | 15 anti-patterns to avoid (singleton schema, default exports, hardcoded lists, etc.) |
| `.agent/rules/workflow.md` | Build/verify cycle, plan documentation, git practices, doc-sync rules |
| `.agent/rules/security.md` | XSS mitigation, clipboard sanitization, safe DOM patterns |

## Living Documentation

Wiki-like guides in `packages/docs/` — the primary source for understanding Kanava:

| Guide | What it covers |
|-------|----------------|
| `packages/docs/guide-initialization.md` | Constructor, options, density, pagination, API methods |
| `packages/docs/guide-document-model.md` | JSON format, block tree, serialization, built-in types |
| `packages/docs/guide-react-integration.md` | Quick start, hooks, component props |
| `packages/docs/guide-custom-blocks.md` | defineBlock, NodeView, toolbar items, registration |
| `packages/docs/guide-theming.md` | CSS custom properties, density presets, layout modes |
| `packages/docs/architecture-toolbar.md` | Toolbar state plugin, FormatBar, ContextMenu |
| `packages/docs/architecture-columnLayout.md` | Column resize, drag, separator, nesting |

## Contributor Skills

Step-by-step procedural guides for common tasks (contributor-facing, not shipped via npm):

| Skill | When to use |
|-------|-------------|
| `.agent/skills/add-block/` | Adding a new block type (defineBlock, NodeView, CSS, wiring) |
| `.agent/skills/add-mark/` | Adding a new inline mark (defineMark, keymap, schema) |
| `.agent/skills/modify-ui/` | Changing FormatBar, ContextMenu, BlockPicker, or toolbar state |
| `.agent/skills/fix-plugin/` | Fixing or adding ProseMirror commands and plugins |

## Consumer Skills (shipped via npm)

AI-agent-discoverable skills in `packages/{pkg}/skills/` — shipped with the npm package:

| Package | Skill | Purpose |
|---------|-------|---------|
| `@kanava/editor` | `kanava-core` | Initialize and configure the editor |
| `@kanava/editor` | `kanava-blocks` | Create custom blocks with defineBlock() |
| `@kanava/editor` | `kanava-security` | Security patterns for user-generated content |
| `@kanava/editor-react` | `kanava-react` | Integrate editor in a React app |
| `@kanava/editor-react` | `kanava-react-custom` | Build custom toolbar and UI components |

## Common Tasks (Quick Reference)

### Adding a new block type

1. Create `packages/core/src/blocks/myBlock.ts` using `defineBlock()` (see `.agent/skills/add-block/`)
2. Export from `packages/core/src/blocks/index.ts` and add to `builtInBlocks`
3. Add NodeView if needed in `packages/core/src/nodeViews/`
4. Add CSS in `packages/core/src/styles/editor.css`
5. Wire NodeView in `packages/core/src/editor.ts`
6. Run `pnpm -r build` to verify

### Adding a new mark

1. Create `packages/core/src/marks/myMark.ts` using `defineMark()`
2. Export from `packages/core/src/marks/index.ts` and add to `builtInMarks`
3. Run `pnpm -r build`

### Fixing a command or plugin

1. Identify the file in `packages/core/src/commands/` or `packages/core/src/plugins/`
2. Follow the Command type signature: `(state, dispatch?, view?) => boolean`
3. Run `pnpm -r build` to verify

### Modifying FormatBar or ContextMenu

1. If toolbar state logic changes, update `packages/core/src/plugins/toolbarState.ts` first
2. Edit the component in `packages/react/src/`
3. Update `packages/docs/architecture-toolbar.md` to reflect changes
4. Run `pnpm -r build`

## Plan Documents

| File | Purpose |
|------|---------|
| `docs/plans/MASTER-IMPLEMENTATION-PLAN.md` | Overall project roadmap (completed + upcoming phases) |
| `docs/plans/Architecture Plan.md` | Core architecture reference (schema, nesting, columns, toolbar, extension system) |
| `docs/Product Specs/Product Specification.md` | Product requirements and user-facing feature spec |
| `docs/plans/next-implementation-plan.md` | Current: Bug fixes & stabilization |
| `docs/plans/phases/` | Per-phase implementation details (7–10) |

After completing work, update the relevant plan document — change ⬜ to ✅ and add notes if the implementation deviated from the plan.

## MCP Servers

No project-specific MCP servers are required. Standard filesystem and terminal tools are sufficient. If needed, MCP servers for GitHub or other integrations can be configured in:

- **Claude Code**: `.claude/settings.json` or `~/.claude/settings.json`
- **Gemini CLI**: `~/.gemini/settings.json`
- **VS Code / Copilot**: VS Code settings under `mcp.servers`
