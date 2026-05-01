# Spec 225 - QueryContext confidence surface (B157)

## 1. Resumen

Exponer la `resolutionConfidence` directamente en `DocumentQueryContext` para que los consumers inmediatos no dependan de navegar `resolvedTargets` cuando solo necesitan el bucket de confianza.

## 2. Problema

`createDocumentQueryContext()` ya encapsula el resultado detallado del query engine, pero todavía obliga a leer `resolvedTargets?.confidence` para una necesidad que ya es transversal.

## 3. Objetivo

Añadir una surface de conveniencia pequeña para la confidence de resolución dentro de `DocumentQueryContext`.

## 4. Alcance

- modelar `resolutionConfidence` en `DocumentQueryContext`;
- poblarla desde `resolvedTargets` cuando exista;
- cubrir la surface con test unitario focalizado.

## 5. Fuera de alcance

- gates por feature;
- nuevas decisiones de producto sobre confidence;
- cambios en providers LSP.

## 6. Requisitos

- R1. La nueva surface no puede recomputar la resolución.
- R2. Debe degradar a `undefined` cuando no haya contexto resoluble.
- R3. La validación debe ser ejecutable y centrada en `queryContext`.

## 7. Criterios de aceptacion

- AC1. `DocumentQueryContext` expone `resolutionConfidence`.
- AC2. La confidence se reutiliza desde `resolvedTargets`, sin duplicar cálculo.
- AC3. Existe test unitario focalizado sobre la nueva surface.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- La surface debe seguir siendo una conveniencia; la fuente de verdad continúa en `ResolvedTargetInfo`.
- Documentacion a revisar: `docs/done-log.md`.