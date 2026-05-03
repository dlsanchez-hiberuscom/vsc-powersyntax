# Tasks — Spec 368 Server LSP handler registration refactor

- [x] Crear `src/server/handlers/featureHandlers.ts` y mover el wiring de features LSP.
- [x] Crear `src/server/handlers/documentHandlers.ts` y mover eventos de documento, watcher bridge y shutdown.
- [x] Crear `src/server/handlers/lifecycleHandlers.ts` y mover initialize/initialized.
- [x] Crear `src/server/handlers/buildCommandHandlers.ts`, `reportCommandHandlers.ts` y `runtimeCommandHandlers.ts`.
- [x] Reducir `src/server/server.ts` a bootstrap + runtime orchestration + helpers locales.
- [x] Validar `npm run build:test`, `npm test`, `architectureImports`, PFC/OrderEntry perf y smokes focales del carril refactorizado.
- [x] Cerrar B347 en backlog/current-focus/done-log y alinear documentación canónica.