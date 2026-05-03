# Quickstart - Spec 306 technical debt and modernization report (B261)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/powerBuilderTechnicalDebtReport.test.js out/test/server/unit/publicApi.test.js
npm run test:unit
npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"
```

Comprobación funcional mínima:

1. Verificar que `PowerSyntax: Abrir Informe Técnico de Deuda y Modernización PowerBuilder` abre un Markdown con `PowerBuilder Technical Debt Report`, hotspots y recomendaciones.
2. Verificar que `getPowerBuilderTechnicalDebtReport({ maxObjects: 16, maxHotspots: 8, maxRecommendations: 8 })` devuelve `schemaVersion = "1.0.0"` y un `summary` consistente.
3. Verificar que `invokeReadOnlyTool({ tool: "technical-debt-report", args: { maxObjects: 16, maxHotspots: 8, maxRecommendations: 8 } })` devuelve `ApiPowerBuilderTechnicalDebtReport` con el mismo contrato estable.