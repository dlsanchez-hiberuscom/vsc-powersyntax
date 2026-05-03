# Quickstart - Spec 300 cross project symbol conflict analyzer (B255)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/semanticQueryService.test.js out/test/server/unit/queryContext.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/publicApi.test.js --grep "(cross-project|crossProject|publicApi|cross-project-symbol-conflicts)"
npm run test:smoke -- --grep "la extensión se activa"
```

Comprobación funcional mínima:

1. Verificar que un fallback global con dos winners cross-project queda marcado como ambiguo en `semanticQueryService` y `queryContext`.
2. Verificar que `crossProjectSymbolConflicts` agrupa por `buildSymbolKey` y no lista el staging ORCA si existe un source real preferido en la misma ubicación.
3. Verificar que `PowerSyntax: Abrir Analizador de Conflictos Cross-Project` abre un Markdown lateral y que backlog/current-focus/roadmap/done-log ya no tratan `B255` como deuda activa.
