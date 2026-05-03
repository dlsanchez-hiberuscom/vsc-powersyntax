# Quickstart - Spec 314 cross-surface golden contract matrix (B273)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/crossSurfaceGoldenMatrix.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js out/test/server/unit/semanticConsistencyOracle.test.js out/test/server/unit/documentSymbols.test.js out/test/server/unit/workspaceSymbols.test.js out/test/server/unit/semanticTokens.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/dependencyGraph.test.js out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/supportBundle.test.js
```

Comprobación funcional mínima:

1. Verificar que `crossSurfaceGoldenMatrix.test.ts` usa un solo fixture compartido y no materializa infraestructura nueva fuera del backbone existente.
2. Verificar que la matriz cubre outline, navegación, diagnostics, context packs, manifest, dependency graph, DataWindow lineage y support bundle.
3. Verificar que la normalización fija señales visibles útiles y que `B273` ya no permanece en el backlog activo tras el cierre.