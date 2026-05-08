# Wave 06 — Read-only Surfaces, Object Explorer, SQL Caps and AI Execution Budget

Execute Wave 06 from `docs/backlog.md`.

This wave depends on Wave 05 and assumes the read-only projection envelope contract exists or is at least partially implemented.

Target backlog items:

```txt
13. PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01
15. PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01
17. PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01
22. PB-UX-P2-DEGRADED-STALE-MESSAGING-UI-01
```

---

# Absolute mandatory rule

**DO NOT STOP, DO NOT ASK QUESTIONS, DO NOT SKIP PHASES, DO NOT MIX PHASES, DO NOT IMPLEMENT DATAWINDOW SPLIT, DO NOT IMPLEMENT RUNTIME METRICS, DO NOT IMPLEMENT 10K CORPUS, DO NOT IMPLEMENT CI GATES, DO NOT SPLIT ORCHESTRATORS, DO NOT CREATE TARGET SCAFFOLD, DO NOT TOUCH LEGACY RETIREMENT, AND DO NOT FINISH UNTIL OBJECT EXPLORER, SQL ANCHORS, AI BUNDLE PLANNING AND READ-ONLY UX STATE HAVE BEEN IMPLEMENTED INCREMENTALLY, TARGETED TESTS ARE GREEN, FULL VALIDATION HAS BEEN RUN, AND ALL AFFECTED DOCS ARE UPDATED.**

If a dependency from Wave 05 is missing or incomplete, do not bypass it. Implement only the smallest compatibility shim needed or mark the blocked work as Partial with exact pending work.

---

# Master goal

Preserve the project master goal:

```txt
The plugin must discover and index very fast without blocking VS Code.
```

Every read-only surface must be:

```txt
bounded
paged or capped
receipt-driven
stale/degraded-aware
safe during indexing
compatible with 10,000+ files
```

---

# Wave 06 intent

Wave 06 turns the Wave 05 read-only envelope into practical consumers.

The wave must implement:

```txt
1. Object Explorer server-owned paged/lazy projection.
2. SQL anchors bounded by consumer with truncation receipts.
3. AI task context execution planning before expensive section execution.
4. Consistent read-only UX state for loading/degraded/stale/ready/paged/error.
```

This wave must not do a DataWindow model split. DataWindow can only be touched where needed as a consumer of the read-only envelope or as bounded metadata.

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
docs/audits/wave-05-semantic-tokens-and-readonly-envelope-report.md
```

Also inspect relevant specs if present:

```txt
specs/PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01.md
specs/PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01.md
specs/PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01.md
specs/PB-UX-P2-DEGRADED-STALE-MESSAGING-UI-01.md
```

If specs do not exist, do not create large duplicate specs unless the repository requires it. Use the wave audit report as implementation evidence.

---

# Dependency check

Before implementation, verify whether Wave 05 produced:

```txt
read-only projection envelope contract
read-only projection state type
caps/truncation metadata
stale/degraded metadata
optional/backward-compatible DTO strategy
tests for envelope serialization
```

If missing:

```txt
Do not reimplement Wave 05 broadly.
Add only minimal compatibility types/helpers needed for this wave, document the gap, and leave the dependent backlog state as Partial.
```

---

# Source areas to inspect

Object Explorer:

```txt
src/server/features/semanticWorkspaceManifest.ts
src/client/objectExplorer.ts
src/client/objectExplorerModel.ts
src/shared/publicApi.ts
src/server/handlers/reportCommandHandlers.ts
test/server/unit/**objectExplorer**
test/server/integration/**objectExplorer**
test/smoke/**objectExplorer**
```

SQL anchors:

```txt
src/server/features/embeddedSqlAnchors.ts
src/server/parsing/sqlRegions.ts
src/server/features/currentObjectContext.ts
src/server/features/powerBuilderCodeMetrics.ts
test/server/unit/sqlRegions.test.ts
test/server/unit/**embeddedSql**
test/server/unit/**currentObjectContext**
```

AI bundle:

```txt
src/client/aiTaskContextBundle.ts
src/client/extension.ts
src/client/support/supportBundle.ts
src/client/workspaceCheckReport.ts
src/client/objectCheckReport.ts
src/server/handlers/reportCommandHandlers.ts
test/server/unit/**ai**
test/server/unit/**supportBundle**
test/server/unit/**workspaceCheck**
test/server/unit/**objectCheck**
```

UX/read-only states:

```txt
src/shared/publicApi.ts
src/client/objectExplorer.ts
src/client/currentObjectContextPanel.ts
src/client/diagnosticsExplainabilityPanel.ts
src/server/workspace/readiness.ts
test/smoke/**
test/server/integration/**
```

Inspect only additional files needed for direct contracts or tests.

---

# Non-goals

Do not implement:

```txt
PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01
PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01
PB-PERF-P2-10K-SEMANTIC-CORPUS-01
PB-CI-P1-REGRESSION-GATE-10K-PAYLOAD-01
PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01
PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01
PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01
PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01
```

Do not:

```txt
rewrite Object Explorer from scratch
remove the existing manifest API unless backward compatibility is preserved
move DataWindow modules
split publicApi.ts broadly
split extension.ts broadly
split featureHandlers.ts broadly
introduce runtime metrics event bus
create 10k corpus
change public API breaking shapes without compatibility tests
add deep SQL parsing or DB/schema validation
turn SQL advisory into strong semantic truth
execute expensive AI bundle sections before planning
```

---

# PHASE 0 — Baseline and dependency verification

## Tasks

1. Read required docs.
2. Verify Wave 05 read-only envelope state.
3. Inspect current Object Explorer manifest/model flow.
4. Inspect current SQL anchors default/callers.
5. Inspect current AI bundle section execution and token pruning.
6. Inspect current UX stale/degraded state handling.
7. Run baseline targeted validation.

Try:

```bash
npm run build:test
npm test -- --grep objectExplorer
npm test -- --grep currentObjectContext
npm test -- --grep sqlRegions
npm test -- --grep embeddedSql
npm test -- --grep aiTaskContext
npm test -- --grep supportBundle
npm run test:architecture:rapid
```

If grep is unsupported, run closest available tests and document it.

## Required output

Create or update:

```txt
docs/audits/wave-06-readonly-surfaces-object-explorer-sql-ai-ux-report.md
```

Include:

```md
# Wave 06 — Read-only Surfaces, Object Explorer, SQL Caps and AI Execution Budget

## PHASE 0 — Baseline and dependency verification

### Docs reviewed
### Wave 05 dependency status
### Object Explorer current flow
### SQL anchors current flow
### AI bundle current flow
### UX/read-only state current flow
### Baseline validation
### Initial risks
```

---

# PHASE 1 — SQL anchors bounded projection

## Goal

Make SQL anchors bounded by consumer and add truncation receipts without changing SQL semantics.

## Required design

Current problem:

```txt
DEFAULT_MAX_ANCHORS = Number.MAX_SAFE_INTEGER
some consumers call collectEmbeddedSqlAnchors without explicit cap
```

Target behavior:

```txt
every read-only/hot consumer must pass explicit cap or consumer policy
unbounded collection is allowed only for explicit debug/deep command paths
truncation must be visible as receipt/metadata
SQL remains advisory
no DBMS/schema validation
no heavy SQL parser in hot/read-only path
```

## Tasks

1. Add bounded options to SQL anchor collection if not already present.
2. Define consumer defaults, for example:

```txt
current-object-context
code-metrics
ai-bundle
support-bundle
debug/deep-report
```

3. Ensure Current Object Context does not request unlimited SQL anchors.
4. Add truncation metadata where existing DTO contracts allow it.
5. If the read-only envelope exists, attach caps/truncation to the projection metadata.
6. Preserve current detection behavior for existing SQL fixtures.

## Required tests

Add/update tests for:

```txt
dense SQL document gets capped
truncated/cap receipt is emitted
existing SQL anchors still detected
consumer without explicit cap is rejected or defaults to safe cap
debug/deep mode can request larger/unbounded cap only explicitly
```

## Required output

Update audit report:

```md
## PHASE 1 — SQL anchors bounded projection

### Files changed
### Consumer caps
### Truncation receipt behavior
### Tests added/updated
### Remaining gaps
```

---

# PHASE 2 — Object Explorer server-owned paged projection

## Goal

Introduce an incremental, server-owned, paged/lazy Object Explorer projection while preserving the existing manifest compatibility path.

## Required design

Current problem:

```txt
Object Explorer consumes a large flat manifest and builds the full tree on the client.
```

Target behavior:

```txt
server owns the projection
client requests children/pages for visible nodes
results are capped/paged
nodes have stable ids
projection includes freshness/stale/degraded/paged receipts
flat manifest remains as compatibility fallback during migration
```

## Minimum viable implementation

Implement a bounded first cut, not the final complete tree system.

Required capabilities:

```txt
root nodes/page request
children request by node id or path
page size/cursor or offset/limit
stable node ids
total/hasMore when available
projection metadata using read-only envelope if available
backward-compatible existing manifest path remains available
```

Allowed simplification:

```txt
The first implementation may page top-level object/type/library nodes and keep deeper node paging simple, as long as the contract is explicit and tested.
```

## Tasks

1. Add shared DTOs for paged Object Explorer projection.
2. Add server projection builder/query function.
3. Add client model support for lazy/paged children without deleting old manifest flow.
4. Add caps and paged receipts.
5. Ensure no global flat manifest is required for normal lazy loading path.
6. Keep existing commands/views working.

## Required tests

Add/update tests for:

```txt
first page of Object Explorer nodes
next page/cursor
stable node ids
truncation/page receipt
client model can build/consume paged nodes
existing flat manifest compatibility still works
large synthetic object list does not require full client tree build
```

## Required output

Update audit report:

```md
## PHASE 2 — Object Explorer paged projection

### Contract introduced
### Server projection behavior
### Client compatibility strategy
### Tests added/updated
### Remaining gaps
```

---

# PHASE 3 — AI task context execution budget

## Goal

Plan AI task context bundle execution before running expensive sections.

## Required design

Current problem:

```txt
The AI bundle computes sections and prunes after token budget.
```

Target behavior:

```txt
estimate cost/tokens before execution
prioritize sections by intent
skip low-priority sections before executing when budget is exhausted
record skippedBeforeExecution receipts with reason codes
keep final pruning as defensive guard only
```

## Tasks

1. Inventory bundle sections and current execution order.
2. Introduce execution plan model, for example:

```txt
AiTaskContextExecutionPlan
AiTaskContextSectionPlan
estimatedTokens
estimatedCost
priority
required
skipReasonCode
willExecute
```

3. Ensure low-budget requests do not execute sections known to be skipped.
4. Preserve existing output shape where possible.
5. Add receipts for skipped-before-execution sections.
6. Keep final token pruning as fallback guard.

## Required tests

Add/update tests for:

```txt
low budget skips expensive low-priority sections before execution
required sections still execute
reason codes are emitted
normal budget preserves existing useful bundle output
final pruning still works as guard
```

## Required output

Update audit report:

```md
## PHASE 3 — AI task context execution budget

### Execution plan introduced
### Sections skipped before execution
### Compatibility strategy
### Tests added/updated
### Remaining gaps
```

---

# PHASE 4 — Read-only UX state integration

## Goal

Expose and use consistent read-only states for migrated/pilot surfaces.

## Required states

Use the Wave 05 envelope or compatible state contract:

```txt
loading
degraded
stale
ready
paged
error
```

## Tasks

1. Add compact UX state mapping helpers if missing.
2. Integrate the state into surfaces touched in this wave:

```txt
Object Explorer paged projection
SQL anchors receipts in Current Object Context or reports
AI bundle skipped-before-execution receipts
```

3. Ensure UI can distinguish:

```txt
loading vs empty
ready vs partial
paged vs truncated
stale vs current
degraded vs error
```

4. Do not over-message; use compact receipts/microcopy.

## Required tests

Add/update smoke/unit tests for:

```txt
Object Explorer paged/ready state
Object Explorer loading/degraded fallback if projection unavailable
SQL anchors truncated state
AI bundle skipped-before-execution receipts
```

## Required output

Update audit report:

```md
## PHASE 4 — Read-only UX state integration

### States implemented
### Surfaces touched
### Tests added/updated
### Remaining gaps
```

---

# PHASE 5 — Documentation alignment

Update affected docs:

```txt
docs/instant-semantic-indexing-target.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/performance-budget.md
docs/current-focus.md
docs/backlog.md
```

Update `docs/done-log.md` only for fully closed items.

Rules:

```txt
Do not duplicate large architecture text.
Do not mark DataWindow split as done.
Do not mark Runtime metrics as done.
Do not mark 10K corpus or CI gate as done.
If Object Explorer is only first-cut/pilot paged projection, mark Partial with exact pending work.
If AI execution planning does not cover all sections, mark Partial with exact pending work.
If SQL anchors are bounded only for some consumers, mark Partial with exact pending work.
If UX state is integrated only into touched surfaces, mark Partial with exact pending work.
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

Object Explorer:

```bash
npm test -- --grep objectExplorer
npm test -- --grep ObjectExplorer
npm test -- --grep semanticWorkspaceManifest
```

SQL anchors:

```bash
npm test -- --grep sqlRegions
npm test -- --grep embeddedSql
npm test -- --grep currentObjectContext
```

AI bundle/support:

```bash
npm test -- --grep aiTaskContext
npm test -- --grep supportBundle
npm test -- --grep workspaceCheck
npm test -- --grep objectCheck
```

UX/read-only:

```bash
npm test -- --grep projection
npm test -- --grep stale
npm test -- --grep degraded
npm test -- --grep paged
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

If failures are caused by this wave, fix them before finishing.

If `npm test` fails for known pre-existing unrelated debt, document evidence.

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
changed tests
docs/audits/wave-06-readonly-surfaces-object-explorer-sql-ai-ux-report.md
docs/backlog.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/performance-budget.md
docs/current-focus.md
```

Verify:

```txt
Object Explorer has a server-owned paged/lazy projection path.
Existing flat manifest compatibility still works.
SQL anchors are bounded for touched consumers.
SQL anchors expose truncation/cap receipts.
AI bundle has execution planning before expensive work.
Skipped AI sections have reason codes.
Read-only UX states are represented consistently for touched surfaces.
No DataWindow split was implemented.
No runtime metrics event bus was implemented.
No 10K corpus/CI gate was implemented.
No broad publicApi/client/featureHandlers split was implemented.
No full workspace scan was introduced in hot paths.
No new parallel semantic store was introduced.
Docs/backlog states are honest.
Tests and validation are documented.
```

If any gap is found, fix or document before final response.

---

# Closing criteria

## PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01 can be Done only if:

```txt
server-owned paged projection exists
client can consume lazy/paged nodes
stable node ids exist
caps/page receipts exist
large object list does not require full client tree build
compatibility path remains safe
tests and docs are updated
validation is green or unrelated failures are documented
```

Otherwise mark Partial with exact pending work.

## PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01 can be Done only if:

```txt
execution plan exists
sections can be skipped before execution
reason codes are emitted
low-budget tests prove expensive omitted sections are not executed
final pruning remains as guard
docs and tests are updated
```

Otherwise mark Partial.

## PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01 can be Done only if:

```txt
all read-only consumers use explicit safe caps or consumer policies
truncation receipts exist
dense SQL tests pass
no unbounded default remains in interactive/read-only paths
docs and tests are updated
```

Otherwise mark Partial.

## PB-UX-P2-DEGRADED-STALE-MESSAGING-UI-01 can be Done only if:

```txt
all main read-only surfaces use uniform loading/degraded/stale/ready/paged/error state
tests/smoke cover visible state behavior
manual refresh/degraded fallback are documented
```

Otherwise mark Partial because this wave probably touches only pilot/migrated surfaces.

---

# Final response

Only after all phases are complete, respond in Spanish with:

```md
## Resumen final — Wave 06 Read-only Surfaces

### Documentos actualizados

### Código cambiado

### Tests añadidos/modificados

### Object Explorer paged projection

### SQL anchors bounded projection

### AI execution budget

### UX/read-only state

### Validación targeted ejecutada

### Validación completa ejecutada

### Estado de PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01

### Estado de PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01

### Estado de PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01

### Estado de PB-UX-P2-DEGRADED-STALE-MESSAGING-UI-01

### Riesgos pendientes

### Siguiente ola recomendada
```

Do not provide partial summaries before the full wave is complete.
```
