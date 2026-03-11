---
name: kanava-core
description: Initialize and configure the @kanava/editor editor. Use when setting up a KanavaEditor instance, configuring options, density presets, pagination, or working with the editor API (getDocument, setDocument, exec, chain).
metadata:
  author: kanava
  version: "1.0"
  package: "@kanava/editor"
---

# Initialize & Configure @kanava/editor

## When to use

- Setting up a new `KanavaEditor` instance
- Configuring editor options (mode, pagination, density, placeholder)
- Working with the editor API (get/set content, focus, destroy)
- Integrating with vanilla JS/TS (no React)

## Key files

| File | Purpose |
|------|-------|
| `src/editor.ts` | `KanavaEditor` class — constructor, API methods, plugin wiring |
| `src/editorHelpers.ts` | `DENSITY_PRESETS`, `createEmptyDoc`, `CommandChain` |
| `src/api/types.ts` | `KanavaEditorOptions`, `DocumentStyle`, `KanavaDocument` |
| `src/extensions/schemaBuilder.ts` | `buildSchema()` — dynamic schema from definitions |

## Steps: Basic setup

### 1. Install

```sh
npm install @kanava/editor
```

### 2. Create editor

```ts
import { KanavaEditor } from "@kanava/editor";
import "@kanava/editor/dist/styles.css";

const editor = new KanavaEditor({
  element: document.getElementById("editor")!,
  placeholder: "Start writing...",
  onChange: (doc) => console.log("Content changed:", doc),
});
```

### 3. Configure document style

```ts
const editor = new KanavaEditor({
  element,
  documentStyle: { density: "comfortable" },
});

// Runtime update
editor.setDocumentStyle({ lineHeight: 1.4, paragraphGap: 6 });
```

Density presets (`src/editorHelpers.ts`):

| Preset | lineHeight | paragraphGap | fontSize |
|--------|-----------|-------------|---------|
| `tight` | 1.2 | 4 px | 14 px |
| `comfortable` | 1.5 | 8 px | 16 px |
| `relaxed` | 1.8 | 16 px | 18 px |

### 4. Load/save content

```ts
// Save
const doc = editor.getDocument(); // KanavaDocument JSON

// Load
editor.setDocument(doc);

// Debug — raw ProseMirror JSON
const raw = editor.getRawJSON();
```

### 5. Execute commands

```ts
import { toggleBold, toggleItalic } from "@kanava/editor";

editor.exec(toggleBold);

// Chain multiple commands
editor.chain()
  .command(toggleBold)
  .command(toggleItalic)
  .run();
```

### 6. Listen to events

```ts
const unsub = editor.on("change", (doc) => { /* save */ });
editor.on("selectionChange", (info) => { /* update UI */ });
editor.on("focus", () => { /* ... */ });
editor.on("blur", () => { /* ... */ });

// Unsubscribe
unsub();
```

### 7. Cleanup

```ts
editor.destroy();
```

## Configuration reference

See `src/api/types.ts` for the full `KanavaEditorOptions` interface. Key options:

- `blocks` / `marks` — custom definitions (defaults to built-ins)
- `mode: "paginated"` + `pagination` — paginated document mode
- `layoutMode: "compact"` — zero padding for precision documents
- `onImageUpload` — handle pasted/dropped images

## Plugin wiring order

Plugins are installed in this order in the constructor (`src/editor.ts`):

1. `kanavaInputRules` → 2. `kanavaKeymap` → 3. `blockIdPlugin` → 4. `listRenumberPlugin` → 5. `placeholderPlugin` → 6. `dragHandlePlugin` → 7. `selectionPlugin` → 8. `ghostRailPlugin` → 9. `clipboardPlugin` → 10. `imageUploadPlugin` → 11. `toolbarStatePlugin` → 12. pagination (conditional) → 13. `history` → 14. `dropCursor` → 15. `gapCursor`

## Common mistakes

- Calling `editor.getContent()` — the method is `editor.getDocument()`
- Forgetting to import CSS: `import "@kanava/editor/dist/styles.css"`
- Not calling `editor.destroy()` on cleanup
