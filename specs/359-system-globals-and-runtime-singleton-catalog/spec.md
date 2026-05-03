# Spec 359: System globals and runtime singleton catalog

## Status

Closed.

## Backlog mapping

- B325 — System globals and runtime singleton catalog.

## Objective

Publish machine-readable type, risk and context for `system-globals` and runtime singletons so completion, hover, diagnostics and signature help can consume catalog metadata instead of hardcoded name checks.

## Implemented scope

- `systemGlobals.ts` now provides `valueType`, `risk` and typed signatures for `SQLCA`, `SQLSA`, `SQLDA`, `Error` and `Message`.
- `resolveQualifierType(...)` now resolves qualifier type from `resolveSystemGlobal(...)` instead of hardcoding `SQLCA`.
- `signatureHelp.ts` now infers argument type from `system-globals` metadata instead of hardcoding `sqlca`.
- Focused tests lock typed catalog metadata, SQLCA hover/completion behavior, diagnostics acceptance and overload selection through `system-globals` metadata.

## Out of scope

- Contextual completion policy expansion. That remains in B330.
- Corpus calibration and catalog validation. Those remain in B283/B336.
- Additional runtime globals beyond the current singleton set.

## Acceptance evidence

- `system-globals` entries expose `valueType` and `risk`.
- Completion and signature help no longer depend on an inlined `SQLCA -> transaction` rule.
- Hover, completion, diagnostics and signature help stay green with the typed singleton catalog.