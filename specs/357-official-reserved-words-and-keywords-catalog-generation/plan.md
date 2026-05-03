# Plan — Spec 357 Official reserved words and keywords catalog generation

## Phase 1 — Identify the drift

- [x] Confirm the gap between `PB_KEYWORDS` and the canonical `keywords`/`reserved-words` domains.
- [x] Confirm that `pronouns` and `system-globals` should remain explicit parser blockers, not the primary source of the lexical domains.

## Phase 2 — Official generation

- [x] Parse the official Appeon reserved-words table and partition vocabulary into generated `keywords` and `reserved-words`.
- [x] Publish `keywords` and `reserved-words` coverage in `officialCoverage.generated.ts`.
- [x] Emit `generatedKeywordLexemes.generated.ts` and align `PB_KEYWORDS` with the canonical rail.

## Phase 3 — Validation

- [x] Rebuild code and tests after extending the generator rail.
- [x] Validate generated coverage and lexeme artifacts.
- [x] Lock `PUBLIC`, `COMMIT` and `PB_KEYWORDS` alignment in focused unit tests.

## Phase 4 — Closure

- [x] Align backlog, current-focus, done-log, architecture, testing and the technical guide.