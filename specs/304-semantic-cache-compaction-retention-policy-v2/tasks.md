# Tasks - Spec 304 semantic cache compaction and retention policy v2 (B259)

## 1. Preparación

- [x] T1. Confirmar que `cacheStore`, `cacheCheckpoint`, `showStats` y `runtimeHealth` son la abstraction local dueña del comportamiento.
- [x] T2. Verificar que ya existían tests de corrupción y warm/cold reutilizables para validar la policy v2.

## 2. Implementación

- [x] T3. Implementar policy v2 con TTL por workspace, métricas de disco y cleanup de `workspaceKey` obsoletos.
- [x] T4. Implementar compactación controlada del journal con validación de restore posterior.
- [x] T5. Exponer la policy y los findings por `showStats`/health y añadir el comando `PowerSyntax: Ejecutar Mantenimiento de Cache Semántica`.
- [x] T6. Alinear documentación viva y mover el foco canónico a `B260`.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar `npx mocha --ui tdd out/test/server/unit/cacheStore.test.js out/test/server/unit/cachePersistence.test.js out/test/server/unit/runtimeHealth.test.js`.
- [x] T9. Ejecutar `npx mocha --ui tdd --timeout 30000 out/test/server/performance/indexer.perf.test.js --grep "Cold start|Warm start"`.

## 4. Cierre

- [x] T10. Mover `B259` a `docs/done-log.md`, sacar el ítem del backlog activo y dejar `B260` como foco siguiente.