# Spec 391 — B354 Server runtime orchestration decomposition

## Estado

- in-progress

## Relacion backlog

- Backlog item: `B354 — Server runtime orchestration decomposition`

## Objetivo

Separar la orquestación runtime del host LSP en slices pequeños y verificables, manteniendo intactas las policies de scheduler, readiness, backpressure y memory pressure ya cerradas.

## Slice actual

- extraer del `server.ts` la orquestación local del semantic cache runtime: store activo, persistencia del serving snapshot, flush coordinator y métricas de restore/persist.

## Avance actual

- `src/server/cache/semanticCacheRuntimeController.ts` concentra ya el store activo, append journal, persistencia del serving snapshot, flush coordinator y métricas de restore/persist antes dispersas en `server.ts`;
- `src/server/runtime/runtimeProgressController.ts` concentra ya la construcción/publicación del snapshot de readiness operativo, manteniendo `buildProgressReadinessSnapshot()` y `toProgressNotification()` como helpers puros reutilizados;
- ambos cortes siguen dejando fuera el startup/lifecycle completo y las policies de scheduler/memory pressure, pero reducen `server.ts` a wiring de controladores en dos zonas críticas del runtime.

## Validación parcial ejecutada

- `npm run test:unit -- --grep "unit/(servingCacheRuntime|cacheStore)"`
- `npm run test:unit -- --grep "unit/progressReadiness"`

## Siguiente corte recomendado

- extraer el runner de workloads gestionados (`runBackgroundWorkload`, `runNearContextWorkload`, `runExportReportingWorkload`, `runMaintenanceWorkload`) antes de tocar el bloque de memory pressure o el lifecycle completo.

## Fuera de alcance del slice actual

- mover startup/lifecycle completo;
- alterar policies de scheduler o memory pressure;
- cambiar payloads de runtime commands/health.