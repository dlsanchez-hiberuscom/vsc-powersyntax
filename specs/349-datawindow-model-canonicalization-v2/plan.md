# Plan — Spec 349 DataWindow model canonicalization v2

## Phase 1 — Locate duplicated `.srd` parsing

- [x] Confirm `dataWindowSafeMode` still reparsed `retrieve`, columns and bands from raw snapshot text.
- [x] Confirm `dataWindowBindingModel` still reparsed `arguments=(...)` / `ARG(...)` from raw snapshot text.

## Phase 2 — Canonical backbone hardening

- [x] Move `retrieveArguments` into `dataWindowModel`.
- [x] Harden quoted attribute parsing for DataWindow escaped quotes `~"`.
- [x] Preserve balanced parenthesized unquoted attribute values such as `char(40)`.

## Phase 3 — Consumer alignment

- [x] Make `dataWindowSafeMode` project its summary from `buildDataWindowModelFromSnapshot()`.
- [x] Make `dataWindowBindingModel` reuse canonical `retrieveArguments`.
- [x] Keep existing DataWindow surfaces on the same backbone without adding a second parser.

## Phase 4 — Closure

- [x] Add focused regression coverage in `dataWindowModel.test.ts`.
- [x] Run focused DataWindow validation.
- [x] Align spec/backlog/done-log/current-focus and technical docs.