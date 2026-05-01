# Plan - Spec 190 Bridge de provenance de sistema a lineage (B172)

## 1. Resumen tecnico

Añadir un mapper puro `systemProvenanceToLineage()` en `system/normalization.ts` y probarlo con dos casos representativos del catálogo.

## 2. Estado actual

- `PbSystemSymbolProvenance` ya existe.
- No hay bridge formal a `EntityLineage`.

## 3. Diseno propuesto

- `sourceKind: 'system'` fijo.
- `authority` se conserva.
- `confidence` se deriva según la autoridad.

## 4. Impacto en rendimiento

- Nulo; helper puro sin coste relevante.

## 5. Riesgos tecnicos

- Elegir una confianza base demasiado agresiva para datasets custom/project/workspace.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "systemProvenanceToLineage"
- npm run compile
- npm test

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md