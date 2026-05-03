# Spec 309 - semantic consistency oracle (B264)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B264` dejando un oracle interno que compare las surfaces read-only ya publicadas y detecte drift defendible con reason codes sobre identidad del objeto, provenance, readiness, diagnostics y DataWindow bindings, sin abrir otro motor ni otra API pública.

## 2. Estado real actual

El repo ya dispone de un oracle interno en `src/server/features/semanticConsistencyOracle.ts` que cruza `currentObjectContext`, `semanticWorkspaceManifest`, `dependencyGraph`, diagnostics directos, `dataWindowSqlLineage` y `crossProjectSymbolConflicts`, además de una inferencia compartida de `objectKind` reutilizada por currentObjectContext y el manifest.

## 3. Objetivo

Demostrar que las surfaces read-only cuentan la misma historia sobre el mismo objeto/símbolo y que cualquier divergencia queda explicada por reason codes explícitos, incluyendo budgets truncados del manifest y coexistencia real/orca-staging.

## 4. Alcance

- normalizar `objectKind` entre currentObjectContext y manifest;
- crear el oracle interno cross-surface con reason codes para `objectName`, `objectKind`, `project`, `library`, `sourceOrigin`, ancestro base, diagnostics, readiness, confidence y DataObject bindings;
- cubrir casos sanos, divergencias forzadas, DataWindow, ORCA staging y corpus reales PFC/OrderEntry;
- alinear docs canónicas y mover el foco activo a `B265`.

## 5. Fuera de alcance

- publicar una API pública nueva para el oracle;
- abrir otro índice, otro manifest o un segundo motor semántico paralelo;
- resolver todavía `B265+` bajo el pretexto de esta comprobación cross-surface.

## 6. Criterios de aceptación

- AC1. `currentObjectContext` y `semanticWorkspaceManifest` comparten un `objectKind` normalizado defendible para el mismo archivo real.
- AC2. existe un oracle interno con reason codes explícitos para drift cross-surface y comportamiento honesto ante manifest truncado.
- AC3. la validación cubre un caso sano, un caso con divergencias forzadas, DataWindow, ORCA staging y corpus reales PFC/OrderEntry.
- AC4. `docs/architecture.md` y `docs/testing.md` reflejan el oracle y su validación.
- AC5. backlog, roadmap, current-focus y done-log dejan `B264` cerrada y pasan el foco a `B265`.

## 7. Documentación afectada

- `docs/architecture.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/semanticConsistencyOracle.test.js`
- `npx mocha --ui tdd out/test/server/performance/semanticConsistencyOracle.smoke.test.js`

## 9. Cierre registrado

- el oracle cross-surface ya detecta drift defendible sin abrir otro motor semántico;
- PFC, OrderEntry, DataWindow y ORCA staging ya quedan cubiertos por validación focal del oracle;
- el siguiente foco canónico del repo pasa a `B265`.