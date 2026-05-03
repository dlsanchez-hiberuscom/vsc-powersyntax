# Quickstart - Spec 313 core module dependency firewall (B277)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/architectureImports.test.js
```

Comprobación funcional mínima:

1. Verificar que `architectureImports.test.ts` resuelve imports reales por archivo y no solo un regex puntual por carpeta.
2. Verificar que el guard cubre `client`, `shared`, `runtime/features`, `knowledge/parsing/utils` y `build`.
3. Verificar que la regla de `build` prohíbe `documentAnalysis`, `semanticQueryService`, parsing y features interactivas, pero no rompe el rail read-only/write-enabled ya cerrado.