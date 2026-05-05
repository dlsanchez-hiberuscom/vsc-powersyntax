# Copilot Instructions — PowerBuilder VS Code Plugin

Follow `AGENTS.md` as the authoritative AI operating contract.

## Architecture
- Thin VS Code client; LSP/server/core own semantic truth.
- Keep activation fast: no blocking full scans, deep DataWindow analysis or ORCA/PBAutoBuild discovery on startup.
- Use incremental parsing/indexing/caching and atomic state updates.
- Preserve catalog compatibility and existing query behavior.
- Treat `plugin_old` as reference-only evidence, never as runtime dependency.

## PowerBuilder rules
- Respect PowerBuilder object model, scopes, inheritance, functions/events, variables and legacy PFC/STD patterns.
- DataWindow/DataStore support must use source-origin and confidence gates.
- Do not invent official constants, properties or APIs. Research or mark uncertainty.

## Change discipline
- Inspect existing code/tests before editing.
- Keep changes scoped and additive unless the backlog/spec explicitly says otherwise.
- Update affected docs in the same change.
- Run relevant validation and include exact commands/results.
