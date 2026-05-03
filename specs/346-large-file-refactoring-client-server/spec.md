# Spec 346: Large-file refactoring client/server

## Status

Partial supporting slice. This spec does not close B346 or B347.

## Backlog mapping

- B346 — Refactor client extension activation and command registration.
- B347 — Refactor server LSP handler registration.
- B353 — Large-file regression guard and architecture metrics.
- B354 — Server runtime orchestration decomposition.

## Objective

Reduce oversized entrypoint responsibility while preserving public behavior, command IDs, LSP method names, activation order, runtime policies and the thin-client architecture.

## Implemented slice

The first low-risk server slice extracts the CodeLens result LRU from `src/server/server.ts` into `src/server/features/codeLensResultCache.ts`.

## Constraints

- No changes to LSP method names.
- No changes to public command IDs.
- No semantic engine duplication.
- No client/server boundary relaxation.
- No runtime policy mutation without dedicated tests.

## Acceptance for full closure

- `extension.ts` command/activation responsibilities are split by clear client-side boundaries.
- `server.ts` handler/runtime responsibilities are split without changing initialization order.
- architecture import guards remain green.
- PFC Workspace, PFC Solution and STD/OrderEntry rapid validation pass or skip honestly because local corpora are absent.