# Foundation Wiring After Blocks 1–4 — Close Partial Infrastructure

You are GitHub Copilot Agent working on the PowerBuilder VS Code plugin repository.

Execute this prompt after `implement-spec.bloque1.prompt.md` to `implement-spec.bloque4.prompt.md`.

This prompt exists because Blocks 2–4 created foundational infrastructure but left several backlog items as `Partial`. Your job is to connect the created infrastructure to the real runtime paths where safe, strengthen conformance validation, update tests and docs, and only mark items Done when their real runtime path is actually governed by the new contracts.

---

# Target partial items

Focus on closing or reducing the exact pending work for these items:

```txt
PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01
PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01
PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01
PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01
PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01
PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01
PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01
PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01
```

Primary priority order:

```txt
1. DiagnosticRuleRegistry → real diagnostics pipeline.
2. SemanticTokensResultState → real semantic tokens provider.
3. ProviderAdapterContract → architecture conformance scanner.
4. CacheDescriptorRegistry → executable cross-validation against cache key contracts.
5. IndexStateInvariants/PersistenceWriteQueue → real workspace/index/persistence integration where safe.
6. GenerationGuard/open-change/discovery bounded wiring only where safe and testable.
```

---

# Absolute mandatory rule

**DO NOT STOP, DO NOT ASK QUESTIONS, DO NOT SKIP PHASES, DO NOT CREATE NEW LARGE INFRASTRUCTURE, DO NOT DO A BIG-BANG REWRITE, DO NOT MARK ANY PARTIAL ITEM DONE UNLESS ITS REAL RUNTIME PATH USES THE CONTRACT, TARGETED TESTS ARE GREEN, DOCS ARE UPDATED, AND FULL VALIDATION HAS BEEN RUN OR HONESTLY CLASSIFIED.**

This is a wiring and closure prompt, not a new architecture wave.

---

# Master goal

Preserve the project master goal:

```txt
The plugin must discover and index very fast without blocking VS Code.
```

Do not introduce full workspace scans in hot paths.

Do not introduce any semantic store parallel to `KnowledgeBase`.

Do not weaken tests or gates to make validation pass.

---

# Required context to read first

Read these docs:

```txt
docs/backlog.md
docs/current-focus.md
docs/roadmap.md
docs/done-log.md
docs/architecture.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/instant-semantic-indexing-target.md
docs/performance-budget.md
docs/testing.md
docs/audits/run-implement-spec-blocks-strict-execution.md
docs/audits/macro-instant-semantic-indexing-findings.md
docs/audits/macro-instant-semantic-indexing-audit.md
```

Also inspect recent Block 1–4 code changes:

```txt
tools/architecture-conformance-scanner.mjs
src/server/features/diagnosticRuleRegistry.ts
src/server/features/diagnostics.ts
src/server/features/diagnosticsExtra.ts
src/server/features/obsoleteDetector.ts
src/server/features/semanticTokens.ts
src/server/features/semanticTokensResultState.ts
src/server/serving/cacheDescriptorRegistry.ts
src/server/serving/cacheKeyContract.ts
src/server/workspace/indexStateInvariants.ts
src/server/runtime/generationGuard.ts
src/server/analysis/diagnosticScheduler.ts
src/server/workspace/discovery.ts
src/server/serving/providerAdapterContract.ts
test/server/unit/diagnosticRuleRegistry.test.ts
test/server/unit/semanticTokensResultState.test.ts
test/server/unit/cacheDescriptorRegistry.test.ts
test/server/unit/indexStateInvariants.test.ts
test/server/unit/generationGuard.test.ts
test/server/unit/discoveryWarmStart.test.ts
test/server/unit/providerAdapterContract.test.ts
test/server/integration/lsp-providers.test.ts
```

---

# Non-goals

Do not implement:

```txt
Object Explorer pagination
AI bundle execution planning
DataWindow split
SQL anchors bounded projection
Runtime metrics event bus
10K corpus
CI gate expansion
Target scaffold
Orchestrator split
Simplification fitness suite
Legacy retirement
Class-by-class cleanup
```

Do not:

```txt
create another registry if an existing registry already exists
create parallel diagnostic paths
rewrite diagnostics entirely
rewrite semantic tokens entirely
replace discovery flow broadly without tests
replace workspaceIndexer broadly without tests
weaken conformance scanner rules
change public API breaking shapes
mark Done by documentation only
```

---

# PHASE 0 — Baseline and partial-state inventory

## Tasks

1. Read all required docs.
2. Confirm which Blocks 2–4 items are currently `Partial`.
3. Extract exact pending work from `docs/backlog.md`.
4. Inspect created infrastructure and current runtime usage.
5. Run baseline validation.

Run:

```bash
npm run build:test
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:unit -- --grep "diagnosticRuleRegistry|semanticTokensResultState|cacheDescriptorRegistry|indexStateInvariants|generationGuard|discoveryWarmStart|providerAdapterContract"
```

If a command is not available, run the closest equivalent and document it.

## Required output

Create or update:

```txt
docs/audits/foundation-wiring-after-blocks-1-4-report.md
```

Include:

```md
# Foundation Wiring After Blocks 1–4

## PHASE 0 — Baseline and partial-state inventory

### Docs reviewed
### Partial items and exact pending work
### Infrastructure created by Blocks 2–4
### Runtime paths not yet connected
### Baseline validation
### Initial risks
```

---

# PHASE 1 — Wire DiagnosticRuleRegistry into diagnostics pipeline

## Goal

Make `DiagnosticRuleRegistry` govern the real diagnostics pipeline incrementally.

## Requirements

The existing compatibility API must remain:

```txt
buildDiagnosticsForDocument(...)
publishDiagnostics(...)
diagnosticScheduler behavior
```

But the runtime path must now reference registry metadata for emitted rules where possible.

## Tasks

1. Inspect `diagnostics.ts`, `diagnosticsExtra.ts`, `obsoleteDetector.ts` and `diagnosticRuleRegistry.ts`.
2. Map current emitted diagnostic codes/rules to registry entries.
3. Ensure every emitted diagnostic that has a known code can be traced to registry metadata.
4. Keep `buildDiagnosticsForDocument` as compatibility layer.
5. Add helper validation that emitted diagnostics reference registered rules where feasible.
6. Add tier/cap/advisory metadata enforcement for registered diagnostics.
7. Do not change diagnostic messages/severities unless required by existing documented noise policy and tests.

## Required tests

Add/update tests for:

```txt
buildDiagnosticsForDocument still emits existing diagnostics
registered diagnostic codes are known by DiagnosticRuleRegistry
unregistered diagnostic codes are either forbidden or explicitly allowlisted
tier metadata exists for all registered rules
advisory rules are tagged as advisory
compat layer still works
```

Run:

```bash
npm run build:test
npm run test:unit -- --grep "diagnosticRuleRegistry|diagnostics|diagnosticScheduler"
```

## Closing rule

Only mark `PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01` as Done if the real diagnostics pipeline uses registry metadata and tests prove coverage. Otherwise leave as Partial with exact remaining work.

## Required output

Update audit report:

```md
## PHASE 1 — DiagnosticRuleRegistry wiring

### Runtime wiring implemented
### Compatibility preserved
### Tests added/updated
### Done/Partial decision
### Remaining gaps
```

---

# PHASE 2 — Wire SemanticTokensResultState into real semantic tokens provider

## Goal

Make `SemanticTokensResultState` govern `previousResultId`/full fallback behavior in the real semantic tokens provider.

## Requirements

The provider must:

```txt
validate previousResultId
return full tokens when previousResultId is unknown/stale
not rely on ambiguous persistent builder state keyed only by URI
evict state on close/change where applicable
preserve existing legend and token semantics
```

## Tasks

1. Inspect `semanticTokens.ts`, `semanticTokenPresentation.ts`, feature handler semantic token registration and `semanticTokensResultState.ts`.
2. Wire result state into full/delta request handling.
3. Ensure result descriptors include URI/documentVersion/fingerprint/kbVersion or equivalent available evidence.
4. Ensure previousResultId mismatch falls back to full tokens.
5. Keep builder ephemeral per response.
6. Add close/change eviction where safe.
7. Preserve existing token legend order.

## Required tests

Add/update tests for:

```txt
unknown previousResultId returns full fallback
stale resultId returns full fallback
documentVersion/fingerprint mismatch returns full fallback
close/change evicts state
existing semantic token fixtures still pass
legend order unchanged
```

Run:

```bash
npm run build:test
npm run test:unit -- --grep "semanticTokens|semanticTokensResultState"
```

## Closing rule

Only mark `PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01` as Done if the real provider uses `SemanticTokensResultState` and compatibility tests pass. Otherwise leave Partial with exact pending work.

## Required output

Update audit report:

```md
## PHASE 2 — SemanticTokensResultState provider wiring

### Provider wiring implemented
### Fallback behavior
### Eviction behavior
### Tests added/updated
### Done/Partial decision
### Remaining gaps
```

---

# PHASE 3 — Wire ProviderAdapterContract into conformance scanner

## Goal

Make provider contracts executable via architecture conformance.

## Tasks

1. Inspect `providerAdapterContract.ts` and `tools/architecture-conformance-scanner.mjs`.
2. Add scanner/check category that validates critical providers have declared contracts.
3. Validate that each contract declares:

```txt
feature
lane
budgetMs
cachePolicy or explicit none
stale/degraded behavior
allowsFullScan: false
source scope
```

4. Add allowlist only for documented structural exceptions.
5. Add fixture/test for missing provider contract.
6. Add fixture/test for `allowsFullScan: true` being rejected.
7. Keep report JSON stable.

## Required tests

Run:

```bash
npm run build:test
npm run test:unit -- --grep "providerAdapterContract|architectureConformanceScanner|architectureImports"
npm run test:architecture:rapid
```

## Closing rule

Only mark `PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01` as Done if scanner/conformance enforces provider contracts or if remaining gaps are explicitly documented. Otherwise leave Partial.

For `PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01`, do not mark Done unless integration tests are executable in CI or clearly validated. Otherwise leave Partial with CI validation pending.

## Required output

Update audit report:

```md
## PHASE 3 — ProviderAdapterContract conformance wiring

### Scanner integration
### Contract categories checked
### Fixtures/tests added
### Done/Partial decision
### Remaining gaps
```

---

# PHASE 4 — CacheDescriptorRegistry cross-validation

## Goal

Make `CacheDescriptorRegistry` executable against actual cache key contracts.

## Tasks

1. Inspect `cacheDescriptorRegistry.ts`, `cacheKeyContract.ts`, serving cache usage and tests.
2. Add cross-validation tests that ensure descriptor fields match cache key builder/stale matcher fields.
3. Validate each interactive serving cache feature has descriptor coverage.
4. Validate discriminators such as epoch/fingerprint/sourceOrigin/locale/projection/prefix where applicable.
5. Do not rewrite serving cache broadly.

## Required tests

Run:

```bash
npm run build:test
npm run test:unit -- --grep "cacheDescriptorRegistry|cacheKeyContract|servingCache"
```

## Closing rule

Only mark `PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01` as Done if descriptors are cross-validated against actual key builders/matchers. Otherwise leave Partial.

## Required output

Update audit report:

```md
## PHASE 4 — CacheDescriptorRegistry cross-validation

### Cross-validation implemented
### Descriptor coverage
### Tests added/updated
### Done/Partial decision
### Remaining gaps
```

---

# PHASE 5 — IndexStateInvariants, PersistenceWriteQueue and workspace/indexer integration

## Goal

Connect invariants/persistence infrastructure to real workspace/index/persistence flows where safe.

## Tasks

1. Inspect `indexStateInvariants.ts`, `workspaceIndexer.ts`, `workspaceState.ts`, `analysisCache.ts`, `DocumentCache.ts`, persistence/cache modules.
2. Identify safe integration points for invariant checks.
3. Integrate invariants as assertions/tests first, not runtime-heavy checks.
4. Integrate or validate `PersistenceWriteQueue` only where it does not change behavior unpredictably.
5. Add tests for:

```txt
indexed/restored state transitions
eviction does not imply semantic loss
serialized persistence writes preserve order
workspaceIndexer state transition uses allowed transition or test helper
```

6. Do not rewrite warm start or persistence broadly in this prompt.

## Required tests

Run:

```bash
npm run build:test
npm run test:unit -- --grep "indexStateInvariants|workspaceIndexer|analysisCache|documentCache|persistence|cacheStore"
```

## Closing rule

Only mark `PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01` as Done if real workspace/index/persistence flows are covered by executable invariants. Otherwise leave Partial.

## Required output

Update audit report:

```md
## PHASE 5 — IndexStateInvariants and persistence wiring

### Integration points
### Runtime behavior preservation
### Tests added/updated
### Done/Partial decision
### Remaining gaps
```

---

# PHASE 6 — Scheduler generation guard, open/change and bounded discovery wiring

## Goal

Extend existing generation/discovery infrastructure only where safe and testable.

## Tasks

1. Inspect `generationGuard.ts`, `diagnosticScheduler.ts`, document handlers, discovery and watcher intake.
2. Confirm generation guard correctly prevents stale diagnostic commits.
3. If safe, add generation guard to additional scheduled diagnostics/open-change paths.
4. Inspect `discoverWorkspaceBounded` and decide whether it can be used as a real opt-in path or remains scaffold.
5. Do not replace `discoverWorkspace` by default unless tests prove parity.
6. Document exact remaining work for full open/change migration.

## Required tests

Run:

```bash
npm run build:test
npm run test:unit -- --grep "generationGuard|diagnosticScheduler|openDocumentDiagnostics|documentHandlers|discoveryWarmStart"
```

## Closing rule

Only mark runtime/discovery items Done if real runtime paths are wired and tests cover cancellation/stale/compat behavior. Otherwise leave Partial.

## Required output

Update audit report:

```md
## PHASE 6 — Scheduler/open-change/discovery wiring

### Generation guard runtime coverage
### Open/change behavior
### Bounded discovery status
### Tests added/updated
### Done/Partial decision
### Remaining gaps
```

---

# PHASE 7 — Documentation and backlog reconciliation

## Tasks

Update:

```txt
docs/backlog.md
docs/current-focus.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/performance-budget.md
docs/audits/foundation-wiring-after-blocks-1-4-report.md
```

Update `docs/done-log.md` only for fully closed items.

Rules:

```txt
Do not mark Done unless runtime path is connected and validated.
Partial items must include exact pending work.
current-focus must point to the real next open work.
Do not duplicate long architecture text.
```

## Required output

Update audit report:

```md
## PHASE 7 — Documentation and backlog reconciliation

### Docs updated
### Items moved to Done
### Items left Partial
### Current focus
### Remaining doc risks
```

---

# PHASE 8 — Full validation

Run:

```bash
npm run build:test
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:architecture:metrics
npm run test:performance:gate
npm test
```

If `test:performance:gate` or `npm test` fail due to sandbox DNS/VS Code download, document exact evidence and classify as environment/pre-existing. Do not claim green full validation unless it actually passed.

Fix any failure caused by this prompt.

## Required output

Update audit report:

```md
## PHASE 8 — Full validation

### Commands executed
### Passing gates
### Failing/skipped gates
### Failure classification
### Fixes applied
### Final validation state
```

---

# PHASE 9 — Final self-review

Before finishing, re-read:

```txt
changed source files
changed test files
changed docs
docs/audits/foundation-wiring-after-blocks-1-4-report.md
docs/backlog.md
docs/current-focus.md
docs/architecture-status.md
docs/testing.md
```

Verify:

```txt
DiagnosticRuleRegistry is wired or honestly Partial.
SemanticTokensResultState is wired or honestly Partial.
ProviderAdapterContract is enforced by conformance or honestly Partial.
CacheDescriptorRegistry is cross-validated or honestly Partial.
IndexStateInvariants are connected to real tests/flows or honestly Partial.
GenerationGuard/discovery wiring is safe and documented.
No new large infrastructure was created unnecessarily.
No full workspace scans were introduced.
No parallel semantic store was introduced.
Docs/backlog/current-focus are aligned.
```

If any gap is found, fix or document before final response.

---

# Final response

Only after all phases are complete, respond in Spanish with:

```md
## Resumen final — Foundation Wiring After Blocks 1–4

### Código cambiado

### Tests añadidos/modificados

### Documentos actualizados

### Diagnostics registry wiring

### Semantic tokens result state wiring

### Provider adapter conformance wiring

### Cache descriptor cross-validation

### Index/persistence invariant wiring

### Scheduler/discovery wiring

### Ítems cerrados

### Ítems que siguen Partial

### Validación ejecutada

### Fallos preexistentes o de entorno

### Riesgos pendientes

### Siguiente paso recomendado
```

Do not provide partial summaries before all phases are complete.
```
