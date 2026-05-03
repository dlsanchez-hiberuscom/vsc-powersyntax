# Spec 306 - technical debt and modernization report (B261)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B261` con un informe read-only exportable de deuda técnica y modernización, priorizado sobre evidencia real ya publicada por el runtime y sin abrir un segundo motor de scoring.

## 2. Estado real actual

La extensión ya expone `PowerSyntax: Abrir Informe Técnico de Deuda y Modernización PowerBuilder`, el método `getPowerBuilderTechnicalDebtReport()`, el tool read-only `technical-debt-report` y el comando servidor `powerbuilder.technicalDebtReport`, todos sirviendo hotspots priorizados y recomendaciones accionables con `priority`, `confidence` y `evidence`.

## 3. Objetivo

Dar un reporte defendible que consolide patrones legacy, funciones obsoletas, SQL dinámico, dependencias externas, riesgos DataWindow, objetos complejos, `sourceOrigin` risks y riesgos ORCA/PBL usando métricas y diagnósticos ya existentes, sin añadir reglas nuevas por la puerta de atrás.

## 4. Alcance

- implementar un collector server-side que componga `code-metrics`, `diagnostic.code`, `sourceOrigin` summary y `workspaceMigrationAssistant`;
- priorizar hotspots por objeto con categorías, `priority`, `confidence`, `evidence` y recomendaciones;
- consolidar recomendaciones de layout/sourceOrigin/ORCA-PBL a nivel workspace;
- exponer el contrato por API pública, tool read-only y comando Markdown en cliente;
- alinear documentación viva y mover el foco canónico a `B262`.

## 5. Fuera de alcance

- introducir nuevos diagnósticos solo para alimentar el reporte;
- ejecutar acciones write-enabled o refactors automáticos desde este slice;
- sustituir el juicio del maintainer por un score opaco no trazable a evidencia real.

## 6. Criterios de aceptación

- AC1. el producto expone `ApiPowerBuilderTechnicalDebtReport` por API pública, tool read-only y comando Markdown.
- AC2. el reporte consolida hotspots `obsolete`, `dynamic-sql`, `datawindow-risk`, `external-dependency`, `complexity` y `source-origin-risk` con evidencia y confidence explícitas.
- AC3. las recomendaciones reutilizan señales legacy/sourceOrigin/ORCA-PBL ya publicadas y no inventan IDs diagnósticos nuevos.
- AC4. la validación cubre collector, contrato público, suite unitaria amplia y comando/API real en host de VS Code.
- AC5. backlog, roadmap y current-focus dejan de tratar `B261` como deuda activa y pasan a `B262`.

## 7. Documentación afectada

- `docs/developer-workflows.md`
- `docs/rules-catalog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/powerBuilderTechnicalDebtReport.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:unit`
- `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`

## 9. Cierre registrado

- el producto ya exporta un informe técnico priorizable y trazado a evidencia real del runtime;
- el reporte read-only sirve hotspots y recomendaciones sobre legacy, SQL dinámico, DataWindow, `sourceOrigin` y ORCA/PBL sin abrir scoring paralelo;
- el siguiente foco canónico del repo pasa a `B262`.