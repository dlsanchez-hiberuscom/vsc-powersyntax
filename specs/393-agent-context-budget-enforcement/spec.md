# Spec 393 — B301 Agent context budget enforcement

## Estado

- done

## Relacion backlog

- Backlog item: `B301 — Agent context budget enforcement`

## Objetivo

Limitar payloads y contexto de surfaces agent-ready para que tools/API expongan budgets explícitos, truncado visible y degradación segura sin reabrir contexto masivo.

## Resultado de cierre

- `ApiAiTaskContextBundle` publica ya `reasonCodes` machine-readable y `pagination` receipts para `diagnosticExplanations` y `systemSymbolExplanations`, evitando depender solo de texto libre en `omissions`;
- `src/client/aiTaskContextBundle.ts` mantiene el budget único por `intent` y añade reason codes explícitos para límites de lista (`diagnostics-limit`, `system-symbol-limit`), pruning por budget (`token-budget-context`), minimización de meta (`token-budget-meta`) y bundle mínimo (`token-budget-minimal`);
- el unavailable builder deja `missing-focus` como reason code visible, de modo que la ausencia de foco ya no depende de interpretar prose libre;
- `test/server/unit/aiTaskContextBundle.test.ts` fija truncado por budget bajo, receipt de paginación por límites de lista y caps sobre un `workspaceCheck` inflado, mientras `test/server/unit/publicApi.test.ts` mantiene verde el contrato público y el read-only bridge.

## Validación ejecutada

- `npm run test:unit -- --grep "unit/aiTaskContextBundle"`
- `npm run test:unit -- --grep "unit/(aiTaskContextBundle|publicApi)"`

## Fuera de alcance del corte cerrado

- abrir rails write-enabled o receipts de ejecución: eso queda para `B299` y `B300`;
- introducir nuevas surfaces agent-ready grandes fuera del bundle actual;
- mover el enforcement de budget a heurísticas ad hoc por tool fuera del contrato compartido.