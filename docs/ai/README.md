# AI Documentation — PowerBuilder VS Code Plugin

## Purpose
This folder documents the AI operating model for the repository. Keep this file as an index only.

The repository uses English for AI-facing files so agents can consume instructions consistently. Product, architecture, roadmap and general human-facing documentation may remain in Spanish.

## AI layers
1. `AGENTS.md` — global AI operating contract.
2. `.github/copilot-instructions.md` — short Copilot workspace summary.
3. `.github/instructions/*.instructions.md` — path-scoped rules.
4. `.github/agents/*.agent.md` — session modes.
5. `.github/skills/*/SKILL.md` — task capabilities.
6. `.github/prompts/*.prompt.md` — reusable workflows.
7. `docs/ai-orchestration.md` — AI ownership, contracts, validation and safety policy.
8. `docs/ai-context/powerbuilder-plugin-context.md` — compact context pack.

## Documents
- `agent-skill-routing.md` — which agent/skill/prompt to use.
- `lean-token-policy.md` — token-efficiency rules and anti-patterns.
- `../ai-orchestration.md` — canonical AI orchestration and public-contract policy.

## Active agents
- `planner`
- `implementer`
- `reviewer`
- `docs`
- `release`

## Skills
- `powerbuilder-semantics`
- `datawindow-analysis`
- `catalog-maintenance`
- `performance-hotpath`
- `testing-validation`
- `docs-governance`
- `build-release`
- `official-research`

## Rules
- Do not duplicate full agent or skill content here.
- Do not copy the PowerBuilder technical guide here.
- Do not duplicate architecture decisions here.
- Update this file only when AI structure changes.
