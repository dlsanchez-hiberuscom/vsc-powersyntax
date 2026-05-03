# Spec 352: DataStore/DataWindow behavioral catalog v2

## Status

Closed.

## Backlog mapping

- B290 — DataStore/DataWindow behavioral catalog v2.

## Objective

Align the behavioral metadata for core DataWindow/DataStore APIs so `hover`, `signatureHelp`, `completion` and `diagnostics` consume one owner-scoped catalog instead of leaking flat-name fallbacks.

## Implemented scope

- The manual DataWindow catalog entries for `Describe`, `Modify`, `Retrieve`, `SetTransObject`, `Update`, `GetChild` and `SetTrans` now publish richer signatures, parameter documentation and `risk` metadata.
- `GetChild` applies only to DataWindow control and DataStore, not to `DataWindowChild`.
- `hover` and `signatureHelp` stop falling back to `findSystemSymbol(name)` when a qualified owner is already known.
- `diagnostics` emits `sd2UnresolvedCallable` for owner mismatch on qualified DataWindow behavioral calls such as `DataWindowChild.GetChild(...)`.
- Focused tests lock owner-scoped completion/hover/signatureHelp/diagnostics behavior and the enriched `Update(...)` metadata.

## Out of scope

- Embedded SQL anchors outside DataWindow retrieve calls. That is owned by B291.
- Official catalog generation and coverage beyond the curated DataWindow slice. That remains in B319-B321/B322-B336.
- New DataWindow expression/property catalog domains. That remains in B320/B327.

## Acceptance evidence

- DataStore completion exposes `Retrieve`, `Update`, `SetTrans`, `SetTransObject`, `Describe`, `Modify` and `GetChild`.
- `DataWindowChild` does not offer or explain `GetChild`.
- `Update(...)` hover/signatureHelp expose richer documentation and risk metadata.
- Diagnostics warns on owner mismatch for qualified DataWindow behavioral calls.