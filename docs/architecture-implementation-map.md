# Architecture Implementation Map — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito y límites

Este documento mapea la arquitectura implementada contra el código real del repositorio.

No sustituye a [architecture.md](architecture.md), que sigue siendo la definición normativa, ni a [architecture-status.md](architecture-status.md), que sigue siendo el estado operativo vivo. Su función es responder tres preguntas prácticas:

1. qué rutas del repositorio implementan cada capa y contrato;
2. cómo fluyen activación, discovery, serving interactivo, invalidación y build;
3. qué solapes, huecos y hallazgos merecen seguimiento sin reabrir foco por defecto.

Fuentes principales usadas para este mapa:

- [architecture.md](architecture.md)
- [architecture-status.md](architecture-status.md)
- [semantic-design-target.md](semantic-design-target.md)
- [semantic-design-assumptions.md](semantic-design-assumptions.md)
- [testing.md](testing.md)
- [performance-budget.md](performance-budget.md)
- [symbol-system.md](symbol-system.md)
- [current-focus.md](current-focus.md)
- [backlog.md](backlog.md)
- [package.json](../package.json)
- [.vscode-test.js](../.vscode-test.js)
- [src/client/extension.ts](../src/client/extension.ts)
- [src/server/server.ts](../src/server/server.ts)

Reglas de lectura:

- los hechos normativos siguen viviendo en [architecture.md](architecture.md);
- el contrato semántico futuro vive en [semantic-design-target.md](semantic-design-target.md);
- los hechos de estado operativo siguen viviendo en [architecture-status.md](architecture-status.md);
- este mapa solo cruza esas reglas con owners, rutas y flujos verificables del repo;
- [plugin_old](../plugin_old) se trata como superficie legacy de referencia, no como fuente de verdad del producto actual.

## 2. Topología real del repositorio

| Superficie | Rutas principales | Rol real |
| --- | --- | --- |
| Código productivo | [src/client](../src/client), [src/server](../src/server), [src/shared](../src/shared) | Extensión VS Code fina, runtime LSP y contratos compartidos |
| Documentación canónica | [docs](.), [AGENTS.md](../AGENTS.md), [.github/copilot-instructions.md](../.github/copilot-instructions.md) | Arquitectura, estado, roadmap, foco, testing y normas operativas |
| Trazabilidad histórica | [specs](../specs) | Especificaciones históricas y auditorías cerradas; no backlog activo por sí mismas |
| Validación ejecutable | [test](../test), [.vscode-test.js](../.vscode-test.js) | Smoke, unit, integration y performance sobre vscode-test |
| Tooling offline | [tools](../tools), [scripts](../scripts) | Bundling, gates de arquitectura/performance/docs y auditorías de catálogo |
| Artefactos versionados | [artifacts/performance](../artifacts/performance), [artifacts/catalog](../artifacts/catalog) | Evidencia serializada de gates y auditorías |
| Corpora locales | [fixtures-local](../fixtures-local) | PFC, legacy public y OrderEntry; algunas suites los saltan si faltan |
| Superficie legacy | [plugin_old](../plugin_old) | Referencia histórica, dataset y patrón probado, no runtime actual |

## 3. Capas implementadas y owners de runtime

| Capa | Rutas propietarias | Implementación observable | Estado |
| --- | --- | --- | --- |
| Cliente VS Code | [src/client](../src/client) | Activación, LanguageClient, comandos, paneles bajo demanda, API pública | Implementado |
| Contratos compartidos | [src/shared](../src/shared) | IDs, source origin, API pública, protocolos ORCA/PBAutoBuild, formatter protocol | Implementado |
| Bootstrap LSP | [src/server/server.ts](../src/server/server.ts), [src/server/handlers](../src/server/handlers) | createConnection, TextDocuments, wiring de handlers, composición de runtime | Implementado |
| Discovery y routing | [src/server/workspace](../src/server/workspace) | roots PowerBuilder, topología, source origin, build files, watcher intake | Implementado |
| Indexación incremental | [src/server/indexer/workspaceIndexer.ts](../src/server/indexer/workspaceIndexer.ts) | pases structural/enriched, yielding, partial mode, prioridad al activo | Implementado |
| Parsing y análisis | [src/server/parsing](../src/server/parsing), [src/server/analysis](../src/server/analysis) | DocumentModel, section machine, snapshots, análisis documental, scheduler diagnóstico | Implementado |
| Knowledge backbone | [src/server/knowledge](../src/server/knowledge) | KnowledgeBase atómica, semanticEpoch, caches, query service, system catalog | Implementado |
| Sistema de símbolos | [symbol-system.md](symbol-system.md), [src/server/knowledge/symbolKey.ts](../src/server/knowledge/symbolKey.ts), [src/server/features/semanticQueryFacade.ts](../src/server/features/semanticQueryFacade.ts) | Identidad, owners, sourceOrigin/confidence, consumers LSP, enrichments y localización presentation-only | Implementado parcialmente; facade slice activo y convergencia pendiente |
| Features semánticas | [src/server/features](../src/server/features) | hover, completion, definition, references, rename, diagnostics, DataWindow, reports | Implementado |
| Presentación server-side | [src/server/presentation](../src/server/presentation) | `Symbol*ViewModel` y formatters LSP/AI read-only para hover, completion, signatureHelp, definition, diagnostics, semantic tokens y AI context | Implementado |
| Persistencia y caché | [src/server/cache](../src/server/cache) | checkpoint, journal, restore, flush coordinado, runtime cache controller | Implementado |
| Runtime y budgets | [src/server/runtime](../src/server/runtime) | scheduler, backpressure, memory budgets, pressure policy, runtime journal, health | Implementado |
| Build y legacy rails | [src/server/build](../src/server/build), [src/client/build](../src/client/build) | PBAutoBuild, ORCA, export/import staging, CI helper, failure classification | Implementado |
| Legacy de referencia | [plugin_old/src](../plugin_old/src) | Parser/semántica/fixtures antiguos no cableados al producto actual | Deliberadamente aislado |

## 4. Inventario de módulos por superficie

### 4.1 Cliente y UX ligera

Superficies principales:

- [src/client/extension.ts](../src/client/extension.ts): `activate()`, `startClient()`, creación del `LanguageClient`, bootstrap de estado visible, export de API pública y materialización lazy de controllers mediante `ensureObjectExplorerController()`, `ensureCurrentObjectContextPanelController()` y `ensureDiagnosticsExplainabilityPanelController()`.
- [src/client/commandRegistration.ts](../src/client/commandRegistration.ts): registro declarativo de comandos canónicos y legacy aliases.
- [src/client/objectExplorer.ts](../src/client/objectExplorer.ts), [src/client/currentObjectContextPanel.ts](../src/client/currentObjectContextPanel.ts), [src/client/diagnosticsExplainabilityPanel.ts](../src/client/diagnosticsExplainabilityPanel.ts): Tree Views y paneles read-only bajo demanda.
- [src/client/statusBarPresentation.ts](../src/client/statusBarPresentation.ts) y [src/client/statusMenuActions.ts](../src/client/statusMenuActions.ts): proyección de stats y acciones rápidas.
- [src/client/support/supportBundle.ts](../src/client/support/supportBundle.ts), [src/client/semanticWorkspaceSnapshot.ts](../src/client/semanticWorkspaceSnapshot.ts), [src/client/runtimeSelfTest.ts](../src/client/runtimeSelfTest.ts): export offline, snapshotting y troubleshooting.

Notas de ownership:

- el cliente no parsea PowerBuilder ni resuelve semántica;
- el cliente sí concentra bastante orquestación, especialmente en [src/client/extension.ts](../src/client/extension.ts);
- los paneles y comandos siguen una estrategia lazy consistente con [architecture-status.md](architecture-status.md).

### 4.2 Bootstrap, handlers y lifecycle LSP

Superficies principales:

- [src/server/server.ts](../src/server/server.ts): composición del proceso LSP, caches globales, runners externos, runtime journal, watcher intake y wiring final.
- [src/server/handlers/lifecycleHandlers.ts](../src/server/handlers/lifecycleHandlers.ts): capabilities, initialized, warm resume y lanzamiento de discovery/indexing.
- [src/server/handlers/documentHandlers.ts](../src/server/handlers/documentHandlers.ts): open/change/close, invalidación semántica y republishes.
- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts): puente entre LSP y features reales, gating de readiness, ServingCache y timings interactivos.
- [src/server/handlers/featureHandlerRegistration.ts](../src/server/handlers/featureHandlerRegistration.ts): composición declarativa de handlers LSP primarios y auxiliares sin lógica semántica.
- [src/server/handlers/buildCommandHandlers.ts](../src/server/handlers/buildCommandHandlers.ts), [src/server/handlers/reportCommandHandlers.ts](../src/server/handlers/reportCommandHandlers.ts), [src/server/handlers/runtimeCommandHandlers.ts](../src/server/handlers/runtimeCommandHandlers.ts): comandos no-LSP de build, reporting y mantenimiento.
- [src/server/handlers/commandHandlerRegistration.ts](../src/server/handlers/commandHandlerRegistration.ts): pipeline de `workspace/executeCommand` que prueba build, report y runtime handlers en orden estable.

Observación importante:

- [src/server/handlers/lifecycleHandlers.ts](../src/server/handlers/lifecycleHandlers.ts) publica `completionProvider.resolveProvider = true`; [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts) registra `connection.onCompletionResolve(...)` para enriquecer detalle/documentación después de la lista inicial.

### 4.3 Workspace, discovery e indexación

Superficies principales:

- [src/server/workspace/discovery.ts](../src/server/workspace/discovery.ts): walk recursivo con ignore list, roots `.pbw/.pbt/.pbsln/.pbproj/.pbl`, artifacts de discovery y yielding al event loop.
- [src/server/workspace/workspaceState.ts](../src/server/workspace/workspaceState.ts): fuente de verdad de source files, roots, topología, build files y `sourceOrigin` contextual.
- [src/server/workspace/projectRegistry.ts](../src/server/workspace/projectRegistry.ts), [src/server/workspace/unifiedProjectModel.ts](../src/server/workspace/unifiedProjectModel.ts), [src/server/workspace/projectRouting.ts](../src/server/workspace/projectRouting.ts): modelo de proyecto, jerarquía y asignación file to project.
- [src/server/workspace/watchedFileIntake.ts](../src/server/workspace/watchedFileIntake.ts) y [src/server/workspace/watchedFileChangeBridge.ts](../src/server/workspace/watchedFileChangeBridge.ts): intake incremental del watcher.
- [src/server/indexer/workspaceIndexer.ts](../src/server/indexer/workspaceIndexer.ts): orden de indexación priorizado, fases structural/enriched, yielding cooperativo, límites de tamaño y modo parcial degradado.

Notas verificadas:

- en warm start limpio, `workspaceIndexer.ts` ya puede cortar la indexación completa reutilizando snapshots publicados en `KnowledgeBase`, aunque `DocumentCache` haya evictado parte del corpus real;
- la validación real sobre OrderEntry/PFC confirmó `discoverWorkspace=545.49ms`, `index cold=17736.90ms` y `warm=9.48ms`.

### 4.4 Parsing, análisis y snapshots

Superficies principales:

- [src/server/parsing/documentModel.ts](../src/server/parsing/documentModel.ts), [src/server/parsing/sectionMachine.ts](../src/server/parsing/sectionMachine.ts), [src/server/parsing/statementSplitter.ts](../src/server/parsing/statementSplitter.ts): canonización estructural del documento.
- [src/server/parsing/srContainerParser.ts](../src/server/parsing/srContainerParser.ts): frontera SR* y DataWindow container.
- [src/server/parsing/conditionalCompilationGate.ts](../src/server/parsing/conditionalCompilationGate.ts): gate de evidencia, no soporte productivo completo del preprocesador.
- [src/server/analysis/documentAnalysis.ts](../src/server/analysis/documentAnalysis.ts): facts, scopes, snapshots y metadatos como `containerSignature`.
- [src/server/analysis/analysisCache.ts](../src/server/analysis/analysisCache.ts) y [src/server/analysis/diagnosticScheduler.ts](../src/server/analysis/diagnosticScheduler.ts): reutilización y planificación de diagnostics.

Notas verificadas:

- `src/server/utils/comments.ts` deriva una vista `code-only` desde las masks existentes para que diagnostics y checks estructurales ignoren tokens internos de strings sin romper el contrato del stripper base;
- el parser/diagnostics ya reconocen código inline tras el `;` de la firma callable como cuerpo real y no generan falsos `END IF` huérfanos ni falsos missing-return.

### 4.5 Knowledge backbone y system catalog

Superficies principales:

- [src/server/knowledge/KnowledgeBase.ts](../src/server/knowledge/KnowledgeBase.ts): publicación atómica, copy-on-write por bucket, `semanticEpoch`, dependencias y reverse dependencies.
- [src/server/knowledge/DocumentCache.ts](../src/server/knowledge/DocumentCache.ts): snapshot por documento.
- [src/server/knowledge/HotContextCache.ts](../src/server/knowledge/HotContextCache.ts): contexto caliente del archivo activo.
- [src/server/knowledge/ServingCache.ts](../src/server/knowledge/ServingCache.ts): LRU de serving interactivo con TTL opcional y observer.
- [src/server/knowledge/resolution/InheritanceGraph.ts](../src/server/knowledge/resolution/InheritanceGraph.ts), [src/server/knowledge/resolution/semanticQueryService.ts](../src/server/knowledge/resolution/semanticQueryService.ts), [src/server/knowledge/positionContext.ts](../src/server/knowledge/positionContext.ts): resolución, jerarquía y contexto de consulta.
- [src/server/knowledge/system/SystemCatalog.ts](../src/server/knowledge/system/SystemCatalog.ts): fachada única del catálogo del sistema sobre `generated`, `manual` y `localization`.

Notas de ownership:

- el split `generated + manual + localization` es deliberado y gobernado por [ADR-0001-system-catalog-source-of-truth.md](adr/ADR-0001-system-catalog-source-of-truth.md), no una duplicación accidental;
- el contrato de `sourceOrigin` sale de [src/shared/sourceOrigin.ts](../src/shared/sourceOrigin.ts) y cruza workspace, knowledge, serving y API pública.
- el modelo conceptual de símbolos, owners, consumers, enrichments e i18n vive en [symbol-system.md](symbol-system.md); este mapa sólo conserva rutas y flujos verificables.
- el contrato futuro `PublishedSemanticSnapshot`/`SemanticQueryResult` vive en [semantic-design-target.md](semantic-design-target.md); en código real sigue implementado como `KnowledgeBase` + `semanticQueryService` + `SemanticQueryFacade` con adopción parcial.

### 4.6 Features semánticas, DataWindow y reporting

Superficies principales:

- Hot path: [src/server/features/hover.ts](../src/server/features/hover.ts), [src/server/features/completion.ts](../src/server/features/completion.ts), [src/server/features/signatureHelp.ts](../src/server/features/signatureHelp.ts), [src/server/features/definition.ts](../src/server/features/definition.ts), [src/server/features/references.ts](../src/server/features/references.ts), [src/server/features/rename.ts](../src/server/features/rename.ts), [src/server/features/semanticTokens.ts](../src/server/features/semanticTokens.ts), [src/server/features/documentSymbols.ts](../src/server/features/documentSymbols.ts), [src/server/features/workspaceSymbols.ts](../src/server/features/workspaceSymbols.ts).
- Policies: [src/server/features/queryScopePolicy.ts](../src/server/features/queryScopePolicy.ts), [src/server/features/queryContext.ts](../src/server/features/queryContext.ts), [src/server/features/servingReadiness.ts](../src/server/features/servingReadiness.ts), [src/server/features/featureReadiness.ts](../src/server/features/featureReadiness.ts).
- Presentación: [src/server/presentation/viewModels.ts](../src/server/presentation/viewModels.ts), [src/server/presentation/hoverPresentation.ts](../src/server/presentation/hoverPresentation.ts), [src/server/presentation/completionPresentation.ts](../src/server/presentation/completionPresentation.ts), [src/server/presentation/signatureHelpPresentation.ts](../src/server/presentation/signatureHelpPresentation.ts), [src/server/presentation/definitionPresentation.ts](../src/server/presentation/definitionPresentation.ts), [src/server/presentation/diagnosticPresentation.ts](../src/server/presentation/diagnosticPresentation.ts), [src/server/presentation/semanticTokenPresentation.ts](../src/server/presentation/semanticTokenPresentation.ts), [src/server/presentation/aiContextPresentation.ts](../src/server/presentation/aiContextPresentation.ts). Esta capa no consulta `KnowledgeBase`, parser, filesystem ni discovery; recibe modelos ya resueltos y devuelve DTOs LSP/read models compactos.
- DataWindow: [src/server/features/dataWindowModel.ts](../src/server/features/dataWindowModel.ts), [src/server/features/dataWindowBindingModel.ts](../src/server/features/dataWindowBindingModel.ts), [src/server/features/dataWindowFastContext.ts](../src/server/features/dataWindowFastContext.ts), [src/server/features/dataWindowServingAdapters.ts](../src/server/features/dataWindowServingAdapters.ts), [src/server/features/dataWindowColumnAccess.ts](../src/server/features/dataWindowColumnAccess.ts), [src/server/features/dataWindowPropertyPaths.ts](../src/server/features/dataWindowPropertyPaths.ts), [src/server/features/dataWindowSafeMode.ts](../src/server/features/dataWindowSafeMode.ts), [src/server/features/dataWindowSqlLineage.ts](../src/server/features/dataWindowSqlLineage.ts).
- Reports y planificación segura: [src/server/features/currentObjectContext.ts](../src/server/features/currentObjectContext.ts), [src/server/features/impactAnalysis.ts](../src/server/features/impactAnalysis.ts), [src/server/features/safeEditPlan.ts](../src/server/features/safeEditPlan.ts), [src/server/features/safeBatchRefactorPlan.ts](../src/server/features/safeBatchRefactorPlan.ts), [src/server/features/workspaceMigrationAssistant.ts](../src/server/features/workspaceMigrationAssistant.ts), [src/server/features/powerBuilderCodeMetrics.ts](../src/server/features/powerBuilderCodeMetrics.ts), [src/server/features/powerBuilderTechnicalDebtReport.ts](../src/server/features/powerBuilderTechnicalDebtReport.ts).

Notas verificadas:

- `hover.ts` resuelve built-ins/system functions por catálogo antes del índice de workspace y deja serving cache/negative cache instrumentadas en el hot path;
- las views runtime read-only quedan registradas durante `activate()` y degradan por estado propio, no por ausencia de provider nativo de VS Code.

### 4.7 Persistencia, runtime, build y release lane

Superficies principales:

- Persistencia: [src/server/cache/cacheStore.ts](../src/server/cache/cacheStore.ts), [src/server/cache/cacheCheckpoint.ts](../src/server/cache/cacheCheckpoint.ts), [src/server/cache/cacheJournal.ts](../src/server/cache/cacheJournal.ts), [src/server/cache/servingCachePersistence.ts](../src/server/cache/servingCachePersistence.ts), [src/server/cache/semanticCacheRuntimeController.ts](../src/server/cache/semanticCacheRuntimeController.ts).
- Runtime: [src/server/runtime/scheduler.ts](../src/server/runtime/scheduler.ts), [src/server/runtime/backpressurePolicy.ts](../src/server/runtime/backpressurePolicy.ts), [src/server/runtime/memoryBudgets.ts](../src/server/runtime/memoryBudgets.ts), [src/server/runtime/memoryPressurePolicy.ts](../src/server/runtime/memoryPressurePolicy.ts), [src/server/runtime/runtimeJournal.ts](../src/server/runtime/runtimeJournal.ts), [src/server/runtime/runtimeHealth.ts](../src/server/runtime/runtimeHealth.ts), [src/server/runtime/runtimeProgressController.ts](../src/server/runtime/runtimeProgressController.ts).
- Build/legacy: [src/server/build/pbAutoBuildRunner.ts](../src/server/build/pbAutoBuildRunner.ts), [src/server/build/pbAutoBuildLogParser.ts](../src/server/build/pbAutoBuildLogParser.ts), [src/server/build/pbAutoBuildProblems.ts](../src/server/build/pbAutoBuildProblems.ts), [src/server/build/orcaRunner.ts](../src/server/build/orcaRunner.ts), [src/server/build/orcaStagingExport.ts](../src/server/build/orcaStagingExport.ts), [src/server/build/orcaStagingImport.ts](../src/server/build/orcaStagingImport.ts), [src/server/build/specDrivenPblUpdate.ts](../src/server/build/specDrivenPblUpdate.ts).
- Scripts y empaquetado: [package.json](../package.json), [tools/esbuild.mjs](../tools/esbuild.mjs), [tools/run-architecture-hotspot-guard.mjs](../tools/run-architecture-hotspot-guard.mjs), [tools/run-architecture-rapid-gate.mjs](../tools/run-architecture-rapid-gate.mjs), [tools/run-performance-budget-gate.mjs](../tools/run-performance-budget-gate.mjs), [tools/verify-vsix-contents.mjs](../tools/verify-vsix-contents.mjs).

Notas verificadas:

- `runtimeHealth.ts`, `projectHealthDashboard.ts`, `pbAutoBuildHealth.ts` y `buildOrcaFailureClassification.ts` ya separan estado interactivo de capacidades opcionales build/ORCA;
- la ausencia de ORCA o build files se refleja en dashboards/capabilities sin convertirse en bloqueo del runtime LSP interactivo.

## 5. Flujos end-to-end reales

### 5.1 Activación y arranque LSP

1. [package.json](../package.json) declara `main = ./dist/client/extension.js`.
2. [src/client/extension.ts](../src/client/extension.ts) entra por `activate()` y delega en `startClient()`.
3. `buildClientRuntime()` prepara `serverOptions` por IPC y `createLanguageClient()` construye el `LanguageClient`.
4. [src/server/server.ts](../src/server/server.ts) crea `connection`, `documents`, scheduler, caches, runners y runtime journal.
5. [src/server/handlers/lifecycleHandlers.ts](../src/server/handlers/lifecycleHandlers.ts) responde `onInitialize` publicando capabilities y luego `onInitialized` arranca warm resume, discovery e indexación.

### 5.2 Discovery, warm resume e indexación

1. `onInitialized` intenta restore desde `cacheStore` y `restoreServingCacheSnapshot()`.
2. [src/server/workspace/discovery.ts](../src/server/workspace/discovery.ts) recorre roots, detecta markers PB, registra source files y topología.
3. [src/server/indexer/workspaceIndexer.ts](../src/server/indexer/workspaceIndexer.ts) prioriza el activo, corre fase structural y luego enriched.
4. [src/server/knowledge/KnowledgeBase.ts](../src/server/knowledge/KnowledgeBase.ts) publica snapshots atómicamente y aumenta `semanticEpoch`.
5. [src/server/runtime/runtimeProgressController.ts](../src/server/runtime/runtimeProgressController.ts) proyecta readiness/progreso al cliente.

### 5.3 Apertura, cambio y cierre de documento

1. [src/server/handlers/documentHandlers.ts](../src/server/handlers/documentHandlers.ts) recibe `onDidOpen`, `onDidChangeContent` y `onDidClose`.
2. `getDocumentAnalysis()` reusa o recalcula análisis documental.
3. `createSnapshotAwareInvalidationPlan()` calcula fan-out semántico antes y después del cambio.
4. `HotContextCache`, CodeLens y ServingCache invalidan entradas afectadas.
5. `scheduleDiagnostics()` o `publishDiagnosticsNow()` reemiten diagnostics del documento abierto.

### 5.4 Hover, completion, signature help y definition

1. [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts) decide readiness y posibles degradaciones.
2. El handler marca el archivo activo en [src/server/knowledge/HotContextCache.ts](../src/server/knowledge/HotContextCache.ts).
3. Se intenta servir desde [src/server/knowledge/ServingCache.ts](../src/server/knowledge/ServingCache.ts) con key por feature, posición, `kbVersion` y locale.
4. Si falla caché, el handler llama a `provideHover`, `provideCompletion`, `provideSignatureHelp` o `provideDefinition`.
5. La respuesta vuelve a cachearse si la policy de memoria lo permite.

Observaciones:

- hover, completion, signature help y definition comparten gating y ServingCache;
- hover y signature help delegan el formatter visible a `src/server/presentation`, mientras completion sirve una lista inicial ligera y difiere documentación/detalle enriquecido a `completionItem/resolve` con stale guard y budget propio;
- definition ya acepta `systemCatalog` para built-ins y owner chains DataWindow.

### 5.5 References, rename, CodeLens y planning seguro

1. `createDocumentQueryContext()` construye contexto y evidence.
2. [src/server/features/referenceSourcePool.ts](../src/server/features/referenceSourcePool.ts) acota el conjunto de archivos por proyecto y policy.
3. `provideReferences()` y `provideRename()` trabajan sobre ese pool y sobre `maskedText` indexado.
4. CodeLens reutiliza `provideReferenceCodeLenses()` y su caché dedicada.
5. `safeEditPlan` y `safeBatchRefactorPlan` reutilizan el mismo backbone semántico, pero fuera del hot path.

### 5.6 Build, ORCA, support bundle y release lane

1. El cliente registra comandos de build, runtime, reportes y exportes en [src/client/commandRegistration.ts](../src/client/commandRegistration.ts).
2. Los comandos llegan a handlers server-side y, si aplica, a [src/server/build/pbAutoBuildRunner.ts](../src/server/build/pbAutoBuildRunner.ts) u [src/server/build/orcaRunner.ts](../src/server/build/orcaRunner.ts).
3. El runtime journal persiste eventos de build y legacy.
4. Support bundle, health report, repro pack y semantic snapshot se exportan desde el cliente usando datos ya servidos por el runtime.
5. El release lane del repo se describe en [package.json](../package.json), [.vscode-test.js](../.vscode-test.js) y [developer-workflows.md](developer-workflows.md).

## 6. Auditoría de hot path

| Surface | Anchors reales | Budget o protección | Observación |
| --- | --- | --- | --- |
| Hover | [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts), [src/server/features/hover.ts](../src/server/features/hover.ts) | `hover` en [queryScopePolicy.ts](../src/server/features/queryScopePolicy.ts) fija `50ms`, `active-object`, `resultCap = 8` | ServingCache por locale y `HotContextCache` |
| Completion | [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts), [src/server/features/completion.ts](../src/server/features/completion.ts), [src/server/presentation/completionPresentation.ts](../src/server/presentation/completionPresentation.ts) | `50ms`, `project`, `resultCap = 200`; `completion-resolve` usa payload budget `4 KiB` por item | Lista inicial ligera con `CompletionItem.data`; `CompletionListViewModel`/`CompletionResolveViewModel` separan payload inicial de documentación/detalle localizado |
| Signature Help | [src/server/features/signatureHelp.ts](../src/server/features/signatureHelp.ts) | `50ms`, `project`, `fallbackAction = block` | Reusa jerarquía y catálogo, no hace scans globales |
| Definition | [src/server/features/definition.ts](../src/server/features/definition.ts) | `50ms`, `project`, `confidence >= medium` | Ahora resuelve built-ins DataWindow owner-aware |
| References | [src/server/features/references.ts](../src/server/features/references.ts) | `150ms`, `project`, `resultCap = 512` | Candidate pool compartido y acotado |
| Rename | [src/server/features/rename.ts](../src/server/features/rename.ts) | `rename-prepare = 25ms`, `rename = 200ms` | Bloquea con confidence/sourceOrigin no defendibles |
| Document Symbols | [src/server/features/documentSymbols.ts](../src/server/features/documentSymbols.ts) | Scheduler interactivo y reconciliación explícita | Reutiliza snapshot del documento |
| Semantic Tokens | [src/server/features/semanticTokens.ts](../src/server/features/semanticTokens.ts) | Scheduler interactivo | Usa catálogo y snapshot, sin full scan del workspace; el contrato de confidence sigue pendiente de convergencia completa |

Guardrails ejecutables ya presentes:

- [test/server/unit/hotPathAllocationBudget.test.ts](../test/server/unit/hotPathAllocationBudget.test.ts)
- [test/server/unit/queryScopePolicy.test.ts](../test/server/unit/queryScopePolicy.test.ts)
- [test/server/unit/referenceSourcePool.test.ts](../test/server/unit/referenceSourcePool.test.ts)
- [test/server/unit/architectureImports.test.ts](../test/server/unit/architectureImports.test.ts)
- [artifacts/performance/performance-budget-gate.json](../artifacts/performance/performance-budget-gate.json)

## 7. Inventario de cachés e invalidación

| Caché o store | Anchor | Qué guarda | Clave o partición | Invalidación real |
| --- | --- | --- | --- | --- |
| DocumentCache | [src/server/knowledge/DocumentCache.ts](../src/server/knowledge/DocumentCache.ts) | snapshot semántico por URI | URI normalizada | cambio de texto, cierre, reindexado |
| KnowledgeBase publicado | [src/server/knowledge/KnowledgeBase.ts](../src/server/knowledge/KnowledgeBase.ts) | buckets globales, scopes, dependencias, snapshots | estado atómico interno | `semanticEpoch` en publish/remove/resync |
| HotContextCache | [src/server/knowledge/HotContextCache.ts](../src/server/knowledge/HotContextCache.ts) | entidades del activo y miembros heredados precalculados | `activeUri + kbVersion` | cambio de activo, bump de KB, invalidación por URI |
| ServingCache | [src/server/knowledge/ServingCache.ts](../src/server/knowledge/ServingCache.ts) | resultados de serving interactivo | feature + URI + posición + KB + extra | invalidación por URI, vaciado global, presión de memoria |
| CodeLensResultCache | [src/server/features/codeLensResultCache.ts](../src/server/features/codeLensResultCache.ts) | resultados de CodeLens | clave documental propia | cierre/cambio de documento, invalidación explícita |
| InheritanceGraph cacheado | [src/server/knowledge/resolution/InheritanceGraph.ts](../src/server/knowledge/resolution/InheritanceGraph.ts) | ancestros, jerarquías y miembros | nombre de tipo | cambia con el contenido de KB |
| SystemCatalog | [src/server/knowledge/system/SystemCatalog.ts](../src/server/knowledge/system/SystemCatalog.ts) | catálogo built-in generado/manual/localizado | índices internos de lookup | immutable/lazy; no invalidación por documento |
| Checkpoint persistente | [src/server/cache/cacheStore.ts](../src/server/cache/cacheStore.ts) | documentos, metadata, epoch, journal | `workspaceKey` y partición por proyecto | schema incompatible o maintenance explícito |
| Serving cache persistida | [src/server/cache/servingCachePersistence.ts](../src/server/cache/servingCachePersistence.ts) | snapshot exportado del ServingCache | entries serializadas | restore selectivo por epoch |
| Runtime journal | [src/server/runtime/runtimeJournal.ts](../src/server/runtime/runtimeJournal.ts) | eventos de cache, query, invalidación, build | buffer circular | truncado por capacidad |

Patrón dominante de invalidación:

1. cambia el documento o watcher intake detecta alteración;
2. se calcula plan de invalidación semántica;
3. se invalidan caches locales por URI;
4. el KnowledgeBase vuelve a publicar y sube `semanticEpoch`;
5. features futuras sirven contra el nuevo epoch o degradan si falta readiness.

## 8. Guardrails y contratos observables mapeados a código

| Contrato | Implementación real | Evidencia ejecutable confirmada |
| --- | --- | --- |
| Cliente fino y sin semántica | [src/client/extension.ts](../src/client/extension.ts), [src/client/commandRegistration.ts](../src/client/commandRegistration.ts) | [test/server/unit/architectureImports.test.ts](../test/server/unit/architectureImports.test.ts) |
| Servidor como runtime principal | [src/server/server.ts](../src/server/server.ts), [src/server/handlers](../src/server/handlers) | smoke e integration sobre [.vscode-test.js](../.vscode-test.js) |
| `shared` como contratos puros | [src/shared](../src/shared) | [test/server/unit/architectureImports.test.ts](../test/server/unit/architectureImports.test.ts) bloquea UI, IO e internals runtime; solo permite imports LSP type-only cuando son contrato |
| Legacy aislado del runtime | [plugin_old](../plugin_old), [src](../src), [legacy-isolation.md](legacy-isolation.md) | [test/server/unit/architectureImports.test.ts](../test/server/unit/architectureImports.test.ts) bloquea imports productivos desde `src/**` hacia `plugin_old/**`, incluyendo `import()` y `require()` |
| Estado semántico atómico | [src/server/knowledge/KnowledgeBase.ts](../src/server/knowledge/KnowledgeBase.ts) | suites citadas en [testing.md](testing.md) sobre KnowledgeBase y semantic diff |
| No full scan en hot path | [src/server/features/queryScopePolicy.ts](../src/server/features/queryScopePolicy.ts), [src/server/features/referenceSourcePool.ts](../src/server/features/referenceSourcePool.ts), [src/server/knowledge/ServingCache.ts](../src/server/knowledge/ServingCache.ts) | [test/server/unit/hotPathAllocationBudget.test.ts](../test/server/unit/hotPathAllocationBudget.test.ts), [test/server/helpers/hotPathTestHarness.ts](../test/server/helpers/hotPathTestHarness.ts), [test/server/unit/interactiveHotPathGuards.test.ts](../test/server/unit/interactiveHotPathGuards.test.ts) |
| Payload LSP acotado | [src/server/serving/payloadBudget.ts](../src/server/serving/payloadBudget.ts), [src/server/runtime/interactiveServingStats.ts](../src/server/runtime/interactiveServingStats.ts) | [test/server/unit/lspPayloadBudgetContracts.test.ts](../test/server/unit/lspPayloadBudgetContracts.test.ts), [docs/performance-budget.md](performance-budget.md) |
| IA read-only sobre contratos públicos | [src/shared/publicApi.ts](../src/shared/publicApi.ts), [src/client/aiTaskContextBundle.ts](../src/client/aiTaskContextBundle.ts), [docs/ai-orchestration.md](ai-orchestration.md) | [test/server/unit/aiTaskContextBundle.test.ts](../test/server/unit/aiTaskContextBundle.test.ts), [test/server/unit/aiCustomizationGovernance.test.ts](../test/server/unit/aiCustomizationGovernance.test.ts), [test/server/unit/aiContextDocs.test.ts](../test/server/unit/aiContextDocs.test.ts) |
| DataWindow como dominio separado | [src/server/parsing/srContainerParser.ts](../src/server/parsing/srContainerParser.ts), [src/server/features/dataWindowModel.ts](../src/server/features/dataWindowModel.ts) | suites DataWindow descritas en [testing.md](testing.md) y guard que permite solo contratos parser ligeros (`grammar`, `statementSplitter`) en `dataWindow*.ts` |
| `sourceOrigin` transversal | [src/shared/sourceOrigin.ts](../src/shared/sourceOrigin.ts), [src/server/workspace/workspaceState.ts](../src/server/workspace/workspaceState.ts), [src/server/knowledge/KnowledgeBase.ts](../src/server/knowledge/KnowledgeBase.ts) | anclas de source origin recogidas en [testing.md](testing.md) |
| Preempción y backpressure | [src/server/runtime/scheduler.ts](../src/server/runtime/scheduler.ts), [src/server/runtime/backpressurePolicy.ts](../src/server/runtime/backpressurePolicy.ts) | [test/server/unit/runtimeHealth.test.ts](../test/server/unit/runtimeHealth.test.ts), suites scheduler/backpressure citadas en [testing.md](testing.md) |
| Presión de memoria adaptable | [src/server/runtime/memoryBudgets.ts](../src/server/runtime/memoryBudgets.ts), [src/server/runtime/memoryPressurePolicy.ts](../src/server/runtime/memoryPressurePolicy.ts) | [test/server/unit/memoryBudgets.test.ts](../test/server/unit/memoryBudgets.test.ts), [test/server/unit/memoryPressurePolicy.test.ts](../test/server/unit/memoryPressurePolicy.test.ts) |
| Observabilidad exportable y sin telemetría | [src/server/runtime/runtimeJournal.ts](../src/server/runtime/runtimeJournal.ts), [src/server/runtime/runtimeHealth.ts](../src/server/runtime/runtimeHealth.ts), [src/client/support/supportBundle.ts](../src/client/support/supportBundle.ts) | [test/server/unit/publicApi.test.ts](../test/server/unit/publicApi.test.ts), [test/server/unit/runtimeHealth.test.ts](../test/server/unit/runtimeHealth.test.ts), [test/server/unit/supportBundle.test.ts](../test/server/unit/supportBundle.test.ts) |

## 9. Build, release, corpora y superficies externas

### 9.1 Carril de build y release realmente versionado

Scripts reales en [package.json](../package.json):

- `compile`, `watch`, `bundle`, `build:test`;
- `test`, `test:smoke`, `test:unit`, `test:integration`, `test:performance`;
- `test:architecture:metrics`, `test:architecture:rapid`, `test:docs:drift`, `test:performance:gate`, `test:performance:soak`;
- `package:vsix`, `package:vsix:list`, `verify:vsix-contents`, `release:summary`, `release:verify`.

Runner real de vscode-test en [.vscode-test.js](../.vscode-test.js):

- `smoke`;
- `unit`;
- `integration`;
- `performance`;
- `smoke-installed` para verificar el VSIX instalado.

### 9.2 Tooling y evidencia serializada

Superficies versionadas:

- [tools/esbuild.mjs](../tools/esbuild.mjs) para bundling productivo;
- [tools/docs-drift-audit.cjs](../tools/docs-drift-audit.cjs) para coherencia documental, foco vivo y referencias a prompts/agentes/skills existentes;
- [tools/run-performance-budget-gate.mjs](../tools/run-performance-budget-gate.mjs) y [artifacts/performance](../artifacts/performance) para budgets de corpus público y features LSP calientes;
- [tools/run-architecture-hotspot-guard.mjs](../tools/run-architecture-hotspot-guard.mjs) y [artifacts/performance/architecture-hotspot-guard.json](../artifacts/performance/architecture-hotspot-guard.json) para entrypoints, feature hotspots LSP/DataWindow, `growthPolicy` y sugerencias de extracción;
- [scripts/generate_catalog_consistency_report.cjs](../scripts/generate_catalog_consistency_report.cjs) y [artifacts/catalog](../artifacts/catalog) para auditoría de catálogo.

### 9.3 Corpora y comportamiento cuando faltan

[test/README.md](../test/README.md) fija que varias suites de performance dependen de [fixtures-local](../fixtures-local). Si los corpora no existen, las suites correspondientes pueden saltarse de forma honesta.

### 9.4 CI visible en el snapshot

El release lane ya queda versionado también como workflow visible en `.github/workflows/release-readiness.yml`, alineado con `release:verify`, ejecutado con `xvfb-run -a` en Linux headless y con upload del VSIX resultante durante `14` días.

## 10. Solapes, legacy y ownership difuso

| Hallazgo | Evidencia | Lectura arquitectónica |
| --- | --- | --- |
| `plugin_old` mantiene parser, semántica y tests antiguos junto al runtime nuevo | [plugin_old/src](../plugin_old/src), [legacy-isolation.md](legacy-isolation.md), [technical-debt-inventory.md](technical-debt-inventory.md) y regla explícita en [backlog.md](backlog.md) | Duplicación deliberada de referencia; útil como dataset/patrón, pero gobernada como `Reference-only` y bloqueada por fitness function |
| `generated`, `manual` y `localization` conviven en el catálogo | [src/server/knowledge/system](../src/server/knowledge/system) y [ADR-0001-system-catalog-source-of-truth.md](adr/ADR-0001-system-catalog-source-of-truth.md) | No es duplicidad accidental; es una composición gobernada que exige owner claro y tooling de consistencia |
| Las composition roots siguen concentradas en dos archivos grandes | [src/client/extension.ts](../src/client/extension.ts) y [src/server/server.ts](../src/server/server.ts) | No rompen la arquitectura, pero siguen siendo hotspots vigilados; `server.ts` ya delega registro de features/comandos en módulos de handlers y el guard sugiere próximos destinos de extracción |
| Parte del conocimiento de build/release está repartido entre docs y scripts | [package.json](../package.json), [.vscode-test.js](../.vscode-test.js), [release.md](release.md), [developer-workflows.md](developer-workflows.md), [troubleshooting.md](troubleshooting.md), [testing.md](testing.md) | El carril ejecutable ya tiene owner documental de release y troubleshooting; mantener links cruzados en lugar de copiar procedimientos |

## 11. Desviaciones y huecos frente a la arquitectura objetivo

| Desviación o hueco | Anchor verificable | Impacto |
| --- | --- | --- |
| CodeLens sin `resolveProvider` | [src/server/handlers/lifecycleHandlers.ts](../src/server/handlers/lifecycleHandlers.ts) | Simplifica serving, pero obliga a preparar el payload upfront |
| No existe `docs/build/README.md` en el snapshot | ausencia del archivo; release vive en [release.md](release.md), workflow local en [developer-workflows.md](developer-workflows.md) y fallos operativos en [troubleshooting.md](troubleshooting.md) | No se abre nuevo árbol `docs/build` mientras esos owners cubran el contrato sin duplicación |
| No hay script `lint` en [package.json](../package.json) | scripts reales inspeccionados | La validación final no puede incluir lint salvo que se añada ese carril |
| `plugin_old` sigue versionado | [plugin_old](../plugin_old), [legacy-isolation.md](legacy-isolation.md), [technical-debt-inventory.md](technical-debt-inventory.md) | Superficie legacy útil y `Reference-only`; retirada futura requiere spec, receipt y pruebas |

## 12. Testing ejecutable y ownership del backlog derivado

### 12.1 Matriz ejecutable hoy

Carriles verificables desde [package.json](../package.json):

- `npm run compile`
- `npm test`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:performance`
- `npm run test:architecture:metrics`
- `npm run test:architecture:rapid`
- `npm run test:docs:drift`
- `npm run test:performance:gate`
- `npm run package:vsix`
- `npm run verify:vsix-contents`
- `npm run release:verify`

Gap explícito:

- no existe `npm run lint` en el repo actual.

### 12.2 Backlog derivado promovido al owner correcto

Los hallazgos accionables de la ultra auditoría ya viven en [backlog.md](backlog.md), sección 4.1. Este mapa conserva la evidencia estructural y la matriz ejecutable, pero no mantiene backlog paralelo ni foco activo duplicado.

- Para foco activo: [current-focus.md](current-focus.md)
- Para prioridades macro: [roadmap.md](roadmap.md)
- Para histórico de cierres: [done-log.md](done-log.md)
- Para trabajo accionable: [backlog.md](backlog.md)

## 13. Fichas detalladas de módulos críticos

### 13.1 Features LSP

### Hover

Qué es:

- Provider interactivo de hover para entidades del workspace, built-ins PowerBuilder y surfaces DataWindow.

Archivos reales:

- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/handlers/featureHandlerRegistration.ts](../src/server/handlers/featureHandlerRegistration.ts)
- [src/server/features/hover.ts](../src/server/features/hover.ts)
- [src/server/features/hoverFormat.ts](../src/server/features/hoverFormat.ts)

Entry points:

- `registerHoverHandler()`
- `connection.onHover(...)`
- `provideHover(...)`

Responsabilidades reales:

- resolver el target semántico desde snapshots y catálogo;
- decidir readiness antes de servir;
- formatear Markdown compacto y cachear la respuesta final en `ServingCache`.

No debe hacer:

- escanear el workspace completo;
- abrir IO del filesystem en cada request;
- reparsear el documento completo fuera del camino `analysisCache -> DocumentCache -> KnowledgeBase`.

Consumidores:

- `textDocument/hover`
- surfaces explainability que reutilizan la misma cadena semántica, no el formatter de hover.

Dependencias:

- `KnowledgeBase`
- `SystemCatalog`
- `InheritanceGraph`
- `HotContextCache`
- `ServingCache`

Caches usadas:

- `ServingCache` por `feature|uri|line|character|kbVersion|locale`;
- `HotContextCache` para miembros heredados del activo.

Modelo de invalidación:

- invalidación por URI desde `documentHandlers.ts` y `watchedFileIntake.ts`;
- invalidación total bajo presión de memoria;
- cambio de `knowledgeBase.version` invalida la key de serving.

Hot path:

- sí

IO / workspace scan / parse:

- no en cache hit;
- en cache miss consume snapshots ya materializados vía `getDocumentAnalysis()` y no hace workspace scan.

Cancellation token:

- no usado; la protección real es `scheduler.runInteractive(...)`, budgets y readiness.

Payload risk:

- medio

Tests existentes:

- `test/server/unit/hover.test.ts`
- `test/server/unit/hoverFormat.test.ts`
- `test/server/unit/hotPathAllocationBudget.test.ts`

Tests faltantes:

- prueba explícita de negative cache;
- guard de coste del formatter Markdown en cache miss;
- prueba dedicada de hit ratio o invalidación de una futura caché de presentación.

Duplicidades:

- parcial; el formateo visible se reparte entre `hover.ts`, `hoverFormat.ts` y `documentationService.ts`.

Riesgos:

- cada miss recompone resolución y Markdown final;
- los misses seguros todavía dependen de mantener invalidación estricta por documento/epoch/locale para no servir negativos stale;
- el payload final ya convive con un `HoverViewModel` separado y reusable, así que el riesgo principal deja de ser la ausencia de esa capa y pasa a ser su versionado correcto.

Acción recomendada:

- `DEVTOOLS-PERF-02`
- `DEVTOOLS-PERF-03`
- `DEVTOOLS-UX-01`

Estado:

- implemented

### Completion

Qué es:

- Provider de completion contextual para variables, miembros, built-ins, keywords y contexts DataWindow.

Archivos reales:

- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/features/completion.ts](../src/server/features/completion.ts)
- [src/server/features/completionScoring.ts](../src/server/features/completionScoring.ts)

Entry points:

- `registerCompletionHandler()`
- `connection.onCompletion(...)`
- `provideCompletion(...)`
- `getMembersForCompletion(...)`

Responsabilidades reales:

- resolver qualifier y prefijo;
- reutilizar `HotContextCache` para miembros heredados;
- mezclar símbolos del workspace con built-ins owner-scoped y contexts enumerados.

No debe hacer:

- clonar el catálogo completo;
- abrir scans globales del workspace;
- delegar en una segunda fase `resolve` que hoy no existe.

Consumidores:

- `textDocument/completion`

Dependencias:

- `KnowledgeBase`
- `SystemCatalog`
- `InheritanceGraph`
- `HotContextCache`
- `ServingCache`
- `queryContext`
- `enumeratedContext`

Caches usadas:

- `ServingCache` por posición, `triggerKind`, `triggerCharacter`, KB y locale;
- `HotContextCache` para miembros heredados del activo.

Modelo de invalidación:

- mismo patrón que hover;
- invalidación por URI y por versión de KB;
- purga global bajo presión de memoria.

Hot path:

- sí

IO / workspace scan / parse:

- no en cache hit;
- en miss usa snapshots y queries acotadas por `queryScopePolicy`, sin workspace scan completo.

Cancellation token:

- no usado.

Payload risk:

- medio; la lista inicial ya no incluye documentación larga, y `completionItem/resolve` tiene budget separado.

Tests existentes:

- `test/server/unit/completion.test.ts`
- `test/server/unit/interactiveServingPipeline.test.ts`
- `test/server/unit/servingCache.test.ts`
- `test/server/unit/hotPathAllocationBudget.test.ts`
- `test/server/unit/queryScopePolicy.test.ts`
- `test/server/unit/presentationContracts.test.ts`

Tests faltantes:

- prueba de integración LSP end-to-end para `completionItem/resolve`;
- invalidación y hit ratio de una futura caché de lista final.

Duplicidades:

- parcial; resolución de qualifier y contexts enum se reparten entre `completion.ts`, `queryContext.ts` y `enumeratedContext.ts`; el ranking visible queda centralizado en `COMPLETION_RANK_SORT_PREFIX`.

Riesgos:

- `resultCap = 200` sigue exigiendo budget de payload inicial;
- `CompletionListViewModel` ya existe como contrato puro de presentación; una caché standalone de lista final sigue condicionada a presión medible.

Acción recomendada:

- `DEVTOOLS-PERF-04`
- `DEVTOOLS-PERF-05`
- `DEVTOOLS-PERF-06`

Estado:

- implemented via explicit `ServingCache` partition y `CompletionListViewModel`/`CompletionResolveViewModel`; la caché standalone de lista final sigue pendiente sólo si se promueve por evidencia de coste.

### Completion Resolve

Qué es:

- La segunda fase LSP `completionItem/resolve` para enriquecer items ya listados sin inflar la primera respuesta.

Archivos reales:

- [src/server/features/completion.ts](../src/server/features/completion.ts)
- [src/server/presentation/completionPresentation.ts](../src/server/presentation/completionPresentation.ts)
- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/handlers/lifecycleHandlers.ts](../src/server/handlers/lifecycleHandlers.ts)
- [src/server/runtime/interactiveServingStats.ts](../src/server/runtime/interactiveServingStats.ts)
- [src/server/serving/cacheKeyContract.ts](../src/server/serving/cacheKeyContract.ts)

Entry points:

- `provideCompletion(...)` emite items iniciales ligeros con `CompletionItem.data` versionado.
- `resolveCompletionItem(...)` rehidrata detalle/documentación desde `SystemCatalog` o `KnowledgeBase`.
- `completionPresentation.ts` materializa `CompletionListViewModel` y `CompletionResolveViewModel`, y sólo después los adapta a DTOs LSP.
- `connection.onCompletionResolve(...)` ejecuta la segunda fase LSP dentro de `InteractiveServingPipeline`.

Responsabilidades reales:

- mantener `label`, `kind`, `sortText`, `insertText` y `textEdit` estables entre lista inicial y resolve;
- diferir documentación localizada y detalles más ricos fuera del payload inicial;
- reutilizar misses seguros mediante negative cache por locale/contexto cuando `completion-resolve` no puede materializar payload nuevo;
- rechazar items sin `data` propia devolviendo el item original.

No debe hacer:

- introducir un segundo camino semántico distinto al de completion;
- abrir scans o IO nuevos para enriquecer items.

Consumidores:

- LSP `textDocument/completion` para la lista inicial.
- LSP `completionItem/resolve` para el item seleccionado.

Dependencias:

- [src/server/handlers/lifecycleHandlers.ts](../src/server/handlers/lifecycleHandlers.ts)
- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/features/completion.ts](../src/server/features/completion.ts)

Caches usadas:

- `ServingCache` con key estructurada `completion-resolve` y contexto por item (`system:<id>` o `entity:<uri>:<id>:<line>:<character>`).
- `PresentationCache` negativa para misses seguros de `completion-resolve`, segregada por locale/contexto y alineada con el mismo contrato de invalidación estructurada.

Modelo de invalidación:

- `InteractiveServingStaleGuard` compara `documentVersion`, `kbVersion`, `semanticEpoch`, `sourceOrigin`, locale y context key capturados en `CompletionItem.data` contra el estado actual.

Hot path:

- budget interactivo de completion (`50ms`) y payload budget diferido `completion-resolve = 4 KiB`.

IO / workspace scan / parse:

- no abre IO ni workspace scan; el resolve de catálogo usa `findByDomainAndLookupKey`, y el resolve semántico usa lookups por URI/scope ya publicados.

Cancellation token:

- se propaga desde el scheduler interactivo al `InteractiveServingPipeline`.

Payload risk:

- reducido para documentación de catálogo/entidades: la lista inicial mantiene summary/data y el detalle enriquecido se sirve por item.

Tests existentes:

- [test/server/unit/completion.test.ts](../test/server/unit/completion.test.ts): lista inicial ligera, resolve localizado, fallback sin `data` y misses reutilizables.
- [test/server/unit/cacheKeyContract.test.ts](../test/server/unit/cacheKeyContract.test.ts): segregación por locale/contexto para el negative lane de `completion-resolve`.
- [test/server/unit/interactiveServingPipeline.test.ts](../test/server/unit/interactiveServingPipeline.test.ts): métricas, payload budget separado y negative-hit para `completion-resolve`.
- [test/server/unit/presentationContracts.test.ts](../test/server/unit/presentationContracts.test.ts): separación estructural entre lista inicial, resolve enriquecido y overlay localizado sin cambiar identidad del símbolo.

Tests faltantes:

- prueba de integración LSP end-to-end que ejerza `initialize` + `completionItem/resolve` sobre el servidor empaquetado.

Duplicidades:

- no aplica hoy.

Riesgos:

- el provider inicial no puede degradar documentación/detalle de forma incremental.

Acción recomendada:

- `DEVTOOLS-PERF-04`

Estado:

- implemented

### Signature Help

Qué es:

- Provider de firmas y parámetros activos para callables del workspace, built-ins y `Retrieve()` DataWindow enlazado.

Archivos reales:

- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/features/signatureHelp.ts](../src/server/features/signatureHelp.ts)

Entry points:

- `registerSignatureHelpHandler()`
- `connection.onSignatureHelp(...)`
- `provideSignatureHelp(...)`

Responsabilidades reales:

- extraer contexto de llamada;
- resolver owner type y callable;
- proyectar documentación localizada de parámetros y `return`;
- materializar un `SignatureHelpViewModel` ligero antes de adaptar al DTO LSP.

No debe hacer:

- reparsear el documento entero fuera del snapshot;
- resolver sobre todo el workspace por defecto.

Consumidores:

- `textDocument/signatureHelp`

Dependencias:

- `KnowledgeBase`
- `SystemCatalog`
- `InheritanceGraph`
- `HotContextCache`
- `ServingCache`
- `queryScopePolicy`
- `dataWindowBindingModel`

Caches usadas:

- `ServingCache` por posición, locale y snapshot activo;
- el `SignatureHelpViewModel` es frontera de presentación, no un segundo motor semántico.

Modelo de invalidación:

- igual que hover;
- degrade o block por `FeatureReadiness`.

Hot path:

- sí

IO / workspace scan / parse:

- no en hit;
- en miss usa snapshot y resolución acotada por budget.

Cancellation token:

- no usado.

Payload risk:

- medio

Tests existentes:

- [test/server/unit/signatureHelp.test.ts](../test/server/unit/signatureHelp.test.ts): firmas workspace, built-ins, DataWindow binding y formatter de `SignatureHelpViewModel`.
- [test/server/unit/queryScopePolicy.test.ts](../test/server/unit/queryScopePolicy.test.ts): budgets/caps/readiness declarativos.
- [test/server/unit/featureReadiness.test.ts](../test/server/unit/featureReadiness.test.ts)
- [test/server/unit/interactiveHotPathGuards.test.ts](../test/server/unit/interactiveHotPathGuards.test.ts): no IO, no workspace scan y no full parse con snapshot caliente.

Tests faltantes:

- integración LSP end-to-end que mida hit ratio por locale sobre el servidor empaquetado.

Duplicidades:

- reducida; el formateo visible queda detrás de `SignatureHelpViewModel`, mientras `documentationService.ts` conserva el owner de documentación localizada.

Riesgos:

- el contexto DataWindow reutiliza binding canónico, pero no existe fast mode separado para serving interactivo.

Acción recomendada:

- `DEVTOOLS-DW-01`

Estado:

- implemented

### Diagnostics

Qué es:

- Pipeline incremental de diagnósticos estructurales, semánticos, obsolescencia y DataWindow.

Archivos reales:

- [src/server/handlers/documentHandlers.ts](../src/server/handlers/documentHandlers.ts)
- [src/server/analysis/diagnosticScheduler.ts](../src/server/analysis/diagnosticScheduler.ts)
- [src/server/features/diagnostics.ts](../src/server/features/diagnostics.ts)
- [src/server/features/diagnosticsExtra.ts](../src/server/features/diagnosticsExtra.ts)
- [src/server/presentation/diagnosticPresentation.ts](../src/server/presentation/diagnosticPresentation.ts)

Entry points:

- `publishDiagnosticsNow(...)`
- `scheduleDiagnostics(...)`
- `publishDiagnostics(...)`

Responsabilidades reales:

- reusar análisis documental cacheado;
- programar publicación con debounce;
- mantener `diagnosticsSummary` sin reemitir todo el pipeline para consultas read-only;
- proyectar `DiagnosticMessageViewModel` después de severities/reason codes y antes de publicar DTOs LSP.

No debe hacer:

- reabrir discovery global;
- recalcular semántica del workspace completo por un cambio local.

Consumidores:

- `textDocument/publishDiagnostics`
- explainability read-only
- runtime stats

Dependencias:

- `analysisCache`
- `KnowledgeBase`
- `SystemCatalog`
- `InheritanceGraph`
- `WorkspaceState`

Caches usadas:

- reuse de `analysisCache`, `DocumentCache` y `KnowledgeBase`;
- `diagnosticsSummary` como resumen persistente por URI.

Modelo de invalidación:

- `cancelScheduledDiagnostics(uri)` en cambios/cierre;
- fan-out desde `semanticInvalidation.ts`.

Hot path:

- parcial

IO / workspace scan / parse:

- no hay workspace scan;
- el parseo completo solo aparece en miss de `analysisCache`.

Cancellation token:

- no usado como token LSP;
- cancelación efectiva por debounce y borrado de timers.

Payload risk:

- medio

Tests existentes:

- `test/server/unit/diagnostics.test.ts`
- `test/server/unit/diagnosticsExtra.test.ts`
- `test/server/unit/diagnosticScheduler.test.ts`
- [test/server/unit/presentationContracts.test.ts](../test/server/unit/presentationContracts.test.ts)

Tests faltantes:

- prueba explícita de `no IO / no workspace scan` en el path incremental;
- caché final de diagnostics si algún día se introduce;
- invalidación y recomputación de casos `sourceOrigin` mixto bajo watcher burst.

Duplicidades:

- reducida; `diagnosticPresentation.ts` posee la proyección final de mensaje/código/confidence, mientras `diagnostics.ts`, `diagnosticsExtra.ts` y `enumeratedContext.ts` conservan detección y evidencia.

Riesgos:

- no existe una caché final de diagnostics por snapshot; el ahorro viene de `analysisCache` y del scheduler, no de un resultado ya serializado.

Acción recomendada:

- `DEVTOOLS-PERF-07`

Estado:

- implemented

### Definition

Qué es:

- Provider de definición que abre entidades del workspace, built-ins y rutas owner-aware de DataWindow.

Archivos reales:

- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/features/definition.ts](../src/server/features/definition.ts)

Entry points:

- `registerDefinitionHandler()`
- `connection.onDefinition(...)`
- `provideDefinition(...)`

Responsabilidades reales:

- crear `DocumentQueryContext` con confidence y reason codes;
- degradar o bloquear por readiness;
- cachear resultado final más `resolutionConfidence`.

No debe hacer:

- usar fallback global indiscriminado;
- romper la prioridad `source real > orca-staging`.

Consumidores:

- `textDocument/definition`

Dependencias:

- `KnowledgeBase`
- `InheritanceGraph`
- `HotContextCache`
- `SystemCatalog`
- `ServingCache`
- `queryContext`

Caches usadas:

- `ServingCache` con key estructurada derivada de `ActiveDocumentServingSnapshot` y una entry enriquecida que incluye `resolutionConfidence`.

Modelo de invalidación:

- invalidación por URI y por versión de KB;
- revalidación de readiness al leer de caché;
- `InteractiveServingStaleGuard` descarta resultados stale antes de publicar o escribir el miss.

Hot path:

- sí

IO / workspace scan / parse:

- no en hit;
- en miss usa snapshots y queries por proyecto, no workspace scan.

Cancellation token:

- no usado.

Payload risk:

- bajo

Tests existentes:

- [test/server/unit/definition.test.ts](../test/server/unit/definition.test.ts): workspace, herencia, built-ins owner-aware y DataWindow high-confidence.
- [test/server/unit/queryScopePolicy.test.ts](../test/server/unit/queryScopePolicy.test.ts): budgets/caps/readiness declarativos.
- [test/server/unit/interactiveHotPathGuards.test.ts](../test/server/unit/interactiveHotPathGuards.test.ts): no IO, no workspace scan y no full parse con snapshot caliente.
- [test/server/unit/interactiveServingPipeline.test.ts](../test/server/unit/interactiveServingPipeline.test.ts): stale discard y payload policy compartidos.
- [test/server/unit/featureHandlers.test.ts](../test/server/unit/featureHandlers.test.ts): logging interactivo acotado.

Tests faltantes:

- integración LSP que fuerce stale durante un cambio real de documento.

Duplicidades:

- parcial; comparte resolución con `queryContext.ts` y `semanticQueryService.ts`, pero mantiene lógica DataWindow específica en el provider.

Riesgos:

- el provider mezcla lookup built-in, owner chains DataWindow y definición del workspace en un mismo miss path.

Acción recomendada:

- `DEVTOOLS-ARCH-01` para consolidación futura de duplicidades DataWindow, no para el serving contract actual.

Estado:

- implemented

### References

Qué es:

- Provider de referencias sobre pool de fuentes acotado y texto ya enmascarado.

Archivos reales:

- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/features/references.ts](../src/server/features/references.ts)
- [src/server/features/referenceSourcePool.ts](../src/server/features/referenceSourcePool.ts)

Entry points:

- `registerReferencesHandler()`
- `connection.onReferences(...)`
- `provideReferences(...)`

Responsabilidades reales:

- construir `DocumentQueryContext`;
- acotar el pool de archivos al proyecto;
- reusar `maskedText` y bloquear dinámicos inseguros.

No debe hacer:

- abrir el workspace entero si la policy del consumer no lo autoriza;
- mezclar `generated` u `orca-staging` sin allowance explícita.

Consumidores:

- `textDocument/references`
- rename
- CodeLens references

Dependencias:

- `KnowledgeBase`
- `InheritanceGraph`
- `HotContextCache`
- `referenceSourcePool`
- `queryContext`

Caches usadas:

- no usa `ServingCache`;
- reusa `maskedText`, `DocumentCache` y el pool de fuentes.

Modelo de invalidación:

- depende de invalidación semántica, no de caché final.

Hot path:

- parcial

IO / workspace scan / parse:

- puede leer el pool de fuentes del proyecto;
- no hace workspace scan completo por diseño.

Cancellation token:

- no usado.

Payload risk:

- alto

Tests existentes:

- `test/server/unit/references.test.ts`
- `test/server/unit/referenceSourcePool.test.ts`
- `test/server/unit/queryScopePolicy.test.ts`

Tests faltantes:

- path de resultados masivos con límites visibles.

Duplicidades:

- parcial; comparte parte de la resolución con rename y CodeLens, pero el conteo y matching de familias vive en varios sitios.

Riesgos:

- no existe caché final y el payload puede crecer hasta `resultCap = 512`.

Acción recomendada:

- `DEVTOOLS-ARCH-01`
- `DEVTOOLS-PERF-07`

Estado:

- implemented

### Rename

Qué es:

- Provider de rename y prepare rename con preflight semántico y bloqueo de casos inseguros.

Archivos reales:

- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/features/rename.ts](../src/server/features/rename.ts)
- [src/server/features/renamePreflight.ts](../src/server/features/renamePreflight.ts)

Entry points:

- `registerRenameHandlers()`
- `connection.onPrepareRename(...)`
- `connection.onRenameRequest(...)`
- `provideRename(...)`

Responsabilidades reales:

- validar target y nombre nuevo;
- bloquear casos `dynamic`, `external`, ambiguos o con `sourceOrigin` no defendible;
- reutilizar references para construir `WorkspaceEdit`.

No debe hacer:

- renombrar built-ins del catálogo;
- degradar silenciosamente un rename inseguro a best effort.

Consumidores:

- `textDocument/prepareRename`
- `textDocument/rename`

Dependencias:

- `KnowledgeBase`
- `InheritanceGraph`
- `SystemCatalog`
- `HotContextCache`
- `queryContext`
- `references`

Caches usadas:

- no usa caché final.

Modelo de invalidación:

- no aplica una caché dedicada;
- depende del estado semántico vigente y del source pool.

Hot path:

- parcial

IO / workspace scan / parse:

- puede leer el source pool del proyecto;
- no hace workspace scan completo.

Cancellation token:

- no usado.

Payload risk:

- alto

Tests existentes:

- `test/server/unit/rename.test.ts`
- `test/server/unit/referenceSourcePool.test.ts`
- `test/server/unit/queryScopePolicy.test.ts`

Tests faltantes:

- pruebas de límites de payload del `WorkspaceEdit`.

Duplicidades:

- parcial; comparte resolución, matching y source pool con references.

Riesgos:

- el coste real depende de references;
- el gating es correcto, pero no existe una caché ni un snapshot transversal del documento activo.

Acción recomendada:

- `DEVTOOLS-ARCH-01`
- `DEVTOOLS-PERF-06`

Estado:

- implemented

### Document Symbols

Qué es:

- Provider de outline documental con reconciliación explícita parser/snapshot/LSP.

Archivos reales:

- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/features/documentSymbols.ts](../src/server/features/documentSymbols.ts)

Entry points:

- `registerDocumentSymbolHandler()`
- `connection.onDocumentSymbol(...)`
- `extractDocumentSymbolsWithReconciliation(...)`

Responsabilidades reales:

- construir el árbol LSP desde snapshot;
- generar reporte de reconciliación y reason codes;
- degradar con safe mode para `.srd`.

No debe hacer:

- depender de DTOs LSP dentro del parser o del core;
- reparsear el workspace.

Consumidores:

- `textDocument/documentSymbol`

Dependencias:

- `analysisCache`
- `DocumentCache`
- `dataWindowSafeMode`

Caches usadas:

- no usa `ServingCache`;
- reusa `getDocumentAnalysis(document).snapshot`.

Modelo de invalidación:

- el outline se recompone al cambiar el documento o el snapshot.

Hot path:

- sí

IO / workspace scan / parse:

- no en hit de análisis;
- no hace workspace scan.

Cancellation token:

- no usado.

Payload risk:

- bajo

Tests existentes:

- [test/server/unit/documentSymbols.test.ts](../test/server/unit/documentSymbols.test.ts)
- [test/server/unit/documentSymbolsReconciliation.test.ts](../test/server/unit/documentSymbolsReconciliation.test.ts)
- [test/server/unit/interactiveHotPathGuards.test.ts](../test/server/unit/interactiveHotPathGuards.test.ts): no IO, no workspace scan y no full parse con snapshot caliente.

Tests faltantes:

- medición corpus-driven de coste de outline caliente antes de introducir cache final.

Duplicidades:

- no; la reconciliación vive en este módulo.

Riesgos:

- no existe caché final de outline por decisión explícita de Bloque 4; depende del snapshot y del análisis interactivo mientras el coste caliente siga bajo.

Acción recomendada:

- `DEVTOOLS-PERF-07`

Estado:

- implemented

### Workspace Symbols

Qué es:

- Query de símbolos globales del workspace sobre `KnowledgeBase`.

Archivos reales:

- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/features/workspaceSymbols.ts](../src/server/features/workspaceSymbols.ts)

Entry points:

- `registerWorkspaceSymbolHandler()`
- `connection.onWorkspaceSymbol(...)`
- `provideWorkspaceSymbols(...)`

Responsabilidades reales:

- consultar `KnowledgeBase.findSymbolsByName(...)` con cap;
- devolver `SymbolInformation` LSP.

No debe hacer:

- full scan del filesystem;
- materializar todo el KB para responder un query corto.

Consumidores:

- `workspace/symbol`

Dependencias:

- `KnowledgeBase`

Caches usadas:

- no usa caché dedicada.

Modelo de invalidación:

- depende del estado publicado del `KnowledgeBase`.

Hot path:

- no

IO / workspace scan / parse:

- no

Cancellation token:

- no usado.

Payload risk:

- medio

Tests existentes:

- `test/server/unit/workspaceSymbols.test.ts`

Tests faltantes:

- pruebas de escalado y truncado bajo queries muy amplios.

Duplicidades:

- no

Riesgos:

- responde desde KB; el riesgo principal es el cap, no IO.

Acción recomendada:

- no aplica

Estado:

- implemented

### Semantic Tokens

Qué es:

- Provider de tokens semánticos para declaraciones, usos y miembros enumerados.

Archivos reales:

- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/features/semanticTokens.ts](../src/server/features/semanticTokens.ts)
- [src/server/presentation/semanticTokenPresentation.ts](../src/server/presentation/semanticTokenPresentation.ts)

Entry points:

- `registerSemanticTokensHandler()`
- `connection.languages.semanticTokens.on(...)`
- `provideSemanticTokens(...)`

Responsabilidades reales:

- emitir tokens desde snapshot y catálogo;
- clasificar built-ins owner-scoped y enum members sin escanear el catálogo completo;
- ordenar/deduplicar `SemanticTokenViewModel` y adaptar el payload final con `SemanticTokensBuilder` fuera del resolver.

No debe hacer:

- abrir scans por dominio del catálogo;
- reparsear el workspace.

Consumidores:

- `textDocument/semanticTokens/full`

Dependencias:

- `KnowledgeBase`
- `InheritanceGraph`
- `SystemCatalog`
- `analysisCache`

Caches usadas:

- no hay caché final dedicada;
- reusa análisis documental.

Modelo de invalidación:

- depende del snapshot y del estado del `KnowledgeBase`.

Hot path:

- parcial

IO / workspace scan / parse:

- no workspace scan;
- parseo solo si falta snapshot.

Cancellation token:

- no usado.

Payload risk:

- medio

Tests existentes:

- [test/server/unit/semanticTokens.test.ts](../test/server/unit/semanticTokens.test.ts)
- [test/server/unit/hotPathAllocationBudget.test.ts](../test/server/unit/hotPathAllocationBudget.test.ts)
- [test/server/unit/interactiveHotPathGuards.test.ts](../test/server/unit/interactiveHotPathGuards.test.ts): no IO, no workspace scan y no full parse con snapshot caliente.
- [test/server/unit/queryScopePolicy.test.ts](../test/server/unit/queryScopePolicy.test.ts): payload budget declarativo para `semanticTokens`.
- [test/server/unit/presentationContracts.test.ts](../test/server/unit/presentationContracts.test.ts): orden/dedupe y formatter LSP compacto para tokens.

Tests faltantes:

- medición corpus-driven de payload/coste antes de introducir cache final o delta.

Duplicidades:

- parcial; parte de la clasificación segura de built-ins y enums se solapa conceptualmente con completion/hover.

Riesgos:

- el provider mantiene respuesta `full` sin delta ni cache final por decisión explícita; el coste se controla con snapshot caliente, budgets y tests antes de añadir complejidad.

Acción recomendada:

- `DEVTOOLS-PERF-07`

Estado:

- implemented

### CodeLens

Qué es:

- Provider de CodeLens de referencias y overrides sobre callables del documento.

Archivos reales:

- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/features/codeLensReferences.ts](../src/server/features/codeLensReferences.ts)
- [src/server/features/codeLensResultCache.ts](../src/server/features/codeLensResultCache.ts)

Entry points:

- `registerCodeLensHandler()`
- `registerPrimaryFeatureHandlers()`
- `registerAuxiliaryFeatureHandlers()`
- `connection.onCodeLens(...)`
- `provideReferenceCodeLenses(...)`

Responsabilidades reales:

- calcular counts de referencias por callable;
- mostrar títulos `N referencias` y `M overrides`;
- cachear lenses finales por URI y estado de readiness.

No debe hacer:

- anunciar `resolveProvider` sin soportarlo;
- abrir el workspace entero fuera del pool de references.

Consumidores:

- `textDocument/codeLens`

Dependencias:

- `KnowledgeBase`
- `references`
- `CodeLensResultCache`

Caches usadas:

- `CodeLensResultCache` LRU por URI y decision de readiness.

Modelo de invalidación:

- invalidación por URI desde `documentHandlers.ts`;
- invalidación total cuando cambia el documento activo relevante o la KB.

Hot path:

- parcial

IO / workspace scan / parse:

- no en el builder de lenses;
- el coste real depende del conteo de referencias.

Cancellation token:

- no usado.

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/codeLensResultCache.test.ts`
- `test/server/unit/codeLensReferences.test.ts`
- `test/server/unit/lspCapabilitiesContract.test.ts`

Tests faltantes:

- no aplica `resolveProvider`; si se añade, habrá que cubrirlo.

Duplicidades:

- parcial; el conteo e inspección de jerarquía se reparten entre `featureHandlers.ts` y `codeLensReferences.ts`.

Riesgos:

- `codeLensProvider.resolveProvider = false` por decisión explícita de Bloque 4; todo el payload útil sale en el primer paso y un cambio futuro a `codeLens/resolve` debe abrir backlog propio.

Acción recomendada:

- `DEVTOOLS-ARCH-01`

Estado:

- implemented

### 13.2 Handlers y lifecycle

### FeatureHandlers

Qué es:

- Composition root del hot path LSP y puente central entre transporte y features.

Archivos reales:

- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)

Entry points:

- `registerHoverHandler()`
- `registerCompletionHandler()`
- `registerSignatureHelpHandler()`
- `registerDefinitionHandler()`
- `registerReferencesHandler()`
- `registerRenameHandlers()`
- `registerDocumentSymbolHandler()`
- `registerWorkspaceSymbolHandler()`
- `registerSemanticTokensHandler()`
- `registerCodeLensHandler()`

Responsabilidades reales:

- gating de readiness;
- cache hit/miss de serving;
- métricas de latencia;
- coordinación con scheduler y pressure policy.

No debe hacer:

- convertirse en un segundo motor semántico;
- duplicar resolución que ya pertenece a `queryContext` o `semanticQueryService`.

Consumidores:

- todos los handlers LSP interactivos.

Dependencias:

- `TaskScheduler`
- `ServingCache`
- `HotContextCache`
- `KnowledgeBase`
- `InheritanceGraph`
- `SystemCatalog`

Caches usadas:

- `ServingCache`
- `HotContextCache`
- `CodeLensResultCache`

Modelo de invalidación:

- reacciona a invalidación aguas abajo; no la decide.

Hot path:

- sí

IO / workspace scan / parse:

- no directamente.

Cancellation token:

- no usado.

Payload risk:

- alto

Tests existentes:

- `test/server/unit/featureHandlers.test.ts`
- `test/server/unit/hotPathAllocationBudget.test.ts`
- `test/server/unit/lspCapabilitiesContract.test.ts`
- `test/server/unit/architectureImports.test.ts`
- `test/server/unit/servingCache.test.ts`

Tests faltantes:

- integración LSP end-to-end de initialize + resolve sobre extensión empaquetada.

Duplicidades:

- reducida en composition root: `server.ts` ya no registra cada feature una por una; `featureHandlers.ts` conserva ramas internas de readiness/cache donde vive el adapter real.

Riesgos:

- sigue siendo hotspot de mantenimiento y policy wiring, pero el registro externo ya está separado del provider adapter.

Acción recomendada:

- `DEVTOOLS-ARCH-01`

Estado:

- implemented

### DocumentHandlers

Qué es:

- Handler documental de open/change/close y primera línea de invalidación semántica.

Archivos reales:

- [src/server/handlers/documentHandlers.ts](../src/server/handlers/documentHandlers.ts)

Entry points:

- `registerDocumentHandlers()`
- `documents.onDidOpen(...)`
- `documents.onDidChangeContent(...)`
- `documents.onDidClose(...)`

Responsabilidades reales:

- calcular planes de invalidación antes y después del cambio;
- invalidar caches locales por URI;
- programar diagnostics.

No debe hacer:

- rediscovery global por un cambio local normal.

Consumidores:

- `TextDocuments`
- runtime invalidation

Dependencias:

- `semanticInvalidation.ts`
- `analysisCache`
- `diagnosticScheduler`
- `ServingCache`
- `HotContextCache`
- `CodeLensResultCache`

Caches usadas:

- invalida `HotContextCache`, `ServingCache`, `analysisCache` y `CodeLensResultCache`.

Modelo de invalidación:

- dirigido y transitive-aware.

Hot path:

- sí

IO / workspace scan / parse:

- no salvo que `analysisCache` tenga miss posterior.

Cancellation token:

- no usado; la cancelación visible es la del debounce de diagnostics.

Payload risk:

- medio

Tests existentes:

- `test/server/unit/semanticDiff.test.ts`
- `test/server/unit/watchedFileIntake.test.ts`
- `test/server/unit/diagnosticScheduler.test.ts`

Tests faltantes:

- prueba dedicada del orden exacto de invalidación por cache y URI.

Duplicidades:

- no.

Riesgos:

- cualquier ensanchamiento accidental del fan-out rompe latencia interactiva.

Acción recomendada:

- `DEVTOOLS-PERF-07`

Estado:

- implemented

### LifecycleHandlers

Qué es:

- Handler de inicialización LSP, publicación de capabilities, warm resume y arranque de discovery/indexación.

Archivos reales:

- [src/server/handlers/lifecycleHandlers.ts](../src/server/handlers/lifecycleHandlers.ts)

Entry points:

- `registerInitializeHandler()`
- `registerInitializedHandler()`
- `connection.onInitialize(...)`
- `connection.onInitialized(...)`

Responsabilidades reales:

- publicar capabilities reales;
- restaurar `DocumentCache`, `KnowledgeBase` y `ServingCache` si la persistencia es reusable;
- arrancar discovery e indexing en background.

No debe hacer:

- anunciar capabilities no implementadas.

Consumidores:

- handshake LSP;
- runtime bootstrap.

Dependencias:

- `TaskScheduler`
- `SemanticCacheStore`
- `restoreServingCacheSnapshot(...)`
- `WorkspaceState`

Caches usadas:

- warm resume de `DocumentCache`, `KnowledgeBase` y `ServingCache`.

Modelo de invalidación:

- decide `reuse` o `rebuild` al cargar checkpoint.

Hot path:

- parcial

IO / workspace scan / parse:

- sí, solo en bootstrap de persistencia y discovery.

Cancellation token:

- parcial; la indexación en background sí usa token, el bootstrap de capabilities no.

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/releaseReadinessContract.test.ts`
- `test/server/unit/lspCapabilitiesContract.test.ts`
- `test/smoke/extension.test.ts`

Tests faltantes:

- no aplica para el contrato actual de `completionProvider.resolveProvider = true` y `codeLensProvider.resolveProvider = false`.

Duplicidades:

- no.

Riesgos:

- hoy anuncia `completionProvider.resolveProvider = true` y `codeLensProvider.resolveProvider = false`; el riesgo pasa a mantener esas capabilities alineadas con handlers reales.

Acción recomendada:

- `DEVTOOLS-PERF-04`

Estado:

- implemented

### BuildCommandHandlers

Qué es:

- Command router server-side para format, PBAutoBuild, ORCA y staging legacy.

Archivos reales:

- [src/server/handlers/buildCommandHandlers.ts](../src/server/handlers/buildCommandHandlers.ts)

Entry points:

- `tryHandleBuildCommand(...)`

Responsabilidades reales:

- validar requests de build;
- delegar ejecución a runners con backpressure;
- parsear logs y proyectar problemas;
- registrar journal de build/legacy.

No debe hacer:

- contaminar el hot path del lenguaje;
- saltarse preflight de build files o staging.

Consumidores:

- `workspace/executeCommand`
- comandos cliente-side de build y ORCA.

Dependencias:

- `PbAutoBuildRunner`
- `OrcaRunner`
- `prepareOrcaStagingExport(...)`
- `runOrcaStagingImport(...)`
- `RuntimeJournal`
- `BuildOrcaJournalStore`

Caches usadas:

- no usa cachés de serving;
- consume `WorkspaceState` y `KnowledgeBase` como contexto read-only.

Modelo de invalidación:

- no aplica; el estado operativo vive en journals y snapshots de runner.

Hot path:

- no

IO / workspace scan / parse:

- sí; spawn de procesos, lectura/escritura de staging y logs.

Cancellation token:

- parcial; cancelación delegada a runners.

Payload risk:

- medio

Tests existentes:

- `test/server/unit/pbAutoBuildRunner.test.ts`
- `test/server/unit/pbAutoBuildLogParser.test.ts`
- `test/server/unit/pbAutoBuildProblems.test.ts`
- `test/server/unit/orcaRunner.test.ts`

Tests faltantes:

- no aplica para hot path; sí smoke contractual cuando cambien comandos.

Duplicidades:

- no.

Riesgos:

- cualquier acoplamiento de este handler al serving interactivo sería una regresión arquitectónica.

Acción recomendada:

- no aplica

Estado:

- implemented

### RuntimeCommandHandlers

Qué es:

- Router de comandos read-only de stats, manifest, maintenance y observabilidad del runtime.

Archivos reales:

- [src/server/handlers/runtimeCommandHandlers.ts](../src/server/handlers/runtimeCommandHandlers.ts)

Entry points:

- `tryHandleRuntimeCommand(...)`

Responsabilidades reales:

- exponer stats de cachés, scheduler, memory, persistence y health;
- ejecutar maintenance fuera del hot path;
- exportar manifest semántico con caps adaptativos.

No debe hacer:

- ejecutar lógica semántica paralela al runtime principal.

Consumidores:

- `workspace/executeCommand`
- health report
- support bundle

Dependencias:

- `KnowledgeBase`
- `DocumentCache`
- `ServingCache`
- `HotContextCache`
- `buildRuntimeMemoryReport(...)`
- `buildRuntimeHealthReport(...)`

Caches usadas:

- introspección de todas las cachés del runtime;
- no añade una caché propia.

Modelo de invalidación:

- depende del estado actual del runtime.

Hot path:

- no

IO / workspace scan / parse:

- parcial; maintenance y caché persistente sí tocan disco.

Cancellation token:

- parcial; delegada a workloads de export/maintenance.

Payload risk:

- medio

Tests existentes:

- `test/server/unit/runtimeHealth.test.ts`
- `test/server/unit/runtimeJournal.test.ts`
- `test/server/unit/cacheStore.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- el riesgo principal es payload excesivo si fallan los caps adaptativos.

Acción recomendada:

- no aplica

Estado:

- implemented

### ReportCommandHandlers

Qué es:

- Router de reports read-only, explainability, metrics, impact analysis y planes seguros.

Archivos reales:

- [src/server/handlers/reportCommandHandlers.ts](../src/server/handlers/reportCommandHandlers.ts)

Entry points:

- `tryHandleReportCommand(...)`

Responsabilidades reales:

- cargar documento abierto o desde filesystem si hace falta;
- ejecutar workloads `near-context` o `export-reporting` con caps adaptativos;
- reutilizar `KnowledgeBase`, `InheritanceGraph`, `SystemCatalog` y `HotContextCache`.

No debe hacer:

- abrir un segundo motor de resolución o diagnostics.

Consumidores:

- comandos de reports y explain tools.

Dependencias:

- `buildCurrentObjectContext(...)`
- `buildImpactAnalysis(...)`
- `buildSafeEditPlan(...)`
- `buildPowerBuilderCodeMetrics(...)`
- `buildWorkspaceMigrationAssistant(...)`

Caches usadas:

- reutiliza `HotContextCache` y el estado semántico publicado;
- no usa `ServingCache` como caché final de reportes.

Modelo de invalidación:

- depende del runtime y de los caps por request.

Hot path:

- parcial

IO / workspace scan / parse:

- sí; si el documento no está abierto, lee texto desde filesystem.

Cancellation token:

- parcial; delegada a workloads gestionados.

Payload risk:

- alto

Tests existentes:

- `test/server/unit/currentObjectContext.test.ts`
- `test/server/unit/impactAnalysis.test.ts`
- `test/server/unit/safeEditPlan.test.ts`
- `test/server/unit/powerBuilderTechnicalDebtReport.test.ts`

Tests faltantes:

- no aplica al hot path interactivo; sí mantener caps y redacción.

Duplicidades:

- parcial; el formateo AI-readable se reparte entre varios report builders.

Riesgos:

- payloads grandes si fallan los caps adaptativos o si no hay `ActiveDocumentServingSnapshot` que centralice reuse.

Acción recomendada:

- `DEVTOOLS-PERF-06`
- `DEVTOOLS-ARCH-01`

Estado:

- implemented

### 13.3 Indexación, parsing y análisis

### WorkspaceIndexer

Qué es:

- Indexador incremental del workspace con fases structural/enriched y yielding cooperativo.

Archivos reales:

- [src/server/indexer/workspaceIndexer.ts](../src/server/indexer/workspaceIndexer.ts)

Entry points:

- `startIndexing(...)`
- `getIndexerStatus()`

Responsabilidades reales:

- priorizar el activo y su proyecto;
- ejecutar batches atómicos sobre `KnowledgeBase`;
- degradar de forma honesta ante límites de tamaño o presupuesto.

No debe hacer:

- bloquear el foreground;
- publicar estados semánticos a medias.

Consumidores:

- bootstrap;
- watcher recovery;
- readiness runtime.

Dependencias:

- `analyzeDocument(...)`
- `DocumentCache`
- `KnowledgeBase`
- `TaskScheduler`

Caches usadas:

- `DocumentCache`
- `KnowledgeBase`

Modelo de invalidación:

- reindexa por cambio de hash o rematerialización topológica.

Hot path:

- parcial

IO / workspace scan / parse:

- sí; lee archivos del workspace fuera del hot path interactivo.

Cancellation token:

- usado.

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/workspaceIndexer.test.ts`
- `test/server/performance/large-workspace-incremental.perf.test.ts`

Tests faltantes:

- no aplica dentro de esta auditoría.

Duplicidades:

- no.

Riesgos:

- degradación insuficiente o batch publication incorrecta impactarían todo el runtime.

Acción recomendada:

- no aplica

Estado:

- implemented

### Workspace discovery

Qué es:

- Descubrimiento read-only de roots y markers PowerBuilder.

Archivos reales:

- [src/server/workspace/discovery.ts](../src/server/workspace/discovery.ts)
- [src/server/workspace/workspaceState.ts](../src/server/workspace/workspaceState.ts)

Entry points:

- `discoverPowerBuilderRoots(...)`

Responsabilidades reales:

- localizar `.pbw`, `.pbt`, `.pbsln`, `.pbproj`, `.pbl` y fuentes SR*;
- alimentar topología y source origins.

No debe hacer:

- ejecutarse en hot path interactivo.

Consumidores:

- lifecycle bootstrap;
- watcher topology refresh.

Dependencias:

- `NodeFileSystem`
- `topology.ts`
- `WorkspaceState`

Caches usadas:

- no usa caché propia.

Modelo de invalidación:

- rerun completo en bootstrap;
- watcher incremental para cambios posteriores.

Hot path:

- no

IO / workspace scan / parse:

- sí; walk recursivo del workspace.

Cancellation token:

- no usado en la implementación actual.

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/workspace.test.ts`

Tests faltantes:

- cancellation explícita si algún día se endurece esta ruta.

Duplicidades:

- parcial con watcher/topology refresh, pero deliberada por separar cold start de intake incremental.

Riesgos:

- un discovery eager fuera de bootstrap rompería la arquitectura de activation rápida.

Acción recomendada:

- no aplica

Estado:

- implemented

### Watched file intake/bridge

Qué es:

- Intake incremental de eventos de watcher y bridge entre el protocolo LSP y la invalidación real.

Archivos reales:

- [src/server/workspace/watchedFileIntake.ts](../src/server/workspace/watchedFileIntake.ts)
- [src/server/workspace/watchedFileChangeBridge.ts](../src/server/workspace/watchedFileChangeBridge.ts)

Entry points:

- `applyWatchedFileEvents(...)`

Responsabilidades reales:

- rematerializar `sourceOrigin`;
- refrescar build files y topología;
- invalidar snapshots, caches y dependientes sin rediscovery completo.

No debe hacer:

- escanear todo el workspace por ráfagas pequeñas.

Consumidores:

- file watcher LSP;
- workspace routing.

Dependencias:

- `DocumentCache`
- `KnowledgeBase`
- `HotContextCache`
- `ServingCache`
- `WorkspaceState`

Caches usadas:

- invalida `DocumentCache`, `HotContextCache` y `ServingCache`.

Modelo de invalidación:

- dirigido por evento y por plan semántico.

Hot path:

- sí

IO / workspace scan / parse:

- sí, pero solo sobre URIs afectadas o markers topológicos relacionados.

Cancellation token:

- no usado.

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/watchedFileIntake.test.ts`
- `test/server/unit/watchedFileChangeBridge.test.ts`

Tests faltantes:

- prueba dedicada de bursts masivos con mixed-root y rematerialización parcial.

Duplicidades:

- no.

Riesgos:

- si el intake se ensancha, puede disparar fan-out innecesario o purgas excesivas de serving cache.

Acción recomendada:

- no aplica

Estado:

- implemented

### DocumentModel

Qué es:

- Agregador de parsing documental que compone statements, secciones y contenedor SR*.

Archivos reales:

- [src/server/parsing/documentModel.ts](../src/server/parsing/documentModel.ts)

Entry points:

- `buildDocumentModel(...)`

Responsabilidades reales:

- exponer una estructura reutilizable para análisis posteriores;
- evitar reparseos disjuntos por feature.

No debe hacer:

- depender de VS Code o del borde LSP.

Consumidores:

- `documentAnalysis.ts`

Dependencias:

- `statementSplitter.ts`
- `sectionMachine.ts`
- `srContainerParser.ts`

Caches usadas:

- no usa caché propia.

Modelo de invalidación:

- se reconstruye al reanalizar el documento.

Hot path:

- parcial

IO / workspace scan / parse:

- parse documental en memoria; sin IO.

Cancellation token:

- no aplica

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/documentModel.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- cualquier bypass por feature reabriría duplicidad de parsing.

Acción recomendada:

- no aplica

Estado:

- implemented

### SectionMachine

Qué es:

- State machine que delimita secciones declarativas PowerBuilder.

Archivos reales:

- [src/server/parsing/sectionMachine.ts](../src/server/parsing/sectionMachine.ts)

Entry points:

- `scanSections(...)`

Responsabilidades reales:

- detectar rangos `forward`, `prototypes`, `variables` y cierres estructurales.

No debe hacer:

- parseo semántico completo.

Consumidores:

- `documentModel.ts`
- `documentAnalysis.ts`

Dependencias:

- texto normalizado del documento.

Caches usadas:

- no aplica.

Modelo de invalidación:

- recalculado por documento.

Hot path:

- no

IO / workspace scan / parse:

- parse en memoria.

Cancellation token:

- no aplica

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/sectionMachine.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- falsos positivos aquí degradan diagnostics y outline.

Acción recomendada:

- no aplica

Estado:

- implemented

### StatementSplitter

Qué es:

- Segmentador lógico de statements PowerBuilder respetando comentarios, strings y continuaciones.

Archivos reales:

- [src/server/parsing/statementSplitter.ts](../src/server/parsing/statementSplitter.ts)

Entry points:

- `splitStatements(...)`

Responsabilidades reales:

- construir `logicalStatements` defendibles;
- evitar contaminación por comentarios y `&`.

No debe hacer:

- semántica ni resolución.

Consumidores:

- `documentModel.ts`
- `documentAnalysis.ts`

Dependencias:

- `stripCommentsSmart(...)`

Caches usadas:

- no aplica.

Modelo de invalidación:

- recalculado por documento.

Hot path:

- no

IO / workspace scan / parse:

- parse en memoria.

Cancellation token:

- no aplica

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/statementSplitter.test.ts`
- `test/server/unit/powerbuilderParserResilienceFuzz.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- errores aquí propagan drift a todo el snapshot.

Acción recomendada:

- no aplica

Estado:

- implemented

### SR container parser

Qué es:

- Parser rápido de contenedor SR* para límites estructurales y metadata de objeto.

Archivos reales:

- [src/server/parsing/srContainerParser.ts](../src/server/parsing/srContainerParser.ts)

Entry points:

- `parseSrContainer(...)`

Responsabilidades reales:

- extraer `forward`, tipo global y hooks del contenedor;
- distinguir SR* de PowerScript normal.

No debe hacer:

- tratar `.srd` como PowerScript genérico.

Consumidores:

- `documentModel.ts`
- `documentAnalysis.ts`

Dependencias:

- texto del documento.

Caches usadas:

- no aplica.

Modelo de invalidación:

- recalculado por documento.

Hot path:

- no

IO / workspace scan / parse:

- parse en memoria.

Cancellation token:

- no aplica

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/srContainer.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- es una frontera crítica para DataWindow y objects SR*.

Acción recomendada:

- no aplica

Estado:

- implemented

### DocumentAnalysis

Qué es:

- Análisis documental completo que produce facts, scopes y snapshot semántico.

Archivos reales:

- [src/server/analysis/documentAnalysis.ts](../src/server/analysis/documentAnalysis.ts)

Entry points:

- `analyzeDocument(...)`

Responsabilidades reales:

- materializar el snapshot canónico;
- propagar `sourceOrigin`;
- alimentar tanto serving interactivo como indexación.

No debe hacer:

- publicar estado parcial sin pasar por `KnowledgeBase`.

Consumidores:

- `analysisCache.ts`
- `workspaceIndexer.ts`
- `diagnostics.ts`

Dependencias:

- `documentModel.ts`
- `semanticSnapshot.ts`
- `sourceOrigin.ts`

Caches usadas:

- se beneficia de `analysisCache`;
- persiste en `DocumentCache` y `KnowledgeBase` a través de backends.

Modelo de invalidación:

- por versión, fingerprint y `sourceOrigin`.

Hot path:

- parcial

IO / workspace scan / parse:

- parse documental en memoria; sin workspace scan.

Cancellation token:

- no usado directamente.

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/documentAnalysis.test.ts`
- `test/server/unit/powerbuilderParserResilienceFuzz.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- es el punto donde confluyen parser, source origin y snapshot identity.

Acción recomendada:

- no aplica

Estado:

- implemented

### AnalysisCache

Qué es:

- Caché interactiva LRU de análisis documental con short-circuit por versión, fingerprint y `sourceOrigin`.

Archivos reales:

- [src/server/analysis/analysisCache.ts](../src/server/analysis/analysisCache.ts)

Entry points:

- `getDocumentAnalysis(...)`
- `setAnalysisBackends(...)`
- `invalidateDocumentAnalysis(...)`

Responsabilidades reales:

- evitar reparseos del archivo activo;
- sincronizar el análisis reutilizado con `DocumentCache` y `KnowledgeBase`.

No debe hacer:

- crecer sin límite;
- ignorar cambios de `sourceOrigin`.

Consumidores:

- hover
- completion
- diagnostics
- semanticTokens
- documentSymbols

Dependencias:

- `DocumentCache`
- `KnowledgeBase`
- `calculateHash(...)`

Caches usadas:

- es la caché.

Modelo de invalidación:

- por URI;
- por mismatch de versión/fingerprint/sourceOrigin;
- LRU cuando supera 256 entradas.

Hot path:

- sí

IO / workspace scan / parse:

- no;
- solo parsea el documento activo en miss.

Cancellation token:

- no usado.

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/analysisCache.test.ts`

Tests faltantes:

- thrash control en sesiones muy largas si se endurecen budgets.

Duplicidades:

- no.

Riesgos:

- `MAX_CACHED_ANALYSES = 256` es fijo y puede thrash en sesiones grandes.

Acción recomendada:

- `DEVTOOLS-PERF-06`

Estado:

- implemented

### DiagnosticScheduler

Qué es:

- Debounce y lanzamiento interactivo de diagnostics.

Archivos reales:

- [src/server/analysis/diagnosticScheduler.ts](../src/server/analysis/diagnosticScheduler.ts)

Entry points:

- `scheduleDiagnostics(...)`
- `publishDiagnosticsNow(...)`
- `cancelScheduledDiagnostics(...)`

Responsabilidades reales:

- convertir ráfagas de edición en una sola publicación defendible;
- limpiar timers pendientes por URI.

No debe hacer:

- bloquear el foreground o dejar timers huérfanos.

Consumidores:

- `documentHandlers.ts`

Dependencias:

- `TaskScheduler`
- `publishDiagnostics(...)`

Caches usadas:

- no usa caché final; sí reuse de análisis aguas abajo.

Modelo de invalidación:

- `cancelScheduledDiagnostics(uri)` y `clearAllScheduledDiagnostics()`.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no usado; cancelación por timer.

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/diagnosticScheduler.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- un debounce incorrecto puede introducir stale diagnostics o demasiados republish.

Acción recomendada:

- no aplica

Estado:

- implemented

### 13.4 Knowledge, query y caches

### KnowledgeBase

Qué es:

- Backbone semántico global con publicación atómica y `semanticEpoch`.

Archivos reales:

- [src/server/knowledge/KnowledgeBase.ts](../src/server/knowledge/KnowledgeBase.ts)

Entry points:

- `beginBatchUpdate()`
- `upsertDocument(...)`
- `removeDocument(...)`
- `findSymbolsByName(...)`
- `getDocumentSnapshot(...)`

Responsabilidades reales:

- mantener índices globales y snapshots publicados;
- preservar prioridad `source real > staging > generated`;
- exponer queries acotadas al serving y reportes.

No debe hacer:

- exponer estado semántico a medias.

Consumidores:

- todas las features semánticas;
- runtime stats;
- reportes.

Dependencias:

- `sourceOrigin.ts`
- `knowledge/types.ts`

Caches usadas:

- es el store global publicado.

Modelo de invalidación:

- publish/remove incrementa `semanticEpoch`;
- batch update aplaza side effects hasta publicar.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica.

Payload risk:

- alto

Tests existentes:

- `test/server/unit/knowledgeBase.test.ts`
- `test/server/performance/knowledgeBase.perf.test.ts`

Tests faltantes:

- no aplica en esta auditoría.

Duplicidades:

- no.

Riesgos:

- cualquier query ancha o copia masiva rompería el hot path.

Acción recomendada:

- no aplica

Estado:

- implemented

### DocumentCache

Qué es:

- Caché por documento de snapshot, facts y scopes, reutilizable también en warm resume. Implementa una política Tiered LRU (Pinned/Warm/Cold) gobernada por `memoryPressurePolicy`.

Archivos reales:

- [src/server/knowledge/DocumentCache.ts](../src/server/knowledge/DocumentCache.ts)

Entry points:

- `set(...)`
- `get(...)`
- `pin(...)` / `unpin(...)`
- `invalidate(...)`
- `restoreDocumentRecords(...)`

Responsabilidades reales:

- mantener el snapshot documental reusable;
- mantener el límite de memoria a través de eviction LRU (ej. `256` max capacity);
- proteger documentos activos vía `pin`;
- soportar persistencia y restore.

No debe hacer:

- confundirse con la fuente única de verdad global; eso sigue siendo `KnowledgeBase` publicada.

Consumidores:

- `analysisCache`
- `workspaceIndexer`
- `runtimeCommandHandlers`

Dependencias:

- `ManagedStringInterner`
- `cacheSchema`

Caches usadas:

- es la caché.

Modelo de invalidación:

- por URI, cierre, change, watcher delete o rebuild persistente.

Hot path:

- sí

IO / workspace scan / parse:

- no en uso normal;
- sí en warm resume.

Cancellation token:

- no aplica

Payload risk:

- medio

Tests existentes:

- `test/server/unit/cacheStore.test.ts`
- `test/server/unit/semanticWorkspaceSnapshot.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- restore corrupto debe caer a rebuild limpio; ya existe suite, pero sigue siendo una frontera crítica.

Acción recomendada:

- no aplica

Estado:

- implemented

### HotContextCache

Qué es:

- Caché del documento activo y de miembros heredados ya resueltos.

Archivos reales:

- [src/server/knowledge/HotContextCache.ts](../src/server/knowledge/HotContextCache.ts)

Entry points:

- `setActive(...)`
- `getActiveEntities()`
- `getInheritedMembers(...)`
- `setInheritedMembers(...)`

Responsabilidades reales:

- evitar recomputar ancestros y miembros del activo;
- servir como aproximación parcial a un `ActiveDocumentServingSnapshot`.

No debe hacer:

- crecer sin límite;
- sobrevivir a un cambio de URI o de versión de KB sin invalidarse.

Consumidores:

- hover
- completion
- definition
- signatureHelp
- references
- rename

Dependencias:

- `normalizeUri(...)`

Caches usadas:

- es la caché.

Modelo de invalidación:

- `setActive(...)` invalida si cambia URI o KB;
- `invalidateForUri(...)` limpia selectivamente;
- cap LRU de 128 tipos heredados.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/completion.test.ts`
- `test/server/unit/hover.test.ts`
- `test/server/unit/definition.test.ts`

Tests faltantes:

- suite dedicada del propio `HotContextCache` y de su cap fijo frente a workspaces muy grandes.

Duplicidades:

- parcial; cubre solo parte del futuro `ActiveDocumentServingSnapshot`.

Riesgos:

- `maxInheritedTypes = 128` es fijo;
- solo cachea parte del contexto activo, no la foto completa de serving.

Acción recomendada:

- `DEVTOOLS-PERF-06`

Estado:

- implemented

### ServingCache

Qué es:

- LRU de resultados finales de hover, completion, signatureHelp y definition.

Archivos reales:

- [src/server/knowledge/ServingCache.ts](../src/server/knowledge/ServingCache.ts)
- [src/server/cache/servingCacheRuntime.ts](../src/server/cache/servingCacheRuntime.ts)

Entry points:

- `makeKey(...)`
- `get(...)`
- `set(...)`
- `invalidate(...)`
- `invalidateDependents(...)`

Responsabilidades reales:

- cachear la respuesta final por feature, posición y KB;
- invalidación selectiva granular (Salsa-style) usando diffs semánticos;
- exponer hit/miss/eviction;
- integrarse con pressure policy y persistencia opcional.

No debe hacer:

- convertirse en caché semántica global.

Consumidores:

- hover
- completion
- signatureHelp
- definition

Dependencias:

- `normalizeUri(...)`
- `semanticCacheRuntimeController.ts`

Caches usadas:

- es la caché.

Modelo de invalidación:

- por URI o flush global;
- evicción LRU;
- TTL opcional.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- alto

Tests existentes:

- `test/server/unit/servingCache.test.ts`
- `test/server/unit/servingCacheRuntime.test.ts`

Tests faltantes:

- partición por feature o política de purga selectiva;
- ratio y payload regression por tipo de feature.

Duplicidades:

- no.

Riesgos:

- un cap fijo de 256 entradas permite que completion expulse entradas útiles de hover/signatureHelp/definition;
- no sustituye caches de presentación específicas.

Acción recomendada:

- `DEVTOOLS-PERF-02`
- `DEVTOOLS-PERF-05`
- `DEVTOOLS-PERF-06`

Estado:

- implemented

### SemanticQueryService

Qué es:

- Motor central de resolución de targets, evidence, confidence y ambiguity.

Archivos reales:

- [src/server/knowledge/resolution/semanticQueryService.ts](../src/server/knowledge/resolution/semanticQueryService.ts)

Entry points:

- `resolveTargetEntityDetailed(...)`

Responsabilidades reales:

- resolver locals, receiver, hierarchy, parent, globals y fallback;
- producir `reasonCodes`, confidence y trace.

No debe hacer:

- depender del borde VS Code/LSP.

Consumidores:

- hover
- definition
- signatureHelp
- diagnostics
- reports explainability.

Dependencias:

- `KnowledgeBase`
- `InheritanceGraph`
- `queryTrace`
- `queryScopePolicy`

Caches usadas:

- no usa caché propia;
- puede consumir `HotContextCache`.

Modelo de invalidación:

- depende de `KnowledgeBase.version` y del estado del grafo.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no usado; sí consume `budgetMs` por consumer.

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/semanticQueryService.test.ts`
- `test/server/unit/queryContext.test.ts`

Tests faltantes:

- no aplica en esta auditoría.

Duplicidades:

- parcial; algunas features mantienen resolución complementaria de DataWindow o enums encima del motor común.

Riesgos:

- si se dispersa lógica fuera de este módulo, reaparecen duplicidades de resolución.

Acción recomendada:

- `DEVTOOLS-ARCH-01`

Estado:

- implemented

### PositionContext

Qué es:

- Helpers de contexto posicional barato para callable y tipo activos.

Archivos reales:

- [src/server/knowledge/positionContext.ts](../src/server/knowledge/positionContext.ts)

Entry points:

- `findInnermostCallableAtPosition(...)`
- `findInnermostTypeAtPosition(...)`
- `getPositionContext(...)`

Responsabilidades reales:

- localizar el scope más interno por línea sin abrir resolución completa.

No debe hacer:

- competir con `semanticQueryService` para resolución completa.

Consumidores:

- `queryContext.ts`
- providers que solo necesitan contexto posicional.

Dependencias:

- facts y scopes del snapshot.

Caches usadas:

- no.

Modelo de invalidación:

- recalculado sobre el snapshot vigente.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- no aplica

Tests existentes:

- cobertura indirecta vía `test/server/unit/queryContext.test.ts` y `semanticQueryService.test.ts`.

Tests faltantes:

- suite dedicada si el módulo crece.

Duplicidades:

- parcial; parte del contexto se recompone en `queryContext.ts`.

Riesgos:

- duplicar contexto fuera de aquí facilita drift semántico.

Acción recomendada:

- `DEVTOOLS-ARCH-01`

Estado:

- implemented

### InheritanceGraph

Qué es:

- Grafo y caché de ancestros, cierres de miembros y descendientes.

Archivos reales:

- [src/server/knowledge/resolution/InheritanceGraph.ts](../src/server/knowledge/resolution/InheritanceGraph.ts)

Entry points:

- `getAncestors(...)`
- `getMembers(...)`
- `getMemberClosure(...)`
- `getDescendants(...)`

Responsabilidades reales:

- servir jerarquía owner-aware y override-aware;
- invalidarse cuando cambia la versión del KB.

No debe hacer:

- esconder consultas globales costosas detrás de APIs aparentemente locales.

Consumidores:

- hover
- completion
- definition
- signatureHelp
- diagnostics
- reports.

Dependencias:

- `KnowledgeBase`

Caches usadas:

- caches internas de ancestros, miembros y descendientes versionadas por KB.

Modelo de invalidación:

- limpia todo si cambia `knowledgeBase.version`.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/inheritanceGraph.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- parcial; hay recorridos adicionales de jerarquía en CodeLens, hover lifecycle e inspección de jerarquía.

Riesgos:

- la duplicidad de recorridos sobre el mismo grafo aumenta coste y mantenimiento.

Acción recomendada:

- `DEVTOOLS-ARCH-01`

Estado:

- implemented

### QueryScopePolicy

Qué es:

- Registro único de budgets, caps, readiness y allowances por consumer semántico.

Archivos reales:

- [src/server/features/queryScopePolicy.ts](../src/server/features/queryScopePolicy.ts)

Entry points:

- `getQueryConsumerPolicy(...)`
- `getQueryConsumerPolicyByLabel(...)`

Responsabilidades reales:

- fijar límites de `hover`, `completion`, `signature-help`, `definition`, `references`, `rename` y reportes;
- decidir si `staging`, `generated` o `external` entran en juego.

No debe hacer:

- permitir que cada feature hardcodee sus propios caps.

Consumidores:

- `queryContext.ts`
- `featureReadiness.ts`
- providers interactivos
- reference pool
- reportes.

Dependencias:

- tipos de readiness y confidence.

Caches usadas:

- no aplica.

Modelo de invalidación:

- no aplica; es configuración de código.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/queryScopePolicy.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no; precisamente elimina hardcodes dispersos.

Riesgos:

- si una feature se sale del registro, rompe los budgets declarados.

Acción recomendada:

- no aplica

Estado:

- implemented

### ServingReadiness / FeatureReadiness

Qué es:

- Gate declarativo de allow/degrade/block por readiness, confidence y presión de latencia.

Archivos reales:

- [src/server/features/featureReadiness.ts](../src/server/features/featureReadiness.ts)
- [src/server/features/servingReadiness.ts](../src/server/features/servingReadiness.ts)

Entry points:

- `decideFeatureReadiness(...)`
- `resolveServingReadiness(...)`

Responsabilidades reales:

- traducir `queryScopePolicy` a decisiones de serving;
- bloquear resultados peligrosos o poco confiables.

No debe hacer:

- quedar duplicado en cada feature con reglas locales distintas.

Consumidores:

- hover
- completion
- definition
- references
- rename
- signatureHelp
- reportes.

Dependencias:

- `queryScopePolicy.ts`
- `progressReadiness.ts`

Caches usadas:

- no aplica.

Modelo de invalidación:

- reevaluado por request.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/featureReadiness.test.ts`
- `test/server/unit/servingReadiness.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no; es la capa central que evita duplicidad de readiness.

Riesgos:

- si se endurece sin datos reales, puede bloquear demasiado o demasiado poco.

Acción recomendada:

- `DEVTOOLS-PERF-01`

Estado:

- implemented

### 13.5 Catálogo y PowerBuilder system knowledge

### SystemCatalog

Qué es:

- Fachada única del catálogo del sistema sobre datasets `generated`, `manual` y `localization`.

Archivos reales:

- [src/server/knowledge/system/SystemCatalog.ts](../src/server/knowledge/system/SystemCatalog.ts)

Entry points:

- `findSystemSymbol(...)`
- `listMembersForOwner(...)`
- `resolveMemberFunctionForOwner(...)`
- `resolveEnumeratedType(...)`
- `resolveEnumeratedValueForExpectedType(...)`

Responsabilidades reales:

- lookup case-insensitive owner-aware;
- distinguir globals, members, events, enums y dominios DataWindow.

No debe hacer:

- scans completos del catálogo en hot path.

Consumidores:

- hover
- completion
- signatureHelp
- definition
- diagnostics
- semanticTokens.

Dependencias:

- `generated`
- `manual`
- `localization`
- `queryService.ts`

Caches usadas:

- índices internos del registry y del query service.

Modelo de invalidación:

- immutable/lazy a nivel runtime; no se invalida por documento.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/systemCatalog.test.ts`
- `test/server/unit/catalogConsistency.test.ts`
- `test/server/unit/systemCatalogQueryHardening.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no; actúa como owner único de lookup built-in.

Riesgos:

- si se introducen consumers que salten el servicio común, reaparece drift entre features.

Acción recomendada:

- no aplica

Estado:

- implemented

### Generated catalog

Qué es:

- Rail reproducible y primario del conocimiento oficial extraído/generado.

Archivos reales:

- [src/server/knowledge/system/generated](../src/server/knowledge/system/generated)
- [scripts/generate_official_function_catalog.cjs](../scripts/generate_official_function_catalog.cjs)
- [script/generate_official_function_catalog.cjs](../script/generate_official_function_catalog.cjs) como wrapper de compatibilidad hacia la ruta canónica plural.

Entry points:

- datasets `*.generated.ts`
- script de generación oficial.

Responsabilidades reales:

- servir la base oficial cuando hay evidencia reproducible.

No debe hacer:

- competir con `manual` sin una merge policy explícita.

Consumidores:

- `SystemCatalog`
- consistency/localization reports.

Dependencias:

- scripts de catálogo;
- registry/query service.

Caches usadas:

- índices del registry al arrancar el runtime.

Modelo de invalidación:

- solo cambia al regenerar datasets y recompilar.

Hot path:

- parcial

IO / workspace scan / parse:

- no en runtime.

Cancellation token:

- no aplica

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/catalogGeneratorScript.test.ts`
- `test/server/unit/catalogV2.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no; la policy actual es explícita.

Riesgos:

- regeneraciones incompletas romperían cobertura y contratos de identity.

Acción recomendada:

- no aplica

Estado:

- implemented

### Manual overlays

Qué es:

- Overlay curado para gaps, enrichments y overrides que no deben duplicar la base generated.

Archivos reales:

- [src/server/knowledge/system/manual](../src/server/knowledge/system/manual)

Entry points:

- agregadores `manual-core` y registry manual.

Responsabilidades reales:

- cubrir excepciones, gaps y dominios no oficiales.

No debe hacer:

- convertirse en fuente primaria indiscriminada.

Consumidores:

- `SystemCatalog`
- consistency reports.

Dependencias:

- policy `generated-primary-with-manual-overlays`.

Caches usadas:

- índices del registry.

Modelo de invalidación:

- cambia solo al editar datasets y recompilar.

Hot path:

- parcial

IO / workspace scan / parse:

- no en runtime.

Cancellation token:

- no aplica

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/manualCatalogStructure.test.ts`
- `test/server/unit/catalogConsistency.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- parcial por diseño gobernado; no accidental.

Riesgos:

- si los overrides se descontrolan, el hot path puede servir datos contradictorios.

Acción recomendada:

- no aplica

Estado:

- implemented

### Localization overlays

Qué es:

- Overlay documental por locale sobre la misma identidad semántica canónica.

Archivos reales:

- [src/server/knowledge/system/localization](../src/server/knowledge/system/localization)
- [scripts/generate_catalog_localization_report.cjs](../scripts/generate_catalog_localization_report.cjs)

Entry points:

- `localization/schema.ts`
- `documentationService.ts`
- índice de locale `es`.

Responsabilidades reales:

- fijar schema estricta del overlay (`source`, `reviewed`, anchors `targetId|targetKey`, slots reservados y `schemaVersion`), publicar `schemaIssues`/`missingFieldsByDomain` en el audit y servir `summary`, docs, notas de uso y docs de parámetros con fallback `es -> en`.

No debe hacer:

- duplicar símbolos o traducir nombres reales de PowerBuilder.

Consumidores:

- hover
- completion
- signatureHelp
- explain-system-symbol.

Dependencias:

- `SystemCatalog`
- `localizationResolver.ts`
- `documentationService.ts`

Caches usadas:

- índices memoizados por `targetId`/`targetKey` dentro del servicio documental.

Modelo de invalidación:

- cambia al regenerar overlays;
- `ServingCache` se particiona por locale para no mezclar respuestas.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/catalogLocalization.test.ts`
- `test/server/unit/documentationService.test.ts`
- `test/server/unit/documentationLocale.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no; el owner visible es `documentationService.ts`.

Riesgos:

- sin partición por locale en serving, habría contaminación cruzada; hoy esa partición sí existe.

Acción recomendada:

- no aplica

Estado:

- implemented

### PowerBuilder built-ins

Qué es:

- Built-ins globales, members, events, datatypes y statements PowerBuilder servidos por catálogo.

Archivos reales:

- [src/server/knowledge/system/SystemCatalog.ts](../src/server/knowledge/system/SystemCatalog.ts)
- [src/server/knowledge/system/generated](../src/server/knowledge/system/generated)
- [src/server/knowledge/system/manual](../src/server/knowledge/system/manual)

Entry points:

- queries del `SystemCatalog` para globals, members y events.

Responsabilidades reales:

- resolver built-ins de forma owner-aware sin hardcodes locales dispersos.

No debe hacer:

- contaminar rename/write-enabled con símbolos sin `sourceOrigin` defendible.

Consumidores:

- hover
- completion
- signatureHelp
- definition
- diagnostics
- semanticTokens.

Dependencias:

- `SystemCatalog`

Caches usadas:

- índices del catálogo.

Modelo de invalidación:

- no cambia por documento.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/systemCatalog.test.ts`
- `test/server/unit/hover.test.ts`
- `test/server/unit/completion.test.ts`
- `test/server/unit/signatureHelp.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no; los hardcodes restantes son excepciones a retirar, no owner principal.

Riesgos:

- si cualquier feature deja de usar `SystemCatalog`, reaparece drift.

Acción recomendada:

- no aplica

Estado:

- implemented

### Enumerated values/types

Qué es:

- Dominio separado de tipos enumerados y valores enumerados con `enumValueOf` explícito.

Archivos reales:

- [src/server/knowledge/system/generated](../src/server/knowledge/system/generated)
- [src/server/knowledge/system/services/queryService.ts](../src/server/knowledge/system/services/queryService.ts)
- [src/server/features/enumeratedContext.ts](../src/server/features/enumeratedContext.ts)

Entry points:

- `resolveEnumeratedType(...)`
- `resolveEnumeratedValueForExpectedType(...)`
- helpers de `enumeratedContext.ts`.

Responsabilidades reales:

- distinguir tipo enumerado y valor enumerado;
- proyectar contexto esperado para completion, signatureHelp y diagnostics.

No debe hacer:

- mezclar `enumerated-values` con `datawindow-constants`.

Consumidores:

- completion
- signatureHelp
- diagnostics
- semanticTokens
- hover.

Dependencias:

- `SystemCatalog`
- `enumeratedContext.ts`

Caches usadas:

- índices del catálogo; no hay caché final por consumer.

Modelo de invalidación:

- no cambia por documento.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/catalogV2.test.ts`
- `test/server/unit/completion.test.ts`
- `test/server/unit/semanticTokens.test.ts`
- `test/server/unit/diagnostics.test.ts`

Tests faltantes:

- consolidación adicional de helpers duplicados de contexto esperado.

Duplicidades:

- parcial; hay lógica de contexto repartida entre completion, diagnostics y helper común.

Riesgos:

- el contexto esperado de enums sigue siendo un área donde puede reaparecer drift entre consumers.

Acción recomendada:

- `DEVTOOLS-ARCH-01`

Estado:

- implemented

### DataWindow built-ins

Qué es:

- Functions, constants, properties, expression functions y events del dominio DataWindow.

Archivos reales:

- [src/server/knowledge/system/SystemCatalog.ts](../src/server/knowledge/system/SystemCatalog.ts)
- [src/server/knowledge/system/manual](../src/server/knowledge/system/manual)
- [src/server/knowledge/system/generated](../src/server/knowledge/system/generated)

Entry points:

- `listDataWindowFunctions()`
- `listDataWindowConstants()`
- `listEventsForOwner(...)`

Responsabilidades reales:

- mantener el dominio DataWindow separado del lenguaje general;
- servir owner-scoped built-ins en contexts defendibles.

No debe hacer:

- contaminar contexts globales irrelevantes.

Consumidores:

- hover
- completion
- signatureHelp
- diagnostics
- definition.

Dependencias:

- `SystemCatalog`
- `dataWindowBindingModel.ts`

Caches usadas:

- índices del catálogo.

Modelo de invalidación:

- no cambia por documento; sí cambia el contexto semántico del binding.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/systemCatalog.test.ts`
- `test/server/unit/completion.test.ts`
- `test/server/unit/signatureHelp.test.ts`
- `test/server/unit/hover.test.ts`

Tests faltantes:

- fast mode interactivo específico cuando el binding DataWindow ya está resuelto.

Duplicidades:

- parcial; el binding owner-aware que decide si aplica un built-in DataWindow se reparte en varias features.

Riesgos:

- el dominio es correcto, pero el glue code sigue distribuido.

Acción recomendada:

- `DEVTOOLS-DW-01`

Estado:

- implemented

### 13.6 DataWindow

### DataWindow model

Qué es:

- Backbone canónico del sublenguaje DataWindow.

Archivos reales:

- [src/server/features/dataWindowModel.ts](../src/server/features/dataWindowModel.ts)

Entry points:

- `buildDataWindowModel(...)`

Responsabilidades reales:

- modelar retrieve, argumentos, bandas, columnas, reports y SQL lineage seguro.

No debe hacer:

- convertirse en parser SQL general;
- tratar `.srd` como PowerScript normal.

Consumidores:

- completion
- hover
- definition
- diagnostics
- safe mode
- lineage.

Dependencias:

- snapshot DataWindow;
- helpers de SQL seguro.

Caches usadas:

- no tiene caché dedicada;
- se reconstruye desde el snapshot cuando se necesita.

Modelo de invalidación:

- depende del snapshot `.srd` vigente.

Hot path:

- parcial

IO / workspace scan / parse:

- no IO;
- parse en memoria sobre snapshot ya existente.

Cancellation token:

- no usado.

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/dataWindowModel.test.ts`
- `test/server/unit/dataWindowSqlLineage.test.ts`

Tests faltantes:

- persistencia o memoización separada si el coste crece más allá del fast context read-only.

Duplicidades:

- no; es el owner canónico.

Riesgos:

- no existe una caché persistida del `DataWindowModel`; el reuse interactivo llega por snapshot, `DataWindowFastContext` y callers.

Acción recomendada:

- medir antes de abrir caché persistida adicional.

Estado:

- implemented

### DataWindow binding model

Qué es:

- Modelo de binding `DataObject`, owner types y retrieve arguments reutilizable por features.

Archivos reales:

- [src/server/features/dataWindowBindingModel.ts](../src/server/features/dataWindowBindingModel.ts)

Entry points:

- `resolveCatalogOwnerTypes(...)`
- `findNearestDataObjectLiteralBinding(...)`
- `resolveDataWindowRetrieveArguments(...)`

Responsabilidades reales:

- traducir binding literal del DataWindow a contexto semántico reutilizable.

No debe hacer:

- reparseo local del `.srd`.

Consumidores:

- completion
- hover
- definition
- signatureHelp
- diagnostics.

Dependencias:

- `DataWindowModel`
- `InheritanceGraph`

Caches usadas:

- no tiene caché propia.

Modelo de invalidación:

- depende del snapshot y del binding actual.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/dataWindowBindingModel.test.ts`
- `test/server/unit/signatureHelp.test.ts`
- `test/server/unit/dataWindowFastContext.test.ts`

Tests faltantes:

- no aplica para el contrato actual.

Duplicidades:

- baja; hover, completion, definition y signatureHelp entran por adapters comunes cuando necesitan contexto DataWindow.

Riesgos:

- las inferencias dinámicas deben seguir degradando a `low/unknown` fuera del binding literal defendible.

Acción recomendada:

- `DEVTOOLS-ARCH-01`

Estado:

- implemented

### DataWindow fast context

Qué es:

- Vista read-only y high-confidence para serving interactivo DataWindow/DataStore/DataWindowChild.

Archivos reales:

- [src/server/features/dataWindowFastContext.ts](../src/server/features/dataWindowFastContext.ts)
- [src/server/features/dataWindowServingAdapters.ts](../src/server/features/dataWindowServingAdapters.ts)

Entry points:

- `createDataWindowFastContext(...)`
- `provideDataWindowHoverAdapter(...)`
- `provideDataWindowDefinitionAdapter(...)`
- `provideDataWindowCompletionAdapter(...)`
- `buildLinkedDataWindowRetrieveSignatureAdapter(...)`

Responsabilidades reales:

- distinguir receiver kind (`datawindow-control`, `datastore`, `datawindowchild`, `.srd` source o `unknown`);
- exponer binding `DataObject` con confidence/reason codes;
- publicar columnas, property paths seguros, buffers `DWBuffer` desde catálogo y built-ins owner-aware sólo cuando la evidencia lo permite;
- marcar SQL lineage como evidencia ya disponible o `not-computed-hot-path`, sin ejecutar DB ni cálculo profundo.

No debe hacer:

- crear parser DataWindow nuevo;
- tratar `.srd` como PowerScript;
- resolver `Describe/Modify` dinámico complejo;
- convertir `GetChild` runtime en certeza alta.

Consumidores:

- hover
- completion
- definition
- signatureHelp.

Dependencias:

- `DataWindowModel`
- `dataWindowBindingModel.ts`
- `dataWindowColumnAccess.ts`
- `dataWindowPropertyPaths.ts`
- `SystemCatalog`
- `InheritanceGraph`

Caches usadas:

- snapshot activo y `analysisCache`; el cache key incluye URI, documentVersion, `kbVersion`, `semanticEpoch`, `sourceOrigin`, receiver, binding, DataObject y reason codes.

Modelo de invalidación:

- cambia con documento, epoch semántico, origen, receiver, binding/DataObject y target `.srd`.

Hot path:

- sí.

IO / workspace scan / parse:

- no IO;
- no workspace scan;
- no full parse cuando el snapshot está caliente.

Cancellation token:

- no aplica.

Payload risk:

- bajo.

Tests existentes:

- `test/server/unit/dataWindowFastContext.test.ts`
- `test/server/unit/interactiveHotPathGuards.test.ts`
- `test/server/unit/completion.test.ts`
- `test/server/unit/hover.test.ts`
- `test/server/unit/definition.test.ts`
- `test/server/unit/signatureHelp.test.ts`

Tests faltantes:

- smoke corpus-driven sólo si aparece presión medible de coste o payload.

Duplicidades:

- reduce el glue por feature; column access y property paths conservan ownership específico.

Riesgos:

- ampliar la interpretación de strings dinámicos sin reason/confidence rompería el contrato.

Acción recomendada:

- mantener como adapter read-only; no convertirlo en segundo `DataWindowModel`.

Estado:

- implemented

### DataWindow column access

Qué es:

- Resolución literal de acceso a columnas DataWindow desde APIs como `GetItem*`.

Archivos reales:

- [src/server/features/dataWindowColumnAccess.ts](../src/server/features/dataWindowColumnAccess.ts)

Entry points:

- helpers de resolución de acceso literal a columna.

Responsabilidades reales:

- convertir accesos literales a columnas y buffers en targets defendibles.

No debe hacer:

- inferencia agresiva cuando el binding no es literal o único.

Consumidores:

- hover
- definition
- diagnostics.

Dependencias:

- `dataWindowBindingModel.ts`
- `dataWindowModel.ts`

Caches usadas:

- no.

Modelo de invalidación:

- depende del binding activo y snapshot DataWindow.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/definition.test.ts`
- `test/server/unit/hover.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- baja; los providers lo consumen a través de `dataWindowServingAdapters.ts` y el owner de columnas sigue aquí.

Riesgos:

- las columnas sólo deben exponerse con binding `high/medium` y DataObject defendible.

Acción recomendada:

- `DEVTOOLS-DW-01`

Estado:

- implemented

### DataWindow property paths

Qué es:

- Resolución de property paths `Describe/Modify`, `.Object.*` y child routes DataWindow.

Archivos reales:

- [src/server/features/dataWindowPropertyPaths.ts](../src/server/features/dataWindowPropertyPaths.ts)

Entry points:

- `providePowerScriptDataWindowPropertyCompletion(...)`
- helpers de resolución de property paths.

Responsabilidades reales:

- servir completion, hover y definition para property paths avanzados.

No debe hacer:

- reparseo local del DataWindow fuera del modelo canónico.

Consumidores:

- completion
- hover
- definition.

Dependencias:

- `DataWindowModel`
- `dataWindowBindingModel.ts`

Caches usadas:

- no.

Modelo de invalidación:

- depende del snapshot y del binding.

Hot path:

- sí

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- medio

Tests existentes:

- `test/server/unit/completion.test.ts`
- `test/server/unit/hover.test.ts`
- `test/server/unit/definition.test.ts`
- `test/smoke/datawindow-b344.extension.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- baja; `dataWindowFastContext.ts` decide la policy de confidence y este módulo conserva el contrato de property paths.

Riesgos:

- los paths dinámicos de `Describe/Modify` deben degradar a unresolved/unknown en hot path.

Acción recomendada:

- `DEVTOOLS-DW-01`

Estado:

- implemented

### DataWindow safe mode

Qué es:

- Proyección read-only mínima del `DataWindowModel` para contexts seguros y legacy.

Archivos reales:

- [src/server/features/dataWindowSafeMode.ts](../src/server/features/dataWindowSafeMode.ts)

Entry points:

- `buildDataWindowSafeModeSnapshot(...)`

Responsabilidades reales:

- ofrecer una vista reducida de retrieve, columnas y bandas sin abrir otro parser.

No debe hacer:

- duplicar el modelo canónico.

Consumidores:

- documentSymbols
- compatibilidad legacy y surfaces read-only.

Dependencias:

- `DataWindowModel`

Caches usadas:

- no.

Modelo de invalidación:

- depende del snapshot `.srd`.

Hot path:

- parcial

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/dataWindowSafeMode.test.ts`
- `test/server/unit/dataWindowLegacySafeMode.test.ts`

Tests faltantes:

- fast path interactivo si se reutiliza más allá de safe mode.

Duplicidades:

- no; reusa el modelo canónico.

Riesgos:

- si vuelve a parsear `.srd` localmente, rompería la arquitectura.

Acción recomendada:

- `DEVTOOLS-DW-01`

Estado:

- implemented

### DataWindow SQL lineage

Qué es:

- Extractor read-only de lineage SQL seguro desde retrieve DataWindow.

Archivos reales:

- [src/server/features/dataWindowSqlLineage.ts](../src/server/features/dataWindowSqlLineage.ts)

Entry points:

- `buildDataWindowSqlLineage(...)`

Responsabilidades reales:

- extraer tablas fuente, aliases, `JOIN ... ON` simple y `WHERE` básico.

No debe hacer:

- parser SQL completo.

Consumidores:

- impact analysis
- metrics
- reportes.

Dependencias:

- `DataWindowModel`

Caches usadas:

- no.

Modelo de invalidación:

- depende del snapshot DataWindow.

Hot path:

- no

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/dataWindowSqlLineage.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- sólo debe crecer dentro del subset seguro, no hacia un parser SQL general.

Acción recomendada:

- no aplica

Estado:

- implemented

### 13.7 Runtime, build y testing

### Scheduler

Qué es:

- Scheduler cooperativo con lanes y prioridades para interactive, near-context y background.

Archivos reales:

- [src/server/runtime/scheduler.ts](../src/server/runtime/scheduler.ts)

Entry points:

- `runInteractive(...)`
- `runNear(...)`
- `enqueueBackground(...)`

Responsabilidades reales:

- fairness y preemption;
- dar prioridad al foreground.

No debe hacer:

- dejar que background robe latencia al activo.

Consumidores:

- feature handlers
- indexer
- diagnostics
- reportes.

Dependencias:

- `backpressurePolicy.ts`

Caches usadas:

- no aplica.

Modelo de invalidación:

- no aplica.

Hot path:

- sí

IO / workspace scan / parse:

- no aplica.

Cancellation token:

- usado.

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/scheduler.test.ts`
- `test/server/unit/managedRuntimeWorkloads.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- si pierde prioridad del foreground, toda la arquitectura degrada.

Acción recomendada:

- no aplica

Estado:

- implemented

### Backpressure policy

Qué es:

- Policy declarativa de throttling, preemption y workloads del runtime.

Archivos reales:

- [src/server/runtime/backpressurePolicy.ts](../src/server/runtime/backpressurePolicy.ts)

Entry points:

- `getRuntimeWorkloadPolicy(...)`

Responsabilidades reales:

- definir cuándo se difieren `background-indexing`, `maintenance`, `ai-tooling`, `build` o `legacy-orca`.

No debe hacer:

- mezclar build/legacy con serving interactivo.

Consumidores:

- scheduler
- managed workloads
- memory pressure.

Dependencias:

- `runtime/scheduler.ts`

Caches usadas:

- no aplica.

Modelo de invalidación:

- no aplica.

Hot path:

- parcial

IO / workspace scan / parse:

- no aplica.

Cancellation token:

- aplica vía scheduler/workloads.

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/backpressurePolicy.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- una policy demasiado laxa degrada el foreground; demasiado dura bloquea progreso útil.

Acción recomendada:

- no aplica

Estado:

- implemented

### Memory budgets / memory pressure policy

Qué es:

- Presupuesto de memoria por capa y política adaptativa de alivio.

Archivos reales:

- [src/server/runtime/memoryBudgets.ts](../src/server/runtime/memoryBudgets.ts)
- [src/server/runtime/memoryPressurePolicy.ts](../src/server/runtime/memoryPressurePolicy.ts)

Entry points:

- `buildRuntimeMemoryReport(...)`
- `buildRuntimeMemoryPressurePolicy(...)`

Responsabilidades reales:

- estimar consumo por capa;
- decidir purge de serving cache, pausa de escrituras y caps de reportes.

No debe hacer:

- purgar sin observabilidad.

Consumidores:

- `server.ts`
- runtime stats
- reportes.

Dependencias:

- stats de cachés y scheduler.

Caches usadas:

- actúa sobre `ServingCache` y límites de reportes.

Modelo de invalidación:

- no aplica; decide alivio dinámico.

Hot path:

- parcial

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/memoryBudgets.test.ts`
- `test/server/unit/memoryPressurePolicy.test.ts`
- `test/server/unit/runtimeHealth.test.ts`

Tests faltantes:

- purga selectiva por feature o hot-entry si se implementa.

Duplicidades:

- no.

Riesgos:

- hoy la purga de `ServingCache` es global y no selectiva.

Acción recomendada:

- `DEVTOOLS-PERF-05`

Estado:

- implemented

### Runtime journal / runtime health

Qué es:

- Observabilidad estructurada del runtime y health report read-only.

Archivos reales:

- [src/server/runtime/runtimeJournal.ts](../src/server/runtime/runtimeJournal.ts)
- [src/server/runtime/runtimeHealth.ts](../src/server/runtime/runtimeHealth.ts)

Entry points:

- `runtimeJournal.record(...)`
- `runtimeJournal.snapshot(...)`
- `buildRuntimeHealthReport(...)`

Responsabilidades reales:

- registrar eventos relevantes;
- proyectar findings, summary y severidad por capa.

No debe hacer:

- telemetría externa;
- ruido interactivo masivo.

Consumidores:

- stats
- health report
- support bundle.

Dependencias:

- stats de caches, scheduler, persistence y query trace.

Caches usadas:

- buffer circular del journal.

Modelo de invalidación:

- truncado por capacidad.

Hot path:

- parcial

IO / workspace scan / parse:

- no.

Cancellation token:

- no aplica

Payload risk:

- bajo

Tests existentes:

- `test/server/unit/runtimeJournal.test.ts`
- `test/server/unit/runtimeHealth.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- si crece sin caps, puede introducir ruido y memoria extra.

Acción recomendada:

- no aplica

Estado:

- implemented

### Cache persistence/checkpoint/journal

Qué es:

- Persistencia versionada del estado semántico y de serving.

Archivos reales:

- [src/server/cache/cacheStore.ts](../src/server/cache/cacheStore.ts)
- [src/server/cache/cacheCheckpoint.ts](../src/server/cache/cacheCheckpoint.ts)
- [src/server/cache/cacheJournal.ts](../src/server/cache/cacheJournal.ts)
- [src/server/cache/servingCachePersistence.ts](../src/server/cache/servingCachePersistence.ts)
- [src/server/cache/semanticCacheRuntimeController.ts](../src/server/cache/semanticCacheRuntimeController.ts)

Entry points:

- `createSemanticCacheStore(...)`
- `load(...)`
- `flush(...)`
- `compact(...)`
- `persistServingCacheSnapshot(...)`
- `restoreServingCacheSnapshot(...)`

Responsabilidades reales:

- decidir `reuse` o `rebuild`;
- checkpoint + journal;
- persistir snapshot de serving y metadata de discovery.

No debe hacer:

- restaurar estado incompatible o corrupto.

Consumidores:

- lifecycle bootstrap;
- maintenance runtime.

Dependencias:

- filesystem;
- `DocumentCache`
- `KnowledgeBase`
- `ServingCache`.

Caches usadas:

- persiste `DocumentCache`, `KnowledgeBase` y `ServingCache`.

Modelo de invalidación:

- schema incompatible -> rebuild;
- compactación y TTL por workspace.

Hot path:

- no

IO / workspace scan / parse:

- sí, en disco.

Cancellation token:

- no aplica

Payload risk:

- medio

Tests existentes:

- `test/server/unit/cacheStore.test.ts`
- `test/server/unit/cacheStoreCorruptionFuzz.test.ts`
- `test/server/unit/cachePersistence.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- persistencia dañada debe seguir cayendo a rebuild limpio; ya existe suite, pero sigue siendo una frontera crítica.

Acción recomendada:

- no aplica

Estado:

- implemented

### PBAutoBuild runner/parser/problems

Qué es:

- Carril moderno de build, parseo de log y publicación de problemas.

Archivos reales:

- [src/server/build/pbAutoBuildRunner.ts](../src/server/build/pbAutoBuildRunner.ts)
- [src/server/build/pbAutoBuildLogParser.ts](../src/server/build/pbAutoBuildLogParser.ts)
- [src/server/build/pbAutoBuildProblems.ts](../src/server/build/pbAutoBuildProblems.ts)

Entry points:

- `PbAutoBuildRunner.run(...)`
- `parsePbAutoBuildLog(...)`
- `resolvePbAutoBuildProblems(...)`

Responsabilidades reales:

- ejecutar `PBAutoBuild250.exe` de forma segura;
- estructurar salida;
- mapear problemas a archivos únicos del workspace.

No debe hacer:

- colgarse del hot path del lenguaje.

Consumidores:

- `BuildCommandHandlers`
- health report
- status bar.

Dependencias:

- filesystem;
- `WorkspaceState`
- `KnowledgeBase`

Caches usadas:

- no aplica.

Modelo de invalidación:

- snapshots de runner y journals de build.

Hot path:

- no

IO / workspace scan / parse:

- sí; spawn y parse de logs.

Cancellation token:

- usado por runner.

Payload risk:

- medio

Tests existentes:

- `test/server/unit/pbAutoBuildRunner.test.ts`
- `test/server/unit/pbAutoBuildLogParser.test.ts`
- `test/server/unit/pbAutoBuildProblems.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- publish de problemas incorrecto puede ensuciar diagnostics del workspace.

Acción recomendada:

- no aplica

Estado:

- implemented

### ORCA runner/staging import/export

Qué es:

- Carril legacy controlado para export/import/staging ORCA.

Archivos reales:

- [src/server/build/orcaRunner.ts](../src/server/build/orcaRunner.ts)
- [src/server/build/orcaStagingExport.ts](../src/server/build/orcaStagingExport.ts)
- [src/server/build/orcaStagingImport.ts](../src/server/build/orcaStagingImport.ts)

Entry points:

- `OrcaRunner.run(...)`
- `prepareOrcaStagingExport(...)`
- `runOrcaStagingImport(...)`

Responsabilidades reales:

- exportar a staging indexable;
- importar con preflight, backup, ledger y journal;
- mantener ORCA fuera del hot path del lenguaje.

No debe hacer:

- ganar prioridad sobre source real en serving semántico.

Consumidores:

- `BuildCommandHandlers`
- maintenance y support bundle.

Dependencias:

- filesystem;
- `WorkspaceState`
- `BuildOrcaJournalStore`

Caches usadas:

- no aplica.

Modelo de invalidación:

- journals y staging state.

Hot path:

- no

IO / workspace scan / parse:

- sí.

Cancellation token:

- usado por runner.

Payload risk:

- medio

Tests existentes:

- `test/server/unit/orcaRunner.test.ts`
- `test/server/unit/orcaStagingExport.test.ts`
- `test/server/unit/orcaStagingImport.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- cualquier atajo sin preflight, backup o ledger sería una regresión grave.

Acción recomendada:

- no aplica

Estado:

- implemented

### Package/release scripts

Qué es:

- Carril versionado de compile, bundle, test, package y release local.

Archivos reales:

- [package.json](../package.json)
- [tools/esbuild.mjs](../tools/esbuild.mjs)

Entry points:

- scripts `compile`, `bundle`, `test`, `test:unit`, `test:integration`, `test:performance`, `test:architecture:rapid`, `test:docs:drift`, `test:performance:gate`, `package:vsix`, `release:verify`.

Responsabilidades reales:

- compilar cliente/servidor;
- empaquetar VSIX;
- encadenar gates de release.

No debe hacer:

- depender de scripts inexistentes como `lint`.

Consumidores:

- desarrollo local;
- CI release-readiness.

Dependencias:

- `typescript`
- `esbuild`
- `vsce`
- `.vscode-test.js`.

Caches usadas:

- no aplica.

Modelo de invalidación:

- no aplica.

Hot path:

- no

IO / workspace scan / parse:

- sí, pero fuera del runtime LSP.

Cancellation token:

- no aplica

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/productionBundlingContract.test.ts`
- `test/server/unit/releaseReadinessContract.test.ts`

Tests faltantes:

- `lint` no existe; no puede exigirse como gate final hoy.

Duplicidades:

- no.

Riesgos:

- `release:verify` no incluye `test:architecture:rapid`; ese gate sigue siendo una validación aparte, no parte del carril de release.

Acción recomendada:

- no aplica

Estado:

- implemented

### VSIX verification

Qué es:

- Verificación del contenido empaquetado del VSIX generado.

Archivos reales:

- [tools/verify-vsix-contents.mjs](../tools/verify-vsix-contents.mjs)
- [package.json](../package.json)

Entry points:

- script `verify:vsix-contents`.

Responsabilidades reales:

- comprobar allowlist/forbidden paths y superficie empaquetada.

No debe hacer:

- asumir que el VSIX ya es correcto sin inspección.

Consumidores:

- `release:verify`
- CI release-readiness.

Dependencias:

- `vsce`
- output `.dist/vsc-powersyntax.vsix`.

Caches usadas:

- no aplica.

Modelo de invalidación:

- no aplica.

Hot path:

- no

IO / workspace scan / parse:

- sí; inspección del VSIX.

Cancellation token:

- no aplica

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/vsixPackageSurfaceContract.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- si falla este check, el VSIX puede omitir runtime o incluir superficie no permitida.

Acción recomendada:

- no aplica

Estado:

- implemented

### CI workflows

Qué es:

- Workflow versionado de release readiness en GitHub Actions.

Archivos reales:

- [.github/workflows/release-readiness.yml](../.github/workflows/release-readiness.yml)

Entry points:

- trigger `workflow_dispatch`
- trigger `push` a `main`
- trigger `pull_request`

Responsabilidades reales:

- ejecutar `npm run release:verify`;
- subir el VSIX como artifact.

No debe hacer:

- divergir del carril local de release.

Consumidores:

- CI

Dependencias:

- `package.json`
- `release:verify`

Caches usadas:

- no aplica.

Modelo de invalidación:

- no aplica.

Hot path:

- no

IO / workspace scan / parse:

- no aplica al runtime.

Cancellation token:

- no aplica

Payload risk:

- no aplica

Tests existentes:

- `test/server/unit/releaseReadinessContract.test.ts`

Tests faltantes:

- no aplica.

Duplicidades:

- no.

Riesgos:

- cualquier divergencia con `release:verify` crearía drift entre CI y local; hoy el workflow está alineado.

Acción recomendada:

- no aplica

Estado:

- implemented

### Testing infrastructure

Qué es:

- Runner versionado de smoke, unit, integration y performance, más gates Node.js de arquitectura/docs/performance.

Archivos reales:

- [.vscode-test.js](../.vscode-test.js)
- [test](../test)
- [tools/run-architecture-hotspot-guard.mjs](../tools/run-architecture-hotspot-guard.mjs)
- [tools/run-architecture-rapid-gate.mjs](../tools/run-architecture-rapid-gate.mjs)
- [tools/run-performance-budget-gate.mjs](../tools/run-performance-budget-gate.mjs)

Entry points:

- labels `smoke`, `unit`, `integration`, `performance`, `smoke-installed`.

Responsabilidades reales:

- separar suites por coste y alcance;
- ejecutar la extensión real con `vscode-test`;
- mantener gates de arquitectura, docs y performance fuera del LSP runtime.

No debe hacer:

- simular cobertura que depende de corpora ausentes.

Consumidores:

- desarrollo local;
- CI;
- release local.

Dependencias:

- `.vscode-test.js`
- `package.json`
- corpora `fixtures-local` y `test/fixtures`.

Caches usadas:

- no aplica.

Modelo de invalidación:

- no aplica.

Hot path:

- no

IO / workspace scan / parse:

- sí, como parte de suites y corpora.

Cancellation token:

- no aplica

Payload risk:

- no aplica

Tests existentes:

- la propia infraestructura está cubierta por `test/server/unit/releaseReadinessContract.test.ts`, `test/server/unit/productionBundlingContract.test.ts` y los contratos smoke instalados.

Tests faltantes:

- pruebas explícitas de `no IO / no workspace scan / no full parse` aún abiertas para algunos providers interactivos.

Duplicidades:

- no.

Riesgos:

- si se maquillan skips de corpora o se mezclan lanes, la evidencia deja de ser fiable.

Acción recomendada:

- `DEVTOOLS-PERF-07`

Estado:

- implemented

## 14. Estado explícito de caches de serving recomendadas

### HoverViewModel cache

Estado:

- implemented

Qué debería cachear:

- el Markdown final compacto de hover por símbolo, posición, locale y KB, ya listo para servir sin recomponer bloques visibles.

Qué existe hoy:

- `src/server/serving/presentationCache.ts` materializa una caché LRU específica de presentación;
- `featureHandlers.ts` sirve `viewmodel-hit` desde una caché explícita de `HoverViewModel` y puede rematerializar la response final LSP sin reejecutar resolución semántica;
- `ServingCache` sigue guardando la respuesta final de hover como carril LSP caliente separado del modelo visible.

Evidencia en código:

- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/features/hover.ts](../src/server/features/hover.ts)
- [src/server/features/hoverFormat.ts](../src/server/features/hoverFormat.ts)

Impacto:

- cada cache miss ya separa resolución semántica, `HoverViewModel` y response final LSP;
- los hits de presentación pueden rehidratar hover sin reejecutar provider ni volver a resolver el símbolo.

Acción recomendada:

- mantener la invalidación estricta y reutilizar el mismo contrato en otras caches de presentación cuando se promuevan.

### CompletionListViewModel cache

Estado:

- implemented

Qué cachea:

- la lista final de completion ya ranqueada, truncada y preparada para el cliente, separada del dato semántico bruto.

Qué existe hoy:

- `ServingCache` guarda la lista final por posición, trigger, locale, `documentVersion`, `kbVersion`, `semanticEpoch` y `sourceOrigin`;
- `ServingCache` tiene partición explícita para `completion`, lo que evita que listas grandes expulsen indiscriminadamente hover;
- no existe una caché standalone de `CompletionListViewModel`, por decisión de alcance.

Evidencia en código:

- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/features/completion.ts](../src/server/features/completion.ts)
- [src/server/knowledge/ServingCache.ts](../src/server/knowledge/ServingCache.ts)

Impacto:

- completion ya tiene partición propia dentro de `ServingCache` y contrato separado para `completion-resolve`;
- la lista inicial evita documentación larga y el resolve enriquece por item.

Acción recomendada:

- mantener tests de partición y evaluar `CompletionListViewModel` standalone solo si aparece presión de memoria o duplicación de payload medible.

### ActiveDocumentServingSnapshot

Estado:

- implemented

Qué debería cachear:

- una foto unificada del documento activo con entidades, miembros heredados, bindings y datos de serving repetidos por varias features.

Qué existe hoy:

- `src/server/serving/activeDocumentServingSnapshot.ts` compone `DocumentCache`, `HotContextCache`, `KnowledgeBase`, `InheritanceGraph`, `SystemCatalog`, `WorkspaceState` y el binding DataWindow en una fachada read-only del activo;
- expone token, scope, query context, símbolo, receiver, binding, hot members, texto de línea y máscara del carácter para `hover`, `completion` y `signatureHelp`;
- la invalidación sigue viviendo en las fuentes canónicas (`DocumentCache`, `WorkspaceState`, watcher intake y `semanticEpoch`), no en un store nuevo.

Evidencia en código:

- [src/server/knowledge/HotContextCache.ts](../src/server/knowledge/HotContextCache.ts)
- [src/server/analysis/analysisCache.ts](../src/server/analysis/analysisCache.ts)
- [src/server/knowledge/DocumentCache.ts](../src/server/knowledge/DocumentCache.ts)

Impacto:

- el reuse del documento activo ya está centralizado en una sola fachada read-only;
- `hover`, `completion` y `signatureHelp` dejan de recomponer localmente tokenización/masked text/query context básicos del activo.

Acción recomendada:

- mantener como fachada read-only y extenderla solo con vistas derivadas baratas.

### Negative hover cache

Estado:

- implemented

Qué debería cachear:

- misses defendibles de hover para evitar recomputar búsquedas que ya se sabe que no producen contenido.

Qué existe hoy:

- `featureHandlers.ts` mantiene una caché explícita de negativos de hover sobre `PresentationCache`, versionada por URI, documento, `semanticEpoch`, `sourceOrigin`, locale y token/rango;
- la pipeline registra `negative-hit` como reason independiente y evita escribir `null` al `ServingCache` final para no mezclar misses seguros con `cache-hit`.

Evidencia en código:

- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)
- [src/server/features/hover.ts](../src/server/features/hover.ts)

Impacto:

- evita recomputar misses repetidos en whitespace, comentarios, strings, keywords, separadores y unresolved versionado;
- mantiene rematerialización correcta tras cambios de documento, watcher intake, shutdown o presión de memoria.

Acción recomendada:

- mantener invalidación estricta y no cachear negativos ligados a readiness temporal.

### Completion resolve cache

Estado:

- implemented

Qué cachea:

- la segunda fase `completionItem/resolve` para enriquecer solo el item seleccionado sin inflar la lista inicial.

Qué existe hoy:

- `completionProvider.resolveProvider = true`;
- `connection.onCompletionResolve(...)` usa `InteractiveServingPipeline`, stale guard y payload budget `completion-resolve`;
- la respuesta inicial mantiene `CompletionItem.data` y difiere documentación/detalle enriquecido al resolve.

Evidencia en código:

- [src/server/handlers/lifecycleHandlers.ts](../src/server/handlers/lifecycleHandlers.ts)
- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)

Impacto:

- payload inicial más alto;
- no existe fase de enrich incremental ni caché asociada.

Acción recomendada:

- `DEVTOOLS-PERF-04`

### ServingCache final response cache

Estado:

- implemented

Qué debería cachear:

- la respuesta final de hover, completion, signatureHelp y definition por posición y KB.

Qué existe hoy:

- `ServingCache` LRU con TTL opcional, contadores y invalidación por URI/global.

Evidencia en código:

- [src/server/knowledge/ServingCache.ts](../src/server/knowledge/ServingCache.ts)
- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)

Impacto:

- reduce trabajo repetido del hot path;
- hoy es la única caché final de serving realmente materializada.

Acción recomendada:

- mantener;
- endurecer con partición o purga selectiva si el backlog lo promueve.

### HotContextCache active document cache

Estado:

- implemented

Qué debería cachear:

- datos derivados del documento activo que varias features repiten.

Qué existe hoy:

- `activeEntities` y miembros heredados LRU por tipo con invalidación por URI/KB.

Evidencia en código:

- [src/server/knowledge/HotContextCache.ts](../src/server/knowledge/HotContextCache.ts)
- [src/server/features/completion.ts](../src/server/features/completion.ts)

Impacto:

- reduce recorridos repetidos de jerarquía en el activo;
- no sustituye un snapshot transversal completo.

Acción recomendada:

- mantener;
- evolucionar hacia `DEVTOOLS-PERF-06` si se promueve.

### Catalog lookup cache

Estado:

- implemented

Qué debería cachear:

- índices de lookup por nombre, owner type, dominio y enums para built-ins.

Qué existe hoy:

- `SystemCatalog` y `queryService.ts` sirven búsquedas owner-aware sobre índices preconstruidos.
- `system/policy.ts` fija el contrato explícito de capas (`generated base -> manual curated enrichment -> localization overlay -> presentation formatter`), campos visibles enriquecibles, anchors bloqueados y exposición por surface sin abrir otro store semántico.

Evidencia en código:

- [src/server/knowledge/system/SystemCatalog.ts](../src/server/knowledge/system/SystemCatalog.ts)
- [src/server/knowledge/system/services/queryService.ts](../src/server/knowledge/system/services/queryService.ts)
- [src/server/knowledge/system/policy.ts](../src/server/knowledge/system/policy.ts)

Impacto:

- evita scans completos del catálogo en hot path.

Acción recomendada:

- mantener.

### DataWindow model cache

Estado:

- partial

Qué debería cachear:

- el modelo DataWindow ya construido y listo para reuse transversal entre hover/completion/definition/diagnostics.

Qué existe hoy:

- el modelo se construye desde snapshots ya existentes y se reutiliza por diseño canónico;
- `DataWindowFastContext` ofrece una vista read-only del documento activo para hover/completion/definition/signatureHelp;
- no hay una caché separada o persistida del `DataWindowModel`.

Evidencia en código:

- [src/server/features/dataWindowModel.ts](../src/server/features/dataWindowModel.ts)
- [src/server/features/dataWindowBindingModel.ts](../src/server/features/dataWindowBindingModel.ts)
- [src/server/features/dataWindowFastContext.ts](../src/server/features/dataWindowFastContext.ts)
- [src/server/features/dataWindowServingAdapters.ts](../src/server/features/dataWindowServingAdapters.ts)

Impacto:

- el diseño evita reparsers por feature y centraliza confidence/owner; sigue sin prometer persistencia de modelos DataWindow entre sesiones.

Acción recomendada:

- medir coste real antes de promover una caché persistida.

### Diagnostics cache

Estado:

- partial

Qué debería cachear:

- diagnósticos finales o al menos un resultado incremental por snapshot/version que evite recalcular el mismo merge.

Qué existe hoy:

- `analysisCache`/`DocumentCache`/`KnowledgeBase` reducen recomputación;
- `diagnosticScheduler.ts` hace debounce por URI;
- `diagnostics.ts` mantiene `diagnosticsSummary`, pero no hay caché final del resultado de provider por snapshot.

Evidencia en código:

- [src/server/analysis/diagnosticScheduler.ts](../src/server/analysis/diagnosticScheduler.ts)
- [src/server/features/diagnostics.ts](../src/server/features/diagnostics.ts)

Impacto:

- el ahorro existe, pero no como caché final independiente.

Acción recomendada:

- `DEVTOOLS-PERF-07`

### Semantic tokens cache

Estado:

- deferred by explicit no-cache/full decision

Qué debería cachear:

- nada en el contrato actual; sólo se cacheará el payload final o una vista incremental si la medición corpus-driven demuestra presión real.

Qué existe hoy:

- `semanticTokens.ts` recalcula el payload por request;
- reusa el análisis documental ya cacheado;
- `interactiveHotPathGuards.test.ts` confirma que el request con snapshot caliente no hace IO, workspace scan ni full parse;
- `queryScopePolicy.test.ts` fija payload budget declarativo para `semanticTokens`.

Evidencia en código:

- [src/server/features/semanticTokens.ts](../src/server/features/semanticTokens.ts)
- [src/server/analysis/analysisCache.ts](../src/server/analysis/analysisCache.ts)

Impacto:

- coste repetido aceptado mientras el snapshot caliente y el payload budget se mantengan dentro de presupuesto; delta/cache quedan fuera del contrato actual.

Acción recomendada:

- medir antes de introducir delta o cache final.

## 15. Hot path audit — cache hit vs cache miss

### Hover

Cache hit path:

```text
request
	-> featureHandlers.onHover
	-> hotContextCache.setActive(uri, kbVersion)
	-> makeServingKey(feature=hover, uri, position, kbVersion, locale)
	-> servingCache.get(key)
	-> cached response
```

Cache miss path:

```text
request
	-> featureHandlers.onHover
	-> decideFeatureReadiness(hover)
	-> hotContextCache.setActive(...)
	-> servingCache miss
	-> provideHover
	-> queryContext / semanticQueryService / InheritanceGraph / SystemCatalog
	-> hoverFormat + documentationService
	-> cacheServingResultWithMemoryPressure
	-> response
```

IO en hot path:

- no; el provider consume snapshots ya cacheados.

Workspace scan en hot path:

- no; la policy de hover limita a `active-object` y `resultCap = 8`.

Full parse en hot path:

- no si `analysisCache` tiene hit;
- si el snapshot no existe, el parse es del documento activo, no del workspace.

Formatter cost risk:

- medio; el coste visible está en `hoverFormat.ts` y la documentación localizada, no en IO.

Payload risk:

- medio; hoy el hover ya es compacto, pero la response final sigue saliendo completa en el primer miss.

Cancellation/stale request handling:

- sin token LSP;
- protegido por scheduler interactivo, budgets y invalidación por URI/KB.

Tests existentes:

- `hover.test.ts`
- `hoverFormat.test.ts`
- `hotPathAllocationBudget.test.ts`

Tests faltantes:

- seguir revalidando invalidación/rematerialización cuando el mismo patrón de fast path se extienda a otras features interactivas.

Riesgo principal:

- servir un `HoverViewModel` o negativo stale si se afloja la key común o la invalidación cruzada por documento/epoch/locale/`sourceOrigin`.

Acción recomendada:

- `DEVTOOLS-PERF-02`
- `DEVTOOLS-PERF-03`
- `DEVTOOLS-UX-01`

### Completion

Cache hit path:

```text
request
	-> featureHandlers.onCompletion
	-> hotContextCache.setActive(uri, kbVersion)
	-> ActiveDocumentServingSnapshot.buildCacheKey(feature=completion, uri, position, trigger, locale)
	-> servingCache.get(key)
	-> cached response
```

Cache miss path:

```text
request
	-> featureHandlers.onCompletion
	-> decideFeatureReadiness(completion)
	-> hotContextCache.setActive(...)
	-> servingCache miss
	-> provideCompletion
	-> queryContext / qualifier resolution / HotContextCache / InheritanceGraph / SystemCatalog / enumeratedContext
	-> ranking, summary ligero y CompletionItem.data para resolve
	-> cacheServingResultWithMemoryPressure
	-> response
```

IO en hot path:

- no.

Workspace scan en hot path:

- no; `maxScope = project`, `allowGenerated = false`, `allowStaging = false`.

Full parse en hot path:

- no si el snapshot del documento está caliente;
- en miss de análisis, parsea el documento activo, no el workspace.

Formatter cost risk:

- medio; la lista inicial conserva summary/data, mientras la documentación enriquecida se materializa por item en `completionItem/resolve`.

Payload risk:

- medio; `resultCap = 200` sigue vigente, pero la documentación larga se difiere a `completionItem/resolve` con budget `4 KiB` por item.

Cancellation/stale request handling:

- sin token LSP;
- protegido por scheduler, readiness y invalidación de caché por KB/URI.

Tests existentes:

- `completion.test.ts`
- `queryScopePolicy.test.ts`
- `hotPathAllocationBudget.test.ts`
- `interactiveHotPathGuards.test.ts`
- `interactiveServingPipeline.test.ts`

Tests faltantes:

- integración LSP end-to-end de `completionItem/resolve`.

Riesgo principal:

- `CompletionListViewModel` standalone no existe; se mantiene futuro condicionado a presión medible porque `ServingCache` ya particiona por feature.

Acción recomendada:

- no aplica para el contrato actual; medir antes de introducir cache standalone de lista.

### Signature Help

Cache hit path:

```text
request
	-> featureHandlers.onSignatureHelp
	-> hotContextCache.setActive(uri, kbVersion)
	-> ActiveDocumentServingSnapshot.buildCacheKey(feature=signatureHelp, uri, position, locale)
	-> servingCache.get(key)
	-> cached response
```

Cache miss path:

```text
request
	-> featureHandlers.onSignatureHelp
	-> resolveServingReadiness(signature-help)
	-> hotContextCache.setActive(...)
	-> servingCache miss
	-> provideSignatureHelp
	-> extractSignatureContext
	-> semanticQueryService / SystemCatalog / dataWindowBindingModel
	-> SignatureHelpViewModel
	-> SignatureInformation + ParameterInformation
	-> cacheServingResultWithMemoryPressure
	-> response
```

IO en hot path:

- no.

Workspace scan en hot path:

- no; la policy de `signature-help` limita a `project` con `budgetMs = 50`.

Full parse en hot path:

- no si el snapshot ya existe;
- el fallback sigue siendo parse del documento activo, no global.

Formatter cost risk:

- medio-bajo; el `SignatureHelpViewModel` concentra la presentación y evita recomponer el DTO fuera del adapter.

Payload risk:

- medio

Cancellation/stale request handling:

- sin token LSP;
- gating por `runInteractiveServingPipeline(...)`, stale guard y payload budget.

Tests existentes:

- `signatureHelp.test.ts`
- `featureReadiness.test.ts`
- `queryScopePolicy.test.ts`
- `interactiveHotPathGuards.test.ts`

Tests faltantes:

- integración LSP end-to-end de cache hit por locale y retrigger.

Riesgo principal:

- aún no existe fast mode específico para DataWindow binding en hot path.

Acción recomendada:

- `DEVTOOLS-DW-01`

### Definition

Cache hit path:

```text
request
	-> featureHandlers.onDefinition
	-> hotContextCache.setActive(uri, kbVersion)
	-> ActiveDocumentServingSnapshot.buildCacheKey(feature=definition, uri, position)
	-> servingCache.get(key)
	-> resolveServingReadiness(definition, cached.resolutionConfidence)
	-> cached response
```

Cache miss path:

```text
request
	-> featureHandlers.onDefinition
	-> createDocumentQueryContext
	-> decideFeatureReadiness(definition)
	-> servingCache miss
	-> provideDefinition
	-> semanticQueryService / InheritanceGraph / SystemCatalog / DataWindow owner chains
	-> InteractiveServingStaleGuard.check(before write)
	-> cacheServingResultWithMemoryPressure({ result, resolutionConfidence })
	-> response
```

IO en hot path:

- no.

Workspace scan en hot path:

- no; `maxScope = project`.

Full parse en hot path:

- no si el snapshot está caliente.

Formatter cost risk:

- bajo.

Payload risk:

- bajo.

Cancellation/stale request handling:

- wrapper equivalente a la pipeline: el cached entry se revalida contra readiness y el miss se descarta si el snapshot queda stale antes del write/return.

Tests existentes:

- `definition.test.ts`
- `queryScopePolicy.test.ts`
- `interactiveHotPathGuards.test.ts`
- `interactiveServingPipeline.test.ts`

Tests faltantes:

- integración LSP que fuerce stale durante un cambio real de documento.

Riesgo principal:

- mezcla en un mismo miss path built-ins, owner chains DataWindow y targets del workspace.

Acción recomendada:

- `DEVTOOLS-ARCH-01`

### References

Cache hit path:

```text
request
	-> featureHandlers.onReferences
	-> createDocumentQueryContext
	-> resolveServingReadiness(references)
	-> collectReferenceSourcesForQuery(project-scoped)
	-> provideReferences
	-> response
```

Cache miss path:

```text
request
	-> featureHandlers.onReferences
	-> queryContext / confidence gate
	-> referenceSourcePool
	-> provideReferences
	-> resolved family keys + maskedText matching
	-> response
```

IO en hot path:

- parcial; el source pool puede leer archivos del proyecto.

Workspace scan en hot path:

- no; la policy y el pool son project-scoped.

Full parse en hot path:

- no; reusa `maskedText` y snapshots.

Formatter cost risk:

- bajo.

Payload risk:

- alto.

Cancellation/stale request handling:

- sin token LSP;
- `resolveServingReadiness(...)` bloquea por confidence o latencia.

Tests existentes:

- `references.test.ts`
- `referenceSourcePool.test.ts`

Tests faltantes:

- prueba dedicada de no widening a `workspace`;
- límites visibles de payload grande.

Riesgo principal:

- no hay caché final y el coste crece con el project pool.

Acción recomendada:

- `DEVTOOLS-PERF-07`
- `DEVTOOLS-ARCH-01`

### Diagnostics incrementales

Cache hit path:

```text
change/open
	-> documentHandlers
	-> diagnosticScheduler
	-> getDocumentAnalysis() version/fingerprint hit
	-> publishDiagnostics
	-> diagnosticsSummary update
	-> sendDiagnostics
```

Cache miss path:

```text
change/open
	-> documentHandlers
	-> diagnosticScheduler
	-> getDocumentAnalysis() miss
	-> analyzeDocument
	-> DocumentCache / KnowledgeBase sync
	-> publishDiagnostics
	-> diagnosticsSummary update
	-> sendDiagnostics
```

IO en hot path:

- no.

Workspace scan en hot path:

- no.

Full parse en hot path:

- sólo en miss de análisis del documento activo.

Formatter cost risk:

- bajo.

Payload risk:

- medio.

Cancellation/stale request handling:

- debounce por URI;
- `cancelScheduledDiagnostics(uri)`.

Tests existentes:

- `diagnostics.test.ts`
- `diagnosticsExtra.test.ts`
- `diagnosticScheduler.test.ts`

Tests faltantes:

- guard explícito de no IO/no workspace scan/no full parse incremental.

Riesgo principal:

- no existe caché final de diagnostics por snapshot; el reuse depende de análisis y scheduler.

Acción recomendada:

- `DEVTOOLS-PERF-07`

### Semantic Tokens

Cache hit path:

```text
request
	-> featureHandlers.onSemanticTokens
	-> scheduler.runInteractive
	-> getDocumentAnalysis() hit
	-> provideSemanticTokens
	-> response
```

Cache miss path:

```text
request
	-> featureHandlers.onSemanticTokens
	-> scheduler.runInteractive
	-> getDocumentAnalysis() miss
	-> analyzeDocument
	-> provideSemanticTokens
	-> response
```

IO en hot path:

- no.

Workspace scan en hot path:

- no.

Full parse en hot path:

- sólo en miss del documento activo.

Formatter cost risk:

- bajo.

Payload risk:

- medio.

Cancellation/stale request handling:

- sin token LSP;
- scheduler interactivo.

Tests existentes:

- `semanticTokens.test.ts`
- `hotPathAllocationBudget.test.ts`

Tests faltantes:

- caché explícita o prueba explícita de que no hace falta;
- no IO/no workspace scan/no full parse dedicado.

Riesgo principal:

- el payload se recalcula en cada request porque no hay `SemanticTokens cache`.

Acción recomendada:

- `DEVTOOLS-PERF-07`

### Document Symbols

Cache hit path:

```text
request
	-> featureHandlers.onDocumentSymbol
	-> scheduler.runInteractive
	-> extractDocumentSymbolsWithReconciliation
	-> getDocumentAnalysis() hit
	-> response
```

Cache miss path:

```text
request
	-> featureHandlers.onDocumentSymbol
	-> scheduler.runInteractive
	-> extractDocumentSymbolsWithReconciliation
	-> getDocumentAnalysis() miss
	-> analyzeDocument
	-> buildInternalDocumentSymbols
	-> reconciliation report
	-> response
```

IO en hot path:

- no.

Workspace scan en hot path:

- no.

Full parse en hot path:

- sólo en miss del documento activo.

Formatter cost risk:

- bajo.

Payload risk:

- bajo.

Cancellation/stale request handling:

- sin token LSP;
- scheduler interactivo.

Tests existentes:

- `documentSymbols.test.ts`
- `documentSymbolsReconciliation.test.ts`

Tests faltantes:

- no IO/no workspace scan/no full parse dedicado.

Riesgo principal:

- la ruta es ligera, pero no existe caché final de outline.

Acción recomendada:

- `DEVTOOLS-PERF-07`

## 16. Auditoría de responsabilidades duplicadas

### SemanticQueryFacade

Qué es:

- Fachada read-only para coordinar contexto posicional, target resolution, receiver type, callables, inheritance, enum context y catálogo owner-aware sin crear otro store semántico.

Archivos reales:

- [src/server/features/semanticQueryFacade.ts](../src/server/features/semanticQueryFacade.ts)
- [src/server/knowledge/resolution/resolvedSemanticModels.ts](../src/server/knowledge/resolution/resolvedSemanticModels.ts)

Owners coordinados:

- `queryContext.ts` para contexto posicional y consumer policy;
- `semanticQueryService.ts` para target/symbol/callable resolution;
- `InheritanceGraph.ts` para ancestros, descendientes y member closure;
- `enumeratedContext.ts` + `SystemCatalog` para enum context;
- `dataWindowBindingModel.ts` para owner expansion DataWindow defendible.

No debe hacer:

- almacenar verdad semántica nueva;
- duplicar `KnowledgeBase`, parser, catálogo, indexer o graph;
- convertir la fachada en monolito de presentación o Markdown.

Consumers actuales:

- [src/server/features/hover.ts](../src/server/features/hover.ts)
- [src/server/features/definition.ts](../src/server/features/definition.ts)

Tests existentes:

- [test/server/unit/semanticQueryFacade.test.ts](../test/server/unit/semanticQueryFacade.test.ts)
- [test/server/unit/queryContext.test.ts](../test/server/unit/queryContext.test.ts)
- [test/server/unit/semanticQueryService.test.ts](../test/server/unit/semanticQueryService.test.ts)
- [test/server/unit/hover.test.ts](../test/server/unit/hover.test.ts)
- [test/server/unit/definition.test.ts](../test/server/unit/definition.test.ts)

Estado:

- implemented as first read-only facade slice; ampliar consumers debe hacerse por provider y con pruebas visibles.

### Resolution result model

Qué es:

- Modelos semánticos neutrales, sin Markdown ni DTO LSP, para compartir target, receiver, callable y enum context con `confidence`, `reasonCodes`, `sourceOrigin` y `ambiguityKind` cuando aplica.

Archivo real:

- [src/server/knowledge/resolution/resolvedSemanticModels.ts](../src/server/knowledge/resolution/resolvedSemanticModels.ts)

Modelos publicados:

- `CanonicalSymbolModel`
- `ResolvedSymbolModel`
- `ResolvedSymbolSet`
- `ResolvedReceiverModel`
- `ResolvedCallableModel`
- `ResolvedEnumContextModel`

No debe hacer:

- serializar Markdown;
- importar transporte LSP;
- abrir contratos cliente/shared mientras el cliente no los consuma.

Tests existentes:

- [test/server/unit/semanticQueryFacade.test.ts](../test/server/unit/semanticQueryFacade.test.ts)

Estado:

- implemented as server-side common result model, con `identityKey` exacta (`buildSymbolKey`), `normalizedName` y shape mínima (`declarationScope`, `implementationKind`, `signature`, `returnType`, `parameterCount`) para facade y presentation.

### Symbol resolution

Qué es:

- Resolución del target simbólico final para hover/definition/signatureHelp/references/rename.

Implementaciones encontradas:

- [src/server/features/semanticQueryFacade.ts](../src/server/features/semanticQueryFacade.ts)
- [src/server/knowledge/resolution/semanticQueryService.ts](../src/server/knowledge/resolution/semanticQueryService.ts)
- [src/server/features/queryContext.ts](../src/server/features/queryContext.ts)
- [src/server/features/definition.ts](../src/server/features/definition.ts)

Owner esperado:

- `semanticQueryService.ts`; `SemanticQueryFacade.resolveTargetSymbol(...)` es el adapter read-only para providers.

Duplicidad real:

- parcial controlada; `hover` y `definition` ya consumen la fachada, mientras otros providers migrarán por slices.

Riesgo:

- medio

Acción recomendada:

- migrar consumers restantes sólo cuando el cambio tenga prueba focal visible.

Backlog:

- Bloque 5 / `SEMANTIC-OWNER-02` cerrado como primer contrato; ampliar consumers queda sujeto a slices futuros.

### Scope/context resolution

Qué es:

- Determinar callable, tipo, línea activa y consumer policy antes de resolver.

Implementaciones encontradas:

- [src/server/features/semanticQueryFacade.ts](../src/server/features/semanticQueryFacade.ts)
- [src/server/features/queryContext.ts](../src/server/features/queryContext.ts)
- [src/server/knowledge/positionContext.ts](../src/server/knowledge/positionContext.ts)
- [src/server/analysis/documentAnalysis.ts](../src/server/analysis/documentAnalysis.ts)

Owner esperado:

- `queryContext.ts` apoyado en `positionContext.ts`; `SemanticQueryFacade.createPositionContext(...)` es el adapter público read-only.

Duplicidad real:

- parcial

Riesgo:

- medio

Acción recomendada:

- seguir reduciendo contexto recomputado en providers mediante migraciones focales a `SemanticQueryFacade`.

Backlog:

- Bloque 5 / `SEMANTIC-OWNER-01` cerrado como owner documental y adapter read-only.

### Receiver type resolution

Qué es:

- Resolver el tipo del qualifier o receiver (`this`, `super`, variable, DataWindow owner).

Implementaciones encontradas:

- [src/server/features/semanticQueryFacade.ts](../src/server/features/semanticQueryFacade.ts)
- [src/server/features/queryContext.ts](../src/server/features/queryContext.ts)
- [src/server/features/completion.ts](../src/server/features/completion.ts)
- [src/server/features/signatureHelp.ts](../src/server/features/signatureHelp.ts)
- [src/server/features/dataWindowBindingModel.ts](../src/server/features/dataWindowBindingModel.ts)

Owner esperado:

- `queryContext.ts`/`resolveDocumentQualifierType` para receiver estático general, `dataWindowBindingModel.ts` para DataWindow, expuestos por `SemanticQueryFacade.resolveReceiverType(...)`.

Duplicidad real:

- parcial; el owner general ya tiene fachada, los casos DataWindow avanzados quedan para Bloque 6.

Riesgo:

- alto

Acción recomendada:

- migrar receiver resolution general por provider; no mover DataWindowFastContext dentro de este bloque.

Backlog:

- Bloque 5 / `SEMANTIC-OWNER-03` cerrado para receiver estático general; DataWindow fast mode queda en Bloque 6.

### Callable/function/event resolution

Qué es:

- Resolver callables del workspace o built-ins con aridad y contexto.

Implementaciones encontradas:

- [src/server/features/semanticQueryFacade.ts](../src/server/features/semanticQueryFacade.ts)
- [src/server/knowledge/resolution/semanticQueryService.ts](../src/server/knowledge/resolution/semanticQueryService.ts)
- [src/server/features/signatureHelp.ts](../src/server/features/signatureHelp.ts)
- [src/server/features/diagnostics.ts](../src/server/features/diagnostics.ts)

Owner esperado:

- `semanticQueryService.ts`; `SemanticQueryFacade.resolveCallable(...)` expone modelos neutrales para consumers.

Duplicidad real:

- parcial

Riesgo:

- medio

Acción recomendada:

- migrar signatureHelp/diagnostics por slices posteriores si reduce duplicidad sin cambiar comportamiento visible.

Backlog:

- Bloque 5 / `SEMANTIC-OWNER-04` cerrado como contrato común; slimming profundo queda por provider.

### Overload/override resolution

Qué es:

- Distinguir familias por firma y priorizar overrides/overloads correctos.

Implementaciones encontradas:

- [src/server/features/semanticQueryFacade.ts](../src/server/features/semanticQueryFacade.ts)
- [src/server/knowledge/resolution/semanticQueryService.ts](../src/server/knowledge/resolution/semanticQueryService.ts)
- [src/server/knowledge/resolution/InheritanceGraph.ts](../src/server/knowledge/resolution/InheritanceGraph.ts)
- [src/server/features/signatureHelp.ts](../src/server/features/signatureHelp.ts)
- [src/server/features/codeLensReferences.ts](../src/server/features/codeLensReferences.ts)

Owner esperado:

- `semanticQueryService.ts` e `InheritanceGraph.ts`.

Duplicidad real:

- parcial

Riesgo:

- medio

Acción recomendada:

- consumir `SemanticQueryFacade.resolveInheritance(...)` cuando un provider sólo necesite ancestros, descendientes o member closure.

Backlog:

- Bloque 5 / `SEMANTIC-OWNER-05` cerrado como owner explícito; recorridos especiales deben justificarse localmente.

### Inheritance resolution

Qué es:

- Resolver ancestros, descendientes y miembros heredados.

Implementaciones encontradas:

- [src/server/knowledge/resolution/InheritanceGraph.ts](../src/server/knowledge/resolution/InheritanceGraph.ts)
- [src/server/features/hierarchyInspection.ts](../src/server/features/hierarchyInspection.ts)
- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts)

Owner esperado:

- `InheritanceGraph.ts`.

Duplicidad real:

- parcial

Riesgo:

- medio

Acción recomendada:

- reducir recorridos de jerarquía ad hoc para CodeLens e inspección.

Backlog:

- actualizar `DEVTOOLS-ARCH-01`

### DataWindow binding resolution

Qué es:

- Traducir `DataObject`, owner types, child chains y contexts `.Object.*` a un binding reutilizable.

Implementaciones encontradas:

- [src/server/features/dataWindowBindingModel.ts](../src/server/features/dataWindowBindingModel.ts)
- [src/server/features/dataWindowPropertyPaths.ts](../src/server/features/dataWindowPropertyPaths.ts)
- [src/server/features/dataWindowColumnAccess.ts](../src/server/features/dataWindowColumnAccess.ts)
- [src/server/features/signatureHelp.ts](../src/server/features/signatureHelp.ts)

Owner esperado:

- `dataWindowBindingModel.ts`.

Duplicidad real:

- sí

Riesgo:

- alto

Acción recomendada:

- extraer fast mode y binding lookup unificados para consumers interactivos.

Backlog:

- actualizar `DEVTOOLS-DW-01`
- actualizar `DEVTOOLS-ARCH-01`

### Catalog/built-in lookup

Qué es:

- Lookup de built-ins owner-aware, globals y eventos del sistema.

Implementaciones encontradas:

- [src/server/knowledge/system/SystemCatalog.ts](../src/server/knowledge/system/SystemCatalog.ts)
- [src/server/knowledge/system/services/queryService.ts](../src/server/knowledge/system/services/queryService.ts)

Owner esperado:

- `SystemCatalog.ts`.

Duplicidad real:

- no

Riesgo:

- bajo

Acción recomendada:

- mantener el owner único.

Backlog:

- no aplica

### Enum value/type lookup

Qué es:

- Resolver enums y valores con contexto esperado.

Implementaciones encontradas:

- [src/server/features/semanticQueryFacade.ts](../src/server/features/semanticQueryFacade.ts)
- [src/server/features/enumeratedContext.ts](../src/server/features/enumeratedContext.ts)
- [src/server/features/completion.ts](../src/server/features/completion.ts)
- [src/server/features/diagnostics.ts](../src/server/features/diagnostics.ts)

Owner esperado:

- `enumeratedContext.ts` más `SystemCatalog`, expuestos para consumers por `SemanticQueryFacade.resolveExpectedEnumContext(...)`.

Duplicidad real:

- parcial

Riesgo:

- medio

Acción recomendada:

- mantener datasets y IDs intactos; migrar consumers restantes sólo si reduce duplicidad visible.

Backlog:

- Bloque 5 / `SEMANTIC-OWNER-06` cerrado como owner explícito.

### Hover formatting

Qué es:

- Convertir resolución semántica a Markdown visible y compacto.

Implementaciones encontradas:

- [src/server/features/hoverFormat.ts](../src/server/features/hoverFormat.ts)
- [src/server/features/hover.ts](../src/server/features/hover.ts)
- [src/server/knowledge/system/localization/documentationService.ts](../src/server/knowledge/system/localization/documentationService.ts)

Owner esperado:

- `hoverFormat.ts` con `documentationService.ts` como proveedor de texto.

Duplicidad real:

- sí

Riesgo:

- medio

Acción recomendada:

- introducir un `HoverViewModel` explícito y reducir lógica visible en el provider.

Backlog:

- actualizar `DEVTOOLS-PERF-02`
- actualizar `DEVTOOLS-UX-01`

### Completion formatting/ranking

Qué es:

- Construcción de `CompletionItem.detail`, `CompletionItem.data`, sort keys y ranking visible; la documentación larga se materializa en `completionItem/resolve`.

Implementaciones encontradas:

- [src/server/features/completion.ts](../src/server/features/completion.ts)
- [src/server/features/completionScoring.ts](../src/server/features/completionScoring.ts)

Owner esperado:

- `completion.ts` con scoring aislado en `completionScoring.ts`.

Duplicidad real:

- baja para ranking; `COMPLETION_RANK_SORT_PREFIX` centraliza grupos visibles. Sigue parcial para qualifier/contextos enum.

Riesgo:

- medio

Acción recomendada:

- mantener la matriz de ranking/payload de `completion.test.ts` y no reintroducir documentación larga en la lista inicial.

Backlog:

- actualizar `DEVTOOLS-PERF-04`
- actualizar `DEVTOOLS-PERF-05`

### Signature formatting

Qué es:

- Construcción de `SignatureInformation`, documentación de firma y parámetros.

Implementaciones encontradas:

- [src/server/features/signatureHelp.ts](../src/server/features/signatureHelp.ts)
- [src/server/knowledge/system/localization/documentationService.ts](../src/server/knowledge/system/localization/documentationService.ts)

Owner esperado:

- `signatureHelp.ts` consumiendo `documentationService.ts`.

Duplicidad real:

- parcial

Riesgo:

- bajo

Acción recomendada:

- mantener la separación, pero reducir fallbacks de labels manuales donde sea posible.

Backlog:

- no aplica

### Diagnostics message formatting

Qué es:

- Construcción del mensaje visible del diagnóstico y de sus reason codes.

Implementaciones encontradas:

- [src/server/features/diagnostics.ts](../src/server/features/diagnostics.ts)
- [src/server/features/diagnosticsExtra.ts](../src/server/features/diagnosticsExtra.ts)

Owner esperado:

- `diagnostics.ts` y `diagnosticsExtra.ts` como extensiones del mismo motor.

Duplicidad real:

- parcial

Riesgo:

- bajo

Acción recomendada:

- mantener reason codes y evitar nuevos formatters paralelos desde reportes.

Backlog:

- no aplica

### AI explain/context formatting

Qué es:

- Renderizado AI-readable de explainers, context packs y reportes read-only.

Implementaciones encontradas:

- [src/server/features/explainSemanticQuery.ts](../src/server/features/explainSemanticQuery.ts)
- [src/server/features/explainSystemSymbol.ts](../src/server/features/explainSystemSymbol.ts)
- [src/server/features/currentObjectContext.ts](../src/server/features/currentObjectContext.ts)
- [src/server/features/workspaceCheckReport.ts](../src/server/features/workspaceCheckReport.ts)

Owner esperado:

- cada report builder sobre contratos compartidos del runtime, sin semántica paralela.

Duplicidad real:

- parcial

Riesgo:

- medio

Acción recomendada:

- seguir usando contratos comunes y evitar que cada builder vuelva a resolver o formatear por su cuenta lo que ya existe.

Backlog:

- actualizar `DEVTOOLS-ARCH-01`

## 17. Resumen operativo

Estado sintetizado tras la Parte 2:

- la arquitectura objetivo cliente fino + servidor LSP + knowledge backbone compartido sigue materializada en código real;
- el repositorio ya documenta con más precisión qué módulos están `implemented`, qué gaps están `missing` y dónde hay `partial` real sin inventar arquitectura;
- el hot path interactivo ya está protegido por budgets, readiness, `ServingCache`, `InteractiveServingPipeline`, `HotContextCache`, `HoverViewModel cache`, `NegativeHoverCache`, `ActiveDocumentServingSnapshot` y `completionItem/resolve`, pero todavía carece de `CompletionListViewModel cache`;
- DataWindow ya tiene backbone canónico reutilizable, pero el glue de binding y property paths sigue demasiado distribuido entre features para considerar cerrado el fast path interactivo;
- las duplicidades arquitectónicas relevantes ya no son teóricas: receiver resolution, enum context, binding DataWindow, recorridos de jerarquía y formateo visible siguen repartidos entre varios consumers y ya quedaron promovidos al backlog real;
- el release lane real del repo es verificable con `compile`, `test`, `test:unit`, `test:architecture:rapid`, `test:docs:drift`, `test:performance`, `test:performance:gate`, `package:vsix`, `verify:vsix-contents` y `release:verify`;
- no existe script `lint`, así que no debe aparecer como criterio de cierre mientras el repo no lo publique.

Lectura recomendada después de este mapa:

- [architecture.md](architecture.md) para la intención normativa;
- [architecture-status.md](architecture-status.md) para el estado operativo detallado;
- [testing.md](testing.md) para la estrategia, cobertura y gaps abiertos de validación;
- [performance-budget.md](performance-budget.md) para budgets y guardrails del hot path;
- [backlog.md](backlog.md) para los IDs `DEVTOOLS-*` derivados de esta auditoría.