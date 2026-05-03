# Spec 318 - hot path allocation budget and regression guard (B276)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B276` con un guard local/CI que bloquee patrones estructurales de allocations en hot path y con reparaciones puntuales sobre `queryContext`, `diagnostics`, `completion` y `referenceSourcePool` para evitar splits y clonaciones globales evitables.

## 2. Estado real actual

El repo ya dispone de `src/server/utils/documentLineText.ts`, de lecturas por línea activa en `queryContext` y `diagnostics`, de completion sin clonación del catálogo global completo y de `test/server/unit/hotPathAllocationBudget.test.ts` como guard estructural. La batería focal `queryContext|completion|diagnostics|referenceSourcePool|references|definition|rename` deja ese carril validado en local/CI.

## 3. Objetivo

Impedir que el hot path interactivo vuelva a introducir por accidente materialización de KB completa, splits completos de documento, `JSON.stringify`, exportaciones globales o clonaciones redundantes del catálogo/workspace en features interactivas vigiladas.

## 4. Alcance

- introducir un helper común para leer solo la línea activa de un `TextDocument`;
- hacer que `queryContext` y diagnostics puntuales consuman esa línea en vez de partir el documento completo;
- evitar la clonación del catálogo global completo del sistema en completion;
- evitar la renormalización completa de `getAllSourceFiles()` en `referenceSourcePool`;
- añadir un guard estructural local/CI que falle ante `document.getText().split(...)`, `JSON.stringify`, `getAllEntities`/`exportDocumentRecords`, `getAllSystemSymbols()` y renormalización redundante del workspace en hot path;
- alinear `docs/architecture.md`, `docs/performance-budget.md`, `docs/testing.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md` y `docs/done-log.md` con el cierre.

## 5. Fuera de alcance

- convertir `B276` en un microbenchmark numérico de allocations por engine o plataforma;
- reescribir el motor de references o el scheduler fuera de los puntos locales falsables detectados;
- mezclar el guard de hot path con nueva funcionalidad visible o nuevos writes.

## 6. Criterios de aceptación

- AC1. `queryContext` y diagnostics de línea única dejan de partir el documento entero para leer una línea.
- AC2. completion deja de clonar el catálogo global completo del sistema en el hot path.
- AC3. `referenceSourcePool` deja de renormalizar toda la lista del workspace por cada query.
- AC4. existe un guard local/CI que falla si reaparecen `document.getText().split(...)`, `JSON.stringify`, `getAllEntities`/`exportDocumentRecords`, `getAllSystemSymbols()` o la renormalización redundante del workspace en las features vigiladas.
- AC5. docs canónicas quedan alineadas y el siguiente foco canónico pasa a `B270`.

## 7. Documentación afectada

- `docs/architecture.md`
- `docs/performance-budget.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/queryContext.test.js out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/referenceSourcePool.test.js out/test/server/unit/references.test.js out/test/server/unit/definition.test.js out/test/server/unit/rename.test.js out/test/server/unit/hotPathAllocationBudget.test.js`

## 9. Cierre registrado

- el hot path interactivo ya no depende de splits completos del documento ni de clonaciones globales evitables en los puntos corregidos;
- el guard estructural queda integrado en local/CI para cortar regresiones antes de que salten a latencia visible;
- el siguiente foco canónico del repo pasa a `B270`.