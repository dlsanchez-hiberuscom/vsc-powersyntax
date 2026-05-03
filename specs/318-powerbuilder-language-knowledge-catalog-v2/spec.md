# Spec 318: PowerBuilder Language Knowledge Catalog v2

## Context
The previous catalog system was focused on `callable`, `event`, and `statement` kinds, primarily for official system functions and events. While robust, it lacked modeling for core language constructs such as keywords, primitive datatypes, pronouns, and operators. These were hardcoded in `grammar.ts` as simple `Set<string>` objects, providing fast parsing but no rich metadata for LSP features like Hover or advanced Completion.

## Objective
Evolve the `knowledge/system` architecture into a complete PowerBuilder Language Knowledge Catalog (v2) that:
1.  Models all language constructs (keywords, datatypes, pronouns, operators, system globals, enumerated values).
2.  Provides rich metadata (summaries, categories, documentation links) for these constructs.
3.  Exposes indexed, high-performance query APIs via `SystemCatalog`.
4.  Maintains strict backward compatibility with existing IDs and behavior.
5.  Unifies the source of truth for language knowledge while keeping parser hot-paths fast.

## Design Decisions
- **Additive Evolution**: Union types (`PbSystemSymbolKind`, `PbSystemSymbolDomain`, etc.) are extended without modifying existing members.
- **Manual Curated Slices**: Since there is no official machine-readable source for these language constructs in the repo, they are added as manually curated slices with full provenance.
- **Indexed Lookups**: All new query methods use the pre-built indexes (`byDomain`, `byLookupKey`) to ensure $O(1)$ or $O(log n)$ performance, avoiding any array scans.
- **Hover/Completion Fallbacks**: Consumers are updated to check for language symbols if no system callable/event/statement is found.
- **Provenance Preservation**: All new symbols follow the `manual-core` dataset rules with appropriate `sourceOrigin`.

## Constraints
- Do not replace `grammar.ts` Sets in the parser (keep it fast).
- Preserve all existing symbol IDs.
- DataWindow expression functions remain separate from normal PowerScript logic.

## Backlog Dependencies
- **B319**: Restore official catalog generator (deferred).
- **B320**: DataWindow expression/property official catalog (deferred).
- **B321**: Generated catalog domain enrichment v2 (deferred).

## Audit addendum 2026-05-03

The follow-up audit confirmed B318 itself remains closed and compatible:

- v2 language slices are registered in the system catalog registry and exposed by indexed query APIs.
- `grammar.ts` keeps parser hot-path `Set<string>` exports; `DataWindowChild` is now covered by both the catalog and the fast builtin-type set while preserving the previous misspelled entry for compatibility.
- the official generator rail exists under `script/generate_official_function_catalog.cjs`, with a compatibility wrapper under `scripts/`, but B319 remains open because full coverage v2 is not closed yet.
- `officialCoverage.generated.ts` currently reports coverage for `system-events` and `statements`; broader generated coverage remains deferred to B319/B321.
