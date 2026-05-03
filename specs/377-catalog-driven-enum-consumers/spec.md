# Spec 377: Catalog-driven enum consumers

## Status

Closed.

## Backlog mapping

- B363 — Catalog-driven enum hover, completion, signatureHelp and diagnostics.

## Objective

Integrar el modelo correcto de `enumerated-type` y `enumerated-value` en las surfaces visibles del lenguaje reutilizando exclusivamente `SystemCatalog`, su metadata efectiva y sus indices runtime, de forma que hover, completion, signatureHelp, semantic tokens para valores con `!` y diagnostics conservadores ofrezcan ayuda real sin reintroducir listas paralelas ni heuristicas agresivas.

## Implemented scope

- `src/server/utils/pbIdentifier.ts` deja de truncar valores enumerados con sufijo `!`, de modo que hover y el resto de consumers basados en identificador pueden resolver `FromBeginning!`, `Primary!` o `CSV!` como `enumerated-value` real del catalogo.
- `src/server/features/completion.ts`, `src/server/features/signatureHelp.ts` y `src/server/features/enumeratedContext.ts` comparten ya la resolucion del enum esperado para propiedades y parametros de llamadas, reutilizando `allowedOnProperties`, `allowedOnOwners`, `allowedInParameters`, firmas del catalogo y fallback desde `signature.label` cuando la firma oficial no publica `parameters` estructurados.
- `src/server/knowledge/system/manual/language/enumerations/index.ts` completa `allowedInParameters` para enums manual-core usados en rutas visibles (`SaveAsType`, `DWBuffer`, `DWItemStatus`, `Encoding`, `SeekType`), lo que habilita completion y signatureHelp catalog-driven en `FileSeek(...)`, `RowsMove(...)`, `SetItemStatus(...)` y contextos equivalentes sin hardcodes por nombre.
- `src/server/features/semanticTokens.ts` y `src/server/handlers/featureHandlers.ts` clasifican ya valores enumerados con `!` conocidos por `SystemCatalog` como `enumMember`, sin intentar reconstruir membresia por contexto ni romper el split canonico `enumerated-type` / `enumerated-value`.
- `src/server/features/diagnostics.ts` emite `enum-value-context-mismatch` solo cuando el tipo esperado es inequívoco en una asignacion de propiedad o en un argumento de llamada, reutilizando el mismo helper compartido de contexto enumerado en lugar de duplicar resolucion local por feature.
- `test/server/unit/hover.test.ts`, `completion.test.ts`, `signatureHelp.test.ts`, `semanticTokens.test.ts`, `diagnostics.test.ts` y `crossSurfaceGoldenMatrix.test.ts` fijan el comportamiento visible y bloquean regresiones del helper compartido y del nuevo diagnostico estable.

## Out of scope

- Abrir validacion corpus-driven o incorporar candidatos nuevos desde PFC/STD/legacy; eso pertenece a `B364`.
- Inventar valores `!`, `enumNumericValue` o membresia de tipos oficiales sin evidencia catalogable suficiente.
- Convertir semantic tokens en un consumer catalog-driven general para todos los dominios del lenguaje; este cierre se limita al tratamiento consistente de valores enumerados con `!`.
- Emitir diagnosticos agresivos cuando el tipo esperado sea ambiguo, dinamico o venga de variables/expresiones no literales.

## Acceptance evidence

- Hover sobre `SaveAsType`, `CSV!`, `Primary!` y `FromBeginning!` se construye desde metadata del catalogo sin tablas paralelas por nombre.
- Completion contextual en `mle_1.Alignment =`, `FileSeek(li_file, 0, ...)` y `ids_orders.RowsMove(...)` sugiere solo valores compatibles con el tipo esperado y el owner/property cuando esa expectativa es defendible.
- SignatureHelp proyecta documentacion util para parametros enumerados incluso cuando la firma oficial solo publica `label` y no una lista estructurada de `parameters`.
- Semantic tokens clasifica `FromBeginning!` y otros valores catalogados con `!` como `enumMember` sin degradar el provider con scans globales.
- Diagnostics solo reporta incompatibilidades inequívocas como `mle_1.Alignment = FromBeginning!`, `mle_1.Alignment = PDFTextAlignRight!` o `FileSeek(li_file, 0, Left!)`, usando el codigo estable `enum-value-context-mismatch`.

## Validation

```bash
npm run build:test
npx tsc -p tsconfig.test.json
npx vscode-test --label unit --grep "completion|hover|signatureHelp|semanticTokens|diagnostics|enumerated|enum"
npx vscode-test --label unit --grep "catalog|systemCatalog|catalogV2"
```