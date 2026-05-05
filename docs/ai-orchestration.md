# AI Orchestration — PowerBuilder VS Code Plugin

## Purpose

This document owns the repository AI operating map. It explains where AI rules live, which surfaces are read-only contracts, and what must happen before any AI-assisted write-enabled workflow is considered safe.

Keep this file lean. Detailed architecture remains in [docs/architecture.md](architecture.md), implementation mapping in [docs/architecture-implementation-map.md](architecture-implementation-map.md), validation strategy in [docs/testing.md](testing.md), and the compact bootstrap in [docs/ai-context/powerbuilder-plugin-context.md](ai-context/powerbuilder-plugin-context.md).

## AI Customization Map

| Surface | Primary owner | Use for | Do not use for |
| --- | --- | --- | --- |
| [AGENTS.md](../AGENTS.md) | Cross-agent root contract | Mandatory repo-wide behavior for any agent | Long domain procedures or temporary focus |
| [.github/copilot-instructions.md](../.github/copilot-instructions.md) | Copilot workspace summary | Short always-on Copilot rules | Repeating backlog, roadmap or owner docs |
| [.github/instructions](../.github/instructions) | Path/domain instructions | Rules that apply only to matched files | Broad workflow checklists |
| [.github/prompts](../.github/prompts) | Reusable task prompts | Repeatable audits, spec execution and self-check workflows | Always-on project policy |
| [.github/agents](../.github/agents) | Persistent agent modes | Planner, implementer, reviewer, docs and release roles | Packing every domain rule into an agent |
| [.github/skills](../.github/skills) | Domain capabilities | PowerBuilder semantics, DataWindow, catalog, testing, docs, build/release and official research workflows | Permission to make write-enabled changes |
| [docs/ai](ai) | AI documentation index and routing | Discovery, token policy and agent/skill routing | Runtime semantic truth |
| [docs/ai-context](ai-context) | Compact context pack | Small bootstrap prompt context | Full architecture or backlog copies |

Compatibility entries [docs/ai-orchestrator.md](ai-orchestrator.md) and [docs/ai-agents-catalog.md](ai-agents-catalog.md) remain only for historical references. New references should target this document, [docs/ai/README.md](ai/README.md), or [docs/ai/agent-skill-routing.md](ai/agent-skill-routing.md).

## Instructions Policy

Permanent instructions must stay short and stable:

- global invariants live in [AGENTS.md](../AGENTS.md) and [.github/copilot-instructions.md](../.github/copilot-instructions.md);
- path-specific rules live in [.github/instructions](../.github/instructions);
- instructions link to owner docs instead of copying architecture, backlog or testing matrices;
- temporary focus belongs in [docs/current-focus.md](current-focus.md), not in always-on instructions;
- `plugin_old` remains reference material, never current runtime authority.

## Prompt Files Contract

Every executable prompt in [.github/prompts](../.github/prompts) must use the `.prompt.md` extension and include:

- objective and scope;
- explicit out-of-scope items;
- hard rules;
- ordered phases;
- acceptance criteria;
- required tests and docs;
- final self-check;
- mandatory final output.

Long prompts should link to this document, [docs/testing.md](testing.md), and the owner docs for the touched surface. They should not copy full architecture or backlog sections.

## Agents And Skills

The active agent set is intentionally small:

- `planner` for read-only scope and validation planning;
- `implementer` for approved scoped edits;
- `reviewer` for read-only review;
- `docs` for ownership, links and duplication cleanup;
- `release` for CI, VSIX and release-readiness.

Compatibility aliases `docs-auditor` and `docs-updater` should retire once historical references are migrated.

Skills provide domain workflow context on demand. They do not grant write permission. When a task needs PowerBuilder semantics, DataWindow analysis, catalog maintenance, performance hotpath work, testing validation, docs governance, build/release or official research, load the matching skill and keep the output tied to owner docs.

## Public Read-Only AI Contracts

AI consumers must use public or read-only contracts before touching internals.

| Need | Contract surface | Notes |
| --- | --- | --- |
| Architecture/status summary | [docs/architecture-status.md](architecture-status.md), [docs/architecture-implementation-map.md](architecture-implementation-map.md) | Documentation contract, not runtime mutation |
| Test matrix/status | [docs/testing.md](testing.md), `package.json` scripts | Commands must be real or marked missing |
| Semantic query context | [src/server/features/semanticQueryFacade.ts](../src/server/features/semanticQueryFacade.ts), resolved semantic models | Read-only facade over existing owners |
| Diagnostics and explainability | `ApiExplainDiagnosticReport`, diagnostics explainability surfaces | Include confidence, reason codes and source origin when available |
| Runtime/performance stats | `ApiServerStats`, `workspace-check`, `server-stats` | Local only; no external telemetry |
| DataWindow high-confidence context | `DataWindowFastContext`, DataWindow serving adapters | High-confidence only; dynamic cases degrade honestly |
| Presentation/read models | [src/server/presentation](../src/server/presentation) | No parser, filesystem, discovery or KnowledgeBase ownership |
| Backlog/focus metadata | [docs/backlog.md](backlog.md), [docs/current-focus.md](current-focus.md), [docs/done-log.md](done-log.md) | Documentation state stays canonical |
| Agent task bundle | `ApiAiTaskContextBundle` and [src/client/aiTaskContextBundle.ts](../src/client/aiTaskContextBundle.ts) | Budgeted, paginated, read-only context |
| Read-only tool bridge | `ApiReadOnlyToolBridgeDescriptor` in [src/shared/publicApi.ts](../src/shared/publicApi.ts) | Describes tool names, schemas and local-only policy |

These contracts are serializable and budgeted. They must not expose raw parser stores, mutable `KnowledgeBase`, cache internals or full workspace dumps.

## Context Bundles

AI context bundles are compact and task-specific. The canonical builder is [src/client/aiTaskContextBundle.ts](../src/client/aiTaskContextBundle.ts), backed by `ApiAiTaskContextBundle` in [src/shared/publicApi.ts](../src/shared/publicApi.ts).

Bundle rules:

- include freshness/version, focus, source origin, confidence and reason codes when available;
- enforce token caps centrally in the bundle builder;
- expose pagination receipts for truncated diagnostic and system-symbol sections;
- include omissions honestly;
- avoid secrets, raw local paths, credentials, generated catalog dumps and full workspace dumps;
- reuse already published reports and read models instead of re-resolving semantics.

## Tools, MCP And Chat Policy

The current product surface is read-only-first. The active `src` runtime exposes local API/tool-bridge descriptors and commands for read-only context, reports and planning. It does not enable a new MCP server by default, and it does not treat historical `plugin_old` language model tooling as current runtime capability.

Initial AI tools, when added, must be read-only and scoped to contracts such as architecture summary, current symbol context, diagnostics explanation, runtime stats and high-confidence DataWindow context. Each tool needs a JSON-schema input contract, output budget, observable command/result path and tests.

MCP servers require a separate security review, trusted source decision and explicit workspace configuration. Do not add `.vscode/mcp.json` or external servers as part of routine AI prompt/agent maintenance.

## Safe Edit And Write-Enabled Policy

Any AI write-enabled workflow requires, before edits or execution:

- safe-edit-plan;
- affected file list;
- impact analysis;
- expected tests and docs;
- explicit user approval for the write-enabled action;
- receipts or validation receipt after execution;
- rollback strategy or revert instructions;
- final self-check against the original prompt/spec.

Write-enabled AI must not touch parser, `KnowledgeBase`, `DataWindowModel`, build rails or generated catalog surfaces without a focused spec and validation. Generated catalog changes need catalog ownership, provenance and compatibility review.

## Agent Validation Checklist

Before closing any spec, audit or refactor, an agent must:

1. Re-read the original prompt/spec.
2. Verify every acceptance criterion or record a justified blocker.
3. Review the files changed in the current worktree.
4. Run the smallest real validation lane that covers the risk.
5. Run docs drift when docs/backlog/current-focus/prompts/done-log changed.
6. Update owner docs without duplicating long content.
7. Record missing or failing commands with cause and risk.
8. Add done-log/backlog/current-focus updates only after validation.
9. Repeat the self-check until no untracked closure requirement remains.

## Token Budget And Maintenance

- Always-on files stay short.
- Prompt files own long workflow checklists.
- Agents own role behavior, not domain encyclopedias.
- Skills own domain workflow context and link owner docs.
- Compatibility docs and alias agents should include a retirement condition.
- New AI customization files must declare owner, scope, when to use, when not to use and validation expectations.

## Security And Data Exposure

- Read-only and write-enabled tools are separate.
- External commands, build rails, ORCA and PBAutoBuild are not AI default actions.
- Workspace Trust and Restricted Mode remain authoritative for external runners.
- Do not expose secrets, tokens, credentials, raw endpoint hosts, queries or massive raw source dumps in AI bundles.
- Redaction policies from support bundles and public reports apply to AI surfaces too.
- If a request needs private or large workspace data, prefer a local support/repro bundle with explicit user control.

## Validation Anchors

Use these lanes when touching AI orchestration:

- `npm run test:unit -- --grep "unit/(aiContextDocs|aiCustomizationGovernance|aiTaskContextBundle|publicApi|docsDriftAudit)"`
- `npm run test:architecture:rapid`
- `npm run test:docs:drift`

Broaden to `npm test` or `npm run release:verify` only when package surface, activation, public API, VSIX or release workflows change.