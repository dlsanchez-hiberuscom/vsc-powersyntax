# Architecture.md — versión IA-first LEAN

## 1. Objetivo

Definir la arquitectura base del plugin profesional de **PowerBuilder 2025 para Visual Studio Code**.

La arquitectura debe garantizar:

- carga rápida;
- activación perezosa;
- impacto mínimo en el Extension Host;
- descubrimiento e indexación muy rápidos sin bloquear;
- base semántica reutilizable;
- escalabilidad en workspaces grandes y legacy;
- mantenibilidad a largo plazo;
- evolución incremental sin rehacer el núcleo;
- y preparación futura para automatización/IA mediante contratos públicos, no mediante acoplamiento al core.

---

## 2. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Toda decisión arquitectónica debe proteger simultáneamente:

1. descubrimiento rápido;
2. indexación progresiva no bloqueante;
3. prioridad real al archivo activo;
4. latencia interactiva baja;
5. persistencia útil entre sesiones;
6. estado observable del motor;
7. semántica fuerte sin sacrificar tiempo hasta valor;
8. degradación segura cuando no exista contexto suficiente.

---

## 3. Decisiones arquitectónicas base

La arquitectura oficial es:

- **cliente ligero en VS Code**;
- **servidor LSP separado**;
- **prioridad absoluta al archivo activo**;
- **core semántico compartido y agnóstico del editor**;
- **análisis incremental, cancelable y observable**;
- **persistencia y caché como capacidades de primer nivel**;
- **readiness/evidence/confidence como contratos transversales**;
- **source origin explícito para evitar mezclar source real, staging y generado**;
- **features y UX como adaptadores finos**;
- **documentación viva alineada con el estado real del repositorio**.

---

## 4. Principios arquitectónicos

### 4.1 Cliente mínimo real

El cliente solo debe encargarse de:

- activación mínima;
- lifecycle del cliente LSP;
- exportación de API pública mínima y versionada;
- comandos ligeros;
- configuración;
- estado visible básico;
- bridge con el servidor.

No debe contener análisis profundo ni semántica del lenguaje.

Estado cliente vigente para ese principio:

- `src/client/commandRegistration.ts` concentra ya el wiring declarativo de command IDs del producto en vez de mantenerlo mezclado con `activate()`;
- `extension.ts` conserva lifecycle, bridge y handlers ligeros, mientras `powerbuilderObjectExplorer`, `powerbuilderCurrentObjectContext` y `powerbuilderDiagnosticsExplainability` se materializan bajo demanda mediante `ensure*Controller()` en lugar de crear `TreeView` eagerly durante la activación;
- la API pública exportada sigue siendo versionada y estable, pero su materialización real deja de pagarse de forma eager antes de que exista un consumer efectivo.

Guardrails estructurales vigentes para sostener ese principio:

- `test/server/unit/architectureImports.test.ts` mantiene el firewall por capas entre `client`, `server`, `shared`, `knowledge/parsing/utils` y `build`;
- `npm run test:architecture:metrics` complementa ese firewall con budgets explícitos para `src/client/extension.ts`, `src/server/server.ts` y `src/client/commandRegistration.ts`;
- los slices generated/manual grandes del catálogo quedan allowlisted con budgets propios en `tools/run-architecture-hotspot-guard.mjs`, de modo que el crecimiento de source-of-truth no se confunda con drift del host cliente/servidor;
- el runner deja `artifacts/performance/architecture-hotspot-guard.json` y emite warnings al llegar al `90%` del budget, pero no sustituye `npm run test:architecture:rapid` cuando un cambio toca runtime real o corpora PFC/STD.

### 4.2 Servidor como runtime principal del conocimiento

El servidor LSP es responsable de:

- parseo;
- indexación;
- semántica;
- resolución;
- diagnósticos;
- navegación;
- serving de capacidades de lenguaje.

### 4.3 Core agnóstico del editor

El core no debe depender directamente de:

- VS Code;
- LSP;
- JSON-RPC;
- DTOs externos;
- herramientas de IA concretas.

Toda integración externa debe resolverse en adaptadores de borde.

### 4.4 Fuente única de verdad semántica

La arquitectura debe converger a una base común donde:

- la sintaxis se representa una sola vez;
- símbolos y scopes se construyen una sola vez;
- la resolución se centraliza;
- las features consumen consultas compartidas;
- ninguna feature reconstruye semántica por su cuenta;
- la identidad exacta de símbolo se serializa una sola vez mediante `buildSymbolKey`, y la única agregación relajada permitida es `buildConflictFamilyKey` para conflictos cross-project/cross-library.

### 4.5 Atomicidad del estado semántico

El sistema no debe exponer estados a medias. Los cambios relevantes del conocimiento compartido deben publicarse de forma coherente y atómica, o con degradación explícita y segura.

### 4.6 Incrementalidad fina

El sistema debe recalcular solo lo necesario. La invalidación debe ser fina, explícita y basada en impacto semántico real siempre que sea posible.

### 4.7 Persistencia robusta

La caché y la persistencia deben diseñarse con:

- versionado;
- invalidación clara;
- recuperación segura;
- estrategia explícita de reanudación;
- journaling cuando aplique.

Política vigente de schema persistente:

- payloads compatibles del schema actual, o payloads heredados sin campos opcionales/materializados, se normalizan mediante migradores internos antes del restore;
- cualquier `schemaVersion` desconocido o incompatible fuerza `rebuild` limpio, sin migraciones ad hoc en caliente;
- la política oficial es `migrate cuando la compatibilidad es estructuralmente segura, rebuild cuando no lo es`.
- el mismo criterio aplica a payloads exportables versionados del carril cliente: `semanticWorkspaceSnapshot` puede recomputar campos derivados como `summary` y normalizar ausencia de `schemaVersion` cuando la estructura sigue siendo segura; manifests, support bundles y contratos públicos se congelan con fixtures versionadas y no admiten compatibilidad silenciosa fuera de ese carril explícito.

### 4.8 Explicabilidad y observabilidad

El motor debe poder exponer:

- qué está haciendo;
- qué parte del workspace está lista;
- qué caché está reutilizando;
- por qué una query devolvió un resultado;
- por qué una feature degrada o bloquea una operación.

### 4.9 Source origin como principio arquitectónico

Toda entidad semántica debe poder expresar, cuando aplique, el origen de su fuente:

```text
solution-source
workspace-ws_objects
pbl-folder-source
orca-staging
pbl-dump-source
generated
unknown
```

Reglas:

- source real gana a staging;
- staging ORCA no equivale a source canónico;
- source generado no debe alimentar rename/import sin validación;
- operaciones peligrosas requieren source origin confiable.

Estado operativo actual:

- `KnowledgeBase`, `semanticQueryService` y `semanticWorkspaceManifest` ya consumen esa misma prioridad de `sourceOrigin`, de forma que un duplicado entre source real y `orca-staging` se sirve primero desde el origen real y el staging queda como backing read-only.

### 4.10 Readiness, evidence y confidence como contrato transversal

Las features no deben decidir localmente si un resultado es seguro. El sistema debe exponer contratos compartidos para:

- readiness;
- evidence;
- reason codes;
- confidence;
- degradación;
- bloqueo de operaciones peligrosas.

Deben consumir esos contratos:

- hover;
- completion;
- definition;
- references;
- rename;
- CodeLens;
- code actions;
- future tools/API/IA.

### 4.11 Estado real reciente

El repositorio ya materializa un primer corte operativo de:

- snapshot semántico canónico por documento;
- `KnowledgeBase` con publicación atómica y `semanticEpoch`;
- semantic diff, dependencias inversas e invalidación dirigida/transitiva;
- indexación estructural + enriquecida con prioridad al activo;
- budgets adaptativos, preempción y modo degradado;
- `UnifiedProjectModel` como base topológica compartida;
- cacheStore, workspaceKey estable, checkpoints y journals persistidos por proyecto, con policy v2 de retención/compactación, métricas de disco, cleanup TTL por workspace y comando local de mantenimiento fuera del hot path;
- warm resume de `DocumentCache` + `KnowledgeBase`;
- `ServingCache` extendido a hover/definition/signatureHelp/completion;
- `EntityLineage` como contrato de provenance/origen/fase/fiabilidad, ahora con `sourceOrigin` compartido con discovery, diagnostics y API pública;
- metadata contractual de símbolo (`declarationScope`, `fileObjectName`, `containerSignature`, `ownerName`, `implementationKind`, `returnType`) ya sale del análisis y no se reconstruye por feature;
- rail reproducible de generación oficial del catálogo restaurado sobre `script/generate_official_function_catalog.cjs` y el wrapper `scripts/`, regenerando `generated.generated.ts`, `ownerTypes.generated.ts`, `provenance.generated.ts` y `officialCoverage.generated.ts` con cobertura agregada para `global-functions`, `object-functions`, `datawindow-functions`, `system-events` y `statements`;
- oficialización de `keywords` y `reserved-words` sobre ese mismo rail, extendiendo `generated.generated.ts` con `PB_GENERATED_KEYWORDS`/`PB_GENERATED_RESERVED_WORDS` y `generatedKeywordLexemes.generated.ts` para mantener `PB_KEYWORDS` alineado con el vocabulario oficial sin convertir `pronouns` ni `system-globals` en la fuente primaria del dominio;
- hardening curado de `operators`, `pronouns`, `enumerated-types` y `enumerated-values` como dominios separados del vocabulary rail: los tipos enumerados ya son canónicos sin sufijo `!`, los valores conservan `!` y los tests del catálogo bloquean solapes accidentales con `keywords`/`reserved-words` oficializados;
- `system-globals` y runtime singletons publican metadata tipada (`valueType`) y de riesgo directamente en el catálogo, y los consumers semánticos que antes hardcodeaban `SQLCA` pasan a consumir esa metadata del dominio en vez de inferirla por nombre;
- completion consume ahora dominios catalog-driven adicionales (`reserved-words`, `pronouns`, `system-globals`, `enumerated-types`, `enumerated-values`) sólo en la rama contextual sin qualifier, preservando dedupe, prioridad estable y el guard de hot path en lugar de reconstruir vocabulario desde listas planas paralelas;
- `buildIndexes.ts`, `queryService.ts` y `SystemCatalog.ts` ya consumen buckets compuestos readonly (`byDomainAndLookupKey`, `byKindAndLookupKey`, `byEnumValueOf`, `byOwnerTypeAndDomain`), de forma que owner queries, enum queries y `resolveLanguageSymbol()` evitan scans completos y mantienen prioridad explícita del vocabulario catalog-driven;
- `buildCatalogConsistencyReport()` ya audita provenance del system catalog por dataset y dominio, publicando counts `kind/authority`, summaries por dominio y guards de mismatch para que `manual-core` siga siendo curado, `generated` siga siendo oficial y las olas visual/runtime posteriores no exageren cobertura Appeon;
- `manual/visual/` ya posee el rail curado de `system-object-datatypes` visuales en slices estables (`visualObjects`, `textControls`, `listControls`, `drawingControls`, `dataControls`, `ribbonControls`, `oleVisualControls`), `manual/index.ts` recompone visual + runtime sin depender de rutas internas frágiles y `Application` permanece fijado en runtime/system mientras `OLEControl`/`OLECustomControl` quedan en el carril visual;
- `manual/runtime/` y `manual/integration/` ya quedan también troceados por ownership explícito (`systemTypes`, `errors`, `reflection`, `ole`, `mail`, `profiling`, `json`, `http`, `rest`, `oauth`, `pdf`, `filesystem`, `compression`, `crypto`, `dotnet`), completando el rail nonvisual/moderno en `manual-core` sin volver a mezclar visual con runtime ni depender del rail `generated` para tipos representativos como `SMTPClient`, `ResourceResponse`, `PDFPage` o `TraceTreeRoutine`;
- `manual/language/enumerations/` separa ya el modelo canónico `enumerated-type` / `enumerated-value`, con tipos sin `!`, valores ligados por `enumValueOf`, metadata específica (`enumValues`, `enumNumericValue`, etc.) y guardrails de consistency (`invalidEnumeratedTypeNames` y IDs de `enumerated-value` diferenciados también por `enumValueOf`) para no reintroducir aliases incompatibles ni colisiones silenciosas en el query layer o en los consumers visibles;
- el mismo rail oficial de `script/generate_official_function_catalog.cjs` genera ya `enumeratedTypes.generated.ts`, `enumeratedValues.generated.ts`, `enumeratedCoverage.generated.ts` y `enumeratedProvenance.generated.ts`, recortando el contenido local de Appeon antes de TOCs/navfooters para no contaminar la cobertura oficial de enums ni abrir un pipeline paralelo al generator principal;
- el catálogo enumerado ya deja `missingDocs = []` para `enumerated-types`: los tipos manual-core publicados (`Border`, `Alignment`, `WindowType`, `Encoding`, etc.) conservan `documentation`, `SeekType` vive como gap manual-curated explícito y tipos oficiales como `SecureProtocol` pueden seguir sin `enumValues` nominales cuando la evidencia oficial solo publica códigos enteros, siempre con explicación y owners trazables;
- `registry/datasets.ts` publica esos slices `generated` junto al rail manual y `hover.ts` consume la unión efectiva `manual-core + generated` por `enumValueOf`, evitando que tipos como `WindowType` dependan solo de `symbol.enumValues` curados;
- oficialización de `datatypes` y `system-object-datatypes` sobre ese mismo rail, extendiendo `generated.generated.ts` con tipos oficiales faltantes y `generatedBuiltinTypes.generated.ts` para alinear el fast-path del parser con las referencias oficiales sin acoplar el hot path al registry semántico;
- `B366` endurece además el rail oficial sin abrir todavía el cambio de source-of-truth de `B367`: el scraper ya separa signatures reales, argumentos bajo `Syntax`, `returnType/returnDocumentation`, `eventId/eventIds`, metadata estructural de reserved words y overlays ricos para `system-object-datatypes` (`baseType`, `properties`, `functions`, `events`) incluso cuando el símbolo ya existe en `manual-core`, y `queryService.ts` prioriza ese overlay oficial enriquecido para `resolveDatatype()` y `resolveLanguageSymbol()` cuando aporta más estructura que la entrada curada base;
- `B370` añade el siguiente firewall arquitectónico de ese rail oficial: `test/fixtures/catalog-generator/` congela snapshots compactos offline para `ApplyTheme`, `AddItemArray`, `SetItemDate`, `OLEActivate`, `BeginDrag`, `DragDrop`, `PDFDocumentProperties` y reserved words, `catalogGeneratorScript.test.ts` los compara contra JSON compacto sin red y el parser publica ya `usageNotes` cuando Appeon documenta explícitamente una sección `Usage`, de modo que futuros cambios del extractor quedan localizados por fixture antes de tocar `generated` como source-of-truth;
- `B367` cierra ese cambio de source-of-truth: el generator oficial publica `generated` en modo `complete` por defecto, conserva `gap-fill` solo como compatibilidad, incorpora `datatypes` al dataset `generated`, materializa `generatedCompleteness.generated.ts` con cobertura oficial completa por dominio y fusiona overloads oficiales con la misma identidad lógica para que el registry runtime no reintroduzca `duplicateIds` al convivir `manual-core + generated`;
- `B368` cierra la gobernanza inmediata de esa convivencia: `manualOverlay` pasa a ser contrato explícito del catálogo, `registry.ts` clasifica por defecto `gap/enrichment/override`, `buildCatalogConsistencyReport()` falla ante overlaps manual/generated sin policy y `queryService.ts` aplica una merge policy provisional del hot path donde `override` manual gana, `generated` sigue siendo la base oficial y los `enrichment` se fusionan sin crear entradas competidoras;
- `B369` ratifica ya la decisión arquitectónica con métricas runtime y ADR: `buildCatalogConsistencyReport().adoption` compara `generated` vs `manual-core` por dominio, el summary global queda en `officialDomainsWithGaps = []` y `scraperErrorCount = 0`, y el source-of-truth contractual pasa a ser `generated-primary-with-manual-overlays`, dejando solo `datawindow-events`, `operators`, `pronouns` y `system-globals` como dominios `manual-primary` mientras no exista rail oficial equivalente;
- `B371` cierra el contrato base de localización documental del catálogo sin tocar la identidad semántica: `src/server/knowledge/system/localization/` publica overlays inmutables por locale (`entry.id` o `targetKey` estable), un índice español parcial y un resolvedor memoizado que sigue la policy runtime `generated-primary-with-manual-overlays`, de modo que los textos visibles puedan localizarse más tarde sin duplicar entries, sin traducir `summary` oficial en `generated` y dejando overlays huérfanos auditables en `buildCatalogConsistencyReport().localization`;
- `B372` añade la capa de serving locale-aware sobre ese rail: `documentationService.ts` resuelve `summary/documentation/usageNotes/obsoleteMessage/returnDocumentation/parameter documentation` por locale con fallback `es -> en`, lookup O(1) por `entry.id`, caches lazy por entry/overlay para parámetros y sin clonar `PbSystemSymbolEntry` ni recorrer overlays completos en hover/completion/signatureHelp;
- `B373` cierra la integración visible de ese rail sin tocar la identidad semántica: `hover.ts`, `completion.ts` y `signatureHelp.ts` consumen ya el servicio común, `vscPowerSyntax.languageServices.documentationLocale` sincroniza `auto|en|es` desde el cliente al servidor, `featureHandlers.ts` segrega `ServingCache` por locale efectiva y `localizationResolver.ts`/`documentationService.ts` permiten reutilizar overlays desde siblings manual/generated del mismo bucket lógico sin cambiar la selección semántica del símbolo servido;
- `B374` cierra la gobernanza de authoring sobre ese mismo rail: `buildCatalogConsistencyReport().localization` publica ya cobertura por dominio, overlays incompletos e intentos de traducir `signatureLabel`/`parameterName`, `scripts/generate_catalog_localization_report.cjs` serializa snapshots deterministas para revisión humana y todo el audit sigue ocurriendo fuera del hot path interactivo, apoyado en targets canónicos del catálogo en vez de abrir una tubería paralela de localización;
- `B375` cierra la compatibilidad de regeneración sobre ese mismo rail: cuando un `targetId` envejece pero `targetKey` sigue resolviendo un target canónico único, el runtime recupera la overlay sin scans extra, publica `recoveredTargetIds` en el audit y deja la reconciliación del source al migrador offline explícito en vez de meter reescrituras o heurísticas dentro del serving interactivo;
- `logicalStatements` ya se derivan del stripper canónico (`stripCommentsSmart`) para no contaminar diagnostics ni bindings con comentarios, y el parser degrada a `global` los callables truncados que aparecen antes del primer `type` real, manteniendo rangos monotónicos en scopes duplicados `forward/implementation` bajo fuzzing determinista;
- API pública v2 versionada, con descriptor contractual, inventario estable de metodos/schemas/tools y helpers de compatibilidad;
- catálogo versionado de task execution contracts injertado en ese descriptor público y servido por el tool `contract`, describiendo inputs/outputs, dry-run, límites write-enabled, receipts y handoff SDD sin mover IA dentro del core;
- oracle interno de consistencia semántica sobre `currentObjectContext`, `semanticWorkspaceManifest`, `dependencyGraph`, diagnostics directos, `dataWindowSqlLineage` y `crossProjectSymbolConflicts`, con reason codes explícitos, tolerancia honesta a budgets truncados del manifest y smoke real sobre PFC/OrderEntry sin abrir otra API pública ni un segundo motor semántico;
- bridge read-only JSON-RPC/local tool servido por API pública, con dispatch por nombre estable y payloads tipados en vez de accesos ad hoc al host;
- `workspace-check` read-only servido por API pública/tool bridge/comando Markdown, compuesto cliente-side sobre `server-stats`, `semanticWorkspaceManifest`, diagnostics/health runtime y un summary ligero de catálogo memoizado, con modos `quick/full/catalog/diagnostics` y sin abrir un motor paralelo de validación;
- `object-check` read-only servido por API pública/tool bridge/comandos Markdown, compuesto cliente-side sobre `currentObjectContext`, `dependencyGraph`, `impactAnalysis` y `safeEditPlan`, con source resolution por editor/URI/nombre y sin reparsear ni abrir un segundo planner semántico local;
- `explain-diagnostic` read-only servido por API pública/tool bridge/comando Markdown, compuesto cliente-side sobre diagnostics ya publicados por VS Code, `currentObjectContext` y `safeEditPlan`, con selección determinista por posición/código/index y reutilización del rail explainability existente en vez de abrir un segundo motor de diagnostics;
- semantic workspace snapshot exportable/importable desde cliente sobre el mismo manifest versionado, sin publicar estado semántico parcial;
- importador cliente-side de semantic snapshot capaz de migrar payloads legados compatibles sin `schemaVersion` o `summary` materializado, manteniendo rechazo explícito ante versiones no soportadas y usando fixtures versionadas para congelar compatibilidad de manifest/support bundle/public contract/read-only bridge;
- diff read-only entre dos semantic workspace snapshots exportados, calculado cliente-side sobre el mismo contrato público y sin abrir un segundo motor semántico;
- grafo inmediato de dependencias PowerBuilder servido read-only por API pública/LSP, apoyado en snapshots y reverse dependencies ya publicados por `KnowledgeBase`, con export Mermaid/JSON, `identityKey` exacta en `focus/nodes` resolubles y sin rescans del workspace;
- analizador read-only de conflictos cross-project servido por API pública/LSP/comando Markdown, agrupando entidades por `buildConflictFamilyKey`, exponiendo `identityKey` exacta por candidato, enriqueciendo proyecto/librería/sourceOrigin desde `WorkspaceState` y colapsando staging o duplicados de la misma ubicación sin abrir otro índice;
- asistente read-only de migración de workspace legacy servido por API pública/LSP/comando Markdown, derivado de `WorkspaceState`, summary de build files, project model y aliases ORCA para recomendar topología objetivo y saneamiento del layout sin abrir otro planner ni tocar archivos;
- matriz read-only de perfiles de build y validación de entorno servida por API pública/comando Markdown, derivada client-side de capability detection de PBAutoBuild, inventario completo de build files y build health ya publicados, sin crear otro rail de ejecución;
- reporte read-only de métricas avanzadas de código PowerBuilder servido por API pública/LSP/comando Markdown, derivado de snapshots semánticos, `DiagnosticsSnapshot`, bindings `DataObject` y footprint build/ORCA de `WorkspaceState`, con `maxObjects` acotado y sin reparsear ni abrir un segundo motor de scoring;
- informe read-only de deuda técnica y modernización servido por API pública/LSP/comando Markdown, compuesto sobre `code-metrics`, `diagnostic.code`, `sourceOrigin` summary y `workspaceMigrationAssistant`, sin inventar diagnósticos nuevos ni abrir heurísticas opacas paralelas;
- framework versionado de code actions seguras servido por LSP sobre diagnósticos ya publicados, con `catalogVersion`, preview explícita, preflight obligatorio y bloqueos por `sourceOrigin`/dynamic strings antes de proponer cualquier edit;
- gobernanza de settings y perfiles del producto servida por una surface compartida entre cliente y API pública, sin defaults opacos;
- current object context pack read-only servido por API pública/LSP, derivado del snapshot semántico, hierarchy inspection, diagnostics y bindings `DataObject` en vez de scans ad hoc para IA, ahora ampliado con variables visibles para sostener surfaces UX sin recomputación local;
- impact analyzer read-only servido por API pública/LSP, compuesto desde `references`, descendientes/overrides, events, bindings `DataObject` y project routing en vez de listas planas por nombre;
- safe edit plan read-only servido por API pública/LSP, derivado del impacto explícito y del context pack para proponer archivos, riesgos, tests y docs sin ejecutar cambios;
- safe batch refactor planning read-only servido por API pública/LSP y por el tool bridge, reutilizando `rename` preflight, `impact analysis` y `safe edit plan` en vez de abrir otra engine de impacto;
- workflows write-enabled `applySpecDrivenPblUpdate` / `applySpecDrivenPblUpdateBatch` servidos por API pública/LSP, reutilizando `safeEditPlan`, export ORCA fresco, edits explícitos sobre staging y el mismo rail de import con backup/ledger/journal en vez de abrir un motor legacy paralelo;
- exportación cliente-side de semantic repro packs reutilizando esas mismas surfaces read-only, `serverStats` y copias de archivos relacionados en un bundle versionable bajo `tools/semantic-repros`, sin abrir un motor paralelo en servidor;
- exportación cliente-side de support bundles offline saneados bajo `tools/support-bundles`, reutilizando `serverStats`, manifest semántico, gobernanza de settings y el inventario API/tool ya público, con redacción explícita de rutas/URIs/ejecutables y sin exportar código bruto por defecto;
- contrato versionado de observabilidad local incrustado en `ApiPublicContractDescriptor`, declarando dominios `readiness/indexing/cache/memory/latency/build/orca/diagnostics/query-trace/support-bundle/health`, `externalTelemetry = false`, `localOnly = true` y export offline explícito para support bundle en vez de un rail paralelo de reporting;
- semantic workspace manifest read-only servido por API pública/LSP, derivado de `WorkspaceState`, `UnifiedProjectModel`, `KnowledgeBase`, `InheritanceGraph`, knowledge packs curados y diagnostics snapshot para exponer estructura compacta/versionada del workspace, incluyendo `identityKey` canónica en objetos y symbols exportados, sin exportar código bruto;
- diagnostics snapshot agrupado por proyecto/objeto;
- contrato diagnóstico estable por `diagnostic.code`, con helpers compartidos para leer IDs emitidos actuales y fallback al sufijo legacy de `source` solo donde aún haga falta compatibilidad;
- compactación de strings calientes;
- latency governor en serving/scheduler;
- hierarchy inspection y CodeLens más fiables;
- `RuntimeJournal` exportable del motor, alimentado desde `queryTrace`, `ServingCache` e invalidaciones documentales reales, servido por `showStats`/status sin abrir un canal paralelo y ahora también proyectado a un journal persistente acotado para `phase: build|legacy`;
- health checker estructurado del runtime con findings por capa y severidad sobre readiness, scheduler, project model, cachés, persistencia y ambigüedad de query;
- watcher incremental completo sobre source + markers de topología, con refresh de `UnifiedProjectModel`/`sourceOrigin` desde el puente real LSP -> watcher y sin rediscovery completo para cambios calientes;
- `references`, `rename` y CodeLens apoyados en un candidate pool compartido y acotado por query/proyecto, con reuso de líneas y `maskedText` ya publicados por snapshot en lugar de rereads/remasking globales;
- `queryContext` y diagnostics de línea única ya leen solo la línea activa en vez de partir el documento completo, completion consume listas read-only segmentadas del catálogo del sistema en vez de clonar el inventario global y `referenceSourcePool` reutiliza URIs ya normalizadas del workspace; `hotPathAllocationBudget.test.ts` fija además la ausencia de `JSON.stringify`, `getAllEntities` y `exportDocumentRecords` en las features interactivas vigiladas.
- formatter conservador configurable sobre documentos PowerScript soportados, alojado como motor puro compartido y ejecutado en servidor LSP mediante `powerbuilder.formatDocument`; el cliente conserva solo selector/configuración/UX ligera y el servidor aplica budgets explícitos por caracteres/líneas para degradar archivos grandes sin parsear DataWindow como PowerScript.
- `knowledge/parsing/utils` ya usan tipos internos para posiciones/rangos/símbolos documentales y dejan `DocumentSymbol`/DTOs LSP en el borde de `features/documentSymbols`; `architectureImports.test.ts` protege además el firewall mínimo entre `client`, `shared`, `runtime`, `features` y `build`, evitando dependencias cruzadas fuera de allowlist.
- `documentSymbols` ejecuta ahora una reconciliación explícita entre `sections/typeBlocks` del parser, facts/scopes del snapshot y el árbol LSP a publicar, generando reason codes y reporte interno antes de servir el outline.
- carril moderno de build ya materializado en siete piezas: el cliente resuelve `PBAutoBuild250.exe` por configuración/entorno/candidatos por defecto, el servidor descubre/valida build files JSON y lista los utilizables, un runner server-side dedicado ejecuta `PBAutoBuild` out-of-process con selección segura/timeout/cancelación, un parser server-side resuelve problemas de build a una colección diagnóstica separada del canal semántico, el cliente consolida todo en un snapshot único de build health, recuerda/repite el último build frecuente por workspace y además exporta bundles neutrales de CI/CD (`manifest` + scripts) bajo `tools/pbautobuild-ci/<perfil>`; `B198` y `B195` ya quedan cerradas: la guía operativa está alineada y el packaging ORCA de `EXE/PBD/DLL` queda explícitamente no expuesto detrás de un feature flag aún no abierto.
- runtime expone un reporte unificado de budgets de memoria por capa (`analysis`, `serving`, `documents`, `hot-context`, `code-lens`, `knowledge`) con estimates soft y vigilancia integrada en `showStats`, health checker y status visible; esa misma señal activa ahora una policy adaptativa que purga `ServingCache`, suspende nuevas escrituras en esa caché, difiere `background-indexing/maintenance/ai-tooling` y acota reports read-only pesados antes de romper el carril interactivo.
- cliente expone un dashboard read-only de salud del proyecto componiendo `showStats`, `semanticWorkspaceManifest`, reportes de status/health y snapshot de build ya publicados, sin abrir una ruta paralela de cálculo en servidor.
- ese mismo carril cliente-side deriva también la matriz oficial de soporte por modo/surface desde `RuntimeStatusStats` + `semanticWorkspaceManifest`, de forma que health report y troubleshooting publican límites explícitos sin duplicar lógica topológica ni semántica en otro servicio.
- cliente expone también un Object Explorer read-only sobre `semanticWorkspaceManifest` enriquecido, agrupado por proyecto/librería/kind y filtrable por proyecto/archivo activo, sin consultas per-node ni un segundo índice local.
- el project model unificado ya materializa también nodos legacy `kind: library` para roots `.pbl` no cubiertos por `.pbt/.pbproj`, permitiendo modo `pbl-only` y surfaces read-only coherentes antes de abrir staging ORCA.
- `WorkspaceState`, `semanticWorkspaceManifest`, Object Explorer, `cacheStore`, la matriz de build y ORCA staging preservan ya identidad por URI completa entre roots homónimos; `sourceOrigin` contextual se decide por el marker topológico más cercano en vez de por un fallback global de modo `solution/mixed`.
- cliente expone además un Current Object Context Panel read-only que sigue el editor activo y proyecta `currentObjectContext` ya servido por API pública, incluyendo ancestor chain, variables visibles, members, diagnostics, bindings `DataObject` y evidence/confidence sin motor semántico paralelo.
- cliente expone tambien un Diagnostics Explainability Panel read-only que proyecta `diagnostic.code`, severidad y localizacion del editor activo sin parsear el Problems Panel ni recomputar diagnosticos.
- carril ORCA legacy ya queda partido en cuatro capas: un adapter base server-side, out-of-process y cancelable; una capability read-only cliente-side resuelta desde configuración explícita o `PB_ORCA_PATH`, publicada como `orcaTooling`; un export controlado a `.vsc-powersyntax/orca-export/{orca-staging,scripts,state}` que persiste aliases desde cada carpeta staging hacia la librería `.pbl` original para que routing/manifest sigan atribuyendo proyecto y librería al graph legacy real, mientras `KnowledgeBase` y query/serving priorizan siempre el source real cuando ambos publican el mismo símbolo y `last-export.state` conserva fingerprints del source real rastreado por objeto; un rail write-enabled único que hoy materializa `import-from-staging.orc`, `regenerate-from-staging.orc`, `rebuild-from-staging.orc`, `applySpecDrivenPblUpdate` y `applySpecDrivenPblUpdateBatch`, siempre con preflight, backup binario, ledgers persistidos y journal técnico antes de tocar la PBL; y un journal técnico persistente en `.vsc-powersyntax/runtime/build-orca-journal.json` que conserva eventos `build|legacy` del mismo `RuntimeJournal`. `import` ya bloquea fingerprint mismatch y `stale staging`; además, `orcaTooling.packagingPolicy` publica de forma explícita que el packaging `EXE/PBD/DLL` no está expuesto y requeriría un feature flag dedicado fuera del hot path.
- query engine compartido con modelo explícito de invocación PowerBuilder (`unqualified`, `this`, `parent`, `super`, `ancestor`, global, dynamic, external`) y propagación de `invocationKind`/`invocationRisk` a trace, context y operaciones semánticas;
- hardening B281 de firmas PowerBuilder sobre el mismo query engine: overloads conservados por firma, filtrado por aridad/tipos literales simples antes de distancia de herencia, `discarded-signature` como evidence y override families comparadas por firma en vez de solo por nombre;
- modelo B282 de riesgo dinámico centralizado en `invocationRiskModel`, exponiendo `safe|inherited|fallback|dynamic|external` en contratos públicos y propagándolo a `references`, `rename`, `impactAnalysis`, `safeEditPlan`, `dependencyGraph` y `codeActions` para degradar o bloquear strings dinámicos, DataWindow ambiguo/dinámico, external targets y `sourceOrigin` no canónico sin guards locales por feature;
- registro único `queryScopePolicy` por consumer semántico, declarando `maxScope`, `budgetMs`, `resultCap`, readiness, confidence, fallback y allowances `staging/generated/external`; `featureReadiness`, `signatureHelp`, `completion`, `currentObjectContext`, `impactAnalysis` y `referenceSourcePool` ya consumen ese contrato para que los consumers acotados a `project` no ensanchen a `workspace` ni materialicen `orca-staging/generated` por defecto;
- registro único `backpressurePolicy` por workload runtime, declarando `lane`, `throttledByLatency` y `preemptible`; `TaskScheduler`, `diagnosticScheduler`, `server.ts` y las surfaces visibles de stats/health ya consumen ese contrato para enrutar `diagnostics`, `near-context`, `background-indexing`, `export-reporting`, `build`, `legacy-orca` y `maintenance` sobre el mismo scheduler, preservando `build/legacy-orca` una vez arrancan y manteniendo preemptibles los carriles read-only/background;
- eventos PowerBuilder tratados como entidades de primera clase: `on object.event` conserva owner real, `call super::create` resuelve sobre on-handlers reales y `TriggerEvent/PostEvent` con literal estable reusan el mismo backbone semántico.
- lifecycle PowerBuilder integrado en surfaces visibles: `hierarchyInspection` reconstruye create/destroy desde snapshot semántico, hover explica `constructor/destructor` desde el mismo modelo y diagnostics emite warnings suaves (`missing-super-*`, `missing-trigger-*`, `unresolved-*`) sin abrir un segundo motor.
- PowerBuilder Language Knowledge Catalog v2: una fuente centralizada y versionada que sirve no solo ancestros nativos y tipos raíz (powerobject, throwable, etc.), sino también el modelo de lenguaje incluyendo keywords, reserved words, primitive datatypes, system object datatypes, pronouns, operators, system globals y enumerated values; proporciona metadata rica (summaries, categorías, documentación) y APIs de consulta indexadas para hover, completion, semantic tokens y diagnostics sin recomputar semántica en el hot-path. Los `Set<string>` de `grammar.ts` siguen siendo fast-path del parser/matcher y no sustituyen al catálogo rico; la auditoría 2026-05-03 alinea `DataWindowChild` en ambos carriles, fija un contrato ejecutable de provenance para distinguir rail oficial frente a rail curado por dominio y, desde `B358/B359`, deja visual y runtime/integration separados en slices de ownership sin remezclar `Application`, OLE visual ni integration moderna dentro de un rail monolítico.
- B357 deja además el rail manual partido por ownership explícito: `manual/common.ts` queda helper-only, `manual/sources.ts` centraliza provenance base, `manual/ownerTypes/` concentra owner groups y `manual/index.ts` publica `PB_MANUAL_CORE_DATASET_SLICES`/`PB_MANUAL_CORE_OWNER_TYPE_GROUPS` para que `registry/datasets.ts`, `nativeAncestors.ts` y consumers derivados no dependan ya de rutas internas frágiles.
- Refactor arquitectónico de entrypoints: `extension.ts` y `server.ts` siguen siendo los hotspots principales; `server.ts` ya quedó reducido a bootstrap + runtime orchestration, mientras lifecycle/document/features/commands viven en `handlers/lifecycleHandlers.ts`, `handlers/documentHandlers.ts`, `handlers/featureHandlers.ts`, `handlers/buildCommandHandlers.ts`, `handlers/reportCommandHandlers.ts` y `handlers/runtimeCommandHandlers.ts`. El LRU de CodeLens sigue en `features/codeLensResultCache.ts`, y la siguiente descomposición mayor visible queda trazada en B346/B353/B354.
- modelo transaccional básico integrado en el backbone: `SQLCA` se resuelve como `transaction` especial, `SetTransObject`/`SetTrans` enlazan con `Retrieve`/`Update` en diagnostics y las superficies interactivas (`completion`/`hover`/`signatureHelp`) filtran el catálogo por `ownerType` para DataWindow/DataStore sin lookup plano por nombre.
- bridge DataWindow integrado en el mismo backbone: `.srd` publica stubs navegables sin parsearse como PowerScript, `DataObject = "d_xxx"` resuelve hacia el snapshot `.srd` ya indexado y `dataWindowModel` ya es el modelo canónico único para bandas, columnas `table`, `retrieve`, `retrieveArguments`, `report(...)`, controles nombrados, metadata segura de expresiones y referencias SQL del subset seguro. `dataWindowSafeMode`, `dataWindowBindingModel`, `signatureHelp`, hover/definition/documentSymbols, property paths, completion/diagnostics de expresiones `.srd` y `dataWindowSqlLineage` reutilizan ese mismo backbone en vez de reparsear snapshots por feature. El slice avanzado actual cubre `report(name=... dataobject=...)`, `column.dddw.name`, property paths `Describe/Modify(...DataWindow.Table.Select)`, acceso directo `.Object.<control|column|property>` y `GetChild()` sobre child DataWindows deterministas; el slice SQL seguro cerrado en `B288` añade aliases de `select`, `JOIN ... ON` simples y `WHERE` básico con degradación honesta para subqueries/SQL complejo, mientras `B289` añade nodos `expression=`/`~t...`, completion segura dentro del `.srd` y warnings conservadores sobre dependencias de expresión no resolubles sin evaluar nada; todo ello degradando con honestidad cuando el binding, la ruta, la dependencia o la sentencia no son defendibles, sin abrir stores globales paralelos.
- dependencias nativas externas modeladas como primer ciudadano ligero: `externalAlias`, `externalDependencyKind` (`dll`, `pbx`, `unknown`), hover explícito y degradación honesta de rename/references/diagnostics sin fingir implementation interna.
- cierre de documento ahora expulsa solo la caché interactiva de análisis y no borra `DocumentCache`/`KnowledgeBase`; la eliminación real de conocimiento queda reservada a eventos de borrado de archivo.
- `KnowledgeBase` ya publica mutaciones con copy-on-write por bucket (ids, kinds y dependencias), y `workspaceSymbols`, API symbols, completion global y manifest semántico consumen consultas/conteos acotados para evitar materializar toda la base cuando solo se necesitan resultados limitados.
- CodeLens mantiene caché LRU acotada, invalidable por URI y visible en stats/health, en línea con los budgets de memoria pendientes de `B070`.
- el selector LSP del cliente y un guard server-side compartido evitan servir markers `.pbw/.pbt/.pbproj/.pbsln` y `.pbl` binarios como documentos PowerScript, aunque se fuerce un lenguaje servido; discovery/topología siguen observándolos por watcher.

---

## 5. Vista de alto nivel

```text
VS Code UI
  └─ Cliente ligero
      ├─ bootstrap mínimo
      ├─ commands ligeros
      ├─ estado visible
      ├─ API pública mínima + análisis/planes/context packs read-only
      └─ bridge LSP

Language Server Process
  ├─ runtime/
  ├─ core/
  │   ├─ domain/
  │   ├─ application/
  │   └─ ports/
  ├─ workspace/
  ├─ parsing/
  ├─ knowledge/
  ├─ diagnostics/
  ├─ features/
  ├─ ux/
  ├─ adapters/
  └─ platform/
```

---

## 6. Capas principales

### 6.1 `client/`

Cliente mínimo de VS Code. Responsable de activación, wiring con servidor, configuración, comandos ligeros, status mínimo y exportación de API pública mínima.

El cliente también deriva y publica la matriz oficial de soporte del producto a partir de `RuntimeStatusStats` y `semanticWorkspaceManifest`, para que health report, troubleshooting y documentación visible reutilicen el mismo contrato sin abrir una segunda fuente de verdad en servidor.

### 6.2 `runtime/`

Orquestación operativa del servidor. Responsable de scheduler, prioridades, yielding, cancelación, preempción, invalidación, backpressure, gobernador de latencia, warm resume, progreso y readiness. La policy de workloads vive encima del mismo scheduler: `interactive/diagnostics` siguen por delante, `near-context` desplaza fondo preemptible, `build/legacy-orca` entran por admisión background sin abrir un segundo scheduler ni quedar cancelables una vez lanzados, y la pressure policy de memoria usa los mismos stats/cachés compartidos para aliviar `ServingCache`, diferir carriles no críticos y capar reports pesados sin apagar el archivo activo.

### 6.3 `core/domain/`

Conceptos canónicos del sistema: símbolos, scopes, tipos, referencias, dependencias, herencia, sourceOrigin, evidence/confidence y contratos internos.

### 6.4 `core/application/`

Casos de uso internos: analizar documento, actualizar conocimiento, resolver símbolos, calcular definition/references, preparar snapshots y servir consultas compartidas.

### 6.5 `core/ports/`

Puertos hacia infraestructura: filesystem, caché, persistencia, logging, reloj, observabilidad.

### 6.6 `workspace/`

Modelo y estrategia del workspace/proyecto: discovery, roots, project modes, exclusiones, markers, watch/scan, project context y `UnifiedProjectModel`.

### 6.7 `parsing/`

Conversión de archivos PowerBuilder en estructuras sintácticas reutilizables. Debe ser testeable sin VS Code y separado de semántica rica. `parsing/grammar.ts` es el módulo canónico para keywords, matchers estructurales, secciones y bloques compartidos; parser, diagnostics y features deben consumirlo antes de introducir regex nuevas.

### 6.8 `knowledge/`

Backbone semántico compartido: snapshots, symbols, binding, resolution, index, queries, publish atómico, epochs semánticas, dependencias inversas, lineage y conocimiento incremental.

### 6.9 `diagnostics/`

Reglas diagnósticas apoyadas en servicios comunes. No reconstruye semántica.

### 6.10 `features/`

Adaptadores finos para capacidades LSP: hover, completion, definition, references, rename, document symbols, workspace symbols, signature help, semantic tokens, diagnostics y code actions.

### 6.11 `ux/`

Superficies visibles de producto para el desarrollador:

- PowerBuilder Object Explorer;
- Current Object Context Panel;
- Project Health Dashboard;
- status contextual;
- comandos de inspección;
- vistas de diagnóstico/export.

Regla: `ux/` consume contratos públicos, LSP o API estable del servidor. No reconstruye semántica ni accede directamente a estructuras internas del dominio.

### 6.12 `adapters/`

Implementaciones concretas de borde: filesystem, cache, logging, LSP, API local, futura integración MCP/tools.

### 6.13 `platform/`

Primitivas técnicas compartidas: observability, performance, persistence, hashing, text, cancellation, ids, collections.

### 6.14 `shared/`

Separación conceptual:

- `shared/contracts/` → DTOs y mensajes compartidos;
- `shared/kernel/` → primitivas neutras.

Regla: los contratos no exponen directamente entidades internas mutables del dominio.

---

## 7. Estado explícito del sistema

### 7.1 Estado caliente del documento

- snapshot del documento activo;
- símbolos locales;
- scopes locales;
- contexto posicional;
- diagnostics rápidos;
- datos inmediatos de serving.

### 7.2 Estado semántico del workspace

- símbolos exportados;
- relaciones de herencia;
- dependencias;
- topología de proyecto;
- índices globales;
- readiness del proyecto/workspace.

### 7.3 Estado persistente

- fingerprints;
- metadata de caché;
- checkpoints;
- schema version;
- journals;
- resúmenes reutilizables.

Schema persistente actual:

- `semantic-checkpoint.json`: `schemaVersion`, `semanticEpoch`, `createdAt`, `metadata` (`workspaceMode`, `rootUris`, `projectStats`, `publishedAt`) y `documents` persistidos;
- `semantic-journal.json`: `schemaVersion`, `sequence`, `semanticEpoch`, `createdAt`, `kind`, `uris` y `documents` opcionales para `upsert`;
- `build-orca-journal.json`: `schemaVersion`, `updatedAt` y snapshot tipado de eventos persistidos para `phase: build|legacy`, accesible también desde `showStats.persistence.buildOrcaJournalUri`;
- si el payload conserva compatibilidad estructural, el restore normaliza campos faltantes; si no, la decisión canónica es invalidar y reconstruir.

### 7.4 Estado de origen y confianza

- `sourceOrigin`;
- evidence;
- reason codes;
- confidence;
- readiness mínima;
- degradación o bloqueo por feature.

---

## 8. Reglas de dependencia

- `client/*` no depende del core del servidor.
- `features/*` depende de consultas/servicios públicos del core/knowledge, no de estructuras crudas dispersas.
- `diagnostics/*` no reconstruye resolver o binder.
- `adapters/*` implementa puertos; no define dominio.
- `shared/contracts/*` no importa `core/domain/*`.
- `runtime/*` coordina ejecución; no contiene reglas semánticas profundas.
- `knowledge/*` puede depender de `core/domain` y `core/application`, pero no de UI ni de cliente VS Code.
- `ux/*` no accede a `core/domain/*` directamente.
- `features/*` y `ux/*` respetan readiness/evidence/confidence.
- `adapters/api-*` exponen contratos versionados, nunca entidades mutables internas.
- las integraciones IA consumen API pública/tools/context packs, no dominio interno.
- `B229` ya queda cerrada: `documentAnalysis`, `analysisCache`, indexador y watcher consumen `sourceOrigin` contextual desde `WorkspaceState`/routing y dejan `inferSourceOrigin()` solo como fallback cuando la autoridad contextual es inexistente o sigue en `unknown`.

---

## 9. Componentes temporales y migración

Las capas bootstrap son válidas si aportan valor temprano, pero deben ser explícitas, temporales, decrecientes y con dirección clara de migración.

> Ninguna capa provisional debe convertirse en núcleo permanente por acumulación histórica.

La dirección objetivo es que el peso semántico migre progresivamente hacia:

- `core/`;
- `knowledge/`;
- `runtime/`.

---

## 10. Estrategia de carga

### 10.1 Arranque en frío

El arranque debe hacer prácticamente cero trabajo pesado.

### 10.2 Primer archivo PowerBuilder

1. activar cliente;
2. levantar servidor;
3. analizar primero el archivo activo;
4. enriquecer dependencias inmediatas;
5. diferir trabajo global.

### 10.3 Indexación del workspace

Prioridad:

1. documento activo;
2. dependencias inmediatas;
3. contexto cercano;
4. resto del proyecto;
5. resto del workspace.

Siempre progresiva, cancelable y no bloqueante.

---

## 11. Reglas transversales

- El cliente no implementa semántica pesada.
- El parser no depende de VS Code.
- La semántica no depende de UI ni transporte.
- Handlers LSP no contienen lógica de negocio profunda.
- El dominio no conoce JSON ni DTOs.
- Ninguna feature reconstruye semántica por su cuenta.
- Toda capacidad costosa declara prioridad, invalidación, cache, cancelación y presupuesto.
- Toda decisión estructural relevante actualiza documentación canónica.

---

## 12. Regla de alineación documental

Toda decisión relevante sobre arquitectura debe actualizar, cuando aplique:

- `README.md`;
- `docs/architecture.md`;
- `docs/roadmap.md`;
- `docs/backlog.md`;
- `docs/current-focus.md`;
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`;
- specs afectadas.

La arquitectura documentada debe distinguir siempre entre implementado, parcial y objetivo.

---

## 13. Resumen final

La arquitectura debe converger a:

1. cliente mínimo;
2. runtime explícito;
3. core agnóstico;
4. knowledge pipeline compartido;
5. features como adaptadores finos;
6. UX sobre contratos públicos;
7. persistencia robusta;
8. observabilidad operativa;
9. source origin + evidence/confidence transversales;
10. crecimiento incremental sin rehacer el núcleo.
