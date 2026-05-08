# Execute Wave 2 — Diagnostics + Semantic Tokens Contract-First

Execute **Wave 2** completely, phase by phase, without stopping, without asking for confirmation, and without delivering partial summaries.

Wave 2 focuses on:

```txt
1. PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01
2. PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01
```

This wave must preserve the project master goal:

> The plugin must discover and index very fast without blocking VS Code.

Do not introduce broad rewrites. Do not create semantic stores parallel to `KnowledgeBase.publishedState`. Do not introduce full workspace scans in hot paths. Do not weaken tests to make them pass.

---

# Mandatory execution rule

**DO NOT STOP, DO NOT ASK QUESTIONS, AND DO NOT DELIVER PARTIAL SUMMARIES: execute every phase in strict order, close each phase with evidence, code changes, documentation updates and tests, and do not finish until Wave 2, all affected documentation, backlog/current-focus/done-log updates, and the complete final validation are fully green.**

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

This execution covers only Wave 2:

```txt
PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01
PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01
```

Wave 2 assumes Wave 0 + Wave 1 are complete or at least stable enough to proceed.

If Wave 0 + Wave 1 are not complete, do not silently continue. Document the blocking gap in the execution report, fix what is required to restore a green baseline, and continue only when the required baseline is green.

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
- Do not introduce full workspace scans in diagnostics or semantic tokens.
- Do not execute project-wide diagnostics in open/change hot paths.
- Do not resolve semantic identity per token without a bounded budget and explicit degraded fallback.
- Do not leave `npm test` red.
- Do not leave `npm run build:test` red.
- Do not leave architecture gates red.
- Do not leave docs drift red.
- Do not leave performance gate red.
- Do not mark anything `Done` without code, tests, validation and documentation.

---

# PHASE 0 — Preparation and baseline verification

## Goal

Understand the current state and verify the repository is ready for Wave 2.

## Tasks

1. Read all source documents.
2. Inspect the current backlog status of:

```txt
PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01
PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01
```

3. Inspect related findings:

```txt
FINDING-013
FINDING-019
FINDING-025
FINDING-026
FINDING-029
FINDING-039
FINDING-040
```

4. Inspect these files before editing:

```txt
src/server/features/diagnostics.ts
src/server/features/diagnosticsExtra.ts
src/server/features/obsoleteDetector.ts
src/server/analysis/diagnosticScheduler.ts
src/server/analysis/openDocumentDiagnostics.ts
src/server/features/semanticTokens.ts
src/server/presentation/semanticTokenPresentation.ts
src/server/handlers/featureHandlers.ts
test/server/unit/diagnostics.test.ts
test/server/unit/diagnosticsExtra.test.ts
test/server/unit/diagnosticScheduler.test.ts
test/server/unit/openDocumentDiagnostics.test.ts
test/server/unit/semanticTokens.test.ts
test/server/integration/lsp-diagnostics.test.ts
```

5. Run the baseline commands:

```bash
npm run build:test
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
npm test
```

6. If any command fails, fix the baseline first. Do not start Wave 2 implementation while the baseline is red.

## Required phase output

Create or update:

```txt
docs/audits/wave-2-diagnostics-tokens-execution.md
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

# PHASE 1 — Contract-first tests for diagnostics tiers

## Goal

Create tests that define the target diagnostics tier contract before moving production code.

## Target backlog item

```txt
PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01
```

## Required design

Diagnostics must move from:

```txt
syntactic | full
```

towards:

```txt
Tier 0 — safety/suppression
Tier 1 — local syntax
Tier 2 — document semantic
Tier 3 — project semantic
Tier 4 — advisory/report-only
```

## Tasks

1. Add or update tests that define diagnostic rule metadata:

```txt
id
tier
domain
sourceOriginPolicy
confidenceFloor
lane
budget
cap
advisory/report-only flag
```

2. Add tests proving:
   - Tier 0/1 can run without project-wide semantic state.
   - Tier 3/4 cannot run inline in open/change hot paths.
   - Advisory rules cannot silently appear as normal high-confidence diagnostics.
   - Every rule has an owner/tier/domain.
   - Caps are applied per tier, not only globally.
   - Existing diagnostic codes still map to a valid tier.

3. Add tests for compatibility:
   - `buildDiagnosticsForDocument(..., 'syntactic')` still works.
   - `buildDiagnosticsForDocument(..., 'full')` can remain as compatibility layer, but internally must be compatible with tier composition.

4. Do not move production logic broadly in this phase. This phase is contract-first.

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
npm run test:unit -- --grep "diagnostic"
npm run test:docs:drift
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-2-diagnostics-tokens-execution.md
```

Add:

```md
## PHASE 1 — Tests contract-first para diagnostics tiers

### Contrato definido

### Tests añadidos o actualizados

### Compatibilidad preservada

### Docs actualizadas

### Validación

### Riesgos restantes
```

---

# PHASE 2 — Implement diagnostics rule registry and tier pipeline slice

## Goal

Implement the smallest safe production slice for diagnostics tiering and registry.

## Target backlog item

```txt
PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01
```

## Required implementation

Implement a minimal but real diagnostics registry/pipeline.

The target can be incremental. Do not rewrite all diagnostics at once.

Required minimum:

1. Create a `DiagnosticRuleRegistry` or equivalent structure.
2. Register existing diagnostic rules with metadata.
3. Preserve current LSP output behavior where possible.
4. Keep `buildDiagnosticsForDocument(..., 'syntactic')` and `buildDiagnosticsForDocument(..., 'full')` as compatibility APIs if needed.
5. Internally start composing diagnostics by tier.
6. Ensure advisory rules are explicitly marked.
7. Ensure future rules cannot be added without tier metadata.
8. Ensure open/change hot path can call Tier 0/1 without running Tier 3/4 inline.
9. Add or update summaries so diagnostics explainability can still work.

## Implementation rules

- Do not convert all rules in one huge refactor if a safe incremental registry is possible.
- Do not change diagnostic codes or ranges unless tests prove the old behavior was wrong.
- Do not remove diagnostics without explicit rationale.
- Do not introduce project-wide scans in Tier 0/1.
- Do not make advisory checks high-confidence unless evidence supports it.

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
npm run test:unit -- --grep "diagnostic"
npm run test:unit -- --grep "openDocumentDiagnostics"
npm run test:unit -- --grep "diagnosticScheduler"
npm run test:integration -- --grep "diagnostics"
npm run test:architecture:rapid
npm run test:docs:drift
npm test
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-2-diagnostics-tokens-execution.md
```

Add:

```md
## PHASE 2 — Registry y pipeline inicial de diagnostics

### Diseño implementado

### Cambios de código

### Reglas registradas

### Compat layer

### Tests añadidos o actualizados

### Docs actualizadas

### Estado del backlog

### Validación

### Riesgos restantes
```

---

# PHASE 3 — Contract-first tests for semantic tokens result state

## Goal

Create tests that define semantic tokens full/range/delta/resultId/fingerprint behavior before broad production changes.

## Target backlog item

```txt
PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01
```

## Required target behavior

Semantic tokens must support or prepare for:

```txt
full tokens
range tokens if feasible
delta tokens
resultId state
previousResultId validation
documentVersion
documentFingerprint
semanticEpoch/kbVersion
sourceOrigin
legend version
payload hash or equivalent state identity
structural-only degraded fallback
```

## Tasks

1. Add tests proving:
   - Unknown `previousResultId` falls back to full tokens.
   - Changed document fingerprint invalidates old result state.
   - Closing/reopening a document evicts or invalidates token state correctly.
   - Delta is only produced when previous state matches the current snapshot.
   - Structural tokens can be returned when semantic enrichment is unavailable or over budget.
   - The provider does not rely on an unversioned builder per URI as the authoritative state.
   - Semantic token computation has a bounded resolve budget.

2. Add tests for existing behavior:
   - declarations;
   - local scopes;
   - catalog/system symbols;
   - inherited/member tokens where currently supported;
   - confidence/modifier mapping.

3. Do not rewrite the full provider in this phase. This is contract-first.

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
npm run test:unit -- --grep "semanticTokens"
npm run test:docs:drift
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-2-diagnostics-tokens-execution.md
```

Add:

```md
## PHASE 3 — Tests contract-first para semantic tokens result state

### Contrato definido

### Tests añadidos o actualizados

### Compatibilidad preservada

### Docs actualizadas

### Validación

### Riesgos restantes
```

---

# PHASE 4 — Implement semantic tokens result state and bounded projection slice

## Goal

Implement the smallest safe production slice for versioned semantic tokens state.

## Target backlog item

```txt
PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01
```

## Required implementation

Implement or introduce:

1. `SemanticTokensResultState` or equivalent.
2. State keyed by:
   - URI;
   - documentVersion;
   - documentFingerprint;
   - semanticEpoch or kbVersion;
   - sourceOrigin if applicable;
   - legend version;
   - payload hash or equivalent.
3. Full fallback when `previousResultId` is unknown or incompatible.
4. Builder should be ephemeral per response, not the authoritative persistent state.
5. Explicit eviction on document close.
6. Structural-first token projection if feasible in this slice.
7. Bounded semantic enrichment:
   - no unlimited `facade.resolveTarget(...)` per identifier;
   - if budget is exceeded, return structural/degraded tokens.
8. Metrics or counters where already supported:
   - full vs delta;
   - fallback full;
   - cache/result state hit;
   - resolve count;
   - payload bytes.

## Implementation rules

- Do not implement a huge semantic tokens rewrite.
- Keep current token output stable where possible.
- Prefer additive state and compatibility over breaking behavior.
- If range provider is not feasible now, document exact pending work and keep backlog item `Partial`.
- Do not add global scans.
- Do not add unbounded semantic resolution per token.

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

If the item is fully complete, move it to `docs/done-log.md`.  
If partial, keep it `Partial` with exact pending work.

## Required validation

Run:

```bash
npm run build:test
npm run test:unit -- --grep "semanticTokens"
npm run test:architecture:rapid
npm run test:performance:gate
npm run test:docs:drift
npm test
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-2-diagnostics-tokens-execution.md
```

Add:

```md
## PHASE 4 — Semantic tokens result state y projection slice

### Diseño implementado

### Cambios de código

### Estado full/delta/resultId

### Budget/degraded behavior

### Tests añadidos o actualizados

### Docs actualizadas

### Estado del backlog

### Validación

### Riesgos restantes
```

---

# PHASE 5 — Performance and hot path validation for diagnostics and tokens

## Goal

Prove Wave 2 did not make hot paths slower or less deterministic.

## Tasks

1. Inspect whether new diagnostics/tokens logic affects:
   - open/change latency;
   - semantic tokens compute time;
   - payload size;
   - diagnostics count/caps;
   - provider resolve counts;
   - event loop blocking risk.
2. Add or update focused performance tests if the repository already has suitable harnesses.
3. Do not invent synthetic performance numbers manually.
4. If a needed performance harness is missing, update backlog/docs honestly and continue only after existing gates are green.

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
docs/audits/wave-2-diagnostics-tokens-execution.md
```

Add:

```md
## PHASE 5 — Validación hot path diagnostics/tokens

### Riesgos de performance revisados

### Tests o gates ejecutados

### Métricas observadas

### Cambios adicionales si aplica

### Resultado

### Riesgos restantes
```

---

# PHASE 6 — Backlog, docs and done-log alignment

## Goal

Ensure documentation and backlog are fully aligned after Wave 2.

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
9. Update findings register if any finding changed status.

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
docs/audits/wave-2-diagnostics-tokens-execution.md
```

Add:

```md
## PHASE 6 — Alineación backlog/docs/done-log

### Backlog actualizado

### Done-log actualizado

### Current focus actualizado

### Architecture/status docs actualizados

### Testing/performance docs actualizados

### Findings actualizados

### Validación

### Riesgos restantes
```

---

# PHASE 7 — Final full validation

## Goal

Finish only with a completely green validation baseline.

## Mandatory commands

Run all commands below and make them pass:

```bash
npm run build:test
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
npm test
```

Also run all focused tests added or touched during Wave 2.

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
docs/audits/wave-2-diagnostics-tokens-execution.md
```

Add:

```md
## PHASE 7 — Validación final completa

### Comandos ejecutados

### Resultado por comando

### Tests focales adicionales

### Estado final de backlog

### Estado final de docs

### Riesgos restantes
```

---

# PHASE 8 — Final self-review and closure

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
docs/audits/wave-2-diagnostics-tokens-execution.md
```

Verify:

1. Wave 2 scope was not exceeded.
2. Diagnostics registry/tier work is Done or Partial with exact pending work.
3. Semantic tokens result state work is Done or Partial with exact pending work.
4. No tests were weakened without documented reason.
5. No diagnostics advisory logic is presented as high-confidence without evidence.
6. No Tier 3/4 diagnostics run inline in open/change hot paths.
7. No unbounded semantic resolution per token was introduced.
8. No full workspace scan was introduced.
9. No new semantic store parallel to `KnowledgeBase.publishedState` was introduced.
10. Docs/backlog/current-focus/done-log are aligned.
11. `npm test` is green.
12. All mandatory validation commands are green.

## Final output

Only after every item above is true, output a final Spanish summary:

```md
## Resumen final — Oleada 2

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

## Nota final

Esta oleada no debe intentar resolver todo el sistema de providers, cache, Object Explorer ni DataWindow. Su objetivo es dejar **Diagnostics** y **Semantic Tokens** con contratos robustos, tests suficientes, comportamiento bounded y documentación alineada, manteniendo siempre todos los tests en verde.
