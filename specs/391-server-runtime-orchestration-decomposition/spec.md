# Spec 391 — B354 Server runtime orchestration decomposition

## Estado

- done

## Relacion backlog

- Backlog item: `B354 — Server runtime orchestration decomposition`

## Objetivo

Separar la orquestación runtime del host LSP en slices pequeños y verificables, manteniendo intactas las policies de scheduler, readiness, backpressure y memory pressure ya cerradas.

## Resultado de cierre

- `src/server/cache/semanticCacheRuntimeController.ts` concentra ya el store activo, append journal, persistencia del serving snapshot, flush coordinator y métricas de restore/persist antes dispersas en `server.ts`;
- `src/server/runtime/runtimeProgressController.ts` concentra ya la construcción/publicación del snapshot de readiness operativo, manteniendo `buildProgressReadinessSnapshot()` y `toProgressNotification()` como helpers puros reutilizados;
- `src/server/runtime/managedRuntimeWorkloads.ts` concentra la secuencia de ids, el yielding cooperativo y los adapters `near-context`, `export-reporting` y `maintenance` sobre el mismo `TaskScheduler` ya existente;
- `src/server/runtime/managedBuildWorkloads.ts` concentra los adapters `pbautobuild` y `legacy-orca` sobre `runBackgroundWorkload`, preservando la misma policy que deja `build` y `legacy-orca` como workloads no preemptibles una vez arrancan;
- `src/server/server.ts` queda reducido a bootstrap y composición de controladores runtime sin abrir un segundo centro de decisión para `TaskScheduler`, `backpressurePolicy`, `latencyGovernor` o `memoryPressurePolicy`.

## Validación ejecutada

- `npm run test:unit -- --grep "unit/(scheduler|backpressurePolicy|memoryPressurePolicy|memoryBudgets|runtimeHealth|statusBarPresentation|servingCacheRuntime|cacheStore|progressReadiness|managedRuntimeWorkloads|managedBuildWorkloads)"`
- `npm run test:performance:gate`
- `npm run test:architecture:rapid`

## Fuera de alcance del corte cerrado

- mover startup/lifecycle completo;
- alterar policies de scheduler o memory pressure;
- cambiar payloads de runtime commands/health.