# Execute Wave 0 + Wave 1 — Instant Semantic Runtime

Execute **Wave 0 + Wave 1** completely, phase by phase, without stopping, without asking for confirmation, and without delivering partial summaries.

## Source documents

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
```

Also inspect all relevant source and tests before modifying anything.

## Master goal

Preserve the project master goal:

> The plugin must discover and index very fast without blocking VS Code.

Do not introduce broad rewrites. Do not create semantic stores parallel to `KnowledgeBase.publishedState`. Do not introduce full workspace scans in hot paths.

---

# Mandatory execution rule

**DO NOT STOP, DO NOT ASK QUESTIONS, AND DO NOT DELIVER PARTIAL SUMMARIES: execute every phase in strict order, close each phase with evidence, code changes, documentation updates and tests, and do not finish until Wave 0, Wave 1, all affected documentation, all backlog/done-log/current-focus updates, and the complete final validation are fully green.**

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

This execution covers only:

## Wave 0 — Audit closure and baseline health

1. Close `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01`.
2. Move it from active backlog to `docs/done-log.md`.
3. Update `docs/backlog.md`.
4. Update `docs/current-focus.md`.
5. Update `docs/roadmap.md` only if needed.
6. Document and fix the remaining `npm test` red baseline until all tests are green.
7. If any failing test is obsolete or wrongly scoped, fix the test or governance documentation properly; do not skip silently.

## Wave 1 — P0 semantic architecture foundations

Execute in this exact order:

```txt
1. PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01
2. PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01
3. PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01
```

Do not start item 2 before item 1 is implemented, tested and documented.

Do not start item 3 before item 2 is implemented, tested and documented.

---

# Non-negotiable rules

- Execute phase by phase.
- Do not merge phases.
- Do not skip phases.
- Do not reorder phases.
- Do not ask for confirmation.
- If evidence is missing, document it and continue with the safest valid implementation.
- Do not perform unrelated refactors.
- Do not weaken tests to make them pass.
- Do not raise budgets to hide architectural debt.
- Do not mark anything `Done` without code, tests, validation and docs.
- Do not leave `npm test` red.
- Do not leave `npm run build:test` red.
- Do not leave architecture gates red.
- Do not leave docs drift red.
- Do not leave performance gate red.
- Do not finish until all required commands pass.

---

# PHASE 0 — Preparation and baseline inventory

## Goal

Understand current state before editing.

## Tasks

1. Read all source documents.
2. Inspect current status of:
   - `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01`;
   - `PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01`;
   - `PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01`;
   - `PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01`.
3. Inspect current test failures from `npm test` if any.
4. Identify whether the failures are:
   - real product bugs;
   - obsolete tests;
   - missing exports;
   - catalog governance drift;
   - hotspot guard failures;
   - TypeScript errors;
   - environment issues.
5. Do not modify code yet unless needed to run diagnostics.

## Required phase output

Append a short execution note to a new file:

```txt
docs/audits/wave-0-1-instant-semantic-execution.md
```

Include:

```md
## PHASE 0 — Preparación y baseline

### Documentos revisados

### Estado inicial del backlog

### Estado inicial de tests

### Riesgos detectados

### Plan de ejecución
```

---

# PHASE 1 — Close Wave 0 documentation item

## Goal

Fully close:

```txt
PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01
```

## Tasks

1. Verify the item is already validated.
2. Move the item from active backlog to `docs/done-log.md`.
3. Remove it from active backlog or mark it according to repository convention if active backlog keeps historical closed items.
4. Update `docs/current-focus.md` to point to Wave 1 as current focus.
5. Update `docs/roadmap.md` only if it references the old item as active.
6. Update `docs/audits/macro-instant-semantic-indexing-findings.md` if necessary so `FINDING-037` remains clearly fixed.
7. Do not alter unrelated backlog items.

## Required validation

Run:

```bash
npm run test:unit -- --grep "testingMatrixDocs"
npm run test:docs:drift
```

Both must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-0-1-instant-semantic-execution.md
```

Add:

```md
## PHASE 1 — Cierre de PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01

### Cambios realizados

### Docs actualizadas

### Tests ejecutados

### Resultado

### Riesgos restantes
```

---

# PHASE 2 — Restore full test baseline

## Goal

Make the full test baseline green before architectural implementation.

The final state must have:

```bash
npm test
```

green.

## Tasks

1. Run:

```bash
npm run build:test
npm test
```

2. For every failing test:
   - inspect the failure;
   - identify root cause;
   - fix the actual issue;
   - do not delete tests to hide failures;
   - do not weaken assertions unless the expected behavior is provably obsolete and documentation/backlog are updated.
3. Known previously observed areas to check:
   - catalog generator exports;
   - catalog consistency;
   - catalog adoption decision;
   - backpressure policy workload classes;
   - architecture hotspot guard;
   - `featureHandlers.ts` and `hover.ts` hotspot budgets.
4. If a hotspot guard is red:
   - prefer small structural cleanup or documented ratchet only if justified;
   - do not simply raise budgets to hide debt;
   - if a large split is needed, create or update the relevant backlog item and apply only the smallest safe fix required to make the baseline honest.
5. Keep all fixes within Wave 0/Wave 1 scope.
6. If a failure belongs to a separate product decision, document it and create/update a backlog item, but the test baseline must still be made green by either:
   - fixing the implementation;
   - fixing an obsolete test expectation;
   - moving obsolete coverage to the correct lane with documentation and explicit test script changes.

## Required validation

Repeat until green:

```bash
npm run build:test
npm test
```

Then run:

```bash
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-0-1-instant-semantic-execution.md
```

Add:

```md
## PHASE 2 — Recuperación de baseline completo de tests

### Fallos iniciales

### Causa raíz por fallo

### Cambios aplicados

### Tests ejecutados

### Resultado final

### Backlog/docs actualizados si aplica
```

---

# PHASE 3 — Implement PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01

## Goal

Implement the first P0 architecture foundation:

```txt
PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01
```

## Required design

Create or extend an architecture conformance scanner that can detect, at minimum:

1. provider bypass of `SemanticQueryFacade` outside allowlist;
2. imports or direct calls that create semantic source-of-truth drift;
3. semantic store parallel to `KnowledgeBase.publishedState`;
4. full workspace scans in hot path providers;
5. cache contract discriminator omissions where detectable;
6. import cycles in semantic/indexing/runtime/shared areas, if feasible in this slice;
7. legacy/runtime dependency on `plugin_old`;
8. provider files missing declared lane/budget/cache/stale/degraded policy, if provider registry metadata already exists or can be introduced safely.

## Implementation rules

- Prefer TypeScript AST/import graph over brittle text-only checks.
- Keep existing textual tests as smoke until structural scanner fully covers them.
- Start with clear allowlists.
- Add negative fixtures.
- Emit stable JSON report.
- Integrate with existing architecture rapid gate only when stable.
- Do not overbuild a huge scanner in one step.
- Implement the smallest useful structural scanner that covers the P0 contract.

## Required docs

Update as needed:

```txt
docs/testing.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/instant-semantic-indexing-target.md
docs/backlog.md
```

If the item is fully complete, move it to `docs/done-log.md`. If partially complete, keep it `Partial` with exact pending items.

## Required validation

Run:

```bash
npm run build:test
npm run test:unit -- --grep "architecture"
npm run test:architecture:rapid
npm run test:docs:drift
npm test
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-0-1-instant-semantic-execution.md
```

Add:

```md
## PHASE 3 — PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01

### Diseño implementado

### Allowlists

### Fixtures negativos

### Cambios de código

### Cambios de documentación

### Tests ejecutados

### Estado del backlog

### Riesgos restantes
```

---

# PHASE 4 — Implement PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01

## Goal

Make published semantic state readonly/verifiable.

## Required checks

Inspect and fix:

```txt
src/server/knowledge/KnowledgeBase.ts
```

Especially:

- `publishedState`;
- `getScopeAt`;
- `getScopeAtReadonly`;
- `scopeIndex`;
- any query/getter method that mutates published state;
- any lazy index written into published state from a readonly path.

## Required design

The final design must ensure:

1. readonly queries do not mutate `publishedState`;
2. lazy indexes are either:
   - built during publication; or
   - stored in an external derived projection/cache versioned by epoch/fingerprint;
3. tests prove readonly query paths do not mutate published state;
4. docs explain the ownership of published truth vs derived projections.

## Implementation rules

- Do not create a parallel semantic truth.
- Do not introduce expensive publish-time work without measuring or justifying it.
- Prefer a small derived projection/cache if publish-time materialization would be too expensive.
- Keep behavior equivalent for scope resolution.

## Required docs

Update as needed:

```txt
docs/architecture.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/instant-semantic-indexing-target.md
docs/backlog.md
docs/testing.md
```

If complete, move backlog item to done-log. If partial, record exact pending work.

## Required validation

Run:

```bash
npm run build:test
npm run test:unit -- --grep "KnowledgeBase"
npm run test:unit -- --grep "scope"
npm run test:architecture:rapid
npm run test:docs:drift
npm test
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-0-1-instant-semantic-execution.md
```

Add:

```md
## PHASE 4 — PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01

### Problema confirmado

### Diseño aplicado

### Cambios de código

### Tests añadidos o actualizados

### Docs actualizadas

### Validación

### Estado del backlog

### Riesgos restantes
```

---

# PHASE 5 — Implement PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01

## Goal

Harden `SemanticQueryResult` so it carries the effective consumer policy and becomes the trusted semantic query envelope.

## Required checks

Inspect and fix:

```txt
src/server/features/queryContext.ts
src/server/features/queryScopePolicy.ts
src/server/features/semanticQueryFacade.ts
src/server/knowledge/resolution/semanticQueryResult.ts
```

Also inspect all providers consuming semantic query results.

## Required design

The final design must ensure:

1. `SemanticQueryResult.query.sourceOriginPolicy` reflects the actual policy used for resolution.
2. `allowStaging`, `allowGenerated`, `allowExternal` are not hardcoded as allow-all unless that is the effective policy.
3. The result envelope carries confidence, evidence, reason codes and stale/degraded metadata where applicable.
4. Consumers do not rely on raw `ResolvedTargetInfo` outside allowlisted internal paths.
5. Tests cover policy differences by consumer.

## Required tests

Add or update tests for:

- hover policy;
- completion policy;
- references/rename policy if feasible;
- diagnostics or read-only consumer policy if feasible;
- generated/staging/external source origin cases;
- backward compatibility of existing result shape.

## Required docs

Update as needed:

```txt
docs/semantic-design-target.md
docs/instant-semantic-indexing-target.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/backlog.md
docs/testing.md
```

If complete, move backlog item to done-log. If partial, record exact pending work.

## Required validation

Run:

```bash
npm run build:test
npm run test:unit -- --grep "semanticQuery"
npm run test:unit -- --grep "SemanticQuery"
npm run test:unit -- --grep "crossSurface"
npm run test:architecture:rapid
npm run test:performance:gate
npm run test:docs:drift
npm test
```

All must pass before continuing.

## Required phase output

Update:

```txt
docs/audits/wave-0-1-instant-semantic-execution.md
```

Add:

```md
## PHASE 5 — PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01

### Problema confirmado

### Diseño aplicado

### Cambios de código

### Consumers revisados

### Tests añadidos o actualizados

### Docs actualizadas

### Validación

### Estado del backlog

### Riesgos restantes
```

---

# PHASE 6 — Final full validation

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

Also run any focused tests added or touched during this work.

## Absolute final rule

Do not finish if any of these commands fails.

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
docs/audits/wave-0-1-instant-semantic-execution.md
```

Add:

```md
## PHASE 6 — Validación final completa

### Comandos ejecutados

### Resultado por comando

### Tests focales adicionales

### Estado final de backlog

### Estado final de docs

### Riesgos restantes
```

---

# PHASE 7 — Final self-review and closure

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
docs/audits/wave-0-1-instant-semantic-execution.md
```

Verify:

1. Wave 0 is fully closed.
2. `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01` is no longer active unless repository convention explicitly keeps closed items.
3. `PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01` is Done or Partial with exact pending items.
4. `PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01` is Done or Partial with exact pending items.
5. `PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01` is Done or Partial with exact pending items.
6. No docs contradict backlog/done-log/current-focus.
7. No new full workspace scan was introduced in hot paths.
8. No new semantic store parallel to `KnowledgeBase.publishedState` was introduced.
9. No tests were weakened without documented reason.
10. `npm test` is green.
11. All mandatory validation commands are green.

## Final output

Only after every item above is true, output a final Spanish summary:

```md
## Resumen final — Oleada 0 + Oleada 1

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
