# Tasks - Spec 306 technical debt and modernization report (B261)

## 1. Preparación

- [x] T1. Confirmar que `code-metrics`, `diagnostic.code`, `sourceOrigin` summary y `workspaceMigrationAssistant` son la base local suficiente para el reporte.
- [x] T2. Verificar que el rail API/tool/comando Markdown ya existente sirve para exponer el informe sin una surface paralela.

## 2. Implementación

- [x] T3. Implementar el collector server-side con hotspots, prioridades, confidence y recomendaciones.
- [x] T4. Exponer `ApiPowerBuilderTechnicalDebtReport`, `getPowerBuilderTechnicalDebtReport`, el tool `technical-debt-report` y el comando `PowerSyntax: Abrir Informe Técnico de Deuda y Modernización PowerBuilder`.
- [x] T5. Añadir Markdown exportable y mantener el slice estrictamente read-only.
- [x] T6. Alinear documentación viva y mover el foco canónico a `B262`.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar `npx mocha --ui tdd out/test/server/unit/powerBuilderTechnicalDebtReport.test.js out/test/server/unit/publicApi.test.js`.
- [x] T9. Ejecutar `npm run test:unit`.
- [x] T10. Ejecutar `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`.

## 4. Cierre

- [x] T11. Mover `B261` a `docs/done-log.md`, sacar el ítem del backlog activo y dejar `B262` como foco siguiente.