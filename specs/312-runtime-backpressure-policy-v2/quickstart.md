# Quickstart - Spec 312 runtime backpressure policy v2 (B267)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/backpressurePolicy.test.js out/test/server/unit/scheduler.test.js out/test/server/unit/diagnosticScheduler.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/statusBarPresentation.test.js
npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/safeBatchRefactorPlan.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/orcaRunner.test.js out/test/server/unit/specDrivenPblUpdate.test.js out/test/server/unit/specDrivenPblUpdateBatch.test.js
```

Comprobación funcional mínima:

1. Verificar que `backpressurePolicy.test.ts` fija el contrato por workload y la preemptibilidad esperada.
2. Verificar que `scheduler.test.ts` cubre throttle visible y preservación de `build` ante preempción interactiva.
3. Verificar que `diagnosticScheduler`, `runtimeHealth` y `statusBarPresentation` proyectan el estado enriquecido del scheduler.
4. Verificar que la batería read-only/build/legacy sigue verde tras colgar esos carriles del scheduler común.