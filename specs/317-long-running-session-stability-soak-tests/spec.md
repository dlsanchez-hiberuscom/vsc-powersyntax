# Spec 317 - long-running session stability soak tests (B275)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B275` con una soak suite local opt-in que recorra sesiones largas sintéticas y deje evidencia JSON/MD de que no aparecen crecimiento no acotado, readiness roto ni cachés huérfanas.

## 2. Estado real actual

El repo ya dispone de `test/server/performance/session-stability-soak.perf.test.ts`, del runner `tools/run-session-stability-soak.mjs` y del script `npm run test:performance:soak`. La suite ejerce apertura/cierre, cambios incrementales, watcher bursts, diagnostics, `hover`, `completion`, support bundle, build snapshot, cache flush y workspace resume sobre un workspace sintético, y emite `[soak-report]` para materializar `artifacts/performance/session-stability-soak.json` y `.md`.

## 3. Objetivo

Demostrar con evidencia ejecutable que una sesión larga no deja deriva de `DocumentCache`, `KnowledgeBase` o `ServingCache`, ni rompe readiness, antes de abrir nuevos guards de performance sobre el hot path.

## 4. Alcance

- añadir una soak suite local opt-in sobre el carril `performance` ya existente;
- reutilizar `applyWatchedFileEvents`, `DocumentCache`, `KnowledgeBase`, `ServingCache`, support bundle, build profile matrix y persistencia/resume del runtime real;
- emitir un reporte estructurado con tamaños baseline/finales, flushes, resume checks y health/build snapshots;
- exponer un runner dedicado que compile, ejecute solo esa suite y materialice artefactos JSON/MD;
- alinear `docs/testing.md`, `docs/performance-budget.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md` y `docs/done-log.md` con el cierre.

## 5. Fuera de alcance

- convertir la soak suite en gate obligatorio de CI por defecto;
- introducir nueva infraestructura de profiling fuera del harness ya existente;
- mezclar `B275` con guards de allocations de `B276` o con nuevas superficies funcionales.

## 6. Criterios de aceptación

- AC1. existe una soak suite local opt-in que simula apertura/cierre, watcher bursts, diagnostics, `hover`/`completion`, support bundle, build snapshot, cache flush y workspace resume.
- AC2. la suite verifica explícitamente que no hay crecimiento no acotado de `DocumentCache`/`KnowledgeBase`, ni `ServingCache` residual al final.
- AC3. la suite deja evidencia estructurada en consola y el runner la serializa en JSON/MD.
- AC4. el runner falla si la suite falla o si no se puede extraer el reporte soak.
- AC5. docs canónicas quedan alineadas y el siguiente foco canónico pasa a `B276`.

## 7. Documentación afectada

- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `$env:POWERSYNTAX_SOAK_ITERATIONS='8'; npm run test:performance:soak; Remove-Item Env:POWERSYNTAX_SOAK_ITERATIONS`

## 9. Cierre registrado

- el repo ya tiene una soak suite ejecutable y trazable, sin abrir otro framework de reliability;
- la evidencia JSON/MD queda materializada en `artifacts/performance/` y el runner falla de forma honesta si no hay reporte;
- el siguiente foco canónico del repo pasa a `B276`.