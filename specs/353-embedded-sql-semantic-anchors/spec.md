# Spec 353: Embedded SQL semantic anchors

## Status

Closed.

## Backlog mapping

- B291 — Embedded SQL semantic anchors.

## Objective

Reuse the existing `sqlRegions` and transaction-context lane to publish explainable embedded SQL anchors with `confidence` across current-object context, code metrics, technical debt hotspots and supportability exports.

## Implemented scope

- `src/server/features/embeddedSqlAnchors.ts` builds a reusable anchor model on top of `findSqlRegions(...)` and infers `transactionTarget` from `CONNECT/DISCONNECT USING ...` or `SQLCA` with `high`/`medium`/`low` confidence.
- `currentObjectContext`, `powerBuilderCodeMetrics` and `powerBuilderTechnicalDebtReport` now expose `embeddedSqlAnchors` in their public payloads without inventing a new SQL parser or faking transaction certainty.
- The current object context panel, code-metrics/debt markdown exports and the offline support bundle now surface those anchors in user-facing artifacts.
- Focused tests lock the reusable anchor payload, the panel projection and sanitized support-bundle export.

## Out of scope

- New diagnostic IDs for embedded SQL. B291 reuses the existing transaction-binding lane and read-only evidence.
- Dynamic SQL taxonomy beyond the current heuristics. That remains owned by B312.
- A full SQL parser or cursor lifecycle engine beyond the existing `sqlRegions` lane.

## Acceptance evidence

- Current object context exposes at least one embedded SQL anchor with keyword, range, preview, confidence and transaction target when the binding is defendible.
- Code metrics and technical debt report surface the same anchor model for affected objects.
- Support bundle exports sanitized current-object, metrics and debt-report payloads carrying those anchors.
- Focused mocha suites pass for context pack, metrics, debt report, panel model and support bundle.