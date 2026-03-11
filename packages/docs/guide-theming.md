---
anchored-to:
  - packages/core/src/styles/editor.css
  - packages/core/src/api/types.ts
  - packages/core/src/editorHelpers.ts
  - packages/core/src/editor.ts
last-verified: 2025-06-07
---

# Theming & Styling Guide

How to customize the Kanava editor's appearance using CSS custom properties and the `DocumentStyle` API.

## CSS custom properties

All visual aspects of the editor are controlled via `--kanava-*` CSS custom properties defined on `:root`.

> **Source of truth:** [`editor.css`](../core/src/styles/editor.css) (`:root` block, lines 19–70)

### Typography

| Property | Default | Purpose |
|----------|---------|---------|
| `--kanava-font-family` | system stack | Body font |
| `--kanava-font-mono` | monospace stack | Code blocks |
| `--kanava-font-size` | `16px` | Base body font size |
| `--kanava-line-height` | `1.6` | Base line height |

### Colors

| Property | Default | Purpose |
|----------|---------|---------|
| `--kanava-text-color` | `#1a1a1a` | Body text |
| `--kanava-text-muted` | `#666666` | Secondary text |
| `--kanava-bg-color` | `#ffffff` | Editor background |
| `--kanava-bg-hover` | `rgba(0,0,0,0.02)` | Hover states |
| `--kanava-bg-selected` | `rgba(55,53,177,0.08)` | Selected block bg |
| `--kanava-border-color` | `#e0e0e0` | Light borders |
| `--kanava-border-color-strong` | `#c0c0c0` | Strong borders |
| `--kanava-accent-color` | `#3735b1` | Accent (drag handles, column resize) |
| `--kanava-highlight-bg` | `#fff59d` | Highlight mark bg |
| `--kanava-link-color` | `#1976d2` | Link text |

### Shadows

| Property | Default | Purpose |
|----------|---------|---------|
| `--kanava-shadow-sm` | light | Small elevation |
| `--kanava-shadow-md` | medium | Medium elevation (toolbar) |
| `--kanava-shadow-lg` | heavy | Large elevation (modals) |

### Spacing

| Property | Default | Purpose |
|----------|---------|---------|
| `--kanava-block-padding-vertical` | `4px` | Vertical padding inside blocks |
| `--kanava-paragraph-gap` | `2px` | Space between blocks |
| `--kanava-indent-size` | `24px` | Indent step size |
| `--kanava-editor-padding` | `24px` | Editor container padding |

### Pagination (paginated mode)

| Property | Default | Purpose |
|----------|---------|---------|
| `--kanava-page-width` | `816px` | Page width |
| `--kanava-page-height` | `1056px` | Page height |
| `--kanava-page-margin-top` | `72px` | Top margin |
| `--kanava-page-margin-right` | `96px` | Right margin |
| `--kanava-page-margin-bottom` | `72px` | Bottom margin |
| `--kanava-page-margin-left` | `96px` | Left margin |

### Ghost Rail (hierarchy indicators)

| Property | Default | Purpose |
|----------|---------|---------|
| `--kanava-rail-depth-1` | `rgba(66, 133, 244, 0.5)` | Depth 1 rail color (blue) |
| `--kanava-rail-depth-2` | `rgba(0, 150, 136, 0.5)` | Depth 2 rail color (teal) |
| `--kanava-rail-depth-3` | `rgba(76, 175, 80, 0.5)` | Depth 3 rail color (green) |
| `--kanava-rail-depth-4` | `rgba(156, 39, 176, 0.5)` | Depth 4 rail color (purple) |
| `--kanava-rail-depth-5` | `rgba(255, 152, 0, 0.5)` | Depth 5+ rail color (orange) |

### Block-specific

| Property | Default | Purpose |
|----------|---------|---------|
| `--kanava-code-bg` | `#f5f5f5` | Code block background |
| `--kanava-quote-border-color` | `#d0d0d0` | Blockquote left border |
| `--kanava-callout-bg-info` | `#e3f2fd` | Info callout bg |
| `--kanava-callout-bg-warning` | `#fff3e0` | Warning callout bg |
| `--kanava-callout-bg-error` | `#ffebee` | Error callout bg |
| `--kanava-callout-bg-success` | `#e8f5e9` | Success callout bg |

### Column-specific

| Property | Default | Purpose |
|----------|---------|---------|
| `--kanava-sep-color` | accent color | Column separator line color |
| `--kanava-sep-width` | `2px` | Column separator line width |
| `--kanava-font-ui` | `"Inter", sans-serif` | UI font (menus, toolbar) |

## Applying a custom theme

Override variables on the editor container or `:root`:

```css
.my-editor-theme {
  --kanava-accent-color: #e91e63;
  --kanava-font-family: "Georgia", serif;
  --kanava-bg-color: #fafafa;
  --kanava-text-color: #333;
}
```

## DocumentStyle API

The `documentStyle` option and runtime methods set CSS custom properties programmatically.

> **Source of truth:** [`DocumentStyle`](../core/src/api/types.ts) interface and [`_applyDocumentStyle()`](../core/src/editor.ts)

```ts
// At creation
const editor = new KanavaEditor({
  element,
  documentStyle: { density: "comfortable" },
});

// Runtime update
editor.setDocumentStyle({ lineHeight: 1.4, paragraphGap: 6 });

// Read current
editor.getDocumentStyle();
```

The resolution order:
1. Density preset values (if `density` is set)
2. Explicit values override preset values
3. Applied as CSS custom properties: `--kanava-line-height`, `--kanava-paragraph-gap`, `--kanava-font-size`, `--kanava-font-family`

### Density presets

> **Source of truth:** [`DENSITY_PRESETS`](../core/src/editorHelpers.ts)

| Preset | `lineHeight` | `paragraphGap` | `fontSize` |
|--------|-------------|---------------|-----------|
| `tight` | 1.2 | 4 px | 14 px |
| `comfortable` | 1.5 | 8 px | 16 px |
| `relaxed` | 1.8 | 16 px | 18 px |

## Layout modes

The `layoutMode` option controls spacing density and drag handle style:

| Mode | Behavior |
|------|----------|
| `"standard"` | Comfortable spacing, visible drag handles (default) |
| `"compact"` | Zero padding/margin, minimal gaps — for WYSIWYG precision documents |

## CSS class naming conventions

- All editor classes use the `kanava-` prefix
- Block types: `.kanava-paragraph`, `.kanava-heading`, `.kanava-quote`, etc.
- Structural: `.kanava-editor`, `.kanava-block-node`, `.kanava-column-layout`
- UI: `.kanava-format-bar`, `.kanava-context-menu`, `.kanava-block-picker`

## Modular CSS imports

The editor CSS is modular — `editor.css` imports sub-files:

| File | Content |
|------|---------|
| `columns.css` | Column layout and resize handles |
| `ghost-rail.css` | Insert-between-blocks rail |
| `print.css` | Print media styles |
| `format-bar.css` | Floating toolbar |
| `context-menu.css` | Right-click menu |
| `fixed-toolbar.css` | Fixed toolbar |
| `toolbar-primitives.css` | Reusable toolbar atoms |
| `block-picker.css` | Slash-command picker |
| `paragraph-format-popover.css` | Paragraph format dialog |
| `separator-menu.css` | Column separator menu |
| `pagination.css` | Paginated mode styles |

> **Source of truth:** CSS imports at top of [`editor.css`](../core/src/styles/editor.css)
