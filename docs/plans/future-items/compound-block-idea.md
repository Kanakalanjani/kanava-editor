# Compound Blocks — Research & Planning

> **Status**: Deferred. This document captures all research and architectural thinking for when compound blocks are implemented.  
> **Created**: 2026-03-08  
> **Context**: Decision 4 from `next-implementation-plan.md`. Deferred to keep implementation simple.

---

## What are compound blocks?

Multi-block structures that behave as a unit. For example, "Experience Entry" in a resume:
- Job Title (Heading 3)
- Company — Dates (Paragraph, styled)
- Achievement bullets (Bullet List Items)

Currently, users create these manually by inserting individual blocks one by one. A compound block system would let them insert the full structure at once and potentially manipulate it as a group.

---

## Three goals

### 1. JSON Resume schema integration

The resume builder should align with the [JSON Resume](https://jsonresume.org/schema) open standard (v1.0.0, MIT, 2.3k GitHub stars).

**JSON Resume sections** (each maps to a potential compound block type):

| Section | Schema fields | Potential compound block |
|---------|--------------|------------------------|
| `basics` | name, label, image, email, phone, url, summary, location, profiles[] | **Header Section** — Name, title, contact info, links |
| `work[]` | name, position, url, startDate, endDate, summary, highlights[] | **Experience Entry** — Title, company, dates, achievements |
| `education[]` | institution, url, area, studyType, startDate, endDate, score, courses[] | **Education Entry** — School, degree, dates, courses |
| `skills[]` | name, level, keywords[] | **Skills Group** — Category name, skill tags |
| `awards[]` | title, date, awarder, summary | **Award Entry** — Title, organization, date, description |
| `certificates[]` | name, date, issuer, url | **Certificate Entry** — Name, issuer, date |
| `publications[]` | name, publisher, releaseDate, url, summary | **Publication Entry** — Title, publisher, date |
| `languages[]` | language, fluency | **Language Entry** — Language, proficiency |
| `volunteer[]` | organization, position, url, startDate, endDate, summary, highlights[] | **Volunteer Entry** — Same shape as work |
| `projects[]` | name, startDate, endDate, description, highlights[], url | **Project Entry** — Title, dates, description, highlights |
| `interests[]` | name, keywords[] | **Interest Entry** — Category, keywords |
| `references[]` | name, reference | **Reference Entry** — Name, text |

**Import/Export flow:**
- **Import**: Parse `resume.json` → Create Kanava document with compound blocks mapped from each section array
- **Export**: Walk Kanava document → Extract compound blocks → Serialize to JSON Resume format
- This requires a bidirectional mapping between Kanava's block tree and JSON Resume's flat section arrays

**Package**: `@jsonresume/schema` (npm) provides validation.

### 2. Grouped / compound blocks in the editor

Three architectural approaches were identified:

#### Approach 1 — Template-and-Release

`defineCompoundBlock()` is a command factory. Inserting "Experience Entry" creates 4 independent `blockNode`s (heading, paragraph, bullets). After insertion, they're regular blocks with no grouping.

```
blockNode > heading3 "Job Title"
blockNode > paragraph "Company — 2020–Present"
blockNode > bulletListItem "Achievement 1"
blockNode > bulletListItem "Achievement 2"
```

- **Schema impact**: Zero
- **Drag-and-drop**: Each block moves independently
- **Deletion**: Deleting the heading doesn't affect bullets
- **JSON**: Standard flat array

#### Approach 2 — Permanent Container

A `compoundBlock` node type wraps child blocks:

```
blockNode > compoundBlock("experienceEntry") > blockGroup [
  blockNode > heading3 "Job Title"
  blockNode > paragraph "Company — 2020–Present"
  blockNode > bulletListItem "Achievement 1"
]
```

- **Schema impact**: High — new node type, content constraints, buildSchema() changes
- **Drag-and-drop**: Whole compound moves as one
- **Deletion**: Can enforce constraints (min children, required first child type)
- **JSON**: Nested structure

#### Approach 3 — Visual Grouping via `compoundId` attr

Template-and-release for the data model (flat blocks), but a `compoundId` attr on each blockNode tracks which compound they belong to. A decoration plugin draws visual grouping (dashed border). Canvas mode can optionally select all blocks in a group.

```
blockNode { compoundId: "exp-1" } > heading3 "Job Title"
blockNode { compoundId: "exp-1" } > paragraph "Company"
blockNode { compoundId: "exp-1" } > bulletListItem "Achievement"
```

- **Schema impact**: Low — one new attr on blockNode
- **Drag-and-drop**: Plugin detects group, offers "move section"
- **Deletion**: Decoration adjusts to remaining blocks
- **JSON**: Flat array with `compoundId` attrs (consumers can ignore)

#### Recommendation (preliminary)

Approach 3 (visual grouping via `compoundId`) is the strongest middle ground:
- Keeps the document model flat and simple
- Enables section-as-unit selection in canvas mode
- Maps cleanly to JSON Resume sections (each section's blocks share a compoundId)
- Consumers who don't care about compounds can ignore the attr entirely
- The decoration plugin and group-selection logic in `interactionMode` provide the UX benefit

Approach 2 is more powerful for enforcing structure but adds significant schema complexity. Could be a v2 evolution if strict constraints are needed.

### 3. Block versioning (tagged variants)

Same compound block (e.g., "Experience Entry") could have multiple tagged visual variants:
- **Compact** — Single line: "Title | Company | Dates" + hidden achievements
- **Detailed** — Multi-line: Title, Company—Dates, bullet achievements
- **Timeline** — Left-aligned dates, right-aligned content

**How this could work:**
- Each variant is a different template that creates different blocks (or the same blocks with different blockNode attrs)
- A `variant` attr on the compound grouping identifies which layout is in use
- Switching variants could rearrange/restyle blocks within the compound
- This is complex — defer to after the basic compound system works

---

## Implementation sketch (when un-deferred)

### Phase A: `defineCompoundBlock()` API in `@kanava/editor`

```ts
export const ExperienceEntry = defineCompoundBlock({
  name: "experienceEntry",
  label: "Experience Entry",
  icon: "💼",
  group: "resume",
  // Template: creates these blocks when inserted
  template: [
    { type: "heading", level: 3, placeholder: "Job Title" },
    { type: "paragraph", placeholder: "Company — Start Date – End Date" },
    { type: "bulletListItem", placeholder: "Key achievement or responsibility" },
    { type: "bulletListItem", placeholder: "Another achievement" },
  ],
  // Optional: variants
  variants: {
    detailed: { /* template above */ },
    compact: { /* single-line template */ },
  },
});
```

### Phase B: `compoundId` tracking on blockNode

- Add `compoundId: string | null` attr to `blockNode` in `structuralNodes.ts`
- The `defineCompoundBlock()` insertion command stamps all created blocks with the same `compoundId` (UUID)
- A decoration plugin draws grouping visuals for blocks sharing a `compoundId`

### Phase C: JSON Resume import/export (app-level)

- `apps/resume-builder/src/utils/jsonResumeImport.ts` — Parse resume.json, create Kanava doc
- `apps/resume-builder/src/utils/jsonResumeExport.ts` — Walk doc, extract compounds, serialize
- Use `@jsonresume/schema` for validation

### Phase D: Block versioning

- Add `variant: string | null` attr to `blockNode` (or to the compoundId tracker)
- UI for switching variants (style the same data differently)
- Template definitions for each variant

---

## Related resources

- JSON Resume schema: https://jsonresume.org/schema (v1.0.0)
- JSON Resume GitHub: https://github.com/jsonresume/resume-schema (MIT, 2.3k stars)
- JSON Resume npm: `@jsonresume/schema` (includes validation)
- Job Description schema: https://jsonresume.org/job-description-schema (draft)
- Other standards: HR-XML, Europass

---

## Open questions

1. Should `compoundId` be on `blockNode` (schema-level) or tracked separately in plugin state (zero schema impact)?
2. How do compound blocks interact with column layouts? Can a compound span columns?
3. Should compound constraints (min children, required types) be enforced live or only at insertion time?
4. How does the DocumentTree display compounds? As collapsible groups?
5. Can a block belong to multiple compounds? (Probably not — one `compoundId` per block.)
