# Foundation Wiring After Blocks 1–4

## PHASE 0 — Baseline and partial-state inventory

### Docs reviewed
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `docs/architecture.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/instant-semantic-indexing-target.md`
- `docs/performance-budget.md`
- `docs/testing.md`
- `docs/audits/run-implement-spec-blocks-strict-execution.md`
- `docs/audits/macro-instant-semantic-indexing-findings.md`
- `docs/audits/macro-instant-semantic-indexing-audit.md`

### Partial items and exact pending work
- `PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01`: runtime wiring pendiente en el pipeline real.
- `PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01`: `previousResultId`/fallback aún no gobernaba el provider real.
- `PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01`: faltaba simetría ejecutable entre descriptor, key builder y stale matcher.
- `PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01`: invariants/persistence seguían sin wiring real en `workspaceIndexer`.
- `PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01`: faltaba migración adicional fuera de `diagnosticScheduler`.
- `PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01`: bounded discovery seguía sin wiring al indexer principal.
- `PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01`: scanner aún no validaba contratos.
- `PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01`: la evidencia seguía dependiente de CI/VS Code host.

### Infrastructure created by Blocks 2–4
- `DiagnosticRuleRegistry`
- `SemanticTokensResultState`
- `CacheDescriptorRegistry`
- `IndexStateInvariants` + `PersistenceWriteQueue`
- `GenerationGuard` + `SchedulerGenerationRegistry`
- `ProviderAdapterContract`
- `discoverWorkspaceBounded`

### Runtime paths not yet connected
- `workspaceIndexer` ↔ invariants/persistencia
- discovery bounded ↔ warm start/indexer real
- migración adicional de schedulers interactivos (`references`, host path de semantic tokens)
- validación CI/VS Code host para matriz LSP

### Baseline validation
- `npm run build:test` ✅ tras `npm ci`
- `npm run test:docs:drift` ✅
- `npm run test:architecture:rapid` ❌ pre-fix en clon fresco (`ENOENT` al escribir `artifacts/performance/architecture-conformance-report.json`)
- `npm run test:unit -- --grep "..."` ❌ bloqueado por descarga de VS Code (`ENOTFOUND update.code.visualstudio.com`)

### Initial risks
- Clon fresco sin `node_modules`.
- `test:architecture:rapid` no era robusto en clones frescos.
- `vscode-test` no es ejecutable en sandbox DNS-bloqueado; hay que documentar equivalentes directos.

## PHASE 1 — DiagnosticRuleRegistry wiring

### Runtime wiring implemented
- `buildDiagnosticsForDocument()` ahora compone diagnósticos inmediatos e interactivos usando `DiagnosticRuleRegistry`.
- El pipeline falla en tests si aparece un código emitido que no esté registrado.

### Compatibility preserved
- `publishDiagnostics()` y `buildDiagnosticsForDocument()` siguen siendo la capa pública/compatible.
- No se cambiaron mensajes ni severidades existentes.

### Tests added/updated
- `test/server/unit/diagnosticRuleRegistry.test.ts`
- `test/server/unit/diagnostics.test.ts`
- `test/server/unit/diagnosticScheduler.test.ts`

### Done/Partial decision
- **Partial reducido**.

### Remaining gaps
- Falta instrumentar performance gate/métricas por tier.

## PHASE 2 — SemanticTokensResultState provider wiring

### Provider wiring implemented
- `registerSemanticTokensHandler()` ya no depende de `SemanticTokensBuilder` persistente por URI.
- `provideSemanticTokens()` usa `SemanticTokensResultState` para `previousResultId`, `resultId` versionado y fallback full.

### Fallback behavior
- `previousResultId` desconocido o stale → full.
- `previousResultId` compatible y payload idéntico → delta con `edits: []`.

### Eviction behavior
- Evicción explícita en `close` y `change`.
- `resultId` incluye payload hash además de URI/version/fingerprint/kbVersion.

### Tests added/updated
- `test/server/unit/semanticTokens.test.ts`
- `test/server/unit/semanticTokensResultState.test.ts`

### Done/Partial decision
- **Partial reducido**.

### Remaining gaps
- Falta validar el lane host `vscode-test` y cualquier futuro soporte `range`.

## PHASE 3 — ProviderAdapterContract conformance wiring

### Scanner integration
- `tools/architecture-conformance-scanner.mjs` ahora crea el directorio de salida en clones frescos.
- Nueva categoría `provider-contract`.
- El scanner valida presencia por feature, campos requeridos, `cachePolicy/cacheFeature`, `sourceScope` y `allowsFullScan: false`.

### Contract categories checked
- `feature`
- `lane`
- `budgetMs`
- `cachePolicy`
- `cacheFeature` cuando aplica
- `degradedResult`
- `sourceScope`
- `allowsFullScan`

### Fixtures/tests added
- `test/fixtures/architecture-conformance/negative/provider-contract/providerAdapterContract.ts`
- `test/server/unit/architectureConformanceScanner.test.ts`
- `test/server/unit/providerAdapterContract.test.ts`

### Done/Partial decision
- **Partial reducido**.

### Remaining gaps
- Faltan métricas por provider y ampliar la matriz cross-surface/hot path.

## PHASE 4 — CacheDescriptorRegistry cross-validation

### Cross-validation implemented
- `cacheKeyContract.ts` serializa `prefix` igual que el stale matcher.
- `completion.ts` deja de usar `kb.semanticEpoch` como `documentFingerprint` del resolve path.
- Los tests cruzan descriptor, key builder y stale matcher.

### Descriptor coverage
- Cobertura explícita para `hover`, `completion` y `semanticTokens`, además del registry completo.

### Tests added/updated
- `test/server/unit/cacheDescriptorRegistry.test.ts`
- `test/server/unit/cacheKeyContract.test.ts`

### Done/Partial decision
- **Partial reducido**.

### Remaining gaps
- Faltan métricas de hit ratio / reason counts.

## PHASE 5 — IndexStateInvariants and persistence wiring

### Integration points
- `semanticCacheRuntimeController` serializa `appendUpsert`, `appendRemove`, `persistCheckpoint` y `persistServingSnapshot` mediante `PersistenceWriteQueue`.
- `lifecycleHandlers` dejó de llamar `currentCacheStore.persistCheckpoint(...)` directamente y usa la ruta centralizada del runtime controller.
- Las invariants se ejercitan sobre flujos reales de `workspaceIndexer`/`KnowledgeBase` y de restore desde `cacheStore` sin añadir checks pesados al runtime.

### Runtime behavior preservation
- No se reescribió warm start ni persistencia de forma amplia; el cambio se limitó a serializar writes reales y a cubrir el comportamiento con tests ejecutables.

### Tests added/updated
- `test/server/unit/semanticCacheRuntimeController.test.ts`
- `test/server/unit/workspaceIndexer.test.ts`
- `test/server/unit/cacheStore.test.ts`

### Done/Partial decision
- **Partial reducido**.

### Remaining gaps
- Falta convertir el warm restore compatible en un skip real por manifest/fingerprint dentro del indexer principal.
- Faltan `watcher invalidation` / `dirty restore transitions` como evidencia ejecutable del siguiente tramo.
- Siguen pendientes las métricas de warm restore/pending writes en los gates de performance.

## PHASE 6 — Scheduler/open-change/discovery wiring

### Generation guard runtime coverage
- `diagnosticScheduler` sigue cubierto por `GenerationGuard` y la validación focal confirma que evita commits stale.
- No se añadió wiring riesgoso adicional en `references` ni en host paths que todavía no tengan cobertura suficiente.

### Open/change behavior
- Se preservó el comportamiento actual de `open/change`; la migración pendiente hacia fanout Near/Background bounded queda documentada como trabajo posterior, no como cambio especulativo en este prompt.

### Bounded discovery status
- `discoverWorkspaceBounded` ya es un path real opt-in/warm-resume desde `lifecycleHandlers` y comparte el mismo canal de progreso que el discovery clásico.
- `discoverWorkspace` sigue siendo el default; la sustitución por defecto queda bloqueada hasta validar skip real por manifest/fingerprint y gates de performance.

### Tests added/updated
- `test/server/unit/workspace.test.ts`

### Done/Partial decision
- `PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01`: **Partial reducido**.
- `PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01`: **Partial**.

### Remaining gaps
- `references` y cualquier scheduler interactivo restante siguen sin `GenerationGuard` explícito.
- Falta la migración bounded de `open/change` para evitar full semantic cascade.
- Falta materializar `skipped files`/manifest receipts y el skip real por fingerprint compatible.

## PHASE 7 — Documentation and backlog reconciliation

### Docs updated
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/audits/foundation-wiring-after-blocks-1-4-report.md`

### Items moved to Done
- Ninguno; los cierres completos siguen bloqueados por métricas/host validation o wiring runtime adicional.

### Items left Partial
- `PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01`
- `PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01`
- `PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01`
- `PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01`
- `PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01`
- `PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01`
- `PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01`
- `PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01`

### Current focus
- `PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01`

### Remaining doc risks
- Las validaciones host/CI deben seguir documentándose aparte del sandbox local.

## PHASE 8 — Full validation

### Commands executed
- `npm run build:test`
- `npm run test:docs:drift`
- `npm run test:architecture:rapid`
- `npm run test:architecture:metrics`
- `npm run test:performance:gate`
- `npm test`
- `npm run test:unit -- --grep 'semanticTokens|analysisCache|featureHandlers'`
- `npm run test:smoke`

### Passing gates
- `npm run build:test`
- `npm run test:docs:drift`
- `npm run test:architecture:rapid`
- `npm run test:architecture:metrics`
- `npm run test:performance:gate`
- `npm run test:unit -- --grep 'semanticTokens|analysisCache|featureHandlers'` (`20 passing`)

### Failing/skipped gates
- `npm test` → falla en el label `smoke` del runner multi-label.
- `npm run test:smoke` → reproduce el mismo fallo del lane `smoke` (`13 passing`, `17 failing`).

### Failure classification
- Primer `npm test`: **caused-by-prompt/local defect**. El caso `Semantic Tokens -> Should fallback to full semantic tokens when fingerprint changes` fallaba porque `analysisCache` reutilizaba un snapshot cuando coincidían URI/version aunque el texto ya hubiera cambiado.
- `npm run test:unit -- --grep 'semanticTokens|analysisCache|featureHandlers'`: **green tras fix**; confirmó la corrección local del fallback full.
- `npm test` final y `npm run test:smoke`: **pre-existing / out-of-scope repo smoke failures**. El rojo actual vive en `smoke/support-bundle-extension`, `smoke/semantic-repro-pack-extension`, `smoke/lsp-guards-extension`, `smoke/health-report-extension`, múltiples aserciones de `smoke/extension`, `smoke/datawindow-b344-extension` y `smoke/code-actions-extension`.

### Fixes applied
- `analysisCache` ya no reutiliza un snapshot por misma URI/version sin verificar también el fingerprint ligero del texto.
- `semanticCacheRuntimeController` serializa journal/checkpoint/serving snapshot y `lifecycleHandlers` persiste checkpoints por esa ruta real.
- `discoverWorkspaceBounded` quedó cableado como path real opt-in/warm-resume con paridad básica documentada y probada.

### Final validation state
- Código y tests focales de foundation wiring: **validados en sandbox**.
- Gates documentales, de arquitectura y de performance: **green**.
- `npm test`: **no green** por fallos preexistentes del lane `smoke`; unit/integration quedaron en verde dentro del mismo runner tras corregir el defecto local de semantic tokens.
