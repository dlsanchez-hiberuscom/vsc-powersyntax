# Spec 305 - advanced PowerBuilder code metrics (B260)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B260` con un reporte read-only exportable de métricas avanzadas de código PowerBuilder, apoyado en la semántica real ya indexada y no en un motor paralelo de scoring.

## 2. Estado real actual

La extensión ya expone `PowerSyntax: Abrir Métricas Avanzadas de Código PowerBuilder`, el método `getPowerBuilderCodeMetrics()`, el tool read-only `code-metrics` y el comando servidor `powerbuilder.codeMetrics`, todos sirviendo un payload versionado con resumen global, hotspots por objeto, diagnostics por área y footprint build/ORCA.

## 3. Objetivo

Dar una surface defendible para inspeccionar hotspots técnicos y señales de modernización usando snapshots semánticos, diagnostics, bindings DataWindow y estado build/ORCA ya publicados, sin reparsear ni bloquear el hot path.

## 4. Alcance

- implementar un collector server-side sobre `KnowledgeBase`, `DiagnosticsSnapshot` y `WorkspaceState`;
- calcular por objeto funciones, eventos, complejidad aproximada, SQL embebido, DataWindows enlazadas, dependencias externas, lifecycle warnings y diagnostics;
- resumir diagnostics por área y footprint build/ORCA a nivel workspace;
- exponer el contrato por API pública, tool read-only y comando Markdown en cliente;
- alinear documentación viva y mover el foco canónico a `B261`.

## 5. Fuera de alcance

- introducir una puntuación absoluta de calidad o un segundo motor de scoring;
- ejecutar refactors, code actions o cambios write-enabled a partir del reporte;
- releer el workspace completo fuera de la base semántica ya publicada.

## 6. Criterios de aceptación

- AC1. el producto expone `ApiPowerBuilderCodeMetrics` por API pública, tool read-only y comando Markdown.
- AC2. el collector deriva métricas defendibles por objeto y un resumen global usando evidencia semántica ya indexada.
- AC3. el reporte incluye diagnostics por área y footprint build/ORCA con límites claros de truncado por `maxObjects`.
- AC4. la validación cubre collector, contrato público y comando/API real en host de VS Code.
- AC5. backlog, roadmap y current-focus dejan de tratar `B260` como deuda activa y pasan a `B261`.

## 7. Documentación afectada

- `docs/developer-workflows.md`
- `docs/testing.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npm run test:unit`
- `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`

## 9. Cierre registrado

- el producto ya exporta métricas avanzadas defendibles sobre la semántica real sin abrir un motor paralelo;
- el reporte read-only sirve hotspots, diagnostics por área y footprint build/ORCA por API/tool/comando;
- el siguiente foco canónico del repo pasa a `B261`.