# Quickstart - Spec 323 core maintenance command pack (B278)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/coreMaintenanceCommandCatalog.test.js
npm run test:smoke -- --grep "smoke/extension|smoke/health-report-extension"
```

Comprobación funcional mínima:

1. Verificar que `src/client/coreMaintenanceCommandCatalog.ts` cubre exactamente los nueve comandos del backlog y distingue `read-only` frente a `confirmable`.
2. Verificar que `vscPowerSyntax.exportHealthReport` exporta `README.md`, `server-stats.json` y `semantic-workspace-manifest.json` en `tools/health-reports` o en el destino explícito pedido.
3. Verificar que `vscPowerSyntax.showMemoryBudgets`, `showIndexingState`, `showProjectRouting`, `showSourceOriginConflicts` y `validatePersistentCache` devuelven reportes Markdown ejecutables desde la smoke de extensión.
4. Verificar que `vscPowerSyntax.clearSemanticCache` y `vscPowerSyntax.rebuildWorkspaceIndex` quedan como comandos confirmables y que `B278` ya no permanece en el backlog activo mientras el siguiente foco canónico es `B279`.