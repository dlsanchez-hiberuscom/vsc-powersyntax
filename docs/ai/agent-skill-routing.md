# Agent / Skill Routing — PowerBuilder VS Code Plugin

## Purpose
Define which AI agent, skill or prompt should be used for each task.

Agents are session modes. Skills are task capabilities. Instructions are automatic path-scoped rules. Prompts are reusable workflows.

## Agents

### `planner`
Use for analysis and execution planning. It is read-only.

Typical output:
- scope;
- files/docs to inspect;
- ordered plan;
- validation checklist;
- recommended skills.

### `implementer`
Use for approved scoped changes that require edits.

Typical output:
- code/docs/tests changed;
- validation commands/results;
- risks and follow-up.

### `reviewer`
Use for read-only review of a branch, patch or PR.

Typical output:
- verdict;
- blockers;
- non-blocking issues;
- missing tests/docs;
- suggested fixes.

### `docs`
Use for documentation normalization, duplicate removal, link fixes and ownership cleanup.

### `release`
Use for CI, package scripts, VSIX, activation and release-readiness audits.

## Skills

### `powerbuilder-semantics`
Use for parser, symbols, scope resolution, inheritance, functions/events, variables, unresolved/unused/shadowing diagnostics, semantic tokens or signature help.

### `datawindow-analysis`
Use for DataWindow/DataStore, `.srd`, DWBuffer, Primary!, Delete!, Filter!, columns, controls, computed fields and generated-source safety.

### `catalog-maintenance`
Use for system catalogs, official symbols, diagnostic reason codes, localization source-of-truth and catalog compatibility.

### `performance-hotpath`
Use for activation, workspace discovery, indexing, parsing, cache invalidation, watchers, large fixtures and latency risks.

### `testing-validation`
Use for unit/integration/smoke/performance tests, fixtures and CI validation.

### `docs-governance`
Use for documentation ownership, duplicates, compatibility files, broken links and AI context reduction.

### `build-release`
Use for GitHub Actions, package scripts, VSIX, release-readiness, ORCA or PBAutoBuild.

### `official-research`
Use when official PowerBuilder, DataWindow, ORCA, PBAutoBuild, VS Code, LSP or Copilot behavior must be verified.

## Default recipes

### Implement a semantic diagnostic
Use `planner` → `implementer` → `reviewer` with `powerbuilder-semantics` and `testing-validation`.

### Fix DataWindow behavior
Use `planner` → `implementer` → `reviewer` with `datawindow-analysis`, `catalog-maintenance` and `testing-validation`.

### Normalize documentation
Use `docs` with `docs-governance`.

### Fix release workflow
Use `release` with `build-release`; switch to `implementer` only when edits are required.

### Research uncertain official behavior
Use `planner` with `official-research`; implement only after the expected behavior is clear.

## Creation rules
Create a new agent only if a new persistent session mode and distinct tool allowlist are required. Otherwise create/update a skill, instruction or prompt.
