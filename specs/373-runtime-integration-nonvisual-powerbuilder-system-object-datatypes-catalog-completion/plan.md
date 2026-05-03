# Plan — Spec 373 Runtime, integration and nonvisual PowerBuilder system object datatypes catalog completion

## Phase 1 — Runtime and integration rails

- [x] Consolidar los módulos `manual/runtime/*` y `manual/integration/*` como agregadores estables del catálogo nonvisual moderno.
- [x] Completar los tipos faltantes por ownership (mail, profiling, pdf, http/rest/oauth, reflexión y system types base).

## Phase 2 — Canonical naming and parser alignment

- [x] Fijar casing canónico para tipos runtime/integration visibles al usuario.
- [x] Alinear `PB_BUILTIN_TYPES` con los tipos representativos y mantener el split visual/runtime ya cerrado en `B358`.

## Phase 3 — Focused validation and canonical closure

- [x] Endurecer `runtimeCatalogDatatypes.test.ts` para cubrir la lista completa B359 en `manual-core` y excluir extractor noise.
- [x] Validar suites focales (`runtimeCatalogDatatypes|catalogV2`).
- [x] Validar catálogo ampliado (`catalog|systemCatalog|catalogConsistency|nativeAncestors|ownerTypes`).
- [x] Validar surfaces visibles (`completion|hover|signatureHelp`).
- [x] Sacar B359 del backlog activo y mover `current-focus.md` al siguiente slice (`B360`).
- [x] Alinear architecture, testing, rules catalog, roadmap y guía técnica con el cierre del rail runtime/integration.