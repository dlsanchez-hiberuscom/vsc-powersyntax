# Tasks - Spec 283 DataWindow Object/GetChild navigation (B081)

## 1. Preparación

- [x] T1. Confirmar que el hueco real estaba en el parser/bridge de entry points PowerScript y no en `DataWindowModel`.

## 2. Implementación

- [x] T2. Extender `dataWindowPropertyPaths` para reconocer `.Object.<control|column|property>` y `GetChild(...)`.
- [x] T3. Reutilizar el mismo resolver para child leaves de `report(...)` / `dddw.name` sin abrir heurísticas paralelas.

## 3. Validación

- [x] T4. Añadir tests focales de definition/hover para `.Object`, `GetChild()` y report child.
- [x] T5. Revalidar `definition.test.ts` y `hover.test.ts` completos tras el cambio.

## 4. Cierre

- [x] T6. Alinear docs/specs y mover el foco al siguiente bloque pedido por el usuario.