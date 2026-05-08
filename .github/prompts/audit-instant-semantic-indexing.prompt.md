# Macro Audit — Instant Semantic Runtime, Indexing, Refactoring and Architecture Target

Execute a complete, phase-by-phase macro audit of the entire semantic, indexing, runtime, cache, UI, test, documentation and architecture structure.

The mission is to generate:

1. a complete findings register;
2. a clean target architecture document;
3. the full backlog required to reach the best possible final architecture;
4. every required refactoring spec;
5. every required architecture/performance/test gate;
6. safe local fixes only when low-risk and properly validated.

The final target is:

> The plugin must discover, index, analyze and serve every interactive feature as instantly as possible, without blocking VS Code, even on PowerBuilder workspaces with 10,000+ files and very large object manifests.

The audit must optimize for the best long-term architecture, not only the smallest patch.

Major architectural refactoring is allowed as backlog/spec output when evidence shows it is required:

- folder/module reorganization;
- smaller classes;
- smaller functions;
- duplicate code removal;
- legacy runtime removal;
- source-of-truth alignment;
- cache/invalidation redesign;
- worker-pool/scheduler introduction;
- Object Explorer pagination/lazy loading;
- thin provider migration;
- DataWindow/SQL/native submodel separation;
- architecture conformance gates.

Do not perform broad rewrites during the audit. Apply only safe local fixes. Every broad refactor must become a detailed backlog/spec item with migration plan, parity tests, rollback strategy, documentation updates and validation.

---

# Output language policy

All generated project-facing audit outputs must be written in **Spanish**.

This applies at minimum to:

```txt
docs/audits/macro-instant-semantic-indexing-findings.md
docs/audits/macro-instant-semantic-indexing-audit.md
docs/architecture/instant-semantic-indexing-target.md
docs/instant-semantic-indexing-target.md
docs/backlog.md
```

Rules:

- Write findings, recommendations, risks, evidence summaries, refactorization descriptions, target architecture prose, backlog descriptions, acceptance criteria, validation notes and final summaries in Spanish.
- Keep code identifiers, file paths, class names, function names, method names, commands, package names, LSP methods, VS Code API names, PowerBuilder APIs, PowerBuilder keywords, SQL syntax, DataWindow syntax, spec IDs and backlog IDs unchanged.
- Do not translate real PowerBuilder symbols or official API names.
- If an external source is in English, summarize the finding in Spanish and keep the source/reference name unchanged when needed.
- If an existing repository document is intentionally English because it is AI/agent-facing, do not rewrite the whole file unnecessarily; however, the audit-generated files listed above must be Spanish.

---

# Mandatory project context

Before auditing, read and understand at least:

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `docs/architecture.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/performance-budget.md`
- `docs/testing.md`
- `docs/troubleshooting.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/semantic-design-target.md` if it exists
- `docs/semantic-design-assumptions.md` if it exists
- any existing semantic design docs, cache docs, runtime docs, AI/orchestration docs and specs.

Also inspect source code under:

- `src/server/**`
- `src/client/**`
- `src/shared/**`
- `test/**`
- `scripts/**`
- `.github/**`
- package/config files relevant to VS Code, LSP, tests, build, runtime and CI.

---

# Mandatory audit artifacts

The audit must create and continuously maintain these Markdown files.

## 1. Findings register

Create and update after every phase:

```txt
docs/audits/macro-instant-semantic-indexing-findings.md
```

This file is the single live register for all findings.

Every finding discovered in any phase must be added immediately using this Spanish structure:

```md
## FINDING-[sequential-number] — Short title

- **Fase:** PHASE X — nombre de fase.
- **Severidad:** Critical | High | Medium | Low.
- **Tipo:** Bug | Performance bottleneck | Architecture drift | Contract violation | Duplicate code | Legacy code | Refactor need | Missing test | Documentation drift | UX issue | PowerBuilder semantic gap.
- **Área:** Semantics | Indexing | Cache | LSP Provider | Diagnostics | Semantic Tokens | Object Explorer | DataWindow | SQL | Native | Runtime | Tests | Docs | CI | Architecture.
- **Evidencia:** archivos, clases, funciones, docs, métricas, logs, tests o síntomas runtime exactos.
- **Comportamiento observado:** qué ocurre actualmente.
- **Comportamiento esperado:** qué debería ocurrir.
- **Riesgo:** por qué importa.
- **Impacto hot path:** sí/no y explicación.
- **Impacto 10,000+ archivos:** impacto específico en escala.
- **Impacto PowerBuilder:** constructs o patrones afectados.
- **Recomendación:** acción precisa.
- **Requiere refactor:** sí/no.
- **Resumen del refactor:** resumen corto si aplica.
- **Backlog relacionado:** ID existente o propuesto.
- **Validación requerida:** tests, métricas, comandos o corpus.
- **Estado:** Open | Fixed during audit | Backlogged | Superseded | Needs evidence | Needs official confirmation.
```

Rules:

- Do not leave findings only inside phase prose.
- Every real issue must have a `FINDING-*` entry.
- If a finding is fixed during the audit, keep the finding and mark it `Fixed during audit`.
- If multiple phases rediscover the same issue, update the existing finding instead of duplicating it.
- If a finding becomes a backlog item, link both directions:
  - finding -> backlog item;
  - backlog item -> finding.

## 2. Target architecture document

Create and update when the future architecture is clarified.

Preferred path:

```txt
docs/architecture/instant-semantic-indexing-target.md
```

Fallback path if the repository does not use `docs/architecture/`:

```txt
docs/instant-semantic-indexing-target.md
```

This file is the target architecture document for the future instant semantic/indexing runtime.

It must be written in Spanish and must not be a findings log.

It must contain the clean future architecture:

```md
# Arquitectura objetivo — Instant Semantic and Indexing Runtime

## 1. Resumen ejecutivo

## 2. Objetivos de diseño

## 3. No objetivos

## 4. Restricciones específicas de PowerBuilder

## 5. Vista general de arquitectura objetivo

## 6. Inputs versionados

## 7. Pipeline incremental de facts

## 8. Semantic hot indexes

## 9. PublishedSemanticSnapshot y fuente de verdad

## 10. SemanticQueryFacade y SemanticQueryResult

## 11. Modelo de caché

## 12. Modelo de invalidación y epoch

## 13. Scheduler lanes y worker pool

## 14. Diseño hot path de providers

## 15. Diagnostics por tiers

## 16. Estrategia de semantic tokens

## 17. Submodelo DataWindow

## 18. Submodelo SQL/Transaction

## 19. Submodelo external/native

## 20. Object Explorer y read-only projections

## 21. Warm start y persistencia

## 22. Estructura objetivo de módulos

## 23. Simplificación estructural y organización modular

## 24. Retirada de legacy y plan de retirement

## 25. Estrategia de eliminación de código duplicado

## 26. Estrategia de alineación a source-of-truth

## 27. Roadmap de refactor mayor

## 28. Métricas y performance gates

## 29. Architecture fitness functions

## 30. Simplification and maintainability fitness functions

## 31. Decisiones abiertas
```

Rules:

- Keep this document as target design only.
- Do not store temporary findings here.
- Every architectural decision must link to findings, code evidence, docs evidence or external research.
- If this document changes ownership of any topic, update cross-links and ownership notes in existing docs.

## 3. Phase audit report

Create and update:

```txt
docs/audits/macro-instant-semantic-indexing-audit.md
```

This file contains phase-by-phase summaries, not every raw finding.

Each phase must append a Spanish section:

```md
## PHASE X — Nombre de fase

### Alcance ejecutado

### Resumen de evidencias

### Hallazgos registrados

### Recomendaciones

### Refactorizaciones identificadas

### Candidatos de backlog

### Documentación actualizada

### Tests o validación

### Preguntas abiertas
```

---

# Mandatory phase closure contract

At the end of every phase, before starting the next phase, update the required Markdown files.

Every phase must close with the following Spanish sections in the phase report and/or findings register.

## 1. Evidence

Add all evidence collected during the phase.

Evidence must include, where applicable:

```md
### Evidencias

- **Referencias de código:** archivos, clases, funciones, métodos y rango/línea si está disponible.
- **Referencias documentales:** secciones de docs/specs/backlog/current-focus/roadmap/done-log.
- **Referencias runtime:** logs, métricas, runtime stats, self-test, evidencia aportada por usuario.
- **Referencias de test:** tests inspeccionados, tests ausentes, tests fallidos, tests añadidos.
- **Referencias externas:** documentación oficial, LSP/VS Code/Node/arquitectura/refactoring.
- **Referencias PowerBuilder:** constructs afectados, formatos de source, casos DataWindow/SQL/native.
```

## 2. Recommendations

Add concrete recommendations.

Each recommendation must include:

```md
### Recomendaciones

- **Recommendation ID:** REC-[phase]-[number].
- **Resumen:** acción concisa.
- **Motivo:** por qué importa.
- **Área objetivo:** code/docs/tests/backlog/architecture.
- **Beneficio esperado:** speed/reactivity/correctness/simplification/maintainability.
- **Riesgo:** qué puede salir mal.
- **Prioridad:** P0/P1/P2/P3.
- **Candidato backlog:** sí/no e ID propuesto.
```

## 3. Refactorizations

If the phase detects any required refactor, define it in detail.

Each refactorization must use this Spanish template:

```md
### Refactorización — REF-[phase]-[number] — Short title

- **Ubicación actual:** archivos/clases/funciones/módulos.
- **Problema actual:** duplicidad, clase grande, boundary incorrecto, legacy path, source-of-truth drift, hot path violation, etc.
- **Ubicación objetivo:** módulo/carpeta/clase/función propuesta.
- **Diseño objetivo:** descripción detallada de la estructura final deseada.
- **Tipo de refactor:** Extract | Move | Split | Merge | Delete | Facade | Adapter | Contract centralization | Legacy retirement | Cache centralization | DTO/projection centralization | Scheduler migration.
- **Dependencias actuales:** qué depende del código actual.
- **Dependencias objetivo:** qué debería depender del nuevo código.
- **Pasos de migración:** pasos ordenados, pequeños y seguros.
- **Tests de paridad requeridos:** tests necesarios antes de mover/eliminar.
- **Tests de conformidad requeridos:** gates de arquitectura para evitar regresión.
- **Estrategia de rollback:** cómo revertir si aparece riesgo.
- **Capa temporal de compatibilidad:** sí/no.
- **Criterios de retirada:** cuándo puede borrarse el path temporal/legacy.
- **Docs afectadas:** documentación a actualizar.
- **Métricas afectadas:** métricas a observar.
- **Riesgos:** implementación, comportamiento, performance, memoria, API pública.
- **Specs de backlog requeridas:** IDs propuestos.
```

Rules:

- Refactorizations must be detailed enough to generate backlog specs later.
- Do not write “refactor this module” without a migration plan.
- Do not delete legacy paths without parity tests and retirement criteria.
- If the best architecture requires major refactoring, describe it fully even if it is large.
- Do not perform broad refactors during the audit unless explicitly safe and covered by tests.

## 4. Phase references

Every phase must add a reference ledger:

```md
### Referencias de fase

- **Referencias de código:** ...
- **Referencias documentales:** ...
- **Referencias runtime:** ...
- **Referencias de investigación externa:** ...
- **Referencias de candidatos backlog:** ...
```

Rules:

- Every generated backlog item must link to one or more findings and one or more phase references.
- Every architecture decision must link to evidence.
- If evidence is weak, mark it `Needs evidence`.
- If a conclusion depends on 10,000+ file behavior and no corpus exists, create a backlog item for synthetic 10,000+ corpus/performance gates.

---

# Non-negotiable rules

- Do not create a parallel semantic truth outside `KnowledgeBase.publishedState` or the current official source-of-truth architecture.
- Do not introduce full workspace scans in hot paths.
- Do not let hover, completion, signature help, definition, references, diagnostics, semantic tokens, Object Explorer, Current Object Context or Diagnostics Explainability compute deep semantics independently.
- Do not treat `.srd`, DataWindow expressions, SQL strings, dynamic SQL, JSON, JavaScript, ORCA/OrcaScript, PBAutoBuild JSON, PBX/PBNI or external DLLs as normal PowerScript.
- Do not treat caches as truth.
- Every cache must have explicit key/fingerprint/epoch/sourceOrigin/projection/locale/ruleVersion when relevant.
- Do not hide objects behind a global truncation such as “manifest truncated to 1000”; use pagination/lazy loading/caps with all objects accessible.
- Do not mark work as Done without code, tests, validation and documentation alignment.
- If anything is fixed, update all affected documentation.
- If a real issue cannot be safely fixed in this audit, create a precise backlog item.
- If an item is already covered by an existing spec, update/merge/extend the existing item instead of creating duplicates.
- Keep the backlog single-source-of-truth.
- Prefer the best long-term architecture over minimal local patches when the current structure prevents instant semantics/indexing.
- The final backlog must include every required spec to reach the target architecture, including structural refactors and legacy retirement.
- The final design must optimize for 10,000+ PowerBuilder files.
- Simplification is a goal: smaller classes, smaller modules, single-purpose components, clearer ownership and no duplicated contracts.

---

# Phase execution order

Execute phases in this exact order.

Do not generate the final backlog before PHASE 24 is complete.

```txt
PHASE 0  — Audit preparation and evidence map
PHASE 1  — Research modern patterns
PHASE 2  — PowerBuilder semantic complexity audit
PHASE 3  — Semantic architecture audit
PHASE 4  — Indexing and discovery audit
PHASE 5  — Cache, fingerprint, epoch, and invalidation audit
PHASE 6  — Provider hot path audit
PHASE 7  — Diagnostics and semantic tokens audit
PHASE 8  — Read-only surfaces and UI reactivity audit
PHASE 9  — Duplicate code, contract drift, and dead architecture audit
PHASE 9B — Structural simplification, duplicate elimination, source-of-truth alignment, and legacy removal
PHASE 10 — Performance instrumentation and benchmark audit
PHASE 11 — Test architecture audit
PHASE 12 — Target architecture document
PHASE 17 — Architecture fitness functions and conformance gates
PHASE 18 — CPU, memory, event loop and worker profiling audit
PHASE 19 — Synthetic 10,000+ workspace and corpus scalability audit
PHASE 20 — CI and release performance regression gates
PHASE 21 — Perceived instantaneity and UX state audit
PHASE 22 — Target module structure and package organization
PHASE 23 — Major refactor planning and migration roadmap
PHASE 24 — Simplification and maintainability fitness functions
PHASE 13 — Complete backlog generation for final architecture
PHASE 14 — Apply safe fixes detected during audit
PHASE 15 — Validation
PHASE 16 — Final self-review
```

---

# PHASE 0 — Audit preparation and evidence map

## Goal

Build a complete map of the current architecture, files, modules, docs, tests, known runtime symptoms and active backlog before making judgments.

## Tasks

1. Read all required docs.
2. Inventory semantic, indexing, cache, scheduler, diagnostics, LSP provider, DataWindow, SQL, native/external, read-only surface, runtime health and Object Explorer modules.
3. Identify existing contracts:
   - source of truth;
   - semantic snapshot;
   - query facade;
   - document cache;
   - serving cache;
   - hot context cache;
   - readiness;
   - scheduler;
   - public API;
   - view providers;
   - diagnostics tiers;
   - DataWindow/SQL/native submodels.
4. Identify existing specs and backlog items covering performance, semantics, indexing, discovery, caches, Object Explorer and runtime.
5. Create the first version of:
   - findings register;
   - audit report;
   - target architecture document skeleton.

## Mandatory phase closure

Update all mandatory MDs with:

- evidencias;
- recomendaciones;
- referencias de fase;
- candidatos iniciales de backlog;
- refactorizaciones si ya son visibles.

---

# PHASE 1 — Research modern patterns

## Goal

Research best practices for ultra-fast language servers, incremental semantics, indexing, reactivity, cancellation, caches, worker pools, semantic tokens, Object Explorer large trees, refactoring and architecture conformance.

## Mandatory research topics

Research and summarize:

1. Salsa/rust-analyzer incremental computation.
2. TypeScript incremental project graph.
3. LSP cancellation, workDoneProgress and partial results.
4. VS Code semantic tokens full/range/delta.
5. Node.js worker_threads vs async I/O.
6. VS Code TreeDataProvider lazy loading.
7. Refactoring large codebases.
8. Duplicate code elimination.
9. Strangler-style incremental modernization.
10. Architecture fitness functions/conformance tests.

## Mandatory phase closure

Update findings MD and target architecture MD.

Every researched pattern must include:

- applicability to this plugin;
- risks;
- recommended adoption;
- anti-patterns to avoid;
- backlog candidate if adoption requires work.

---

# PHASE 2 — PowerBuilder semantic complexity audit

## Goal

Validate the current semantic design against real PowerBuilder complexity.

## Mandatory domains

Audit:

- lexical basics;
- object model;
- OOP semantics;
- symbol/scoping;
- DataWindow;
- SQL;
- native/external;
- build/source;
- PFC/STD-like framework patterns;
- 10,000+ file workspace implications.

## Mandatory phase closure

For every PowerBuilder domain, record:

- current support;
- missing support;
- false certainty risks;
- hot path risks;
- target behavior;
- recommendations;
- detailed refactorizations if needed;
- backlog candidates.

---

# PHASE 3 — Semantic architecture audit

## Goal

Audit whether the semantic architecture is layered, modular, reactive, incremental and free from duplicated truth.

## Mandatory checks

Inspect:

- `KnowledgeBase`;
- published state;
- semantic snapshots;
- query facade;
- symbol identity;
- project/workspace model;
- source origin;
- DataWindow model;
- SQL model;
- native/external model;
- read-only surfaces;
- tests;
- docs.

## Mandatory questions

Answer:

- Is there exactly one semantic source of truth?
- Are providers thin adapters?
- Are there stores parallel to `KnowledgeBase.publishedState`?
- Are semantic identities stable?
- Are DataWindow/SQL/native advisory submodels?
- Is confidence/evidence propagated consistently?
- Are reason codes explicit?
- Does any consumer reconstruct semantics independently?
- Are docs/contracts duplicated or contradictory?

## Mandatory phase closure

Record:

- findings;
- recommendations;
- target architecture updates;
- detailed refactorizations;
- source-of-truth alignment needs;
- backlog candidates.

---

# PHASE 4 — Indexing and discovery audit

## Goal

Audit workspace discovery, project routing, file classification, indexing, workers, readiness and scalability for 10,000+ files.

## Mandatory checks

Inspect:

- workspace/Solution/PBPROJ/PBT/PBW discovery;
- PBL folder vs PBL binary classification;
- PBD/source-origin handling;
- library search path;
- file watching;
- indexer queues;
- readiness transitions;
- scheduler states;
- progress metrics;
- persistence/checkpoints;
- full workspace reindex triggers;
- missing ORCA/PBAutoBuild behavior;
- interaction with hover/completion while indexing.

## Mandatory decisions

Decide whether target architecture needs:

- async I/O with bounded concurrency;
- worker pool for CPU-bound parsing/facts;
- batch publishing;
- staged indexing;
- warm start from persisted manifest;
- separate readiness states.

## Mandatory phase closure

Record all bottlenecks and recommendations.

If Object Explorer is truncated globally, create a finding and a backlog candidate for a complete server manifest + paginated/lazy client projection.

---

# PHASE 5 — Cache, fingerprint, epoch, and invalidation audit

## Goal

Audit all caches and invalidation paths.

## Mandatory cache inventory

For each cache, document:

- owner;
- key;
- value;
- invalidation triggers;
- memory budget;
- eviction policy;
- stale policy;
- truth vs projection;
- discriminators:
  - documentVersion;
  - documentFingerprint;
  - semanticEpoch;
  - kbVersion;
  - sourceOrigin;
  - locale;
  - projection;
  - ruleVersion.

## Mandatory phase closure

Record:

- missing discriminators;
- over-invalidation;
- under-invalidation;
- stale risks;
- memory risks;
- hit ratio blockers;
- detailed refactorizations for cache centralization;
- backlog candidates.

---

# PHASE 6 — Provider hot path audit

## Goal

Audit all LSP providers and interactive features for hot path violations.

## Providers/features

Audit:

- hover;
- completion;
- completion resolve;
- signature help;
- definition;
- references;
- rename;
- document symbols;
- workspace symbols;
- diagnostics;
- semantic tokens;
- code actions;
- current object context;
- diagnostics explainability;
- object explorer;
- health dashboard.

## Mandatory checks

For each provider:

- entrypoint;
- data sources;
- facade usage;
- workspace scans;
- reparsing;
- array `.find` in hot path;
- cache usage;
- dedupe;
- cancellation;
- stale/degraded response;
- latency budget;
- metrics;
- tests.

## Mandatory phase closure

Produce a provider matrix in the audit report.

Record every hot path violation as a finding.

Define refactorizations in detail when a provider must be migrated to a thin adapter.

---

# PHASE 7 — Diagnostics and semantic tokens audit

## Goal

Ensure diagnostics and semantic tokens are fast, low-noise, tiered and honest.

## Mandatory checks

Diagnostics:

- Tier 0 safety/suppression.
- Tier 1 local syntax.
- Tier 2 document semantic.
- Tier 3 project semantic.
- Tier 4 advisory/report-only.

Semantic tokens:

- full document vs range;
- delta;
- resultId/previousResultId;
- structural vs resolved tokens;
- confidence hardcoding;
- global resolution per token;
- cache/fingerprint handling.

## Mandatory phase closure

Record:

- tiering gaps;
- noise sources;
- token performance risks;
- confidence issues;
- refactorizations needed;
- backlog candidates.

---

# PHASE 8 — Read-only surfaces and UI reactivity audit

## Goal

Make all read-only surfaces reactive, lazy, paginated, cached and truthful.

## Surfaces

Audit:

- Object Explorer;
- Current Object Context;
- Diagnostics Explainability;
- Health Dashboard;
- Workspace check;
- Object check;
- Technical debt report;
- Migration assistant;
- Support bundle;
- AI/context bundle.

## Mandatory checks

For each surface:

- provider registration;
- readiness dependency;
- loading/empty/degraded/ready/stale states;
- projection source;
- payload caps;
- pagination;
- truncation reason;
- generatedFromCache;
- semanticEpoch;
- documentFingerprint;
- sourceOrigin;
- redaction receipts;
- refresh trigger;
- client heuristic refresh vs server projection events.

## Mandatory phase closure

Record:

- missing providers;
- stale UI risks;
- projection duplication;
- truncation bugs;
- required refactorizations;
- backlog candidates.

---

# PHASE 9 — Duplicate code, contract drift, and dead architecture audit

## Goal

Find duplicate code, duplicated contracts, outdated legacy paths, incorrect abstractions and documentation drift.

## Mandatory checks

Search for:

- duplicate resolver logic;
- duplicate symbol lookup;
- duplicate DataWindow parsing;
- duplicate SQL detection;
- duplicate diagnostics rules;
- duplicate cache key builders;
- duplicate DTO builders;
- provider-specific semantic logic;
- stale legacy paths;
- contradictory docs/backlog/current-focus/done-log.

## Mandatory phase closure

Record:

- duplicate areas;
- risk;
- proposed owner;
- delete/fuse plan;
- refactorizations;
- backlog candidates.

---

# PHASE 9B — Structural simplification, duplicate elimination, source-of-truth alignment, and legacy removal

## Goal

Perform a deep structural audit to simplify the codebase and prepare the best possible architecture.

## Mandatory checks

Inspect all semantic/indexing/runtime modules for:

- duplicate semantic resolution logic;
- duplicate symbol lookup logic;
- duplicate DataWindow parsing/property-path logic;
- duplicate SQL detection/anchor logic;
- duplicate diagnostics rules;
- duplicate cache key builders;
- duplicate DTO/projection builders;
- provider-specific semantic logic;
- legacy runtime paths still active;
- dead code;
- large classes;
- long functions;
- cyclic dependencies;
- wrong module boundaries;
- mixed concerns;
- parallel state or stores;
- docs reinforcing old architecture.

## Refactor target principles

The final architecture should prefer:

- small classes;
- single responsibility modules;
- explicit ownership;
- stable contracts;
- thin LSP providers;
- source-of-truth centralization;
- reusable projection builders;
- reusable cache key builders;
- shared reason/confidence model;
- shared scheduler/cancellation model;
- shared metrics instrumentation;
- DataWindow/SQL/native as submodels;
- no legacy path without retirement plan.

## Mandatory classification

For every structural issue, classify:

```txt
A. Safe local cleanup now
B. Needs parity tests first
C. Needs architecture contract first
D. Needs migration/spec
E. Legacy path to retire
F. Duplicate to merge
G. Module to split
H. Module to move
I. Contract to centralize
J. Dead code candidate
```

## Mandatory phase closure

Update findings and target architecture with:

- structural findings;
- detailed refactorizations;
- target module boundaries;
- legacy retirement plan;
- duplicate elimination strategy;
- source-of-truth alignment strategy;
- backlog candidates.

---

# PHASE 10 — Performance instrumentation and benchmark audit

## Goal

Ensure the plugin can prove that it is getting faster.

## Mandatory metrics

Audit or propose metrics for:

- interactive latency;
- cache hit ratios;
- semanticEpoch/no-op publish;
- indexing throughput;
- worker busy/idle;
- event loop blocking;
- diagnostics tiers;
- semantic tokens;
- Object Explorer pagination;
- LSP payload size;
- memory and GC pressure.

## Mandatory phase closure

Record:

- metrics present;
- metrics missing;
- unreliable metrics;
- proposed budgets;
- refactorizations needed for instrumentation;
- backlog candidates.

---

# PHASE 11 — Test architecture audit

## Goal

Ensure every architectural claim has tests.

## Mandatory checks

Audit tests for:

- lexer strings/mixed quotes;
- DataWindow string boundaries;
- inline after semicolon;
- workspace discovery;
- paths with spaces;
- ancestor resolution;
- built-in hover fast path;
- serving cache;
- invalidation;
- readiness;
- view provider registration;
- Object Explorer pagination;
- SemanticQueryFacade cross-surface consistency;
- diagnostics tiering;
- semantic tokens delta/range;
- worker pool/indexing;
- warm start;
- no full scans in hot paths.

## Mandatory phase closure

Record:

- missing tests;
- flaky tests;
- tests reinforcing old architecture;
- needed performance gates;
- 10,000+ synthetic corpus strategy;
- refactorizations blocked by missing tests;
- backlog candidates.

---

# PHASE 12 — Target architecture document

## Goal

Produce or update the official target architecture document.

## Mandatory target

Define:

```txt
Versioned Inputs
  -> Incremental Facts
  -> Semantic Hot Indexes
  -> PublishedSemanticSnapshot
  -> SemanticQueryFacade
  -> Serving/Projection Caches
  -> Thin LSP Providers
  -> Reactive Read-only Surfaces
```

## Mandatory phase closure

Update target architecture document with:

- design principles;
- module boundaries;
- source-of-truth contract;
- cache/epoch/fingerprint model;
- invalidation flow;
- hot path rules;
- worker pool/scheduler lanes;
- stale-safe query model;
- diagnostics tiering;
- semantic tokens strategy;
- Object Explorer paged/lazy model;
- DataWindow/SQL/native submodels;
- warm start/checkpoint model;
- metrics/performance gates;
- migration plan.

Also update findings if architecture decisions uncover gaps.

---

# PHASE 17 — Architecture fitness functions and conformance gates

## Goal

Define automated architecture checks to prevent future drift.

## Mandatory gates

Design gates for:

- no provider resolving semantic identity outside `SemanticQueryFacade`;
- no semantic store parallel to `KnowledgeBase.publishedState`;
- no full workspace scans in hot paths;
- cache keys include discriminators;
- diagnostics are tiered;
- semantic tokens avoid global resolution per token;
- Object Explorer avoids global truncation;
- read-only surfaces use projections/caps/receipts;
- DataWindow/SQL/native deep analysis stays advisory/background;
- every provider declares lane, budget, cancellation, cache and degraded behavior.

## Mandatory phase closure

Update target architecture:

```md
## Architecture fitness functions
```

Record findings, recommendations and backlog candidates for missing gates.

---

# PHASE 18 — CPU, memory, event loop and worker profiling audit

## Goal

Find real runtime bottlenecks with profiling/instrumentation.

## Mandatory areas

Audit or propose instrumentation for:

- extension activation time;
- language server startup time;
- event loop blocking;
- CPU hotspots;
- memory growth;
- cache pressure;
- worker pool overhead;
- worker serialization cost;
- JSON/LSP payload size;
- Object Explorer payload size;
- diagnostics compute time;
- semantic tokens compute time;
- indexing throughput;
- GC pressure.

## Mandatory phase closure

Record all bottlenecks and recommendations.

Any profiling-related refactorization must include exact metrics to collect and expected target thresholds.

---

# PHASE 19 — Synthetic 10,000+ workspace and corpus scalability audit

## Goal

Validate the target architecture and backlog against massive PowerBuilder workspaces.

## Required scenarios

Design or implement corpus strategy for:

- 10,000+ files;
- 50,000+ symbols where feasible;
- very large object manifests;
- many libraries/PBL folders;
- many targets/projects;
- long library search paths;
- paths with spaces;
- long inheritance chains;
- PFC/STD-like patterns;
- thousands of functions/events;
- thousands of DataWindows;
- SQL embedded/dynamic SQL samples;
- external declarations;
- active edit while indexing;
- warm start;
- file add/delete/rename;
- Object Explorer large tree navigation;
- references/rename large result sets.

## Mandatory phase closure

Record:

- missing corpus generators;
- missing benchmarks;
- performance budgets;
- CI/nightly strategy;
- backlog candidates.

---

# PHASE 20 — CI and release performance regression gates

## Goal

Make speed and reactivity non-regressable.

## Mandatory gates

Define CI/release gates for:

- docs drift;
- architecture conformance;
- no hot path full scans;
- no provider bypassing facade;
- no cache key discriminator omissions;
- no Object Explorer global truncation;
- hover built-in fast path;
- serving cache hit ratio smoke;
- diagnostics tier latency;
- semantic tokens budget;
- indexing throughput smoke;
- synthetic 10,000+ workspace optional/nightly;
- memory budget;
- LSP payload budget.

## Mandatory phase closure

Record missing gates and create backlog candidates.

Update target architecture:

```md
## CI and release gates
```

---

# PHASE 21 — Perceived instantaneity and UX state audit

## Goal

Ensure the plugin feels instant even when background work is still running.

## Mandatory checks

Audit:

- activation behavior;
- loading/degraded/stale/ready states;
- progress reporting;
- optimistic UI;
- lazy Object Explorer;
- no empty panels caused by missing providers;
- hover/completion useful while indexing;
- manual refresh fallback;
- server-driven refresh vs client heuristics;
- user-facing messages when data is paged, stale or degraded.

## Mandatory phase closure

Record UX findings, recommendations, refactorizations and backlog candidates.

---

# PHASE 22 — Target module structure and package organization

## Goal

Define the ideal future folder/module/class organization.

## Mandatory audit

Classify current modules into target domains such as:

```txt
src/server/semantic/input/
src/server/semantic/facts/
src/server/semantic/indexes/
src/server/semantic/snapshot/
src/server/semantic/query/
src/server/semantic/cache/
src/server/semantic/scheduler/
src/server/semantic/submodels/datawindow/
src/server/semantic/submodels/sql/
src/server/semantic/submodels/native/
src/server/runtime/
src/server/features/
src/server/diagnostics/
src/server/indexing/
src/server/workspace/
src/server/publicApi/
src/client/views/
src/client/panels/
src/shared/contracts/
src/shared/protocol/
src/shared/types/
```

Adapt to repository conventions.

## Mandatory checks

For each current module/class/file:

- current responsibility;
- target responsibility;
- stay/move/split/merge/delete;
- should become shared contract;
- should become internal detail;
- required tests.

## Mandatory phase closure

Update target architecture with:

```md
## Target module structure

## Module ownership

## Refactoring migration plan

## Class/function simplification strategy
```

Record all detailed refactorizations and backlog candidates.

---

# PHASE 23 — Major refactor planning and migration roadmap

## Goal

Convert architecture decisions into a safe ordered refactoring roadmap.

## Required output

Update target architecture with:

```md
## Major refactor roadmap
```

For each major refactor, define:

- target state;
- current state;
- migration steps;
- parity tests;
- rollback strategy;
- temporary adapters/facades;
- deletion criteria;
- docs affected;
- metrics affected;
- risks;
- expected benefit;
- dependency order.

## Rules

- No big-bang rewrite.
- Use incremental strangler-style migration where needed.
- Keep old and new paths coexisting only temporarily.
- Every temporary compatibility path must have a retirement spec.

## Mandatory phase closure

Record refactorizations in detail and create backlog candidates.

---

# PHASE 24 — Simplification and maintainability fitness functions

## Goal

Define automated checks to prevent duplicated, legacy or oversized modules from returning.

## Required proposed gates

Design checks for:

- no provider-specific semantic resolution outside allowed boundaries;
- no import cycles in semantic/indexing/runtime modules;
- max file/class/function size thresholds with exceptions;
- no duplicated cache key builders;
- no duplicated DTO/projection builders;
- no duplicated diagnostics rule implementations;
- no active legacy path without owner and retirement spec;
- no direct client pull for heavy projections when server-driven projection exists;
- no Object Explorer global truncation;
- no DataWindow/SQL/native deep logic inside interactive providers;
- no new source-of-truth store outside the official snapshot model.

## Mandatory phase closure

Update target architecture:

```md
## Simplification and maintainability fitness functions
```

Record findings, recommendations and backlog candidates.

---

# PHASE 13 — Complete backlog generation for final architecture

## Goal

Generate the complete backlog required to reach the final target architecture.

Do not generate this backlog before PHASE 24 is complete.

The backlog must be written in Spanish and must include every spec required to achieve:

- semantic serving instantáneo;
- indexación rápida de 10,000+ archivos;
- one semantic source of truth;
- cero contratos semánticos duplicados;
- estructura modular simplificada;
- clases pequeñas y módulos de responsabilidad única;
- legacy retirement;
- read-only surfaces reactivas;
- Object Explorer completo con pagination/lazy loading;
- corrección de cache/fingerprint/epoch;
- worker pool y scheduler lanes;
- diagnostics tiering;
- semantic tokens delta/range;
- references bounded pools;
- warm start/checkpoint;
- architecture conformance gates;
- CI performance regression gates.

## Backlog completeness rule

If reaching the target architecture requires a refactor, create the spec.

If reaching the target architecture requires deleting legacy, create the spec.

If reaching the target architecture requires moving files/modules, create the spec.

If reaching the target architecture requires tests first, create the spec.

If reaching the target architecture requires docs alignment, create the spec.

If reaching the target architecture requires performance gates, create the spec.

Do not omit specs because they are large. Split large work into ordered specs.

## Every backlog item must include

```md
- **ID:**
- **Title:**
- **Estado:**
- **Prioridad:**
- **Orden recomendado:**
- **Origen:**
- **Findings:**
- **Referencias de evidencia:**
- **Estado actual:**
- **Estado objetivo:**
- **Riesgo:**
- **Objetivo:**
- **Depends on:**
- **Tipo de refactor:** None | Extract | Move | Merge | Delete | Split | Facade | Adapter | Contract centralization | Legacy retirement | Test gate | Architecture gate.
- **Impacto arquitectónico:**
- **Impacto hot path:**
- **Impacto 10,000+ archivos:**
- **Impacto semántico PowerBuilder:**
- **Acceptance criteria:**
- **Docs afectadas:**
- **Tests requeridos:**
- **Métricas requeridas:**
- **Validación:**
- **Criterios de retirada:** si aplica para path temporal/legacy.
```

## Mandatory phase closure

Update:

- findings MD;
- audit report;
- target architecture links;
- `docs/backlog.md` if safe.

Do not duplicate existing backlog items.

---

# PHASE 14 — Apply safe fixes detected during audit

## Goal

Apply only safe, small, local, measurable fixes.

Allowed:

- provider registration bug;
- obvious docs drift;
- small cache key discriminator bug;
- obvious built-in hover fast path issue;
- `.find` to `Map` hot lookup;
- per-character scan prefilter;
- regex memoization/line facts;
- missing test for a fixed bug.

Not allowed without separate spec:

- broad KnowledgeBase rewrite;
- broad parser rewrite;
- worker pool introduction;
- SemanticQueryResult migration;
- mass legacy deletion;
- DataWindow parser rewrite;
- SQL parser rewrite;
- public API breaking change;
- major view model rewrite.

## Mandatory phase closure

Record every safe fix, evidence, tests and docs updated.

---

# PHASE 15 — Validation

## Goal

Validate the audit, safe fixes, generated backlog and documentation.

Attempt:

```bash
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
npm run test
```

If commands do not exist, document honestly.

Run focused tests for fixed areas.

## Mandatory phase closure

Record:

- commands run;
- pass/fail;
- errors;
- skipped commands;
- remaining risk;
- next recommended execution order.

---

# PHASE 16 — Final self-review

## Goal

Review whether the audit truly reaches the target.

## Mandatory self-check

Answer:

1. Did we identify all hot path blockers?
2. Did we identify all indexing/discovery blockers?
3. Did we identify all cache/epoch/fingerprint blockers?
4. Did we identify all semantic source-of-truth violations?
5. Did we identify all duplicate/legacy/structural issues?
6. Did we define refactorizations in enough detail?
7. Did we handle Object Explorer global truncation?
8. Did we account for 10,000+ file workspaces?
9. Did we account for PowerBuilder-specific sublanguages?
10. Did we avoid duplicate backlog items?
11. Did we update documentation where needed?
12. Did we avoid unsafe broad rewrites?
13. Did we leave a clear execution order?
14. Did we define architecture and simplification fitness functions?
15. Did we define all specs needed for the final architecture?
16. Did we write the required audit outputs and backlog in Spanish?

## Required final output

End with a Spanish final summary:

```md
## Resumen final de ejecución de auditoría

### Fases completadas

### Recuento de hallazgos por severidad/tipo

### Correcciones seguras aplicadas

### Ítems de backlog creados o actualizados

### Documento de arquitectura objetivo

### Documentación actualizada

### Tests y validación

### Riesgos restantes

### Orden final recomendado de ejecución
```

Include exact ordered backlog IDs.

---

# Final output requirements

At the end, produce and update:

## 1. Findings register

```txt
docs/audits/macro-instant-semantic-indexing-findings.md
```

Must include every finding from every phase and must be written in Spanish.

## 2. Phase audit report

```txt
docs/audits/macro-instant-semantic-indexing-audit.md
```

Must include phase-by-phase summaries, evidence, decisions, refactorizations and validation in Spanish.

## 3. Target architecture

Preferred:

```txt
docs/architecture/instant-semantic-indexing-target.md
```

Fallback:

```txt
docs/instant-semantic-indexing-target.md
```

Must contain the clean future architecture in Spanish, not audit noise.

## 4. Updated backlog if safe

```txt
docs/backlog.md
```

Every backlog item generated from the audit must link to one or more `FINDING-*` entries and must be written in Spanish.

## 5. Updated owner docs if claims changed

Update as needed:

- `docs/architecture.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/performance-budget.md`
- `docs/testing.md`
- `docs/troubleshooting.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 6. Tests and validation

Add or update tests for safe fixes.

Run or attempt:

```bash
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
npm run test
```

Document missing commands honestly.

## 7. Final summary

Include in Spanish:

- findings count by severity/type;
- safe fixes applied;
- backlog items created/updated;
- target architecture document path;
- docs changed;
- tests run;
- validation status;
- final recommended execution order.
