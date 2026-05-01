# Plan - Spec 188 Semantic diff consciente de lineage (B172)

## 1. Resumen tecnico

Extender `serializeEntity()` con una porción estable de `lineage` para que el diff capture cambios semánticos de provenance/phase/herencia.

## 2. Estado actual

- `semanticDiff` compara kind, firma, tipo, access y prototype.
- No compara lineage.

## 3. Diseno propuesto

- Añadir a la serialización `sourceKind`, `authority`, `phase`, `role`, `inheritedFrom` y `confidence`.

## 4. Impacto en rendimiento

- Mínimo; solo amplía una concatenación ya existente.

## 5. Riesgos tecnicos

- Sobreinvalidar si se meten campos demasiado cambiantes.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "lineage en diff"
- npm run compile
- npm test

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md