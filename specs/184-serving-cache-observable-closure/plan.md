# Plan - Spec 184 Cierre observable de B071B en ServingCache

## 1. Resumen tecnico

Registrar el último restore y el último persist de la snapshot de ServingCache en `server.ts`, exponerlos en `powerbuilder.showStats` y cerrar `B071B` en documentación.

## 2. Estado actual

- El runtime ya restaura y persiste snapshots de ServingCache.
- `powerbuilder.showStats` no expone aún nada sobre ese estado persistente.

## 3. Diseno propuesto

- Variables locales en el servidor para `lastRestoredEntries` y `lastPersistedEntries`.
- Helper interno de persist para reutilizar la actualización del contador.
- `showStats` amplía `persistence` con `servingSnapshot`.

## 4. Impacto en rendimiento

- Despreciable; solo añade dos contadores y exposición en stats.

## 5. Riesgos tecnicos

- Olvidar algún call site de persist/restore dejaría métricas incoherentes.

## 6. Estrategia de validacion

- npm run compile
- npm run test:unit
- npm test

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/roadmap.md
- docs/done-log.md