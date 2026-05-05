# AGENTS.md — PowerBuilder VS Code Plugin

## Mission
Build a professional VS Code extension for PowerBuilder 2025/PowerScript with fast discovery, safe semantic analysis, LSP-first architecture, DataWindow awareness and AI-readable evidence.

## Non-negotiables
- Keep activation and editor hot paths fast: no full workspace scans, heavy parsing, ORCA/PBAutoBuild discovery or large fixture loading during activation.
- The LSP/server/core layers own semantic truth. The VS Code client stays thin.
- Prefer incremental indexing, targeted cache invalidation and atomic state updates.
- Diagnostics, completions and quick fixes based on inference must preserve source origin, confidence and reason code.
- Do not invent PowerBuilder APIs, DataWindow properties, system constants, ORCA behavior or PBAutoBuild flags.
- Preserve catalog compatibility: stable IDs, domains, kinds, namespaces and query behavior unless an explicit migration exists.
- Treat DataWindow generated source as a distinct domain, not as normal PowerScript.
- Update affected documentation with every code/spec/backlog change.

## Read first
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/architecture-status.md`
- `docs/ai-context/powerbuilder-plugin-context.md`
- The owner document for the touched area.

## Default workflow
1. Identify scope, owner docs and validation gates.
2. Inspect existing code, tests and docs before editing.
3. Implement the smallest safe change.
4. Add or update tests.
5. Update affected docs.
6. Run validation and report exact commands/results.

## Forbidden
- Broad rewrites without explicit scope.
- TODO-only implementations.
- Weakening tests to pass CI.
- Mandatory CI dependencies on private/local fixtures without a documented gate.
- Duplicating source-of-truth content across docs.
