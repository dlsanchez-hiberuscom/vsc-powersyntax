# Quickstart - Spec 276 ORCA staging provenance and source priority (B192)

## Validación focal

1. Ejecutar `npm run build:test`.
2. Ejecutar `npx mocha --ui tdd out/test/server/unit/knowledgeBase.test.js out/test/server/unit/semanticQueryService.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/definition.test.js --grep "prioriza source real|prefiere source real frente a orca-staging"`.

## Resultado esperado

- `KnowledgeBase` devuelve primero el símbolo de source real cuando también existe en `orca-staging`.
- `semanticQueryService` reduce el `global-fallback` al target de source real.
- `provideDefinition` navega al target de source real sin devolver ambigüedad artificial.
- `semanticWorkspaceManifest` sirve primero el objeto de source real cuando el límite de `maxObjects` obliga a truncar duplicados.