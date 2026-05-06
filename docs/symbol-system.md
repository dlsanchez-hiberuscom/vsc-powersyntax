# Symbol System

## 1. Propósito

Este documento es el owner canónico del sistema de símbolos del plugin. Describe el modelo conceptual, las fuentes de verdad, los owners runtime, los consumers LSP, las reglas de enrichment/localización y la matriz de validación asociada.

No sustituye a [architecture.md](architecture.md), [architecture-status.md](architecture-status.md) ni [architecture-implementation-map.md](architecture-implementation-map.md). Es el punto de lectura para responder qué es un símbolo, de dónde viene, qué confianza tiene y cómo puede presentarse sin romper identidad semántica.

## 2. Resultado de auditoría Bloque 13

Estado factual tras revisar código, documentación, scripts, tests y reportes generados:

- El sistema de símbolos ya existe en runtime como composición de snapshots, [KnowledgeBase](../src/server/knowledge/KnowledgeBase.ts), [semanticQueryService](../src/server/knowledge/resolution/semanticQueryService.ts), [SemanticQueryFacade](../src/server/features/semanticQueryFacade.ts), [SystemCatalog](../src/server/knowledge/system/SystemCatalog.ts), DataWindow model y presentation ViewModels.
- La identidad exacta de símbolos vive en [src/server/knowledge/symbolKey.ts](../src/server/knowledge/symbolKey.ts). `buildSymbolKey` es la identidad exacta; `buildConflictFamilyKey` es sólo agregación relajada para conflictos cross-project/cross-library.
- La localización del catálogo ya es presentation-only y vive bajo [src/server/knowledge/system/localization](../src/server/knowledge/system/localization), con workflow operativo en [localization.md](localization.md).
- No se detectó dependencia runtime hacia [plugin_old](../plugin_old). La frontera está documentada en [legacy-isolation.md](legacy-isolation.md) y vigilada por [architectureImports.test.ts](../test/server/unit/architectureImports.test.ts).
- El gap principal era documental: faltaba este owner unificado para símbolos, enrichments, consumers, performance y roadmap derivado.

El reporte completo del bloque queda en [bloque13-multi-audit-report.md](bloque13-multi-audit-report.md).

## 3. Modelo canónico conceptual

El runtime actual no necesita renombrar sus tipos internos para alinearse. El contrato conceptual que debe guiar futuros slices es:

```text
CanonicalSymbol = identity + origin + shape + semantic role + enrichment refs + confidence
```

Campos esperados para cualquier símbolo enriquecido futuro:

| Grupo | Campos | Regla |
| --- | --- | --- |
| Identidad | `id`, `identityKey`, `name`, `normalizedName`, `kind`, `domain`, `namespace` | Nunca se traduce ni cambia por presentación. |
| Origen | `uri`, `range`, `selectionRange`, `sourceOrigin`, `ownerName`, `fileObjectName` | Debe preservar fuente real, staging, generated, DataWindow o unknown. |
| Scope | `declarationScope`, `containerSignature`, `receiverType`, `ownerType`, `implementationKind` | Lo resuelve parser/KnownledgeBase/facade, no la capa presentation. |
| Tipo y firma | `type`, `resolvedType`, `parameters`, `returnType`, `signature` | No inventar firmas ni tipos sin evidencia. |
| Estado | `confidence`, `reasonCodes`, `ambiguityKind`, `stale`, `deprecated/obsolete` | Guesses y ambigüedad deben degradar de forma visible. |
| Enrichment | documentación, notas, tags, referencias de catálogo/localización | Deben colgar de identidad estable y resolverse lazy cuando sea posible. |
| Presentation | ViewModels, Markdown, CompletionItem, SemanticToken | No puede modificar identidad ni reabrir resolución semántica. |

## 4. Fuentes y owners

| Fuente | Owner runtime | Símbolos | Estado | Validación principal |
| --- | --- | --- | --- | --- |
| Archivo activo | [DocumentCache](../src/server/knowledge/DocumentCache.ts), [documentAnalysis.ts](../src/server/analysis/documentAnalysis.ts) | callables, scopes, variables, objetos, ranges | Implementado | `documentAnalysis`, `documentSymbols`, golden semánticas |
| Workspace publicado | [KnowledgeBase](../src/server/knowledge/KnowledgeBase.ts), [workspaceIndexer.ts](../src/server/indexer/workspaceIndexer.ts) | símbolos cross-file, herencia, dependencies | Implementado | `knowledgeBase`, `workspaceSymbols`, `references`, `rename` |
| Resolución semántica | [semanticQueryService.ts](../src/server/knowledge/resolution/semanticQueryService.ts), [semanticQueryFacade.ts](../src/server/features/semanticQueryFacade.ts) | target symbol, receiver, callable, enum context | Implementado | `semanticQueryFacade`, `queryContext`, `definition`, `hover` |
| Catálogo built-in | [SystemCatalog.ts](../src/server/knowledge/system/SystemCatalog.ts) | funciones, eventos, datatypes, enums, DataWindow built-ins | Implementado | `catalogV2`, `catalogConsistency`, `systemCatalogQueryHardening` |
| Localización | [documentationService.ts](../src/server/knowledge/system/localization/documentationService.ts) | documentación visible localizada | Implementado parcial `es` | `catalogLocalization`, `documentationLocale` |
| DataWindow | [dataWindowModel.ts](../src/server/features/dataWindowModel.ts), [dataWindowFastContext.ts](../src/server/features/dataWindowFastContext.ts) | DataObject, columnas, reports, property paths, buffers | Implementado seguro | `dataWindowModel`, `dataWindowFastContext`, `crossSurfaceGoldenMatrix` |
| Presentation | [src/server/presentation](../src/server/presentation), [hoverViewModel.ts](../src/server/features/hoverViewModel.ts) | DTOs LSP/read models compactos | Implementado parcial | `presentationContracts`, `hover`, `completion`, `signatureHelp` |
| External/build | [src/server/build](../src/server/build), [src/shared/sourceOrigin.ts](../src/shared/sourceOrigin.ts) | ORCA/PBAutoBuild metadata, external aliases | Implementado separado | build/ORCA tests, release lane |

## 5. Consumers LSP y contrato de consumo

| Consumer | Necesita | Owner que debe consultar | Cache/payload | Riesgo |
| --- | --- | --- | --- | --- |
| Hover | target, type, source, documentación, warnings | `SemanticQueryFacade`, `SystemCatalog`, DataWindow adapters | `ServingCache`, `HoverViewModel`, negative cache | No presentar guesses como hechos. |
| Completion initial | labels compactas, kind, score, data para resolve | snapshot, HotContextCache, catálogo segmentado | lista ligera, cap por policy | No cargar documentación larga. |
| Completion resolve | documentación, firma, detalles localizados | `documentationService`, catálogo, presentation | lazy por item, payload budget | Stale discard si cambia epoch/locale. |
| SignatureHelp | callable, overloads, parámetros | query context, catálogo, facade | ViewModel ligero | Filtrar por aridad/tipos simples sin inventar overloads. |
| Definition | location o fallback built-in | facade, KB, SystemCatalog, DataWindow paths | key estructurada | Degradar si `sourceOrigin`/confidence no basta. |
| References/Rename | identityKey exacta, source pool, risk | `buildSymbolKey`, `referenceSourcePool` | pool acotado | Bloquear dynamic/fallback/external. |
| Document/workspace symbols | snapshots publicados, outline | parser/KnownledgeBase | snapshot por documento | No mezclar `.srd` como PowerScript. |
| Semantic tokens | token ranges y catálogo seguro | snapshot + resolutores directos de catálogo | respuesta full mientras sea barata | Taxonomía pendiente de doc detallada. |
| Diagnostics | facts, scope, unresolved reason | analysis, KB, catalog, sourceOrigin | scheduler diagnóstico | Distinguir unknown por falta de readiness. |
| AI context bundles | resumen paginado, evidence, omissions | API pública/read-only reports | budgets de bundle | No exponer stores internos ni dumps masivos. |

## 6. Enrichment e i18n

Regla de separación:

```text
symbol identity -> enrichment metadata -> localized presentation -> LSP/read-only payload
```

- La identidad vive en snapshots, `buildSymbolKey`, catálogo y source origin.
- El enrichment puede venir de catálogo generated/manual, documentación curada, comentarios futuros o knowledge packs, siempre con owner y confidence.
- La localización sólo cambia texto visible: `summary`, `documentation`, `usageNotes`, `obsoleteMessage`, `returnDocumentation` y documentación visible de parámetros.
- No se traducen anchors técnicos: nombres, IDs, lookup keys, firmas, datatypes, enum values, owner types, DataObject, columnas o controles reales.
- Completion initial debe mantenerse compacto; completion resolve y hover pueden resolver documentación localizada de forma lazy y cacheada.

El workflow operativo vive en [localization.md](localization.md). El estado actual del reporte `es` es: `3` overlays revisados, `0` orphan overlays, `0` invalid parameter targets y cobertura sólo en `global-functions` (`3/285`, `1.05%`) según [catalogLocalizationReport.generated.md](../artifacts/catalog/catalogLocalizationReport.generated.md).

## 7. DataWindow symbols

DataWindow no es PowerScript normal. Los símbolos DataWindow se modelan con confianza y origen propios:

| Familia | Evidencia permitida | Confidence |
| --- | --- | --- |
| DataWindow control/DataStore variable | tipo declarado, binding literal, owner visible | high/medium según ruta |
| DataWindowChild | `GetChild` determinista y child route | medium salvo evidencia completa |
| DataObject literal | string literal resoluble a `.srd` indexado | high |
| Column/control/report | [dataWindowModel.ts](../src/server/features/dataWindowModel.ts) y `.srd` fuente | high si el modelo lo publica |
| Property path | `Describe/Modify`, `.Object`, `dddw.name`, root seguro | high/medium según parseabilidad |
| Dynamic/unknown | strings dinámicas o bindings ambiguos | low/unknown; sin navegación ficticia |

Los futuros enrichments DataWindow deben entrar por `DataWindowFastContext` y `dataWindowServingAdapters`, no por reparsers locales en hover/completion/definition.

## 8. Semantic tokens taxonomy

Estado actual: [semanticTokens.ts](../src/server/features/semanticTokens.ts) usa snapshot y resolutores seguros de catálogo para tokens conocidos. El siguiente slice debe convertir esta taxonomía en contrato explícito antes de añadir nuevos tokens o modifiers.

Mapping recomendado para validar en backlog:

| PowerBuilder | Token VS Code recomendado | Modifier recomendado |
| --- | --- | --- |
| object/window/userobject/structure | `class` o `struct` | `declaration` cuando aplique |
| function/event/method/external function | `function` o `method` | `declaration`, `deprecated`, `static` si aplica |
| local/argument/instance/shared/global variable | `variable` o `parameter` | `readonly`, `static`, `modification` cuando aplique |
| DataWindow/DataStore/DataWindowChild | `class`/custom futuro sólo con ADR | confidence explícita |
| DataWindow column/property | `property` | dynamic/unknown no tokeniza como hecho |
| enum type/value/constants | `enum`/`enumMember` | `deprecated` si el catálogo lo marca |

## 9. Performance y payload

Reglas para símbolos enriquecidos:

- no IO, workspace scan ni full parse en hot path con snapshot caliente;
- no `JSON.stringify` ni clones completos de catálogo en consumers interactivos;
- enrichment pesado sólo en resolve, hover cacheado o reports read-only;
- ServingCache debe segregar por locale cuando el payload visible cambia;
- unknown/ambiguous debe tener negative cache con invalidación por URI/epoch/locale;
- reports grandes deben paginar, truncar o emitir receipt en lugar de cargar todo el workspace.

Validación asociada: `npm run test:performance:gate`, `npm run test:architecture:rapid`, `hotPathAllocationBudget.test.ts`, `interactiveHotPathGuards.test.ts` y `lspPayloadBudgetContracts.test.ts`.

## 10. Regression matrix

| Escenario | Tests actuales | Follow-up esperado |
| --- | --- | --- |
| función built-in catalog-driven | `systemCatalog`, `hover`, `completion`, `signatureHelp` | overlay localizado y fallback por locale |
| función/evento de usuario | `documentAnalysis`, `semanticQueryService`, golden matrix | `CanonicalSymbol` fixture documental |
| variable local/argument/instance/shared | `diagnostics`, `references`, `rename`, `linkedEditing` | reasonCodes de confidence visibles |
| inherited/override | `inheritanceGraph`, `definition`, `signatureHelp` | fixture de overload + override family |
| ambiguous/sourceOrigin conflict | `crossProjectSymbolConflicts`, `semanticQueryService` | payload común de ambiguity |
| DataWindow column/property | `dataWindowModel`, `hover`, `definition`, `completion` | matriz DataWindow symbol model |
| semantic token enum/constant | `semanticTokens`, `catalogV2` | taxonomía completa por modifier |
| localization overlay | `catalogLocalization`, `documentationService`, `documentationLocale` | coverage por dominio y review receipts |
| completion resolve enrichment | `completion`, `documentationService` | budgets por item y stale guard |

## 11. Backlog derivado

Los follow-ups creados por Bloque 13 viven en [backlog.md](backlog.md) y no se consideran implementados por este documento. El primer slice recomendado es `SYMBOL-MODEL-01`, centrado en contrato canónico de símbolo, sourceOrigin/confidence y consumidores visibles.

El resto de la cola cubre performance/cache/payload, ViewModels, catálogo built-in, localización por dominio, matriz de regresión, glosario español/inglés, DataWindow enrichments, semantic tokens, ejemplos y framework-specific enrichments.

## 12. Validación mínima por tipo de cambio

| Cambio | Validación mínima |
| --- | --- |
| Documentación de símbolos/backlog | `npm run test:docs:drift` |
| Modelo/facade semántica | `npm run test:unit`, `npm run test:architecture:rapid` |
| Catálogo/localización | `npm run test:unit -- --grep "catalogLocalization|catalogConsistency"`, `npm run report:catalog-localization`, `npm run migrate:catalog-localization-target-ids` |
| Consumers LSP visibles | `npm run test:unit`, `npm run test:performance:gate` |
| Release/package surface | `npm run release:verify` |
