# Tests del repositorio

Este paquete añade una base completa de tests para el servidor PowerSyntax.

## Estructura

```text
test/
  fixtures/
    basic/
      sample.sru
      sample_forward.sru
      sample_invalid.sru
  server/
    helpers/
      fixtureLoader.ts
      pfcPaths.ts
    unit/
      matchers.test.ts
      sections.test.ts
      documentAnalysis.test.ts
      diagnostics.test.ts
      analysisCache.test.ts
      diagnosticScheduler.test.ts
      hover.test.ts
      documentSymbols.test.ts
    integration/
      lsp-hover.test.ts
      lsp-documentSymbols.test.ts
      lsp-diagnostics.test.ts
    performance/
      pfc-workspace.smoke.test.ts
      pfc-workspace.perf.test.ts
      pfc-solution.smoke.test.ts
```

## Nota

Los tests de `performance/` buscan corpus local en:

```text
fixtures-local/pfc/2025-Workspace/
fixtures-local/pfc/2025-Solution/
```

Si esas carpetas no existen, los tests de rendimiento se saltan automáticamente.
