# Spec 395 — B300 Agent validation receipt

## Estado

- done

## Relacion backlog

- Backlog item: `B300 — Agent validation receipt`

## Objetivo

Generar un receipt estructurado tras una tarea agent-ready para dejar comandos, resultados, artefactos, riesgos, documentos pendientes, specs afectadas y siguiente foco en formato auditable.

## Resultado de cierre

- `src/shared/publicApi.ts` publica `ApiTaskExecutionValidationReceipt` y permite adjuntarlo a `ApiSpecDrivenPblUpdateResult` y `ApiSpecDrivenPblUpdateBatchResult`;
- `src/client/taskExecutionAutomation.ts` compone receipts single y batch con comandos, resultados, artifacts, docsTouched, docsPending, specsAffected y `nextFocus`;
- `src/client/extension.ts` adjunta `validationReceipt` a `applySpecDrivenPblUpdate()` y `applySpecDrivenPblUpdateBatch()` sin crear un rail paralelo de ejecucion;
- `test/server/unit/taskExecutionAutomation.test.ts` fija receipts individuales y batch, incluyendo journal, ledger, riesgos y docs pendientes.

## Validacion ejecutada

- `npm run build:test`
- `npm run test:unit -- --grep "taskExecutionAutomation|agentDocsPolicy"`

## Fuera de alcance del corte cerrado

- automatizar comandos externos o CI a partir del receipt;
- cerrar backlog/documentacion sin pasar por `docs-updater` y sus reglas de ownership;
- relajar el requisito de validacion posterior a ejecucion write-enabled.