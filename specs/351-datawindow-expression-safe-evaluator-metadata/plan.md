# Plan — Spec 351 DataWindow expression safe evaluator metadata

## Phase 1 — Canonical expression metadata

- [x] Confirm `dataWindowModel` did not expose safe expression metadata or dependency classification.
- [x] Extend the canonical backbone with named controls and expression nodes for `expression=` and `~t...` attributes.

## Phase 2 — Consumer reuse

- [x] Reuse canonical expression metadata for focused completion inside `.srd` expression bodies.
- [x] Reuse the same metadata for conservative diagnostics on unresolved expression dependencies.

## Phase 3 — Closure

- [x] Add focused regression coverage in `dataWindowModel.test.ts`, `completion.test.ts` and `diagnostics.test.ts`.
- [x] Run focused validation.
- [x] Align spec/backlog/done-log/current-focus and technical docs.