# Wave 08 — Runtime Metrics, 10K Corpus and CI Regression Gates

Execute Wave 08 from `docs/backlog.md`.

This wave depends on Wave 05, Wave 06 and Wave 07.

Target backlog items:

```txt
19. PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01
20. PB-PERF-P2-10K-SEMANTIC-CORPUS-01
21. PB-CI-P1-REGRESSION-GATE-10K-PAYLOAD-01
```

---

# Absolute mandatory rule

**DO NOT STOP, DO NOT ASK QUESTIONS, DO NOT SKIP PHASES, DO NOT MIX PHASES, DO NOT SPLIT ORCHESTRATORS, DO NOT CREATE TARGET MODULE SCAFFOLD, DO NOT IMPLEMENT SIMPLIFICATION FITNESS SUITE, DO NOT TOUCH LEGACY RETIREMENT, DO NOT REWRITE PROVIDERS, DO NOT CHANGE SEMANTIC BEHAVIOR, AND DO NOT FINISH UNTIL RUNTIME PERFORMANCE EVENT CONTRACT, SYNTHETIC 10K CORPUS STRATEGY AND CI/PAYLOAD REGRESSION GATES ARE IMPLEMENTED INCREMENTALLY, TARGETED TESTS ARE GREEN, FULL VALIDATION HAS BEEN RUN, AND ALL AFFECTED DOCS ARE UPDATED.**

If a dependency from previous waves is missing or incomplete, do not bypass it. Add only the smallest compatibility shim needed, document the gap, and mark affected work as Partial.

---

# Master goal

Preserve the project master goal:

```txt
The plugin must discover and index very fast without blocking VS Code.
```

This wave must make performance observable and regression-resistant without adding heavy runtime overhead.

Performance instrumentation must be:

```txt
low overhead
bounded
sampled or aggregated where needed
safe for hot paths
usable in tests and CI
compatible with large workspaces
able to explain p50/p95/p99, payload, cache, cancellation and degraded outcomes
```

---

# Wave 08 intent

Wave 08 must introduce the observability and regression infrastructure needed before bigger structural splits.

This wave must implement:

```txt
1. A homogeneous Runtime PerformanceEvent contract.
2. Worker/scheduler/event-loop/memory metrics where safe and low-overhead.
3. A deterministic synthetic PowerBuilder corpus generator strategy for 10,000+ files.
4. A fast/smoke corpus mode suitable for PR/release gates.
5. A larger optional/nightly 10K lane with JSON artifacts.
6. Payload/performance regression gate integration in report-only or fail mode depending on stability.
```

This wave must not attempt to fully optimize every provider. It must create the measurement and gate contracts first.

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
docs/performance-budget.md
docs/testing.md
docs/release.md
docs/troubleshooting.md
docs/powerbuilder-2025-vscode-plugin-technical-guide.md
docs/audits/macro-instant-semantic-indexing-findings.md
docs/audits/macro-instant-semantic-indexing-audit.md
docs/audits/wave-05-semantic-tokens-and-readonly-envelope-report.md
docs/audits/wave-06-readonly-surfaces-object-explorer-sql-ai-ux-report.md
docs/audits/wave-07-datawindow-submodel-and-status-ownership-report.md
```

Also inspect specs if present:

```txt
specs/PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01.md
specs/PB-PERF-P2-10K-SEMANTIC-CORPUS-01.md
specs/PB-CI-P1-REGRESSION-GATE-10K-PAYLOAD-01.md
```

If specs do not exist, do not create large duplicate specs unless repository rules require it. Use the wave audit report as implementation evidence.

---

# Source areas to inspect

Runtime metrics:

```txt
src/server/runtime/interactiveServingStats.ts
src/server/runtime/runtimeJournal.ts
src/server/runtime/timing.ts
src/server/runtime/latencyGovernor.ts
src/server/runtime/memoryBudgets.ts
src/server/runtime/scheduler.ts
src/server/indexer/workerPool.ts
src/server/indexer/workspaceIndexer.ts
src/server/serving/interactiveServingPipeline.ts
src/server/serving/payloadBudget.ts
src/server/handlers/featureHandlers.ts
src/server/handlers/runtimeCommandHandlers.ts
```

Performance tests and gates:

```txt
test/server/performance/**
tools/run-performance-budget-gate.mjs
tools/run-architecture-rapid-gate.mjs
package.json
.github/workflows/release-readiness.yml
test/server/unit/**performance**
test/server/unit/**payload**
test/server/unit/**runtime**
```

Corpus/generator areas:

```txt
test/server/performance/knowledgeBase.perf.test.ts
test/server/performance/large-workspace-incremental.perf.test.ts
test/server/performance/ci-budget-gate.perf.test.ts
test/server/performance/session-stability-soak.perf.test.ts
test/fixtures/**
tools/**
```

Inspect only additional files needed for direct contracts, tests or scripts.

---

# Non-goals

Do not implement:

```txt
PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01
PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01
PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01
PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01
```

Do not:

```txt
rewrite runtime scheduler behavior
rewrite worker pool behavior
rewrite all providers to emit new events in one step
add high-cardinality or heavy payload data to hot path metrics
serialize full LSP payloads just to measure them
make 10K gate mandatory in every PR if too expensive
commit huge generated corpora to the repository
break release:verify
change public APIs unnecessarily
hide failing performance gates
```

---

# PHASE 0 — Baseline and dependency verification

## Tasks

1. Read required docs.
2. Inspect current runtime/interactive metrics.
3. Inspect worker/scheduler/indexer available stats.
4. Inspect current performance gates and release scripts.
5. Inspect existing performance corpus/test generators.
6. Run baseline validation.

Try:

```bash
npm run build:test
npm run test:performance:gate
npm run test:architecture:rapid
npm test -- --grep performance
npm test -- --grep payload
npm test -- --grep runtime
```

If grep is unsupported, run closest available commands and document it.

## Required output

Create or update:

```txt
docs/audits/wave-08-runtime-metrics-10k-ci-gates-report.md
```

Include:

```md
# Wave 08 — Runtime Metrics, 10K Corpus and CI Regression Gates

## PHASE 0 — Baseline and dependency verification

### Docs reviewed
### Previous wave dependency status
### Current runtime metrics inventory
### Current performance tests and gates
### Current corpus/generator inventory
### Current CI/release gate inventory
### Baseline validation
### Initial risks
```

---

# PHASE 1 — PerformanceEvent contract

## Goal

Introduce a homogeneous runtime performance event contract with minimal overhead and backward compatibility.

## Required design

Define a compact event model that can represent:

```txt
traceId
timestamp
feature/method
lane
uri
documentVersion
documentFingerprint
workspaceId/projectId when available
semanticEpoch/kbVersion
durationMs
waitMs
runMs
providerMs
formatterMs
cacheOutcome
fallbackKind
cancelled
errorKind
payloadBytes
resultSize
budgetMs
outcome
degraded/stale reason
```

Not every field must be required. Required fields must be minimal and stable.

Recommended names, adapt to repository style:

```txt
PerformanceEvent
PerformanceEventOutcome
PerformanceEventFeature
PerformanceEventLane
PerformanceEventCacheOutcome
PerformanceEventRecorder
RuntimeMetricsRegistry
```

## Constraints

```txt
Do not add high-overhead measurement.
Do not serialize large payloads just to compute size.
Use existing payload estimation helpers where possible.
Keep existing InteractiveServingStatsTracker working as compatibility projection.
Do not force all providers to migrate in one step.
```

## Tasks

1. Add event types and recorder/registry.
2. Adapt existing `InteractiveServingStatsTracker` or equivalent to consume/project new events.
3. Wire the event contract into the existing serving pipeline first.
4. Add minimal wrappers for providers already measured if safe.
5. Keep old stats APIs available.

## Required tests

Add/update tests for:

```txt
PerformanceEvent schema validation
recording event does not throw with minimal fields
interactive stats can be projected from events
payloadBytes/resultSize can be included without payload serialization
budget exceeded outcome is represented
cancelled/error outcomes are represented
```

## Required output

Update audit report:

```md
## PHASE 1 — PerformanceEvent contract

### Contract introduced
### Compatibility strategy
### Existing stats integration
### Tests added/updated
### Remaining gaps
```

---

# PHASE 2 — Worker, scheduler, event-loop and memory metrics

## Goal

Add low-overhead metrics for worker pool, scheduler lanes, event loop and memory pressure without changing behavior.

## Tasks

Instrument or expose snapshots for:

```txt
worker queue depth
worker busy/idle count
worker task wait/run duration where feasible
worker failures/restarts if available
scheduler lane queue depth
scheduler lane wait/run duration where feasible
preemption/cancellation counters if already tracked
event-loop delay/utilization if safe and supported
memory usage snapshot
memory budget pressure state
```

Constraints:

```txt
Do not change scheduling semantics.
Do not introduce leaking timers/handles.
Event-loop sampling must be optional or bounded.
Tests must tolerate platform/CI variability.
```

## Required tests

Add/update tests for:

```txt
worker stats snapshot shape
scheduler stats snapshot shape
event-loop monitor can start/stop without leaked handles
memory stats snapshot shape
runtime status includes bounded metrics
```

## Required output

Update audit report:

```md
## PHASE 2 — Worker/scheduler/event-loop/memory metrics

### Metrics introduced
### Behavior preservation
### Runtime status integration
### Tests added/updated
### Remaining gaps
```

---

# PHASE 3 — Synthetic PowerBuilder corpus generator

## Goal

Create a deterministic synthetic corpus generator strategy that can scale to 10,000+ files without committing huge generated files.

## Required design

The generator must be deterministic and seedable.

It must support domains:

```txt
SRU/SRW/SRM/SRA/SRF/SRD/SRP style files
types/functions/events/subroutines
inheritance chains
PFC/STD-like naming patterns
DataWindow .srd files
embedded/dynamic SQL samples
external/native declarations
workspace/project/library layout
file add/delete/rename scenarios if feasible
```

Modes:

```txt
smoke mode: small, fast, CI-friendly
medium mode: local/release optional
10k mode: optional/nightly, artifact-driven
```

The generator must avoid committing large generated corpora unless explicitly intended.

Recommended locations:

```txt
tools/generate-synthetic-powerbuilder-corpus.mjs
test/server/performance/corpus/
test/server/performance/helpers/
```

Adapt to repository conventions.

## Required tests

Add tests for:

```txt
generator is deterministic with same seed
generator creates expected number of files in smoke mode
generator includes required PowerBuilder domains
generated workspace can be discovered/indexed by existing performance harness
generated output can be cleaned up safely
```

## Required output

Update audit report:

```md
## PHASE 3 — Synthetic PowerBuilder corpus generator

### Generator introduced
### Modes
### Domains covered
### Tests added/updated
### Remaining gaps
```

---

# PHASE 4 — Performance matrix and JSON artifacts

## Goal

Connect metrics and synthetic corpus to a performance matrix with JSON artifacts.

## Tasks

Add or update scripts/tests to produce stable JSON artifacts for:

```txt
indexing throughput
warm/cold discovery where available
hover/completion/signature/definition latency
diagnostics latency
semantic tokens latency/payload
Object Explorer/read-only payload where available
cache hit/miss summary
worker/scheduler/runtime metrics snapshot
payload bytes/result sizes
```

Use report-only mode initially for unstable or environment-sensitive metrics.

Recommended artifact path:

```txt
artifacts/performance/
```

Do not make expensive 10K gate mandatory in normal `npm test`.

## Required tests

Add/update tests for:

```txt
performance artifact JSON schema
smoke performance matrix writes artifact
artifact contains required top-level sections
report-only failures do not break unrelated tests unless configured
```

## Required output

Update audit report:

```md
## PHASE 4 — Performance matrix and JSON artifacts

### Matrix introduced
### Artifacts generated
### Report-only vs fail gates
### Tests added/updated
### Remaining gaps
```

---

# PHASE 5 — CI/release gate integration

## Goal

Integrate new gates into package scripts and CI/release in a staged way.

## Required design

Keep gate lanes separate:

```txt
fast PR gate
release verify gate
optional/nightly 10K gate
local soak/performance gate
```

Possible scripts, adapt to repository style:

```txt
npm run test:performance:gate
npm run test:performance:payload
npm run test:performance:10k:smoke
npm run test:performance:10k:nightly
npm run release:verify
```

Rules:

```txt
Do not slow down every PR with full 10K.
Use smoke mode for fast/release if stable.
Use optional/nightly for full 10K.
Payload gate may start as report-only if thresholds are not stable.
release:verify must remain usable.
```

## Required tests

Add/update tests for:

```txt
package scripts exist and point to valid commands
release readiness contract reflects new lanes
workflow references valid scripts if modified
report-only gate writes artifact
```

## Required output

Update audit report:

```md
## PHASE 5 — CI/release gate integration

### Scripts added/updated
### Workflow changes
### Release verify impact
### Report-only gates
### Tests added/updated
### Remaining gaps
```

---

# PHASE 6 — Documentation alignment

Update affected docs:

```txt
docs/instant-semantic-indexing-target.md
docs/performance-budget.md
docs/testing.md
docs/release.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/current-focus.md
docs/backlog.md
```

Update `docs/done-log.md` only for fully closed items.

Rules:

```txt
Do not duplicate large architecture text.
Do not mark 10K corpus Done unless generator/tests/gate/docs are all complete.
Do not mark CI gate Done unless scripts/workflows/tests/docs are complete.
Do not mark PerformanceEvent Done unless event contract, integration, tests and docs are complete.
If a gate starts report-only, document exact promotion criteria.
If a full 10K lane is optional/nightly only, document that clearly.
```

## Required output

Update audit report:

```md
## PHASE 6 — Documentation alignment

### Docs updated
### Backlog state changes
### Done-log changes
### Remaining documentation gaps
```

---

# PHASE 7 — Validation

Run targeted validation first.

Runtime/metrics:

```bash
npm test -- --grep runtime
npm test -- --grep metrics
npm test -- --grep performanceEvent
npm test -- --grep interactiveServingStats
npm test -- --grep scheduler
npm test -- --grep worker
```

Corpus/performance:

```bash
npm test -- --grep corpus
npm test -- --grep performance
npm run test:performance:gate
```

CI/release/docs:

```bash
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
npm run release:verify
```

General:

```bash
npm run build:test
npm test
```

If a command does not exist or grep is unsupported, document it and run closest available command.

If `release:verify` is too expensive or unavailable locally, document why and run its constituent scripts where possible.

If failures are caused by this wave, fix them before finishing.

If failures are pre-existing/unrelated, document evidence.

## Required output

Update audit report:

```md
## PHASE 7 — Validation

### Targeted validation
### Performance validation
### CI/release validation
### Full validation
### Failures investigated
### Final test state
```

---

# PHASE 8 — Final self-review

Before finishing, re-read:

```txt
changed source files
changed test files
changed scripts/workflows
docs/audits/wave-08-runtime-metrics-10k-ci-gates-report.md
docs/backlog.md
docs/performance-budget.md
docs/testing.md
docs/release.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/current-focus.md
```

Verify:

```txt
PerformanceEvent contract exists and is tested.
Existing interactive stats remain compatible.
Worker/scheduler/runtime stats are low-overhead and bounded.
No scheduling behavior changed unintentionally.
Synthetic corpus generator is deterministic.
10K mode is optional/nightly or otherwise safely gated.
Fast smoke mode exists for practical validation.
Performance artifacts are stable JSON.
Payload/performance gates do not require huge committed corpora.
release:verify remains usable.
Docs/backlog states are honest.
No orchestrator split/scaffold/fitness/legacy work was mixed in.
Tests and validation are documented.
```

If any gap is found, fix or document before final response.

---

# Closing criteria

## PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01 can be Done only if:

```txt
PerformanceEvent contract exists
event recorder/registry exists
existing stats are integrated or projected from events
worker/scheduler/runtime snapshots are covered or explicitly documented as pending
tests and docs are updated
validation is green or unrelated known failures are documented
```

Otherwise mark Partial.

## PB-PERF-P2-10K-SEMANTIC-CORPUS-01 can be Done only if:

```txt
deterministic corpus generator exists
smoke and 10K-capable modes exist
domains PowerScript/DataWindow/SQL/native/PFC-like are represented
tests prove determinism and basic generated workspace validity
docs and performance budget are updated
```

Otherwise mark Partial.

## PB-CI-P1-REGRESSION-GATE-10K-PAYLOAD-01 can be Done only if:

```txt
package scripts and/or workflows include appropriate lanes
payload/performance artifacts are generated
fast/release/nightly split is documented
report-only vs fail policy is explicit
release readiness contract is updated
docs and validation are updated
```

Otherwise mark Partial.

---

# Final response

Only after all phases are complete, respond in Spanish with:

```md
## Resumen final — Wave 08 Runtime Metrics and 10K Gates

### Documentos actualizados

### Código cambiado

### Tests añadidos/modificados

### Scripts/workflows actualizados

### PerformanceEvent contract

### Worker/scheduler/runtime metrics

### Synthetic 10K corpus

### Performance/payload artifacts

### CI/release gates

### Validación targeted ejecutada

### Validación completa ejecutada

### Estado de PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01

### Estado de PB-PERF-P2-10K-SEMANTIC-CORPUS-01

### Estado de PB-CI-P1-REGRESSION-GATE-10K-PAYLOAD-01

### Riesgos pendientes

### Siguiente ola recomendada
```

Do not provide partial summaries before the full wave is complete.
```
