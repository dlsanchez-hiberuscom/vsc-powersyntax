# Plan — Spec 374 Enumerated catalog model breaking normalization

## Phase 1 — Catalog contract split

- [x] Añadir `enumerated-type` / `enumerated-types` y metadata específica al contrato base del catálogo.
- [x] Normalizar `manual/language/enumerations/` para que tipos y valores usen nombres canónicos distintos.

## Phase 2 — Query layer and visible consumers

- [x] Ajustar índices, query APIs y `SystemCatalog` al nuevo modelo sin scans completos ni aliases legacy.
- [x] Alinear completion y hover con `enumerated-types` y `enumerated-values`.

## Phase 3 — Guardrails and canonical closure

- [x] Endurecer `catalogV2`, `systemCatalogQueryHardening`, `catalogConsistency` y tests de completion/surfaces.
- [x] Validar catálogo focal y surfaces visibles con suites ejecutables.
- [x] Sacar B360 del backlog activo, mover el foco a B361 y registrar el cierre en docs/spec.