# Spec 229 - QueryContext evidence kinds (B157)

## 1. Resumen

Exponer los tipos de evidencia presentes en la resolución directamente en `DocumentQueryContext` como una lista compacta de `kind`.

## 2. Problema

Las capas consumidoras que solo necesitan saber qué explicaciones hay disponibles siguen obligadas a inspeccionar la evidence completa y heterogénea.

## 3. Objetivo

Añadir una surface resumida con los `kind` presentes en la evidence del resultado detallado.

## 4. Alcance

- modelar `resolutionEvidenceKinds` en `DocumentQueryContext`;
- poblarla desde `resolvedTargets?.evidence`;
- cubrir caso simple, ambiguo y sin contexto con test unitario focalizado.

## 5. Fuera de alcance

- resumir payloads completos;
- exposición pública en API;
- cambios en el contrato de evidence del query engine.

## 6. Requisitos

- R1. La surface debe reutilizar la evidence ya calculada.
- R2. Debe degradar a una lista vacía cuando no haya contexto resoluble.
- R3. La validación debe ser ejecutable y centrada en `queryContext`.

## 7. Criterios de aceptacion

- AC1. `DocumentQueryContext` expone `resolutionEvidenceKinds`.
- AC2. La surface resume los `kind` de `resolvedTargets?.evidence`.
- AC3. Existe test unitario focalizado.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- La source of truth sigue siendo `ResolvedTargetInfo.evidence`.
- Documentacion a revisar: `docs/done-log.md`.