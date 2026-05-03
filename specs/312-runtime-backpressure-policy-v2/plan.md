# Plan - Spec 312 runtime backpressure policy v2 (B267)

## 1. Enfoque técnico

No abrir otro scheduler: mantener la policy en una registry runtime encima del `TaskScheduler` actual. El primer borde falsable era el carril build/ORCA, porque seguía corriendo fuera del scheduler aunque los runners ya eran cancelables y el latency governor existía.

## 2. Pasos

1. Crear un registro único de workloads runtime con lane, throttling por latencia y preemptibilidad explícita.
2. Conectar `TaskScheduler` para exponer workloads activos/pendientes, throttling visible y preservación de `build/legacy-orca`.
3. Colgar `diagnosticScheduler` y las surfaces `near-context`/`export-reporting`/`maintenance` del mismo scheduler.
4. Pasar `pbAutoBuild` y ORCA por helpers background-managed reutilizando los runners existentes y su cancelación.
5. Validar con suites focales del runtime y con una batería ampliada sobre las surfaces read-only/build/legacy recolgadas del scheduler.
6. Alinear docs canónicas y mover el foco a `B277`.

## 3. Riesgos

- abrir un segundo scheduler “rápido” para build/ORCA y volver a fragmentar el runtime;
- cancelar `build/legacy-orca` como si fueran workloads preemptibles y romper el contrato legacy;
- envolver reports síncronos como si fueran cancelables a mitad de ejecución, en lugar de usar gating/yield honesto antes del arranque.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/backpressurePolicy.test.js out/test/server/unit/scheduler.test.js out/test/server/unit/diagnosticScheduler.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/safeBatchRefactorPlan.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/orcaRunner.test.js out/test/server/unit/specDrivenPblUpdate.test.js out/test/server/unit/specDrivenPblUpdateBatch.test.js`

## 5. Resultado ejecutado

1. `backpressurePolicy` ya centraliza la policy runtime por workload.
2. `scheduler` ya respeta esa policy y expone throttling/workloads visibles.
3. `pbAutoBuild`, ORCA, maintenance, reports read-only, `currentObjectContext`, `dependencyGraph` y diagnostics ya pasan por el scheduler común.