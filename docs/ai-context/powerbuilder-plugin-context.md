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

## PowerBuilder coding rules
- Respect the PowerBuilder object model, functions, events, inheritance and variable scopes.
- Preserve legacy PFC/STD patterns when safe.
- Do not invent PowerBuilder APIs, DataWindow properties or official constants.
- Use official docs or explicit uncertainty when behavior is unclear.

## SQL formatting rules
- Keep SQL examples normalized and compact.
- Prefer read-only lineage summaries over speculative rewrites.
- If lineage is partial, say so explicitly instead of inventing joins or columns.

## DataWindow rules
- Treat DataWindow as a separate safe domain.
- Reuse the canonical DataWindow model before deriving hover, lineage, retrieve args or diagnostics.
- Do not treat `.srd` generated source as generic PowerScript.

## Catalog/generated/manual/localization rules
- The system catalog is generated-primary with manual and localization overlays.
- No pegar datasets `generated/manual/localization` completos dentro del prompt.
- Cite the owner doc or query the runtime surface instead of copying large catalog payloads.

## Validation commands and tools
- Prefer `workspace-check` for repo-level claims and `object-check` for object-level claims.
- Use `explain-diagnostic`, `explain-system-symbol` and `ai-task-context-bundle` before broad speculative reasoning.
- Report commands, results, docs touched and remaining risks.
- Common final gates: `npm run test:docs:drift`, `npm run test:architecture:rapid`, `npm run release:verify`.

## Recommended AI workflow
- Start with this pack, then escalate to `AGENTS.md`, `docs/architecture.md`, `docs/architecture-status.md` and the owner doc for the touched surface.
- Check `docs/current-focus.md` before assuming active priorities.
- Prefer the specialized agents `planner`, `implementer`, `reviewer`, `docs` and `release` when the task matches their contract.

## Do not do
- Do not invent capabilities that the code does not implement.
- Do not mark planned work as implemented.
- Do not paste long generated catalogs, fixtures or transcripts when a compact summary is enough.
- Do not open ORCA/PBAutoBuild as mandatory dependencies for normal language features.

## Active focus
- The live focus is delegated to `docs/current-focus.md`.
- This file is only the compact bootstrap for AI tasks.

## Documentation ownership
- `docs/architecture.md` owns normative architecture.
- `docs/architecture-status.md` owns implemented status.
- `docs/architecture-implementation-map.md` owns the bridge to real code paths and validation anchors.
- `docs/symbol-system.md` owns symbol identity, owners, consumers, enrichments, i18n and regression matrix.
- `docs/localization.md` owns catalog localization workflow and coverage roadmap.
- `docs/testing.md` owns the validation strategy.
- `docs/developer-workflows.md` owns operational workflows.
- `docs/ai/README.md` owns the AI documentation index.
- `docs/ai-orchestration.md` owns AI customization, public-contract, safe-edit and tool/MCP policy.
