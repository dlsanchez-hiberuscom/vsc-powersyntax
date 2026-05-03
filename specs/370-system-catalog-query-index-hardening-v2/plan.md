# Plan — Spec 370 System catalog query/index hardening v2

## Phase 1 — Composite indexes

- [x] Añadir claves compuestas estables para `domain+lookup`, `kind+lookup`, `enumValueOf` y `ownerType+domain`.
- [x] Congelar buckets de índices antes de exponerlos a consumers.

## Phase 2 — Query service hardening

- [x] Mover queries indexadas y owner-scoped a `queryService.ts`.
- [x] Dejar `SystemCatalog.ts` como facade sobre esas APIs.
- [x] Hacer explícita la prioridad de `resolveLanguageSymbol()`.

## Phase 3 — Validation and closure

- [x] Validar compilación (`npm run build:test`).
- [x] Validar suites focales (`npm run test:unit -- --grep "systemCatalogQueryHardening|catalogV2"`).
- [x] Alinear backlog, done-log, current-focus, roadmap, testing, architecture y guía técnica.