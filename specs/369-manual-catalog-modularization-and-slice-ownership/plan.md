# Plan — Spec 369 Manual catalog modularization and slice ownership

## Phase 1 — Physical layout

- [x] Crear carpetas funcionales bajo `manual/` y mover los slices manuales ya existentes al dominio adecuado.

## Phase 2 — Stable ownership surfaces

- [x] Sacar fuentes base a `sources.ts` y owner groups a `ownerTypes/`.
- [x] Dejar `common.ts` como helper/factory-only.
- [x] Publicar agregadores estables desde `manual/index.ts`.

## Phase 3 — Consumer rewiring

- [x] Hacer que `registry/datasets.ts` consuma agregadores estables del catálogo manual.
- [x] Corregir consumers secundarios (`generated/common.ts`, `nativeAncestors.ts`) para que no dependan de `manual/common.ts`.

## Phase 4 — Validation and closure

- [x] Validar compilación completa (`npm run build:test`).
- [x] Validar la suite unitaria completa (`npm run test:unit`).
- [x] Alinear backlog, done-log, current-focus y documentación canónica afectada.