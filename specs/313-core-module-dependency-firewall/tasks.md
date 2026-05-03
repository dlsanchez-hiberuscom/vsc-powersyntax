# Tasks - Spec 313 core module dependency firewall (B277)

## 1. Preparación

- [x] T1. Confirmar el ancla local: ya existía `test/server/unit/architectureImports.test.ts` como guard puntual de `B228`.
- [x] T2. Identificar el primer borde falsable: faltaba proteger cruces `client/server/shared/runtime/features/build` más allá de `knowledge/parsing/utils`.

## 2. Implementación

- [x] T3. Generalizar `architectureImports.test.ts` para resolver imports reales por archivo.
- [x] T4. Añadir reglas para `knowledge/parsing/utils`, `client`, `runtime/features` y `shared`.
- [x] T5. Añadir la regla `build/ORCA no toca hot path semántico interactivo`.
- [x] T6. Alinear docs canónicas y mover el foco a `B273`.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar `npx mocha --ui tdd out/test/server/unit/architectureImports.test.js`.

## 4. Cierre

- [x] T9. Sacar `B277` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B273` y dejar la trazabilidad en `specs/313-core-module-dependency-firewall`.