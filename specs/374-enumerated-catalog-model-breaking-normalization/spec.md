# Spec 374: Enumerated catalog model breaking normalization

## Status

Closed.

## Backlog mapping

- B360 — Enumerated catalog model breaking normalization.

## Objective

Normalizar de forma estricta el modelo de enumerados PowerBuilder separando `enumerated-type` y `enumerated-value`, eliminando la representación legacy donde tipos con sufijo `!` se publicaban como entradas canónicas del catálogo.

## Implemented scope

- `src/server/knowledge/system/types.ts`, `normalization.ts` y `manual/common.ts` amplían el contrato del catálogo con `PbSystemSymbolKind = 'enumerated-type'`, `PbSystemSymbolDomain = 'enumerated-types'` y metadata específica de enums (`documentation`, `enumValues`, `enumValueOf`, `enumNumericValue`, `enumValueMeaning`, `allowedOnOwners`, `allowedOnProperties`, `allowedInParameters`).
- `src/server/knowledge/system/manual/language/enumerations/index.ts` queda migrado al modelo canónico: tipos sin `!` (`SaveAsType`, `DWBuffer`, `DWItemStatus`, `Encoding`, `WindowType`, etc.) y valores con `!` ligados por `enumValueOf` (`Text!`, `CSV!`, `Primary!`, `EncodingUTF8!`, etc.), mientras `manual/index.ts` publica ya los dominios separados `enumerated-types` y `enumerated-values`.
- `src/server/knowledge/system/indexes/buildIndexes.ts`, `services/queryService.ts`, `SystemCatalog.ts` y `consistency.ts` endurecen queries e invariantes: `listEnumeratedTypes()`, `resolveEnumeratedType()`, `resolveEnumeratedValue()`, `listValuesForEnumeratedType()` y `invalidEnumeratedTypeNames` usan el modelo nuevo y no mantienen aliases legacy para tipos con `!`.
- `src/server/features/completion.ts` y `hover.ts` alinean surfaces visibles con el split breaking, incorporando `enumerated-types` al completion global contextual y hover específico para tipos/valores enumerados.
- `docs/architecture.md`, `docs/testing.md`, `docs/rules-catalog.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/roadmap.md`, `docs/backlog.md`, `docs/current-focus.md` y `docs/done-log.md` quedan alineados con el cierre de B360 y el paso del foco hacia `B361`.

## Out of scope

- Implementar el extractor oficial de enumerados (`B361`).
- Completar cobertura funcional amplia de enums más allá del set representativo necesario para fijar el modelo (`B362`).
- Introducir diagnósticos agresivos de membership enumerado sin tipo esperado explícito.

## Acceptance evidence

- `resolveEnumeratedType('SaveAsType')` resuelve como `enumerated-type`.
- `resolveEnumeratedType('SaveAsType!')` no resuelve.
- `resolveEnumeratedValue('Text!')` y `resolveEnumeratedValue('Primary!')` resuelven como `enumerated-value` con `enumValueOf` correcto.
- Ninguna entrada `enumerated-type` termina en `!` y `buildCatalogConsistencyReport()` mantiene `invalidEnumeratedTypeNames = []`.
- `resolveLanguageSymbol()` prioriza `enumerated-type` antes de `system-global` y `enumerated-value`.
- Completion y hover consumen el modelo nuevo sin reintroducir aliases incompatibles.

## Validation

```bash
npm run test:unit -- --grep "catalogV2|systemCatalogQueryHardening"
npm run test:unit -- --grep "completion|hover|semanticTokens|signatureHelp"
npm run test:unit -- --grep "catalog|systemCatalog|catalogV2|enumerated|enum"
```