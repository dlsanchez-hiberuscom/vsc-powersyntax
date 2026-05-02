# Plan 012 - Semantic Tokens

**Estado:** cerrada históricamente y normalizada por B233.

## Resumen técnico retroactivo

- registrar `semanticTokens/full` y su legend en el servidor LSP;
- mapear tipos/roles semánticos desde el análisis documental y la `KnowledgeBase`;
- apoyarse en `DocumentCache` y facts ya publicados para no reparsear en el hot path;
- fijar el provider con tests unitarios del legend y del coloreado semántico base.

## Evidencia actual en el repo

- `src/server/features/semanticTokens.ts`
- `test/server/unit/semanticTokens.test.ts`

## Validación histórica relevante

- `test/server/unit/semanticTokens.test.ts`