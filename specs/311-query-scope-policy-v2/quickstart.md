# Quickstart - Spec 311 query scope policy v2 (B266)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/queryScopePolicy.test.js out/test/server/unit/referenceSourcePool.test.js out/test/server/unit/featureReadiness.test.js out/test/server/unit/references.test.js out/test/server/unit/rename.test.js out/test/server/unit/codeLensReferences.test.js out/test/server/unit/completion.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/currentObjectContext.test.js out/test/server/unit/impactAnalysis.test.js
```

Comprobación funcional mínima:

1. Verificar que `queryScopePolicy.test.ts` fija el contrato completo por consumer.
2. Verificar que `referenceSourcePool.test.ts` cubre el caso negativo de no caer a `workspace` sin routing y la exclusión de `staging/generated` fuera de policy.
3. Verificar que `featureReadiness.test.ts` y `signatureHelp` quedan alineados con el mismo contrato central.
4. Verificar que `impactAnalysis.test.ts` fija el report pesado sin materialización global cuando no hay routing de proyecto.