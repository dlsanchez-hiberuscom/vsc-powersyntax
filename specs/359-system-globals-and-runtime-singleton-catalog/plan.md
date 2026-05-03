# Plan — Spec 359 System globals and runtime singleton catalog

## Phase 1 — Locate the hardcode

- [x] Confirm that `system-globals` existed in the catalog but lacked machine-readable type metadata.
- [x] Confirm that `semanticQueryService` and `signatureHelp` still hardcoded `SQLCA` instead of consuming the catalog.

## Phase 2 — Type the singleton catalog

- [x] Add `valueType`, `risk` and typed signatures to the curated `system-globals` entries.
- [x] Route qualifier resolution through `resolveSystemGlobal(...)` metadata.
- [x] Route argument-type inference in `signatureHelp` through `resolveSystemGlobal(...)` metadata.

## Phase 3 — Validation

- [x] Rebuild code and tests.
- [x] Lock typed metadata in `catalogV2.test.ts`.
- [x] Revalidate completion, hover, diagnostics and signature help.

## Phase 4 — Closure

- [x] Align backlog, current-focus, done-log, architecture, testing and the technical guide.