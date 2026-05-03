# Plan — Spec 362 Catalog corpus validation over real corpora

## Phase 1 — Locate the owning contract

- [x] Confirm that real-corpus catalog validation did not exist yet as its own executable baseline.
- [x] Confirm the smallest usable probes on PFC, OrderEntry and legacy before editing.

## Phase 2 — Build the baseline contract

- [x] Add a pure report builder for hits, misses, ambiguities and budget violations.
- [x] Lock the report semantics in unit tests.

## Phase 3 — Freeze real-corpus evidence

- [x] Add a smoke test over PFC Solution, STD_FC_OrderEntry and the legacy PBL dump.
- [x] Freeze real probes for `system-globals`, `global-functions` and `datawindow-functions`.
- [x] Keep the budget gate on the warm/served path to avoid conflating catalog validation with cold parse cost already covered elsewhere.

## Phase 4 — Closure

- [x] Rebuild and run focused catalog and real-corpus suites.
- [x] Align backlog, current-focus, done-log, testing, performance-budget and the real-corpus baseline artifact.