# Tasks - Spec 298 datawindow SQL lineage read only (B253)

## 1. Preparación

- [x] T1. Confirmar que `DataWindowModel` y los bindings `DataObject` ya publican suficiente contexto para un lineage SQL defendible.
- [x] T2. Identificar el owning abstraction del slice en un feature server-side nuevo junto al bridge DataWindow existente.

## 2. Implementación

- [x] T3. Implementar el builder read-only del lineage SQL en `src/server/features/dataWindowSqlLineage.ts`.
- [x] T4. Exponer `getDataWindowSqlLineage()` y `datawindow-sql-lineage` en la API pública endurecida.
- [x] T5. Añadir el comando visual `PowerSyntax: Abrir DataWindow SQL Lineage` con Markdown preview.
- [x] T6. Alinear la documentación viva y mover el foco canónico del repo.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar `npx mocha --ui tdd out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/publicApi.test.js`.
- [x] T9. Ejecutar `npm run test:smoke -- --grep "la extensión se activa"`.

## 4. Cierre

- [x] T10. Mover `B253` a `docs/done-log.md` y dejar `B254` como foco siguiente.