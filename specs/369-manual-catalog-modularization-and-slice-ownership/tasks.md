# Tasks — Spec 369 Manual catalog modularization and slice ownership

- [x] Crear la estructura funcional base bajo `src/server/knowledge/system/manual/` y mover los slices manuales existentes a carpetas por dominio.
- [x] Extraer `sources.ts` y `ownerTypes/` fuera de `manual/common.ts`.
- [x] Mantener `manual/common.ts` como módulo helper-only con factories del catálogo.
- [x] Exponer `PB_MANUAL_CORE_DATASET_SLICES` y `PB_MANUAL_CORE_OWNER_TYPE_GROUPS` desde `manual/index.ts`.
- [x] Desacoplar `registry/datasets.ts`, `generated/common.ts` y `nativeAncestors.ts` de imports frágiles hacia `manual/common.ts`.
- [x] Añadir cobertura estructural del catálogo manual y validar con `npm run build:test` + `npm run test:unit`.
- [x] Cerrar B357 en spec/backlog/current-focus/done-log y alinear arquitectura, testing, roadmap y guía técnica.