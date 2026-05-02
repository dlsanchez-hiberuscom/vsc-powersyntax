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
- `test/server/unit/runtimeJournal.test.ts`, `runtimeHealth.test.ts`, `queryTrace.test.ts`, `servingCache.test.ts` y `statusBarPresentation.test.ts` fijan el journal exportable del runtime, el health report estructurado, los observers de trace/cache y su proyección visible en stats/status.
- `test/server/unit/pbAutoBuildDetection.test.ts`, junto con `statusBarPresentation.test.ts`, fija la detección read-only de `PBAutoBuild250.exe` por configuración/entorno/candidatos por defecto y su proyección visible en status/health sin lanzar build.
- `test/server/unit/referenceSourcePool.test.ts`, junto con `references.test.ts`, `rename.test.ts` y `codeLensReferences.test.ts`, fija el pool acotado por proyecto/candidatos y el reuso de `maskedText` en el hot path de `references`/`rename`/CodeLens.
- `test/server/unit/analysisCache.test.ts`, `knowledgeBase.test.ts` y `completion.test.ts` cubren la separación entre cierre de documento y borrado real de conocimiento, consultas acotadas sobre `KnowledgeBase` y cap de completion global.
- `test/server/unit/watchedFileChangeBridge.test.ts` y `watchedFileIntake.test.ts` fijan el intake incremental de markers topológicos y la reconciliación de `sourceOrigin`/routing sin rediscovery completo.
- `test/server/unit/formatDocument.test.ts` y `powerBuilderFormatter.test.ts` fijan el formatter server-side, sus budgets explícitos y el motor puro reutilizado; `test/smoke/formatting.extension.test.ts` cubre provider manual y `formatOnSave` sobre VS Code real.
- `test/server/unit/architectureImports.test.ts` fija el guardrail de `B228`, evitando que `knowledge/parsing/utils` vuelvan a importar `vscode-languageserver`; `documentSymbols.test.ts` mantiene verde el mapper de borde.
- `test/server/unit/documentSymbolsReconciliation.test.ts`, junto con `documentSymbols.test.ts`, fija el reporte de reconciliación parser/snapshot/LSP y sus reason codes antes de publicar el outline.
- `test/server/unit/memoryBudgets.test.ts`, junto con `runtimeHealth.test.ts` y `statusBarPresentation.test.ts`, fija el reporte unificado de budgets de memoria y su vigilancia visible.

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

## 4.5 Golden / semantic tests
**Objetivo:** proteger el comportamiento semántico del motor.

Estado actual:
- `test/server/unit/powerbuilderSemanticGolden.test.ts` ya fija el backbone PowerBuilder real para scope resolution local/shared/global/instance, prototypes vs implementations, herencia, event handlers, external functions, `DataObject` literal, rename eligibility, readiness gating, downgrade dinámico y conflictos de `sourceOrigin`.
- `test/server/unit/currentObjectContext.test.ts` y `test/smoke/extension.test.ts` ya cubren el current object context pack read-only expuesto por API pública, con metadata, references, diagnostics y bindings `DataObject` sobre un archivo real.
- `test/server/unit/impactAnalysis.test.ts` ya cubre el impact analyzer read-only sobre references, descendientes, events, DataWindows y build targets sin abrir edición automática.
- `test/server/unit/safeEditPlan.test.ts` ya cubre el safe edit plan read-only con archivos, riesgos, tests, docs a revisar y bloqueos honestos sin tocar código.
- `test/server/unit/semanticWorkspaceManifest.test.ts` ya cubre el manifiesto semántico compacto/versionado con projects, libraries, objects, herencia, diagnostics summary, sourceOrigin y readiness sin exportar código bruto.
- `test/server/unit/dataWindowSafeMode.test.ts`, junto con `documentAnalysis|definition|hover|signatureHelp|diagnostics|powerbuilderSemanticGolden`, ya fija el safe mode mínimo de `.srd` con SQL base, args, columnas, bandas principales y navegación básica.
- `test/server/unit/dataWindowLegacySafeMode.test.ts`, junto con `definition|hover`, ya fija el refuerzo legacy-safe de `.srd` para bandas, columnas `retrieve`, `report(dataobject=...)`, `column.dddw.name` y navegación/hover locales hacia child DataWindows.
- `test/server/unit/documentSymbols.test.ts` y `test/server/unit/workspaceSymbols.test.ts` ya fijan el catálogo DataWindow expuesto: outline `.srd` con bandas/tabla/retrieve, controls `report(...)` y publicación del stub `.srd` en workspace/API symbols.
- `test/server/unit/hover.test.ts` y `test/server/unit/definition.test.ts` ya cubren property paths avanzados `Describe/Modify(...DataWindow.Table.Select)` y `Modify(...dddw.name)` cuando el binding `DataObject` literal resuelve de forma determinista.

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
El ciclo actual integra PFC 2025 Workspace, PFC 2025 Solution, un slot legacy controlado en `fixtures-local/public/legacy-pbl-dump` y un slot enterprise local en `fixtures-local/STD_FC_OrderEntry` para discovery/indexación sobre aplicación real.

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
