# Plan — Spec 365 Enterprise health score

## Phase 1 — Anchor existing surface

- [x] Confirmar que el score podía vivir en `projectHealthDashboard.ts` y proyectarse vía dashboard/health report ya existentes.
- [x] Verificar que no hacía falta tocar servidor ni contrato público.

## Phase 2 — Pure score model

- [x] Añadir un scorecard puro con dimensiones ponderadas para readiness, diagnostics, build, ORCA, cache, sourceOrigin, performance y support matrix.
- [x] Fijar degradación honesta con snapshots parciales o ausentes.

## Phase 3 — Visible projection

- [x] Proyectar el score dentro del dashboard Markdown y, por extensión, del health report exportado.
- [x] Mantener el dashboard como surface read-only sin duplicar semántica ni observabilidad.

## Phase 4 — Closure

- [x] Añadir validación unitaria focal del score y del Markdown.
- [x] Validar la exportación real del health report.
- [x] Alinear README, docs/workflows, backlog, current-focus y done-log.