# LEAN Token Policy

## Principle
Always-on context must be tiny. Specialized knowledge must load only when relevant.

## Rules
- Keep `AGENTS.md` short and cross-tool.
- Keep `copilot-instructions.md` shorter than `AGENTS.md`.
- Keep each `.instructions.md` focused on one area and path-scoped.
- Keep agents as session wrappers, not encyclopedias.
- Put reusable domain workflows into skills.
- Put long reference knowledge in owner docs, not in agents.
- Link to owner docs instead of copying sections.

## What belongs where
- `AGENTS.md`: mandatory global behavior.
- `.github/copilot-instructions.md`: short Copilot summary.
- `.github/instructions/`: automatic rules by file path.
- `.github/agents/`: planner/implementer/reviewer/docs/release modes.
- `.github/skills/`: PowerBuilder/DataWindow/catalog/testing/build/docs capabilities.
- `.github/prompts/`: reusable workflows invoked manually.
- `docs/ai-context/`: compact prompt context.

## Anti-patterns
- Many overlapping active agents.
- Long universal AI context files.
- Repeating architecture rules in every agent.
- Mixing DataWindow, catalog, release and docs policy into one mega-agent.
- Keeping compatibility pointer docs after references are migrated.
