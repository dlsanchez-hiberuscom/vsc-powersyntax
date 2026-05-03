# Quickstart — Spec 365 Enterprise health score

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/projectHealthDashboard.test.js
npm run test:smoke -- --grep "exporta un health report reutilizando stats y manifest del workspace activo"
```

## Expected result

El dashboard y el health report exportado deben mostrar un `enterprise health score` explicable por readiness, diagnostics, build, ORCA, cache, sourceOrigin, performance y support matrix, sin tocar servidor ni abrir una surface nueva.