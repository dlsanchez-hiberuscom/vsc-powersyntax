# Wave 08 — Runtime Metrics, 10K Corpus and CI Regression Gates

## PHASE 0 — Baseline and dependency verification

### Docs reviewed

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/instant-semantic-indexing-target.md`
- `docs/performance-budget.md`
- `docs/testing.md`
- `docs/release.md`
- `docs/troubleshooting.md`
- `docs/audits/wave-05-semantic-tokens-and-readonly-envelope-report.md`
- `docs/audits/wave-06-readonly-surfaces-object-explorer-sql-ai-ux-report.md`
- `docs/audits/wave-07-datawindow-submodel-and-status-ownership-report.md`

### Previous wave dependency status

- Wave 05 dejó `ApiReadOnlyProjectionEnvelope` y el baseline de contracts/read-only payloads.
- Wave 06 dejó surfaces read-only reales y receipts bounded para SQL/Object Explorer/AI bundle.
- Wave 07 dejó el boundary mínimo de DataWindow y `dataWindowBindingReceipt`, evitando abrir Wave 08 sobre una surface read-only todavía opaca.

### Current runtime metrics inventory

- Antes de Wave 08 existían `InteractiveServingStatsTracker`, `RuntimeJournal`, `TaskScheduler`, `LatencyGovernor`, `memoryBudgets`, `memoryPressurePolicy`, `WorkerPool` y `powerbuilder.showStats`, pero sin contrato homogéneo `PerformanceEvent`.
- El snapshot runtime no publicaba event loop, memory pressure, queue/busy/wait/run de workers ni wait/run por lane del scheduler.

### Current performance tests and gates

- Ya existían `test/server/performance/ci-budget-gate.perf.test.ts`, `knowledgeBase.perf.test.ts`, `large-workspace-incremental.perf.test.ts` y `session-stability-soak.perf.test.ts`.
- `tools/run-performance-budget-gate.mjs` ya generaba `artifacts/performance/performance-budget-gate.json` a partir de métricas `[perf-budget]`.

### Current corpus/generator inventory

- Había corpora reales/opcionales (`legacy-pbl-dump`, PFC, OrderEntry) y sintéticos parciales de KB/watcher, pero no un generador determinístico multi-modo reutilizable para 10k+ archivos.

### Current CI/release gate inventory

- `release:verify` ya agregaba `npm test`, `test:architecture:rapid`, `test:docs:drift`, `test:performance:gate`, empaquetado VSIX y smoke instalada.
- `.github/workflows/release-readiness.yml` sólo ejecutaba `release:verify`; no existía lane opcional/nightly 10k.

### Baseline validation

- `npm run build:test` -> passed.
- `npm run test:performance:gate` -> passed en baseline previo y se reutilizó como rail principal de Wave 08.
- `npm run test:architecture:rapid` -> baseline verde antes del nuevo corte.
- `npm test` seguía heredando ruido de smoke suite amplia fuera del slice Wave 08; no se usó como señal exclusiva del trabajo actual.

### Initial risks

- Añadir instrumentación pesada a hot paths de runtime/indexing.
- Convertir 10k en dependencia obligatoria de cada PR o de `release:verify`.
- Duplicar surfaces de stats en vez de enriquecer `showStats`.

## PHASE 1 — PerformanceEvent contract

### Implemented

- `src/server/runtime/performanceEvents.ts` define el contrato `PerformanceEvent`, lanes, outcomes y `RuntimeMetricsRegistry` bounded.
- `src/server/runtime/interactiveServingStats.ts` proyecta `PerformanceEvent` al snapshot legacy compatible y conserva el resumen histórico para consumers existentes.

### Validation

- `npm run build:test` -> passed.
- `npx vscode-test --label unit --grep "(performanceEvents|interactiveServingStats|interactiveServingPipeline)"` -> passed (baseline Phase 1).

## PHASE 2 — Worker, scheduler, event-loop and memory metrics

### Implemented

- `src/server/runtime/scheduler.ts` publica métricas bounded por lane: `enqueued`, `cancelled`, `avgWaitMs`, `avgRunMs`, `lastWaitMs`, `lastRunMs`.
- `src/server/indexer/workerPool.ts` publica `WorkerPoolStatsSnapshot` con queue depth, busy/idle, wait/run y errors/restarts.
- `src/server/runtime/eventLoopMonitor.ts` añade un monitor explícito `start/stop` con snapshot bounded de delay/utilization.
- `src/server/indexer/workspaceIndexer.ts` anexa `worker` y `latencyGovernor` al snapshot del indexer.
- `src/server/handlers/runtimeCommandHandlers.ts` y `src/server/server.ts` exponen en `showStats` `interactiveServing.performanceEvents`, `runtimeMetrics.eventLoop` y `runtimeMetrics.memoryPressure`.
- `src/server/handlers/runtimeCommandHandlers.ts` registra además `PerformanceEvent` bounded para `powerbuilder.objectExplorerProjection` y `powerbuilder.semanticWorkspaceManifest`, con `durationMs`, `payloadBytes` y `resultSize`, ampliando la cobertura más allá del pipeline interactivo inicial sin abrir una surface nueva.
- `src/server/runtime/performanceEvents.ts` publica ya percentiles `p50/p95/p99` y máximos sobre la ventana bounded de `durationMs`, `payloadBytes` y `resultSize`, de modo que `showStats` expone un resumen útil sin introducir series históricas pesadas.

### Validation

- `npm run build:test` -> passed.
- `npx vscode-test --label unit --grep "(schedulerMetrics|workerPool|eventLoopMonitor|runtimeCommandHandlers|interactiveServingStats|performanceEvents)"` -> 11 passing.

## PHASE 3 — Deterministic synthetic 10K corpus strategy

### Implemented

- `test/server/helpers/syntheticPowerBuilderCorpus.ts` materializa workspaces PowerBuilder determinísticos en modos `smoke`, `medium` y `10k`.
- El helper ya genera una mezcla bounded de `.sru`, `.srw`, `.srm`, `.srd`, `.sra`, `.srf` y `.srp`, y expone una mutación deterministic del corpus para simular edición while-indexing sin reconstruir todo el workspace.
- `tools/generate-synthetic-powerbuilder-corpus.mjs` reutiliza el helper compilado y permite generar corpus inspeccionables fuera de la suite de tests.

### Scope delivered

- El generador produce mezcla bounded de `.sru`, `.srw`, `.srm`, `.srd`, `.sra`, `.srf` y `.srp`, librerías `.pbl` por carpeta y topología `app.pbw`/`app.pbt` reproducible.
- El corte actual cubre la estrategia, la escalabilidad base y una mutación deterministic `while-indexing`; quedan dominios más ricos (native/external y consumers adicionales sobre el corpus mutado) como trabajo pendiente.

## PHASE 4 — Smoke lane and optional 10K lane

### Implemented

- `test/server/performance/synthetic-corpus-smoke.perf.test.ts` valida discovery + indexing bounded sobre un corpus sintético release-facing.
- `test/server/performance/synthetic-corpus-10k.perf.test.ts` valida el corpus 10k en lane opcional con budgets aplicables en `report-only` o `fail mode`.
- `tools/run-performance-budget-gate.mjs` ya incluye el smoke sintético en el gate rápido.
- `tools/run-performance-10k-gate.mjs` genera `artifacts/performance/performance-10k-gate.json` para el lane opcional.

### Validation

- `npm run test:performance:10k:smoke` -> passed.
- `npm run test:performance:gate` -> passed con métricas nuevas del smoke sintético.
- `npm run test:performance:10k:nightly` -> passed en `report-only`, con discovery 10k `1247.34ms` e indexing 10k `22185.54ms` dentro de budget actual.

## PHASE 5 — CI/release integration and artifacts

### Implemented

- `package.json` añade scripts de generación sintética y lanes `test:performance:10k:*`.
- `.github/workflows/release-readiness.yml` conserva `release:verify` para PR/push y añade un job `synthetic-10k` sólo para `schedule` o `workflow_dispatch` explícito.
- `release:verify` no se ensancha con 10k full; el smoke sintético entra por el gate rápido existente.

### Artifact contract

- `artifacts/performance/performance-budget-gate.json`
- `artifacts/performance/performance-10k-gate.json`

## Docs aligned

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/performance-budget.md`
- `docs/testing.md`
- `docs/release.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/instant-semantic-indexing-target.md`

## Validation

- `npm run build:test` -> passed.
- `npx vscode-test --label unit --grep "(schedulerMetrics|workerPool|eventLoopMonitor|runtimeCommandHandlers|interactiveServingStats|performanceEvents)"` -> 11 passing.
- `npm run build:test && npx mocha --ui tdd out/test/server/unit/performanceEvents.test.js out/test/server/unit/runtimeCommandHandlers.test.js` -> 6 passing.
- `npm run build:test && npx mocha --ui tdd out/test/server/unit/syntheticPowerBuilderCorpus.test.js` -> 1 passing.
- `npm run test:performance:10k:smoke` -> passed.
- `npm run test:performance:gate` -> passed.
- `npm run test:performance:10k:nightly` -> passed (`report-only`, budgets verdes en esta ejecución).
- `npm run generate:corpus:synthetic:smoke` -> passed.

## Closure status

- `PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01` -> `Partial`.
- `PB-PERF-P2-10K-SEMANTIC-CORPUS-01` -> `Partial`.
- `PB-CI-P1-REGRESSION-GATE-10K-PAYLOAD-01` -> `Partial`.

Wave 08 queda cerrado en este corte como infraestructura incremental válida: hay contrato homogéneo, snapshots runtime bounded, corpus sintético reproducible, smoke release-facing y lane 10k opcional con artefactos. No queda honesto marcarla `Done` hasta ampliar cobertura de providers/dominios y decidir la promoción del carril `10k` a `fail mode`.