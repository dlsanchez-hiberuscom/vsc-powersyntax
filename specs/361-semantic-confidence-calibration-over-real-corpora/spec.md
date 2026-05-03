# Spec 361: Semantic confidence calibration over real corpora

## Status

Closed.

## Backlog mapping

- B283 — Semantic confidence calibration over real corpora.

## Objective

Turn the existing readiness/confidence policy into an executable calibration over PFC, OrderEntry and the public legacy corpus, with an explicit false-positive/false-negative baseline per feature.

## Implemented scope

- `confidenceCalibration.ts` builds a calibration report that compares reviewed feature expectations against `decideFeatureReadiness(...)` and classifies deviations as false positives or false negatives.
- `confidenceCalibration.test.ts` locks the baseline semantics and feature summaries.
- `confidenceCalibration.smoke.test.ts` indexes PFC, OrderEntry and legacy, freezes real `low`, `medium` and `high` scenarios, and verifies the current thresholds against them.
- The calibration keeps current thresholds unchanged because the reviewed corpus baseline stays at `0 false positives / 0 false negatives`.

## Out of scope

- Catalog coverage validation by domain. That remains in B336.
- Workspace support matrix finalization. That remains in B293.
- Query engine algorithm changes beyond the reviewed confidence baseline.

## Acceptance evidence

- Real corpora provide stable `low`, `medium` and `high` confidence scenarios.
- The calibration report stays at `0 false positives / 0 false negatives`.
- Feature thresholds remain reviewed and executable instead of implicit.