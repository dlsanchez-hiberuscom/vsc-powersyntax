# Spec 283 - DataWindow Object/GetChild navigation (B081)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar la brecha semántica visible de DataWindow profundo ampliando el resolver existente de property paths para cubrir acceso directo `.Object.<control|column|property>` y `GetChild()` cuando el `DataObject` y la cadena child sean defendibles.

## 2. Estado real actual

`B081` queda `Closed`: `dataWindowPropertyPaths` ya reconoce rutas avanzadas tanto dentro de `Describe/Modify(...)` como en acceso directo `.Object.<...>` y en el primer argumento literal de `GetChild(...)`, reutilizando `DataWindowModel` y el binding `DataObject` existente para definition/hover seguros sobre child DataWindows deterministas.

## 3. Objetivo

Completar el slice de navegación/hover DataWindow profundo pendiente antes de continuar con el siguiente bloque pedido por el usuario.

## 4. Alcance

- ampliar el parser local de invocaciones DataWindow para reconocer `.Object.<...>` y `GetChild(...)`;
- reutilizar el mismo resolver de property paths ya cerrado para `Describe/Modify`;
- soportar rutas hoja directas hacia dropdown child y report child cuando el target sea único;
- fijar cobertura focal de definition/hover para los nuevos entry points;
- mover el foco canónico al siguiente bloque pedido por el usuario.

## 5. Fuera de alcance

- inventar semántica para rutas dinámicas, ambiguas o incompletas;
- abrir completion/references/rename nuevos sobre DataWindow fuera del slice pedido;
- parsear DataWindow como PowerScript completo;
- reabrir el carril legacy ORCA o cambiar su prioridad operativa.

## 6. Criterios de aceptación

- AC1. Existe un parser local para `.Object.<control|column|property>` sobre DataWindow enlazado.
- AC2. `GetChild(...)` reutiliza el mismo backbone y navega hacia child DataWindows deterministas.
- AC3. Hover y Definition siguen funcionando para `Describe/Modify` y cubren también los nuevos entry points.
- AC4. Los casos no defendibles degradan sin fingir semántica.
- AC5. El foco canónico se mueve al siguiente item del orden pedido por el usuario.

## 7. Documentación afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/roadmap.md`
- `docs/testing.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/definition.test.js out/test/server/unit/hover.test.js`

## 9. Cierre registrado

- `src/server/features/dataWindowPropertyPaths.ts` detecta ahora `.Object.<...>` y `GetChild(...)` además de `Describe/Modify(...)`;
- el resolver reutiliza `DataWindowModel` para rutas directas y leaf children de `report(...)` / `dddw.name` cuando el target es único;
- `test/server/unit/definition.test.ts` y `test/server/unit/hover.test.ts` fijan los nuevos entry points sin romper el slice previo;
- el foco canónico avanza al siguiente bloque pedido por el usuario.