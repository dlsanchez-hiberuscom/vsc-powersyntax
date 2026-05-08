# Wave 10 — Final Stabilization, Backlog Reconciliation and Release Readiness Hardening

Execute Wave 10 as a final stabilization and reconciliation wave after Waves 05–09.

This wave is not a feature wave. It is a closing, stabilization, validation, documentation and release-readiness hardening wave.

Target scope:

```txt
Backlog reconciliation
Done-log/current-focus/roadmap alignment
Architecture-status and implementation-map alignment
Gate classification and release readiness hardening
Compatibility layer and legacy registry verification
Hot path regression audit after waves 05–09
Final validation matrix and failure classification
Final audit summary
```

---

# Absolute mandatory rule

**DO NOT STOP, DO NOT ASK QUESTIONS, DO NOT SKIP PHASES, DO NOT MIX PHASES, DO NOT IMPLEMENT NEW FEATURES, DO NOT OPEN NEW REFACTORING INITIATIVES, DO NOT CHANGE SEMANTIC BEHAVIOR, DO NOT REMOVE COMPATIBILITY LAYERS WITHOUT TESTS AND RETIREMENT CRITERIA, DO NOT MARK ANY BACKLOG ITEM DONE WITHOUT CODE/TESTS/DOCS/VALIDATION EVIDENCE, AND DO NOT FINISH UNTIL BACKLOG, DOCS, GATES, COMPAT LAYERS, LEGACY STATUS, VALIDATION RESULTS AND REMAINING RISKS ARE FULLY RECONCILED AND DOCUMENTED.**

If any full validation command fails, investigate and classify the failure. Fix only failures caused by Waves 05–09 or by this wave. If a failure is pre-existing or unrelated, document it with evidence and link it to the correct backlog item or create a derived backlog entry only if it is a real, actionable gap.

---

# Master goal

Preserve the project master goal:

```txt
The plugin must discover and index very fast without blocking VS Code.
```

This wave must make the repository coherent, reviewable and safe for the next development cycle.

---

# Wave 10 intent

Wave 10 must close the stabilization loop after Waves 05–09.

It must:

```txt
1. Reconcile all active backlog states.
2. Confirm done-log contains only fully closed work.
3. Confirm current-focus and roadmap reflect the real next work.
4. Confirm architecture-status and implementation-map reflect the actual codebase.
5. Classify all gates as fail/report-only/nightly/release/local/blocked.
6. Classify all validation failures as caused-by-wave, pre-existing, environment, or known debt.
7. Verify no hot path regressions were introduced.
8. Verify compatibility layers and legacy paths have owners and retirement criteria.
9. Produce a final stabilization report.
10. Leave exact next steps with no ambiguity.
```

This wave must not implement new product features.

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
```

Read wave reports if present:

```txt
docs/audits/wave-05-semantic-tokens-and-readonly-envelope-report.md
docs/audits/wave-06-readonly-surfaces-object-explorer-sql-ai-ux-report.md
docs/audits/wave-07-datawindow-submodel-and-status-ownership-report.md
docs/audits/wave-08-runtime-metrics-10k-ci-gates-report.md
docs/audits/wave-09-scaffold-orchestrator-fitness-legacy-report.md
```

Inspect specs if needed for state reconciliation:

```txt
specs/**
```

---

# Source and tooling areas to inspect

Backlog/docs:

```txt
docs/backlog.md
docs/done-log.md
docs/current-focus.md
docs/roadmap.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/performance-budget.md
docs/release.md
docs/legacy-isolation.md
docs/audits/**
```

Architecture and gates:

```txt
tools/**
package.json
.github/workflows/**
test/server/unit/architectureImports.test.ts
test/server/unit/semanticArchitectureConformance.test.ts
test/server/unit/releaseReadinessContract.test.ts
test/server/unit/testingMatrixDocs.test.ts
test/server/performance/**
test/server/integration/**
test/smoke/**
```

Hot path and compatibility areas touched by Waves 05–09:

```txt
src/server/features/semanticTokens.ts
src/server/presentation/semanticTokenPresentation.ts
src/shared/publicApi.ts
src/client/objectExplorer.ts
src/client/objectExplorerModel.ts
src/client/aiTaskContextBundle.ts
src/server/features/embeddedSqlAnchors.ts
src/server/features/currentObjectContext.ts
src/server/features/dataWindow*.ts
src/server/runtime/**
src/server/indexer/**
src/server/handlers/**
src/client/extension.ts
plugin_old/**
```

Inspect only additional files needed to validate state, compatibility or gates.

---

# Non-goals

Do not implement:

```txt
new LSP providers
new semantic features
new DataWindow behavior
new SQL/native behavior
new Object Explorer features beyond validating current state
new AI bundle sections
new runtime scheduler behavior
new worker pool behavior
new corpus domains unless needed to fix broken generator tests from Wave 08
new architecture splits beyond fixing broken compatibility from Wave 09
```

Do not:

```txt
mark Partial items as Done without evidence
move work to done-log without validation
delete compatibility layers without tests and retirement criteria
weaken gates to get green
hide failing tests
create vague backlog entries
duplicate architecture text across docs
leave current-focus pointing at completed work
leave roadmap inconsistent with backlog
leave report-only gates without promotion criteria
```

---

# PHASE 0 — Baseline and artifact inventory

## Tasks

1. Read all required docs.
2. Inventory outputs from Waves 05–09.
3. Inventory current backlog active items, Done items and Partial items.
4. Inventory current docs owners and possible contradictions.
5. Inventory current gates/scripts/workflows.
6. Inventory compatibility layers and legacy paths.
7. Run quick baseline commands where feasible.

Try:

```bash
npm run build:test
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:architecture:metrics
npm run test:performance:gate
```

If a command does not exist or fails before running because of environment constraints, document it.

## Required output

Create or update:

```txt
docs/audits/wave-10-final-stabilization-release-readiness-report.md
```

Include:

```md
# Wave 10 — Final Stabilization, Backlog Reconciliation and Release Readiness Hardening

## PHASE 0 — Baseline and artifact inventory

### Docs reviewed
### Wave reports found
### Backlog inventory
### Done-log inventory
### Current-focus/roadmap inventory
### Gate/script/workflow inventory
### Compatibility/legacy inventory
### Baseline validation
### Initial risks
```

---

# PHASE 1 — Backlog and done-log reconciliation

## Goal

Ensure backlog, done-log, current-focus and roadmap represent one coherent truth.

## Tasks

Review all active and derived backlog items, especially:

```txt
1–26
46–48
any Wave 05–09 items marked Partial/Done/Open/Superseded/Open by conformance
any newly created derived items
```

For each relevant item, verify:

```txt
state is honest
Done has code/tests/docs/validation evidence
Partial has exact pending work
Superseded has target owner and evidence
Open by conformance has clear conformance gap
Blocked has blocker and unblock criteria
```

Rules:

```txt
Do not move an item to done-log unless fully closed.
Do not leave an item Partial without exact pending work.
Do not duplicate historical submodel items 46/47/48 if they were superseded by executable owners.
Do not keep closed items in active backlog.
```

## Required output

Update audit report:

```md
## PHASE 1 — Backlog and done-log reconciliation

### Items confirmed Done
### Items left Partial with exact pending work
### Items left Open
### Items marked Superseded
### Items marked Open by conformance
### Done-log updates
### Backlog contradictions fixed
### Remaining backlog risks
```

---

# PHASE 2 — Documentation single-source-of-truth alignment

## Goal

Remove contradictions and duplicated ownership across documentation.

## Owner rules

```txt
docs/backlog.md owns active state and execution order.
docs/done-log.md owns fully closed work.
docs/current-focus.md owns immediate current work.
docs/roadmap.md owns macro sequencing.
docs/architecture-status.md owns current implementation state.
docs/architecture-implementation-map.md owns module/owner mapping.
docs/testing.md owns validation strategy and test lanes.
docs/performance-budget.md owns budgets, metrics and gate policy.
docs/release.md owns release verification policy.
docs/legacy-isolation.md owns plugin_old/legacy/compat policy.
docs/instant-semantic-indexing-target.md owns future target architecture.
```

## Tasks

1. Check for duplicate state declarations.
2. Check for outdated references to completed waves.
3. Check for docs claiming features as complete without backlog evidence.
4. Check for target architecture text duplicated in status/backlog docs.
5. Update docs to use links and concise status summaries.

## Required output

Update audit report:

```md
## PHASE 2 — Documentation alignment

### Docs updated
### Duplications removed
### Contradictions fixed
### Source-of-truth ownership confirmed
### Remaining doc risks
```

---

# PHASE 3 — Gate classification and release readiness policy

## Goal

Classify every gate/script/workflow lane and document promotion criteria.

## Tasks

Inventory and classify commands such as:

```txt
npm run build:test
npm test
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:architecture:metrics
npm run test:performance:gate
npm run test:performance:payload
npm run test:performance:10k:smoke
npm run test:performance:10k:nightly
npm run test:performance:soak
npm run release:verify
```

For each available gate, classify as one of:

```txt
mandatory fail gate
report-only
nightly-only
release-only
local-only
blocked/unavailable
legacy/deprecated
```

For report-only gates, document:

```txt
owner
reason for report-only
promotion criteria
expected artifact path
expected thresholds or future threshold owner
```

For blocked gates, document:

```txt
blocker
owner
unblock criteria
fallback validation
```

## Required output

Update audit report:

```md
## PHASE 3 — Gate classification and release readiness policy

### Mandatory gates
### Report-only gates
### Nightly/optional gates
### Release-only gates
### Local-only gates
### Blocked gates
### Promotion criteria
### Scripts/workflows updated
```

---

# PHASE 4 — Full validation and failure classification

## Goal

Run the broad validation matrix and classify every failure honestly.

## Commands

Run where feasible:

```bash
npm run build:test
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:architecture:metrics
npm run test:performance:gate
npm run release:verify
npm test
```

If `release:verify` is too expensive/unavailable, run constituent scripts and document why.

## Failure classification

Every failure must be classified as:

```txt
caused by Wave 05–09
caused by Wave 10
pre-existing known debt
environment/setup issue
catalog/domain-specific unrelated failure
gate threshold instability
docs drift
architecture fitness violation
unknown, needs investigation
```

For each failure group, include:

```txt
command
failure summary
representative files/tests
evidence
classification
fix applied or backlog owner
```

Fix failures caused by Waves 05–10 before finishing.

## Required output

Update audit report:

```md
## PHASE 4 — Full validation and failure classification

### Commands executed
### Passing gates
### Failing gates
### Failure classification matrix
### Fixes applied
### Failures left as known debt
### Final validation state
```

---

# PHASE 5 — Hot path and source-of-truth regression audit

## Goal

Ensure Waves 05–09 did not reintroduce hot path or source-of-truth violations.

## Audit checklist

Verify no new violations in:

```txt
hover
completion
completion resolve
signature help
definition
references
rename
linked editing
diagnostics
semantic tokens
document symbols
workspace symbols
Object Explorer
Current Object Context
AI/support bundles
runtime status
```

Check specifically:

```txt
no full workspace scans in hot paths
no deep read-only reports triggered by cursor/typing paths
no Object Explorer flat manifest as only normal path if paged path exists
no SQL/DataWindow outputs without caps where touched
no SemanticQueryFacade bypass unless allowlisted/documented
no parallel semantic store
no cache truth confusion
cache keys include epoch/fingerprint/sourceOrigin/locale/projection where applicable
read-only surfaces have stale/degraded/caps receipts where touched
semantic tokens previousResultId/full fallback remains safe
```

## Required output

Update audit report:

```md
## PHASE 5 — Hot path and source-of-truth regression audit

### Providers checked
### Read-only surfaces checked
### Cache/source-of-truth checks
### Violations found
### Fixes applied
### Backlog entries created or updated
### Remaining risks
```

---

# PHASE 6 — Compatibility and legacy retirement verification

## Goal

Ensure compatibility layers and legacy paths have owners, criteria and gates.

## Tasks

Inventory:

```txt
compat re-exports from Waves 05–09
old public API barrels
old provider/handler paths
DataWindow compatibility facades
read-only projection compatibility wrappers
legacy safe mode paths
plugin_old/**
```

For each compatibility/legacy path, verify:

```txt
owner
reason
replacement
runtime import allowed yes/no
tests protecting compatibility
retirement criteria
retirement blocker
gate coverage
```

Rules:

```txt
Do not delete plugin_old.
Do not allow src/** runtime imports from plugin_old/**.
Do not remove compatibility layers without tests.
Do not leave compatibility layers undocumented.
```

## Required output

Update audit report:

```md
## PHASE 6 — Compatibility and legacy verification

### Compatibility layers found
### Legacy paths found
### Registry updates
### Gate coverage
### Retirement criteria
### Remaining risks
```

---

# PHASE 7 — Final stabilization documentation

## Goal

Create a concise final stabilization summary for the whole Waves 05–10 cycle.

## Required document

Create or update:

```txt
docs/audits/final-instant-semantic-runtime-stabilization-report.md
```

Include:

```md
# Final Instant Semantic Runtime Stabilization Report

## Scope
## Waves reviewed
## Items closed
## Items partial
## Items still open
## Superseded/historical items
## Gate status
## Validation summary
## Known failures and owners
## Compatibility/legacy status
## Hot path status
## Release readiness status
## Remaining risks
## Recommended next cycle
```

Do not duplicate every wave report. Link to wave reports and summarize.

---

# PHASE 8 — Documentation alignment and final backlog update

Update affected docs:

```txt
docs/backlog.md
docs/done-log.md
docs/current-focus.md
docs/roadmap.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/performance-budget.md
docs/release.md
docs/legacy-isolation.md
docs/troubleshooting.md
```

Rules:

```txt
Only update done-log for fully closed work.
Backlog must not contain closed active items.
Current-focus must point to the real next step.
Roadmap must reflect remaining sequence.
Architecture-status must reflect current implementation, not target wish.
Testing/release/performance docs must match actual scripts/gates.
Legacy-isolation must match actual registry/gates.
```

## Required output

Update audit report:

```md
## PHASE 8 — Documentation alignment and final backlog update

### Docs updated
### Backlog final state
### Done-log final state
### Current-focus final state
### Roadmap final state
### Remaining documentation risks
```

---

# PHASE 9 — Final self-review

Before finishing, re-read:

```txt
changed docs
changed tests
changed scripts/tools
docs/audits/wave-10-final-stabilization-release-readiness-report.md
docs/audits/final-instant-semantic-runtime-stabilization-report.md
docs/backlog.md
docs/done-log.md
docs/current-focus.md
docs/roadmap.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/testing.md
docs/performance-budget.md
docs/release.md
docs/legacy-isolation.md
```

Verify:

```txt
No new feature/refactor scope was introduced.
Backlog states are honest.
Done-log only includes fully closed work.
Partial items have exact pending work.
Superseded items have executable owners.
Gate classification is explicit.
Validation failures are classified.
Compatibility layers have retirement criteria.
plugin_old remains isolated.
Hot paths have no new full scans.
Docs have single-source-of-truth ownership.
Final stabilization report exists.
Next step is clear.
```

If any gap is found, fix or document before final response.

---

# Closing criteria

Wave 10 can be considered complete only if:

```txt
backlog/done-log/current-focus/roadmap are reconciled
docs ownership is consistent
gates are classified with promotion criteria
validation has been run and failures classified
failures caused by Waves 05–10 are fixed or explicitly blocked with owner
compat/legacy registry is verified
hot path regression audit is documented
final stabilization report exists
docs drift check passes or failures are classified with owner
```

Do not mark feature backlog items Done unless their own closing criteria are met.

---

# Final response

Only after all phases are complete, respond in Spanish with:

```md
## Resumen final — Wave 10 Final Stabilization

### Documentos actualizados

### Código/tests/scripts cambiados

### Backlog reconciliado

### Done-log/current-focus/roadmap

### Gate classification

### Validación ejecutada

### Fallos clasificados

### Hot path regression audit

### Compat/legacy verification

### Final stabilization report

### Estado final de release readiness

### Riesgos pendientes

### Siguiente paso recomendado
```

Do not provide partial summaries before the full wave is complete.
```
