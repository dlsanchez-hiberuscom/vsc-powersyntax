# Spec 356: Official datatypes and system object datatypes catalog generation

## Status

Closed.

## Backlog mapping

- B323 — Official datatypes and system object datatypes catalog generation.

## Objective

Officialize `datatypes` and `system-object-datatypes` on top of the restored generator rail, covering critical aliases and aligning the parser fast-path with the relevant official type vocabulary.

## Implemented scope

- `script/generate_official_function_catalog.cjs` now audits `datatypes` and `system-object-datatypes` in `officialCoverage.generated.ts`, with both domains reaching zero missing units.
- The generator extends `generated.generated.ts` with missing official `system-object-datatypes` and emits `generatedBuiltinTypes.generated.ts` so `PB_BUILTIN_TYPES` can stay aligned with official names without runtime registry lookups on the parser hot path.
- `UnsignedInt` is now covered as an alias for `UnsignedInteger`.
- Focused tests lock alias resolution, generated official types, SD3 behavior and the PFC/OrderEntry real-corpus smoke.

## Out of scope

- Official generation for `keywords`, `reserved-words`, operators, pronouns or enumerated values. That remains in B322/B324.
- Runtime catalog curation itself. That was closed in B285.
- Function/event coverage restoration. That was closed in B319.

## Acceptance evidence

- `officialCoverage.generated.ts` reports `missingCount = 0` for `datatypes` and `system-object-datatypes`.
- Official missing system types are materialized in `generated.generated.ts`.
- `generatedBuiltinTypes.generated.ts` keeps the parser fast-path aligned with official type names.
- Unit validation and the real-corpus oracle smoke remain green.