# Playground Features

The Kanava playground (`apps/playground`) is a demo application that showcases the full capabilities of `@kanava/editor` and `@kanava/editor-react`.

## Layout

- **Header** — Logo, demo tabs, density switcher, mode toggle, page setup gear, JSON viewer
- **FixedToolbar** — Full formatting toolbar from `@kanava/editor-react`
- **BlockPicker** — Sticky sidebar listing all available block types
- **Editor Canvas** — The editor itself with FormatBar + ContextMenu overlays
- **StatusBar** — Shows current block type and active marks
- **PageSetupDialog** — Modal for page size, margins, orientation
- **JsonPanel** — Floating panel showing live document JSON

## Controls

### Density Switcher
Three presets that call `editor.setDocumentStyle({ density })`:

| Preset | Icon | Line Height | Block Gap | Font Size |
|--------|------|-------------|-----------|-----------|
| Tight | ⊟ | 1.2 | 4px | 14px |
| Comfortable | ⊞ | 1.5 | 8px | 16px |
| Relaxed | ⊡ | 1.8 | 16px | 18px |

The ℹ info button shows a popover with the active preset's values.

### Mode Toggle
- **Pageless** — Continuous scrolling document
- **Paginated** — Page-by-page view with page breaks

### Page Setup
Configures: page size (Letter, A4, Legal, custom), margins (top, right, bottom, left), and orientation (portrait, landscape).

## Demos

| Demo | ID | Description | Default Mode |
|------|----|-------------|-------------|
| Showcase | `showcase` | All block types and formatting marks | Pageless |
| Article | `article` | Long-form article with headings, images, and columns | Pageless |
| Resume | `resume` | Dense resume with pagination attributes | Paginated |
