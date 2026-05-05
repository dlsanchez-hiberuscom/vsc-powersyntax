# Docs README — PowerBuilder VS Code Plugin

## Purpose

This document is the **navigation index** for the repository documentation.

It must not duplicate architecture, backlog, roadmap, AI strategy, technical guide or implementation details. It only answers:

- where each kind of information lives;
- which document owns each decision;
- what to read before changing code, specs or docs;
- which legacy/compatibility documents must not be recreated.

For documentation rules, see [`documentation-governance.md`](documentation-governance.md).

---

## Fast reading paths

### Implementing a backlog/spec item

1. [`../AGENTS.md`](../AGENTS.md)
2. [`current-focus.md`](current-focus.md)
3. [`backlog.md`](backlog.md)
4. Active spec, if any
5. [`architecture.md`](architecture.md)
6. [`architecture-status.md`](architecture-status.md)
7. Owner document for the affected area
8. [`testing.md`](testing.md)
9. [`done-log.md`](done-log.md), only when closing work

### Reviewing architecture

1. [`constitution.md`](constitution.md)
2. [`architecture.md`](architecture.md)
3. [`architecture-status.md`](architecture-status.md)
4. [`performance-budget.md`](performance-budget.md)
5. Owner domain docs: catalog, DataWindow, runtime, build, rules or AI

### Working with AI agents

1. [`../AGENTS.md`](../AGENTS.md)
2. [`ai/README.md`](ai/README.md)
3. [`ai/agent-skill-routing.md`](ai/agent-skill-routing.md)
4. [`ai/lean-token-policy.md`](ai/lean-token-policy.md)
5. [`ai-context/powerbuilder-plugin-context.md`](ai-context/powerbuilder-plugin-context.md)

### Working on PowerBuilder semantics

1. [`powerbuilder-2025-vscode-plugin-technical-guide.md`](powerbuilder-2025-vscode-plugin-technical-guide.md)
2. [`architecture.md`](architecture.md)
3. [`rules/rules-catalog.md`](rules/rules-catalog.md)
4. [`catalog/system-catalog-architecture.md`](catalog/system-catalog-architecture.md)
5. [`testing.md`](testing.md)

### Working on DataWindow/DataStore

1. [`datawindow/datawindow-architecture.md`](datawindow/datawindow-architecture.md)
2. [`powerbuilder-2025-vscode-plugin-technical-guide.md`](powerbuilder-2025-vscode-plugin-technical-guide.md)
3. [`catalog/system-catalog-architecture.md`](catalog/system-catalog-architecture.md)
4. [`rules/rules-catalog.md`](rules/rules-catalog.md)
5. [`performance-budget.md`](performance-budget.md)

### Working on build, CI or release

1. [`build/README.md`](build/README.md)
2. [`build/orca-pbautobuild-architecture.md`](build/orca-pbautobuild-architecture.md)
3. [`release/release-readiness.md`](release/release-readiness.md)
4. [`performance-budget.md`](performance-budget.md)
5. GitHub workflows in `.github/workflows/`

---

## Canonical ownership map

### Repository operating rules

- [`../AGENTS.md`](../AGENTS.md) owns AI/agent operating rules for the repository.
- [`../.github/copilot-instructions.md`](../.github/copilot-instructions.md) owns the short Copilot always-on summary.
- [`documentation-governance.md`](documentation-governance.md) owns documentation governance.
- [`contributing.md`](contributing.md) owns contribution rules.
- [`support.md`](support.md) owns support expectations.

### Product, roadmap and execution

- [`constitution.md`](constitution.md) owns non-negotiable product/architecture principles.
- [`roadmap.md`](roadmap.md) owns product phases and milestone sequencing.
- [`backlog.md`](backlog.md) owns actionable pending work.
- [`current-focus.md`](current-focus.md) owns the immediate active focus.
- [`done-log.md`](done-log.md) owns completed-work history and links to archives.

### Architecture and technical domains

- [`architecture.md`](architecture.md) owns stable architecture.
- [`architecture-status.md`](architecture-status.md) owns current implementation status.
- [`powerbuilder-2025-vscode-plugin-technical-guide.md`](powerbuilder-2025-vscode-plugin-technical-guide.md) owns PowerBuilder technical knowledge.
- [`datawindow/datawindow-architecture.md`](datawindow/datawindow-architecture.md) owns DataWindow/DataStore architecture inside the plugin.
- [`catalog/system-catalog-architecture.md`](catalog/system-catalog-architecture.md) owns system catalog architecture.
- [`catalog/ADR-0001-system-catalog-source-of-truth.md`](catalog/ADR-0001-system-catalog-source-of-truth.md) owns the catalog source-of-truth decision.
- [`rules/rules-catalog.md`](rules/rules-catalog.md) owns diagnostic rules and reason codes.
- [`performance-budget.md`](performance-budget.md) owns performance budgets and hot-path constraints.
- [`testing.md`](testing.md) owns test strategy and validation levels.

### AI documentation

- [`ai/README.md`](ai/README.md) owns the AI documentation index.
- [`ai/ai-strategy.md`](ai/ai-strategy.md) owns stable AI strategy.
- [`ai/ai-integration-architecture.md`](ai/ai-integration-architecture.md) owns technical AI integration and exposed contracts.
- [`ai/agent-skill-routing.md`](ai/agent-skill-routing.md) owns agent/skill routing.
- [`ai/lean-token-policy.md`](ai/lean-token-policy.md) owns token-efficiency policy.
- [`ai/ai-agents-catalog.md`](ai/ai-agents-catalog.md) may remain only as a compact catalog, not as duplicated agent documentation.
- [`ai-context/powerbuilder-plugin-context.md`](ai-context/powerbuilder-plugin-context.md) owns the compact AI context pack.

---

## Deprecated compatibility paths

Do not recreate these compatibility pointer documents after references are migrated:

- `docs/ai-strategy.md` → use `docs/ai/ai-strategy.md`
- `docs/ai-agents-catalog.md` → use `docs/ai/ai-agents-catalog.md` or `docs/ai/agent-skill-routing.md`
- `docs/rules-catalog.md` → use `docs/rules/rules-catalog.md`
- `docs/ai/ai-context/powerbuilder-plugin-context.md` → use `docs/ai-context/powerbuilder-plugin-context.md`

---

## Editing rules

- Do not add long content to this index.
- Add links here only when a new owner document is created.
- If a document is moved, update this index and all known references in the same change.
- If a topic appears in multiple places, keep the authoritative explanation in the owner document and replace duplicates with links.
- Never update only this index when the underlying source of truth changed.
