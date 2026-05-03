# Spec 358: Operators, pronouns and enumerated values catalog hardening

## Status

Closed.

## Backlog mapping

- B324 — Official operators, pronouns and enumerated values catalog generation.

## Objective

Harden `operators`, `pronouns` and `enumerated-values` as explicit catalog domains, keep their provenance clear, add useful lookup aliases for identifier-based consumers, and block accidental overlaps with the official `keywords`/`reserved-words` rail.

## Implemented scope

- `enumeratedValues.ts` now emits aliases without `!` for the curated enumerated types, so identifier-based consumers can resolve `SaveAsType`, `WindowType` or `Encoding` back to `SaveAsType!`, `WindowType!` and `Encoding!`.
- `catalogV2.test.ts` locks that identifier-based resolution path for `SaveAsType`.
- `catalogV2.test.ts` also locks the absence of lookup-key overlaps between `operators`/`pronouns`/`enumerated-values` and the official `keywords`/`reserved-words` domains closed in B322.

## Out of scope

- Runtime singleton/system-global enrichment. That remains in B325.
- Additional semantic-tokens consumption for these domains. That can be layered later if needed.
- Reserved words / keywords official coverage. That was closed in B322.

## Acceptance evidence

- Enumerated values resolve through aliases without the `!` suffix.
- Pronouns/operators/enumerated-values remain distinct from `keywords`/`reserved-words` in lookup space.
- Focused catalog validation stays green.