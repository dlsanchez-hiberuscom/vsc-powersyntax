# Implementation Plan — CATALOG-MANUAL-EN-MIGRATION

## 1. Context & Analysis
- **Goal**: Migrate `manual/**` to English (mostly done) and create/review ES overlays in `localization/es/**`.
- **Current State**: 
    - `core` domain manual base is English.
    - ES overlays exist for many entries but only a few are marked as `reviewed`.
    - Coverage varies by domain (DataWindow ~70%, Visual ~61%, etc.).
- **Strategy**: Proceed domain by domain, reviewing existing overlays and adding missing ones.

## 2. Proposed Steps

### Phase 1: Core Domain Review (Current Focus)
1. **Review `global-functions`**:
    - Audit the first 20 entries in `src/server/knowledge/system/localization/es/manual/core/globalFunctionsLocalization.ts`.
    - Ensure translation quality and technical accuracy (not translating anchors).
    - Mark as `reviewed: true`.
2. **Review `object-functions` and `system-events`**:
    - Repeat the process for `objectFunctionsLocalization.ts` and `systemEventsLocalization.ts`.

### Phase 2: DataWindow Domain Expansion
1. **Sync `dataWindowFunctions.ts`**:
    - Verify all manual entries in `manual/datawindow/dataWindowFunctions.ts` have a corresponding entry in `localization/es/manual/datawindow/`.
2. **Review & Hardening**:
    - Review existing DataWindow overlays.
    - Ensure `targetKey` is used correctly for generated targets.

### Phase 3: Visual & Language Domains
1. **Review Visual Objects**:
    - Audit `localization/es/manual/visual/`.
2. **Review Language constructs**:
    - Audit `localization/es/manual/language/`.

## 3. Validation Gates
- `npm run report:catalog-localization`: Ensure no new issues are introduced.
- `npm run test:unit -- --grep "catalogLocalization|catalogConsistency"`: Verify integrity.
- Manual check of Hover/Completion in a test environment (if possible).

## 4. Modern Patterns Reflection
- The current **Type-safe Overlay** pattern is optimal for this project because:
    - It avoids breaking semantic indexing (names/IDs are never translated).
    - It allows sparse translations (no need to translate everything at once).
    - It provides compile-time checks for the localization schema.
- **Future improvement**: Consider a script to auto-generate `reviewed: false` placeholders for missing manual entries to guide the localization effort.
