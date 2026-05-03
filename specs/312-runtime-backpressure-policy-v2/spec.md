# Spec 312 - runtime backpressure policy v2 (B267)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B267` fijando una policy runtime por workload para que `interactive`, `near-context`, `diagnostics`, `background-indexing`, `export-reporting`, `build`, `legacy-orca`, `ai-tooling` y `maintenance` compitan sobre el mismo scheduler con admisión, throttling y preemptibilidad explícitos.

## 2. Estado real actual

El repo ya dispone de un registro único en `src/server/runtime/backpressurePolicy.ts` consumido por `scheduler.ts`, `diagnosticScheduler.ts`, `server.ts`, `runtimeHealth.ts` y `statusBarPresentation.ts`. `pbAutoBuild`, ORCA, reports read-only, maintenance y surfaces `near-context` ya pasan por el scheduler común; `build` y `legacy-orca` quedan preservados una vez arrancan y el estado visible ya expone `pendingWorkloads` y `throttledBackgroundReason`.

## 3. Objetivo

Formalizar qué workload usa cada carril runtime, cuándo puede ser aplazado por latencia, cuándo es preemptible y cómo se proyecta esa presión en stats/health, sin abrir un segundo scheduler ni dejar workflows legacy/build fuera del contrato.

## 4. Alcance

- crear el registro central `backpressurePolicy` con `lane`, `throttledByLatency` y `preemptible` por workload;
- conectar `TaskScheduler` para exponer workloads activos/pendientes, throttling visible y preservación de `build/legacy-orca` ante preempción;
- enrutar `diagnostics`, `currentObjectContext`, `dependencyGraph`, reports read-only, maintenance, `pbAutoBuild` y ORCA por el scheduler común;
- proyectar la presión runtime en `runtimeHealth` y `statusBarPresentation`;
- cubrir la validación focal del scheduler y la revalidación de las surfaces read-only/build/legacy recolgadas del runtime.

## 5. Fuera de alcance

- abrir un segundo scheduler o una cola paralela para build/legacy;
- prometer cancelación mágica a mitad de reports síncronos más allá del gating/yield previo al arranque;
- resolver `B274+` bajo el pretexto de budgets runtime.

## 6. Criterios de aceptación

- AC1. existe un registro único de workload con `lane`, `throttledByLatency` y `preemptible`.
- AC2. `TaskScheduler` respeta esa policy y no cancela `build/legacy-orca` cuando una interactiva o `near-context` desplaza background.
- AC3. `pbAutoBuild` y ORCA quedan detrás del mismo scheduler/gate de latencia que el resto del runtime.
- AC4. reports read-only, maintenance, `currentObjectContext`, `dependencyGraph` y diagnostics quedan clasificados por workload y el throttling aparece en stats/health.
- AC5. la validación incluye suites focales del runtime, revalidación de las surfaces reencoladas y docs canónicas alineadas con el cierre.

## 7. Documentación afectada

- `docs/architecture.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/backpressurePolicy.test.js out/test/server/unit/scheduler.test.js out/test/server/unit/diagnosticScheduler.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/safeBatchRefactorPlan.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/orcaRunner.test.js out/test/server/unit/specDrivenPblUpdate.test.js out/test/server/unit/specDrivenPblUpdateBatch.test.js`

## 9. Cierre registrado

- la policy runtime por workload ya queda centralizada y consumida por scheduler, diagnostics, server stats y health;
- `build` y `legacy-orca` ya pasan por el scheduler común sin quedar preemptibles una vez arrancan;
- `reports`, `maintenance`, `currentObjectContext` y `dependencyGraph` ya no saltan el carril runtime común;
- el siguiente foco canónico del repo pasa a `B277`.