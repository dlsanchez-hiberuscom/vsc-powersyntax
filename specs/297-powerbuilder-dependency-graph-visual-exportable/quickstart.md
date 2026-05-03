# Quickstart - Spec 297 powerbuilder dependency graph visual exportable (B252)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/dependencyGraph.test.js out/test/server/unit/publicApi.test.js
npm run test:smoke -- --grep "la extensión se activa"
```

Comprobación funcional mínima:

1. Verificar que `api.getPowerBuilderDependencyGraph()` devuelve `available === true` para un objeto PowerBuilder real.
2. Verificar que `invokeReadOnlyTool({ tool: "dependency-graph" })` responde con schema `ApiPowerBuilderDependencyGraph`.
3. Verificar que `vscPowerSyntax.openDependencyGraph` abre un Markdown con Mermaid y que backlog/current-focus/roadmap/done-log ya no tratan `B252` como deuda activa.
