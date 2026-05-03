# Spec 304 - semantic cache compaction and retention policy v2 (B259)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B259` endureciendo la persistencia semántica con una policy v2 observable: TTL por workspace, cleanup de workspaces obsoletos, métricas de disco, compactación controlada del journal y validación de restore posterior.

## 2. Estado real actual

El runtime ya publica `persistence.policy` y `persistence.maintenance` en `showStats`, emite findings de health para persistencia y expone `PowerSyntax: Ejecutar Mantenimiento de Cache Semántica` para compactar journals grandes y limpiar workspaces persistidos obsoletos sin tocar el hot path interactivo.

## 3. Objetivo

Evitar que la caché semántica persistida acumule journals o workspaces obsoletos de forma indefinida, manteniendo el beneficio warm/cold y dejando la policy visible y operable desde el producto.

## 4. Alcance

- policy v2 en `cacheStore` con TTL por workspace, budgets y métricas de disco;
- cleanup de `workspaceKey` obsoletos en operaciones seguras de persistencia;
- compactación explícita del journal con validación de restore posterior;
- exposición por `showStats`, `health` y comando local de mantenimiento;
- alineación documental y avance del foco canónico a `B260`.

## 5. Fuera de alcance

- compactar o limpiar sobre cada `upsert/remove` del hot path;
- añadir telemetría externa de persistencia;
- abrir una segunda implementación de caché fuera de `cacheStore`.

## 6. Criterios de aceptación

- AC1. la policy v2 define TTL por workspace y budgets de journal/disco visibles.
- AC2. workspaces persistidos obsoletos se limpian y los journals grandes pueden compactarse bajo un comando explícito.
- AC3. la compactación valida que el restore siga siendo reutilizable.
- AC4. `showStats` y `health` exponen métricas/findings de persistencia defendibles.
- AC5. la validación cubre `cacheStore`, `cachePersistence` y warm/cold sobre el carril de rendimiento existente.
- AC6. backlog, roadmap y current-focus dejan de tratar `B259` como deuda activa y pasan a `B260`.

## 7. Documentación afectada

- `docs/performance-budget.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/cacheStore.test.js out/test/server/unit/cachePersistence.test.js out/test/server/unit/runtimeHealth.test.js`
- `npx mocha --ui tdd --timeout 30000 out/test/server/performance/indexer.perf.test.js --grep "Cold start|Warm start"`

## 9. Cierre registrado

- la policy v2 ya observa journal/disco y workspaces obsoletos desde el mismo `cacheStore`;
- la compactación explícita valida el restore y no invade el hot path;
- el siguiente foco canónico del repo pasa a `B260`.