# Plan 008 - Signature Help base

**Estado:** cerrada históricamente y normalizada por B233.

## Resumen técnico retroactivo

- registrar `signatureHelpProvider` en el servidor con triggers `(` y `,`;
- resolver el callable actual usando `KnowledgeBase` y `semanticQueryService`;
- calcular el parámetro activo respetando nesting y comas del nivel actual;
- fijar la respuesta LSP en tests unitarios del provider.

## Evidencia actual en el repo

- `src/server/features/signatureHelp.ts`
- `test/server/unit/signatureHelp.test.ts`

## Validación histórica relevante

- `test/server/unit/signatureHelp.test.ts`