# Plan 005 - Workspace Symbols y Go to Definition

**Estado:** cerrada históricamente y normalizada por B233.

## Resumen técnico retroactivo

- exponer `Workspace Symbols` y `Definition` directamente sobre la `KnowledgeBase` sin duplicar parseo;
- introducir helpers de palabra bajo cursor y el wiring LSP correspondiente en `server.ts`;
- fijar tests unitarios para ambas features como base del serving posterior.

## Evidencia actual en el repo

- `src/server/features/workspaceSymbols.ts`
- `src/server/features/definition.ts`
- `src/server/utils/wordAtPosition.ts`
- `test/server/unit/workspaceSymbols.test.ts`
- `test/server/unit/definition.test.ts`

## Validación histórica relevante

- `test/server/unit/workspaceSymbols.test.ts`
- `test/server/unit/definition.test.ts`