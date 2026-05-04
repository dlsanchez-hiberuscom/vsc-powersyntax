# Done Log — Plugin PowerBuilder 2025 para VS Code

**Documento complementario del backlog activo.**

Este archivo recoge trabajo **cerrado** e hitos **históricos** que ya no deben contaminar el backlog operativo principal.

---

## Reglas de uso

- El **backlog activo** contiene solo trabajo **Open**, **Partial**, **Ready for closure** o **Blocked**.
- Este **done-log** conserva:
  - ítems **completamente cerrados**;
  - auditorías ya resueltas;
  - sprints históricos cerrados;
  - decisiones técnicas relevantes que conviene poder rastrear.
- Si un ítem está **cerrado parcialmente**, permanece en el backlog activo y **no** se mueve aquí.
- Si un ítem pasa a `Done`, debe salir del backlog activo y registrarse aquí con:
  - resultado técnico;
  - alcance trazado por spec;
  - validación ejecutada;
  - documentación afectada si aplica.

---

# 1. Ítems cerrados movidos fuera del backlog activo

## 1.135 B378. AI PowerBuilder context pack and token budget contract — **Cerrada (AI supportability/context budget 2026-05)**

**Objetivo:** crear un context pack compacto, estable y versionado para que tareas IA sobre el plugin puedan arrancar con arquitectura, reglas PowerBuilder, validación y ownership documental sin arrastrar documentación masiva ni datasets completos al prompt.

**Resultado registrado:**
- `docs/ai-context/powerbuilder-plugin-context.md` fija ya el pack corto del repositorio con misión, boundaries, reglas PowerBuilder/SQL/DataWindow, policy de catálogo/localización, comandos de validación, workflow recomendado, `do not do`, foco activo y ownership documental, enlazando siempre a la documentación propietaria en vez de duplicarla;
- `docs/ai-strategy.md`, `docs/ai-orchestrator.md`, `docs/ai-agents-catalog.md`, `docs/developer-workflows.md`, `docs/spec-driven-development.md` y `AGENTS.md` referencian ya ese pack como entrada corta para tareas IA con budget reducido, dejando explícito que la autoridad sigue en constitución/arquitectura/current-focus y resto de docs canónicas;
- `test/server/unit/aiContextDocs.test.ts` detecta si el pack desaparece, pierde headings mínimos, deja de mencionar `workspace-check`/`object-check`, crece más allá de un budget razonable o queda sin referencias desde la documentación canónica;
- `specs/383-ai-context-pack-contract/` deja la traza SDD mínima de `B378` con `spec.md`, `plan.md` y `tasks.md`, respetando la numeración secuencial de specs y evitando reutilizar la carpeta histórica `specs/378-*`.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit -- --grep "docs|ai-context|context-budget|documentation"`
- `npm run test:unit -- --grep "aiContextDocs|documentationService|documentationLocale"`

**Documentación alineada:**
- `docs/ai-context/powerbuilder-plugin-context.md`
- `docs/ai-strategy.md`
- `docs/ai-orchestrator.md`
- `docs/ai-agents-catalog.md`
- `docs/developer-workflows.md`
- `docs/spec-driven-development.md`
- `docs/testing.md`
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/done-log.md`
- `AGENTS.md`

## 1.134 B375. Generated localization compatibility with regenerated catalog IDs — **Cerrada (localization/generated compatibility 2026-05)**

**Objetivo:** garantizar que los overlays localizados sobreviven a regeneraciones del catálogo `generated` cuando la identidad semántica sigue siendo recuperable por `targetKey`, y que el drift residual quede visible y migrable fuera del hot path.

**Resultado registrado:**
- `src/server/knowledge/system/localization/localizationResolver.ts` deja de tratar un `targetId` obsoleto como huérfano automático cuando `targetKey` todavía resuelve un target canónico único, recupera la overlay sobre ese target y publica el caso como `recoveredTargetIds` en lugar de esconderlo o romper serving silenciosamente;
- `src/server/knowledge/system/localization/types.ts`, `index.ts` y `src/server/knowledge/system/consistency.ts` exponen ya `recoveredTargetIds` dentro del audit de `localization`, de forma que el drift recuperable y el drift irrecuperable queden diferenciados contractualmente;
- `scripts/generate_catalog_localization_report.cjs` muestra `recoveredTargetIds` en el snapshot JSON/Markdown y `scripts/migrate_catalog_localization_target_ids.cjs`, expuesto por `npm run migrate:catalog-localization-target-ids`, deja un plan/aplicación offline para reconciliar `targetId` fuente cuando el fallback por `targetKey` ya ha recuperado la identidad nueva;
- `docs/localization.md` fija la policy operativa: `targetId` para entries estables, `targetKey` para recuperación y authoring sobre dominios/generated en evolución, y ambos cuando se quiera drift explícito más ruta segura de migración.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogLocalization|catalogConsistency"`
- `npm run report:catalog-localization`
- `npm run migrate:catalog-localization-target-ids`

**Documentación alineada:**
- `README.md`
- `docs/localization.md`
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/done-log.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/rules-catalog.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 1.133 B374. Spanish catalog localization authoring workflow and coverage gate — **Cerrada (localization/authoring workflow 2026-05)**

**Objetivo:** convertir el rail español de localización documental en un workflow gobernable: cobertura por dominio, detección de overlays incompletos o mal anclados y guía explícita para ampliar traducciones sin drift ni regresiones en producto visible.

**Resultado registrado:**
- `src/server/knowledge/system/localization/localizationResolver.ts`, `types.ts` e `index.ts` publican ya cobertura por dominio (`domainCoverage`), overlays incompletos (`missingFields`) e intentos de traducir anchors técnicos (`invalidParameterTargets`) sobre targets canónicos del catálogo, manteniendo el audit fuera del hot path de hover/completion/signatureHelp;
- `src/server/knowledge/system/consistency.ts` incorpora ese audit ampliado dentro de `buildCatalogConsistencyReport().localization`, de modo que authoring roto o traducciones de `signatureLabel`/`parameterName` fallen como problema de gobernanza del catálogo antes de llegar a los consumers visibles;
- `scripts/generate_catalog_localization_report.cjs`, `package.json` y `artifacts/catalog/catalogLocalizationReport.generated.{json,md}` dejan un workflow determinista para generar snapshots del estado `es` por dominio, reviewed coverage y issues pendientes;
- `docs/localization.md` fija ya el orden incremental de traducción, la guía de estilo, la rutina de authoring y las salidas esperadas del reporte, apoyándose en la primera tanda revisada que ya vivía en `src/server/knowledge/system/localization/es/generatedFunctionLocalization.ts`.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogLocalization|catalogConsistency"`
- `npm run report:catalog-localization`

**Documentación alineada:**
- `README.md`
- `docs/localization.md`
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/done-log.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/rules-catalog.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 1.132 B373. Localized catalog consumers for hover, completion and signatureHelp — **Cerrada (language services/localized consumers 2026-05)**

**Objetivo:** hacer visible el rail de localización documental en producto real, integrando `DocumentationService` en hover, completion y signatureHelp sin traducir identidad semántica, sin duplicar lógica por consumer y sin introducir coste interactivo apreciable.

**Resultado registrado:**
- `src/server/features/hover.ts`, `completion.ts` y `signatureHelp.ts` consumen ya `DocumentationService` con locale explícita, conservan títulos, labels y firmas originales, y limitan la localización a `summary/documentation/usageNotes/obsoleteMessage/return docs/parameter docs` en la capa visible del consumer;
- `src/server/knowledge/system/localization/documentationLocale.ts`, `localizationResolver.ts` y `documentationService.ts` fijan `auto|en|es`, fallback `auto -> locale de VS Code -> en`, alias canónicos manual/generated para overlays por sibling del mismo bucket lógico y fallback O(1) por nombre de parámetro único cuando la firma visible no coincide exactamente con el `signatureLabel` del overlay;
- `src/client/extension.ts`, `src/server/handlers/lifecycleHandlers.ts`, `src/server/handlers/featureHandlers.ts`, `src/server/server.ts`, `src/shared/types.ts` y `package.json` publican y cablean la setting `vscPowerSyntax.languageServices.documentationLocale`, sincronizan la configuración al servidor y segregan `ServingCache` por locale efectiva para hover/completion/signatureHelp;
- `test/server/unit/documentationLocale.test.ts`, junto con nuevas pruebas focales en `hover.test.ts`, `completion.test.ts` y `signatureHelp.test.ts`, fija rendering localizado visible, fallback de locale, ausencia de duplicados por idioma y mantenimiento del guard de hot path.

**Validación registrada:**
- `npm run test:unit -- --grep "documentationLocale|localiza"`
- `npm run test:unit -- --grep "hotPathAllocationBudget"`

**Documentación alineada:**
- `README.md`
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 1.131 B372. DocumentationService locale-aware lazy resolver — **Cerrada (knowledge/localized documentation serving 2026-05)**

**Objetivo:** crear una capa de serving documental locale-aware, reutilizable y barata que resuelva textos visibles del system catalog sobre una entry ya resuelta, con fallback seguro `es -> en` y sin scans globales ni merges por idioma en startup.

**Resultado registrado:**
- `src/server/knowledge/system/localization/documentationService.ts` publica `DocumentationLocale`, `createDocumentationService()` y los helpers `getDisplaySummary|getDisplayDocumentation|getDisplayUsageNotes|getDisplayObsoleteMessage|getDisplayReturnDocumentation|getDisplayParameterDocumentation`, todos apoyados en lookup O(1) por `entry.id` sobre el índice de `B371` y sin mutar `PbSystemSymbolEntry`;
- el servicio cachea de forma lazy la documentación de parámetros por entry y por overlay, reutiliza referencias existentes para `usageNotes` cuando no necesita materializar copias y mantiene el fallback al texto oficial inglés cuando falta overlay español;
- `src/server/knowledge/system/localization/index.ts` deja el servicio exportado como rail reusable para `hover`, `completion` y `signatureHelp` sin tocar todavía los consumers finales;
- `test/server/unit/documentationService.test.ts`, junto con `catalogLocalization` y el guard de hot path, fija prioridad del overlay español, fallback al texto original, soporte de overlays por `targetId`/`targetKey` y ausencia de drift en el carril interactivo.

**Validación registrada:**
- `npm run test:unit -- --grep "documentationService|catalogLocalization|catalogConsistency"`
- `npm run test:unit -- --grep "hotPathAllocationBudget"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/performance-budget.md`

## 1.130 B371. Catalog localization model and immutable overlay contract — **Cerrada (knowledge/catalog localization base 2026-05)**

**Objetivo:** fijar un modelo ligero e inmutable de localización documental para el system catalog sin duplicar símbolos por idioma, sin mutar el texto oficial de `generated` y dejando trazable cualquier drift del rail localizado.

**Resultado registrado:**
- `src/server/knowledge/system/types.ts` y `src/server/knowledge/system/localization/types.ts` publican el contrato de overlays localizados (`PbCatalogLocale`, `PbLocalizedText`, documentación de parámetros y return codes, `targetId/targetKey`, `reviewed/source`) y acotan explícitamente qué campos pueden traducirse y cuáles nunca deben tocar la identidad semántica;
- `src/server/knowledge/system/localization/localizationResolver.ts`, junto con `src/server/knowledge/system/localization/es/`, introduce un índice español parcial y un resolvedor memoizado que enlaza overlays por `targetId` o `targetKey` contra la entry canónica del bucket runtime, alineado con la policy `generated-primary-with-manual-overlays` y sin merges globales por idioma;
- `src/server/knowledge/system/consistency.ts` añade `localization` al audit del catálogo para publicar `locales` y `orphanOverlays`, de modo que cualquier overlay sin target resoluble quede visible como problema de gobernanza antes de llegar a hover/completion/signatureHelp;
- `test/server/unit/catalogLocalization.test.ts` y `test/server/unit/catalogConsistency.test.ts`, apoyados por `catalogAdoptionDecision` y `systemCatalogQueryHardening`, fijan la preservación del summary oficial en inglés, la ausencia de huérfanos en el rail `es` inicial y la resolución estable por `targetId/targetKey`.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogLocalization|catalogConsistency|catalogAdoptionDecision|systemCatalogQueryHardening"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/rules-catalog.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 1.129 B377. Current object/class check command and AI-readable validation report — **Cerrada (workflow/object-level validation 2026-05)**

**Objetivo:** añadir un chequeo consolidado del objeto actual o resuelto por nombre como tool/API/comando read-only para que usuario y agentes puedan decidir cambios locales con una sola llamada defendible.

**Resultado registrado:**
- `src/shared/publicApi.ts` publica `object-check`, `checkObject()`, `powerbuilder.checkCurrentObject` y los schemas `ApiObjectCheckRequest`, `ApiObjectCheckFinding`, `ApiObjectCheckSummary` y `ApiObjectCheckReport` como contrato estable del bridge read-only y la API pública;
- `src/client/objectCheckReport.ts` compone el reporte local del objeto sobre `currentObjectContext`, `dependencyGraph`, `impactAnalysis` y `safeEditPlan`, con source resolution por editor/URI/nombre, findings AI-readable, truncado honesto y Markdown `# Object Check`;
- `src/client/extension.ts`, `src/client/commandRegistration.ts` y `package.json` cablean el método público, el tool dispatch y los comandos `vscPowerSyntax.openCurrentObjectCheck` / `vscPowerSyntax.openObjectCheck`, manteniendo el slice completamente read-only y sin abrir un motor semántico paralelo;
- `test/server/unit/objectCheckReport.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan objeto sano, diagnostics bloqueantes, dependencias ambiguas, bindings DataWindow missing, SQL `EXECUTE` y el wiring real del tool/comando Markdown.

**Validación registrada:**
- `npm run test:unit -- --grep "publicApi|objectCheckReport"`
- `npm run test:smoke -- --grep "object check expone tool read-only y reporte markdown"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/developer-workflows.md`

## 1.128 B376. Workspace check command and AI-readable validation report — **Cerrada (workflow/read-only validation 2026-05)**

**Objetivo:** añadir un chequeo consolidado del workspace como tool/API/comando read-only para que usuario y agentes puedan responder con una sola llamada qué errores, bloqueos y señales relevantes publica ya el plugin.

**Resultado registrado:**
- `src/shared/publicApi.ts` publica `workspace-check`, `checkWorkspace()`, `powerbuilder.checkWorkspace` y los schemas `ApiWorkspaceCheckRequest`, `ApiWorkspaceCheckFinding`, `ApiWorkspaceCheckCatalogSummary` y `ApiWorkspaceCheckReport` como contrato estable del bridge read-only y de la API pública;
- `src/client/workspaceCheckReport.ts` introduce el builder puro del reporte con modos `quick/full/catalog/diagnostics`, findings AI-readable, truncado honesto, acciones recomendadas y render Markdown `# Workspace Check` para producto y handoff de agentes;
- `src/client/extension.ts`, `src/client/commandRegistration.ts` y `package.json` cablean el método público, el tool dispatch, el comando `vscPowerSyntax.openWorkspaceCheck` y la composición read-only sobre surfaces existentes, paralelizando secciones opcionales y evitando bloquear la apertura del preview Markdown;
- `src/server/features/workspaceCheckCatalogSummary.ts`, `src/server/handlers/reportCommandHandlers.ts` y `src/server/handlers/lifecycleHandlers.ts` añaden un summary ligero y memoizado del system catalog para el hot path del check, sin reutilizar el reporte completo de adopción de `B369`.

**Validación registrada:**
- `npm run test:unit -- --grep "publicApi|workspaceCheckReport"`
- `npm run test:smoke -- --grep "workspace check expone tool read-only y reporte markdown"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/developer-workflows.md`

## 1.127 B369. Generated-vs-manual catalog adoption decision gate — **Cerrada (knowledge/source-of-truth decision 2026-05)**

**Objetivo:** decidir con métricas reales si el source-of-truth operativo del system catalog debía quedar en `generated`, en `manual-core` o en un híbrido por dominio antes de seguir ampliando localización y consumers.

**Resultado registrado:**
- `src/server/knowledge/system/consistency.ts` deja de ser solo un guard estructural y publica `adoption`, un reporte comparativo con métricas globales y por dominio para `generated` frente a `manual-core`, incluyendo `officialCount`, `generatedCount`, `manualCount`, `duplicateCount`, overlays, `scraperErrorCount`, calidad de signatures/appliesTo/ownerTypes/returnType/eventId/parameterDocs y política recomendada;
- el summary vigente fija `officialCount = 6601`, `generatedCount = 2146`, `manualCount = 1039`, `duplicateCount = 695`, `gapCount = 343`, `overrideCount = 1`, `enrichmentCount = 695`, `candidateCount = 0` y `scraperErrorCount = 0`, con `officialDomainsWithGaps = []` y recomendación `generated-primary-with-manual-overlays`;
- `test/server/unit/catalogAdoptionDecision.test.ts` y `test/server/unit/catalogConsistency.test.ts` convierten esa decisión en un gate verificable, fijando que el policy baseline siga siendo `generated` como base oficial con overlays manuales explícitos y excepciones solo para dominios sin rail oficial (`datawindow-events`, `operators`, `pronouns`, `system-globals`);
- `docs/adr/ADR-0001-system-catalog-source-of-truth.md` deja la decisión arquitectónica cerrada, con contexto, opciones evaluadas, evidencia cuantitativa, consecuencias, plan de migración y rollback.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogConsistency|catalogAdoptionDecision"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`
- `docs/adr/ADR-0001-system-catalog-source-of-truth.md`

## 1.126 B368. Manual curated overlays, gaps and overrides policy — **Cerrada (knowledge/manual overlay governance 2026-05)**

**Objetivo:** redefinir `manual/` para que no compita silenciosamente con `generated`, sino que actúe como capa explícita de `gaps`, `enrichments`, `overrides` y `candidates` sobre el catálogo oficial ya completo.

**Resultado registrado:**
- `src/server/knowledge/system/types.ts`, `normalization.ts` y `manual/common.ts` publican `manualOverlay` como metadata contractual de entry con `mode`, `targetId/targetKey`, `reason`, `evidence`, `sourceUrl` y `reviewedBy` normalizados;
- `src/server/knowledge/system/registry/registry.ts` clasifica automáticamente `manual-core` frente a `generated`: los overlaps lógicos pasan por defecto a `enrichment`, las ausencias reales quedan como `gap` y los casos curados explícitos como `Clipboard` se publican como `override`;
- `src/server/knowledge/system/consistency.ts` y `test/server/unit/catalogConsistency.test.ts` endurecen el catálogo contra overlaps manual/generated sin overlay explícito y publican contadores por `manualOverlay.mode` para que la gobernanza del rail curado sea auditable;
- `src/server/knowledge/system/services/queryService.ts` hace explícita la merge policy provisional del hot path: `override` manual gana, `generated` sigue siendo la base cuando existe counterpart oficial y los `enrichment` se fusionan sobre esa base, mientras `candidate` queda fuera de las listas/resoluciones interactivas.

**Validación registrada:**
- `npm run test:unit -- --grep systemCatalogQueryHardening`
- `npm run test:unit -- --grep "catalogV2|catalogConsistency|catalogProvenanceAudit"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`

## 1.125 B367. Generated catalog as complete official source v2 — **Cerrada (knowledge/generated source-of-truth 2026-05)**

**Objetivo:** convertir `generated` desde un dataset de huecos filtrado por `manual-core` a un catálogo official completo, medible y comparable por dominio antes de redefinir overlays manuales o decisiones de adopción runtime.

**Resultado registrado:**
- `script/generate_official_function_catalog.cjs` publica ya `generated` en modo `complete` por defecto y deja `gap-fill` solo como compatibilidad explícita; `officialCoverage.generated.ts` pasa a ser comparativo y `generatedCompleteness.generated.ts` mide exclusivamente lo emitido por `generated`;
- `src/server/knowledge/system/generated/generated.generated.ts` incorpora `PB_GENERATED_DATATYPES`, mantiene completos los dominios oficiales incluidos y fusiona overloads oficiales con identidad lógica repetida antes de materializar el dataset, evitando `duplicateIds` intradataset en runtime;
- `src/server/knowledge/system/registry/datasets.ts` registra el nuevo slice `generated` de `datatypes`, mientras la medición de `object-functions` deja de contar la superficie específica de DataWindow que ya pertenece a `datawindow-functions`;
- `generatedCompleteness.generated.ts` queda con `missingCount = 0` en `global-functions`, `object-functions`, `datawindow-functions`, `keywords`, `reserved-words`, `datatypes`, `enumerated-types`, `enumerated-values`, `system-object-datatypes`, `system-events` y `statements`.

**Validación registrada:**
- `node ./script/generate_official_function_catalog.cjs`
- `npm run test:unit -- --grep catalogGeneratorScript`
- `npm run test:unit -- --grep catalogV2`
- `npm run test:unit -- --grep catalogConsistency`
- `npm run test:unit -- --grep catalogProvenanceAudit`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`

## 1.124 B370. Generated catalog regression fixtures and extraction quality gate — **Cerrada (knowledge/generator regression gate 2026-05)**

**Objetivo:** congelar el layout crítico del scraper oficial en fixtures offline revisables para que cambios futuros del extractor no vuelvan a depender de HTML vivo ni reabran silenciosamente el baseline oficial de `B366`.

**Resultado registrado:**
- `test/fixtures/catalog-generator/` introduce ocho snapshots compactos `.html` + `.expected.json` para `ApplyTheme`, `AddItemArray`, `SetItemDate`, `OLEActivate`, `BeginDrag`, `DragDrop`, `PDFDocumentProperties` y `xREF_80481_Reserved_words`, dejando diffs localizados por caso y sin mirror completo de la documentación externa;
- `test/server/unit/catalogGeneratorScript.test.ts` sube a `22 passing` y compara el output del extractor contra JSON compacto para `returnType/returnDocumentation`, `usageNotes`, signatures DW, `eventId/eventIds`, owner mappings, `baseType/properties/functions/events` e `identifierPolicy` de reserved words, todo sin tocar red;
- `script/generate_official_function_catalog.cjs` publica ya `usageNotes` cuando la referencia oficial tiene sección `Usage`, y la regeneración real vuelve a materializar `generated.generated.ts` con el extractor endurecido sin romper el baseline runtime del catálogo;
- `catalogV2`, `catalogConsistency` y `catalogProvenanceAudit` se revalidan tras la regeneración, dejando listo el siguiente cambio de source-of-truth de `B367` sobre un rail regresivo ya estabilizado.

**Validación registrada:**
- `node ./script/generate_official_function_catalog.cjs`
- `npm run test:unit -- --grep catalogGeneratorScript`
- `npm run test:unit -- --grep catalogV2`
- `npm run test:unit -- --grep catalogConsistency`
- `npm run test:unit -- --grep catalogProvenanceAudit`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 1.123 B366. Official Appeon scraper bugfixes and structural enrichment v2 — **Cerrada (knowledge/generator baseline 2026-05)**

**Objetivo:** corregir fallos estructurales del scraper oficial de Appeon y subir el techo real del catálogo `generated` con metadata explotable para runtime/hover/completion sin vender todavía `generated` como source-of-truth completo.

**Resultado registrado:**
- `script/generate_official_function_catalog.cjs` endurece el extractor oficial con reuse de tablas anónimas bajo `Syntax`, parsing de `returnType/returnDocumentation`, `eventId/eventIds`, metadata estructural de reserved words y headings `Properties/Events/Functions` compatibles con anchors inline del layout real de Appeon;
- el rail `system-object-datatypes` ya publica overlays oficiales ricos incluso para tipos ya presentes en `manual-core`, incluyendo `baseType`, `properties`, `functions` y `events`; `src/server/knowledge/system/generated/generated.generated.ts` materializa de forma verificable casos como `PDFDocumentProperties` con `baseType: "PDFModel"`, propiedades `Application/Author/Keywords/Subject/Title`, funciones heredadas/runtime y eventos `Constructor/Destructor`;
- `AddItemArray` queda ya publicado en el catálogo real con cuatro signatures y parámetros estructurados (`ParentItemHandle`, `ParentItemPath`, `Key`) más `returnType: "Long"` y documentación de retorno oficial;
- `src/server/knowledge/system/services/queryService.ts` prioriza el overlay oficial enriquecido de `system-object-datatypes` en `resolveDatatype()` y `resolveLanguageSymbol()` cuando aporta más estructura que la entrada curada base, evitando que tipos runtime como `PDFDocumentProperties` sigan resolviendo sólo contra la versión manual mínima.

**Validación registrada:**
- `node ./script/generate_official_function_catalog.cjs`
- `npm run test:unit -- --grep catalogGeneratorScript`
- `npm run test:unit -- --grep "catalogV2|catalogConsistency|catalogProvenanceAudit"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 1.122 B329. Catalog-driven semantic tokens integration — **Cerrada (spec 382, catalog-driven-semantic-tokens-fast-path 2026-05)**

**Objetivo:** consumir metadata del catálogo en semantic tokens para colorear símbolos seguros del runtime sin depender siempre del lookup semántico general ni introducir trabajo caro por token.

**Resultado registrado:**
- `src/server/features/semanticTokens.ts` añade un fast path catalog-driven para `keywords`, `reserved-words`, `datatypes`, `enumerated-types`, `system-globals`, `pronouns` y `global-functions` mediante resolutores directos de `SystemCatalog` cuando no hay qualifier;
- la leyenda pública incorpora `keyword` y mantiene `enumMember`, mientras los símbolos del default library siguen usando modifiers compatibles (`defaultLibrary`, `global`) sin clonar catálogos ni escanear dominios completos por token;
- `test/server/unit/semanticTokens.test.ts` fija el caso catalog-driven con `IF`, `IsValid`, `SQLCA` y `This`, y `test/server/unit/hotPathAllocationBudget.test.ts` confirma que el hot path interactivo sigue sin serializar JSON ni clonar catálogos globales completos por inercia;
- el foco operativo del bloque sube a `B366`, porque `B370`, `B367`, `B368` y la cadena de localización exigen primero metadata oficial enriquecida del scraper.

**Validación registrada:**
- `npm run test:unit -- --grep "catalog-driven"`
- `npm run test:unit -- --grep "Semantic Tokens"`
- `npm run test:unit -- --grep hotPathAllocationBudget`

## 1.121 B353. Large-file regression guard and architecture metrics — **Cerrada (spec 381, architecture-hotspot-guard 2026-05)**

**Objetivo:** añadir un guard reproducible de tamaño, imports y responsibility drift para los hotspots TypeScript del repo, separando los hosts críticos del cliente/servidor de los slices generated/manual grandes del catálogo.

**Resultado registrado:**
- `tools/run-architecture-hotspot-guard.mjs` publica el lane `npm run test:architecture:metrics`, genera `artifacts/performance/architecture-hotspot-guard.json` y mide `lines`, `imports` y `topLevelDeclarations` sobre `src/client/extension.ts`, `src/server/server.ts` y `src/client/commandRegistration.ts`;
- el guard mantiene una allowlist explícita para `src/server/knowledge/system/generated/generated.generated.ts`, `src/server/knowledge/system/manual/core/objectFunctions.ts`, `src/server/knowledge/system/manual/datawindow/dataWindowFunctions.ts`, `src/server/knowledge/system/manual/language/enumerations/index.ts`, `src/server/knowledge/system/manual/core/globalFunctions.ts` y `src/server/knowledge/system/manual/core/systemEvents.ts`, con budgets propios y warnings a partir del `90%` del umbral;
- `test/server/unit/architectureImports.test.ts` sigue fijando el firewall por capas y ahora ejecuta además el runner, dejando una única suite focal para imports + budgets de hotspots;
- el baseline actual deja `9` hotspots trazados, `6` allowlisted, `0` failing hotspots y `4` warnings (`extension.ts`, `generated.generated.ts`, `objectFunctions.ts`, `dataWindowFunctions.ts`) sin abrir todavía una refactorización estructural masiva.

**Validación registrada:**
- `npm run test:unit -- --grep architectureImports`
- `npm run test:architecture:metrics`

## 1.120 B364. Enum catalog real-corpus validation against PFC, STD and public PB repositories — **Cerrada (spec 380, enum-real-corpus-validation 2026-05)**

**Objetivo:** validar el catálogo de enumerated types/values contra corpora reales PowerBuilder sin convertir PFC/STD/public dumps en autoridad de catálogo, separando valores catalogados, unknown, falsos positivos textuales y casos fuera de contexto.

**Resultado registrado:**
- `src/server/features/catalogCorpusValidation.ts` publica `collectEnumCatalogCorpusUsageObservations()` y `buildEnumCatalogCorpusUsageReport()` para escanear valores con `!` sobre texto enmascarado y clasificarlos como `official-known`, `curated-known`, `candidate`, `false-positive`, `out-of-context` o `unknown`;
- `test/server/unit/catalogCorpusValidation.test.ts` fija el builder y la clasificación sintética, y `test/server/performance/enumCatalogCorpusValidation.smoke.test.ts` recorre PFC Solution, STD_FC_OrderEntry y legacy PBL dump con breakdown por corpus;
- la evidencia real actual queda trazada en `13068` ocurrencias con `!`: `1554` catalogadas (`724` oficiales, `830` curadas), `5296` unknown, `6214` false positives, `4` out-of-context y `0` candidates;
- no se añadió ningún unknown al catálogo. Las familias detectadas (`contemporarymenu!`, `contemporarytoolbar!`, `HourGlass!`, `OK!`, `Information!`, `Exclamation!`, `ansi!`, `swiss!`, `Exclude!`) quedan encaminadas a `B368/B370` como gaps/candidates/fixtures futuros.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogCorpusValidation"`
- `npm run test:performance -- --grep "enumCatalogCorpusValidation|PFC/OrderEntry/legacy"`
- `npm run test:unit -- --grep "enumerated|enum|catalog"`
- `npm run test:performance -- --grep "PFC|OrderEntry|STD"`

## 1.119 B356. PFC/STD rapid validation gate for architecture refactors — **Cerrada (spec 379, pfc-std-rapid-validation-gate 2026-05)**

**Objetivo:** convertir las suites reales de PFC Workspace/Solution y STD_FC_OrderEntry en un gate corto, reproducible y documentado para refactors arquitectónicos, con skip honesto cuando los corpus no estén disponibles localmente.

**Resultado registrado:**
- `tools/run-architecture-rapid-gate.mjs` detecta disponibilidad de `fixtures-local/pfc/2025-Workspace`, `fixtures-local/pfc/2025-Solution` y `fixtures-local/STD_FC_OrderEntry`, recompila cliente/tests y ejecuta las suites smoke/performance reales ya existentes bajo greps controlados;
- `package.json` publica el lane estable `npm run test:architecture:rapid` y el runner deja evidencia en `artifacts/performance/architecture-rapid-gate.json` con estados `passed`, `passed-with-skips` o `skipped`;
- el gate reutiliza `smoke/pfc-workspace-extension`, `smoke/pfc-solution-extension`, `performance/pfc-workspace`, `performance/pfc-workspace-smoke`, `performance/pfc-solution-smoke`, `performance/orderentry`, `performance/orderentry-smoke` y `performance/orderentry-semantic`, sin duplicar suites ni helpers;
- `docs/testing.md`, `docs/performance-budget.md`, `test/corpora/README.md`, backlog y current-focus quedan alineados para que `B364` vuelva a ser el foco funcional inmediato ya sin validación arquitectónica ad hoc.

**Validación registrada:**
- `npm run test:architecture:rapid`

## 1.118 B346. Client activation and command registration boundaries — **Cerrada (spec 378, client command registration and lazy view activation 2026-05)**

**Objetivo:** reducir `src/client/extension.ts` separando el wiring de comandos del cliente y quitando del hot path de activación superficies de UI que no deben materializarse eagerly, sin romper command IDs, API pública ni restart semantics.

**Resultado registrado:**
- `src/client/commandRegistration.ts` centraliza el registro de comandos por dominios (`core`, panels, reports, status, build/ORCA y support/maintenance), dejando `src/client/extension.ts` como host de lifecycle, bridge y handlers ligeros;
- `src/client/extension.ts` mueve el wiring inline de jerarquía/paneles a helpers nombrados y pasa `PowerBuilderObjectExplorerController`, `CurrentObjectContextPanelController` y `DiagnosticsExplainabilityPanelController` a inicialización bajo demanda mediante `ensure*Controller()`;
- la API pública exportada mantiene su contrato versionado pero deja de materializarse eagerly durante el cold start del módulo cliente;
- `docs/architecture.md`, `docs/testing.md`, `docs/performance-budget.md`, `docs/current-focus.md` y el backlog canónico quedan alineados para que el siguiente cierre operativo pase a `B356` como gate previo a `B364`.

**Validación registrada:**
- `npm run compile`
- `npm run test:unit -- --grep architectureImports`
- `npm run test:smoke -- --grep "la extensión se activa en menos de 500ms"`
- `npx vscode-test --label smoke --grep 'runtime self-test|settings governance|restartServer|PBAutoBuild|ORCA legacy|dashboard de salud|Object Explorer|Current Object Context'`

## 1.1 P0 — Base inmediata de descubrimiento, scheduling, contexto, visibilidad de estado y caché de serving

### B120. Discovery rápido no bloqueante del workspace — **Cerrada (spec 013)**
**Objetivo:** descubrir roots y archivos relevantes sin bloquear el flujo interactivo.

**Resultado registrado:**
- detección rápida de markers de Workspace y Solution;
- detección de archivos PowerBuilder relevantes;
- cola inicial de trabajo sin esperar a la indexación completa;
- devolución temprana del control al usuario.

---

### B121. Scheduler de indexación multinivel con colas por prioridad — **Cerrada (spec 014)**
**Objetivo:** introducir colas explícitas y justas para repartir trabajo sin bloquear.

**Resultado registrado:**
- cola **Interactive**;
- cola **Near**;
- cola **Background**;
- prioridad real al archivo abierto;
- indexación progresiva del resto del workspace.

---

### B133. Barra de estado con progreso de indexación — **Cerrada (spec 015)**
**Objetivo:** reflejar en la barra de estado el progreso real del indexador.

**Resultado registrado:**
- progreso visible;
- estado actual del motor;
- actividad dominante;
- acceso rápido a diagnóstico/mantenimiento.

---

### B054. Contexto posicional semántico reutilizable — **Cerrada (spec 032)**
**Objetivo:** introducir `findInnermostCallableAtPosition()`, `findInnermostTypeAtPosition()` y contexto reutilizable de nesting real.

**Referencia histórica `plugin_old`:** lógica antigua de spans, nesting y comparación por anidamiento.

---

### B055. Parseo documental con secciones / state machine — **Cerrada (spec 033)**
**Objetivo:** sustituir parsing demasiado lineal por una máquina de estados capaz de distinguir con seguridad bloques declarativos y ejecutables.

**Referencia histórica `plugin_old`:** `pbDocumentParser.ts` y lógica útil de reconocimiento de secciones.

---

### B113. Parser canónico del contenedor SR* — **Cerrada (spec 034)**
**Objetivo:** crear un parser explícito para la estructura contenedora de `.sra`, `.srw`, `.sru`, `.srm`, `.srf`.

**Resultado registrado:**
- reconocimiento estable de `forward global type`;
- `global type ... from ...`;
- `global <type> <instance>`;
- `forward prototypes`;
- `on create/destroy`;
- contenedores de callables;
- variables declarativas del objeto.

---

### B061. Completion scoring heredado y normalizado — **Cerrada (spec 035)**
**Objetivo:** portar y normalizar el scoring semántico del `plugin_old` usando distancia de herencia, scope, owner context y visibilidad.

**Referencia histórica `plugin_old`:** `semanticEngine.ts`, `getCompletionScore`.

---

### B134A. Caché caliente del contexto activo — **Cerrada (spec 016)**
**Objetivo:** mantener una caché extremadamente rápida del documento activo y sus dependencias inmediatas.

---

### B134B. Caché de serving para hover / completion / signature help / definition — **Cerrada (spec 017)**
**Objetivo:** diseñar una capa de caché específica para serving de features interactivas.

---

### B034. Diagnóstico de variables no usadas — **Cerrada (spec 026)**
**Objetivo:** detectar variables declaradas pero no utilizadas con conocimiento real de scopes.

**Referencia histórica `plugin_old`:** `diagnosticResolver.ts`, `analyzeUnusedVariables`.

---

### B035. Detección de shadowing — **Cerrada (spec 027)**
**Objetivo:** detectar sombreado entre locals, shared, globals e instance variables.

**Referencia histórica `plugin_old`:** `diagnosticResolver.ts`, `analyzeVariableShadowing`.

---

## 1.2 P1 — Topología real y resolución fuerte de PowerScript

### B056. Workspace topology parser (`.pbw/.pbt/.pbsln/.pbproj`) — **Cerrada (spec 018)**
### B057. Project registry con scoring — **Cerrada (spec 019)**
### B087. Topología de workspace y library order — **Cerrada (spec 020)**
### B064. Enriched symbol model incremental — **Cerrada (spec 021)**
### B059. Symbol visibility real (`public/protected/private/...`) — **Cerrada (spec 022)**
### B058. InheritanceGraph robusto con caches — **Cerrada (spec 023)**
### B060. Owner resolution robusto (estático + dinámico) — **Cerrada (spec 024)**
### B023. Búsqueda de referencias segura en casos base — **Cerrada (spec 025)**

**Resumen del bloque cerrado:**
- topología real Workspace/Solution operativa;
- `projectRegistry` y scoring de pertenencia funcionales;
- `library order` explotado en resolución;
- modelo de símbolo enriquecido;
- visibilidad real;
- herencia robusta con caches;
- owner resolution base;
- references base reconstruidas sobre topología y resolución fuertes.

---

## 1.3 P2 — Hardening del parser y del lexer

### B089. Lexing de precisión: comentarios anidados y escapes — **Cerrada (spec 040)**
### B092. Sistema de máscaras de código (code masking) — **Cerrada (spec 028)**
### B095. Normalizador / splitter de sentencias — **Cerrada (spec 029)**
### B090. Detección enriquecida de SQL embebido — **Cerrada (spec 041)**
### B073. Soporte para funciones externas (`EXTERNAL FUNCTION/SUBROUTINE`) — **Cerrada (spec 039)**
### B099. Resolución por anidamiento (`Range Span Comparison`) — **Cerrada (spec 030)**
### B101. Deduplicación semántica robusta — **Cerrada (spec 031)**

**Resumen del bloque cerrado:**
- masking reutilizable;
- splitting robusto de sentencias;
- SQL embebido identificado;
- externas soportadas;
- resolución por nesting fuerte;
- deduplicación semántica mejorada;
- reducción de falsos positivos y fortalecimiento del pipeline reusable.

---

## 1.4 P3 — Productividad avanzada segura

### B074. Diagnósticos de modernización y funciones obsoletas — **Cerrada (spec 036)**
### B103. Hover enriquecido con metadatos PB — **Cerrada (spec 037)**
### B104. Soporte para eventos calificados y `on-handlers` — **Cerrada (spec 038)**
### B106. Comando de información del objeto actual — **Cerrada (spec 051)**
### B107. Status bar con contexto de proyecto — **Cerrada (spec 052 + cierre runtime 2026-05)**

**Resumen del bloque cerrado:**
- modernización/obsoletas cubierta;
- hover enriquecido con metadatos útiles;
- `ON object_name.event_name` mejor soportado;
- comando de información del objeto operativo;
- barra de estado unificada con resumen del proyecto activo, estado de `projectModel`, caches/persistencia y accesos rápidos a stats/salud/build.

---

## 1.5 P4 — Escala, validación continua y rendimiento

### B127. File watcher estratificado y debounce de invalidación — **Cerrada (spec 043)**
### B128. Estados de readiness del workspace — **Cerrada (spec 044)**
### B129. Fairness por proyecto/root en background indexing — **Cerrada (spec 058)**

**Resumen del bloque cerrado:**
- invalidación agrupada y más estable;
- readiness del workspace formalizado;
- fairness por root/proyecto incorporada.

### B030. Validación sobre workspace grande real — **Cerrada (validación PFC + legacy 2026-05)**
**Objetivo:** validar sobre PFC 2025 Solution/Workspace y corpus legacy.

**Resultado registrado:**
- PFC 2025 Workspace y PFC 2025 Solution quedan integrados como corpus reales del ciclo;
- se añadió un slot legacy reproducible en `fixtures-local/public/legacy-pbl-dump` con helper dedicado y smoke real sobre fuente exportada;
- `test/corpora/README.md` documenta la preparación reproducible y `docs/testing.md` la referencia como matriz activa de corpus.

**Validación registrada:**
- `npm run test:performance -- --grep "(PFC Workspace smoke|PFC Solution smoke|legacy PBL dump smoke)"`
- `npm run test:smoke -- --grep "smoke/pfc-solution-extension"`

### B069. Fixtures reales permanentes de PFC/legacy — **Cerrada (fixtures locales controlados 2026-05)**
**Objetivo:** fixtures permanentes y mantenidos.

**Resultado registrado:**
- `fixtures-local/pfc/2025-Workspace` y `fixtures-local/pfc/2025-Solution` quedan fijados como fixtures reales del producto;
- `fixtures-local/public/legacy-pbl-dump` queda formalizado como slot local permanente para regresión legacy;
- `test/README.md` y `test/server/helpers/publicCorpusPaths.ts` dejan trazado estable para mantener estos corpus fuera de Git y dentro del ciclo de regresión.

**Validación registrada:**
- `npm run test:performance -- --grep "(PFC Workspace smoke|PFC Solution smoke|legacy PBL dump smoke)"`
- `npm run test:smoke -- --grep "smoke/pfc-solution-extension"`

### B221. PowerBuilder public corpus matrix — **Cerrada (matriz reproducible 2026-05)**
**Objetivo:** definir matriz reproducible de corpus públicos PowerBuilder para validar parsing, discovery, serving y performance.

**Resultado registrado:**
- `test/corpora/README.md` define matriz pública reproducible con PFC 2025 Solution, PFC 2025 Workspace, DataWindow examples, PBL dump examples, ORCA/build examples, native/PBNI examples y modern JSON/WebView2 examples;
- la matriz documenta criterios de inclusión/exclusión y modo de descarga/preparación local;
- el ciclo actual deja trazado qué corpus están ya integrados de forma ejecutable y cuáles quedan listos para activarse por área.

**Validación registrada:**
- auditoría documental local de la matriz reproducible;
- `npm run test:performance -- --grep "(PFC Workspace smoke|PFC Solution smoke|legacy PBL dump smoke)"`

### B118. Integration test matrix del plugin — **Cerrada (smoke matrix 2026-05)**
**Objetivo:** lifecycle real del plugin y workspaces reales.

**Resultado registrado:**
- `test/smoke/extension.test.ts` cubre activación y API pública mínima en `vscode-test`;
- `test/smoke/pfc-solution.extension.test.ts` valida el ciclo real sobre PFC Solution;
- `test/smoke/pfc-workspace.extension.test.ts` completa la matriz real sobre PFC Workspace;
- la documentación de testing y corpus deja trazado explícito qué cubre esta matriz y sobre qué corpus se ejecuta.

**Validación registrada:**
- `npm run test:smoke -- --grep "smoke/(extension|pfc-solution-extension|pfc-workspace-extension)"`

### B068. Calibración real del performance budget — **Cerrada (baseline real 2026-05)**
**Objetivo:** convertir budgets teóricos en budgets medidos.

**Resultado registrado:**
- `docs/performance-budget.md` deja de tratar discovery/cold/warm/archivo activo como objetivos solo teóricos y fija budgets ejecutables sobre corpus reales;
- `test/results/003-real-corpora-baseline.md` registra la medición base sobre PFC Workspace/Solution y legacy PBL dump;
- la calibración actual queda trazada para revisión futura sin mezclarla con presupuestos de memoria aún pendientes.

**Validación registrada:**
- `npm run test:performance`

### B119. Performance regression suite — **Cerrada (suite real 2026-05)**
**Objetivo:** medir activación, primer hover, primer diagnostics, discovery, warm/cold index.

**Resultado registrado:**
- la suite de performance ya cubre discovery sobre PFC, cold/warm index, batch documental sobre corpus real, primer hover y primeros diagnostics del archivo activo;
- la activación real queda cubierta por la matriz smoke sobre `vscode-test` y corpus PFC;
- la base queda trazada en `test/results/003-real-corpora-baseline.md` para detectar regresiones futuras.

**Validación registrada:**
- `npm run test:performance`
- `npm run test:smoke -- --grep "smoke/(extension|pfc-solution-extension|pfc-workspace-extension)"`

---

## 1.6 P5 — Ecosistema PowerBuilder, build y automatización

### B112. Herramientas de consistencia del catálogo — **Cerrada (specs 046 y 047)**
### B130. Detector y normalizador de encoding de fuentes — **Cerrada (spec 042)**
### B131. Soporte explícito para `.pblmeta` — **Cerrada (spec 045)**
### B138. Code masking pipeline (strip strings/comments) — **Cerrada**

**Resumen del bloque cerrado:**
- sanity checks y consistencia de catálogo;
- encoding heterogéneo mejor soportado;
- `.pblmeta` parseado;
- pipeline central de masking consolidado.

---

## 1.7 Hito 2026-05 — Ola 133-152 implementada y validada como primer corte operativo

### Resultado técnico registrado

La ola `Specs 133-152` dejó implementado un primer corte operativo de:

- snapshot semántico canónico por documento;
- `KnowledgeBase` con staging/publicación atómica y `semanticEpoch`;
- `semanticDiff`, dependencias semánticas inversas e invalidación dirigida/transitiva;
- indexación en dos fases con prioridad al activo, budgets adaptativos, yielding cooperativo, cancelación/preempción y modo degradado;
- backpressure del watcher, progreso/readiness enriquecidos y observabilidad ampliada;
- `UnifiedProjectModel` como base de topología compartida;
- persistencia base con `cacheSchema`, `cacheJournal` y `cacheCheckpoint`.

### Alcance trazado por spec

- `Specs 133-148` materializan primer corte de `B151`, `B165`, `B166`, `B170`, `B153`, `B154`, `B152`, `B122`, `B123`, `B124`, `B169`, `B125`, `B126`, `B134`, `B158` y `B159`.
- `Specs 149-152` materializan la base de `B141`, `B155`, `B167` y `B168`.

### Nota de gobierno

Este hito no implica que todos los ítems asociados estén cerrados. Los que siguieran `Partial` permanecen en backlog activo hasta cierre formal.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `309 passing`
- `npm test` → smoke `2 passing`, unit `309 passing`, integration `4 passing`

---

## 1.7A Gobernanza documental IA y docs de producto

### B201. IA-first documentation reorganization — **Cerrada**
**Objetivo:** reorganizar la documentación para que IA tenga ruta clara, sin duplicidades ni contradicciones.

**Resultado registrado:**
- `docs/00-ai-entrypoint.md` creado como puerta de entrada mínima y orden de lectura;
- `docs/product-operating-model.md` ampliado como documento propietario del modelo operativo;
- `docs/current-focus.md` simplificado para exponer un único foco ejecutable;
- `docs/spec-driven-development.md` y `docs/constitution.md` alineados con la ruta documental y el Definition of Done;
- catálogo de agentes y propiedad única de información consolidados en la capa documental;
- baseline de validación reforzado en `docs/testing.md`;
- documento de referencia de `plugin_old` reformulado como `docs/plugin-old-migration-opportunities.md`.

**Validación registrada:**
- auditoría documental local contra criterios de cierre en backlog;
- comprobación manual de orden de lectura, propiedad única y ausencia de contradicción operativa en docs canónicas.

### B202. Rules catalog and diagnostics governance — **Cerrada**
**Objetivo:** crear catálogo versionado de reglas diagnósticas.

**Resultado registrado:**
- `docs/rules-catalog.md` define plantilla canónica con ID estable, severidad, readiness, confidence, alcance, riesgo de falso positivo, tests y docs relacionadas;
- se documentaron reglas estructurales, de símbolos, DataWindow, PBL/ORCA y externas con contratos consistentes.

**Validación registrada:**
- auditoría documental local de presencia de IDs, severidad, readiness, confidence, falsos positivos y tests en el catálogo.

### B203. Developer workflows documentation — **Cerrada**
**Objetivo:** documentar workflows reales de programación PowerBuilder.

**Resultado registrado:**
- `docs/developer-workflows.md` fija workflows canónicos para apertura de proyecto, entendimiento del objeto actual, navegación de herencia, DataWindows, build y preparación de contexto para IA;
- backlog y roadmap ya pueden evaluarse contra workflows reales de valor profesional y no contra demos aisladas.

**Validación registrada:**
- auditoría documental local de cobertura de workflows visibles y trazabilidad con prioridades de producto.

---

## 1.8 Hito 2026-05 — Ola 153-172 implementada y validada

### Resultado técnico registrado

La ola `Specs 153-172` consolidó un segundo corte operativo de:

- puerto persistente de filesystem y `cacheStore` real sobre `cacheStorageUri`;
- `workspaceKey` estable, metadata de checkpoint y validación estricta de journal con rebuild seguro;
- export/restore defensivo y versionado en `KnowledgeBase` y `DocumentCache`, más `journal` interactivo desde `analysisCache`;
- warm resume real de `DocumentCache` + `KnowledgeBase` y persistencia solo en `readiness` estable;
- helper común de contexto de query, `ServingCache` ampliado a `definition` / `signatureHelp` / `completion`, y consumo real de `HotContextCache`;
- `queryTrace` retenida, `reasonCodes` del winner path y snapshot ampliado de stats interno/público.

### Alcance trazado por spec

- `Specs 153-163` materializan segundo corte de `B167`, `B168`, `B071`, `B071A` y `B174`.
- `Specs 164-172` materializan primer corte operativo de `B156`, `B157`, `B160`, `B176` y `B109`.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `324 passing`
- `npm test` → smoke `2 passing`, unit `324 passing`, integration `4 passing`

---

## 1.8A B157. Winner evidence contractual del query engine — **Slice cerrada (spec 219)**

### Resultado técnico registrado

`Spec 219` abre una evidencia estructurada minima sobre el ganador actual del query engine:

- `ResolvedTargetInfo` expone `evidence` como contrato derivado y estable;
- el primer item `winner-target` reutiliza `reasonCode`, `confidence` y lineage del target ganador;
- la logica de derivacion queda concentrada en `semanticQueryService`, sin cambiar el comportamiento de resolucion.

### Cierre real

La slice no cierra todavia `B157`, pero deja un contrato reutilizable para las siguientes piezas de descartes, ambiguedad y confidence.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.8B B157. Pool bruto de candidatos del winner path — **Slice cerrada (spec 220)**

### Resultado técnico registrado

`Spec 220` conserva el conjunto de candidatos evaluados antes del filtro final:

- `ResolvedTargetInfo` expone `candidatePool` como contrato estable y pequeño;
- las rutas locales, jerárquicas, cualificadas y globales retienen el pool bruto antes del filtro definitivo;
- la resolución final sigue saliendo por `targets`, sin cambios funcionales en providers.

### Cierre real

La slice no cierra todavía `B157`, pero deja disponible el material base para explicar descartes y empates en slices posteriores.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.8C B157. Descartes explicados por distancia jerarquica — **Slice cerrada (spec 221)**

### Resultado técnico registrado

`Spec 221` convierte el filtro jerarquico minimo en evidence explicable:

- el runtime conserva descartes producidos por la misma distancia usada para elegir el ganador;
- `ResolvedTargetInfo.evidence` añade entradas `discarded-distance` con distancia ganadora y del candidato descartado;
- la resolucion final sigue inalterada y el cambio queda concentrado en `semanticQueryService`.

### Cierre real

La slice no cierra todavia `B157`, pero ya explica por que un ancestro o miembro mas lejano no gana frente al override mas cercano.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.9 Hito 2026-05 — Bloque B241-B250 cerrado y validado

### Resultado técnico registrado

El bloque `B241-B250` deja cerrado, sobre código y documentación viva, un carril completo de plataforma abierta, explainability, validación operativa y release:

- API pública v2 endurecida con descriptor contractual, inventario estable y compatibilidad versionada;
- bridge read-only para tools/agentes locales o JSON-RPC sobre la API pública;
- export/import versionado de semantic workspace snapshots;
- gobernanza de settings y perfiles del producto sobre surfaces ya existentes;
- panel read-only de diagnostics explainability en el cliente;
- gate de budgets de performance en CI/local y suite de estrés incremental para workspaces grandes;
- knowledge packs curados de frameworks/librerías PowerBuilder en el manifest semántico;
- planner read-only de batch rename/refactor reutilizando preflight, impacto y safe edit plan;
- carril de release repetible con VSIX real, changelog y workflow de marketplace readiness.

### Alcance trazado por spec

- `Spec 284` materializa `B241`.
- `Spec 285` materializa `B242`.
- `Spec 286` materializa `B243`.
- `Spec 287` materializa `B244`.
- `Spec 288` materializa `B245`.
- `Spec 289` materializa `B246`.
- `Spec 290` materializa `B247`.
- `Spec 291` materializa `B248`.
- `Spec 292` materializa `B249`.
- `Spec 293` materializa `B250`.

### Validación registrada

- `npm run build:test`
- `npm run test:unit -- --grep "unit/publicApi"`
- `npm run test:unit -- --grep "unit/semanticWorkspaceSnapshot"`
- `npm run test:unit -- --grep "unit/settingsGovernance"`
- `npm run test:unit -- --grep "diagnosticsExplainabilityPanelModel"`
- `npm run test:unit -- --grep "unit/(frameworkKnowledgePacks|semanticWorkspaceManifest)"`
- `npm run test:unit -- --grep "unit/(safeBatchRefactorPlan|publicApi)"`
- `node ./node_modules/@vscode/test-cli/out/bin.mjs --label performance --grep "performance/large-workspace-incremental"`
- `npm run test:performance:gate`
- `npm run test:smoke -- --grep "la extension se activa en menos de 500ms"`
- `npm run package:vsix`
- `npm run release:verify`

### Documentación alineada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/performance-budget.md`
- `docs/roadmap.md`
- `docs/testing.md`

### B318. PowerBuilder Language Knowledge Catalog v2 — **Cerrada (spec 318)**
**Objetivo:** evolucionar el catálogo de callable/event/statement a un modelo de lenguaje completo (keywords, datatypes, operators, etc.).

**Resultado registrado:**
- extensión de tipos base (`PbSystemSymbolKind`, `PbSystemSymbolDomain`, `PbSystemSymbolNamespace`);
- creación de 8 slices manuales curadas (`manual-core`) cubriendo keywords, reserved words, datatypes (primitive/system), pronouns, operators, system globals y enumerated values;
- implementación de APIs de consulta indexadas en `queryService` y `SystemCatalog` facade para acceso $O(1)$;
- integración en `hover.ts` (fallback para símbolos de lenguaje) y `completion.ts` (sugerencias de keywords/datatypes);
- reporte de consistencia ampliado con `kindCounts`.

**Validación registrada:**
- suite `test/server/unit/catalogV2.test.ts` con 30+ casos cubriendo compatibilidad, nuevos dominios, resolución y alias;
- green en la suite completa de 742 tests.

**Documentación afectada:**
- `specs/318-powerbuilder-language-knowledge-catalog-v2/`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`

---

## 1.8D B157. Descartes contextuales de qualifier — **Slice cerrada (spec 222)**

### Resultado técnico registrado

`Spec 222` hace visibles los misses de contexto más inmediatos en rutas cualificadas:

- `ResolvedTargetInfo.evidence` registra `qualifier-unresolved` cuando el qualifier no resuelve a tipo;
- también registra `qualifier-no-match` cuando el tipo resuelto no aporta miembros compatibles;
- los casos negativos siguen devolviendo cero targets, pero dejan de ser opacos para debugging y futuras confidence gates.

### Cierre real

La slice no cierra todavía `B157`, pero añade explicabilidad negativa básica en el punto exacto donde la ruta cualificada se corta.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.8E B157. Ambiguedad explicita de distancia minima — **Slice cerrada (spec 223)**

### Resultado técnico registrado

`Spec 223` hace visible la ambigüedad residual del winner path jerárquico:

- el ranking por distancia conserva cuándo la distancia ganadora deja más de un candidato;
- `ResolvedTargetInfo.evidence` añade entradas `distance-ambiguity` con distancia mínima y número de empatados;
- `targets` mantiene su comportamiento actual, dejando la decisión de gates para slices posteriores.

### Cierre real

La slice no cierra todavía `B157`, pero deja formalizado el caso de empate que luego necesitarán confidence y feature gates.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.8AD B157. Cardinalidad de ganadores en hover de usuario — **Slice cerrada (spec 237)**

### Resultado técnico registrado

`Spec 237` separa la cardinalidad del winner path como dato estable dentro del hover:

- `formatUserHover()` renderiza `Candidatos ganadores`;
- la cardinalidad se reutiliza desde el `targetCount` ya aportado por el provider;
- la cobertura unitaria valida casos simple y ambiguo.

### Cierre real

La slice distingue claramente entre advertencia de ambigüedad y cardinalidad informativa del winner path.

### Validación registrada

- `npm run test:unit -- --grep "unit/hover"`

---

## 1.8AC B157. Reason detallado de confidence insuficiente — **Slice cerrada (spec 244)**

### Resultado técnico registrado

`Spec 244` mejora la explicabilidad de las decisiones motivadas por confidence insuficiente:

- el `reason` incluye la confidence actual y la requerida;
- la acción calculada no cambia respecto a la `Spec 243`;
- la cobertura unitaria valida el detalle del mensaje en el caso `low < medium`.

### Cierre real

La slice deja la decisión lista para diagnosis más precisa cuando se active en callers del servidor.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8AB B157. Último paso del snapshot en queryTrace — **Slice cerrada (spec 248)**

### Resultado técnico registrado

`Spec 248` añade un resumen escalar del cierre de la última traza capturada:

- `TraceSnapshot` expone `lastStepName`;
- el valor refleja el último paso emitido, o queda ausente si no hubo pasos;
- la cobertura unitaria valida la coherencia entre resumen y array real.

### Cierre real

La slice facilita inspección inmediata del último evento observado sin recorrer la colección completa de pasos.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8AA B157. Suficiencia de confidence por feature — **Slice cerrada (spec 240)**

### Resultado técnico registrado

`Spec 240` compone la policy de confidence en un helper booleando reutilizable:

- `featureReadiness` expone `isResolutionConfidenceSufficient()`;
- el helper reutiliza comparador y thresholds ya centralizados;
- la cobertura unitaria valida casos laxos y estrictos por feature.

### Cierre real

La slice deja preparada una comprobación declarativa de sufficiency antes de activar decisiones automáticas en callers.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8Z B157. Resumen de acciones únicas en queryTrace — **Slice cerrada (spec 247)**

### Resultado técnico registrado

`Spec 247` completa el resumen agregado del snapshot con las acciones únicas observadas:

- `TraceSnapshot` expone `actions`;
- el resumen preserva el orden de primera aparición y elimina duplicados;
- la cobertura unitaria valida la agregación sobre una traza con acciones repetidas.

### Cierre real

La slice deja el snapshot listo para inspección rápida por fases y acciones sin reparseo externo.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8Y B157. Resumen de fases únicas en queryTrace — **Slice cerrada (spec 246)**

### Resultado técnico registrado

`Spec 246` añade al snapshot un resumen ligero de fases únicas observadas:

- `TraceSnapshot` expone `phases`;
- el resumen preserva el orden de primera aparición y elimina duplicados;
- la cobertura unitaria valida la agregación sobre una traza con fases repetidas.

### Cierre real

La slice facilita inspección rápida de la traza sin recorrer todos los pasos ni reagruparlos fuera del módulo.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8X B157. Clonado defensivo de pasos en queryTrace — **Slice cerrada (spec 245)**

### Resultado técnico registrado

`Spec 245` blinda la lectura de la última traza frente a mutaciones externas:

- `getLastTrace()` devuelve clones de cada `TraceStep`;
- mutar el snapshot obtenido ya no altera lecturas posteriores;
- la cobertura unitaria valida el encapsulamiento del estado retenido.

### Cierre real

La slice mejora la seguridad del snapshot retenido sin cambiar el comportamiento observable de la traza.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8W B157. Gating de confidence en featureReadiness — **Slice cerrada (spec 243)**

### Resultado técnico registrado

`Spec 243` activa la policy de confidence dentro de la decisión de readiness:

- `decideFeatureReadiness()` compara `actualResolutionConfidence` contra el threshold del feature;
- cuando la confidence es insuficiente y el readiness base ya era suficiente, aplica `fallbackAction`;
- la cobertura unitaria valida casos de `block` y de `allow` con threshold bajo.

### Cierre real

La slice deja operativo el gating por confidence dentro de la decisión, aunque la integración con callers del servidor quede para slices posteriores.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8V B157. Confidence real contextual en la decisión de readiness — **Slice cerrada (spec 242)**

### Resultado técnico registrado

`Spec 242` completa el contrato de decisión con la señal real aportada por el caller:

- `FeatureReadinessContext` acepta `resolutionConfidence`;
- `FeatureReadinessDecision` expone `actualResolutionConfidence`;
- la cobertura unitaria valida la propagación del valor sin alterar aún la acción final.

### Cierre real

La slice prepara decisiones explicables basadas en confidence sin recalcular la resolución dentro de `featureReadiness`.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8U B157. Threshold requerido en la decisión de readiness — **Slice cerrada (spec 241)**

### Resultado técnico registrado

`Spec 241` hace autocontenida la decisión de readiness respecto a la policy de confidence:

- `FeatureReadinessDecision` expone `requiredResolutionConfidence`;
- `decideFeatureReadiness()` rellena el threshold correspondiente al feature en todas sus ramas;
- la cobertura unitaria fija el contrato de decisión enriquecida.

### Cierre real

La slice deja visible la policy aplicada sin necesitar consultas externas adicionales al getter de thresholds.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8T B157. Thresholds mínimos de confidence por feature — **Slice cerrada (spec 239)**

### Resultado técnico registrado

`Spec 239` centraliza la política mínima de confidence de resolución por feature:

- `featureReadiness` expone `getRequiredResolutionConfidence()`;
- hover y completion aceptan `low`, definition exige `medium`, references y rename exigen `high`;
- la cobertura unitaria deja la política fijada antes de activar gates automáticos.

### Cierre real

La slice prepara la activación controlada de decisions por confidence sin dispersar thresholds en handlers del servidor.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8S B157. Orden canónico de confidence por feature — **Slice cerrada (spec 238)**

### Resultado técnico registrado

`Spec 238` fija la comparación básica de confidence de resolución en la capa de readiness:

- `featureReadiness` define un orden canónico `low < medium < high`;
- `compareResolutionConfidence()` centraliza la comparación;
- la cobertura unitaria deja preparada la base para thresholds y gates posteriores.

### Cierre real

La slice elimina la necesidad de comparaciones ad hoc antes de introducir políticas por feature.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8R B157. Nota de ambigüedad en hover de usuario — **Slice cerrada (spec 236)**

### Resultado técnico registrado

`Spec 236` hace visible en el hover cuándo la resolución sigue siendo ambigua:

- `provideHover()` proyecta si existen varios targets ganadores y cuántos son;
- `formatUserHover()` renderiza una nota explícita de `Resolución ambigua`;
- la cobertura unitaria valida un caso real con dos candidatos a distancia mínima.

### Cierre real

La slice mantiene el target principal actual, pero ya no oculta al usuario que el winner path sigue siendo ambiguo.

### Validación registrada

- `npm run test:unit -- --grep "unit/hover"`

---

## 1.8Q B157. Reason code principal en hover de usuario — **Slice cerrada (spec 235)**

### Resultado técnico registrado

`Spec 235` añade explicabilidad directa del camino de resolución en el hover de usuario:

- `provideHover()` pasa el `reasonCode` principal desde la resolución detallada;
- `formatUserHover()` renderiza `Motivo de resolución` con el valor canónico del query engine;
- la cobertura unitaria valida la proyección en el caso real de `global-fallback`.

### Cierre real

La slice mejora la trazabilidad visible de la resolución sin reinterpretar ni traducir la semántica del engine.

### Validación registrada

- `npm run test:unit -- --grep "unit/hover"`

---

## 1.8P B157. Confidence general en hover de usuario — **Slice cerrada (spec 234)**

### Resultado técnico registrado

`Spec 234` proyecta la confidence general del winner path en el hover de símbolos de usuario:

- `provideHover()` pasa la confidence desde `ResolvedTargetInfo`;
- `formatUserHover()` renderiza `Confianza de resolución` sin mezclarla con la confidence de lineage;
- la cobertura unitaria recoge tanto el formateador como el caso real de `global-fallback`.

### Cierre real

La slice lleva la primera señal compacta del query engine a una feature visible sin tocar la lógica de selección de targets.

### Validación registrada

- `npm run test:unit -- --grep "unit/hover"`

---

## 1.8O B157. Resumen temporal en queryTrace — **Slice cerrada (spec 233)**

### Resultado técnico registrado

`Spec 233` añade metadatos temporales ligeros al snapshot de la última traza:

- `TraceSnapshot` expone `startedAt`, `endedAt` y `durationMs`;
- la duración se deriva en el cierre de `withTrace()`;
- `getLastTrace()` devuelve un resumen temporal coherente junto al resto del snapshot.

### Cierre real

La slice aporta una señal diagnóstica ligera de coste sin introducir perf tooling adicional en el hot path.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8N B157. Step count en queryTrace — **Slice cerrada (spec 232)**

### Resultado técnico registrado

`Spec 232` añade un resumen directo del tamaño de la última traza capturada:

- `TraceSnapshot` expone `stepCount`;
- el valor se fija al cerrar la traza y coincide con `steps.length`;
- `getLastTrace()` devuelve una copia coherente del resumen.

### Cierre real

La slice permite inspección rápida del volumen de pasos sin recorrer el array completo fuera de `queryTrace`.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8M B157. Acción derivada en queryTrace — **Slice cerrada (spec 231)**

### Resultado técnico registrado

`Spec 231` completa la descomposición ligera del nombre de paso en la traza:

- `TraceStep` expone `action`;
- `recordTraceStep()` deriva el sufijo posterior a `:` cuando existe;
- pasos sin patrón compuesto conservan `action` indefinida.

### Cierre real

La slice evita parseo externo del nombre completo de paso y deja la semántica básica de la traza centralizada en `queryTrace`.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8L B157. Fase derivada en queryTrace — **Slice cerrada (spec 230)**

### Resultado técnico registrado

`Spec 230` enriquece cada paso de traza con una fase derivada del nombre compuesto:

- `TraceStep` expone `phase`;
- `recordTraceStep()` deriva el prefijo antes de `:` cuando existe;
- pasos sin prefijo conservan `phase` indefinida.

### Cierre real

La slice mejora la inspección ligera de la traza sin imponer aún una taxonomía cerrada ni tocar los nombres ya emitidos.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8K B157. Tipos de evidence en DocumentQueryContext — **Slice cerrada (spec 229)**

### Resultado técnico registrado

`Spec 229` proyecta una vista resumida de la evidence disponible en el contexto documental:

- `DocumentQueryContext` expone `resolutionEvidenceKinds`;
- la lista reutiliza los `kind` de `resolvedTargets?.evidence` sin tocar los payloads canónicos;
- el resumen cubre casos simples, ambiguos y ausencia de contexto.

### Cierre real

La slice permite detectar qué explicaciones están disponibles sin inspeccionar toda la evidence heterogénea.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8J B157. Cardinalidad de targets en DocumentQueryContext — **Slice cerrada (spec 228)**

### Resultado técnico registrado

`Spec 228` proyecta la cardinalidad del resultado de resolución como un escalar directo del contexto documental:

- `DocumentQueryContext` expone `resolutionTargetCount`;
- el valor reutiliza `resolvedTargets?.targets.length` sin recomputar el query;
- la surface cubre resolución simple, ambigua y ausencia de contexto.

### Cierre real

La slice permite a capas superiores leer cardinalidad sin navegar el resultado detallado completo.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8I B157. Bandera de ambigüedad en DocumentQueryContext — **Slice cerrada (spec 227)**

### Resultado técnico registrado

`Spec 227` proyecta la ambigüedad del winner path como surface booleana directa del contexto documental:

- `DocumentQueryContext` expone `hasResolutionAmbiguity`;
- la bandera se deriva de la evidence `distance-ambiguity` ya calculada por el query engine;
- sin contexto resoluble, el valor degrada a `false`.

### Cierre real

La slice evita que capas superiores tengan que inspeccionar evidence estructurada solo para detectar empates mínimos.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8H B157. Reason code principal en DocumentQueryContext — **Slice cerrada (spec 226)**

### Resultado técnico registrado

`Spec 226` proyecta la causa principal del winner path como surface directa del contexto documental:

- `DocumentQueryContext` expone `primaryResolutionReasonCode`;
- el valor se deriva de `resolvedTargets?.reasonCodes[0]` sin recalcular la resolución;
- la surface degrada a `undefined` cuando no existe contexto resoluble.

### Cierre real

La slice simplifica consumidores de reason codes y mantiene la fuente de verdad en el query engine detallado.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8G B157. Surface de confidence en DocumentQueryContext — **Slice cerrada (spec 225)**

### Resultado técnico registrado

`Spec 225` proyecta la confidence general del query engine como surface de conveniencia en el contexto documental:

- `DocumentQueryContext` expone `resolutionConfidence`;
- la proyección reutiliza `resolvedTargets?.confidence` sin recalcular la resolución;
- el contexto degrada a `undefined` cuando no existe invocación resoluble.

### Cierre real

La slice mantiene la fuente de verdad dentro de `semanticQueryService` y prepara surfaces consumidoras más simples en capas superiores.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8F B157. Confidence scorer v1 del winner path — **Slice cerrada (spec 224)**

### Resultado técnico registrado

`Spec 224` sintetiza la evidence estabilizada en una confidence general del query engine:

- `ResolvedTargetInfo` expone `confidence` con buckets `high`, `medium` y `low`;
- el scorer reutiliza `reasonCodes`, lineage, misses contextuales y ambigüedad sin cambiar `targets`;
- quedan cubiertas rutas altas, medias y bajas sobre el mismo módulo de resolución.

### Cierre real

La slice no cierra todavía `B157`, pero deja un scorer puro reutilizable para surfaces posteriores y futuras confidence gates.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.9 B071A. Caché persistente por workspace y por proyecto — **Cerrada (specs 173 y 174)**

### Resultado técnico registrado

Las `Specs 173-174` cierran `B071A` como capacidad operativa de persistencia fina:

- `cacheStore` acepta `UnifiedProjectModel` para conocer la pertenencia de los documentos;
- el checkpoint persistido se divide por proyecto;
- el journal persistido se divide por proyecto con secuencias locales por partición;
- los documentos huérfanos permanecen anclados a la partición de workspace;
- el warm resume recompone el conjunto agregado aplicando checkpoint y journal por partición.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `326 passing`
- `npm test` → smoke `2 passing`, unit `326 passing`, integration `4 passing`

---

## 1.10 B071B. Caché de consultas frecuentes — **Cerrada (specs 175-184)**

### Resultado técnico registrado

Las `Specs 175-184` cierran `B071B` como cache persistente de serving:

- `ServingCache` expone `exportEntries()` y `restoreEntries()`;
- `cacheStore` persiste y carga snapshots de `ServingCache` en archivo dedicado y versionado;
- el runtime restaura entries persistidas tras warm resume compatible;
- `kbVersionFromKey()` permite filtrar claves por epoch;
- persistencia y restore descartan claves inválidas u obsoletas;
- `ServingCacheFlushCoordinator` coordina dirty/flush;
- el runtime dispara flush oportuno tras hover, definition, signatureHelp y completion;
- invalidaciones y shutdown fuerzan flush estable;
- `powerbuilder.showStats` expone `lastRestoredEntries` y `lastPersistedEntries` en `persistence.servingSnapshot`.

### Alcance trazado por spec

- `Specs 175-184` materializan el cierre completo de `B071B`.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `341 passing`
- `npm test` → smoke `2 passing`, unit `341 passing`, integration `4 passing`

---

## 1.11 B172. Provenance / lineage de símbolos — **Cerrada (specs 185-192)**

### Resultado técnico registrado

Las `Specs 185-192` cierran `B172`:

- añaden `EntityLineage` al modelo semántico central;
- pueblan lineage desde `analyzeDocument`;
- distinguen prototype frente a implementation;
- propagan herencia documental mínima desde `baseTypeName`;
- normalizan lineage en `enrichEntity`;
- incorporan lineage estable al `semanticDiff`;
- exponen `winnerLineage` en `semanticQueryService`;
- conectan provenance del catálogo de sistema con lineage;
- muestran lineage mínimo en hover;
- estabilizan `ApiSymbolLineage` y `toApiSymbol()` en el contrato público.

### Alcance trazado por spec

- `Specs 185-192` cierran `B172`.
- `Spec 192` amplía `B109` sin cerrar aún la API pública completa.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `350 passing`
- `npm test` → smoke `2 passing`, unit `350 passing`, integration `4 passing`

---

## 1.11A B151. KB snapshot-first readers en KnowledgeBase — **Slice cerrada (spec 193)**

### Resultado técnico registrado

`Spec 193` reduce `B151` en un boundary pequeño y reusable:

- `KnowledgeBase` prioriza `documentSnapshots` en `getEntitiesByUri()` y `getScopeAt()`;
- el fallback legacy se conserva cuando el documento aún no tiene snapshot publicado;
- tests unitarios focalizados cubren la lectura documental snapshot-first.

### Cierre real

`Spec 193` no cerraba por sí sola `B151`, pero deja preparado el consumo snapshot-first de features core y sirve de base a `Specs 198-204`, que terminan cerrando `B151A` y `B151`.

### Validación registrada

- `npm run test:unit -- --grep "unit/knowledgeBase"`
- `npm run compile`

---

## 1.12 B165. Publicación atómica del Knowledge Base y de los índices — **Cerrada (specs 134 y 194)**

### Resultado técnico registrado

`B165` queda cerrado y debe salir del backlog activo:

- se separa construcción/staging de publicación visible;
- el swap atómico evita mezcla de estado viejo y nuevo;
- `rollbackBatchUpdate()` descarta publicaciones incompletas;
- `Spec 194` amplía la validación para cubrir `getEntitiesByUri()`, `getScopeAt()` y `getDocumentSnapshot()` durante batch y tras commit.

### Cierre real

`Specs 134 y 194` prueban que las lecturas documentales y globales no ven estado staged ni mezcla parcial.

### Validación registrada

- `npm run test:unit -- --grep "unit/(ServingCache|servingCachePersistence|knowledge)"`
- `npm run compile`
- `npm run test:unit` → `352 passing`
- `npm test` → smoke `2 passing`, unit `352 passing`, integration `4 passing`

---

## 1.13 B166. Versionado semántico interno del workspace — **Cerrada (specs 135, 178-180)**

### Resultado técnico registrado

`B166` queda cerrado y debe salir del backlog activo:

- `KnowledgeBase` publica `semanticEpoch`;
- `ServingCache` liga sus claves a la epoch/version semántica;
- la persistencia filtra snapshots por epoch activa/esperada;
- resultados y caches se invalidan por versión semántica global y no solo por archivo.

### Cierre real

`Specs 135`, `178`, `179` y `180`, junto con el wiring persistente del runtime, hacen que resultados y caches sean coherentes con la epoch semántica global.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `352 passing`
- `npm test` → smoke `2 passing`, unit `352 passing`, integration `4 passing`

---

## 1.14 B170. Semantic diff engine — **Cerrada (specs 136 y 195)**

### Resultado técnico registrado

`Spec 195` completa el cierre de `B170`:

- el diff semántico deja de marcar cambio por puro fingerprint;
- distingue cambios cosméticos de cambios semánticos reales;
- los cambios cosméticos invalidan solo el documento origen;
- los cambios semánticos combinan impactos previos y siguientes.

### Validación registrada

- `npm run test:unit -- --grep "unit/(semanticDiff|semanticInvalidation)"`
- `npm run compile`
- `npm run test:unit` → `355 passing`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.15 B153. Índice de dependencias semánticas inversas — **Cerrada (specs 137 y 195)**

### Resultado técnico registrado

`B153` queda cerrado sobre el reverse graph existente:

- `KnowledgeBase` extrae dependencias desde snapshot;
- mantiene el grafo inverso;
- `Spec 195` usa planes previos y siguientes para resolver el conjunto impactado real;
- se resuelven impactos directos/transitivos sin volver a invalidación gruesa por cambio documental.

### Validación registrada

- `npm run test:unit -- --grep "unit/(semanticDiff|semanticInvalidation)"`
- `npm run compile`
- `npm run test:unit` → `355 passing`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.16 B154. Invalidation engine explícito — **Cerrada (specs 138 y 195)**

### Resultado técnico registrado

`B154` queda cerrado:

- `semanticInvalidation.ts` concentra planes explícitos de invalidación;
- soporta invalidación `document-only`, merge de impactos y plan snapshot-aware;
- el servidor deja de decidir ad hoc entre invalidación gruesa o selectiva;
- desaparece la lógica dispersa de invalidación por feature en el hot path.

### Validación registrada

- `npm run test:unit -- --grep "unit/(semanticDiff|semanticInvalidation)"`
- `npm run compile`
- `npm run test:unit` → `355 passing`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.17 B123. Presupuestos de trabajo y yielding cooperativo — **Cerrada (spec 141)**

### Resultado técnico registrado

`B123` queda cerrado:

- `workspaceIndexer` trabaja con `workBudgetMs`;
- integra `latencyGovernor`;
- contabiliza `yielded`;
- cede cooperativamente con `setImmediate()` en ambos pases;
- el indexador ya no monopoliza CPU durante batches largos.

### Validación registrada

- `npm run compile`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.18 B124. Cancelación y preempción real de tareas de fondo — **Cerrada (spec 142)**

### Resultado técnico registrado

`B124` queda cerrado:

- `TaskScheduler` preempta `Background` con `Near` e `Interactive`;
- cancela tareas activas o pendientes;
- expone contadores de preemption;
- el trabajo interactivo y cercano al contexto activo no queda bloqueado por background.

### Validación registrada

- `npm run compile`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.19 B126. Superficie de estado del indexador — **Cerrada (specs 145 y 196)**

### Resultado técnico registrado

`B126` queda cerrado:

- `getIndexerStatus()` expone fase, pass, progreso, budget y degradación;
- `Spec 196` añade `lastProcessedUri`, `lastFailedUri` y `partialRuns`;
- el indexador deja de ser una caja negra;
- el operador puede ver última actividad relevante sin esperar al event log completo.

### Validación registrada

- `npm run test:unit -- --grep "unit/workspaceIndexer"`
- `npm run compile`
- `npm test` → smoke `2 passing`, unit `357 passing`, integration `4 passing`

---

## 1.20 Hito 2026-05 — Limpieza del backlog activo y traslado de ítems Done

### Resultado técnico registrado

Se actualiza el done-log para reflejar los ítems retirados del backlog activo en la versión corregida del backlog.

### Ítems retirados del backlog activo por estar cerrados

- B165 — Publicación atómica del Knowledge Base y de los índices.
- B166 — Versionado semántico interno del workspace.
- B170 — Semantic diff engine.
- B153 — Índice de dependencias semánticas inversas.
- B154 — Invalidation engine explícito.
- B123 — Presupuestos de trabajo y yielding cooperativo.
- B124 — Cancelación y preempción real de tareas de fondo.
- B126 — Superficie de estado del indexador.
- B071B — Caché de consultas frecuentes.
- B172 — Provenance / lineage de símbolos.

### Nota de gobierno

Estos ítems ya no deben aparecer en el backlog activo. Si quedan referencias a ellos, deben estar solo como dependencias históricas, trazabilidad o notas de cierre, no como trabajo pendiente.

---

## 1.21 B174. Resultados semánticos inmutables — **Cerrada (specs 159-160 y 197)**

### Resultado técnico registrado

`B174` queda cerrado:

- `Specs 159-160` ya blindaban export/restore y el payload persistente versionado de `KnowledgeBase` y `DocumentCache`;
- `Spec 197` completa la frontera inmutable sobre lecturas y escrituras publicas de `KnowledgeBase`, `DocumentCache` y `HotContextCache`;
- mutar entradas o resultados leidos deja de contaminar snapshots, scopes y entidades publicadas.

### Validación registrada

- `npm run test:unit -- --grep "unit/(knowledge|HotContextCache)"`
- `npm run compile`

---

## 1.22 Hito 2026-05 — Specs 198-217: cierre de B151, B152 y B169; reducción de B141A

### Resultado técnico registrado

La ola `Specs 198-217` consolida tres cierres reales del core incremental y reduce el último residual `Partial` de topología compartida:

- Sobre la base de `Spec 193`, `Specs 198-204` hacen snapshot-first `documentSymbols`, `completion`, `signatureHelp`, `diagnostics` y `semanticTokens`, eliminan la recomposición semántica residual por feature y permiten cerrar `B151A` y `B151`.
- `Specs 205-206`, `216` y `217` convierten el indexador en un pipeline de dos fases real con `analyzeDocumentStructural()`, publicación temprana `structural-only`, promoción explícita a `nearby-semantic-ready` y contadores por pass, permitiendo cerrar `B152A` y `B152`.
- `Specs 207-208` y `210` cablean el intake real del watcher sobre el runtime, distinguen modo incremental frente a massive mode, barren caches derivadas de forma selectiva o global según el burst y validan el backpressure extremo a extremo, permitiendo cerrar `B169A` y `B169`.
- `Specs 209`, `211-215` llevan `UnifiedProjectModel` a `workspaceIndexer`, `libraryOrder`, `projectRouting`, refresh por watcher y status activo; `B141A` queda reducido a serving e invariantes finales, pero no cerrado todavía.

### Alcance trazado por spec

- `Specs 198-204` cierran `B151A` y `B151`.
- `Specs 205-206`, `216` y `217` cierran `B152A` y `B152`.
- `Specs 207-208` y `210` cierran `B169A` y `B169`.
- `Specs 209`, `211-215` reducen `B141A`, pero la mantienen en backlog activo.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- suites focalizadas por slice sobre `documentSymbols`, `documentAnalysis`, `workspaceIndexer`, `watchedFileIntake`, `watcherPipeline`, `unifiedProjectModel`, `libraryOrder`, `workspace`, `knowledgeBase` y `scopeResolution`
- `npm run test:unit` → `376 passing`
- `npm test` → smoke `2 passing`, unit `376 passing`, integration `4 passing`

---

## 1.23 B141/B141A. Library graph / project model unificado y adopción runtime — **Cerradas (specs 149-152, 209, 211-215 y 218)**

### Resultado técnico registrado

Las `Specs 149-152`, `209`, `211-215` y `218` dejan cerrado el modelo compartido de proyecto/routing del runtime:

- `UnifiedProjectModel` actúa como única fuente de verdad project-aware en `cacheStore`, `workspaceIndexer`, `libraryOrder`, refresh por watcher y status del proyecto activo;
- `WorkspaceState.clear()` reinicia también `projectRegistry`, evitando arrastrar routing legacy tras un reset completo del workspace;
- el contrato de proyecto activo sigue derivándose del modelo unificado y el reset deja `getProjectContextForFile()` en estado seguro;
- backlog, roadmap y current-focus dejan de tratar `B141A` como residual `Partial`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `379 passing`
- `npm test` → smoke `2 passing`, unit `379 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.24 B122. Priorización por dependencias semánticas cercanas — **Cerrada (spec 140)**

### Resultado técnico registrado

`Spec 140` queda cerrada sobre el runtime real del indexador:

- el servidor pasa `activeDocumentUri` real a `indexWorkspace`, evitando que la prioridad quede reducida a orden físico cuando existe contexto activo;
- `prioritizeFilesForIndexing()` ordena ahora por buckets explicables: activo, ancestros, owners/tipos cercanos, calls probables, proyecto y workspace;
- el grafo inverso publicado y los snapshots semánticos del activo alimentan esa heurística sin reintroducir lógica duplicada en el hot path;
- `getIndexerStatus()` expone `prioritySummary`, dejando visible la razón de prioridad observada por el runtime.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `381 passing`
- `npm test` → smoke `2 passing`, unit `381 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.25 B125. Indexación progresiva del workspace completo — **Cerrada (spec 144)**

### Resultado técnico registrado

`Spec 144` queda cerrada sobre el runtime real del indexador y del watcher:

- `watchedFileIntake` ya alimenta la misma file state machine que `workspaceIndexer`, dejando estado explícito para `create`, `change`, `delete`, saltos por documento abierto y fallos locales;
- `getFileIndexState()` y `getIndexerStatus()` cubren ahora tanto la indexación completa del workspace como los lotes incrementales del watcher, sin abrir una segunda vía de estado;
- el pipeline mantiene prioridad, yielding, preempción y backpressure ya existentes, pero ahora con visibilidad coherente de estados simultáneos mientras el workspace converge hacia `ready`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/watchedFileIntake"`
- `npm test` → smoke `2 passing`, unit `382 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.26 B134. Modelo de progreso y readiness del indexador — **Cerrada (spec 146)**

### Resultado técnico registrado

`Spec 146` queda cerrada sobre el runtime real del servidor:

- discovery, indexación, watcher intake y `powerbuilder.showStats` derivan ahora del mismo snapshot de progreso/readiness en lugar de mezclar señales separadas de `readiness` e `indexer`;
- el modelo distingue progreso operativo de disponibilidad semántica y publica `activeContextReady`, `projectReady` y `workspaceReady` sobre esa misma fuente;
- `discoverWorkspace` expone progreso monotónico de discovery y el servidor reutiliza esa señal para transiciones coherentes sin abrir un segundo camino de status.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/146-indexer-progress-readiness/quickstart.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/progressReadiness|unit/workspace|unit/watchedFileIntake"`
- `npm test` → smoke `2 passing`, unit `386 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.27 B158. Modo degradado formal — **Cerrada (spec 147)**

### Resultado técnico registrado

`Spec 147` queda cerrada sobre el runtime real de serving:

- existe ya una enumeración formal de niveles (`structural-only`, `nearby-semantic-ready`, `project-semantic-ready`, `workspace-semantic-ready`) y un helper único que decide `allow`, `degrade` o `block` por feature;
- `hover` y `completion` consumen el contrato en modo degradado, mientras `definition`, `references` y `rename` se bloquean o habilitan según el nivel requerido sin fingir precisión semántica;
- el mapping se apoya en la fuente única de progreso/readiness ya cerrada en `B134`, sin duplicar lógica en el query engine ni abrir una segunda vía de elegibilidad.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/147-formal-degraded-mode/quickstart.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness|unit/progressReadiness|unit/definition|unit/references|unit/hover|unit/completion|unit/renamePreflight"`
- `npm test` → smoke `2 passing`, unit `390 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing` (segunda ejecución; la primera fue ruido no reproducible de entorno)

---

## 1.28 B159. Gobernador de latencia del servidor — **Cerrada (spec 148)**

### Resultado técnico registrado

`Spec 148` queda cerrada sobre el runtime real del servidor:

- el `latencyGovernor` deja de estar encapsulado solo en el indexador y pasa a proteger también el serving interactivo y la admisión de trabajo de fondo desde el `scheduler`;
- existe una política explícita por tipo de request: `hover` y `completion` degradan bajo presión, `references` se bloquea bajo presión, y el background queda aplazado durante un cooldown corto sin romper el pipeline;
- la presión de latencia ya es observable y reutilizable en el runtime, alineada con el contrato de degradación de `B158`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/148-server-latency-governor/quickstart.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/latencyGovernor|unit/scheduler|unit/featureReadiness|unit/hover|unit/completion|unit/references"`
- `npm test` → smoke `2 passing`, unit `394 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.29 B156. Query engine unificado — **Cerrada (spec 164 + cierre operativo posterior)**

### Resultado técnico registrado

`B156` queda cerrada como capacidad real del runtime:

- el helper común de contexto de query y el resolver semántico detallado alimentan ya el hot path de `hover`, `definition`, `signatureHelp`, `completion` y la resolución de declaración en `references`;
- `references` deja de elegir definiciones solo por nombre cuando el acceso es cualificado y pasa a usar el mismo winner semántico que `definition`;
- `completion` deja de depender de un contexto documental paralelo para obtener el objeto activo y el tipo del cualificador;
- existe una prueba de consistencia cross-feature que fija el mismo contexto base entre `definition`, `references` y `completion`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/164-query-context-helper/quickstart.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/references|unit/completion|unit/queryEngineConsistency|unit/definition|unit/semanticQueryService"`
- `npm test` → smoke `2 passing`, unit `396 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.30 B173. Precomputed member closures por tipo — **Cerrada**

### Resultado técnico registrado

`B173` queda cerrada como infraestructura reusable del runtime:

- `InheritanceGraph` precomputa una closure de miembros por tipo con `relation`, `distance`, `accessible` y marca de override local;
- `getMembers()` deja de reconstruir la misma lista plana por su cuenta y pasa a reutilizar esa closure cacheada;
- la información precomputada ya queda disponible para consumers del query engine y deja preparada una base honesta para `B066`, `B065` y `B031`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run test:unit -- --grep "InheritanceGraph|unit/completion|unit/definition|unit/references|unit/hover|unit/semanticQueryService"`
- `npm test` → smoke `2 passing`, unit `397 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.31 B066. CodeLens de referencias y herencia — **Cerrada (spec 050 ampliada)**

### Resultado técnico registrado

`B066` deja de ser una lens cosmética y queda cerrada como feature usable:

- el handler del servidor ya no usa `findAllDefinitions(name)` como proxy bruto de referencias y pasa a calcular conteos sobre el motor compartido de `references`;
- los títulos de CodeLens incorporan información de overrides/herencia consumiendo `member closures` de `B173`;
- existe caché de conteos por documento/epoch para no reescanear el workspace en cada solicitud;
- si `references` no está lista por readiness o presión de latencia, la lens degrada honestamente y deja de exponer un comando engañoso.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/050-codelens-refs/spec.md`
- `specs/050-codelens-refs/tasks.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/codeLensReferences|unit/references|unit/queryEngineConsistency|unit/featureReadiness"`
- `npm test` → smoke `2 passing`, unit `400 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.32 B065. Ancestor script navigation + hierarchy inspection — **Cerrada (spec 059, absorbiendo B137)**

### Resultado técnico registrado

`B065` deja de ser un par de helpers aislados y queda cerrada como inspección jerárquica usable:

- `getAncestorChain` y `buildHierarchyTree` pasan a alimentar una inspección estructurada del tipo activo con ancestro inmediato, cadena de ancestros, árbol de descendencia y overrides heredados;
- el runtime reutiliza `member closures` de `B173` para explicar overrides locales e integrar accesibilidad y origen heredado sin duplicar lógica semántica;
- la extensión publica el comando `PowerSyntax: Inspeccionar Jerarquía Activa`, que ejecuta la inspección sobre el documento y posición activos y expone el resultado de forma visible desde el cliente.

### Documentación afectada

- `README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/059-ancestor-chain/spec.md`
- `specs/059-ancestor-chain/plan.md`
- `specs/059-ancestor-chain/tasks.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/hierarchyInspection|unit/ancestorNav|unit/hierarchyTree"`
- `npm test` → smoke `2 passing`, unit `401 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing` (segunda ejecución; la primera falló por ruido no reproducible del host)

---

## 1.33 B109. API pública para integración — **Cerrada (spec 054 ampliada sobre specs 172 y 192)**

### Resultado técnico registrado

`B109` deja de ser solo un archivo de tipos y queda cerrada como superficie pública mínima real:

- la activación de la extensión exporta una API versionada y estable para consumidores externos;
- la API expone `getServerStats()` sobre el contrato maduro de `ApiServerStats` y `querySymbols()` sobre `ApiQuerySymbolsRequest`/`ApiSymbol`, sin abrir estructuras internas mutables ni prometer evidence que aún pertenece a `B157`;
- el flujo `build:test` recompila ahora cliente y servidor antes de smoke/unit/integration, evitando validar contra artefactos obsoletos del `out/`.

### Documentación afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/testing.md`
- `specs/054-public-api/spec.md`
- `specs/054-public-api/plan.md`
- `specs/054-public-api/tasks.md`

### Validación registrada

- `npm run test:smoke -- --grep "smoke/extension"`
- `npm run test:unit -- --grep "unit/publicApi"`
- `npm test` → smoke `2 passing`, unit `401 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.34 B164. Interning y compactación de memoria — **Cerrada**

### Resultado técnico registrado

`B164` queda cerrada como optimización interna real y observable:

- `KnowledgeBase` y `DocumentCache` compactan por documento las strings calientes de URIs, ids, nombres, owners, tipos y contenedores antes de persistir facts/scopes/snapshots;
- la compactación no introduce fugas silenciosas: al reemplazar o invalidar un documento, el interner libera sus referencias y el pool vuelve a tamaño cero cuando el documento desaparece;
- el estado queda observable vía stats (`internedStrings`) para no dejar la optimización como una caja negra no verificable.

### Documentación afectada

- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/managedStringInterner|unit/knowledge"`
- `npm test` → smoke `2 passing`, unit `404 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.35 B063. Diagnostics snapshot agrupado — **Cerrada**

## 1.36 B171. Confidence gates por feature — **Cerrada (runtime coverage 2026-05)**

**Objetivo:** que cada feature opere solo con el nivel de confianza adecuado.

**Resultado registrado:**
- `src/server/features/featureReadiness.ts` ya fija comparador, thresholds mínimos y decisión base por feature;
- `src/server/features/servingReadiness.ts` encapsula el gate de runtime consumido por los handlers sensibles;
- `src/server/server.ts` reutiliza ese gate en `references`, `prepareRename` y `rename` para devolver fallback seguro y mensaje estable cuando la confidence no alcanza el umbral requerido;
- `test/server/unit/servingReadiness.test.ts` aporta evidencia negativa ejecutable para `references` y `rename` bajo confidence insuficiente, además del caso positivo con confidence alta.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(servingReadiness|featureReadiness)"`

## 1.37 B167. Journaling transaccional de caché persistente — **Cerrada (recovery robusto 2026-05)**

**Objetivo:** evitar corrupción de caché y estados incompletos.

**Resultado registrado:**
- `src/server/cache/cacheStore.ts` mantiene journal persistente, lo limpia al consolidar checkpoint y recompone el restore aplicando solo entradas válidas;
- el loader distingue ahora entre estado ausente y payload JSON corrupto/truncado, forzando rebuild limpio cuando el journal o el checkpoint quedaron a medias;
- la validación existente de secuencia y entradas del journal en `src/server/cache/cacheCheckpoint.ts` queda reforzada por recovery explícito ante corrupción parcial en disco;
- `test/server/unit/cacheStore.test.ts` y `test/server/unit/cachePersistence.test.ts` cubren limpieza del journal, secuencias inválidas y truncado/corrupción parcial del estado persistido.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(cacheStore|cachePersistence)"`

## 1.38 B168. Cache schema versioning + migraciones — **Cerrada (policy/documentation 2026-05)**

**Objetivo:** versionar persistencia y decidir migrate/invalidate/rebuild con seguridad.

**Resultado registrado:**
- `src/server/cache/cacheSchema.ts` mantiene un schema persistente explícito para `checkpoint` y `journal`, con migradores internos para payloads compatibles del mismo corte;
- `src/server/cache/cacheCheckpoint.ts` conserva la política canónica: payload compatible se normaliza y reutiliza, `schemaVersion` desconocido o incompatible fuerza `rebuild` limpio;
- `docs/architecture.md` documenta la política oficial de migrate/rebuild y el contenido del schema persistente para checkpoint y journal;
- `test/server/unit/cachePersistence.test.ts` cubre tanto el camino compatible sin `schemaVersion` explícito como el rebuild seguro por versión incompatible.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/cachePersistence"`

## 1.39 B071. Warm indexing y resume de caché persistente — **Cerrada (observable closure 2026-05)**

**Objetivo:** evitar cold indexing en cada reapertura.

**Resultado registrado:**
- la base de persistencia ya permite warm resume real de `DocumentCache` y `KnowledgeBase`, con reuse/rebuild seguro sobre `cacheStore` y `checkpoint` persistido;
- `test/results/003-real-corpora-baseline.md` deja medido el delta cold/warm en corpus grandes reales de PFC Workspace;
- `src/shared/publicApi.ts`, `src/server/server.ts` y `src/client/statusBarPresentation.ts` exponen ahora en stats/status si la reapertura quedó en `restored`, `reused` o `rebuilt`, junto con el número de documentos restaurados y la snapshot de serving reaprovechada;
- la barra de estado y sus reportes dejan visible ese estado sin depender solo de logs internos.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(statusBarPresentation|publicApi)"`
- `npm run test:performance`

## 1.40 B205. PowerBuilder grammar canonical module — **Cerrada (shared grammar consolidation 2026-05)**

**Objetivo:** centralizar patrones, keywords y matchers estructurales de PowerBuilder en un módulo canónico.

**Resultado registrado:**
- `src/server/parsing/grammar.ts` consolida keywords, matchers de secciones, bloques ejecutables y patrones estructurales reutilizados por parsing y diagnostics;
- `src/server/parsing/controlBlocks.ts`, `src/server/parsing/sectionMachine.ts`, `src/server/features/diagnosticsExtra.ts` y `src/server/analysis/documentAnalysis.ts` dejan de duplicar regex críticas y consumen patrones compartidos o matchers canónicos;
- la suite de gramática queda reforzada con cobertura de `type prototypes` y `owner type variables` en `test/server/unit/sectionMachine.test.ts`.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(sectionMachine|matchers|documentAnalysis|diagnosticsExtra)"`

## 1.41 B036. Code actions básicas — **Cerrada (safe quick-fix baseline 2026-05)**

**Objetivo:** quick fixes pequeños, seguros y explicables.

**Resultado registrado:**
- `src/server/features/codeActions.ts` fija un catálogo mínimo y estable sobre SD7, limitado a un reemplazo simple dentro del rango diagnosticado;
- cada action expone metadata explícita de `evidence`, `confidence` y tipo de edición segura;
- el provider rechaza sugerencias no seguras fuera del patrón de identificador simple, evitando modificaciones peligrosas o ambiguas.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/codeActions"`

## 1.42 B160. Query result cache con claves semánticas estables — **Cerrada (observable serving cache 2026-05)**

**Objetivo:** cachear respuestas semánticas seguras.

**Resultado registrado:**
- `src/server/knowledge/ServingCache.ts` deja cubiertas claves estables para `hover`, `definition`, `signatureHelp` y `completion`, incluyendo discriminadores extra y epoch semántica;
- `src/server/server.ts` reutiliza `resolveServingReadiness` también en cache hits de `definition`, de modo que el resultado cacheado sigue respetando readiness y `resolutionConfidence` antes de servirse;
- `src/shared/publicApi.ts` y `src/client/statusBarPresentation.ts` hacen observable el hit ratio, misses y evictions del serving cache en stats y status.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(ServingCache|servingReadiness|statusBarPresentation)"`

## 1.43 B157. Semantic evidence de primera clase — **Cerrada (diagnostics parity 2026-05)**

**Objetivo:** modelar formalmente por qué una resolución ganó o fue descartada.

**Resultado registrado:**
- el query engine ya dejaba cubiertos `winner evidence`, `candidatePool`, descartes por distancia/contexto, ambigüedad mínima, `confidence`, `queryContext`, `queryTrace`, hover y policy base por feature;
- `src/server/features/diagnostics.ts` reutiliza ahora `semanticQueryService` también para SD2, evitando reconstruir resolución local y proyectando un resumen seguro de `confidence`, `reasonCodes`, `evidenceKinds` y cardinalidad en `Diagnostic.data`;
- diagnostics, stats/API y consumers sensibles quedan alineados sobre la misma semántica explicable sin abrir una segunda lógica de resolución.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/diagnostics"`

## 1.44 B031. Referencias más precisas y robustas — **Cerrada (topología real + masking + family filtering 2026-05)**

**Objetivo:** referencias cross-file y contexto fuerte sin matching superficial.

**Resultado registrado:**
- `src/server/server.ts` deja de limitar `references` a documentos abiertos y pasa a recopilar fuentes sobre `WorkspaceState`, preservando además documentos abiertos fuera del inventario para no perder contexto activo;
- `src/server/features/references.ts` deja de escanear contenido crudo y reutiliza el masking canónico de strings/comentarios antes del matching textual, evitando falsos positivos en literales y comentarios;
- cada ocurrencia candidata se revalida contra la misma familia semántica resuelta por el query engine compartido, de modo que owners homónimos no contaminan el resultado aunque exista match textual coincidente;
- el resultado sigue bloqueado o habilitado por `confidence/readiness` del runtime ya cerrados en `B171`, manteniendo `references` explicable sobre topología real sin reabrir una segunda lógica de resolución.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/references"`
- `npm run test:unit -- --grep "unit/queryEngineConsistency"`
- `npm run test:unit -- --grep "unit/codeLensReferences|unit/references|unit/queryEngineConsistency|unit/featureReadiness"`

## 1.45 B155. Checkpoints reales de indexación y resume robusto — **Cerrada (discovery snapshot + restore temprano validado 2026-05)**

**Objetivo:** reaperturas rápidas y resume seguro del pipeline.

**Resultado registrado:**
- `src/server/cache/cacheSchema.ts` y `src/server/cache/cacheCheckpoint.ts` amplían el contrato persistente con un snapshot explícito de discovery (`roots` + `sourceFiles`) normalizado junto a la metadata ya existente del checkpoint;
- `src/server/workspace/workspaceState.ts` expone export/restore/reemplazo controlado del snapshot de discovery para separar el estado restaurado del estado redescubierto sin contaminar el inventario real del workspace;
- `src/server/server.ts` aplica ahora restore temprano de `DocumentCache`, `KnowledgeBase`, serving snapshot y discovery snapshot antes del redescubrimiento, ejecuta el discovery real sobre un `WorkspaceState` temporal y valida después la metadata completa antes de indexar o conservar el resume;
- el servidor siembra además un checkpoint actualizado justo tras discovery, de modo que una sesión interrumpida durante la indexación ya conserva discovery/readiness base y puede reencolar solo trabajo pendiente o incompatible en la reapertura siguiente.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/workspace|unit/cachePersistence"`
- `npm run test:unit -- --grep "unit/cacheStore|unit/statusBarPresentation|unit/publicApi"`

## 1.46 B032. Rename controlado — **Cerrada (queryContext real + workspace edit seguro + bloqueo dinámico 2026-05)**

**Objetivo:** ampliar rename solo en escenarios semánticamente seguros.

**Resultado registrado:**
- `src/server/features/rename.ts` introduce un helper puro que reutiliza `queryContext`, `references` y `renamePreflight` para construir `WorkspaceEdit` solo cuando existe un target único y seguro;
- `src/server/server.ts` deja de renombrar por scope léxico local y delega `onRenameRequest` al helper semántico con fuentes reales del workspace;
- el rename queda habilitado para variables locales, parámetros y miembros resueltos por qualifier/hierarchy con confidence alta, y bloqueado con razón estable ante ambigüedad, fallback global o hits dinámicos en strings;
- `test/server/unit/rename.test.ts` cubre parámetros locales, miembros tipados cross-file, bloqueo por fallback global y bloqueo por referencias dinámicas.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/rename|unit/renamePreflight"`
- `npm run test:unit -- --grep "unit/dynamicStringReferences|unit/rename|unit/renamePreflight|unit/references|unit/queryEngineConsistency|unit/featureReadiness|unit/servingReadiness|unit/codeLensReferences"`

## 1.47 B208. Dynamic string reference detector — **Cerrada (clasificación conservadora + degradación honesta 2026-05)**

**Objetivo:** detectar referencias relevantes en strings dinámicos y degradar operaciones peligrosas cuando no exista cobertura fiable.

**Resultado registrado:**
- `src/server/features/dynamicStringReferences.ts` añade un detector reusable con clasificación `safe-literal`, `probable`, `dynamic`, `unknown` sobre `Open`, `DataObject`, `PostEvent`, `TriggerEvent`, `EvaluateJavascriptSync/Async`, JSON paths, SQL dinámico y `Describe/Modify/Evaluate`;
- `src/server/features/rename.ts` bloquea el rename cuando el símbolo aparece en un hit no seguro dentro de strings dinámicos;
- `src/server/features/references.ts` degrada a definiciones cuando detecta ese riesgo, evitando prometer cobertura textual completa en presencia de referencias dinámicas;
- la surface actual de code actions sigue siendo un quick-fix local de diagnóstico de rango único, por lo que no necesita una ruta adicional de degradación semántica para este cierre.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/dynamicStringReferences|unit/rename|unit/renamePreflight|unit/references"`
- `npm run test:unit -- --grep "unit/dynamicStringReferences|unit/rename|unit/renamePreflight|unit/references|unit/queryEngineConsistency|unit/featureReadiness|unit/servingReadiness|unit/codeLensReferences"`

## 1.48 B204. Source origin model unificado — **Cerrada (contrato compartido + persistence + API/diagnostics 2026-05)**

**Objetivo:** clasificar de forma uniforme el origen de cada documento, símbolo y snapshot semántico.

**Resultado registrado:**
- `src/shared/sourceOrigin.ts` introduce un contrato compartido de `sourceOrigin` con prioridad explícita entre source real, staging, export, generated, backup y unknown;
- `src/server/workspace/workspaceState.ts`, `src/server/workspace/discovery.ts`, `src/server/cache/cacheSchema.ts` y `src/server/cache/cacheCheckpoint.ts` persisten y restauran origen por archivo junto al snapshot de discovery del workspace;
- `src/server/analysis/documentAnalysis.ts`, `src/server/knowledge/types.ts` y `src/server/knowledge/resolution/semanticQueryService.ts` propagan `sourceOrigin` a lineage y evidence del query engine;
- `src/server/features/diagnostics.ts`, `src/server/features/diagnosticsSnapshot.ts`, `src/server/features/workspaceSymbols.ts`, `src/server/server.ts` y `src/client/extension.ts` exponen `sourceOrigin` en diagnostics snapshot, stats y API pública de `querySymbols()` sin abrir una surface paralela.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/sourceOrigin|unit/workspace|unit/cachePersistence|unit/publicApi"`
- `npm run test:unit -- --grep "unit/sourceOrigin|unit/workspace|unit/cachePersistence|unit/publicApi|unit/workspaceSymbols|unit/diagnosticsSnapshot|unit/diagnostics"`
- `npm run test:unit -- --grep "unit/sourceOrigin|unit/workspace|unit/cachePersistence|unit/publicApi|unit/workspaceSymbols|unit/diagnosticsSnapshot|unit/diagnostics|unit/queryEngineConsistency|unit/references|unit/rename|unit/renamePreflight|unit/featureReadiness|unit/servingReadiness"`

## 1.49 B206. Rich PowerBuilder symbol metadata — **Cerrada (metadata contractual viva + hover/document analysis 2026-05)**

**Objetivo:** enriquecer progresivamente el modelo de símbolo con metadata específica de PowerBuilder.

**Resultado registrado:**
- `src/server/analysis/documentAnalysis.ts`, `src/server/model/types.ts` y `src/server/knowledge/types.ts` propagan `containerKind`, `containerSignature`, `fileObjectName`, `declarationScope`, `implementationKind`, `ownerName`, `parameterCount`, `returnType`, `access` y `sourceOrigin` en el modelo real cuando aplica;
- `src/server/knowledge/enrichEntity.ts` consolida derivaciones estables para `ownerName`, `declarationScope` e `implementationKind`, incluyendo distinción explícita entre `on-handler` y `external-function`;
- `src/server/features/hoverFormat.ts` consume esa metadata para explicar prototype, implementation, on-handler, external function, member/local/parameter y owner real sin recomputar semántica fuera del backbone;
- `src/server/knowledge/stringInterning.ts` y `src/server/knowledge/semanticDiff.ts` incorporan los nuevos campos para que la metadata enriquecida participe en internado, diff y persistencia sin modelos paralelos.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/documentAnalysis|unit/enrichEntity|unit/hoverFormat"`
- `npm run test:unit -- --grep "unit/documentAnalysis|unit/enrichEntity|unit/hoverFormat|unit/hover|unit/semanticTokens|unit/documentSymbols|unit/references|unit/rename|unit/renamePreflight|unit/queryEngineConsistency"`
- `npm run test:unit -- --grep "unit/documentAnalysis|unit/enrichEntity|unit/hoverFormat|unit/hover|unit/documentSymbols|unit/references|unit/rename|unit/renamePreflight|unit/queryEngineConsistency|unit/cachePersistence|unit/workspaceSymbols"`

## 1.50 B209. PowerBuilder call model and invocation classification — **Cerrada (invocationKind/invocationRisk + parent/ancestor 2026-05)**

**Objetivo:** clasificar llamadas PowerBuilder según forma y riesgo semántico.

**Resultado registrado:**
- `src/server/utils/invocationContext.ts` distingue ya `.` y `::`, preservando la forma sintáctica de invocación para `this`, `parent`, `super`, `ancestor` y qualifiers tipados;
- `src/server/knowledge/resolution/semanticQueryService.ts` resuelve el current object real por línea/scope, añade `invocationKind`, `invocationRisk` y `resolvedQualifierType`, y soporta `parent.uf_xxx()` y `ancestor::event` como rutas explícitas del query engine compartido;
- `src/server/features/queryContext.ts`, `src/server/knowledge/queryTrace.ts` y `src/shared/publicApi.ts` propagan la clasificación de invocación a traces y contexto compartido, de modo que definition/references/rename/completion/signatureHelp puedan explicar cómo se resolvió cada callsite;
- los tests focalizados cubren `invocationContext`, `queryContext`, `semanticQueryService` y `definition`, y la validación lateral mantiene verdes `references`, `rename`, `renamePreflight`, `queryEngineConsistency`, `completion` y `signatureHelp`.

**Validación registrada:**
- `npm run test:unit -- --grep "server/utils/invocationContext|unit/queryContext|unit/semanticQueryService|unit/definition"`
- `npm run test:unit -- --grep "server/utils/invocationContext|unit/queryContext|unit/semanticQueryService|unit/definition|unit/references|unit/rename|unit/renamePreflight|unit/queryEngineConsistency|unit/completion|unit/signatureHelp"`

## 1.51 B210. PowerBuilder event model — **Cerrada (owner real + TriggerEvent/PostEvent estables 2026-05)**

**Objetivo:** modelar eventos PowerBuilder como entidades semánticas de primera clase.

**Resultado registrado:**
- `src/server/parsing/grammar.ts`, `src/server/parsing/matchers.ts` y `src/server/model/types.ts` separan owner y event name en `on object.event`, preservando además la firma cualificada original del handler;
- `src/server/analysis/documentAnalysis.ts` cuelga el scope del evento del owner real, estabiliza `containerName`/`ownerName` de on-handlers y deja de modelar los eventos como nombres planos `owner.event` dentro del backbone semántico;
- `src/server/utils/invocationContext.ts`, `src/server/features/queryContext.ts`, `src/server/features/definition.ts` y `src/server/features/references.ts` sintetizan contexto semántico para literales estables de `TriggerEvent/PostEvent`, permitiendo navegación y referencias sobre eventos reales sin abrir un motor paralelo;
- la validación lateral mantiene verdes `hover`, `hoverFormat`, `documentSymbols`, `semanticTokens`, `completion`, `signatureHelp`, `rename`, `renamePreflight`, `dynamicStringReferences` y `queryEngineConsistency` sobre el modelo nuevo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/matchers|unit/documentAnalysis|unit/definition"`
- `npm run test:unit -- --grep "server/utils/invocationContext|unit/queryContext|unit/definition|unit/references"`
- `npm run test:unit -- --grep "unit/matchers|unit/documentAnalysis|server/utils/invocationContext|unit/queryContext|unit/definition|unit/references|unit/rename|unit/renamePreflight|unit/queryEngineConsistency|unit/hover|unit/hoverFormat|unit/documentSymbols|unit/semanticTokens|unit/completion|unit/signatureHelp|unit/dynamicStringReferences"`

## 1.52 B207. External functions and native dependency model — **Cerrada (dll/pbx/unknown + degradación honesta 2026-05)**

**Objetivo:** modelar funciones externas, DLL/PBX/PBNI y dependencias nativas sin tratarlas como símbolos internos.

**Resultado registrado:**
- `src/server/parsing/externalFunctions.ts`, `src/server/model/types.ts`, `src/server/knowledge/types.ts` y `src/server/analysis/documentAnalysis.ts` conservan ya librería, alias y clasificación `dll`/`pbx`/`unknown` en el modelo real de external functions/subroutines;
- `src/server/features/hoverFormat.ts` explica dependencia externa, alias y tipo nativo, mientras `src/server/features/rename.ts` bloquea rename y `src/server/features/references.ts` degrada a la declaración cuando el target es externo;
- `src/server/features/diagnostics.ts` emite una nota informativa para dependencias nativas sin implementación interna navegable, evitando presentar la declaración externa como definition interna del workspace;
- `src/server/knowledge/stringInterning.ts`, `src/server/knowledge/semanticDiff.ts`, `unit/cachePersistence` y `unit/workspaceSymbols` validan que la metadata nativa no quede muerta fuera del path inmediato de hover/serving.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/externalFunctions|unit/documentAnalysis|unit/hoverFormat|unit/rename|unit/references|unit/diagnostics"`
- `npm run test:unit -- --grep "unit/externalFunctions|unit/documentAnalysis|unit/hoverFormat|unit/hover|unit/rename|unit/renamePreflight|unit/references|unit/diagnostics|unit/queryEngineConsistency|unit/semanticQueryService|unit/cachePersistence|unit/workspaceSymbols"`

## 1.53 B211. Transaction and SQLCA semantic model — **Cerrada (SQLCA especial + binding básico transaction/DataWindow 2026-05)**

**Objetivo:** modelar `Transaction`, `SQLCA`, `SetTransObject`, `SetTrans`, `Retrieve`, `Update` y SQL embebido sin semántica plana ni inventada.

**Resultado registrado:**
- `src/server/knowledge/resolution/semanticQueryService.ts` y `src/server/features/queryContext.ts` tratan ya `SQLCA` como transaction global especial, estabilizando el owner-type de `SQLCA.*` dentro del query engine compartido;
- `src/server/features/completion.ts`, `src/server/features/hover.ts` y `src/server/features/signatureHelp.ts` resuelven members del catálogo filtrando por `ownerType`, con lo que `datastore/datawindow.Retrieve`, `Update`, `SetTransObject`, `SetTrans` y `SQLCA.DBHandle()` explican la entrada correcta del catálogo en vez de una coincidencia plana por nombre;
- `src/server/features/diagnostics.ts` enlaza `SetTransObject`/`SetTrans` con `Retrieve`/`Update`, informa transaction desconocida y degrada la confidence cuando el binding es dinámico;
- la parte de SQL estático/dinámico reaprovecha las piezas ya cerradas en `sqlRegions` y `dynamicStringReferences`, sin abrir un motor paralelo para B211.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/completion"`
- `npm run test:unit -- --grep "unit/diagnostics"`
- `npm run test:unit -- --grep "unit/(hover|signatureHelp)"`
- `npm run test:unit -- --grep "unit/(completion|diagnostics|hover|signatureHelp|sqlRegions|dynamicStringReferences)"`

## 1.54 B213. PowerBuilder object lifecycle model — **Cerrada (create/destroy + hooks constructor/destructor 2026-05)**

**Objetivo:** modelar create/destroy, constructor/destructor y ancestor flow sin tratarlos como eventos o wiring planos.

**Resultado registrado:**
- `src/server/features/hierarchyInspection.ts` proyecta ya lifecycle create/destroy con evidence de `call super::create/destroy`, hook disparado (`constructor/destructor`), resolución del hook y warnings suaves por wiring sospechoso desde el snapshot semántico publicado;
- `src/server/features/hover.ts` reutiliza ese mismo bloque para explicar `constructor/destructor` resueltos desde `TriggerEvent(this, ...)` y no presentarlos como eventos aislados;
- `src/server/features/diagnostics.ts` emite warnings suaves reutilizando el mismo backbone (`missing-super-*`, `missing-trigger-*`, `unresolved-*`) cuando el lifecycle declarado por el tipo es sospechoso;
- la navegación base de `call super::create` y de literales estables de `TriggerEvent/PostEvent` ya permanecía soportada por `definition` y el query engine compartido cerrado en `B210`, así que B213 se cerró como proyección consistente, no como un motor nuevo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/hierarchyInspection"`
- `npm run test:unit -- --grep "unit/hover"`
- `npm run test:unit -- --grep "unit/diagnostics"`
- `npm run test:unit -- --grep "unit/(hierarchyInspection|hover|diagnostics|definition)"`

## 1.55 B212. DataObject binding model — **Cerrada (bridge PowerScript/.srd + retrieve args 2026-05)**

**Objetivo:** modelar bindings básicos entre PowerScript, DataWindow/DataStore y objetos `.srd` sin abrir un parser DataWindow paralelo ni fingir navegación para bindings dinámicos.

**Resultado registrado:**
- `src/server/analysis/documentAnalysis.ts` publica un stub navegable para `.srd` como `datawindow`, de forma que el objeto exportado entra en `KnowledgeBase` y puede servir como target semántico sin parsear `.srd` como PowerScript;
- `src/server/features/definition.ts` y `src/server/features/hover.ts` reutilizan ese mismo backbone para navegar y explicar `DataObject = "d_xxx"` cuando el binding literal apunta a un `.srd` único ya indexado;
- `src/server/features/signatureHelp.ts` especializa `Retrieve(...)` leyendo los args reales desde `arguments=(...)` y `ARG(...)` del snapshot `.srd` enlazado por `DataObject`, en vez de quedarse en la firma plana del catálogo;
- `src/server/features/diagnostics.ts` distingue binding `DataObject` faltante, ambiguo o dinámico y además avisa cuando `Retrieve(...)` no respeta la aridad declarada por el `.srd`, compartiendo transaction, confidence y degradación honesta en el mismo flujo semántico.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(documentAnalysis|definition)"`
- `npm run test:unit -- --grep "unit/signatureHelp"`
- `npm run test:unit -- --grep "unit/diagnostics"`
- `npm run test:unit -- --grep "unit/(documentAnalysis|definition|hover|diagnostics|signatureHelp)"`

## 1.56 B222. PowerBuilder semantic golden suite — **Cerrada (backbone semántico congelado 2026-05)**

**Objetivo:** fijar con evidencia ejecutable el comportamiento semántico PowerBuilder ya soportado por el backbone compartido para detectar regresiones antes de abrir más superficie.

**Resultado registrado:**
- `test/server/unit/powerbuilderSemanticGolden.test.ts` congela scope resolution, prototypes vs implementations, herencia visible, event handlers, external functions, binding `DataObject` literal, downgrade dinámico y conflictos de `sourceOrigin` sobre fixtures reales del repositorio;
- el hallazgo de la suite destapó y corrigió un bug real en `src/server/knowledge/resolution/InheritanceGraph.ts`: para variables miembro a igual distancia de herencia, la closure ahora desempata con prioridad `Compartida -> Global -> Instancia` en vez de depender solo de la distancia;
- `definition`, `hover`, `signatureHelp`, `diagnostics`, `references` y `rename` quedan cubiertos contra esa misma base semántica sin crear harnesses paralelos ni duplicar resolución.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/powerbuilderSemanticGolden"`
- `npm run test:unit -- --grep "unit/(powerbuilderSemanticGolden|scopeResolution|semanticQueryService|definition|hover|signatureHelp|diagnostics|references|rename|renamePreflight|sourceOrigin)"`

## 1.57 B217. AI context pack for current object — **Cerrada (contexto read-only fiable 2026-05)**

**Objetivo:** servir a IA un paquete read-only del objeto activo con contexto semántico rico y trazable, sin releer todo el workspace ni reconstruir semántica fuera del backbone compartido.

**Resultado registrado:**
- `src/server/features/currentObjectContext.ts` construye ya un context pack del objeto activo a partir de `getDocumentAnalysis()`, `KnowledgeBase`, `hierarchyInspection`, diagnostics reales y bindings `DataObject`, incluyendo metadata, excerpt, `sourceOrigin`, proyecto/librería, ancestor chain, functions/events/prototypes, referenced symbols, diagnostics, evidence/confidence y related files;
- `src/server/server.ts` expone el contrato por `powerbuilder.currentObjectContext`, y `src/client/extension.ts` lo publica vía `getCurrentObjectContext()` dentro de la API pública versionada de la extensión;
- `src/server/features/diagnostics.ts` ahora comparte `buildDiagnosticsForDocument()` para que el context pack reutilice exactamente la misma lógica de diagnostics que el publish real, y `src/server/features/dataWindowBindingModel.ts` exporta un resumen de bindings reutilizable sin abrir otro parser o un flujo paralelo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/currentObjectContext"`
- `npm run test:unit -- --grep "unit/(currentObjectContext|objectInfo|hierarchyInspection|diagnostics|signatureHelp|powerbuilderSemanticGolden)"`
- `npm test -- --grep "smoke/extension"`

## 1.58 B218. Spec impact analyzer — **Cerrada (impacto read-only explícito 2026-05)**

**Objetivo:** calcular impacto probable de una spec o cambio usando el backbone semántico real, para que la IA no planifique ni edite a ciegas.

**Resultado registrado:**
- `src/server/features/impactAnalysis.ts` calcula ya símbolos afectados, referencias seguras, descendientes, overrides, eventos relacionados, DataWindows vinculadas, archivos probables de impacto y build targets conocidos reutilizando `references`, `InheritanceGraph`, `currentObjectContext` y `WorkspaceState` en un único resultado serializable;
- `src/server/server.ts` expone el análisis por `powerbuilder.analyzeImpact`, y `src/client/extension.ts` lo añade a la API pública versionada como `analyzeImpact()` sin abrir todavía ejecución automática;
- el análisis degrada con honestidad cuando no puede resolver un símbolo raíz y mantiene confidence/evidence explícitas cuando la resolución sí existe.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/impactAnalysis"`
- `npm run test:unit -- --grep "unit/(impactAnalysis|currentObjectContext|references|hierarchyInspection|diagnostics|signatureHelp|powerbuilderSemanticGolden)"`

## 1.59 B219. Safe edit plan generator — **Cerrada (plan read-only trazable 2026-05)**

**Objetivo:** generar un plan de edición seguro antes de aplicar cambios, dejando explícitos archivos/objetos, razones, riesgos, tests, docs y bloqueos por ambigüedad.

**Resultado registrado:**
- `src/server/features/safeEditPlan.ts` construye ya un plan read-only a partir del impacto explícito, clasificando archivos por rol/riesgo, agregando tests recomendados, docs a revisar y bloqueos honestos cuando la confidence no alcanza;
- `src/server/server.ts` expone el plan por `powerbuilder.safeEditPlan`, y `src/client/extension.ts` lo añade a la API pública versionada como `generateSafeEditPlan()` sin convertirlo en ejecución automática;
- el plan mantiene trazabilidad suficiente para IA: objetos afectados, razones por archivo, riesgos, confidence y casos bloqueados, pero no toca código ni finge seguridad cuando el análisis es ambiguo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/safeEditPlan"`
- `npm run test:unit -- --grep "unit/(safeEditPlan|impactAnalysis|currentObjectContext|references|hierarchyInspection|diagnostics|signatureHelp|powerbuilderSemanticGolden)"`

## 1.60 B220. AI-readable semantic workspace manifest — **Cerrada (manifiesto compacto/versionado 2026-05)**

**Objetivo:** exportar un manifiesto semántico compacto y versionado para agentes IA sin obligarlos a escanear manualmente todo el workspace.

**Resultado registrado:**
- `src/server/features/semanticWorkspaceManifest.ts` compone ya un manifiesto read-only con `projects`, `libraries`, `objects`, `inheritanceSummary`, `exportedSymbols`, `diagnosticsSummary`, `sourceOriginSummary`, `readiness`, `schemaVersion` y límites explícitos de payload;
- `src/server/server.ts` lo expone por `powerbuilder.semanticWorkspaceManifest`, y `src/client/extension.ts` lo añade a la API pública versionada como `getSemanticWorkspaceManifest()`;
- el resultado reutiliza `WorkspaceState`, `UnifiedProjectModel`, `KnowledgeBase`, `InheritanceGraph` y `diagnostics snapshot` ya publicados, sin exportar código bruto ni abrir un canal paralelo fuera del backbone semántico.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/semanticWorkspaceManifest"`
- `npm run test:unit -- --grep "unit/(semanticWorkspaceManifest|safeEditPlan|impactAnalysis|currentObjectContext|references|hierarchyInspection|diagnostics|signatureHelp|powerbuilderSemanticGolden)"`

## 1.61 B117. DataWindow safe mode mínimo — **Cerrada (safe mode .srd explícito 2026-05)**

**Objetivo:** soporte seguro mínimo de `.srd` con detección, SQL base, argumentos, columnas, bandas principales y hover/navegación básica sin parsear DataWindow como PowerScript completo.

**Resultado registrado:**
- `src/server/features/dataWindowSafeMode.ts` resume ya `retrieve`, `arguments`, columnas y bandas principales de snapshots `.srd` como un contrato read-only pequeño y reutilizable;
- `src/server/features/hover.ts` proyecta ese resumen cuando un `DataObject` literal o type stub resuelve hacia un `.srd`, reforzando el safe mode sin abrir soporte avanzado;
- la navegación básica sigue apoyada en los stubs `.srd` ya publicados por `documentAnalysis`, de modo que definition/hover/signatureHelp/diagnostics continúan sobre el mismo backbone semántico y no sobre un parser paralelo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(dataWindowSafeMode|hover)"`
- `npm run test:unit -- --grep "unit/(dataWindowSafeMode|documentAnalysis|definition|hover|signatureHelp|diagnostics|currentObjectContext|impactAnalysis|safeEditPlan|powerbuilderSemanticGolden)"`

## 1.62 B139. DataWindow safe-mode desde `plugin_old` — **Cerrada (legacy-safe rediseñado 2026-05)**

**Objetivo:** reaprovechar parser/definition/hover seguros del legacy para reforzar el safe mode DataWindow sin abrir soporte avanzado completo.

**Resultado registrado:**
- `src/server/features/dataWindowLegacySafeMode.ts` adapta de forma selectiva el conocimiento útil de `plugin_old` a un analizador puro de `.srd` con bandas, columnas `table(column=...)`, `retrieve` y referencias SQL simples dentro del propio DataWindow;
- `src/server/features/definition.ts` y `src/server/features/hover.ts` incorporan un fast-path local para documentos `.srd`, permitiendo navegación y hover seguros sobre bandas y columnas SQL sin depender de stores globales ni del subsistema legacy completo;
- el refuerzo mantiene el backbone actual: no usa `SymbolIndex`, no introduce async en hot path y no abre todavía expresiones, `DataWindowChild`, propiedades avanzadas ni mutación automática.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(dataWindowLegacySafeMode|definition|hover)"`
- `npm run test:unit -- --grep "unit/(dataWindowLegacySafeMode|dataWindowSafeMode|documentAnalysis|definition|hover|signatureHelp|diagnostics|currentObjectContext|impactAnalysis|safeEditPlan|powerbuilderSemanticGolden)"`

## 1.63 B041. Catálogo y navegación de DataWindow — **Cerrada (entidades de primer nivel 2026-05)**

**Objetivo:** promover DataWindow/DataStore a entidades semánticas de primer nivel con catálogo y navegación básicos integrados.

**Resultado registrado:**
- `src/server/features/documentSymbols.ts` ya expone Document Symbols específicos para `.srd` usando el modelo legacy-safe, incluyendo root DataWindow, bandas, tabla, columnas y `retrieve`;
- `workspaceSymbols` y `queryApiSymbols` ya publican los stubs `.srd` como tipos navegables del workspace, de modo que el catálogo básico DataWindow queda integrado también fuera del archivo activo;
- el resultado no abre soporte avanzado todavía: reutiliza el safe mode `.srd` ya cerrado y mantiene la separación entre catálogo básico y DataWindow avanzado.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(documentSymbols|workspaceSymbols)"`
- `npm run test:unit -- --grep "unit/(documentSymbols|workspaceSymbols|dataWindowLegacySafeMode|dataWindowSafeMode|documentAnalysis|definition|hover|signatureHelp|diagnostics|currentObjectContext|impactAnalysis|safeEditPlan|semanticWorkspaceManifest|powerbuilderSemanticGolden)"`

## 1.64 B161. Golden tests semánticos end-to-end — **Cerrada (suite golden ampliada 2026-05)**

**Objetivo:** fijar contratos visibles de comportamiento semántico para hover, definition, references, rename eligibility y readiness sin depender de interpretación manual del estado del motor.

**Resultado registrado:**
- `test/server/unit/powerbuilderSemanticGolden.test.ts` cubre ahora de forma explícita scope resolution, prototypes/implementation, herencia, event handlers, external functions, `DataObject` literal, `rename eligibility`, `readiness gating`, downgrade dinámico y conflictos de `sourceOrigin` sobre la misma base semántica compartida;
- rename y references siguen validados además por sus suites propias, pero la suite golden ya fija también los contratos mínimos de rename eligibility y readiness que faltaban para cerrar `B161` sin depender solo de tests auxiliares separados;
- el cierre no introduce otro harness: reutiliza `validateRenameTarget()`, `decideFeatureReadiness()` y el backbone semántico ya congelado por `B222`.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/powerbuilderSemanticGolden"`
- `npm run test:unit -- --grep "unit/(powerbuilderSemanticGolden|featureReadiness|renamePreflight|scopeResolution|semanticQueryService|definition|hover|signatureHelp|diagnostics|references|rename|sourceOrigin)"`

## 1.65 B163. Semantic work journal / event log del motor — **Cerrada (runtime journal exportable 2026-05)**

**Objetivo:** exponer un event log técnico del runtime para tuning y debugging sin abrir un subsistema paralelo ni romper el hot path.

**Resultado registrado:**
- `src/server/runtime/runtimeJournal.ts` introduce un ring buffer exportable con eventos tipados, fases, severidad, latencia y payload defensivo;
- `src/server/knowledge/queryTrace.ts`, `src/server/knowledge/ServingCache.ts` y `src/server/server.ts` alimentan el journal desde traces resueltas, hits/misses/evictions/invalidationes del serving cache e invalidaciones documentales reales (`change`, `close`, watcher flush);
- `src/shared/publicApi.ts` y `src/client/statusBarPresentation.ts` publican el snapshot del journal en `showStats` y lo resumen en status/health sin recalcular la observabilidad fuera del runtime.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(runtimeJournal|runtimeHealth|queryTrace|ServingCache|statusBarPresentation)"`
- `npm run test:unit -- --grep "unit/(runtimeJournal|runtimeHealth|queryTrace|ServingCache|statusBarPresentation|publicApi|cachePersistence|servingCachePersistence|servingReadiness|featureReadiness)"`
- `npm test -- --grep "smoke/extension"`

## 1.66 B176. Health checker interno del motor — **Cerrada (health report estructurado 2026-05)**

**Objetivo:** detectar degradación interna del motor antes del bug visible, con findings machine-readable reutilizables por stats y status.

**Resultado registrado:**
- `src/server/runtime/runtimeHealth.ts` construye un reporte estructurado `healthy/warning/error` con findings por capa (`runtime`, `scheduler`, `project-model`, `analysis-cache`, `serving-cache`, `hot-context`, `persistence`, `query`) y contadores por severidad;
- `src/server/server.ts` integra ese reporte en `showStats`, reutilizando el estado real de readiness, scheduler, project model, cachés, persistencia y última query en vez de abrir un checker desconectado del runtime;
- `src/client/statusBarPresentation.ts` proyecta counts, findings y tail del journal en el tooltip/health report, dejando alineadas las surfaces visibles con el contrato público compartido.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(runtimeJournal|runtimeHealth|queryTrace|ServingCache|statusBarPresentation)"`
- `npm run test:unit -- --grep "unit/(runtimeJournal|runtimeHealth|queryTrace|ServingCache|statusBarPresentation|publicApi|cachePersistence|servingCachePersistence|servingReadiness|featureReadiness)"`
- `npm test -- --grep "smoke/extension"`

## 1.67 B224. Watcher topology and sourceOrigin reconciliation — **Cerrada (routing/provenance incremental 2026-05)**

**Objetivo:** refrescar incrementalmente `project model`, routing y `sourceOrigin` cuando cambian markers (`.pbw`, `.pbt`, `.pbsln`, `.pbproj`) o aparecen SR* nuevos en caliente.

**Resultado registrado:**
- `src/server/workspace/watchedFileIntake.ts` trata markers de topología como eventos de primer nivel, reprocesa `roots`/topology, recomputa `sourceOrigin` y refresca `project routing` sin exigir rediscovery completo;
- `src/server/workspace/workspaceState.ts` añade operaciones explícitas para retirar `roots` y entradas de topología ya invalidadas, de modo que delete/change de markers no dejan routing obsoleto;
- `src/server/workspace/watchedFileChangeBridge.ts` y `src/server/server.ts` cierran el puente real LSP -> watcher para que los markers lleguen al intake incremental y no queden filtrados antes del runtime.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(watchedFileChangeBridge|watchedFileIntake|watcherPipeline|workspace)"`

## 1.68 B223. References/rename sin barrido global en hot path — **Cerrada (candidate pool acotado 2026-05)**

**Objetivo:** evitar que `references`, `rename` y CodeLens relean/remasqueen todo el workspace en la ruta interactiva.

**Resultado registrado:**
- `src/server/features/referenceSourcePool.ts` introduce un pool compartido de fuentes con scope `direct/project/multi-project/workspace`, basado en URIs candidatas reales y en el `project routing` vigente;
- `src/server/features/references.ts`, `src/server/features/dynamicStringReferences.ts` y `src/server/server.ts` reutilizan líneas y `maskedText` ya publicados por snapshot cuando están disponibles, evitando split/remask globales por request;
- CodeLens, `references` y `rename` ya consultan ese mismo pool acotado, manteniendo degradación honesta y sin relectura global por defecto en el hot path.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(referenceSourcePool|references|rename|codeLensReferences)"`

## 1.69 B042. Soporte avanzado de DataWindow — **Cerrada (spec 249, modelo puro + relaciones avanzadas 2026-05)**

**Objetivo:** ampliar DataWindow por encima del safe mode, el catálogo básico y el bridge `DataObject/Retrieve` ya cerrados, sin mezclar `.srd` con PowerScript normal.

**Resultado registrado:**
- `src/server/features/dataWindowModel.ts` introduce un modelo DataWindow reutilizable por hover, definition y document symbols, separado de los mappers LSP visibles y centrado en bandas, columnas, `retrieve`, reports y referencias SQL simples;
- `src/server/features/dataWindowLegacySafeMode.ts` reutiliza ese modelo para añadir relaciones avanzadas locales del `.srd`: `report(name=... dataobject=...)`, `column.dddw.name` y publicación de controls/report en el outline del DataWindow;
- `src/server/features/dataWindowPropertyPaths.ts`, junto con `hover` y `definition`, resuelve property paths `Describe/Modify(...DataWindow.Table.Select)` y `Modify(...dddw.name)` sobre bindings `DataObject` literales y child DataWindows deterministas, manteniendo degradación honesta cuando falta binding o la resolución no es única.

**Validación registrada:**
- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/dataWindowLegacySafeMode.test.js out/test/server/unit/documentSymbols.test.js out/test/server/unit/definition.test.js out/test/server/unit/hover.test.js`

## 1.70 B181. PBAutoBuild capability detection — **Cerrada (spec 252, capability detection read-only 2026-05)**

**Objetivo:** detectar `PBAutoBuild250.exe`, su origen y capacidades básicas sin lanzar build ni bloquear Extension Host o LSP.

**Resultado registrado:**
- `src/client/build/pbAutoBuildDetection.ts` introduce un detector puro/cacheado para configuración explícita, `PB_AUTOBUILD_PATH` y candidatos instalados por defecto, con degradación `available/missing/invalid` y capabilities mínimas observables;
- `src/client/extension.ts`, `src/client/statusBarPresentation.ts` y `package.json` proyectan ese snapshot en status/health del cliente, reutilizando surfaces read-only ya existentes y sin abrir runner, parser de logs ni ejecución moderna;
- `test/server/unit/pbAutoBuildDetection.test.ts` y `test/server/unit/statusBarPresentation.test.ts` fijan el contrato visible de detección y la proyección en reports/tooltip.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildDetection.test.js out/test/server/unit/statusBarPresentation.test.js`

## 1.71 B227. Formatter server-side y presupuesto de formato — **Cerrada (spec 253, formatter delegado al LSP 2026-05)**

**Objetivo:** sacar el cálculo del formatter del Extension Host y fijar budgets explícitos para documentos grandes sin perder provider manual ni `formatOnSave`.

**Resultado registrado:**
- `src/server/features/formatDocument.ts` y `src/shared/formatting/formatDocumentProtocol.ts` introducen un contrato server-side para formatear o degradar por presupuesto de caracteres/líneas, reutilizando el motor puro ya existente;
- `src/client/formatting/registerFormatting.ts`, `src/client/extension.ts` y `src/server/server.ts` mueven el trabajo pesado al comando `powerbuilder.formatDocument`, manteniendo el cliente como wiring/configuración y avisando cuando el documento se omite por budget;
- `package.json` publica settings explícitas `vscPowerSyntax.formatting.maxDocumentChars` y `vscPowerSyntax.formatting.maxDocumentLines` para hacer observable el límite operativo.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/formatDocument.test.js out/test/server/unit/powerBuilderFormatter.test.js`
- `npm test -- --grep "smoke/formatting-extension"`

## 1.72 B228. Modelo interno sin DTOs LSP en knowledge/parsing — **Cerrada (spec 254, mappers de borde 2026-05)**

**Objetivo:** retirar `DocumentSymbol` y DTOs LSP equivalentes de `knowledge/parsing/utils`, dejando tipos internos en el core y mappers de borde para la salida visible.

**Resultado registrado:**
- `src/server/model/types.ts`, `src/server/utils/helpers.ts`, `src/server/parsing/sections.ts`, `src/server/knowledge/types.ts` y `src/server/knowledge/stringInterning.ts` pasan a usar tipos internos para posiciones/rangos/símbolos documentales en lugar de DTOs LSP;
- `src/server/features/documentSymbols.ts` se convierte en el borde responsable de mapear el árbol interno hacia `DocumentSymbol`, manteniendo verde la salida visible y dejando `.srd` legacy-safe como feature LSP legítima;
- `test/server/unit/architectureImports.test.ts` fija el guardrail para impedir reintroducciones de `vscode-languageserver` en `knowledge/parsing/utils`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/documentSymbols.test.js out/test/server/unit/architectureImports.test.js`

## 1.73 B070. Memory budgets de caché e índice — **Cerrada (spec 255, budgets visibles por capa 2026-05)**

**Objetivo:** definir, medir y vigilar budgets explícitos de memoria para cachés e índice sin introducir profiling invasivo.

**Resultado registrado:**
- `src/server/runtime/memoryBudgets.ts` introduce un reporte unificado de estimates y budgets por capa (`analysis`, `serving`, `documents`, `hot-context`, `code-lens`, `knowledge`) con estado agregado y métricas de proceso;
- `src/server/server.ts`, `src/server/runtime/runtimeHealth.ts`, `src/shared/publicApi.ts` y `src/client/statusBarPresentation.ts` proyectan ese reporte en `showStats`, health checker y status/tooltip visibles del cliente;
- `test/server/unit/memoryBudgets.test.ts`, junto con `runtimeHealth.test.ts` y `statusBarPresentation.test.ts`, fija el cálculo y la vigilancia visible de esos budgets.

**Validación registrada:**
- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/memoryBudgets.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/statusBarPresentation.test.js`

## 1.74 B162. Reconciliación parser / symbol model / salida LSP — **Cerrada (spec 256, reason codes antes de publicar outline 2026-05)**

**Objetivo:** detectar incoherencias internas entre parser, snapshot semántico y salida LSP antes de publicar el outline del documento.

**Resultado registrado:**
- `src/server/features/documentSymbols.ts` produce ahora un reporte explícito de reconciliación con reason codes (`type-block-missing-fact`, `callable-fact-missing-scope`, `callable-fact-orphan-container`, etc.) comparando `sections/typeBlocks`, facts/scopes y el árbol LSP a publicar;
- `src/server/server.ts` registra ese reporte en consola y `runtimeJournal` cuando detecta drift, de modo que la inconsistencia queda observada antes de devolver `DocumentSymbol[]` al editor;
- `test/server/unit/documentSymbolsReconciliation.test.ts`, junto con `documentSymbols.test.ts`, fija tanto snapshots sanos como snapshots inconsistentes y valida que la salida visible siga estable.

**Validación registrada:**
- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/documentSymbols.test.js out/test/server/unit/documentSymbolsReconciliation.test.js`

## 1.75 B182. PBAutoBuild build-file discovery and validation — **Cerrada (spec 257, discovery read-only 2026-05)**

**Objetivo:** descubrir build files JSON de PBAutoBuild, vincularlos a la topología real del workspace y clasificar su usabilidad sin ejecutar compilaciones.

**Resultado registrado:**
- `src/server/workspace/pbAutoBuildBuildFiles.ts`, junto con `discovery.ts` y `workspaceState.ts`, introduce un contrato read-only para candidatos JSON de PBAutoBuild, reason codes explícitos y clasificación `usable/invalid/ambiguous` contra `.pbw/.pbt/.pbproj/.pbsln` ya descubiertos;
- `src/server/workspace/watchedFileIntake.ts`, `watchedFileChangeBridge.ts` y `src/client/extension.ts` incorporan refresh incremental de build files JSON sin mezclar esos eventos con invalidaciones semánticas masivas ni con el hot path interactivo;
- `src/server/server.ts` y `src/shared/publicApi.ts` publican un resumen mínimo de build files en `showStats`, mientras `test/server/unit/pbAutoBuildBuildFiles.test.ts`, `workspace.test.ts` y `watchedFileIntake.test.ts` fijan parser, discovery, snapshot y watcher incremental.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildBuildFiles.test.js out/test/server/unit/workspace.test.js out/test/server/unit/watchedFileIntake.test.js`

## 1.76 B229. sourceOrigin contextual en análisis documental — **Cerrada (spec 258, contextual provenance 2026-05)**

**Objetivo:** alinear el provenance documental con `WorkspaceState`/routing para que análisis interactivo, indexador y watcher compartan el mismo `sourceOrigin` contextual y no dependan solo de la URI.

**Resultado registrado:**
- `src/server/analysis/documentAnalysis.ts` acepta ya `sourceOrigin` contextual explícito, de modo que lineage y snapshots no quedan fijados únicamente por `inferSourceOrigin(document.uri)`;
- `src/server/analysis/analysisCache.ts` incorpora un resolver contextual y reanaliza cuando cambia el provenance aunque versión y fingerprint del documento se mantengan;
- `src/server/indexer/workspaceIndexer.ts`, `src/server/workspace/watchedFileIntake.ts` y `src/server/server.ts` propagan `sourceOrigin` desde `WorkspaceState`, usan `inferSourceOrigin()` solo como fallback real y rematerializan snapshots cuando un cambio topológico altera el provenance sin tocar el archivo;
- `test/server/unit/documentAnalysis.test.ts`, `analysisCache.test.ts` y `watchedFileIntake.test.ts`, junto con la validación de `sourceOrigin`, workspace, manifest y golden semántico, fijan el nuevo contrato contextual.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/sourceOrigin.test.js out/test/server/unit/documentAnalysis.test.js out/test/server/unit/analysisCache.test.js out/test/server/unit/watchedFileIntake.test.js out/test/server/unit/workspace.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js`

## 1.77 B226. Corpus enterprise OrderEntry como baseline operativo — **Cerrada (spec 251, enterprise baseline 2026-05)**

**Objetivo:** convertir `fixtures-local/STD_FC_OrderEntry` en un baseline enterprise reproducible para discovery, indexación y regresión semántica proporcional sin mezclar corpus privado con el código del producto.

**Resultado registrado:**
- `src/shared/powerbuilderFiles.ts` deja de tratar `.srj` de deployment como fuente semántica del pipeline de workspace, manteniendo `.pblmeta` y recursos fuera del inventario fuente;
- `test/server/performance/orderentry.smoke.test.ts` mantiene la cobertura de solution-mode parcial, `_BackupFiles` y variantes multiidioma reales del corpus;
- `test/server/performance/orderentry.semantic.test.ts` añade smoke semántica reproducible sobre `nc_ac_orderentry`, `vc_oes_toolbar_e`, `wn_dotnet_datastore_e` y `ap_image_build`, fijando `sourceOrigin` de carpetas `.pbl`, topología parcial y exclusión explícita de `.srj`, `.pblmeta` y recursos HTML;
- `test/corpora/README.md`, `docs/testing.md`, `docs/performance-budget.md` y `test/results/003-real-corpora-baseline.md` reflejan ya que OrderEntry deja de ser solo baseline parcial y pasa a baseline operativo local de discovery/indexación + smoke semántica.

**Validación registrada:**
- `npm run build:test ; npx mocha --ui tdd out/test/server/performance/orderentry.smoke.test.js out/test/server/performance/orderentry.semantic.test.js`
- `npm run test:performance -- --grep "OrderEntry"`

## 1.78 B225. Cobertura completa de ancestros nativos PowerBuilder — **Cerrada (spec 250, native runtime ancestors 2026-05)**

**Objetivo:** cerrar falsos positivos y degradaciones read-only cuando la herencia llega a tipos nativos del runtime PowerBuilder servidos por `system catalog`.

**Resultado registrado:**
- `src/server/knowledge/system/nativeAncestors.ts` introduce una fuente compartida de tipos/raíces runtime y de prolongación de cadena nativa sin listas duplicadas por feature;
- `src/server/knowledge/system/SystemCatalog.ts` reconoce ahora también raíces runtime representativas como `powerobject`, `throwable` y `runtimeerror`, además de los owner types ya indexados;
- `src/server/knowledge/resolution/InheritanceGraph.ts` completa la cadena cuando la KB termina en `window` u otros tipos nativos conocidos, de forma que hierarchy/current object context/impact analysis no se cortan antes del borde del runtime;
- `test/server/unit/systemCatalog.test.ts`, `inheritanceGraph.test.ts`, `hierarchyInspection.test.ts`, `currentObjectContext.test.ts`, `diagnostics.test.ts` e `impactAnalysis.test.ts` fijan la nueva proyección estable entre sistema, framework y aplicación.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/systemCatalog.test.js out/test/server/unit/inheritanceGraph.test.js out/test/server/unit/hierarchyInspection.test.js out/test/server/unit/currentObjectContext.test.js out/test/server/unit/diagnostics.test.js`
- `npx mocha --ui tdd out/test/server/unit/impactAnalysis.test.js`

## 1.79 B183. PBAutoBuild command runner out-of-process — **Cerrada (spec 259, modern build runner 2026-05)**

**Objetivo:** ejecutar PBAutoBuild desde VS Code sin bloquear Extension Host ni LSP, dejando el build observable, cancelable y seguro.

**Resultado registrado:**
- `src/server/build/pbAutoBuildRunner.ts` introduce un runner server-side dedicado con selección segura del build file utilizable, proceso hijo out-of-process, timeout y cancelación sin mezclar build moderno con el scheduler general;
- `src/server/server.ts` expone `powerbuilder.runPbAutoBuild` y `powerbuilder.cancelPbAutoBuild`, añade el snapshot del runner a `showStats` y registra eventos del build en `runtimeJournal`;
- `src/client/extension.ts`, `src/client/statusBarPresentation.ts` y `package.json` sustituyen la acción genérica de build por comandos run/cancel reales y proyectan el estado mínimo del runner en status/tooltip/reportes;
- `src/shared/pbAutoBuildProtocol.ts` fija el contrato serializable del runner para cliente/servidor y evita duplicar shape del estado.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild"`

## 1.80 B184. PBAutoBuild log parser and Problems Panel integration — **Cerrada (spec 260, build problems 2026-05)**

**Objetivo:** convertir la salida relevante del build moderno en problemas navegables sin inventar ubicaciones ni sobrescribir los diagnósticos semánticos del LSP.

**Resultado registrado:**
- `src/server/build/pbAutoBuildLogParser.ts` introduce un parser puro para la salida relevante de PBAutoBuild y un resumen estructurado de errores/warnings/fatals;
- `src/server/build/pbAutoBuildProblems.ts` resuelve issues a entidades tipo del workspace solo cuando el objeto del log mapea de forma única y segura;
- `src/server/server.ts`, `src/shared/pbAutoBuildProtocol.ts` y `src/client/extension.ts` transportan los problemas de build y los publican en una colección separada (`vscPowerSyntax-build`), evitando pisar el canal semántico principal;
- los problemas previos se reemplazan por resultado de build y la salida no resoluble permanece en el canal/journal sin convertirse en diagnóstico falso.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildLogParser.test.js out/test/server/unit/pbAutoBuildProblems.test.js out/test/server/unit/pbAutoBuildRunner.test.js`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild"`

## 1.81 B187. Unified build health model — **Cerrada (spec 261, build health 2026-05)**

**Objetivo:** consolidar el estado del build moderno en una lectura única y reutilizable para status, menú y health report sin duplicar reglas entre superficies del cliente.

**Resultado registrado:**
- `src/client/build/pbAutoBuildHealth.ts` introduce el snapshot puro `ready/running/attention/blocked` a partir de capability detection, build files, runner y problemas recientes;
- `src/client/statusBarPresentation.ts` y `src/client/extension.ts` reutilizan ese snapshot en tooltip, stats, health report, menú y API pública enriquecida del cliente;
- la UX visible del build moderno ya consume una sola fuente de verdad sin recalcular disponibilidad o degradación en cada superficie.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildHealth.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild"`

## 1.82 B185. PBAutoBuild build profiles, commands and status UX — **Cerrada (spec 262, build UX 2026-05)**

**Objetivo:** permitir builds frecuentes del carril moderno sin recordar rutas ni comandos manuales y sin duplicar la lógica ya cerrada de runner/parser/health.

**Resultado registrado:**
- `src/server/server.ts` expone al cliente la lista de build files PBAutoBuild utilizables;
- `src/client/extension.ts` añade comandos para repetir el último build, elegir un build file utilizable y recordar el último perfil por workspace;
- `src/client/statusBarPresentation.ts`, `package.json` y `test/smoke/extension.test.ts` proyectan el perfil recordado y los nuevos accesos rápidos en menú, tooltip y reportes visibles.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild"`

## 1.83 B043. Integración con PBAutoBuild — **Cerrada (épica moderna 2026-05)**

**Objetivo:** cerrar la épica contenedora del carril moderno oficial de build tras completar capability detection, discovery, runner, parser, health y UX frecuente.

**Resultado registrado:**
- `B181-B187` quedan cerradas y dejan un carril moderno de PBAutoBuild observable, no bloqueante y usable desde VS Code;
- la deuda restante se desplaza a `B186` como export reproducible de CI/CD, ya fuera del cierre técnico de la épica base `B043`.

## 1.84 B186. PBAutoBuild CI/CD helper export — **Cerrada (spec 263, helper export 2026-05)**

**Objetivo:** exportar una ayuda reproducible y versionable para llevar el build moderno de PBAutoBuild a CI/CD sin acoplarla a un proveedor concreto.

**Resultado registrado:**
- `src/client/build/pbAutoBuildCiHelper.ts` introduce un builder puro que genera `manifest.json`, README y scripts neutrales PowerShell/CMD/Bash a partir del build file/perfil utilizable ya cerrado;
- `src/client/extension.ts` y `package.json` anaden el comando `vscPowerSyntax.exportPbAutoBuildCiHelper`, reutilizan el perfil recordado o uno utilizable del catalogo y escriben el bundle bajo `tools/pbautobuild-ci/<perfil>`;
- el helper evita embeder el path local detectado como dependencia obligatoria y deja la resolucion del ejecutable al runner CI mediante `PB_AUTOBUILD_PATH`, manteniendo la exportacion agnostica del proveedor.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildCiHelper.test.js`
- `npm run test:smoke -- --grep "PBAutoBuild"`

## 1.85 B230. KnowledgeBase copy-on-write e índices de consulta acotada — **Cerrada (spec 264, KB incremental 2026-05)**

**Objetivo:** reducir el coste de `upsert/remove` en `KnowledgeBase` evitando el clon amplio del estado publicado y reforzar las consultas acotadas para que las rutas interactivas no materialicen mas base de la necesaria.

**Resultado registrado:**
- `src/server/knowledge/KnowledgeBase.ts` pasa a publicar drafts con copy-on-write por bucket: clona superficialmente los mapas base y solo duplica arrays/sets tocados para ids, kinds y dependencias inversas, manteniendo atomicidad defensiva;
- `queryEntities/countEntities` reutilizan ahora un indice por `EntityKind` y un total precalculado para evitar recorridos completos cuando el consumer ya conoce `kinds` o solo necesita un conteo acotado;
- `src/server/features/semanticWorkspaceManifest.ts` consume esos conteos acotados y la nueva prueba `test/server/performance/knowledgeBase.perf.test.ts` fija el presupuesto incremental con miles de documentos sinteticos.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/knowledgeBase.test.js out/test/server/performance/knowledgeBase.perf.test.js`
- `npm run test:performance -- --grep "knowledgeBase"`

## 1.86 B231. Guards LSP para markers y PBL binario — **Cerrada (spec 265, lsp boundary guards 2026-05)**

**Objetivo:** reforzar el borde cliente/servidor para que markers `.pbw/.pbt/.pbproj/.pbsln` y `.pbl` binarios sigan alimentando discovery/topologia pero no entren en providers semanticos PowerScript.

**Resultado registrado:**
- `src/shared/powerbuilderFiles.ts` define ahora `isPowerBuilderSemanticUri()` como contrato compartido de URIs servibles por el LSP, separando fuentes/consultas semanticas de markers topologicos y `.pbl` binarios;
- `src/server/server.ts` aplica un guard central sobre diagnostics, documentSymbols, hover, definition, references, completion, semantic tokens, code actions, code lens y rename para devolver degradacion vacia en documentos no servibles aunque el cliente reciba un override de lenguaje;
- `test/server/unit/powerbuilderFiles.test.ts` fija la clasificacion y `test/smoke/lsp-guards.extension.test.ts` fuerza un lenguaje servido sobre `.pbw/.pbt/.pbproj/.pbsln/.pbl` para verificar que no aparecen `Document Symbols` ni diagnostics, mientras `sample.sru` sigue respondiendo.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/powerbuilderFiles.test.js`
- `npm run test:smoke -- --grep "lsp-guards"`

## 1.87 B175. Repro packs automáticos para bugs semánticos — **Cerrada (spec 266, semantic repro pack 2026-05)**

**Objetivo:** generar un bundle reproducible para bugs semánticos complejos sin reconstruir manualmente el contexto del runtime, reutilizando las surfaces read-only ya cerradas.

**Resultado registrado:**
- `src/client/repro/semanticReproPack.ts` introduce un builder puro del bundle con `manifest.json`, README, snapshots JSON (`currentObjectContext`, `impactAnalysis`, `safeEditPlan`, `semanticWorkspaceManifest`, `serverStats`, diagnostics del editor) y copias de archivos relevantes;
- `src/client/extension.ts` y `package.json` añaden el comando `vscPowerSyntax.exportSemanticReproPack`, lo exponen en el menú de estado y exportan el pack bajo `tools/semantic-repros/<slug>-<timestamp>` o en un destino override para tests;
- `test/server/unit/semanticReproPack.test.ts` fija el builder puro y `test/smoke/semantic-repro-pack.extension.test.ts` valida la exportación real desde `sample.sru` sin introducir un motor semántico paralelo ni ensuciar el repo en la smoke.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticReproPack.test.js`
- `npm run test:smoke -- --grep "semantic-repro-pack"`

## 1.88 B232. IDs diagnósticos implementados vs catálogo gobernado — **Cerrada (spec 267, diagnostic id contract 2026-05)**

**Objetivo:** fijar una política estable para los IDs diagnósticos visibles, evitando una mezcla implícita entre catálogo `PB-*`, IDs históricos `SD*`/`dataobject-*` y consumers que parseaban `source`.

**Resultado registrado:**
- `src/shared/diagnosticCodes.ts` introduce la lista única de IDs emitidos hoy y helpers para leer `diagnostic.code` con fallback al sufijo legacy en `source`;
- `src/server/features/diagnostics.ts`, `diagnosticsExtra.ts` y `obsoleteDetector.ts` emiten `diagnostic.code` estable para reglas `SD2-SD13`, `SD7`, familias `dataobject-*`, `retrieve-arity-mismatch`, `transaction-binding-*`, `native-dependency` y warnings lifecycle (`missing-super-*`, `missing-trigger-*`, `unresolved-*`);
- `src/server/features/codeActions.ts` y los tests focales dejan de depender del parseo directo de `source` como contrato primario y consumen `diagnostic.code` con compatibilidad hacia atrás;
- `docs/rules-catalog.md` deja explícito que el contrato emitido actual se gobierna por `diagnostic.code` y que `PB-*` sigue siendo taxonomía documental/objetivo, no ID runtime emitido.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/diagnostics.test.js out/test/server/unit/diagnosticsExtra.test.js out/test/server/unit/codeActions.test.js out/test/server/unit/obsolete.test.js out/test/server/unit/obsoleteDetectorSanity.test.js`

## 1.89 B233. Higiene histórica de specs tempranas — **Cerrada (spec 268, early spec hygiene 2026-05)**

**Objetivo:** dejar de mezclar specs activas con carpetas históricas incompletas (`003-009`, `012`) que podían parecer trabajo vivo solo por faltarles `spec.md`, `plan.md` o `tasks.md` mínimos.

**Resultado registrado:**
- las specs tempranas incompletas `003`, `004`, `005`, `006`, `007`, `008`, `009` y `012` quedan normalizadas con `spec.md/plan.md/tasks.md` mínimos y estado histórico explícito;
- `specs/006-hover-catalog` y `specs/007-hierarchical-symbols` ya no dependen solo de `tasks.md`, y `specs/012-semantic-tokens` ya no queda como carpeta con una sola pieza;
- `docs/spec-driven-development.md` documenta explícitamente cómo normalizar specs retroactivas sin reabrir una feature cerrada por ausencia de plantilla antigua;
- el foco canónico deja de estar en higiene documental y se mueve a `B216`.

**Validación registrada:**
- auditoría local del inventario `specs/001-020` comprobando que las carpetas tempranas ya no carecen de `spec.md`, `plan.md` o `tasks.md`.

## 1.90 B216. Project Health Dashboard — **Cerrada (spec 269, project health dashboard 2026-05)**

**Objetivo:** mostrar la salud del workspace/proyecto en una vista read-only única consumiendo `health report`, status bar, manifest semántico y snapshot de build ya cerrados, sin abrir un segundo motor de health.

**Resultado registrado:**
- `src/client/projectHealthDashboard.ts` compone un dashboard markdown read-only sobre `powerbuilder.showStats`, `semanticWorkspaceManifest`, reports existentes de status/health y degradación honesta de ORCA legacy;
- `src/client/extension.ts` y `package.json` añaden el comando `vscPowerSyntax.openProjectHealthDashboard`, lo registran en el menú de estado y abren el dashboard en un editor markdown lateral;
- `src/client/statusBarPresentation.ts` enlaza el dashboard desde el tooltip de la status bar, manteniendo la UX de mantenimiento sobre el mismo backbone read-only;
- `test/server/unit/projectHealthDashboard.test.ts` y la smoke focal en `test/smoke/extension.test.ts` validan el contenido del dashboard y la ejecución real del comando visible.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/projectHealthDashboard.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:smoke -- --grep "dashboard de salud del proyecto"`

## 1.91 B214. PowerBuilder Object Explorer — **Cerrada (spec 270, powerbuilder object explorer 2026-05)**

**Objetivo:** ofrecer una vista navegable del modelo PowerBuilder del workspace consumiendo `semanticWorkspaceManifest` y `project model` ya cerrados, sin motor semántico paralelo ni RPCs por nodo.

**Resultado registrado:**
- `src/shared/publicApi.ts` y `src/server/features/semanticWorkspaceManifest.ts` enriquecen el manifest read-only con `projectUri`, `library`, `objectKind` y `readiness` por objeto para sostener la vista sin endpoints nuevos;
- `src/client/objectExplorerModel.ts` construye un árbol puro proyecto -> librería -> kind -> objeto, con foco `workspace/current-project/current-file`, métricas de readiness agregadas y tooltips con `sourceOrigin`;
- `src/client/objectExplorer.ts`, `src/client/extension.ts` y `package.json` registran la vista `powerbuilderObjectExplorer`, sus comandos de foco/refresco y la acción segura de abrir objeto desde el árbol;
- `test/server/unit/objectExplorerModel.test.ts`, `test/server/unit/semanticWorkspaceManifest.test.ts` y la smoke focal en `test/smoke/extension.test.ts` validan el modelo, el contrato read-only y el foco sobre el archivo activo.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/semanticWorkspaceManifest.test.js`
- `npm run test:smoke -- --grep "Object Explorer en el archivo activo"`

## 1.92 B215. Current Object Context Panel — **Cerrada (spec 271, current object context panel 2026-05)**

**Objetivo:** proyectar el contexto semántico del objeto activo en una vista persistente read-only, reutilizando `currentObjectContext` y surfaces públicas ya cerradas sin reconstrucción local.

**Resultado registrado:**
- `src/shared/publicApi.ts` y `src/server/features/currentObjectContext.ts` amplían el contrato con `visibleVariables`, combinando scope activo + member closure para exponer locals/args y miembros heredados sobre el mismo backbone read-only;
- `src/client/currentObjectContextPanelModel.ts` y `src/client/currentObjectContextPanel.ts` construyen y sirven el panel `powerbuilderCurrentObjectContext`, siguiendo el editor activo y agrupando resumen, ancestros, variables visibles, members, diagnostics, bindings `DataObject`, references, related files y evidence;
- `src/client/extension.ts` y `package.json` registran la vista, sus comandos de refresco/foco y la apertura segura de ubicaciones desde el panel;
- `test/server/unit/currentObjectContext.test.ts`, `test/server/unit/currentObjectContextPanelModel.test.ts` y la smoke focal en `test/smoke/extension.test.ts` validan el contrato ampliado, el builder puro y la UX visible sobre archivo activo.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/currentObjectContextPanelModel.test.js`
- `npm run test:smoke -- --grep "Current Object Context del archivo activo"`

## 1.97 B192. ORCA staging provenance and source priority — **Cerrada (spec 276, provenance/source priority 2026-05)**

**Objetivo:** fijar de forma efectiva la prioridad entre source real y `orca-staging` para que serving, query y manifest no dependan del orden de ingestión y expliquen con honestidad de dónde viene cada símbolo.

**Resultado registrado:**
- `src/server/knowledge/KnowledgeBase.ts` ordena buckets globales y por kind según la prioridad explícita de `sourceOrigin`, de modo que `findDefinition` y `findAllDefinitions` ya no dependen del orden en que entró primero el staging o el source real;
- `src/server/knowledge/resolution/semanticQueryService.ts` desempata candidatos equivalentes y el `global-fallback` usando esa misma prioridad de provenance antes de fijar winner/confidence, evitando ambigüedades artificiales entre source real y `orca-staging`;
- `test/server/unit/knowledgeBase.test.ts`, `semanticQueryService.test.ts`, `semanticWorkspaceManifest.test.ts` y `definition.test.ts` fijan el contrato `source real > orca-staging` en KB, query engine, manifest y Definition read-only.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/knowledgeBase.test.js out/test/server/unit/semanticQueryService.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/definition.test.js --grep "prioriza source real|prefiere source real frente a orca-staging"`

## 1.135 B281. Override and overload resolution hardening — **Cerrada (spec 347, override/overload hardening 2026-05)**

**Objetivo:** reforzar la resolución entre overloads, overrides, prototypes e implementations reutilizando identidad canónica B279 y ambigüedad v2 B280.

**Resultado registrado:**
- `src/server/knowledge/callSignature.ts` centraliza claves de firma callable, normalización de parámetros y conteo de aridad;
- `src/server/analysis/documentAnalysis.ts` conserva overloads por firma normalizada y sustituye solo el prototype por la implementation de la misma firma;
- `src/server/utils/invocationContext.ts` y `src/server/features/signatureHelp.ts` propagan aridad y tipos literales simples al query engine compartido;
- `src/server/knowledge/resolution/semanticQueryService.ts` filtra candidatos por firma antes de rankear por distancia de herencia y emite evidence `discarded-signature` para `arity-mismatch`, `type-mismatch` y `prototype-shadowed`;
- `src/server/knowledge/resolution/InheritanceGraph.ts` y `src/server/features/impactAnalysis.ts` dejan de tratar firmas distintas como overrides equivalentes.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/documentAnalysis.test.js out/test/server/unit/semanticQueryService.test.js out/test/server/unit/definition.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/impactAnalysis.test.js` → `65 passing`

## 1.136 B282. Dynamic invocation risk model v2 — **Cerrada (spec 348, invocation risk 2026-05)**

**Objetivo:** unificar el riesgo de llamadas dinámicas, strings, external calls, DataWindow expressions, WebView/HTTP patterns y `sourceOrigin` no canónico sin abrir un segundo motor semántico.

**Resultado registrado:**
- `src/server/features/invocationRiskModel.ts` centraliza la composición de `safe|inherited|fallback|dynamic|external` usando query risk, `sourceOrigin`, strings dinámicos, bindings DataWindow y targets externos;
- `src/shared/publicApi.ts` expone `ApiInvocationRisk` y metadata de riesgo en `impactAnalysis`, `safeEditPlan` y `dependencyGraph`;
- `impactAnalysis` y `safeEditPlan` publican `invocationRisk`, `riskReasons` y bloqueos explícitos para riesgo `dynamic`, `fallback` o `external`;
- `references`, `rename` y `codeActions` degradan o bloquean resultados cuando aparece riesgo dinámico o fallback antes de producir edits;
- `dynamicStringReferences` cubre patrones de eventos, DataWindow, WebView y HTTP request strings.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/dynamicStringReferences.test.js out/test/server/unit/references.test.js out/test/server/unit/rename.test.js out/test/server/unit/codeActions.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/dependencyGraph.test.js`

## 1.137 B287. DataWindow model canonicalization v2 — **Cerrada (spec 349, canonical backbone 2026-05)**

**Objetivo:** consolidar un modelo canónico único de DataWindow consumido por las surfaces existentes sin reparsear snapshots `.srd` por feature.

**Resultado registrado:**
- `src/server/features/dataWindowModel.ts` pasa a ser el backbone único para `.srd`, concentrando `retrieve`, `retrieveArguments`, bandas, columnas `table`, `report(...)` y referencias SQL simples, además de soportar comillas escapadas `~"` y tipos con paréntesis balanceados como `char(40)` o `decimal(18,2)`;
- `src/server/features/dataWindowSafeMode.ts` deja de extraer `retrieve`/columnas/bandas por su cuenta y proyecta el resumen read-only desde `buildDataWindowModelFromSnapshot()`;
- `src/server/features/dataWindowBindingModel.ts` deja de reparsear `arguments=(...)` / `ARG(...)` desde texto raw y reutiliza `retrieveArguments` del modelo canónico para bindings `DataObject`, `signatureHelp`, diagnostics, context packs y métricas enlazadas;
- las surfaces ya apoyadas en `DataWindowModel` (`definition`, `documentSymbols`, property paths, hover local `.srd`, SQL lineage y golden cross-surface`) quedan alineadas sobre el mismo backbone sin abrir un segundo parser DataWindow.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/architectureImports.test.js out/test/server/unit/dataWindowModel.test.js out/test/server/unit/dataWindowLegacySafeMode.test.js out/test/server/unit/dataWindowSafeMode.test.js out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/documentSymbols.test.js out/test/server/unit/definition.test.js out/test/server/unit/completion.test.js out/test/server/unit/hover.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/currentObjectContext.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/crossSurfaceGoldenMatrix.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js`
- `npm test`

## 1.138 B288. DataWindow SQL parser safe subset v2 — **Cerrada (spec 350, safe SQL subset 2026-05)**

**Objetivo:** mejorar el parsing seguro del SQL `retrieve` DataWindow sin abrir un motor SQL completo ni duplicar parsing fuera de `dataWindowModel`.

**Resultado registrado:**
- `src/server/features/dataWindowModel.ts` amplía `sqlReferences` para cubrir `select` con aliases, `JOIN ... ON` simples y `WHERE` básico, resolviendo aliases de tabla hacia nombres reales cuando la evidencia es defendible;
- el mismo parser degrada de forma honesta ante cláusulas complejas con subquery (`select`/`exists`/`case`/`union`) y evita inventar referencias SQL inseguras fuera del subset soportado;
- `dataWindowSqlLineage` reutiliza automáticamente esas referencias más ricas sin cambios de surface, y `provideDataWindowLegacyDefinition()` hereda la navegación segura desde referencias SQL aliased hacia `column=(...)` del `.srd`;
- el subset sigue siendo read-only, no abre una engine SQL general y conserva `retrieveArguments`/bindings sobre el backbone canónico cerrado en `B287`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/architectureImports.test.js out/test/server/unit/dataWindowModel.test.js out/test/server/unit/dataWindowLegacySafeMode.test.js out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/crossSurfaceGoldenMatrix.test.js`
- `npm test`

## 1.139 B289. DataWindow expression safe evaluator metadata — **Cerrada (spec 351, safe expression metadata 2026-05)**

**Objetivo:** modelar metadata segura de expresiones DataWindow y dependencias de columnas/controles dentro de `.srd` sin evaluar valores runtime ni abrir un parser paralelo fuera de `dataWindowModel`.

**Resultado registrado:**
- `src/server/features/dataWindowModel.ts` amplía el backbone canónico con controles nombrados y nodos de expresión extraídos desde `expression=` y atributos quoted con `~t...`, clasificando dependencias como `table-column`, `control` o `unresolved` únicamente desde la evidencia del mismo `.srd`;
- `src/server/features/completion.ts` abre completion conservadora dentro de expresiones `.srd` reutilizando ese mismo modelo, incluso en contexto string DataWindow reconocible, sin caer en completion global ni fingir semántica fuera del rango de la expresión;
- `src/server/features/diagnostics.ts` emite `datawindow-expression-dependency-unresolved` cuando una expresión referencia una dependencia que no resuelve como columna `table` o control nombrado del DataWindow actual;
- `docs/architecture.md`, `docs/rules-catalog.md`, backlog y current-focus dejan trazado que `B289` queda cerrada y que el siguiente foco canónico pasa a `B290`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/dataWindowModel.test.js out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js`

## 1.163 B361. Official enumerated datatype extractor and coverage rail — **Cerrada (spec 375, official enum rail 2026-05)**

## 1.164 B362. PowerBuilder enumerated datatypes and values catalog completion — **Cerrada (spec 376, enum catalog completion 2026-05)**

**Objetivo:** completar la integración consumible del catálogo de tipos y valores enumerados reutilizando el rail oficial de `B361`, cerrando gaps curados mínimos y dejando metadata útil y límites honestos para tipos oficiales sin miembros nominales.

**Resultado registrado:**
- `script/generate_official_function_catalog.cjs` conserva ya `documentation` y `allowedOnOwners` en property variants oficiales con título local `For ...`, de modo que `SecureProtocol` queda explicado con evidencia oficial sin inventar `enumValues` con `!` cuando Appeon solo publica códigos enteros;
- `src/server/knowledge/system/manual/language/enumerations/index.ts` completa la documentación de los tipos manual-core de UI/archivo (`Border`, `Alignment`, `FillPattern`, `WindowType`, `WindowState`, `FileAccess`, `FileMode`, `Encoding`) y publica `SeekType` como gap manual-curated con `FromBeginning!`, `FromCurrent!` y `FromEnd!`, respaldado por uso real de `FileSeek(...)` en corpus legacy y por la conversión explícita de `seektype` en PFC;
- `test/server/unit/catalogV2.test.ts` fija que `SecureProtocol` conserva explicación oficial sin valores nominales fabricados, que los tipos manual-core no quedan sin `documentation`, que `FillPattern` mantiene el merge con valores generated y que `SeekType` resuelve sus tres valores canónicos;
- la comprobación runtime sobre `SystemCatalog` compilado deja `missingDocs = []` en `enumerated-types` y confirma presencia documentada de los mínimos del backlog `B362`, por lo que `docs/backlog.md`, `docs/current-focus.md`, `docs/testing.md`, `docs/architecture.md`, `docs/roadmap.md` y `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` quedan alineados con el paso del foco a `B363`.

**Validación registrada:**
- `node script/generate_official_function_catalog.cjs`
- `npm run compile`
- `npx tsc -p tsconfig.test.json`
- `npx vscode-test --label unit --grep "unit/catalogGeneratorScript|unit/catalogV2"`

## 1.165 B363. Catalog-driven enum hover, completion, signatureHelp and diagnostics — **Cerrada (spec 377, enum consumers 2026-05)**

**Objetivo:** integrar el modelo canonico `enumerated-type` / `enumerated-value` en hover, completion, signatureHelp, semantic tokens de valores con `!` y diagnostics conservadores, reutilizando `SystemCatalog` y sus indices efectivos sin abrir listas paralelas por feature.

**Resultado registrado:**
- `src/server/utils/pbIdentifier.ts` deja de truncar valores con `!`, de modo que hover y consumers basados en identificador resuelven ya `CSV!`, `Primary!` o `FromBeginning!` como `enumerated-value` real del catálogo;
- `src/server/features/enumeratedContext.ts` concentra la resolucion del enum esperado para propiedades y argumentos de llamada, y `completion.ts` / `signatureHelp.ts` reutilizan ese helper junto a `allowedOnProperties`, `allowedOnOwners`, `allowedInParameters` y el fallback desde `signature.label` para contextos como `Alignment`, `FileSeek(...)`, `RowsMove(...)` y `SetItemStatus(...)`;
- `src/server/features/semanticTokens.ts` publica `enumMember` para valores catalogados con `!` y `src/server/handlers/featureHandlers.ts` sirve el `SystemCatalog` al provider sin abrir un consumer catalog-driven mas amplio del necesario;
- `src/server/features/diagnostics.ts` emite el codigo estable `enum-value-context-mismatch` solo cuando el tipo esperado es inequívoco en una asignacion de propiedad o en un argumento de llamada, respetando owner/property context y evitando diagnosticos sobre expresiones dinamicas o ambiguas;
- `docs/backlog.md`, `docs/current-focus.md`, `docs/done-log.md`, `docs/rules-catalog.md`, `docs/testing.md`, `docs/performance-budget.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` y `specs/377-catalog-driven-enum-consumers/spec.md` quedan alineados con el cierre formal de `B363` y con el paso del foco a `B364`.

**Validación registrada:**
- `npm run build:test`
- `npx tsc -p tsconfig.test.json`
- `npx vscode-test --label unit --grep "completion|hover|signatureHelp|semanticTokens|diagnostics|enumerated|enum"`
- `npx vscode-test --label unit --grep "catalog|systemCatalog|catalogV2"`

## 1.163 B361. Official enumerated datatype extractor and coverage rail — **Cerrada (spec 375, official enum rail 2026-05)**

**Objetivo:** cerrar el rail oficial reproducible para tipos y valores enumerados PowerBuilder sin abrir un pipeline paralelo al generator actual, dejando cobertura auditable, provenance explícita y consumers runtime capaces de mezclar `manual-core` + `generated` por `enumValueOf`.

**Resultado registrado:**
- `script/generate_official_function_catalog.cjs` endurece el scraper oficial de Appeon con `findDocPageEndIndex()` y `extractPrimaryContentHtml()`, y ajusta `extractSectionHtml`, `parseDataWindowConstantPage`, `extractObjectsPropertyVariantReferences` y `parseObjectsPropertyEnumPageVariant` para impedir que TOCs, índices locales o `navfooter` globales entren como valores enumerados oficiales;
- el mismo rail oficial materializa `src/server/knowledge/system/generated/enumeratedTypes.generated.ts`, `enumeratedValues.generated.ts`, `enumeratedCoverage.generated.ts` y `enumeratedProvenance.generated.ts`, dejando `enumerated-types` con `officialCount = coveredCount = 33` y `enumerated-values` con `officialCount = coveredCount = 233`, sin texto oficial masivo copiado y con provenance/version/sourceUrl trazables;
- `src/server/knowledge/system/registry/datasets.ts` publica ya los slices `generated` de enums junto al rail manual, `buildIndexes.ts`/`queryService.ts` siguen resolviendo la unión efectiva por `byEnumValueOf` y `src/server/features/hover.ts` muestra esa unión real para tipos como `WindowType`, combinando `Main!` con valores generated como `MDIDock!` y `MDIDockHelp!` sin hardcodes paralelos;
- el cierre deja explícito que tipos como `SecureProtocol` pueden permanecer como datatype oficial sin `enumValues` cuando Appeon solo documenta códigos enteros y no tokens enumerados con `!`, de forma que cualquier curación posterior quede reservada para `B362`;
- `docs/architecture.md`, `docs/testing.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/backlog.md`, `docs/current-focus.md` y `docs/roadmap.md` quedan alineados con el cierre formal de B361 y con el paso del foco a `B362`.

**Validación registrada:**
- `node script/generate_official_function_catalog.cjs`
- `npm run compile`
- `npx tsc -p tsconfig.test.json`
- `npx vscode-test --label unit --grep "unit/catalogGeneratorScript|unit/catalogV2|unit/hover"`

## 1.162 B360. Enumerated catalog model breaking normalization — **Cerrada (spec 374, strict enum type/value split 2026-05)**

**Objetivo:** normalizar de forma estricta el modelo de enumerados PowerBuilder separando `enumerated-type` y `enumerated-value`, eliminando la representación legacy donde tipos con sufijo `!` aparecían como entradas canónicas del catálogo.

**Resultado registrado:**
- `src/server/knowledge/system/types.ts`, `normalization.ts` y `manual/common.ts` amplían el contrato de catálogo con `PbSystemSymbolKind = 'enumerated-type'`, `PbSystemSymbolDomain = 'enumerated-types'` y metadata específica (`documentation`, `enumValues`, `enumValueOf`, `enumNumericValue`, `enumValueMeaning`, `allowedOn*`), sin mantener aliases legacy para tipos como `SaveAsType!` o `DWBuffer!`;
- `src/server/knowledge/system/manual/language/enumerations/index.ts` deja `manual/language/enumerations/` con tipos canónicos (`SaveAsType`, `DWBuffer`, `DWItemStatus`, `Encoding`, `WindowType`, etc.) y valores representativos (`Text!`, `CSV!`, `Primary!`, `EncodingUTF8!`, etc.) ligados por `enumValueOf`, mientras `manual/index.ts` publica ya los dominios separados `enumerated-types` y `enumerated-values`;
- `src/server/knowledge/system/indexes/buildIndexes.ts`, `services/queryService.ts`, `SystemCatalog.ts` y `consistency.ts` endurecen el query layer y el audit: `listEnumeratedTypes()`, `resolveEnumeratedType()`, `resolveEnumeratedValue()` y `listValuesForEnumeratedType()` usan el modelo nuevo, `resolveLanguageSymbol()` prioriza `enumerated-type` antes de `system-global`/`enumerated-value` y `buildCatalogConsistencyReport()` publica `invalidEnumeratedTypeNames` para bloquear regresiones de nombres canónicos con `!`;
- `src/server/features/completion.ts` y `hover.ts`, junto con `catalogV2.test.ts`, `systemCatalogQueryHardening.test.ts`, `completion.test.ts` y `catalogConsistency.test.ts`, alinean completion/hover y los guardrails del catálogo con el breaking split de B360;
- `docs/architecture.md`, `docs/testing.md`, `docs/rules-catalog.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/roadmap.md`, `docs/backlog.md` y `docs/current-focus.md` quedan alineados con el cierre de B360 y con el siguiente foco natural `B361`.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogV2|systemCatalogQueryHardening"`
- `npm run test:unit -- --grep "completion|hover|semanticTokens|signatureHelp"`
- `npm run test:unit -- --grep "catalog|systemCatalog|catalogV2|enumerated|enum"`

## 1.161 B359. Runtime, integration and nonvisual system object datatypes catalog completion — **Cerrada (spec 373, manual runtime/integration rails 2026-05)**

**Objetivo:** completar los rails curados `manual/runtime/` y `manual/integration/` para tipos runtime/nonvisual modernos, PDF, correo, profiling/trazas, reflexión, OLE no visual y subsistemas de integración, sin remezclarlos con el carril visual ya cerrado en `B358`.

**Resultado registrado:**
- `src/server/knowledge/system/manual/runtime/` queda consolidado por ownership (`systemTypes.ts`, `errors.ts`, `reflection.ts`, `ole.ts`, `mail.ts`, `profiling.ts`) y `src/server/knowledge/system/manual/integration/` hace lo mismo para `json.ts`, `http.ts`, `rest.ts`, `oauth.ts`, `pdf.ts`, `filesystem.ts`, `compression.ts`, `crypto.ts` y `dotnet.ts`, cerrando el backlog B359 completo sobre `manual-core` en vez de depender solo del rail `generated`;
- el catálogo fija además casing canónico para tipos runtime/integration relevantes (`Inet`, `RESTClient`, `MailFileDescription`, `MailMessage`) y completa families que faltaban en profiling (`TraceTreeRoutine`, `TraceTreeObject`, `TraceTreeUser`, etc.), correo (`SMTPClient`) e integración moderna (`ResourceResponse`, `PDFPage`, `PDFTableOfContents`, etc.);
- `src/server/parsing/grammar.ts` alinea `PB_BUILTIN_TYPES` con los tipos runtime/integration/PDF/traza representativos y `test/server/unit/runtimeCatalogDatatypes.test.ts` bloquea ya la lista completa de tipos B359 como `manual-core`, la resolución representativa por categoría y la exclusión del extractor noise que solo debe seguir siendo owner-type generado;
- `docs/architecture.md`, `docs/testing.md`, `docs/rules-catalog.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/roadmap.md`, `docs/backlog.md` y `docs/current-focus.md` quedan alineados con el cierre de B359 y con el siguiente foco natural `B360`.

**Validación registrada:**
- `npm run test:unit -- --grep "runtimeCatalogDatatypes|catalogV2"`
- `npm run test:unit -- --grep "catalog|systemCatalog|catalogV2|catalogConsistency|nativeAncestors|ownerTypes"`
- `npm run test:unit -- --grep "completion|hover|signatureHelp"`

## 1.160 B358. Visual PowerBuilder system object datatypes catalog completion — **Cerrada (spec 372, manual visual rail 2026-05)**

**Objetivo:** cerrar el rail visual curado del catálogo PowerBuilder bajo `manual/visual/`, separando ventanas, controles, Ribbon y OLE visual del runtime nonvisual y dejando owner groups + ancestros nativos alineados con el catálogo estable.

**Resultado registrado:**
- `src/server/knowledge/system/manual/visual/` queda materializado en slices pequeñas (`visualObjects.ts`, `textControls.ts`, `listControls.ts`, `drawingControls.ts`, `dataControls.ts`, `ribbonControls.ts`, `oleVisualControls.ts`) y `manual/visual/index.ts` publica un agregador estable reutilizable por `manual/index.ts` sin volver a un `systemTypes.ts` monolítico;
- `src/server/knowledge/system/manual/runtime/systemTypes.ts` queda reducido al carril runtime/nonvisual, `Application` pasa a `Objetos de sistema`, `OLEControl`/`OLECustomControl` quedan en `OLE visual` y el agregador manual recompone visual + runtime sin cambiar el dominio público `system-object-datatypes`;
- `visualOwnerTypes.ts`, `nativeAncestors.ts` y `grammar.ts` alinean owner groups, builtins y cadenas nativas para tipos visuales avanzados como `MDIFrame`, `MDIClient`, `MenuCascade`, `RibbonApplicationMenu`, `RibbonPanelItem` y `WindowActiveX`, preservando la separación visual/runtime para el siguiente slice `B359`;
- `test/server/unit/visualCatalogDatatypes.test.ts` fija el cierre de B358 y `catalogV2.test.ts` sigue bloqueando regresiones del catálogo combinado.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit -- --grep "visualCatalogDatatypes|catalogV2"`

## 1.159 B339. Catalog provenance audit against official Appeon sources — **Cerrada (spec 371, catalog provenance guardrails 2026-05)**

**Objetivo:** auditar provenance, authority, versionado y límites de cobertura del system catalog para distinguir de forma ejecutable rails `generated` oficiales frente a rails `manual-core` curados, sin sobreatribuir cobertura Appeon.

**Resultado registrado:**
- `src/server/knowledge/system/consistency.ts` amplía `buildCatalogConsistencyReport()` con un audit explícito de provenance: counts por `kind`/`authority`, summaries por dominio, guards de mismatch `dataset -> authority/kind` y listas de incidencias para `source`, `sourceUrl`, `version` y `generatedAt` donde aplica;
- `test/server/unit/catalogProvenanceAudit.test.ts` y `catalogConsistency.test.ts` fijan que `manual-core` se publique como `manual/curated`, que `generated` se publique como `generated/official`, que los entries oficiales mantengan `sourceUrl` y `generatedAt`, y que dominios representativos como `global-functions`, `system-globals` y `operators` conserven límites de coverage explícitos;
- `docs/architecture.md`, `docs/testing.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/roadmap.md`, `docs/backlog.md` y `docs/current-focus.md` quedan alineados con el contrato de provenance ya ejecutable.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit -- --grep "catalogConsistency|catalogProvenanceAudit"`

## 1.158 B365. System catalog query/index hardening v2 — **Cerrada (spec 370, composite catalog queries 2026-05)**

**Objetivo:** endurecer `buildIndexes.ts`, `queryService.ts` y `SystemCatalog.ts` para que las queries del system catalog escalen con rails manual/generated/curados crecientes sin scans completos en hot paths interactivos.

**Resultado registrado:**
- `src/server/knowledge/system/indexes/buildIndexes.ts` publica buckets compuestos y congelados para `byDomainAndLookupKey`, `byKindAndLookupKey`, `byEnumValueOf` y `byOwnerTypeAndDomain`, manteniendo construcción determinista y consumo readonly;
- `src/server/knowledge/system/services/queryService.ts` concentra queries indexadas por domain/kind/owner/enum, evita concatenaciones amplias cuando hay owner types conocidos y fija `PB_LANGUAGE_SYMBOL_RESOLUTION_PRIORITY` como orden explícito de `resolveLanguageSymbol()`;
- `src/server/knowledge/system/SystemCatalog.ts` queda como facade delgada sobre `queryService.ts`, sin acceso directo a `PB_SYSTEM_SYMBOL_REGISTRY.indexes` para listados y resoluciones públicas del catálogo;
- `test/server/unit/systemCatalogQueryHardening.test.ts` y `test/server/unit/catalogV2.test.ts` fijan el contrato nuevo para índices compuestos, owner types nativos, queries de enumerados y prioridad explícita de lenguaje.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit -- --grep "systemCatalogQueryHardening|catalogV2"`

## 1.157 B357. Manual catalog modularization and slice ownership — **Cerrada (spec 369, stable manual catalog ownership 2026-05)**

**Objetivo:** reorganizar `src/server/knowledge/system/manual/` en slices funcionales con ownership explícito, sacar provenance y owner groups fuera de `manual/common.ts` y dejar agregadores estables para el registry y sus consumers.

**Resultado registrado:**
- `src/server/knowledge/system/manual/` queda reorganizado en `language/`, `datawindow/`, `runtime/`, `core/`, `ownerTypes/`, `visual/` e `integration/`, moviendo los slices manuales existentes a carpetas funcionales sin tocar IDs ni metadata semántica;
- `src/server/knowledge/system/manual/common.ts` queda helper-only, `manual/sources.ts` centraliza provenance base y `manual/ownerTypes/` concentra owner groups y applies-to compartidos;
- `src/server/knowledge/system/manual/index.ts` publica `PB_MANUAL_CORE_DATASET_SLICES` y `PB_MANUAL_CORE_OWNER_TYPE_GROUPS`, mientras `src/server/knowledge/system/registry/datasets.ts`, `generated/common.ts` y `nativeAncestors.ts` dejan de depender de imports frágiles hacia `manual/common.ts`;
- `test/server/unit/manualCatalogStructure.test.ts` fija la cobertura estructural del rail manual y la suite unitaria completa confirma que no hay regresiones en catálogo, completion, hover, signatureHelp ni boundaries arquitectónicos.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit`

## 1.156 B347. Refactor server LSP handler registration — **Cerrada (spec 368, server entrypoint decomposition 2026-05)**

**Objetivo:** descomponer `src/server/server.ts` en bootstrap, lifecycle/document handlers, feature handlers, command routing y runtime orchestration sin cambiar nombres LSP ni el comportamiento observable del servidor.

**Resultado registrado:**
- `src/server/handlers/featureHandlers.ts` concentra el wiring de `documentSymbol`, `hover`, `workspaceSymbol`, `definition`, `references`, `signatureHelp`, `completion`, `semanticTokens`, `codeAction`, `codeLens` y `rename` mediante contexto explícito;
- `src/server/handlers/documentHandlers.ts` y `src/server/handlers/lifecycleHandlers.ts` sacan del entrypoint los eventos de documento, watcher bridge, shutdown, initialize e initialized, preservando warm resume, discovery e indexación incremental;
- `src/server/handlers/buildCommandHandlers.ts`, `reportCommandHandlers.ts` y `runtimeCommandHandlers.ts` absorben `workspace/executeCommand`, dejando `src/server/server.ts` como bootstrap + runtime orchestration con helpers locales de scheduler/memoria;
- `docs/architecture.md`, `docs/testing.md` y `docs/performance-budget.md` quedan alineados con la estructura real del servidor tras la descomposición.

**Validación registrada:**
- `npm run build:test`
- `npm test`
- `npx mocha --ui tdd out/test/server/unit/architectureImports.test.js`
- `npx mocha --ui tdd out/test/server/performance/pfc-workspace.smoke.test.js out/test/server/performance/orderentry.smoke.test.js`
- `npm run test:smoke -- --grep "el formatter devuelve edits reales para un documento PowerBuilder abierto"`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild y cancelar degrada sin build activo"`
- `npm run test:smoke -- --grep "puede ejecutar el adapter ORCA legacy sobre el archivo activo"`
- `npm run test:smoke -- --grep "exporta un health report reutilizando stats y manifest del workspace activo"`

## 1.155 B295. Support bundle redaction policy — **Cerrada (spec 367, profile-aware sanitization 2026-05)**

**Objetivo:** volver explícita la policy de redacción del support bundle según el perfil activo del workspace, manteniendo el bundle útil para soporte offline y sin copiar código bruto.

**Resultado registrado:**
- `src/client/support/supportBundle.ts` añade una `redactionPolicy` explícita por perfil (`sanitized` o `summary-only`) para paths, snippets, diagnostics, settings y manifest, y la publica dentro del `manifest.json` y del `README.md` del bundle;
- `ci-support` y `support-safe` endurecen la redacción donde corresponde, mientras los perfiles de trabajo habituales mantienen el baseline `sanitized` con basename redacted;
- `src/client/extension.ts` endurece la exportación real del bundle con un reintento corto al pedir el `semanticWorkspaceManifest`, evitando fallos transitorios del export en frío;
- `test/server/unit/supportBundle.test.ts` y `test/smoke/support-bundle.extension.test.ts` fijan la policy explícita, la degradación `summary-only` y la exportación real del bundle con el perfil activo.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/supportBundle.test.js`
- `npm run test:smoke -- --grep "exporta un support bundle saneado desde el workspace activo"`

## 1.154 B294. Enterprise configuration policy — **Cerrada (spec 366, governed workspace profiles 2026-05)**

**Objetivo:** cerrar una policy explícita y gobernable de settings del workspace con perfiles corporativos visibles, sin abrir overrides opacos fuera del carril actual de governance.

**Resultado registrado:**
- `src/client/settingsGovernance.ts` amplía el catálogo a los perfiles `fast`, `balanced`, `deep-analysis`, `legacy-orca`, `ci-support` y `support-safe`, con claves gobernadas explícitas y aliases legacy normalizados para `interactive` y `legacy-safe`;
- `package.json` publica el schema actualizado de `vscPowerSyntax.profile` para esos seis perfiles y mantiene `balanced` como baseline por defecto;
- `test/server/unit/settingsGovernance.test.ts` fija el catálogo estable, los conflictos estructurales y la normalización de aliases, mientras `test/smoke/extension.test.ts` fija el schema visible y la inspección read-only de la governance real en la extensión.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/settingsGovernance.test.js`
- `npm run test:smoke -- --grep "settings governance publica perfiles corporativos y tolera la inspección read-only"`

## 1.153 B296. Enterprise health score — **Cerrada (spec 365, health dashboard scoring 2026-05)**

**Objetivo:** añadir un score agregado y explicable del workspace sobre las surfaces ya publicadas del runtime para resumir readiness, diagnostics, build, ORCA, cache, sourceOrigin, performance y support matrix sin abrir otro motor de health.

**Resultado registrado:**
- `src/client/projectHealthDashboard.ts` añade un scorecard puro del enterprise health con ocho dimensiones ponderadas, degradación honesta ante snapshots parciales y proyección Markdown dentro del dashboard ya existente;
- el dashboard y el `health report` exportado reutilizan exclusivamente stats, manifest, build health y support matrix ya publicados, sin tocar servidor ni contrato público;
- `test/server/unit/projectHealthDashboard.test.ts` fija tanto el score puro como su tabla Markdown visible, y `test/smoke/health-report.extension.test.ts` fija que el reporte exportado proyecta el score enterprise real del workspace.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/projectHealthDashboard.test.js`
- `npm run test:smoke -- --grep "exporta un health report reutilizando stats y manifest del workspace activo"`

## 1.152 B297. Runtime self-test command — **Cerrada (spec 364, supportability command 2026-05)**

**Objetivo:** añadir un self-test rápido del runtime que reutilice las surfaces read-only ya públicas para validar API, LSP, cache, project model, diagnósticos, build y ORCA sin abrir otra fuente de verdad.

**Resultado registrado:**
- `src/client/runtimeSelfTest.ts` añade un builder puro del reporte de self-test y su render Markdown, con checks accionables para API pública, roundtrip LSP/runtime, cache/persistencia, project model, diagnósticos, build snapshot y ORCA snapshot;
- `src/client/extension.ts` registra `vscPowerSyntax.runRuntimeSelfTest`, lo incorpora al menú de estado y abre el reporte Markdown reutilizando `getPublicContract()`, `refreshRuntimeStatusSnapshot()` y `getSemanticWorkspaceManifest()` sin tocar el servidor;
- `src/client/coreMaintenanceCommandCatalog.ts`, `src/client/statusBarPresentation.ts` y `package.json` dejan el comando visible dentro del core maintenance pack y de las acciones rápidas del runtime;
- `test/server/unit/runtimeSelfTest.test.ts`, `test/server/unit/coreMaintenanceCommandCatalog.test.ts` y `test/smoke/extension.test.ts` fijan el modelo puro, el catálogo de maintenance actualizado y la ejecución real del comando.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/runtimeSelfTest.test.js out/test/server/unit/coreMaintenanceCommandCatalog.test.js`

## 1.151 B293. Workspace support matrix finalization — **Cerrada (spec 363, visible support contract 2026-05)**

**Objetivo:** cerrar la matriz oficial de soporte del producto sobre un contrato visible y auditable, alineando health report y documentación canónica sin abrir otro rail topológico/semántico en servidor.

**Resultado registrado:**
- `src/client/projectSupportMatrix.ts` añade un builder puro que deriva la matriz de soporte desde `RuntimeStatusStats` + `ApiSemanticWorkspaceManifest`, cubriendo `Workspace`, `Solution`, target `.pbt`, `pbl-only`, source plain-text/exportado, staging ORCA, `DataWindow .srd`, `PBAutoBuild` y build files PowerServer/PowerClient con límites explícitos;
- `src/client/projectHealthDashboard.ts` proyecta esa matriz en el health report exportado, de forma que el artefacto visible reutiliza la misma verdad que el dashboard read-only y no inventa otra capa de cálculo;
- `test/server/unit/projectSupportMatrix.test.ts`, `test/server/unit/projectHealthDashboard.test.ts` y `test/smoke/health-report.extension.test.ts` fijan el contrato puro, su renderizado Markdown y la exportación real del report;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md` y `docs/testing.md` quedan alineados con la matriz oficial y con la derivación cliente-side del contrato.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/projectSupportMatrix.test.js out/test/server/unit/projectHealthDashboard.test.js`
- `npm run test:smoke`

## 1.150 B336. Catalog corpus validation against PFC/OrderEntry/legacy — **Cerrada (spec 362, corpus catalog baseline 2026-05)**

**Objetivo:** validar cobertura y consumo del catálogo contra PFC, STD_FC_OrderEntry y legacy PBL dump con una baseline separada de discovery/indexing general.

**Resultado registrado:**
- `src/server/features/catalogCorpusValidation.ts` añade un builder puro que resume `hits`, `misses`, `ambigüedades` y `budget violations` por dominio y surface a partir de probes reales trazables;
- `test/server/unit/catalogCorpusValidation.test.ts` fija la semántica del reporte y bloquea clasificaciones/budget violations antes de tocar los corpora reales;
- `test/server/performance/catalogCorpusValidation.smoke.test.ts` indexa PFC Solution, STD_FC_OrderEntry y el legacy PBL dump, calienta una pasada interactiva por probe para aislar la latencia servida del cold parse ya cubierto por otras suites, y congela cinco probes reales sobre `system-globals`, `global-functions` y `datawindow-functions`, exigiendo baseline `0 misses / 0 ambigüedades / 0 budget violations` en `hover`, `completion` y `diagnostics`;
- `test/results/003-real-corpora-baseline.md` registra la baseline catalog-driven por dominio/surface sin remezclarla con discovery/indexing general ni con la calibración de confidence cerrada en `B283`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/catalogCorpusValidation.test.js out/test/server/performance/catalogCorpusValidation.smoke.test.js`
- `npx mocha --ui tdd out/test/server/performance/catalogCorpusValidation.smoke.test.js out/test/server/performance/pfc-solution.smoke.test.js out/test/server/performance/orderentry.semantic.test.js out/test/server/performance/legacy-pbl-dump.smoke.test.js`
- `npx mocha --ui tdd out/test/server/unit/catalogV2.test.js out/test/server/unit/completion.test.js out/test/server/unit/hover.test.js out/test/server/unit/diagnostics.test.js`

## 1.149 B283. Semantic confidence calibration over real corpora — **Cerrada (spec 361, corpus-driven confidence baseline 2026-05)**

**Objetivo:** convertir la policy de readiness/confidence en una calibración ejecutable sobre PFC, OrderEntry y el corpus legacy público, fijando baseline de falsos positivos/negativos por feature y revisando thresholds contra evidencia real en lugar de intuición local.

**Resultado registrado:**
- `src/server/features/confidenceCalibration.ts` añade un builder puro de baseline que compara expectativas calibradas con `decideFeatureReadiness(...)` y clasifica desviaciones como `false-positive` o `false-negative`, con resumen por feature y findings trazables por corpus/escenario;
- `test/server/unit/confidenceCalibration.test.ts` fija la semántica del baseline y bloquea las clasificaciones más permisivas/restrictivas, evitando que el reporte esconda desviaciones de policy;
- `test/server/performance/confidenceCalibration.smoke.test.ts` indexa PFC Solution, STD_FC_OrderEntry y el legacy PBL dump, congela cuatro escenarios reales (`low`, `medium`, `high`) y verifica que `hover`, `completion`, `definition`, `references`, `rename` y `signature-help` mantienen baseline `0 false positives / 0 false negatives` con los thresholds actuales;
- la calibración revisa los thresholds por feature sin cambiarlos: `low` sigue siendo suficiente para `hover/completion/signature-help`, `medium` sigue desbloqueando `definition`, y `high` permanece requerido para `references/rename` en snapshot `ready`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/confidenceCalibration.test.js out/test/server/performance/confidenceCalibration.smoke.test.js`

## 1.148 B330. Catalog-driven contextual completion v2 — **Cerrada (spec 360, contextual catalog completion 2026-05)**

**Objetivo:** ampliar completion para consumir `reserved-words`, `pronouns`, `system-globals` y `enumerated-values` desde el catálogo, manteniendo prefix filtering, deduplicación, prioridad estable y bloqueo en member contexts irrelevantes.

**Resultado registrado:**
- `src/server/features/completion.ts` amplía la rama sin qualifier para incorporar `reserved-words`, `pronouns`, `system-globals` y `enumerated-values` desde `SystemCatalog`, reutilizando el conjunto `seen` ya existente para dedupe case-insensitive y manteniendo esos dominios detrás de las prioridades `0_local`, `1_member` y `2_global`;
- `createSystemCompletionItem(...)` deja de tratar todo lo no callable como `Keyword` y ahora clasifica `system-global` y `pronoun` como `Variable`, `enumerated-value` como `EnumMember`, `datatype` como `TypeParameter`, `system-type` como `Class` y `constant`/`property` con kinds específicos;
- `completion.test.ts` fija el nuevo comportamiento contextual: aparecen `COMMIT`, `THIS`, `SQLCA` y `SaveAsType!` cuando el prefijo y el contexto global lo permiten, se deduplican homónimos frente a símbolos locales y se bloquea la mezcla de estos dominios en `member context` como `SQLCA.sa`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/completion.test.js`
- `npx mocha --ui tdd out/test/server/unit/hotPathAllocationBudget.test.js`

## 1.147 B325. System globals and runtime singleton catalog — **Cerrada (spec 359, typed runtime singletons 2026-05)**

**Objetivo:** completar `system-globals` y runtime singletons con tipo, riesgo y contexto útiles para consumers transaccionales y de runtime, eliminando hardcodes de `SQLCA` donde el catálogo ya debía ser la fuente de verdad.

**Resultado registrado:**
- `src/server/knowledge/system/manual/systemGlobals.ts` ahora publica metadata tipada y de riesgo para `SQLCA`, `SQLSA`, `SQLDA`, `Error` y `Message`, usando firmas como `SQLCA : Transaction` y `SQLDA : DynamicDescriptionArea` para exponer tipo/contexto directamente desde el catálogo;
- `src/server/knowledge/resolution/semanticQueryService.ts` deja de hardcodear `SQLCA -> transaction` y resuelve el tipo base del qualifier desde `resolveSystemGlobal(...)`, permitiendo que completion y otros consumers usen el catálogo para system globals en lugar de comparación por nombre crudo;
- `src/server/features/signatureHelp.ts` también deja de inferir `sqlca` por hardcode y consume `valueType` del catálogo, lo que permite seleccionar overloads locales `transaction` cuando el argumento es `SQLCA`;
- los tests focales de catálogo, completion, hover, diagnostics y signatureHelp dejan fijado que `SQLCA` expone `valueType = Transaction`, que el hover muestra tipo/riesgo y que completion/signatureHelp siguen funcionando desde metadata catalog-driven.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/catalogV2.test.js out/test/server/unit/completion.test.js out/test/server/unit/hover.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/signatureHelp.test.js`

## 1.146 B324. Official operators, pronouns and enumerated values catalog generation — **Cerrada (spec 358, curated language-domain hardening 2026-05)**

**Objetivo:** endurecer `operators`, `pronouns` y `enumerated-values` como dominios separados del catálogo, con aliases útiles y guardrails explícitos de no overlap frente a `keywords`/`reserved-words` ya oficializados.

**Resultado registrado:**
- `src/server/knowledge/system/manual/enumeratedValues.ts` introduce aliases sin `!` para tipos enumerados como `SaveAsType!`, `DWItemStatus!`, `Border!`, `WindowType!` o `Encoding!`, de modo que consumers basados en identificadores puedan resolver el dominio sin depender del sufijo léxico;
- `test/server/unit/catalogV2.test.ts` fija que `resolveLanguageSymbol('SaveAsType')` resuelva `SaveAsType!` como `enumerated-value`, bloqueando la regresión que dejaba fuera del catálogo los enumerados cuando el consumer sólo veía el identificador plano;
- el mismo `catalogV2.test.ts` añade un guardrail explícito de no solape entre `operators`/`pronouns`/`enumerated-values` y los lookup keys combinados de `keywords`/`reserved-words`, asegurando que el hardening curado del dominio no contamine el rail oficial recién cerrado en `B322`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/catalogV2.test.js`

## 1.145 B322. Official reserved words and keywords catalog generation — **Cerrada (spec 357, official language vocabulary coverage 2026-05)**

**Objetivo:** oficializar `keywords` y `reserved-words` sobre el rail restaurado en `B319`, alinear `PB_KEYWORDS` con el vocabulario oficial relevante y mantener `pronouns`/`system-globals` como blockers explícitos, no como fuente primaria del dominio.

**Resultado registrado:**
- `script/generate_official_function_catalog.cjs` ahora audita `keywords` y `reserved-words` en `officialCoverage.generated.ts`, donde ambos dominios quedan con `missingCount = 0` y coverage explícita de `60` y `43` unidades respectivamente;
- el generador materializa `PB_GENERATED_KEYWORDS` y `PB_GENERATED_RESERVED_WORDS` en `generated.generated.ts`, cubriendo modifiers oficiales como `PUBLIC` y reserved words oficiales como `COMMIT`, `NAMESPACE`, `WITH`, `XOR`, `SYSTEMREAD` y `SYSTEMWRITE` sin reabrir slices manuales paralelos;
- `generatedKeywordLexemes.generated.ts` pasa a ser el set canónico del fast-path para `PB_KEYWORDS`, mientras `grammar.ts` conserva sólo phrases de bloque y blockers explícitos de `pronouns`/`system-globals` (`this`, `super`, `sqlca`, etc.) fuera de la fuente primaria del dominio;
- el parser de reserved words queda anclado a la tabla oficial real de Appeon y deja de capturar navegación espuria (`Prev`, `Up`, `Sidebar`), cerrando el drift entre el rail oficial y el set rápido del parser.

**Validación registrada:**
- `node script/generate_official_function_catalog.cjs`
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/catalogGeneratorScript.test.js out/test/server/unit/catalogConsistency.test.js out/test/server/unit/catalogV2.test.js`

## 1.144 B323. Official datatypes and system object datatypes catalog generation — **Cerrada (spec 356, official types coverage 2026-05)**

**Objetivo:** oficializar `datatypes` y `system-object-datatypes` sobre el rail restaurado en `B319`, cerrando aliases críticos y alineando el parser fast-path con la cobertura oficial relevante.

**Resultado registrado:**
- `script/generate_official_function_catalog.cjs` ahora audita `datatypes` y `system-object-datatypes` en `officialCoverage.generated.ts`, donde ambos dominios quedan con `missingCount = 0`;
- el generador materializa en `generated.generated.ts` los `system-object-datatypes` oficiales faltantes y publica `generatedBuiltinTypes.generated.ts` para mantener `PB_BUILTIN_TYPES` alineado con los nombres oficiales relevantes sin introducir lógica dinámica en el hot path;
- `UnsignedInt` queda cubierto como alias oficial de `UnsignedInteger`, y tipos oficiales como `SMTPClient`, `WindowObject`, `PDFAction`, `SyncParm` y `PowerServerResult` pasan a resolverse desde el catálogo y el parser fast-path;
- `diagnostics.test.ts` fija el caso SD3 negativo/positivo sobre `windowobject` vs `windowobject_typo`, y `semanticConsistencyOracle.smoke.test.ts` mantiene PFC Solution y OrderEntry saludables sobre corpus real tras la ampliación del catálogo.

**Validación registrada:**
- `node script/generate_official_function_catalog.cjs`
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/catalogGeneratorScript.test.js out/test/server/unit/catalogConsistency.test.js out/test/server/unit/catalogV2.test.js out/test/server/unit/diagnostics.test.js`
- `npx mocha --ui tdd out/test/server/performance/semanticConsistencyOracle.smoke.test.js`

## 1.143 B319. Restore official catalog generator and coverage v2 — **Cerrada (spec 355, official generator rail 2026-05)**

**Objetivo:** restaurar el rail reproducible de generación oficial del catálogo sobre el layout real actual y publicar coverage por dominios relevantes sin depender de rutas históricas.

**Resultado registrado:**
- `script/generate_official_function_catalog.cjs` sigue ya apuntando al layout actual `out/server/...` y ahora serializa `officialCoverage.generated.ts` para `global-functions`, `object-functions`, `datawindow-functions`, `system-events` y `statements`, no sólo para los dos dominios históricos;
- la ejecución real del generador recompone `officialCoverage.generated.ts` con coverage agregada por dominio y actualiza únicamente `generatedAt` en `provenance.generated.ts`, sin churn adicional en `generated.generated.ts` ni `ownerTypes.generated.ts`;
- `test/server/unit/catalogGeneratorScript.test.ts` fija tanto el layout actual/wrapper compatible como la presencia de los dominios oficiales relevantes en `officialCoverage.generated.ts`, mientras `catalogConsistency.test.ts` revalida consistencia del catálogo resultante.

**Validación registrada:**
- `node script/generate_official_function_catalog.cjs`
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/catalogGeneratorScript.test.js out/test/server/unit/catalogConsistency.test.js`

## 1.142 B285. System catalog coverage v2 — **Cerrada (spec 354, runtime catalog coverage 2026-05)**

**Objetivo:** ampliar el catálogo runtime base con system types frecuentes de PFC/OrderEntry sin dispersar hardcode por `hover`, `completion`, `diagnostics` o consumers adyacentes.

**Resultado registrado:**
- `src/server/knowledge/system/manual/systemObjectDatatypes.ts` amplía el slice curado de `system-object-datatypes` con tipos runtime frecuentes usados en corpus real, incluyendo clúster HTTP/JSON/OAuth, controles visuales (`CommandButton`, `TreeView`, `WebBrowser`, `RibbonBar`, etc.), objetos no visuales (`INet`, `InternetResult`, `RestClient`, `WSConnection`, `Pipeline`, profiling/trace) y tipos de reflexión/runtime (`EnumerationDefinition`, `Function_Object`, `PBDOM_*`);
- `src/server/parsing/grammar.ts` alinea `PB_BUILTIN_TYPES` con esa cobertura curada para que el reconocimiento rápido del parser no vuelva a divergir del catálogo base;
- `test/server/unit/catalogV2.test.ts`, `completion.test.ts`, `hover.test.ts` y `powerbuilderSemanticGolden.test.ts` fijan que los nuevos system types resuelven en catálogo, aparecen en surfaces visibles y no dependen de hardcode local por feature;
- una comprobación corpus-backed sobre ancestros `global type ... from ...` en `fixtures-local/pfc` y `fixtures-local/STD_FC_OrderEntry` deja ya solo tipos de proyecto/custom sin resolver tras filtrar prefijos de workspace, sin huecos runtime obvios en el carril base.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/catalogV2.test.js out/test/server/unit/completion.test.js out/test/server/unit/hover.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js`

## 1.141 B291. Embedded SQL semantic anchors — **Cerrada (spec 353, embedded SQL anchors 2026-05)**

**Objetivo:** reutilizar `sqlRegions` y el carril transaccional ya existente para publicar anchors SQL embebidos explicables, con `confidence` y degradación honesta, en context packs, code metrics, debt report y support bundle.

**Resultado registrado:**
- `src/server/features/embeddedSqlAnchors.ts` concentra el modelo reusable de anchors SQL embebido sobre `findSqlRegions(...)`, infiere `transactionTarget` desde `CONNECT/DISCONNECT USING ...` o `SQLCA` y clasifica `confidence` como `high`/`medium`/`low` sin abrir un parser SQL nuevo;
- `src/server/features/currentObjectContext.ts`, `powerBuilderCodeMetrics.ts` y `powerBuilderTechnicalDebtReport.ts` proyectan esos anchors en las APIs read-only del objeto activo, métricas por objeto y hotspots de deuda técnica, manteniendo la degradación honesta cuando el contexto transaccional no es defendible;
- `src/client/currentObjectContextPanelModel.ts`, los markdown reports de métricas/deuda y `src/client/support/supportBundle.ts` exponen los anchors al usuario y los exportan saneados dentro del support bundle offline;
- `test/server/unit/currentObjectContext.test.ts`, `powerBuilderCodeMetrics.test.ts`, `powerBuilderTechnicalDebtReport.test.ts`, `currentObjectContextPanelModel.test.ts` y `supportBundle.test.ts` fijan el cierre del slice con `SQLCA`, confidence y export saneado.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContextPanelModel.test.js out/test/server/unit/supportBundle.test.js`

## 1.140 B290. DataStore/DataWindow behavioral catalog v2 — **Cerrada (spec 352, behavioral catalog 2026-05)**

**Objetivo:** alinear el catálogo contextual de DataStore/DataWindow para `Retrieve`, `Update`, `SetTrans`, `SetTransObject`, `GetChild`, `Describe` y `Modify` sobre un carril único consumido por `hover`, `signatureHelp`, `completion` y `diagnostics`.

**Resultado registrado:**
- `src/server/knowledge/system/manual/dataWindowFunctions.ts` publica firmas, documentación y `risk` coherentes para `Describe`, `Modify`, `Retrieve`, `SetTransObject`, `Update`, `GetChild` y `SetTrans`, y corrige `GetChild` para que solo aplique a DataWindow control y DataStore;
- `src/server/features/hover.ts` y `src/server/features/signatureHelp.ts` dejan de caer al lookup plano por nombre cuando la llamada está cualificada y el `ownerType` ya es conocido, evitando que `DataWindowChild` herede por error APIs incompatibles;
- `src/server/features/diagnostics.ts` emite `sd2UnresolvedCallable` para mismatch de owner en llamadas cualificadas del catálogo comportamental DataWindow en vez de silenciarlas por ser member calls;
- `test/server/unit/completion.test.ts`, `hover.test.ts`, `signatureHelp.test.ts` y `diagnostics.test.ts` fijan `GetChild` ausente en `DataWindowChild`, metadata ampliada de `Update(...)` y routing owner-scoped estable.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/hover.test.js out/test/server/unit/signatureHelp.test.js` → `60 passing`

## 1.103 B081. Inteligencia de DataWindow y acceso a `.Object` — **Cerrada (spec 283, DataWindow Object/GetChild navigation 2026-05)**

**Objetivo:** resolver rutas `dw.Object...` y `GetChild()` sobre DataWindow/DataWindowChild reutilizando el backbone DataWindow ya existente, sin fingir semántica cuando el binding o la cadena child no sean defendibles.

**Resultado registrado:**
- `src/server/features/dataWindowPropertyPaths.ts` amplía el bridge actual para reconocer property paths avanzados no solo en `Describe/Modify`, sino también en acceso directo `.Object.<control|column|property>` y en el primer argumento literal de `GetChild()`;
- la resolución sigue reutilizando `DataWindowModel`, `findNearestDataObjectLiteralBinding()` y la cadena child ya existente para `report(...)` / `dddw.name`, incluyendo rutas hoja directas hacia report child o dropdown child cuando el target es único;
- `test/server/unit/definition.test.ts` fija definición segura para `GetChild("state_id", ...)`, `GetChild("rpt_orders", ...)` y `dw_parent.Object.state_id.dddw.name`;
- `test/server/unit/hover.test.ts` fija hover seguro para `dw_customer.Object.DataWindow.Table.Select`, manteniendo intacto el comportamiento previo de `Describe/Modify` y la degradación honesta cuando no hay binding resoluble.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/definition.test.js out/test/server/unit/hover.test.js`

## 1.134 B280. Ambiguity model v2 for query engine — **Cerrada (spec 325, ambiguity model v2 for query engine 2026-05)**

**Objetivo:** diferenciar ambigüedad real del query engine, `global-fallback` ambiguo y conflicto de `sourceOrigin` sin abrir un segundo motor de resolución ni volver a comparaciones opacas por nombre.

**Resultado registrado:**
- `src/server/knowledge/resolution/semanticQueryService.ts` publica ya `ambiguityKind`, `fallback-ambiguity` y `source-origin-conflict` además de la evidence previa del winner path;
- `src/server/features/queryContext.ts` expone esa clasificación a features del editor, y `src/server/features/hoverFormat.ts` distingue ya entre empate por distancia mínima y ambigüedad de `global-fallback`;
- `test/server/unit/semanticQueryService.test.ts`, `queryContext.test.ts`, `hoverFormat.test.ts`, `hover.test.ts`, `definition.test.ts`, `references.test.ts` y `rename.test.ts` fijan el cierre de `B280` y preservan los guardrails previos;
- `docs/rules-catalog.md`, `docs/testing.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B281`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticQueryService.test.js out/test/server/unit/queryContext.test.js out/test/server/unit/hoverFormat.test.js out/test/server/unit/hover.test.js out/test/server/unit/definition.test.js`
- `npx mocha --ui tdd out/test/server/unit/references.test.js out/test/server/unit/rename.test.js`

## 1.133 B279. Symbol identity canonical key v2 — **Cerrada (spec 324, symbol identity canonical key v2 2026-05)**

**Objetivo:** endurecer la identidad canónica exacta de símbolo para que query engine, reports y surfaces visibles no vuelvan a comparar solo por nombre y no mezclen source real con `orca-staging`.

**Resultado registrado:**
- `src/server/knowledge/symbolKey.ts` publica ya `buildSymbolKey` exacta y `buildConflictFamilyKey` como única agregación relajada permitida para conflictos cross-project/cross-library;
- `src/server/knowledge/resolution/semanticQueryService.ts`, `src/server/features/references.ts`, `src/server/features/rename.ts` y `src/server/features/crossProjectSymbolConflicts.ts` separan ya identidad exacta, family key y preferencia por la surface local o real frente a staging;
- `src/server/features/workspaceSymbols.ts`, `src/server/features/semanticWorkspaceManifest.ts`, `src/server/features/dependencyGraph.ts`, `src/server/features/crossProjectSymbolConflicts.ts` y `src/shared/publicApi.ts` publican `identityKey` canónica en exported symbols, manifest, dependency graph y candidatos de conflicto;
- `test/server/unit/symbolKey.test.ts`, `references.test.ts`, `rename.test.ts`, `semanticWorkspaceManifest.test.ts`, `dependencyGraph.test.ts` y `crossProjectSymbolConflicts.test.ts` fijan el cierre de `B279`;
- `docs/architecture.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/testing.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B280`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/symbolKey.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js`
- `npx mocha --ui tdd out/test/server/unit/references.test.js out/test/server/unit/rename.test.js`
- `npx mocha --ui tdd out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/dependencyGraph.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js`

## 1.132 B278. Core maintenance command pack — **Cerrada (spec 323, core maintenance command pack 2026-05)**

**Objetivo:** exponer un pack homogéneo de comandos seguros para inspeccionar y mantener el core, reutilizando observabilidad local, manifest, support bundle y persistencia v2 sin abrir rails paralelos.

**Resultado registrado:**
- `src/client/coreMaintenanceCommandCatalog.ts` fija el catálogo tipado de los nueve comandos de `B278` y su clasificación `read-only` frente a `confirmable`;
- `src/client/extension.ts`, `src/server/server.ts` y `package.json` exponen ya el pack completo: `exportHealthReport`, `showMemoryBudgets`, `showIndexingState`, `showProjectRouting`, `showSourceOriginConflicts`, `validatePersistentCache`, `clearSemanticCache`, `rebuildWorkspaceIndex` y el `exportSupportBundle` ya existente, integrados además en `openStatusMenu`;
- `test/server/unit/coreMaintenanceCommandCatalog.test.ts`, `test/smoke/extension.test.ts` y `test/smoke/health-report.extension.test.ts` fijan el wiring del pack y el export real del health report sobre dashboard/stats/manifest del workspace;
- `README.md`, `docs/developer-workflows.md`, `docs/testing.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B279`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/coreMaintenanceCommandCatalog.test.js`
- `npm run test:smoke -- --grep "smoke/extension|smoke/health-report-extension"`

## 1.131 B272. PowerBuilder parser resilience fuzzing — **Cerrada (spec 322, powerbuilder parser resilience fuzzing 2026-05)**

**Objetivo:** endurecer parser/masking/splitter con fuzzing determinista sobre entradas PowerBuilder raras o truncadas, sin crash, sin scopes corruptos y sin diagnósticos explosivos.

**Resultado registrado:**
- `test/server/unit/powerbuilderParserResilienceFuzz.test.ts` añade una matriz determinista de corpus + mutaciones sobre comentarios anidados, strings raros, continuaciones `&`, SQL embebido, external functions, prototypes incompletos, eventos, `try/catch/finally`, labels y EOF truncado, comprobando no crash, rangos de scope sanos y diagnósticos acotados;
- `src/server/parsing/statementSplitter.ts` construye ya `logicalStatements` desde `stripCommentsSmart` y sus máscaras, de modo que el texto lógico no arrastra comentarios y `test/server/unit/statementSplitter.test.ts` fija el caso con `;` y `&` dentro de comentarios anidados;
- `src/server/analysis/documentAnalysis.ts` mantiene rangos agregados/monotónicos para scopes de type repetidos en `forward/implementation` y degrada a `global` los callables truncados que aparecen antes del primer `type` real, evitando colgarlos del objeto futuro bajo input malformado;
- `docs/testing.md`, `docs/architecture.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B278`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/codeMasking.test.js out/test/server/unit/nestedComments.test.js out/test/server/unit/statementSplitter.test.js out/test/server/unit/documentAnalysis.test.js out/test/server/unit/externalFunctions.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js out/test/server/unit/corpusRegression.test.js out/test/server/unit/powerbuilderParserResilienceFuzz.test.js`

## 1.130 B271. Core telemetry-free observability contract — **Cerrada (spec 321, telemetry-free observability contract 2026-05)**

**Objetivo:** formalizar un contrato versionado de observabilidad local para readiness, indexing, cache, memory, latency, build, ORCA, diagnostics, query trace, support bundle y health, sin telemetría externa ni rails paralelos de reporting.

**Resultado registrado:**
- `src/shared/publicApi.ts` añade `ApiObservabilityContractDescriptor` dentro de `ApiPublicContractDescriptor`, declarando dominios observables, surfaces `getServerStats`/`server-stats`/`vscPowerSyntax.exportSupportBundle`, privacidad `externalTelemetry = false`, `localOnly = true` y export offline explícito para support bundle;
- `test/server/unit/publicApi.test.ts` fija el contrato versionado y `test/server/unit/supportBundle.test.ts` mantiene verde el carril de redacción/saneamiento que respalda ese descriptor;
- `README.md`, `docs/architecture.md`, `docs/developer-workflows.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B272`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js`

## 1.129 B269. Semantic snapshot schema evolution and compatibility tests — **Cerrada (spec 320, semantic snapshot schema evolution and compatibility 2026-05)**

**Objetivo:** asegurar evolución compatible de snapshots semánticos, manifests, support bundles y payloads públicos exportables, sin compatibilidad silenciosa ni aceptación ambigua de versiones.

**Resultado registrado:**
- `src/client/semanticWorkspaceSnapshot.ts` normaliza snapshots legados compatibles que llegan sin `schemaVersion` o `summary`, recomputa el resumen desde `workspaceManifest` + `serverStats` y mantiene rechazo explícito de versiones no soportadas;
- `test/fixtures/compatibility/*.json`, `test/server/unit/semanticWorkspaceSnapshot.test.ts`, `publicApi.test.ts` y `supportBundle.test.ts` congelan fixtures versionadas y roundtrips sobre manifest externo, `public-contract`, `read-only-tool-bridge` y `support bundle manifest`, validando compatibilidad minor y serialización estable;
- `docs/testing.md`, `docs/architecture.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B271`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticWorkspaceSnapshot.test.js out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js`

## 1.128 B270. Persistent cache corruption/fuzz recovery suite — **Cerrada (spec 319, persistent cache corruption fuzz recovery suite 2026-05)**

**Objetivo:** demostrar que la persistencia semántica degrada de forma segura ante corrupción realista de checkpoint/journal/manifest/particiones, sin crash ni estado semántico a medias.

**Resultado registrado:**
- `src/server/cache/cacheStore.ts` valida ahora explícitamente la forma del manifest de particiones antes de consumirlo, de modo que un manifest malformado o una entrada incompleta fuerzan `rebuild` limpio en vez de lanzar o seguir con estado ambiguo;
- `test/server/unit/cacheStoreCorruptionFuzz.test.ts` añade una matriz determinista de corrupción sobre `project-partitions.json`, checkpoints particionados y journals particionados, verificando que `load()` siempre responde con `decision.action = rebuild` y checkpoint vacío;
- `test/server/unit/cacheStore.test.ts` y `cachePersistence.test.ts` siguen fijando los casos de truncado/corrupción/TTL/schema/version/journal sequence/serving snapshot sobre el mismo carril, y `docs/testing.md`, `docs/performance-budget.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B269`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/cacheStore.test.js out/test/server/unit/cachePersistence.test.js out/test/server/unit/cacheStoreCorruptionFuzz.test.js`

## 1.127 B276. Hot path allocation budget and regression guard — **Cerrada (spec 318, hot path allocation budget and regression guard 2026-05)**

**Objetivo:** impedir regresiones estructurales de allocations en el carril interactivo, bloqueando materializaciones, splits y clonaciones globales antes de que degraden `hover`, `completion`, `definition`, `references`, diagnostics rápidos o `queryContext`.

**Resultado registrado:**
- `src/server/utils/documentLineText.ts` introduce acceso por línea para `TextDocument` sin partir el documento completo; `src/server/features/queryContext.ts` y `src/server/features/diagnostics.ts` pasan a consumir solo la línea activa para resolver contexto e inspección puntual;
- `src/server/features/completion.ts` deja de clonar el catálogo global completo del sistema y consume `listGlobalFunctions()` + `listStatements()`; `src/server/features/referenceSourcePool.ts` deja de renormalizar toda la lista de `getAllSourceFiles()` por cada query;
- `test/server/unit/hotPathAllocationBudget.test.ts`, junto con `queryContext.test.ts`, `completion.test.ts`, `diagnostics.test.ts`, `referenceSourcePool.test.ts`, `references.test.ts`, `definition.test.ts` y `rename.test.ts`, fija el guard local/CI contra `document.getText().split(...)`, `JSON.stringify`, `getAllEntities`/`exportDocumentRecords`, clonación global del catálogo y renormalización redundante del workspace; `docs/testing.md`, `docs/performance-budget.md`, `docs/architecture.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B270`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/queryContext.test.js out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/referenceSourcePool.test.js out/test/server/unit/references.test.js out/test/server/unit/definition.test.js out/test/server/unit/rename.test.js out/test/server/unit/hotPathAllocationBudget.test.js`

## 1.126 B275. Long-running session stability soak tests — **Cerrada (spec 317, long-running session stability soak tests 2026-05)**

**Objetivo:** simular sesiones largas para detectar crecimiento no acotado, readiness roto o cachés huérfanas antes de abrir el siguiente bloque de guards de performance.

**Resultado registrado:**
- `test/server/performance/session-stability-soak.perf.test.ts` añade una soak suite local opt-in que reutiliza el runtime ya existente para simular apertura/cierre de archivos, cambios incrementales, watcher bursts, diagnostics, `hover`/`completion`, build snapshot, support bundle, cache flush y workspace resume sobre un workspace sintético;
- `tools/run-session-stability-soak.mjs` y `package.json` exponen el runner `npm run test:performance:soak`, que compila, ejecuta solo esa suite con opt-in explícito y materializa evidencia en `artifacts/performance/session-stability-soak.json` y `.md`;
- el soak deja trazado explícito de tamaño inicial/final de `DocumentCache` y `KnowledgeBase`, máximo/final de `ServingCache`, flushes, resume checks y health/build snapshot, y `docs/testing.md`, `docs/performance-budget.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B276`.

**Validación registrada:**
- `$env:POWERSYNTAX_SOAK_ITERATIONS='8'; npm run test:performance:soak; Remove-Item Env:POWERSYNTAX_SOAK_ITERATIONS`

## 1.125 B274. Memory pressure adaptive degradation — **Cerrada (spec 316, memory pressure adaptive degradation 2026-05)**

**Objetivo:** actuar automáticamente bajo presión de memoria para proteger el carril interactivo: aliviar `ServingCache`, aplazar carriles no críticos y limitar reports read-only pesados sin convertir el runtime en un apagón global.

**Resultado registrado:**
- `src/server/runtime/memoryPressurePolicy.ts` fija la policy explícita de `B274`: thresholds artificiales sobre el reporte unificado de memoria, purga de `ServingCache`, pausa de nuevas escrituras en esa caché, aplazamiento de `background-indexing|maintenance|ai-tooling` y caps adaptativos por report (`semanticWorkspaceManifest`, `crossProjectSymbolConflicts`, `workspaceMigrationAssistant`, `codeMetrics`, `technicalDebtReport`);
- `src/server/server.ts` consume esa misma policy en el gate de background, en los writes del serving cache y en los comandos read-only pesados, de forma que `hover`, `completion`, `definition` y `signatureHelp` siguen disponibles aunque el runtime entre en modo de alivio;
- `test/server/unit/memoryPressurePolicy.test.ts`, junto con `memoryBudgets.test.ts`, `runtimeHealth.test.ts`, `semanticWorkspaceManifest.test.ts`, `crossProjectSymbolConflicts.test.ts`, `workspaceMigrationAssistant.test.ts`, `powerBuilderCodeMetrics.test.ts` y `powerBuilderTechnicalDebtReport.test.ts`, deja fijado el cierre con thresholds artificiales y revalidación de los reports capados; `docs/performance-budget.md`, `docs/architecture.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B275`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/memoryPressurePolicy.test.js out/test/server/unit/memoryBudgets.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js`

## 1.124 B268. Workspace partition isolation and multi-root stress hardening — **Cerrada (spec 315, workspace partition isolation and multi-root stress hardening 2026-05)**

**Objetivo:** evitar contaminación entre roots, proyectos, librerías, staging y build profiles, de modo que routing, `sourceOrigin`, manifest, Object Explorer, caché persistente y carriles build/ORCA sigan aislados aunque se repitan labels visibles entre roots distintos.

**Resultado registrado:**
- `src/server/workspace/workspaceState.ts` deja de inferir `sourceOrigin` con un `hasSolutionRoots` global y pasa a decidirlo por el marker topológico más cercano; `watchedFileIntake.ts` y `workspaceIndexer.ts` reutilizan la misma inferencia contextual para no divergir del estado canónico;
- `test/server/unit/workspace.test.ts`, `semanticWorkspaceManifest.test.ts` y `objectExplorerModel.test.ts` fijan el aislamiento multi-root para proyectos/librerías homónimos, la separación por `projectUri` y la ausencia de mezcla visible en manifest/Object Explorer;
- `test/server/unit/cacheStore.test.ts`, `pbAutoBuildProfileMatrix.test.ts` y `orcaStagingExport.test.ts` fijan además particiones de caché por proyecto homónimo en roots distintos, último build profile recordado por URI y selección del workspace folder correcto para staging ORCA; `docs/testing.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B274`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/workspace.test.js out/test/server/unit/watchedFileIntake.test.js out/test/server/unit/cacheStore.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/pbAutoBuildProfileMatrix.test.js out/test/server/unit/orcaStagingExport.test.js`

## 1.123 B273. Cross-surface golden contract matrix — **Cerrada (spec 314, cross-surface golden contract matrix 2026-05)**

**Objetivo:** congelar los outputs visibles de las surfaces read-only principales sobre un fixture compartido para que el drift entre `documentSymbols`, navegación, diagnostics, context packs, manifest, lineage y support bundle quede detectado por una única matriz golden explícita.

**Resultado registrado:**
- `test/server/unit/crossSurfaceGoldenMatrix.test.ts` crea un fixture compartido (`w_context`, `w_context_base`, `d_sales_orders`) y resume en una sola matriz estable `documentSymbols`, `workspaceSymbols`, hover, definition, references, rename eligibility, diagnostics, semantic tokens, `currentObjectContext`, `impactAnalysis`, `safeEditPlan`, manifest, dependency graph, DataWindow lineage y support bundle;
- la normalización del golden congela nombres, ubicaciones, reason codes, riesgos, `sourceOrigin`, inventory del support bundle y demás señales visibles sin fijar blobs enteros frágiles ni abrir infraestructura nueva fuera del backbone read-only ya cerrado;
- `docs/testing.md`, backlog, roadmap y current-focus quedan alineados para dejar `B273` fuera del backlog activo y mover el foco canónico a `B268`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/crossSurfaceGoldenMatrix.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js out/test/server/unit/semanticConsistencyOracle.test.js out/test/server/unit/documentSymbols.test.js out/test/server/unit/workspaceSymbols.test.js out/test/server/unit/semanticTokens.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/dependencyGraph.test.js out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/supportBundle.test.js`

## 1.122 B277. Core module dependency firewall — **Cerrada (spec 313, core module dependency firewall 2026-05)**

**Objetivo:** impedir dependencias indebidas entre `client`, `shared`, `runtime`, `features`, `knowledge/parsing/utils` y el carril `build/ORCA`, de modo que el hot path semántico y el contrato entre capas queden protegidos por un guard automático y no por convención difusa.

**Resultado registrado:**
- `test/server/unit/architectureImports.test.ts` deja de ser un guard puntual de `B228` y pasa a escanear reglas por capa: `knowledge/parsing/utils` no pueden importar `vscode`/`vscode-languageserver`, `client` no puede importar `server`, `runtime/features` no pueden importar `client`, `shared` no puede importar `client/server` y `build` no puede tocar el hot path semántico interactivo (`documentAnalysis`, `semanticQueryService`, parsing ni features interactivas);
- la allowlist mínima queda implícita en las reglas y los imports resueltos realmente por archivo, evitando depender de un listado textual frágil o de documentación manual;
- `docs/architecture.md`, `docs/testing.md`, backlog, roadmap y current-focus quedan alineados para tratar `B277` como guardrail previo del siguiente bloque visible (`B273`).

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/architectureImports.test.js`

## 1.121 B267. Runtime backpressure policy v2 for competing workloads — **Cerrada (spec 312, runtime backpressure policy v2 2026-05)**

**Objetivo:** formalizar una policy runtime global por workload para que `interactive`, `near-context`, `diagnostics`, `background-indexing`, `export-reporting`, `build`, `legacy-orca`, `ai-tooling` y `maintenance` compitan sobre el mismo scheduler sin abrir un segundo runtime ni dejar build/ORCA/reporting fuera de control.

**Resultado registrado:**
- `src/server/runtime/backpressurePolicy.ts` fija ya el registro único por workload con `lane`, `throttledByLatency` y `preemptible`, de modo que `build` y `legacy-orca` quedan preservados una vez arrancan mientras `background-indexing`, `export-reporting`, `maintenance` y `ai-tooling` siguen siendo cancelables/preemptibles;
- `src/server/runtime/scheduler.ts` consume esa policy para exponer `pendingWorkloads`, `active*Workload`, `throttledBackgroundWorkload/reason` y respetar la no preempción de `build/legacy-orca`; `src/server/analysis/diagnosticScheduler.ts` clasifica diagnostics como workload propio;
- `src/server/server.ts` ya pasa `pbAutoBuild`, ORCA, maintenance y reports read-only por el scheduler común con yielding previo y admission gating por latencia; `currentObjectContext` y `dependencyGraph` entran por `near-context`, mientras `runtimeHealth` y `statusBarPresentation` proyectan el throttling visible;
- `test/server/unit/backpressurePolicy.test.ts`, `scheduler.test.ts`, `diagnosticScheduler.test.ts`, `runtimeHealth.test.ts`, `statusBarPresentation.test.ts`, junto con la batería `currentObjectContext|impactAnalysis|safeEditPlan|safeBatchRefactorPlan|semanticWorkspaceManifest|crossProjectSymbolConflicts|workspaceMigrationAssistant|powerBuilderCodeMetrics|powerBuilderTechnicalDebtReport|pbAutoBuildRunner|orcaRunner|specDrivenPblUpdate|specDrivenPblUpdateBatch`, fijan la policy runtime y el wiring read-only/build/legacy sobre el scheduler único.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/backpressurePolicy.test.js out/test/server/unit/scheduler.test.js out/test/server/unit/diagnosticScheduler.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/safeBatchRefactorPlan.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/orcaRunner.test.js out/test/server/unit/specDrivenPblUpdate.test.js out/test/server/unit/specDrivenPblUpdateBatch.test.js`

## 1.120 B266. Query scope policy v2 and consumer budget declarations — **Cerrada (spec 311, query scope policy v2 2026-05)**

**Objetivo:** formalizar scope máximo, budget, result cap, readiness, confidence, fallback y allowances `staging/generated/external` por consumer semántico, evitando widening global y materialización no defendible fuera de policy.

**Resultado registrado:**
- `src/server/features/queryScopePolicy.ts` centraliza ya la policy v2 para `hover`, `definition`, `signatureHelp`, `completion`, `references`, `rename`, `CodeLens`, `diagnostics`, `currentObjectContext`, `impactAnalysis` y los planes seguros, con `maxScope`, `budgetMs`, `resultCap`, readiness, confidence, fallback y allowances explícitos por consumer;
- `src/server/features/referenceSourcePool.ts` y `src/server/server.ts` ya consumen esa policy para `references`, `rename` y `CodeLens`, de modo que los consumers acotados a `project` no caen a `workspace` cuando falta routing y no materializan `orca-staging/generated` por defecto;
- `src/server/features/featureReadiness.ts` deriva ya readiness/confidence/fallback del mismo registro y `signatureHelp` entra en el gate común del servidor; `completion`, `currentObjectContext` e `impactAnalysis` consumen además los caps por defecto del mismo contrato central;
- `test/server/unit/queryScopePolicy.test.ts`, `referenceSourcePool.test.ts`, `featureReadiness.test.ts`, `references.test.ts`, `rename.test.ts`, `codeLensReferences.test.ts`, `completion.test.ts`, `signatureHelp.test.ts`, `currentObjectContext.test.ts` e `impactAnalysis.test.ts` fijan la policy, el no-widening a `workspace`, la exclusión de `staging/generated` y el caso negativo de report pesado sin materialización global.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/queryScopePolicy.test.js out/test/server/unit/referenceSourcePool.test.js out/test/server/unit/featureReadiness.test.js out/test/server/unit/references.test.js out/test/server/unit/rename.test.js out/test/server/unit/codeLensReferences.test.js out/test/server/unit/completion.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/currentObjectContext.test.js out/test/server/unit/impactAnalysis.test.js`

## 1.119 B265. Incremental invalidation proof suite — **Cerrada (spec 310, incremental invalidation proof suite 2026-05)**

**Objetivo:** demostrar que cada cambio invalida solo lo necesario sin rediscovery global innecesario, cubriendo cambios cosméticos, implementation/prototype/ancestor, `.srd`/`DataObject`, markers topológicos, `sourceOrigin`, ORCA staging y external functions.

**Resultado registrado:**
- `src/server/knowledge/semanticDiff.ts` ya incorpora dependencias `DataObject`/`report`/`dddw` y trata los argumentos retrieve de `.srd` como contrato semántico, permitiendo que el fan-out incremental alcance a consumidores ligados sin abrir otro motor de invalidación;
- `test/server/unit/watchedFileIntake.test.ts` fija ya la proof suite incremental sobre snapshots, serving cache, dependency graph, manifest, diagnostics y current object context para cambios cosméticos, implementation-only, prototype-only heredado, ancestor signature, `.srd`/`DataObject`, external function, ORCA staging, markers/sourceOrigin y bursts del watcher;
- `test/server/unit/semanticDiff.test.ts` fija los nuevos dependency keys y el cambio de contrato retrieve de `.srd`, mientras `test/server/performance/large-workspace-incremental.perf.test.ts` mantiene el gate de presupuesto incremental y degradación segura para ráfagas watcher;
- `docs/testing.md`, `docs/performance-budget.md`, backlog, roadmap y current-focus dejan trazado que `B265` queda cerrada en `specs/310-incremental-invalidation-proof-suite` y que el siguiente foco canónico pasa a `B266`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticDiff.test.js out/test/server/unit/watchedFileIntake.test.js`
- `npx mocha --ui tdd out/test/server/performance/large-workspace-incremental.perf.test.js`

## 1.118 B264. Semantic consistency oracle across all read-only surfaces — **Cerrada (spec 309, semantic consistency oracle 2026-05)**

**Objetivo:** comprobar que las surfaces read-only cuentan la misma historia sobre el mismo objeto/símbolo y dejar un oracle con reason codes que detecte drift de `objectName`, `objectKind`, `project`, `library`, `sourceOrigin`, ancestros, diagnostics, readiness, confidence y DataObject bindings sin abrir otro motor semántico.

**Resultado registrado:**
- `src/server/features/powerBuilderObjectKind.ts` centraliza la inferencia de `objectKind` por URI y `src/server/features/currentObjectContext.ts` deja de publicar el `EntityKind` genérico (`Type`) para alinearse con el manifest y el resto de surfaces read-only;
- `src/server/features/semanticConsistencyOracle.ts` compone `currentObjectContext`, `semanticWorkspaceManifest`, `dependencyGraph`, diagnostics directos, `dataWindowSqlLineage` y `crossProjectSymbolConflicts` en un oracle interno con reason codes explícitos, comparación honesta de budgets truncados del manifest y detección de drift/casos ambiguos sin otra API pública;
- `test/server/unit/semanticConsistencyOracle.test.ts` fija casos sanos, divergencias forzadas y convivencia real/orca-staging; `test/server/performance/semanticConsistencyOracle.smoke.test.ts` valida además un archivo real de PFC Solution y otro de OrderEntry; `currentObjectContext.test.ts` y `semanticWorkspaceManifest.test.ts` fijan la normalización compartida de `objectKind`;
- `docs/testing.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B264` queda cerrada en `specs/309-semantic-consistency-oracle` y que el siguiente foco canónico pasa a `B265`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/semanticConsistencyOracle.test.js`
- `npx mocha --ui tdd out/test/server/performance/semanticConsistencyOracle.smoke.test.js`

## 1.117 B263. Agent-ready task execution contracts — **Cerrada (spec 308, agent-ready task execution contracts 2026-05)**

**Objetivo:** definir contratos versionados de ejecución de tareas aptos para agentes sobre la surface actual, con dry-run, límites write-enabled, receipts y handoff SDD explícitos, sin meter IA dentro del core.

**Resultado registrado:**
- `src/shared/publicApi.ts` amplía `ApiPublicContractDescriptor` con `taskExecutionCatalog`, publica contratos versionados para `applySpecDrivenPblUpdate` y `applySpecDrivenPblUpdateBatch` y deja una simulación declarativa de dry-run sobre `generateSafeEditPlan` sin abrir otro ejecutor;
- `test/server/unit/publicApi.test.ts` y `test/server/unit/supportBundle.test.ts` fijan schema, copias defensivas, receipts y compatibilidad del descriptor enriquecido con consumers existentes;
- `test/smoke/extension.test.ts` fija que el tool `contract` expone ese catálogo desde el host real de VS Code y que la activación mantiene el presupuesto contractual ya existente bajo el harness del repo;
- `docs/ai-orchestrator.md`, `docs/ai-agents-catalog.md`, `docs/spec-driven-development.md`, `docs/testing.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que toda tarea write-enabled debe partir del `taskExecutionCatalog`, citar `contractId`, dry-run y receipts antes del cierre y que el siguiente foco canónico pasa a `B264`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js`
- `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`

## 1.116 B262. Safe code action framework v2 — **Cerrada (spec 307, safe code action framework v2 2026-05)**

**Objetivo:** endurecer el carril de code actions pequeñas sobre diagnósticos reales, con catálogo versionado, preview, preflight y bloqueos defendibles antes de cualquier edit.

**Resultado registrado:**
- `src/server/features/codeActions.ts` evoluciona el provider existente a un catálogo versionado (`2.0.0`) con `actionId`, `requiredConfidence`, `evidence`, `preview` explícita y acciones bloqueadas cuando fallan preflight, `sourceOrigin` o guards de dynamic strings;
- `src/server/server.ts` propaga `sourceOrigin` contextual al provider de code actions para que la decisión use la misma proveniencia canónica que el resto del runtime;
- `src/server/features/diagnostics.ts` integra `SD7` en el pipeline general de diagnostics, de modo que Problems, explainability, métricas/reportes y code actions consumen la misma señal publicada;
- `test/server/unit/codeActions.test.ts`, `test/server/unit/diagnosticsObsoleteIntegration.test.ts`, `test/server/unit/obsolete.test.ts` y `test/smoke/code-actions.extension.test.ts` fijan catálogo, bloqueos y la integración real editor -> Problems -> CodeAction;
- `docs/rules-catalog.md`, `docs/spec-driven-development.md`, `docs/developer-workflows.md`, `docs/testing.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B262` queda cerrada y que el siguiente foco canónico pasa a `B263`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/codeActions.test.js out/test/server/unit/diagnosticsObsoleteIntegration.test.js out/test/server/unit/obsolete.test.js`
- `npx vscode-test --label smoke --grep "expone quick fixes seguras para diagnósticos obsoletos en Problems/CodeAction"`

## 1.115 B261. Technical debt and modernization report — **Cerrada (spec 306, technical debt and modernization report 2026-05)**

**Objetivo:** consolidar un informe exportable y priorizable de deuda técnica y modernización reutilizando métricas, diagnósticos, `sourceOrigin` y riesgos ORCA/PBL ya publicados, sin abrir un segundo motor de scoring.

**Resultado registrado:**
- `src/server/features/powerBuilderTechnicalDebtReport.ts` compone hotspots y recomendaciones defendibles sobre `code-metrics`, `diagnostic.code`, `sourceOrigin` summary y `workspaceMigrationAssistant`, incluyendo patrones `obsolete`, `dynamic-sql`, `datawindow-risk`, `external-dependency`, complejidad aproximada y riesgos legacy/sourceOrigin;
- `src/shared/publicApi.ts`, `src/server/server.ts`, `src/client/extension.ts` y `package.json` publican el contrato `ApiPowerBuilderTechnicalDebtReport`, el método `getPowerBuilderTechnicalDebtReport`, el tool read-only `technical-debt-report`, el comando servidor `powerbuilder.technicalDebtReport` y el comando cliente `PowerSyntax: Abrir Informe Técnico de Deuda y Modernización PowerBuilder` con export Markdown;
- `test/server/unit/powerBuilderTechnicalDebtReport.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan collector, contrato y wiring del host real, mientras `npm run test:unit` mantiene verde la regresión unitaria completa;
- `docs/developer-workflows.md`, `docs/rules-catalog.md`, `docs/architecture.md`, `docs/testing.md`, backlog, roadmap y current-focus dejan trazado que `B261` queda cerrada y que el siguiente foco canónico pasa a `B262`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/powerBuilderTechnicalDebtReport.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:unit`
- `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`

## 1.114 B260. Advanced PowerBuilder code metrics — **Cerrada (spec 305, advanced powerbuilder code metrics 2026-05)**

**Objetivo:** calcular métricas avanzadas y defendibles de código PowerBuilder sobre la base semántica real y exponerlas como reporte read-only exportable por API/tool/comando.

**Resultado registrado:**
- `src/server/features/powerBuilderCodeMetrics.ts` agrega un collector server-side que deriva por objeto funciones/eventos, complejidad aproximada, SQL embebido, DataWindows enlazadas, dependencias externas, lifecycle warnings, diagnostics por área y footprint build/ORCA reutilizando `KnowledgeBase`, snapshots publicados, bindings `DataObject`, `DiagnosticsSnapshot` y `WorkspaceState`;
- `src/shared/publicApi.ts`, `src/server/server.ts`, `src/client/extension.ts` y `package.json` publican el contrato `ApiPowerBuilderCodeMetrics`, el método `getPowerBuilderCodeMetrics`, el tool read-only `code-metrics`, el comando servidor `powerbuilder.codeMetrics` y el comando cliente `PowerSyntax: Abrir Métricas Avanzadas de Código PowerBuilder` con export Markdown;
- `test/server/unit/powerBuilderCodeMetrics.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan collector, contrato público y wiring/preview del reporte, manteniendo la surface read-only alineada con el host real;
- `docs/developer-workflows.md`, `docs/testing.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B260` queda cerrada y que el siguiente foco canónico pasa a `B261`.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit`
- `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`

## 1.113 B259. Semantic cache compaction and retention policy v2 — **Cerrada (spec 304, semantic cache compaction retention policy v2 2026-05)**

**Objetivo:** endurecer la persistencia semántica con una policy v2 observable, con TTL por workspace, budgets de disco/journal, cleanup de workspaces obsoletos y compactación segura del journal sin degradar la ruta interactiva.

**Resultado registrado:**
- `src/server/cache/cacheStore.ts` incorpora la policy v2 con `staleWorkspaceTtlMs`, budgets de journal/disco, métricas por workspace, cleanup de `workspaceKey` obsoletos y `runMaintenance()` con validación explícita del restore tras compactar;
- `src/shared/publicApi.ts`, `src/server/server.ts` y `src/server/runtime/runtimeHealth.ts` publican la policy y el snapshot de mantenimiento por `showStats`, añaden findings de persistencia y exponen el comando servidor `powerbuilder.runSemanticCacheMaintenance`;
- `src/client/extension.ts` y `package.json` exponen `PowerSyntax: Ejecutar Mantenimiento de Cache Semántica` y lo dejan disponible también desde el status menu sin abrir un carril paralelo;
- `test/server/unit/cacheStore.test.ts` fija TTL cleanup y compactación con restore validado; `test/server/unit/runtimeHealth.test.ts` fija findings nuevos de persistencia; la suite existente de `cachePersistence` sigue cubriendo corrupción simulada del payload;
- `docs/performance-budget.md`, `docs/architecture.md`, `docs/testing.md`, backlog, roadmap y current-focus dejan trazado que `B259` queda cerrada y que el siguiente foco canónico pasa a `B260`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/cacheStore.test.js out/test/server/unit/runtimeHealth.test.js`
- `npx mocha --ui tdd out/test/server/unit/cachePersistence.test.js`
- `npx mocha --ui tdd --timeout 30000 out/test/server/performance/indexer.perf.test.js --grep "Cold start|Warm start"`

## 1.112 B258. Offline support bundle / support diagnostics export — **Cerrada (spec 303, offline support bundle support diagnostics export 2026-05)**

**Objetivo:** exportar un bundle offline de soporte con estado técnico relevante, versionado y saneado, útil para troubleshooting sin copiar código bruto del workspace por defecto.

**Resultado registrado:**
- `src/client/support/supportBundle.ts` construye un support bundle cliente-side reutilizando `serverStats`, health, diagnostics snapshot, manifest semántico, gobernanza de settings y el inventario API/tool ya publicado, con redacción explícita de rutas, URIs, ejecutables y artefactos locales;
- `src/client/extension.ts` y `package.json` exponen el comando `PowerSyntax: Exportar Support Bundle Offline`, escribiendo bundles bajo `tools/support-bundles` con `runtime-health.json`, `server-stats.sanitized.json`, `diagnostics-snapshot.sanitized.json`, `semantic-workspace-manifest.reduced.json`, `runtime-journal-tail.json`, `performance-summary.json`, `settings-governance.json`, `settings-sanitized.json`, `build-orca-snapshot.json`, `public-contract.json`, `read-only-tool-bridge.json` y `api-inventory.json`;
- `test/server/unit/supportBundle.test.ts` fija esquema, inventario mínimo y redacción de rutas/settings; `test/smoke/support-bundle.extension.test.ts` valida el wiring real del comando en el host de VS Code y que no se copie código bruto por defecto;
- `README.md`, `docs/developer-workflows.md`, `docs/testing.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B258` queda cerrada y que el siguiente foco canónico pasa a `B259`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/supportBundle.test.js`
- `npm run test:smoke -- --grep "support-bundle-extension"`

## 1.111 B257. Build profiles matrix and environment validation — **Cerrada (spec 302, build profile matrix environment validation 2026-05)**

**Objetivo:** formalizar una matriz reproducible de build profiles y validación de entorno para PBAutoBuild, visible por surface read-only y sin disparar builds para conocer el estado real.

**Resultado registrado:**
- `src/client/build/pbAutoBuildProfileMatrix.ts` construye la matriz read-only combinando inventory completo de build files, capability detection de PBAutoBuild, último profile recordado y build health para proyectar perfiles `usable|ambiguous|invalid` con `canRun` explícito;
- `src/shared/publicApi.ts` eleva la API pública a `2.9.0` con `ApiPbAutoBuildCapabilitySnapshot`, `getBuildProfileMatrix`, el tool `build-profile-matrix` y el schema `ApiBuildProfileMatrix` para consumo externo estable;
- `src/server/server.ts`, `src/client/extension.ts`, `src/client/statusBarPresentation.ts` y `package.json` exponen la nueva surface por inventario servidor + API/tool/comando Markdown + acceso rápido visible desde el status report, sin crear un nuevo rail de ejecución;
- `test/server/unit/pbAutoBuildProfileMatrix.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan comportamiento, contrato y wiring end-to-end del slice;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B257` queda cerrada y que el siguiente foco canónico pasa a `B258`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildProfileMatrix.test.js out/test/server/unit/publicApi.test.js --grep "(B257|pbAutoBuildProfileMatrix|build-profile-matrix|versión exportada|descriptor contractual|bridge read-only)"`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 1.110 B256. Workspace migration assistant for legacy layouts — **Cerrada (spec 301, workspace migration assistant 2026-05)**

**Objetivo:** asistir migraciones desde layouts legacy hacia topologías soportadas por el plugin con recomendaciones read-only, explícitas y defendibles, sin escritura opaca sobre markers o build files.

**Resultado registrado:**
- `src/server/features/workspaceMigrationAssistant.ts` construye el asistente read-only reutilizando `WorkspaceState`, summary de build files, project model y aliases ORCA para recomendar consolidación de `pbl-only`, `mixed`, build files ambiguos/inválidos y staging legacy accidental;
- `src/shared/publicApi.ts` eleva la API pública a `2.8.0` con `getWorkspaceMigrationAssistant`, el tool `workspace-migration-assistant` y el schema `ApiWorkspaceMigrationAssistant` para consumo externo estable;
- `src/server/server.ts`, `src/client/extension.ts` y `package.json` exponen la nueva surface por LSP, tool bridge y el comando `PowerSyntax: Abrir Asistente de Migración de Workspace`, abriendo un Markdown lateral reutilizable incluso cuando discovery todavía degrada a `available: false`;
- `test/server/unit/workspaceMigrationAssistant.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan comportamiento, contrato y wiring end-to-end del slice, evitando una smoke frágil dependiente del timing de discovery;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B256` queda cerrada y que el siguiente foco canónico pasa a `B257`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/publicApi.test.js --grep "(B256|workspaceMigrationAssistant|workspace-migration-assistant|versión exportada|descriptor contractual|bridge read-only)"`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 1.109 B255. Cross-project symbol conflict analyzer — **Cerrada (spec 300, cross project symbol conflict analyzer 2026-05)**

**Objetivo:** detectar conflictos semánticos defendibles entre proyectos o librerías del mismo workspace reutilizando la base read-only ya indexada, con ranking y evidencia exportable.

**Resultado registrado:**
- `src/server/knowledge/resolution/semanticQueryService.ts` y `src/server/features/queryContext.ts` dejan explícita la ambigüedad cuando el fallback global devuelve múltiples winners cross-project, sin depender solo del empate por distancia;
- `src/server/features/crossProjectSymbolConflicts.ts` construye el analizador read-only agrupando por `buildSymbolKey`, enriqueciendo proyecto/librería/sourceOrigin desde `WorkspaceState` y colapsando staging o duplicados de la misma ubicación;
- `src/shared/publicApi.ts` eleva la API pública a `2.7.0` con `getCrossProjectSymbolConflicts`, el tool `cross-project-symbol-conflicts` y el schema `ApiCrossProjectSymbolConflicts` para consumo externo estable;
- `src/server/server.ts`, `src/client/extension.ts` y `package.json` exponen la nueva surface por LSP, tool bridge y el comando `PowerSyntax: Abrir Analizador de Conflictos Cross-Project`, abriendo un Markdown lateral reutilizable incluso cuando el resultado degrada a `available: false`;
- `test/server/unit/semanticQueryService.test.ts`, `test/server/unit/queryContext.test.ts`, `test/server/unit/crossProjectSymbolConflicts.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan comportamiento, contrato y wiring end-to-end del slice;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B255` queda cerrada y que el siguiente foco canónico pasa a `B256`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticQueryService.test.js out/test/server/unit/queryContext.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/publicApi.test.js --grep "(cross-project|crossProject|publicApi|cross-project-symbol-conflicts)"`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 1.108 B254. DataWindow expression diagnostics and safe completion — **Cerrada (spec 299, datawindow expression diagnostics safe completion 2026-05)**

**Objetivo:** añadir diagnósticos y completion segura sobre expresiones DataWindow reutilizando el backbone semántico ya indexado y sin abrir parsing general dentro de strings.

**Resultado registrado:**
- `src/server/features/completion.ts` deja pasar completion dentro de strings solo cuando `dataWindowPropertyPaths` reconoce un contexto DataWindow defendible, manteniendo el guard general para strings arbitrarios;
- `src/server/features/dataWindowPropertyPaths.ts` expone completion segura e inspección reutilizable sobre property paths, apoyándose en `DataWindowModel`, bindings `DataObject` y child routes `report/dddw` ya publicados;
- `src/server/features/diagnostics.ts` añade warnings conservadores para rutas DataWindow completas no resolubles solo cuando el root está enlazado de forma única, manteniendo degradación honesta cuando el binding es dinámico;
- `src/shared/diagnosticCodes.ts`, `test/server/unit/completion.test.ts`, `test/server/unit/diagnostics.test.ts`, `test/server/unit/powerbuilderSemanticGolden.test.ts` y la estabilización de `test/server/unit/definition.test.ts` fijan contrato, safety rails y convivencia con hover/definition ya cerrados;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B254` queda cerrada y que el siguiente foco canónico pasa a `B255`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js --grep "(Modify|ruta DataWindow|binding raíz es dinámico|property paths DataWindow)"`
- `npx mocha --ui tdd out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/hover.test.js out/test/server/unit/definition.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js --grep "(DataWindow|DataObject|GetChild|Modify|Describe|property paths DataWindow)"`

## 1.107 B253. Advanced DataWindow SQL lineage — **Cerrada (spec 298, datawindow SQL lineage read only 2026-05)**

**Objetivo:** trazar un lineage SQL read-only de DataWindow sobre `retrieve`, report children, dropdown children y bindings `DataObject` reales sin abrir una segunda engine semántica.

**Resultado registrado:**
- `src/server/features/dataWindowSqlLineage.ts` construye un árbol read-only de lineage SQL reutilizando `DataWindowModel`, bindings `DataObject` y child routes `report/dddw`, con estados explícitos `resolved|missing|ambiguous|dynamic` y degradación honesta cuando la ruta no es defendible;
- `src/shared/publicApi.ts` eleva la API pública a `2.6.0` con `getDataWindowSqlLineage`, el tool `datawindow-sql-lineage` y el schema `ApiDataWindowSqlLineage` para consumo externo estable;
- `src/server/server.ts`, `src/client/extension.ts` y `package.json` exponen la nueva surface por LSP, tool bridge y el comando `PowerSyntax: Abrir DataWindow SQL Lineage`, abriendo un Markdown lateral reutilizable incluso cuando el resultado degrada a `available: false`;
- `test/server/unit/dataWindowSqlLineage.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan comportamiento, contrato y wiring end-to-end del slice;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B253` queda cerrada y que el siguiente foco canónico pasa a `B254`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 1.106 B252. PowerBuilder dependency graph visual/exportable — **Cerrada (spec 297, powerbuilder dependency graph visual exportable 2026-05)**

**Objetivo:** exponer un grafo inmediato de dependencias PowerBuilder que sea navegable, visualizable y exportable sin duplicar semántica fuera del pipeline ya publicado.

**Resultado registrado:**
- `src/server/features/dependencyGraph.ts` construye un grafo read-only de vecindario inmediato a partir de snapshots, evidencias semánticas y reverse dependencies ya publicadas por `KnowledgeBase`;
- `src/shared/publicApi.ts` eleva la API pública a `2.5.0` con `getPowerBuilderDependencyGraph`, el tool `dependency-graph` y el schema `ApiPowerBuilderDependencyGraph` para consumo externo estable;
- `src/client/extension.ts` expone el grafo por API/tool bridge y añade el comando `PowerSyntax: Abrir Grafo de Dependencias PowerBuilder`, abriendo un Markdown con Mermaid en preview lateral;
- `package.json`, `test/server/unit/dependencyGraph.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan registro, contrato y comportamiento end-to-end del slice;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que el grafo queda cerrado y que el siguiente foco canónico pasa a `B253`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/dependencyGraph.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 1.105 B251. Semantic change impact diff between two workspace states — **Cerrada (spec 296, semantic snapshot diff workspace states 2026-05)**

**Objetivo:** comparar dos estados semánticos exportados del workspace y resumir cambios defendibles sin reabrir el motor semántico ni depender del estado vivo del editor.

**Resultado registrado:**
- `src/shared/publicApi.ts` amplía la API pública v2 a `2.4.0` con `diffSemanticWorkspaceSnapshots`, el tool read-only `semantic-snapshot-diff` y el schema `ApiSemanticWorkspaceSnapshotDiff`;
- `src/client/semanticWorkspaceSnapshot.ts` calcula diffs de proyectos, objetos, símbolos exportados, readiness, health, diagnósticos y `sourceOrigin` directamente sobre snapshots serializados ya exportados;
- `src/client/extension.ts` publica el diff tanto como método de API como por el bridge read-only, manteniendo el cliente como única capa de comparación y sin abrir un segundo motor;
- `test/server/unit/publicApi.test.ts`, `test/server/unit/semanticWorkspaceSnapshot.test.ts` y `test/smoke/extension.test.ts` fijan contrato, comportamiento y uso end-to-end del diff sobre snapshots reales exportados;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que el snapshot diff queda cerrado y que el siguiente foco canónico pasa a `B252`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticWorkspaceSnapshot.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 1.104 B195. ORCA executable/PBD operations behind feature flag — **Cerrada (spec 295, ORCA packaging policy behind feature flag 2026-05)**

**Objetivo:** decidir si el producto debía exponer creación de `EXE/PBD/DLL` vía ORCA sin contaminar el carril moderno de `PBAutoBuild`.

**Resultado registrado:**
- `src/shared/publicApi.ts` formaliza `orcaTooling.packagingPolicy` como parte de la capability snapshot read-only, declarando `exposure: not-exposed`, `requiresFeatureFlag: true` y los artefactos `exe/pbd/dll` como alcance explícitamente no abierto;
- `src/client/build/orcaDetection.ts` publica esa policy de forma estable en todos los estados de detección ORCA sin abrir comandos nuevos ni relajar el aislamiento del carril moderno;
- `src/client/statusBarPresentation.ts` y `src/client/projectHealthDashboard.ts` proyectan la policy en status/stats/dashboard para que soporte y mantenimiento vean la decisión sin releer código;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md` y `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` dejan alineado que el packaging ORCA no está expuesto y requeriría un feature flag dedicado antes de abrir superficie write-enabled nueva.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaDetection.test.js out/test/server/unit/statusBarPresentation.test.js out/test/server/unit/projectHealthDashboard.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.103 B198. Build/ORCA documentation and troubleshooting — **Cerrada (spec 294, build/ORCA documentation and troubleshooting 2026-05)**

**Objetivo:** dejar una guía operativa única y trazable para decidir cuándo usar `PBAutoBuild`, cuándo usar `ORCA legacy` y cómo diagnosticar ambos carriles sin reabrir arquitectura ya cerrada.

**Resultado registrado:**
- `README.md` incorpora una matriz de decisión entre carril moderno y legacy, más troubleshooting rápido orientado a comandos, settings, env vars y artefactos persistidos reales del producto;
- `docs/developer-workflows.md` añade un workflow explícito para operar y diagnosticar build/ORCA usando status bar, dashboard, stats y los artefactos `tools/pbautobuild-ci`, `.vsc-powersyntax/orca-export/*` y `.vsc-powersyntax/runtime/build-orca-journal.json`;
- `docs/testing.md`, `docs/architecture.md` y `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` dejan alineado el baseline de validación documental, el estado arquitectónico y la frontera entre guía operativa y guía técnica del runtime;
- backlog, roadmap y current-focus dejan de tratar `B198` como deuda abierta y mueven el foco canónico a `B195`.

**Validación registrada:**
- auditoría documental local contra `package.json`, comandos visibles, settings y rutas de artefactos del runtime;
- `npm run build:test`

## 1.102 B200. Bulk PBL export/import orchestration — **Cerrada (spec 282, bulk PBL export/import orchestration 2026-05)**

**Objetivo:** coordinar varias actualizaciones PBL sobre el workflow unitario ya cerrado en `B199` sin reabrir ORCA, manteniendo trazabilidad por item, corte temprano opcional y agregación defendible del resultado batch.

**Resultado registrado:**
- `src/shared/publicApi.ts`, `src/client/extension.ts` y `src/server/server.ts` publican `applySpecDrivenPblUpdateBatch()` como surface versionada para batches de requests con `stopOnError` y resultado agregado por item;
- `src/server/build/specDrivenPblUpdate.ts` añade la orquestación batch secuencial reutilizando `applySpecDrivenPblUpdate()`, carga documental por item, journaling agregado y resumen `blocked/succeeded/blockedCount/stoppedEarly` sin duplicar el rail ORCA;
- `test/server/unit/specDrivenPblUpdateBatch.test.ts` fija el caso feliz multi-item, el corte temprano cuando `stopOnError` es `true` y la continuación explícita cuando se desactiva;
- el carril legacy queda ya automatizado tanto en modo unitario como batch, y el foco puede volver a la rama semántica profunda de DataWindow (`B081`).

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/specDrivenPblUpdateBatch.test.js out/test/server/unit/specDrivenPblUpdate.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.101 B199. Spec-driven PBL update workflow — **Cerrada (spec 281, spec-driven PBL update workflow 2026-05)**

**Objetivo:** permitir que una spec automatice un cambio controlado sobre una sola PBL legacy sin inventar un motor nuevo, reutilizando el safe edit plan, el export/import ORCA ya cerrados y la observabilidad persistente del carril legacy.

**Resultado registrado:**
- `src/shared/publicApi.ts`, `src/client/extension.ts` y `src/server/server.ts` publican la API/versioned command `applySpecDrivenPblUpdate`, resolviendo editor activo/posición igual que `impactAnalysis` y `safeEditPlan` pero permitiendo además edits explícitos sobre staging;
- `src/server/build/specDrivenPblUpdate.ts` orquesta `safeEditPlan`, export ORCA fresco, resolución de archivos staged mediante `trackedSources`, aplicación de edits explícitos y `runOrcaStagingImport()` sobre el mismo rail seguro con backup, ledger y journal técnico ya existentes;
- el workflow bloquea cambios fuera del safe edit plan actual y no degrada la regla `source real > orca-staging` ni los gates de `stale staging` cerrados en `B192/B196`;
- `test/server/unit/specDrivenPblUpdate.test.ts` fija el caso feliz de export + edit + import y el bloqueo cuando el edit queda fuera del plan seguro.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/specDrivenPblUpdate.test.js out/test/server/unit/orcaStagingImport.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.100 B197. Build and ORCA event journal — **Cerrada (spec 280, build and ORCA event journal 2026-05)**

**Objetivo:** dejar una traza técnica persistente y reutilizable de build/ORCA sin abrir un subsistema de logging paralelo al `RuntimeJournal` ya cerrado en `B163`.

**Resultado registrado:**
- `src/server/runtime/runtimeJournal.ts` ahora acepta observers y `src/server/runtime/buildOrcaJournalStore.ts` proyecta solo `phase: build|legacy` a `.vsc-powersyntax/runtime/build-orca-journal.json`, con restore y ring buffer persistente por workspace;
- `src/server/server.ts` conecta ese store al `RuntimeJournal`, expone `showStats.persistence.buildOrcaJournalUri`, enriquece los eventos de `pbautobuild-problems` con contexto del build file y registra eventos específicos de export ORCA además del runner genérico;
- `src/shared/publicApi.ts` publica la nueva URI persistente y mantiene intacto el snapshot exportable del journal en memoria;
- `test/server/unit/buildOrcaJournalStore.test.ts`, `runtimeJournal.test.ts`, `pbAutoBuildRunner.test.ts` y `orcaRunner.test.ts` fijan persistencia, restore, ring buffer y compatibilidad con los runners ya cerrados.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/runtimeJournal.test.js out/test/server/unit/buildOrcaJournalStore.test.js out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/orcaRunner.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.99 B196. PBL/source synchronization safety — **Cerrada (spec 279, PBL/source synchronization safety 2026-05)**

**Objetivo:** impedir que el import ORCA toque una PBL con staging obsoleto respecto al source real, sin bloquear el caso válido en el que solo se edita staging a propósito para un workflow posterior.

**Resultado registrado:**
- `src/server/build/orcaStagingExport.ts` persiste fingerprints textuales del source real rastreado por librería en `last-export.state`, reutilizando el routing del workspace para enlazar source real y export ORCA;
- `src/server/build/orcaStagingImport.ts` amplía el preflight de `import` para comparar los objetos staged con esos fingerprints persistidos, bloquear `PB-PBL-001` cuando el source real cambió desde el export y rechazar conflictos por múltiples candidatos de source real;
- `src/shared/orcaProtocol.ts` publica los nuevos códigos de preflight `stale-staging` y `source-conflict` sin abrir un canal diagnóstico separado del rail ORCA;
- `test/server/unit/orcaStagingImport.test.ts` fija que el import sigue siendo válido cuando solo cambia staging y se bloquea cuando cambió el source real desde el export.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaStagingImport.test.js out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/fileSystem.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.98 B194. ORCA regenerate and rebuild commands — **Cerrada (spec 278, ORCA regenerate/rebuild commands 2026-05)**

**Objetivo:** completar la operativa legacy visible tras `B193`, exponiendo `regenerate/rebuild` sobre el mismo carril ORCA seguro sin abrir un segundo motor ni relajar preflight/backup.

**Resultado registrado:**
- `src/server/build/orcaStagingImport.ts` se generaliza como rail write-enabled ORCA y reutiliza preflight, backup binario, `compileResult` y ledgers persistidos para `regenerate` y `rebuild` además del import ya cerrado;
- `src/shared/orcaProtocol.ts` y `src/server/server.ts` publican los nuevos contratos/comandos `powerbuilder.regenerateOrcaLibraries` y `powerbuilder.rebuildOrcaProject`, bloqueando rebuild cuando el export persistido no tiene target/project legacy válido;
- `src/client/extension.ts`, `src/client/build/orcaDetection.ts` y `package.json` publican `vscPowerSyntax.regenerateOrcaLibraries` y `vscPowerSyntax.rebuildOrcaProject` en command palette/status menu sobre el mismo rail visible del cliente;
- `test/server/unit/orcaStagingImport.test.ts` y la smoke ORCA de `test/smoke/extension.test.ts` fijan el script `regenerate`, el bloqueo de `rebuild` sin target persistido y el registro visible de los comandos nuevos.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaStagingImport.test.js out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/fileSystem.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.97 B193. ORCA import and compile controlled — **Cerrada (spec 277, ORCA import/compile controlled 2026-05)**

**Objetivo:** importar source desde ORCA staging de forma explícita, controlada y observable, con preflight mínimo, backup binario, compile result y rollback documentado antes de abrir regenerate/rebuild.

**Resultado registrado:**
- `src/server/build/orcaStagingImport.ts`, `src/server/build/orcaStagingExport.ts` y `src/shared/orcaProtocol.ts` materializan el rail de import/compile sobre `last-export.state`, la captura de fingerprints de PBL, el backup binario real, `import-from-staging.orc` y `last-import-ledger.json` con `compileResult` y rollback disponible;
- `src/server/system/fileSystem.ts` añade `copyFile()` para preservar PBL binarias reales y `src/server/server.ts` expone `powerbuilder.importOrcaStaging` reutilizando el `OrcaRunner` y el `RuntimeJournal` ya cerrados;
- `src/client/extension.ts`, `src/client/build/orcaDetection.ts` y `package.json` publican `vscPowerSyntax.importOrcaStaging` en command palette y status menu, manteniendo la UX ORCA en el mismo carril visible del cliente;
- `test/server/unit/orcaStagingImport.test.ts`, `orcaStagingExport.test.ts`, `fileSystem.test.ts` y la smoke ORCA de `test/smoke/extension.test.ts` fijan el preflight por fingerprint mismatch, el backup binario, el ledger persistido y el wiring visible del comando.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaStagingImport.test.js out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/fileSystem.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.96 B191. ORCA export to staging source — **Cerrada (spec 275, ORCA staging export 2026-05)**

**Objetivo:** exportar roots `.pbl` a un staging indexable y reproducible sin tocar la PBL binaria, reutilizando el adapter ORCA ya cerrado y sin abrir todavía prioridad de source ni import/compile.

**Resultado registrado:**
- `src/shared/orcaProtocol.ts`, `src/server/build/orcaStagingExport.ts` y `src/server/server.ts` introducen la preparación server-side del export ORCA, el `script` pborca-compatible, el `state` persistido y la restauración de aliases tras discovery para `.vsc-powersyntax/orca-export/{orca-staging,scripts,state}`;
- `src/server/workspace/workspaceState.ts`, `projectRouting.ts`, `projectRegistry.ts`, `unifiedProjectModel.ts` y `src/server/features/semanticWorkspaceManifest.ts` resuelven aliases explícitos desde cada carpeta staging hacia la librería `.pbl` original, evitando materializar el staging como una librería nueva;
- `src/client/extension.ts`, `package.json` y `.gitignore` publican `vscPowerSyntax.exportOrcaStaging`, la setting `vscPowerSyntax.legacy.orcaSessionDll`, el fallback `PB_ORCA_DLL`/`pborc250.dll` y formalizan `orca-export` como artefacto local ignorado;
- `test/server/unit/orcaStagingExport.test.ts`, `workspace.test.ts`, `semanticWorkspaceManifest.test.ts` y la smoke ORCA de `test/smoke/extension.test.ts` fijan el layout, el alias restore y el wiring visible del comando.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/workspace.test.js out/test/server/unit/semanticWorkspaceManifest.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.95 B190. PBL library graph and directory discovery read-only — **Cerrada (spec 274, PBL graph/discovery read-only 2026-05)**

**Objetivo:** entender workspaces legacy basados en `.pbl` como topología read-only real, sin staging aún y sin tocar PBL binaria.

**Resultado registrado:**
- `src/server/workspace/workspaceState.ts` detecta `pbl-only` cuando el discovery solo encuentra roots `.pbl` y deja de degradar ese caso a `unknown`;
- `src/server/workspace/projectRouting.ts`, `projectRegistry.ts` y `unifiedProjectModel.ts` sintetizan nodos legacy `kind: library` para roots `.pbl` no cubiertos por `.pbt/.pbproj`, de forma que el proyecto activo y el routing read-only funcionen también en PBL-only;
- `src/shared/publicApi.ts` y `src/server/features/semanticWorkspaceManifest.ts` publican esa topología legacy en el manifest read-only consumido por dashboard/Object Explorer;
- `test/server/unit/workspace.test.ts`, `semanticWorkspaceManifest.test.ts`, `objectExplorerModel.test.ts`, `watchedFileIntake.test.ts` y la smoke focal del Object Explorer fijan el comportamiento de discovery, manifest y UX visible.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/workspace.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/watchedFileIntake.test.js`
- `npm run test:smoke -- --grep "Object Explorer"`

## 1.94 B189. ORCA capability detection and environment validation — **Cerrada (spec 273, capability/env validation 2026-05)**

**Objetivo:** detectar cuándo ORCA legacy puede usarse realmente, degradar con mensajes honestos cuando falta el tool o el entorno es inválido y publicar esa capability sin contaminar el hot path.

**Resultado registrado:**
- `src/shared/publicApi.ts` añade `ApiOrcaCapabilitySnapshot` y `orcaTooling` para que la capability ORCA viaje en el snapshot público visible;
- `src/client/build/orcaDetection.ts` resuelve capability ORCA en Windows desde `vscPowerSyntax.legacy.orcaPath` o `PB_ORCA_PATH`, distingue rutas ausentes/directorios inválidos y evita autodetección difusa por instalaciones locales;
- `src/client/extension.ts`, `src/client/statusBarPresentation.ts` y `src/client/projectHealthDashboard.ts` consumen `orcaTooling` para ejecutar ORCA con preflight visible y proyectar capability + runner en menú, tooltip, stats y dashboard;
- `test/server/unit/orcaDetection.test.ts`, `test/server/unit/statusBarPresentation.test.ts`, `test/server/unit/projectHealthDashboard.test.ts` y la smoke focal en `test/smoke/extension.test.ts` fijan la detección, la proyección visible y el comando end-to-end sobre un ejecutable de prueba.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaDetection.test.js out/test/server/unit/statusBarPresentation.test.js out/test/server/unit/projectHealthDashboard.test.js`
- `npm run test:smoke -- --grep "adapter ORCA legacy"`

## 1.93 B188. ORCA adapter architecture — **Cerrada (spec 272, ORCA adapter architecture 2026-05)**

**Objetivo:** abrir un adapter ORCA opcional, out-of-process y separado del hot path, con el mínimo wiring necesario para invocar scripts legacy sin contaminar discovery, semántica ni staging.

**Resultado registrado:**
- `src/shared/orcaProtocol.ts`, `src/server/build/orcaRunner.ts` y `src/server/server.ts` introducen un runner ORCA cancelable, observable en `showStats` y accesible por `powerbuilder.runOrcaScript/cancelOrcaScript` sin mezclarlo con el backbone semántico moderno;
- `src/client/extension.ts` y `package.json` registran `vscPowerSyntax.runActiveOrcaScript` y `vscPowerSyntax.cancelOrcaScript`, apoyados en `vscPowerSyntax.legacy.orcaPath` como configuración explícita hasta que exista capability detection real;
- `src/client/projectHealthDashboard.ts` deja de tratar ORCA como hueco abstracto y refleja el snapshot real del adapter base en el dashboard de salud;
- `test/server/unit/orcaRunner.test.ts`, `test/server/unit/projectHealthDashboard.test.ts` y la smoke focal en `test/smoke/extension.test.ts` validan el runner, la observabilidad mínima y la ejecución end-to-end con un ejecutable de prueba.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaRunner.test.js out/test/server/unit/projectHealthDashboard.test.js out/test/server/unit/currentObjectContextPanelModel.test.js`
- `npm run test:smoke -- --grep "adapter ORCA legacy sobre el archivo activo"`

## 1.69 B067. Formateador configurable — **Cerrada (formatter conservador cliente-side 2026-05)**

**Objetivo:** formateo configurable solo sobre base sintáctica/semántica fiable.

**Resultado registrado:**
- `src/shared/formatting/powerBuilderFormatter.ts` introduce un formatter conservador, puro y configurable que respeta strings/comentarios y opera solo sobre un subconjunto PowerScript soportado;
- `src/client/formatting/registerFormatting.ts` registra `DocumentFormattingEditProvider` y `formatOnSave`, manteniendo el cliente ligero y dejando el motor reutilizable fuera de VS Code;
- `package.json` publica settings explícitas (`keywordCase`, `statementCase`, `eventKeywordCase`, indentación, espacios y `formatOnSave`) para controlar el comportamiento sin tocar DataWindow ni abrir un parser paralelo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/powerBuilderFormatter"`
- `npm run test:smoke -- --grep "smoke/formatting-extension"`

### Resultado técnico registrado

`B063` deja de ser un contador plano por URI y queda cerrada como snapshot diagnóstico agrupado y versionado:

- `buildDiagnosticsSnapshot()` agrupa ahora por proyecto y por objeto, conserva `documentVersion` y `snapshotVersion`, y mantiene además la vista agregada por archivo/código/severidad para no perder consumidores previos;
- `publishDiagnostics()` deja de mantener un resumen ad hoc divergente y reutiliza el mismo contrato enriquecido, con limpieza coherente al cerrar o eliminar archivos;
- `powerbuilder.showStats` y la API pública mínima heredan ese snapshot agrupado como surface exportable ligera, sin introducir una UI nueva ni duplicar lógica de agregación.

### Documentación afectada

- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/053-diagnostics-snapshot/spec.md`
- `specs/053-diagnostics-snapshot/plan.md`
- `specs/053-diagnostics-snapshot/tasks.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/diagnosticsSnapshot|unit/diagnostics"`
- `npm test` → smoke `2 passing`, unit `406 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

# 2. Auditoría 2026-04 — bugs críticos corregidos

## B143 — `end if` cerraba el scope de la función — **Corregido**
**Síntoma:** `END_GENERIC_PATTERN = /^end\s+/i` cerraba funciones con `end if`, `end choose`, `end try`, etc.

**Fix registrado:**
- cierre solo con `END_FUNCTION_PATTERN | END_SUBROUTINE_PATTERN | END_EVENT_PATTERN | END_ON_PATTERN`;
- `end type` cierra explícitamente `currentTypeScope`.

**Tests:** `documentAnalysis.test.ts` + fixture `function_with_endif.sru`.

---

## B144 — Declaraciones múltiples no detectadas — **Corregido**
**Síntoma:** `Integer li_a, li_b, li_c` solo registraba el primer identificador.

**Fix registrado:**
- `extractAdditionalNames()`;
- un símbolo por identificador adicional con mismo `datatype/access`.

---

## B145 — IF multi-línea con continuación `&` — **Corregido**
**Síntoma:** `if a > 0 and & \n b < 10 then` no abría correctamente el bloque IF.

**Fix registrado:**
- `validateStructure` acumula líneas lógicas con continuación `&`.

---

## B146 — Parser de parámetros más robusto — **Corregido**
**Síntoma:** `pushScopeArguments` perdía el nombre real en casos como `readonly ref string as_arr[]`.

**Fix registrado:**
- ignora múltiples modificadores iniciales;
- limpia el sufijo `[...]` del nombre.

---

## B149 — SD2 ya no recompila el regex por línea — **Corregido**
**Síntoma:** `validateSemantics` construía `new RegExp(...)` por cada línea visitada en cada scope.

**Fix registrado:**
- `SD2_CALL_REGEX` elevado a constante de módulo;
- `lastIndex` reseteado antes de cada línea.

---

# 3. Sprint de hardening del core (specs 063–082)

**Resultado global:** 275 tests verdes.

## Resueltos
- **Spec 063 — Sub-scope tracker.** `parsing/controlBlocks.ts` con `scanControlBlocks()`; cierra B148.
- **Spec 064 — Multi `type ... within` real.** `documentAnalysis` resuelve `containerName` por anidación efectiva; cierra B147.
- **Spec 065 — `getScopeAt` O(log n).** Índice plano ordenado por `startLine`.
- **Spec 067 — Default param values.** `pushScopeArguments` ignora lo posterior a `=`.
- **Spec 069 — `try/catch/finally` tracking.** Cubierto por `controlBlocks`.
- **Spec 071 — Stable scope IDs.** `stableScopeId(container, name)` en minúsculas.
- **Spec 072 — Dedup robusto.** `mapToSemanticFacts` deduplica por `(kind, container, name)`.
- **Spec 073 — Cancelación cooperativa.** `workspaceIndexer` re-comprueba `token.isCancelled` tras yield.
- **Spec 074 — Document fingerprint.** `DocumentAnalysis.fingerprint` FNV-1a 32-bit.
- **Spec 075 — URI normalization.** `projectRegistry` normaliza marker URIs y libraries.
- **Spec 078 — SD8 declaración duplicada.** Warning por nombre local duplicado.
- **Spec 079 — SD9 `return` huérfano.** Warning fuera de function/subroutine/event/on.
- **Spec 080 — SD10 `exit`/`continue` huérfano.** Warning fuera de bucle.
- **Spec 081 — `END_GENERIC_PATTERN` fuera de SD2.** `visitScopes` enumera cierres reales.
- **Spec 082 — EOF estable.** Regresión preventiva documentada.

## Confirmados como ya correctos
- **Spec 076** (`next [var]` vs `next_xxx`).
- **Spec 077** (`do ... loop while|until expr`).

## Documentación / consumo
- **Spec 066** multi-line impl header con `&`: documentado, sin cambio invasivo.
- **Spec 068** `static`: sin evidencia real en corpus actuales.
- **Spec 070** consumidor centralizado de stripper: ya mayoritariamente cubierto por `analysis.strippedLines`.

---

# 4. Sprint de hardening 2 (specs 083–102)

**Resultado global:** 278 tests verdes (275 baseline + 3 nuevos).

## Resueltos
- **Spec 083 — analysisCache LRU bound.** `MAX_CACHED_ANALYSES = 256`.
- **Spec 084 — Invalidación en cascada.** Limpia también `DocumentCache` y `KnowledgeBase`.
- **Spec 085 — URI normalization en boundary.** `getDocumentAnalysis` normaliza la URI al guardar/leer cache.
- **Spec 087 — BOM strip.** U+FEFF eliminado antes de tokenizar.
- **Spec 092/093/094 — Diagnostic dedup + cap.** dedup + máximo 500 diagnósticos por archivo.
- **Spec 095 — PROGRESS_INTERVAL configurable.** `PB_PROGRESS_INTERVAL`.
- **Spec 096 — projectRegistry orden estable.** listas ordenadas alfabéticamente.
- **Spec 097 — Indexer orden estable.** archivos procesados en orden lexicográfico.
- **Spec 099 — getStats expone indexedScopes.** observabilidad del coste del scopeIndex.
- **Spec 100 — Perf log opt-in.** `PB_PERF_LOG=1` advierte si `analyzeDocument` supera 100ms.
- **Spec 101 — Test fingerprint estable.** contrato FNV-1a determinista.
- **Spec 102 — Test containerAt anidado.** varios `type within`.

## Confirmados como ya correctos
- **Spec 086** `findDefinition` case-insensitive.
- **Spec 088** default param stripper ya cubierto.
- **Spec 089** `matchVariableDeclaration` robusto.
- **Spec 090** `stripCommentsSmart` sin sangrado entre líneas.
- **Spec 091** `getScopeAt` defensivo.
- **Spec 098** `KnowledgeBase.removeDocument` limpia estructuras relevantes.

---

# 5. Sprint de hardening 3 (specs 103–132)

**Resultado global:** 287 tests pasando (278 baseline + 9 nuevos), sin regresiones.

## Wave A — Wiring de features existentes
- **Spec 103 — Code actions wiring.** `provideCodeActions` conectado.
- **Spec 104 — CodeLens wiring.** `provideReferenceCodeLenses` conectado.
- **Spec 105 — Rename wiring.** `onPrepareRename` + `onRenameRequest` con `validateRenameTarget`.
- **Spec 106 — Execute command.** comando `powerbuilder.showStats`.
- **Spec 107 — Server stats snapshot.** snapshot agregado de KB, scheduler y workspace.

## Wave B — Análisis core
- **Spec 108 — Logical statements.** `DocumentAnalysis.logicalStatements`.
- **Spec 109 — findCallable.** `KnowledgeBase.findCallable(name, container?)`.
- **Spec 110 — Signature label.** `enrichEntity` deriva `signatureLabel` y `kindLabel`.
- **Spec 111 — Fingerprint shortcut.** reuse sin reparseo si el contenido es idéntico.
- **Spec 112 — Analysis cache stats.** `getAnalysisCacheStats()`.

## Wave C — Diagnostics nuevos
- **Spec 113 — SD11 unreachable.** línea ejecutiva tras `return` en el mismo bloque.
- **Spec 114 — SD12 unbalanced parens.** conteo simple por línea.
- **Spec 115 — SD13 missing return.** función con `returnType` declarado sin `return`.
- **Spec 116 — Severity overrides.** `PB_SEVERITY_OVERRIDES`.
- **Spec 117 — Diagnostics summary.** `getDiagnosticsSummary(uri?)`.

## Wave D — Cache y serving
- **Spec 118 — ServingCache TTL.** eviction al expirar.
- **Spec 119 — HotContextCache cap.** LRU explícito de 128 tipos.
- **Spec 120 — DocumentCache uris.** `getCachedUris()` y `getStats()`.
- **Spec 121 — ServingCache stats.** hits/misses/evictions/ttl.
- **Spec 122 — KB resync batch.** `resyncDocuments(updates[])`.

## Wave E — Indexer y scheduler
- **Spec 123 — File state machine.** `FileIndexState` y `getFileIndexState(uri)`.
- **Spec 124 — Active priority.** `indexWorkspace(..., activeUri?)` mueve el archivo activo al frente.
- **Spec 125 — Time slice budget.** `PB_TIME_SLICE_MS`.
- **Spec 126 — Max file bytes.** `PB_MAX_FILE_BYTES` con `Skipped` para archivos enormes.
- **Spec 127 — Indexer status.** `getIndexerStatus()`.

## Wave F — Tools y regresión
- **Spec 128 — Public API stats.** `ApiServerStats`.
- **Spec 129 — Public API project.** `ApiProjectInfo`.
- **Spec 130 — Public API diag tree.** `ApiDiagnosticsTreeNode`.
- **Spec 131 — Perf regression.** `perfRegression.test.ts`.
- **Spec 132 — Corpus regression.** `corpusRegression.test.ts` con fragmentos canónicos.

## Resultado funcional destacado
- 4 capabilities LSP nuevas:
  - codeAction;
  - codeLens;
  - rename;
  - executeCommand.

---

# 6. Notas de absorción / trazabilidad

## Ítems absorbidos en backlog activo nuevo

Los siguientes ítems no aparecen ya como piezas separadas en el backlog activo nuevo porque su evolución queda absorbida en líneas más fuertes del core:

- **B135** → absorbido por el snapshot semántico canónico y el nuevo núcleo documental.
- **B136** → absorbido por la línea de semantic evidence de primera clase.
- **B137** → absorbido por ancestor navigation + hierarchy inspection.

## Ítems parciales que permanecen en el backlog activo

Tras la normalización 2026-05, las antiguas épicas legacy ya no viven como `Partial`: vuelven a `Open` cuando el trabajo pendiente no cabe honestamente en un único corte. Después de `Specs 198-218`, ya no queda ningún residual `Partial` heredado de esa ola: `B141A` se cierra con `Spec 218` y el resto del trabajo abierto debe seguir leyéndose directamente desde el backlog activo bajo estado `Open`, `Ready for closure` o `Blocked`.

---

# 7. Uso recomendado

- Usar este archivo como **histórico técnico de referencia**.
- Usar el **backlog activo** para planificación diaria.
- No volver a mezclar aquí trabajo abierto salvo que se cierre completamente.
