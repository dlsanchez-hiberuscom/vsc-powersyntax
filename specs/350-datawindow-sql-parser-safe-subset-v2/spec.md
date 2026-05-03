# Spec 350: DataWindow SQL parser safe subset v2

## Status

Closed.

## Backlog mapping

- B288 — DataWindow SQL parser safe subset v2.

## Objective

Extend the safe SQL parsing inside `dataWindowModel` so DataWindow `retrieve` statements support common aliases, simple joins and basic where clauses without opening a full SQL engine.

## Implemented scope

- `sqlReferences` now cover simple `select` aliases, `JOIN ... ON` conditions and basic `WHERE` predicates.
- Table aliases are resolved back to their defendible source table names when possible.
- Complex clauses with `select`, `exists`, `case` or `union` inside the condition path degrade to no extra references instead of inventing unsafe semantics.
- `dataWindowSqlLineage` and local `.srd` definition reuse that richer subset automatically through the canonical `dataWindowModel`.

## Out of scope

- Full SQL grammar support, nested query reasoning, function/type inference or expression evaluation.
- DataWindow expression metadata. That belongs to B289.
- Embedded SQL anchors outside `.srd` retrieve statements. That belongs to B291.

## Acceptance evidence

- A DataWindow retrieve with aliases, a simple join and a basic where clause yields stable `sqlReferences`.
- A complex where clause with subquery degrades honestly instead of emitting unsafe references.
- `dataWindowSqlLineage` and `.srd` definition stay aligned because both consume the same `dataWindowModel` subset.