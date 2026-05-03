# Spec 370: System catalog query/index hardening v2

## Status

Closed.

## Backlog mapping

- B365 — System catalog query/index hardening v2.

## Objective

Endurecer `src/server/knowledge/system/indexes/buildIndexes.ts`, `queryService.ts` y `SystemCatalog.ts` para que las queries del catálogo del sistema usen índices compuestos explícitos, eviten scans completos en hot paths y mantengan una prioridad estable para `resolveLanguageSymbol()`.

## Implemented scope

- `buildIndexes.ts` publica buckets compuestos y congelados para `byDomainAndLookupKey`, `byKindAndLookupKey`, `byEnumValueOf` y `byOwnerTypeAndDomain`, manteniendo creación determinista y buckets readonly para consumers.
- `queryService.ts` expone APIs indexadas para dominio, kind, owner type y enum value lookup (`listSystemSymbolsByDomain`, `isKnownSystemOwnerType`, `findEntriesByDomainAndLookupKey`, `findEntriesByKindAndLookupKey`, `listValuesForEnumeratedType`, `resolveEnumValueForExpectedType`) y mueve allí la lógica pesada antes dispersa en `SystemCatalog.ts`.
- Las queries owner-scoped dejan de concatenar listas amplias cuando hay owner types conocidos: member functions y events reutilizan `byOwnerTypeAndDomain` y siguen respetando el scoring local de owner/domain.
- `resolveLanguageSymbol()` deja de depender del orden accidental del registry y usa `PB_LANGUAGE_SYMBOL_RESOLUTION_PRIORITY` con prioridad explícita `reserved-word -> keyword -> pronoun -> datatype -> system-type -> system-global -> enumerated-value -> operator -> property -> constant`.
- `SystemCatalog.ts` queda como facade delgada sobre `queryService.ts`, sin acceso directo a `PB_SYSTEM_SYMBOL_REGISTRY.indexes` para listados y resoluciones del catálogo.
- `test/server/unit/systemCatalogQueryHardening.test.ts` y `test/server/unit/catalogV2.test.ts` fijan el nuevo contrato y bloquean regresiones en dominio, kind, enum lookup, owner types nativos y prioridad de lenguaje.

## Out of scope

- Introducir todavía un kind/domain separado `enumerated-type`; el catálogo actual sigue modelando este carril mediante `enumerated-value` curado y aliases explícitos.
- Cambiar IDs, namespaces, datasets, domains o ordering público del catálogo fuera de las APIs de query endurecidas.
- Ampliar slices visuales/runtime/manuales; ese trabajo queda para B358/B359 y validaciones corpus-driven posteriores.

## Acceptance evidence

- `PbSystemSymbolIndexes` expone índices compuestos y readonly para dominio, kind, enum value y owner type por dominio.
- `queryService.ts` concentra las queries indexadas y `SystemCatalog.ts` queda desacoplado del acceso directo a índices del registry.
- `resolveLanguageSymbol()` tiene prioridad explícita y testeada.
- `npm run build:test` compila limpio.
- `npm run test:unit -- --grep "systemCatalogQueryHardening|catalogV2"` pasa limpio.