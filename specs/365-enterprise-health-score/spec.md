# Spec 365: Enterprise health score

## Status

Closed.

## Backlog mapping

- B296 — Enterprise health score.

## Objective

Proyectar un score agregado y explicable del workspace sobre el dashboard y el health report reutilizando sólo surfaces ya publicadas del runtime: readiness, diagnostics, build, ORCA, cache, sourceOrigin, performance y support matrix.

## Implemented scope

- `src/client/projectHealthDashboard.ts` añade un scorecard puro con ocho dimensiones ponderadas y degradación honesta cuando faltan snapshots auxiliares o la señal es parcial.
- El dashboard read-only y el health report exportado exponen el `enterprise health score` sin abrir una nueva API ni otro motor de health.
- `test/server/unit/projectHealthDashboard.test.ts` fija el cálculo puro y su proyección Markdown; `test/smoke/health-report.extension.test.ts` fija la exportación real del score.

## Out of scope

- Nuevas surfaces de servidor o nuevos RPC para scoring enterprise.
- Reemplazar el runtime self-test o la matriz de soporte ya cerrados.
- Políticas corporativas de settings/perfiles. Eso sigue perteneciendo a B294.

## Acceptance evidence

- El dashboard muestra un `enterprise health score` explicable por las ocho dimensiones previstas.
- El health report exportado congela ese score junto con stats y manifest reales.
- El cálculo sigue siendo cliente-side, read-only y derivado desde contracts/snapshots ya existentes.