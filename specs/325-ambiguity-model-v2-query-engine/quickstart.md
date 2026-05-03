# Quickstart - Spec 325 ambiguity model v2 for query engine (B280)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/semanticQueryService.test.js out/test/server/unit/queryContext.test.js out/test/server/unit/hoverFormat.test.js out/test/server/unit/hover.test.js out/test/server/unit/definition.test.js
npx mocha --ui tdd out/test/server/unit/references.test.js out/test/server/unit/rename.test.js
```

Comprobación funcional mínima:

1. Verificar que `semanticQueryService` distingue `distance-minimum` frente a `global-fallback` ambiguo y publica `source-origin-conflict` cuando el winner descarta `orca-staging`.
2. Verificar que `queryContext` expone `ambiguityKind` y los `resolutionEvidenceKinds` nuevos sin perder compatibilidad con consumers existentes.
3. Verificar que `hoverFormat` muestra un texto distinto para `global-fallback` ambiguo frente al empate por distancia mínima.
4. Verificar que `references` y `rename` siguen verdes con el nuevo modelo.
5. Verificar que `B280` ya no está en backlog activo y que el foco canónico del repo pasó a `B281`.