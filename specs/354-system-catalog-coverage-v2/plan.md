# Plan — Spec 354 System catalog coverage v2

## Phase 1 — Pin the gap

- [x] Confirm frequent runtime ancestors from PFC/OrderEntry still fail `resolveDatatype(...)` even when generated owner types or members already exist.
- [x] Confirm the smallest high-value fix lives in `systemObjectDatatypes.ts`, with parser alignment in `PB_BUILTIN_TYPES`.

## Phase 2 — Curated runtime expansion

- [x] Add the HTTP/JSON/OAuth runtime cluster used directly in OrderEntry/PFC.
- [x] Expand curated visual/service/runtime types until the corpus-backed ancestor check leaves only project/custom types unresolved.

## Phase 3 — Surface validation

- [x] Add catalog tests for representative curated runtime types.
- [x] Add visible completion/hover coverage for representative new system types.
- [x] Add a semantic golden locking the shared catalog lane.

## Phase 4 — Closure

- [x] Run `npm run build:test`.
- [x] Run the focused B285 mocha suites.
- [x] Align backlog, current-focus, done-log and the technical guide.