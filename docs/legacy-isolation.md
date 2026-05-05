# Legacy Isolation Policy

## Owner

This document owns the policy for [plugin_old](../plugin_old). The implementation map records architecture evidence in [docs/architecture-implementation-map.md](architecture-implementation-map.md), status risks live in [docs/architecture-status.md](architecture-status.md), and actionable debt lives in [docs/technical-debt-inventory.md](technical-debt-inventory.md).

## Policy

`plugin_old` is `Reference-only`.

Allowed uses:

- read historical code to understand heuristics, edge cases and fixtures;
- cite it as evidence in specs, reviews and tests;
- derive new modern tests from observed legacy behavior;
- compare behavior during audits without importing runtime code.

Forbidden uses:

- runtime imports from `src/**` into `plugin_old/**`;
- dynamic `import()` or `require()` from product code into `plugin_old/**`;
- blind copy/paste of old providers, parsers, indexes or catalog code;
- using `plugin_old` as semantic truth for current LSP behavior;
- shipping `plugin_old` inside the VSIX.

## Extraction Contract

Any heuristic extracted from `plugin_old` needs all of the following before implementation:

1. Legacy evidence: file, behavior and edge case.
2. Modern owner: parser, `SemanticQueryFacade`, `DataWindowFastContext`, presentation, catalog, build rail or another current owner.
3. New or updated tests proving the behavior on the modern surface.
4. Documentation update when architecture, validation, public contract or workflow changes.
5. Done-log or technical-debt inventory trace once the extraction closes.

The implementation must adapt the idea to current contracts. It must not port old object models, providers, caches or workspace indexes wholesale.

## Guardrail

[test/server/unit/architectureImports.test.ts](../test/server/unit/architectureImports.test.ts) blocks `src/**` imports to `plugin_old/**`, including static imports, dynamic `import()` and CommonJS `require()`. This guard is part of the architecture validation lane and protects the runtime boundary.

Tests, docs, scripts and audit tooling may read `plugin_old` as reference material when explicitly scoped.

## Removal Policy

Do not delete `plugin_old` during opportunistic cleanup. Removal requires a dedicated spec with:

- inventory of remaining unique heuristics or fixtures;
- proof that modern tests cover the migrated behavior;
- VSIX/package verification;
- rollback plan;
- documentation update.
