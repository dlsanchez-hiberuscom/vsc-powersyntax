# Class-by-Class Safe Cleanup and Design Audit

Execute a complete class-by-class and file-by-file cleanup audit across the TypeScript source code.

The goal is to inspect every relevant source file one by one, apply only safe repairs, read the relevant project documentation to understand the full architectural context, run targeted validation for each touched class/file, and document every reviewed file with a short summary, safe fixes, unresolved inconsistencies and cross-cutting design improvement proposals.

---

# Absolute mandatory rule

**DO NOT STOP, DO NOT SKIP FILES, DO NOT MAKE RISKY CHANGES, DO NOT CHANGE PUBLIC BEHAVIOR WITHOUT CLEAR EVIDENCE, DO NOT IMPLEMENT CROSS-CUTTING DESIGN REFACTORS IN THIS PROMPT, AND DO NOT FINISH UNTIL EVERY RELEVANT SOURCE FILE HAS BEEN REVIEWED, SAFE FIXES HAVE BEEN APPLIED, DESIGN ISSUES HAVE BEEN DOCUMENTED, TARGETED TESTS FOR TOUCHED FILES HAVE BEEN RUN, THE FULL TEST SUITE HAS BEEN RUN, ALL TESTS ARE GREEN, AND THE AUDIT REPORT HAS BEEN UPDATED.**

If the full test suite is not green, do not finish. Investigate the failures, fix all failures, rerun targeted tests and the full suite.

---

# Mandatory documentation context pass

Before editing any source file, read the relevant project documentation to understand the repository architecture, current goals, rules, performance constraints, semantic model, testing strategy and known technical debt.

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
docs/troubleshooting.md
docs/current-focus.md
docs/backlog.md
docs/roadmap.md
docs/technical-debt-inventory.md
docs/rules-catalog.md
docs/spec-driven-development.md
docs/powerbuilder-2025-vscode-plugin-technical-guide.md
```

Also inspect relevant folders when needed:

```txt
docs/audits/**
docs/adr/**
docs/ai-context/**
docs/hover/**
docs/ai/**
```

Documentation reading rules:

```txt
Use docs to understand architectural intent before changing code.
Do not duplicate documentation content in the audit report.
Summarize only the relevant context that influenced cleanup decisions.
If documentation contradicts code, document the contradiction as an unresolved inconsistency or design improvement.
If documentation is stale, document it as a documentation alignment issue.
```

The audit report must include:

```md
## Documentation context reviewed

- docs/path.md — short reason it was relevant.
```

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
src/server/**
src/shared/**
src/client/**
```

Exclude generated artifacts unless they are imported directly by runtime code and clearly contain fixable non-generated issues.

Do not manually edit generated files unless repository rules explicitly allow it.

If a generated file has issues, document the generator or generation pipeline that should be fixed instead.

---

# Output document

Create or update:

```txt
docs/audits/class-by-class-safe-cleanup-audit.md
```

The document must include:

```md
# Class-by-Class Safe Cleanup Audit

## Scope

## Documentation context reviewed

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

For every reviewed file, add an entry:

```md
### src/path/to/file.ts

**Summary:**  
Maximum 3–4 lines explaining what this file/class/module does.

**Documentation context used:**
- docs/path.md — why it mattered for this file.

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

**Targeted validation:**
- command — result.
```

If no extra context was needed:

```md
**Context inspected:**
- None.
```

If no targeted test exists for the file:

```md
**Targeted validation:**
- No direct targeted test found. Ran the closest relevant test: `...`.
```

If there are no safe fixes:

```md
**Safe fixes applied:**
- None.

**Unresolved inconsistencies not fixed:**
- None detected.

**Design improvement candidates:**
- None detected.
```

---

# Language policy

Technical comments in Spanish may remain if they are clear, internal, and not part of runtime/API/user-facing output.

Do not treat every Spanish technical comment as a defect.

Spanish comments may remain when they are:

```txt
internal implementation notes
developer explanations
temporary local reasoning that is still useful
clear technical comments not exposed to users/API
```

However, Spanish must be flagged or fixed when it appears in:

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

Allowed Spanish localization examples:

```txt
localization/es/**
*.es.generated.*
*.es.manual.*
LocalizedDocumentationOverlay(locale: "es")
Spanish UI strings explicitly marked as Spanish localization
Spanish diagnostic messages explicitly routed through localization
```

---

# Safe fixes allowed

Apply only low-risk, behavior-preserving fixes.

Allowed safe fixes:

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
remove comments that are stale, misleading or provisional
replace provisional comments with clear intent comments
```

Do not apply a safe fix if it risks changing runtime behavior.

---

# Limited contextual investigation rule

When a file contains an issue that is probably fixable but requires limited context, the AI may inspect a small number of related files before deciding.

Allowed contextual investigation:

```txt
maximum 2–3 directly related files/classes per issue
only files directly imported by the current file
only files that define the exact type/function/contract involved
only files needed to confirm whether a repair is safe
```

Examples of allowed limited investigation:

```txt
Check hoverViewModel.ts to understand buildUserHoverViewModel parameter types.
Check semanticQueryResult.ts to understand result.confidence.level type.
Check KnowledgeBase.ts only if a method return type is unclear.
Check publicApi.ts only if a report schema field is unclear.
Check SystemCatalog.ts only if a catalog lookup contract is unclear.
```

Not allowed:

```txt
Do not explore the whole project to justify one local fix.
Do not redesign an architecture from one class.
Do not follow long dependency chains.
Do not inspect more than 2–3 files for one issue.
Do not modify those related files unless they also become part of the current reviewed file list and the fix is safe.
```

Decision rule after limited investigation:

```txt
If the fix is confirmed safe:
  apply it and document the related files inspected.

If still uncertain:
  do not modify; document the issue as unresolved and/or design improvement.

If the issue requires cross-cutting migration:
  do not modify; create a design improvement proposal.
```

---

# Targeted test rule per touched file/class

After modifying a file/class, run the most relevant targeted validation for that file before moving to the next file.

Targeted validation selection order:

```txt
1. Direct unit test for the file/class, if present.
2. Closest provider/service/model test covering that file.
3. Relevant smoke/integration test for the feature area.
4. TypeScript compile/typecheck if no direct test exists.
5. A repository test command with a grep/filter/pattern if supported.
```

Examples:

```txt
If editing hover provider code, run hover-related tests first.
If editing rename provider code, run rename/reference tests first.
If editing completion provider code, run completion/resolve tests first.
If editing semantic tokens, run semantic token tests first.
If editing API/report builders, run report/API tests first.
If editing diagnostics, run diagnostics tests first.
If editing DataWindow logic, run DataWindow-specific tests first.
```

Document targeted validation per file:

```md
**Targeted validation:**
- `npm test -- --grep hover` — passed.
- `npm run build:test` — passed.
```

If no targeted test is available, document that clearly and run the closest safe validation.

Do not continue with broad cleanup if a targeted test for a touched file fails due to the current changes. Fix the issue first or revert the unsafe change.

---

# Final full-suite validation rule

After all reviewed files are processed and targeted validations are green, run the full validation suite.

At minimum run:

```bash
npm run build:test
npm test
```

Also run these if available:

```bash
npm run lint
npm run typecheck
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
```

The final state must be green: all tests are green.

If any command fails:

```txt
Investigate whether the failure is related to the cleanup.
If related, fix it and rerun targeted + full validation.
If unrelated/pre-existing, document evidence and do not claim full green unless the repository already treats that failure as accepted.
```

The final report must include:

```md
## Full validation

| Command | Result | Notes |
| --- | --- | --- |
| npm run build:test | passed/failed | ... |
| npm test | passed/failed | ... |
```

Do not finish with uninvestigated red tests.

---

# Things to check in every file

For each file, inspect:

```txt
unused imports
unused variables
runtime imports that can be type-only
inline import('../path').Type
Spanish runtime/API strings outside localization
dead code
duplicated helpers
overly broad "as any"
unsafe casts
ambiguous naming
misleading comments
temporary comments
TODO/FIXME without backlog reference
legacy imports
old architecture dependencies
duplicate source of truth
localized strings in canonical code
canonical/semantic values in Spanish
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
```

---

# Specific patterns already detected

Pay special attention to these repository patterns:

```txt
imports from localization modules where only DocumentationLocale is used
unused PbSystemSymbolEntry imports
inline import('../knowledge/types').Entity
technical/runtime Spanish strings in hover/rename/report providers
comments like "Simplificación"
hardcoded reason strings in Spanish
Entity.scope values such as "Argumento", "Instancia", "Compartida"
documentFingerprint fields that actually hold semanticEpoch
kbVersion values used as semanticEpoch
cacheToken values that are only identifier-based
createSemanticQueryFacade called inside hot-path providers
duplicate line/token probing in hover providers
duplicate reference edits in rename providers
missing sorting/deduplication in WorkspaceEdit generation
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
integration type sets duplicated locally
PowerBuilder file extension to object kind mapping duplicated locally
symbolId vs normalized lookup key confusion
Mermaid graph escaping duplicated or weak
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
```

For those, document as unresolved inconsistencies or design improvement proposals.

---

# Repair policy

Use this decision matrix:

```txt
If clearly safe and behavior-preserving:
  apply the fix.

If probably safe but not fully certain:
  inspect up to 2–3 directly related files.
  if confirmed safe, apply.
  otherwise document and do not modify.

If it requires an architectural decision:
  do not modify; document as design improvement.

If it requires changing tests/snapshots:
  only modify if the behavior is obviously wrong and the tests can be updated safely.

If it touches generated files:
  do not modify generated output directly unless repository rules allow it; document generator change needed.

If it changes public API, exported types, wire protocols, persisted data, resolve data, command IDs, semantic token legend order or test fixtures:
  do not modify unless explicitly safe and fully validated.
```

---

# Design improvement proposals

While reviewing each file, also detect design improvements that cannot be safely implemented in a single class/file.

Do not implement those design improvements in this prompt unless they are trivially safe.

Document them under:

```md
## Design improvement proposals
```

For each proposal use:

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

Focus especially on these cross-cutting issues:

```txt
canonical semantic values expressed as localized Spanish strings
Entity.scope values such as Argumento, Instancia, Compartida
documentFingerprint used for semanticEpoch
kbVersion used as semanticEpoch
provider hot paths creating SemanticQueryFacade
duplicated hover/completion/semantic-token token probing
weak cacheToken/cache key design
hardcoded runtime reason strings instead of typed reason codes
DataWindow logic scattered across generic providers
duplicated PowerBuilder identifier regexes
unsafe or broad "as any" casts crossing semantic/presentation boundaries
rename/reference WorkspaceEdit dedupe/sort logic
dependency graph symbol ID vs lookup key confusion
Mermaid graph generation duplicated or weakly escaped
ambiguous graph edge direction semantics
generated/localized/canonical knowledge ownership mixing
semantic token legends and masks duplicated manually
semantic tokens resolving per identifier instead of using facts/indexes
diagnostic code mappings duplicated locally
integration type catalogs duplicated locally
PowerBuilder file extension/object kind mappings duplicated locally
public API reports mixing codes and rendered prose
public API request normalization inconsistencies
requested URI vs effective document URI validation gaps
shared report schema/version/generatedAt conventions
report cost models based on truncated displayed arrays
```

---

# Expected design improvement examples

Create backlog candidates when these are detected:

```txt
PB-DESIGN-IMPROVEMENT-001 — Normalize canonical Entity scope values
PB-DESIGN-IMPROVEMENT-002 — Split semanticEpoch/documentFingerprint/kbVersion contracts
PB-DESIGN-IMPROVEMENT-003 — Centralize PowerBuilder identifier rules
PB-DESIGN-IMPROVEMENT-004 — Create provider runtime context with shared SemanticQueryFacade
PB-DESIGN-IMPROVEMENT-005 — Introduce typed provider/report reason codes and localization boundary
PB-DESIGN-IMPROVEMENT-006 — Formalize DataWindow as a submodel/facade
PB-DESIGN-IMPROVEMENT-007 — Standardize WorkspaceEdit dedupe/sort utilities
PB-DESIGN-IMPROVEMENT-008 — Map semantic confidence to presentation confidence explicitly
PB-DESIGN-IMPROVEMENT-009 — Standardize hover/completion/references/semantic-token probe extraction
PB-DESIGN-IMPROVEMENT-010 — Separate symbol IDs from normalized lookup keys
PB-DESIGN-IMPROVEMENT-011 — Document dependency graph edge direction semantics
PB-DESIGN-IMPROVEMENT-012 — Extract Mermaid graph generation utilities
PB-DESIGN-IMPROVEMENT-013 — Typed public API report messages
PB-DESIGN-IMPROVEMENT-014 — API request normalization contract
PB-DESIGN-IMPROVEMENT-015 — Requested URI vs effective document URI validation
PB-DESIGN-IMPROVEMENT-016 — Shared API position validation
PB-DESIGN-IMPROVEMENT-017 — Report cost model must use total counts
PB-DESIGN-IMPROVEMENT-018 — Query evidence should be a discriminated union
PB-DESIGN-IMPROVEMENT-019 — Shared diagnostic code catalog
PB-DESIGN-IMPROVEMENT-020 — Shared integration category catalog
PB-DESIGN-IMPROVEMENT-021 — Shared PowerBuilder object kind/file extension catalog
PB-DESIGN-IMPROVEMENT-022 — Semantic tokens should be fact/index driven
PB-DESIGN-IMPROVEMENT-023 — Generated semantic token legend/index contract
PB-DESIGN-IMPROVEMENT-024 — Semantic token budget/degraded mode policy
```

Add new design improvement proposals if more are discovered.

---

# Required workflow

Process files one by one.

For every file:

1. Read the relevant documentation context first.
2. Open and read the full file.
3. Understand its responsibility.
4. Check imports and exported API.
5. Check whether the file is hot path, provider, service, model, test, generated or utility.
6. Apply only safe fixes.
7. If uncertain but likely fixable, inspect up to 2–3 directly related files.
8. If confirmed safe, apply the fix.
9. If not confirmed safe, document the issue and do not modify.
10. Run the most relevant targeted test/validation for the touched file.
11. Update `docs/audits/class-by-class-safe-cleanup-audit.md`.
12. Continue with the next file only after targeted validation is green or the issue is documented as unrelated/pre-existing.

Do not summarize only directories. Every relevant file must have its own entry.

---

# Audit report detail requirements

For each file, the summary must be short:

```txt
maximum 3–4 lines
```

The unresolved inconsistencies must be actionable.

Good examples:

```md
- Uses Spanish canonical scope values (`Argumento`, `Compartida`). Not fixed because this requires a model-wide enum migration.
- Calls `createSemanticQueryFacade` in a provider hot path. Not fixed because a shared facade lifecycle must be designed first.
- Uses `documentFingerprint` to store `kb.semanticEpoch`. Not fixed because this is part of the completion resolve data protocol.
```

Bad examples:

```md
- Bad code.
- Needs refactor.
- Maybe slow.
```

---

# Backlog candidate format

When an unresolved issue requires future work, add it under:

```md
## Follow-up backlog candidates
```

Use this format:

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

# Final self-review

Before finishing, re-read the audit report and verify:

```txt
every relevant file has an entry
summaries are max 3–4 lines
documentation context reviewed is documented
safe fixes are separated from unresolved inconsistencies
context inspected is documented per file
limited investigation did not exceed 2–3 related files per issue
targeted validation is documented for every touched file
all runtime/API Spanish text found is fixed or documented
technical Spanish comments were not blindly treated as defects
all "as any" occurrences are fixed or documented
all legacy dependencies found are fixed or documented
all hot-path concerns are fixed or documented
all design improvement proposals are actionable
all targeted and full validation commands run are documented
final full validation is green or unrelated/pre-existing failures are documented with evidence
no risky changes were made silently
no generated files were manually edited without justification
```

If any gap is found, continue auditing before final response.

---

# Final response

Only after completing the full audit and validation, respond in Spanish with:

```md
## Resumen final — Class-by-Class Safe Cleanup Audit

### Documento generado

### Documentación revisada

### Archivos revisados

### Reparaciones seguras aplicadas

### Contexto adicional inspeccionado

### Inconsistencias no reparadas

### Design improvement proposals creadas

### Backlog candidates creados

### Validación targeted ejecutada

### Validación completa ejecutada

### Estado final de tests

### Riesgos pendientes

### Siguiente paso recomendado
```

Do not provide partial summaries before the full audit is complete.
```
