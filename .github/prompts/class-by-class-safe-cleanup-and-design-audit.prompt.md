# Class-by-Class Safe Cleanup and Design Audit — Strict File-by-File Edition


Execute a complete, conservative TypeScript cleanup and design audit with two mandatory layers:

```txt
1. Critical orchestrator audit: extension.ts, server.ts, handlers and public API orchestration.
2. Strict class-by-class / file-by-file safe cleanup across the remaining relevant TypeScript source files.
```

This prompt is intentionally conservative. It must detect unnecessary code, initialization/lifecycle mistakes, responsibility leaks, bad boundaries, conceptual errors, safe local cleanup opportunities and future design improvements. It must not perform broad refactors.

---

# Absolute mandatory rule

**DO NOT STOP, DO NOT ASK QUESTIONS, DO NOT SKIP FILES, DO NOT REVIEW OR MODIFY MULTIPLE FILES AS A BATCH, DO NOT MAKE RISKY CHANGES, DO NOT CHANGE PUBLIC BEHAVIOR WITHOUT CLEAR EVIDENCE, DO NOT IMPLEMENT CROSS-CUTTING DESIGN REFACTORS IN THIS PROMPT, DO NOT WEAKEN TESTS OR GATES, AND DO NOT FINISH UNTIL EVERY RELEVANT SOURCE FILE HAS BEEN REVIEWED ONE BY ONE, SAFE FIXES HAVE BEEN APPLIED, EVERY FINDING HAS A SUGGESTED IMPROVEMENT, TARGETED VALIDATION FOR TOUCHED FILES HAS BEEN RUN, FULL VALIDATION IS GREEN, AND THE AUDIT REPORT HAS BEEN UPDATED.**

If any targeted validation fails because of this audit, fix it before continuing to the next file.

If any final validation command fails, do not finish. Fix every repository-fixable failure. Only strictly environmental/external failures may remain documented with exact evidence, fallback validation and owner.

---

# Master goal

Preserve the project master goal:

```txt
The plugin must discover and index very fast without blocking VS Code.
```

Every cleanup decision must protect:

```txt
VS Code responsiveness
LanguageClient lifecycle stability
server startup/shutdown correctness
hot-path latency
semantic source-of-truth correctness
public API compatibility
cache/index/persistence invariants
release readiness
```

---

# Authoritative best-practice context

Use repository docs first. Use external references only when a sensitive fix depends on framework/platform behavior.

Allowed external research is limited to 4-5 authoritative sources per issue:

```txt
VS Code lifecycle / activation:
- official VS Code Extension API docs
- official VS Code activation events docs

LanguageClient / LSP:
- official VS Code Language Server Extension Guide
- official LSP specification when protocol behavior matters

TypeScript:
- TypeScript Handbook
- typescript-eslint official rule docs

Node runtime/timers:
- official Node.js timers docs

GitHub Actions / CI:
- official GitHub Actions workflow syntax docs
```

Research must be documented in the file entry:

```md
**Best-practice/context checked:**
- Source/doc — why it mattered.
```

Do not use broad generic research to justify architecture rewrites.

---

# Mandatory documentation context pass

Before editing source files, read the relevant project documentation to understand architecture, goals, rules, performance constraints, semantic model, testing strategy and known technical debt.

At minimum, read these documents if present:

```txt
docs/constitution.md
docs/architecture.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/instant-semantic-indexing-target.md
docs/semantic-design-target.md
docs/semantic-design-assumptions.md
docs/symbol-system.md
docs/localization.md
docs/legacy-isolation.md
docs/performance-budget.md
docs/testing.md
docs/release.md
docs/troubleshooting.md
docs/current-focus.md
docs/backlog.md
docs/roadmap.md
docs/technical-debt-inventory.md
docs/rules-catalog.md
docs/spec-driven-development.md
docs/powerbuilder-2025-vscode-plugin-technical-guide.md
```

Also inspect if relevant:

```txt
docs/audits/**
docs/adr/**
docs/ai-context/**
docs/hover/**
docs/ai/**
.github/instructions/**
.github/skills/**
```

Documentation rules:

```txt
Use docs to understand architectural intent before changing code.
Do not duplicate long documentation content in the audit report.
If documentation contradicts code, document the contradiction as an unresolved inconsistency or design improvement.
If documentation is stale, document it as a documentation alignment issue.
```

---

# Output document

Create or update:

```txt
docs/audits/class-by-class-safe-cleanup-audit.md
```

Required structure:

```md
# Class-by-Class Safe Cleanup Audit

## Scope
## Documentation context reviewed
## Sensitive file inventory
## Critical orchestrator audit
## Methodology
## Global rules applied
## Summary
## Files reviewed
## Safe fixes applied
## Unresolved inconsistencies
## Design improvement proposals
## Follow-up backlog candidates
## Targeted validation by file
## Full validation
## Risks
## Recommended next step
```

---

# Non-negotiable final green test gate

At the end of this audit, **all repository tests and required validation gates must be green**.

Mandatory commands:

```bash
npm run build:test
npm test
npm run test:smoke
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
npm run release:verify
```

Also run if available:

```bash
npm run lint
npm run typecheck
npm run test:architecture:metrics
```

Mandatory behavior if any command fails:

```txt
1. Stop audit progression immediately.
2. Identify the exact failing test/check.
3. Determine whether it was caused by this audit.
4. If caused by this audit, fix it before continuing.
5. If pre-existing but reproducible and fixable in the repository, fix it before finishing.
6. If strictly environmental/external, document exact evidence, fallback validation and owner.
7. Rerun the targeted test that failed.
8. Rerun the full validation command that failed.
9. Continue only after the command is green or the exception is strictly environmental/external.
```

Strict exception policy:

```txt
Only strictly environmental/external failures may remain non-green, for example:
- DNS/network blocked while downloading VS Code test runtime.
- External service unavailable.
- Missing local OS dependency that cannot be installed by repository changes.
```

Pre-existing failing tests are not automatically accepted. If a pre-existing failure is reproducible and fixable in the repository, it must be fixed before the audit is considered complete.

---

# Scope

Review all relevant TypeScript files under:

```txt
src/
server/
client/
shared/
test/
tests/
```

Prioritize:

```txt
src/client/extension.ts
src/server/server.ts
src/server/handlers/**
src/shared/publicApi.ts
src/server/**
src/shared/**
src/client/**
```

Exclude generated artifacts unless they are imported directly by runtime code and clearly contain fixable non-generated issues.

Do not manually edit generated files unless repository rules explicitly allow it. If a generated file has issues, document the generator or generation pipeline that should be fixed instead.

---

# Phase 0 — Sensitive file inventory

Before reviewing files one by one:

```txt
1. Build a sensitive-file inventory.
2. Classify files by risk.
3. Identify owner docs.
4. Identify direct or nearest tests.
5. Identify whether external best-practice research is needed.
```

Create in the audit report:

```md
## Sensitive file inventory

| File | Category | Risk | Owner docs | Targeted tests | Research needed |
| --- | --- | --- | --- | --- | --- |
```

Risk categories:

```txt
Lifecycle
Critical orchestrator
Public API/protocol
Semantic source-of-truth
Hot-path provider
Cache/indexing/persistence
Runtime/concurrency
DataWindow/SQL/native submodel
CI/release/performance
Normal utility
Test-only
Generated
```

Do not modify critical lifecycle or public protocol files until this inventory exists.

---

# Phase 1 — Critical orchestrator audit before general cleanup

Before ordinary class-by-class cleanup, perform a dedicated exhaustive audit of these critical orchestrator files:

```txt
src/client/extension.ts
src/server/server.ts
src/server/handlers/featureHandlers.ts
src/server/handlers/runtimeCommandHandlers.ts
src/server/handlers/reportCommandHandlers.ts
src/server/handlers/documentHandlers.ts
src/shared/publicApi.ts
```

Optional adjacent files may be inspected only if directly needed:

```txt
src/client/objectExplorer.ts
src/client/currentObjectContextPanel.ts
src/client/diagnosticsExplainabilityPanel.ts
src/client/readOnlyProjectionState.ts
src/server/serving/interactiveServingPipeline.ts
src/server/runtime/interactiveServingStats.ts
src/server/runtime/performanceEvents.ts
src/server/runtime/scheduler.ts
src/server/indexer/workerPool.ts
```

## Critical orchestrator mandatory rules

```txt
DO NOT refactor these files broadly.
DO NOT split orchestrators in this prompt unless the move is tiny, safe, locally reversible and fully tested.
DO NOT change command IDs.
DO NOT change activation events unless explicitly required by a failing test or documented best-practice issue and fully validated.
DO NOT change public API shape unless additive, explicitly safe and fully validated.
DO NOT hide lifecycle/smoke failures.
DO NOT weaken release gates.
DO NOT move code just to make the file smaller.
DO NOT create new architectural layers unless the repository already has the target layer and the move is tiny.
```

## Critical orchestrator audit goals

For each critical orchestrator file, determine:

```txt
1. Current responsibilities.
2. Whether each responsibility still belongs there.
3. Duplicate routing, duplicate command handling or duplicate lifecycle logic.
4. Whether runtime behavior can block VS Code or slow activation/startup.
5. Unsafe lifecycle/concurrency patterns.
6. Direct bypasses of safe helpers/facades.
7. Whether payloads/read-only surfaces are bounded/capped and expose receipts.
8. Legacy or compatibility paths without owners/retirement criteria.
9. Whether resources initialize and dispose correctly.
10. Whether a safe local fix is possible now.
11. Whether a design improvement proposal is required instead.
12. Whether the file should be slimmed down later, and exactly how.
```

## Required critical orchestrator entry

```md
### Critical orchestrator audit — src/path/file.ts

**Current responsibilities:**
- ...

**Initialization and disposal review:**
- ...

**Responsibilities that still belong here:**
- ...

**Responsibilities that should move later:**
- ...

**Potential unnecessary, obsolete or duplicated code:**
- ...

**Lifecycle/concurrency risks:**
- ...

**Public API/protocol risks:**
- ...

**Hot-path/performance risks:**
- ...

**Payload/cap/receipt risks:**
- ...

**Legacy/compatibility risks:**
- ...

**Safe fixes applied now:**
- ...

**Not fixed because unsafe/cross-cutting:**
- ...

**Suggested improvements:**
- ...

**Recommended future split or slimming plan:**
- ...

**Best-practice/context checked:**
- ...

**Targeted validation:**
- ...
```

## Special exhaustive audit for `src/client/extension.ts`

Review all of the following:

```txt
package.json activation and contribution entries
activate() and deactivate()
ensureHostInitialized()
LanguageClient creation/start/stop/restart
client global state and lifecycle ownership
startup failure handling
restart command behavior
status refresh timers and stale generations
context.subscriptions cleanup
output channel/status bar lifecycle
all direct client.sendRequest calls
executeServerCommand behavior
public API command wrappers
panel/view/controller registration
read-only tool bridges
support bundle/report commands
PBAutoBuild/ORCA/tooling command ownership
smoke/release impact
```

Mandatory questions:

```txt
Is there a single owner of the LanguageClient lifecycle?
Are start/stop/restart idempotent and race-safe?
Can executeServerCommand call client.start() on an already disposed instance?
Is the global client reference cleared before async dispose awaits?
Can startClient failure clean up a newer client by mistake?
Can timers call the server after deactivate/restart starts?
Do any commands bypass executeServerCommand or a safe request helper?
Are async cleanup operations launched with void and not awaited?
Is activation lazy and scoped to actual extension needs?
Does extension.ts own too many responsibilities?
Which responsibilities can be moved later to client/lifecycle, client/commands, client/views and client/api?
```

Mandatory findings if detected:

```txt
client.start() inside a generic command helper
client global visible during async dispose
startClient assigning client before start completes without identity-safe cleanup
stopClient not idempotent
restart not serialized
async stop launched with void from dispose
status refresh after stale generation
direct sendRequest bypassing safe helper
activation events too broad without documented need
heavy initialization in activate without deferral
```

Allowed safe fixes in `extension.ts`:

```txt
remove unused imports
convert type-only imports
clear stale timers safely
route direct server commands through an existing safe helper
add defensive lifecycle guards when tests prove behavior
make tiny identity-safe cleanup changes if directly tied to a failing lifecycle test
fix misleading comments
```

Forbidden in `extension.ts` during this prompt:

```txt
broad split of extension.ts
renaming commands
changing package contributions
changing public API shape
creating a new LanguageClient per command
swallowing lifecycle errors silently
suppressing smoke failures
moving whole feature groups without a dedicated Wave 09-style prompt
```

Required validation after touching `extension.ts`:

```bash
npm run build:test
npm test
npm run test:smoke
npm run release:verify
```

If any fail, stop until fixed or classified as strictly environmental/external with exact evidence.

## Special exhaustive audit for `src/server/server.ts`

Review:

```txt
server initialization sequence
connection lifecycle
workspace/indexer startup ownership
knowledge base/runtime/scheduler ownership
worker/indexer wiring
feature registration ownership
handler registration ownership
runtime status and metrics wiring
shutdown/dispose hooks
global singleton ownership
heavy startup work
error handling during initialization
```

Mandatory questions:

```txt
Does server.ts only compose, or does it implement business logic?
Are workspace/indexer/runtime owners clear?
Are all resources disposed or closed?
Are startup tasks bounded or deferred when possible?
Are handlers too tightly coupled to concrete internals?
Is any mutable global state exposed without owner?
Does runtime metrics/status wiring have a single source of truth?
Can initialization order create stale or partially initialized services?
```

Safe fixes are limited to:

```txt
obvious import/type cleanup
small defensive guards
small ownership comments when documentation is stale
removing dead local variables
routing through an existing owner when clearly safe and tested
```

All split/reorganization ideas must be documented as proposals unless the move is tiny and fully validated.

## Special exhaustive audit for handlers

Files:

```txt
src/server/handlers/featureHandlers.ts
src/server/handlers/runtimeCommandHandlers.ts
src/server/handlers/reportCommandHandlers.ts
src/server/handlers/documentHandlers.ts
```

Review:

```txt
command routing ownership
business logic inside handlers
provider registration boundaries
document open/change/close lifecycle
runtime command payloads
report command payloads
read-only projection caps/receipts
error handling and fallback behavior
public API DTO compatibility
full scans in command paths
semantic/query facade boundaries
```

Mandatory questions:

```txt
Does each handler only route/coordinate, or does it implement heavy logic?
Are commands bounded and cancellable where appropriate?
Are payloads capped and do they expose receipts when truncated/degraded?
Are report builders separated from command routing?
Are canonical codes separated from rendered prose?
Are handlers bypassing SemanticQueryFacade or source-of-truth owners?
Are duplicate command registrations possible?
Are document lifecycle events idempotent and generation-safe?
```

Safe fixes:

```txt
obvious import/type cleanup
small defensive checks
route through existing helper/facade if already present and tested
fix duplicated local output if clearly invalid
add missing bounded receipt only if additive and tested
```

Unsafe in this prompt:

```txt
moving whole command groups
changing command IDs
changing public payload shapes in a breaking way
rewriting provider registration
changing document lifecycle semantics without dedicated tests
```

## Critical orchestrator improvement proposals

For every critical orchestrator file, create at least one outcome:

```txt
A. No issue found — explain why current ownership is acceptable.
B. Safe fix applied — include validation.
C. Design improvement proposal — include migration strategy and tests.
D. Backlog candidate — include acceptance criteria.
```

Every proposal must answer:

```txt
What should move?
Where should it move?
Why not now?
What tests are required?
What risk does it reduce?
What is the smallest safe migration slice?
```

Suggested proposals if detected:

```txt
PB-DESIGN-IMPROVEMENT-025 — LanguageClient lifecycle owner and testable lifecycle controller
PB-DESIGN-IMPROVEMENT-026 — Split VS Code extension orchestrator into lifecycle/commands/views/api modules
PB-DESIGN-IMPROVEMENT-028 — Extract server composition root from business/runtime wiring
PB-DESIGN-IMPROVEMENT-029 — Split featureHandlers into provider registration modules by capability
PB-DESIGN-IMPROVEMENT-030 — Split runtime command handlers into command router and bounded projection builders
PB-DESIGN-IMPROVEMENT-031 — Split report command handlers into router, schema DTOs and renderers
PB-DESIGN-IMPROVEMENT-032 — Document documentHandlers lifecycle state machine and generation safety
```

## Critical orchestrator validation gate

After the critical orchestrator audit phase, run at minimum:

```bash
npm run build:test
npm test
npm run test:smoke
npm run test:docs:drift
npm run test:architecture:rapid
npm run release:verify
```

Do not proceed to ordinary class-by-class cleanup unless this phase is green or any remaining failure is strictly environmental/external with exact evidence.

---

# Phase 2 — Strict class-by-class cleanup for remaining files

Process files one by one.

For every file:

```txt
1. Read relevant documentation context first.
2. Open and read the full file.
3. Understand its responsibility.
4. Classify risk category.
5. If sensitive, write the pre-change decision before editing.
6. Check imports and exported API.
7. Check whether the file is hot path, provider, service, model, test, generated or utility.
8. Apply only safe fixes.
9. If uncertain but likely fixable, inspect up to 2–3 directly related files or authoritative sources.
10. If confirmed safe, apply the fix.
11. If not confirmed safe, document issue and suggested improvement; do not modify.
12. Run targeted validation for the touched file.
13. Update the audit report.
14. Continue with the next file only after targeted validation is green or issue is documented as unrelated/pre-existing.
```

Do not summarize directories. Every relevant file must have its own entry.

---

# Safe fixes allowed

Apply only low-risk, behavior-preserving fixes:

```txt
remove unused imports
convert imports to type-only imports when clearly safe
remove unused local variables
replace inline import('../path').Type with normal type imports
fix obviously stale comments
convert clearly runtime/API-facing Spanish strings to English when not localized
fix obvious formatting inconsistencies
add missing defensive null/undefined checks when behavior remains equivalent
deduplicate obviously duplicated local output when very safe
sort output arrays when order is already semantically irrelevant and improves determinism
deduplicate WorkspaceEdit/TextEdit/reference outputs when duplicate ranges are clearly invalid
rename local variables for clarity only if no public API changes
replace direct "as any" only if the correct local type is obvious and compiles
replace any with unknown only when local narrowing is obvious and validated
remove comments that are stale, misleading or provisional
replace provisional comments with clear intent comments
```

Do not apply a safe fix if it risks changing runtime behavior.

---

# No speculative fixes

Do not apply fixes only because they look cleaner.

A fix is allowed only if at least one is true:

```txt
compiler error proves it
failing test proves it
existing project documentation requires it
official platform behavior requires it
local code contract makes it obviously safe
the change is purely type-only/import cleanup
```

If none is true, document the issue as a finding or design improvement proposal instead of changing code.

---

# Limited contextual investigation rule

Allowed contextual investigation:

```txt
maximum 2–3 directly related files/classes per issue
only files directly imported by the current file
only files that define the exact type/function/contract involved
only files needed to confirm whether a repair is safe
```

If a fix remains uncertain after this, do not modify. Document the issue and suggested improvement.

---

# Things to check in every file

Inspect:

```txt
unused imports
unused variables
runtime imports that can be type-only
inline import('../path').Type
Spanish runtime/API strings outside localization
dead code
duplicated helpers
overly broad as any
unsafe casts
ambiguous naming
misleading comments
TODO/FIXME without backlog reference
legacy imports
old architecture dependencies
duplicate source of truth
localized strings in canonical code
manual string matching of semantic concepts
weak cache keys
hot-path allocations
linear scans in hot paths
full workspace scans in providers
unbounded loops in providers
missing defensive checks around external inputs
possible stale resolve data
possible duplicate edits or duplicate results
inconsistent sorting/deduplication
ambiguous fallback behavior
functions doing too many responsibilities
providers bypassing SemanticQueryFacade
runtime code depending on legacy/generated mixed files
duplicated PowerBuilder identifier regexes
duplicated report/schema constants
diagnostic codes as magic strings
semantic token legends duplicated manually
API report messages mixed with canonical codes
lifecycle races in VS Code extension code
global mutable state exposed during async dispose
start/stop/restart without serialization
async cleanup launched with void
timers firing after deactivate/restart
direct LanguageClient sendRequest bypassing safe helper
public command wrappers that restart disposed resources
```

---

# Specific repository patterns to pay attention to

```txt
Entity.scope values such as Argumento, Instancia, Compartida
documentFingerprint fields that actually hold semanticEpoch
kbVersion values used as semanticEpoch
cacheToken values that are only identifier-based
createSemanticQueryFacade called inside hot-path providers
duplicate line/token probing in hover providers
duplicate reference edits in rename providers
regex-based PowerBuilder identifier parsing duplicated across files
DataWindow-specific behavior mixed into generic providers
semantic tokens resolving target per identifier
semantic token TYPE_INDEX/MODIFIER_MASK manually duplicated from legends
schemaVersion constants repeated across report builders
Date.now vs ISO generatedAt inconsistencies
requested URI vs effective document URI not validated in API reports
query raw vs normalized query ambiguity
cost metrics computed from truncated arrays
diagnostic code mappings duplicated as string literals
PowerBuilder file extension to object kind mapping duplicated locally
symbolId vs normalized lookup key confusion
Mermaid graph escaping duplicated or weak
executeServerCommand calling client.start directly
stopClient clearing global client after dispose instead of before
startClient assigning global client before start completes without identity-safe cleanup
startClient catch calling global stopClient
inspectHierarchy or other commands bypassing executeServerCommand
scheduleStatusRefresh calling server after stale client generation
context.subscriptions disposable launching async stopClient with void
LanguageClient lifecycle operations without lock/generation guard
runtime metrics success without cacheOutcome being projected as miss
stale-discarded being treated as cancelled without evidence
PerformanceEvent and legacy stats double-counting risk
```

Important:

```txt
Do not normalize Entity.scope Spanish values yet unless the whole model and tests are updated.
Do not rename protocol fields like documentFingerprint unless the protocol and tests are updated.
Do not remove createSemanticQueryFacade from hot paths unless a safe shared facade already exists.
Do not change cache key semantics without tests.
Do not change public API schemas without explicit evidence and tests.
Do not change semantic token legend order without tests.
Do not change generatedAt type without checking publicApi.ts and consumers.
Do not change LanguageClient lifecycle without smoke/release validation.
```

---

# Language policy

Spanish technical comments may remain if clear, internal and not part of runtime/API/user-facing output.

Flag or fix Spanish when it appears in:

```txt
canonical semantic values
runtime reason strings
API reports
public/developer-facing output
diagnostic messages not routed through localization
generated canonical knowledge
symbol records
protocol values
schema fields
user-facing text outside localization
technical docs intended to be English
```

Do not blindly treat every Spanish technical comment as a defect.

---

# Finding format with mandatory suggested improvement

Every unresolved finding must include a suggested improvement.

Use this format:

```md
#### Finding — Short title

**Type:**  
safe-fix-deferred / unresolved-inconsistency / design-improvement / backlog-candidate

**File:**  
src/path/file.ts

**Problem:**  
Concrete and observable problem.

**Evidence:**  
- code location / test / doc contradiction / best-practice source

**Why not fixed now:**  
Explain why the change is not safe in this file-by-file audit.

**Suggested improvement:**  
Concrete recommended improvement.

**Migration strategy:**  
Smallest safe next steps.

**Tests required:**  
Targeted tests needed before implementation.

**Risk:**  
Low / Medium / High

**Priority:**  
P0 / P1 / P2
```

Do not leave vague findings such as `needs refactor`, `bad design` or `maybe slow`.

---

# Design improvement proposals

Document cross-cutting improvements under:

```md
## Design improvement proposals
```

Use this format:

```md
### PB-DESIGN-IMPROVEMENT-XXX — Title

**Problem:**  
...

**Examples detected:**  
- ...

**Affected files/modules:**  
- ...

**Why not fixed locally:**  
...

**Recommended design:**  
...

**Migration strategy:**  
...

**Tests required:**  
...

**Priority:**  
P0/P1/P2

**Risk:**  
Low/Medium/High
```

Expected proposals when detected:

```txt
PB-DESIGN-IMPROVEMENT-001 — Normalize canonical Entity scope values
PB-DESIGN-IMPROVEMENT-002 — Split semanticEpoch/documentFingerprint/kbVersion contracts
PB-DESIGN-IMPROVEMENT-003 — Centralize PowerBuilder identifier rules
PB-DESIGN-IMPROVEMENT-004 — Create provider runtime context with shared SemanticQueryFacade
PB-DESIGN-IMPROVEMENT-005 — Introduce typed provider/report reason codes and localization boundary
PB-DESIGN-IMPROVEMENT-006 — Formalize DataWindow as a submodel/facade
PB-DESIGN-IMPROVEMENT-007 — Standardize WorkspaceEdit dedupe/sort utilities
PB-DESIGN-IMPROVEMENT-013 — Typed public API report messages
PB-DESIGN-IMPROVEMENT-019 — Shared diagnostic code catalog
PB-DESIGN-IMPROVEMENT-021 — Shared PowerBuilder object kind/file extension catalog
PB-DESIGN-IMPROVEMENT-022 — Semantic tokens should be fact/index driven
PB-DESIGN-IMPROVEMENT-025 — LanguageClient lifecycle owner and testable lifecycle controller
PB-DESIGN-IMPROVEMENT-026 — Split VS Code extension orchestrator into lifecycle/commands/views/api modules
PB-DESIGN-IMPROVEMENT-027 — Runtime metrics event ownership and double-count prevention
PB-DESIGN-IMPROVEMENT-028 — Extract server composition root from business/runtime wiring
PB-DESIGN-IMPROVEMENT-029 — Split featureHandlers into provider registration modules by capability
PB-DESIGN-IMPROVEMENT-030 — Split runtime command handlers into command router and bounded projection builders
PB-DESIGN-IMPROVEMENT-031 — Split report command handlers into router, schema DTOs and renderers
PB-DESIGN-IMPROVEMENT-032 — Document documentHandlers lifecycle state machine and generation safety
```

Add new proposals if more are discovered.

---

# Backlog candidate format

When unresolved work requires future implementation, add it under:

```md
## Follow-up backlog candidates
```

Use:

```md
### PB-CLEANUP-BACKLOG-001 — Title

**Problem:**  
...

**Affected files:**  
...

**Recommended fix:**  
...

**Risk:**  
...

**Acceptance criteria:**  
...
```

---

# Required file entry format

For every reviewed file:

```md
### src/path/to/file.ts

**Summary:**  
Maximum 3–4 lines.

**Risk category:**  
Lifecycle / Critical orchestrator / Public API / Protocol / Semantic source-of-truth / Hot-path provider / Runtime-concurrency / CI-release / Normal utility / Test-only / Generated.

**Documentation context used:**
- docs/path.md — why it mattered.

**Best-practice/context checked:**
- Source/doc — why it mattered.
- None required.

**Safe fixes applied:**
- ...

**Unresolved inconsistencies not fixed:**
- ...

**Design improvement candidates:**
- ...

**Reason for not fixing some items:**
- ...

**Context inspected:**
- src/path/related-file.ts — reason inspected.
- None.

**Targeted validation:**
- command — result.
```

Summaries must be maximum 3–4 lines. Findings must be actionable.

---

# Final self-review

Before finishing, re-read the audit report and verify:

```txt
every relevant file has an entry
critical orchestrators have exhaustive entries
summaries are max 3–4 lines
documentation context reviewed is documented
sensitive file inventory exists
pre-change decisions exist for touched sensitive files
safe fixes are separated from unresolved inconsistencies
every unresolved finding includes suggested improvement
limited investigation did not exceed 2–3 related files/sources per issue
targeted validation is documented for every touched file
all runtime/API Spanish text found is fixed or documented
technical Spanish comments were not blindly treated as defects
all as any occurrences are fixed or documented
all legacy dependencies found are fixed or documented
all hot-path concerns are fixed or documented
all lifecycle/concurrency concerns are fixed or documented
all orchestrator slimming proposals are actionable
all targeted and full validation commands run are documented
final full validation is green
no repository-fixable failing test remains red
no risky changes were made silently
no generated files were manually edited without justification
```

If any gap is found, continue auditing before final response.

---

# Final response

Only after completing the full audit and validation, respond in Spanish with:

```md
## Resumen final — Class-by-Class Safe Cleanup + Critical Orchestrator Audit

### Documento generado

### Documentación revisada

### Critical orchestrators auditados

### Archivos revisados

### Reparaciones seguras aplicadas

### Contexto adicional inspeccionado

### Inconsistencias no reparadas

### Design improvement proposals creadas

### Backlog candidates creados

### Adelgazamiento/reorganización propuesta para extension.ts/server.ts/handlers

### Validación targeted ejecutada

### Validación completa ejecutada

### Evidencia de todos los tests en verde

### Excepciones estrictamente ambientales, si existen

### Estado final de tests

### Riesgos pendientes

### Siguiente paso recomendado
```

Do not provide partial summaries before the full audit is complete.
```
