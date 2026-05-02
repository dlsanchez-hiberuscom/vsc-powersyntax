# Spec 276 - ORCA staging provenance and source priority (B192)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar el hueco de provenance que quedaba entre el source real y el staging ORCA exportado: el runtime debe preferir de forma estable el source real cuando ambos publican el mismo símbolo, sin perder el staging como backing read-only ni abrir todavía import/compile write-enabled.

## 2. Estado real actual

`B192` queda `Closed`: `KnowledgeBase`, `semanticQueryService` y `semanticWorkspaceManifest` consumen la misma prioridad de `sourceOrigin`, de modo que `solution-source` y otros sources reales ganan sobre `orca-staging` tanto en buckets globales como en resolución de query y serving truncado del manifest.

## 3. Objetivo

Formalizar la prioridad efectiva entre source real y `orca-staging` para que definition/query/serving dejen de depender del orden de ingestión y para que el carril legacy llegue a `B193` con provenance cerrada y sin ambigüedad artificial.

## 4. Alcance

- ordenar buckets globales y por kind de `KnowledgeBase` según la prioridad explícita de `sourceOrigin`;
- desempatar candidatos equivalentes del query engine y el `global-fallback` usando la misma prioridad de provenance;
- alinear `semanticWorkspaceManifest` con ese mismo orden efectivo cuando limita objetos visibles;
- fijar validación unitaria focal sobre KB, query engine y manifest.

## 5. Fuera de alcance

- abrir import/compile ORCA, regenerate o rebuild sobre PBL (`B193+`);
- permitir staging ORCA como fuente canónica o editable write-enabled;
- introducir un segundo modelo paralelo de authority/provenance fuera del backbone actual.

## 6. Criterios de aceptación

- AC1. `Definition` y el query engine prefieren source real frente a `orca-staging` cuando ambos publican el mismo símbolo.
- AC2. `KnowledgeBase` y `semanticWorkspaceManifest` mantienen ese mismo orden efectivo y no dependen del orden de ingestión.
- AC3. La validación focal cubre el conflicto `source real > orca-staging` en buckets, resolución y serving read-only.
- AC4. El foco canónico se mueve a `B193` sin abrir todavía import/compile.

## 7. Documentación afectada

- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/roadmap.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/knowledgeBase.test.js out/test/server/unit/semanticQueryService.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/definition.test.js --grep "prioriza source real|prefiere source real frente a orca-staging"`

## 9. Cierre registrado

- `src/server/knowledge/KnowledgeBase.ts` ordena buckets globales y por kind según la prioridad explícita de `sourceOrigin`;
- `src/server/knowledge/resolution/semanticQueryService.ts` desempata candidatos equivalentes y `global-fallback` usando esa misma prioridad antes de proyectar winner/confidence;
- `test/server/unit/knowledgeBase.test.ts`, `semanticQueryService.test.ts`, `semanticWorkspaceManifest.test.ts` y `definition.test.ts` fijan el contrato `source real > orca-staging` en KB, query engine, manifest y Definition read-only.