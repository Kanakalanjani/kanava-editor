# Contributing to Kanava Editor

Thank you for your interest in contributing! Kanava is a ProseMirror-based block editor SDK.

## Prerequisites

- **Node.js** >= 18
- **pnpm** >= 9
- **Git**

## Getting Started

```bash
git clone https://github.com/Kanakalanjani/kanava-editor.git
cd kanava-editor
pnpm install
pnpm -r build
pnpm dev          # starts playground at localhost:5173
```

## Monorepo Structure

```
packages/core/     @kanava/editor       — headless engine (ProseMirror, zero UI)
packages/react/    @kanava/editor-react  — React UI components
apps/playground/   Demo app using both packages
```

## Making Changes

1. **Branch** from `main`: `git checkout -b feat/my-feature`
2. **Code style**: TypeScript strict, named exports only, `.js` extensions in imports
3. **Build**: Run `pnpm -r build` to verify your changes compile
4. **Changeset**: Run `pnpm changeset` and describe your change

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — maintenance, tooling, docs
- `refactor:` — code restructuring without behavior change

### Adding a Changeset

Every user-facing change needs a changeset so it appears in the CHANGELOG:

```bash
pnpm changeset
# Select affected packages (@kanava/editor, @kanava/editor-react, or both)
# Choose bump type (patch, minor, major)
# Write a short description of the change
```

This creates a `.changeset/*.md` file — commit it with your PR.

## Pull Request Process

1. One feature/fix per PR
2. Include a changeset (if user-facing)
3. Link the issue if applicable
4. Ensure `pnpm -r build` passes
5. Keep PRs focused — large refactors should be discussed in an issue first

## What NOT to Submit

These files are maintained by the core team:
- `.agent/rules/` configuration
- Root `package.json` scripts
- `.changeset/config.json`

## Code Patterns

If you're adding blocks, marks, or plugins, read the relevant skill guide first:

- Adding a block: `.agent/skills/add-block/SKILL.md`
- Adding a mark: `.agent/skills/add-mark/SKILL.md`
- Fixing plugins: `.agent/skills/fix-plugin/SKILL.md`
- Modifying UI: `.agent/skills/modify-ui/SKILL.md`

## Questions?

Open a [GitHub Discussion](https://github.com/Kanakalanjani/kanava-editor/discussions) or file an issue.
