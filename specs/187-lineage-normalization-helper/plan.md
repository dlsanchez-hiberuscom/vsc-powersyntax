# Plan - Spec 187 Normalización de lineage en enrichEntity (B172)

## 1. Resumen tecnico

Añadir un derivador puro de lineage en `enrichEntity` que complete defaults y preserve overrides explícitos.

## 2. Estado actual

- `enrichEntity` ya centraliza derivados como `implementationKind`, `kindLabel` y `signatureLabel`.
- No toca aún `lineage`.

## 3. Diseno propuesto

- Helper `deriveLineage` dentro de `enrichEntity.ts`.
- Defaults conservadores basados en `isPrototype`, `implementationKind` y `baseTypeName`.

## 4. Impacto en rendimiento

- Nulo; es un helper puro ya usado para enriquecer entidades.

## 5. Riesgos tecnicos

- Introducir defaults demasiado agresivos para entidades no documentales.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "lineage"
- npm run compile
- npm test

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md