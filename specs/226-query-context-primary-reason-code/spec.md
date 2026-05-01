# Spec 226 - QueryContext primary reason code (B157)

## 1. Resumen

Exponer el `reasonCode` principal de resolución directamente en `DocumentQueryContext` como surface de conveniencia.

## 2. Problema

El contexto documental ya conoce el resultado detallado, pero sigue obligando a los consumers a entrar en `resolvedTargets?.reasonCodes[0]` para obtener la causa principal del winner path.

## 3. Objetivo

Añadir una surface explícita para el `reasonCode` principal sin duplicar cálculo ni redefinir el contrato del query engine.

## 4. Alcance

- modelar `primaryResolutionReasonCode` en `DocumentQueryContext`;
- poblarlo desde `resolvedTargets?.reasonCodes[0]`;
- cubrir la nueva surface con test unitario focalizado.

## 5. Fuera de alcance

- normalización adicional de reason codes;
- cambios de comportamiento en `semanticQueryService`;
- feature gates.

## 6. Requisitos

- R1. La surface debe reutilizar el primer `reasonCode` ya calculado.
- R2. Debe degradar a `undefined` sin contexto resoluble.
- R3. La validación debe ser ejecutable y centrada en `queryContext`.

## 7. Criterios de aceptacion

- AC1. `DocumentQueryContext` expone `primaryResolutionReasonCode`.
- AC2. El valor coincide con `resolvedTargets?.reasonCodes[0]`.
- AC3. Existe test unitario focalizado.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- La fuente de verdad sigue siendo `ResolvedTargetInfo`.
- Documentacion a revisar: `docs/done-log.md`.