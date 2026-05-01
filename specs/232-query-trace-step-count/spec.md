# Spec 232 - Query trace step count (B157/B136)

## 1. Resumen

Exponer en `TraceSnapshot` el número total de pasos capturados como resumen inmediato del tamaño de la traza.

## 2. Problema

La traza ya conserva el array de pasos, pero falta un resumen directo que permita inspección rápida sin recorrerlo externamente.

## 3. Objetivo

Añadir `stepCount` al snapshot de traza y mantenerlo coherente con `steps.length`.

## 4. Alcance

- modelar `stepCount` en `TraceSnapshot`;
- poblarla al cerrar la traza;
- cubrir la coherencia del resumen con tests unitarios focalizados.

## 5. Fuera de alcance

- métricas temporales;
- agregaciones por fase;
- exposición pública en API.

## 6. Requisitos

- R1. `stepCount` debe reflejar exactamente `steps.length`.
- R2. `getLastTrace()` debe devolver una copia coherente del resumen.
- R3. La validación debe ser ejecutable y centrada en `queryTrace`.

## 7. Criterios de aceptacion

- AC1. `TraceSnapshot` expone `stepCount`.
- AC2. El valor coincide con la longitud de `steps`.
- AC3. Existe test unitario focalizado.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- El resumen no debe convertirse en una segunda fuente de verdad separada del array real.
- Documentacion a revisar: `docs/done-log.md`.