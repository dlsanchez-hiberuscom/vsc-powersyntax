# Quickstart - Spec 324 symbol identity canonical key v2 (B279)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/symbolKey.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js
npx mocha --ui tdd out/test/server/unit/references.test.js out/test/server/unit/rename.test.js
npx mocha --ui tdd out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/dependencyGraph.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js
```

Comprobación funcional mínima:

1. Verificar que `src/server/knowledge/symbolKey.ts` publica `buildSymbolKey` exacto y `buildConflictFamilyKey` relajado, sin volver a `kind/owner/name/arity`.
2. Verificar que `references` y `rename` no incluyen `orca-staging` cuando la surface canónica resuelta es la real.
3. Verificar que `crossProjectSymbolConflicts` sigue agrupando conflictos por familia y colapsa staging de la misma ubicación, pero cada candidato expone su `identityKey` exacta.
4. Verificar que `semanticWorkspaceManifest`, `dependencyGraph` y `exportedSymbols` publican `identityKey` sin recomponerla por nombre visible.
5. Verificar que `B279` ya no está en backlog activo y que el foco canónico del repo pasó a `B280`.