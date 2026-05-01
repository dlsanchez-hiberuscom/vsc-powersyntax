# Spec 187 - Normalización de lineage en enrichEntity (B172)

## 1. Resumen

Centralizar en `enrichEntity` la normalización mínima de `lineage` para que los campos derivados no se repartan entre parser, KB y surfaces.

## 2. Problema

`analyzeDocument` ya produce lineage básico, pero otros productores o futuras ampliaciones podrían olvidar defaults y romper la coherencia entre `isPrototype`, `implementationKind` y `lineage`.

## 3. Objetivo

Hacer que `enrichEntity` complete y normalice el lineage mínimo cuando falten piezas derivables.

## 4. Alcance

- Completar `phase`, `role`, `sourceKind`, `authority`, `confidence` e `inheritedFrom` cuando falten.
- Reusar señales ya presentes (`isPrototype`, `implementationKind`, `baseTypeName`).
- Mantener intactos los valores explícitos ya presentes.

## 5. Fuera de alcance

- Bridge con símbolos de sistema.
- Winner lineage de resolución.
- Exposición en hover o API pública.

## 6. Requisitos

- R1. Si falta `lineage`, `enrichEntity` debe poder construir uno mínimo útil.
- R2. Los valores explícitos del caller deben preservarse.
- R3. `inheritedFrom` debe caer a `baseTypeName` si falta.

## 7. Criterios de aceptacion

- AC1. `enrichEntity` normaliza lineage sin romper el contrato existente.
- AC2. Prototype e implementation quedan coherentes entre campos derivados.
- AC3. Compile y baseline completo quedan en verde.

## 8. Riesgos y notas

- Si `enrichEntity` y `documentAnalysis` divergen, B172 se vuelve inconsistente.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.