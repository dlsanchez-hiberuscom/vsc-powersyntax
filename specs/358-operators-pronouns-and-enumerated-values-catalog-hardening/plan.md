# Plan — Spec 358 Operators, pronouns and enumerated values catalog hardening

## Phase 1 — Find the real drift

- [x] Confirm that pronouns already resolve through the canonical catalog.
- [x] Confirm that identifier-based consumers cannot resolve enumerated values without the `!` suffix.

## Phase 2 — Domain hardening

- [x] Add useful lookup aliases for curated enumerated values.
- [x] Add overlap guards between `operators`/`pronouns`/`enumerated-values` and the official `keywords`/`reserved-words` domains.

## Phase 3 — Validation

- [x] Rebuild code and tests.
- [x] Lock alias resolution for `SaveAsType`.
- [x] Revalidate `catalogV2.test.ts` end-to-end.

## Phase 4 — Closure

- [x] Align backlog, current-focus, done-log, architecture, testing and the technical guide.