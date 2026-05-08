# Ultra Audit — Clean Rebuild of the PowerBuilder Hybrid Knowledge Runtime

You are GitHub Copilot Agent working on the PowerBuilder VS Code plugin repository.

Execute a complete, deep, phase-by-phase audit and redesign of the current `knowledge/system` architecture.

The goal is to analyze everything that currently exists, research the best possible architecture, and design a clean final target system for a full replacement if needed.

This audit must produce:

```txt
1. docs/audits/hybrid-pb-knowledge-runtime-findings.md
2. docs/architecture/hybrid-pb-knowledge-runtime-target.md
3. docs/backlog-hybrid-pb-knowledge-runtime-refactor.md
```

The final output must provide a complete refactoring backlog to remove the old system and build the new system 100%, based on the best design found during the audit.

Do not implement the final refactor in this prompt unless explicitly required later by the user. This prompt is for exhaustive audit, target architecture, migration strategy and backlog generation.

---

# Absolute mandatory rule

**DO NOT STOP, DO NOT ASK QUESTIONS, DO NOT SKIP PHASES, DO NOT MERGE PHASES, DO NOT IMPLEMENT THE FINAL REFACTOR NOW, AND DO NOT FINISH UNTIL ALL CURRENT SYSTEM FINDINGS, OFFICIAL POWERBUILDER RESEARCH, MODERN PATTERN RESEARCH, TARGET ARCHITECTURE, CLEAN REBUILD STRATEGY, LEGACY DELETION STRATEGY, AND COMPLETE REFACTOR BACKLOG ARE FULLY DOCUMENTED.**

---

# Mandatory language policy

The entire target architecture, audit findings, backlog, technical documentation, code contracts, schemas, generated canonical knowledge, generated English documentation, tests, developer-facing comments, AI-facing instructions and implementation guidance must be written in **English**.

Only actual Spanish localization payloads intended for Spanish end-user presentation may be written in **Spanish**.

Spanish is allowed only in files or records that are explicitly part of a Spanish localization overlay, such as:

```txt
localization/es/**
docs/es/**
*.es.generated.*
*.es.manual.*
LocalizedDocumentationOverlay(locale: "es")
Spanish UI strings
Spanish diagnostic messages
Spanish hover prose
Spanish search keywords
```

Spanish must not be used for:

```txt
architecture documents
audit findings
backlog items
spec IDs
technical design documents
canonical generated knowledge
canonical symbol records
schemas
types
interfaces
test descriptions
implementation notes
developer-facing comments
AI-facing prompts
directory ownership docs
source-of-truth documentation
```

PowerBuilder official symbols, names, signatures, datatypes, keywords, DataWindow symbols, SQL syntax, source URLs and API names must never be translated.

The target language model is:

```txt
generated normal = canonical official knowledge in English / canonical identifiers
generated English docs = base documentation
generated Spanish docs = derived localization overlay only
manual canonical = English/canonical fixes only
manual English docs = English documentation corrections
manual Spanish docs = Spanish localization corrections only
```

If any existing file mixes canonical English/system knowledge with Spanish localization text, audit it as technical debt and propose a clean migration path.

---

# Master goal

Preserve and optimize the project master goal:

> The plugin must discover and index very fast without blocking VS Code.

The final target architecture must optimize for:

```txt
instant startup
fast generated knowledge loading
fast symbol resolution
fast hover/completion/signature help
bounded semantic enrichment
incremental parsing/facts
hot indexes
no full workspace scans in hot paths
clean source-of-truth ownership
no duplicated semantic truth
easy regeneration
safe localization overlays
clean code
no legacy runtime dependencies
no permanent compatibility adapters
no dead code
no obsolete duplicated modules
```

---

# Preferred target direction

The preferred target direction is a full replacement of the current mixed knowledge/localization system with a clean hybrid architecture.

The audit must strongly evaluate this target:

```txt
canonical generated knowledge as the only official source of truth
generated English documentation as the base documentation layer
generated Spanish documentation as a derived localization overlay only
manual canonical overlays constrained to explicit canonical fixes/gaps
manual English documentation overlays constrained to documentation corrections
manual Spanish overlays constrained to translation/prose/search-keyword corrections only
fast documentation projections by locale
PowerBuilder-aware lossless lexer
tolerant incremental structural parser
incremental semantic facts
hot symbol indexes
hot occurrence index
SemanticQueryFacade as the only semantic access boundary
providers as thin bounded consumers
no full workspace scans in provider hot paths
no duplicated semantic stores
no legacy code after final cutover
```

If the audit proposes a different architecture, it must prove with evidence that the alternative is faster, simpler, safer and more maintainable than this preferred target.

The preferred final architecture is:

```txt
PowerBuilder Hybrid Incremental Runtime =
  Generated Official Knowledge
  + Generated English Documentation
  + Derived Localization Overlays
  + Lossless PowerBuilder Lexer
  + Tolerant Incremental Structural Parser
  + Incremental Semantic Facts
  + Hot Symbol/Occurrence Indexes
  + Documentation/Localization Projections
  + Thin Bounded LSP Providers over SemanticQueryFacade
```

---

# Clean code and legacy deletion policy

The final architecture must not keep old code as a permanent dependency.

The audit and backlog must explicitly identify:

```txt
legacy modules to delete
legacy modules to replace
legacy imports to remove
duplicated code to eliminate
mixed responsibility files to split or delete
runtime compatibility adapters to avoid
temporary compatibility adapters if absolutely required
exact phase where each temporary adapter must be deleted
dead generated files
dead localization files
dead registry/index files
dead tests
stale documentation
obsolete architecture references
```

Rules:

```txt
Do not keep old modules "just in case".
Do not leave two systems running in parallel after cutover.
Do not create a new clean architecture while still depending on the old runtime architecture.
Do not leave compatibility adapters without a deletion backlog item.
Do not preserve duplicated data shapes.
Do not preserve legacy file names if they misrepresent ownership.
Do not keep localization files that define canonical symbols.
Do not keep canonical files that contain localized Spanish labels.
Do not keep providers consuming old knowledge APIs after migration.
Do not keep tests that validate legacy behavior unless they are explicitly migrated to the new behavior.
```

If a temporary adapter is required, it must be:

```txt
isolated
documented
covered by tests
marked as temporary
excluded from the target architecture
assigned a mandatory deletion backlog item
blocked from becoming permanent
```

The preferred implementation strategy is:

```txt
build the new clean system in parallel
validate parity and performance
migrate consumers to the new APIs
cut over all runtime consumers
delete the old system completely
delete temporary adapters
remove stale tests/docs/imports
finish with one clean source of truth
```

---

# Initial repository documents to read

Before auditing code, read:

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
```

Also inspect any existing audit documents related to:

```txt
semantic indexing
knowledge system
symbol catalogs
localization
documentation service
DataWindow knowledge
provider performance
cache/fingerprint/epoch
legacy deletion
```

---

# Main areas to audit

Audit completely:

```txt
src/server/knowledge/
src/server/knowledge/system/
src/server/knowledge/system/generated/
src/server/knowledge/system/localization/
src/server/knowledge/system/manual/
src/server/knowledge/system/registry/
src/server/knowledge/system/services/
src/server/knowledge/system/indexes/
src/server/knowledge/system/consistency.ts
src/server/knowledge/system/documentationLocale.ts
src/server/knowledge/system/documentationService.ts
src/server/knowledge/system/localizationResolver.ts
src/server/knowledge/system/schema.ts
src/server/knowledge/system/types.ts
src/server/knowledge/system/frameworkKnowledgePackPolicy.ts
src/server/knowledge/system/frameworkKnowledgePacks.ts
src/server/knowledge/system/nativeAncestors.ts
```

Also audit all consumers of this knowledge system:

```txt
hover
completion
completion resolve
signature help
definition
references
rename
semantic tokens
diagnostics
document symbols
workspace symbols
CodeLens
Current Object Context
Object Explorer
AI bundles if present
documentation service consumers
runtime/status/report commands
```

Search the repository for all imports/usages of:

```txt
generatedObjectFunction
generatedFunctionLocalization
generatedEventLocalization
generatedStatementLocalization
generatedDatatypeLocalization
generatedEnumLocalization
documentationService
localizationResolver
SystemKnowledge
KnowledgePack
frameworkKnowledgePacks
nativeAncestors
DataWindow localization
DataWindow functions
DataWindow properties
DataWindow events
DataWindow expression functions
```

---

# Required research sources

The audit must research and use official and modern sources.

## Official PowerBuilder / Appeon documentation

Research official Appeon PowerBuilder 2025 documentation exhaustively for symbol families:

```txt
PowerScript Reference
Objects and Controls
DataWindow Reference
Application Techniques
ORCA Guide
Native Interface / PBNI
PowerBuilder SQL / embedded SQL / dynamic SQL
```

At minimum, verify these symbol families:

```txt
reserved words
pronouns
conditional compilation
standard datatypes
system object datatypes
enumerated datatypes
statements
SQL statements
dynamic SQL statements
operators
declarations
variables/constants/arrays
functions
system functions
object functions
global functions
user-defined functions
external functions
RPC declarations
events
system events
user events
static/dynamic calls
ancestor calls
overload/override/extend
return values
system objects
controls
object properties
object events
object functions
DataWindow expression functions
DataWindow properties
DataWindow methods
DataWindow events
DataWindow constants
DWObject
DataWindow property expressions
DataWindow data expressions
ORCA functions and callbacks
PBNI types/interfaces/mappings
obsolete/deprecated symbols
```

## Modern architecture pattern research

Research modern best practices and patterns for:

```txt
incremental parsing
tolerant structural parsing
Roslyn-style syntax/semantic architecture
rust-analyzer/Salsa-style incremental query caches
Tree-sitter-style CST/incremental parsing
SCIP/LSIF-style symbol and occurrence indexing
VS Code/LSP provider hot path design
semantic token full/delta/range result state
localization overlay architecture
generated + manual curation pipelines
single source of truth
documentation projection caches
large workspace indexing
legacy-free migration/cutover strategies
```

If any other relevant pattern is discovered, add it to the audit. Do not limit the audit to the initial list.

---

# Output documents

## 1. Findings document

Create or update:

```txt
docs/audits/hybrid-pb-knowledge-runtime-findings.md
```

This file must be written in English and updated after every phase.

It must include:

```md
# Hybrid PowerBuilder Knowledge Runtime — Findings

## Scope

## Methodology

## PHASE findings

## Current architecture inventory

## Current data model findings

## Generated pipeline findings

## Localization findings

## Documentation service findings

## Consumer/provider findings

## Performance findings

## Official PowerBuilder research findings

## Modern architecture pattern findings

## Clean code findings

## Legacy/debt inventory

## Duplications

## Delete/rebuild candidates

## Temporary adapter candidates

## Required deletions

## Open questions resolved by evidence

## Final findings summary
```

Every finding must include:

```txt
id
title
severity
area
evidence
current behavior
risk
recommended target behavior
affected files
refactor impact
legacy deletion impact
```

Use IDs like:

```txt
PB-KNOWLEDGE-FINDING-001
PB-KNOWLEDGE-FINDING-002
...
```

---

## 2. Target architecture document

Create or update:

```txt
docs/architecture/hybrid-pb-knowledge-runtime-target.md
```

This file must be written in English and contain the exhaustive final design.

It must include:

```md
# Hybrid PowerBuilder Knowledge Runtime — Target Architecture

## Executive summary

## Architecture goals

## Non-goals

## Final decision

## Current system replacement strategy

## Clean code strategy

## Legacy deletion strategy

## Source-of-truth model

## Canonical language model

## Directory structure target

## Canonical generated knowledge

## Canonical manual overlays

## English documentation base model

## Generated localized overlays

## Manual localized overlays

## Localization rules

## Documentation projection cache

## Lossless PowerBuilder lexer

## Tolerant incremental structural parser

## Incremental semantic facts

## Hot indexes

## Occurrence index

## DataWindow submodel

## SQL submodel

## System object submodel

## External/native/PBNI/ORCA submodels

## SemanticQueryFacade integration

## Provider integration model

## Cache/fingerprint/epoch model

## Startup and warm-load model

## Large workspace strategy

## Performance budget

## Consistency gates

## Tests required

## Migration strategy

## Cutover strategy

## Temporary compatibility adapter policy

## Final legacy deletion checklist

## Rollout plan

## Risks and mitigations

## Final target architecture diagram
```

The final architecture must define exact target modules, responsibilities and data boundaries.

It must also define exactly which old modules are deleted, replaced or temporarily bridged.

---

## 3. Refactor backlog document

Create or update:

```txt
docs/backlog-hybrid-pb-knowledge-runtime-refactor.md
```

This file must be written in English.

This must be a complete backlog to remove the old system and build the new system 100%.

It must include:

```md
# Backlog — Hybrid PowerBuilder Knowledge Runtime Clean Refactor

## Execution rules

## Dependencies

## Migration principles

## Clean code rules

## Legacy deletion rules

## Epic 0 — Safety baseline and parity tests

## Epic 1 — Target schemas and contracts

## Epic 2 — Generated canonical knowledge pipeline

## Epic 3 — English documentation and localization overlays

## Epic 4 — Documentation projection cache

## Epic 5 — Lossless lexer

## Epic 6 — Tolerant structural parser

## Epic 7 — Incremental semantic facts

## Epic 8 — Hot indexes and occurrence index

## Epic 9 — DataWindow submodel

## Epic 10 — SQL/native/ORCA/PBNI submodels

## Epic 11 — SemanticQueryFacade integration

## Epic 12 — Provider migration

## Epic 13 — Cutover to the clean system

## Epic 14 — Complete legacy deletion

## Epic 15 — Consistency gates

## Epic 16 — Performance gates

## Epic 17 — Documentation alignment

## Epic 18 — Final validation and release readiness
```

Every backlog item must include:

```txt
id
title
priority
scope
affected files
implementation steps
tests required
docs required
legacy deletion required
acceptance criteria
risks
validation commands
done criteria
```

Use IDs like:

```txt
PB-HYBRID-KNOW-P0-...
PB-HYBRID-KNOW-P1-...
PB-HYBRID-KNOW-P2-...
```

The backlog must be ready for future Copilot execution prompts.

---

# PHASE 0 — Preparation and safety baseline

## Goal

Establish baseline and avoid blind destructive decisions.

## Tasks

1. Read all required docs.
2. Inventory existing knowledge/system files.
3. Inventory generated, manual and localized artifacts.
4. Inventory test coverage.
5. Inventory current consumers.
6. Inventory existing legacy/old/deprecated knowledge code.
7. Run baseline commands if available:

```bash
npm run build:test
npm run test:docs:drift
npm run test:architecture:rapid
npm run test:performance:gate
npm test
```

If commands fail, document failures in the findings. Do not fix unrelated failures unless required to continue the audit.

## Required output

Update findings document with:

```md
## PHASE 0 — Preparation and baseline

### Documents reviewed
### Initial inventory
### Consumers detected
### Existing tests
### Existing legacy/debt
### Validation baseline
### Initial risks
```

---

# PHASE 1 — Current architecture inventory

## Goal

Understand exactly what exists today.

## Tasks

Audit all current modules under `knowledge/system`.

Classify every file as one of:

```txt
canonical generated
canonical manual
localized generated
localized manual
mixed generated
schema/types
registry
service
resolver
index
consistency
legacy
unknown
```

For each file, capture:

```txt
role
exports
imports
data shape
consumer modules
runtime usage
whether it defines symbols
whether it documents symbols
whether it localizes symbols
whether it indexes symbols
whether it serves runtime queries
whether it should exist in the target architecture
whether it should be deleted
whether it should be regenerated
whether it should be replaced
```

## Required output

Update findings document with:

```md
## PHASE 1 — Current architecture inventory

### Current tree
### File classification
### Relevant exports/imports
### Detected roles
### Mixed files
### Legacy files
### Deletion candidates
### Risks
```

---

# PHASE 2 — Field and schema classification audit

## Goal

Classify every field used in generated/manual/localized entries.

## Tasks

Find all fields used by generated/manual/localized records, including but not limited to:

```txt
id
symbolId
name
category
categoryId
summary
description
signatures
label
returnType
returnDocumentation
examples
appliesTo
ownerTypes
obsolete
obsoleteMessage
risk
sourceUrl
searchKeywords
locale
documentationVersion
sourceOrigin
confidence
tags
```

Classify every field as:

```txt
canonical identity
canonical signature
canonical lifecycle
canonical applicability
English documentation
localized documentation
search/index
runtime/cache
legacy/mixed
invalid
unknown
```

Detect:

```txt
canonical fields in localization
localized strings in canonical records
duplicated fields
Spanish labels in canonical generated records
placeholder documentation such as "Description"
unknown symbol references
unstable IDs
missing source URLs
obsolete/risk mismatches
fields that should be split
fields that should be deleted
fields that should be renamed
```

## Required output

Update findings document with:

```md
## PHASE 2 — Field and schema classification

### Canonical fields
### English documentation fields
### Localized fields
### Runtime/cache fields
### Mixed or invalid fields
### Duplications
### Placeholders
### Fields to delete or split
### Risks
```

---

# PHASE 3 — Generated pipeline audit

## Goal

Audit the generator model and decide how it should produce the new architecture.

## Tasks

Find all generator-related code, scripts or generated files.

Determine current generation flow:

```txt
official source -> generated normal
generated normal -> generated localized
manual overrides
runtime registry
```

Audit whether the generated normal can be adapted to produce:

```txt
canonical generated records
English base documentation records
localized generated overlays
indexable metadata
consistency reports
```

Define whether the target generator should emit:

```txt
canonical/generated/*.generated.ts
documentation/en/generated/*.generated.ts
localization/es/generated/*.generated.ts
indexes/generated/*.generated.ts
```

or a better structure.

The target generator output must be clean and must not require old runtime modules.

## Required output

Update findings document with:

```md
## PHASE 3 — Generated pipeline audit

### Current flow
### Detected generators
### Current generated formats
### Regeneration capability
### Target separation
### Old generated artifacts to delete
### Generator changes required
### Risks
```

---

# PHASE 4 — Official PowerBuilder symbol taxonomy audit

## Goal

Build the official symbol taxonomy required by the target system.

## Tasks

Using official Appeon documentation, define the complete taxonomy for:

```txt
PowerScript core symbols
PowerScript language keywords
PowerScript statements
SQL statements
dynamic SQL constructs
standard datatypes
system object datatypes
enumerated datatypes
functions
events
object functions
global/system functions
external functions
RPC declarations
system objects
controls
properties
DataWindow symbols
DataWindow expression functions
DataWindow object properties
DataWindow methods
DataWindow events
DataWindow constants
ORCA symbols
PBNI symbols
obsolete/deprecated symbols
```

For each family define:

```txt
canonical kind
source document
required fields
optional fields
indexing strategy
resolution behavior
localization behavior
test requirements
target module
legacy module replacement
```

## Required output

Update findings document with:

```md
## PHASE 4 — Official PowerBuilder symbol taxonomy

### Official families
### Required fields by family
### Rules by family
### Official sources reviewed
### Target modules
### Gaps and risks
```

---

# PHASE 5 — Modern pattern audit

## Goal

Research and compare modern architecture patterns.

## Tasks

Research and compare:

```txt
Tree-sitter incremental CST pattern
Roslyn incremental parser/workspace/syntax-semantic model
rust-analyzer/Salsa query model
SCIP/LSIF occurrence indexing
VS Code/LSP provider hot path design
i18n localization overlay architecture
SSOT/spec-first generated systems
large workspace indexing patterns
legacy-free cutover patterns
```

For each pattern, document:

```txt
what it solves
what to adopt
what not to adopt
cost
risk
fit for PowerBuilder
fit for current repository
performance impact
clean code impact
legacy deletion impact
```

Allow the AI to identify any other relevant pattern and add it.

## Required output

Update findings document with:

```md
## PHASE 5 — Modern patterns researched

### Patterns evaluated
### Applicability to PowerBuilder
### Adopted patterns
### Rejected patterns
### Additional discovered patterns
### Technical recommendation
```

---

# PHASE 6 — Runtime consumer audit

## Goal

Understand every runtime dependency on current knowledge.

## Tasks

Audit all consumers:

```txt
hover
completion
completion resolve
signature help
definition
references
rename
semantic tokens
diagnostics
document symbols
workspace symbols
CodeLens
Current Object Context
Object Explorer
AI bundles
reports
runtime commands
documentation service
```

For each consumer, document:

```txt
current knowledge dependency
current hot path risk
whether it needs canonical knowledge
whether it needs English documentation
whether it needs localization
whether it needs workspace facts
whether it needs occurrence index
whether it bypasses SemanticQueryFacade
required target dependency
migration steps
old API dependency to delete
new API dependency to use
```

## Required output

Update findings document with:

```md
## PHASE 6 — Runtime consumer audit

### Consumers detected
### Current dependencies
### Hot path risks
### Target dependencies
### Old APIs to delete
### Required migration
```

---

# PHASE 7 — Performance and hot path audit

## Goal

Find all performance bottlenecks and design the fastest possible target.

## Tasks

Audit whether current system does any of these:

```txt
linear scans over generated records in hot paths
runtime merge of generated/manual/localized docs per request
locale fallback per hover/completion request
full workspace scans from providers
duplicated indexes
uncached sourceUrl/signature lookups
large generated imports in activation critical path
eager loading of all locales
expensive consistency checks at runtime
old compatibility layers in hot paths
legacy registry lookups in providers
```

Define target performance model:

```txt
O(1) symbol lookup
O(1) documentation projection lookup
lazy locale loading
prebuilt indexes
sourceOrigin-aware caches
documentFingerprint-aware facts
semanticEpoch-aware invalidation
bounded provider budgets
warm start compatibility
zero legacy hot path dependencies
```

## Required output

Update findings document with:

```md
## PHASE 7 — Performance/hot path audit

### Current bottlenecks
### Activation risks
### Provider risks
### Localization risks
### Legacy hot path risks
### Target performance model
### Recommended metrics/gates
```

---

# PHASE 8 — Target data model design

## Goal

Design the final data model.

## Tasks

Design final contracts for:

```txt
CanonicalSymbolRecord
CanonicalSignatureRecord
CanonicalParameterRecord
CanonicalLifecycleRecord
SystemDocumentationRecord
LocalizedDocumentationOverlay
ResolvedDocumentationProjection
PowerBuilderToken
PowerBuilderStructuralFact
DocumentSemanticFacts
OccurrenceRecord
SemanticQueryResult
DocumentationResolutionReceipt
LocalizationFallbackReceipt
```

For each contract define:

```txt
fields
ownership
allowed sources
versioning
cache key impact
serialization needs
tests
old model replacement
```

## Required output

Update target architecture document with the complete data model.

Update findings with:

```md
## PHASE 8 — Target data model design

### Designed contracts
### Ownership
### Versioning
### Cache keys
### Old model replacements
### Risks
```

---

# PHASE 9 — Target directory structure design

## Goal

Design final physical structure.

## Tasks

Design target directories and files.

The target must support:

```txt
canonical generated knowledge
canonical manual overlays
base English documentation
generated localized overlays
manual localized overlays
generated indexes
runtime registry
documentation projection cache
consistency gates
tests
migration scripts
legacy deletion scripts if useful
```

Prefer simple structure if possible. Avoid overengineering.

The design must explicitly state what old directories/files should be:

```txt
deleted
moved
regenerated
replaced
temporarily preserved
```

## Required output

Update target architecture document with exact directory structure.

Update findings with:

```md
## PHASE 9 — Target physical structure

### Target directories
### Target files
### Current files to delete
### Current files to migrate
### Current files to regenerate
### Current files to temporarily preserve
```

---

# PHASE 10 — Target runtime architecture design

## Goal

Design final runtime behavior.

## Tasks

Design:

```txt
startup loading
generated registry loading
locale projection loading
lazy locale strategy
documentation service behavior
localization resolver behavior
SemanticQueryFacade integration
provider integration
cache/fingerprint/epoch behavior
occurrence index behavior
DataWindow submodel behavior
SQL submodel behavior
fallback/degraded receipts
large workspace behavior
legacy-free runtime behavior
```

## Required output

Update target architecture document with runtime architecture.

Update findings with:

```md
## PHASE 10 — Target runtime architecture

### Startup
### Registry
### Documentation projections
### SemanticQueryFacade
### Providers
### Caches
### Indexes
### Large workspace
### Degraded behavior
### Legacy-free runtime behavior
```

---

# PHASE 11 — Consistency and test gate design

## Goal

Design all gates needed to prevent future drift.

## Tasks

Design tests/gates for:

```txt
canonical symbol ID stability
generated normal is canonical
generated localized derives from generated normal
localized overlays cannot change identity
locale does not affect definition/references/rename
completion insertText is never localized
hover keeps official name/signature but localizes prose
unknown localized symbol IDs fail
placeholder docs are reported
obsolete/risk fields are consistent
sourceUrl exists for official generated entries
DataWindow symbols are in correct submodel
SQL symbols are in correct submodel
no provider bypasses SemanticQueryFacade
no full workspace scan in hot paths
all generated files are reproducible
manual overlays are small and explicit
no legacy modules are imported after cutover
no temporary adapter remains after final phase
no duplicated canonical truth exists
no Spanish text exists outside Spanish localization overlays
```

## Required output

Update target architecture and backlog with required tests.

Update findings with:

```md
## PHASE 11 — Consistency gates and tests

### Required gates
### Required tests
### Suggested commands
### Acceptance criteria
```

---

# PHASE 12 — Migration and clean rebuild strategy

## Goal

Decide how to safely remove the old system and build the new one.

## Tasks

Produce a migration strategy with one of these decisions:

```txt
A. incremental migration with temporary compatibility adapter
B. full delete/rebuild with generator adaptation
C. hybrid: generate new clean system in parallel, then cutover and delete old
```

The decision must be evidence-based.

The preferred strategy is C unless evidence proves another strategy is safer and cleaner.

Document:

```txt
what can be deleted
what must be migrated
what can be regenerated
what must be preserved
how to preserve symbol IDs
how to preserve existing translations
how to maintain compatibility during migration
how to validate parity
how to cut over
how to delete temporary adapters
how to remove all old imports
how to rollback before cutover
```

## Required output

Update target architecture with final migration strategy.

Update findings with:

```md
## PHASE 12 — Migration and clean rebuild strategy

### Final decision
### Evidence
### Migration plan
### Clean cutover plan
### Legacy deletion plan
### Temporary adapter deletion plan
### Parity tests
### Rollback
### Risks
```

---

# PHASE 13 — Complete refactor backlog generation

## Goal

Generate the complete backlog for implementation.

## Tasks

Create the full backlog file:

```txt
docs/backlog-hybrid-pb-knowledge-runtime-refactor.md
```

The backlog must be executable by future Copilot prompts.

It must include:

```txt
epics
work items
dependencies
priorities
acceptance criteria
tests
docs
validation commands
done criteria
legacy deletion criteria
```

Ensure backlog explicitly covers:

```txt
delete old mixed system
adapt generator
create canonical generated output
create English documentation output
create localized generated output
create manual overlay model
create documentation projection cache
create consistency gates
migrate consumers
migrate tests
cut over to new system
remove compatibility adapter
delete legacy files
delete stale tests
delete stale docs
final docs
performance gates
```

Every item must state whether it:

```txt
creates new clean code
migrates a consumer
deletes legacy code
adds a gate
updates docs
```

## Required output

Complete backlog document.

Update findings with:

```md
## PHASE 13 — Complete backlog generated

### Backlog created
### Epics
### Dependencies
### Recommended order
### Legacy deletion coverage
### Risks
```

---

# PHASE 14 — Documentation alignment plan

## Goal

Define which project docs must be updated when implementation happens.

## Tasks

Identify docs to update during future refactor:

```txt
docs/architecture.md
docs/architecture-status.md
docs/architecture-implementation-map.md
docs/instant-semantic-indexing-target.md
docs/semantic-design-target.md
docs/testing.md
docs/performance-budget.md
docs/troubleshooting.md
docs/backlog.md
docs/current-focus.md
docs/done-log.md
README.md if affected
```

Document exact ownership to avoid duplication.

All technical docs must be written in English.

Spanish documentation is allowed only if explicitly user-facing and not part of AI/dev-facing architecture.

## Required output

Update target architecture and backlog with documentation tasks.

Update findings with:

```md
## PHASE 14 — Documentation alignment plan

### Affected docs
### Documentation ownership
### Required changes
### Duplicate documentation risks
### Language policy risks
```

---

# PHASE 15 — Final review and self-audit

## Goal

Ensure the audit is complete and no obvious area was missed.

## Mandatory checks

Re-read:

```txt
docs/audits/hybrid-pb-knowledge-runtime-findings.md
docs/architecture/hybrid-pb-knowledge-runtime-target.md
docs/backlog-hybrid-pb-knowledge-runtime-refactor.md
docs/backlog.md
docs/architecture.md
docs/architecture-status.md
docs/instant-semantic-indexing-target.md
docs/testing.md
```

Verify:

```txt
all current knowledge/system areas were audited
all known generated/localized/manual areas were classified
all runtime consumers were audited
official PowerBuilder taxonomy was considered
modern patterns were compared
target architecture is exhaustive
migration strategy is explicit
legacy deletion plan is explicit
backlog is actionable
tests/gates are included
performance model is included
DataWindow/SQL/native/ORCA/PBNI are covered
locale never changes semantic identity
generated localized is derived from generated normal
manual overlays are constrained
all technical docs are in English
Spanish appears only in Spanish localization overlays
no implementation was performed
clean code strategy is explicit
legacy deletion strategy is explicit
temporary adapters have mandatory deletion items
```

If any gap is found, add another mini-audit phase before finishing.

## Required output

Update findings with:

```md
## PHASE 15 — Final review

### Checklist completed
### Gaps found
### Corrections made
### Final state
```

---

# Final response

Only after everything is complete, respond in Spanish with:

```md
## Resumen final — Auditoría Hybrid PowerBuilder Knowledge Runtime

### Documentos generados

### Hallazgos principales

### Arquitectura objetivo propuesta

### Decisión clean rebuild / delete legacy

### Backlog generado

### Estrategia para eliminar código viejo

### Riesgos principales

### Siguiente paso recomendado
```

Do not include a partial summary before completing all phases.

If any required document cannot be generated, do not finish. Continue auditing and documenting until all required outputs are complete.
