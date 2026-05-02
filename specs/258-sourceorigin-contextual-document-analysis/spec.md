# Spec 258 - sourceOrigin contextual en análisis documental (B229)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar la divergencia entre `WorkspaceState`/routing y el análisis documental, haciendo que `documentAnalysis`, la caché interactiva, el indexador y el watcher consuman `sourceOrigin` contextual cuando exista autoridad topológica y dejen `inferSourceOrigin()` solo como fallback.

## 2. Estado real actual

- `WorkspaceState` ya mantenía `sourceOrigin` por URI y lo reconciliaba con routing/topología, pero `documentAnalysis.ts` seguía sellando lineage y snapshots con `inferSourceOrigin(document.uri)`;
- `analysisCache.ts` reutilizaba análisis solo por versión/fingerprint, de modo que un cambio topológico podía dejar snapshots interactivos con provenance obsoleto;
- `watchedFileIntake.ts` actualizaba `WorkspaceState`, pero no rematerializaba snapshots ya publicados cuando cambiaba `sourceOrigin` sin cambiar el archivo fuente.

## 3. Objetivo

Hacer que análisis interactivo e incremental compartan el mismo `sourceOrigin` contextual que discovery/routing y que los snapshots publicados se recompongan cuando ese provenance cambie por topología.

## 4. Alcance

- permitir que `documentAnalysis` y `analyzeDocumentStructural` reciban `sourceOrigin` contextual explícito;
- conectar `analysisCache` a un resolver de provenance dependiente de `WorkspaceState` y forzar reanálisis cuando cambie aunque la versión no cambie;
- propagar ese provenance contextual desde watcher e indexador;
- rematerializar snapshots/document cache afectados cuando cambie `sourceOrigin` por eventos topológicos;
- cubrir el comportamiento con tests focales de análisis, caché y watcher incremental.

## 5. Fuera de alcance

- redefinir la taxonomía de `sourceOrigin` o `lineage.authority`;
- abrir nuevas superficies UX o APIs públicas de provenance;
- rediseñar `WorkspaceState` o el modelo de proyecto más allá del flujo necesario para alinear análisis y snapshots.

## 6. Criterios de aceptacion

- AC1. `documentAnalysis`, `analysisCache`, indexador y watcher publican el `sourceOrigin` contextual cuando `WorkspaceState` ya lo conoce.
- AC2. `inferSourceOrigin()` queda como fallback cuando la autoridad contextual sea inexistente o solo `unknown`.
- AC3. Un cambio topológico que altere `sourceOrigin` rematerializa snapshots ya publicados sin exigir rediscovery global.
- AC4. Las docs canónicas dejan de describir `B229` como deuda abierta.

## 7. Documentacion afectada

- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/roadmap.md`
- `docs/testing.md`

## 8. Validacion requerida

- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/sourceOrigin.test.js out/test/server/unit/documentAnalysis.test.js out/test/server/unit/analysisCache.test.js out/test/server/unit/watchedFileIntake.test.js out/test/server/unit/workspace.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js`

## 9. Resultado de cierre

- `src/server/analysis/documentAnalysis.ts` acepta ahora `sourceOrigin` contextual explícito para que facts/snapshots no dependan solo de la URI;
- `src/server/analysis/analysisCache.ts` incorpora un resolver contextual y deja de reutilizar análisis cuando cambia el provenance aunque versión y fingerprint se mantengan;
- `src/server/indexer/workspaceIndexer.ts`, `src/server/workspace/watchedFileIntake.ts` y `src/server/server.ts` propagan `sourceOrigin` contextual desde `WorkspaceState`, usando `inferSourceOrigin()` solo como fallback real;
- `watchedFileIntake.ts` rematerializa snapshots/document cache cuando un cambio topológico altera `sourceOrigin` de archivos ya conocidos;
- `test/server/unit/documentAnalysis.test.ts`, `analysisCache.test.ts` y `watchedFileIntake.test.ts` fijan el nuevo contrato contextual e incremental.