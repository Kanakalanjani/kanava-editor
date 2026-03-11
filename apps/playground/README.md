# Playground

Demo app showcasing all Kanava editor features. Used for visual testing and development.

## Run

```bash
pnpm --filter playground dev         # → http://localhost:5173
```

## Structure

```
src/
├── App.tsx              # Main app — mounts editor with FixedToolbar
├── main.tsx             # Vite entry point
├── styles.css           # Playground-specific styles (canvas, page gaps, layout)
├── components/          # App-specific components (EditorShell, etc.)
├── data/                # Sample documents and fixtures
└── hooks/               # App-specific hooks
```

## What it demonstrates

- Paginated mode with A4 page size, margins, page breaks
- FixedToolbar + FormatBar + ContextMenu + BlockPicker
- All 12 block types (paragraph, heading, image, columns, etc.)
- All 12 marks (bold, italic, font size, text color, etc.)
- Paragraph formatting popover
- Image editing (crop, rotate)
- Drag & drop between blocks
- Column resize with snap targets

## Notes

- This is a **development tool**, not a production app
- Styles in `styles.css` override core CSS for playground-specific look
- Sample data in `data/` provides realistic content for testing
