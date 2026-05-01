# Plan - Spec 196 Indexer last activity surface (B126)

## 1. Resumen tecnico

Ampliar el snapshot publico del indexador con la ultima URI procesada, la ultima URI fallida y el contador de ejecuciones parciales.

## 2. Estado actual

- `getIndexerStatus()` ya exponia fase, pass, presupuesto y contadores.
- Faltaba visibilidad sobre el ultimo archivo procesado, el ultimo fallo y las ejecuciones parciales.

## 3. Diseno propuesto

- Anadir `lastProcessedUri`, `lastFailedUri` y `partialRuns` al snapshot.
- Mantener la superficie ligera y util para debugging.
- Cubrir la salida con tests unitarios de `workspaceIndexer`.

## 4. Impacto en el runtime

- Cierra `B126` como superficie publica del indexador.
- Mejora observabilidad sin convertir el snapshot en un event log.

## 5. Riesgos tecnicos

- Inflar el snapshot con historico excesivo.
- Perder estabilidad en tests que dependen de estado heredado del modulo.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/workspaceIndexer"`
- `npm run compile`
- `npm run test:unit`

## 7. Documentacion a actualizar

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/roadmap.md`