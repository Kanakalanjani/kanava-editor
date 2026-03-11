# Demo Data

The playground includes 3 demo documents defined in `src/data/`. Each demo uses the `KanavaDocument` format.

## Showcase Demo

**File**: `src/data/showcase.ts`
**Purpose**: Tests every block type and formatting mark.
**Contents**: Paragraphs, headings (H1-H6), bullet/numbered/check lists, code block, blockquote, image, divider, toggle, callout, column layout. All marks: bold, italic, underline, strike, code, link, text color, highlight, font size, font family, superscript, subscript.

## Article Demo

**File**: `src/data/article.ts`
**Purpose**: Realistic long-form content with mixed layout.
**Contents**: Headings, flowing paragraphs, embedded images, 2-column layout, code blocks, blockquotes.

## Resume Demo

**File**: `src/data/resume.ts`
**Purpose**: Dense document testing pagination attributes.
**Contents**: Tight spacing, section headings with `keepWithNext: true`, experience items with `pageBreakBefore`, compact bullet lists.
**Default mode**: Paginated (Letter size).

## Adding a New Demo

1. Create `src/data/myDemo.ts` exporting a `KanavaDocument`
2. Add entry to `src/data/index.ts`:
   ```ts
   { id: "my-demo", title: "My Demo", icon: "🎯", content: myDemoDoc, defaultMode: "pageless" }
   ```
3. The playground automatically picks up new entries in the `DEMOS` array.
