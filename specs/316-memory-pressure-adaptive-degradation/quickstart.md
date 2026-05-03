# Quickstart - Spec 316 memory pressure adaptive degradation (B274)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/memoryPressurePolicy.test.js out/test/server/unit/memoryBudgets.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js
```

Comprobación funcional mínima:

1. Verificar que un warning/error de memoria purga `ServingCache` y pausa nuevas escrituras sin bloquear `hover`/`completion`.
2. Verificar que `background-indexing`, `maintenance` y `ai-tooling` quedan aplazados bajo presión.
3. Verificar que `semanticWorkspaceManifest`, `crossProjectSymbolConflicts`, `workspaceMigrationAssistant`, `codeMetrics` y `technicalDebtReport` se sirven con caps defensivos bajo presión.
4. Verificar que `B274` ya no permanece en el backlog activo y que el siguiente foco canónico es `B275`.