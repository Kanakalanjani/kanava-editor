````skill
---
name: create-skill
description: Create or audit agent skills following the agentskills.io open standard. Use when adding a new SKILL.md, auditing existing skills for quality, or converting documentation into actionable skills.
metadata:
  author: kanava
  version: "1.0"
---

# Create or Audit a Skill

## When to use

- Creating a new SKILL.md for a common agent task
- Auditing an existing skill for quality and compliance
- Converting reference documentation into an actionable skill
- Reviewing skills before committing to the repo

## Quick reference: agentskills.io format

```
my-skill/
  SKILL.md          ← Required (the only required file)
  scripts/          ← Optional helper scripts
  references/       ← Optional context files
  assets/           ← Optional images/data
```

SKILL.md structure:
```markdown
---
name: my-skill                    # Required: lowercase, hyphens, 1-64 chars
description: One-line trigger.    # Required: 1-1024 chars, third person
metadata:                         # Optional
  author: team-name
  version: "1.0"
---

# Title

Body content (< 500 lines recommended)
```

## Step-by-step: Creating a new skill

### 1. Determine if it's actually a skill

A skill is a **procedural task** an agent performs repeatedly. Apply this test:

| Question | Skill | Documentation |
|----------|-------|---------------|
| Does it have a clear start and end? | ✅ | ❌ |
| Are there discrete steps to follow? | ✅ | ❌ |
| Can the result be verified? | ✅ | ❌ |
| Would an agent use it mid-task? | ✅ | ❌ |
| Is it primarily reference/lookup? | ❌ | ✅ |

If it fails 2+ checks → it belongs in a README, rules file, or architecture doc instead.

### 2. Choose the right location

| Scope | Location | Example |
|-------|----------|---------|
| Whole monorepo | `.agent/skills/{name}/SKILL.md` | add-block, fix-plugin |
| Single package | `packages/{pkg}/.agent/skills/{name}/SKILL.md` | add-command, modify-nodeview |
| Single app | `apps/{app}/.agent/skills/{name}/SKILL.md` | add-playground-feature |

### 3. Write the frontmatter

```yaml
---
name: do-the-thing
description: Do X in the Kanava editor. Use when Y happens or user requests Z.
metadata:
  author: kanava
  version: "1.0"
---
```

Rules:
- `name`: lowercase with hyphens, use gerund ("adding") or noun phrase ("block-creation")
- `description`: Third person. Include trigger phrase ("Use when..."). Be specific enough that an agent can decide whether to load this skill.
- Never exceed 1024 chars for description.

### 4. Write the body

Follow this template:

```markdown
# {Action Title}

## When to use

- Bullet list of 2-4 trigger conditions
- Each bullet starts with a verb or "When..."

## Prerequisites (optional)

Read `path/to/file.md` to understand X.

## Step-by-step

### 1. {First action}

Explanation + code snippet.

### 2. {Second action}

...

## Verification checklist

- [ ] Thing 1 works
- [ ] Thing 2 works
- [ ] Build passes: `pnpm -r build`

## Common mistakes

- Forgetting X — causes Y
- Using Z instead of W — breaks because...
```

### 5. Apply quality criteria

Before committing, verify:

- [ ] **Actionable**: Has numbered steps an agent can follow mechanically
- [ ] **Verifiable**: Has a verification checklist or build command
- [ ] **Concise**: Under 500 lines (ideally under 200)
- [ ] **Scoped**: One task per skill, not a kitchen-sink reference
- [ ] **Code snippets**: Show the exact pattern to follow, not abstract descriptions
- [ ] **Common mistakes**: Lists 2-4 pitfalls to avoid
- [ ] **No hardcoded paths**: Uses relative paths or describes where to find things
- [ ] **Trigger-clear**: "When to use" section lets an agent decide in < 5 seconds

### 6. Validate frontmatter

- `name` matches directory name
- `name` is lowercase, hyphens only, 1-64 chars
- `description` is 1-1024 chars
- No `allowed-tools` unless the skill genuinely needs tool restrictions
- File is wrapped in ` ````skill ` fences (Kanava convention)

## Step-by-step: Auditing an existing skill

### 1. Apply the "is it a skill?" test from step 1 above

If it fails → recommend converting to documentation (rules file, architecture doc, or README).

### 2. Check structure compliance

| Check | Pass criteria |
|-------|--------------|
| Frontmatter present | `name` + `description` fields exist |
| Name format | Lowercase, hyphens, 1-64 chars |
| Description quality | Third-person, includes trigger phrase |
| Step-by-step section | Numbered steps with code examples |
| Verification | Checklist or build command at the end |
| Conciseness | Under 500 lines |
| Common mistakes | 2+ pitfalls listed |

### 3. Rate actionability

| Rating | Criteria |
|--------|----------|
| **A — Excellent** | Agent can follow steps blindly and produce correct output |
| **B — Good** | Steps are clear but need minor judgment calls |
| **C — Needs work** | Mix of reference + procedure; split recommended |
| **D — Documentation** | Not a skill; convert to README/rules/architecture doc |

### 4. Write audit findings

For each skill, produce:
```
**{name}** — Rating: {A|B|C|D}
- Location: {path}
- Strengths: ...
- Issues: ...
- Recommendation: {keep | improve | convert to docs | merge with X}
```

## Anti-patterns to avoid

1. **Kitchen-sink skill**: Combines unrelated tasks (e.g., "add-block-and-handle-events"). Split into separate skills.
2. **Pure reference**: Lists APIs, types, or configs without procedural steps. Move to architecture docs.
3. **Too many options**: Presents 5+ approaches without recommending one. Pick a default path.
4. **Windows paths in examples**: Use forward slashes and relative paths only.
5. **Stale code patterns**: Shows patterns that don't match the current codebase. Always verify snippets.
6. **Missing verification**: No way for the agent to confirm success. Always end with a build/test step.
7. **Overly verbose**: Explains ProseMirror fundamentals or TypeScript basics. Only add context the agent doesn't already have.

## Kanava-specific conventions

- Wrap entire SKILL.md content in ` ````skill ` fences
- All code examples must use `.js` extensions on imports
- Use `pnpm -r build` as the standard verification command
- Reference rules files as `Read .agent/rules/X.md` in prerequisites
- CSS class prefix: `kanava-`
- Named exports only in examples
- Use `import type` for type-only imports in examples

````
