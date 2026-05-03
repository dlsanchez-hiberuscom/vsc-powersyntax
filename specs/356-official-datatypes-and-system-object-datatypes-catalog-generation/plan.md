# Plan — Spec 356 Official datatypes and system object datatypes catalog generation

## Phase 1 — Audit the gap

- [x] Confirm `B319` restored the generator rail but did not yet audit `datatypes` or `system-object-datatypes`.
- [x] Confirm `datatypes` remained manual-only and that `system-object-datatypes` still depended on the curated B285 slice.

## Phase 2 — Official audit/generation

- [x] Extend `officialCoverage.generated.ts` with `datatypes` and `system-object-datatypes`.
- [x] Cover the missing official alias `UnsignedInt`.
- [x] Materialize missing official `system-object-datatypes` in `generated.generated.ts`.
- [x] Emit `generatedBuiltinTypes.generated.ts` and align `PB_BUILTIN_TYPES` with the official vocabulary.

## Phase 3 — Validation

- [x] Rebuild the workspace after extending the generated exports.
- [x] Lock alias and generated-type behavior in `catalogV2.test.ts`.
- [x] Lock SD3 negative/positive behavior for generated official base types in `diagnostics.test.ts`.
- [x] Revalidate the real-corpus oracle on PFC Solution and OrderEntry.

## Phase 4 — Closure

- [x] Align backlog, current-focus, done-log, architecture, testing and the technical guide.