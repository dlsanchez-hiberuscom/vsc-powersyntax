# Quickstart - Spec 258 sourceOrigin contextual en análisis documental (B229)

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
npm run build:test ; npx mocha --ui tdd out/test/server/unit/sourceOrigin.test.js out/test/server/unit/documentAnalysis.test.js out/test/server/unit/analysisCache.test.js out/test/server/unit/watchedFileIntake.test.js out/test/server/unit/workspace.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js
```