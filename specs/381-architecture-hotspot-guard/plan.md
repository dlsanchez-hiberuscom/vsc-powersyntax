# Plan — Spec 381 Architecture hotspot guard

## Phase 1 — Convertir el baseline en budgets ejecutables

- [x] Medir los hotspots TypeScript reales del repo para fijar thresholds defendibles.
- [x] Separar los hotspots críticos del host cliente/servidor de los slices generated/manual que requieren allowlist explícita.

## Phase 2 — Publicar el rail reproducible

- [x] Implementar un runner local/CI que emita un reporte JSON y falle solo ante crecimiento injustificado.
- [x] Exponer el lane como `npm run test:architecture:metrics`.
- [x] Integrar el runner en la suite unitaria de arquitectura ya existente.

## Phase 3 — Cierre canónico

- [x] Validar `architectureImports` y el lane nuevo de métricas.
- [x] Alinear `docs/architecture.md`, `docs/testing.md`, `docs/current-focus.md`, `docs/backlog.md` y `docs/done-log.md` con el nuevo guard.
- [x] Mover `B353` fuera del backlog activo y devolver el foco a `B370`.