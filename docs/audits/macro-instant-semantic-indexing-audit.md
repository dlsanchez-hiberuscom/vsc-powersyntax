# Auditoría macro — Instant Semantic and Indexing Runtime

Este reporte resume cada fase de la macroauditoría. El registro completo de hallazgos vive en [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) y la arquitectura objetivo vive en [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md).

## PHASE 0 — Audit preparation and evidence map

### Alcance ejecutado

- Se cargó el prompt oficial `.github/prompts/audit-instant-semantic-indexing.prompt.md` y se fijó la disciplina de fases.
- Se leyeron los owner docs obligatorios: [docs/backlog.md](../backlog.md), [docs/current-focus.md](../current-focus.md), [docs/roadmap.md](../roadmap.md), [docs/done-log.md](../done-log.md), [docs/architecture.md](../architecture.md), [docs/architecture-status.md](../architecture-status.md), [docs/architecture-implementation-map.md](../architecture-implementation-map.md), [docs/performance-budget.md](../performance-budget.md), [docs/testing.md](../testing.md), [docs/troubleshooting.md](../troubleshooting.md), [docs/powerbuilder-2025-vscode-plugin-technical-guide.md](../powerbuilder-2025-vscode-plugin-technical-guide.md), [docs/semantic-design-target.md](../semantic-design-target.md), [docs/semantic-design-assumptions.md](../semantic-design-assumptions.md), [docs/ai-orchestration.md](../ai-orchestration.md), [docs/ai-strategy.md](../ai-strategy.md), [docs/symbol-system.md](../symbol-system.md) y [docs/release.md](../release.md).
- Se inspeccionaron módulos iniciales de semántica, indexación, caches, providers, API pública y Object Explorer.
- Se creó la carpeta [docs/audits](.) y esta primera versión de artefactos obligatorios.

### Resumen de evidencias

- `KnowledgeBase` ya tiene estado publicado/staged, epoch semántico, publicación por batch e índices por nombre, tipo, contenedor, URI, base type, scopes, snapshots y dependencias.
- `workspaceIndexer` ya usa `WorkerPool`, batching, pases structural/enriched, cancelación, salto de indexación completa cuando el estado está limpio, límite de tamaño de archivo y yielding cooperativo.
- `SemanticQueryFacade` existe y ya es usado por completion, signature help, semantic tokens y references en distinto grado.
- `cacheKeyContract` define un contrato rico de cache interactiva con `documentVersion`, `kbVersion`, `documentFingerprint`, `sourceOrigin`, `locale`, posición/rango/contexto.
- `semanticWorkspaceManifest` y `objectExplorerModel` muestran un patrón de manifiesto plano de gran tamaño y agrupación cliente.
- `completion` muestra un posible desacople entre `documentFingerprint` y `semanticEpoch` que requiere PHASE 5.
- `references` combina resolución semántica con escaneo textual sobre fuentes, pendiente de confirmar límites del source pool en PHASE 6.

### Hallazgos registrados

- `FINDING-001` — Object Explorer depende de manifiesto plano de gran tamaño.
- `FINDING-002` — `documentFingerprint` de completion resolve parece usar epoch global.
- `FINDING-003` — References conserva escaneo textual sobre pool de fuentes.

### Recomendaciones

- **Recommendation ID:** REC-0-1.
- **Resumen:** Mantener `KnowledgeBase.publishedState` como única fuente de verdad y tratar snapshots/proyecciones como contratos derivados.
- **Motivo:** los owner docs ya establecen esta arquitectura y el código inspeccionado la implementa parcialmente.
- **Área objetivo:** architecture/docs/tests.
- **Beneficio esperado:** correctness y maintainability.
- **Riesgo:** crear stores paralelos o duplicar contratos en nuevas fases.
- **Prioridad:** P0.
- **Candidato backlog:** no; regla de arquitectura ya existente.

- **Recommendation ID:** REC-0-2.
- **Resumen:** Profundizar en Object Explorer/read-only projections antes de cerrar decisiones de escalabilidad.
- **Motivo:** la evidencia inicial muestra payloads planos grandes y riesgo directo para 10,000+ archivos.
- **Área objetivo:** code/tests/backlog/architecture.
- **Beneficio esperado:** speed/reactivity.
- **Riesgo:** diseñar gates sin conocer el contrato real de UI/proyección.
- **Prioridad:** P1.
- **Candidato backlog:** sí, `PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01`.

- **Recommendation ID:** REC-0-3.
- **Resumen:** Confirmar contratos de cache/fingerprint en PHASE 5 antes de proponer fix local.
- **Motivo:** hay indicio de drift, pero puede ser un campo mal nombrado o un contexto no conectado al serving cache.
- **Área objetivo:** code/tests/backlog.
- **Beneficio esperado:** speed/correctness.
- **Riesgo:** cambiar discriminadores sin entender compatibilidad de completion resolve.
- **Prioridad:** P1.
- **Candidato backlog:** sí, `PB-ARCH-P1-CACHE-FINGERPRINT-CONTRACT-HARDENING-01`.

### Refactorizaciones identificadas

### Refactorización — REF-0-1 — Proyección paginada de Object Explorer

- **Ubicación actual:** `src/server/features/semanticWorkspaceManifest.ts`, `src/client/objectExplorerModel.ts`, read-only public API en `src/shared/publicApi.ts`.
- **Problema actual:** la evidencia inicial muestra DTO/proyección plana de gran tamaño y agrupación cliente, sin contrato paginado/lazy observado.
- **Ubicación objetivo:** módulo server-side de proyección read-only paginada y cliente de vista lazy bajo las convenciones finales de PHASE 22.
- **Diseño objetivo:** el servidor publica páginas o nodos hijos bajo filtros estables; el cliente solicita hijos por nodo/proyecto/biblioteca/tipo, conserva estados `loading/degraded/stale/ready` y evita payloads globales completos.
- **Tipo de refactor:** DTO/projection centralization.
- **Dependencias actuales:** Object Explorer, semantic workspace manifest, API read-only y comandos de soporte/AI que consumen manifest.
- **Dependencias objetivo:** vistas y herramientas dependen de contratos de proyección, no de arrays globales sin paginación.
- **Pasos de migración:** definir contrato; agregar pruebas de paridad; implementar servidor paginado en paralelo; adaptar cliente; medir payload; retirar consumo plano cuando haya paridad.
- **Tests de paridad requeridos:** árbol actual vs árbol paginado en corpus pequeño, filtros por scope, truncation receipts.
- **Tests de conformidad requeridos:** gate contra truncación global como única respuesta y gate de payload máximo.
- **Estrategia de rollback:** mantener manifest plano como fallback temporal con feature flag interna hasta pasar corpus grande.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** paridad funcional, benchmarks 10,000+ y docs actualizadas.
- **Docs afectadas:** [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md), [docs/performance-budget.md](../performance-budget.md), [docs/testing.md](../testing.md), [docs/backlog.md](../backlog.md) en PHASE 13.
- **Métricas afectadas:** payload LSP/API, primer render, expansión de nodo, memoria de cliente, hit ratio de projection cache.
- **Riesgos:** compatibilidad de API pública, navegación parcial, ordenamiento estable, redacción en support bundles.
- **Specs de backlog requeridas:** `PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01`.

### Candidatos de backlog

- `PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01` — proyección paginada/lazy de Object Explorer y read-only manifest.
- `PB-ARCH-P1-CACHE-FINGERPRINT-CONTRACT-HARDENING-01` — endurecer contrato de fingerprint/epoch/cache keys.
- `PB-ARCH-P1-REFERENCES-BOUNDED-INDEXED-POOL-01` — references con pool acotado e índice/prefiltro incremental.
- Estos candidatos no se han agregado a [docs/backlog.md](../backlog.md) porque la generación completa del backlog está bloqueada hasta PHASE 13, después de PHASE 24.

### Documentación actualizada

- Creado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md).
- Creado [docs/audits/macro-instant-semantic-indexing-audit.md](macro-instant-semantic-indexing-audit.md).
- Creado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) como fallback porque el repositorio usa [docs/architecture.md](../architecture.md) como archivo, no `docs/architecture/` como carpeta.

### Tests o validación

- No se ejecutaron tests en PHASE 0; esta fase fue de preparación, lectura y mapa de evidencias.
- Validación pendiente según contrato: `npm run test:docs:drift`, `npm run test:architecture:rapid`, `npm run test:performance:gate`, `npm run test` en PHASE 15.

### Preguntas abiertas

- Confirmar en PHASE 5 si `CompletionResolveContext.documentFingerprint` alimenta directamente cache/stale checks o solo metadata serializada.
- Confirmar en PHASE 6 los límites reales de `referenceSourcePool` antes de clasificar references como bloqueo P0/P1.
- Confirmar en PHASE 8 si existen rutas alternativas de paginación/proyección para Object Explorer no observadas en PHASE 0.

### Evidencias

- **Referencias de código:** `src/server/knowledge/KnowledgeBase.ts`; `src/server/indexer/workspaceIndexer.ts`; `src/server/handlers/featureHandlers.ts`; `src/server/serving/cacheKeyContract.ts`; `src/server/features/semanticQueryFacade.ts`; `src/server/features/semanticWorkspaceManifest.ts`; `src/server/features/completion.ts`; `src/server/features/signatureHelp.ts`; `src/server/features/semanticTokens.ts`; `src/server/features/references.ts`; `src/server/features/diagnostics.ts`; `src/server/runtime/scheduler.ts`; `src/client/objectExplorerModel.ts`; `src/shared/publicApi.ts`.
- **Referencias documentales:** [docs/backlog.md](../backlog.md); [docs/current-focus.md](../current-focus.md); [docs/architecture.md](../architecture.md); [docs/architecture-status.md](../architecture-status.md); [docs/semantic-design-target.md](../semantic-design-target.md); [docs/performance-budget.md](../performance-budget.md); [docs/testing.md](../testing.md).
- **Referencias runtime:** no disponibles en PHASE 0.
- **Referencias de test:** inventario inicial de [test](../../test); no se ejecutaron tests.
- **Referencias externas:** no aplican a PHASE 0; la investigación externa corresponde a PHASE 1.
- **Referencias PowerBuilder:** PowerScript SR* files, DataWindow `.srd`, SQL embebido/dinámico, native/external declarations, PFC/STD-like patterns según owner docs.

### Referencias de fase

- **Referencias de código:** `KnowledgeBase`, `workspaceIndexer`, `cacheKeyContract`, `SemanticQueryFacade`, `semanticWorkspaceManifest`, `completion`, `references`, `objectExplorerModel`, `publicApi`.
- **Referencias documentales:** backlog/current-focus/architecture/status/map/performance/testing/semantic target.
- **Referencias runtime:** sin logs o métricas ejecutadas.
- **Referencias de investigación externa:** no iniciadas formalmente en esta fase.
- **Referencias de candidatos backlog:** `PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01`, `PB-ARCH-P1-CACHE-FINGERPRINT-CONTRACT-HARDENING-01`, `PB-ARCH-P1-REFERENCES-BOUNDED-INDEXED-POOL-01`.

## PHASE 1 — Research modern patterns

### Alcance ejecutado

- Se investigaron patrones modernos de language servers, semántica incremental, indexación, cancelación, caches, worker pools, semantic tokens, árboles grandes, refactoring, modernización incremental y fitness functions.
- Se contrastaron las fuentes externas con los contratos actuales de [docs/semantic-design-target.md](../semantic-design-target.md), [docs/performance-budget.md](../performance-budget.md), `KnowledgeBase`, `workspaceIndexer`, `cacheKeyContract`, `SemanticQueryFacade`, `semanticWorkspaceManifest` y tests de arquitectura.

### Resumen de evidencias

| Tema | Evidencia externa | Aplicabilidad al plugin | Riesgos | Adopción recomendada | Antipatrón a evitar | Candidato backlog |
| --- | --- | --- | --- | --- | --- | --- |
| Salsa/rust-analyzer incremental computation | rust-analyzer documenta inputs en memoria, core sin I/O, modelo derivado lazy/on-demand, `AnalysisHost.apply_change`, snapshot `Analysis` y cancelación por revisión; Salsa documenta inputs determinísticos, tracked functions y memoización incremental. | Refuerza `KnowledgeBase.publishedState`, facts incrementales, snapshots publicados y queries lazy. | Copiar Salsa literalmente puede sobredimensionar el diseño TypeScript; los workers tienen coste de serialización. | Adoptar principios: inputs versionados, derivaciones determinísticas, snapshots inmutables, invalidación por dependencia. | Hacer I/O o deep discovery dentro del core semántico o provider. | No inmediato; se traduce en specs de facts/indexes si PHASE 3/4 detectan gaps. |
| TypeScript incremental project graph | TypeScript project references e incremental builds separan proyectos, detectan up-to-date y reducen memoria/typechecking. | Útil para project routing, workspace state, dirty checks y warm start. | El modelo TS no refleja PowerBuilder/PBL directamente. | Mantener graph explícito de proyectos/libraries/dependencies y builds/checkpoints incrementales. | Reindexar todo por cambios locales o mezclar test/build/source sin graph. | `PB-ARCH-P1-WARM-START-PERSISTED-GRAPH-01` candidato si PHASE 4 lo confirma. |
| LSP cancellation, workDoneProgress y partial results | LSP 3.17 define cancellation, workDoneProgress, partial results y semantic tokens full/delta/range. | Aplica a indexing, references, workspace symbols, diagnostics, semantic tokens y read-only payloads grandes. | Resultados parciales mal etiquetados pueden parecer completos. | Exponer cancelación, progreso y partial/stale/degraded metadata por operación larga. | Bloquear hasta tener resultados completos o ocultar estado parcial. | `PB-ARCH-P1-LSP-PARTIAL-RESULTS-AND-STALE-CONTRACT-01` candidato. |
| VS Code semantic tokens full/range/delta | VS Code/LSP soportan semantic tokens full, range, delta/resultId y refresh. | Directo para PHASE 7: tokens estructurales rápidos, delta/range, cache por fingerprint. | Delta incorrecto puede pintar tokens obsoletos. | Definir strategy full/range/delta con resultId y stale checks. | Resolver globalmente cada token o no usar fingerprints. | `PB-ARCH-P1-SEMANTIC-TOKENS-DELTA-RANGE-GATE-01` candidato si falta. |
| Node.js worker_threads vs async I/O | Node indica que workers son útiles para CPU-bound JS, no para I/O-bound, y recomienda worker pool; structured clone/transfer puede tener coste y riesgos. | Refuerza worker pool para parsing/facts y async I/O acotado para discovery. | Pasar objetos grandes a workers puede costar más que parsear; Buffer/TypedArray transfer mal usado puede romper memoria. | Medir serialization cost, pool estable, payloads compactos, I/O fuera de workers. | Crear un worker por archivo o usar workers para simples reads. | `PB-ARCH-P1-WORKER-SERIALIZATION-PROFILING-01` candidato. |
| VS Code TreeDataProvider lazy loading | VS Code API `TreeDataProvider.getChildren(element?)` permite resolver hijos bajo demanda; `CancellationToken` aplica a providers. | Directo para Object Explorer y read-only surfaces grandes. | UI puede quedar inconsistente si no hay IDs estables y refresh server-driven. | Usar nodos estables, hijos lazy, páginas/caps y refresh por eventos de proyección. | Construir todo el árbol desde un manifiesto plano en cliente. | `PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01`. |
| Refactoring large codebases | Fowler define refactoring como transformaciones pequeñas y preservadoras de comportamiento, apoyadas por tests. | Aplica a PHASE 9B/23: sin big-bang rewrite, con tests de paridad. | Refactor sin tests puede cambiar semántica PowerBuilder. | Refactors incrementales: Extract, Move, Split, Facade, Adapter, Delete con rollback. | Reescrituras amplias durante la auditoría. | Se reflejará en PHASE 23/13. |
| Duplicate code elimination | El catálogo de refactoring incluye Extract Function/Class, Move Function, Split Phase, Replace Inline Code with Function Call, Consolidate Duplicate Conditional Fragments. | Aplica a duplicate resolver/cache/DTO/rules/provider logic. | Extraer demasiado temprano puede crear abstracciones pobres. | Primero identificar owner de contrato, luego extraer/fusionar con tests. | Duplicar lookup/cache/projection logic por provider. | `PB-ARCH-P1-DUPLICATE-CONTRACT-CENTRALIZATION-01` candidato si PHASE 9 confirma. |
| Strangler-style modernization | Fowler recomienda modernización gradual, componentes pequeños, arquitectura transicional y criterios de coexistencia/retiro. | Aplica a migrar manifests, providers, caches y legacy paths sin romper extensión. | Compat layers sin criterios de retiro se vuelven legacy nuevo. | Usar adapters temporales con owner, tests de paridad y deletion criteria. | Big-bang rewrite o compat permanente. | `PB-ARCH-P1-LEGACY-RETIREMENT-ROADMAP-01` candidato si PHASE 9B/23 confirma. |
| Architecture fitness functions | Thoughtworks describe arquitectura evolutiva como cambio incremental guiado; fitness functions protegen características arquitectónicas. | Directo para PHASE 17/20/24 y `test:architecture:rapid`. | Checks textuales frágiles dan falsa seguridad. | Gates estructurales para imports, providers, caches, projections, diagnostics tiers, payloads y hot path scans. | Solo documentar reglas sin CI/gates ejecutables. | `PB-ARCH-P1-ARCHITECTURE-FITNESS-FUNCTIONS-01`. |

### Hallazgos registrados

- `FINDING-004` — Gates de arquitectura semántica son parciales y textuales.
- `FINDING-001`, `FINDING-002` y `FINDING-003` reciben refuerzo conceptual desde TreeDataProvider lazy, cache discriminators y LSP partial/cancellation patterns.

### Recomendaciones

- **Recommendation ID:** REC-1-1.
- **Resumen:** Adoptar el patrón de inputs versionados y derivaciones incrementales determinísticas, sin I/O en el core semántico.
- **Motivo:** rust-analyzer/Salsa muestran que reactividad IDE depende de separar inputs, derivaciones y snapshots.
- **Área objetivo:** architecture/code/tests.
- **Beneficio esperado:** speed/reactivity/correctness.
- **Riesgo:** sobrediseñar una base tipo Salsa completa cuando bastan contratos incrementales locales.
- **Prioridad:** P0.
- **Candidato backlog:** no directo; se verificará en PHASE 3/4.

- **Recommendation ID:** REC-1-2.
- **Resumen:** Hacer que operaciones largas usen cancelación, progreso, partial results y estado stale/degraded explícito.
- **Motivo:** LSP/VS Code esperan operaciones cancelables en estado volátil del editor.
- **Área objetivo:** code/tests/architecture.
- **Beneficio esperado:** reactivity/correctness.
- **Riesgo:** partial results sin receipts pueden confundirse con resultados completos.
- **Prioridad:** P1.
- **Candidato backlog:** sí, `PB-ARCH-P1-LSP-PARTIAL-RESULTS-AND-STALE-CONTRACT-01`.

- **Recommendation ID:** REC-1-3.
- **Resumen:** Separar CPU-bound worker pool de I/O-bound discovery y medir serialization cost.
- **Motivo:** Node recomienda workers para CPU intensivo y async I/O para I/O.
- **Área objetivo:** code/tests/performance.
- **Beneficio esperado:** speed/memory.
- **Riesgo:** payloads grandes hacia workers pueden borrar la ganancia.
- **Prioridad:** P1.
- **Candidato backlog:** sí, `PB-ARCH-P1-WORKER-SERIALIZATION-PROFILING-01`.

- **Recommendation ID:** REC-1-4.
- **Resumen:** Migrar Object Explorer hacia `TreeDataProvider` lazy/paged con IDs estables.
- **Motivo:** VS Code permite carga por hijos y la evidencia local muestra manifiesto plano.
- **Área objetivo:** code/tests/backlog/architecture.
- **Beneficio esperado:** speed/reactivity/memory.
- **Riesgo:** refresh parcial inconsistente sin proyección server-side estable.
- **Prioridad:** P1.
- **Candidato backlog:** sí, `PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01`.

- **Recommendation ID:** REC-1-5.
- **Resumen:** Convertir reglas arquitectónicas en fitness functions estructurales y CI gates.
- **Motivo:** arquitectura evolutiva requiere checks automáticos para sostener decisiones.
- **Área objetivo:** tests/CI/architecture.
- **Beneficio esperado:** maintainability/correctness.
- **Riesgo:** checks textuales pueden producir falsos positivos o falsos negativos.
- **Prioridad:** P0.
- **Candidato backlog:** sí, `PB-ARCH-P1-ARCHITECTURE-FITNESS-FUNCTIONS-01`.

### Refactorizaciones identificadas

### Refactorización — REF-1-1 — Fitness functions estructurales de arquitectura

- **Ubicación actual:** `test/server/unit/architectureImports.test.ts`, `test/server/unit/semanticArchitectureConformance.test.ts`, `tools/run-architecture-hotspot-guard.mjs`, `tools/run-architecture-rapid-gate.mjs`.
- **Problema actual:** los guards existen pero la cobertura del contrato instant semantic/indexing no es completa; parte de la verificación semántica usa búsquedas textuales y no valida todos los discriminadores ni comportamientos por provider.
- **Ubicación objetivo:** suite de fitness functions estructurales bajo tests/tools existentes, con reporte JSON estable y fixtures negativos.
- **Diseño objetivo:** checks basados en análisis de imports/AST o reglas declarativas para providers, caches, projections, diagnostics tiers, semantic tokens, Object Explorer, submodelos PowerBuilder y legacy retirement.
- **Tipo de refactor:** Architecture gate.
- **Dependencias actuales:** npm scripts de arquitectura, tests unitarios, tools de hotspot y docs de performance/testing.
- **Dependencias objetivo:** CI/release gates consumen la misma suite; owner docs explican reglas sin duplicarlas.
- **Pasos de migración:** inventariar reglas; crear fixtures negativos; reemplazar checks textuales frágiles; añadir reporte por regla; integrar en `test:architecture:rapid`; documentar exceptions allowlisted.
- **Tests de paridad requeridos:** gates actuales siguen detectando boundaries existentes.
- **Tests de conformidad requeridos:** provider bypass, cache discriminator omission, Object Explorer truncation, DataWindow/SQL/native deep logic en hot paths, store paralelo.
- **Estrategia de rollback:** mantener tests actuales mientras los nuevos gates entran como warn-only; promover a fail cuando tengan fixtures negativos estables.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** todos los checks textuales cubiertos por validadores estructurales y sin falsos positivos en CI.
- **Docs afectadas:** [docs/testing.md](../testing.md), [docs/performance-budget.md](../performance-budget.md), [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md), [docs/backlog.md](../backlog.md) en PHASE 13.
- **Métricas afectadas:** tasa de regresiones atrapadas, tiempo de gate rápido, cobertura de reglas.
- **Riesgos:** complejidad de tooling, allowlists permanentes, fricción en cambios legítimos.
- **Specs de backlog requeridas:** `PB-ARCH-P1-ARCHITECTURE-FITNESS-FUNCTIONS-01`.

### Candidatos de backlog

- `PB-ARCH-P1-ARCHITECTURE-FITNESS-FUNCTIONS-01` — fitness functions estructurales para arquitectura instant semantic/indexing.
- `PB-ARCH-P1-LSP-PARTIAL-RESULTS-AND-STALE-CONTRACT-01` — contrato común de cancelación, progreso, resultados parciales y stale/degraded responses.
- `PB-ARCH-P1-WORKER-SERIALIZATION-PROFILING-01` — perf gates para worker pool, costo de structured clone y payloads.
- `PB-ARCH-P1-WARM-START-PERSISTED-GRAPH-01` — candidato condicionado a PHASE 4/18.
- `PB-ARCH-P1-DUPLICATE-CONTRACT-CENTRALIZATION-01` — candidato condicionado a PHASE 9.
- `PB-ARCH-P1-LEGACY-RETIREMENT-ROADMAP-01` — candidato condicionado a PHASE 9B/23.

### Documentación actualizada

- Actualizado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con `FINDING-004`.
- Actualizado este reporte con la matriz de investigación PHASE 1.
- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) con decisiones de diseño respaldadas por investigación externa.

### Tests o validación

- No se ejecutaron comandos de test en PHASE 1.
- Se inspeccionaron `test/server/unit/architectureImports.test.ts` y `test/server/unit/semanticArchitectureConformance.test.ts` para contrastar fitness functions existentes.

### Preguntas abiertas

- Definir en PHASE 17 qué reglas deben ser fail-fast y cuáles empiezan como warn-only.
- Confirmar en PHASE 20 qué gates entran en CI normal, release y nightly/performance.
- Confirmar en PHASE 24 umbrales de tamaño de archivo/clase/función y excepciones allowlisted.

### Evidencias

- **Referencias de código:** `test/server/unit/architectureImports.test.ts`; `test/server/unit/semanticArchitectureConformance.test.ts`; `tools/run-architecture-hotspot-guard.mjs`; `tools/run-architecture-rapid-gate.mjs`; `src/server/serving/cacheKeyContract.ts`; `src/client/objectExplorerModel.ts`; `src/server/features/semanticWorkspaceManifest.ts`.
- **Referencias documentales:** [docs/semantic-design-target.md](../semantic-design-target.md); [docs/performance-budget.md](../performance-budget.md); [docs/testing.md](../testing.md).
- **Referencias runtime:** no disponibles en PHASE 1.
- **Referencias de test:** gates de arquitectura existentes inspeccionados; no ejecutados.
- **Referencias externas:** LSP 3.17 specification; VS Code Language Server Extension Guide; VS Code Programmatic Language Features; VS Code API reference; Node.js `worker_threads`; TypeScript Project References e `incremental`; rust-analyzer architecture; Salsa overview; Fowler Refactoring catalog/book; Fowler Strangler Fig; Thoughtworks Building Evolutionary Architectures.
- **Referencias PowerBuilder:** los patrones se aplican a PowerScript, DataWindow, SQL/Transaction, native/external y PFC/STD-like patterns mediante submodelos advisory y source-origin/confidence gates.

### Referencias de fase

- **Referencias de código:** tests/tools de arquitectura, cache key contract, Object Explorer manifest/model.
- **Referencias documentales:** semantic target, performance budget, testing.
- **Referencias runtime:** ninguna.
- **Referencias de investigación externa:** LSP/VS Code/Node/TypeScript/rust-analyzer/Salsa/Fowler/Thoughtworks.
- **Referencias de candidatos backlog:** `PB-ARCH-P1-ARCHITECTURE-FITNESS-FUNCTIONS-01`, `PB-ARCH-P1-LSP-PARTIAL-RESULTS-AND-STALE-CONTRACT-01`, `PB-ARCH-P1-WORKER-SERIALIZATION-PROFILING-01`, `PB-ARCH-P1-WARM-START-PERSISTED-GRAPH-01`, `PB-ARCH-P1-DUPLICATE-CONTRACT-CENTRALIZATION-01`, `PB-ARCH-P1-LEGACY-RETIREMENT-ROADMAP-01`.

## PHASE 2 — PowerBuilder semantic complexity audit

### Alcance ejecutado

- Se auditó el diseño semántico frente a los dominios obligatorios: lexical basics, object model, OOP semantics, symbol/scoping, DataWindow, SQL, native/external, build/source, PFC/STD-like patterns e implicaciones 10,000+ archivos.
- Se inspeccionaron parser/análisis, KnowledgeBase/contracts, DataWindow fast/model/binding, SQL anchors, external functions, framework packs, tests unitarios/performance y specs/backlog relacionados.
- No se ejecutaron tests; esta fase fue de lectura y contraste.

### Matriz de dominios PowerBuilder

| Dominio | Soporte actual | Soporte faltante o débil | Riesgo de falsa certeza | Riesgo hot path | Comportamiento objetivo | Recomendación | Backlog candidato |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lexical basics | `grammar.ts`, `matchers.ts`, masking de comentarios, continuaciones y patterns SR* cubren identificadores PB, keywords, tipos built-in, funciones/eventos/subrutinas/variables y bloques. | No hay AST completo de expresiones; el parser sigue siendo conservador/regex + statements. | Confundir parse estructural con semántica completa de expresiones. | Bajo mientras siga estructural; alto si se intenta deep parse en providers. | Lexer/parser tolerante, rápido y honesto; expresiones profundas fuera de hot paths. | Mantener parser conservador y añadir solo slices con tests oficiales. | Ninguno nuevo en PHASE 2. |
| Object model | `documentAnalysis.ts` publica type stubs, file object, type blocks, containerName/fileObjectName/baseTypeName y scopes; `.srd` se trata como DataWindow stub. | Casos dinámicos y estructuras complejas no tienen modelo completo. | Dar por resuelto un owner cuando solo hay stub o structural-only readiness. | Medio si consumers reconstruyen owners fuera de snapshot/facade. | Objeto SR* como entidad estable con sourceOrigin/readiness/fingerprint. | Consumir snapshot/facade; no reparsear en providers. | Se revisará en PHASE 3. |
| OOP semantics | `InheritanceGraph` calcula ancestros transitivos, jerarquía, distancia, member closure, override/inherited/own y accesibilidad; tests cubren cadena y native ancestors. | Dynamic dispatch, overload context avanzado y event chaining siguen parciales/advisory. | `inherited`/`fallback` puede parecer igual de fuerte que `direct` en surfaces. | Medio por lookups repetidos si no se reutiliza closure cache. | Closure cache por kb version, confidence visible y degraded state en partial readiness. | Mantener `InheritanceGraph` como owner y propagar confidence/reasons. | `PB-SEMANTIC-P2-OOP-DYNAMIC-DISPATCH-LIMITS-01` candidato condicionado. |
| Symbol/scoping | Local/argument/member/global/shared se modelan en scopes y entities; tests de scope resolution priorizan local sobre member y qualifiers. | `catch Throwable ex` y algunos constructs de cursor/SQL no generan variables tipadas propias; no se observó cobertura funcional para estos casos. | Variables dinámicas o no modeladas pueden caer a global fallback. | Medio en completion/semantic tokens si se escanea línea a línea sin cache semántica. | Scope tree incremental con constructs PB adicionales solo cuando haya tests. | Añadir slice para catch variables y cursor/host-variable evidence si PHASE 6/7 lo requieren. | `PB-SEMANTIC-P2-CATCH-CURSOR-SCOPE-SLICE-01`. |
| DataWindow | Submodelo real: `dataWindowModel.ts`, `dataWindowBindingModel.ts`, `dataWindowFastContext.ts`, property paths, safe mode, SQL lineage, tests unitarios y smoke. `.srd` no se analiza como PowerScript normal. | El modelo reconstruye desde snapshot/texto bajo demanda en varios helpers; `DataWindowFastContext.documentFingerprint` puede caer a `kb.semanticEpoch` si no hay active snapshot. | Medium/low/dynamic bindings pueden presentarse como útiles sin enough UI receipt si el consumer no los muestra. | Medio por reconstrucción de modelos `.srd` y cache key con epoch global en fallback. | Submodelo advisory con cache/fingerprint propio, confidence/reason codes, caps y no deep work en activation. | Confirmar en PHASE 5/8 si el fallback de fingerprint y la reconstrucción bajo demanda deben centralizarse. | `PB-ARCH-P1-DATAWINDOW-FAST-CONTEXT-FINGERPRINT-01` candidato. |
| SQL/Transaction | `sqlRegions.ts` detecta SQL embebido heurístico; `embeddedSqlAnchors.ts` infiere transaction target/confidence; tests cubren SELECT/UPDATE/DECLARE/FETCH/etc.; specs declaran SQL como heurístico/advisory. | `DEFAULT_MAX_ANCHORS = Number.MAX_SAFE_INTEGER`; no parser SQL real ni DB schema validation. | SQL anchors pueden parecer evidencia completa aunque solo son boundary/transaction hints. | Medio por materializar todos los anchors en Current Object Context. | `SqlAnchorSubmodel` bounded por consumer, con confidence, caps, receipts y no parser DBMS. | Registrar cap por surface y test de truncation. | `PB-ARCH-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01`. |
| Native/external | `externalFunctions.ts` parsea `library`/`rpcfunc`, alias y clasifica `dll/pbx/unknown`; entities llevan metadata externa; tests cubren casos básicos. | No valida existencia/ABI/bitness/PBNI; `.pbx` solo clasificación superficial. | Hover/report puede sonar autoritativo si no distingue metadata declarada vs validada. | Bajo si sigue metadata-only; alto si intenta inspeccionar DLL/PBX en activation. | External/native advisory, no ABI promises, validation opcional fuera de hot path. | Mantener límites explícitos y gates de sourceOrigin/risk. | Ya cubierto por `PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01`; PHASE 13 debe normalizar estado. |
| Build/source | `WorkspaceState`, discovery, watched intake y sourceOrigin model separan source origins y rematerializan si cambia origin; specs separan build artifacts de verdad semántica. | Backlog/spec status drift en DataWindow/SQL/native; ORCA/PBAutoBuild siguen optional rails. | Tratar staging/generated como canónico puede contaminar references/rename. | Medio por watcher bursts y rematerialización si se mezclan origins. | Source origin como discriminador obligatorio, staging advisory y build rails separados del runtime interactivo. | Corregir ownership documental y validar origin policies en PHASE 3/5. | `PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01`. |
| PFC/STD-like patterns | `frameworkKnowledgePackPolicy.ts` define packs curados/advisory, workspace-wins y pack-advisory; tests cubren PFC/STD cuando fixtures locales existen. | No hay spec exhaustiva de patrones PFC/STD soportados; corpora locales son opcionales. | Advisory packs pueden parecer fuente oficial si el UI omite conflict policy. | Bajo en lookup, medio si packs crecen sin caps o prioridad. | Framework knowledge como contexto advisory con ownerTypes, source, confidence y conflict policy. | Mantener packs curados pequeños y documentar coverage defendible. | `PB-SEMANTIC-P2-PFC-STD-PATTERNS-SPEC-01`. |
| 10,000+ files | Hay tests performance parciales: KB sintético 5,000 documentos, watcher large workspace, OrderEntry/PFC/legacy opcionales. | No hay corpus sintético 10,000+ que combine todos los dominios PB y mida providers/caches/surfaces. | Extrapolar rendimiento real desde corpus parcial. | Alto para completion/references/diagnostics/tokens/read-only surfaces. | Corpus reproducible 10,000+ con SR*, inheritance, DW, SQL, native, PFC-like, diagnostics y UI projections. | Integrar PHASE 19/20 con gates y thresholds. | `PB-PERF-P2-10K-SEMANTIC-CORPUS-01`. |

### Hallazgos registrados

- `FINDING-005` — Estados de backlog y specs de submodelos PowerBuilder no están alineados.
- `FINDING-006` — Embedded SQL anchors usan límite por defecto no acotado en superficies read-only.
- `FINDING-007` — No existe corpus semántico sintético 10,000+ que combine dominios PowerBuilder.
- `FINDING-002` se refuerza: DataWindow fast context también muestra fallback de `documentFingerprint` hacia epoch global cuando no hay active snapshot.

### Recomendaciones

- **Recommendation ID:** REC-2-1.
- **Resumen:** Mantener el parser PowerScript conservador y declarar toda cobertura profunda como submodelo/slice con confidence.
- **Motivo:** el código actual es rápido y tolerante porque evita AST completo; sobreextenderlo en hot paths rompería la meta de instantaneidad.
- **Área objetivo:** architecture/code/tests.
- **Beneficio esperado:** speed/correctness.
- **Riesgo:** dejar gaps sin receipts puede parecer falta de feature; mitigarlo con degraded/advisory metadata.
- **Prioridad:** P0.
- **Candidato backlog:** no directo.

- **Recommendation ID:** REC-2-2.
- **Resumen:** Normalizar estado y ownership de DataWindow/SQL/native entre backlog y specs en PHASE 13.
- **Motivo:** la auditoría detectó drift entre `Open` y `Done/absorbed`.
- **Área objetivo:** docs/backlog.
- **Beneficio esperado:** maintainability.
- **Riesgo:** mover contenido de owner equivocado o duplicar hechos.
- **Prioridad:** P1.
- **Candidato backlog:** sí, `PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01`.

- **Recommendation ID:** REC-2-3.
- **Resumen:** Convertir SQL anchors en proyección bounded por consumer con `truncated/receipt`.
- **Motivo:** el default actual no acota anchors y una read-only surface lo consume sin límite explícito.
- **Área objetivo:** code/tests/architecture.
- **Beneficio esperado:** speed/reactivity/memory.
- **Riesgo:** truncar sin receipt ocultaría evidencia útil.
- **Prioridad:** P1.
- **Candidato backlog:** sí, `PB-ARCH-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01`.

- **Recommendation ID:** REC-2-4.
- **Resumen:** Agregar corpus semántico sintético 10,000+ que combine dominios PowerBuilder antes de afirmar escalabilidad final.
- **Motivo:** las pruebas actuales son valiosas pero no cubren la matriz completa a tamaño objetivo.
- **Área objetivo:** tests/performance/CI.
- **Beneficio esperado:** correctness/speed/reactivity.
- **Riesgo:** suite demasiado cara para CI normal; debe tener modo rapid/nightly.
- **Prioridad:** P0.
- **Candidato backlog:** sí, `PB-PERF-P2-10K-SEMANTIC-CORPUS-01`.

- **Recommendation ID:** REC-2-5.
- **Resumen:** Mantener DataWindow, SQL, native/external y framework packs como advisory salvo evidencia directa y sourceOrigin fuerte.
- **Motivo:** estos dominios no son PowerScript normal y pueden depender de runtime, DBMS, ORCA/PBAutoBuild o corpora locales.
- **Área objetivo:** architecture/code/docs/tests.
- **Beneficio esperado:** correctness/maintainability.
- **Riesgo:** degradar demasiado y perder valor práctico; usar confidence y reason codes para equilibrar.
- **Prioridad:** P0.
- **Candidato backlog:** no directo.

### Refactorizaciones identificadas

### Refactorización — REF-2-1 — Proyección acotada de SQL anchors

- **Ubicación actual:** `src/server/features/embeddedSqlAnchors.ts`, `src/server/features/currentObjectContext.ts`, `src/server/parsing/sqlRegions.ts`, tests en `test/server/unit/sqlRegions.test.ts`.
- **Problema actual:** `collectEmbeddedSqlAnchors` tiene límite por defecto no acotado y al menos un consumer read-only lo usa sin cap explícito.
- **Ubicación objetivo:** `SqlAnchorSubmodel` o adapter bounded de read-only projection bajo el módulo final de PHASE 22.
- **Diseño objetivo:** `collectEmbeddedSqlAnchors(snapshot, { consumer, maxAnchors })` o equivalente con default seguro por consumer, receipt de truncación, confidence por anchor y opción de deep command fuera del hot/read-only path.
- **Tipo de refactor:** DTO/projection centralization.
- **Dependencias actuales:** Current Object Context, code metrics/reporting, public API de anchors SQL y tests de SQL regions.
- **Dependencias objetivo:** consumers dependen de proyección bounded, no de un collector ilimitado.
- **Pasos de migración:** añadir request/options compatible; fijar defaults por consumer; actualizar Current Object Context; añadir receipt en DTO; test de cap; mantener overload actual temporal con warning interno si aplica.
- **Tests de paridad requeridos:** casos SELECT/UPDATE/DECLARE/FETCH existentes siguen detectando anchors.
- **Tests de conformidad requeridos:** documento con >N anchors devuelve N y `truncated=true`; no parser DBMS ni deep validation en hot path.
- **Estrategia de rollback:** conservar `maxAnchors = Number.MAX_SAFE_INTEGER` solo para comando explícito/debug, no para surfaces automáticas.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** todos los consumers pasan límite explícito o usan policy central.
- **Docs afectadas:** [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md), [docs/testing.md](../testing.md), [docs/backlog.md](../backlog.md) en PHASE 13.
- **Métricas afectadas:** payload Current Object Context, tiempo de construir context, memoria por documento, número de anchors truncados.
- **Riesgos:** pérdida de visibilidad si el receipt no es claro; compat de API pública.
- **Specs de backlog requeridas:** `PB-ARCH-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01`.

### Refactorización — REF-2-2 — Normalización documental de submodelos PB

- **Ubicación actual:** [docs/backlog.md](../backlog.md), [specs/PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01.md](../../specs/PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01.md), [specs/PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01.md](../../specs/PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01.md), [specs/PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01.md](../../specs/PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01.md), [docs/current-focus.md](../current-focus.md), [docs/semantic-design-assumptions.md](../semantic-design-assumptions.md).
- **Problema actual:** los estados `Open`/`Done`/`absorbed` no coinciden entre owner docs y specs.
- **Ubicación objetivo:** backlog como índice único de estado y specs como owner de detalle técnico; current-focus solo para foco activo.
- **Diseño objetivo:** cada `PB-ARCH-*` declara si está `Open`, `Partial`, `Done`, `Superseded` o `Open por conformance`; cada `PB-SEMANTIC-*` referencia su contrato arquitectónico sin duplicar el detalle.
- **Tipo de refactor:** Contract centralization.
- **Dependencias actuales:** agentes, roadmap, auditorías, phase gates y docs drift.
- **Dependencias objetivo:** PHASE 13 genera backlog final sin duplicar specs ya cerradas.
- **Pasos de migración:** inventariar estados; decidir owner; cambiar solo estado/resumen; mover detalle largo a spec existente; link check; drift gate.
- **Tests de paridad requeridos:** no aplica a runtime.
- **Tests de conformidad requeridos:** docs drift/link check.
- **Estrategia de rollback:** revertir solo docs de estado si se descubre una spec realmente abierta.
- **Capa temporal de compatibilidad:** no.
- **Criterios de retirada:** no quedan estados contradictorios para los tres submodelos.
- **Docs afectadas:** backlog/specs/current-focus/semantic assumptions.
- **Métricas afectadas:** drift count, broken links.
- **Riesgos:** reabrir o cerrar trabajo sin validar con código/tests.
- **Specs de backlog requeridas:** `PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01`.

### Candidatos de backlog

- `PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01` — normalizar estados de DataWindow/SQL/native entre backlog y specs.
- `PB-ARCH-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01` — SQL anchors bounded con receipts por consumer.
- `PB-PERF-P2-10K-SEMANTIC-CORPUS-01` — corpus semántico sintético 10,000+ con dominios PowerBuilder combinados.
- `PB-SEMANTIC-P2-CATCH-CURSOR-SCOPE-SLICE-01` — slice opcional de variables `catch`/cursor si PHASE 6/7 confirma impacto.
- `PB-SEMANTIC-P2-PFC-STD-PATTERNS-SPEC-01` — inventario defendible de patrones PFC/STD soportados vs advisory.
- `PB-ARCH-P1-DATAWINDOW-FAST-CONTEXT-FINGERPRINT-01` — candidato condicionado a PHASE 5 para el fallback de fingerprint.

### Documentación actualizada

- Actualizado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con `FINDING-005`, `FINDING-006` y `FINDING-007`.
- Actualizado este reporte con la matriz completa de dominios PHASE 2.
- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) con límites y comportamiento objetivo de dominios PowerBuilder.
- No se actualizó [docs/backlog.md](../backlog.md) porque la generación/consolidación del backlog está bloqueada hasta PHASE 13 por el prompt.

### Tests o validación

- No se ejecutaron tests.
- Tests inspeccionados: `dataWindowModel.test.ts`, `dataWindowFastContext.test.ts`, `sqlRegions.test.ts`, `externalFunctions.test.ts`, `frameworkKnowledgePacks.test.ts`, `inheritanceGraph.test.ts`, `scopeResolution.test.ts`, `semanticTokens.test.ts`, `knowledgeBase.perf.test.ts`, `large-workspace-incremental.perf.test.ts`.

### Preguntas abiertas

- Confirmar en PHASE 5 si `DataWindowFastContext.documentFingerprint` debe dejar de caer a `kb.semanticEpoch` cuando no hay active snapshot.
- Confirmar en PHASE 6/8 qué surfaces consumen SQL anchors y cuál debe ser el cap por consumer.
- Confirmar en PHASE 13 si los specs `PB-SEMANTIC-P2-*` realmente absorben los `PB-ARCH-P2-*` o si queda conformance pendiente.
- Confirmar en PHASE 19 la forma del corpus sintético 10,000+ y sus thresholds.

### Evidencias

- **Referencias de código:** `src/server/parsing/grammar.ts`; `src/server/analysis/documentAnalysis.ts`; `src/server/knowledge/types.ts`; `src/server/knowledge/resolution/semanticQueryResult.ts`; `src/server/knowledge/resolution/InheritanceGraph.ts`; `src/server/features/dataWindowModel.ts`; `src/server/features/dataWindowBindingModel.ts`; `src/server/features/dataWindowFastContext.ts`; `src/server/features/embeddedSqlAnchors.ts`; `src/server/parsing/sqlRegions.ts`; `src/server/parsing/externalFunctions.ts`; `src/server/knowledge/system/frameworkKnowledgePackPolicy.ts`; `src/server/knowledge/symbolKey.ts`.
- **Referencias documentales:** [docs/backlog.md](../backlog.md); [docs/semantic-design-target.md](../semantic-design-target.md); [docs/semantic-design-assumptions.md](../semantic-design-assumptions.md); [docs/architecture-implementation-map.md](../architecture-implementation-map.md); [docs/testing.md](../testing.md); DataWindow/SQL/native specs citados.
- **Referencias runtime:** no disponibles en PHASE 2.
- **Referencias de test:** tests unitarios/performance listados en la sección de validación; no ejecutados.
- **Referencias externas:** se reutiliza investigación PHASE 1 para advisory submodels, confidence gates y bounded projections.
- **Referencias PowerBuilder:** SR*, eventos/funciones/subrutinas, scopes local/argumento/instancia/global/compartida, DataWindow `.srd`, SQL embebido/dinámico/transaction, external/native/RPCFUNC/PBX, PFC/STD-like patterns.

### Referencias de fase

- **Referencias de código:** parser/análisis, DataWindow model/binding/fast context, SQL anchors/regions, external functions, framework packs, inheritance graph, symbol keys.
- **Referencias documentales:** backlog/specs/status docs de DataWindow/SQL/native, testing y architecture implementation map.
- **Referencias runtime:** ninguna.
- **Referencias de investigación externa:** LSP/VS Code/Node/TypeScript/rust-analyzer/Salsa/Fowler/Thoughtworks como principios ya cerrados en PHASE 1.
- **Referencias de candidatos backlog:** `PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01`, `PB-ARCH-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01`, `PB-PERF-P2-10K-SEMANTIC-CORPUS-01`, `PB-SEMANTIC-P2-CATCH-CURSOR-SCOPE-SLICE-01`, `PB-SEMANTIC-P2-PFC-STD-PATTERNS-SPEC-01`, `PB-ARCH-P1-DATAWINDOW-FAST-CONTEXT-FINGERPRINT-01`.

## PHASE 3 — Semantic architecture conformance audit

### Alcance ejecutado

- Se auditó si existe una única verdad semántica, si los providers son thin, si hay stores paralelos, cómo se transportan identity/sourceOrigin/confidence/reason/evidence y qué consumers reconstruyen semántica.
- Se inspeccionaron `KnowledgeBase`, snapshots semánticos, `SemanticQueryFacade`, `SemanticQueryResult`, query policies, references, completion, diagnostics, semantic tokens, workspace symbols, current object context, tests de conformance y specs P0/P1.
- No se ejecutaron tests; esta fase fue lectura arquitectónica y contraste documental.

### Respuestas de conformidad

| Pregunta | Resultado | Evidencia | Riesgo |
| --- | --- | --- | --- |
| ¿Exactamente una fuente semántica única? | Sí para verdad publicada: `KnowledgeBase.publishedState` concentra entidades, scopes, snapshots, dependencias, índices y epoch. | `KnowledgeBase` publica staged state de forma atómica y los caches DocumentCache/analysisCache sincronizan hacia KB. | Medium: `PublishedSemanticSnapshot` sigue implícito/privado y getters readonly mutan `scopeIndex`. |
| ¿Providers delgados? | Parcial. | Hover/definition/signature/rename usan facade en rutas principales; completion, references, diagnostics, semantic tokens y current object context mezclan facade con KB/graph/catálogo/resolución local. | High: divergencia cross-surface. |
| ¿Stores paralelos? | No se observó otro store semántico autoritativo. | analysis cache y DocumentCache son caches derivadas; KB recibe upserts. | Medium: la falta de contrato público de snapshot complica demostrarlo automáticamente. |
| ¿Identidades estables? | Sí, con `buildSymbolKey` y entidades lineage/sourceOrigin. | references, workspace symbols, dependency graph y conflict analysis consumen symbol keys. | Medium: no todos los consumers propagan sourceOrigin/confidence al usuario. |
| ¿Submodelos advisory? | Sí, pero boundaries parciales. | DataWindow/SQL/native/framework packs tienen modelos y confidence/sourceOrigin, pero providers/adapters no están totalmente normalizados en `SemanticQueryResult`. | Medium/High. |
| ¿Confianza/evidencia/reason codes propagados? | Parcial. | `SemanticQueryResult` transporta confidence/evidence/reasons; diagnostics/semantic tokens/hover usan parte; completion/references/workspaceSymbols tienen modelos propios. | High para explainability. |
| ¿Consumers reconstruyen semántica? | Sí. | references re-resuelve cada match; semanticTokens resuelve por identificador; diagnostics mantiene validaciones propias; completion enumera scopes/members/globals directamente. | High para hot paths. |
| ¿Docs/contratos alineados? | Parcial. | Specs P0 siguen Open; gates de conformance son textuales y backlog/specs tienen drift ya registrado. | High para CI y planificación. |

### Matriz de consumers

| Consumer | Facade | Acceso directo | Reconstrucción local | Confidence/sourceOrigin | Riesgo hot path | Recomendación |
| --- | --- | --- | --- | --- | --- | --- |
| Hover | Principal. | Catálogo fast-path y presentación. | Baja. | Alta; usa confidence/reason/ambiguity. | Bajo. | Mantener como patrón thin de referencia. |
| Definition | Principal. | DataWindow adapter y catálogo fallback. | Baja. | Media. | Bajo. | Integrar DataWindow result model en facade o documentar excepción. |
| Signature Help | Principal. | Catálogo/signature shaping. | Baja/media. | Media. | Bajo. | Mantener pool común con callable facade. |
| Completion | Parcial. | Scope readonly, graph members, system catalog, KB query. | Media. | Media; resolve data incluye sourceOrigin pero fingerprint usa epoch global. | Alto. | Converger member/global pools a facade/subfacade y corregir cache identity. |
| References | Parcial. | Source pool/text scan; `matchesResolvedFamily` crea doc simulado. | Alta. | Baja. | Alto. | Reemplazar re-resolve per match por índice/prefiltro y batch confirmation bounded. |
| Rename | Principal, pero depende de references. | Dynamic string guard. | Baja directa; hereda references. | Media/baja. | Medio. | Bloquear por confidence/sourceOrigin y resolver references architecture. |
| Diagnostics | Parcial. | `validateSemantics`, KB, graph, catálogo y checks propios. | Alta. | Media; algunos diagnostics incluyen reason/confidence. | Alto. | Separar structural/semantic/advisory tiers y centralizar query result. |
| Semantic Tokens | Parcial. | Scope local, catálogo y facade fallback por identifier. | Alta. | Media/alta para tokens semánticos. | Alto. | Memoizar por document fingerprint/epoch y usar token projection. |
| Workspace Symbols | No necesita facade para identity resolution; usa KB query indexada. | KB query directo. | Baja. | Media; API symbols mapean lineage. | Bajo. | Declarar como excepción estructural/index query permitida. |
| Current Object Context | Parcial. | Graph, diagnostics, DataWindow bindings, SQL anchors, related files. | Media. | Media/alta para references; SQL anchors sin cap. | Medio. | Convertir a read-only projection bounded con receipts. |
| Query Context helper | Helper de facade, pero expone `ResolvedTargetInfo`. | `semanticQueryService` directo. | Media. | Alta internamente. | Bajo/medio. | Encapsular como internal y evitar que providers dependan del shape raw. |

### Hallazgos registrados

- `FINDING-008` — Getters readonly de KnowledgeBase mutan `publishedState` al construir `scopeIndex`.
- `FINDING-009` — `SemanticQueryResult.query.sourceOriginPolicy` no refleja la policy real del consumer.
- `FINDING-010` — Convergencia hacia `SemanticQueryResult` sigue parcial en providers y helpers.
- `FINDING-001` a `FINDING-007` siguen vigentes y ahora quedan ubicados dentro de la arquitectura semántica general.

### Recomendaciones

- **Recommendation ID:** REC-3-1.
- **Resumen:** Formalizar `PublishedSemanticSnapshot`/published state como contrato ejecutable, incluyendo qué estructuras pueden ser lazy y cuáles son derivadas.
- **Motivo:** hoy `PublishedKnowledgeState` es private y `scopeIndex` se materializa en getters readonly.
- **Área objetivo:** architecture/code/tests.
- **Beneficio esperado:** correctness/maintainability.
- **Riesgo:** mover el índice a publish puede aumentar coste de indexación si no se mide.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01`.

- **Recommendation ID:** REC-3-2.
- **Resumen:** Hacer que `SemanticQueryResult` copie la policy efectiva del consumer y no defaults hardcodeados.
- **Motivo:** el resolver filtra por policy, pero el envelope informa allow-all.
- **Área objetivo:** code/tests.
- **Beneficio esperado:** correctness/explainability/security.
- **Riesgo:** tests existentes pueden asumir metadata laxa.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-ARCH-P0-SEMANTIC-QUERY-POLICY-ECHO-01`.

- **Recommendation ID:** REC-3-3.
- **Resumen:** Publicar matriz oficial de consumers: facade DTO permitido, bypass permitido, budget/cap, sourceOrigin policy y degraded behavior.
- **Motivo:** el estado actual es híbrido y los gates textuales no lo modelan.
- **Área objetivo:** docs/tests/code.
- **Beneficio esperado:** maintainability/correctness/speed.
- **Riesgo:** intentar migrar todos los providers a la vez; debe ser incremental.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-ARCH-P0-SEMANTIC-FACADE-CONVERGENCE-MATRIX-01`.

- **Recommendation ID:** REC-3-4.
- **Resumen:** Convertir exceptions estructurales legítimas (`workspaceSymbols`, local scope fast path, catalog keyword checks) en allowlist probada, no en bypass informal.
- **Motivo:** no todo acceso directo a KB es malo, pero debe ser explícito y acotado.
- **Área objetivo:** tests/architecture.
- **Beneficio esperado:** speed/maintainability.
- **Riesgo:** gates demasiado rígidos pueden bloquear optimizaciones razonables.
- **Prioridad:** P1.
- **Candidato backlog:** incluido en `PB-ARCH-P0-SEMANTIC-FACADE-CONVERGENCE-MATRIX-01`.

- **Recommendation ID:** REC-3-5.
- **Resumen:** Sustituir gates textuales por conformance estructural sobre imports/AST y golden matrix cross-surface.
- **Motivo:** el test actual solo busca strings y no detecta raw `ResolvedTargetInfo`, docs simulados o policy mismatch.
- **Área objetivo:** tests/CI.
- **Beneficio esperado:** correctness/maintainability.
- **Riesgo:** ruido si la allowlist inicial no está bien definida.
- **Prioridad:** P0.
- **Candidato backlog:** refuerza `FINDING-004`.

### Refactorizaciones identificadas

### Refactorización — REF-3-1 — Snapshot publicado readonly y scope index derivado

- **Ubicación actual:** `src/server/knowledge/KnowledgeBase.ts` (`PublishedKnowledgeState`, `getScopeAt`, `getScopeAtReadonly`, `indexDocumentIntoState`).
- **Problema actual:** getters de consulta pueden escribir `scopeIndex` en `publishedState`.
- **Ubicación objetivo:** `ScopeIndexProjection` derivada o scope index construido al publicar documento.
- **Diseño objetivo:** `publishedState` contiene solo datos publicados inmutables; caches derivadas se versionan por `semanticEpoch`/document fingerprint y no se confunden con source-of-truth.
- **Tipo de refactor:** Cache/projection extraction.
- **Dependencias actuales:** completion, queryContext, semantic tokens, diagnostics, scope resolution tests.
- **Dependencias objetivo:** consumers leen por API readonly sin mutaciones internas al estado publicado.
- **Pasos de migración:** introducir helper de indexación; construir índice al publish o cachearlo fuera de state; adaptar getters; agregar test de no-mutación; medir coste.
- **Tests de paridad requeridos:** scope resolution existentes siguen pasando.
- **Tests de conformidad requeridos:** getter readonly no altera stats/estructura observable de published state.
- **Estrategia de rollback:** mantener lazy cache externa por epoch si publish-time index es caro.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** no quedan writes a `publishedState` en métodos readonly.
- **Docs afectadas:** [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md), [docs/testing.md](../testing.md), specs P0.
- **Métricas afectadas:** tiempo de publish, tiempo de primer scope lookup, memoria scope index.
- **Riesgos:** coste de indexación adelantado; duplicación temporal de memoria si se extrae cache.
- **Specs de backlog requeridas:** `PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01`.

### Refactorización — REF-3-2 — Policy echo y cacheability completa en SemanticQueryResult

- **Ubicación actual:** `src/server/features/semanticQueryFacade.ts`, `src/server/features/queryContext.ts`, `src/server/features/queryScopePolicy.ts`, `src/server/knowledge/resolution/semanticQueryResult.ts`.
- **Problema actual:** query policy real se usa para resolver, pero el result envelope hardcodea allow-all y `cacheability` solo incluye epoch.
- **Ubicación objetivo:** `SemanticQueryFacade.resolveTarget` construye `SemanticQuery` desde `QueryConsumerPolicy` efectiva.
- **Diseño objetivo:** result incluye consumer, budget, cap, sourceOrigin policy, readiness/confidence requirements, epoch y fingerprint cuando aplique.
- **Tipo de refactor:** DTO contract hardening.
- **Dependencias actuales:** hover/definition/completion/signature/references/rename/diagnostics/tokens/current context.
- **Dependencias objetivo:** explainability, cache keys y read-only surfaces dependen del envelope común.
- **Pasos de migración:** añadir `policy` a `DocumentQueryContext` o resolverla de nuevo en facade; copiar fields al result; ampliar tests; ajustar snapshots si existen.
- **Tests de paridad requeridos:** resultados de target no cambian para consumers existentes.
- **Tests de conformidad requeridos:** policies de completion/references/rename/diagnostics reflejan `allowStaging/allowGenerated/allowExternal` esperados.
- **Estrategia de rollback:** mantener fields nuevos opcionales primero.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** no hay hardcoded allow-all en facade.
- **Docs afectadas:** target architecture, testing, public API docs si se expone.
- **Métricas afectadas:** none/runtime negligible; cache hit explainability.
- **Riesgos:** consumers que serializan result pueden necesitar tolerar fields nuevos.
- **Specs de backlog requeridas:** `PB-ARCH-P0-SEMANTIC-QUERY-POLICY-ECHO-01`.

### Refactorización — REF-3-3 — Matriz de convergencia de providers semánticos

- **Ubicación actual:** `src/server/features/semanticQueryFacade.ts`, `completion.ts`, `references.ts`, `diagnostics.ts`, `semanticTokens.ts`, `workspaceSymbols.ts`, `currentObjectContext.ts`, `queryContext.ts`.
- **Problema actual:** cada provider combina facade, KB, graph, catalog y scans de forma local.
- **Ubicación objetivo:** facade/subfacades/projections por consumer con allowlist de accesos estructurales.
- **Diseño objetivo:** identity/confidence/evidence/sourceOrigin salen de `SemanticQueryResult` o modelos derivados; loops de providers usan projections bounded.
- **Tipo de refactor:** Feature convergence.
- **Dependencias actuales:** todos los LSP providers y read-only APIs.
- **Dependencias objetivo:** cross-surface golden matrix, cache keys y performance budgets.
- **Pasos de migración:** documentar allowlist; migrar references primero; migrar completion member/global pools; añadir token projection; separar diagnostics tiers; deprecar raw `ResolvedTargetInfo` fuera de facade internals.
- **Tests de paridad requeridos:** hover/definition/completion/references same-target matrix.
- **Tests de conformidad requeridos:** AST/import-based no-bypass con allowlist.
- **Estrategia de rollback:** mantener wrappers raw internos mientras migran providers.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** no providers consumen `ResolvedTargetInfo` directamente salvo allowlist interna.
- **Docs afectadas:** target architecture, testing, backlog PHASE 13.
- **Métricas afectadas:** provider latency, resolve count, cache hit ratio, result cap adherence.
- **Riesgos:** reducción de velocidad si se fuerza facade en fast paths que deben seguir estructurales; por eso se requiere allowlist.
- **Specs de backlog requeridas:** `PB-ARCH-P0-SEMANTIC-FACADE-CONVERGENCE-MATRIX-01`.

### Candidatos de backlog

- `PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01` — published state readonly o scope index derivado/versionado.
- `PB-ARCH-P0-SEMANTIC-QUERY-POLICY-ECHO-01` — `SemanticQueryResult` transporta la policy efectiva del consumer.
- `PB-ARCH-P0-SEMANTIC-FACADE-CONVERGENCE-MATRIX-01` — matriz de provider DTO/bypass/budget/cap/conformance.
- `PB-ARCH-P0-CROSS-SURFACE-GOLDEN-MATRIX-01` — test same-target hover/definition/completion/references/signature/tokens.
- `PB-ARCH-P0-SEMANTIC-CONFORMANCE-STRUCTURAL-GATES-01` — gates AST/import-based con allowlist.

### Documentación actualizada

- Actualizado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con `FINDING-008`, `FINDING-009` y `FINDING-010`.
- Actualizado este reporte con matriz de consumers, decisiones y refactorizaciones PHASE 3.
- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) con límites de snapshot/facade/policy/conformance.
- No se actualizó [docs/backlog.md](../backlog.md) porque la generación/consolidación del backlog está bloqueada hasta PHASE 13 por el prompt.

### Tests o validación

- No se ejecutaron tests.
- Evidencia inspeccionada directamente: `KnowledgeBase.ts`, `semanticSnapshot.ts`, `analysisCache.ts`, `semanticQueryFacade.ts`, `semanticQueryResult.ts`, `queryContext.ts`, `queryScopePolicy.ts`, `references.ts`, `completion.ts`, `semanticTokens.ts`, `diagnostics.ts`, `workspaceSymbols.ts`, `currentObjectContext.ts`, `referenceSourcePool.ts`, `semanticArchitectureConformance.test.ts`.

### Preguntas abiertas

- Confirmar si se prefiere construir `scopeIndex` en publish o cache derivada por epoch/fingerprint.
- Confirmar qué raw APIs de `SemanticQueryFacade` deben mantenerse temporalmente y cuáles pasan a internal.
- Confirmar si `SemanticQueryResult.cacheability` debe incluir fingerprint/sourceOrigin/locale/projection para todos los consumers o solo los cacheables.
- Confirmar si workspace symbols queda oficialmente como query indexada permitida sin facade.

### Evidencias

- **Referencias de código:** `src/server/knowledge/KnowledgeBase.ts`; `src/server/analysis/semanticSnapshot.ts`; `src/server/analysis/analysisCache.ts`; `src/server/features/semanticQueryFacade.ts`; `src/server/knowledge/resolution/semanticQueryResult.ts`; `src/server/features/queryContext.ts`; `src/server/features/queryScopePolicy.ts`; `src/server/features/references.ts`; `src/server/features/completion.ts`; `src/server/features/semanticTokens.ts`; `src/server/features/diagnostics.ts`; `src/server/features/currentObjectContext.ts`; `src/server/features/workspaceSymbols.ts`; `src/server/features/referenceSourcePool.ts`.
- **Referencias documentales:** [docs/semantic-design-target.md](../semantic-design-target.md); [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md); [specs/PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01.md](../../specs/PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01.md); [specs/PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01.md](../../specs/PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01.md); [specs/PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01.md](../../specs/PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01.md).
- **Referencias runtime:** no disponibles en PHASE 3.
- **Referencias de test:** [test/server/unit/semanticArchitectureConformance.test.ts](../../test/server/unit/semanticArchitectureConformance.test.ts) inspeccionado; no ejecutado.
- **Referencias externas:** principios PHASE 1 de bounded work, snapshots, confidence and evidence, incremental query systems.

### Referencias de fase

- **Referencias de código:** KnowledgeBase, snapshots, facade, query policy, providers LSP/read-only.
- **Referencias documentales:** semantic source-of-truth, query contract, conformance tests, instant target.
- **Referencias runtime:** ninguna.
- **Referencias de investigación externa:** LSP/VS Code/Node/TypeScript/rust-analyzer/Salsa/Fowler/Thoughtworks como principios ya cerrados en PHASE 1.
- **Referencias de candidatos backlog:** `PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01`, `PB-ARCH-P0-SEMANTIC-QUERY-POLICY-ECHO-01`, `PB-ARCH-P0-SEMANTIC-FACADE-CONVERGENCE-MATRIX-01`, `PB-ARCH-P0-CROSS-SURFACE-GOLDEN-MATRIX-01`, `PB-ARCH-P0-SEMANTIC-CONFORMANCE-STRUCTURAL-GATES-01`.

## PHASE 4 — Indexing and discovery lifecycle audit

### Alcance ejecutado

- Se auditó startup, `onInitialize`/`onInitialized`, warm cache restore, discovery, workspace topology, indexing, open/change/close document, watchers, invalidación, scheduler/cancelación, file enumeration y publication hacia `KnowledgeBase`.
- Se inspeccionaron `lifecycleHandlers`, `server`, `discovery`, `workspaceState`, topology/project routing, `workspaceIndexer`, worker pool, `DocumentCache`, `analysisCache`, `semanticInvalidation`, watcher debounce/intake y tests existentes.
- No se ejecutaron tests; esta fase fue lectura arquitectónica.

### Ciclo de vida observado

| Etapa | Implementación actual | Fortalezas | Riesgos |
| --- | --- | --- | --- |
| Server bootstrap | `server.ts` crea scheduler, caches, KB, catalog, runtime journal, memory pressure policy y conecta `analysisCache` con `DocumentCache`/`KnowledgeBase`. | Client thin; semantic truth vive en server. | Bootstrap acumula muchas responsabilidades en un módulo grande; PHASE 22/24 deberá modularizar. |
| `onInitialize` | `lifecycleHandlers.ts` registra capacidades LSP y captura workspaceFolders/cacheStorage/documentationLocale. | No hace discovery ni scans bloqueantes en initialize. | Correcto para activación rápida. |
| `onInitialized` | Encola `workspace-discovery` como background `critical-initialization`; intenta warm restore, ejecuta `discoverWorkspace`, refresh routing, restore compatible y luego `indexWorkspace`. | Discovery/indexing no bloquean `onInitialize`; hay warm restore y progress readiness. | Warm restore no evita full index si `indexDirty` queda true; critical initialization no se throttlea por latencia. |
| Discovery | `discoverWorkspace` recorre roots/directorios secuencialmente, ignora carpetas conocidas, registra SR*, PBW/PBT/PBL/PBSLN/PBPROJ, parsea topology y PBAutoBuild JSON. | Tolerante, determinista y cancelable entre directorios. | Sin concurrency bounded configurable, sin max nodes/files budget, parse de markers durante traversal. |
| WorkspaceState | Mantiene source files, roots, topology, build files, sourceOrigin, projectRegistry y unified project model. | Cubre PBW/PBT/PBL/PBSLN/PBPROJ y sourceOrigin. | `indexDirty` mezcla cambios de discovery/topology con validez de documentos semánticos. |
| Indexing | `indexWorkspace` prioriza active URI/project/semantic nearby, usa WorkerPool, structural pass, enriched pass, batch publication y cache. | Batches, yields por latency governor, skip de archivos grandes, workers. | Lee/hashea todos los archivos aunque cache warm sea compatible; worker pool no aborta tareas en curso; cancellation se observa entre batches. |
| Open file | `onDidOpen` pinnea cache y llama `publishDiagnosticsNow` síncrono. | Documento activo queda visible rápido en cache. | No es fast path puro; diagnostics full pueden tocar KB/semantic checks. |
| Change file | `onDidChangeContent` analiza documento, upserta KB vía `analysisCache`, calcula invalidation antes/después y agenda diagnostics. | Mantiene active snapshot fresco. | Análisis/cascada inmediata por edit; no debounce de invalidación semántica. |
| Close file | Unpin, cancela diagnostics, invalida plan semántico y caches. | Libera document analysis. | Cierre también puede hacer invalidación transitiva amplia. |
| Watchers | `onDidChangeWatchedFiles` alimenta debouncer 75 ms, maxPending 256; flush se ejecuta como background indexing y `applyWatchedFileEvents`. | Coalescing, massive mode, sourceOrigin rematerialization, project marker/build file support. | `applyWatchedFileEvents` no recibe token; flush cancelado puede seguir procesando. |
| Scheduler | Interactive cancela Near/Background; Near cancela Background; workloads tienen policies preemptible/throttled. | Buen principio de carriles. | `cancelActiveBackground` libera slot antes de que la tarea cancelada termine. |

### Respuestas obligatorias PHASE 4

- **Discovery start triggers:** `onInitialized` dispara discovery si hay workspaceFolders; warm restore se intenta dentro de la misma background task.
- **File watchers:** LSP `onDidChangeWatchedFiles` pasa eventos al debouncer; intake clasifica source/marker/build files.
- **Incremental update:** open/change usa `analysisCache`; watcher source changes analizan documento o saltan si está abierto; marker/build changes refrescan routing.
- **Cache invalidation:** `semanticInvalidation` usa reverseDependencies; serving/hot/context/presentation/codeLens invalidan por URI o global en massive mode.
- **Initial workspace load:** discovery + routing + warm restore + indexWorkspace; readiness/progress publicados.
- **Open file fast path:** existe pin + immediate diagnostics, pero el diagnóstico inmediato es demasiado pesado para el contrato objetivo.
- **Project/lib/PBL/PBT/PBPROJ:** `discovery.ts`, `topology.ts`, `WorkspaceState` y routing cubren PBW/PBT/PBL/PBSLN/PBPROJ; PBAutoBuild JSON se registra como candidato.
- **Large workspace enumeration:** traversal secuencial, cooperative yield, ignored dirs estáticos, sin budget/concurrency configurable.
- **Symbol publication:** `KnowledgeBase` publica structural batch y enriched batch; `DocumentCache` guarda enriched snapshots; epoch cambia al commit.
- **Deferred/background indexing:** discovery/indexing/watchers corren en background; scheduler preempta background, pero el join de cancelación es incompleto.
- **Cancellation/stale handling:** tokens existen y algunas rutas los consultan; watcher intake y worker tasks no son cancelables de extremo a extremo; stale commits dependen de checks cooperativos/manuales.

### Hallazgos registrados

- `FINDING-011` — Warm resume restaura snapshots pero no puede saltar el full index por `indexDirty`.
- `FINDING-012` — La cancelación del scheduler libera el slot background antes de que el trabajo cancelado termine.
- `FINDING-013` — Open/change document ejecuta análisis e invalidación semántica inmediata en el hot path.
- `FINDING-014` — Discovery de workspace es recursivo secuencial y sin budget configurable de enumeración.

### Recomendaciones

- **Recommendation ID:** REC-4-1.
- **Resumen:** Separar dirty state de topology/discovery, document semantic validity y checkpoint validation.
- **Motivo:** `indexDirty` actual bloquea el skip de full index aunque warm restore sea compatible.
- **Área objetivo:** code/tests/cache.
- **Beneficio esperado:** speed/reactivity.
- **Riesgo:** saltar indexación con checkpoint incompleto; mitigarlo con manifest/fingerprint validation.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-INDEX-P0-WARM-RESUME-SKIPS-FULL-INDEX-01`.

- **Recommendation ID:** REC-4-2.
- **Resumen:** Endurecer cancelación background con join cooperativo y generation guards.
- **Motivo:** liberar slot antes de stop real permite solapamientos de indexing/watcher/cache writes.
- **Área objetivo:** runtime/indexer/workspace.
- **Beneficio esperado:** correctness/reactivity.
- **Riesgo:** si se espera demasiado por cancelación, Near/Interactive pueden verse retrasados; usar cancellation deadlines y no publicar stale results.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-RUNTIME-P0-BACKGROUND-CANCELLATION-JOIN-01`.

- **Recommendation ID:** REC-4-3.
- **Resumen:** Convertir open/change en fast path local con semantic work diferido y receipts.
- **Motivo:** `onDidOpen` y `onDidChangeContent` ejecutan diagnostics/analysis/invalidation demasiado pronto.
- **Área objetivo:** handlers/diagnostics/invalidation/scheduler.
- **Beneficio esperado:** speed/reactivity.
- **Riesgo:** diagnostics semánticos pueden llegar más tarde; mitigarlo con Tier 0/1 inmediatos y stale indicators.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-HOTPATH-P0-OPEN-CHANGE-SEMANTIC-DEFER-01`.

- **Recommendation ID:** REC-4-4.
- **Resumen:** Introducir `DiscoveryPlan` bounded con concurrency, ignore policy y partial receipts.
- **Motivo:** traversal secuencial sin budget explícito puede retrasar 10k+ workspaces.
- **Área objetivo:** discovery/workspace/tests/docs.
- **Beneficio esperado:** speed/maintainability.
- **Riesgo:** concurrencia mal limitada puede saturar FS; usar semaphore y telemetry.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-DISCOVERY-P1-BOUNDED-CONCURRENT-DISCOVERY-01`.

- **Recommendation ID:** REC-4-5.
- **Resumen:** Hacer watcher intake token-aware y publicar receipts de massive/backpressure flush.
- **Motivo:** el debouncer mide backpressure, pero el trabajo de flush no es cancelable internamente.
- **Área objetivo:** watcher/runtime/diagnostics.
- **Beneficio esperado:** correctness/reactivity.
- **Riesgo:** eventos cancelados deben reencolarse o invalidar globalmente para no perder cambios.
- **Prioridad:** P1.
- **Candidato backlog:** incluido en `PB-RUNTIME-P0-BACKGROUND-CANCELLATION-JOIN-01` o subitem.

### Refactorizaciones identificadas

### Refactorización — REF-4-1 — Warm resume con skip real de full index

- **Ubicación actual:** `src/server/handlers/lifecycleHandlers.ts`, `src/server/workspace/workspaceState.ts`, `src/server/indexer/workspaceIndexer.ts`, cache checkpoint modules.
- **Problema actual:** restore compatible no marca semantic document set como clean; `indexWorkspace` vuelve a leer/hashear cada archivo.
- **Ubicación objetivo:** `WorkspaceIndexValidity` o `SemanticCheckpointValidation` separado de `WorkspaceState.indexDirty`.
- **Diseño objetivo:** checkpoint compatible restaura KB/DocumentCache, valida discovery/project model y marca semantic index clean; dirty topology obliga routing refresh, no full document pass.
- **Tipo de refactor:** State contract split.
- **Dependencias actuales:** cache store/checkpoint, lifecycle, workspaceState, indexer, performance tests.
- **Dependencias objetivo:** warm start, persisted graph, discovery snapshot validation.
- **Pasos de migración:** añadir flags separados; test restore clean; adaptar `canSkipFullIndex`; registrar readiness warm; mantener fallback full index si manifest mismatch.
- **Tests de paridad requeridos:** indexer cold/warm existentes.
- **Tests de conformidad requeridos:** warm restore no llama `fs.readFile` por cada file cuando fingerprints son válidos.
- **Estrategia de rollback:** si validation falla, full index actual.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** `indexDirty` deja de controlar validez semántica de documentos.
- **Docs afectadas:** target architecture, testing, release/performance docs si se agregan metrics.
- **Métricas afectadas:** startup I/O, warm resume latency, files read, files hashed.
- **Riesgos:** false clean state; mitigar con cache checkpoint metadata estricta.
- **Specs de backlog requeridas:** `PB-INDEX-P0-WARM-RESUME-SKIPS-FULL-INDEX-01`.

### Refactorización — REF-4-2 — Cancelación background joinable y stale-safe

- **Ubicación actual:** `src/server/runtime/scheduler.ts`, `src/server/indexer/workspaceIndexer.ts`, `src/server/indexer/workerPool.ts`, `src/server/workspace/watchedFileIntake.ts`.
- **Problema actual:** el scheduler libera el slot background al solicitar cancelación; worker/intake no tienen abort end-to-end.
- **Ubicación objetivo:** scheduler con estado `cancelling`, token propagation y publish generation guard.
- **Diseño objetivo:** Background cancelado conserva ownership hasta stop; si se permite overlap, cada writer valida generation/epoch antes de commit.
- **Tipo de refactor:** Runtime scheduling hardening.
- **Dependencias actuales:** discovery/indexing/watchers/build workloads.
- **Dependencias objetivo:** lanes, stale guard, runtime journal.
- **Pasos de migración:** no poner active task null hasta `finally`; añadir cancellation callbacks a workerPool; pasar token a watcher intake; test overlap; journal de cancel latency.
- **Tests de paridad requeridos:** scheduler priority/preemption existentes.
- **Tests de conformidad requeridos:** cancel background no permite segundo background incompatible hasta stop.
- **Estrategia de rollback:** mantener policy no-preemptible para critical-init mientras se endurece indexing.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** no hay background writes sin token/generation guard.
- **Docs afectadas:** target architecture, runtime/backpressure docs.
- **Métricas afectadas:** cancel latency, overlapped work count, stale publish blocked.
- **Riesgos:** starvation de background si cancelación no termina; usar deadlines.
- **Specs de backlog requeridas:** `PB-RUNTIME-P0-BACKGROUND-CANCELLATION-JOIN-01`.

### Refactorización — REF-4-3 — Open/change semantic defer

- **Ubicación actual:** `src/server/handlers/documentHandlers.ts`, `src/server/analysis/analysisCache.ts`, `src/server/analysis/diagnosticScheduler.ts`, `src/server/knowledge/semanticInvalidation.ts`.
- **Problema actual:** open/change hacen full diagnostics/analysis/invalidation cascade síncrona.
- **Ubicación objetivo:** `DocumentHotPathController` con tiers y deferred semantic invalidation.
- **Diseño objetivo:** open/change publican snapshot local bounded; semantic diagnostics/cascades se ejecutan en Near/Background con stale guard, debounce y fanout cap.
- **Tipo de refactor:** Hot path split.
- **Dependencias actuales:** diagnostics, serving cache, hot context, codeLens, runtime journal.
- **Dependencias objetivo:** diagnostics tiers, scheduler lanes, open diagnostics republish.
- **Pasos de migración:** separar structural diagnostics; mover semantic plan a scheduler; añadir cap/receipt para transitive invalidation; test latency.
- **Tests de paridad requeridos:** diagnostics existing behavior after scheduled run.
- **Tests de conformidad requeridos:** onDidOpen/onDidChange no exceden hot budget ni ejecutan semantic cascade inline.
- **Estrategia de rollback:** keep current path behind fallback for tests until tiers stabilize.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** no `publishDiagnosticsNow` full semantic en open path.
- **Docs afectadas:** target architecture, testing, diagnostics docs.
- **Métricas afectadas:** open latency, change latency, invalidation fanout, diagnostics freshness.
- **Riesgos:** delayed diagnostics; stale UI receipts required.
- **Specs de backlog requeridas:** `PB-HOTPATH-P0-OPEN-CHANGE-SEMANTIC-DEFER-01`.

### Candidatos de backlog

- `PB-INDEX-P0-WARM-RESUME-SKIPS-FULL-INDEX-01` — warm cache compatible evita full read/hash/index pass.
- `PB-RUNTIME-P0-BACKGROUND-CANCELLATION-JOIN-01` — scheduler cancelación joinable, token-aware watcher/indexer y stale-safe commits.
- `PB-HOTPATH-P0-OPEN-CHANGE-SEMANTIC-DEFER-01` — open/change local-first y semantic work diferido.
- `PB-DISCOVERY-P1-BOUNDED-CONCURRENT-DISCOVERY-01` — discovery plan bounded/concurrent/configurable con receipts.
- `PB-INDEX-P1-DEPENDENCY-KEYS-IN-SNAPSHOT-01` — candidato condicionado para precomputar dependency keys en snapshots si PHASE 5/6 confirma coste.

### Documentación actualizada

- Actualizado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con `FINDING-011` a `FINDING-014`.
- Actualizado este reporte con lifecycle matrix, respuestas obligatorias y refactorizaciones PHASE 4.
- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) con warm resume, cancelación background y hot path open/change.
- No se actualizó [docs/backlog.md](../backlog.md) porque la generación/consolidación del backlog está bloqueada hasta PHASE 13 por el prompt.

### Tests o validación

- No se ejecutaron tests.
- Tests existentes inspeccionados por inventario: `workspaceIndexer.test.ts`, `watcherPipeline.test.ts`, `watchedFileIntake.test.ts`, `watchedFileChangeBridge.test.ts`, `fileWatcherDebouncer.test.ts`, `analysisCache.test.ts`, `documentCache.test.ts`, `large-workspace-incremental.perf.test.ts`, `indexer.perf.test.ts`, `discovery.perf.test.ts`.

### Preguntas abiertas

- Confirmar si `critical-initialization` debe seguir no preemptible durante discovery o dividirse en restore/discovery/indexing con policies distintas.
- Confirmar si cache checkpoint metadata ya puede validar fingerprints sin leer todos los archivos o si requiere manifest adicional.
- Confirmar el fanout máximo aceptable para invalidación transitiva inmediata en open/change.
- Confirmar si discovery debe publicar roots/source files incrementalmente o solo al final del traversal.

### Evidencias

- **Referencias de código:** `src/server/handlers/lifecycleHandlers.ts`; `src/server/handlers/documentHandlers.ts`; `src/server/server.ts`; `src/server/workspace/discovery.ts`; `src/server/workspace/workspaceState.ts`; `src/server/workspace/topology.ts`; `src/server/workspace/projectRegistry.ts`; `src/server/workspace/watchedFileIntake.ts`; `src/server/system/fileWatcherDebouncer.ts`; `src/server/indexer/workspaceIndexer.ts`; `src/server/indexer/workerPool.ts`; `src/server/knowledge/DocumentCache.ts`; `src/server/analysis/analysisCache.ts`; `src/server/knowledge/semanticInvalidation.ts`; `src/server/runtime/scheduler.ts`; `src/server/runtime/backpressurePolicy.ts`.
- **Referencias documentales:** [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md); [docs/performance-budget.md](../performance-budget.md); [docs/testing.md](../testing.md); [docs/architecture-status.md](../architecture-status.md).
- **Referencias runtime:** no disponibles en PHASE 4.
- **Referencias externas:** Node/event-loop/worker principles ya cerrados en PHASE 1.

### Referencias de fase

- **Referencias de código:** lifecycle, discovery, workspaceState, indexer, workers, handlers, watcher intake, scheduler, caches.
- **Referencias documentales:** instant target, performance/testing architecture.
- **Referencias runtime:** ninguna.
- **Referencias de candidatos backlog:** `PB-INDEX-P0-WARM-RESUME-SKIPS-FULL-INDEX-01`, `PB-RUNTIME-P0-BACKGROUND-CANCELLATION-JOIN-01`, `PB-HOTPATH-P0-OPEN-CHANGE-SEMANTIC-DEFER-01`, `PB-DISCOVERY-P1-BOUNDED-CONCURRENT-DISCOVERY-01`, `PB-INDEX-P1-DEPENDENCY-KEYS-IN-SNAPSHOT-01`.

## PHASE 5 — Cache, invalidation and persistence audit

### Alcance ejecutado

- Se auditó cache documental, analysis cache, serving cache, presentation/negative caches, CodeLens cache, HotContext cache, stale guards, memory pressure, cache key contract, persisted checkpoint/journal/serving snapshot y tests asociados.
- Se inspeccionaron `DocumentCache`, `KnowledgeBase` export/restore, `analysisCache`, `ServingCache`, `cacheKeyContract`, `ActiveDocumentServingSnapshot`, `InteractiveServingPipeline`, `PresentationCache`, `CodeLensResultCache`, `semanticCacheRuntimeController`, `cacheStore`, `cacheCheckpoint`, lifecycle persist/restore y handlers de features/documentos/watchers.
- No se ejecutaron tests; esta fase fue lectura arquitectónica.

### Inventario de caches

| Cache | Owner actual | Key/versionado | Eviction | Persistencia | Riesgo principal |
| --- | --- | --- | --- | --- | --- |
| `DocumentCache` | `knowledge/DocumentCache.ts` | URI + `version` hash; snapshot per document. | LRU con pinned entries; default server 512. | Exporta records a checkpoint. | Se usa como corpus persistido aunque es LRU interactiva. |
| `analysisCache` | `analysis/analysisCache.ts` | URI normalizada + document version + `sourceOrigin`; fallback por fingerprint. | LRU global 256. | Propaga upsert/remove a `DocumentCache`, `KnowledgeBase` y journal sink. | Fire-and-forget persistence; hot path hace KB writes. |
| `KnowledgeBase.publishedState` | `knowledge/KnowledgeBase.ts` | `semanticEpoch`, maps por symbol/kind/container/URI/dependencies. | Sin eviction; snapshot publicado. | Restore/export, pero lifecycle persiste desde `DocumentCache`. | Snapshot autoritativo no es el input directo del checkpoint. |
| `ServingCache` | `knowledge/ServingCache.ts` | Legacy `makeKey`; structured keys con class/feature/uri/doc/kb/fp/sourceOrigin/locale/position/context/trigger/extra. | LRU particionada por feature; TTL opcional. | `serving-cache.json`, filtrado por kbVersion. | Contrato structured key asimétrico para `prefix`. |
| `PresentationCache` | `serving/presentationCache.ts` | Structured key externo; invalidación por `uri:`. | LRU simple. | No persistida. | Invalidation depende de que las keys incluyan segmento `uri:`. |
| Negative caches | `server.ts` + `PresentationCache` | Completion-resolve/definition/hover keys. | LRU simple. | No persistida. | Deben seguir locale/sourceOrigin/fingerprint del key contract. |
| `HotContextCache` | `knowledge/HotContextCache.ts` | active URI + global semanticEpoch; inherited members por type name. | Cap LRU 128 inherited types. | No persistida. | Over-invalidation por epoch global. |
| `CodeLensResultCache` | `features/codeLensResultCache.ts` | URI bucket + key externo con doc version, KB version/epoch, readiness, source count. | LRU por URI 128. | No persistida. | Key no usa source set fingerprint; mitigado por invalidación watcher global. |
| CacheStore checkpoint | `cache/cacheStore.ts` | workspaceKey por roots; metadata mode/root/projectStats/discovery. | TTL/workspace bytes/journal thresholds. | JSON checkpoint/journal/project partitions. | Journal writes no serializadas; checkpoint input recortado por LRU. |
| Serving snapshot persistence | `cache/servingCachePersistence.ts` | Filtra entradas por kbVersion. | Depende de ServingCache LRU. | `serving-cache.json`. | Útil solo si KB epoch restaurada coincide. |

### Fortalezas observadas

- Las keys interactivas modernas incluyen `documentVersion`, `kbVersion`, `documentFingerprint`, `sourceOrigin` y `locale`, alineadas con el contrato objetivo de presentation-only localization.
- `ServingCache` ya está particionada por feature para evitar que completion expulse hover en exceso.
- `DocumentCache` tiene pinned tier, LRU, estadísticas e interning.
- `cacheStore` ya tiene schema version, metadata checks, corruption fallback, project partitions y retention/maintenance.
- `InteractiveServingPipeline` usa stale guard antes de escribir y antes de devolver resultados computados.

### Brechas PHASE 5

- La persistencia semántica no tiene owner separado del cache de memoria: checkpoint usa `DocumentCache.exportDocumentRecords()` y hereda su capacidad LRU.
- Las escrituras del journal se hacen reescribiendo JSON completo sin cola; varios `appendJournalMutation` en vuelo pueden terminar fuera de orden.
- `cacheKeyContract` no es simétrico: `prefix` aparece en descriptor/matcher pero no en la key construida.
- `HotContextCache` no modela dependency-specific freshness; usa epoch global.
- No hay un registry central de caches que declare owner, key discriminators, invalidation policy, memory budget, persistence y stale behavior como objeto testeable.

### Hallazgos registrados

- `FINDING-015` — El checkpoint semántico persiste solo la LRU de `DocumentCache`, no el corpus indexado completo.
- `FINDING-016` — Escrituras de journal/checkpoint no están serializadas y pueden perder mutaciones concurrentes.
- `FINDING-017` — El contrato de cache key declara `prefix` pero el builder no lo incluye en la key.
- `FINDING-018` — `HotContextCache` usa epoch global y se invalida por cambios no relacionados.

### Recomendaciones

- **Recommendation ID:** REC-5-1.
- **Resumen:** Separar persistencia semántica de caches LRU de memoria.
- **Motivo:** una LRU de 512 entradas no puede ser el checkpoint de un workspace 10k+.
- **Área objetivo:** cache/indexer/lifecycle/KnowledgeBase.
- **Beneficio esperado:** correctness/speed.
- **Riesgo:** mayor consumo de disco; mitigarlo con particiones por proyecto y compaction.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-CACHE-P0-PERSISTED-SEMANTIC-CORPUS-SEPARATE-FROM-LRU-01`.

- **Recommendation ID:** REC-5-2.
- **Resumen:** Añadir cola de escritura y flush explícito para cache persistence.
- **Motivo:** append concurrente puede perder mutaciones por last-write-wins físico.
- **Área objetivo:** cacheStore/semanticCacheRuntimeController/analysisCache.
- **Beneficio esperado:** correctness/maintainability.
- **Riesgo:** backpressure en hot path; mitigarlo con queue no bloqueante, batching y error telemetry.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-CACHE-P0-SERIALIZED-PERSISTENCE-WRITES-01`.

- **Recommendation ID:** REC-5-3.
- **Resumen:** Convertir cache key contract en spec ejecutable con simetría obligatoria.
- **Motivo:** campos declarados deben afectar key y stale matcher por igual.
- **Área objetivo:** serving/cacheKeyContract/tests.
- **Beneficio esperado:** correctness.
- **Riesgo:** invalidar snapshots existentes; acceptable por schema/key version si cambia formato.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-CACHE-P1-CACHE-KEY-CONTRACT-SYMMETRY-01`.

- **Recommendation ID:** REC-5-4.
- **Resumen:** Versionar HotContext por dependency/fingerprint en vez de epoch global.
- **Motivo:** cambios no relacionados no deben vaciar inherited members del documento activo.
- **Área objetivo:** HotContextCache/ActiveDocumentServingSnapshot/providers.
- **Beneficio esperado:** speed/reactivity.
- **Riesgo:** stale inherited members si el dependency descriptor es incompleto; empezar conservador con ancestor/dependency keys.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-CACHE-P1-HOT-CONTEXT-DEPENDENCY-VERSIONING-01`.

- **Recommendation ID:** REC-5-5.
- **Resumen:** Crear `CacheRegistry` declarativo.
- **Motivo:** hoy owner/key/invalidation/memory/persistence están repartidos entre módulos.
- **Área objetivo:** cache/runtime/docs/tests.
- **Beneficio esperado:** maintainability/correctness.
- **Riesgo:** abstracción prematura; limitarlo a metadata + fitness tests, no reescribir todas las caches de golpe.
- **Prioridad:** P2.
- **Candidato backlog:** `PB-CACHE-P2-CACHE-REGISTRY-FITNESS-01`.

### Refactorizaciones identificadas

### Refactorización — REF-5-1 — Persisted semantic corpus store independiente de `DocumentCache`

- **Ubicación actual:** `src/server/handlers/lifecycleHandlers.ts`, `src/server/knowledge/DocumentCache.ts`, `src/server/cache/cacheStore.ts`, `src/server/indexer/workspaceIndexer.ts`.
- **Problema actual:** checkpoint semántico exporta una LRU de memoria.
- **Ubicación objetivo:** `src/server/cache/semanticCorpusStore.ts` o writer integrado en `cacheStore` con input desde `KnowledgeBase`/indexer.
- **Diseño objetivo:** el indexer/analysis pipeline escribe records persistibles al corpus store; `DocumentCache` solo decide hot/warm memory retention.
- **Tipo de refactor:** ownership split.
- **Dependencias actuales:** lifecycle persist/restore, DocumentCache restore, KnowledgeBase restore, project partitions.
- **Dependencias objetivo:** warm resume PHASE 4, checkpoint manifest PHASE 18/19.
- **Pasos de migración:** agregar store; persistir desde KB/export completo o write-through del indexer; mantener DocumentCache restore como warm memory hydration; tests con capacidad LRU baja.
- **Tests de paridad requeridos:** cacheStore restore, lifecycle warm restore.
- **Tests de conformidad requeridos:** checkpoint conserva más documentos que DocumentCache capacity.
- **Estrategia de rollback:** fallback a full index si corpus store falla.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** lifecycle deja de usar `documentCache.exportDocumentRecords()` como fuente del checkpoint semántico.
- **Docs afectadas:** target architecture, performance budget, testing.
- **Métricas afectadas:** restored documents, persisted documents, checkpoint bytes, warm full-index skip.
- **Riesgos:** disco y compaction.
- **Specs de backlog requeridas:** `PB-CACHE-P0-PERSISTED-SEMANTIC-CORPUS-SEPARATE-FROM-LRU-01`.

### Refactorización — REF-5-2 — Cache write queue serializada

- **Ubicación actual:** `src/server/cache/cacheStore.ts`, `src/server/cache/semanticCacheRuntimeController.ts`, `src/server/analysis/analysisCache.ts`.
- **Problema actual:** writes JSON de journal/checkpoint pueden solaparse y perder mutaciones.
- **Ubicación objetivo:** `CacheWriteQueue` con operaciones ordenadas por workspace/partition y `flush()`.
- **Diseño objetivo:** append/persist/maintenance se encadenan en una promesa interna; maintenance espera flush; shutdown/lifecycle puede pedir flush explícito.
- **Tipo de refactor:** persistence concurrency guard.
- **Dependencias actuales:** cacheStore, runtime controller, analysisCache sink.
- **Dependencias objetivo:** runtime journal, backpressure policy.
- **Pasos de migración:** encapsular writes; cambiar append para devolver queued promise; añadir tests concurrentes; reportar pending/failed writes.
- **Tests de paridad requeridos:** cacheStore unit actuales.
- **Tests de conformidad requeridos:** concurrent append restore completo; maintenance no compacta con writes pendientes.
- **Estrategia de rollback:** deshabilitar persistence y rebuild full.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** no quedan `tryWriteJson` de journal/checkpoint fuera de queue.
- **Docs afectadas:** target architecture, troubleshooting cache.
- **Métricas afectadas:** pending writes, write latency, failed writes, compaction wait.
- **Riesgos:** write queue growth bajo edición intensa.
- **Specs de backlog requeridas:** `PB-CACHE-P0-SERIALIZED-PERSISTENCE-WRITES-01`.

### Refactorización — REF-5-3 — Cache key contract executable matrix

- **Ubicación actual:** `src/server/serving/cacheKeyContract.ts`, `test/server/unit/cacheKeyContract.test.ts`.
- **Problema actual:** descriptor y matcher pueden divergir.
- **Ubicación objetivo:** generador único de fragments + test matrix por campo.
- **Diseño objetivo:** cada campo declarado tiene policy `required/optional/feature-specific`, `keyFragment`, `staleMatcherFragment` y tests automáticos.
- **Tipo de refactor:** contract hardening.
- **Dependencias actuales:** ServingCache, PresentationCache, feature handlers.
- **Dependencias objetivo:** CacheRegistry opcional.
- **Pasos de migración:** añadir `prefix:` o retirar campo; crear matrix; versionar format si necesario.
- **Tests de paridad requeridos:** cache key existing tests.
- **Tests de conformidad requeridos:** cada discriminador cambia key y stale matcher encuentra key compatible.
- **Estrategia de rollback:** mantener parser legacy de keys.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** no hay campos de descriptor sin fragment test.
- **Docs afectadas:** target architecture cache model.
- **Métricas afectadas:** cache hit correctness.
- **Riesgos:** key churn.
- **Specs de backlog requeridas:** `PB-CACHE-P1-CACHE-KEY-CONTRACT-SYMMETRY-01`.

### Candidatos de backlog

- `PB-CACHE-P0-PERSISTED-SEMANTIC-CORPUS-SEPARATE-FROM-LRU-01` — checkpoint semántico independiente de `DocumentCache` LRU.
- `PB-CACHE-P0-SERIALIZED-PERSISTENCE-WRITES-01` — cola de writes, flush y compaction safe.
- `PB-CACHE-P1-CACHE-KEY-CONTRACT-SYMMETRY-01` — simetría builder/matcher/tests para key descriptors.
- `PB-CACHE-P1-HOT-CONTEXT-DEPENDENCY-VERSIONING-01` — hot context versionado por dependencia/fingerprint.
- `PB-CACHE-P2-CACHE-REGISTRY-FITNESS-01` — registry declarativo de caches y fitness tests.

### Documentación actualizada

- Actualizado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con `FINDING-015` a `FINDING-018`.
- Actualizado este reporte con inventario, brechas y refactorizaciones PHASE 5.
- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) con separación LRU/persistencia, write queue y cache registry.
- No se actualizó [docs/backlog.md](../backlog.md) porque la generación/consolidación del backlog está bloqueada hasta PHASE 13 por el prompt.

### Tests o validación

- No se ejecutaron tests.
- Tests inspeccionados por inventario: `cacheKeyContract.test.ts`, `servingCache.test.ts`, `servingCachePersistence.test.ts`, `servingCacheRuntime.test.ts`, `servingCacheFlushCoordinator.test.ts`, `cacheStore.test.ts`, `cacheStoreCorruptionFuzz.test.ts`, `documentCache.test.ts`, `analysisCache.test.ts`, `hotContextCache.test.ts`, `codeLensResultCache.test.ts`, `cachePersistence.test.ts`.

### Preguntas abiertas

- Confirmar si `KnowledgeBase.exportDocumentRecords()` debe convertirse en fuente de checkpoint completo o si el corpus store debe ser write-through desde el indexer.
- Confirmar presupuesto de disco aceptable para checkpoint particionado en 10k+ archivos.
- Confirmar política de error para write queue: bloquear warm cache, deshabilitar persistence o degradar con warning.
- Confirmar si `prefix` es campo futuro de completion o debe retirarse del contrato hasta tener consumer.

### Evidencias

- **Referencias de código:** `src/server/knowledge/DocumentCache.ts`; `src/server/knowledge/KnowledgeBase.ts`; `src/server/analysis/analysisCache.ts`; `src/server/knowledge/ServingCache.ts`; `src/server/serving/cacheKeyContract.ts`; `src/server/serving/activeDocumentServingSnapshot.ts`; `src/server/serving/interactiveServingPipeline.ts`; `src/server/serving/presentationCache.ts`; `src/server/features/codeLensResultCache.ts`; `src/server/cache/cacheStore.ts`; `src/server/cache/cacheCheckpoint.ts`; `src/server/cache/semanticCacheRuntimeController.ts`; `src/server/cache/servingCachePersistence.ts`; `src/server/runtime/memoryBudgets.ts`; `src/server/runtime/memoryPressurePolicy.ts`; `src/server/server.ts`.
- **Referencias documentales:** [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md); [docs/performance-budget.md](../performance-budget.md); [docs/testing.md](../testing.md).
- **Referencias runtime:** ninguna.
- **Referencias externas:** no requeridas en PHASE 5.

### Referencias de fase

- **Referencias de código:** caches, cache store, persistence, feature handlers, runtime memory pressure.
- **Referencias documentales:** instant target, performance/testing docs.
- **Referencias runtime:** ninguna.
- **Referencias de candidatos backlog:** `PB-CACHE-P0-PERSISTED-SEMANTIC-CORPUS-SEPARATE-FROM-LRU-01`, `PB-CACHE-P0-SERIALIZED-PERSISTENCE-WRITES-01`, `PB-CACHE-P1-CACHE-KEY-CONTRACT-SYMMETRY-01`, `PB-CACHE-P1-HOT-CONTEXT-DEPENDENCY-VERSIONING-01`, `PB-CACHE-P2-CACHE-REGISTRY-FITNESS-01`.

## PHASE 6 — Provider hot path audit

### Alcance ejecutado

- Se auditó la ruta caliente de providers y superficies interactivas: hover, completion, completion resolve, signature help, definition, references, rename, linked editing, document symbols, workspace symbols, diagnostics, semantic tokens, code actions, Current Object Context, diagnostics explainability, Object Explorer y runtime health/status.
- Se inspeccionaron los entrypoints principales en `src/server/handlers/featureHandlers.ts`, `src/server/handlers/documentHandlers.ts`, `src/server/handlers/reportCommandHandlers.ts`, `src/server/handlers/runtimeCommandHandlers.ts`, providers bajo `src/server/features/*` y vistas cliente de Object Explorer/current object/diagnostics explainability.
- No se aplicaron cambios de código ni se ejecutaron tests; esta fase fue auditoría documental.

### Provider matrix

| Provider/surface | Entrypoint | Fuente de datos | Facade/proyección | Scans/reparse en request | Cache/stale/cancel | Budget/metrics/tests | Estado PHASE 6 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hover | `registerHoverHandler` | active document snapshot, KB, catalog, hot context | usa serving pipeline y query context | bounded al documento/posición | serving cache, stale guard, readiness, scheduler | timing e interactive serving stats | Adecuado; vigilar `HotContextCache` por `FINDING-018`. |
| Signature Help | `registerSignatureHelpHandler` | active document, KB/catalog | serving pipeline + facade/query context | bounded a posición | serving cache, stale guard, scheduler | timing/stats | Adecuado; depende de policy/facade convergence de `FINDING-010`. |
| Completion | `registerCompletionHandler` | active document, KB, catalog, hot context | serving pipeline + query context; también scopes/KB directos | puede consultar scopes/members/queryEntities | serving cache, stale guard, scheduler | timing/stats | Parcial; cubierto por `FINDING-010`, `FINDING-017`, `FINDING-018`. |
| Completion Resolve | `registerCompletionHandler` resolve path | resolve data, KB/catalog | presentation/serving cache | no workspace scan observado | cache/negative cache/stale checks | timing/stats | Parcial; fingerprint/epoch sigue en `FINDING-002`. |
| Definition | `registerDefinitionHandler` | active document, KB, graph, catalog | custom serving equivalent + `provideDefinition` | bounded a posición | cache/negative cache/stale guard/scheduler | timing/stats | Bastante alineado; aún no usa un adapter común como hover/completion. |
| References | `registerReferencesHandler` | source pool por policy, open docs/files, KB/graph | `SemanticQueryFacade` + textual scan fallback | lee fuentes de proyecto/workspace y escanea cada línea; re-resolve por match | readiness only; no scheduler/cache/stale/cancel | timing parcial; sin source-count gate | Violación: `FINDING-003`. |
| Rename | `registerRenameHandlers` | source pool por policy, KB/graph/catalog | facade + `provideReferences` | igual que references para edit completo | readiness only; no scheduler/cache/stale/cancel | sin métricas específicas de pool | Violación compartida con references; requiere adapter fino junto a `FINDING-003`. |
| Linked Editing | `registerLinkedEditingHandler` | documento activo | facade + `provideReferences` con source único | escanea documento activo y re-resolve por match | readiness only; no scheduler/cache/stale/cancel | timing | Riesgo medio; aceptable solo para local variables, pero debe quedar cubierto por refactor de references. |
| Document Symbols | `registerDocumentSymbolHandler` | `getDocumentAnalysis`, snapshot, scopes/facts | snapshot local, no facade | analiza si falta cache y ejecuta reconciliación completa | scheduler, pero sin serving cache/stale/token | timing y runtime journal de reconciliación | Violación: `FINDING-022`. |
| Workspace Symbols | `registerWorkspaceSymbolHandler` | `KnowledgeBase.queryEntities` | KB buckets directos | recorre buckets hasta limit 200 | sin scheduler/cache/stale/cancel | timing simple | Violación: `FINDING-023`. |
| Diagnostics | `documentHandlers` + `diagnosticScheduler` | document analysis, KB/catalog/graph | diagnostics propias + facade en reglas concretas | open/change/full diagnostics pueden analizar y validar semántica | scheduler para diagnostics, pero open/change ya hace trabajo pesado | timing parcial | Ya registrado como `FINDING-013`; PHASE 7 profundizará tiers. |
| Semantic Tokens | `registerSemanticTokensHandler` | `getDocumentAnalysis`, snapshot, KB/catalog/graph | mezcla local/catalog/facade por token | barrido full document por cada full/delta | scheduler, builder; sin cache fingerprint/stale/token | timing | Violación: `FINDING-019`. |
| Code Actions | `registerCodeActionHandler` | diagnostics del contexto + documento activo | no semántica profunda, preflight local | split lines y dynamic string scan en doc actual por diagnostic aplicable | sin scheduler/cache/stale; alcance actual pequeño | sin timing | Riesgo bajo; mantener bounded por diagnostic/código. |
| CodeLens | `registerCodeLensHandler` | entidades callable del documento + source pool | KB direct + references provider | calcula reference counts por símbolo con pool proyecto/workspace | cache por URI/key, readiness; sin cancel/partial | sin timing por source pool | Violación: `FINDING-020`. |
| Current Object Context | `CurrentObjectContextPanel` + `powerbuilder.currentObjectContext` | documento activo, KB/graph/catalog, diagnostics, DW/SQL | near workload; facade en referencias | full diagnostics, bindings, SQL anchors y referencias en cada refresh | debounce cliente; no cache granular/stale/cancel observado | sin budget por sección | Violación: `FINDING-021`. |
| Diagnostics Explainability | `DiagnosticsExplainabilityPanel` | diagnostics publicados del editor activo | cliente local | no scan servidor; map de diagnostics actuales | cache dirty/pending local | sin riesgo relevante | Aceptable; depende de calidad de diagnostics publicados. |
| Object Explorer | `ObjectExplorerProvider` + `semanticWorkspaceManifest` | manifest plano de objetos/símbolos | manifest read-only plano | servidor materializa objects/exportedSymbols; cliente ordena/agrupa todo | pending model local; truncation message | sin paginación/lazy server | Violación ya registrada: `FINDING-001`. |
| Runtime health/status | `powerbuilder.showStats` + status refresh | KB/scheduler/workspace/caches/diagnostics/persistence | runtime report builder | recopila snapshot amplio e inspecciona maintenance | sin TTL/snapshot tier/cancel | comandos/status usan la misma ruta | Violación: `FINDING-024`. |

### Brechas PHASE 6

- Los providers de hover, signature help, completion y definition tienen una base moderna de serving cache/readiness/stale guard; son el patrón a generalizar.
- References, rename, linked editing y CodeLens siguen acoplados a `provideReferences`, que combina source pools amplios, regex textual y re-resolución por match.
- Semantic tokens es el mayor outlier LSP restante: aunque usa scheduler, trata full y delta como recomputación completa y resuelve semántica por identificador.
- Las superficies read-only no son inocuas: Current Object Context y Object Explorer se disparan desde UI y pueden materializar trabajo profundo o payloads grandes.
- Falta una matriz ejecutable de provider contracts: lane, budget, source pool, cache, stale, cancelación, partial/degraded y tests por provider.

### Hallazgos registrados

- `FINDING-003` — References conserva escaneo textual sobre pool de fuentes, confirmado y elevado por PHASE 6.
- `FINDING-019` — Semantic tokens resuelve por identificador en un barrido completo del documento.
- `FINDING-020` — CodeLens calcula reference counts inline con pools de proyecto.
- `FINDING-021` — Current Object Context se recalcula en cambios de selección con trabajo semántico profundo.
- `FINDING-022` — Document Symbols ejecuta análisis/reconciliación completa en el provider interactivo.
- `FINDING-023` — Workspace Symbols escanea buckets de KB sin contrato de cancelación/stale/cache.
- `FINDING-024` — Health/status dashboard arma snapshots pesados en la ruta de refresco de estado.
- Se reutilizan hallazgos previos para diagnostics/open-change (`FINDING-013`), Object Explorer (`FINDING-001`) y hot context/cache/facade drift (`FINDING-010`, `FINDING-018`).

### Recomendaciones

- **Recommendation ID:** REC-6-1.
- **Resumen:** Crear un contrato común de provider adapter para todas las rutas interactivas.
- **Motivo:** solo algunos providers usan serving pipeline con stale/cache/readiness; otros hacen trabajo profundo directo.
- **Área objetivo:** server/features/server handlers/tests.
- **Beneficio esperado:** reactivity/correctness/maintainability.
- **Riesgo:** migrar todo a la vez puede romper comportamiento; hacerlo provider por provider con tests de paridad.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-HOTPATH-P0-PROVIDER-ADAPTER-CONTRACT-01`.

- **Recommendation ID:** REC-6-2.
- **Resumen:** Sacar references/rename/CodeLens de scans textuales directos y moverlos a un índice/proyección de ocurrencias.
- **Motivo:** el pool project-wide multiplicado por símbolos o matches no escala.
- **Área objetivo:** references/rename/codeLens/indexes.
- **Beneficio esperado:** speed/reactivity.
- **Riesgo:** falsos negativos si el índice no conserva casos dinámicos/event literals; mantener fallback degraded con receipts.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-ARCH-P1-REFERENCES-BOUNDED-INDEXED-POOL-01` y `PB-HOTPATH-P0-CODELENS-REFERENCE-COUNTS-PROJECTION-01`.

- **Recommendation ID:** REC-6-3.
- **Resumen:** Rehacer semantic tokens como proyección incremental por fingerprint/range.
- **Motivo:** resolver por identificador en cada full/delta es incompatible con hot path estable.
- **Área objetivo:** semantic tokens/projections/tests.
- **Beneficio esperado:** speed/reactivity.
- **Riesgo:** coloreado semantic degraded temporal si la resolución avanzada se difiere.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-HOTPATH-P1-SEMANTIC-TOKENS-INCREMENTAL-PROJECTION-01`.

- **Recommendation ID:** REC-6-4.
- **Resumen:** Convertir read-only surfaces en proyecciones lazy con secciones y niveles de snapshot.
- **Motivo:** Object Explorer y Current Object Context son UI interactivas y no deben reconstruir mundos completos.
- **Área objetivo:** public API/client views/server projections.
- **Beneficio esperado:** memory/speed/reactivity.
- **Riesgo:** compatibilidad temporal con APIs existentes.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-HOTPATH-P0-CURRENT-OBJECT-CONTEXT-LAZY-PROJECTION-01`, `PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01`, `PB-RUNTIME-P1-STATUS-HEALTH-SNAPSHOT-TIERS-01`.

### Refactorizaciones identificadas

### Refactorización — REF-6-1 — Provider adapter contract común

- **Ubicación actual:** `src/server/handlers/featureHandlers.ts`, providers bajo `src/server/features/*`.
- **Problema actual:** cada provider decide por separado readiness, cache, stale, scheduling y fallback; references/rename/workspace symbols/document symbols/codeLens/semantic tokens no comparten el patrón más seguro.
- **Ubicación objetivo:** `src/server/serving/providerAdapter.ts` o extensión de `InteractiveServingPipeline`.
- **Diseño objetivo:** adapter declara `feature`, `consumer`, `lane`, `budgetMs`, `sourceScope`, `cachePolicy`, `staleGuard`, `cancelPolicy`, `degradedResult`, `metrics` y `testsRequired`.
- **Tipo de refactor:** Provider architecture convergence.
- **Dependencias actuales:** scheduler, serving cache, progress readiness, query policies, runtime journal.
- **Dependencias objetivo:** PHASE 17 fitness functions y provider matrix ejecutable.
- **Pasos de migración:** extraer contrato desde hover/completion/definition; migrar references; migrar semantic tokens/document symbols/workspace symbols; añadir tests de parity y negative gates.
- **Tests de paridad requeridos:** resultados equivalentes en fixtures existentes por provider.
- **Tests de conformidad requeridos:** provider nuevo sin lane/cache/stale/cancel policy falla gate.
- **Estrategia de rollback:** mantener handlers actuales detrás de adapter por provider hasta pasar tests.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** no quedan providers interactivos directos fuera del adapter salvo allowlist estructural.
- **Docs afectadas:** target architecture, testing, performance budget, backlog en PHASE 13.
- **Métricas afectadas:** latency por provider, stale discarded, cache hit, source pool size, degraded count.
- **Riesgos:** exceso de abstracción si se fuerza a providers muy simples; permitir adapters mínimos.
- **Specs de backlog requeridas:** `PB-HOTPATH-P0-PROVIDER-ADAPTER-CONTRACT-01`.

### Refactorización — REF-6-2 — References/Rename indexed occurrence projection

- **Ubicación actual:** `src/server/features/referenceSourcePool.ts`, `src/server/features/references.ts`, `src/server/features/rename.ts`, `src/server/handlers/featureHandlers.ts`.
- **Problema actual:** source pool lee fuentes y `provideReferences` escanea texto/re-resuelve por match en request.
- **Ubicación objetivo:** `ReferenceOccurrenceIndex`/`ReferenceQueryProjection` publicado desde snapshots y alimentado por indexer/analysis cache.
- **Diseño objetivo:** index de ocurrencias por normalized identifier, URI, local range, owner/family key y evidence; references/rename consultan candidatos acotados, validan semantic family y devuelven partial/degraded cuando falta evidencia.
- **Tipo de refactor:** Hot path index extraction.
- **Dependencias actuales:** SemanticQueryFacade, symbolKey, queryScopePolicy, sourceOrigin policy, dynamic string detection.
- **Dependencias objetivo:** CodeLens counts y impact/safe edit pueden reutilizar la misma proyección.
- **Pasos de migración:** construir índice current-document primero; ampliar a project partition; adaptar references; adaptar rename; adaptar CodeLens counts; mantener fallback textual bajo budget.
- **Tests de paridad requeridos:** references/rename actuales en fixtures PB, event literals, locals, members, dynamic string blockers.
- **Tests de conformidad requeridos:** source pool cap, cancelación, no full workspace read en request, result cap y degraded receipt.
- **Estrategia de rollback:** fallback textual solo para documentos no indexados, con warning/degraded.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** `collectReferenceSourcePool` deja de ser llamado por LSP request interactiva normal.
- **Docs afectadas:** target architecture, performance budget, testing.
- **Métricas afectadas:** source files scanned, occurrences considered, facade resolutions per request, latency.
- **Riesgos:** false negatives por PowerBuilder dynamic/event patterns; mantener evidence/confidence.
- **Specs de backlog requeridas:** `PB-ARCH-P1-REFERENCES-BOUNDED-INDEXED-POOL-01`.

### Refactorización — REF-6-3 — Current Object Context lazy projection

- **Ubicación actual:** `src/client/currentObjectContextPanel.ts`, `src/server/handlers/reportCommandHandlers.ts`, `src/server/features/currentObjectContext.ts`.
- **Problema actual:** refresh de selección calcula resumen, diagnostics, DW/SQL/references y related files en un único payload.
- **Ubicación objetivo:** `CurrentObjectProjection` con summary inmediato y secciones lazy (`members`, `diagnostics`, `dataWindowBindings`, `sqlAnchors`, `references`, `relatedFiles`).
- **Diseño objetivo:** el panel pide summary por cursor/fingerprint; cada sección se expande o refresca con budget, stale timestamp y cancelación. Diagnostics full/references no corren en cada cambio de selección.
- **Tipo de refactor:** Read-only surface projection split.
- **Dependencias actuales:** public API, panel model, semantic query facade, diagnostics, DataWindow/SQL submodels.
- **Dependencias objetivo:** support bundles y AI context deben consumir el mismo snapshot con caps explícitos.
- **Pasos de migración:** separar DTO summary; adaptar panel; añadir endpoints/secciones; mantener comando legacy que compone todas las secciones con caps; medir refresh.
- **Tests de paridad requeridos:** payload legacy compuesto equivale a secciones en fixture pequeño.
- **Tests de conformidad requeridos:** selection refresh no ejecuta diagnostics full ni references; caps/receipts por sección.
- **Estrategia de rollback:** API legacy compuesta sigue disponible temporalmente.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** panel no llama API compuesta en eventos de selección.
- **Docs afectadas:** target architecture, public API docs, testing.
- **Métricas afectadas:** selection refresh latency, near queue length, section payload bytes.
- **Riesgos:** UI puede mostrar secciones stale; requiere timestamp/receipt visible en DTO.
- **Specs de backlog requeridas:** `PB-HOTPATH-P0-CURRENT-OBJECT-CONTEXT-LAZY-PROJECTION-01`.

### Candidatos de backlog

- `PB-HOTPATH-P0-PROVIDER-ADAPTER-CONTRACT-01` — contrato común para lane/budget/cache/stale/cancel/degraded por provider.
- `PB-ARCH-P1-REFERENCES-BOUNDED-INDEXED-POOL-01` — references/rename sobre índice/proyección de ocurrencias.
- `PB-HOTPATH-P0-CODELENS-REFERENCE-COUNTS-PROJECTION-01` — CodeLens counts fuera del render interactivo.
- `PB-HOTPATH-P1-SEMANTIC-TOKENS-INCREMENTAL-PROJECTION-01` — semantic tokens incremental/range/delta por fingerprint.
- `PB-HOTPATH-P0-CURRENT-OBJECT-CONTEXT-LAZY-PROJECTION-01` — current object context lazy por secciones.
- `PB-HOTPATH-P1-DOCUMENT-SYMBOLS-PROJECTION-CACHE-01` — document symbols cached por snapshot.
- `PB-HOTPATH-P1-WORKSPACE-SYMBOLS-BOUNDED-PROJECTION-01` — workspace symbols projection cancelable/cacheada.
- `PB-RUNTIME-P1-STATUS-HEALTH-SNAPSHOT-TIERS-01` — niveles de snapshot para status/health/full stats.
- Estos candidatos no se agregan a [docs/backlog.md](../backlog.md) hasta PHASE 13 después de completar PHASE 24.

### Documentación actualizada

- Actualizado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con `FINDING-019` a `FINDING-024` y confirmación de `FINDING-003`.
- Actualizado este reporte con provider matrix obligatoria, recomendaciones y refactorizaciones PHASE 6.
- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) con contrato de provider adapters y proyecciones read-only/status.
- No se actualizó [docs/backlog.md](../backlog.md) porque la generación/consolidación del backlog está bloqueada hasta PHASE 13 por el prompt.

### Tests o validación

- No se ejecutaron tests.
- Tests a diseñar o ampliar: provider adapter conformance, references source pool cap, semantic tokens large document/range, CodeLens reference counts projection, Current Object Context selection refresh, workspace symbols broad query, status snapshot tiers.

### Preguntas abiertas

- Definir qué providers simples pueden quedar en allowlist estructural sin serving cache, y con qué budget medible.
- Confirmar si CodeLens debe mostrar counts diferidos o resolverlos solo bajo comando explícito.
- Confirmar contrato de partial results para references/workspace symbols con LSP/VS Code actual.
- Confirmar si Current Object Context debe conservar API compuesta para herramientas AI o reemplazarse por secciones lazy también en public API.

### Evidencias

- **Referencias de código:** `src/server/handlers/featureHandlers.ts`; `src/server/handlers/documentHandlers.ts`; `src/server/handlers/reportCommandHandlers.ts`; `src/server/handlers/runtimeCommandHandlers.ts`; `src/server/features/references.ts`; `src/server/features/referenceSourcePool.ts`; `src/server/features/rename.ts`; `src/server/features/linkedEditing.ts`; `src/server/features/semanticTokens.ts`; `src/server/features/documentSymbols.ts`; `src/server/features/workspaceSymbols.ts`; `src/server/features/codeActions.ts`; `src/server/features/currentObjectContext.ts`; `src/server/features/semanticWorkspaceManifest.ts`; `src/server/features/diagnostics.ts`; `src/client/objectExplorer.ts`; `src/client/objectExplorerModel.ts`; `src/client/currentObjectContextPanel.ts`; `src/client/diagnosticsExplainabilityPanel.ts`; `src/client/extension.ts`.
- **Referencias documentales:** [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md); [docs/performance-budget.md](../performance-budget.md); [docs/testing.md](../testing.md).
- **Referencias runtime:** ninguna.
- **Referencias externas:** patrones LSP/VS Code investigados en PHASE 1.

### Referencias de fase

- **Referencias de código:** feature handlers, providers, read-only panels, runtime status handlers.
- **Referencias documentales:** instant target, performance/testing docs.
- **Referencias runtime:** ninguna.
- **Referencias de candidatos backlog:** `PB-HOTPATH-P0-PROVIDER-ADAPTER-CONTRACT-01`, `PB-ARCH-P1-REFERENCES-BOUNDED-INDEXED-POOL-01`, `PB-HOTPATH-P0-CODELENS-REFERENCE-COUNTS-PROJECTION-01`, `PB-HOTPATH-P1-SEMANTIC-TOKENS-INCREMENTAL-PROJECTION-01`, `PB-HOTPATH-P0-CURRENT-OBJECT-CONTEXT-LAZY-PROJECTION-01`, `PB-HOTPATH-P1-DOCUMENT-SYMBOLS-PROJECTION-CACHE-01`, `PB-HOTPATH-P1-WORKSPACE-SYMBOLS-BOUNDED-PROJECTION-01`, `PB-RUNTIME-P1-STATUS-HEALTH-SNAPSHOT-TIERS-01`.

## PHASE 7 — Diagnostics and semantic tokens audit

### Alcance ejecutado

- Se auditó la separación real de diagnostics en safety/syntax/document semantic/project semantic/advisory y su integración con scheduler, open-document republish, summaries y tests.
- Se auditó semantic tokens full/delta/resultId, separación structural vs resolved tokens, confidence, cache/fingerprint y resolución global por token.
- Se inspeccionaron `diagnostics.ts`, `diagnosticsExtra.ts`, `diagnosticScheduler.ts`, `openDocumentDiagnostics.ts`, `semanticTokens.ts`, `semanticTokenPresentation.ts`, handlers LSP y tests unitarios existentes.

### Resumen de evidencias

| Superficie | Implementación actual | Brecha PHASE 7 | Riesgo |
| --- | --- | --- | --- |
| Tier 0 safety/suppression | Cap global `MAX_DIAGNOSTICS_PER_FILE = 500`, dedupe, severity override por `PB_SEVERITY_OVERRIDES`; no se observó suppression policy por source/rule/tier. | No hay Tier 0 formal con safety receipts, rule enablement/suppression, sourceOrigin policy ni noise budget. | Reglas advisory o legacy pueden publicarse sin canal honesto de degradación/supresión. |
| Tier 1 local syntax | `scheduleDiagnostics` publica `mode: 'syntactic'` inmediato; `validateStructure` usa snapshot/masked lines y reglas estructurales. | El modo syntactic también incluye `findObsoleteCalls`; no expone envelope de tier ni budget/cancel. | Útil, pero difícil de medir y separar de modernization lints. |
| Tier 2 document semantic | `validateSemantics` recorre scopes/facts y emite SD2/SD3/unused/shadowing/duplicate/flow/enumerated context. | Corre dentro de `full` y comparte lane/cap con Tier 3/4. | Coste y ruido mezclados con errores más accionables. |
| Tier 3 project semantic | SD3 consulta KB/catalog; SD2/qualifiers usan facade/graph/KB; transaction/DataWindow bindings consultan KB. | No hay `project semantic` separado, stale receipt ni readiness policy por project. | Republicaciones durante indexing parcial pueden alternar diagnósticos. |
| Tier 4 advisory/report-only | Native/RPCFUNC, DataWindow expression/property path, transaction binding, lifecycle y algunos lints se emiten como diagnostics normales. | Advisory no está aislado como report-only ni capado por tier. | Falsa certeza y ruido en dominios PowerBuilder no completamente resolubles. |
| Diagnostics scheduling | `publishDiagnosticsNow` y delayed full usan `TaskPriority.Interactive`; `republishOpenDiagnosticsForDocuments` itera abiertos y llama full publish. | Falta lane/budget por tier y cancelación/stale por documento/version. | Open/change y watcher republish pueden competir con providers interactivos. |
| Semantic tokens full/range | Solo se observan full/delta handlers; no provider range. `provideSemanticTokens` recorre el documento completo. | Falta path range y cache por fingerprint. | Repaint de documentos grandes recalcula todo. |
| Semantic tokens delta/resultId | `onDelta` pasa `previousResultId` al builder, pero el view model se reconstruye completo y el builder vive en map por URI. | No hay result state versionado por fingerprint/documentVersion/epoch. | Edits pueden basarse en estado ambiguo o forzar trabajo completo. |
| Structural vs resolved tokens | Declarations/scope locals/catalog tokens son structural/fast; fallback facade resuelve targets por identificador. | La frontera no tiene budget ni degraded structural-only fallback. | Resolver por token degrada el lane interactivo. |
| Confidence | Tokens estructurales se marcan high; semantic usa `result.confidence.level`; unknown cae a low. | No hay confidence summary/receipt cuando se omiten tokens por budget o estado parcial. | UI puede parecer completa aunque falte enrichment semántico. |

### Hallazgos registrados

- `FINDING-025` — Diagnostics no tiene contrato ejecutable de tiers y mezcla advisory checks en publish full.
- `FINDING-026` — Semantic tokens delta no está versionado por fingerprint ni result state propio.
- `FINDING-019` se amplió con evidencia PHASE 7 sobre `previousResultId` y view model completo.
- `FINDING-013` sigue siendo el hallazgo raíz para open/change hot path; PHASE 7 lo especializa en diagnostics tiering.

### Recomendaciones

- **Recommendation ID:** REC-7-1.
- **Resumen:** Crear `DiagnosticsTierPipeline` con Tier 0/1 inmediato y Tier 2/3/4 programados por lane/budget.
- **Motivo:** `syntactic/full` no expresa safety, project readiness ni advisory/report-only.
- **Área objetivo:** diagnostics/scheduler/tests/docs.
- **Beneficio esperado:** speed/reactivity/correctness/noise control.
- **Riesgo:** cambiar orden/severidad visible de diagnostics; usar compat layer y tests de paridad.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-DIAG-P0-TIERED-DIAGNOSTICS-PIPELINE-01`.

- **Recommendation ID:** REC-7-2.
- **Resumen:** Separar Tier 4 advisory de LSP diagnostics normales salvo evidencia alta y policy explícita.
- **Motivo:** DataWindow/SQL/native/lifecycle tienen incertidumbre por diseño y deben conservar confidence/sourceOrigin/reason.
- **Área objetivo:** diagnostics/presentation/read-only reports.
- **Beneficio esperado:** correctness/UX.
- **Riesgo:** usuarios pueden perder avisos útiles si no hay panel/report alternativo claro.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-DIAG-P1-ADVISORY-REPORT-ONLY-POLICY-01`.

- **Recommendation ID:** REC-7-3.
- **Resumen:** Reemplazar `SemanticTokensBuilder` persistente por result state versionado.
- **Motivo:** delta/resultId debe estar atado a fingerprint, documentVersion, epoch/sourceOrigin y legend.
- **Área objetivo:** semantic tokens/cache/tests.
- **Beneficio esperado:** correctness/speed.
- **Riesgo:** fallbacks full más frecuentes al principio; aceptable si son honestos y medidos.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-TOKENS-P0-RESULTID-FINGERPRINT-STATE-01`.

- **Recommendation ID:** REC-7-4.
- **Resumen:** Añadir token projection structural-first con optional semantic enrichment.
- **Motivo:** full document + facade por token no escala ni necesita bloquear el coloreado básico.
- **Área objetivo:** semantic tokens/projections/performance.
- **Beneficio esperado:** speed/reactivity.
- **Riesgo:** coloreado semantic degradado durante indexing parcial; mitigarlo con confidence/degraded receipts.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-HOTPATH-P1-SEMANTIC-TOKENS-INCREMENTAL-PROJECTION-01`.

### Refactorizaciones identificadas

### Refactorización — REF-7-1 — Diagnostics tier pipeline

- **Ubicación actual:** `src/server/features/diagnostics.ts`, `src/server/features/diagnosticsExtra.ts`, `src/server/analysis/diagnosticScheduler.ts`, `src/server/analysis/openDocumentDiagnostics.ts`.
- **Problema actual:** `syntactic/full` mezcla reglas con distinto coste, confidence y dominio semántico.
- **Ubicación objetivo:** `src/server/diagnostics/tiers/*` o módulo equivalente definido en PHASE 22.
- **Diseño objetivo:** cada diagnostic builder declara tier, sourceOrigin policy, confidence floor, lane, budget, cap, stale behavior, suppression/noise policy y presentation mapping.
- **Tipo de refactor:** Split + contract centralization.
- **Dependencias actuales:** LSP diagnostics, Diagnostics Explainability, Current Object Context, technical debt/code metrics, open diagnostics republish.
- **Dependencias objetivo:** providers y read-only surfaces consumen snapshots por tier; summaries diferencian syntax/semantic/advisory.
- **Pasos de migración:** inventariar reglas; crear DTO tiered; envolver salida actual como compat; separar Tier 0/1; mover advisory a Tier 4; adaptar summaries/panels; añadir gates.
- **Tests de paridad requeridos:** diagnostics actuales siguen apareciendo en fixture pequeño bajo el tier esperado.
- **Tests de conformidad requeridos:** no advisory en Tier 1/2; open/change no ejecuta Tier 3/4 inline; cap por tier.
- **Estrategia de rollback:** mantener `buildDiagnosticsForDocument(..., 'full')` componiendo tiers temporalmente.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** no quedan reglas directas agregadas a `full` sin metadata de tier.
- **Docs afectadas:** target architecture, testing, performance budget, backlog en PHASE 13.
- **Métricas afectadas:** latency por tier, diagnostics count por tier, stale/degraded count, advisory suppressions.
- **Riesgos:** cambios de UX y compatibilidad con tests existentes.
- **Specs de backlog requeridas:** `PB-DIAG-P0-TIERED-DIAGNOSTICS-PIPELINE-01`, `PB-DIAG-P1-ADVISORY-REPORT-ONLY-POLICY-01`.

### Refactorización — REF-7-2 — Semantic tokens result state y projection cache

- **Ubicación actual:** `src/server/handlers/featureHandlers.ts`, `src/server/features/semanticTokens.ts`, `src/server/presentation/semanticTokenPresentation.ts`.
- **Problema actual:** delta depende de builder persistente por URI y el cálculo recompone tokens completos por request.
- **Ubicación objetivo:** `SemanticTokensProjectionCache` y `SemanticTokensResultState` versionados por URI/fingerprint/documentVersion/epoch/legend.
- **Diseño objetivo:** builder efímero por respuesta; cache de view model por snapshot; resultId map con eviction; fallback full si `previousResultId` no coincide; range/delta solo cuando la base es verificable.
- **Tipo de refactor:** Cache centralization + projection extraction.
- **Dependencias actuales:** LSP semantic tokens provider, presentation view model, semantic query facade, analysis cache.
- **Dependencias objetivo:** provider adapter contract y PHASE 17 fitness function contra per-token global resolution.
- **Pasos de migración:** introducir result state; invalidar por onDidChange/onDidClose/epoch relevant; cachear structural projection; migrar semantic enrichment; añadir tests delta/range; medir payload.
- **Tests de paridad requeridos:** tokens existentes para scopes/catalog/enum siguen iguales en fixture pequeño.
- **Tests de conformidad requeridos:** unknown previousResultId devuelve full; edit cambia fingerprint; no builder persistente sin version key; budget evita facade per token ilimitado.
- **Estrategia de rollback:** si result state falla, devolver full tokens estructurales.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** `semanticTokensBuilders` por URI deja de existir como estado persistente principal.
- **Docs afectadas:** target architecture, testing, performance budget.
- **Métricas afectadas:** token compute ms, full vs delta ratio, cache hit, fallback full count, facade resolves per request.
- **Riesgos:** delta incorrecto si key incompleta; por eso el fallback full debe ser conservador.
- **Specs de backlog requeridas:** `PB-TOKENS-P0-RESULTID-FINGERPRINT-STATE-01`, `PB-HOTPATH-P1-SEMANTIC-TOKENS-INCREMENTAL-PROJECTION-01`.

### Candidatos de backlog

- `PB-DIAG-P0-TIERED-DIAGNOSTICS-PIPELINE-01` — pipeline por tiers con lane/budget/cap/stale/sourceOrigin.
- `PB-DIAG-P1-ADVISORY-REPORT-ONLY-POLICY-01` — política de ruido para DataWindow/SQL/native/lifecycle advisory.
- `PB-TOKENS-P0-RESULTID-FINGERPRINT-STATE-01` — resultId/delta state versionado para semantic tokens.
- `PB-HOTPATH-P1-SEMANTIC-TOKENS-INCREMENTAL-PROJECTION-01` — proyección incremental structural-first con enrichment semántico.
- Estos candidatos no se agregan a [docs/backlog.md](../backlog.md) hasta PHASE 13 después de completar PHASE 24.

### Documentación actualizada

- Actualizado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con `FINDING-025`, `FINDING-026` y ampliación de `FINDING-019`.
- Actualizado este reporte con matriz de diagnostics/tokens PHASE 7.
- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) con diseño objetivo de diagnostics tiers y semantic tokens result state.
- No se actualizó [docs/backlog.md](../backlog.md) porque la generación/consolidación del backlog está bloqueada hasta PHASE 13 por el prompt.

### Tests o validación

- No se ejecutaron tests.
- Tests inspeccionados: `test/server/unit/diagnosticScheduler.test.ts`, `test/server/unit/openDocumentDiagnostics.test.ts`, `test/server/unit/diagnostics.test.ts`, `test/server/unit/diagnosticsExtra.test.ts`, `test/server/unit/semanticTokens.test.ts`, `test/server/integration/lsp-diagnostics.test.ts`.
- Tests a diseñar: tier mapping por rule, advisory report-only, stale diagnostics republish, semantic tokens delta fingerprint, unknown previousResultId full fallback, budget de resolves por token.

### Preguntas abiertas

- Definir si `findObsoleteCalls` pertenece a Tier 1, Tier 2 o modernization advisory Tier 4.
- Definir policy de suppressions por regla/URI/sourceOrigin y si debe ser config de usuario o workspace.
- Definir si VS Code client necesita semantic tokens range provider además de full/delta.
- Definir qué cambios de KB invalidan semantic token enrichment sin invalidar structural tokens.

### Evidencias

- **Referencias de código:** `src/server/features/diagnostics.ts`; `src/server/features/diagnosticsExtra.ts`; `src/server/analysis/diagnosticScheduler.ts`; `src/server/analysis/openDocumentDiagnostics.ts`; `src/server/features/semanticTokens.ts`; `src/server/presentation/semanticTokenPresentation.ts`; `src/server/handlers/featureHandlers.ts`.
- **Referencias documentales:** [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md); [docs/testing.md](../testing.md); [docs/performance-budget.md](../performance-budget.md).
- **Referencias runtime:** ninguna.
- **Referencias externas:** LSP semantic tokens full/delta/range y cancellation patterns investigados en PHASE 1.

### Referencias de fase

- **Referencias de código:** diagnostics builder/scheduler, open diagnostics republish, semantic tokens provider/presentation, tests unitarios.
- **Referencias documentales:** instant target, testing/performance docs.
- **Referencias runtime:** ninguna.
- **Referencias de candidatos backlog:** `PB-DIAG-P0-TIERED-DIAGNOSTICS-PIPELINE-01`, `PB-DIAG-P1-ADVISORY-REPORT-ONLY-POLICY-01`, `PB-TOKENS-P0-RESULTID-FINGERPRINT-STATE-01`, `PB-HOTPATH-P1-SEMANTIC-TOKENS-INCREMENTAL-PROJECTION-01`.

## PHASE 8 — Read-only surfaces and UI reactivity audit

### Alcance ejecutado

- Se auditaron Object Explorer, Current Object Context, Diagnostics Explainability, Health/status, Workspace Check, Object Check, Technical Debt Report, Migration Assistant, Support Bundle y AI Task Context Bundle.
- Se inspeccionaron controladores cliente, builders de reportes, comandos públicos, public API contracts, redacción de support bundle, memory pressure limits y composición de bundle IA.
- No se ejecutaron tests; esta fase fue lectura y cierre documental.

### Matriz de superficies read-only

| Superficie | Trigger/registro | Fuente/proyección | Caps/receipts | Riesgo PHASE 8 | Estado |
| --- | --- | --- | --- | --- | --- |
| Object Explorer | `PowerBuilderObjectExplorerController`, refresh inicial/manual/focus. | `getSemanticWorkspaceManifest` y árbol completo cliente. | `manifest.limits.objectsTruncated`; sin paginación/lazy real. | Payload/modelo grande y acceso completo dependiente de manifest plano. | Cubierto por `FINDING-001`. |
| Current Object Context | Active editor/selection con debounce 500 ms. | `powerbuilder.currentObjectContext` compone diagnostics, DW, SQL, refs y members. | `maxExcerptLines`, `maxReferencedSymbols`; no secciones lazy. | Trabajo profundo por selección. | Cubierto por `FINDING-021`. |
| Diagnostics Explainability | Active editor y `onDidChangeDiagnostics`. | Diagnostics locales del cliente y modelo explicativo. | Acotado al documento activo; sin recomputar server semantics. | Bajo; depende de calidad/tiering de diagnostics. | Sin finding nuevo. |
| Health/status | Status refresh y comandos `showStats`. | Snapshot amplio server stats/health/cache/journal. | Sin tiers visibles para status bar vs full stats. | Snapshot pesado en refrescos. | Cubierto por `FINDING-024`. |
| Workspace Check | API cliente compone stats, manifest, catalog, diagnostics, build profiles, tech debt. | Builders cliente con secciones opcionales. | `maxDiagnostics`, `maxFiles`, `maxFindings`, `truncated`, section errors. | Mejor que otras superficies, pero no comparte envelope uniforme. | `FINDING-027`. |
| Object Check | API cliente compone current context, graph, impact/safe edit. | Builders cliente y comandos server near/export. | Caps por diagnostics/references/dependency nodes/findings. | Depende de Current Object Context compuesto. | `FINDING-027` + `FINDING-021`. |
| Technical Debt Report | `powerbuilder.technicalDebtReport`. | `buildPowerBuilderCodeMetrics`, diagnostics summary, KB snapshots, migration assistant. | Memory pressure limits y max objects/hotspots/recommendations. | Reporte manual razonable, pero receipts no uniformes. | `FINDING-027`. |
| Migration Assistant | `powerbuilder.workspaceMigrationAssistant`. | WorkspaceState roots/build/discovery summaries. | `maxRecommendations`; memory pressure limits. | Bajo; source de workspace state. | Sin finding nuevo. |
| Support Bundle | Cliente construye archivos JSON saneados. | Manifest, server stats, diagnostics, current context, metrics, tech debt, migration assistant. | Redaction policy, manifest de archivos y rawSourceIncluded=false. | Buenas redacciones; freshness/caps no uniformes por input. | `FINDING-027`. |
| AI Task Context Bundle | Public API/tool bridge, composición paralela por intent. | Workspace/object/context/safe edit/dependency/explainability/system symbol. | `maxTokensHint`, reasonCodes, pagination para algunas secciones. | Budget de payload posterior al cómputo. | `FINDING-028`. |

### Hallazgos registrados

- `FINDING-027` — Superficies read-only no comparten contrato uniforme de frescura, caps y receipts.
- `FINDING-028` — AI task context bundle poda por tokens después de ejecutar secciones potencialmente costosas.
- `FINDING-001`, `FINDING-021` y `FINDING-024` siguen siendo los hallazgos específicos principales para Object Explorer, Current Object Context y Health/status.

### Recomendaciones

- **Recommendation ID:** REC-8-1.
- **Resumen:** Definir `ReadOnlyProjectionEnvelope` común para todas las superficies.
- **Motivo:** los DTOs actuales tienen caps/receipts heterogéneos y no siempre transportan freshness/cache/source metadata.
- **Área objetivo:** shared contracts/public API/client views/server projections.
- **Beneficio esperado:** correctness/reactivity/maintainability.
- **Riesgo:** compatibilidad con API pública; usar fields opcionales y versionado.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-READONLY-P0-PROJECTION-ENVELOPE-CONTRACT-01`.

- **Recommendation ID:** REC-8-2.
- **Resumen:** Migrar Object Explorer y Current Object Context a proyecciones lazy/seccionadas antes de optimizar bundles que los consumen.
- **Motivo:** son los mayores generadores de payload/trabajo y alimentan otras superficies.
- **Área objetivo:** server projections/client views/public API.
- **Beneficio esperado:** speed/memory/reactivity.
- **Riesgo:** coexistencia temporal de API compuesta y secciones lazy.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01`, `PB-HOTPATH-P0-CURRENT-OBJECT-CONTEXT-LAZY-PROJECTION-01`.

- **Recommendation ID:** REC-8-3.
- **Resumen:** Convertir el bundle IA en ejecución planificada por coste antes de ejecutar secciones.
- **Motivo:** el token budget actual protege salida, no necesariamente cómputo.
- **Área objetivo:** AI/public API/read-only tools.
- **Beneficio esperado:** speed/reactivity.
- **Riesgo:** omitir contexto útil demasiado pronto; usar estimación conservadora y receipts.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01`.

- **Recommendation ID:** REC-8-4.
- **Resumen:** Mantener Diagnostics Explainability como superficie cliente-local mientras diagnostics tiering madura.
- **Motivo:** actualmente no introduce deep server work; su riesgo principal es heredar ruido de diagnostics.
- **Área objetivo:** client panel/diagnostics.
- **Beneficio esperado:** UX/maintainability.
- **Riesgo:** si se amplía con server explainability automática, debe pasar al envelope común.
- **Prioridad:** P2.
- **Candidato backlog:** no directo.

### Refactorizaciones identificadas

### Refactorización — REF-8-1 — Read-only projection envelope común

- **Ubicación actual:** `src/shared/publicApi.ts`, `src/client/objectExplorer.ts`, `src/client/currentObjectContextPanel.ts`, `src/client/workspaceCheckReport.ts`, `src/client/objectCheckReport.ts`, `src/client/aiTaskContextBundle.ts`, `src/client/support/supportBundle.ts`, report handlers server.
- **Problema actual:** freshness, caps, stale/degraded, redaction y truncation receipts se modelan distinto por superficie.
- **Ubicación objetivo:** contrato compartido `ReadOnlyProjectionEnvelope` en `src/shared/publicApi.ts` o módulo shared/protocol final de PHASE 22.
- **Diseño objetivo:** cada payload read-only declara `projectionId`, `generatedAt`, `generatedFromCache`, `semanticEpoch`, `documentFingerprint`, `sourceOrigin`, `readiness`, `stale`, `degradedReason`, `caps`, `truncated`, `truncatedReason`, `redaction` y `refreshHint` cuando aplique.
- **Tipo de refactor:** DTO/projection centralization.
- **Dependencias actuales:** public API, panels, support bundle, AI bundle, workspace/object checks, status commands.
- **Dependencias objetivo:** server-driven refresh, cache/projection registry y support/AI tools.
- **Pasos de migración:** añadir envelope opcional; adaptar Object Explorer/Current Object Context; adaptar checks/bundles; agregar conformance tests; retirar booleans duplicados cuando sea compatible.
- **Tests de paridad requeridos:** payloads actuales siguen serializando y los nuevos fields son opcionales.
- **Tests de conformidad requeridos:** cada read-only tool publica caps/freshness/receipts; support bundle conserva redaction receipts.
- **Estrategia de rollback:** mantener fields legacy y solo consumir envelope en nuevos clientes.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** no hay superficies sin metadata de projection/freshness/caps.
- **Docs afectadas:** target architecture, public API docs, testing, backlog en PHASE 13.
- **Métricas afectadas:** payload bytes, stale/degraded counts, cache hit de proyecciones.
- **Riesgos:** crecimiento de payload si el envelope no se mantiene compacto.
- **Specs de backlog requeridas:** `PB-READONLY-P0-PROJECTION-ENVELOPE-CONTRACT-01`.

### Refactorización — REF-8-2 — AI task context execution plan

- **Ubicación actual:** `src/client/extension.ts` (`getAiTaskContextBundle`), `src/client/aiTaskContextBundle.ts`.
- **Problema actual:** secciones costosas se ejecutan antes de la poda por token budget.
- **Ubicación objetivo:** `AiTaskContextExecutionPlan` previo al `Promise.all(sectionWork)`.
- **Diseño objetivo:** cada sección declara coste estimado, prioridad por intent, prerequisitos, max tokens esperado y skip reason. El builder final mantiene pruning como guard.
- **Tipo de refactor:** Projection planning.
- **Dependencias actuales:** public API, read-only tool bridge, object/workspace/current context/safe edit/dependency/explainability APIs.
- **Dependencias objetivo:** performance gates y AI context bundle budget contract.
- **Pasos de migración:** extraer prioridad existente; añadir estimador; omitir secciones antes de ejecutarlas; registrar reason codes; tests de no-ejecución; mantener compat para requests explícitos.
- **Tests de paridad requeridos:** bundles pequeños mantienen secciones esperadas.
- **Tests de conformidad requeridos:** budget bajo no ejecuta secciones omitidas; reasonCodes/pagination coherentes.
- **Estrategia de rollback:** desactivar skip previo y mantener pruning final.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** no hay secciones de baja prioridad ejecutadas cuando el plan ya sabe que serán omitidas.
- **Docs afectadas:** target architecture, testing, AI/read-only docs si existen, backlog en PHASE 13.
- **Métricas afectadas:** secciones ejecutadas vs omitidas, tiempo bundle, token estimate, payload bytes.
- **Riesgos:** estimaciones pobres; empezar conservador.
- **Specs de backlog requeridas:** `PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01`.

### Candidatos de backlog

- `PB-READONLY-P0-PROJECTION-ENVELOPE-CONTRACT-01` — envelope común de proyecciones read-only.
- `PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01` — plan de ejecución previo para bundle IA.
- `PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01` — reutilizado desde PHASE 0/6.
- `PB-HOTPATH-P0-CURRENT-OBJECT-CONTEXT-LAZY-PROJECTION-01` — reutilizado desde PHASE 6.
- `PB-RUNTIME-P1-STATUS-HEALTH-SNAPSHOT-TIERS-01` — reutilizado desde PHASE 6.
- Estos candidatos no se agregan a [docs/backlog.md](../backlog.md) hasta PHASE 13 después de completar PHASE 24.

### Documentación actualizada

- Actualizado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con `FINDING-027` y `FINDING-028`.
- Actualizado este reporte con matriz PHASE 8.
- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) con envelope read-only y execution planning para bundles.
- No se actualizó [docs/backlog.md](../backlog.md) porque la generación/consolidación del backlog está bloqueada hasta PHASE 13 por el prompt.

### Tests o validación

- No se ejecutaron tests.
- Tests a diseñar: Object Explorer paged/lazy, Current Object Context section lazy, read-only envelope conformance, AI bundle low-budget no-execution, support bundle redaction/freshness receipts, workspace/object check section error receipts.

### Preguntas abiertas

- Definir si el envelope común será wrapper externo o bloque `projection` dentro de cada DTO existente.
- Definir qué superficies deben recibir refresh server-driven y cuáles quedan como comando manual.
- Definir si `generatedFromCache` debe exponerse a API pública o solo a runtime/support bundles.
- Definir coste estimado por sección del bundle IA y cómo calibrarlo con métricas reales.

### Evidencias

- **Referencias de código:** `src/client/objectExplorer.ts`; `src/client/objectExplorerModel.ts`; `src/client/currentObjectContextPanel.ts`; `src/client/diagnosticsExplainabilityPanel.ts`; `src/client/workspaceCheckReport.ts`; `src/client/objectCheckReport.ts`; `src/client/aiTaskContextBundle.ts`; `src/client/support/supportBundle.ts`; `src/client/extension.ts`; `src/server/handlers/reportCommandHandlers.ts`; `src/server/handlers/runtimeCommandHandlers.ts`; `src/server/features/powerBuilderTechnicalDebtReport.ts`; `src/server/features/workspaceMigrationAssistant.ts`; `src/server/features/workspaceCheckCatalogSummary.ts`; `src/shared/publicApi.ts`.
- **Referencias documentales:** [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md); [docs/testing.md](../testing.md); memoria repo `/memories/repo/ai-task-context-bundle-budget-contract-2026-05.md`.
- **Referencias runtime:** ninguna.
- **Referencias externas:** TreeDataProvider lazy y LSP/progress principles investigados en PHASE 1.

### Referencias de fase

- **Referencias de código:** client panels/views, public API builders, report commands, support/AI bundles.
- **Referencias documentales:** instant target, testing/performance docs, memoria repo de bundle IA.
- **Referencias runtime:** ninguna.
- **Referencias de candidatos backlog:** `PB-READONLY-P0-PROJECTION-ENVELOPE-CONTRACT-01`, `PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01`, `PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01`, `PB-HOTPATH-P0-CURRENT-OBJECT-CONTEXT-LAZY-PROJECTION-01`, `PB-RUNTIME-P1-STATUS-HEALTH-SNAPSHOT-TIERS-01`.

## PHASE 9 — Duplicate code, contract drift, and dead architecture audit

### Alcance ejecutado

- Se exploraron duplicaciones en resolución semántica, builders de DTO/proyección, SQL anchors, diagnostics rules, cache key contracts, legacy paths y drift documental.
- Se usó un subagente read-only de exploración y búsquedas locales para confirmar evidencia.
- Se midieron módulos grandes en PHASE 9B para distinguir duplicación puntual de deuda estructural.

### Resumen de evidencias

| Área | Evidencia | Clasificación | Decisión |
| --- | --- | --- | --- |
| Resolver/symbol lookup | `completion`, `hover`, `definition`, `references`, `signatureHelp`, `semanticTokens`, `diagnostics` usan combinaciones de facade, KB, graph, query service y helpers locales. | F / I | Ya cubierto por `FINDING-010`; PHASE 9 lo confirma como duplicación de resolución y no crea finding duplicado. |
| Cache key contract | `FINDING-017` ya registró `prefix` declarado en matcher pero no builder. | C | Mantener como fix candidato PHASE 14 si sigue siendo seguro. |
| SQL detection/anchors | `powerBuilderCodeMetrics` usa `findSqlRegions(...)`; `embeddedSqlAnchors` llama `findSqlRegions(...)` y agrega anchors/transaction inference; `CurrentObjectContext` consume anchors sin cap. | F / I | Relacionado con `FINDING-006`; PHASE 9 recomienda owner `SqlAnchorSubmodel`, no finding duplicado salvo PHASE 22 si se confirma split. |
| Diagnostics rules | `diagnostics.ts`, `diagnosticsExtra.ts`, `obsoleteDetector.ts` dividen reglas sin registry común. | B / I / G | Nuevo `FINDING-029`. |
| DTO/projection builders | `presentation/*`, read-only builders y view models tienen patrones similares, pero no se confirmó bug funcional. | F / B | Candidato de refactor; se consolidará en PHASE 13/22 sin finding separado por ahora. |
| Legacy `plugin_old` | No hay imports runtime desde `src/**`, solo comentarios de código portado; PHASE 11 confirmó gate en `architectureImports.test.ts`. | E / J | `FINDING-032` queda enfocado en retirement plan, no en gate ausente. |
| Docs drift | `architecture-status` y specs/backlog ya tienen drift parcial. | D | Cubierto por `FINDING-005` y se normalizará en PHASE 13. |

### Hallazgos registrados

- `FINDING-029` — Dispatch de reglas diagnostics está monolítico y sin registry ejecutable.
- `FINDING-032` — `plugin_old` está aislado por gate, pero aún necesita plan de retirement explícito.
- `FINDING-010`, `FINDING-017`, `FINDING-006` y `FINDING-005` se mantienen como hallazgos relacionados sin duplicación.

### Recomendaciones

- **Recommendation ID:** REC-9-1.
- **Resumen:** Tratar la convergencia de resolver logic como extensión de `FINDING-010`, no como backlog paralelo.
- **Motivo:** el riesgo raíz es source-of-truth/facade convergence ya documentado.
- **Área objetivo:** semantic facade/providers/tests.
- **Beneficio esperado:** correctness/maintainability.
- **Riesgo:** crear specs duplicadas para el mismo problema.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-ARCH-P0-SEMANTIC-FACADE-CONVERGENCE-MATRIX-01` y `PB-ARCH-P1-DUPLICATE-RESOLVER-CONSOLIDATION-01` como subitem si PHASE 13 lo separa.

- **Recommendation ID:** REC-9-2.
- **Resumen:** Crear registry de diagnostics antes de añadir nuevas reglas.
- **Motivo:** el dispatch actual no escala a tiers, advisory policies ni ownership claro.
- **Área objetivo:** diagnostics/tests/architecture.
- **Beneficio esperado:** maintainability/correctness/noise control.
- **Riesgo:** mover reglas sin paridad puede cambiar diagnostics visibles.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-ARCH-P1-DIAGNOSTIC-RULES-REGISTRY-01`.

- **Recommendation ID:** REC-9-3.
- **Resumen:** Mantener gate de aislamiento y planificar retirement de `plugin_old`.
- **Motivo:** PHASE 11 confirmó el gate de imports; falta una decisión de retiro explícita.
- **Área objetivo:** tests/architecture/legacy.
- **Beneficio esperado:** maintainability.
- **Riesgo:** borrar referencia histórica sin paridad o mantenerla indefinidamente sin owner.
- **Prioridad:** P2.
- **Candidato backlog:** `PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01`.

### Refactorizaciones identificadas

### Refactorización — REF-9-1 — Diagnostic rules registry

- **Ubicación actual:** `src/server/features/diagnostics.ts`, `src/server/features/diagnosticsExtra.ts`, `src/server/features/obsoleteDetector.ts`.
- **Problema actual:** reglas y metadata de diagnostics están acopladas al orquestador.
- **Ubicación objetivo:** `DiagnosticRuleRegistry` bajo estructura final de PHASE 22.
- **Diseño objetivo:** cada regla declara `id`, `tier`, `domain`, `confidence`, `sourceOriginPolicy`, `cost`, `cap`, `run(...)` y tests esperados.
- **Tipo de refactor:** Contract centralization + split.
- **Dependencias actuales:** LSP diagnostics, summaries, explainability, Current Object Context, technical debt.
- **Dependencias objetivo:** diagnostics tiers PHASE 7 y fitness functions PHASE 17.
- **Pasos de migración:** envolver reglas existentes; añadir metadata sin mover lógica; mover dominios por grupos; actualizar summaries; añadir gates.
- **Tests de paridad requeridos:** fixture diagnostics actual produce mismos códigos/rangos.
- **Tests de conformidad requeridos:** toda regla tiene metadata y code registry.
- **Estrategia de rollback:** compat `buildDiagnosticsForDocument` compone registry y mantiene API.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** no quedan reglas nuevas fuera del registry.
- **Docs afectadas:** target architecture, testing, backlog en PHASE 13.
- **Métricas afectadas:** latency por tier/rule, diagnostic count por domain.
- **Riesgos:** cambios de orden o dedupe.
- **Specs de backlog requeridas:** `PB-ARCH-P1-DIAGNOSTIC-RULES-REGISTRY-01`.

### Candidatos de backlog

- `PB-ARCH-P1-DUPLICATE-RESOLVER-CONSOLIDATION-01` — candidato subordinado a facade convergence.
- `PB-ARCH-P1-DIAGNOSTIC-RULES-REGISTRY-01` — registry de reglas diagnostics.
- `PB-ARCH-P1-PRESENTATION-LAYER-CONSOLIDATION-01` — builders compartidos de presentación, condicionado a PHASE 22.
- `PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01` — plan de retiro legacy manteniendo el gate existente.
- Estos candidatos no se agregan a [docs/backlog.md](../backlog.md) hasta PHASE 13 después de completar PHASE 24.

### Documentación actualizada

- Actualizado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con `FINDING-029` y `FINDING-032`.
- Actualizado este reporte con PHASE 9.
- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) con estrategia de duplicación/legacy.

### Tests o validación

- No se ejecutaron tests.
- Evidencia adicional: grep de `plugin_old` en `src/**` solo encontró comentarios, no imports runtime.

### Preguntas abiertas

- Definir si presentation builders compartidos entran como spec independiente o como parte del provider adapter contract.
- Definir si SQL detection necesita nuevo finding en PHASE 22 o queda absorbido por SQL bounded projection.
- Definir owner exacto del diagnostic registry dentro de la estructura final.

### Evidencias

- **Referencias de código:** `src/server/features/diagnostics.ts`; `src/server/features/diagnosticsExtra.ts`; `src/server/features/obsoleteDetector.ts`; `src/server/features/completion.ts`; `src/server/features/hover.ts`; `src/server/features/definition.ts`; `src/server/features/references.ts`; `src/server/features/signatureHelp.ts`; `src/server/features/semanticTokens.ts`; `src/server/serving/cacheKeyContract.ts`; `src/server/parsing/sqlRegions.ts`; `src/server/features/embeddedSqlAnchors.ts`; `plugin_old/**`.
- **Referencias documentales:** [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md); [docs/legacy-isolation.md](../legacy-isolation.md); [docs/architecture-status.md](../architecture-status.md).
- **Referencias runtime:** ninguna.
- **Referencias de investigación:** reporte read-only de subagente `Explore` en sesión.

### Referencias de fase

- **Referencias de código:** providers, diagnostics, SQL anchors, cache key contract, plugin_old isolation.
- **Referencias documentales:** instant target, legacy isolation, architecture status.
- **Referencias runtime:** ninguna.
- **Referencias de candidatos backlog:** `PB-ARCH-P1-DUPLICATE-RESOLVER-CONSOLIDATION-01`, `PB-ARCH-P1-DIAGNOSTIC-RULES-REGISTRY-01`, `PB-ARCH-P1-PRESENTATION-LAYER-CONSOLIDATION-01`, `PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01`.

## PHASE 9B — Structural simplification, duplicate elimination, source-of-truth alignment, and legacy removal

### Alcance ejecutado

- Se auditó tamaño y responsabilidad de módulos semánticos/runtime/indexing/client/shared.
- Se clasificaron issues estructurales con categorías A-J del prompt.
- Se midieron archivos grandes con PowerShell para respaldar refactorizaciones futuras.

### Clasificación A-J

| Issue | Evidencia | Clasificación | Acción objetivo |
| --- | --- | --- | --- |
| Resolver logic provider-specific | `FINDING-010`, providers semánticos híbridos. | F / I / C | Convergencia facade + provider adapter. |
| Diagnostics monolítico | `diagnostics.ts` 1961 líneas. | G / I / B | Split + registry + tier pipeline. |
| DataWindow submodelo grande | `dataWindowModel.ts` 1385, `dataWindowPropertyPaths.ts` 777. | G / H / C | Mover a submodelo DataWindow modular. |
| Orquestadores grandes | `extension.ts` 5371, `publicApi.ts` 3167, `featureHandlers.ts` 1674. | G / H / I | Split por registration/API/commands/protocol. |
| plugin_old aislado por convención | comentarios en `src`, sin imports. | E / J | Gate no-import + retirement plan. |
| Index/cache state invariants | workspace state + analysis cache + DocumentCache + KB. | I / C | Invariant suite y state contract split. |
| DTO/projection builders heterogéneos | presentation/read-only builders. | F / I | Shared projection/presentation contracts. |

### Hallazgos registrados

- `FINDING-030` — DataWindow model y property paths son módulos sobredimensionados con responsabilidades mezcladas.
- `FINDING-031` — Orquestadores principales concentran demasiadas responsabilidades.
- `FINDING-033` — Estado de indexación, analysis cache y DocumentCache carecen de invariantes ejecutables compartidas.
- PHASE 9B también refuerza `FINDING-029` y `FINDING-032`.

### Recomendaciones

- **Recommendation ID:** REC-9B-1.
- **Resumen:** Definir umbrales de tamaño y owners de excepción antes de mover archivos.
- **Motivo:** hay archivos grandes justificados por integración, pero necesitan plan de split y gates.
- **Área objetivo:** architecture/tests/docs.
- **Beneficio esperado:** maintainability.
- **Riesgo:** splits mecánicos sin reducción de complejidad real.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-ARCH-P24-MODULE-SIZE-FITNESS-01`.

- **Recommendation ID:** REC-9B-2.
- **Resumen:** Migrar DataWindow a submodelo modular con facade estable.
- **Motivo:** es dominio PowerBuilder complejo y transversal.
- **Área objetivo:** datawindow/submodels/tests.
- **Beneficio esperado:** correctness/maintainability/speed.
- **Riesgo:** regression en property paths y bindings; requiere paridad amplia.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-ARCH-P9-DATAWINDOW-MODEL-SPLIT-01`.

- **Recommendation ID:** REC-9B-3.
- **Resumen:** Partir orquestadores por adapters y routers antes de introducir nuevas surfaces.
- **Motivo:** `featureHandlers.ts`, `extension.ts` y `publicApi.ts` son bottlenecks de ownership.
- **Área objetivo:** client/server/shared architecture.
- **Beneficio esperado:** maintainability/testability.
- **Riesgo:** romper activation o command registration; migrar por compat.
- **Prioridad:** P2.
- **Candidato backlog:** `PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01`.

- **Recommendation ID:** REC-9B-4.
- **Resumen:** Añadir invariant suite para index/cache state antes de refactors de warm persistence.
- **Motivo:** PHASE 4/5 muestran riesgos de state coherence.
- **Área objetivo:** indexing/cache/tests.
- **Beneficio esperado:** correctness.
- **Riesgo:** tests pueden revelar drift actual que bloquee refactors; es una señal útil.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-ARCH-P1-INDEX-STATE-INVARIANTS-01`.

### Refactorizaciones identificadas

### Refactorización — REF-9B-1 — DataWindow submodel split

- **Ubicación actual:** `src/server/features/dataWindowModel.ts`, `dataWindowPropertyPaths.ts`, `dataWindowBindingModel.ts`, `dataWindowFastContext.ts`, `dataWindowColumnAccess.ts`, `dataWindowServingAdapters.ts`.
- **Problema actual:** subdominio grande con responsabilidades mezcladas y consumers múltiples.
- **Ubicación objetivo:** `src/server/semantic/submodels/datawindow/` o estructura equivalente definida en PHASE 22.
- **Diseño objetivo:** módulos pequeños para parser `.srd`, model projection, expression dependencies, column/control index, property path resolver, bindings, fast context, diagnostics adapters y serving adapters.
- **Tipo de refactor:** Split + Move + Facade.
- **Dependencias actuales:** diagnostics, completion/hover/definition DataWindow adapters, Current Object Context, SQL lineage, technical debt, tests DW.
- **Dependencias objetivo:** submodelo advisory con public facade y projection cache.
- **Pasos de migración:** extraer parser puro; paridad de model output; extraer property paths; adaptar bindings; mover diagnostics; introducir facade; actualizar imports; retirar compat.
- **Tests de paridad requeridos:** todo `dataWindow*.test.ts`, property paths, fast context, lineage.
- **Tests de conformidad requeridos:** no DataWindow deep analysis en providers sin adapter/cap.
- **Estrategia de rollback:** mantener re-exports desde `features/*` temporalmente.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** imports nuevos apuntan al submodelo y re-exports quedan sin consumidores.
- **Docs afectadas:** target architecture, testing, backlog PHASE 13.
- **Métricas afectadas:** parse DW ms, model cache hit, diagnostics DW count.
- **Riesgos:** regression de property paths y confidence.
- **Specs de backlog requeridas:** `PB-ARCH-P9-DATAWINDOW-MODEL-SPLIT-01`.

### Refactorización — REF-9B-2 — Orchestrator module split

- **Ubicación actual:** `src/client/extension.ts`, `src/shared/publicApi.ts`, `src/server/handlers/featureHandlers.ts`, `src/server/server.ts`, `src/server/handlers/reportCommandHandlers.ts`.
- **Problema actual:** módulos grandes de integración mezclan contratos, registration, command routing, adapters, cache/scheduler y compat.
- **Ubicación objetivo:** módulos por dominio: `client/apiBridge`, `client/views`, `server/providers`, `server/commands`, `shared/protocol`, `shared/contracts`.
- **Diseño objetivo:** `extension.ts` registra controladores; public API se divide en schemas/methods/tools; feature handlers se convierten en registry de provider adapters; report commands se separan por read-only tools.
- **Tipo de refactor:** Split + Move + Adapter.
- **Dependencias actuales:** activation, LSP registration, public API, read-only tools, tests contract.
- **Dependencias objetivo:** PHASE 22 target module structure y PHASE 24 size gates.
- **Pasos de migración:** extraer sin cambiar exports; añadir tests de registration; mover grupos de comandos; dividir publicApi por type-only modules; actualizar docs.
- **Tests de paridad requeridos:** public API contract snapshots, command registration, activation smoke.
- **Tests de conformidad requeridos:** max file size with allowlist, no cycles.
- **Estrategia de rollback:** re-export barrels y command registry compat.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** archivos orquestadores quedan bajo umbral o con allowlist documentada.
- **Docs afectadas:** target architecture, developer workflows, testing.
- **Métricas afectadas:** activation time, test runtime, module size.
- **Riesgos:** activation regression y import cycles.
- **Specs de backlog requeridas:** `PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01`.

### Refactorización — REF-9B-3 — Index/cache invariant suite

- **Ubicación actual:** `workspaceState`, `analysisCache`, `DocumentCache`, `KnowledgeBase`, `workspaceIndexer`, persistence modules.
- **Problema actual:** invariants de estado existen implícitamente y ya se observaron problemas de warm resume/persistence.
- **Ubicación objetivo:** tests/contract module `IndexStateInvariants` y documentación target de state machine.
- **Diseño objetivo:** assertions reutilizables para indexed state, fingerprint compatibility, cache eviction, published snapshot, restore, watcher invalidation y sourceOrigin.
- **Tipo de refactor:** Contract centralization + Test gate.
- **Dependencias actuales:** PHASE 4/5 backlog candidates.
- **Dependencias objetivo:** warm start/persistence refactors y PHASE 17 gates.
- **Pasos de migración:** definir invariants; crear fixtures; integrar tests; usar helpers en indexer/cache tests; promover a architecture gate.
- **Tests de paridad requeridos:** existing indexer/cache tests.
- **Tests de conformidad requeridos:** indexed implies snapshot/fingerprint, eviction no borra truth, restore clean/dirty consistency.
- **Estrategia de rollback:** mantener tests warn-only hasta estabilizar fixtures.
- **Capa temporal de compatibilidad:** no.
- **Criterios de retirada:** warm persistence specs dependen de invariant suite.
- **Docs afectadas:** target architecture, testing.
- **Métricas afectadas:** stale state incidents, restore consistency.
- **Riesgos:** revelar fallos existentes que requieran specs P0.
- **Specs de backlog requeridas:** `PB-ARCH-P1-INDEX-STATE-INVARIANTS-01`.

### Candidatos de backlog

- `PB-ARCH-P9-DATAWINDOW-MODEL-SPLIT-01` — submodelo DataWindow modular.
- `PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01` — split de orquestadores cliente/server/shared.
- `PB-ARCH-P1-INDEX-STATE-INVARIANTS-01` — invariants ejecutables de index/cache state.
- `PB-ARCH-P24-MODULE-SIZE-FITNESS-01` — fitness function de tamaño/ciclos/allowlists.
- `PB-ARCH-P1-PRESENTATION-LAYER-CONSOLIDATION-01` — shared builders, condicionado a PHASE 22.
- Estos candidatos no se agregan a [docs/backlog.md](../backlog.md) hasta PHASE 13 después de completar PHASE 24.

### Documentación actualizada

- Actualizado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con `FINDING-030`, `FINDING-031` y `FINDING-033`.
- Actualizado este reporte con PHASE 9B.
- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) con estrategia de simplificación estructural.

### Tests o validación

- No se ejecutaron tests.
- Se ejecutaron mediciones PowerShell de líneas de archivos grandes. Resultados clave: `src/client/extension.ts` 5371, `src/shared/publicApi.ts` 3167, `src/server/features/diagnostics.ts` 1961, `src/server/handlers/featureHandlers.ts` 1674, `src/server/features/dataWindowModel.ts` 1385, `src/server/server.ts` 957.

### Preguntas abiertas

- Definir umbral final para file/function/class size y excepciones permitidas.
- Definir orden entre provider adapter split, public API split y DataWindow submodel split.
- Confirmar si `publicApi.ts` debe dividirse por types/method descriptors/schema descriptors manteniendo un barrel estable.

### Evidencias

- **Referencias de código:** archivos y módulos listados en hallazgos y refactorizaciones.
- **Referencias documentales:** [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md); [docs/testing.md](../testing.md); [docs/legacy-isolation.md](../legacy-isolation.md).
- **Referencias runtime:** ninguna.
- **Referencias de medición:** comandos PowerShell de conteo de líneas ejecutados en PHASE 9B.

### Referencias de fase

- **Referencias de código:** DataWindow modules, diagnostics, orchestrators, cache/index state modules, plugin_old comments.
- **Referencias documentales:** instant target, testing, legacy isolation.
- **Referencias runtime:** ninguna.
- **Referencias de candidatos backlog:** `PB-ARCH-P9-DATAWINDOW-MODEL-SPLIT-01`, `PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01`, `PB-ARCH-P1-INDEX-STATE-INVARIANTS-01`, `PB-ARCH-P24-MODULE-SIZE-FITNESS-01`, `PB-ARCH-P1-PRESENTATION-LAYER-CONSOLIDATION-01`.

## PHASE 10 — Performance instrumentation and benchmark audit

### Alcance ejecutado

- Se auditó instrumentación runtime, timing utilities, serving stats, memory budgets, payload budgets, scheduler/indexer metrics, worker pool y performance gates existentes.
- Se revisó [docs/performance-budget.md](../performance-budget.md) como owner canónico de presupuestos.
- Se revisaron suites de performance bajo `test/server/performance/**` y el wrapper `tools/run-performance-budget-gate.mjs`.

### Resumen de evidencias

| Métrica obligatoria | Estado observado | Gap |
| --- | --- | --- |
| Interactive latency | Parcial: `InteractiveServingStatsTracker`, logs `[TIEMPO]`, `LatencyGovernor`. | No todos los providers emiten evento homogéneo; faltan p95/p99 y traceId/method/documentVersion/error/cancelled. |
| Cache hit ratios | Parcial: `ServingCache`, `PresentationCache`, `analysisCache`, `DocumentCache`, `CodeLensResultCache`. | No hay contrato común ni hit ratio por request/fallback en todos los providers. |
| semanticEpoch/no-op publish | Parcial: KB stats/epoch, persistence restore stats. | No hay métrica explícita de no-op publish, avoided invalidation o stale discard por epoch. |
| Indexing throughput | Parcial: `indexerStatus`, progress, performance tests. | Falta throughput estructurado files/sec, symbols/sec, wait time, per-pass duration. |
| Worker busy/idle | Débil: `WorkerPool` no expone stats. | Falta queue depth, busy/idle, task duration, serialization/restart metrics. |
| Event loop blocking | No observado como métrica runtime. | Falta `eventLoopDelay`/blocking samples. |
| Diagnostics tiers | Débil: PHASE 7 confirmó `syntactic/full`. | Falta latencia por tier/regla. |
| Semantic tokens | Parcial: CI gate mide una llamada. | Runtime no registra stats homogéneas ni delta/resultId metrics. |
| Object Explorer pagination | Débil: PHASE 8 encontró manifest/client model plano. | Falta métrica de page size, expansion latency y payload. |
| LSP payload size | Parcial: `payloadBudget.ts`, `estimateLspPayloadBytes`, tests representativos. | No todos los providers/read-only surfaces aplican payload budget runtime. |
| Memory/GC pressure | Parcial: `memoryBudgets.ts` y `process.memoryUsage()`. | Falta GC/event-loop pressure real y budget por operación. |

### Hallazgos registrados

- `FINDING-034` — Métricas interactivas existen pero no cubren todo el contrato de performance.
- `FINDING-035` — Worker pool, event loop y GC/memoria no tienen instrumentación ejecutable suficiente.
- `FINDING-036` — Performance gate es valioso pero no cubre la matriz 10,000+ ni todas las features críticas.

### Recomendaciones

- **Recommendation ID:** REC-10-1.
- **Resumen:** Definir `PerformanceEvent` único para requests, background work y read-only projections.
- **Motivo:** los stats actuales son útiles pero fragmentados.
- **Área objetivo:** runtime/providers/tests.
- **Beneficio esperado:** speed/reactivity/regression diagnosis.
- **Riesgo:** overhead si se serializan payloads grandes; usar sampling/caps.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01`.

- **Recommendation ID:** REC-10-2.
- **Resumen:** Instrumentar worker pool, scheduler lanes y event-loop delay sin cambiar scheduling.
- **Motivo:** la escalabilidad 10,000+ necesita explicar saturación y blocking.
- **Área objetivo:** runtime/indexer/tests.
- **Beneficio esperado:** performance/correctness/backpressure.
- **Riesgo:** ruido o overhead; exponer snapshots acotados.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-PERF-P1-WORKER-EVENT-LOOP-METRICS-01`.

- **Recommendation ID:** REC-10-3.
- **Resumen:** Mantener `test:performance:gate` como baseline y diseñar matriz incremental/10,000+ para PHASE 19/20.
- **Motivo:** el gate actual no cubre todo el objetivo de producto.
- **Área objetivo:** tests/CI/performance.
- **Beneficio esperado:** regression prevention.
- **Riesgo:** tests demasiado lentos en CI principal; separar smoke/nightly.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-PERF-P1-BENCHMARK-MATRIX-COVERAGE-01`, `PB-PERF-P1-SYNTHETIC-10000-CORPUS-GATE-01`.

### Refactorizaciones identificadas

### Refactorización — REF-10-1 — Runtime metrics event contract

- **Ubicación actual:** `interactiveServingStats.ts`, `interactiveServingPipeline.ts`, `runtimeJournal.ts`, `featureHandlers.ts`, diagnostics timing, semantic tokens timing, `performance-budget.md`.
- **Problema actual:** métricas por feature y logs no comparten schema ni coverage.
- **Ubicación objetivo:** `src/server/runtime/metrics/` o módulo equivalente definido en PHASE 22.
- **Diseño objetivo:** `PerformanceEvent` con `traceId`, `method`, `feature`, `lane`, `documentUri`, `documentVersion`, `documentFingerprint`, `workspaceId/projectId`, `durationMs`, `providerMs`, `formatterMs`, `cacheOutcome`, `fallbackKind`, `cancelled`, `errorKind`, `payloadBytes`, `budgetMs`, `semanticEpoch`, `kbVersion` y `outcome`.
- **Tipo de refactor:** Contract centralization.
- **Dependencias actuales:** runtime status, support bundle, status bar/dashboard, tests performance.
- **Dependencias objetivo:** PHASE 18 profiling, PHASE 20 CI gates, PHASE 21 UX state.
- **Pasos de migración:** definir schema; adaptar `InteractiveServingStatsTracker` como consumer; envolver providers fuera del pipeline; añadir diagnostics/tokens/read-only events; exponer snapshot p50/p95/p99; actualizar support bundle.
- **Tests de paridad requeridos:** snapshots actuales siguen disponibles o se reexportan.
- **Tests de conformidad requeridos:** cada provider registra evento con campos mínimos.
- **Estrategia de rollback:** mantener `recordInteractiveServingEvent` y proyectar al nuevo bus.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** no quedan timings sueltos sin event contract.
- **Docs afectadas:** target architecture, testing, performance budget si cambian campos.
- **Métricas afectadas:** todas las métricas interactivas.
- **Riesgos:** overhead y cardinalidad de labels.
- **Specs de backlog requeridas:** `PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01`.

### Refactorización — REF-10-2 — Worker/event-loop instrumentation

- **Ubicación actual:** `src/server/indexer/workerPool.ts`, `workspaceIndexer.ts`, `scheduler.ts`, `latencyGovernor.ts`, `memoryBudgets.ts`.
- **Problema actual:** falta visibilidad de busy/idle, queue depth, wait time, task duration, event-loop delay y GC pressure.
- **Ubicación objetivo:** runtime metrics + worker/scheduler snapshots.
- **Diseño objetivo:** `WorkerPoolStats`, `SchedulerLaneStats`, `EventLoopPressureStats`, `MemoryPressureStats` incorporados a `powerbuilder.showStats` y support bundle.
- **Tipo de refactor:** Metrics instrumentation.
- **Dependencias actuales:** indexer, scheduler, health dashboard, support bundle.
- **Dependencias objetivo:** PHASE 18 CPU/memory/event loop profiling y PHASE 20 gates.
- **Pasos de migración:** exponer stats sin comportamiento; medir task start/end; medir queue wait; añadir optional event-loop monitor; conectar runtime command; añadir tests con fake worker/scheduler.
- **Tests de paridad requeridos:** indexer behavior no cambia.
- **Tests de conformidad requeridos:** stats presentes y bounded; no leaking handles.
- **Estrategia de rollback:** flags/config para desactivar event-loop sampling si genera overhead.
- **Capa temporal de compatibilidad:** no.
- **Criterios de retirada:** todos los gates usan el nuevo snapshot.
- **Docs afectadas:** target architecture, performance budget/testing si se formalizan campos.
- **Métricas afectadas:** worker utilization, scheduler wait, event-loop delay, memory/GC.
- **Riesgos:** overhead y dependencia Node version para event-loop monitor.
- **Specs de backlog requeridas:** `PB-PERF-P1-WORKER-EVENT-LOOP-METRICS-01`.

### Candidatos de backlog

- `PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01` — contrato único de eventos de performance.
- `PB-PERF-P1-WORKER-EVENT-LOOP-METRICS-01` — métricas worker/scheduler/event-loop/GC.
- `PB-PERF-P1-BENCHMARK-MATRIX-COVERAGE-01` — matriz de benchmarks por feature y surface.
- `PB-PERF-P1-SYNTHETIC-10000-CORPUS-GATE-01` — corpus/gate 10,000+.
- Estos candidatos no se agregan a [docs/backlog.md](../backlog.md) hasta PHASE 13 después de completar PHASE 24.

### Documentación actualizada

- Actualizado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con `FINDING-034` a `FINDING-036`.
- Actualizado este reporte con PHASE 10.
- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) en métricas/performance gates.

### Tests o validación

- No se ejecutaron tests en PHASE 10.
- Se inspeccionaron tests/gates existentes: `test/server/performance/ci-budget-gate.perf.test.ts`, `knowledgeBase.perf.test.ts`, `large-workspace-incremental.perf.test.ts`, `tools/run-performance-budget-gate.mjs`, `lspPayloadBudgetContracts.test.ts`.

### Preguntas abiertas

- Definir si `PerformanceEvent` debe vivir en runtime-only o compartirse con `src/shared/publicApi`.
- Definir si p95/p99 se calculan in-memory con ventana acotada o solo en artefactos CI.
- Definir umbral mínimo de event-loop delay y GC pressure para `warning/degraded`.

### Evidencias

- **Referencias de código:** `src/server/runtime/interactiveServingStats.ts`; `src/server/serving/interactiveServingPipeline.ts`; `src/server/runtime/timing.ts`; `src/server/runtime/latencyGovernor.ts`; `src/server/runtime/memoryBudgets.ts`; `src/server/indexer/workerPool.ts`; `src/server/indexer/workspaceIndexer.ts`; `src/server/runtime/scheduler.ts`; `src/server/serving/payloadBudget.ts`; `src/server/handlers/featureHandlers.ts`; `tools/run-performance-budget-gate.mjs`; `test/server/performance/**`.
- **Referencias documentales:** [docs/performance-budget.md](../performance-budget.md), [docs/testing.md](../testing.md).
- **Referencias runtime:** ninguna ejecutada en vivo; evidencia estática de instrumentation disponible.
- **Referencias de test:** performance gate, KB perf, large workspace incremental, payload budget contracts.
- **Referencias PowerBuilder:** SR* indexing, DataWindow `.srd`, SQL anchors, diagnostics, semantic tokens y providers LSP.

### Referencias de fase

- **Referencias de código:** runtime timing/stats, worker pool, scheduler, indexer, feature handlers, performance tests/gate.
- **Referencias documentales:** performance budget/testing/target architecture.
- **Referencias runtime:** ninguna.
- **Referencias de investigación externa:** ninguna nueva en esta fase.
- **Referencias de candidatos backlog:** `PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01`, `PB-PERF-P1-WORKER-EVENT-LOOP-METRICS-01`, `PB-PERF-P1-BENCHMARK-MATRIX-COVERAGE-01`, `PB-PERF-P1-SYNTHETIC-10000-CORPUS-GATE-01`.

## PHASE 11 — Test architecture audit

### Alcance ejecutado

- Se auditó la estructura de tests: scripts `package.json`, docs de testing, unit/contract/integration/smoke/performance, architecture gates y performance gates.
- Se aplicaron las reglas de `.github/instructions/testing.instructions.md` y el skill `testing-validation`.
- Se buscaron coberturas obligatorias del prompt: lexer/strings, DataWindow, workspace discovery, paths, ancestor resolution, hover fast path, serving cache, invalidation, readiness, Object Explorer, SemanticQueryFacade cross-surface, diagnostics tiering, semantic tokens delta/range, worker/indexing, warm start y no full scans.

### Resumen de evidencias

| Área | Cobertura observada | Gap principal |
| --- | --- | --- |
| Unit tests | 223 archivos bajo `test/server/unit`. | Algunos tests de governance están desalineados con docs actuales. |
| Integration tests | 3 archivos: hover, documentSymbols, diagnostics. | Falta matriz LSP para completion/signature/definition/references/rename/semanticTokens. |
| Smoke tests | 10 archivos bajo `test/smoke`, incluyendo activation, health, PFC, support bundle. | Algunas read-only surfaces aún dependen de modelos planos detectados en PHASE 8. |
| Performance tests | 19 archivos bajo `test/server/performance`. | Matriz 10,000+ y features read-only/tokens/diagnostics tiers incompleta; ya cubierto por `FINDING-036`. |
| Architecture gates | `architectureImports.test.ts`, hotspot guard, `semanticArchitectureConformance.test.ts`, scripts `test:architecture:*`. | Gates textuales/parciales; hotspot guard tiene budget superado por `featureHandlers.ts`. |
| Docs/test governance | `docs/testing.md`, `testingMatrixDocs.test.ts`, `docsDriftAudit`. | `testingMatrixDocs.test` espera sección ausente. |
| Hot path guards | `interactiveHotPathGuards.test.ts`, `hotPathAllocationBudget.test.ts`, payload tests. | No todos los providers entran en stats/gates homogéneos. |
| Semantic facade/cross-surface | `semanticQueryFacade.test.ts`, `crossSurfaceGoldenMatrix.test.ts`. | Falta parity contract exhaustivo por provider y source-of-truth scanner estructural. |
| Diagnostics/tokens | múltiples diagnostics tests, `semanticTokens.test.ts`. | No hay tier pipeline ni delta/result state tests. |

### Hallazgos registrados

- `FINDING-037` — `testingMatrixDocs.test` espera una matriz documental que no existe en `docs/testing.md`.
- `FINDING-038` — Hotspot guard contiene budgets ya superados por `featureHandlers.ts`.
- `FINDING-039` — Faltan tests ejecutables para diagnostics tiers y semantic tokens delta/result state.
- `FINDING-040` — Architecture conformance tests son útiles pero demasiado textuales para los gates objetivo.
- `FINDING-041` — Integración LSP cubre solo parte de los providers críticos.

### Recomendaciones

- **Recommendation ID:** REC-11-1.
- **Resumen:** Corregir el drift entre `testingMatrixDocs.test` y `docs/testing.md` como fix seguro.
- **Motivo:** un test documental existente parece apuntar a una sección ausente.
- **Área objetivo:** docs/tests.
- **Beneficio esperado:** maintainability/CI reliability.
- **Riesgo:** duplicar workflows en `docs/testing.md`; mantenerlo conciso y enlazado a package scripts.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01` si no se corrige en PHASE 14.

- **Recommendation ID:** REC-11-2.
- **Resumen:** Crear tests contract-first para diagnostics tiers y semantic tokens delta antes del refactor.
- **Motivo:** PHASE 7 requiere rediseño, y sin tests se puede romper comportamiento visible.
- **Área objetivo:** tests/diagnostics/semanticTokens.
- **Beneficio esperado:** correctness/reactivity.
- **Riesgo:** tests pueden exponer diseño inexistente; deben empezar con contrato de target + compat assertions.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-TEST-P1-DIAGNOSTICS-TIER-CONTRACT-TESTS-01`, `PB-TEST-P1-SEMANTIC-TOKENS-DELTA-CONTRACT-TESTS-01`.

- **Recommendation ID:** REC-11-3.
- **Resumen:** Convertir conformance textual en scanner estructural con allowlists.
- **Motivo:** los gates actuales no detectan todos los bypasses de facade/cache/hot path.
- **Área objetivo:** tools/tests/CI.
- **Beneficio esperado:** architecture drift prevention.
- **Riesgo:** falsos positivos; introducir modo report-only antes de fail.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01`.

- **Recommendation ID:** REC-11-4.
- **Resumen:** Expandir integración LSP por provider crítico.
- **Motivo:** unit tests no prueban wiring/capabilities/cache/stale behavior del server.
- **Área objetivo:** integration tests/LSP handlers.
- **Beneficio esperado:** correctness.
- **Riesgo:** tests lentos o frágiles si arrancan VS Code innecesariamente; usar servidor/harness ligero.
- **Prioridad:** P2.
- **Candidato backlog:** `PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01`.

### Refactorizaciones identificadas

### Refactorización — REF-11-1 — Test lane matrix governance

- **Ubicación actual:** `docs/testing.md`, `test/server/unit/testingMatrixDocs.test.ts`, `package.json` scripts.
- **Problema actual:** el test exige una matriz documental ausente.
- **Ubicación objetivo:** sección breve en `docs/testing.md` o test actualizado si el owner cambió.
- **Diseño objetivo:** matriz de lanes que liste comandos reales, propósito, mandatory/optional y relación con CI/release.
- **Tipo de refactor:** Documentation contract alignment.
- **Dependencias actuales:** docs drift gate, release verify, package scripts.
- **Dependencias objetivo:** PHASE 15 validation y developer workflows.
- **Pasos de migración:** añadir sección canónica; enlazar a package scripts; incluir `missing: test:real-corpora`; ejecutar test focal.
- **Tests de paridad requeridos:** no aplica.
- **Tests de conformidad requeridos:** `testingMatrixDocs` y `docs:drift`.
- **Estrategia de rollback:** revertir sección si el test se actualiza a otro owner.
- **Capa temporal de compatibilidad:** no.
- **Criterios de retirada:** test y docs comparten owner estable.
- **Docs afectadas:** `docs/testing.md`.
- **Métricas afectadas:** ninguna.
- **Riesgos:** duplicación con developer workflows; mantener resumen corto.
- **Specs de backlog requeridas:** `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01` si no se corrige durante auditoría.

### Refactorización — REF-11-2 — Provider integration test matrix

- **Ubicación actual:** `test/server/integration/lsp-hover.test.ts`, `lsp-documentSymbols.test.ts`, `lsp-diagnostics.test.ts`.
- **Problema actual:** solo tres providers tienen integración LSP explícita.
- **Ubicación objetivo:** `test/server/integration/lsp-*.test.ts` por provider o suite parametrizada.
- **Diseño objetivo:** harness que abra documento PB, inicialice server/handlers mínimos y valide response/capability/cache/stale para completion, resolve, signature, definition, references, rename, semantic tokens y linked editing.
- **Tipo de refactor:** Test expansion.
- **Dependencias actuales:** handlers LSP, fixtures PB, semantic facade.
- **Dependencias objetivo:** provider adapter contract PHASE 6/17.
- **Pasos de migración:** añadir harness reusable; empezar por completion/signature/definition; luego references/rename/tokens; incluir degraded readiness cases.
- **Tests de paridad requeridos:** unit tests existentes por provider.
- **Tests de conformidad requeridos:** provider registration/capability smoke.
- **Estrategia de rollback:** suites separadas por grep si alguna es inestable.
- **Capa temporal de compatibilidad:** no.
- **Criterios de retirada:** cada provider crítico tiene unit + integration mínima.
- **Docs afectadas:** `docs/testing.md` si se amplía matriz.
- **Métricas afectadas:** test runtime.
- **Riesgos:** fragilidad por VS Code/LSP harness.
- **Specs de backlog requeridas:** `PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01`.

### Candidatos de backlog

- `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01` — alineación docs/test lanes.
- `PB-TEST-P1-DIAGNOSTICS-TIER-CONTRACT-TESTS-01` — tests de diagnostics tiers/registry.
- `PB-TEST-P1-SEMANTIC-TOKENS-DELTA-CONTRACT-TESTS-01` — tests de semantic tokens delta/result state.
- `PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01` — scanner estructural de conformance.
- `PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01` — matriz integración LSP providers.
- `PB-ARCH-P24-MODULE-SIZE-FITNESS-01` — ratchet de hotspots/tamaño alineado con PHASE 24.
- Estos candidatos no se agregan a [docs/backlog.md](../backlog.md) hasta PHASE 13 después de completar PHASE 24, salvo fix seguro en PHASE 14.

### Documentación actualizada

- Actualizado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con `FINDING-037` a `FINDING-041`.
- Actualizado este reporte con PHASE 11.
- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) con estrategia de tests/gates.

### Tests o validación

- No se ejecutaron tests en PHASE 11.
- Se ejecutó conteo estático con PowerShell: Unit 223, Integration 3, Performance 19, Smoke 10.
- Se inspeccionaron scripts: `test`, `test:unit`, `test:integration`, `test:smoke`, `test:performance`, `test:architecture:metrics`, `test:architecture:rapid`, `test:docs:drift`, `test:performance:gate`, `test:performance:soak`, `release:verify`.

### Preguntas abiertas

- Decidir si `testingMatrixDocs.test` debe corregirse con docs o si cambió el owner de la matriz.
- Definir umbral temporal para `featureHandlers.ts`: split antes de subir budget, o budget temporal con spec de reducción.
- Definir harness ligero para integración LSP sin arrancar más de lo necesario.

### Evidencias

- **Referencias de código:** `test/server/unit/testingMatrixDocs.test.ts`; `docs/testing.md`; `tools/run-architecture-hotspot-guard.mjs`; `test/server/unit/architectureImports.test.ts`; `test/server/unit/semanticArchitectureConformance.test.ts`; `test/server/unit/interactiveHotPathGuards.test.ts`; `test/server/unit/semanticTokens.test.ts`; `test/server/unit/diagnosticScheduler.test.ts`; `test/server/integration/**`; `package.json`.
- **Referencias documentales:** [docs/testing.md](../testing.md), [docs/performance-budget.md](../performance-budget.md), [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md).
- **Referencias runtime:** ninguna.
- **Referencias de test:** suites unit/integration/smoke/performance inspeccionadas.
- **Referencias PowerBuilder:** provider hot paths, diagnostics, semantic tokens, DataWindow, workspace/indexing y PFC/STD corpora.

### Referencias de fase

- **Referencias de código:** tests y tools listados arriba.
- **Referencias documentales:** testing/performance budget/target architecture.
- **Referencias runtime:** ninguna.
- **Referencias de investigación externa:** ninguna nueva en esta fase.
- **Referencias de candidatos backlog:** `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01`, `PB-TEST-P1-DIAGNOSTICS-TIER-CONTRACT-TESTS-01`, `PB-TEST-P1-SEMANTIC-TOKENS-DELTA-CONTRACT-TESTS-01`, `PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01`, `PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01`, `PB-ARCH-P24-MODULE-SIZE-FITNESS-01`.

## PHASE 12 — Target architecture document

### Alcance ejecutado

- Se revisó [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) contra el contrato del prompt.
- Se confirmó que el repositorio usa el fallback permitido `docs/instant-semantic-indexing-target.md` en lugar de `docs/architecture/instant-semantic-indexing-target.md`.
- Se actualizó el documento para que funcione como target architecture limpio, no como backlog ni findings log.
- Se mantuvo la regla de no generar backlog final antes de PHASE 24.

### Resumen de evidencias

| Sección objetivo | Estado PHASE 12 | Ajuste aplicado |
| --- | --- | --- |
| 1-5 resumen/objetivos/vista | presente | resumen ejecutivo actualizado con evidencia PHASE 0-11 y boundary claro. |
| 6-13 inputs/facts/cache/scheduler | presente | añadido flujo explícito de invalidación. |
| 14-21 providers/diagnostics/tokens/submodelos/surfaces/warm start | presente | sin cambios de alcance en PHASE 12; contenido ya alineado con hallazgos previos. |
| 22-27 módulos/simplificación/legacy/roadmap | presente | roadmap preliminar de migración añadido sin backlog final. |
| 28-30 métricas/gates/fitness | presente | PHASE 10/11 ya habían añadido requisitos de métricas y test gates. |
| 31 decisiones abiertas | presente | se mantiene como lista de decisiones no resueltas para PHASE 17-24/13. |

### Hallazgos registrados

- No se creó finding nuevo en PHASE 12.
- Los gaps de architecture target ya estaban cubiertos por `FINDING-001` a `FINDING-041`.

### Recomendaciones

- **Recommendation ID:** REC-12-1.
- **Resumen:** Mantener [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) como diseño futuro y no mezclarlo con backlog o bitácora.
- **Motivo:** evita duplicar source of truth entre findings, target y backlog.
- **Área objetivo:** docs/architecture.
- **Beneficio esperado:** maintainability.
- **Riesgo:** repetir contenido de backlog cuando PHASE 13 lo genere; evitarlo con enlaces y resúmenes.
- **Prioridad:** P0.
- **Candidato backlog:** no.

- **Recommendation ID:** REC-12-2.
- **Resumen:** Usar el roadmap preliminar del target como orden de dependencias para PHASE 23 y PHASE 13.
- **Motivo:** los refactors dependen de tests/contratos antes de mover código.
- **Área objetivo:** backlog/architecture/tests.
- **Beneficio esperado:** correctness/simplification.
- **Riesgo:** si PHASE 17-24 encuentra gates adicionales, el orden debe ajustarse antes del backlog final.
- **Prioridad:** P1.
- **Candidato backlog:** sí, se materializará después de PHASE 24.

### Refactorizaciones identificadas

- No se añadió una refactorización nueva; PHASE 12 consolidó las refactorizaciones ya registradas en PHASE 2-11 dentro del target.

### Candidatos de backlog

- No se agregan candidatos nuevos en PHASE 12.
- Los candidatos existentes se mantienen pendientes hasta PHASE 13.

### Documentación actualizada

- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md): resumen ejecutivo, boundary de flujo, modelo de invalidación y roadmap preliminar.
- Actualizado este reporte con PHASE 12.

### Tests o validación

- No se ejecutaron tests en PHASE 12.
- Validación documental pendiente para PHASE 15: `npm run test:docs:drift`.

### Preguntas abiertas

- Confirmar en PHASE 17-24 si alguna decisión abierta del target debe convertirse en finding/backlog específico.
- Confirmar si conviene mover el target a `docs/architecture/instant-semantic-indexing-target.md` o mantener fallback para no cambiar estructura documental.

### Evidencias

- **Referencias de código:** ninguna nueva.
- **Referencias documentales:** [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md), [docs/architecture.md](../architecture.md), [docs/semantic-design-target.md](../semantic-design-target.md), hallazgos PHASE 0-11.
- **Referencias runtime:** ninguna.
- **Referencias de test:** no aplica.
- **Referencias externas:** patrones investigados en PHASE 1 ya incorporados.
- **Referencias PowerBuilder:** submodelos DataWindow/SQL/native, PowerScript providers, PFC/STD-like scale.

### Referencias de fase

- **Referencias de código:** ninguna nueva.
- **Referencias documentales:** target architecture, architecture docs y findings register.
- **Referencias runtime:** ninguna.
- **Referencias de investigación externa:** PHASE 1.
- **Referencias de candidatos backlog:** ninguno nuevo.

## PHASE 17 — Architecture fitness functions and conformance gates

### Alcance ejecutado

- Se auditó la cobertura de gates existentes: import boundaries, hotspot guard, conformance semántica textual, rapid architecture gate, release readiness contract y docs/performance gates.
- Se compararon los gates actuales contra el contrato objetivo: no facade bypass, no stores paralelos, no full scans, cache discriminators, diagnostics tiers, semantic tokens delta, Object Explorer sin truncación global, read-only receipts, submodelos advisory y provider adapter declarations.

### Resumen de evidencias

| Gate | Evidencia actual | Brecha |
| --- | --- | --- |
| Import boundaries | `architectureImports.test.ts` | no cubre ciclos ni todos los bypasses por call graph. |
| Hotspot size | `run-architecture-hotspot-guard.mjs` | un budget ya parece superado y falta ratchet/owner de reducción. |
| Semantic conformance | `semanticArchitectureConformance.test.ts` | checks textuales; falta AST/import graph/allowlist. |
| Release contract | `releaseReadinessContract.test.ts`, `release:verify` | no incluye gates nuevos de 10k/payload/tokens delta. |
| Cache discriminators | `cacheKeyContract.test.ts` parcial | falta registry global de caches y simetría declarativa. |
| Provider declarations | no observado como registry obligatorio | faltan lane/budget/cache/stale/degraded por provider. |

### Hallazgos registrados

- `FINDING-004` — Gates de arquitectura semántica son parciales y textuales.
- `FINDING-038` — Hotspot guard contiene budgets ya superados por `featureHandlers.ts`.
- `FINDING-040` — Architecture conformance tests son útiles pero demasiado textuales para los gates objetivo.

### Recomendaciones

- **Recommendation ID:** REC-17-1.
- **Resumen:** Crear scanner estructural de conformance con AST/import graph y allowlists.
- **Motivo:** los checks textuales no bloquean todos los bypasses de facade/source-of-truth/hot path.
- **Área objetivo:** tests/tools/CI.
- **Beneficio esperado:** correctness/maintainability.
- **Riesgo:** falsos positivos; iniciar en report-only con fixtures negativos.
- **Prioridad:** P0.
- **Candidato backlog:** `PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01`.

- **Recommendation ID:** REC-17-2.
- **Resumen:** Añadir gates de cycles, cache registry y provider adapter declarations.
- **Motivo:** son contracts centrales del target y no están endurecidos.
- **Área objetivo:** architecture/tests/runtime.
- **Beneficio esperado:** simplification/reactivity.
- **Riesgo:** sobre-especificar adapters antes de cerrar compat layers; usar allowlists versionadas.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-ARCH-P0-CYCLE-DETECTION-01`, `PB-ARCH-P1-CACHE-KEY-SYMMETRY-01`, `PB-ARCH-P1-PROVIDER-ADAPTER-CONTRACT-01`.

### Refactorizaciones identificadas

### Refactorización — REF-17-1 — Architecture conformance scanner

- **Ubicación actual:** `test/server/unit/semanticArchitectureConformance.test.ts`, `test/server/unit/architectureImports.test.ts`, `tools/run-architecture-rapid-gate.mjs`.
- **Problema actual:** mezcla de checks textuales y scripts dispersos sin call/import graph suficiente.
- **Ubicación objetivo:** `tools/architecture-conformance/` o script único con módulos `imports`, `calls`, `cacheContracts`, `providers`, `legacy`.
- **Diseño objetivo:** scanner que parsea TS, aplica allowlists versionadas, genera JSON estable y alimenta tests unit/rapid/release.
- **Tipo de refactor:** Architecture gate.
- **Dependencias actuales:** tests unit, release verify, docs/performance budget.
- **Dependencias objetivo:** PHASE 24 simplification gates y PHASE 13 backlog.
- **Pasos de migración:** crear report-only; añadir fixtures negativos; mover checks textuales existentes; activar failure por categorías; documentar allowlists.
- **Tests de paridad requeridos:** tests actuales deben seguir pasando.
- **Tests de conformidad requeridos:** fixture de provider bypass, cache key incompleta, import cycle y legacy sin owner.
- **Estrategia de rollback:** desactivar categoría nueva en report-only sin quitar scanner.
- **Capa temporal de compatibilidad:** sí, checks textuales quedan como smoke hasta migrar.
- **Criterios de retirada:** scanner cubre todos los checks textuales con fixtures negativos.
- **Docs afectadas:** `docs/testing.md`, `docs/architecture-status.md`, target architecture.
- **Métricas afectadas:** duración de architecture gate.
- **Riesgos:** falsos positivos por patterns dinámicos.
- **Specs de backlog requeridas:** `PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01`.

### Candidatos de backlog

- `PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01`.
- `PB-ARCH-P0-CYCLE-DETECTION-01`.
- `PB-ARCH-P1-CACHE-KEY-SYMMETRY-01`.
- `PB-ARCH-P1-PROVIDER-ADAPTER-CONTRACT-01`.
- `PB-ARCH-P1-CONFORMANCE-GATE-FINDINGS-01`.

### Documentación actualizada

- Actualizado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) ampliando `FINDING-040`.
- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) sección 29.

### Tests o validación

- No se ejecutaron gates en PHASE 17.
- Validación pendiente PHASE 15: `npm run test:architecture:rapid` y `npm run test:architecture:metrics` si se decide ejecutarlo como diagnóstico.

### Preguntas abiertas

- Qué herramienta usar para AST/import graph: API TypeScript propia, script ligero o dependencia externa.
- Si el scanner debe fallar desde el primer PR o comenzar en report-only.

### Evidencias

- **Referencias de código:** `test/server/unit/architectureImports.test.ts`, `test/server/unit/semanticArchitectureConformance.test.ts`, `tools/run-architecture-hotspot-guard.mjs`, `tools/run-architecture-rapid-gate.mjs`.
- **Referencias documentales:** [docs/performance-budget.md](../performance-budget.md), [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md).
- **Referencias runtime:** ninguna.
- **Referencias de test:** gates unit/rapid/hotspot existentes.
- **Referencias externas:** PHASE 1 architecture fitness functions.
- **Referencias PowerBuilder:** providers PowerScript/DataWindow/SQL/native y source-of-truth boundaries.

### Referencias de fase

- **Referencias de código:** architecture tests/tools.
- **Referencias documentales:** target architecture/testing/performance budget.
- **Referencias runtime:** ninguna.
- **Referencias de investigación externa:** PHASE 1.
- **Referencias de candidatos backlog:** `PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01`, `PB-ARCH-P0-CYCLE-DETECTION-01`, `PB-ARCH-P1-CACHE-KEY-SYMMETRY-01`, `PB-ARCH-P1-PROVIDER-ADAPTER-CONTRACT-01`.

## PHASE 18 — CPU, memory, event loop and worker profiling audit

### Alcance ejecutado

- Se auditó instrumentación runtime/profiling: journal, interactive stats, timing, memory budgets, scheduler, worker pool, indexer status y performance tests.
- Se buscó evidencia de event-loop delay/utilization, GC pressure, worker serialization, activation/startup y payload correlation.

### Resumen de evidencias

| Área | Estado | Brecha |
| --- | --- | --- |
| Runtime journal | existe `runtimeJournal` | no sustituye performance event completo. |
| Interactive stats | existe `interactiveServingStats` | no cubre todos providers ni p95/p99/correlación completa. |
| Scheduler | status de colas/activos/preemptions | falta wait/run duration por lane. |
| Worker pool | workers/queue/tasks | falta busy/idle, queue depth, serialization, failures, throughput. |
| Memory | `memoryBudgets` usa `process.memoryUsage()` | falta GC/event-loop pressure. |
| Activation/startup | smoke de activación | falta métrica centralizada en runtime event contract. |

### Hallazgos registrados

- `FINDING-034` — Métricas interactivas existen pero no cubren todo el contrato de performance.
- `FINDING-035` — Worker pool, event loop y GC/memoria no tienen instrumentación ejecutable suficiente.

### Recomendaciones

- **Recommendation ID:** REC-18-1.
- **Resumen:** Crear `PerformanceEvent`/metrics registry homogéneo con percentiles y correlation IDs.
- **Motivo:** los promedios y logs parciales no bastan para diagnosticar 10,000+.
- **Área objetivo:** runtime/performance tests.
- **Beneficio esperado:** speed/reactivity observables.
- **Riesgo:** overhead si se emite demasiada metadata; limitar payload y sampling.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01`.

- **Recommendation ID:** REC-18-2.
- **Resumen:** Instrumentar worker pool, scheduler, event loop y GC pressure.
- **Motivo:** background indexing puede competir con hot paths sin explicación visible.
- **Área objetivo:** runtime/indexer.
- **Beneficio esperado:** performance/capacity planning.
- **Riesgo:** métricas dependientes de Node/entorno; tolerancias amplias en CI.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-PERF-P1-WORKER-EVENT-LOOP-METRICS-01`.

### Refactorizaciones identificadas

### Refactorización — REF-18-1 — Runtime metrics registry

- **Ubicación actual:** `runtimeJournal`, `interactiveServingStats`, `timing`, `scheduler`, `workerPool`.
- **Problema actual:** métricas fragmentadas sin schema único ni coverage por provider/lane/workload.
- **Ubicación objetivo:** `src/server/runtime/metrics/` o `src/server/runtime/performanceEvents.ts`.
- **Diseño objetivo:** evento pequeño, serializable, con `feature/method`, `lane`, `uri/version/fingerprint`, `duration`, `wait`, `payload`, `cacheOutcome`, `cancel/error`, `budget`, `epoch`, `workspace`.
- **Tipo de refactor:** Contract centralization.
- **Dependencias actuales:** providers, scheduler, worker pool, performance tests.
- **Dependencias objetivo:** CI gates PHASE 20.
- **Pasos de migración:** definir schema; adaptar trackers existentes; añadir adapter para worker/scheduler; emitir JSON en gates; luego endurecer budgets.
- **Tests de paridad requeridos:** snapshots de stats existentes.
- **Tests de conformidad requeridos:** provider coverage gate.
- **Estrategia de rollback:** mantener trackers actuales como proyección derivada.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** todas las features críticas emiten `PerformanceEvent`.
- **Docs afectadas:** `docs/performance-budget.md`, target architecture.
- **Métricas afectadas:** todas las métricas runtime.
- **Riesgos:** overhead y ruido de datos.
- **Specs de backlog requeridas:** `PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01`.

### Candidatos de backlog

- `PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01`.
- `PB-PERF-P1-WORKER-EVENT-LOOP-METRICS-01`.
- `PB-ARCH-P1-WORKER-SERIALIZATION-PROFILING-01`.
- `PB-RUNTIME-P1-EVENTLOOP-DELAY-INSTRUMENTATION-01`.
- `PB-HOTPATH-P1-ACTIVATION-METRICS-CENTRALIZED-01`.

### Documentación actualizada

- Actualizados `FINDING-034` y `FINDING-035`.
- Actualizado [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md) sección 28.

### Tests o validación

- No se ejecutó profiling runtime.
- PHASE 15 ejecutará los gates disponibles; los nuevos eventos quedan como backlog.

### Preguntas abiertas

- Qué nivel de sampling usar para event-loop/GC sin hacer la extensión más pesada.
- Cómo normalizar métricas entre Windows/Linux/macOS y CI local.

### Evidencias

- **Referencias de código:** `src/server/runtime/runtimeJournal.ts`, `src/server/runtime/interactiveServingStats.ts`, `src/server/runtime/timing.ts`, `src/server/runtime/memoryBudgets.ts`, `src/server/runtime/scheduler.ts`, `src/server/indexer/workerPool.ts`, `src/server/indexer/workspaceIndexer.ts`.
- **Referencias documentales:** [docs/performance-budget.md](../performance-budget.md).
- **Referencias runtime:** no se capturaron perfiles nuevos.
- **Referencias de test:** `test/server/performance/**`.
- **Referencias externas:** Node worker/event-loop patterns de PHASE 1.
- **Referencias PowerBuilder:** parsing/indexing de SR*, DataWindow/SQL/native.

### Referencias de fase

- **Referencias de código:** runtime/indexer/performance tests.
- **Referencias documentales:** performance budget/target architecture.
- **Referencias runtime:** ninguna nueva.
- **Referencias de investigación externa:** PHASE 1 Node workers/event loop.
- **Referencias de candidatos backlog:** métricas runtime, worker/event-loop, activation metrics.

## PHASE 19 — Synthetic 10,000+ workspace and corpus scalability audit

### Alcance ejecutado

- Se auditó la estrategia de corpus y benchmarks existentes frente a escenarios 10,000+: archivos, símbolos, manifests, bibliotecas, herencia, DataWindow, SQL, native, edición activa, warm start, Object Explorer, references/rename.

### Resumen de evidencias

| Test/corpus | Tamaño observado | Brecha |
| --- | --- | --- |
| `knowledgeBase.perf.test.ts` | 5,000 docs sintéticos | solo KB, sin dominios PB completos. |
| `large-workspace-incremental.perf.test.ts` | 256 baseline + bursts | watcher incremental, no 10k semantic. |
| Soak/session tests | ~100 docs/synthetic inventory | estabilidad parcial. |
| PFC/OrderEntry/public corpora | reales opcionales | no determinísticos/obligatorios para 10k. |

### Hallazgos registrados

- `FINDING-007` — No existe corpus semántico sintético 10,000+ que combine dominios PowerBuilder.
- `FINDING-036` — Performance gate es valioso pero no cubre la matriz 10,000+ ni todas las features críticas.

### Recomendaciones

- **Recommendation ID:** REC-19-1.
- **Resumen:** Crear generador sintético 10,000+ parametrizable y representativo de PowerBuilder.
- **Motivo:** la escala objetivo no debe depender de extrapolación.
- **Área objetivo:** tests/performance/corpus.
- **Beneficio esperado:** performance/correctness.
- **Riesgo:** corpus artificial demasiado limpio; incorporar patrones PFC/STD y ruido realista.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-PERF-P2-10K-SEMANTIC-CORPUS-01`.

- **Recommendation ID:** REC-19-2.
- **Resumen:** Separar smoke CI reducido y nightly/optional completo para 10k.
- **Motivo:** 10k completo puede ser pesado para cada PR, pero debe existir como gate de regresión.
- **Área objetivo:** CI/performance.
- **Beneficio esperado:** speed/release confidence.
- **Riesgo:** métricas flaky por hardware; usar budgets por tendencia y artefactos JSON.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-PERF-P1-SYNTHETIC-10000-CORPUS-GATE-01`.

### Refactorizaciones identificadas

### Refactorización — REF-19-1 — Corpus generator and benchmark matrix

- **Ubicación actual:** tests performance con generadores locales parciales.
- **Problema actual:** no hay generador 10k multi-dominio ni matriz única de escenarios.
- **Ubicación objetivo:** `test/server/performance/corpus/` o `tools/generate-synthetic-powerbuilder-corpus.mjs`.
- **Diseño objetivo:** generador determinístico con seed, counts por dominio, PFC-like inheritance, DataWindow/SQL/native samples y manifests grandes.
- **Tipo de refactor:** Test gate.
- **Dependencias actuales:** performance tests, pfc/orderentry helpers.
- **Dependencias objetivo:** CI/nightly gates y target architecture.
- **Pasos de migración:** crear generador pequeño; añadir smoke 1k/2k; añadir 10k nightly; conectar métricas JSON; documentar budgets.
- **Tests de paridad requeridos:** no aplica.
- **Tests de conformidad requeridos:** corpus schema y deterministic seed test.
- **Estrategia de rollback:** mantener smoke reducido si nightly falla por entorno.
- **Capa temporal de compatibilidad:** sí, tests existentes quedan.
- **Criterios de retirada:** corpus 10k cubre dominios obligatorios y reemplaza extrapolaciones.
- **Docs afectadas:** `docs/testing.md`, `docs/performance-budget.md`.
- **Métricas afectadas:** indexing throughput, payload, memory, hot path latency.
- **Riesgos:** coste CI y representatividad.
- **Specs de backlog requeridas:** `PB-PERF-P2-10K-SEMANTIC-CORPUS-01`.

### Candidatos de backlog

- `PB-PERF-P2-10K-SEMANTIC-CORPUS-01`.
- `PB-PERF-P1-SYNTHETIC-10000-CORPUS-GATE-01`.
- `PB-PERF-P1-BENCHMARK-MATRIX-COVERAGE-01`.

### Documentación actualizada

- Actualizado `FINDING-007` y `FINDING-036`.
- Actualizado target architecture sección 28.

### Tests o validación

- No se ejecutaron performance tests en PHASE 19.

### Preguntas abiertas

- Tamaño final del nightly: 10k exacto, 10k+ con variación o niveles 2k/10k/25k.
- Cómo mantener fixtures generados fuera del repo si son grandes.

### Evidencias

- **Referencias de código:** `test/server/performance/knowledgeBase.perf.test.ts`, `test/server/performance/large-workspace-incremental.perf.test.ts`, `test/server/performance/session-stability-soak.perf.test.ts`, helpers PFC/OrderEntry/public corpus.
- **Referencias documentales:** performance budget, target architecture.
- **Referencias runtime:** ninguna.
- **Referencias de test:** performance suites existentes.
- **Referencias externas:** benchmarking/corpus patterns PHASE 1.
- **Referencias PowerBuilder:** SR*, DataWindow, SQL, native/external, PFC/STD.

### Referencias de fase

- **Referencias de código:** performance tests/corpus helpers.
- **Referencias documentales:** target/performance budget/testing.
- **Referencias runtime:** ninguna.
- **Referencias de investigación externa:** PHASE 1.
- **Referencias de candidatos backlog:** corpus 10k, benchmark matrix, nightly gate.

## PHASE 20 — CI and release performance regression gates

### Alcance ejecutado

- Se auditó `package.json`, workflow de release readiness, scripts de gates y alcance del performance gate.
- Se comparó `release:verify` contra gates objetivo de docs drift, architecture conformance, hot path scans, cache keys, Object Explorer, hover/completion while indexing, diagnostics tiers, tokens, indexing throughput, memory y payloads.

### Resumen de evidencias

| Gate/script | Estado | Brecha |
| --- | --- | --- |
| `release:verify` | incluye `npm test`, architecture rapid, docs drift, performance gate, catalog, VSIX, smoke installed | no incluye nuevos gates 10k/payload/tokens delta/worker metrics. |
| Workflow release | ejecuta `xvfb-run -a npm run release:verify` | no lane nightly/optional 10k. |
| `test:performance:gate` | operativo | corpus pequeño y features parciales. |
| `test:architecture:rapid` | operativo | puede skippear corpora reales si no existen. |
| `test:docs:drift` | operativo | drift detectado por PHASE 11 en `docs/testing.md`. |

### Hallazgos registrados

- `FINDING-036` — Performance gate es valioso pero no cubre la matriz 10,000+ ni todas las features críticas.
- `FINDING-042` — Payload budgets existen pero no están endurecidos como gate de release por superficie.
- `FINDING-037` — `testingMatrixDocs.test` espera una matriz documental que no existe en `docs/testing.md`.

### Recomendaciones

- **Recommendation ID:** REC-20-1.
- **Resumen:** Mantener `release:verify` como gate central y añadir lanes nuevos por fases, no todo de golpe.
- **Motivo:** release ya tiene buen carril; los nuevos gates deben entrar con estabilidad.
- **Área objetivo:** CI/release.
- **Beneficio esperado:** release confidence.
- **Riesgo:** aumentar demasiado tiempo de CI; usar split fast/nightly.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-CI-P1-REGRESSION-GATE-10K-01`.

- **Recommendation ID:** REC-20-2.
- **Resumen:** Endurecer payload budgets y semantic tokens delta/resultId como gates.
- **Motivo:** latencia sin payload/result correctness no demuestra instantaneidad.
- **Área objetivo:** CI/tests/performance.
- **Beneficio esperado:** reactivity/correctness.
- **Riesgo:** umbrales iniciales difíciles; empezar warning/report-only.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-ARCH-P1-LSP-PAYLOAD-BUDGET-ENFORCE-01`, `PB-ARCH-P1-SEMANTIC-TOKENS-DELTA-RANGE-GATE-01`.

### Refactorizaciones identificadas

### Refactorización — REF-20-1 — Release regression gate matrix

- **Ubicación actual:** `package.json` scripts, `.github/workflows/release-readiness.yml`, tools gates.
- **Problema actual:** release verifica mucho, pero no los gates nuevos derivados del target.
- **Ubicación objetivo:** scripts separados por lane: fast PR, release verify, optional/nightly 10k.
- **Diseño objetivo:** matriz de comandos con artefactos JSON estables y policy de fail/warn por gate.
- **Tipo de refactor:** Architecture gate.
- **Dependencias actuales:** build/test/vsix scripts.
- **Dependencias objetivo:** corpus 10k y performance event contract.
- **Pasos de migración:** documentar lanes; añadir payload gate report-only; añadir tokens contract; añadir nightly 10k; promover a fail cuando estable.
- **Tests de paridad requeridos:** release readiness contract.
- **Tests de conformidad requeridos:** docs matrix + release script contract.
- **Estrategia de rollback:** bajar gate nuevo a warning sin remover reporte.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** todos los gates target están en CI/release/nightly con owner.
- **Docs afectadas:** `docs/testing.md`, `docs/release.md`, performance budget.
- **Métricas afectadas:** release time, performance artifacts.
- **Riesgos:** CI lento/flaky.
- **Specs de backlog requeridas:** `PB-CI-P1-REGRESSION-GATE-10K-01`.

### Candidatos de backlog

- `PB-CI-P1-REGRESSION-GATE-10K-01`.
- `PB-ARCH-P1-LSP-PAYLOAD-BUDGET-ENFORCE-01`.
- `PB-ARCH-P1-SEMANTIC-TOKENS-DELTA-RANGE-GATE-01`.
- `PB-ARCH-P1-CONFORMANCE-GATE-FINDINGS-01`.

### Documentación actualizada

- Actualizado `FINDING-036` y agregado `FINDING-042`.
- Actualizado target architecture sección 28.

### Tests o validación

- No se ejecutaron comandos de CI en PHASE 20.
- PHASE 15 intentará `test:docs:drift`, `test:architecture:rapid`, `test:performance:gate`, `test`.

### Preguntas abiertas

- Si 10k debe vivir en GitHub Actions scheduled/nightly o solo como local/release manual mientras se estabiliza.
- Cómo publicar artefactos performance sin saturar almacenamiento.

### Evidencias

- **Referencias de código:** `package.json`, `.github/workflows/release-readiness.yml`, `tools/run-performance-budget-gate.mjs`, `tools/run-architecture-rapid-gate.mjs`, `tools/docs-drift-audit.cjs`, `tools/run-architecture-hotspot-guard.mjs`.
- **Referencias documentales:** release/performance/testing docs.
- **Referencias runtime:** ninguna.
- **Referencias de test:** release scripts y performance gate.
- **Referencias externas:** CI gating patterns PHASE 1.
- **Referencias PowerBuilder:** corpus real/opcional PFC/OrderEntry y corpus 10k pendiente.

### Referencias de fase

- **Referencias de código:** package/workflow/tools.
- **Referencias documentales:** testing/release/performance.
- **Referencias runtime:** ninguna.
- **Referencias de investigación externa:** PHASE 1.
- **Referencias de candidatos backlog:** CI 10k, payload gate, tokens delta gate.

## PHASE 21 — Perceived instantaneity and UX state audit

### Alcance ejecutado

- Se auditó readiness, loading/degraded/stale/ready states, progress, hover/completion during indexing, Object Explorer lazy UX, manual refresh, server-driven refresh vs client heuristics y mensajes de estado.

### Resumen de evidencias

| Superficie | Evidencia | Brecha |
| --- | --- | --- |
| Readiness | `ReadinessState = idle/discovering/indexing/degraded/ready/error` | no envelope UI uniforme. |
| Progress | discovery/indexer callbacks | sin ETA/degradation strategy visible. |
| Object Explorer | cliente/modelo + manifest plano | no lazy/paginado server-owned. |
| Manual refresh | comandos de refresh | feedback UX no uniforme. |
| Stale/degraded metadata | campos parciales en public API | no visible consistentemente en UI. |
| Hover/completion while indexing | target docs y fast paths parciales | faltan tests CI/smoke explícitos. |

### Hallazgos registrados

- `FINDING-001` — Object Explorer depende de manifiesto plano de gran tamaño.
- `FINDING-027` — Superficies read-only no comparten contrato uniforme de frescura, caps y receipts.
- `FINDING-043` — Estados stale/degraded/paged existen como contrato parcial pero no como UX visible y uniforme.

### Recomendaciones

- **Recommendation ID:** REC-21-1.
- **Resumen:** Definir `ReadOnlySurfaceStateEnvelope` visible en cliente.
- **Motivo:** instantaneidad percibida depende de estados claros mientras indexa.
- **Área objetivo:** client/views/shared contracts.
- **Beneficio esperado:** UX/reactivity.
- **Riesgo:** exceso de mensajes; mantener microcopy compacta y consistente.
- **Prioridad:** P2.
- **Candidato backlog:** `PB-UX-P2-DEGRADED-STALE-MESSAGING-UI-01`.

- **Recommendation ID:** REC-21-2.
- **Resumen:** Añadir smoke de hover/completion útiles durante indexing.
- **Motivo:** es una promesa central de instant semantics.
- **Área objetivo:** tests/LSP/UX.
- **Beneficio esperado:** perceived speed.
- **Riesgo:** tests frágiles si dependen de timing; usar readiness fakes o scheduler controlado.
- **Prioridad:** P2.
- **Candidato backlog:** `PB-UX-P2-HOVER-COMPLETION-INDEXING-VERIFY-01`.

### Refactorizaciones identificadas

### Refactorización — REF-21-1 — Read-only UX state envelope

- **Ubicación actual:** readiness tracker, shared public API parcial, views/panels individuales.
- **Problema actual:** estados parciales sin render uniforme ni receipts visibles.
- **Ubicación objetivo:** `src/shared/contracts/readOnlySurfaceState.ts`, adapters en `src/client/views/*` y server projections.
- **Diseño objetivo:** envelope con `state`, `freshness`, `sourceSnapshot`, `paged`, `truncatedReason`, `degradedReason`, `refreshToken`, `manualRefreshAvailable`.
- **Tipo de refactor:** DTO/projection centralization.
- **Dependencias actuales:** Object Explorer, Current Object Context, Diagnostics Explainability, health/status, bundles.
- **Dependencias objetivo:** read-only projection contract y paginated Object Explorer.
- **Pasos de migración:** definir DTO opcional; adaptar una superficie piloto; tests snapshots; expandir a surfaces restantes; mostrar UI compacta.
- **Tests de paridad requeridos:** snapshots de models actuales.
- **Tests de conformidad requeridos:** cada surface expone state envelope.
- **Estrategia de rollback:** mantener fields actuales y envelope opcional.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** todos los clients usan envelope.
- **Docs afectadas:** UX/read-only docs, target architecture.
- **Métricas afectadas:** UI state transitions, refresh latency.
- **Riesgos:** ruido visual.
- **Specs de backlog requeridas:** `PB-UX-P2-DEGRADED-STALE-MESSAGING-UI-01`.

### Candidatos de backlog

- `PB-UX-P2-DEGRADED-STALE-MESSAGING-UI-01`.
- `PB-UX-P2-PROGRESS-REPORTING-ETA-01`.
- `PB-UX-P2-HOVER-COMPLETION-INDEXING-VERIFY-01`.
- `PB-UX-P2-REFRESH-HEURISTICS-DOC-01`.

### Documentación actualizada

- Agregado `FINDING-043`.
- Actualizado target architecture sección 20.

### Tests o validación

- No se ejecutaron UI/smoke tests en PHASE 21.

### Preguntas abiertas

- Qué mensajes visibles se aceptan para no saturar VS Code.
- Si progress debe ser status bar, output channel, tree item context o todos según surface.

### Evidencias

- **Referencias de código:** `src/server/workspace/readiness.ts`, `src/client/objectExplorer.ts`, `src/client/objectExplorerModel.ts`, `src/shared/publicApi.ts`, command registration refresh commands.
- **Referencias documentales:** target architecture, findings PHASE 8.
- **Referencias runtime:** ninguna.
- **Referencias de test:** faltan tests de UX/readiness parcial.
- **Referencias externas:** VS Code TreeDataProvider/progress patterns PHASE 1.
- **Referencias PowerBuilder:** navegación de objetos, DataWindow/SQL summaries, diagnostics.

### Referencias de fase

- **Referencias de código:** readiness/client views/shared API.
- **Referencias documentales:** target/read-only findings.
- **Referencias runtime:** ninguna.
- **Referencias de investigación externa:** PHASE 1 VS Code TreeDataProvider/progress.
- **Referencias de candidatos backlog:** UX envelope/progress/indexing smoke.

## PHASE 22 — Target module structure and package organization

### Alcance ejecutado

- Se clasificó la estructura actual bajo `src/server`, `src/client` y `src/shared` contra dominios objetivo: semantic, diagnostics, features adapters, runtime, indexing, workspace, client views/panels y shared contracts/protocol.

### Resumen de evidencias

| Módulo actual | Estado | Target |
| --- | --- | --- |
| `src/server/features/` | ~63 archivos de responsabilidades variadas | providers delgados + submodelos movidos a semantic/diagnostics. |
| `src/server/handlers/featureHandlers.ts` | 1674 líneas | registry/adapters por provider. |
| `src/client/extension.ts` | 5371 líneas | activation/commands/views/lifecycle separados. |
| `src/shared/publicApi.ts` | 3167 líneas | contracts/protocol/schemas/barrel estable. |
| `diagnostics.ts` | 1961 líneas | `src/server/diagnostics/registry|tiers|pipeline`. |
| DataWindow modules | grandes y repartidos | `semantic/submodels/datawindow/*`. |

### Hallazgos registrados

- `FINDING-029` — Dispatch de reglas diagnostics está monolítico y sin registry ejecutable.
- `FINDING-030` — DataWindow model y property paths son módulos sobredimensionados con responsabilidades mezcladas.
- `FINDING-031` — Orquestadores principales concentran demasiadas responsabilidades.

### Recomendaciones

- **Recommendation ID:** REC-22-1.
- **Resumen:** Crear scaffolds de dominios target antes de mover lógica.
- **Motivo:** evita big-bang y permite adapters de compatibilidad.
- **Área objetivo:** architecture/code organization.
- **Beneficio esperado:** simplification/maintainability.
- **Riesgo:** scaffolds vacíos si no se migran con specs; cada scaffold debe tener owner.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01`.

- **Recommendation ID:** REC-22-2.
- **Resumen:** Priorizar diagnostics registry y DataWindow split como primeros moves productivos.
- **Motivo:** son módulos grandes con impacto semántico y hot/read-only paths.
- **Área objetivo:** diagnostics/datawindow.
- **Beneficio esperado:** correctness/simplification.
- **Riesgo:** cambios de comportamiento; tests de paridad primero.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-DIAG-P0-TIERED-DIAGNOSTICS-PIPELINE-01`, `PB-ARCH-P9-DATAWINDOW-MODEL-SPLIT-01`.

### Refactorizaciones identificadas

### Refactorización — REF-22-1 — Target semantic package layout

- **Ubicación actual:** `analysis`, `features`, `serving`, `knowledge`, `cache`, `runtime`, `workspace` dispersos.
- **Problema actual:** ownership de semantic input/facts/indexes/snapshot/query/cache no está expresado por estructura.
- **Ubicación objetivo:** `src/server/semantic/{input,facts,indexes,snapshot,query,cache,submodels}`.
- **Diseño objetivo:** dominios pequeños con barrels internos y adapters públicos estables.
- **Tipo de refactor:** Move/Split/Contract centralization.
- **Dependencias actuales:** providers, KnowledgeBase, DocumentCache, analysis cache, workspaceIndexer.
- **Dependencias objetivo:** conformance scanner y provider adapters.
- **Pasos de migración:** crear scaffold; mover contracts types-only; añadir re-exports; mover query facade; mover cache registry; mover submodels por spec.
- **Tests de paridad requeridos:** semantic facade, cache, cross-surface matrix.
- **Tests de conformidad requeridos:** import boundary/cycle gates.
- **Estrategia de rollback:** re-export desde ubicación vieja y revertir move por módulo.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** imports nuevos consumen target path y conformance bloquea ruta vieja.
- **Docs afectadas:** architecture/status/implementation map/testing.
- **Métricas afectadas:** build/test import churn.
- **Riesgos:** ciclos y churn.
- **Specs de backlog requeridas:** `PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01`.

### Candidatos de backlog

- `PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01`.
- `PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01`.
- `PB-ARCH-P2-CLIENT-EXTENSION-SPLIT-01`.
- `PB-ARCH-P2-PUBLICAPI-SCHEMA-SEPARATION-01`.
- `PB-ARCH-P1-LSP-PROVIDER-ADAPTER-SPLIT-01`.
- `PB-ARCH-P9-DATAWINDOW-MODEL-SPLIT-01`.
- `PB-ARCH-P9-DIAGNOSTICS-MODULE-SPLIT-01`.

### Documentación actualizada

- Actualizado target architecture sección 22.

### Tests o validación

- No se ejecutaron tests en PHASE 22.

### Preguntas abiertas

- Si `SemanticQueryFacade` debe moverse físicamente pronto o primero quedarse con re-export desde `features`.
- Si `shared/publicApi.ts` debe dividirse antes o después de estabilizar protocol contracts.

### Evidencias

- **Referencias de código:** `src/server/**`, `src/client/**`, `src/shared/publicApi.ts`, `src/server/features/diagnostics.ts`, DataWindow modules.
- **Referencias documentales:** target architecture, architecture implementation map.
- **Referencias runtime:** ninguna.
- **Referencias de test:** hotspot guard y import boundary tests.
- **Referencias externas:** refactoring/strangler PHASE 1.
- **Referencias PowerBuilder:** DataWindow/SQL/native submodels y providers PowerScript.

### Referencias de fase

- **Referencias de código:** current src package layout.
- **Referencias documentales:** target architecture.
- **Referencias runtime:** ninguna.
- **Referencias de investigación externa:** PHASE 1 refactoring.
- **Referencias de candidatos backlog:** module scaffold/splits.

## PHASE 23 — Major refactor planning and migration roadmap

### Alcance ejecutado

- Se ordenaron los refactors mayores detectados PHASE 2-22 en una ruta incremental, con dependencias de tests/contratos, rollback y retirement.

### Resumen de evidencias

| Bloque | Dependencia previa | Riesgo si se adelanta |
| --- | --- | --- |
| Diagnostics tier/registry | tests de tiers/reglas | cambios de ruido/diagnostics. |
| Semantic tokens delta | tests result state/fingerprint | tokens obsoletos o delta incorrecto. |
| Provider adapters | conformance + integration tests | wiring/capabilities rotos. |
| DataWindow split | parity fixtures `.srd` | pérdida de confidence/sourceOrigin. |
| Object Explorer lazy | projection envelope/payload gate | regressions de UI o manifest incompleto. |
| Legacy retirement | gate + owner + parity | borrado prematuro o compat permanente. |

### Hallazgos registrados

- No se creó finding nuevo; el roadmap se apoya en `FINDING-001` a `FINDING-043`.

### Recomendaciones

- **Recommendation ID:** REC-23-1.
- **Resumen:** Ejecutar refactors por oleadas contract-first, no por tamaño de archivo solamente.
- **Motivo:** los cambios semánticos necesitan pruebas antes de moves.
- **Área objetivo:** backlog/architecture.
- **Beneficio esperado:** correctness/simplification.
- **Riesgo:** oleadas largas; definir acceptance criteria verificables.
- **Prioridad:** P0.
- **Candidato backlog:** se materializa en PHASE 13.

- **Recommendation ID:** REC-23-2.
- **Resumen:** Todo compat layer debe tener criterio de retirada y gate.
- **Motivo:** evitar que la migración strangler cree legacy nuevo.
- **Área objetivo:** architecture/legacy.
- **Beneficio esperado:** maintainability.
- **Riesgo:** retirar antes de paridad; gate debe exigir evidencia.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01`, `PB-ARCH-P23-COMPAT-LAYER-RETIREMENT-GATE-01`.

### Refactorizaciones identificadas

### Refactorización — REF-23-1 — Ordered strangler migration roadmap

- **Ubicación actual:** findings/refactors PHASE 2-22.
- **Problema actual:** muchos refactors necesarios sin orden final único.
- **Ubicación objetivo:** backlog PHASE 13 con orden recomendado y dependencias explícitas.
- **Diseño objetivo:** oleadas: tests/contracts, provider/facade convergence, diagnostics, DataWindow/SQL/native submodels, cache/persistence invariants, read-only projections, module splits, legacy retirement, gates.
- **Tipo de refactor:** Migration roadmap.
- **Dependencias actuales:** todos los findings abiertos.
- **Dependencias objetivo:** backlog completo.
- **Pasos de migración:** generar backlog tras PHASE 24; validar duplicados con specs existentes; ordenar P0/P1/P2; conectar findings/backlog.
- **Tests de paridad requeridos:** por bloque.
- **Tests de conformidad requeridos:** PHASE 17/24 gates.
- **Estrategia de rollback:** cada spec define rollback local.
- **Capa temporal de compatibilidad:** sí, con retirement criteria.
- **Criterios de retirada:** aceptación de cada spec + gate verde.
- **Docs afectadas:** backlog, current-focus, roadmap, architecture-status si cambia estado.
- **Métricas afectadas:** build/test/performance gates.
- **Riesgos:** duplicar backlog existente; PHASE 13 debe mergear.
- **Specs de backlog requeridas:** múltiples, generadas PHASE 13.

### Candidatos de backlog

- `PB-ARCH-P23-MAJOR-REFACTOR-ROADMAP-01`.
- `PB-ARCH-P23-COMPAT-LAYER-RETIREMENT-GATE-01`.
- `PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01`.

### Documentación actualizada

- Actualizado target architecture sección 27.

### Tests o validación

- No se ejecutaron tests en PHASE 23.

### Preguntas abiertas

- Si PHASE 13 debe crear un solo roadmap parent item o specs independientes con orden recomendado.
- Cómo marcar specs existentes como absorbed/superseded sin duplicar.

### Evidencias

- **Referencias de código:** módulos/hallazgos PHASE 2-22.
- **Referencias documentales:** specs existentes bajo `specs/`, backlog, target architecture.
- **Referencias runtime:** ninguna.
- **Referencias de test:** coverage gaps PHASE 11/17.
- **Referencias externas:** strangler modernization PHASE 1.
- **Referencias PowerBuilder:** todos los subdominios semánticos.

### Referencias de fase

- **Referencias de código:** no nuevas.
- **Referencias documentales:** findings/target/specs/backlog.
- **Referencias runtime:** ninguna.
- **Referencias de investigación externa:** PHASE 1.
- **Referencias de candidatos backlog:** roadmap/compat/legacy.

## PHASE 24 — Simplification and maintainability fitness functions

### Alcance ejecutado

- Se definieron gates de mantenibilidad para evitar que vuelvan módulos sobredimensionados, duplicados, legacy sin owner, builders paralelos, providers con lógica semántica propia o stores alternos.

### Resumen de evidencias

| Gate | Estado actual | Objetivo |
| --- | --- | --- |
| File size | hotspot guard existe | ratchet + spec de reducción para violaciones. |
| Duplicate builders | hallazgos por cache/DTO/diagnostics | scanner/registry por tipo de contrato. |
| Legacy | `plugin_old` aislado por gate | registry/retirement plan. |
| Cycles | no observado gate explícito | cycle detection en CI. |
| Client projections | Object Explorer/read-only gaps | server-owned projection envelope. |
| Source-of-truth | conformance parcial | no store paralelo ni provider bypass. |

### Hallazgos registrados

- `FINDING-029` — diagnostics sin registry.
- `FINDING-031` — orquestadores principales concentran responsabilidades.
- `FINDING-032` — `plugin_old` aislado por gate pero sin plan de retirement.
- `FINDING-038` — hotspot guard contiene budgets ya superados por `featureHandlers.ts`.
- `FINDING-040` — conformance demasiado textual para gates objetivo.

### Recomendaciones

- **Recommendation ID:** REC-24-1.
- **Resumen:** Convertir hotspot guard en ratchet de mantenibilidad con exceptions versionadas.
- **Motivo:** un guard rojo permanente o budget subido sin spec no mejora la arquitectura.
- **Área objetivo:** tools/CI.
- **Beneficio esperado:** simplification.
- **Riesgo:** bloquear cambios pequeños; permitir exceptions con owner y reducción plan.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-ARCH-P24-MODULE-SIZE-FITNESS-01`.

- **Recommendation ID:** REC-24-2.
- **Resumen:** Crear registry de legacy/compat paths con owner y retirement criteria.
- **Motivo:** `plugin_old` está aislado, pero el repositorio necesita política general.
- **Área objetivo:** architecture/docs/tools.
- **Beneficio esperado:** maintainability.
- **Riesgo:** burocracia sin enforcement; enlazar a gate.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-ARCH-P0-LEGACY-RETIREMENT-REGISTRY-01`.

### Refactorizaciones identificadas

### Refactorización — REF-24-1 — Simplification fitness gate suite

- **Ubicación actual:** hotspot guard, architecture imports, findings manuales.
- **Problema actual:** no hay suite unificada que bloquee duplicación, legacy sin owner, ciclos y tamaño sin spec.
- **Ubicación objetivo:** `tools/architecture-conformance/maintainability` o extensión del scanner PHASE 17.
- **Diseño objetivo:** report JSON con categorías `size`, `cycles`, `duplicates`, `legacy`, `provider-semantics`, `projection-boundaries`, `source-of-truth`.
- **Tipo de refactor:** Architecture gate.
- **Dependencias actuales:** PHASE 17 scanner, hotspot budgets, target module map.
- **Dependencias objetivo:** PHASE 13 backlog y CI/release.
- **Pasos de migración:** unificar reportes; añadir allowlists; agregar ratchet; integrar legacy registry; activar failures por categoría estable.
- **Tests de paridad requeridos:** hotspot guard actual.
- **Tests de conformidad requeridos:** fixtures negativos por gate.
- **Estrategia de rollback:** categorías nuevas en warning.
- **Capa temporal de compatibilidad:** sí.
- **Criterios de retirada:** scanner único reemplaza checks manuales/textuales.
- **Docs afectadas:** testing, architecture-status, performance budget si gates se vuelven release.
- **Métricas afectadas:** tamaño/imports/cycles/duplicates.
- **Riesgos:** falsos positivos y excepciones eternas.
- **Specs de backlog requeridas:** `PB-ARCH-P24-MODULE-SIZE-FITNESS-01`.

### Candidatos de backlog

- `PB-ARCH-P24-MODULE-SIZE-FITNESS-01`.
- `PB-ARCH-P0-LEGACY-RETIREMENT-REGISTRY-01`.
- `PB-ARCH-P1-DIAGNOSTICS-RULES-REGISTRY-01`.
- `PB-ARCH-P24-DUPLICATE-BUILDER-FITNESS-01`.
- `PB-ARCH-P24-NO-PARALLEL-STORE-FITNESS-01`.

### Documentación actualizada

- Actualizado target architecture sección 30.
- Ampliado `FINDING-040` con PHASE 24.

### Tests o validación

- No se ejecutaron gates en PHASE 24.

### Preguntas abiertas

- Umbrales iniciales de tamaño por módulo y si deben ser por dominio.
- Formato del legacy registry y owner de mantenimiento.

### Evidencias

- **Referencias de código:** `tools/run-architecture-hotspot-guard.mjs`, `test/server/unit/architectureImports.test.ts`, `plugin_old/**`, módulos sobredimensionados ya medidos.
- **Referencias documentales:** target architecture, AGENTS/copilot instructions, legacy isolation docs.
- **Referencias runtime:** ninguna.
- **Referencias de test:** hotspot/import/conformance tests.
- **Referencias externas:** fitness function/refactoring PHASE 1.
- **Referencias PowerBuilder:** mantener submodelos separados y no reintroducir logic duplicada en providers.

### Referencias de fase

- **Referencias de código:** hotspot guard/import tests/legacy path.
- **Referencias documentales:** target/legacy/testing.
- **Referencias runtime:** ninguna.
- **Referencias de investigación externa:** PHASE 1.
- **Referencias de candidatos backlog:** module size, legacy registry, duplicate builders, no parallel store gates.

## PHASE 13 — Complete backlog generation for final architecture

### Alcance ejecutado

- Se generó el backlog derivado completo después de completar PHASE 24, respetando la regla “no generar backlog final antes de PHASE 24”.
- Se revisó [docs/backlog.md](../backlog.md) para evitar duplicar los tres ítems existentes de submodelos.
- Se agregaron 26 specs derivadas que agrupan `FINDING-001` a `FINDING-043` en unidades ejecutables con orden, dependencias, acceptance criteria, docs, tests, métricas y validación.
- Se añadió un mapa finding -> backlog en [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md).

### Resumen de evidencias

| Área | Resultado PHASE 13 |
| --- | --- |
| Backlog existente | mantenidos `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01`, `PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01`, `PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01`. |
| Nuevos specs | 26 ítems en `# 5. Backlog derivado — Macroauditoría Instant Semantic and Indexing Runtime`. |
| Orden recomendado | actualizado `0.2` con los nuevos ítems antes de los submodelos históricos 46-48. |
| Trazabilidad | backlog -> findings en cada item; finding -> backlog en mapa PHASE 13. |
| Cobertura | hot paths, cache, source-of-truth, diagnostics, tokens, Object Explorer, read-only surfaces, 10k, CI, UX, module split, legacy retirement. |

### Hallazgos registrados

- No se crearon findings nuevos.
- Todos los findings abiertos quedaron agrupados en backlog derivado o en ítems existentes.

### Recomendaciones

- **Recommendation ID:** REC-13-1.
- **Resumen:** Ejecutar los specs en el orden recomendado, empezando por documentación/testing/conformance antes de refactors productivos.
- **Motivo:** los refactors mayores dependen de tests y gates para no romper semántica.
- **Área objetivo:** backlog/roadmap.
- **Beneficio esperado:** correctness/simplification.
- **Riesgo:** saltar a splits grandes sin contratos previos.
- **Prioridad:** P0.
- **Candidato backlog:** ya materializado en `docs/backlog.md`.

- **Recommendation ID:** REC-13-2.
- **Resumen:** Fusionar o marcar `Superseded` cualquier spec histórico que solape con los 26 ítems derivados.
- **Motivo:** mantener backlog como fuente única.
- **Área objetivo:** backlog/specs/docs.
- **Beneficio esperado:** maintainability.
- **Riesgo:** borrar trazabilidad histórica; conservar enlaces de evidencia.
- **Prioridad:** P1.
- **Candidato backlog:** `PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01`.

### Refactorizaciones identificadas

- PHASE 13 no identificó refactor nuevo; convirtió refactorizaciones previas en backlog ejecutable.

### Candidatos de backlog

- Creados en [docs/backlog.md](../backlog.md): `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01`, `PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01`, `PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01`, `PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01`, `PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01`, `PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01`, `PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01`, `PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01`, `PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01`, `PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01`, `PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01`, `PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01`, `PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01`, `PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01`, `PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01`, `PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01`, `PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01`, `PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01`, `PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01`, `PB-PERF-P2-10K-SEMANTIC-CORPUS-01`, `PB-CI-P1-REGRESSION-GATE-10K-PAYLOAD-01`, `PB-UX-P2-DEGRADED-STALE-MESSAGING-UI-01`, `PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01`, `PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01`, `PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01`, `PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01`.

### Documentación actualizada

- Actualizado [docs/backlog.md](../backlog.md) con orden recomendado y backlog derivado.
- Actualizado [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con mapa PHASE 13.
- Actualizado este reporte.

### Tests o validación

- No se ejecutaron tests en PHASE 13.
- Validación documental y completa queda para PHASE 15.

### Preguntas abiertas

- Si algunos ítems derivados deben convertirse en specs separados bajo `specs/` antes de implementación.
- Si los ítems históricos 46-48 deben marcarse `Superseded` por specs funcionales ya existentes o mantenerse como arquitectura pendiente de conformance.

### Evidencias

- **Referencias de código:** no nuevas.
- **Referencias documentales:** [docs/backlog.md](../backlog.md), findings register, target architecture, specs existentes.
- **Referencias runtime:** ninguna.
- **Referencias de test:** no aplica.
- **Referencias externas:** PHASE 1.
- **Referencias PowerBuilder:** todos los dominios cubiertos por findings/backlog.

### Referencias de fase

- **Referencias de código:** no nuevas.
- **Referencias documentales:** backlog/findings/target/specs.
- **Referencias runtime:** ninguna.
- **Referencias de investigación externa:** PHASE 1.
- **Referencias de candidatos backlog:** 26 ítems materializados en backlog derivado.

## PHASE 14 — Apply safe fixes detected during audit

### Alcance ejecutado

- Se aplicó solo un fix seguro y documental: alinear [docs/testing.md](../testing.md) con `test/server/unit/testingMatrixDocs.test.ts`.
- No se modificó código productivo ni tests para forzar resultados.
- Se instaló el entorno npm con `npm ci` porque faltaban dependencias instaladas (`node_modules/vscode-nls` no existía aunque `package.json` lo declara).

### Resumen de evidencias

| Fix | Archivo | Resultado |
| --- | --- | --- |
| Matriz canónica de lanes | [docs/testing.md](../testing.md) | añadida sección `### 3.6 Matriz canónica de lanes` con comandos reales y `missing: test:real-corpora`. |
| Estado de finding | [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) | `FINDING-037` marcado como `Fixed during audit`, con validación bloqueada documentada. |
| Estado de backlog | [docs/backlog.md](../backlog.md) | `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01` marcado `Partial` hasta revalidar cuando compile `tsconfig.test.json`. |

### Hallazgos registrados

- `FINDING-037` — corregido durante auditoría, validación bloqueada por errores TS no relacionados.
- No se añadieron nuevos findings por los errores TS, porque se tratan como bloqueo de validación observado y no fueron auditados a fondo en esta fase.

### Recomendaciones

- **Recommendation ID:** REC-14-1.
- **Resumen:** Reintentar `testingMatrixDocs` cuando compile la suite de tests.
- **Motivo:** el fix documental es local, pero el comando no llegó a ejecutar el test por errores ajenos.
- **Área objetivo:** tests/docs.
- **Beneficio esperado:** CI reliability.
- **Riesgo:** confundir bloqueo de build con fallo del fix documental.
- **Prioridad:** P0.
- **Candidato backlog:** ya cubierto por `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01` en estado `Partial`.

### Refactorizaciones identificadas

- Ninguna nueva. No se aplicaron refactors productivos en PHASE 14.

### Candidatos de backlog

- No se agregaron nuevos candidatos.
- `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01` queda `Partial` por validación bloqueada.

### Documentación actualizada

- [docs/testing.md](../testing.md) con la matriz canónica de lanes.
- [docs/backlog.md](../backlog.md) con estado/validación del ítem PHASE 14.
- [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con estado de `FINDING-037`.
- Este reporte con PHASE 14.

### Tests o validación

- `npm run test:unit -- --grep "testingMatrixDocs"` antes de instalar dependencias: falló en build por `Cannot find module 'vscode-nls'` en `src/client/nls.ts` y `src/server/nls.ts`.
- `npm ci`: completó; instaló 466 paquetes; reportó 4 vulnerabilidades npm audit (2 low, 2 high), no corregidas porque sería cambio fuera de alcance.
- `npm run test:unit -- --grep "testingMatrixDocs"` después de `npm ci`: falló antes de ejecutar tests por errores TypeScript no relacionados:
	- `test/server/performance/confidenceCalibration.smoke.test.ts`: `Function lacks ending return statement and return type does not include 'undefined'`.
	- `test/server/unit/hotContextCache.test.ts`: `Property 'getKbVersion' does not exist on type 'HotContextCache'`.

### Preguntas abiertas

- Confirmar si los errores TS de tests existentes deben entrar al backlog técnico o si pertenecen a un trabajo activo externo a esta auditoría.

### Evidencias

- **Referencias de código:** `test/server/unit/testingMatrixDocs.test.ts`, `package.json` scripts; errores TS en tests mencionados.
- **Referencias documentales:** `docs/testing.md`, `docs/backlog.md`, findings register.
- **Referencias runtime:** comandos npm ejecutados.
- **Referencias de test:** test focal intentado, bloqueado antes de ejecución.
- **Referencias externas:** ninguna.
- **Referencias PowerBuilder:** no aplica directo.

### Referencias de fase

- **Referencias de código:** `testingMatrixDocs.test.ts`, tests con errores TS.
- **Referencias documentales:** testing/backlog/findings.
- **Referencias runtime:** npm ci y test focal.
- **Referencias de investigación externa:** ninguna.
- **Referencias de candidatos backlog:** ninguno nuevo.

## PHASE 15 — Validation

### Alcance ejecutado

- Se ejecutaron los gates disponibles definidos por la auditoría: documentación, architecture rapid, performance gate y suite completa.
- Se aplicaron fixes puntuales al encontrar bloqueos directamente conectados con validación de la auditoría:
	- `tsconfig.test.json` ahora incluye `src/server/indexer/worker.ts` para emitir el worker cargado dinámicamente por `WorkerPool` durante `vscode-test`.
	- `test/server/performance/confidenceCalibration.smoke.test.ts` cubre explícitamente `QueryResolutionConfidence = 'unknown'`.
	- `test/server/unit/hotContextCache.test.ts` usa el API real `getSemanticEpoch()`.
	- `src/server/knowledge/resolution/semanticQueryService.ts` resuelve llamadas globales del catálogo del sistema en contextos call sin candidatos workspace.
	- `test/server/performance/ci-budget-gate.perf.test.ts` usa un fixture dedicado y estable para medir `signatureHelp`.
- No se relajaron budgets ni assertions para hacer pasar gates.

### Resultados de validación

| Comando | Resultado | Observación |
| --- | --- | --- |
| `npm run build:test` | Pass | Compila referencias TS, bundle y `tsconfig.test.json`; emite `out/src/server/indexer/worker.js`. |
| `npm run test:unit -- --grep "testingMatrixDocs"` | Pass | 2 tests passing; cierra la validación focal de `FINDING-037`. |
| `npm run test:unit -- --grep "interactiveHotPathGuards"` | Pass | 2 tests passing; confirma `signatureHelp` hot path sin IO/full parse. |
| `npm run test:docs:drift` | Pass | Estado `passed`; sin findings de drift documental. |
| `npm run test:architecture:rapid` | Pass | Smoke PFC Workspace/Solution: 3 passing; performance PFC/OrderEntry: 7 passing; reporte en `artifacts/performance/architecture-rapid-gate.json`. |
| `npm run test:performance:gate` | Pass | 4 passing; todos los budgets `[perf-budget]` en ok. |
| `npm test` | Fail | Ya no falla por worker ni `signatureHelp`; la suite completa sigue roja por deuda existente de unit tests/catalog/hotspot guard. |

### Detalles de gates corregidos

- `test:architecture:rapid` falló inicialmente por `Cannot find module 'out/src/server/indexer/worker.js'` y crash del extension host con exit code 134. Tras incluir el worker dinámico en `tsconfig.test.json`, el gate pasó.
- `test:performance:gate` falló inicialmente en `performance/ci-budget-gate` con `assert.ok(signature)` aunque la latencia de `synthetic-hot-signatureHelp` estaba dentro de budget. La causa fue una brecha real en resolución: la rama call de `resolveTargetEntityDetailed` no caía al catálogo del sistema. Tras el fix, `synthetic-hot-signatureHelp` pasó en 3.27 ms sobre budget de 50 ms.
- `testingMatrixDocs` quedó verde después de corregir los dos bloqueos TS locales: `unknown` en calibración de confianza y `getSemanticEpoch()` en `HotContextCache`.

### Bloqueos restantes

- `npm test` sigue fallando. La salida final reportó 123 tests fallidos en la fase unit, con ejemplos representativos:
	- `unit/catalogGeneratorScript`: funciones esperadas no exportadas (`buildGeneratedReservedWordEntry`, `renderBuilderCall`).
	- `unit/catalogConsistency`: duplicados/signatures vacías y overlays manuales esperados no presentes.
	- `unit/catalogAdoptionDecision`: dominio con decisión actual `manual-primary` frente a esperado `generated-primary-with-manual-overlays`.
	- `unit/backpressurePolicy`: cuenta de workload classes `10 !== 9`.
	- `unit/architectureImports`: hotspot guard falló con 2 hotspots: `src/server/handlers/featureHandlers.ts` (`lines=1674/1600`) y `src/server/features/hover.ts` (`lines=422/420`).
- Estos bloqueos no se corrigieron en esta auditoría porque implican cambios de catálogo, política runtime y split de módulos fuera del set de fixes seguros. Quedan cubiertos por findings/backlog existentes, especialmente `FINDING-038`, `PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01`, `PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01` y la familia de catálogo ya registrada en el backlog histórico.

### Hallazgos actualizados

- `FINDING-037` queda `Fixed during audit` con validación focal y docs drift verdes.
- `FINDING-038` queda abierto y ahora incluye evidencia PHASE 15 del hotspot guard con `featureHandlers.ts` y `hover.ts`.
- `FINDING-044` se añadió como bug de contrato corregido durante PHASE 15 para `signatureHelp` sobre funciones globales del catálogo.

### Documentación actualizada

- [docs/audits/macro-instant-semantic-indexing-findings.md](macro-instant-semantic-indexing-findings.md) con validación PHASE 15, `FINDING-044` y evidencia actualizada de hotspots.
- [docs/backlog.md](../backlog.md) con `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01` en `Ready for closure` tras validación.
- Este reporte con resultados PHASE 15.

### Referencias de fase

- **Referencias de código:** `semanticQueryService.ts`, `ci-budget-gate.perf.test.ts`, `confidenceCalibration.smoke.test.ts`, `hotContextCache.test.ts`, `tsconfig.test.json`.
- **Referencias documentales:** findings register, backlog, testing matrix.
- **Referencias runtime:** `npm run build:test`, `npm run test:unit -- --grep "testingMatrixDocs"`, `npm run test:unit -- --grep "interactiveHotPathGuards"`, `npm run test:docs:drift`, `npm run test:architecture:rapid`, `npm run test:performance:gate`, `npm test`.
- **Referencias de investigación externa:** ninguna.
- **Referencias de candidatos backlog:** sin candidatos nuevos abiertos; `FINDING-044` fue corregido en la misma fase.

## PHASE 16 — Final self-review and alignment check

### Respuestas obligatorias

1. **Hot path blockers:** sí. Quedan abiertos references textual scan, semantic tokens full scan/delta incompleto, diagnostics tiers, Object Explorer plano y hotspots de wiring; están cubiertos por `FINDING-001`, `FINDING-003`, `FINDING-019`, `FINDING-025`, `FINDING-026`, `FINDING-029`, `FINDING-038`, `FINDING-039`.
2. **Indexing/discovery blockers:** sí. Warm start, discovery bounded async, cache persistence e invariants tienen findings/backlog (`FINDING-011` a `FINDING-016`, `FINDING-033`). El worker dinámico de tests quedó corregido.
3. **Cache/epoch/fingerprint blockers:** sí. Hay drift de cache key, epoch/fingerprint y snapshot mutability (`FINDING-002`, `FINDING-008`, `FINDING-017`, `FINDING-018`).
4. **Semantic source-of-truth violations:** sí. `publishedState` necesita inmutabilidad real y query envelope endurecido (`FINDING-008`, `FINDING-009`, `FINDING-010`).
5. **Duplicate/legacy/structural issues:** sí. `plugin_old` queda aislado pero requiere retirement plan; orquestadores grandes y módulos DataWindow mixtos quedan registrados (`FINDING-030`, `FINDING-031`, `FINDING-032`).
6. **Refactorizaciones detalladas:** sí. Cada fase generó `REF-*` y PHASE 24 añadió fitness suite de simplificación.
7. **Object Explorer truncation:** sí. `FINDING-001` y target architecture exigen proyecciones paginadas/lazy.
8. **10,000+ workspaces:** sí. `FINDING-007` y `FINDING-036` muestran que falta corpus/gate 10,000+; backlog contiene `PB-PERF-P2-10K-SEMANTIC-CORPUS-01` y `PB-CI-P1-REGRESSION-GATE-10K-PAYLOAD-01`.
9. **PowerBuilder sublanguages:** sí. DataWindow, SQL/Transaction y native/external están modelados como submodelos advisory/background con findings/backlog dedicados.
10. **Duplicate backlog items:** revisado. PHASE 13 agrupó findings relacionados en 26 ítems derivados; el ítem de testing quedó `Ready for closure` tras PHASE 15.
11. **Docs updated:** sí. Se actualizaron target architecture, findings, audit report, backlog y testing.
12. **Unsafe broad rewrites avoided:** sí. Los cambios productivos fueron puntuales: worker de tests, exhaustive test cases y fallback semántico de sistema.
13. **Clear execution order:** sí. [docs/backlog.md](../backlog.md) mantiene el orden recomendado, con gates P0 antes de refactors P1/P2.
14. **Architecture/simplification fitness functions:** sí. PHASE 17 y PHASE 24 quedaron incorporadas en [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md).
15. **All specs for final architecture:** sí como backlog/spec target; implementación completa sigue abierta por fases.
16. **Outputs/backlog en español:** sí. Los artefactos nuevos y actualizados están en español.

### Recuento final de hallazgos

- **Total:** 44 findings.
- **Por severidad:** Critical 1, High 20, Medium 22, Low 1.
- **Por tipo principal:** Missing test 10, Performance risk 8, Performance bottleneck 5, Architecture drift 4, Contract bug 3, Refactor need 3; el resto son contract/UX/docs/legacy/concurrency risks puntuales.

### Cierre de auditoría

- Todas las fases requeridas por el prompt quedaron ejecutadas y documentadas: PHASE 0-12, PHASE 17-24, PHASE 13, PHASE 14, PHASE 15 y PHASE 16.
- Se respetó la regla de no generar backlog final antes de completar PHASE 24.
- El backlog derivado contiene 26 ítems creados después de PHASE 24; 1 está `Ready for closure` tras fix/validación y 25 quedan activos para ejecución posterior.
- Validación verde: `build:test`, `testingMatrixDocs`, `interactiveHotPathGuards`, `docs:drift`, `architecture:rapid`, `performance:gate`.
- Validación roja restante: `npm test`, por deuda preexistente de catálogo/política runtime/hotspot guard fuera del alcance seguro de PHASE 14/15.

### Orden recomendado final

1. Cerrar documentalmente `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01` moviéndolo a done-log.
2. Priorizar `PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01` y corregir el hotspot guard sin debilitar budgets.
3. Endurecer snapshot/query contract (`PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01`, `PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01`).
4. Congelar diagnostics/tokens con tests contract-first antes de refactors grandes.
5. Ejecutar caché/invalidation/discovery bounded async antes de Object Explorer paginado y superficies read-only.
6. Añadir matriz 10,000+ y gates release/payload cuando el contrato de providers/cache esté estable.