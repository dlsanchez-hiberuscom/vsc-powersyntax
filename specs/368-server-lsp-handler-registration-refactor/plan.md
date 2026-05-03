# Plan — Spec 368 Server LSP handler registration refactor

## Phase 1 — Feature boundaries

- [x] Extraer el registro de features LSP a `handlers/featureHandlers.ts` sin cambiar el orden observable ni el contrato de cada provider.

## Phase 2 — Document and lifecycle boundaries

- [x] Extraer `onDidOpen/onDidChangeContent/onDidClose`, watcher bridge y `onShutdown` a `handlers/documentHandlers.ts`.
- [x] Extraer `onInitialize/onInitialized` a `handlers/lifecycleHandlers.ts` manteniendo intactos warm resume, discovery e indexación.

## Phase 3 — Command routing boundaries

- [x] Partir el router de `workspace/executeCommand` en `buildCommandHandlers.ts`, `reportCommandHandlers.ts` y `runtimeCommandHandlers.ts`.
- [x] Dejar `server.ts` como bootstrap + runtime helpers, sin un `switch` gigante de comandos.

## Phase 4 — Validation and closure

- [x] Validar compilación, architecture firewall, performance focal PFC/OrderEntry y smokes focales sobre surfaces movidas.
- [x] Alinear arquitectura, testing, performance budget, backlog, current-focus y done-log.