# Phase 4: Compound Block Infrastructure

> **Priority**: 🟢 Medium — Enables domain-specific block compositions
>
> **Status**: ⬜ Not started
>
> **Depends on**: Phase 1

---

## Goal

Enable defining grouped/nested blocks as first-class compositions. A compound block is a block that internally contains multiple child blocks with a defined structure — e.g., an "Experience Entry" that always contains a title, company, date range, and bullet list.

Also subsumes the deferred **S5: Style Definitions System** — named paragraph/character styles.

---

## Scope

### 4.1 — Compound Block API

Extend `defineBlock()` or create `defineCompoundBlock()`:

```ts
export const ExperienceEntry = defineCompoundBlock({
  name: "experienceEntry",
  label: "Experience",
  icon: "💼",
  children: [
    { type: "heading", level: 3, placeholder: "Job Title" },
    { type: "paragraph", placeholder: "Company • Location" },
    { type: "bulletListItem", min: 1, placeholder: "Describe your work..." },
  ],
});
```

### 4.2 — Style Definitions System (S5)

Named paragraph and character styles:

```ts
interface ParagraphStyle {
  name: string;
  blockAttrs: Partial<BlockNodeAttrs>;
  defaultMarks?: Partial<MarkAttrs>;
}
```

Ship built-in styles: Normal, Heading 1–6, Title, Subtitle, Quote.

### 4.3 — Resume-Relevant Examples

Build example compound blocks that demonstrate the API:
- Experience Entry
- Education Entry
- Skills Group
- Contact Header

These serve as both tests and documentation.

---

## Files to Create / Change

| File | Change |
|------|--------|
| `extensions/defineCompoundBlock.ts` | **[NEW]** Compound block definition API |
| `extensions/defineBlock.ts` | Extend for composition support |
| `api/styles.ts` | **[NEW]** Style Definitions types and registry |
| `index.ts` | Export new APIs |

## Verification

- Define a compound block → renders as a structured group of child blocks
- Child blocks follow the defined template
- Compound block appears in BlockPicker
- Drag/drop moves the entire compound block
- Style Definitions apply block + mark attrs in one command
