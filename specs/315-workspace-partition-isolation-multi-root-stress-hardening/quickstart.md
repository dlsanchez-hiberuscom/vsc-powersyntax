# Quickstart - Spec 315 workspace partition isolation and multi-root stress hardening (B268)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/workspace.test.js out/test/server/unit/watchedFileIntake.test.js out/test/server/unit/cacheStore.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/pbAutoBuildProfileMatrix.test.js out/test/server/unit/orcaStagingExport.test.js
```

Comprobación funcional mínima:

1. Verificar que un workspace mixed no convierte roots workspace en `solution-source` por un fallback global.
2. Verificar que manifest/Object Explorer/build profiles/ORCA staging/cache partitions distinguen entidades homónimas por URI real entre roots distintos.
3. Verificar que `B268` ya no permanece en el backlog activo tras el cierre y que el siguiente foco canónico es `B274`.