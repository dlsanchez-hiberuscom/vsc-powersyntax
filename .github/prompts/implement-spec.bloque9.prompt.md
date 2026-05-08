# Wave 09 — Target Scaffold, Orchestrator Split, Simplification Fitness and Legacy Retirement

Execute Wave 09 from `docs/backlog.md`.

This wave depends on Wave 05, Wave 06, Wave 07 and Wave 08.

Target backlog items:

```txt
23. PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01
24. PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01
25. PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01
26. PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01
```

Technical execution order inside this wave:

```txt
1. PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01
2. PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01
3. PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01
4. PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01
```

---

# Absolute mandatory rule

**DO NOT STOP, DO NOT ASK QUESTIONS, DO NOT SKIP PHASES, DO NOT MIX PHASES, DO NOT DO A BIG-BANG REWRITE, DO NOT MOVE LARGE MODULES WITHOUT COMPATIBILITY RE-EXPORTS AND TESTS, DO NOT CHANGE RUNTIME BEHAVIOR, DO NOT CHANGE PUBLIC API SHAPE WITHOUT CONTRACT TESTS, DO NOT REMOVE LEGACY CODE WITHOUT RETIREMENT CRITERIA, AND DO NOT FINISH UNTIL TARGET SCAFFOLD, INCREMENTAL ORCHESTRATOR SPLIT, SIMPLIFICATION FITNESS GATES AND LEGACY RETIREMENT PLAN ARE IMPLEMENTED INCREMENTALLY, TARGETED TESTS ARE GREEN, FULL VALIDATION HAS BEEN RUN, AND ALL AFFECTED DOCS ARE UPDATED.**

If a dependency from previous waves is missing or incomplete, do not bypass it. Add only the smallest compatibility shim needed, document the gap, and mark affected work as Partial.

---

# Master goal

Preserve the project master goal:

```txt
The plugin must discover and index very fast without blocking VS Code.
```

Structural refactors must improve:

```txt
ownership
testability
source-of-truth clarity
hot path safety
maintainability
future scalability
```

Do not move code for aesthetics only.

---

# Wave 09 intent

Wave 09 must prepare and enforce the final modular architecture without introducing broad behavior changes.

This wave must:

```txt
1. Create target module scaffolds with owners.
2. Split orchestrator modules incrementally using compatibility layers.
3. Add or strengthen simplification/maintainability fitness gates.
4. Create a legacy/compat retirement registry and plan.
5. Keep all public/runtime behavior stable.
```

This wave must not implement new semantic features.

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
docs/release.md
docs/legacy-isolation.md
docs/troubleshooting.md
docs/powerbuilder-2025-vscode-plugin-technical-guide.md
docs/audits/macro-instant-semantic-indexing-findings.md
docs/audits/macro-instant-semantic-indexing-audit.md
docs/audits/wave-05-semantic-tokens-and-readonly-envelope-report.md
docs/audits/wave-06-readonly-surfaces-object-explorer-sql-ai-ux-report.md
docs/audits/wave-07-datawindow-submodel-and-status-ownership-report.md
docs/audits/wave-08-runtime-metrics-10k-ci-gates-report.md
```

Also inspect specs if present:

```txt
specs/PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01.md
specs/PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01.md
specs/PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01.md
specs/PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01.md
```

If specs do not exist, do not create duplicate long specs unless repository rules require it. Use the wave audit report as implementation evidence.

---

# Source areas to inspect

Main orchestrators:

```txt
src/client/extension.ts
src/shared/publicApi.ts
src/server/handlers/featureHandlers.ts
src/server/server.ts
src/server/handlers/reportCommandHandlers.ts
src/server/handlers/runtimeCommandHandlers.ts
```

Target architecture and modules:

```txt
src/server/**
src/client/**
src/shared/**
```

Architecture tooling:

```txt
tools/run-architecture-hotspot-guard.mjs
tools/run-architecture-rapid-gate.mjs
tools/**
test/server/unit/architectureImports.test.ts
test/server/unit/semanticArchitectureConformance.test.ts
test/server/unit/releaseReadinessContract.test.ts
test/server/unit/**architecture**
```

Legacy:

```txt
plugin_old/**
docs/legacy-isolation.md
AGENTS.md
.github/copilot-instructions.md
.github/instructions/**
```

Tests:

```txt
test/server/unit/**
test/server/integration/**
test/smoke/**
test/server/performance/**
```

Inspect only additional files needed for direct contracts, imports, tests or compatibility.

---

# Non-goals

Do not implement:

```txt
new semantic functionality
DataWindow model rewrite
Object Explorer new features
AI bundle new sections
runtime scheduler behavior changes
worker pool behavior changes
10K corpus expansion beyond what Wave 08 already did
provider behavior rewrites
```

Do not:

```txt
delete compatibility layers without criteria
remove plugin_old
move all code in one big bang
split publicApi.ts into many files without stable barrel
break command IDs
break public API method names
break LSP registration
change package.json contributions without tests
weaken architecture gates to make them pass
increase hotspot budgets without owner/reduction plan
```

---

# PHASE 0 — Baseline and dependency verification

## Tasks

1. Read required docs.
2. Verify previous wave outputs.
3. Inventory current large modules and hotspot gates.
4. Inventory current architecture gates.
5. Inventory current imports from/to `plugin_old`.
6. Run baseline validation.

Try:

```bash
npm run build:test
npm run test:architecture:rapid
npm run test:architecture:metrics
npm run test:docs:drift
npm test -- --grep architecture
npm test -- --grep releaseReadiness
npm test -- --grep extension
npm test -- --grep publicApi
```

If grep is unsupported, run closest available commands and document it.

## Required output

Create or update:

```txt
docs/audits/wave-09-scaffold-orchestrator-fitness-legacy-report.md
```

Include:

```md
# Wave 09 — Target Scaffold, Orchestrator Split, Simplification Fitness and Legacy Retirement

## PHASE 0 — Baseline and dependency verification

### Docs reviewed
### Previous wave dependency status
### Current large module inventory
### Current architecture gate inventory
### Current legacy/plugin_old inventory
### Baseline validation
### Initial risks
```

---

# PHASE 1 — Target module scaffold

## Goal

Create the minimum target module scaffold required to express ownership, without moving large logic.

## Target layout

Use the target architecture as guidance:

```txt
src/server/semantic/input/
src/server/semantic/facts/
src/server/semantic/indexes/
src/server/semantic/snapshot/
src/server/semantic/query/
src/server/semantic/cache/
src/server/semantic/submodels/
src/server/diagnostics/
src/server/features/
src/server/runtime/
src/server/indexing/
src/server/workspace/
src/client/views/
src/client/panels/
src/client/commands/
src/client/lifecycle/
src/client/api/
src/shared/contracts/
src/shared/protocol/
```

Adapt to current repository conventions.

## Tasks

1. Create only useful scaffolds with owner/readme notes if appropriate.
2. Add barrels only where they reduce import churn.
3. Move only low-risk types/constants if already clearly owned.
4. Do not move large behavior modules in this phase.
5. Add or update import boundary tests if scaffolds create new boundaries.

## Required output

Update audit report:

```md
## PHASE 1 — Target module scaffold

### Folders/files created
### Ownership declared
### Types/constants moved, if any
### Re-exports added
### Tests
### Remaining gaps
```

---

# PHASE 2 — Orchestrator split plan and first safe extraction

## Goal

Split the largest orchestrators incrementally, starting with lowest-risk extractions.

Primary targets:

```txt
src/client/extension.ts
src/shared/publicApi.ts
src/server/handlers/featureHandlers.ts
src/server/server.ts
src/server/handlers/reportCommandHandlers.ts
```

## Rules

```txt
No big-bang split.
Each extraction must preserve behavior.
Each extraction must have compatibility re-exports or stable barrels.
Each moved command/provider/API registration must have test coverage or smoke validation.
Do not change command IDs or public API method names.
Do not change package.json contributions unless tests cover it.
```

## Safe extraction candidates

Prefer:

```txt
pure registration helpers
view/controller registration grouping
command registration grouping
type-only public API sections
schema/type groupings with stable barrel
report command router helpers
runtime status helper types
provider registration descriptors
```

Avoid initially:

```txt
core activation flow
LSP connection lifecycle
shared public API breaking schema changes
provider logic rewrites
deep report behavior changes
```

## Tasks

1. Create extraction plan for each orchestrator.
2. Implement only the first safe extraction per area where feasible.
3. Keep old imports working.
4. Run targeted tests after each extraction group.
5. Update hotspot guard only with stricter or owner-backed rules; do not weaken budgets silently.

## Required output

Update audit report:

```md
## PHASE 2 — Orchestrator split

### Extraction plan
### Extractions implemented
### Compatibility strategy
### Hotspot impact
### Tests
### Remaining high-risk splits
```

---

# PHASE 3 — Public API and protocol separation guard

## Goal

Prepare `src/shared/publicApi.ts` for future split without breaking consumers.

## Tasks

1. Inventory public API type groups.
2. Identify stable groups that can move to `src/shared/contracts/` or `src/shared/protocol/`.
3. Move only type-only groups if clearly safe.
4. Preserve `src/shared/publicApi.ts` as stable barrel.
5. Add tests/snapshots to ensure exported names remain available.

## Required tests

```bash
npm test -- --grep publicApi
npm test -- --grep api
npm run build:test
```

## Required output

Update audit report:

```md
## PHASE 3 — Public API/protocol separation guard

### Type groups inventoried
### Type-only moves
### Barrel compatibility
### Tests
### Remaining gaps
```

---

# PHASE 4 — Simplification fitness suite

## Goal

Strengthen architecture fitness gates to prevent regression in size, cycles, duplicate builders, legacy imports, provider semantics and parallel stores.

## Required categories

Add or strengthen gates for:

```txt
size / hotspot ratchet
import cycles
duplicate DTO/projection/cache builders
legacy/plugin_old runtime imports
provider semantic bypasses
client pulling heavy server projections
parallel semantic stores
missing owner for compatibility layers
```

## Rules

```txt
New categories may start report-only if noisy.
Any failing gate must have fixture/evidence.
Do not weaken existing gates without owner and reduction plan.
Do not increase budgets silently.
Every exception must have owner, rationale and removal criteria.
```

## Tasks

1. Extend existing architecture tooling or create a focused maintainability scanner.
2. Add report JSON if not already available.
3. Add fixtures or tests for at least the categories touched.
4. Ensure hotspot budgets are ratcheted, not relaxed.
5. Add documentation of exceptions/allowlists.

## Required output

Update audit report:

```md
## PHASE 4 — Simplification fitness suite

### Gates added/updated
### Report-only categories
### Fail categories
### Exceptions/allowlists
### Tests
### Remaining gaps
```

---

# PHASE 5 — Legacy and compatibility retirement registry

## Goal

Create a formal registry for legacy and compatibility paths, including `plugin_old`.

## Tasks

Create or update a registry documenting:

```txt
legacy path
owner
current role
runtime import allowed yes/no
replacement
parity evidence required
retirement criteria
retire-by condition/date if applicable
gate coverage
```

Apply to:

```txt
plugin_old/**
compat re-exports introduced in this or previous waves
legacy safe mode paths if applicable
old public API barrels if split
old provider paths if split
```

Rules:

```txt
Do not delete plugin_old.
Do not allow runtime imports from src/** to plugin_old/**.
Do not retire compatibility layers without tests.
Do not keep compatibility layers without criteria.
```

## Required output

Update audit report:

```md
## PHASE 5 — Legacy and compatibility retirement registry

### Registry created/updated
### plugin_old status
### Compatibility layers registered
### Gates
### Retirement criteria
### Remaining gaps
```

---

# PHASE 6 — Documentation alignment

Update affected docs:

```txt
docs/instant-semantic-indexing-target.md
docs/architecture.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/performance-budget.md
docs/release.md
docs/legacy-isolation.md
docs/current-focus.md
docs/backlog.md
```

Update `docs/done-log.md` only for fully closed items.

Rules:

```txt
Do not duplicate large architecture text.
docs/architecture-implementation-map.md owns current module ownership map.
docs/architecture-status.md owns current implementation status.
docs/legacy-isolation.md owns plugin_old/legacy policy.
docs/testing.md owns gate strategy.
docs/backlog.md owns item status.
If any item is Partial, include exact pending work.
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

Architecture/scaffold/split:

```bash
npm run build:test
npm run test:architecture:rapid
npm run test:architecture:metrics
npm test -- --grep architecture
npm test -- --grep publicApi
npm test -- --grep extension
npm test -- --grep command
npm test -- --grep provider
```

Legacy:

```bash
npm test -- --grep legacy
npm test -- --grep plugin_old
npm test -- --grep architectureImports
```

Docs/release:

```bash
npm run test:docs:drift
npm test -- --grep releaseReadiness
npm run release:verify
```

General:

```bash
npm run test:performance:gate
npm test
```

If a command does not exist or grep is unsupported, document it and run closest available command.

If `release:verify` is too expensive or unavailable locally, document why and run constituent scripts where possible.

If failures are caused by this wave, fix them before finishing.

If failures are pre-existing/unrelated, document evidence.

## Required output

Update audit report:

```md
## PHASE 7 — Validation

### Targeted validation
### Architecture validation
### Legacy validation
### Docs/release validation
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
changed tools/scripts
docs/audits/wave-09-scaffold-orchestrator-fitness-legacy-report.md
docs/backlog.md
docs/architecture.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/performance-budget.md
docs/release.md
docs/legacy-isolation.md
docs/current-focus.md
```

Verify:

```txt
target scaffold exists and has clear owners.
large logic was not moved without tests.
orchestrator split was incremental and compatibility-safe.
public API barrel remains stable.
no command IDs changed accidentally.
no provider registrations were lost.
fitness gates are stronger or owner-backed, not weakened silently.
legacy/plugin_old remains isolated from runtime imports.
legacy/compat registry exists with retirement criteria.
docs/backlog states are honest.
tests and validation are documented.
```

If any gap is found, fix or document before final response.

---

# Closing criteria

## PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01 can be Done only if:

```txt
target folders/scaffolds exist where useful
owners are documented
import boundaries are updated or documented
tests/build pass
docs are updated
```

Otherwise mark Partial.

## PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01 can be Done only if:

```txt
main orchestrators are split enough to reduce hotspot risk
compatibility exports exist
activation/commands/providers/public API are tested
hotspot guard reflects improvement or documented ratchet
docs are updated
```

Otherwise mark Partial.

## PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01 can be Done only if:

```txt
fitness gates cover size/cycles/duplicates/legacy/provider semantics/projections/stores
fixtures or tests exist
allowlists have owners/removal criteria
docs are updated
```

Otherwise mark Partial.

## PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01 can be Done only if:

```txt
legacy registry exists
plugin_old role is documented
runtime no-import gate remains active
replacement/parity/retirement criteria exist
docs are updated
```

Otherwise mark Partial.

---

# Final response

Only after all phases are complete, respond in Spanish with:

```md
## Resumen final — Wave 09 Scaffold, Split, Fitness and Legacy

### Documentos actualizados

### Código cambiado

### Tests añadidos/modificados

### Tools/scripts actualizados

### Target module scaffold

### Orchestrator split

### Public API/protocol separation

### Simplification fitness suite

### Legacy/compat retirement registry

### Validación targeted ejecutada

### Validación completa ejecutada

### Estado de PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01

### Estado de PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01

### Estado de PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01

### Estado de PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01

### Riesgos pendientes

### Siguiente paso recomendado
```

Do not provide partial summaries before the full wave is complete.
```
