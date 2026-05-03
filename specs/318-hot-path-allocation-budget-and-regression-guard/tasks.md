# Tasks - Spec 318 hot path allocation budget and regression guard (B276)

## 1. Preparación

- [x] T1. Localizar operaciones concretas de split/clonación/materialización dentro del hot path interactivo.
- [x] T2. Confirmar un borde mínimo falsable en `queryContext`, diagnostics puntuales, completion y `referenceSourcePool`.

## 2. Implementación

- [x] T3. Crear `documentLineText.ts` y reemplazar lecturas por split completo en `queryContext` y diagnostics.
- [x] T4. Evitar `getAllSystemSymbols()` en completion y la renormalización redundante de `getAllSourceFiles()` en `referenceSourcePool`.
- [x] T5. Crear `test/server/unit/hotPathAllocationBudget.test.ts` como guard local/CI del hot path.
- [x] T6. Alinear docs canónicas y mover el foco a `B270`.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar la batería focal `queryContext|completion|diagnostics|referenceSourcePool|references|definition|rename|hotPathAllocationBudget`.

## 4. Cierre

- [x] T9. Sacar `B276` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B270` y dejar la trazabilidad en `specs/318-hot-path-allocation-budget-and-regression-guard`.