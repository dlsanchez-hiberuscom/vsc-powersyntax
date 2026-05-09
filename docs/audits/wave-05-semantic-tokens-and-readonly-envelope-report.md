# Wave 05 — Semantic Tokens and Read-only Envelope

## PHASE 0 — Baseline and target surface inventory

### Docs reviewed
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/testing.md`
- `docs/instant-semantic-indexing-target.md`
- `docs/performance-budget.md`
- `docs/audits/foundation-wiring-after-blocks-1-4-report.md`

### Current semantic tokens state
- `SemanticTokensResultState` ya gobernaba `previousResultId`, `payloadHash` y fallback full por `documentVersion`/`fingerprint`/`kbVersion`.
- Faltaban en el descriptor versionado `sourceOrigin`, `legendVersion` y `createdAt`.
- No existía una prueba dedicada de fallback full por drift de `legendVersion`.

### Current read-only DTO/surface state
- `publicApi.ts` ya tenía señales parciales (`generatedFromCache`, `truncated`, `staleReason`) repartidas entre DTOs.
- No existía un envelope común exportado para surfaces read-only.
- `workspaceCheckReport` era el piloto más seguro porque ya exponía `generatedAt`, `generatedFromCache`, `readiness` y `truncated`.

### Current tests
- `test/server/unit/semanticTokensResultState.test.ts`
- `test/server/unit/semanticTokens.test.ts`
- `test/server/unit/publicApi.test.ts`
- `test/server/unit/workspaceCheckReport.test.ts`

### Initial risks
- No existe todavía una suite host dedicada para `semanticTokens/full|delta|range` en `vscode-test`.
- El envelope debía entrar como contrato opcional para no romper DTOs públicos ya consumidos.
- No se debía extender el piloto a Object Explorer ni a múltiples surfaces en la misma ola.

## PHASE 1 — Semantic tokens result-state descriptor

### Runtime wiring implemented
- `SemanticTokensResultStateEntry` ahora conserva `sourceOrigin`, `legendVersion` y `createdAt`.
- `computeResultId()` e `isCompatible()` ya discriminan por `sourceOrigin` y `legendVersion` además de `uri`/`documentVersion`/`fingerprint`/`kbVersion`/payload hash.
- `provideSemanticTokens()` publica `SEMANTIC_TOKENS_LEGEND_VERSION`, infiere `sourceOrigin` y degrada a full si el `previousResultId` fue emitido con otra leyenda.

### Tests added or updated
- `test/server/unit/semanticTokensResultState.test.ts`
- `test/server/unit/semanticTokens.test.ts`

### Decision
- `PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01` queda en **Partial reducido**.

### Remaining gaps
- Lane host `vscode-test` dedicado para semantic tokens.
- Soporte `range` defendible por budget.
- Métricas de compute time, payload bytes y `delta hit rate`.

## PHASE 3 — Shared read-only projection envelope

### Contract implemented
- `publicApi.ts` exporta `ApiReadOnlyProjectionEnvelope` con estados `loading/degraded/stale/ready/paged/error`.
- Se añadieron helpers mínimos: `createReadOnlyProjectionEnvelope()`, `createReadyProjectionEnvelope()`, `createStaleProjectionEnvelope()` y `createDegradedProjectionEnvelope()`.
- El schema `ApiReadOnlyProjectionEnvelope` ya aparece en `getPublicApiContractDescriptor()`.

### Compatibility preserved
- El envelope es opcional y no reemplaza `summary`, `generatedFromCache` ni `truncated` en los DTOs existentes.
- La versión pública sube a `2.26.0` como cambio aditivo y backward-compatible.

## PHASE 4 — Single low-risk pilot

### Workspace Check pilot
- `buildWorkspaceCheckReport()` publica `projection` con `projectionId`, `projectionOwner`, readiness, caps, truncation reason y refresh hint.
- `buildUnavailableWorkspaceCheckReport()` usa el mismo envelope con estado `error`.
- El piloto queda limitado a `workspace-check`; no se extendió a Object Explorer ni a otras surfaces read-only.

### Tests added or updated
- `test/server/unit/publicApi.test.ts`
- `test/server/unit/workspaceCheckReport.test.ts`

### Decision
- `PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01` queda en **Partial reducido**.

### Remaining gaps
- Adopción en Current Object Context, explainability, Impact Analysis y surfaces paginadas.
- Receipts/redaction owner homogéneos.
- Smoke/payload coverage para panels y comandos read-only.

## PHASE 5 — Validation

### Targeted validation
- `npm run test:unit -- --grep "semanticTokens|semanticTokensResultState"` → parcial/ambiguo por el filtro del shell; se repitió por suites exactas.
- `npm run test:unit -- --grep "semanticTokensResultState"` ✅ `15 passing`.
- `npm run test:unit -- --grep "Semantic Tokens"` ✅ `10 passing`.
- `npm run test:unit -- --grep "unit/publicApi"` ✅ `16 passing`.
- `npm run test:unit -- --grep "workspaceCheckReport"` ✅ `8 passing`.
- `npm run test:docs:drift` ✅.
- `npm run test:architecture:rapid` ✅.
- `npm run test:performance:gate` ✅.
- `npm test` ❌ por lane `smoke`; unit `1369 passing`, integration `15 passing`.
- `npm run test:smoke` ❌ `18 tests failed`.
- `npm run test:smoke -- --grep "workspace check expone tool read-only y reporte markdown"` ❌ timeout en `invokeReadOnlyTool(semantic-workspace-manifest)` antes de llegar al envelope de `workspace-check`.

### Outcome
- Wave 05 avanza con cambios reales de runtime, API pública, tests y docs, pero no cierra todavía los items 12 ni 14.
- No se intentó mezclar Object Explorer, AI bundle budget, DataWindow split ni SQL anchors en esta ola.
- La validación amplia confirma que el slice nuevo no rompe unit/docs/architecture/performance, pero el lane `smoke` sigue rojo en problemas previos o adyacentes del cliente/LSP y mantiene abierta la validación host definitiva.