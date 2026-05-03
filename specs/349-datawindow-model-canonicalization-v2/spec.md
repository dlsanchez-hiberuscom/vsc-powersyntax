# Spec 349: DataWindow model canonicalization v2

## Status

Closed.

## Backlog mapping

- B287 — DataWindow model canonicalization v2.

## Objective

Consolidate a single canonical DataWindow model reused by the existing `.srd` consumers instead of reparsing snapshots per feature.

## Implemented scope

- `src/server/features/dataWindowModel.ts` owns the canonical `.srd` backbone for bands, table columns, `retrieve`, `retrieveArguments`, `report(...)` links and simple SQL references.
- The canonical parser now handles DataWindow escaped quotes (`~"`) inside quoted attributes and preserves balanced parenthesized unquoted types such as `char(40)` and `decimal(18,2)`.
- `dataWindowSafeMode` and `dataWindowBindingModel` stop reparsing raw snapshot text and reuse `buildDataWindowModelFromSnapshot()`.
- Existing consumers already wired to the same backbone remain aligned: legacy-safe hover/definition/documentSymbols, property paths, SQL lineage, Retrieve signature specialization, diagnostics, current object context, metrics and debt reports.

## Out of scope

- Extending the SQL parser beyond the current simple reference subset. That is owned by B288.
- DataWindow expression metadata/evaluator concerns. That is owned by B289.
- DataStore/DataWindow behavioral catalog enrichment. That is owned by B290.

## Acceptance evidence

- No server feature reparses `retrieve`, `retrieveArguments`, bands or `table(column=...)` metadata outside `dataWindowModel`.
- DataWindow safe mode, bindings and Retrieve specialization keep working through the canonical model.
- DataWindow-focused unit/golden tests and the architecture import guard remain green.