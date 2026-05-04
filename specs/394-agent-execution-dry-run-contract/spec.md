# Spec 394 — B299 Agent execution dry-run contract

## Estado

- done

## Relacion backlog

- Backlog item: `B299 — Agent execution dry-run contract`

## Objetivo

Exigir un dry-run declarativo y auditable antes de cualquier tarea IA write-enabled, con plan, impacto, archivos, tests, docs y bloqueos visibles en el contrato publico.

## Resultado de cierre

- `src/shared/publicApi.ts` publica `ApiTaskExecutionDryRunRequest`, `ApiTaskExecutionDryRunReport`, el metodo `getTaskExecutionDryRun()` y el tool read-only `task-execution-dry-run` dentro del contrato publico versionado;
- `src/client/extension.ts` expone el dry-run por el read-only bridge y lo resuelve reutilizando `generateSafeEditPlan()` y `analyzeImpact()` sin abrir un segundo planner;
- `src/client/taskExecutionAutomation.ts` compone items y summaries del dry-run con archivos, riesgos, tests, docs pendientes y bloqueos defendibles;
- `test/server/unit/taskExecutionAutomation.test.ts` fija el contrato dry-run sobre un caso `spec-driven-pbl-update` con plan/impacto y evidencia de docs/tests.

## Validacion ejecutada

- `npm run build:test`
- `npm run test:unit -- --grep "taskExecutionAutomation|agentDocsPolicy"`

## Fuera de alcance del corte cerrado

- ejecutar writes reales; eso sigue dependiendo del rail `applySpecDrivenPblUpdate()`;
- cerrar receipts finales; eso queda trazado especificamente en `B300`;
- rehidratar incidencias desde bundles exportados; eso queda trazado en `B303`.