# Spec 228 - QueryContext target count (B157)

## 1. Resumen

Exponer el número de targets resueltos directamente en `DocumentQueryContext` para simplificar consumers que solo necesitan cardinalidad.

## 2. Problema

El contexto documental ya conoce el resultado detallado, pero el acceso a la cardinalidad de `targets` sigue siendo indirecto y repetitivo.

## 3. Objetivo

Añadir una surface pequeña para `resolutionTargetCount` sin recalcular la resolución.

## 4. Alcance

- modelar `resolutionTargetCount` en `DocumentQueryContext`;
- poblarla desde `resolvedTargets?.targets.length`;
- cubrir rutas no ambigua, ambigua y sin contexto.

## 5. Fuera de alcance

- cambios en ranking;
- nuevas políticas de desempate;
- gates por feature.

## 6. Requisitos

- R1. La surface no debe recalcular el query.
- R2. Debe degradar a `0` cuando no haya contexto resoluble.
- R3. La validación debe ser ejecutable y centrada en `queryContext`.

## 7. Criterios de aceptacion

- AC1. `DocumentQueryContext` expone `resolutionTargetCount`.
- AC2. El valor coincide con `resolvedTargets?.targets.length`.
- AC3. Existe test unitario focalizado.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- La fuente de verdad sigue estando en `ResolvedTargetInfo.targets`.
- Documentacion a revisar: `docs/done-log.md`.