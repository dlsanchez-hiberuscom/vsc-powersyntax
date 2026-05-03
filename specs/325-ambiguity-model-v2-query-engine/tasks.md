# Tasks - Spec 325 ambiguity model v2 for query engine (B280)

## 1. Preparación

- [x] T1. Identificar el hueco mínimo en `semanticQueryService` y `queryContext`.
- [x] T2. Fijar en tests la falta de señal explícita para `global-fallback` ambiguo y conflicto de `sourceOrigin`.

## 2. Implementación

- [x] T3. Introducir `ambiguityKind` y evidence para `fallback-ambiguity` y `source-origin-conflict`.
- [x] T4. Proyectar la nueva señal hacia `queryContext` y `hoverFormat`.
- [x] T5. Mantener `definition`, `references` y `rename` en verde con el modelo nuevo.

## 3. Validación

- [x] T6. Ejecutar `npm run build:test`.
- [x] T7. Ejecutar `npx mocha --ui tdd out/test/server/unit/semanticQueryService.test.js out/test/server/unit/queryContext.test.js out/test/server/unit/hoverFormat.test.js out/test/server/unit/hover.test.js out/test/server/unit/definition.test.js`.
- [x] T8. Ejecutar `npx mocha --ui tdd out/test/server/unit/references.test.js out/test/server/unit/rename.test.js`.

## 4. Cierre

- [x] T9. Actualizar `docs/rules-catalog.md`, `docs/testing.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md` y `docs/done-log.md`.
- [x] T10. Sacar `B280` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B281` y dejar la trazabilidad en `specs/325-ambiguity-model-v2-query-engine`.