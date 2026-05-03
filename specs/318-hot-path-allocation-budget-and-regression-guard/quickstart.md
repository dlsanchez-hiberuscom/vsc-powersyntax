# Quickstart - Spec 318 hot path allocation budget and regression guard (B276)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/queryContext.test.js out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/referenceSourcePool.test.js out/test/server/unit/references.test.js out/test/server/unit/definition.test.js out/test/server/unit/rename.test.js out/test/server/unit/hotPathAllocationBudget.test.js
```

Comprobación funcional mínima:

1. Verificar que `queryContext` y diagnostics puntuales siguen resolviendo correctamente sobre documentos multilínea sin `document.getText().split(...)`.
2. Verificar que completion sigue sirviendo globales y statements sin pasar por `getAllSystemSymbols()`.
3. Verificar que `referenceSourcePool` sigue acotando el barrido por proyecto sin renormalizar toda la lista del workspace.
4. Verificar que `hotPathAllocationBudget.test.ts` falla si reaparecen `document.getText().split(...)`, `JSON.stringify`, `getAllEntities`/`exportDocumentRecords`, `getAllSystemSymbols()` o la renormalización redundante del workspace en las features vigiladas.
5. Verificar que `B276` ya no permanece en el backlog activo y que el siguiente foco canónico es `B270`.