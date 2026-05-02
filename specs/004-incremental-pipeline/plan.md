# Plan 004 - Incremental Knowledge Pipeline

**Estado:** cerrada históricamente y normalizada por B233.

## Resumen técnico retroactivo

- crear `DocumentCache` y `KnowledgeBase` como memoria semántica incremental del workspace;
- refactorizar `documentAnalysis` para publicar facts reutilizables, no metadata aislada;
- integrar un indexador cooperativo de fondo consumiendo el inventario de `WorkspaceState`;
- fijar tests unitarios/performance del pipeline base.

## Evidencia actual en el repo

- `src/server/knowledge/DocumentCache.ts`
- `src/server/knowledge/KnowledgeBase.ts`
- `src/server/indexer/workspaceIndexer.ts`
- `test/server/unit/documentCache.test.ts`
- `test/server/unit/knowledgeBase.test.ts`

## Validación histórica relevante

- `test/server/unit/documentCache.test.ts`
- `test/server/unit/knowledgeBase.test.ts`
- `test/server/performance/indexer.perf.test.ts`