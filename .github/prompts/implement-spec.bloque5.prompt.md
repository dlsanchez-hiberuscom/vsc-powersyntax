# Wave 05 — Semantic Tokens Result State + Read-only Projection Envelope

Execute the next bounded implementation wave from `docs/backlog.md`.

This wave targets the following backlog items:

```txt
12. PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01
14. PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01
```

This wave is intentionally contract-first. Do not implement Object Explorer pagination, DataWindow split, SQL anchors migration, AI bundle execution planning, UX migration, runtime metrics, 10k corpus, CI gates, orchestrator split, scaffold, fitness suite or legacy retirement in this wave.

---

# Absolute mandatory rule

**DO NOT STOP, DO NOT ASK QUESTIONS, DO NOT SKIP PHASES, DO NOT MIX PHASES, DO NOT IMPLEMENT UNRELATED BACKLOG ITEMS, DO NOT DO A BIG-BANG REWRITE, AND DO NOT FINISH UNTIL SEMANTIC TOKENS RESULT STATE AND READ-ONLY PROJECTION ENVELOPE CONTRACTS ARE IMPLEMENTED INCREMENTALLY, TARGETED TESTS ARE GREEN, FULL VALIDATION HAS BEEN RUN, ALL AFFECTED DOCS ARE UPDATED, AND THE FINAL SELF-REVIEW HAS BEEN COMPLETED.**

If the full suite is not green, investigate the failures. Fix only failures caused by this wave. If a failure is clearly pre-existing/unrelated, document it with evidence and do not claim a fully green final state unless the repository accepts that failure as known debt.

---

# Master goal

Preserve the project master goal:

```txt
The plugin must discover and index very fast without blocking VS Code.
```

All implementation choices in this wave must protect interactive hot paths.

---

# Wave 05 intent

Wave 05 creates two foundational contracts:

```txt
1. Semantic tokens result state/versioning contract.
2. Shared read-only projection envelope contract.
```

Do not implement those later waves now.

---

# Required documentation context

Read first:

```txt
docs/backlog.md
docs/current-focus.md
docs/roadmap.md
docs/done-log.md
docs/architecture.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/instant-semantic-indexing-target.md
docs/semantic-design-target.md
docs/semantic-design-assumptions.md
docs/performance-budget.md
docs/testing.md
docs/troubleshooting.md
docs/powerbuilder-2025-vscode-plugin-technical-guide.md
docs/audits/macro-instant-semantic-indexing-findings.md
docs/audits/macro-instant-semantic-indexing-audit.md
```

Also inspect relevant specs if they exist:

```txt
specs/PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01.md
specs/PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01.md
```

If these specs do not exist, create implementation notes inside the audit report for this wave, not broad duplicate docs.

---

# Source areas to inspect

For semantic tokens:

```txt
src/server/features/semanticTokens.ts
src/server/presentation/semanticTokenPresentation.ts
src/server/presentation/viewModels.ts
src/server/handlers/featureHandlers.ts
src/server/analysis/analysisCache.ts
src/server/analysis/semanticSnapshot.ts
src/server/serving/activeDocumentServingSnapshot.ts
test/server/unit/semanticTokens.test.ts
test/server/integration/lsp-semanticTokens.test.ts
```

For read-only projection envelope:

```txt
src/shared/publicApi.ts
src/client/objectExplorer.ts
src/client/objectExplorerModel.ts
src/client/currentObjectContextPanel.ts
src/client/workspaceCheckReport.ts
src/client/objectCheckReport.ts
src/client/aiTaskContextBundle.ts
src/client/support/supportBundle.ts
src/server/handlers/reportCommandHandlers.ts
src/server/features/currentObjectContext.ts
src/server/features/semanticWorkspaceManifest.ts
src/server/features/workspaceCheckCatalogSummary.ts
```

Inspect only additional files required to confirm contracts, tests, or compatibility.

---

Do not:

```txt
rewrite the semantic tokens classifier entirely
change semantic token legend order without explicit tests
move DataWindow/SQL/native modules
paginate Object Explorer
split publicApi.ts broadly
split featureHandlers.ts broadly
introduce a new semantic store parallel to KnowledgeBase
introduce full workspace scans in hot paths
change public API shape in a breaking way
remove existing DTO fields unless compatibility tests prove it safe
```

---

# PHASE 0 — Baseline and context

## Tasks

1. Read required docs.
2. Inspect current semantic tokens full/delta handlers and presentation builder.
3. Inspect current public API/read-only DTOs and read-only surface builders.
4. Identify existing tests and missing contract tests.
5. Run baseline targeted validation.

Try:

```bash
npm run build:test
npm test -- --grep semanticTokens
npm test -- --grep SemanticTokens
npm test -- --grep projection
npm test -- --grep publicApi
npm run test:architecture:rapid
```

If a command does not exist or grep is unsupported, run the closest available command and document it.

## Required output

Create or update:

```txt
docs/audits/wave-05-semantic-tokens-and-readonly-envelope-report.md
```

Include:

```md
# Wave 05 — Semantic Tokens Result State + Read-only Projection Envelope

## PHASE 0 — Baseline and context

### Docs reviewed
### Current semantic tokens state
### Current read-only DTO/surface state
### Current tests
### Baseline validation
### Initial risks
```

---

# PHASE 1 — Semantic tokens result state contract

## Goal

Implement a versioned result state contract for semantic tokens without rewriting the entire semantic token classifier.

## Required design

Introduce a minimal result state model that can associate a resultId with:

```txt
uri
documentVersion
documentFingerprint
semanticEpoch or kbVersion
sourceOrigin when available
legend version
payload hash or payload identity
createdAt
```

The contract must support:

```txt
previousResultId lookup
safe full fallback when previousResultId is unknown or stale
cleanup on document close
cleanup/invalidation on document change or fingerprint mismatch
builder ephemeral per response
no ambiguous persistent builder keyed only by URI
```

Recommended names, adapt to repository style:

```txt
SemanticTokensResultState
SemanticTokensResultStateRegistry
SemanticTokensResultDescriptor
SemanticTokensLegendVersion
```

## Implementation constraints

```txt
Do not change semantic token legend order.
Do not remove existing semantic token types/modifiers.
Do not introduce full semantic resolve per token beyond current behavior.
Do not promise correct delta if the base result cannot be verified.
If previousResultId is stale/unknown, return full tokens conservatively.
```

## Required tests

Add or update tests for:

```txt
unknown previousResultId returns full fallback
changed documentVersion returns full fallback
changed documentFingerprint returns full fallback
changed semanticEpoch/kbVersion returns full fallback when semantic enrichment depends on it
changed legend version returns full fallback
document close evicts result state
resultId is not reused across incompatible snapshots
```

If the current code cannot compute a real document fingerprint, use the best existing fingerprint source and document remaining gap.

## Required output

Update audit report:

```md
## PHASE 1 — Semantic tokens result state contract

### Files changed
### Contract introduced
### Compatibility strategy
### Tests added/updated
### Remaining gaps
```

---

# PHASE 2 — Semantic tokens incremental compatibility

## Goal

Wire the result state contract into the existing semantic tokens full/delta path safely.

## Tasks

1. Replace or wrap any persistent `SemanticTokensBuilder` map keyed only by URI with versioned result state.
2. Keep the existing token computation path as much as possible.
3. Ensure delta requests validate `previousResultId` before attempting edits.
4. Return full tokens when state is not compatible.
5. Keep builder instances ephemeral per response.
6. Record conservative metadata for future performance metrics if existing infrastructure allows it.

## Required tests

Run targeted semantic token tests.

Try:

```bash
npm test -- --grep semanticTokens
npm test -- --grep SemanticTokens
npm test -- --grep semantic-tokens
npm run build:test
```

## Required output

Update audit report:

```md
## PHASE 2 — Semantic tokens wiring

### Behavior preserved
### Delta/full fallback behavior
### Targeted validation
### Known limitations
```

---

# PHASE 3 — Read-only projection envelope contract

## Goal

Introduce a shared read-only projection envelope contract that is optional/backward-compatible and compact.

## Required design

Define a contract for read-only surfaces that can express:

```txt
projectionId
projectionOwner
generatedAt
generatedFromCache
semanticEpoch
documentFingerprint
sourceOrigin
readiness
state: loading/degraded/stale/ready/paged/error
stale
staleReason
degraded
degradedReason
caps
truncated
truncatedReason
paged/pageInfo
refreshHint
```

Use optional fields. Do not force every existing DTO to migrate in this wave.

Recommended names, adapt to repository style:

```txt
ApiReadOnlyProjectionEnvelope
ApiReadOnlyProjectionState
ApiReadOnlyProjectionCaps
ApiReadOnlyProjectionPageInfo
ApiReadOnlyProjectionRefreshHint
```

The envelope can be:

```txt
A wrapper around payloads, or
A `projection` field embedded in existing DTOs.
```

Choose the approach that is most backward-compatible with current `src/shared/publicApi.ts`.

## Required helpers

Create small helpers if useful:

```txt
createReadOnlyProjectionEnvelope
createReadyProjectionEnvelope
createStaleProjectionEnvelope
createDegradedProjectionEnvelope
createTruncatedProjectionCaps
```

Keep helpers lightweight and testable.

## Required tests

Add tests for:

```txt
envelope serializes as expected
ready state
stale state
degraded state
truncated/caps metadata
paged metadata if implemented
backward compatibility of existing DTOs
```

## Required output

Update audit report:

```md
## PHASE 3 — Read-only projection envelope contract

### Contract introduced
### Compatibility strategy
### Tests added/updated
### Remaining gaps
```

---

# PHASE 4 — Optional pilot integration

## Goal

Integrate the envelope into at most one safe read-only surface if doing so is low-risk.

Allowed pilot candidates:

```txt
workspace/object check reports if they already have caps/truncated metadata
support bundle metadata if it already carries receipts
current object context only if no deep section rewrite is required
```

Do not use Object Explorer as the pilot in this wave, because Object Explorer pagination belongs to PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01.

## Decision rule

```txt
If a pilot integration is clearly safe and has tests:
  implement it.

If not clearly safe:
  do not integrate yet; document integration plan for Wave 06.
```

## Required output

Update audit report:

```md
## PHASE 4 — Pilot integration

### Pilot chosen or deferred
### Reason
### Files changed
### Validation
### Wave 06 handoff
```

---

# PHASE 5 — Documentation alignment

Update docs affected by this wave.

Required docs:

```txt
docs/instant-semantic-indexing-target.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/performance-budget.md
docs/current-focus.md
docs/backlog.md
```

Update `docs/done-log.md` only if a backlog item is fully closed with code, tests, docs and validation.

Rules:

```txt
Do not duplicate large architecture text.
Do not mark PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01 as done.
Do not mark PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01 as done.
Do not mark PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01 as done.
Do not mark PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01 as done.
If PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01 is only partially implemented, leave it Partial with exact pending work.
If PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01 is only contract-only or pilot-only, leave it Partial with exact pending work.
```

## Required output

Update audit report:

```md
## PHASE 5 — Documentation alignment

### Docs updated
### Backlog state changes
### Done-log changes
### Remaining documentation gaps
```

---

# PHASE 6 — Validation

Run targeted validation first.

Semantic tokens targeted validation:

```bash
npm test -- --grep semanticTokens
npm test -- --grep SemanticTokens
npm test -- --grep semantic-tokens
```

Read-only/public API targeted validation:

```bash
npm test -- --grep projection
npm test -- --grep publicApi
npm test -- --grep workspaceCheck
npm test -- --grep objectCheck
npm test -- --grep supportBundle
```

General validation:

```bash
npm run build:test
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
npm test
```

If a command does not exist or grep is unsupported, document it and run the closest available command.

If any failure is caused by this wave, fix it before finishing.

If `npm test` fails for known pre-existing unrelated debt, document:

```txt
command
failure summary
evidence that it is unrelated/pre-existing
related backlog item if any
```

## Required output

Update audit report:

```md
## PHASE 6 — Validation

### Targeted validation
### Full validation
### Failures investigated
### Final test state
```

---

# PHASE 7 — Final self-review

Before finishing, re-read:

```txt
changed source files
changed test files
docs/audits/wave-05-semantic-tokens-and-readonly-envelope-report.md
docs/backlog.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/performance-budget.md
docs/current-focus.md
```

Verify:

```txt
Semantic tokens result state is versioned.
previousResultId is validated before delta edits.
unknown/stale previousResultId falls back to full tokens.
semantic token builder state is not ambiguous per URI only.
read-only projection envelope contract exists.
envelope contract is optional/backward-compatible.
no Object Explorer pagination was implemented in this wave.
no DataWindow/SQL/AI/UX/split/legacy future wave work was implemented accidentally.
targeted tests are documented.
full validation is documented.
backlog states are honest: Done only if fully closed, otherwise Partial/Open.
all affected docs are aligned.
no full workspace scan was introduced in hot paths.
no parallel semantic store was introduced.
```

If any gap is found, fix or document before final response.

---

# Closing criteria

## PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01 can be Done only if:

```txt
result state is versioned by URI/documentVersion/fingerprint/semanticEpoch or equivalent
previousResultId compatibility is tested
full fallback is tested
close/change eviction is tested
builder state is not ambiguous by URI only
docs and performance/testing notes are updated
full validation is green or unrelated known failures are documented
```

Otherwise mark as Partial and document exact pending work.

## PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01 can be Done only if:

```txt
shared envelope contract exists
tests cover ready/stale/degraded/truncated/paged states where implemented
at least one safe pilot or compatibility test proves it works
existing DTOs remain backward compatible
docs and backlog are updated
full validation is green or unrelated known failures are documented
```

Otherwise mark as Partial and document exact pending work.

---

# Final response

Only after all phases are complete, respond in Spanish with:

```md
## Resumen final — Wave 05 Semantic Tokens + Read-only Envelope

### Documentos actualizados

### Código cambiado

### Tests añadidos/modificados

### Semantic tokens result state

### Read-only projection envelope

### Pilot integration

### Validación targeted ejecutada

### Validación completa ejecutada

### Estado de PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01

### Estado de PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01

### Riesgos pendientes

### Siguiente ola recomendada
```

Do not provide partial summaries before the full wave is complete.
```
