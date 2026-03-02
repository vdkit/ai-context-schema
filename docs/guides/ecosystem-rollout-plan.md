# Ecosystem Rollout Plan for Oxlint Blueprint Contract Workflow

## Goal

Roll out the Oxlint + `@vdk/oxlint-plugin-blueprints` workflow across the VDK ecosystem in the canonical order, while preserving deterministic schema contract enforcement and minimizing integration drift.

## Canonical Rollout Order

1. `ai-context-schema`
2. `VDK-Blueprints`
3. `VDK-CLI`
4. `VDK-Hub`
5. `VDK-Wiki`

This order follows the Ecosystem Operating Contract in `README.md`.

## Gate Criteria Per Repository

A repository is considered complete for rollout only when all of the following are true:

- Oxlint is configured and running in CI/local checks.
- `@vdk/oxlint-plugin-blueprints` rule is active for blueprint targets.
- deterministic fixer workflow is wired (dry-run + write).
- legacy ESLint-only blueprint lint flow is removed or replaced.
- docs contain lint/fix usage and contributor expectations.
- full repository checks pass.

## Step 1: ai-context-schema (Canonical Contract)

### Scope

- Keep schema contract authoritative (`schemaVersion`, `kind`, `version`, `id`, `platforms`).
- Maintain validator parity with plugin checks.
- Publish plugin usage pattern for downstream repos.

### Validation Commands

- `pnpm run lint`
- `pnpm run lint:blueprints:dry`
- `pnpm run lint:blueprints:fix`
- `pnpm run check`

### Exit Conditions

- All checks green.
- README/docs updated for lint/fix workflow.
- Plugin package integration verified.

## Step 2: VDK-Blueprints

### Scope

- Apply plugin contract checks to curated blueprint inventory.
- Normalize all blueprints with fixer.
- Prevent duplicate IDs and malformed frontmatter in CI.

### Expected Targets

- Blueprint directories containing YAML frontmatter artifacts.

### Exit Conditions

- Full blueprint corpus passes contract lint and format checks.
- Documentation updated for contributors.

## Step 3: VDK-CLI

### Scope

- Align runtime assumptions with contract enforcement from `ai-context-schema`.
- Ensure CLI retrieval/deploy logic expects normalized blueprint metadata.

### Exit Conditions

- CLI tests and checks pass with normalized blueprint inputs.
- No contract drift between parser/runtime behavior and schema/plugin rules.

## Step 4: VDK-Hub

### Scope

- Ensure ingest/search UX assumes canonical frontmatter shape.
- Validate indexing logic against normalized fields (`id`, `kind`, `version`, `schemaVersion`).

### Exit Conditions

- Hub checks pass.
- Ingestion/indexing stable with contract-compliant blueprints.

## Step 5: VDK-Wiki

### Scope

- Update documentation pages and examples to match v3 contract and lint workflow.
- Keep references aligned with plugin and schema contract behavior.

### Exit Conditions

- Docs checks pass.
- User-facing documentation reflects current lint/fix workflow.

## Drift Prevention

- Treat `ai-context-schema` as canonical source of truth.
- When contract changes, update all three in one sequence:
  1. schema (`context-schema.json`)
  2. validator (`validation/schema-validator.js`)
  3. plugin/fixer (`@vdk/oxlint-plugin-blueprints`)
- Re-run full checks after each sync step.

## Change Management

- Prefer incremental PRs per repository.
- Keep lint/fix migration commits isolated from unrelated refactors.
- Require green checks before moving to the next repository in order.
