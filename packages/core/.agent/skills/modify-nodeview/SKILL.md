---
name: modify-nodeview
description: Modify or create a ProseMirror NodeView in @kanava/editor. Use when changing block rendering, adding interactive elements, or fixing DOM sync issues.
---

# Modify or Create a NodeView

## When to use

- Changing how a block renders in the DOM
- Adding interactive controls to a block (resize handles, buttons)
- Fixing DOM sync issues when attrs change
- Creating a NodeView for a new block type

## Key concepts

All NodeViews extend `KanavaNodeView` base class which provides:
- `this.el(tag, className)` — create DOM elements
- `this.setAttrs(attrs)` — update node attributes via transaction
- `this.editor` — access to `KanavaEditor` instance
- `render(node)` — called once, return `{ dom, contentDOM }`
- `onUpdate(node)` — called on every node change, sync DOM

## Step-by-step

### 1. Location

All NodeViews live in `packages/core/src/nodeViews/`.

### 2. Create or modify

```ts
import { KanavaNodeView } from "./KanavaNodeView.js";
import type { Node as PMNode } from "prosemirror-model";

export class MyNodeView extends KanavaNodeView {
  render(node: PMNode) {
    // IMPORTANT: Initialize all instance fields HERE, not as class fields
    // (class fields run after super() but render() is called inside super())
    this.myField = [];

    const dom = this.el("div", "kanava-my-block");
    const contentDOM = this.el("div", "kanava-my-block-content");
    dom.appendChild(contentDOM);
    return { dom, contentDOM };
  }

  protected onUpdate(node: PMNode): void {
    // Sync DOM with changed attrs
  }
}
```

### 3. Wire in the block definition

In the block's `defineBlock()`:
```ts
nodeView: (node, view, getPos, editor) => new MyNodeView(node, view, getPos, editor),
```

### 4. Add CSS

In `packages/core/src/styles/editor.css`:
```css
.kanava-my-block { /* styles */ }
```

## Common mistakes

- **Class field initializers** — they run AFTER `super()` returns, but `render()` is called inside `super()`. Always initialize fields in `render()`.
- **Missing `contentDOM`** — if your block has editable text, you MUST return a `contentDOM`
- **`stopEvent()` too broad** — only stop events on your interactive elements, not all events
