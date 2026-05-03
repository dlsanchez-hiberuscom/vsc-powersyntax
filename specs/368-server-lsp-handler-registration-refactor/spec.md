# Spec 368: Server LSP handler registration refactor

## Status

Closed.

## Backlog mapping

- B347 — Refactor server LSP handler registration.

## Objective

Descomponer `src/server/server.ts` en boundaries explícitos de lifecycle, document handlers, feature handlers y command routing, manteniendo el entrypoint como bootstrap y runtime orchestration sin cambiar el contrato observable del servidor.

## Implemented scope

- `src/server/handlers/featureHandlers.ts` registra ahora `documentSymbol`, `hover`, `workspaceSymbol`, `definition`, `references`, `signatureHelp`, `completion`, `semanticTokens`, `codeAction`, `codeLens` y `rename` con contexto explícito inyectado desde `server.ts`.
- `src/server/handlers/documentHandlers.ts` concentra `onDidOpen`, `onDidChangeContent`, `onDidClose`, watcher bridge y `onShutdown`, preservando invalidación, diagnósticos y serving cache.
- `src/server/handlers/lifecycleHandlers.ts` concentra `onInitialize` y `onInitialized`, incluyendo capabilities, warm resume, discovery e indexación incremental.
- `src/server/handlers/buildCommandHandlers.ts`, `reportCommandHandlers.ts` y `runtimeCommandHandlers.ts` absorben el routing de `workspace/executeCommand`, dejando `server.ts` como bootstrap + helpers de runtime.
- `docs/architecture.md`, `docs/testing.md` y `docs/performance-budget.md` reflejan la nueva estructura real del servidor.

## Out of scope

- Cambiar method names LSP, contract IDs o command IDs visibles.
- Reescribir la lógica semántica de features, build, ORCA o reporting.
- Abrir la descomposición profunda de runtime helpers más allá de dejar `server.ts` como bootstrap/runtime orchestration. Eso queda para B353/B354 si aún hiciera falta.

## Acceptance evidence

- `src/server/server.ts` deja de registrar directamente lifecycle/document/features/commands y queda como bootstrap + runtime orchestration.
- Los nombres LSP, el orden de inicialización y el comportamiento observable se mantienen estables.
- `npm test`, `architectureImports`, `pfc-workspace.smoke`, `orderentry.smoke` y smokes focales de formatting/PBAutoBuild/ORCA/health report siguen verdes.