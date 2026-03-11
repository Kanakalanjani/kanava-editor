---
name: add-playground-feature
description: Add a new feature or test scenario to the playground app. Use when demonstrating new editor capabilities or adding test fixtures.
---

# Add a Playground Feature

## When to use

- Demonstrating a new block type or editor feature
- Adding test data for development
- Creating a new page/view in the playground

## Key files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app — editor setup and composition |
| `src/main.tsx` | Entry point — mounts App |
| `src/styles.css` | Playground-specific styles |
| `src/components/EditorShell.tsx` | Editor container with FormatBar, ContextMenu, BlockPicker |
| `src/components/Header.tsx` | App header with mode/theme controls |
| `src/components/JsonPanel.tsx` | Live JSON viewer panel |
| `src/components/PageSetupDialog.tsx` | Page setup dialog |
| `src/components/StatusBar.tsx` | Status bar |
| `src/data/index.ts` | Demo document barrel exports |
| `src/data/article.ts` | Article demo document |
| `src/data/showcase.ts` | Feature showcase document |
| `src/hooks/usePlayground.ts` | Playground state management hook |

## Rules

1. **This is a dev tool** — don't over-engineer
2. **Never add reusable editor logic here** — put it in `@kanava/editor` or `@kanava/editor-react`
3. **Use `@kanava/editor` and `@kanava/editor-react` imports** — don't import from `prosemirror-*`

## Step-by-step

### 1. Add sample data

Create or edit files in `src/data/`:
```ts
export const myTestDocument: KanavaBlock[] = [
  { id: "1", type: "heading", attrs: { level: 1 }, content: [...], children: [] },
  // ...
];
```

### 2. Add a component (if needed)

Create in `src/components/`:
```tsx
export function MyFeatureDemo({ editor }: { editor: KanavaEditor }) {
  // ...
}
```

### 3. Wire into App.tsx

Import and render in `src/App.tsx`.

### 4. Override styles

Add playground-specific styles in `src/styles.css`.

### 5. Verify

```bash
pnpm --filter playground dev
```

## Verification checklist

- [ ] Feature renders correctly in the playground
- [ ] No ProseMirror direct imports (use `@kanava/editor` and `@kanava/editor-react` only)
- [ ] No reusable editor logic lives in the playground
- [ ] Dev server starts without errors: `pnpm --filter playground dev`
- [ ] Full build passes: `pnpm -r build`

## Common mistakes

1. **Importing from `prosemirror-*` directly** — use `@kanava/editor` re-exports
2. **Adding reusable editor commands here** — those belong in `@kanava/editor`
3. **Editing `@kanava/editor` or `@kanava/editor-react` files** — use the `add-block`, `fix-plugin`, or `modify-ui` skills instead
4. **Forgetting to add sample data** — new features need demo content in `src/data/`
