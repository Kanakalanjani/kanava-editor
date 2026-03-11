# Kanava Editor — Skill Audit Report

> **Date**: Post-improvement audit
> **Total contributor skills**: 8 (in `.agent/skills/` and sub-packages)
> **Total consumer skills**: 5 (in `packages/{pkg}/skills/`, shipped via npm)

---

## Architecture

Kanava follows a two-layer skill architecture:

1. **Consumer skills** — ship via npm in `packages/{pkg}/skills/`. Referenced by the `agents` field in `package.json`. AI agents discover these for end-users of the packages.
2. **Contributor skills** — live in `.agent/skills/` (root and sub-packages). Guide agents contributing to the codebase. Never shipped.
3. **Living docs** — wiki-like guides in `packages/docs/`. Referenced by both skill layers via cross-links.

## Contributor Skills

### Root (`.agent/skills/`)

| Skill | Rating | Status |
|-------|--------|--------|
| `add-block` | A | ✅ Enhanced — merged kanava-blocks content (built-in blocks table, registration pattern, further reading) |
| `add-mark` | A | ✅ Unchanged — model skill |
| `fix-plugin` | A | ✅ Improved — added full 15-plugin wiring order, diagnostic flow, hot-spot table, 2 extra common mistakes |
| `modify-ui` | A | ✅ Improved — added 5 common mistakes |
| `create-skill` | A | ✅ Unchanged — meta-skill for creating new skills |

### Sub-package

| Skill | Rating | Location |
|-------|--------|----------|
| `add-command` | A | `packages/core/.agent/skills/add-command/` |
| `modify-nodeview` | A | `packages/core/.agent/skills/modify-nodeview/` |
| `add-react-component` | A | `packages/react/.agent/skills/add-react-component/` |
| `add-playground-feature` | A | `apps/playground/.agent/skills/add-playground-feature/` — improved with key files table, verification checklist, common mistakes |

## Consumer Skills (shipped via npm)

| Package | Skill | Location |
|---------|-------|----------|
| `@kanava/editor` | `kanava-core` | `packages/core/skills/kanava-core/SKILL.md` |
| `@kanava/editor` | `kanava-blocks` | `packages/core/skills/kanava-blocks/SKILL.md` |
| `@kanava/editor` | `kanava-security` | `packages/core/skills/kanava-security/SKILL.md` |
| `@kanava/editor-react` | `kanava-react` | `packages/react/skills/kanava-react/SKILL.md` |
| `@kanava/editor-react` | `kanava-react-custom` | `packages/react/skills/kanava-react-custom/SKILL.md` |

These are proper actionable skills with steps, key files tables, architecture context, and common mistakes sections. They cross-reference `packages/docs/` guides for deeper context.

## Living Docs

| Guide | Anchored to |
|-------|-------------|
| `packages/docs/guide-initialization.md` | `editor.ts`, `editorHelpers.ts`, `api/types.ts` |
| `packages/docs/guide-document-model.md` | `api/types.ts`, `api/blockTree.ts`, `schema/structuralNodes.ts` |
| `packages/docs/guide-react-integration.md` | `hooks.ts`, `KanavaEditor.tsx`, `FormatBar.tsx`, `ContextMenu.tsx`, `BlockPicker.tsx` |
| `packages/docs/guide-custom-blocks.md` | `extensions/defineBlock.ts`, `blocks/index.ts`, `nodeViews/KanavaNodeView.ts`, `editor.ts` |
| `packages/docs/guide-theming.md` | `styles/editor.css`, `api/types.ts`, `editorHelpers.ts`, `editor.ts` |
| `packages/docs/architecture-toolbar.md` | 7 source files (see frontmatter) |
| `packages/docs/architecture-columnLayout.md` | 8 source files (see frontmatter) |

## Doc-Sync Guardrails

- **Mapping table**: `.agent/rules/workflow.md` — 9-row table linking code areas to doc files
- **@see JSDoc tags**: 8 key source files have `@see packages/docs/...` tags
- **YAML frontmatter**: Each guide has `anchored-to` listing source files and `last-verified` date

## Changes Made

### Phase 1: Doc-sync guardrails
- Rewrote workflow.md Doc Sync Rules section with mapping table
- Added @see JSDoc tags to 8 source files
- Added YAML frontmatter to architecture docs

### Phase 2: Living docs
- Created 5 new guide files in `packages/docs/`
- Created `.agent/rules/security.md`

### Phase 3: Consumer skills
- Created 5 consumer skills in `packages/{core,react}/skills/`

### Phase 4: B-rated improvements
- fix-plugin: Added 15-plugin wiring order, diagnostic flow, hot-spot table
- modify-ui: Added 5 common mistakes
- add-playground-feature: Added key files table, verification checklist, common mistakes

### Phase 5: Merge + cleanup
- Merged kanava-blocks unique content into add-block skill

### Phase 6: Hygiene
- Fixed core README (`getContent()` → `getDocument()`)
- Added Documentation + AI Agent Support sections to both READMEs
- Updated AGENTS.md with security.md, living docs table, consumer skills table
- Updated CLAUDE.md with security.md reference
