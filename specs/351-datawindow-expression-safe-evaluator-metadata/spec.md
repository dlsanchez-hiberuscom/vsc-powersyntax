# Spec 351: DataWindow expression safe evaluator metadata

## Status

Closed.

## Backlog mapping

- B289 — DataWindow expression safe evaluator metadata.

## Objective

Model safe DataWindow expression metadata and dependencies from `.srd` without evaluating runtime values or introducing a second parser outside `dataWindowModel`.

## Implemented scope

- `src/server/features/dataWindowModel.ts` extends the canonical `.srd` backbone with named controls plus expression nodes extracted from `expression=` and quoted dynamic `~t...` attributes.
- Expression dependencies are classified conservatively as `table-column`, `control` or `unresolved` using only canonical DataWindow evidence already present in the same model.
- `src/server/features/completion.ts` now serves focused completion inside `.srd` expression bodies on top of that same canonical metadata.
- `src/server/features/diagnostics.ts` emits a conservative warning when an expression dependency cannot be resolved as a known table column or named control of the same DataWindow.

## Out of scope

- DataStore/DataWindow behavioral catalog enrichment. That is owned by B290.
- Embedded SQL semantic anchors outside the current `retrieve` subset. That is owned by B291.
- Any runtime evaluator, value synthesis or speculative DataWindow execution.

## Acceptance evidence

- No separate DataWindow parser was added outside `dataWindowModel`.
- `.srd` completion and diagnostics reuse the same expression metadata.
- Focused model/completion/diagnostics tests stay green on the new fixtures.