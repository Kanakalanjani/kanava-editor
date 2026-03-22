# Roadmap

> Last updated: 2026-03-09

## Current Status

| Phase / Session | Status | Key Deliverables |
|-----------------|--------|------------------|
| Phase 1: Layout Primitives | ✅ Complete | `DocumentStyle`, density presets, CSS variable chain |
| Phase 2: API Polish | ✅ Complete | JSDoc, `package.json` metadata, `.npmignore` |
| Session 3: Playground Polish | ✅ Complete | Density switcher, React skills, `.agent/memory/` |
| Session 4: Image System (A+B) | ✅ Complete | Paste/drop fix, filters, crop presets, adjustments |
| Ghost Rail | ✅ Complete | `ghostRailPlugin`, hierarchy indicators via decorations |
| Column Resize Rework | ✅ Complete | Drag resize, gutter positioning, separator customization |
| Separator Menu | ✅ Complete | `SeparatorMenu` React component, style/color/width controls |
| Fixed Toolbar | ✅ Complete | `FixedToolbar` Word-style toolbar component |
| Convergence Sprint 1 (Ghost Rail UX) | ✅ Complete | Code complete, UX deferred to DocumentTree |
| Convergence Sprint 2 (Column Polish) | ✅ Complete | separatorPadding, width labels, min/max, keyboard a11y |
| NI Sprint 1 (Core API + Resume) | ✅ Complete | `blockNodeAttrs` in SelectionInfo, `resetBlockFormatting()`, sidebar, localStorage, JSON export/import, DocumentStats, BlockPicker wiring |
| NI Sprint 2 (Canvas Mode) | ✅ Complete | `interactionModePlugin`, CSS left-edge tax removal, block keyboard shortcuts |
| NI Sprint 3 (DocumentTree + BlockPicker) | ✅ Complete | `documentStructurePlugin`, `<DocumentTree>`, enhanced `<BlockPicker>` with categories/search/descriptions |
| Phase 7: Canvas Mode Bug Fixes (S1) | ✅ Complete | Click race fix, background scoping, alignment bleed guard |
| Phase 9: Column Resize Production (S2) | ✅ Complete | 60px min-width, pixel labels, gap-aware calc, visual feedback |

## Next Priorities

1. **Phase 10: Resume Builder Stabilization** (S3) — Fix margin/undo (Bug 6b), `setPaginationConfig()` API, image crop (Bug 6a)
2. **Phase 8: Block Multi-Selection** (S5) — `MultiBlockSelection` class, cross-block drag, decorations, keyboard ops
3. **S4: Light Theme + Resume Polish** — CSS custom properties, collapsible sidebars, EDIT/PREVIEW, templates

## Future Phases

- **Phase 4: Compound Block Infrastructure** — See `docs/plans/phases/phase-4-compound-blocks.md`
- **Phase 5: Missing Block Types (Table)** — See `docs/plans/phases/phase-5-block-types.md`
- **Phase 6: Font System** — See `docs/plans/phases/phase-6-font-system.md`

## Pre-Publish Blockers

- ~~No `LICENSE` file yet~~ — LICENSE not yet created; see `docs/licensing-checklist.md`
- ~~`@changesets/cli` not set up~~ — ✅ Installed and configured (`.changeset/config.json` exists, `linked` versioning)
- Repository URL in dev repo `package.json` still uses `ashu704` — sync script patches to `Kanakalanjani` for OSS. Update dev repo URL when GitHub username migration is confirmed
- npm publish blocked on auth — granular tokens can't create new packages. Need classic automation token for first publish
