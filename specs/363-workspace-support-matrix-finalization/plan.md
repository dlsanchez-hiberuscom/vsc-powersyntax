# Plan — Spec 363 Workspace support matrix finalization

## Phase 1 — Confirm the smallest owning slice

- [x] Confirm that the owning surface is the client-side health report builder, not the server.
- [x] Confirm that `RuntimeStatusStats` + `ApiSemanticWorkspaceManifest` are sufficient to derive the matrix without new server contracts.

## Phase 2 — Build the support contract

- [x] Add a pure support-matrix model that covers the required modes and limitations.
- [x] Lock the model semantics in a focused unit test.

## Phase 3 — Project the contract visibly

- [x] Render the matrix in the exported health report.
- [x] Lock the markdown projection and the real export path with unit + smoke validation.

## Phase 4 — Canonical closure

- [x] Align README, architecture, developer workflows and testing docs.
- [x] Move B293 out of the active backlog/current-focus into done-log with the executed evidence.