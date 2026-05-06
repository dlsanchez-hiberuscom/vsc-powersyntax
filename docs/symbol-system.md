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

Desde `SYMBOL-MODEL-01`, este contrato queda materializado server-side en [src/server/knowledge/resolution/resolvedSemanticModels.ts](../src/server/knowledge/resolution/resolvedSemanticModels.ts) mediante `CanonicalSymbolModel` y `ResolvedSymbolModel`, con `identityKey` exacta derivada por `buildSymbolKey(...)` y shape mínima reutilizable por facade/presentation sin crear otro store semántico.

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
| Presentation | [src/server/presentation](../src/server/presentation) | `Symbol*ViewModel` y formatters compactos para hover, completion, signatureHelp, definition, diagnostics, semantic tokens y AI context | Implementado | `presentationContracts`, `hover`, `completion`, `signatureHelp` |
| External/build | [src/server/build](../src/server/build), [src/shared/sourceOrigin.ts](../src/shared/sourceOrigin.ts) | ORCA/PBAutoBuild metadata, external aliases | Implementado separado | build/ORCA tests, release lane |

## 5. Consumers LSP y contrato de consumo

| Consumer | Necesita | Owner que debe consultar | Cache/payload | Riesgo |
| --- | --- | --- | --- | --- |
| Hover | target, type, source, documentación, warnings | `SemanticQueryFacade`, `SystemCatalog`, DataWindow adapters | `ServingCache`, `SymbolHoverViewModel`, negative cache | No presentar guesses como hechos. |
| Completion initial | labels compactas, kind, score, data para resolve | snapshot, HotContextCache, catálogo segmentado | lista ligera, cap por policy | No cargar documentación larga. |
| Completion resolve | documentación, firma, detalles localizados | `documentationService`, catálogo, presentation | lazy por item, payload budget | Stale discard si cambia epoch/locale. |
| SignatureHelp | callable, overloads, parámetros | query context, catálogo, facade | `SymbolSignatureViewModel` ligero | Filtrar por aridad/tipos simples sin inventar overloads. |
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
- La capa base del catálogo sigue este orden fijo: `generated base -> manual curated enrichment -> localization overlay -> presentation formatter`.
- El enrichment puede venir de catálogo generated/manual, documentación curada, comentarios futuros o knowledge packs, siempre con owner y confidence; para el catálogo built-in, el runtime explicita ya este contrato en [src/server/knowledge/system/policy.ts](../src/server/knowledge/system/policy.ts).
- La localización sólo cambia texto visible: `summary`, `documentation`, `usageNotes`, `obsoleteMessage`, `returnDocumentation`, `parameterDocumentation` y `category` cuando sea UX-visible.
- No se traducen anchors técnicos: nombres, IDs, lookup keys, firmas, datatypes, enum values, owner types, DataObject, columnas o controles reales.
- Completion initial debe mantenerse compacto; completion resolve y hover pueden resolver documentación localizada de forma lazy y cacheada.

Contrato visible vigente del system catalog:

| Capa | Owner runtime | Qué puede hacer | Qué no puede tocar |
| --- | --- | --- | --- |
| generated base | `registry/datasets` + `queryService` | publicar la entry canónica oficial | no depende de locale/presentation |
| manual curated enrichment | `manual-core` + `manualOverlay` | añadir o completar metadata visible y curada sobre la entry base | no cambia `id`, `name`, `lookupKeys`, `normalizedName`, `domain`, `kind`, `namespace`, `ownerTypes`, `invocation`, `signatures.label`, `parameterName`, datatypes, enum values ni `sourceUrl` |
| localization overlay | `localization/schema.ts`, `localizationResolver.ts`, `documentationService` | validar anchors/metadata del overlay y sustituir solo texto visible por locale | no crea símbolos nuevos por idioma ni traduce anchors técnicos |
| presentation formatter | `SymbolHoverViewModel`, `SymbolCompletionViewModel`, `SymbolSignatureViewModel`, `SymbolDiagnosticViewModel`, `SymbolSemanticTokenViewModel` | decidir qué parte del enrichment se expone por surface | no reabre resolución semántica ni reescribe provenance |

Source/provenance vigente:

- `generated base`: `dataset = generated`, `provenance.authority = official`.
- `manual curated enrichment`: `dataset = manual-core`, `manualOverlay.mode = enrichment | override`, `provenance.authority = curated`.
- `localization overlay`: `schemaVersion = 1.0.0`, `source = manual-curated | machine-assisted-reviewed | generated-assisted`, `reviewed` explícito y solo afecta documentación visible.
- `presentation formatter`: deriva payloads visibles desde la entry resuelta y su overlay; no crea otro store semántico.

Schema estricta vigente para overlays documentales:

- vive en [src/server/knowledge/system/localization/schema.ts](../src/server/knowledge/system/localization/schema.ts) y se materializa en [src/server/knowledge/system/localization/types.ts](../src/server/knowledge/system/localization/types.ts) y [src/server/knowledge/system/localization/localizationResolver.ts](../src/server/knowledge/system/localization/localizationResolver.ts);
- exige `source` y `reviewed` explícitos por overlay, además de al menos uno entre `targetId` o `targetKey`;
- publica `schemaIssues` para `missing-source`, `missing-reviewed` y `reviewed-with-issues`;
- agrega `missingFieldsByDomain` para que authoring/reporting vea huecos documentales reales sin escanear consumers visibles;
- mantiene `examples`, `tags`, `qualityFlags` y `provenanceMetadata` como slots reservados del schema, no como payload runtime ya servido.

Workflow operativo de authoring sobre esta schema:

- empezar siempre por `npm run report:catalog-localization` para escoger el dominio por cobertura y capturar baseline antes del cambio;
- escribir overlays con `source` y `reviewed` explícitos desde el primer commit, sin dejar metadata implícita;
- usar `targetKey` cuando la entry venga de `generated` o pueda moverse con regeneraciones, y combinarlo con `targetId` si quieres drift explícito y recuperación automática;
- volver a ejecutar `catalogLocalization|catalogConsistency`, el report de localización y el migrador antes de promocionar `reviewed: true`;
- registrar cobertura antes/después e issues resueltos en el mismo corte documental.

Exposición visible por surface:

- Hover: puede mostrar `summary`, `documentation`, `usageNotes`, `obsoleteMessage`, `returnDocumentation` y `parameterDocumentation` ya localizados.
- Completion initial: solo debe transportar una versión compacta del `summary` como detalle breve; no carga documentación larga.
- Completion resolve: puede ampliar a firma, `documentation`, `usageNotes`, `obsoleteMessage`, `returnDocumentation` y `parameterDocumentation` de forma lazy.
- SignatureHelp: puede consumir `summary`, `parameterDocumentation` y `returnDocumentation`, pero mantiene `signatures.label` y `parameterName` como anchors técnicos.

Campos enriquecibles hoy sin abrir identidad semántica:

- `summary`
- `documentation`
- `usageNotes`
- `obsoleteMessage`
- `returnDocumentation`
- `parameterDocumentation`
- `category` visible

Campos visibles como `examples`, tags UX, help snippets o availability notes siguen siendo presentation-only o backlog futuro mientras no exista shape runtime explícita; no deben inventarse como si ya fueran parte del catálogo vivo.

### Ejemplos mínimos de enrichment y payload

Enrichment `manual-curated` sobre una entry canónica ya existente, en shape simplificada:

```json
{
	"name": "HTTPClient",
	"dataset": "generated",
	"manualOverlay": { "mode": "enrichment" },
	"category": "JSON / HTTP / OAuth / REST"
}
```

La identidad (`name`, `domain`, `kind`, `sourceUrl`, lookup keys) sigue viniendo del catálogo canónico; el enrichment sólo añade metadata visible o curada.

Payload simplificado donde `sourceOrigin` y `confidence` siguen siendo obligatorios para no fingir certeza:

```json
{
	"name": "ids_orders",
	"kind": "variable",
	"resolvedType": "DataStore",
	"sourceOrigin": "workspace",
	"confidence": "high"
}
```

Si el binding deja de ser defendible, la feature debe bajar `confidence` o degradar el resultado antes de inventar navegación o documentación fuerte.

Completion resolve, también en shape simplificada, para recordar la separación entre lista inicial ligera y enrichment lazy:

```json
{
	"initial": {
		"label": "FOR",
		"documentation": null,
		"data": { "locale": "es" }
	},
	"resolved": {
		"label": "FOR",
		"documentation": "Aparece en FOR...NEXT y marca el inicio del bloque iterativo."
	}
}
```

El workflow operativo vive en [localization.md](localization.md). El estado actual del reporte `es` es: `31` overlays revisados, `0` orphan overlays, `0` invalid parameter targets y cobertura activa en `global-functions` (`8/285`, `2.81%`), `datawindow-functions` (`5/302`, `1.66%`), `enumerated-types` (`3/37`, `8.11%`), `enumerated-values` (`2/245`, `0.82%`), `system-object-datatypes` (`5/224`, `2.23%`), `statements` (`3/16`, `18.75%`), `keywords` (`2/60`, `3.33%`) y `reserved-words` (`3/48`, `6.25%`) según [catalogLocalizationReport.generated.md](../artifacts/catalog/catalogLocalizationReport.generated.md).

### Framework-specific advisory packs

- Los enrichments framework-specific siguen entrando por el rail ligero de `frameworkKnowledgePackPolicy.ts` y `frameworkKnowledgePacks.ts`; no existe un segundo motor semántico ni una fuente alternativa de autoridad para el símbolo real.
- El slice cerrado `SYMBOL-FRAMEWORKS-01` añade dos familias curadas mínimas y corpus-backed: `pfc-response-dwsrv` para owners como `w_response`/`n_cst_dwsrv*` y `std-controller-shells` para owners como `wn_controller_master`/`mu_controller_master`/`wn_messagebox_master`.
- `queryApiSymbols`, `currentObjectContext`, `impactAnalysis`, `safeEditPlan` y el manifest siguen publicando `frameworkKnowledgeConflict` con la misma semántica de `workspace-wins` o `pack-advisory`; el `sourceOrigin` del workspace y la confidence del consumer siguen siendo la verdad operativa.
- Cuando el owner type framework-specific no existe en el system catalog oficial, el manifest usa samples curados (`advisoryMembers`/`advisoryEvents`) sólo para resumir el pack; ese fallback no promociona members o events a símbolos reales navegables.
- La validación mínima del slice vive en `frameworkKnowledgePacks.test.ts`, `workspaceSymbols.test.ts` y `currentObjectContext.test.ts`; el uso de `fixtures-local/pfc` y `fixtures-local/STD_FC_OrderEntry` está gated con skip honesto cuando el corpus local no existe.

## 7. DataWindow symbols

DataWindow no es PowerScript normal. Los símbolos DataWindow se modelan con confianza y origen propios:

| Familia | Evidencia permitida | Confidence |
| --- | --- | --- |
| DataWindow control/DataStore variable | tipo declarado, binding literal, owner visible | high/medium según ruta |
| DataWindowChild | `GetChild` determinista y child route | medium salvo evidencia completa |
| DataObject literal | string literal resoluble a `.srd` indexado | high |
| Column/control/report | [dataWindowModel.ts](../src/server/features/dataWindowModel.ts) y `.srd` fuente | high si el modelo lo publica |
| Computed field | `compute(...)` y `expressions` del [dataWindowModel.ts](../src/server/features/dataWindowModel.ts), expuestos por [dataWindowFastContext.ts](../src/server/features/dataWindowFastContext.ts) con dependencias seguras | high si el modelo ya resolvió el `.srd` enlazado |
| Property path | `Describe/Modify`, `.Object`, `dddw.name`, root seguro | high/medium según parseabilidad |
| Dynamic/unknown | strings dinámicas o bindings ambiguos | low/unknown; sin navegación ficticia |

Los futuros enrichments DataWindow deben entrar por `DataWindowFastContext` y `dataWindowServingAdapters`, no por reparsers locales en hover/completion/definition.

## 8. Semantic tokens taxonomy

Estado actual: [src/server/features/semanticTokens.ts](../src/server/features/semanticTokens.ts) y [test/server/unit/semanticTokens.test.ts](../test/server/unit/semanticTokens.test.ts) fijan ya `SYMBOL-TOKENS-01` como contrato explícito. La decisión vigente es:

- el legend público usa sólo token types estándar de VS Code/LSP (`type`, `class`, `function`, `method`, `property`, `variable`, `parameter`, `event`, `enumMember`, `keyword`);
- no se abren custom token types ni dependencia de locale, overlays `es` o wording de presentation;
- los modifiers visibles del contrato son `declaration`, `readonly` y los específicos del repo `defaultLibrary`, `local`, `instance`, `global`;
- `shared` colapsa por ahora al modifier visible `global` para no ampliar la legend; si eso deja de ser suficiente, la ampliación debe entrar por spec y ADR/documentación antes de tocar runtime.

Mapping adoptado:

| Evidencia PowerBuilder | Token publicado | Modifier / límite vigente |
| --- | --- | --- |
| object/window/userobject/structure del workspace | `class` | `declaration` en la declaración del tipo |
| system object datatype (`window`, `DataStore`, `DataWindowChild`, etc.) | `class` | `defaultLibrary`; sin token type custom |
| datatype escalar y enumerated type (`String`, `Integer`, enums como tipo) | `type` | `defaultLibrary` cuando viene del catálogo |
| function/subroutine global o de catálogo | `function` | `declaration` en prototypes/implementations; `defaultLibrary` para built-ins |
| event | `event` | `declaration` cuando aplica |
| argument | `parameter` | `declaration` en la firma y `local` en declaración/uso |
| local variable | `variable` | `declaration` en la declaración y `local` en declaración/uso |
| instance variable declarada | `variable` | `declaration` + `instance` |
| instance variable usada por resolución semántica | `property` | `instance` |
| shared/global variable | `variable` | `global` como contrato visible actual |
| DataWindow column/property con evidencia segura | `property` | sólo cuando la resolución es segura; dynamic/unknown no tokeniza como hecho |
| enum value con `!` | `enumMember` | `defaultLibrary`; el valor visible (`FromBeginning!`) no se traduce |
| keyword / reserved word | `keyword` | sin locale ni texto localizado |

Extensiones futuras de taxonomía deben justificar por qué el legend estándar ya no alcanza, demostrar valor visible y entrar con tests focales antes de tocar hot path.

## 9. Performance y payload

Reglas para símbolos enriquecidos:

- no IO, workspace scan ni full parse en hot path con snapshot caliente;
- no `JSON.stringify` ni clones completos de catálogo en consumers interactivos;
- enrichment pesado sólo en resolve, hover cacheado o reports read-only;
- ServingCache debe segregar por locale cuando el payload visible cambia;
- los misses seguros del carril interactivo deben entrar por negative cache con invalidación por URI/epoch/locale; hoy eso cubre hover y `completion-resolve` sin reejecutar providers cuando el item ya no materializa payload visible;
- reports grandes deben paginar, truncar o emitir receipt en lugar de cargar todo el workspace.

Validación asociada: `npm run test:performance:gate`, `npm run test:architecture:rapid`, `hotPathAllocationBudget.test.ts`, `interactiveHotPathGuards.test.ts` y `lspPayloadBudgetContracts.test.ts`.

## 10. Regression matrix

| Escenario | Tests actuales | Follow-up esperado |
| --- | --- | --- |
| built-in, user function, event, local/instance/shared/global, parameter, inherited, ambiguous, unknown, DataWindow column/property, localization overlay y completion resolve enrichment | `symbolQualityRegressionMatrix`, `crossSurfaceGoldenMatrix`, `powerbuilderSemanticGolden`, `completion`, `documentationService` | ampliar dominios/locales sin reabrir matrices paralelas |
| glosario estable de presentation/enrichments y fallback visible por locale | `presentationTerminology`, `hoverFormat`, `presentationContracts` | extender consumers sin rehardcodear labels compartidos |
| semantic token taxonomy contract | `semanticTokens`, `catalogV2` | ampliar sólo si aparecen modifiers/tipos nuevos con contrato explícito |

## 11. Backlog derivado

Los follow-ups creados por Bloque 13 viven en [backlog.md](backlog.md) y no se consideran implementados por este documento. Los cortes visibles ya cerrados del rail documental son `SYMBOL-CATALOG-BUILTINS-ENRICH-P1` (`global-functions: 8/285`), `SYMBOL-CATALOG-DW-ENRICH-P1` (`datawindow-functions: 5/302`), `SYMBOL-CATALOG-ENUMS-ENRICH-P2` (`enumerated-types: 3/37`, `enumerated-values: 2/245`), `SYMBOL-CATALOG-DATATYPES-ENRICH-P2` (`system-object-datatypes: 5/224`), `SYMBOL-CATALOG-STATEMENTS-ENRICH-P2` (`statements: 3/16`, `keywords: 2/60`, `reserved-words: 3/48`), `SYMBOL-DOCS-EXAMPLES-01`, que fija ejemplos mínimos canónicos de overlays, enrichments y payloads sin duplicar catálogo, `SYMBOL-QUALITY-01`, que fija una regression matrix compacta en `test/server/unit/symbolQualityRegressionMatrix.test.ts`, `SYMBOL-I18N-TERMS-01`, que materializa `src/server/presentation/terminology.ts` como owner del glosario estable compartido por `hover` y `completion-resolve`, `SYMBOL-DW-01`, que cierra `DataWindowFastContext` como vista rápida segura para DataWindow control, DataStore, DataWindowChild, DataObject literal, column, computed field, property path, buffer y dynamic/unknown binding, `SYMBOL-TOKENS-01`, que deja la taxonomía visible de semantic tokens cerrada con token types estándar, modifiers explícitos y pruebas de rangos/modifiers, y `SYMBOL-FRAMEWORKS-01`, que incorpora packs advisory PFC/STD sin abrir otro motor semántico; con ese baseline, `CATALOG-LOCALIZATION-DOMAINS-01` sigue siendo el pendiente parcial explícito antes de abrir nuevos dominios o una revisión global del Bloque 2.

El resto de la cola cubre performance/cache/payload, ViewModels, catálogo built-in, localización por dominio y follow-ups de enriquecimiento sólo si se promueven como slices explícitas.

## 12. Validación mínima por tipo de cambio

| Cambio | Validación mínima |
| --- | --- |
| Documentación de símbolos/backlog | `npm run test:docs:drift` |
| Modelo/facade semántica | `npm run test:unit`, `npm run test:architecture:rapid` |
| Catálogo/localización | `npm run test:unit -- --grep "catalogLocalization|catalogConsistency"`, `npm run report:catalog-localization`, `npm run migrate:catalog-localization-target-ids` |
| Consumers LSP visibles | `npm run test:unit`, `npm run test:performance:gate` |
| Release/package surface | `npm run release:verify` |
