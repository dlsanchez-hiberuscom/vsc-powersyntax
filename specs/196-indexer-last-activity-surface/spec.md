# Spec 196 - Indexer last activity surface (B126)

## 1. Resumen

Ampliar el snapshot publico del indexador con la ultima URI procesada, la ultima URI fallida y el contador de ejecuciones parciales.

## 2. Problema

`getIndexerStatus()` ya expone fase, pass, presupuesto y contadores por estado, pero sigue sin contarle al operador cual fue el ultimo archivo tocado ni si el motor ya ha quedado parcial por cancelacion. Eso deja `B126` corto para debugging y observabilidad real.

## 3. Objetivo

Cerrar `B126` con una superficie de estado del indexador util para inspeccion y soporte.

## 4. Alcance

- Añadir `lastProcessedUri` al snapshot del indexador.
- Añadir `lastFailedUri` al snapshot del indexador.
- Añadir `partialRuns` al snapshot del indexador.
- Cubrirlo con tests unitarios de `workspaceIndexer`.

## 5. Fuera de alcance

- Un journal historico completo del motor (`B163`).
- Health checks formales (`B176`).
- Unificar todavia progreso y readiness (`B134`).

## 6. Criterios de aceptacion

- AC1. El indexador expone la ultima URI procesada.
- AC2. El indexador expone la ultima URI fallida cuando la hay.
- AC3. El indexador contabiliza ejecuciones parciales por cancelacion.
- AC4. `B126` puede pasar a `Done` con tests focalizados verdes.

## 7. Riesgos y notas

- El cambio debe mantener el snapshot ligero y sin convertirlo aun en un event log.
- Documentacion a revisar: `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/done-log.md`.