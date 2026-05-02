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
- `test/server/unit/systemCatalog.test.ts`, `inheritanceGraph.test.ts`, `hierarchyInspection.test.ts`, `currentObjectContext.test.ts`, `diagnostics.test.ts` e `impactAnalysis.test.ts` fijan ya la cadena nativa del runtime hasta raices como `powerobject`, evitando que diagnostics y surfaces read-only diverjan al llegar al borde del `system catalog`.
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
- `test/server/unit/sourceOrigin.test.ts`, `documentAnalysis.test.ts`, `analysisCache.test.ts` y `watchedFileIntake.test.ts`, junto con `semanticWorkspaceManifest.test.ts` y `powerbuilderSemanticGolden.test.ts`, fijan el `sourceOrigin` contextual en análisis documental, el reanálisis por cambio de provenance y la rematerialización incremental de snapshots tras cambios topológicos.
- `test/server/unit/referenceSourcePool.test.ts`, junto con `references.test.ts`, `rename.test.ts` y `codeLensReferences.test.ts`, fija el pool acotado por proyecto/candidatos y el reuso de `maskedText` en el hot path de `references`/`rename`/CodeLens.
- `test/server/unit/analysisCache.test.ts`, `knowledgeBase.test.ts` y `completion.test.ts` cubren la separación entre cierre de documento y borrado real de conocimiento, consultas acotadas sobre `KnowledgeBase` y cap de completion global.
- `test/server/unit/knowledgeBase.test.ts` y `test/server/performance/knowledgeBase.perf.test.ts` fijan el copy-on-write por bucket en `KnowledgeBase`, la atomicidad defensiva tras mutaciones y el presupuesto incremental de `upsert/remove` con miles de documentos sinteticos.
- `test/server/unit/powerbuilderFiles.test.ts` y `test/smoke/lsp-guards.extension.test.ts` fijan el guard de borde para markers `.pbw/.pbt/.pbproj/.pbsln` y `.pbl`, comprobando que pueden seguir participando en discovery/topologia pero no reciben diagnostics ni providers semanticos aunque se fuerce un lenguaje servido por el cliente.
- `test/server/unit/watchedFileChangeBridge.test.ts` y `watchedFileIntake.test.ts` fijan el intake incremental de markers topológicos, la reconciliación de `sourceOrigin`/routing y la rematerialización de snapshots sin rediscovery completo.
- `test/server/unit/formatDocument.test.ts` y `powerBuilderFormatter.test.ts` fijan el formatter server-side, sus budgets explícitos y el motor puro reutilizado; `test/smoke/formatting.extension.test.ts` cubre provider manual y `formatOnSave` sobre VS Code real.
- `test/server/unit/architectureImports.test.ts` fija el guardrail de `B228`, evitando que `knowledge/parsing/utils` vuelvan a importar `vscode-languageserver`; `documentSymbols.test.ts` mantiene verde el mapper de borde.
- `test/server/unit/documentSymbolsReconciliation.test.ts`, junto con `documentSymbols.test.ts`, fija el reporte de reconciliación parser/snapshot/LSP y sus reason codes antes de publicar el outline.
- `test/server/unit/memoryBudgets.test.ts`, junto con `runtimeHealth.test.ts` y `statusBarPresentation.test.ts`, fija el reporte unificado de budgets de memoria y su vigilancia visible.
- `test/server/unit/publicApi.test.ts`, `semanticWorkspaceSnapshot.test.ts` y `settingsGovernance.test.ts` fijan ya el contrato público v2, el bridge/snapshot versionado y la gobernanza de settings/perfiles sin dejar drift contractual.
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
- `test/server/performance/large-workspace-incremental.perf.test.ts` cubre rafagas incrementales y masivas sobre workspaces grandes sinteticos y ya se integra en `npm run test:performance:gate`.

## 4.5 Golden / semantic tests
**Objetivo:** proteger el comportamiento semántico del motor.

Estado actual:
- `test/server/unit/powerbuilderSemanticGolden.test.ts` ya fija el backbone PowerBuilder real para scope resolution local/shared/global/instance, prototypes vs implementations, herencia, event handlers, external functions, `DataObject` literal, rename eligibility, readiness gating, downgrade dinámico y conflictos de `sourceOrigin`.
- `test/server/unit/currentObjectContext.test.ts`, `test/server/unit/currentObjectContextPanelModel.test.ts` y la smoke focal en `test/smoke/extension.test.ts` ya cubren el current object context pack read-only, las variables visibles expuestas por contrato, el builder puro del panel y la UX visible del Current Object Context Panel sobre un archivo real.
- `test/server/unit/orcaRunner.test.ts`, `test/server/unit/orcaDetection.test.ts`, `test/server/unit/orcaStagingExport.test.ts`, `test/server/unit/orcaStagingImport.test.ts`, `test/server/unit/specDrivenPblUpdate.test.ts`, `test/server/unit/specDrivenPblUpdateBatch.test.ts`, `test/server/unit/fileSystem.test.ts`, `test/server/unit/statusBarPresentation.test.ts`, `test/server/unit/projectHealthDashboard.test.ts`, junto con `workspace.test.ts`, `semanticWorkspaceManifest.test.ts` y la smoke focal en `test/smoke/extension.test.ts`, ya cubren el adapter ORCA base, la capability detection read-only (`config`/`PB_ORCA_PATH`), el export controlado a staging indexable con fingerprints del source real rastreado, el rail write-enabled completo de `import/regenerate/rebuild`, el workflow spec-driven de export fresco + edits explícitos + import seguro, la orquestación batch secuencial con `stopOnError`, backup binario y ledgers persistidos, y el wiring visible de los comandos ORCA sobre un ejecutable de prueba.
- `test/server/unit/workspace.test.ts`, `test/server/unit/semanticWorkspaceManifest.test.ts`, `test/server/unit/objectExplorerModel.test.ts`, `test/server/unit/watchedFileIntake.test.ts` y la smoke focal del Object Explorer ya cubren el modo `pbl-only`, el graph legacy read-only de `.pbl` y su proyección en manifest/UX visible.
- `test/server/unit/impactAnalysis.test.ts` ya cubre el impact analyzer read-only sobre references, descendientes, events, DataWindows y build targets sin abrir edición automática.
- `test/server/unit/safeEditPlan.test.ts` ya cubre el safe edit plan read-only con archivos, riesgos, tests, docs a revisar y bloqueos honestos sin tocar código; `specDrivenPblUpdate.test.ts` fija además que la automatización write-enabled solo entra cuando ese plan admite el cambio explícito y `specDrivenPblUpdateBatch.test.ts` que la coordinación bulk respeta `stopOnError` sin duplicar el rail ORCA.
- `test/server/unit/diagnostics.test.ts`, `diagnosticsExtra.test.ts`, `codeActions.test.ts`, `obsolete.test.ts` y `obsoleteDetectorSanity.test.ts` fijan el contrato estable de `diagnostic.code`, la compatibilidad legacy por `source` y el consumo correcto del quick-fix SD7 sin parseos ad hoc del Problems Panel.
- `test/server/unit/projectHealthDashboard.test.ts`, `statusBarPresentation.test.ts` y la smoke focal en `test/smoke/extension.test.ts` fijan el dashboard read-only de salud del proyecto, su integración en tooltip/status menu y la ejecución visible del comando cliente sin abrir un segundo motor de health.
- `test/server/unit/objectExplorerModel.test.ts`, `semanticWorkspaceManifest.test.ts` y la smoke focal en `test/smoke/extension.test.ts` fijan el Object Explorer read-only, el contrato enriquecido del manifest por objeto y el foco visible sobre el archivo activo sin RPCs por nodo.
- `test/server/unit/semanticReproPack.test.ts` y `test/smoke/semantic-repro-pack.extension.test.ts` fijan el bundle reproducible de bugs semánticos a partir del editor activo y las surfaces read-only ya cerradas, incluyendo manifest, snapshots JSON y copias de archivos relevantes.
- `test/server/unit/semanticWorkspaceManifest.test.ts` ya cubre el manifiesto semántico compacto/versionado con projects, libraries, objects, herencia, diagnostics summary, sourceOrigin y readiness sin exportar código bruto.
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

### 7.7 Cambio solo documental
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
