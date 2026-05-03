# Implementation Plan - Catalog v2

## Phases

### Phase 1: Infrastructure Extension
- [x] Extend `PbSystemSymbolKind` union.
- [x] Extend `PbSystemSymbolNamespace` union.
- [x] Extend `PbSystemSymbolDomain` union.
- [x] Add metadata fields to `PbSystemSymbolEntryDraft`.

### Phase 2: Knowledge Absorption
- [x] Create manual slices for Keywords.
- [x] Create manual slices for Reserved Words.
- [x] Create manual slices for Datatypes.
- [x] Create manual slices for System Types.
- [x] Create manual slices for Pronouns.
- [x] Create manual slices for Operators.
- [x] Create manual slices for System Globals.
- [x] Create manual slices for Enumerated Values.

### Phase 3: Service Layer
- [x] Implement indexed query methods in `queryService.ts`.
- [x] Expose methods in `SystemCatalog` facade.
- [x] Update consistency report to include `kindCounts`.

### Phase 4: Feature Integration
- [x] Update `hover.ts` with language symbol fallback.
- [x] Update `completion.ts` with keywords/datatypes suggestions.

### Phase 5: Validation
- [x] Create `catalogV2.test.ts`.
- [x] Verify backward compatibility.
- [x] Verify new catalog coverage.

### Phase 6: Follow-up audit hardening
- [x] Align `DataWindowChild` between catalog v2 and parser fast-path Set.
- [x] Align the official catalog generator path with the current `src/server/knowledge/system` layout.
- [x] Add a compatibility wrapper for the documented `scripts/generate_official_function_catalog.cjs` path.
- [x] Add focused regression tests for generator paths and parser/catalog datatype alignment.
- [ ] Close B319/B320/B321 only when their own acceptance criteria are fully validated.
