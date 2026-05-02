# Tests del repositorio

Este paquete añade una base completa de tests para el servidor PowerSyntax.

La matriz de integración real de la extensión sobre `vscode-test` vive hoy en:

- `test/smoke/extension.test.ts` para activación y API pública mínima;
- `test/smoke/pfc-solution.extension.test.ts` para Solution real;
- `test/smoke/pfc-workspace.extension.test.ts` para Workspace real.

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
      publicCorpusPaths.ts
    unit/
      matchers.test.ts
      sections.test.ts
      documentAnalysis.test.ts
      diagnostics.test.ts
      currentObjectContext.test.ts
      impactAnalysis.test.ts
      safeEditPlan.test.ts
      semanticWorkspaceManifest.test.ts
      dataWindowSafeMode.test.ts
      dataWindowLegacySafeMode.test.ts
      powerbuilderSemanticGolden.test.ts
      analysisCache.test.ts
      diagnosticScheduler.test.ts
      hover.test.ts
      documentSymbols.test.ts
    integration/
      lsp-hover.test.ts
      lsp-documentSymbols.test.ts
      lsp-diagnostics.test.ts
    performance/
      active-file.perf.test.ts
      pfc-workspace.smoke.test.ts
      pfc-workspace.perf.test.ts
      pfc-solution.smoke.test.ts
      legacy-pbl-dump.smoke.test.ts
      orderentry.smoke.test.ts
      orderentry.perf.test.ts
  smoke/
    extension.test.ts
    pfc-solution.extension.test.ts
    pfc-workspace.extension.test.ts
```

## Nota

Los tests de `performance/` buscan corpus local en:

```text
fixtures-local/pfc/2025-Workspace/
fixtures-local/pfc/2025-Solution/
fixtures-local/STD_FC_OrderEntry/
```

Si esas carpetas no existen, los tests de rendimiento se saltan automáticamente.

También existe un slot local para corpus legacy exportado:

```text
fixtures-local/public/legacy-pbl-dump/
```

Ese corpus se usa para regresión básica sobre fuentes reales legacy sin mezclarlo con el código productivo.
