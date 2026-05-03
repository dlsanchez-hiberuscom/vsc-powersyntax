# Plan — Spec 353 Embedded SQL semantic anchors

## Phase 1 — Pin the owning abstraction

- [x] Confirm `sqlRegions` already detects embedded SQL regions and that the missing piece is the reusable anchor model, not statement discovery itself.
- [x] Confirm `currentObjectContext`, `powerBuilderCodeMetrics`, `powerBuilderTechnicalDebtReport` and `supportBundle` do not yet publish a shared anchor payload.

## Phase 2 — Shared anchor model

- [x] Add a shared `embeddedSqlAnchors` payload to the public API.
- [x] Build a reusable server helper on top of `findSqlRegions(...)` with transaction-target heuristics and confidence grading.

## Phase 3 — Surface projection

- [x] Expose anchors in current object context, code metrics and technical debt report.
- [x] Project anchors in the current object context panel and markdown reports.
- [x] Export sanitized anchors through the support bundle.

## Phase 4 — Closure

- [x] Add focused tests for context pack, metrics, debt report, panel model and support bundle.
- [x] Run `npm run build:test`.
- [x] Run the focused B291 mocha suites.
- [x] Align backlog, current-focus, done-log and workflow/domain docs.