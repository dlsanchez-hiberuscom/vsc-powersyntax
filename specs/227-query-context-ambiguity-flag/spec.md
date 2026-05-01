# Spec 227 - QueryContext ambiguity flag (B157)

## 1. Resumen

Exponer una bandera explícita de ambigüedad de resolución en `DocumentQueryContext` para evitar que los consumers tengan que inspeccionar toda la evidence.

## 2. Problema

Tras `Specs 221-223`, la ambigüedad ya existe en el query engine, pero `DocumentQueryContext` todavía no proyecta un indicador directo para esa condición.

## 3. Objetivo

Añadir una surface booleana de conveniencia para saber si el winner path quedó ambiguo.

## 4. Alcance

- modelar `hasResolutionAmbiguity` en `DocumentQueryContext`;
- derivarla desde la evidence ya calculada;
- cubrir un caso ambiguo con test unitario focalizado.

## 5. Fuera de alcance

- nuevos criterios de desempate;
- cambios en ranking o gates;
- exposición pública en API.

## 6. Requisitos

- R1. La surface no debe recalcular ranking.
- R2. Debe ser `false` cuando no exista contexto o no haya ambigüedad.
- R3. La validación debe ser ejecutable y centrada en `queryContext`.

## 7. Criterios de aceptacion

- AC1. `DocumentQueryContext` expone `hasResolutionAmbiguity`.
- AC2. El valor se deriva de la evidence existente.
- AC3. Existe test unitario focalizado para un caso ambiguo.
- AC4. La slice queda registrada en `done-log.md`.

## 8. Riesgos y notas

- La fuente de verdad sigue estando en `ResolvedTargetInfo.evidence`.
- Documentacion a revisar: `docs/done-log.md`.