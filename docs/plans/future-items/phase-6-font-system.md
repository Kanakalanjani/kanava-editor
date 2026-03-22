# Phase 6: Font System

> **Priority**: 🔵 Lower — Builds on top of stable core
>
> **Status**: ⬜ Not started
>
> **Depends on**: Phase 1

---

## Goal

Provide typography infrastructure so consumers can register custom fonts and offer a rich font picker without building the plumbing themselves.

---

## Scope

### 6.1 — `registerFont()` API

```ts
editor.registerFont({
  name: "Inter",
  weights: [400, 500, 600, 700],
  src: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700",
  // OR local
  src: [{ url: "/fonts/Inter-Regular.woff2", weight: 400 }],
});
```

Injects `@font-face` CSS into the document.

### 6.2 — Bundled Open-Source Fonts

Ship these fonts as optional imports so consumers can opt-in:

```ts
import { interFont, merriweatherFont, robotoMonoFont } from "@kanava/editor/fonts";
editor.registerFont(interFont);
```

### 6.3 — Font Picker Data

Export a `FontRegistry` that UI components can query:

```ts
const fonts = editor.fonts; // FontDefinition[]
// Each has: name, weights, category ("serif" | "sans-serif" | "monospace")
```

### 6.4 — Google Fonts Integration Helper

Optional utility to register Google Fonts by name:

```ts
import { googleFont } from "@kanava/editor/fonts";
editor.registerFont(googleFont("Playfair Display", [400, 700]));
```

---

## Files to Create / Change

| File | Change |
|------|--------|
| `api/fonts.ts` | **[NEW]** Font registration API and types |
| `fonts/` | **[NEW]** Bundled font definitions |
| `editor.ts` | Add `registerFont()`, `fonts` accessor |
| `index.ts` | Export font APIs |

## Verification

- Register a custom font → text using that font renders correctly
- Bundled fonts load on opt-in
- Font picker UI can display registered fonts
- Fonts work in both pageless and paginated modes
- Print/export renders fonts correctly
