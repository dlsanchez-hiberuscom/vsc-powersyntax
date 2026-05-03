# Tasks - Spec 312 runtime backpressure policy v2 (B267)

## 1. Preparación

- [x] T1. Confirmar el borde falsable: `pbAutoBuild`, ORCA y reports read-only seguían fuera del scheduler común.
- [x] T2. Verificar que los runners externos ya eran cancelables y podían integrarse sin rediseño.

## 2. Implementación

- [x] T3. Crear `backpressurePolicy.ts` con `lane`, `throttledByLatency` y `preemptible` por workload.
- [x] T4. Conectar `scheduler.ts` para exponer workloads, throttling visible y preservar `build/legacy-orca` ante preempción.
- [x] T5. Clasificar diagnostics como workload propio desde `diagnosticScheduler.ts`.
- [x] T6. Reencolar `currentObjectContext`, `dependencyGraph`, reports read-only, maintenance, `pbAutoBuild` y ORCA sobre el scheduler común.
- [x] T7. Alinear `runtimeHealth.ts` y `statusBarPresentation.ts` con el estado enriquecido del scheduler.
- [x] T8. Alinear docs canónicas y mover el foco a `B277`.

## 3. Validación

- [x] T9. Ejecutar `npm run build:test`.
- [x] T10. Ejecutar `npx mocha --ui tdd out/test/server/unit/backpressurePolicy.test.js out/test/server/unit/scheduler.test.js out/test/server/unit/diagnosticScheduler.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/statusBarPresentation.test.js`.
- [x] T11. Ejecutar `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/safeBatchRefactorPlan.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/orcaRunner.test.js out/test/server/unit/specDrivenPblUpdate.test.js out/test/server/unit/specDrivenPblUpdateBatch.test.js`.

## 4. Cierre

- [x] T12. Sacar `B267` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B277` y dejar la trazabilidad en `specs/312-runtime-backpressure-policy-v2`.