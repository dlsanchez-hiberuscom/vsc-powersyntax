# Quickstart - Spec 309 semantic consistency oracle (B264)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/semanticConsistencyOracle.test.js
npx mocha --ui tdd out/test/server/performance/semanticConsistencyOracle.smoke.test.js
```

Comprobación funcional mínima:

1. Verificar que `currentObjectContext.objectInfo.objectKind` y el manifest usan la misma normalización por URI para el mismo objeto real.
2. Verificar que `semanticConsistencyOracle.test.ts` devuelve `healthy` en el caso sano y los reason codes esperados en el caso con drift forzado.
3. Verificar que la smoke real deja `healthy` el oracle sobre `pfc_n_cst_filterattrib.sru` y `nc_ac_orderentry.sru`.