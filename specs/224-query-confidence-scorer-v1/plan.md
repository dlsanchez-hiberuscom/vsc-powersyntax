# Plan - Spec 224 Confidence scorer v1 (B157)

## 1. Resumen tecnico

Introducir un helper puro que derive una confidence general del resultado detallado del query engine usando `reasonCodes`, lineage, misses contextuales y ambigüedad.

## 2. Estado actual

- el runtime ya conoce ganador, descartes, ambigüedad y lineage;
- falta sintetizar esa información en una confidence pequeña y estable.

## 3. Diseno propuesto

- anadir `QueryResolutionConfidence` con buckets `high`, `medium` y `low`;
- derivarla sin tocar la selección de `targets`;
- cubrir rutas representativas en tests unitarios.

## 4. Impacto en el runtime

- prepara el terreno para confidence gates y serving cache semántico;
- mantiene todo el cálculo dentro de `semanticQueryService`.

## 5. Riesgos tecnicos

- mezclar confidence de lineage con policy de feature demasiado pronto;
- marcar como alta una ruta todavía ambigua o fallback.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/semanticQueryService"`

## 7. Documentacion a actualizar

- `docs/done-log.md`