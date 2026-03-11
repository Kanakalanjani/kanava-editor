---
name: add-react-component
description: Add or modify a React component in @kanava/editor-react. Use when adding toolbar items, popover panels, or new UI surfaces for the editor.
---

# Add a React Component

## When to use

- Adding a new toolbar, popover, or modal component
- Adding a new UI surface that interacts with the editor
- Creating a new primitive UI atom

## Rules

1. **Import from `@kanava/editor`, never from `prosemirror-*`** directly
2. **Use `editor.exec(command)` to dispatch**, not raw ProseMirror view
3. **Use `useToolbarState(editor)` for reactive state**
4. **Export props interface** alongside the component
5. **Named exports only** — no default exports

## Step-by-step

### 1. Create the component

In `packages/react/src/MyComponent.tsx`:

```tsx
import { useToolbarState } from "./hooks.js";
import type { KanavaEditor } from "@kanava/editor";

export interface MyComponentProps {
  editor: KanavaEditor;
}

export function MyComponent({ editor }: MyComponentProps) {
  const toolbarState = useToolbarState(editor);
  // ... render UI ...
}
```

### 2. Export from barrel

In `packages/react/src/index.ts`:
```ts
export { MyComponent } from "./MyComponent.js";
export type { MyComponentProps } from "./MyComponent.js";
```

### 3. CSS

Add styles in `packages/core/src/styles/editor.css` with `.kanava-` prefix.
Or in the component file as inline styles if minimal.

### 4. Verify

```bash
pnpm -r build
```

## Existing patterns to follow

- **Toolbar buttons**: See `ToolbarPrimitives.tsx` → `ToolbarButton`
- **Popovers**: See `ParagraphFormatPopover.tsx` — portal-based, outside-click close
- **Modals**: See `ImageEditorModal.tsx` — portal overlay with backdrop
- **Event-driven**: See `FormatBar.tsx` — uses `editor.on()` / `editor.emit()` for cross-layer communication
