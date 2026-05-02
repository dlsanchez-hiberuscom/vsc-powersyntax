# Quickstart - Spec 257 PBAutoBuild build-file discovery and validation (B182)

## Contexto minimo

Leer:

- `docs/00-ai-entrypoint.md`
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/testing.md`

## Comando estrecho sugerido

```bash
npm run build:test ; npx mocha --ui tdd out/test/server/unit/pbAutoBuildBuildFiles.test.js out/test/server/unit/workspace.test.js out/test/server/unit/watchedFileIntake.test.js
```