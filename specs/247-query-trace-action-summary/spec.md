# Spec 247 - Query trace action summary (B157/B136)

## 1. Resumen

Exponer en `TraceSnapshot` la lista ordenada de acciones únicas presentes en la última traza capturada.

## 2. Problema

La `Spec 231` ya enriquece cada paso con `action`, pero el snapshot todavía no resume qué acciones se observaron en conjunto.

## 3. Objetivo

Añadir `actions` al snapshot como resumen ligero de acciones únicas observadas.

## 4. Alcance

- modelar `actions: string[]` en `TraceSnapshot`;
- derivarlas desde los `TraceStep.action` al cerrar la traza;
- cubrir el resumen con tests unitarios focalizados.

## 5. Fuera de alcance

- contadores por acción;
- ordenaciones alternativas;
- exposición pública adicional.

## 6. Requisitos

- R1. El resumen debe preservar el orden de primera aparición.
- R2. Acciones duplicadas no deben repetirse.
- R3. La validación debe ser ejecutable y centrada en `queryTrace`.

## 7. Criterios de aceptacion

- AC1. `TraceSnapshot` expone `actions`.
- AC2. El resumen contiene acciones únicas en orden de aparición.
- AC3. Existe cobertura unitaria focalizada.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- El resumen debe derivarse solo de `TraceStep.action`, no del nombre bruto.
- Documentacion a revisar: `docs/done-log.md`.