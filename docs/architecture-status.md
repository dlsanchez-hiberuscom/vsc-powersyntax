# Architecture Status.md — Estado arquitectónico actual

> Documento de estado derivado de `Architecture.md`.  
> Este documento recoge implementación real, guardrails, rails cerrados y estado operativo.  
> La arquitectura estable vive en `Architecture.md`.

---

## 1. Propósito

Mantener el estado actual de implementación arquitectónica del plugin profesional de **PowerBuilder 2025 para Visual Studio Code**.

Este documento debe responder:

- qué piezas arquitectónicas ya están materializadas;
- qué guardrails protegen la arquitectura;
- qué rails existen hoy;
- qué contratos públicos están operativos;
- qué decisiones recientes ya forman parte del repo;
- qué áreas deben seguir vigilándose para evitar drift.

---

## 2. Estado general

El repositorio ya materializa un primer corte operativo de una arquitectura IA-first basada en:

- cliente VS Code ligero;
- servidor LSP como runtime principal;
- snapshots semánticos por documento;
- `KnowledgeBase` con publicación atómica y `semanticEpoch`;
- semantic diff e invalidación dirigida/transitiva;
- `UnifiedProjectModel` como base topológica;
- `sourceOrigin` transversal;
- readiness/evidence/confidence como contrato compartido;
- persistencia versionada con checkpoints y journals;
- serving cache para features interactivas;
- API pública versionada;
- tool bridge read-only/write-enabled controlado;
- rails ORCA/PBAutoBuild separados;
- catálogo PowerBuilder gobernado por generated-primary-with-manual-overlays.

---

## 3. Cliente ligero

Estado actual:

- `src/client/commandRegistration.ts` concentra wiring declarativo de command IDs.
- `extension.ts` conserva lifecycle, bridge y handlers ligeros.
- Controllers como Object Explorer, Current Object Context y Diagnostics Explainability se materializan bajo demanda mediante `ensure*Controller()`.
- La API pública exportada sigue versionada y estable.
- La materialización real de capacidades evita coste eager antes de que exista un consumer efectivo.

Guardrails asociados:

- `test/server/unit/architectureImports.test.ts` mantiene firewall por capas.
- `npm run test:architecture:metrics` aplica budgets explícitos para hotspots.
- `tools/run-architecture-hotspot-guard.mjs` protege tamaño de entrypoints, feature hotspots LSP/DataWindow y permite allowlist de slices generated/manual grandes.
- `artifacts/performance/architecture-hotspot-guard.json` publica resultados, warnings al 90% del budget, `growthPolicy` y sugerencias de extracción por hotspot.

---

## 4. Runtime y scheduling

Estado actual:

- Scheduler con prioridades para workloads interactivos, diagnostics, near-context, background indexing, build, legacy ORCA y maintenance.
- Backpressure policy centralizada por workload.
- Latency governor para serving y scheduler.
- Runtime journal exportable alimentado desde query trace, serving cache e invalidaciones documentales.
- Journal persistente acotado para fases `build|legacy`.
- Health checker estructurado por capa y severidad.
- Runtime status visible para cliente, health report y troubleshooting.
- Memory budget report por capa:
  - `analysis`;
  - `serving`;
  - `documents`;
  - `hot-context`;
  - `code-lens`;
  - `knowledge`.

Política adaptativa actual:

- purga `ServingCache` y las presentation caches de hover bajo presión;
- suspende nuevas escrituras en esa caché si procede;
- difiere `background-indexing`, `maintenance` y `ai-tooling`;
- acota reports read-only pesados antes de afectar al archivo activo.

---

## 5. Persistencia y cache

Estado actual:

- `cacheStore` con `workspaceKey` estable.
- Checkpoints y journals persistidos por proyecto.
- Policy v2 de retención/compactación.
- Métricas de disco.
- Cleanup TTL por workspace.
- Comando local de mantenimiento fuera del hot path.
- Warm resume de `DocumentCache` + `KnowledgeBase`.
- Importador cliente-side de semantic snapshot con migración de payloads legados compatibles.

Schema persistente actual:

- `semantic-checkpoint.json`:
  - `schemaVersion`;
  - `semanticEpoch`;
  - `createdAt`;
  - `metadata`;
  - `documents`.
- `semantic-journal.json`:
  - `schemaVersion`;
  - `sequence`;
  - `semanticEpoch`;
  - `createdAt`;
  - `kind`;
  - `uris`;
  - `documents` opcionales.
- `build-orca-journal.json`:
  - `schemaVersion`;
  - `updatedAt`;
  - snapshot tipado de eventos persistidos para `phase: build|legacy`.

Política vigente:

```text
payload compatible → migrate/normalize;
schema desconocido o incompatible → rebuild limpio.
```

---

## 6. Source origin y provenance

Estado actual:

- `KnowledgeBase`, `semanticQueryService` y `semanticWorkspaceManifest` consumen prioridad compartida de `sourceOrigin`.
- Duplicados entre source real y `orca-staging` se sirven primero desde source real.
- `orca-staging` queda como backing read-only salvo rails write-enabled controlados.
- `EntityLineage` publica provenance/origen/fase/fiabilidad.
- `sourceOrigin` ya se comparte con discovery, diagnostics y API pública.
- `documentAnalysis`, `analysisCache`, indexador y watcher consumen `sourceOrigin` contextual desde `WorkspaceState`/routing.
- `inferSourceOrigin()` queda solo como fallback cuando no existe autoridad contextual o sigue en `unknown`.

Source origins soportados:

```text
solution-source
workspace-ws_objects
pbl-folder-source
orca-staging
pbl-dump-source
generated
unknown
```

---

## 7. Knowledge backbone

Estado actual:

- Snapshot semántico canónico por documento.
- `KnowledgeBase` con publish atómico y `semanticEpoch`.
- Semantic diff.
- Dependencias inversas.
- Invalidación dirigida y transitiva.
- Indexación estructural + enriquecida con prioridad al activo.
- Budgets adaptativos, preempción y modo degradado.
- `buildSymbolKey` como identidad exacta.
- `buildConflictFamilyKey` como agregación relajada para conflictos cross-project/cross-library.
- `KnowledgeBase` publica mutaciones con copy-on-write por bucket.
- `workspaceSymbols`, API symbols, completion global y manifest semántico consumen consultas/conteos acotados.
- [symbol-system.md](symbol-system.md) queda como owner documental del modelo conceptual de símbolo, sources, consumers, confidence/sourceOrigin, enrichments, localización y roadmap derivado.

Metadata contractual de símbolo ya publicada:

- `declarationScope`;
- `fileObjectName`;
- `containerSignature`;
- `ownerName`;
- `implementationKind`;
- `returnType`.

---

## 8. Query engine y policies

Estado actual:

- Query engine compartido con modelo explícito de invocación PowerBuilder:
  - `unqualified`;
  - `this`;
  - `parent`;
  - `super`;
  - `ancestor`;
  - `global`;
  - `dynamic`;
  - `external`.
- Propagación de `invocationKind` e `invocationRisk` a trace, context y operaciones semánticas.
- Hardening de firmas con overloads conservados por firma.
- Filtrado por aridad/tipos literales simples antes de distancia de herencia.
- Override families comparadas por firma y no solo por nombre.
- Modelo centralizado de riesgo dinámico en `invocationRiskModel`.
- `safe|inherited|fallback|dynamic|external` propagado a contratos públicos.
- `queryScopePolicy` única por consumer semántico.
- Consumers cubiertos:
  - `queryContext`;
  - `semanticQueryService`;
  - `signatureHelp`;
  - `completion`;
  - `hover`;
  - `definition`;
  - `references`;
  - `rename`;
  - `currentObjectContext`;
  - `impactAnalysis`;
  - `diagnostics`;
  - `referenceSourcePool`.

Cierre relevante del carril devtools LSP:

- `definition` ya abre members nativos DataWindow sobre descendants custom hacia la documentación oficial del catálogo usando owner chain jerárquico, sin depender de `InheritanceGraph.getMembers()` como única fuente;
- hover quedó protegido con guards explícitos contra `workspace fallback` innecesario cuando la resolución ya es `member-hierarchy` local o owner-scoped de catálogo en descendants custom de DataWindow;
- completion publica lista inicial ligera y difiere documentación/detalle enriquecido con `completionItem/resolve`, payload budget propio y stale discard separado;
- signatureHelp materializa `SignatureHelpViewModel` ligero antes de adaptar al DTO LSP;
- definition usa key estructurada de `ActiveDocumentServingSnapshot` y stale guard antes de publicar misses;
- `src/server/presentation` ya concentra ViewModels/formatters puros para completion, definition, diagnostics, semantic tokens y AI context, sin imports a IO, discovery, parser ni stores semánticos runtime;
- `documentSymbols` y `semanticTokens` tienen decisión explícita `no-cache final` / respuesta `full` mientras el snapshot caliente mantenga coste bajo;
- CodeLens mantiene `resolveProvider = false` con `CodeLensResultCache` especializado y prueba contractual de capabilities;
- el gate ejecutable `test:performance:gate` cerró este carril con `legacy-public-active-hover = 5.00ms / 50.00ms`, manteniendo el hot path interactivo dentro de presupuesto real.

---

## 9. Features interactivas

Estado actual:

- `ServingCache` extendido a:
  - hover;
  - definition;
  - signatureHelp;
  - completion.
- `ServingCache` ya particiona por feature y publica `hit/miss/eviction` por feature en stats/runtime health.
- `InteractiveServingPipeline` centraliza readiness, payload budget, stale guard, metrics y cache lookup/write para `hover`, `completion`, `completion-resolve` y `signatureHelp`; definition usa wrapper equivalente con key estructurada y stale guard.
- `ActiveDocumentServingSnapshot` ya materializa una vista read-only del activo con token, scope, query context, receiver, binding, hot members, texto de línea y masking reutilizable entre features.
- Hover ya tiene `HoverViewModel cache` y `NegativeHoverCache` con invalidación por documento, epoch, locale, `sourceOrigin`, watcher intake, shutdown y pressure policy.
- `references`, `rename` y CodeLens apoyados en candidate pool compartido y acotado por query/proyecto.
- Reuso de líneas y `maskedText` publicados por snapshot.
- `queryContext` y diagnostics de línea única leen solo la línea activa.
- Completion consume listas read-only segmentadas del catálogo del sistema y sirve documentación enriquecida sólo en `completionItem/resolve`.
- Completion, definition, diagnostics y semantic tokens delegan la adaptación final a `src/server/presentation`; los providers siguen resolviendo contexto, pero no poseen DTOs LSP complejos ni wording/payload final.
- `referenceSourcePool` reutiliza URIs normalizadas del workspace.
- `hotPathAllocationBudget.test.ts` fija ausencia de `JSON.stringify`, `getAllEntities` y `exportDocumentRecords` en features vigiladas.
- `interactiveHotPathGuards.test.ts` fija `no IO / no workspace scan / no full parse` para `hover`, `completion`, `signatureHelp`, `definition`, `documentSymbols` y `semanticTokens` con snapshot caliente.
- `SemanticQueryFacade` ofrece una entrada read-only para contexto posicional, target symbol, receiver type, callable, inheritance, enum context y catálogo owner-aware, coordinando `queryContext`, `semanticQueryService`, `InheritanceGraph`, `SystemCatalog`, `enumeratedContext` y `dataWindowBindingModel` sin crear otro store semántico.
- `hover` y `definition` ya consumen `SemanticQueryFacade`; otros providers deben migrarse sólo por slices focales con pruebas visibles.
- `resolvedSemanticModels.ts` define modelos server-side neutrales (`ResolvedSymbol*`, `ResolvedReceiver`, `ResolvedCallable`, `ResolvedEnumContext`) con confidence/reason/sourceOrigin sin Markdown ni DTO LSP.
- Linked editing reutiliza `queryContext` + `references` y solo publica sobre Local/Argument con resolución semántica única.
- Formatter conservador configurable corre en servidor LSP mediante `powerbuilder.formatDocument`.
- Hover normal ya sirve un payload compacto y accionable: contexto útil por tipo de símbolo, warnings reales y sin metadata interna de provenance/confidence por defecto.
- Runtime stats/journal ya distinguen `cache-hit`, `viewmodel-hit`, `negative-hit`, `miss`, `stale-discarded` y `readiness-degraded` sin logging ruidoso por request.
- Hover/completion/signatureHelp/diagnostics ya expanden `ownerType` por jerarquía para descendants custom de `datawindow`/`datawindowchild`/`datastore`, reutilizando `InheritanceGraph` sin scans globales adicionales.
- `documentAnalysis` ya sanea `containerSignature` antes del primer `;`, y `featureHandlers.ts` solo deja trazas de timings interactivos en primer uso o slow path `>= 50ms`.

---

## 10. Parsing y document symbols

Estado actual:

- `knowledge/parsing/utils` usa tipos internos para posiciones/rangos/símbolos documentales.
- DTOs LSP quedan en el borde de `features/documentSymbols`.
- `architectureImports.test.ts` protege firewall entre client/server/shared, purity de `shared`, aislamiento de `plugin_old`, build fuera del hot path, presentation sin internals runtime y frontera DataWindow/parsing.
- `documentSymbols` ejecuta reconciliación explícita entre:
  - `sections/typeBlocks` del parser;
  - facts/scopes del snapshot;
  - árbol LSP publicado.
- Se generan reason codes y reporte interno antes de servir outline.
- `logicalStatements` se derivan de `stripCommentsSmart` para evitar contaminación por comentarios.
- Parser degrada a `global` callables truncados antes del primer `type` real.
- Fuzzing determinista mantiene rangos monotónicos en scopes duplicados forward/implementation.

---

## 11. DataWindow y DataStore

Estado actual:

- `.srd` publica stubs navegables sin parsearse como PowerScript.
- `analyzeDocument` y `analyzeDocumentStructural` mantienen `.srd` en frontera DataWindow: sin secciones, scopes, logical statements ni control blocks PowerScript.
- `DataObject = "d_xxx"` resuelve hacia snapshot `.srd` indexado.
- `dataWindowModel` es modelo canónico único para:
  - bandas;
  - columnas `table`;
  - `retrieve`;
  - `retrieveArguments`;
  - `report(...)`;
  - controles nombrados;
  - metadata segura de expresiones;
  - referencias SQL del subset seguro.
- `dataWindowSafeMode`, `dataWindowBindingModel`, `DataWindowFastContext`, adapters de serving, signatureHelp, hover, definition, documentSymbols, property paths, completion/diagnostics `.srd` y `dataWindowSqlLineage` reutilizan el mismo backbone.
- `DataWindowFastContext` distingue DataWindow control, DataStore, DataWindowChild, `.srd` source y unknown; expone binding/DataObject con confidence/reason, columnas high-confidence, property paths seguros, buffers `DWBuffer` desde catálogo y built-ins owner-aware.
- Slice avanzado actual cubre:
  - `report(name=... dataobject=...)`;
  - `column.dddw.name`;
  - property paths `Describe/Modify(...DataWindow.Table.Select)`;
  - acceso directo `.Object.<control|column|property>`;
  - `GetChild()` sobre child DataWindows deterministas.
- Slice SQL seguro cubre aliases de `select`, `JOIN ... ON` simples y `WHERE` básico.
- SQL lineage queda como evidencia read-only ya disponible; no se calcula de forma profunda desde hover/completion/signatureHelp/definition.
- Expresiones `.srd` incluyen nodos `expression=`/`~t...`, completion segura y warnings conservadores.
- `datawindow-constants` se sirve como proyección oficial DataWindow owner-scoped sobre enumerados existentes.
- `datawindow-properties` y `datawindow-expression-functions` viven como dominios separados.

---

## 12. SQL, transacciones y runtime PowerBuilder

Estado actual:

- `SQLCA` se resuelve como `transaction` especial.
- `system-globals` y runtime singletons publican metadata tipada (`valueType`) y riesgo en catálogo.
- Consumers semánticos consumen metadata de dominio en vez de inferir `SQLCA` por nombre.
- `SetTransObject`/`SetTrans` se enlazan con `Retrieve`/`Update` en diagnostics.
- Completion/hover/signatureHelp filtran catálogo por `ownerType` para DataWindow/DataStore.
- Dependencias nativas externas se modelan como primer ciudadano ligero mediante:
  - `externalAlias`;
  - `externalDependencyKind` (`dll`, `pbx`, `unknown`);
  - hover explícito;
  - degradación honesta de rename/references/diagnostics.

---

## 13. System Catalog

Estado actual del source-of-truth:

```text
generated-primary-with-manual-overlays
```

Rails y dominios principales:

- `generated` como base oficial completa cuando existe evidencia oficial.
- `manual-core` como overlay curado explícito.
- `manualOverlay` como contrato explícito del catálogo.
- Merge policy provisional:
  - `override` manual gana;
  - `generated` sigue siendo base oficial;
  - `enrichment` se fusiona sin crear entradas competidoras.

Dominios cubiertos:

- global-functions;
- object-functions;
- datawindow-functions;
- system-events;
- statements;
- keywords;
- reserved-words;
- datatypes;
- system-object-datatypes;
- operators;
- pronouns;
- enumerated-types;
- enumerated-values;
- system-globals;
- datawindow-properties;
- datawindow-expression-functions;
- datawindow-constants;
- tooling-symbols.

Guardrails de catálogo:

- generated y manual-core no compiten sin policy.
- Enumerated types son canónicos sin `!`.
- Enumerated values conservan `!` y quedan ligados por `enumValueOf`.
- Tests bloquean solapes accidentales con keywords/reserved-words.
- `resolveLanguageSymbol()` excluye `tooling-symbols` del hot path interactivo.
- `buildCatalogConsistencyReport()` audita provenance por dataset y dominio.
- `workspace-check` consume summary de catálogo memoizado.
- `verify:catalog-coverage` endurece drift de `officialCoverage` en CI.

---

## 14. Catálogo generado y scraper

Estado actual:

- `scripts/generate_official_function_catalog.cjs` es rail reproducible principal.
- Wrapper `script/generate_official_function_catalog.cjs` conserva compatibilidad con documentación externa histórica y delega al script canónico plural.
- Artefactos relevantes:
  - `generated.generated.ts`;
  - `ownerTypes.generated.ts`;
  - `provenance.generated.ts`;
  - `officialCoverage.generated.ts`;
  - `generatedKeywordLexemes.generated.ts`;
  - `generatedBuiltinTypes.generated.ts`;
  - `enumeratedTypes.generated.ts`;
  - `enumeratedValues.generated.ts`;
  - `enumeratedCoverage.generated.ts`;
  - `enumeratedProvenance.generated.ts`;
  - `generatedCompleteness.generated.ts`.
- Generator publica modo `complete` por defecto.
- `gap-fill` queda solo por compatibilidad.
- Overloads oficiales se fusionan con identidad lógica para evitar `duplicateIds`.
- Scraper separa:
  - signatures reales;
  - argumentos bajo `Syntax`;
  - `returnType`/`returnDocumentation`;
  - `eventId/eventIds`;
  - metadata estructural de reserved words;
  - overlays ricos para system-object-datatypes.
- Fixtures offline congelan snapshots compactos para proteger extractor.

---

## 15. Localización documental del catálogo

Estado actual:

- `src/server/knowledge/system/localization/` publica overlays inmutables por locale.
- Índice español parcial disponible.
- Resolvedor memoizado con fallback `es -> en`.
- Identidad semántica no cambia por localización.
- `documentationService.ts` resuelve:
  - `summary`;
  - `documentation`;
  - `usageNotes`;
  - `obsoleteMessage`;
  - `returnDocumentation`;
  - documentación de parámetros.
- `hover.ts`, `completion.ts` y `signatureHelp.ts` consumen el servicio común.
- En completion, el overlay localizado se aplica en `completionPresentation.ts` durante initial/resolve sin cambiar `symbolId`, `domain` ni lookup keys.
- Setting `vscPowerSyntax.languageServices.documentationLocale` sincroniza `auto|en|es` desde cliente a servidor.
- `ServingCache` se segrega por locale efectiva.
- Report de localización publica cobertura, overlays incompletos, targets recuperados y problemas de authoring.

---

## 16. API pública y bridge IA

Estado actual:

- API pública v2 versionada.
- Descriptor contractual con inventario estable de métodos, schemas y tools.
- Bridge read-only JSON-RPC/local tool servido por API pública.
- Dispatch por nombre estable y payloads tipados.
- Tool `contract` expone task execution contracts.
- Contratos describen:
  - inputs/outputs;
  - dry-run;
  - límites write-enabled;
  - receipts;
  - handoff SDD.
- Observabilidad local versionada en `ApiPublicContractDescriptor`.
- `externalTelemetry = false`.
- `localOnly = true`.

---

## 17. Tools read-only para IA y diagnóstico

Tools y reports operativos:

- `workspace-check`;
- `object-check`;
- `explain-diagnostic`;
- `explain-system-symbol`;
- `explain-semantic-query`;
- `ai-task-context-bundle`;
- `task-execution-dry-run`;
- `task-replay-bundle`;
- semantic workspace snapshot export/import;
- semantic snapshot diff;
- dependency graph Mermaid/JSON;
- cross-project symbol conflicts;
- workspace migration assistant;
- build profile/environment matrix;
- code metrics report;
- technical debt report;
- support bundle offline;
- semantic repro pack.

Principio común:

```text
Todos reutilizan surfaces read-only existentes y no abren un segundo motor semántico.
```

---

## 18. Rails write-enabled

Estado actual:

- Framework versionado de code actions seguras sobre diagnósticos publicados.
- Code actions con:
  - `catalogVersion`;
  - preview explícita;
  - preflight obligatorio;
  - bloqueos por `sourceOrigin` y dynamic strings.
- Workflows write-enabled:
  - `applySpecDrivenPblUpdate`;
  - `applySpecDrivenPblUpdateBatch`.
- Reutilizan:
  - `safeEditPlan`;
  - export ORCA fresco;
  - edits explícitos sobre staging;
  - rail de import con backup/ledger/journal.
- Devuelven `validationReceipt`.

Regla:

```text
No existe postprocesado legacy paralelo fuera de estos rails.
```

---

## 19. ORCA legacy rail

Estado actual partido en capas:

1. Adapter base server-side, out-of-process y cancelable.
2. Capability read-only cliente-side resuelta desde configuración explícita o `PB_ORCA_PATH`.
3. Export controlado a:
   - `.vsc-powersyntax/orca-export/orca-staging`;
   - `.vsc-powersyntax/orca-export/scripts`;
   - `.vsc-powersyntax/orca-export/state`.
4. Aliases persistidos desde carpeta staging hacia PBL original.
5. `KnowledgeBase` y query/serving priorizan siempre source real.
6. `last-export.state` conserva fingerprints del source real por objeto.
7. Rail write-enabled único para import/regenerate/rebuild desde staging.
8. Backup binario, ledgers persistidos y journal técnico antes de tocar PBL.
9. `import` bloquea fingerprint mismatch y stale staging.
10. `orcaTooling.packagingPolicy` declara que packaging EXE/PBD/DLL no está expuesto salvo feature flag dedicado.

---

## 20. PBAutoBuild y build health

Estado actual:

- Cliente resuelve `PBAutoBuild250.exe` por configuración, entorno o candidatos por defecto.
- Servidor descubre/valida build files JSON y lista utilizables.
- Runner server-side dedicado ejecuta PBAutoBuild out-of-process con selección segura, timeout y cancelación.
- Parser server-side resuelve problemas de build en colección diagnóstica separada del canal semántico.
- Cliente consolida snapshot único de build health.
- Cliente recuerda/repite último build frecuente por workspace.
- Exporta bundles neutrales de CI/CD bajo `tools/pbautobuild-ci/<perfil>`.
- Packaging ORCA de EXE/PBD/DLL queda explícitamente no expuesto detrás de feature flag no abierto.

---

## 21. UX actual

Superficies operativas:

- Project Health Dashboard read-only.
- Support matrix oficial derivada de `RuntimeStatusStats` + `semanticWorkspaceManifest`.
- Object Explorer read-only sobre manifest enriquecido.
- Current Object Context Panel read-only siguiendo editor activo.
- Diagnostics Explainability Panel read-only.
- Commands Markdown para reports principales.

Regla cumplida:

```text
UX consume contratos publicados y no calcula semántica propia.
```

---

## 22. Workspace model y discovery

Estado actual:

- `UnifiedProjectModel` materializa topología compartida.
- Project model incluye nodos legacy `kind: library` para roots `.pbl` no cubiertos por `.pbt/.pbproj`.
- Soporte para modo `pbl-only` en surfaces read-only antes de staging ORCA.
- `WorkspaceState`, manifest, Object Explorer, cacheStore, matriz build y ORCA staging preservan identidad por URI completa entre roots homónimos.
- `sourceOrigin` contextual se decide por marker topológico más cercano.
- Watcher incremental completo sobre source + markers de topología.
- Refresh de `UnifiedProjectModel`/`sourceOrigin` desde puente LSP → watcher.
- Sin rediscovery completo para cambios calientes.
- Selector LSP del cliente y guard server-side evitan servir markers `.pbw/.pbt/.pbproj/.pbsln` y `.pbl` binarios como documentos PowerScript.

---

## 23. Diagnostics y lifecycle PowerBuilder

Estado actual:

- Diagnostics snapshot agrupado por proyecto/objeto.
- Contrato diagnóstico estable por `diagnostic.code`.
- Helpers compartidos para IDs emitidos actuales y fallback legacy de `source` donde haga falta.
- Eventos PowerBuilder tratados como entidades de primera clase.
- `on object.event` conserva owner real.
- `call super::create` resuelve sobre on-handlers reales.
- `TriggerEvent/PostEvent` con literal estable reutiliza backbone semántico.
- `hierarchyInspection` reconstruye create/destroy desde snapshot semántico.
- Hover explica `constructor/destructor` desde el mismo modelo.
- Diagnostics emite warnings suaves:
  - `missing-super-*`;
  - `missing-trigger-*`;
  - `unresolved-*`.
- Code metrics y technical debt report proyectan `lifecycleWarnings` y hotspot `lifecycle-risk`.

---

## 24. Hotspots y refactor de entrypoints

Estado actual:

- `extension.ts`, `server.ts`, `featureHandlers.ts`, `completion.ts`, `hover.ts`, `signatureHelp.ts`, `definition.ts`, `diagnostics.ts` y los adapters DataWindow siguen siendo hotspots principales vigilados.
- `server.ts` se redujo a bootstrap + composición de controladores runtime y registro por dominios.
- Lifecycle/document/features/commands viven en handlers separados:
  - `handlers/lifecycleHandlers.ts`;
  - `handlers/documentHandlers.ts`;
  - `handlers/featureHandlers.ts`;
  - `handlers/featureHandlerRegistration.ts`;
  - `handlers/buildCommandHandlers.ts`;
  - `handlers/reportCommandHandlers.ts`;
  - `handlers/runtimeCommandHandlers.ts`;
  - `handlers/commandHandlerRegistration.ts`.
- Orquestación local delegada en:
  - `cache/semanticCacheRuntimeController.ts`;
  - `runtime/runtimeProgressController.ts`;
  - `runtime/managedRuntimeWorkloads.ts`;
  - `runtime/managedBuildWorkloads.ts`.
- LRU de CodeLens vive en `features/codeLensResultCache.ts`.
- Runtime distribuido desde `dist/client/extension.js` y `dist/server/server.js`.
- `out/server/server.js` queda solo como fallback de Development, no como dependencia VSIX productiva.
- `release:verify` ejecuta `npm test`, architecture rapid, docs drift, performance gate, catalog coverage, packaging VSIX, content verification, installed smoke y summary final.
- `.github/workflows/release-readiness.yml` ejecuta el mismo carril con `xvfb-run -a` y retiene el VSIX `14` días.

---

## 25. Testing y quality gates

Guardrails vigentes:

- Import firewall por capas.
- Architecture metrics budgets.
- Hot path allocation budget.
- Hot path harness reusable con spies de IO/full parse.
- Aislamiento `plugin_old` como `Reference-only`, con guard para static import, dynamic `import()` y `require()` desde `src/**`.
- Payload budgets LSP interactivos por feature.
- Catalog generator fixtures offline.
- Catalog consistency report.
- Catalog coverage verify en CI.
- Snapshot fixtures versionadas para contratos públicos.
- Tests de compatibilidad de semantic snapshot/support bundle/public contract/read-only bridge.
- Smoke real sobre PFC/OrderEntry para oracle interno de consistencia semántica.
- Health checker runtime.
- Workspace-check como dashboard/gate reproducible.
- Docs drift valida backlog/current-focus/roadmap/done-log/specs, referencias a prompts reales y nombres `.prompt.md` en `.github/prompts`.

---

## 26. Riesgos actuales a vigilar

### 26.1 Riesgo de documento monolítico

El estado implementado puede volver a crecer dentro de `Architecture.md`. Debe mantenerse en este documento o documentos especializados.

### 26.2 Riesgo de catálogo como hotspot documental

El catálogo generated/manual/localization tiene suficiente complejidad para vivir en `system-catalog-architecture.md`.

### 26.3 Riesgo de tool bridge duplicando semántica

Todo tool IA debe seguir consumiendo API pública/contratos existentes, nunca estructuras internas.

### 26.4 Riesgo ORCA write-enabled

Todo rail write-enabled debe conservar preflight, backup, ledger, journal y validation receipt.

### 26.5 Riesgo PBAutoBuild/ORCA fuera de budgets

Build/legacy no deben interferir con hot path interactivo.

### 26.6 Riesgo DataWindow

Mantener `.srd` como sublenguaje separado y evitar reparsers por feature.

### 26.7 Riesgo de source origin ambiguo

Cualquier operación peligrosa debe bloquearse o degradar si `sourceOrigin` no es confiable.

### 26.8 Riesgo de symbol enrichment sin owner

Los enrichments futuros de símbolos deben entrar por [symbol-system.md](symbol-system.md), `SemanticQueryFacade`, `SystemCatalog`, `DataWindowFastContext` o `src/server/presentation` según corresponda. No deben reabrir providers con lógica paralela ni cargar documentación larga en completion initial.

---

## 27. Próximas recomendaciones documentales

Se recomienda consolidar primero las superficies documentales ya existentes antes de abrir rutas nuevas:

- `docs/localization.md` para localización y overlays del catálogo.
- `docs/symbol-system.md` para modelo conceptual de símbolos, sources, consumers, enrichments, i18n y regression matrix.
- `docs/architecture-implementation-map.md` para el cruce entre capas, owners, flujos, cachés y validación ejecutable.
- La Parte 2 del `architecture-implementation-map` ya quedó ampliada con fichas módulo a módulo, estado explícito de caches recomendadas, auditoría `cache hit vs cache miss` y backlog `DEVTOOLS-*` derivado, sin promoción automática a `docs/current-focus.md`.
- `docs/ai-orchestration.md` para ownership, contratos públicos read-only, tools/MCP, safe-edit, validación y seguridad IA.
- `docs/ai/README.md` y `docs/ai/agent-skill-routing.md` para índice, routing de agents/skills y operación IA.
- `docs/release.md` para release readiness, VSIX, Marketplace/pre-release, artifact retention y publish policy.
- `docs/troubleshooting.md` para failure reasons de release, PBAutoBuild, ORCA y external command rails.
- `docs/legacy-isolation.md` para policy `plugin_old` reference-only y extracción segura de heurísticas.
- `docs/technical-debt-inventory.md` para deuda técnica categorizada, estados y cleanup receipts.
- `docs/developer-workflows.md` para build, packaging, VSIX, PBAutoBuild y ORCA.
- `docs/performance-budget.md` para budgets, gates y observabilidad operativa.

---

## 28. Resumen de alineación

El estado actual está fuertemente alineado con la arquitectura objetivo:

- cliente mínimo: **alineado**;
- LSP/server como runtime principal: **alineado**;
- core agnóstico: **alineado con guardrails**;
- knowledge backbone compartido: **alineado**;
- source origin: **alineado**;
- readiness/evidence/confidence: **alineado**;
- persistencia versionada: **alineado**;
- DataWindow como sublenguaje: **alineado**;
- catálogo gobernado: **alineado**;
- API pública IA sin acoplar core: **alineado**;
- ORCA/PBAutoBuild separados: **alineado**;
- documentación viva: **necesita disciplina para evitar monolitos**.
