# Documentation Governance — PowerBuilder VS Code Plugin

## Purpose

This document defines how repository documentation is created, updated, split, deleted and linked.

Its goal is to prevent:

- duplicated truth across Markdown files;
- inconsistent architecture/backlog/status information;
- oversized always-on AI context;
- stale compatibility documents;
- agents rewriting the same information in several places.

This document owns documentation process. It does **not** own architecture, backlog, roadmap, technical PowerBuilder knowledge or AI strategy.

---

## Core principle

> One fact, one owner document.

Other documents may summarize the fact in one short sentence, but must link to the owner instead of duplicating details.

---

## Authority levels

### Level 1 — Operating contracts

These documents define mandatory repository behavior:

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `.github/instructions/*.instructions.md`
- `.github/agents/*.agent.md`
- `.github/skills/*/SKILL.md`
- `.github/prompts/*.prompt.md`

Rules:

- `AGENTS.md` must stay short and cross-tool.
- `copilot-instructions.md` must stay shorter than `AGENTS.md` and point to it.
- Agents are session modes, not knowledge bases.
- Skills are specialized task capabilities.
- Instructions are path-scoped rules.
- Prompts are repeatable workflows.

### Level 2 — Canonical project docs

These documents own durable repository truth:

- `docs/constitution.md`
- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/datawindow/datawindow-architecture.md`
- `docs/catalog/system-catalog-architecture.md`
- `docs/rules/rules-catalog.md`
- `docs/performance-budget.md`
- `docs/testing.md`
- `docs/ai/*`

Rules:

- These documents must be updated when their owned facts change.
- They must not contain volatile spec state unless they explicitly own implementation status.
- They must link to related docs instead of copying sections.

### Level 3 — Execution/status docs

These documents own current work state:

- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/roadmap.md`
- `docs/architecture-status.md`
- `docs/done-log.md`

Rules:

- Keep status concise and current.
- Move long history to `docs/history/` when needed.
- Do not duplicate stable architecture; link to `architecture.md`.
- Do not duplicate detailed technical guide content; link to the owner.

### Level 4 — Indexes and entrypoints

These documents help navigation:

- `README.md`
- `docs/README.md`
- `docs/ai/README.md`
- `docs/build/README.md`

Rules:

- Indexes are not owners of technical detail.
- Indexes should contain links, reading paths and short descriptions only.
- If an index grows into detailed documentation, split the detail into an owner document.

---

## Ownership by topic

### Stable architecture

Owner: `docs/architecture.md`

Allowed content:

- layers and boundaries;
- LSP/server/client split;
- core/runtime/domain boundaries;
- indexing/cache architecture;
- source-origin/confidence/evidence model;
- integration points.

Forbidden content:

- open backlog items;
- release status;
- done-log history;
- long PowerBuilder language reference.

### Current architecture status

Owner: `docs/architecture-status.md`

Allowed content:

- implemented/partial/pending architecture areas;
- current architectural risks;
- recent decisions with links to owner docs;
- known gaps.

Forbidden content:

- rewriting `architecture.md`;
- backlog-level task detail;
- long historical logs.

### Backlog

Owner: `docs/backlog.md`

Allowed content:

- open items;
- priority;
- acceptance criteria;
- affected owner docs;
- validation gates.

Forbidden content:

- full architecture explanations;
- long implementation designs;
- done-log entries.

### Current focus

Owner: `docs/current-focus.md`

Allowed content:

- current objective;
- next recommended slice;
- explicit non-goals;
- agents/skills recommended;
- validation expected.

Forbidden content:

- full backlog;
- roadmap;
- historical notes.

### Roadmap

Owner: `docs/roadmap.md`

Allowed content:

- phases;
- milestones;
- dependencies;
- strategic sequencing.

Forbidden content:

- detailed spec tasks;
- active sprint status;
- completed-work logs.

### Done log and history

Owner: `docs/done-log.md`

Rules:

- Keep recent completed items in `done-log.md`.
- Move large historical blocks to `docs/history/` when the file becomes too large.
- Link historical archives from `done-log.md`.
- Do not use `done-log.md` as a design document.

### PowerBuilder technical knowledge

Owner: `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

Allowed content:

- PowerBuilder ecosystem concepts;
- PowerScript syntax and semantics;
- object model, functions, events and scopes;
- DataWindow/DataStore technical background;
- PBL/PBT/PBW/Solution/Workspace concepts;
- ORCA/PBAutoBuild technical background when relevant.

Forbidden content:

- plugin backlog;
- current implementation status;
- AI operating model;
- CI workflow details.

### DataWindow architecture

Owner: `docs/datawindow/datawindow-architecture.md`

Allowed content:

- DataWindow support inside the plugin;
- safe/advanced modes;
- DataWindow-scoped constants;
- columns/controls/computed fields;
- sourceOrigin/confidence;
- relation with catalog and diagnostics.

Forbidden content:

- full PowerBuilder DataWindow reference;
- unrelated PowerScript semantics;
- release workflow details.

### Catalog and rules

Owners:

- `docs/catalog/system-catalog-architecture.md`
- `docs/catalog/ADR-0001-system-catalog-source-of-truth.md`
- `docs/rules/rules-catalog.md`

Rules:

- Catalog architecture owns source-of-truth structure and compatibility.
- ADR owns irreversible source-of-truth decisions.
- Rules catalog owns diagnostic codes/reason codes.
- Do not mix localization with canonical catalog meaning.
- Do not rename/remove stable IDs without migration notes.

### AI operating model

Owners:

- `docs/ai/README.md`
- `docs/ai/ai-strategy.md`
- `docs/ai/ai-integration-architecture.md`
- `docs/ai/agent-skill-routing.md`
- `docs/ai/lean-token-policy.md`
- `docs/ai-context/powerbuilder-plugin-context.md`

Rules:

- `docs/ai/README.md` is an index only.
- `ai-strategy.md` owns durable AI principles.
- `ai-integration-architecture.md` owns technical AI-facing contracts.
- `agent-skill-routing.md` owns which agent/skill to use.
- `lean-token-policy.md` owns token-efficiency rules.
- `ai-context/powerbuilder-plugin-context.md` is a compact context pack, not a full manual.

---

## Compatibility documents

Compatibility pointer documents are temporary.

Allowed only when:

- external references still point to old paths;
- a migration is actively in progress;
- the pointer is short and clearly names the new owner.

Must be removed when:

- references have been migrated;
- the pointer is only preserving historical paths;
- the new owner is already linked from `docs/README.md`.

Known compatibility paths that should not be recreated after cleanup:

- `docs/ai-strategy.md`
- `docs/ai-agents-catalog.md`
- `docs/rules-catalog.md`
- `docs/ai/ai-context/powerbuilder-plugin-context.md`

---

## Required update matrix

### When changing code

Update:

- owner domain doc if architecture/behavior changed;
- `testing.md` if validation strategy changed;
- `architecture-status.md` if implementation state changed;
- `done-log.md` when the change is completed.

### When changing backlog/specs

Update:

- `backlog.md`;
- `current-focus.md` if priority/focus changed;
- `roadmap.md` only if phase sequencing changed;
- owner docs only if durable decisions changed.

### When changing architecture

Update:

- `architecture.md` for stable design;
- `architecture-status.md` for implementation status;
- domain owner docs if affected;
- `AGENTS.md` or AI docs only if agent behavior must change.

### When changing AI setup

Update:

- `AGENTS.md` if global operating rules change;
- `.github/agents/*` if session modes change;
- `.github/skills/*` if task capabilities change;
- `.github/instructions/*` if path-scoped rules change;
- `docs/ai/agent-skill-routing.md` if routing changes;
- `docs/ai/lean-token-policy.md` if token policy changes.

---

## Link and deletion rules

Before deleting or moving a document:

1. Identify the replacement owner.
2. Search all references to the old path.
3. Update references in the same change.
4. Keep a temporary pointer only if external compatibility is necessary.
5. Run or perform a link check.

Never delete a document only because its title looks duplicated. First verify whether it contains unique owner content.

---

## AI-specific documentation rules

AI agents must:

- read owner docs before editing;
- keep always-on context lean;
- avoid copying owner-document content into agents or prompts;
- include affected docs in implementation plans;
- report documentation changes in final output;
- never close work as complete if affected docs were not updated.

AI agents must not:

- create new duplicate docs for convenience;
- keep stale compatibility files indefinitely;
- move facts between owners without updating references;
- convert indexes into large manuals;
- compress the PowerBuilder technical guide into `AGENTS.md` or agents.
