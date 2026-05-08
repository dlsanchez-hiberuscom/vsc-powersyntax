# Wave 07 — DataWindow Submodel Split, Caps and Historical Submodel Ownership

Execute Wave 07 from `docs/backlog.md`.

This wave depends on Wave 05 and Wave 06.

Target backlog items:

```txt
16. PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01
18. PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01
```

Historical architecture items to inspect for ownership/status normalization only:

```txt
46. PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01
47. PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01
48. PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01
```

These historical items must not be implemented directly unless the evidence proves they are still the correct executable owner. Their default role in this wave is status reconciliation: `Done`, `Partial`, `Superseded`, `Open by conformance`, or `Open`.

---

# Absolute mandatory rule

**DO NOT STOP, DO NOT ASK QUESTIONS, DO NOT SKIP PHASES, DO NOT MIX PHASES, DO NOT DO A BIG-BANG REWRITE, DO NOT MOVE DATAWINDOW CODE WITHOUT PARITY TESTS, DO NOT CHANGE DATAWINDOW SEMANTICS WITHOUT EVIDENCE, DO NOT IMPLEMENT HISTORICAL ITEMS 46/47/48 AS NEW FUNCTIONAL WORK WITHOUT PROVING THEY ARE STILL THE EXECUTABLE OWNER, DO NOT MARK ANY SUBMODEL SPEC DONE WITHOUT CODE/TESTS/DOCS VALIDATION, AND DO NOT FINISH UNTIL DATAWINDOW SPLIT/CAPS WORK IS IMPLEMENTED INCREMENTALLY, HISTORICAL SUBMODEL STATUS IS NORMALIZED, TARGETED TESTS ARE GREEN, FULL VALIDATION HAS BEEN RUN, AND ALL AFFECTED DOCS ARE UPDATED.**

If a dependency from Wave 05 or Wave 06 is missing, do not bypass it. Add only the smallest compatibility shim needed, document the gap, and mark affected work as Partial.

---

# Master goal

Preserve the project master goal:

```txt
The plugin must discover and index very fast without blocking VS Code.
```

DataWindow support must be:

```txt
advisory by default
bounded
sourceOrigin-aware
confidence-aware
cap/receipt-driven
safe for 10,000+ file workspaces
separate from core PowerScript semantic truth
```

---

# Wave 07 intent

Wave 07 must modularize the DataWindow submodel incrementally and align ownership/status for PowerBuilder submodels.

This wave must:

```txt
1. Split or wrap DataWindow responsibilities into clearer submodel boundaries.
2. Preserve behavior through parity tests.
3. Add or enforce caps/receipts where DataWindow data is exposed to read-only surfaces.
4. Keep existing public/runtime behavior compatible.
5. Normalize backlog/spec/doc ownership for DataWindow, SQL/Transaction and native/external submodels.
6. Reconcile historical items 46/47/48 as traceability items, not as duplicate implementation work.
```

This wave must not implement runtime metrics, 10k corpus, CI gates, orchestrator split, target scaffold, simplification fitness suite or legacy retirement.

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
docs/audits/wave-06-readonly-surfaces-object-explorer-sql-ai-ux-report.md
```

Also inspect specs if present:

```txt
specs/PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01.md
specs/PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01.md
specs/PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01.md
specs/PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01.md
specs/PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01.md
specs/PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01.md
specs/PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01.md
```

If specs do not exist, do not create duplicate long specs unless repository rules require it. Use the wave audit report as implementation evidence.

---

# Source areas to inspect

Primary DataWindow files:

```txt
src/server/features/dataWindowModel.ts
src/server/features/dataWindowPropertyPaths.ts
src/server/features/dataWindowBindingModel.ts
src/server/features/dataWindowFastContext.ts
src/server/features/dataWindowColumnAccess.ts
src/server/features/dataWindowServingAdapters.ts
src/server/features/dataWindowSqlLineage.ts
src/server/features/dataWindowSafeMode.ts
src/server/features/dataWindowLegacySafeMode.ts
```

DataWindow consumers:

```txt
src/server/features/diagnostics.ts
src/server/features/currentObjectContext.ts
src/server/features/completion.ts
src/server/features/hover.ts
src/server/features/definition.ts
src/server/features/powerBuilderCodeMetrics.ts
src/server/handlers/reportCommandHandlers.ts
src/shared/publicApi.ts
```

Tests:

```txt
test/server/unit/**dataWindow**
test/server/unit/**DataWindow**
test/server/unit/**currentObjectContext**
test/server/unit/**diagnostic**
test/server/unit/**completion**
test/server/unit/**hover**
test/server/unit/**definition**
```

Inspect only additional files needed for direct contracts, imports, tests or compatibility.

---

# Non-goals

Do not implement:

```txt
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
rewrite the entire DataWindow model
move all DataWindow files in one step
break existing imports without re-export compatibility
change public API DTOs in a breaking way
convert DataWindow into strong PowerScript semantic truth
perform DB/schema validation
perform full workspace scans in hot paths
hide uncertainty/confidence gaps
remove legacy safe mode unless parity tests prove replacement
mark SQL/native historical specs Done without explicit evidence
execute historical items 46/47/48 independently if they are superseded by executable backlog items
```

---

# PHASE 0 — Baseline and dependency verification

## Tasks

1. Read required docs.
2. Verify Wave 05 read-only envelope state.
3. Verify Wave 06 SQL/read-only state if relevant.
4. Inventory current DataWindow files, exports, imports and consumers.
5. Inventory existing DataWindow tests.
6. Inventory historical submodel items 46/47/48 and related specs.
7. Run baseline targeted validation.

Try:

```bash
npm run build:test
npm test -- --grep dataWindow
npm test -- --grep DataWindow
npm test -- --grep currentObjectContext
npm test -- --grep diagnostic
npm run test:architecture:rapid
```

If grep is unsupported, run the closest available commands and document it.

## Required output

Create or update:

```txt
docs/audits/wave-07-datawindow-submodel-and-status-ownership-report.md
```

Include:

```md
# Wave 07 — DataWindow Submodel Split and Historical Status Ownership

## PHASE 0 — Baseline and dependency verification

### Docs reviewed
### Wave 05/06 dependency status
### Current DataWindow module inventory
### Current DataWindow consumers
### Current DataWindow tests
### Historical items 46/47/48 inventory
### Baseline validation
### Initial risks
```

---

# PHASE 1 — DataWindow responsibility map

## Goal

Understand and document DataWindow responsibilities before moving code.

## Tasks

Classify current DataWindow logic into target responsibility groups:

```txt
parser / SRD structure extraction
model projection
columns and controls
expressions and dependencies
property paths
bindings / DataObject / GetChild / DDDW
fast context
SQL lineage
serving adapters
diagnostics advisory
safe mode / legacy safe mode
public/read-only projection DTOs
```

For each current file, document:

```txt
current responsibility
target responsibility
main consumers
risk
safe move candidate yes/no
tests covering it
```

Do not move code in this phase except for trivial safe fixes.

## Required output

Update audit report:

```md
## PHASE 1 — DataWindow responsibility map

### Current files
### Target responsibility groups
### Consumers
### Safe move candidates
### High-risk areas
### Test coverage
```

---

# PHASE 2 — Target submodel boundary and compatibility facade

## Goal

Introduce a clear DataWindow submodel boundary without a big-bang move.

## Required design

Preferred target boundary:

```txt
src/server/semantic/submodels/datawindow/
```

If the repository does not yet have `src/server/semantic/`, either:

```txt
A. create only the minimum DataWindow subfolder needed with clear owner docs, or
B. use the existing best location and document that PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01 will formalize the final path.
```

Create a small compatibility facade/barrel if safe, for example:

```txt
src/server/semantic/submodels/datawindow/index.ts
```

or equivalent.

The facade should expose existing behavior through stable wrappers/re-exports, without forcing all consumers to migrate immediately.

## Tasks

1. Create target boundary/facade.
2. Move or re-export only low-risk types/helpers first.
3. Do not move large parser/model logic unless tests prove parity.
4. Keep old import paths working through re-export compatibility.
5. Add architecture notes documenting temporary compatibility.

## Required tests

```bash
npm run build:test
npm test -- --grep dataWindow
```

## Required output

Update audit report:

```md
## PHASE 2 — DataWindow boundary and compatibility facade

### Boundary introduced
### Re-exports or wrappers added
### Files moved, if any
### Compatibility strategy
### Tests
### Remaining gaps
```

---

# PHASE 3 — Caps and receipts for DataWindow consumers

## Goal

Ensure DataWindow read-only/advisory outputs are bounded and receipt-driven.

## Tasks

Inspect consumers that expose DataWindow data:

```txt
Current Object Context
diagnostics
code metrics
AI/support/read-only bundles
hover/completion/definition DataWindow adapters
```

Add or verify caps/receipts where DataWindow data can grow:

```txt
max columns
max controls
max bindings
max property paths
max expression dependencies
max safe-mode findings
truncated/cap receipts
confidence/sourceOrigin metadata
```

Use the Wave 05 read-only envelope where appropriate.

Do not change deep DataWindow parsing semantics.

## Required tests

Add/update tests for:

```txt
large DataWindow model gets capped in read-only output
truncation receipt is emitted
existing DataWindow fixtures still produce same core model
diagnostics/advisory confidence is preserved
```

## Required output

Update audit report:

```md
## PHASE 3 — DataWindow caps and receipts

### Consumers updated
### Caps introduced or verified
### Receipts introduced or verified
### Tests added/updated
### Remaining gaps
```

---

# PHASE 4 — Incremental module split

## Goal

Move the safest DataWindow pieces into the submodel boundary.

## Allowed moves

Only move code when:

```txt
the responsibility is clear
imports are local and low-risk
tests exist or are added
old import path remains compatible
no behavior changes
```

Good candidates:

```txt
types
constants
small pure helpers
property path helper subsets
safe-mode constants
serving adapter types
```

High-risk candidates that should not move unless very well covered:

```txt
main dataWindowModel parser
full property path resolver
binding model if widely consumed
legacy safe mode behavior
SQL lineage coupling
```

## Required strategy

For each moved piece:

```txt
1. Move or copy with re-export.
2. Update imports only in directly related files.
3. Run targeted tests.
4. Document compatibility.
```

## Required output

Update audit report:

```md
## PHASE 4 — Incremental module split

### Files moved
### Re-exports added
### Imports updated
### Tests
### Compatibility layer
### Remaining high-risk modules
```

---

# PHASE 5 — Historical submodel item status normalization

## Goal

Normalize status and ownership for historical architecture items 46/47/48 without duplicating implementation work.

Historical items:

```txt
PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01
PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01
PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01
```

## Rules

```txt
Do not implement these historical items directly in this phase.
Do not mark them Done by intuition.
Do not delete them without traceability.
Do not duplicate their technical content in backlog.
Use evidence from code, tests, specs and docs only.
```

For each historical item, decide one of:

```txt
Done
Partial
Superseded
Open by conformance
Open
```

Decision guidance:

```txt
DataWindow historical publication item:
  likely Open by conformance until the DataWindow split/caps evidence is complete.
  executable owner is probably PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01.

SQL anchors historical submodel item:
  likely Superseded by PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01 if Wave 06 implemented bounded/capped SQL anchors with receipts.
  otherwise Open by conformance or Partial.

Native metadata historical submodel item:
  likely Superseded by PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01 if that spec/code/tests already own the behavior.
  otherwise Open by conformance or Partial.
```

## Required output

Update audit report:

```md
## PHASE 5 — Historical submodel item status normalization

### PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01
**Recommended state:**
**Evidence:**
**Executable owner:**
**Remaining work:**

### PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01
**Recommended state:**
**Evidence:**
**Executable owner:**
**Remaining work:**

### PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01
**Recommended state:**
**Evidence:**
**Executable owner:**
**Remaining work:**
```

---

# PHASE 6 — Submodel status ownership normalization

## Goal

Normalize backlog/spec/doc status for DataWindow, SQL and native/external submodels.

## Tasks

Review:

```txt
docs/backlog.md
docs/current-focus.md
docs/roadmap.md
docs/done-log.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/semantic-design-assumptions.md
specs/PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01.md
specs/PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01.md
specs/PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01.md
```

For each submodel:

```txt
DataWindow
SQL/Transaction
Native/external
```

Document one owner state:

```txt
Open
Partial
Done
Superseded
Open by conformance
```

Rules:

```txt
Do not mark Done if code/tests/docs are not fully aligned.
Do not duplicate long spec content in backlog.
Use backlog as status index.
Use specs as detail owner.
Use done-log only for fully closed items.
If a historical architecture item is absorbed by a functional spec, mark Superseded or Open by conformance with evidence.
```

## Required output

Update audit report:

```md
## PHASE 6 — Submodel status ownership normalization

### DataWindow status
### SQL/Transaction status
### Native/external status
### Backlog changes
### Spec/doc changes
### Remaining contradictions
```

---

# PHASE 7 — Documentation alignment

Update affected docs:

```txt
docs/instant-semantic-indexing-target.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/semantic-design-assumptions.md
docs/testing.md
docs/performance-budget.md
docs/current-focus.md
docs/backlog.md
```

Update `docs/done-log.md` only for fully closed items.

Rules:

```txt
Do not duplicate detailed architecture text.
Do not mark DataWindow split Done unless split/caps/compat/tests/docs are complete.
Do not mark submodel status ownership Done unless no contradictions remain.
If any item is Partial, include exact pending work.
```

## Required output

Update audit report:

```md
## PHASE 7 — Documentation alignment

### Docs updated
### Backlog state changes
### Done-log changes
### Remaining documentation gaps
```

---

# PHASE 8 — Validation

Run targeted validation first.

DataWindow:

```bash
npm test -- --grep dataWindow
npm test -- --grep DataWindow
npm test -- --grep datawindow
```

Consumers:

```bash
npm test -- --grep currentObjectContext
npm test -- --grep diagnostic
npm test -- --grep completion
npm test -- --grep hover
npm test -- --grep definition
```

Docs/architecture:

```bash
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:architecture:metrics
```

General:

```bash
npm run build:test
npm run test:performance:gate
npm test
```

If a command does not exist or grep is unsupported, document it and run the closest available command.

If failures are caused by this wave, fix them before finishing.

If `npm test` fails for known pre-existing unrelated debt, document evidence.

## Required output

Update audit report:

```md
## PHASE 8 — Validation

### Targeted validation
### Docs/architecture validation
### Full validation
### Failures investigated
### Final test state
```

---

# PHASE 9 — Final self-review

Before finishing, re-read:

```txt
changed source files
changed tests
docs/audits/wave-07-datawindow-submodel-and-status-ownership-report.md
docs/backlog.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/semantic-design-assumptions.md
docs/testing.md
docs/performance-budget.md
docs/current-focus.md
```

Verify:

```txt
DataWindow remains advisory by default.
No DataWindow behavior was changed without tests.
Caps/receipts exist for touched DataWindow read-only consumers.
No broad DataWindow rewrite was done.
Compatibility re-exports exist for moved modules.
No full workspace scan was introduced.
No DataWindow code was treated as core PowerScript semantic truth.
Historical items 46/47/48 were reconciled by evidence.
Historical items 46/47/48 were not implemented directly unless still executable owners.
Submodel status ownership has one source of truth.
Backlog/spec/current-focus/roadmap/done-log are aligned.
Tests and validation are documented.
Partial/Done states are honest.
```

If any gap is found, fix or document before final response.

---

# Closing criteria

## PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01 can be Done only if:

```txt
DataWindow submodel boundary exists
responsibilities are split or wrapped incrementally
caps/receipts exist for touched read-only consumers
compatibility paths remain safe
parity tests pass
docs are updated
full validation is green or unrelated known failures are documented
```

Otherwise mark Partial with exact pending work.

## PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01 can be Done only if:

```txt
DataWindow, SQL/Transaction and native/external each have exactly one documented owner state
historical items 46/47/48 have evidence-based status
backlog/specs/current-focus/roadmap/done-log do not contradict each other
Superseded/Open by conformance states are evidence-based
docs drift/link checks pass
```

Otherwise mark Partial with exact pending work.

---

# Final response

Only after all phases are complete, respond in Spanish with:

```md
## Resumen final — Wave 07 DataWindow Submodel

### Documentos actualizados

### Código cambiado

### Tests añadidos/modificados

### DataWindow boundary/facade

### DataWindow caps/receipts

### Módulos movidos o re-exportados

### Historical items 46/47/48

### Submodel status ownership

### Validación targeted ejecutada

### Validación completa ejecutada

### Estado de PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01

### Estado de PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01

### Riesgos pendientes

### Siguiente ola recomendada
```

Do not provide partial summaries before the full wave is complete.
```
