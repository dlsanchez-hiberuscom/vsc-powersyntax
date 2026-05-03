# Spec 310 - incremental invalidation proof suite (B265)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B265` demostrando con proofs ejecutables que el watcher y el diff snapshot-aware invalidan solo lo necesario, sin rediscovery global ni un segundo motor de invalidación.

## 2. Estado real actual

El repo ya dispone de una proof suite en `test/server/unit/watchedFileIntake.test.ts` y `test/server/unit/semanticDiff.test.ts` que cubre cambios cosméticos, implementation-only, prototype-only heredado, ancestor signature, `.srd`/`DataObject`, markers/sourceOrigin, ORCA staging, external functions y bursts del watcher. Además, `src/server/knowledge/semanticDiff.ts` ya modela dependencias `DataObject`/`report`/`dddw` y trata los argumentos retrieve de `.srd` como contrato semántico.

## 3. Objetivo

Demostrar que cada cambio invalida solo el vecindario semántico necesario sobre snapshots, serving cache, dependency graph, manifest, diagnostics y topology markers, manteniendo verde el budget incremental existente.

## 4. Alcance

- reforzar `semanticDiff` para dependencias DataWindow y contrato retrieve de `.srd`;
- ampliar `watchedFileIntake.test.ts` hasta cubrir los casos mínimos de `B265`;
- reutilizar `performance/large-workspace-incremental` como gate de presupuesto incremental;
- alinear docs canónicas y mover el foco activo a `B266`.

## 5. Fuera de alcance

- abrir otro motor de invalidación, otro scheduler o otra API pública;
- introducir telemetría o métricas nuevas fuera del gate incremental existente;
- adelantar `B266+` bajo el pretexto de esta suite.

## 6. Criterios de aceptación

- AC1. la suite cubre cambio cosmético, prototype, implementation, ancestor, `.srd`, marker `.pbt/.pbproj`, `sourceOrigin`, ORCA staging, external function y `DataObject` binding.
- AC2. los cambios en `.srd` propagan invalidación a consumidores ligados mediante `DataObject` y contrato retrieve sin rediscovery global.
- AC3. ORCA staging no desplaza la surface real preferida ni invalida de más; markers/sourceOrigin siguen rematerializando solo lo necesario.
- AC4. `performance/large-workspace-incremental` permanece verde dentro del budget vigente.
- AC5. `docs/testing.md`, `docs/performance-budget.md`, backlog, roadmap, current-focus y done-log dejan `B265` cerrada y pasan el foco a `B266`.

## 7. Documentación afectada

- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticDiff.test.js out/test/server/unit/watchedFileIntake.test.js`
- `npx mocha --ui tdd out/test/server/performance/large-workspace-incremental.perf.test.js`

## 9. Cierre registrado

- la invalidación incremental ya queda probada sobre snapshots, serving cache, manifest, dependency graph, diagnostics y context packs sin abrir otra arquitectura;
- el diff snapshot-aware ya propaga contratos DataWindow relevantes y mantiene la preferencia real frente a ORCA staging;
- el siguiente foco canónico del repo pasa a `B266`.