# Quickstart - Spec 298 datawindow SQL lineage read only (B253)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/publicApi.test.js
npm run test:smoke -- --grep "la extensión se activa"
```

Comprobación funcional mínima:

1. Verificar que `api.getDataWindowSqlLineage()` devuelve `available === true` para un caso con binding `DataObject` resoluble o `available === false` con motivo explícito cuando no haya raíz defendible.
2. Verificar que `invokeReadOnlyTool({ tool: "datawindow-sql-lineage" })` responde con schema `ApiDataWindowSqlLineage`.
3. Verificar que `vscPowerSyntax.openDataWindowSqlLineage` abre un Markdown y que backlog/current-focus/roadmap/done-log ya no tratan `B253` como deuda activa.