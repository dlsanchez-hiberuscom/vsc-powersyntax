# Tasks — Spec 346 Large-file refactoring

- [x] Capture large-file inventory.
- [x] Extract `CodeLensResultCache` from `server.ts`.
- [x] Replace server-local get/set/invalidate/stats helpers with the extracted cache.
- [x] Add `codeLensResultCache.test.ts`.
- [ ] Extract client command registration by domain.
- [ ] Extract server LSP handler registration by domain.
- [ ] Add architecture metrics guard for oversized files.
- [ ] Validate full refactor with smoke/performance real-corpus gates.