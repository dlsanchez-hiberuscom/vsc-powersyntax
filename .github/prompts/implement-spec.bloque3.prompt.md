# Execute Wave 3 — Cache, Persistence, Scheduler and Discovery Runtime

Execute **Wave 3** completely, phase by phase, without stopping, without asking for confirmation, and without delivering partial summaries.

Wave 3 focuses on the runtime/indexing core required for instant semantic behavior:

```txt
1. PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01
2. PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01
3. PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01
4. PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01
```

This wave must preserve the project master goal:

> The plugin must discover and index very fast without blocking VS Code.

Do not introduce broad rewrites. Do not create semantic stores parallel to `KnowledgeBase.publishedState`. Do not introduce full workspace scans in hot paths. Do not weaken tests to make them pass.

---

# Mandatory execution rule

**DO NOT STOP, DO NOT ASK QUESTIONS, AND DO NOT DELIVER PARTIAL SUMMARIES: execute every phase in strict order, close each phase with evidence, code changes, documentation updates and tests, and do not finish until Wave 3, all affected documentation, backlog/current-focus/done-log updates, and the complete final validation are fully green.**

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

This execution covers only Wave 3:

```txt
PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01
PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01
PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01
PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01
```

Wave 3 assumes Wave 0, Wave 1 and Wave 2 are complete or stable enough to proceed.

If previous waves are not complete, do not silently continue. Document the blocking gap in the execution report, fix what is required to restore a green baseline, and continue only when the required baseline is green.

---

# Related findings

Wave 3 must address or advance these findings:

```txt
FINDING-002
FINDING-011
FINDING-012
FINDING-013
FINDING-014
FINDING-015
FINDING-016
FINDING-017
FINDING-018
FINDING-033
FINDING-035
FINDING-036
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
- Do not create a parallel semantic truth outside `KnowledgeBase.publishedState`.
- Do not treat caches as truth.
- Do not use `DocumentCache` LRU as the full persisted semantic corpus.
- Do not introduce global invalidation unless it is an explicit fallback with reason/metric.
- Do not release a background scheduler slot before cancelled work has safely stopped or is generation-guarded.
- Do not execute full semantic cascades synchronously in open/change hot paths.
- Do not convert discovery into unbounded concurrent filesystem traversal.
- Do not leave `npm test` red.
- Do not leave `npm run build:test` red.
- Do not leave architecture gates red.
- Do not leave docs drift red.
- Do not leave performance gate red.
- Do not mark anything `Done` without code, tests, validation and documentation.

---

# PHASE 0 — Preparation and baseline verification

## Goal

Understand current state and verify the repository is ready for Wave 3.

## Tasks

1. Read all source documents.
2. Inspect the current backlog status of:

```txt
PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01
PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01
PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01
PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01
```

3. Inspect related findings:

```txt
FINDING-002
FINDING-011
FINDING-012
FINDING-013
FINDING-014
FINDING-015
FINDING-016
FINDING-017
FINDING-018
FINDING-033
FINDING-035
FINDING-036
```

4. Inspect these files before editing:

```txt
src/server/serving/cacheKeyContract.ts
src/server/knowledge/HotContextCache.ts
src/server/knowledge/DocumentCache.ts
src/server/analysis/analysisCache.ts
src/server/cache/cacheStore.ts
src/server/cache/cacheCheckpoint.ts
src/server/cache/semanticCacheRuntimeController.ts
src/server/cache/servingCachePersistence.ts
src/server/workspace/workspaceState.ts
src/server/workspace/discovery.ts
src/server/workspace/watchedFileIntake.ts
src/server/system/fileWatcherDebouncer.ts
src/server/indexer/workspaceIndexer.ts
src/server/indexer/workerPool.ts
src/server/runtime/scheduler.ts
src/server/handlers/lifecycleHandlers.ts
src/server/handlers/documentHandlers.ts
src/server/server.ts
```

5. Inspect relevant tests:

```txt
test/server/unit/cacheKeyContract.test.ts
test/server/unit/hotContextCache.test.ts
test/server/unit/documentCache.test.ts
test/server/unit/analysisCache.test.ts
test/server/unit/cacheStore.test.ts
test/server/unit/cachePersistence.test.ts
test/server/unit/workspaceIndexer.test.ts
test/server/unit/watchedFileIntake.test.ts
test/server/unit/watcherPipeline.test.ts
test/server/unit/fileWatcherDebouncer.test.ts
test/server/unit/diagnosticScheduler.test.ts
test/server/performance/large-workspace-incremental.perf.test.ts
test/server/performance/discovery.perf.test.ts
test/server/performance/indexer.perf.test.ts
```

6. Run the baseline commands:

```bash
npm run build:test
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
npm test
```

7. If any command fails, fix the baseline first. Do not start Wave 3 implementation while the baseline is red.

## Required phase output

Create or update:

```txt
docs/audits/wave-3-cache-runtime-discovery-execution.md
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

# PHASE 1 — Cache registry and fingerprint/epoch contract tests

## Goal

Define and protect the cache/fingerprint/epoch/sourceOrigin contract before production changes.

## Target backlog item

```txt
PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01
```

## Required target behavior

Every cache must declare or be testable for:

```txt
owner
key fields
value type
documentVersion if applicable
documentFingerprint if applicable
semanticEpoch/kbVersion if applicable
sourceOrigin if applicable
locale if applicable
projection if applicable
ruleVersion if applicable
stale policy
invalidation policy
memory budget
eviction policy
persistence policy
```

## Tasks

1. Add or update tests for `cacheKeyContract`.
2. Ensure declared discriminators affect:
   - key construction;
   - stale matcher;
   - invalidation scope;
   - non-collision behavior.
3. Add tests specifically for:
   - `prefix` symmetry if still present;
   - `documentFingerprint` vs `semanticEpoch`;
   - `sourceOrigin`;
   - `locale`;
   - projection/context fields where applicable.
4. Add or update tests for `HotContextCache`:
   - unrelated URI changes should not invalidate active context when dependency evidence exists;
   - ancestor/dependency change should invalidate active inherited/member context;
   - fallback to global epoch must be explicit/conservative.
5. Do not implement a huge cache registry yet if tests can first lock the desired contract.

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
npm run test:unit -- --grep "cacheKey"
npm run test:unit -- --grep "HotContext"
npm run test:docs:drift
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-3-cache-runtime-discovery-execution.md
```

Add:

```md
## PHASE 1 — Tests de contrato cache/fingerprint/epoch

### Contrato definido

### Tests añadidos o actualizados

### Compatibilidad preservada

### Docs actualizadas

### Validación

### Riesgos restantes
```

---

# PHASE 2 — Implement cache registry/key symmetry and HotContext versioning slice

## Goal

Implement the smallest safe production slice for cache registry/key symmetry and active context versioning.

## Target backlog item

```txt
PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01
```

## Required implementation

Implement or introduce:

1. A lightweight `CacheRegistry` or equivalent metadata structure if feasible.
2. Symmetric key builder/stale matcher behavior for declared fields.
3. Fix `prefix` behavior:
   - either include `prefix` in built keys and stale matchers; or
   - remove/deprecate it from the descriptor until there is a real consumer.
4. Clarify `documentFingerprint` vs `semanticEpoch` in completion resolve and related context objects.
5. Introduce an `ActiveContextVersion` or equivalent for `HotContextCache`:
   - URI;
   - document fingerprint/version if available;
   - sourceOrigin if relevant;
   - dependency/ancestor version evidence if available;
   - conservative epoch fallback only when necessary.
6. Keep cache behavior backward-compatible where possible.
7. Add metrics or counters if existing stats already support them.

## Implementation rules

- Do not turn caches into truth.
- Do not add a large cache framework in one step.
- Do not break existing cache consumers.
- Do not hide stale risk by global invalidation unless explicitly documented.
- Prefer additive registry metadata first.

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
npm run test:unit -- --grep "cache"
npm run test:unit -- --grep "HotContext"
npm run test:architecture:rapid
npm run test:docs:drift
npm test
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-3-cache-runtime-discovery-execution.md
```

Add:

```md
## PHASE 2 — Cache registry/key symmetry y HotContext versioning

### Diseño implementado

### Cambios de código

### Cache registry o metadata añadida

### HotContext versioning

### Tests añadidos o actualizados

### Docs actualizadas

### Estado del backlog

### Validación

### Riesgos restantes
```

---

# PHASE 3 — Persistence and index state invariant tests

## Goal

Define executable invariants between workspace state, analysis cache, DocumentCache, KnowledgeBase and persistence.

## Target backlog item

```txt
PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01
```

## Required target behavior

The repository must prove these invariants:

1. An indexed file has a compatible semantic record or published snapshot.
2. Evicting from `DocumentCache` does not mean semantic truth is lost.
3. Persisted semantic corpus is not limited by `DocumentCache` LRU capacity.
4. Concurrent persistence journal writes do not lose mutations.
5. Warm restore can distinguish:
   - discovery/topology dirty;
   - project routing dirty;
   - semantic document dirty;
   - checkpoint validation state.
6. Restored snapshots preserve `documentFingerprint`, `sourceOrigin`, `semanticEpoch/kbVersion` and project routing evidence where applicable.
7. Watcher invalidation changes exact scopes when possible and global fallback only with reason.

## Tasks

1. Add or update tests for:
   - `DocumentCache` capacity vs persisted records;
   - cache checkpoint export/restore;
   - concurrent journal writes;
   - workspace state clean/dirty transitions;
   - analysis cache -> DocumentCache -> KnowledgeBase propagation;
   - watcher invalidation and sourceOrigin consistency.
2. Add invariant helper tests if useful.
3. Do not implement the full persistence redesign yet unless a small fix is required.

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
npm run test:unit -- --grep "DocumentCache"
npm run test:unit -- --grep "cacheStore"
npm run test:unit -- --grep "analysisCache"
npm run test:unit -- --grep "workspaceState"
npm run test:unit -- --grep "watch"
npm run test:docs:drift
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-3-cache-runtime-discovery-execution.md
```

Add:

```md
## PHASE 3 — Tests de invariantes persistence/index state

### Invariantes definidas

### Tests añadidos o actualizados

### Compatibilidad preservada

### Docs actualizadas

### Validación

### Riesgos restantes
```

---

# PHASE 4 — Implement persistence write queue and semantic corpus separation slice

## Goal

Implement the smallest safe production slice for persistence correctness.

## Target backlog item

```txt
PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01
```

## Required implementation

Implement or introduce:

1. A serialized write queue for cache/journal/checkpoint persistence.
2. Explicit `flush()` for checkpoint/maintenance/shutdown paths.
3. Protection against concurrent append last-write-wins loss.
4. A first separation between:
   - `DocumentCache` as memory LRU/hot cache;
   - persisted semantic corpus/checkpoint as semantic persistence source.
5. Tests proving checkpoint persistence can preserve more records than `DocumentCache.capacity`.
6. Maintenance/compaction must wait for pending writes or be generation-safe.
7. Restore must fail safe to full rebuild when evidence is incomplete.

## Implementation rules

- Do not implement a huge new persistence system unless necessary.
- Prefer minimal queue + invariant fixes first.
- Do not make hot paths wait synchronously on disk writes unless explicitly required.
- Do not silently drop persistence errors.
- Do not treat failed persistence as semantic truth loss; degrade and rebuild.

## Required docs

Update as needed:

```txt
docs/instant-semantic-indexing-target.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/troubleshooting.md
docs/backlog.md
```

If the backlog item is fully complete, move it to `docs/done-log.md`.  
If partial, keep it `Partial` and write exact pending work.

## Required validation

Run:

```bash
npm run build:test
npm run test:unit -- --grep "cache"
npm run test:unit -- --grep "persistence"
npm run test:unit -- --grep "DocumentCache"
npm run test:unit -- --grep "analysisCache"
npm run test:architecture:rapid
npm run test:docs:drift
npm test
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-3-cache-runtime-discovery-execution.md
```

Add:

```md
## PHASE 4 — Persistence write queue y semantic corpus separation

### Diseño implementado

### Cambios de código

### Write queue / flush

### Separación LRU vs corpus persistido

### Tests añadidos o actualizados

### Docs actualizadas

### Estado del backlog

### Validación

### Riesgos restantes
```

---

# PHASE 5 — Scheduler cancellation and open/change hot path tests

## Goal

Define and protect scheduler cancellation semantics and open/change hot path boundaries before broader runtime changes.

## Target backlog item

```txt
PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01
```

## Required target behavior

The runtime must prove:

1. Requesting background cancellation does not incorrectly free incompatible background ownership before stopped/joined or generation-guarded.
2. Cancelled background work cannot publish stale semantic state.
3. Watcher intake/indexer can observe cancellation or generation guards.
4. `onDidOpen` and `onDidChangeContent` do not run full semantic cascade synchronously beyond budget.
5. Tier 0/1 diagnostics can remain immediate, while Tier 2/3/4 work is scheduled.
6. Cache invalidation fanout is capped/deferred when needed.

## Tasks

1. Add tests for scheduler cancellation lifecycle:
   - active background -> cancellation requested -> still owned or generation-protected;
   - second incompatible background task does not corrupt state;
   - stale publish blocked.
2. Add tests for open/change hot path:
   - no full diagnostics/project semantic inline;
   - semantic invalidation fanout scheduled/deferred;
   - immediate local diagnostics remain available.
3. Add tests or assertions for watcher/indexer token/generation handling if feasible.
4. Do not broadly rewrite scheduler yet unless needed for testability.

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
npm run test:unit -- --grep "scheduler"
npm run test:unit -- --grep "diagnosticScheduler"
npm run test:unit -- --grep "document"
npm run test:unit -- --grep "watch"
npm run test:docs:drift
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-3-cache-runtime-discovery-execution.md
```

Add:

```md
## PHASE 5 — Tests scheduler cancellation y open/change hot path

### Contrato definido

### Tests añadidos o actualizados

### Compatibilidad preservada

### Docs actualizadas

### Validación

### Riesgos restantes
```

---

# PHASE 6 — Implement scheduler cancellation and open/change migration slice

## Goal

Implement the smallest safe production slice for cancellation correctness and open/change hot path protection.

## Target backlog item

```txt
PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01
```

## Required implementation

Implement or introduce:

1. Scheduler state that distinguishes:
   - active;
   - cancellation requested;
   - stopped/completed.
2. Do not clear active background ownership before the cancelled task is stopped or generation-guarded.
3. Generation/epoch guard before semantic commits from cancellable work.
4. Pass cancellation token or generation evidence to watcher/indexer paths where feasible.
5. Open/change path must avoid full project semantic work inline.
6. Semantic diagnostics/invalidation fanout must be scheduled/deferred when needed.
7. Immediate local/syntactic diagnostics remain available.
8. Metrics or runtime journal events for cancellation latency/fanout if existing infrastructure supports it.

## Implementation rules

- Do not starve background permanently.
- Do not block interactive requests waiting for slow cancellation unless unavoidable.
- Do not silently drop watcher events.
- Do not run Tier 3/4 diagnostics in open/change path.
- Do not create broad diagnostics refactor here; use existing Wave 2 tier contract if available.

## Required docs

Update as needed:

```txt
docs/instant-semantic-indexing-target.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/troubleshooting.md
docs/backlog.md
```

If the backlog item is fully complete, move it to `docs/done-log.md`.  
If partial, keep it `Partial` and write exact pending work.

## Required validation

Run:

```bash
npm run build:test
npm run test:unit -- --grep "scheduler"
npm run test:unit -- --grep "diagnosticScheduler"
npm run test:unit -- --grep "document"
npm run test:unit -- --grep "watch"
npm run test:architecture:rapid
npm run test:performance:gate
npm run test:docs:drift
npm test
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-3-cache-runtime-discovery-execution.md
```

Add:

```md
## PHASE 6 — Scheduler cancellation y open/change migration slice

### Diseño implementado

### Cambios de código

### Generation/cancellation guards

### Open/change hot path

### Tests añadidos o actualizados

### Docs actualizadas

### Estado del backlog

### Validación

### Riesgos restantes
```

---

# PHASE 7 — Discovery bounded async and warm start contract tests

## Goal

Define the target discovery and warm-start behavior with tests before broad implementation.

## Target backlog item

```txt
PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01
```

## Required target behavior

Discovery/warm start must prove:

1. Discovery traversal is bounded or can be configured with concurrency/caps.
2. Discovery respects ignored folders/configuration.
3. Discovery can produce progress/partial receipts.
4. Warm restore can skip full read/hash/index when checkpoint/manifest/fingerprints are compatible.
5. If evidence is incomplete, warm restore falls back safely to full index.
6. Workspace/project topology dirty is distinct from semantic document dirty.
7. Paths with spaces, PBW/PBT/PBPROJ/PBSLN/PBL folders and PBAutoBuild JSON remain supported.
8. Active/open document can become useful before full workspace discovery completes.

## Tasks

1. Add tests for bounded discovery plan/config.
2. Add tests for warm restore compatibility and full index skip.
3. Add tests for fallback when manifest/fingerprint evidence is incomplete.
4. Add tests for dirty-state separation.
5. Add tests for paths with spaces and project marker changes if feasible.
6. Do not rewrite discovery broadly in this phase unless small changes are needed to express contracts.

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
npm run test:unit -- --grep "discovery"
npm run test:unit -- --grep "workspaceIndexer"
npm run test:unit -- --grep "workspaceState"
npm run test:unit -- --grep "warm"
npm run test:docs:drift
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-3-cache-runtime-discovery-execution.md
```

Add:

```md
## PHASE 7 — Tests discovery bounded async y warm start

### Contrato definido

### Tests añadidos o actualizados

### Compatibilidad preservada

### Docs actualizadas

### Validación

### Riesgos restantes
```

---

# PHASE 8 — Implement bounded discovery and warm start slice

## Goal

Implement the smallest safe production slice for bounded discovery and warm start.

## Target backlog item

```txt
PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01
```

## Required implementation

Implement or introduce:

1. `DiscoveryPlan` or equivalent configuration:
   - concurrency limit;
   - ignored folders;
   - max nodes/files budget if feasible;
   - progress/partial receipt metadata.
2. Async bounded traversal where safe.
3. Separation between:
   - discovery/topology dirty;
   - project routing dirty;
   - semantic document dirty;
   - checkpoint validation state.
4. Warm restore compatibility validation.
5. Skip full index/read/hash when checkpoint/manifest/fingerprints are compatible.
6. Safe fallback to full index when evidence is incomplete.
7. Metrics:
   - files discovered;
   - directories scanned;
   - discovery duration;
   - cancellation latency;
   - warm restore skipped files;
   - full index fallback reason.
8. Preserve PBW/PBT/PBPROJ/PBSLN/PBL and PBAutoBuild behavior.

## Implementation rules

- Do not use unbounded `Promise.all` over filesystem trees.
- Do not skip full index without strong evidence.
- Do not break sourceOrigin routing.
- Do not block active document usefulness on full discovery completion.
- Prefer incremental/compatible changes over replacing all discovery code at once.

## Required docs

Update as needed:

```txt
docs/instant-semantic-indexing-target.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/performance-budget.md
docs/troubleshooting.md
docs/backlog.md
```

If the backlog item is fully complete, move it to `docs/done-log.md`.  
If partial, keep it `Partial` and write exact pending work.

## Required validation

Run:

```bash
npm run build:test
npm run test:unit -- --grep "discovery"
npm run test:unit -- --grep "workspaceIndexer"
npm run test:unit -- --grep "workspaceState"
npm run test:architecture:rapid
npm run test:performance:gate
npm run test:docs:drift
npm test
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-3-cache-runtime-discovery-execution.md
```

Add:

```md
## PHASE 8 — Discovery bounded async y warm start slice

### Diseño implementado

### Cambios de código

### DiscoveryPlan / bounded traversal

### Warm start / skip full index

### Dirty-state separation

### Tests añadidos o actualizados

### Docs actualizadas

### Estado del backlog

### Validación

### Riesgos restantes
```

---

# PHASE 9 — Performance and hot path validation

## Goal

Prove Wave 3 improves or preserves runtime performance and does not introduce hot path regressions.

## Tasks

1. Inspect whether Wave 3 changes affect:
   - activation/startup;
   - discovery throughput;
   - warm restore latency;
   - open/change latency;
   - scheduler cancellation latency;
   - cache hit/miss;
   - persistence write queue latency;
   - indexing throughput;
   - memory pressure;
   - event-loop blocking risk.
2. Add or update performance tests if existing harnesses are suitable.
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
docs/audits/wave-3-cache-runtime-discovery-execution.md
```

Add:

```md
## PHASE 9 — Validación performance/hot path

### Riesgos de performance revisados

### Tests o gates ejecutados

### Métricas observadas

### Cambios adicionales si aplica

### Resultado

### Riesgos restantes
```

---

# PHASE 10 — Backlog, docs and done-log alignment

## Goal

Ensure documentation and backlog are fully aligned after Wave 3.

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
9. Update `docs/troubleshooting.md` if new runtime/cache/discovery failure modes were documented.
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
docs/audits/wave-3-cache-runtime-discovery-execution.md
```

Add:

```md
## PHASE 10 — Alineación backlog/docs/done-log

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

# PHASE 11 — Final full validation

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

Also run all focused tests added or touched during Wave 3.

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
docs/audits/wave-3-cache-runtime-discovery-execution.md
```

Add:

```md
## PHASE 11 — Validación final completa

### Comandos ejecutados

### Resultado por comando

### Tests focales adicionales

### Estado final de backlog

### Estado final de docs

### Riesgos restantes
```

---

# PHASE 12 — Final self-review and closure

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
docs/audits/wave-3-cache-runtime-discovery-execution.md
```

Verify:

1. Wave 3 scope was not exceeded.
2. Cache registry/fingerprint/epoch work is Done or Partial with exact pending work.
3. Persistence/index-state invariant work is Done or Partial with exact pending work.
4. Scheduler/open-change migration work is Done or Partial with exact pending work.
5. Discovery/warm-start work is Done or Partial with exact pending work.
6. No cache is treated as semantic truth.
7. No `DocumentCache` LRU is used as the full persisted semantic corpus.
8. No unbounded filesystem traversal was introduced.
9. No open/change hot path runs full semantic cascades inline.
10. No cancelled background work can publish stale semantic state without generation guard.
11. No full workspace scan was introduced in hot paths.
12. No new semantic store parallel to `KnowledgeBase.publishedState` was introduced.
13. Docs/backlog/current-focus/done-log are aligned.
14. `npm test` is green.
15. All mandatory validation commands are green.

## Final output

Only after every item above is true, output a final Spanish summary:

```md
## Resumen final — Oleada 3

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

Wave 3 must not attempt to solve Object Explorer, DataWindow modularization, AI bundles, or 10,000+ CI gates directly. Those belong to later waves.

Wave 3 must leave the runtime core safer and faster:

```txt
cache contracts clearer
persistence safer
index state more verifiable
scheduler cancellation safer
open/change less blocking
discovery more bounded
warm start more useful
```
