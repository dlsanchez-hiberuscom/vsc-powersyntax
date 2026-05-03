# Spec 369: Manual catalog modularization and slice ownership

## Status

Closed.

## Backlog mapping

- B357 — Manual catalog modularization and slice ownership.

## Objective

Reorganizar `src/server/knowledge/system/manual/` en slices funcionales con ownership explícito, sacando `sources` y `ownerTypes` fuera de `common.ts`, y dejando `manual/index.ts` como agregador estable para el registry y el resto de consumers.

## Implemented scope

- La estructura manual se reorganiza en `language/`, `datawindow/`, `runtime/`, `core/`, `ownerTypes/`, `visual/` e `integration/`, moviendo los slices existentes a carpetas funcionales sin cambiar entries ni metadata semántica.
- `src/server/knowledge/system/manual/common.ts` queda reducido a factories/helpers; las fuentes base pasan a `manual/sources.ts` y los owner groups a `manual/ownerTypes/`.
- `src/server/knowledge/system/manual/index.ts` publica `PB_MANUAL_CORE_DATASET_SLICES` y `PB_MANUAL_CORE_OWNER_TYPE_GROUPS` como superficies estables, y `src/server/knowledge/system/registry/datasets.ts` deja de importar owner groups o sub-slices desde rutas internas frágiles.
- `src/server/knowledge/system/generated/common.ts` y `src/server/knowledge/system/nativeAncestors.ts` consumen el catálogo manual a través del agregador estable.
- `test/server/unit/manualCatalogStructure.test.ts` añade cobertura estructural de slices manuales y ownership, mientras la suite unitaria completa valida que no haya regresiones del catálogo ni de sus consumers.

## Out of scope

- Completar todavía los slices vacíos o futuros de `visual/`, `integration/`, `runtime/` y `datawindow/` que quedan trazados para B358/B359.
- Cambiar IDs, `kind`, `domain`, `namespace`, `invocation`, `ownerTypes` o prioridades visibles del catálogo.
- Reescribir queries/indexes del catálogo; ese hardening queda para B365.

## Acceptance evidence

- `manual/common.ts` ya no contiene arrays grandes ni owner groups.
- `manual/sources.ts` y `manual/ownerTypes/` concentran provenance y owner typing base.
- `manual/index.ts` expone agregadores estables y `registry/datasets.ts` consume `PB_MANUAL_CORE_DATASET_SLICES`/`PB_MANUAL_CORE_OWNER_TYPE_GROUPS`.
- `npm run build:test` compila limpio tras el refactor.
- `npm run test:unit` pasa completo, incluyendo `manualCatalogStructure`, `catalogConsistency`, `catalogV2`, `completion`, `hover`, `signatureHelp` y `architectureImports`.