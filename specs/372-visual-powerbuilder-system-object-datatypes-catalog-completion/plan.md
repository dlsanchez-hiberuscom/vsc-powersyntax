# Plan — Spec 372 Visual PowerBuilder system object datatypes catalog completion

## Phase 1 — Split visual rail

- [x] Crear slices estables bajo `manual/visual/` y mover allí el catálogo visual curado.
- [x] Recombinar visual + runtime desde `manual/index.ts` sin romper el dominio público `system-object-datatypes`.

## Phase 2 — Classification and semantic alignment

- [x] Fijar `Application` como runtime/system y separar `OLEControl`/`OLECustomControl` como `OLE visual`.
- [x] Alinear owner groups, ancestros nativos y `PB_BUILTIN_TYPES` para tipos visuales avanzados y Ribbon.

## Phase 3 — Focused validation and canonical closure

- [x] Añadir `visualCatalogDatatypes.test.ts` con representative types y guards de clasificación.
- [x] Validar compilación (`npm run build:test`).
- [x] Validar suites focales (`npm run test:unit -- --grep "visualCatalogDatatypes|catalogV2"`).
- [x] Sacar B358 del backlog activo y mover `current-focus.md` al siguiente slice (`B359`).
- [x] Alinear architecture, testing, roadmap y guía técnica con el cierre del rail visual.