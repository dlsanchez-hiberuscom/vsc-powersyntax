# Spec 301 - workspace migration assistant (B256)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B256` con un asistente read-only de migración para layouts legacy que reutilice `WorkspaceState`, build files, project model y aliases ORCA para recomendar consolidación topológica sin escritura opaca.

## 2. Estado real actual

El repositorio ya tenía topología `workspace/solution/mixed/pbl-only`, build health, manifest y prioridades de `sourceOrigin`, pero faltaba una surface read-only que resumiera esa información como plan de migración defendible para layouts legacy.

## 3. Objetivo

Servir un reporte read-only de migración legacy por API pública, tool bridge, LSP y comando Markdown, con recomendaciones priorizadas sobre topología, build y legacy, sin abrir un planner paralelo ni tocar archivos del workspace.

## 4. Alcance

- implementar `workspaceMigrationAssistant` server-side reutilizando `WorkspaceState`, build summaries, project model y aliases ORCA;
- cubrir recomendaciones para `pbl-only`, `mixed`, ausencia/ambigüedad/invalidez de build files, aliases ORCA y falta de project model estable;
- exponer la surface por API pública v2.8.0, tool bridge, LSP y comando Markdown;
- fijar el contrato en tests unitarios, contractuales y smoke con degradación honesta cuando discovery aún no tenga contexto suficiente;
- alinear documentación viva y mover el foco canónico a `B257`.

## 5. Fuera de alcance

- crear o editar automáticamente `.pbw`, `.pbt`, `.pbsln`, `.pbproj` o build files JSON;
- ejecutar migraciones write-enabled sobre librerías legacy;
- fingir disponibilidad inmediata si discovery todavía no materializa roots o source suficiente.

## 6. Criterios de aceptación

- AC1. el asistente propone recomendaciones defendibles para layouts `pbl-only` y `mixed` usando solo el estado ya publicado por `WorkspaceState`.
- AC2. build files ambiguos/inválidos, ausencia de build file, aliases ORCA y falta de project model quedan reflejados con prioridad, evidencia y acciones sugeridas.
- AC3. la feature se sirve por LSP, API pública, tool bridge y comando Markdown con contrato estable y degradación explícita a `available: false` cuando falte contexto.
- AC4. la validación cubre unit focal del asistente, contrato público y smoke de activación de la extensión.
- AC5. backlog, roadmap y current-focus dejan de tratar `B256` como deuda activa y pasan a `B257`.

## 7. Documentación afectada

- `README.md`
- `docs/developer-workflows.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/publicApi.test.js --grep "(B256|workspaceMigrationAssistant|workspace-migration-assistant|versión exportada|descriptor contractual|bridge read-only)"`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 9. Cierre registrado

- `workspaceMigrationAssistant` queda servido por API pública/tool bridge/comando Markdown sobre topología y build state ya indexados;
- la smoke deja de depender de disponibilidad inmediata y valida el contrato real incluso cuando discovery degrada de forma honesta;
- el siguiente foco canónico del repo pasa a `B257`.