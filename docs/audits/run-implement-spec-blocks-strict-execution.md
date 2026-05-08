# Auditoría de ejecución: Spec blocks waves 2-4

**Fecha:** 2026-05-08
**ID:** run-implement-spec-blocks-strict-execution
**Commit:** pendiente de merge

---

## Alcance

Implementación de infraestructura base para oleadas 2-4 del plan de spec blocks del plugin PowerBuilder VS Code. Los ítems cubren diagnósticos, caches, estado de índice, scheduler y contratos de providers.

---

## Ítems implementados

### ITEM 1 — `src/server/features/diagnosticRuleRegistry.ts`
- `DiagnosticRuleRegistry` con métodos `register/lookup/getByTier/getAll`.
- Singleton `DIAGNOSTIC_RULE_REGISTRY` con 20 reglas registradas.
- Tiers: 1 (structural/syntactic/obsolete, immediate), 2 (semantic/datawindow/advisory, interactive).
- No cambia `buildDiagnosticsForDocument`; queda como capa de compatibilidad.

### ITEM 2 — `src/server/features/semanticTokensResultState.ts`
- `SemanticTokensResultState` con `store/get/evict/isCompatible/computeResultId/clear/getOrFull`.
- Evicción LRU, máximo 100 entradas.
- Hash SHA-1 truncado a 16 chars como `resultId`.

### ITEM 3 — `src/server/serving/cacheDescriptorRegistry.ts`
- `CacheDescriptorRegistry` con `register/get/getAll`.
- Singleton `CACHE_DESCRIPTOR_REGISTRY` con los 12 descriptores de `InteractiveServingCacheFeature`.
- Políticas de invalidación, stale policy, budgetMs y pressureClass declarados.

### ITEM 4 — `src/server/workspace/indexStateInvariants.ts`
- `IndexStateInvariants` con state machine y `ALLOWED_TRANSITIONS`.
- `IndexStateInvariantError` para transiciones inválidas.
- `PersistenceWriteQueue` con escrituras serializadas, `pendingCount` y `flush()`.

### ITEM 5 — `src/server/runtime/generationGuard.ts` + actualización `diagnosticScheduler.ts`
- `GenerationGuard` con `increment/current/isStale/isCurrent`.
- `SchedulerGenerationRegistry` con `getGuard/cancelGeneration/clearGuard/clear`.
- `SCHEDULER_GENERATION_REGISTRY` exportado desde `diagnosticScheduler.ts`.
- `scheduleDiagnostics` captura generación antes del setTimeout y la valida en el execute callback.
- `cancelScheduledDiagnostics` también llama a `cancelGeneration`.

### ITEM 6 — actualización `src/server/workspace/discovery.ts`
- `DISCOVERY_MAX_CONCURRENCY = 4`.
- `WarmStartManifest` interface y `canSkipEntry` función.
- `Semaphore` interno para acotar concurrencia.
- `discoverWorkspaceBounded` con warm-start y semáforo de 4 ramas simultáneas.
- `discoverWorkspace` original sin cambios.

### ITEM 7 — `src/server/serving/providerAdapterContract.ts`
- `ProviderAdapterContract` interface con `allowsFullScan: false` readonly.
- `PROVIDER_ADAPTER_CONTRACTS` para 13 features.
- `validateProviderAdapterContract` y `getProviderContract` helpers.

### ITEM 8 — `test/server/integration/lsp-providers.test.ts`
- Tests de integración inline para hover/completion/signatureHelp/definition/references/documentSymbols/semanticTokens.
- Sin escaneo completo de workspace; usa KB mínima con 2 entidades.

---

## Tests creados

| Fichero | Suite | Tests |
|---------|-------|-------|
| `test/server/unit/diagnosticRuleRegistry.test.ts` | unit/diagnosticRuleRegistry | 9 |
| `test/server/unit/semanticTokensResultState.test.ts` | unit/semanticTokensResultState | 11 |
| `test/server/unit/cacheDescriptorRegistry.test.ts` | unit/cacheDescriptorRegistry | 8 |
| `test/server/unit/indexStateInvariants.test.ts` | unit/indexStateInvariants | 13 |
| `test/server/unit/generationGuard.test.ts` | unit/generationGuard | 11 |
| `test/server/unit/providerAdapterContract.test.ts` | unit/providerAdapterContract | 13 |
| `test/server/integration/lsp-providers.test.ts` | integration/lsp-providers | 11 |
| **Total** | | **76** |

---

## Resultados de validación

```
npm run build:test → 0 errors
mocha --ui tdd unit tests → 65 passing
mocha --ui tdd integration tests → 11 passing
```

---

## Invariantes preservadas

- `buildDiagnosticsForDocument` sin cambios (capa de compatibilidad).
- `discoverWorkspace` original sin cambios.
- No se crean stores semánticos paralelos a `KnowledgeBase.publishedState`.
- Ningún nuevo módulo introduce escaneo completo de workspace en hot paths.
- `allowsFullScan: false` garantizado en todos los contratos de providers.

---

## Pendiente

- Conectar `DiagnosticRuleRegistry` al pipeline de `buildDiagnosticsForDocument` (cierra P0).
- Integrar `GenerationGuard` en scheduler interactivo de references/semanticTokens.
- Tests de performance gate para diagnósticos por tier.
