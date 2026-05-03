# Plan — Spec 355 Restore official catalog generator and coverage v2

## Phase 1 — Pin the gap

- [x] Confirm the generator already computes coverage maps for global/object/datawindow functions but only serializes `system-events` and `statements`.
- [x] Confirm the current generator and wrapper paths already target `script/` and the current `src/server/knowledge/system` layout.

## Phase 2 — Generator repair

- [x] Extend the `officialCoverage.generated.ts` render step to include `global-functions`, `object-functions` and `datawindow-functions`.
- [x] Regenerate the official artifacts on the current layout.

## Phase 3 — Validation

- [x] Add a focused unit check that `officialCoverage.generated.ts` publishes the generated domains relevant to the current rail.
- [x] Run `catalogGeneratorScript.test.ts` and `catalogConsistency.test.ts` after regeneration.

## Phase 4 — Closure

- [x] Run `npm run build:test`.
- [x] Align backlog, current-focus, done-log, architecture, testing and the technical guide.