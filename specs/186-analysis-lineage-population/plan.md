# Plan - Spec 186 Población inicial de lineage desde análisis (B172)

## 1. Resumen tecnico

Rellenar `lineage` en `mapToSemanticFacts` usando las señales ya disponibles en `SymbolFact`: declaración, implementación, tipo base y origen documental.

## 2. Estado actual

- `EntityLineage` existe en el modelo.
- `mapToSemanticFacts` ya conoce `declarationOnly` y `baseTypeName`, pero no los traduce a lineage.

## 3. Diseno propuesto

- Helper local pequeño para derivar `phase` y `role`.
- `inheritedFrom` se toma de `baseTypeName`.

## 4. Impacto en rendimiento

- Despreciable; solo añade shape a objetos ya creados.

## 5. Riesgos tecnicos

- Etiquetar como implementation símbolos que son solo declaración estructural.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "lineage"
- npm run compile
- npm test

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md