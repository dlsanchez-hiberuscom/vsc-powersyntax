# Plan — Spec 361 Semantic confidence calibration over real corpora

## Phase 1 — Locate the owning contract

- [x] Confirm that readiness/confidence thresholds already live in `featureReadiness.ts` and `queryScopePolicy.ts`.
- [x] Confirm that no corpus-driven calibration baseline existed yet.

## Phase 2 — Build the calibration baseline

- [x] Add a pure calibration report builder for false positives and false negatives.
- [x] Lock classification semantics in unit tests.
- [x] Freeze real low/medium/high scenarios from PFC, OrderEntry and legacy.

## Phase 3 — Review thresholds against evidence

- [x] Rebuild and run the focused calibration suites.
- [x] Confirm that current thresholds remain valid under the reviewed corpus baseline.

## Phase 4 — Closure

- [x] Align backlog, current-focus, done-log, testing and performance-budget.