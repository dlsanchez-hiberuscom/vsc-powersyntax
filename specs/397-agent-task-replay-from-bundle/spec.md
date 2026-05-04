# Spec 397 — B303 Agent task replay from repro/support bundle

## Estado

- done

## Relacion backlog

- Backlog item: `B303 — Agent task replay from repro/support bundle`

## Objetivo

Permitir que un agente reconstruya un contexto minimo read-only desde un semantic repro pack o support bundle, sin requerir el repo completo y sin abrir side effects.

## Resultado de cierre

- `src/shared/publicApi.ts` publica `ApiTaskReplayBundleRequest`, `ApiTaskReplayBundleReport` y el tool read-only `task-replay-bundle` en el contrato publico;
- `src/client/taskExecutionAutomation.ts` detecta manifests de `semantic-repro-pack` y `support-bundle`, genera `minimalContext`, `referencedFiles`, `suggestedCommands` y `recommendedContractId` de forma read-only;
- `src/client/extension.ts` expone `replayTaskFromBundle()` en el bridge sin exigir workspace completo;
- `test/fixtures/agent-task-replay/` aporta bundles sample y `test/server/unit/taskExecutionAutomation.test.ts` fija el replay para ambos formatos.

## Validacion ejecutada

- `npm run build:test`
- `npm run test:unit -- --grep "taskExecutionAutomation|agentDocsPolicy"`

## Fuera de alcance del corte cerrado

- ejecutar writes a partir del bundle rehidratado;
- ampliar el replay a formatos no versionados o manifests opacos;
- exportar codigo bruto adicional fuera de los bundles ya saneados.