# Spec 308 - agent-ready task execution contracts (B263)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B263` publicando contratos versionados de ejecución de tareas aptos para agentes sobre la surface actual, con dry-run, límites write-enabled, receipts y handoff SDD explícitos, sin abrir un ejecutor paralelo ni meter IA dentro del core.

## 2. Estado real actual

La API pública ya expone `taskExecutionCatalog` dentro de `ApiPublicContractDescriptor` y lo sirve por el tool read-only `contract`, describiendo los rails `applySpecDrivenPblUpdate` y `applySpecDrivenPblUpdateBatch` con inputs/outputs, contexto máximo, validación requerida, límites write-enabled, receipts, handoff y simulación declarativa de dry-run.

## 3. Objetivo

Dar a agentes y tooling un contrato exportado por el propio producto para saber qué tarea write-enabled existe, cómo debe prevalidarse, qué receipts debe dejar y qué handoff documental exige antes de cerrarse.

## 4. Alcance

- ampliar `ApiPublicContractDescriptor` con un catálogo versionado de task execution contracts;
- describir `applySpecDrivenPblUpdate` y `applySpecDrivenPblUpdateBatch` sobre la surface ya cerrada, sin abrir métodos write-enabled nuevos;
- publicar dry-run declarativo sobre `generateSafeEditPlan` para ambos contratos;
- validar schema, compatibilidad con consumers, tool `contract` y host real de VS Code;
- alinear docs de orquestación/agentes/SDD y mover el foco canónico a `B264`.

## 5. Fuera de alcance

- introducir un runner de tareas nuevo dentro del producto;
- ejecutar writes desde IA sin el rail ya cerrado de `applySpecDrivenPblUpdate*`;
- cerrar `B299` o `B300` por adelantado bajo el pretexto de este catálogo.

## 6. Criterios de aceptación

- AC1. el descriptor público exporta `taskExecutionCatalog` versionado con contratos `spec-driven-pbl-update` y `spec-driven-pbl-update-batch`.
- AC2. cada contrato declara inputs/outputs, contexto máximo, validación requerida, límites write-enabled, receipts y handoff SDD.
- AC3. el catálogo expone dry-run declarativo y auditable antes de cualquier ejecución write-enabled.
- AC4. la validación cubre unit de schema/compatibilidad, tool bridge real y smoke del host de VS Code.
- AC5. backlog, roadmap y current-focus dejan de tratar `B263` como deuda activa y pasan a `B264`.

## 7. Documentación afectada

- `docs/ai-orchestrator.md`
- `docs/ai-agents-catalog.md`
- `docs/spec-driven-development.md`
- `docs/testing.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js`
- `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`

## 9. Cierre registrado

- el producto ya publica contratos write-enabled aptos para agentes sin exponer un ejecutor nuevo;
- el tool `contract` sirve ese catálogo enriquecido desde la extensión real;
- el siguiente foco canónico del repo pasa a `B264`.