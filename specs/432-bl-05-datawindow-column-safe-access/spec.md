# Spec 432 — BL-05 DataWindow column safe access

## Estado

- done

## Relación backlog

- Backlog item: `BL-05 — Extender safe model de DataWindow`

## Objetivo

Extender el safe model DataWindow con resolución segura de columnas literales en APIs de edición/lectura (`GetItem*`, `SetItem`, `SetItemStatus`) cuando el `DataObject` resuelve de forma literal y única, manteniendo degradación nula para roots dinámicos.

## Resultado esperado

- definition/hover navegan columnas DataWindow usadas en APIs de edición/lectura con root literal;
- las variantes con `DWBuffer` no rompen la resolución literal de columna;
- roots dinámicos o ambiguos siguen sin inferencia adicional.

## Validación mínima esperada

- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/definition.test.js out/test/server/unit/hover.test.js`
- `npm run test:docs:drift`

## Validación ejecutada

- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/definition.test.js out/test/server/unit/hover.test.js`
- `npm run test:docs:drift`

## Fuera de alcance

- simular buffers o estado runtime de DataWindow;
- resolver columnas cuando el `DataObject` es dinámico o ambiguo;
- abrir completion o refactors sobre APIs DataWindow fuera del slice literal-only.