# Kanava Editor — Developer Docs

Detailed technical docs for contributors and AI agents working on the Kanava editor.

## Deep-Dive Architecture Docs

| Doc | Scope |
|-----|-------|
| [architecture-toolbar.md](architecture-toolbar.md) | Complete flow of FormatBar (floating toolbar) and ContextMenu — every file, function, state variable, and decision point |

## Where to Find Things

| What | Where |
|------|-------|
| Product specs | [`docs/Product Specs/`](../../docs/Product%20Specs/) |
| Implementation roadmap | [`docs/plans/MASTER-IMPLEMENTATION-PLAN.md`](../../docs/plans/MASTER-IMPLEMENTATION-PLAN.md) |
| Architecture overview | [`docs/plans/Architecture Plan.md`](../../docs/plans/Architecture%20Plan.md) |
| Phase plans | [`docs/plans/phases/`](../../docs/plans/phases/) |
| Core package rules | [`packages/core/.agent/rules/`](../core/.agent/rules/) |
| React package rules | [`packages/react/.agent/rules/`](../react/.agent/rules/) |
| Playground rules | [`apps/playground/.agent/rules/`](../../apps/playground/.agent/rules/) |

## Agent Skills Index

Root-level skills (in `.agent/skills/`):

| Skill | Use when |
|-------|---------|
| `add-block` | Adding a new block type via `defineBlock()` |
| `add-mark` | Adding a new inline mark via `defineMark()` |
| `fix-plugin` | Debugging editor behavior or adding plugins |
| `modify-ui` | Changing React toolbar/menu components |

Package-level skills:

| Skill | Package | Use when |
|-------|---------|---------|
| `add-command` | `@kanava/editor` | Adding a new ProseMirror command |
| `modify-nodeview` | `@kanava/editor` | Changing block rendering or DOM sync |
| `add-react-component` | `@kanava/editor-react` | Adding toolbar items, popovers, modals |
| `add-playground-feature` | `playground` | Adding test scenarios or demos |
