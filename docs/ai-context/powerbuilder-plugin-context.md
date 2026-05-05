# PowerBuilder Plugin — AI Context Pack

## Mission
Build a professional VS Code extension for PowerBuilder 2025/PowerScript with fast discovery, safe semantic analysis, LSP-first architecture, DataWindow awareness and AI-readable evidence.

## Architecture boundaries
- VS Code client is thin UI/integration.
- LSP/server/core own semantic truth.
- Discovery, parsing, indexing and cache invalidation must be incremental.
- Catalogs provide system/manual/localized knowledge with stable compatibility contracts.
- Diagnostics and quick fixes must preserve source origin, confidence and reason codes.
- DataWindow support is a separate safe domain, not generic PowerScript parsing.
- ORCA/PBAutoBuild are optional build/release rails, never required for normal language features.

## PowerBuilder rules
- Respect PowerBuilder object model, functions, events, inheritance and variable scopes.
- Preserve legacy PFC/STD patterns when safe.
- Do not invent PowerBuilder APIs, DataWindow properties or official constants.
- Use official docs or explicit uncertainty when behavior is unclear.

## AI operating model
- Use `planner` for analysis.
- Use `implementer` for scoped edits.
- Use `reviewer` for read-only review.
- Use `docs` for documentation cleanup.
- Use `release` for CI/VSIX/release audits.
- Use skills for PowerBuilder/DataWindow/catalog/testing/performance/build/research capability.

## Validation
Every completed change must report tests, docs updated, commands run and remaining risks.
