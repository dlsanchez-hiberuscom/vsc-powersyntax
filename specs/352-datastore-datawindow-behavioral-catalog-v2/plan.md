# Plan — Spec 352 DataStore/DataWindow behavioral catalog v2

## Phase 1 — Pin the mismatch

- [x] Confirm `GetChild` owner applicability from official Appeon docs.
- [x] Confirm `hover` and `signatureHelp` still fall back to flat-name lookup after owner-scoped resolution fails.

## Phase 2 — Catalog hardening

- [x] Restrict `GetChild` to DataWindow control and DataStore.
- [x] Enrich `Describe`, `Modify`, `Retrieve`, `SetTransObject`, `Update`, `GetChild` and `SetTrans` with richer signatures, docs and risk metadata.

## Phase 3 — Surface alignment

- [x] Remove flat-name fallback from `hover` when the qualifier owner is already known.
- [x] Remove flat-name fallback from `signatureHelp` when the qualifier owner is already known.
- [x] Add focused diagnostics for owner mismatch on qualified DataWindow behavioral calls.

## Phase 4 — Closure

- [x] Add focused tests for completion, diagnostics, hover and signatureHelp.
- [x] Run `npm run build:test`.
- [x] Run the focused B290 mocha suite.
- [x] Align backlog, current-focus, done-log and the technical guide.