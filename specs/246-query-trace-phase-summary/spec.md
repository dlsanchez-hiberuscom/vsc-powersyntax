# Spec 246 - Query trace phase summary (B157/B136)

## 1. Resumen

Exponer en `TraceSnapshot` la lista ordenada de fases únicas presentes en la última traza capturada.

## 2. Problema

La `Spec 230` ya enriquece cada paso con `phase`, pero el snapshot todavía no ofrece un resumen agregado de las fases vistas.

## 3. Objetivo

Añadir `phases` al snapshot como resumen ligero y ordenado de las fases únicas observadas.

## 4. Alcance

- modelar `phases: string[]` en `TraceSnapshot`;
- derivarlas desde los `TraceStep` al cerrar la traza;
- cubrir el resumen con tests unitarios focalizados.

## 5. Fuera de alcance

- contadores por fase;
- ordenación alfabética;
- exposición pública adicional.

## 6. Requisitos

- R1. El resumen debe preservar el orden de primera aparición.
- R2. Fases duplicadas no deben repetirse.
- R3. La validación debe ser ejecutable y centrada en `queryTrace`.

## 7. Criterios de aceptacion

- AC1. `TraceSnapshot` expone `phases`.
- AC2. El resumen contiene fases únicas en orden de aparición.
- AC3. Existe cobertura unitaria focalizada.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- El resumen debe derivarse solo de `TraceStep.phase`, no del nombre bruto.
- Documentacion a revisar: `docs/done-log.md`.