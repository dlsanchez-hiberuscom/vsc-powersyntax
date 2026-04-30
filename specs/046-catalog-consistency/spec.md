# Spec 046 — Catalog consistency report (B132)

## Motivación
Reporte que verifica integridad del catálogo system: nombres únicos por
domain+owner, IDs únicos, sin signatures vacías.

## Alcance
- `src/server/knowledge/system/consistency.ts`:
  - `buildCatalogConsistencyReport(): CatalogReport` con `duplicateIds`,
    `missingSignatures`, `domainCounts`, `datasetCounts`.
- Tests.

## Criterios
1. Devuelve `duplicateIds = []` y `missingSignatures = []` en estado actual.
2. Domain counts cuadran con `size()`.
