# Tasks - Spec 316 memory pressure adaptive degradation (B274)

## 1. Preparación

- [x] T1. Confirmar que el reporte de memoria existente solo se consumía en `showStats` y no gobernaba el runtime.
- [x] T2. Identificar el borde mínimo: `ServingCache`, gate de background y reports read-only pesados.

## 2. Implementación

- [x] T3. Crear `memoryPressurePolicy.ts` con purge/skip/defer/caps.
- [x] T4. Añadir tests focales con thresholds artificiales.
- [x] T5. Cablear la policy en `server.ts` para purgar `ServingCache`, aplazar workloads no críticos y capar reports.
- [x] T6. Alinear docs canónicas y mover el foco a `B275`.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar la batería focal de `memoryPressurePolicy|memoryBudgets|runtimeHealth|semanticWorkspaceManifest|crossProjectSymbolConflicts|workspaceMigrationAssistant|powerBuilderCodeMetrics|powerBuilderTechnicalDebtReport`.

## 4. Cierre

- [x] T9. Sacar `B274` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B275` y dejar la trazabilidad en `specs/316-memory-pressure-adaptive-degradation`.