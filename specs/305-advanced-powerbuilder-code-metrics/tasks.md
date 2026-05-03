# Tasks - Spec 305 advanced PowerBuilder code metrics (B260)

## 1. Preparación

- [x] T1. Confirmar que `KnowledgeBase`, `DiagnosticsSnapshot`, bindings `DataObject` y `WorkspaceState` son la abstraction local dueña del comportamiento.
- [x] T2. Verificar que el patrón read-only existente en API/tool/comandos Markdown sirve como rail de integración para el reporte.

## 2. Implementación

- [x] T3. Implementar el collector server-side con métricas por objeto, diagnostics por área y footprint build/ORCA.
- [x] T4. Exponer `ApiPowerBuilderCodeMetrics`, `getPowerBuilderCodeMetrics`, el tool `code-metrics` y el comando `PowerSyntax: Abrir Métricas Avanzadas de Código PowerBuilder`.
- [x] T5. Añadir el builder Markdown y los límites de truncado por `maxObjects`.
- [x] T6. Alinear documentación viva y mover el foco canónico a `B261`.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar `npm run test:unit`.
- [x] T9. Ejecutar `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`.

## 4. Cierre

- [x] T10. Mover `B260` a `docs/done-log.md`, sacar el ítem del backlog activo y dejar `B261` como foco siguiente.