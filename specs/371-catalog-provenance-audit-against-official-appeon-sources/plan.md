# Plan — Spec 371 Catalog provenance audit against official Appeon sources

## Phase 1 — Executable provenance audit

- [x] Extender `consistency.ts` con counts, summaries por dominio y guards de metadata/provenance.
- [x] Fijar el mapping `manual-core -> manual/curated` y `generated -> generated/official` como contrato ejecutable.

## Phase 2 — Focused validation

- [x] Añadir `catalogProvenanceAudit.test.ts` con representative domains y guards de metadata oficial.
- [x] Validar compilación (`npm run build:test`).
- [x] Validar suites focales (`npm run test:unit -- --grep "catalogConsistency|catalogProvenanceAudit"`).

## Phase 3 — Canonical closure

- [x] Sacar B339 del backlog activo.
- [x] Registrar el cierre en `done-log.md` y mover `current-focus.md` al siguiente slice.
- [x] Alinear architecture, testing, roadmap y guía técnica con el nuevo contrato de provenance.