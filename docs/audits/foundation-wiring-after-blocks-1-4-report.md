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
- Revisados `workspaceIndexer`, `workspaceState`, `cacheStore`, `cacheCheckpoint` y `server.ts`.

### Runtime behavior preservation
- No se hizo un rewrite de warm start/persistencia sin pruebas.

### Tests added/updated
- Sin cambios de código en esta fase.

### Done/Partial decision
- **Partial**.

### Remaining gaps
- `workspaceIndexer` aún no consume `IndexStateInvariants`.
- `PersistenceWriteQueue` aún no serializa writes reales de checkpoint/journal.

## PHASE 6 — Scheduler/open-change/discovery wiring

### Generation guard runtime coverage
- `diagnosticScheduler` sigue cubierto.
- No se introdujo wiring adicional riesgoso en `references` ni host path de semantic tokens.

### Open/change behavior
- Se preservó el comportamiento actual.

### Bounded discovery status
- Sigue sin cablearse al indexer principal / warm start real.

### Tests added/updated
- Sin cambios de código en esta fase.

### Done/Partial decision
- **Partial**.

### Remaining gaps
- `references`/semantic tokens host path siguen sin migración adicional.
- Falta wiring de progress receipts y warm start real.

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
- `PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01`

### Remaining doc risks
- Las validaciones host/CI deben seguir documentándose aparte del sandbox local.

## PHASE 8 — Full validation

### Commands executed
- `npm ci`
- `npm run build:test`
- `npm run test:docs:drift`
- `npm run test:architecture:rapid`
- `npm run test:architecture:metrics`
- `npm run test:performance:gate`
- `npm test`
- `npx mocha --ui tdd out/test/server/unit/architectureConformanceScanner.test.js out/test/server/unit/diagnosticRuleRegistry.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/diagnosticsObsoleteIntegration.test.js out/test/server/unit/semanticTokens.test.js out/test/server/unit/semanticTokensResultState.test.js out/test/server/unit/providerAdapterContract.test.js out/test/server/unit/cacheDescriptorRegistry.test.js out/test/server/unit/cacheKeyContract.test.js out/test/server/unit/diagnosticScheduler.test.js`
- `npx mocha --ui tdd out/test/server/integration/lsp-providers.test.js`

### Passing gates
- `npm run build:test`
- `npm run test:docs:drift`
- `npm run test:architecture:rapid`
- `npm run test:architecture:metrics`
- Mocha directo foundation unit/integration (`100 passing`, `11 passing`)

### Failing/skipped gates
- `npm run test:performance:gate` → entorno/host (`vscode-test` no puede resolver descargar VS Code)
- `npm test` → entorno (`vscode-test` descarga VS Code)

### Failure classification
- `npm test` / `npm run test:unit` / `npm run test:integration` estándar: **entorno** (`ENOTFOUND update.code.visualstudio.com`).
- `test:architecture:rapid` inicial: **caused-by-repo/fix aplicado**; quedó corregido.

### Fixes applied
- Creación recursiva del directorio de artefactos en el scanner.
- Sustitución de builders persistentes por estado explícito en semantic tokens.
- Simetría `prefix` builder/stale matcher.

### Final validation state
- Código y tests focales de foundation wiring: **validados en sandbox**.
- Gates documentales y de arquitectura: **green / passed-with-skips honestos**.
- Gates host/VS Code (`test:performance:gate`, `npm test`): **pendientes de CI/entorno con red**.
