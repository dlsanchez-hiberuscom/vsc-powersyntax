# Spec 376: Enumerated catalog completion and curated gap closure

## Status

Closed.

## Backlog mapping

- B362 — PowerBuilder enumerated datatypes and values catalog completion.

## Objective

Completar la utilidad real del catálogo de tipos y valores enumerados reutilizando el rail oficial de B361, enriqueciendo metadata manual-curated solo donde faltaba evidencia consumible y dejando explícitos los límites de los tipos oficiales que no publican miembros nominales con `!`.

## Implemented scope

- `script/generate_official_function_catalog.cjs` deja de descartar variantes oficiales de property pages cuyo título local es `For ...`, de modo que datatypes como `SecureProtocol` conservan `documentation` y `allowedOnOwners` oficiales sin inventar `enumValues` nominales cuando Appeon solo publica códigos enteros.
- `src/server/knowledge/system/manual/language/enumerations/index.ts` completa la documentación útil de los tipos manual-core de UI/archivo (`Border`, `Alignment`, `FillPattern`, `WindowType`, `WindowState`, `FileAccess`, `FileMode`, `Encoding`) y cierra el gap curado de `SeekType` con `FromBeginning!`, `FromCurrent!` y `FromEnd!` respaldados por evidencia del corpus real (`FileSeek(...)`) y por el helper PFC que convierte `seektype` a texto.
- `test/server/unit/catalogV2.test.ts` fija el cierre: `SecureProtocol` mantiene explicación oficial y sigue sin valores nominales fabricados; los tipos manual-core ya no quedan mudos; `FillPattern` mantiene el merge manual + generated; y `SeekType` resuelve sus tres valores canónicos.
- La validación runtime sobre `SystemCatalog` compilado deja `missingDocs = []` en `enumerated-types` y confirma la presencia documentada de los mínimos del backlog `B362`, incluido `SeekType`.

## Out of scope

- Expandir consumers visibles de enums en hover/completion/signatureHelp/diagnostics más allá del catálogo base (`B363`).
- Abrir un segundo extractor oficial o volver a scrapear Appeon fuera del rail unificado de `script/generate_official_function_catalog.cjs`.
- Inventar `enumNumericValue` o `enumValues` con `!` cuando la evidencia disponible solo sustenta existencia del tipo o significado textual parcial.

## Acceptance evidence

- `SecureProtocol` resuelve como `enumerated-type` oficial con documentación y owners oficiales, pero `listEnumeratedValuesForType('SecureProtocol')` sigue devolviendo `[]`.
- Ningún `enumerated-type` runtime queda sin `documentation` (`missingDocs = []`).
- El conjunto mínimo de B362 (`SaveAsType`, `DWBuffer`, `DWItemStatus`, `DWConflictResolution`, `SQLPreviewFunction`, `SQLPreviewType`, `SaveMetaData`, `WebPagingMethod`, `Encoding`, `FileAccess`, `FileMode`, `SeekType`, `AccessibleRole`) está presente con documentación y cobertura útil de valores.
- `SeekType` queda publicado como gap manual-curated de archivo con `FromBeginning!`, `FromCurrent!` y `FromEnd!`, sin depender de aliases legacy ni de heurísticas fuera del catálogo.

## Validation

```bash
node script/generate_official_function_catalog.cjs
npm run compile
npx tsc -p tsconfig.test.json
npx vscode-test --label unit --grep "unit/catalogGeneratorScript|unit/catalogV2"
```