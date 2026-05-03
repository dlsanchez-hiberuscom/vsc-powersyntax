# Quickstart - Spec 305 advanced PowerBuilder code metrics (B260)

```bash
npm run build:test
npm run test:unit
npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"
```

Comprobación funcional mínima:

1. Verificar que `PowerSyntax: Abrir Métricas Avanzadas de Código PowerBuilder` abre un Markdown con `PowerBuilder Code Metrics`, resumen global, `Diagnostics By Area` y hotspots.
2. Verificar que `getPowerBuilderCodeMetrics({ maxObjects: 16 })` devuelve `schemaVersion = "1.0.0"` y un `summary` consistente.
3. Verificar que `invokeReadOnlyTool({ tool: "code-metrics", args: { maxObjects: 16 } })` devuelve `ApiPowerBuilderCodeMetrics` con el mismo contrato estable.