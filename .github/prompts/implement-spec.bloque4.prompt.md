# Execute Wave 4 — Provider Adapters, Hot Path Contract and LSP Integration

You are GitHub Copilot Agent working on the PowerBuilder VS Code plugin repository.

Execute **Wave 4** completely, phase by phase, without stopping, without asking for confirmation, and without delivering partial summaries.

Wave 4 focuses on the provider/runtime serving layer required for instant semantic behavior:

```txt
1. PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01
2. PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01
```

This wave must preserve the project master goal:

> The plugin must discover and index very fast without blocking VS Code.

Do not introduce broad rewrites. Do not create semantic stores parallel to `KnowledgeBase.publishedState`. Do not introduce full workspace scans in hot paths. Do not weaken tests to make them pass.

---

# Mandatory execution rulea

**DO NOT STOP, DO NOT ASK QUESTIONS, AND DO NOT DELIVER PARTIAL SUMMARIES: execute every phase in strict order, close each phase with evidence, code changes, documentation updates and tests, and do not finish until Wave 4, all affected documentation, backlog/current-focus/done-log updates, and the complete final validation are fully green.**

---

# Source documents

Before starting, read completely:

```txt
docs/audits/macro-instant-semantic-indexing-findings.md
docs/audits/macro-instant-semantic-indexing-audit.md
docs/instant-semantic-indexing-target.md
docs/backlog.md
docs/current-focus.md
docs/roadmap.md
docs/done-log.md
docs/architecture.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/performance-budget.md
docs/testing.md
docs/troubleshooting.md
docs/semantic-design-target.md
docs/semantic-design-assumptions.md
```

Also inspect all relevant code and tests before modifying anything.

---

# Output language

All project-facing documentation changes must be written in **Spanish**.

Keep unchanged:

- file paths;
- class/function/type names;
- command names;
- test names;
- spec IDs;
- backlog IDs;
- API names;
- PowerBuilder keywords;
- SQL syntax;
- LSP/VS Code API names.

---

# Scope

This execution covers only Wave 4:

```txt
PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01
PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01
```

Wave 4 assumes Wave 0, Wave 1, Wave 2 and Wave 3 are complete or stable enough to proceed.

If previous waves are not complete, do not silently continue. Document the blocking gap in the execution report, fix what is required to restore a green baseline, and continue only when the required baseline is green.

---

# Related findings

Wave 4 must address or advance these findings:

```txt
FINDING-003
FINDING-010
FINDING-020
FINDING-021
FINDING-022
FINDING-023
FINDING-024
FINDING-041
```

Also respect related constraints from:

```txt
FINDING-001
FINDING-013
FINDING-019
FINDING-025
FINDING-027
FINDING-034
FINDING-040
```

Do not create duplicate findings. If new evidence changes a finding status, update the existing finding.

---

# Non-negotiable rules

- Execute strictly phase by phase.
- Do not merge phases.
- Do not skip phases.
- Do not reorder phases.
- Do not ask for confirmation.
- Do not perform unrelated refactors.
- Do not weaken tests.
- Do not raise budgets to hide architectural debt.
- Do not create a semantic store parallel to `KnowledgeBase.publishedState`.
- Do not introduce full workspace scans in provider hot paths.
- Do not let providers resolve semantic identity outside `SemanticQueryFacade` unless explicitly allowlisted.
- Do not let references/rename/CodeLens execute unbounded project-wide textual scans as the normal route.
- Do not let Current Object Context recompute diagnostics full/references on every selection refresh.
- Do not let health/status refresh build full heavy stats by default.
- Do not let document/workspace symbols perform deep analysis without cache/stale/cancel policy.
- Do not leave `npm test` red.
- Do not leave `npm run build:test` red.
- Do not leave architecture gates red.
- Do not leave docs drift red.
- Do not leave performance gate red.
- Do not mark anything `Done` without code, tests, validation and documentation.

---

# PHASE 0 — Preparation and baseline verification

## Goal

Understand current state and verify the repository is ready for Wave 4.

## Tasks

1. Read all source documents.
2. Inspect the current backlog status of:

```txt
PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01
PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01
```

3. Inspect related findings:

```txt
FINDING-003
FINDING-010
FINDING-020
FINDING-021
FINDING-022
FINDING-023
FINDING-024
FINDING-041
```

4. Inspect these files before editing:

```txt
src/server/handlers/featureHandlers.ts
src/server/features/hover.ts
src/server/features/completion.ts
src/server/features/signatureHelp.ts
src/server/features/definition.ts
src/server/features/references.ts
src/server/features/referenceSourcePool.ts
src/server/features/rename.ts
src/server/features/linkedEditing.ts
src/server/features/documentSymbols.ts
src/server/features/workspaceSymbols.ts
src/server/features/codeLensResultCache.ts
src/server/features/currentObjectContext.ts
src/server/features/semanticWorkspaceManifest.ts
src/server/handlers/reportCommandHandlers.ts
src/server/handlers/runtimeCommandHandlers.ts
src/server/serving/interactiveServingPipeline.ts
src/server/serving/cacheKeyContract.ts
src/server/runtime/scheduler.ts
src/server/runtime/interactiveServingStats.ts
src/server/features/semanticQueryFacade.ts
src/shared/publicApi.ts
src/client/currentObjectContextPanel.ts
src/client/objectExplorer.ts
src/client/extension.ts
```

5. Inspect relevant tests:

```txt
test/server/unit/interactiveHotPathGuards.test.ts
test/server/unit/hotPathAllocationBudget.test.ts
test/server/unit/semanticQueryFacade.test.ts
test/server/unit/crossSurfaceGoldenMatrix.test.ts
test/server/unit/references.test.ts
test/server/unit/rename.test.ts
test/server/unit/linkedEditing.test.ts
test/server/unit/documentSymbols.test.ts
test/server/unit/workspaceSymbols.test.ts
test/server/unit/codeLens*.test.ts
test/server/integration/lsp-hover.test.ts
test/server/integration/lsp-documentSymbols.test.ts
test/server/integration/lsp-diagnostics.test.ts
```

6. Run the baseline commands:

```bash
npm run build:test
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
npm test
```

7. If any command fails, fix the baseline first. Do not start Wave 4 implementation while the baseline is red.

## Required phase output

Create or update:

```txt
docs/audits/wave-4-provider-adapters-lsp-execution.md
```

Add:

```md
## PHASE 0 — Preparación y baseline

### Documentos revisados

### Estado inicial del backlog

### Findings relacionados

### Código inspeccionado

### Baseline de tests

### Riesgos detectados

### Plan de ejecución
```

---

# PHASE 1 — Provider adapter contract tests

## Goal

Define the provider adapter hot path contract before broad production changes.

## Target backlog item

```txt
PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01
```

## Required target behavior

Every interactive provider must declare or be testable for:

```txt
feature
consumer
lane
budgetMs
cachePolicy
staleGuard
cancelPolicy
degradedResult
sourceScope
facadeUsage
payloadBudget
metrics
readiness behavior
```

Providers requiring explicit coverage:

```txt
hover
completion
completion resolve
signature help
definition
references
rename
linked editing
document symbols
workspace symbols
diagnostics
semantic tokens
CodeLens
Current Object Context
Object Explorer manifest/projection entrypoints
runtime health/status
```

## Tasks

1. Add or update tests proving that provider metadata exists or can be derived.
2. Add tests proving providers cannot silently bypass `SemanticQueryFacade` for semantic identity unless allowlisted.
3. Add tests proving no provider introduces full workspace scans in hot paths.
4. Add tests proving references/rename/CodeLens source pools are bounded or marked as needing indexed projection.
5. Add tests proving Current Object Context does not run full diagnostics/references inline as a selection-refresh requirement.
6. Add tests proving status/health refresh has a light path or is marked as requiring tiering.
7. Keep existing tests as compatibility smoke.

## Required docs

Update as needed:

```txt
docs/testing.md
docs/instant-semantic-indexing-target.md
docs/architecture-status.md
docs/backlog.md
```

## Required validation

Run:

```bash
npm run build:test
npm run test:unit -- --grep "provider"
npm run test:unit -- --grep "hotPath"
npm run test:unit -- --grep "semanticQuery"
npm run test:docs:drift
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-4-provider-adapters-lsp-execution.md
```

Add:

```md
## PHASE 1 — Tests de contrato provider adapter/hot path

### Contrato definido

### Tests añadidos o actualizados

### Providers cubiertos

### Allowlists

### Docs actualizadas

### Validación

### Riesgos restantes
```

---

# PHASE 2 — Implement minimal provider adapter contract slice

## Goal

Implement the smallest safe production slice for the provider adapter contract.

## Target backlog item

```txt
PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01
```

## Required implementation

Implement or introduce:

1. A lightweight `ProviderAdapterContract`, registry or metadata structure.
2. Metadata for providers already using safe serving paths:
   - hover;
   - completion;
   - completion resolve;
   - signature help;
   - definition.
3. Metadata or explicit partial declarations for providers still needing refactor:
   - references;
   - rename;
   - linked editing;
   - CodeLens;
   - document symbols;
   - workspace symbols;
   - Current Object Context;
   - runtime health/status;
   - Object Explorer.
4. A documented allowlist for structural fast paths.
5. No behavior-breaking broad provider rewrite.
6. Stable report or diagnostics output for architecture gates if feasible.

## Implementation rules

- Do not rewrite all providers at once.
- Do not change provider behavior unless required by tests.
- Do not hide heavy paths; mark them as `needsProjection`, `needsBoundedSourcePool`, `needsLazyProjection` or equivalent.
- Do not introduce a new runtime bottleneck.
- Do not duplicate semantic resolution logic.

## Required docs

Update as needed:

```txt
docs/instant-semantic-indexing-target.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/backlog.md
```

If the backlog item is fully complete, move it to `docs/done-log.md`.  
If partial, keep it `Partial` and write exact pending work.

## Required validation

Run:

```bash
npm run build:test
npm run test:unit -- --grep "provider"
npm run test:unit -- --grep "hotPath"
npm run test:unit -- --grep "semanticQuery"
npm run test:architecture:rapid
npm run test:docs:drift
npm test
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-4-provider-adapters-lsp-execution.md
```

Add:

```md
## PHASE 2 — Provider adapter contract slice

### Diseño implementado

### Cambios de código

### Providers declarados

### Allowlists y excepciones

### Providers pendientes de migración

### Tests añadidos o actualizados

### Docs actualizadas

### Estado del backlog

### Validación

### Riesgos restantes
```

---

# PHASE 3 — References, rename and CodeLens bounded contract tests

## Goal

Define and protect bounded behavior for references, rename and CodeLens before broad indexed occurrence implementation.

## Related findings

```txt
FINDING-003
FINDING-020
```

## Required target behavior

References, rename and CodeLens must not use unbounded project/workspace textual scanning as the default hot path.

The target behavior must include:

```txt
bounded source pool
source count metric
candidate count metric
facade resolve count metric
cancellation or stale guard
result cap
degraded receipt when falling back
future occurrence index/projection path
```

## Tasks

1. Add tests proving references source pools are bounded by explicit policy.
2. Add tests proving `provideReferences` cannot scan unlimited sources without cap/receipt.
3. Add tests proving rename inherits references safety constraints.
4. Add tests proving CodeLens does not compute reference counts by running full references for every callable without budget.
5. Add tests proving fallback textual behavior is marked degraded or capped.
6. Do not implement full occurrence index yet unless a small safe slice already exists.

## Required docs

Update as needed:

```txt
docs/testing.md
docs/instant-semantic-indexing-target.md
docs/architecture-status.md
docs/backlog.md
```

## Required validation

Run:

```bash
npm run build:test
npm run test:unit -- --grep "references"
npm run test:unit -- --grep "rename"
npm run test:unit -- --grep "CodeLens"
npm run test:docs:drift
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-4-provider-adapters-lsp-execution.md
```

Add:

```md
## PHASE 3 — Tests bounded para references/rename/CodeLens

### Contrato definido

### Tests añadidos o actualizados

### Compatibilidad preservada

### Docs actualizadas

### Validación

### Riesgos restantes

### Pendiente exacto para indexed occurrence projection
```

---

# PHASE 4 — Implement bounded references/rename/CodeLens safety slice

## Goal

Implement the smallest safe production slice to make references, rename and CodeLens safer without implementing the full occurrence index yet.

## Target backlog item

```txt
PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01
```

## Required implementation

Implement or introduce:

1. Explicit source pool budgets/caps for references.
2. Source count and candidate count metrics or debug counters if existing infrastructure supports them.
3. Degraded/stale/fallback receipts when references cannot inspect all possible sources.
4. Rename safety inherited from bounded references.
5. CodeLens should avoid N unbounded reference searches per document.
6. If full reference-count projection is not implemented yet, CodeLens must be capped, cached, deferred or marked partial/degraded.
7. Update provider adapter metadata accordingly.

## Implementation rules

- Do not implement a huge occurrence index in this wave unless it is already mostly available.
- Do not remove references functionality.
- Do not hide missing results without a degraded receipt.
- Do not make CodeLens slower to render.
- Preserve existing behavior for small fixtures.

## Required docs

Update as needed:

```txt
docs/instant-semantic-indexing-target.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/performance-budget.md
docs/backlog.md
```

## Required validation

Run:

```bash
npm run build:test
npm run test:unit -- --grep "references"
npm run test:unit -- --grep "rename"
npm run test:unit -- --grep "CodeLens"
npm run test:architecture:rapid
npm run test:performance:gate
npm run test:docs:drift
npm test
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-4-provider-adapters-lsp-execution.md
```

Add:

```md
## PHASE 4 — Safety slice references/rename/CodeLens

### Diseño implementado

### Cambios de código

### Budgets/caps aplicados

### Degraded/stale/fallback receipts

### CodeLens safety

### Tests añadidos o actualizados

### Docs actualizadas

### Validación

### Riesgos restantes
```

---

# PHASE 5 — Document/workspace symbols and status/current-context contract tests

## Goal

Define and protect safe behavior for document symbols, workspace symbols, Current Object Context and runtime health/status.

## Related findings

```txt
FINDING-021
FINDING-022
FINDING-023
FINDING-024
```

## Required target behavior

These surfaces must be bounded, cached or explicitly degraded:

```txt
document symbols
workspace symbols
Current Object Context
runtime health/status
```

## Tasks

1. Add tests proving Document Symbols does not recompute heavy reconciliation every request when a compatible projection/cache exists.
2. Add tests proving Workspace Symbols broad queries are capped and have readiness/degraded behavior.
3. Add tests proving Current Object Context summary path does not run full diagnostics/references on every selection refresh.
4. Add tests proving runtime status has a light snapshot path separate from full stats/maintenance inspection.
5. Add tests or documentation proving heavy variants are command/report paths, not automatic hot refresh paths.

## Required docs

Update as needed:

```txt
docs/testing.md
docs/instant-semantic-indexing-target.md
docs/architecture-status.md
docs/backlog.md
```

## Required validation

Run:

```bash
npm run build:test
npm run test:unit -- --grep "documentSymbols"
npm run test:unit -- --grep "workspaceSymbols"
npm run test:unit -- --grep "currentObject"
npm run test:unit -- --grep "status"
npm run test:docs:drift
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-4-provider-adapters-lsp-execution.md
```

Add:

```md
## PHASE 5 — Tests símbolos/status/current-context

### Contrato definido

### Tests añadidos o actualizados

### Compatibilidad preservada

### Docs actualizadas

### Validación

### Riesgos restantes
```

---

# PHASE 6 — Implement safe projection/caching slices for symbols, status and current context

## Goal

Implement the smallest safe production slice for symbols/status/current-context safety.

## Target backlog item

```txt
PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01
```

## Required implementation

Implement or introduce:

1. `DocumentSymbolProjection` cache or equivalent if feasible.
2. Workspace symbols cap/cache/readiness metadata.
3. Current Object Context summary path that avoids full diagnostics/references inline.
4. Runtime status light snapshot separate from full `showStats`.
5. Provider adapter metadata updated for all affected providers.
6. Degraded/stale receipts where deep computation is deferred.

## Implementation rules

- Do not rewrite Current Object Context fully; lazy sections belong to a later read-only wave.
- Do not rewrite Object Explorer here.
- Do not remove full stats command; only separate light status path.
- Do not make workspace symbol queries unbounded.
- Preserve small-fixture behavior.

## Required docs

Update as needed:

```txt
docs/instant-semantic-indexing-target.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/performance-budget.md
docs/backlog.md
docs/troubleshooting.md
```

If the provider adapter backlog item is fully complete, move it to `docs/done-log.md`.  
If partial, keep it `Partial` and write exact pending work.

## Required validation

Run:

```bash
npm run build:test
npm run test:unit -- --grep "documentSymbols"
npm run test:unit -- --grep "workspaceSymbols"
npm run test:unit -- --grep "currentObject"
npm run test:unit -- --grep "status"
npm run test:architecture:rapid
npm run test:performance:gate
npm run test:docs:drift
npm test
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-4-provider-adapters-lsp-execution.md
```

Add:

```md
## PHASE 6 — Safety slice símbolos/status/current-context

### Diseño implementado

### Cambios de código

### Projection/cache/readiness behavior

### Degraded/stale receipts

### Tests añadidos o actualizados

### Docs actualizadas

### Estado del backlog

### Validación

### Riesgos restantes
```

---

# PHASE 7 — LSP provider integration matrix tests

## Goal

Expand integration coverage for critical LSP providers.

## Target backlog item

```txt
PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01
```

## Required coverage

Add or improve integration tests for at least these critical providers when feasible:

```txt
completion
completion resolve
signature help
definition
references
rename
semantic tokens
linked editing
workspace symbols
```

Existing integration tests for hover/documentSymbols/diagnostics must remain green.

## Tasks

1. Create reusable integration helpers if needed.
2. Add minimal deterministic PowerBuilder fixtures.
3. Verify provider registration/capability wiring.
4. Verify basic response shape.
5. Verify degraded/readiness behavior where feasible.
6. Do not create slow/flaky VS Code integration tests; keep them focused.
7. If a provider cannot be integrated safely in this wave, document exact pending work and keep backlog item `Partial`.

## Required docs

Update as needed:

```txt
docs/testing.md
docs/architecture-status.md
docs/backlog.md
```

## Required validation

Run:

```bash
npm run build:test
npm run test:integration
npm run test:docs:drift
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-4-provider-adapters-lsp-execution.md
```

Add:

```md
## PHASE 7 — Matriz integración LSP providers

### Providers cubiertos

### Tests añadidos o actualizados

### Fixtures añadidos

### Providers pendientes si aplica

### Docs actualizadas

### Estado del backlog

### Validación

### Riesgos restantes
```

---

# PHASE 8 — Performance and hot path validation

## Goal

Prove Wave 4 did not make provider hot paths slower or less deterministic.

## Tasks

1. Inspect whether Wave 4 changes affect:
   - hover latency;
   - completion latency;
   - signature help latency;
   - definition latency;
   - references latency;
   - rename latency;
   - CodeLens latency;
   - document/workspace symbols latency;
   - Current Object Context selection refresh;
   - runtime status refresh;
   - payload sizes;
   - cache hit/miss;
   - facade resolve count.
2. Add or update focused performance tests if existing harnesses are suitable.
3. Do not invent synthetic metrics manually.
4. If required performance harness is missing, update backlog/docs honestly and keep existing gates green.

## Required validation

Run:

```bash
npm run build:test
npm run test:performance:gate
npm run test:architecture:rapid
npm run test:docs:drift
npm test
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-4-provider-adapters-lsp-execution.md
```

Add:

```md
## PHASE 8 — Validación performance/hot path providers

### Riesgos de performance revisados

### Tests o gates ejecutados

### Métricas observadas

### Cambios adicionales si aplica

### Resultado

### Riesgos restantes
```

---

# PHASE 9 — Backlog, docs and done-log alignment

## Goal

Ensure documentation and backlog are fully aligned after Wave 4.

## Tasks

1. Update `docs/backlog.md`:
   - move completed items to Done/done-log if fully closed;
   - mark partial items as `Partial`;
   - write exact pending work for partial items.
2. Update `docs/done-log.md` for completed work.
3. Update `docs/current-focus.md` to point to the next recommended wave.
4. Update `docs/roadmap.md` only if execution order or status changed.
5. Update `docs/architecture-status.md` with current implementation status.
6. Update `docs/architecture-implementation-map.md` if files/modules changed.
7. Update `docs/testing.md` if new tests/gates were added.
8. Update `docs/performance-budget.md` if new metrics/budgets were added.
9. Update `docs/troubleshooting.md` if new runtime/provider failure modes were documented.
10. Update findings register if any finding changed status.

## Required validation

Run:

```bash
npm run test:docs:drift
npm run build:test
npm test
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-4-provider-adapters-lsp-execution.md
```

Add:

```md
## PHASE 9 — Alineación backlog/docs/done-log

### Backlog actualizado

### Done-log actualizado

### Current focus actualizado

### Architecture/status docs actualizados

### Testing/performance/troubleshooting docs actualizados

### Findings actualizados

### Validación

### Riesgos restantes
```

---

# PHASE 10 — Final full validation

## Goal

Finish only with a completely green validation baseline.

## Mandatory commands

Run all commands below and make them pass:

```bash
npm run build:test
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
npm run test:integration
npm test
```

Also run all focused tests added or touched during Wave 4.

## Absolute final rule

Do not finish if any command fails.

If any command fails:

1. inspect the failure;
2. fix the root cause;
3. update docs/backlog if the fix changes architecture or scope;
4. rerun the failed command;
5. rerun the full mandatory command set;
6. repeat until everything is green.

No exceptions.

## Required phase output

Update:

```txt
docs/audits/wave-4-provider-adapters-lsp-execution.md
```

Add:

```md
## PHASE 10 — Validación final completa

### Comandos ejecutados

### Resultado por comando

### Tests focales adicionales

### Estado final de backlog

### Estado final de docs

### Riesgos restantes
```

---

# PHASE 11 — Final self-review and closure

## Goal

Before final response, review all changes and ensure no gap remains.

## Mandatory review checklist

Re-read:

```txt
docs/backlog.md
docs/done-log.md
docs/current-focus.md
docs/roadmap.md
docs/architecture.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/instant-semantic-indexing-target.md
docs/testing.md
docs/performance-budget.md
docs/troubleshooting.md
docs/audits/wave-4-provider-adapters-lsp-execution.md
```

Verify:

1. Wave 4 scope was not exceeded.
2. Provider adapter work is Done or Partial with exact pending work.
3. LSP integration matrix work is Done or Partial with exact pending work.
4. No tests were weakened without documented reason.
5. No provider introduced a full workspace scan in hot paths.
6. No provider resolves semantic identity outside `SemanticQueryFacade` unless explicitly allowlisted.
7. References/rename/CodeLens have bounded behavior or documented partial state with exact pending work.
8. Current Object Context does not require full diagnostics/references inline for selection refresh.
9. Runtime status has a light path or exact pending work.
10. Integration coverage improved and remaining gaps are explicit.
11. Docs/backlog/current-focus/done-log are aligned.
12. `npm test` is green.
13. All mandatory validation commands are green.

## Final output

Only after every item above is true, output a final Spanish summary:

```md
## Resumen final — Oleada 4

### Fases ejecutadas

### Ítems cerrados

### Ítems parciales si aplica

### Cambios de código

### Cambios de documentación

### Tests y validación completa

### Riesgos restantes

### Siguiente oleada recomendada
```

If any item cannot be completed, do not finish. Fix it or keep working until all mandatory tests are green.

---

# Final note

Wave 4 must not attempt to solve Object Explorer paged projections, ReadOnlyProjectionEnvelope, DataWindow modularization, AI bundles, 10,000+ corpus or CI release gates directly. Those belong to later waves.

Wave 4 must leave the provider layer safer and more testable:

```txt
provider contracts clearer
hot paths bounded
semantic facade usage more explicit
references/rename/CodeLens safer
symbols/status/current-context less heavy
LSP integration coverage expanded
```
