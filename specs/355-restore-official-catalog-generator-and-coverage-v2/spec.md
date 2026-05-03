# Spec 355: Restore official catalog generator and coverage v2

## Status

Closed.

## Backlog mapping

- B319 — Restore official catalog generator and coverage v2.

## Objective

Restore the reproducible official catalog-generation rail on the current server layout and publish official coverage by relevant generated domains without depending on the historical `src/out powerbuilder` layout.

## Implemented scope

- `script/generate_official_function_catalog.cjs` now renders `officialCoverage.generated.ts` for `global-functions`, `object-functions`, `datawindow-functions`, `system-events` and `statements`.
- The real generator run refreshes `officialCoverage.generated.ts` plus the catalog `generatedAt` provenance on the current layout while keeping `generated.generated.ts` and `ownerTypes.generated.ts` stable when no new content is needed.
- Focused tests lock the current layout/wrapper contract and the presence of the expanded coverage domains.

## Out of scope

- Official generation for `datatypes`, `system-object-datatypes`, keywords/reserved words or other domains. That remains in B323/B322/B324.
- Curated runtime coverage itself. That was closed in B285.
- Knowledge-pack or framework-specific catalog policy. That remains in B286 and later audit follow-ups.

## Acceptance evidence

- The generator runs from `script/generate_official_function_catalog.cjs` on the current layout.
- `officialCoverage.generated.ts` contains the generated domains relevant to the current rail.
- `catalogGeneratorScript.test.ts` and `catalogConsistency.test.ts` stay green after regeneration.