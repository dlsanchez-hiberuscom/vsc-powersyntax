# Plan — Spec 350 DataWindow SQL parser safe subset v2

## Phase 1 — Identify the bottleneck

- [x] Confirm `sqlReferences` only parsed the `SELECT` list and ignored aliases, joins and where clauses.

## Phase 2 — Safe subset expansion

- [x] Add alias resolution for simple table aliases.
- [x] Parse simple `JOIN ... ON` references.
- [x] Parse basic `WHERE` references.
- [x] Keep the parser conservative and read-only.

## Phase 3 — Honest degradation

- [x] Detect complex condition clauses with subquery/control keywords and degrade instead of overclaiming.

## Phase 4 — Consumer validation

- [x] Add focused tests for the canonical model.
- [x] Add focused lineage coverage.
- [x] Add local `.srd` definition coverage over aliased SQL references.
- [x] Align docs and move the canonical focus to B289.