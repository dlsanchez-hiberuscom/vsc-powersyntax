# Testing — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Definir cómo se valida el plugin y qué evidencia mínima debe existir antes de considerar estable un cambio.

Este documento no describe todos los tests posibles.
Define la **estrategia de validación** del proyecto y las reglas mínimas de calidad.

---

## 2. Objetivo de testing

La estrategia de testing debe proteger estas 4 cosas:

1. **corrección funcional**,
2. **no bloqueo del editor**,
3. **estabilidad del core semántico**,
4. **evolución segura del producto**.

El testing debe demostrar que el plugin sigue siendo:

- útil,
- rápido,
- no bloqueante,
- coherente,
- y estable en proyectos reales.

---

## 3. Principios de testing

### 3.1 Testear primero lo que más rompe el producto
Se prioriza siempre este orden:

1. archivo activo e interacción básica,
2. núcleo semántico compartido,
3. invalidación / incrementalidad,
4. persistencia / warm resume,
5. comportamiento global del workspace,
6. especialización PowerBuilder,
7. automatización externa.

### 3.2 No todo cambio necesita el mismo tipo de prueba
Cada cambio debe validar lo suficiente, pero no sobreactuar.

### 3.3 El test debe seguir la arquitectura
- las pruebas unitarias validan lógica pura,
- las integraciones validan contratos reales,
- las smoke validan arranque y wiring,
- las performance validan presupuestos y regresiones.
- cuando una suite ejerce la extensión real, el build previo debe recompilar cliente y servidor y no reutilizar `out/` obsoleto.

### 3.4 El rendimiento también se prueba
No basta con que funcione.
Debe seguir funcionando **sin bloquear** y dentro de presupuestos razonables.

### 3.5 Los corpus reales importan
Los fixtures pequeños no sustituyen la validación sobre proyectos grandes y legacy.

---

## 4. Tipos de prueba

## 4.1 Smoke tests
**Objetivo:** comprobar que la extensión arranca y no falla de forma catastrófica.

Deben cubrir como mínimo:
- activación básica,
- arranque cliente/servidor,
- apertura de archivo PowerBuilder,
- contribution points principales.

La matriz mínima actual de smoke real con `vscode-test` debe cubrir activación genérica, PFC Solution y PFC Workspace.
Además, la smoke de formatting debe cubrir el provider manual y `formatOnSave` sobre un documento PowerBuilder real.
La smoke de PFC Solution debe incluir además una muestra determinista de clases reales abierta en secuencia, pidiendo `Document Symbols`, para detectar caídas del LSP en rutas de persistencia/cache al abrir corpus legacy.
La smoke de code actions debe cubrir además un quick fix seguro real desde Problems/CodeAction sobre un diagnóstico efectivamente publicado por el servidor.
Las smokes `test/smoke/extension.test.ts` y `test/smoke/health-report.extension.test.ts` fijan además `B278/B297`: registro y ejecución read-only del core maintenance command pack, incluido el runtime self-test, junto con el export real de `health report` bajo `tools/health-reports` o destino explícito.

## 4.2 Unit tests
**Objetivo:** validar lógica aislada, pura y reutilizable.

Deben cubrir prioritariamente:
- parsing,
- snapshots,
- symbols/scopes,
- invalidación,
- scheduler/runtime,
- query engine,
- utilidades semánticas puras.

Estado actual relevante:
- `test/server/unit/systemCatalog.test.ts`, `catalogV2.test.ts`, `catalogConsistency.test.ts`, `inheritanceGraph.test.ts`, `hierarchyInspection.test.ts`, `currentObjectContext.test.ts`, `diagnostics.test.ts` e `impactAnalysis.test.ts` fijan ya la cadena nativa del runtime hasta raices como `powerobject`, evitando que diagnostics y surfaces read-only diverjan al llegar al borde del `system catalog`.
- `test/server/unit/runtimeJournal.test.ts`, `buildOrcaJournalStore.test.ts`, `runtimeHealth.test.ts`, `queryTrace.test.ts`, `servingCache.test.ts` y `statusBarPresentation.test.ts` fijan el journal exportable del runtime, la proyección persistente de `build|legacy`, el health report estructurado, los observers de trace/cache y su proyección visible en stats/status.
- `test/server/unit/pbAutoBuildDetection.test.ts`, junto con `statusBarPresentation.test.ts`, fija la detección read-only de `PBAutoBuild250.exe` por configuración/entorno/candidatos por defecto y su proyección visible en status/health sin lanzar build.
- `test/server/unit/pbAutoBuildBuildFiles.test.ts`, junto con `workspace.test.ts` y `watchedFileIntake.test.ts`, fija el discovery/validation read-only de build files JSON de PBAutoBuild, su mapeo a markers `.pbw/.pbt/.pbproj/.pbsln` y el refresh incremental por watcher.
- `test/server/unit/pbAutoBuildRunner.test.ts`, junto con `buildOrcaJournalStore.test.ts`, `statusBarPresentation.test.ts` y `test/smoke/extension.test.ts`, fija el runner out-of-process de PBAutoBuild, la selección segura del build file, cancelación/timeout y el registro visible/persistente de eventos build cuando no hay build activo.
- `test/server/unit/pbAutoBuildLogParser.test.ts` y `pbAutoBuildProblems.test.ts`, junto con la smoke corta del carril moderno, fijan el parsing estructurado de la salida de build y la publicación segura de problemas solo cuando el objeto del log resuelve de forma única a un archivo del workspace.
- `test/server/unit/pbAutoBuildHealth.test.ts`, junto con `statusBarPresentation.test.ts` y la smoke corta del carril moderno, fija el snapshot unificado de build health y su proyección coherente en tooltip, stats, health report y menú del cliente.
- `statusBarPresentation.test.ts` y `test/smoke/extension.test.ts` fijan además el perfil de build recordado, los comandos `runLastPbAutoBuild` / `runPbAutoBuildWithPicker` y su integración visible en el carril moderno del cliente.
- `test/server/unit/pbAutoBuildCiHelper.test.ts`, junto con la smoke corta filtrada por `PBAutoBuild`, fija el bundle neutral exportable (`manifest` + scripts PowerShell/CMD/Bash) y el registro visible del comando `exportPbAutoBuildCiHelper`.
- `test/server/unit/orcaStagingExport.test.ts`, `test/server/unit/orcaStagingImport.test.ts`, `buildOrcaJournalStore.test.ts` y `orcaRunner.test.ts`, junto con `workspace.test.ts`, `semanticWorkspaceManifest.test.ts` y `fileSystem.test.ts`, fijan el export a staging, el `state` persistido, el preflight de import, el backup binario real, el ledger `last-import-ledger.json`, el journal persistente `build-orca-journal.json` y la restauración de aliases hacia la librería legacy original sin materializar una `.pbl` fantasma.
- `test/server/unit/knowledgeBase.test.ts`, `semanticQueryService.test.ts`, `semanticWorkspaceManifest.test.ts` y `definition.test.ts` fijan la prioridad efectiva `source real > orca-staging` en buckets globales, query engine, Definition y serving truncado del manifest.
- `test/server/unit/symbolKey.test.ts`, `references.test.ts`, `rename.test.ts`, `semanticWorkspaceManifest.test.ts`, `dependencyGraph.test.ts` y `crossProjectSymbolConflicts.test.ts` fijan `B279`: identidad exacta por `buildSymbolKey`, family key relajada solo para conflictos, no mezcla `solution-source`/`orca-staging` y publicación consistente de `identityKey` en manifest, dependency graph, exported symbols y candidatos cross-project.
- `test/server/unit/semanticQueryService.test.ts`, `queryContext.test.ts`, `hoverFormat.test.ts`, `hover.test.ts`, `definition.test.ts`, `references.test.ts` y `rename.test.ts` fijan `B280`: `ambiguityKind` canónico, evidence `fallback-ambiguity` y `source-origin-conflict`, proyección visible diferenciada en hover y ausencia de regresiones en definition/references/rename.
- `test/server/unit/documentAnalysis.test.ts`, `semanticQueryService.test.ts`, `definition.test.ts`, `signatureHelp.test.ts` e `impactAnalysis.test.ts` fijan `B281`: overloads preservados por firma, descarte `discarded-signature`, prototype shadowing, routing de definition/signatureHelp por aridad/tipos literales simples y override filtering signature-aware.
- `test/server/unit/dynamicStringReferences.test.ts`, `references.test.ts`, `rename.test.ts`, `codeActions.test.ts`, `impactAnalysis.test.ts`, `safeEditPlan.test.ts` y `dependencyGraph.test.ts` fijan `B282`: `invocationRisk` público uniforme, bloqueo de edición ante riesgos `dynamic|fallback|external`, degradación de references sin declaraciones y metadata de riesgo en code actions/dependency graph.
- `test/server/unit/dataWindowModel.test.ts`, `dataWindowSafeMode.test.ts`, `dataWindowLegacySafeMode.test.ts`, `dataWindowSqlLineage.test.ts`, `documentSymbols.test.ts`, `completion.test.ts`, `hover.test.ts`, `diagnostics.test.ts`, `currentObjectContext.test.ts`, `signatureHelp.test.ts`, `powerBuilderCodeMetrics.test.ts`, `powerBuilderTechnicalDebtReport.test.ts` y `crossSurfaceGoldenMatrix.test.ts` fijan `B287`: `dataWindowModel` como backbone único para `retrieve`, `retrieveArguments`, bandas, columnas, reports y SQL refs, sin reparseo local por safe mode, bindings, lineage, completion, métricas o reports.
- `test/server/unit/dataWindowModel.test.ts`, `dataWindowLegacySafeMode.test.ts`, `dataWindowSqlLineage.test.ts` y `crossSurfaceGoldenMatrix.test.ts` fijan `B288`: subset SQL seguro en `dataWindowModel` con aliases de `select`, `JOIN ... ON` simples, `WHERE` básico y degradación honesta para cláusulas complejas con subquery, sin abrir un parser SQL general.
- `test/server/unit/sourceOrigin.test.ts`, `documentAnalysis.test.ts`, `analysisCache.test.ts`, `workspace.test.ts` y `watchedFileIntake.test.ts`, junto con `semanticWorkspaceManifest.test.ts` y `powerbuilderSemanticGolden.test.ts`, fijan el `sourceOrigin` contextual en análisis documental, el reanálisis por cambio de provenance y la rematerialización incremental de snapshots tras cambios topológicos, incluyendo el caso mixed-root donde la inferencia debe seguir el marker topológico más cercano y no contaminar roots workspace con `solution-source`.
- `test/server/unit/queryScopePolicy.test.ts` y `featureReadiness.test.ts` fijan la policy v2 de `B266`, con registro único por consumer, readiness/confidence/fallback centralizados y `signatureHelp` dentro del mismo gate declarativo.
- `test/server/unit/referenceSourcePool.test.ts`, junto con `references.test.ts`, `rename.test.ts` y `codeLensReferences.test.ts`, fija el pool acotado por proyecto/candidatos, el reuso de `maskedText` en el hot path de `references`/`rename`/CodeLens, el no-widening a `workspace` sin routing de proyecto y la exclusión de `orca-staging/generated` cuando la policy del consumer no los permite.
- `test/server/unit/analysisCache.test.ts`, `knowledgeBase.test.ts` y `completion.test.ts` cubren la separación entre cierre de documento y borrado real de conocimiento, consultas acotadas sobre `KnowledgeBase` y el cap global de completion ya colgado de la policy central de consumer.
- `test/server/unit/knowledgeBase.test.ts` y `test/server/performance/knowledgeBase.perf.test.ts` fijan el copy-on-write por bucket en `KnowledgeBase`, la atomicidad defensiva tras mutaciones y el presupuesto incremental de `upsert/remove` con miles de documentos sinteticos.
- `test/server/unit/powerbuilderFiles.test.ts` y `test/smoke/lsp-guards.extension.test.ts` fijan el guard de borde para markers `.pbw/.pbt/.pbproj/.pbsln` y `.pbl`, comprobando que pueden seguir participando en discovery/topologia pero no reciben diagnostics ni providers semanticos aunque se fuerce un lenguaje servido por el cliente.
- `test/server/unit/watchedFileChangeBridge.test.ts` y `watchedFileIntake.test.ts` fijan el intake incremental de markers topológicos, la reconciliación de `sourceOrigin`/routing y la rematerialización de snapshots sin rediscovery completo.
- `test/server/unit/formatDocument.test.ts` y `powerBuilderFormatter.test.ts` fijan el formatter server-side, sus budgets explícitos y el motor puro reutilizado; `test/smoke/formatting.extension.test.ts` cubre provider manual y `formatOnSave` sobre VS Code real.
- `test/server/unit/architectureImports.test.ts` fija ya el guardrail ampliado de `B228/B277`: `knowledge/parsing/utils` no pueden volver a importar `vscode`/`vscode-languageserver`, `client` no puede importar `server`, `runtime/features` no pueden importar `client`, `shared` no puede importar `client/server` y `build` no puede colgarse del hot path semántico interactivo; `documentSymbols.test.ts` mantiene verde el mapper de borde.
- `B353` añade `npm run test:architecture:metrics`: `tools/run-architecture-hotspot-guard.mjs` escribe `artifacts/performance/architecture-hotspot-guard.json`, `test/server/unit/architectureImports.test.ts` lo ejecuta dentro de la suite unitaria y el guard fija budgets explícitos para `src/client/extension.ts`, `src/server/server.ts` y `src/client/commandRegistration.ts`, separando además la allowlist de `generated.generated.ts`, `objectFunctions.ts`, `dataWindowFunctions.ts`, `manual/language/enumerations/index.ts`, `globalFunctions.ts` y `systemEvents.ts`.
- `B346` queda fijado además por `npm run test:unit -- --grep architectureImports`, la smoke focal `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"` y el grep directo de comandos cliente sobre `runtime self-test|settings governance|restartServer|PBAutoBuild|ORCA legacy|dashboard de salud|Object Explorer|Current Object Context`, dejando trazado que `src/client/commandRegistration.ts` y los `ensure*Controller()` no rompen IDs, activación contractual ni paneles principales.
- `B356` formaliza `npm run test:architecture:rapid`: el runner reutiliza `smoke/pfc-workspace-extension`, `smoke/pfc-solution-extension`, `performance/pfc-workspace`, `performance/pfc-workspace-smoke`, `performance/pfc-solution-smoke`, `performance/orderentry`, `performance/orderentry-smoke` y `performance/orderentry-semantic`, y deja `artifacts/performance/architecture-rapid-gate.json` como evidencia con `passed`, `passed-with-skips` o `skipped` según la disponibilidad real de corpus locales.
- `B347` queda cubierto además por `test/server/unit/architectureImports.test.ts`, `test/server/performance/pfc-workspace.smoke.test.ts`, `test/server/performance/orderentry.smoke.test.ts` y smokes focales de `formatting`, `PBAutoBuild`, `ORCA legacy` y `health report`, fijando que la descomposición de `src/server/server.ts` hacia `handlers/lifecycle/document/feature/build/report/runtime` no rompe lifecycle, hot path ni command routing observable.
- `test/server/unit/documentSymbolsReconciliation.test.ts`, junto con `documentSymbols.test.ts`, fija el reporte de reconciliación parser/snapshot/LSP y sus reason codes antes de publicar el outline.
- `test/server/unit/memoryBudgets.test.ts`, `memoryPressurePolicy.test.ts`, `runtimeHealth.test.ts`, `semanticWorkspaceManifest.test.ts`, `crossProjectSymbolConflicts.test.ts`, `workspaceMigrationAssistant.test.ts`, `powerBuilderCodeMetrics.test.ts` y `powerBuilderTechnicalDebtReport.test.ts` fijan el cierre de `B274`: reporte unificado de budgets, policy adaptativa con thresholds artificiales, purga y pausa de escrituras en serving cache bajo presión, aplazamiento de `background-indexing|maintenance|ai-tooling` y caps defensivos para reports pesados sin apagar el carril interactivo.
- `test/server/unit/publicApi.test.ts`, `semanticWorkspaceSnapshot.test.ts`, `settingsGovernance.test.ts` y la smoke focal de configuración en `test/smoke/extension.test.ts` fijan `B244/B294`: el contrato público v2, el bridge/snapshot versionado y la gobernanza de settings/perfiles con los seis presets corporativos sin dejar drift contractual.
- `test/server/unit/semanticWorkspaceSnapshot.test.ts`, `publicApi.test.ts`, `supportBundle.test.ts` y `test/fixtures/compatibility/*.json` fijan `B269`: snapshots legados compatibles sin `schemaVersion` o `summary` materializado migran de forma segura, el manifest versionado externo roundtripea sobre el carril de snapshot y `public-contract`, `read-only-tool-bridge` y `support bundle manifest` mantienen compatibilidad minor y serialización estable.
- `test/server/unit/publicApi.test.ts` y `supportBundle.test.ts` fijan `B271`: el contrato público declara observabilidad local versionada sin telemetría externa, cubriendo readiness/indexing/cache/memory/latency/build/ORCA/diagnostics/query trace/health y marcando el support bundle como export offline saneado que requiere acción explícita del usuario.
- `test/server/unit/supportBundle.test.ts` y `test/smoke/support-bundle.extension.test.ts` fijan `B295`: paths, snippets, diagnostics, settings y manifest del support bundle se redaccionan según el perfil activo, incluyendo `summary-only` para `ci-support` y `support-safe` cuando corresponde.
- `test/server/unit/powerbuilderParserResilienceFuzz.test.ts`, junto con `statementSplitter.test.ts`, `documentAnalysis.test.ts`, `externalFunctions.test.ts`, `diagnostics.test.ts`, `powerbuilderSemanticGolden.test.ts` y `corpusRegression.test.ts`, fija `B272`: fuzzing determinista sobre comentarios anidados, strings raros, continuaciones `&`, SQL embebido, external functions, prototypes incompletos, eventos, `try/catch/finally`, labels y EOF truncado; `logicalStatements` salen ya del stripper canónico sin arrastrar comentarios al texto lógico, los scopes de type repetidos mantienen rangos monotónicos y los callables malformados previos al primer `type` degradan a `global` en vez de colgarse del objeto futuro.
- `test/server/unit/coreMaintenanceCommandCatalog.test.ts`, junto con `test/smoke/extension.test.ts` y `test/smoke/health-report.extension.test.ts`, fija `B278/B297`: los diez comandos actuales del pack quedan tipados y clasificados entre `read-only` y `confirmable`, el wiring visible permanece estable, el health report exporta dashboard/stats/manifest reales del workspace y el runtime self-test devuelve su reporte Markdown sin abrir un rail paralelo.
- `test/server/unit/runtimeSelfTest.test.ts` fija `B297`: el self-test rápido del runtime proyecta checks accionables para API pública, LSP/runtime, cache/persistencia, project model, diagnósticos, build snapshot y ORCA snapshot con degradación honesta cuando faltan snapshots auxiliares.
- `test/server/unit/publicApi.test.ts`, `supportBundle.test.ts` y la smoke focal `test/smoke/extension.test.ts` fijan además el `taskExecutionCatalog` versionado, la simulación declarativa de dry-run y su exposición por el tool `contract` antes de cualquier rail agent-ready write-enabled.
- `test/server/unit/semanticConsistencyOracle.test.ts` fija el oracle interno de consistencia semántica con casos sanos, divergencias forzadas y convivencia real/orca-staging, reutilizando `currentObjectContext`, manifest, dependency graph, diagnostics y lineage DataWindow sin abrir otra surface pública.
- `test/server/unit/crossSurfaceGoldenMatrix.test.ts`, junto con `powerbuilderSemanticGolden.test.ts`, `semanticConsistencyOracle.test.ts`, `documentSymbols.test.ts`, `workspaceSymbols.test.ts`, `semanticTokens.test.ts`, `impactAnalysis.test.ts`, `safeEditPlan.test.ts`, `semanticWorkspaceManifest.test.ts`, `dependencyGraph.test.ts`, `dataWindowSqlLineage.test.ts` y `supportBundle.test.ts`, fija la matriz golden visible de `B273` sobre un fixture compartido, congelando `documentSymbols`, `workspaceSymbols`, `hover`, `definition`, `references`, `rename eligibility`, diagnostics, semantic tokens, `currentObjectContext`, `impactAnalysis`, `safeEditPlan`, manifest, dependency graph, DataWindow lineage y support bundle con actualización explícita cuando cambie el contrato.
- `test/server/unit/semanticDiff.test.ts` y `test/server/unit/watchedFileIntake.test.ts` fijan ya la proof suite incremental de `B265`: cambio cosmético, implementation-only, prototype-only heredado, ancestor signature, `.srd`/`DataObject`, marker/sourceOrigin, external function, ORCA staging y bursts del watcher, comprobando qué snapshots, caches, manifest, dependency graph, diagnostics y context packs cambian o permanecen estables.
- `test/server/unit/diagnosticsExplainabilityPanelModel.test.ts`, `frameworkKnowledgePacks.test.ts`, `semanticWorkspaceManifest.test.ts` y `safeBatchRefactorPlan.test.ts` cubren explainability UX, knowledge packs curados y planificación batch read-only reutilizando el backbone existente.

Regla:
- no depender de VS Code,
- no depender del transporte LSP,
- no depender del filesystem real salvo necesidad muy controlada,
- y en suites ejecutadas con `vscode-test` + `mocha.ui = tdd`, usar los globals `suite` y `test` en lugar de importar `suite/test` desde `mocha`.

## 4.3 Integration tests
**Objetivo:** validar el comportamiento real extremo a extremo.

Deben cubrir:
- Document Symbols,
- Hover,
- Definition,
- Completion,
- Signature Help,
- Diagnostics,
- invalidación visible,
- y features activas del LSP.

## 4.4 Performance tests
**Objetivo:** detectar regresiones de latencia, indexación, memoria o warm resume.

Deben medir:
- primer valor en archivo activo,
- discovery,
- cold indexing,
- warm indexing,
- análisis por documento,
- y consumo de memoria en escenarios representativos.

Regla específica de runner:
- las suites de performance ejecutadas por `vscode-test` deben usar únicamente Mocha/TDD (`suite`/`test` globals). No importar `node:test`, porque sus tests se registran y ejecutan durante la carga de archivos del runner, pueden solaparse con benchmarks Mocha y contaminar mediciones de cold indexing.

Estado actual relevante:
- `test/server/performance/ci-budget-gate.perf.test.ts` y `tools/run-performance-budget-gate.mjs` fijan el gate determinista de CI/local sobre corpus publico legacy y knowledge base sintetica, serializando evidencia en `artifacts/performance/performance-budget-gate.json`.
- `test/server/performance/large-workspace-incremental.perf.test.ts` cubre rafagas incrementales y masivas sobre workspaces grandes sinteticos, actua como gate de presupuesto para `B265` y ya se integra en `npm run test:performance:gate`.
- `test/server/performance/session-stability-soak.perf.test.ts` y `tools/run-session-stability-soak.mjs` fijan `B275` como soak local opt-in: simulan apertura/cierre, watcher bursts, diagnostics, hover/completion, build snapshot, support bundle, cache flush y workspace resume sobre un workspace sintético, y serializan evidencia en `artifacts/performance/session-stability-soak.json` y `artifacts/performance/session-stability-soak.md`.
- `test/server/unit/hotPathAllocationBudget.test.ts`, junto con `queryContext.test.ts`, `completion.test.ts`, `diagnostics.test.ts`, `referenceSourcePool.test.ts`, `references.test.ts`, `definition.test.ts` y `rename.test.ts`, fija `B276` como guard local/CI del hot path: bloquea splits completos de documento, `JSON.stringify`, `getAllEntities`/`exportDocumentRecords`, clonación del catálogo global del sistema y renormalización redundante del workspace en features interactivas vigiladas.
- `test/server/unit/catalogGeneratorScript.test.ts` fija ahora `B370` sobre snapshots compactos offline en `test/fixtures/catalog-generator/`: el generator oficial compara sin red casos críticos de `ApplyTheme`, `AddItemArray`, `SetItemDate`, `OLEActivate`, `BeginDrag`, `DragDrop`, `PDFDocumentProperties` y reserved words, congelando `usageNotes`, signatures DW, `eventId/eventIds`, owner mappings, `baseType/properties/functions/events` e `identifierPolicy` con diffs revisables por fixture.
- `catalogV2.test.ts`, `catalogConsistency.test.ts` y `catalogProvenanceAudit.test.ts` revalidan además el baseline runtime que dejó `B366` después de cada regeneración real del catálogo: `PB_KEYWORDS` sigue alineado con vocabulario oficial, `AddItemArray` mantiene parámetros estructurados y `PDFDocumentProperties` resuelve desde runtime con `baseType`, `properties`, `functions` y `events` sin perder provenance ni consistencia de dataset.
- `catalogGeneratorScript.test.ts`, `catalogV2.test.ts`, `catalogConsistency.test.ts` y `catalogProvenanceAudit.test.ts` fijan ya `B367`: el generator oficial arranca en modo `complete`, emite `generatedCompleteness.generated.ts`, materializa `PB_GENERATED_DATATYPES`, mantiene `missingCount = 0` en todos los dominios oficiales incluidos y fusiona overloads oficiales con identidad repetida antes de publicar `generated`, evitando que el baseline runtime reintroduzca `duplicateIds` al coexistir con `manual-core`.
- `systemCatalogQueryHardening.test.ts`, junto con `catalogV2.test.ts`, `catalogConsistency.test.ts` y `catalogProvenanceAudit.test.ts`, fija ya `B368`: `manualOverlay` queda materializado en entries finales, `registry.ts` clasifica overlaps como `enrichment` y ausencias como `gap`, `catalogConsistency` bloquea overlaps manual/generated sin policy y `queryService.ts` hace explícita la merge policy provisional del hot path (`override` manual, base `generated` con fusión de `enrichment`, `candidate` fuera de serving interactivo).
- `catalogV2.test.ts` fija además el hardening curado de `B324/B360`: `operators`, `pronouns`, `enumerated-types` y `enumerated-values` no pueden solapar lookup keys con `keywords`/`reserved-words`, `SaveAsType` debe resolver como `enumerated-type`, `SaveAsType!` no puede sobrevivir como tipo canónico y `Text!`/`Primary!` deben resolverse ya como `enumerated-value` con `enumValueOf` explícito; `systemNormalization.test.ts` fija además que `buildSystemSymbolId()` distingue `enumerated-value` homónimos por `enumValueOf` para no reintroducir colisiones de identidad dentro del catálogo.
- `catalogV2.test.ts`, `completion.test.ts`, `hover.test.ts`, `diagnostics.test.ts` y `signatureHelp.test.ts` fijan `B325`: `system-globals` expone `valueType`/`risk`, `SQLCA` sigue completando como `Transaction`, el hover muestra tipo y riesgo, diagnostics mantiene la aceptación transaccional de `SQLCA` y signatureHelp selecciona overloads `transaction` a partir de metadata del catálogo, no de hardcodes por nombre.
- `manualCatalogStructure.test.ts`, junto con `catalogConsistency.test.ts`, `catalogV2.test.ts` y `architectureImports.test.ts`, fija `B357`: el rail manual queda modularizado por dominio, `manual/common.ts` ya no exporta owner groups, `registry/datasets.ts` consume agregadores estables y la cobertura del catálogo manual no depende de imports internos frágiles.
- `systemCatalogQueryHardening.test.ts` y `catalogV2.test.ts` fijan `B365`: `buildIndexes.ts` congela buckets compuestos (`byDomainAndLookupKey`, `byKindAndLookupKey`, `byEnumValueOf`, `byOwnerTypeAndDomain`), `queryService.ts` resuelve queries owner/domain/enum desde esos índices y `resolveLanguageSymbol()` mantiene una prioridad explícita sin scans completos del catálogo.
- `catalogProvenanceAudit.test.ts` y `catalogConsistency.test.ts` fijan `B339`: `buildCatalogConsistencyReport()` publica audit de provenance por `kind`/`authority` y por dominio, `manual-core` no puede disfrazarse de `official`, `generated` debe conservar `sourceUrl/version/generatedAt` y los dominios mixtos o curados dejan trazados sus límites de coverage.
- `visualCatalogDatatypes.test.ts` y `catalogV2.test.ts` fijan `B358`: el carril visual de `system-object-datatypes` queda separado bajo `manual/visual/`, `Application` permanece en runtime/system, `OLEControl`/`OLECustomControl` viven en `OLE visual` y tipos representativos (`MDIFrame`, `MDIClient`, `MenuCascade`, `RibbonApplicationMenu`, `RibbonPanelItem`, `WindowActiveX`) quedan alineados entre catálogo, owner groups, ancestros nativos y `PB_BUILTIN_TYPES`.
- `runtimeCatalogDatatypes.test.ts`, `catalogV2.test.ts`, `systemCatalog.test.ts` y las suites `completion|hover|signatureHelp` fijan `B359`: el carril `manual/runtime` + `manual/integration` cubre la lista completa del backlog B359 desde `manual-core`, preserva el split visual/runtime de `B358`, fija el casing canónico (`Inet`, `RESTClient`, `MailFileDescription`, `MailMessage`), alinea `PB_BUILTIN_TYPES` para tipos representativos (`HTTPClient`, `PDFPage`, `SMTPClient`, `TraceTreeRoutine`, `ResourceResponse`, etc.) y mantiene fuera del catálogo los owner types de ruido generados por el extractor.
- `catalogV2.test.ts`, `systemCatalogQueryHardening.test.ts`, `catalogConsistency.test.ts` y las suites `completion|hover|semanticTokens|signatureHelp` fijan `B360`: el catálogo separa `enumerated-type` y `enumerated-value`, elimina tipos legacy con `!`, publica `resolveEnumeratedType()`/`resolveEnumeratedValue()`, endurece `invalidEnumeratedTypeNames` y mantiene completion/hover/queries alineados con el modelo breaking sin scans completos ni aliases incompatibles.
- `catalogGeneratorScript.test.ts`, `catalogV2.test.ts` y `hover.test.ts` fijan `B361`: el generator oficial emite `enumeratedTypes.generated.ts`, `enumeratedValues.generated.ts`, `enumeratedCoverage.generated.ts` y `enumeratedProvenance.generated.ts`, el registry publica esos slices `generated` junto al rail manual y hover muestra la unión efectiva manual + generated para tipos como `WindowType` sin hardcodes paralelos.
- `catalogV2.test.ts` y `catalogGeneratorScript.test.ts` fijan `B362`: `SecureProtocol` conserva explicación oficial y `allowedOnOwners` sin fabricar `enumValues` nominales, los tipos manual-core publicados ya no quedan sin `documentation`, `FillPattern` mantiene el merge con valores generated y `SeekType` queda cubierto como gap manual-curated con `FromBeginning!`, `FromCurrent!` y `FromEnd!`.
- `hover.test.ts`, `completion.test.ts`, `signatureHelp.test.ts`, `semanticTokens.test.ts`, `diagnostics.test.ts` y `crossSurfaceGoldenMatrix.test.ts` fijan `B363`: hover resuelve valores con `!`, completion y signatureHelp reutilizan contexto enumerado compartido para propiedades y parametros catalog-driven, semantic tokens publica `enumMember` para valores conocidos con `!` y diagnostics emite `enum-value-context-mismatch` solo en contextos inequívocos y de confidence alta.
- `B329` amplía `semanticTokens.test.ts` y mantiene verde `hotPathAllocationBudget.test.ts`: `semanticTokens.ts` usa ahora resolutores directos de `SystemCatalog` para `keywords`, `reserved-words`, `datatypes`, `enumerated-types`, `system-globals`, `pronouns` y `global-functions` cuando no hay qualifier, evitando depender del lookup semántico general para tokens seguros del default library.
- `test/server/unit/catalogCorpusValidation.test.ts` fija además `B364` en unit: el builder `buildEnumCatalogCorpusUsageReport()` resume usos reales por corpus y el extractor sintético clasifica `official-known|curated-known|candidate|false-positive|out-of-context|unknown` sobre valores con `!` sin depender de PFC/OrderEntry en la suite rápida.
- `completion.test.ts` y `hotPathAllocationBudget.test.ts` fijan `B330`: completion incorpora `reserved-words`, `pronouns`, `system-globals`, `enumerated-types` y `enumerated-values` sólo en contextos globales relevantes, con dedupe/prioridad estable frente a símbolos locales y sin clonar catálogos completos ni mezclar estos dominios en member contexts irrelevantes.
- `confidenceCalibration.test.ts` y `confidenceCalibration.smoke.test.ts` fijan `B283`: la policy de readiness/confidence se calibra contra escenarios reales `low`, `medium` y `high` en PFC, OrderEntry y legacy, con baseline explícito de `false positives`/`false negatives` por feature y revisión ejecutable de thresholds sin heurísticas manuales dispersas.
- `catalogCorpusValidation.test.ts` y `catalogCorpusValidation.smoke.test.ts` fijan `B336`: baseline corpus-driven por dominio/surface sobre PFC Solution, STD_FC_OrderEntry y el legacy PBL dump, con `0 misses / 0 ambigüedades / 0 budget violations` en la ruta warm de `hover`, `completion` y `diagnostics`, separada de discovery/indexing general y de la calibración de confidence.
- `test/server/performance/enumCatalogCorpusValidation.smoke.test.ts` fija `B364`: recorre PFC Solution, STD_FC_OrderEntry y el legacy PBL dump, genera un reporte corpus-driven de valores con `!` (`13068 total / 1554 catalogados / 5296 unknown / 6214 false positives / 4 out-of-context / 0 candidates`) y deja las familias reales detectadas en la cola `B368/B370` sin promocionarlas al catálogo.
- `test/server/unit/codeLensResultCache.test.ts` fija el primer slice de refactor seguro de `server.ts`: LRU acotado de CodeLens, hits/misses, evictions e invalidación sin cambiar el contrato visible de CodeLens ni stats runtime.
- `test/server/unit/cacheStoreCorruptionFuzz.test.ts`, junto con `cacheStore.test.ts` y `cachePersistence.test.ts`, fija `B270` como suite determinista de corrupción/recovery: checkpoint y journal truncados, manifests malformados, particiones corruptas y rebuild limpio sin estado medio ni crash.

## 4.5 Golden / semantic tests
**Objetivo:** proteger el comportamiento semántico del motor.

Estado actual:
- `test/server/unit/powerbuilderSemanticGolden.test.ts` ya fija el backbone PowerBuilder real para scope resolution local/shared/global/instance, prototypes vs implementations, herencia, event handlers, external functions, `DataObject` literal, rename eligibility, readiness gating, downgrade dinámico y conflictos de `sourceOrigin`.
- `test/server/unit/currentObjectContext.test.ts`, `test/server/unit/currentObjectContextPanelModel.test.ts` y la smoke focal en `test/smoke/extension.test.ts` ya cubren el current object context pack read-only, las variables visibles expuestas por contrato, el builder puro del panel, el cap por defecto de referencias del consumer y la UX visible del Current Object Context Panel sobre un archivo real.
- `test/server/unit/orcaRunner.test.ts`, `test/server/unit/orcaDetection.test.ts`, `test/server/unit/orcaStagingExport.test.ts`, `test/server/unit/orcaStagingImport.test.ts`, `test/server/unit/specDrivenPblUpdate.test.ts`, `test/server/unit/specDrivenPblUpdateBatch.test.ts`, `test/server/unit/fileSystem.test.ts`, `test/server/unit/statusBarPresentation.test.ts`, `test/server/unit/projectHealthDashboard.test.ts`, junto con `workspace.test.ts`, `semanticWorkspaceManifest.test.ts` y la smoke focal en `test/smoke/extension.test.ts`, ya cubren el adapter ORCA base, la capability detection read-only (`config`/`PB_ORCA_PATH`), el export controlado a staging indexable con fingerprints del source real rastreado, el rail write-enabled completo de `import/regenerate/rebuild`, el workflow spec-driven de export fresco + edits explícitos + import seguro, la orquestación batch secuencial con `stopOnError`, backup binario y ledgers persistidos, y el wiring visible de los comandos ORCA sobre un ejecutable de prueba.
- `test/server/unit/backpressurePolicy.test.ts`, `scheduler.test.ts`, `diagnosticScheduler.test.ts`, `runtimeHealth.test.ts` y `statusBarPresentation.test.ts` fijan la policy B267 por workload, la preservación de `build/legacy-orca` ante preempción, el throttling explicado por latencia y la proyección visible de `pendingWorkloads`/`throttledBackgroundReason` en stats y health.
- `test/server/unit/workspace.test.ts`, `test/server/unit/semanticWorkspaceManifest.test.ts`, `test/server/unit/objectExplorerModel.test.ts`, `test/server/unit/watchedFileIntake.test.ts` y la smoke focal del Object Explorer ya cubren el modo `pbl-only`, el graph legacy read-only de `.pbl`, la separación multi-root para proyectos/librerías homónimos y su proyección en manifest/UX visible.
- `test/server/unit/impactAnalysis.test.ts` ya cubre el impact analyzer read-only sobre references, descendientes, events, DataWindows y build targets sin abrir edición automática, y fija además el caso negativo en el que un report pesado no materializa el workspace completo cuando no hay routing de proyecto.
- `test/server/unit/safeEditPlan.test.ts` ya cubre el safe edit plan read-only con archivos, riesgos, tests, docs a revisar y bloqueos honestos sin tocar código; `specDrivenPblUpdate.test.ts` fija además que la automatización write-enabled solo entra cuando ese plan admite el cambio explícito y `specDrivenPblUpdateBatch.test.ts` que la coordinación bulk respeta `stopOnError` sin duplicar el rail ORCA.
- la batería `currentObjectContext.test.ts`, `impactAnalysis.test.ts`, `safeEditPlan.test.ts`, `safeBatchRefactorPlan.test.ts`, `semanticWorkspaceManifest.test.ts`, `crossProjectSymbolConflicts.test.ts`, `workspaceMigrationAssistant.test.ts`, `powerBuilderCodeMetrics.test.ts`, `powerBuilderTechnicalDebtReport.test.ts`, `pbAutoBuildRunner.test.ts`, `orcaRunner.test.ts`, `specDrivenPblUpdate.test.ts` y `specDrivenPblUpdateBatch.test.ts` revalida además que los workloads `near-context`, `export-reporting`, `maintenance`, `build` y `legacy-orca` sigan verdes tras colgarse del scheduler común.
- `test/server/unit/diagnostics.test.ts`, `diagnosticsExtra.test.ts`, `diagnosticsObsoleteIntegration.test.ts`, `codeActions.test.ts`, `obsolete.test.ts`, `obsoleteDetectorSanity.test.ts` y la smoke focal `test/smoke/code-actions.extension.test.ts` fijan el contrato estable de `diagnostic.code`, la publicación real de `SD7` en Problems, el catálogo versionado de quick fixes y el bloqueo por preflight/`sourceOrigin`/dynamic strings sin parseos ad hoc del Problems Panel.
- `test/server/unit/projectHealthDashboard.test.ts`, `statusBarPresentation.test.ts`, la smoke focal en `test/smoke/extension.test.ts` y `test/smoke/health-report.extension.test.ts` fijan `B216/B296`: el dashboard read-only de salud del proyecto, su integración en tooltip/status menu, el enterprise health score explicable derivado desde surfaces ya publicadas y su export real dentro del health report sin abrir un segundo motor de health.
- `test/server/unit/projectSupportMatrix.test.ts`, `test/server/unit/projectHealthDashboard.test.ts` y `test/smoke/health-report.extension.test.ts` fijan `B293`: la matriz oficial de soporte se deriva cliente-side desde stats + manifest, se proyecta en el health report exportado y degrada con honestidad cuando faltan tooling, source origins o manifest enriquecido.
- `test/server/unit/objectExplorerModel.test.ts`, `semanticWorkspaceManifest.test.ts` y la smoke focal en `test/smoke/extension.test.ts` fijan el Object Explorer read-only, el contrato enriquecido del manifest por objeto y el foco visible sobre el archivo activo sin RPCs por nodo.
- `test/server/unit/cacheStore.test.ts`, `pbAutoBuildProfileMatrix.test.ts` y `orcaStagingExport.test.ts`, junto con `workspace.test.ts`, `semanticWorkspaceManifest.test.ts` y `objectExplorerModel.test.ts`, fijan el cierre multi-root de `B268`: particiones de caché por `projectUri`, último build profile recordado por URI completa, selección de staging ORCA por workspace folder correcto y ausencia de mezcla visible cuando se repiten labels entre roots.
- `test/server/unit/semanticReproPack.test.ts` y `test/smoke/semantic-repro-pack.extension.test.ts` fijan el bundle reproducible de bugs semánticos a partir del editor activo y las surfaces read-only ya cerradas, incluyendo manifest, snapshots JSON y copias de archivos relevantes.
- `test/server/unit/semanticWorkspaceManifest.test.ts` ya cubre el manifiesto semántico compacto/versionado con projects, libraries, objects, herencia, diagnostics summary, sourceOrigin y readiness sin exportar código bruto.
- `test/server/performance/semanticConsistencyOracle.smoke.test.ts` fija además que el oracle cross-surface permanece `healthy` sobre un archivo real de PFC Solution y otro de OrderEntry, mientras `semanticConsistencyOracle.test.ts` cubre el borde DataWindow y ORCA staging con drift controlado.
- `test/server/unit/dataWindowSafeMode.test.ts`, junto con `documentAnalysis|definition|hover|signatureHelp|diagnostics|powerbuilderSemanticGolden`, ya fija el safe mode mínimo de `.srd` con SQL base, args, columnas, bandas principales y navegación básica.
- `test/server/unit/dataWindowLegacySafeMode.test.ts`, junto con `definition|hover`, ya fija el refuerzo legacy-safe de `.srd` para bandas, columnas `retrieve`, `report(dataobject=...)`, `column.dddw.name` y navegación/hover locales hacia child DataWindows.
- `test/server/unit/documentSymbols.test.ts` y `test/server/unit/workspaceSymbols.test.ts` ya fijan el catálogo DataWindow expuesto: outline `.srd` con bandas/tabla/retrieve, controls `report(...)` y publicación del stub `.srd` en workspace/API symbols.
- `test/server/unit/hover.test.ts` y `test/server/unit/definition.test.ts` ya cubren property paths avanzados `Describe/Modify(...DataWindow.Table.Select)`, acceso directo `.Object.<...>` y `GetChild(...)`, además de `Modify(...dddw.name)`, cuando el binding `DataObject` literal y la cadena child resuelven de forma determinista.

Deben fijar resultados esperados para:
- hover,
- definition,
- references,
- rename eligibility,
- readiness,
- y reasoning semántico relevante.

Cuando el cambio toque corpus reales PowerBuilder, añadir además casos focalizados para:
- boilerplate exportado `on object.create/destroy` con `TriggerEvent(this, "constructor"/"destructor")` sin hook local explícito;
- topología Solution/Project con rutas `Path="..."` que contienen espacios y ancestros repartidos entre librerías distintas del mismo proyecto (por ejemplo `pfcmain.pbl` -> `pfemain.pbl`).
- solution-mode parcial con `.pbproj` aislado sin `.pbsln`, `.pblmeta` disperso, `.srj` de deployment y variantes multiidioma `_e/_f/_i/_s` conviviendo con ruido no fuente.

---

## 5. Qué debe validarse según la fase del producto

### 5.1 Core interactivo
Siempre validar:
- que el archivo activo responde primero,
- que el background no bloquea,
- que el motor degrada con seguridad,
- y que el estado visible es coherente.

### 5.2 Incrementalidad e invalidación
Siempre validar:
- qué se invalida,
- qué se reutiliza,
- qué se recalcula,
- y que no se recompone más de lo necesario.

Estado actual relevante:
- `watchedFileIntake.test.ts` y `semanticDiff.test.ts` dejan trazado qué fan-out corresponde a cambios cosméticos, implementation-only, prototypes heredados, ancestros, `.srd`/`DataObject`, markers, `sourceOrigin`, ORCA staging y external functions;
- `large-workspace-incremental.perf.test.ts` mantiene el budget incremental y la degradación segura de ráfagas watcher sin abrir rediscovery global.

### 5.3 Persistencia
Siempre validar:
- cold vs warm,
- recuperación segura,
- versionado,
- y ausencia de corrupción visible.

### 5.4 Query engine / serving
Siempre validar:
- coherencia entre hover/completion/definition/references,
- evidencia o trazabilidad cuando aplique,
- confidence/readiness gates en consumers reales cuando cambie el wiring del servidor,
- y estabilidad del resultado bajo contexto parcial o presión.

### 5.5 Escala
Siempre validar:
- corpus reales,
- latencia bajo carga,
- memoria,
- y comportamiento en cambios masivos.

---

## 6. Fixtures y corpus

## 6.1 Fixtures
Los fixtures son casos pequeños, controlados y deterministas.

Deben:
- tener un propósito claro,
- cubrir casos comunes y edge cases,
- ser fáciles de leer,
- y documentarse cuando el caso no sea obvio.

## 6.2 Corpus reales
Los corpus sirven para validar:
- escala,
- rendimiento,
- robustez,
- y compatibilidad con código legacy.

No deben usarse como sustituto de fixtures unitarios.

El corpus prioritario debe incluir:
- PFC 2025 Solution,
- PFC 2025 Workspace,
- un corpus enterprise local representativo cuando exista (por ejemplo `fixtures-local/STD_FC_OrderEntry`),
- y proyectos legacy representativos cuando estén disponibles.

La matriz reproducible de corpus públicos vive en `test/corpora/README.md`.
El ciclo actual integra PFC 2025 Workspace, PFC 2025 Solution, un slot legacy controlado en `fixtures-local/public/legacy-pbl-dump` y un slot enterprise local en `fixtures-local/STD_FC_OrderEntry` para discovery/indexación y smoke semántica proporcional sobre aplicación real.

Para refactors arquitectónicos sobre `src/client/extension.ts`, `src/server/server.ts`, catálogo o runtime, la validación rápida debe incluir PFC Workspace/Solution y STD/OrderEntry cuando esos corpus existan localmente; si faltan, el resultado debe registrar rutas exactas ausentes en vez de simular cobertura.

---

## 7. Reglas mínimas por tipo de cambio

### 7.1 Cambio en parsing o modelo documental
Mínimo:
- unit test del caso afectado,
- fixture asociado si aplica.

### 7.2 Cambio en knowledge / resolución / query engine
Mínimo:
- unit tests del componente,
- integration test de la feature afectada,
- y golden test si cambia comportamiento semántico visible.

Si el cambio toca `references`, `rename` o CodeLens en hot path, debe cubrir además scope de candidatos (`direct/project/workspace`) y reuso de snapshot cuando exista.

Si el cambio toca selectors LSP o clasificación de markers, debe cubrir que `.pbw/.pbt/.pbproj/.pbsln/.pbl` alimentan discovery/topología sin servirse como PowerScript semántico.

### 7.3 Cambio en scheduler / invalidación / caché / runtime
Mínimo:
- unit tests,
- integración de comportamiento observable,
- y performance test si puede afectar latencia o background work.

Cuando el cambio además altera stats/status/health visibles, añadir al menos una smoke real del host para verificar el wiring cliente-servidor.

Si el cambio toca watcher/topology/sourceOrigin incremental, cubrir el puente LSP -> watcher y el intake por batch con tests dedicados.

Si el cambio toca la policy B267, revalidar como mínimo `npm run build:test` junto con `npx mocha --ui tdd out/test/server/unit/backpressurePolicy.test.js out/test/server/unit/scheduler.test.js out/test/server/unit/diagnosticScheduler.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/statusBarPresentation.test.js`; si además se recolgaron commands o rails read-only/build/legacy del scheduler, ampliar con `currentObjectContext.test.js`, `impactAnalysis.test.js`, `safeEditPlan.test.js`, `safeBatchRefactorPlan.test.js`, `semanticWorkspaceManifest.test.js`, `crossProjectSymbolConflicts.test.js`, `workspaceMigrationAssistant.test.js`, `powerBuilderCodeMetrics.test.js`, `powerBuilderTechnicalDebtReport.test.js`, `pbAutoBuildRunner.test.js`, `orcaRunner.test.js`, `specDrivenPblUpdate.test.js` y `specDrivenPblUpdateBatch.test.js`.

### 7.4 Cambio en persistencia / warm resume
Mínimo:
- test de reapertura / resume,
- test de versión o invalidez,
- y medición cold vs warm.

### 7.5 Cambio en activación / bootstrap / wiring
Mínimo:
- smoke test.

---

## 8. Baseline vigente de validación

Tras las olas 133-172, el baseline mínimo del repositorio queda en:

- `npm run compile`
- `npm run test:unit`
- `npm test`

Para el carril moderno/legacy cuando se toque documentación operativa o troubleshooting, el baseline recomendable es:

- `npm run build:test`
- `npm run test:smoke -- --grep "PBAutoBuild|ORCA legacy"`
- `npm run release:verify` si también cambia documentación de release o empaquetado.

Evidencia reciente registrada:

- la evidencia cuantitativa debe regenerarse desde una ejecución reciente y no fijarse aquí como número estático;
- la matriz mínima actual incluye smoke real sobre activación genérica, PFC Solution y PFC Workspace, además de integración LSP sobre hover, document symbols y diagnostics.
- la matriz mínima actual incluye también smoke real del formatter conservador en modo manual y `formatOnSave`.

Notas operativas:

- `npm test` cubre smoke + unit + integration.
- `npm run test:performance` sigue siendo un carril específico y no forma parte del gate estándar diario.
- Cambios en runtime, indexador, invalidación, warm resume, serving compartido o persistencia deben pasar al menos por ese baseline antes de darse por estables.

### 7.6 Cambio en rendimiento
Mínimo:
- medición antes/después,
- y performance test o benchmark reproducible.

### 7.7 Cambio en documentación operativa de build y ORCA
Mínimo:
- revisar que `README.md`, `docs/developer-workflows.md` y `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` citan comandos, settings, env vars y artefactos reales del producto;
- comprobar contra `package.json` que los comandos/settings visibles siguen existiendo y conservan el naming documentado;
- ejecutar `npm run build:test` si la documentación toca troubleshooting visible, release lane o rutas de artefactos que el usuario debe poder reproducir.

### 7.8 Cambio en support bundle / diagnostics export
Mínimo:
- ejecutar `npm run build:test` para validar wiring de comando, tipos y tests del bundle;
- ejecutar `npx mocha --ui tdd out/test/server/unit/supportBundle.test.js` para fijar esquema, `redactionProfile` y redacción por perfil;
- ejecutar `npm run test:smoke -- --grep "support-bundle-extension"` para validar el comando real en host de VS Code.

### 7.9 Cambio en compactación/retención de caché semántica
Mínimo:
- ejecutar `npm run build:test` para validar wiring de `showStats`, health y comando de mantenimiento;
- ejecutar `npx mocha --ui tdd out/test/server/unit/cacheStore.test.js out/test/server/unit/cachePersistence.test.js out/test/server/unit/runtimeHealth.test.js`;
- ejecutar `npx mocha --ui tdd --timeout 30000 out/test/server/performance/indexer.perf.test.js --grep "Cold start|Warm start"` para confirmar que warm/cold siguen dentro del carril esperado.

### 7.10 Cambio en advanced code metrics / reporting read-only
Mínimo:
- ejecutar `npm run build:test` para validar wiring de contrato público, comando y tipos;
- ejecutar `npx mocha --ui tdd out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/publicApi.test.js`;
- ejecutar `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"` para validar el comando/API real en el host de VS Code.

### 7.11 Cambio en technical debt / modernization report read-only
Mínimo:
- ejecutar `npm run build:test` para validar contrato público, servidor, comando y tool bridge;
- ejecutar `npx mocha --ui tdd out/test/server/unit/powerBuilderTechnicalDebtReport.test.js out/test/server/unit/publicApi.test.js`;
- ejecutar `npm run test:unit` cuando el cambio toque scoring/evidencias compartidas entre diagnósticos, `sourceOrigin`, build y API pública;
- ejecutar `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"` para validar API/tool/comando en host real.

### 7.12 Cambio solo documental
No requiere test técnico, pero sí revisión de coherencia.

---

## 8. Evidencia mínima para cerrar trabajo

Una tarea no debe cerrarse si no deja evidencia razonable de validación.

La evidencia puede ser:
- test automatizado,
- test de integración,
- golden test,
- medición de rendimiento,
- validación manual guiada,
- o combinación de varias.

La evidencia debe ser proporcional al riesgo del cambio.

---

## 9. Rutas críticas que deben vigilarse siempre

### 9.1 Interactive path
Debe mantenerse estable en:
- hover,
- completion,
- definition,
- signature help,
- document symbols,
- diagnósticos del archivo activo.

### 9.2 Discovery / indexing path
Debe mantenerse estable en:
- discovery,
- indexación progresiva,
- prioridades del scheduler,
- readiness,
- y progreso observable.

### 9.3 Warm / resume path
Debe mantenerse estable en:
- reapertura,
- checkpoints,
- caché persistente,
- reuso de conocimiento.

### 9.4 Massive change path
Debe mantenerse estable en:
- git pull,
- cambio de rama,
- invalidaciones amplias,
- watchers,
- y cambios masivos en disco.

---

## 10. Comandos y ejecución

El proyecto debe ofrecer comandos claros para:

- compilar tests,
- ejecutar todos los tests,
- ejecutar smoke,
- ejecutar unit,
- ejecutar integration,
- ejecutar performance.

Flujo recomendado:

1. compilar proyecto,
2. compilar tests,
3. ejecutar el tipo de test relevante al cambio,
4. ejecutar la verificación global antes de cerrar trabajo importante.

---

## 11. Relación con otros documentos

Este documento debe alinearse con:

- `docs/constitution.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/current-focus.md`
- `docs/performance-budget.md`
- y las specs afectadas

Si cambia la estrategia de validación, debe reflejarse aquí.

---

## 12. Regla de mantenimiento

Este documento debe actualizarse cuando:

- cambien herramientas o runners,
- cambie la estructura de tests,
- aparezcan nuevos tipos de prueba,
- cambie el criterio de cierre,
- o se introduzcan nuevas rutas críticas del producto.

---

## 13. Regla final

El testing no existe para acumular tests.

Existe para asegurar que el plugin puede seguir creciendo sin romper:

- la experiencia del archivo activo,
- la estabilidad del motor,
- la calidad semántica,
- el rendimiento,
- ni la mantenibilidad del producto.
