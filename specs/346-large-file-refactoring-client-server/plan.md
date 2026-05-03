# Plan — Spec 346 Large-file refactoring

## Phase 1 — Inventory

- [x] Inventory largest TypeScript files and responsibility hotspots.
- [x] Confirm client/server/shared boundary guard exists.
- [x] Classify `extension.ts` and `server.ts` as high-responsibility entrypoints.

## Phase 2 — Safe extraction slice

- [x] Extract CodeLens result cache into a pure server feature module.
- [x] Add unit tests for hit/miss, LRU eviction and invalidation semantics.

## Phase 3 — Deferred full decomposition

- [ ] Split client command registration and activation surfaces under B346.
- [ ] Split server LSP handler registration under B347.
- [ ] Add large-file architecture metrics under B353.
- [ ] Decompose runtime orchestration under B354.