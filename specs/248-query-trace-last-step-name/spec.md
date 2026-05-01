# Spec 248 - Query trace last step name (B157/B136)

## 1. Resumen

Exponer en `TraceSnapshot` el nombre del último paso emitido como resumen escalar de cierre de la traza.

## 2. Problema

El snapshot ya conserva todo el array de pasos y varios resúmenes, pero falta una lectura inmediata del último evento observado.

## 3. Objetivo

Añadir `lastStepName` al snapshot de traza.

## 4. Alcance

- modelar `lastStepName?: string` en `TraceSnapshot`;
- poblarla al cerrar la traza;
- cubrir el resumen con tests unitarios focalizados.

## 5. Fuera de alcance

- resumen del último detalle;
- navegación incremental entre pasos;
- exposición pública adicional.

## 6. Requisitos

- R1. `lastStepName` debe reflejar el último nombre emitido, o quedar indefinido si no hubo pasos.
- R2. El resumen no debe cambiar el contrato del array `steps`.
- R3. La validación debe ser ejecutable y centrada en `queryTrace`.

## 7. Criterios de aceptacion

- AC1. `TraceSnapshot` expone `lastStepName`.
- AC2. El valor coincide con el último paso emitido.
- AC3. Existe cobertura unitaria focalizada.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- El resumen debe derivarse al cerrar la traza, no recalcularse externamente.
- Documentacion a revisar: `docs/done-log.md`.