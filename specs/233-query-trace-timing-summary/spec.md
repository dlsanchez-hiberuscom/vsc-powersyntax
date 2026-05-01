# Spec 233 - Query trace timing summary (B157/B136)

## 1. Resumen

Enriquecer `TraceSnapshot` con marcas temporales de inicio/fin y una duración derivada para inspección ligera del coste de la última traza.

## 2. Problema

La traza ya conserva pasos y conteo, pero no ofrece aún un resumen temporal que permita saber cuánto duró la captura sin instrumentación adicional.

## 3. Objetivo

Añadir `startedAt`, `endedAt` y `durationMs` al snapshot de traza.

## 4. Alcance

- modelar timestamps y duración en `TraceSnapshot`;
- capturarlos al abrir/cerrar `withTrace()`;
- cubrir la coherencia temporal con tests unitarios focalizados.

## 5. Fuera de alcance

- percentiles o histogramas;
- timers de alta resolución;
- exposición pública en API.

## 6. Requisitos

- R1. `durationMs` debe derivarse de `endedAt - startedAt`.
- R2. Los snapshots devueltos por `getLastTrace()` deben conservar un resumen temporal coherente.
- R3. La validación debe ser ejecutable y centrada en `queryTrace`.

## 7. Criterios de aceptacion

- AC1. `TraceSnapshot` expone `startedAt`, `endedAt` y `durationMs`.
- AC2. Los valores temporales son coherentes entre sí.
- AC3. Existe test unitario focalizado.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- La instrumentación debe seguir siendo ligera y no bloquear.
- Documentacion a revisar: `docs/done-log.md`.