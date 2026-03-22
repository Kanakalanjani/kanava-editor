# Repo Finalization and Release Automation Plan

Date: 2026-03-22
Primary repo: `C:\Projects\kanava-editor-npm-oss` (public)
Archive repo: `C:\Projects\kanava-editor` (private, deprecating)

## Goals

1. Finalize parity migration and push to primary public repo.
2. Keep archive repo snapshot aligned for historical reference.
3. Standardize release/version/tag flow with changesets.
4. Raise safety rails to enterprise-like quality while preserving solo-dev speed.

## Current State Summary

- CI exists and runs build + typecheck on push/PR to main.
- Release workflow exists but is check-only (`changeset status`) and does not publish.
- Changesets are configured with linked versions for:
  - `@kanava/editor`
  - `@kanava/editor-react`
- Private-file safeguards exist:
  - `.privatefiles`
  - `.githooks/pre-commit`
  - `scripts/setup-dev.ps1`

## Action Steps (Immediate)

### Step 1: Commit OSS Repo

Run in `C:\Projects\kanava-editor-npm-oss`:

```powershell
pnpm install
pnpm -r build
pnpm typecheck
git add -A
git status
git commit -m "chore: finalize parity merge and repo hardening"
```

Expected outcome:
- All migration/parity/security files committed on `main`.

### Step 2: Push OSS Repo

Run in `C:\Projects\kanava-editor-npm-oss`:

```powershell
git push origin main
```

Expected outcome:
- Public GitHub receives final parity commit.
- CI workflow runs automatically.

## Optional Immediate Follow-up

### Step 3: Commit + Push Archive Repo Snapshot

Run in `C:\Projects\kanava-editor`:

```powershell
pnpm install
pnpm -r build
pnpm typecheck
git add -A
git commit -m "chore: final parity snapshot before archive"
git push origin stitch-idea
```

Then archive repository in GitHub settings.

## Release and Versioning Model

### How versions are defined

Versioning and release metadata are controlled by:

- `.changeset/config.json`
- `.changeset/*.md`
- `packages/core/package.json`
- `packages/react/package.json`
- package changelogs (`CHANGELOG.md`)

Key config points:

- Linked versions are enabled for both packages.
- Apps are ignored for release (`playground`, `resume-builder`).

### Standard release flow

```text
Code change
  -> pnpm changeset (create release note + bump type)
  -> commit PR including .changeset file
  -> merge to main
  -> pnpm changeset version (bump package versions + changelogs)
  -> pnpm changeset publish (publish npm)
  -> pnpm changeset tag + git push --tags (GitHub tags)
```

## Gap Analysis vs Enterprise

### Strong today

- Deterministic monorepo builds.
- Changesets linked-version strategy.
- CI on push/PR.
- Local private-file commit prevention.

### Missing for enterprise parity

- Automated publish workflow (currently manual).
- Required PR check that enforces presence/validity of changesets.
- Branch protection hardening as mandatory governance.
- Release provenance/signing/SBOM.
- Test suite depth and coverage thresholds as release gate.

## Safety Rails Assessment

### Existing safeguards

- Build/typecheck gate in CI.
- Pre-commit blocklist for sensitive local files.
- Release readiness check workflow.

### Risks remaining

- Human-driven manual publish path can drift.
- No automatic tagging/release notes pipeline.
- No enforced release approval policy or canary path.

## Improvement Roadmap (Solo-Dev Friendly)

### P0 (now)

1. Add publish workflow using changesets action.
2. Require status checks before merge to main.
3. Add PR template checkbox: "Changeset added" for user-facing changes.

### P1 (next)

1. Add lint and test jobs to CI (minimal but strict).
2. Add npm trusted publishing/OIDC.
3. Auto-generate GitHub release notes from changelog.

### P2 (later)

1. Canary prerelease lane (`beta`) on merge.
2. Add smoke tests for app integration paths.
3. Add rollback playbook and incident checklist.

## GitHub Actions Upgrade Plan

### Target workflows

1. `ci.yml` (existing, keep and expand):
- install, build, typecheck, lint, tests

2. `release-check.yml` (existing):
- validate pending changesets and build health

3. `publish.yml` (new):
- trigger on push to main
- run changesets action
- create/update release PR when needed
- publish to npm when version commit is present
- push git tags

## Success Criteria

- OSS main has parity commit pushed and CI green.
- Archive repo snapshot optionally pushed, then archived.
- Release flow documented and reproducible by one person in < 10 minutes.
- No accidental leakage of local/private planning files.
- Next release requires only:
  - `pnpm changeset`
  - PR merge
  - automated workflow (after publish workflow is added)
