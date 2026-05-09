# Semantic Design Assumptions — PowerBuilder VS Code Plugin

## Propósito

Ledger vivo de hechos, supuestos, dudas, decisiones y validaciones del plan maestro de arquitectura semántica futura. Este documento no sustituye a `docs/architecture.md`, `docs/architecture-status.md`, `docs/architecture-implementation-map.md` ni `docs/backlog.md`; sólo conserva el razonamiento de auditoría fase por fase.

---

## FASE 0 — Assumption Ledger

### Hechos confirmados
- No existían `docs/semantic-design-assumptions.md` ni `docs/semantic-design-target.md` al iniciar la auditoría.
- El foco activo actual es `POST-AUDIT / P0-P1 — Normalización documental y convergencia semántica`.
- El backlog ya contiene hallazgos abiertos derivados de la ultra auditoría semántica, incluyendo convergencia de `SemanticQueryFacade`, confidence contract y gates de surfaces read-only.
- `docs/architecture.md` define arquitectura objetivo, `docs/architecture-status.md` define estado real, y `docs/architecture-implementation-map.md` mapea rutas reales de implementación.
- El runtime interactivo, parser string-safe, discovery real workspace, hover built-ins, serving cache observability, view providers y health separation figuran cerrados en `docs/done-log.md` con validación registrada.
- El mapa de implementación identifica rutas reales para discovery, `workspaceIndexer`, `KnowledgeBase`, `DocumentCache`, `HotContextCache`, `ServingCache`, `SemanticQueryFacade`, providers LSP y surfaces read-only.
- El repo ya tiene scripts verificables para `build:test`, `test:docs:drift`, `test:performance:gate`, architecture gates y VSIX release verification.

### Suposiciones utilizadas
- Owner: arquitectura/documentación. Suposición: `docs/semantic-design-target.md` debe crearse en FASE 4, no en FASE 0, para evitar adelantar diseño antes de investigación, diagnóstico y duplicidades. Riesgo: medio si fases posteriores olvidan materializarlo. Validación prevista: revisión final de FASE 12 y checklist final obligatorio.
- Owner: arquitectura/performance. Suposición: la meta maestra “descubrir e indexar muy rápido sin bloquear” debe dominar cualquier propuesta de snapshot, cache, facade o surface read-only. Riesgo: alto si el diseño crea full scans o truth stores paralelos. Validación prevista: `test:performance:gate`, hot-path guards y revisión explícita 5000+ archivos.
- Owner: documentación/backlog. Suposición: el backlog semántico ya creado es la base de ejecución, pero el plan maestro necesitará una sección arquitectónica específica para trabajo posterior. Riesgo: medio por duplicidad con ítems PB-SEMANTIC existentes. Validación prevista: FASE 10 debe decidir absorción o nuevo backlog sin duplicar owners.

### Dudas abiertas
- Alcance exacto de `PublishedSemanticSnapshot`: aún debe definirse si es nombre documental para la `KnowledgeBase` publicada existente o si requiere contrato/API nuevo. Debe resolverse en FASE 5 y registrarse en backlog si implica trabajo implementable.
- Alcance exacto de `ReadOnlyReportCache`: no está confirmado como módulo actual; puede ser contrato objetivo, fusión con caches existentes o decisión de no crear cache nueva. Debe resolverse en FASE 7.
- Nivel de adopción real por consumer de `SemanticQueryFacade`: hay evidencia de hover/definition, pero falta matriz completa consumer por consumer. Debe resolverse en FASE 2 y FASE 3.

### Decisiones tomadas
- Crear este Assumption Ledger desde FASE 0 y actualizarlo tras cada fase.
- Crear `docs/semantic-design-target.md` más adelante, salvo evidencia en contra, como documento owner del diseño objetivo semántico futuro.
- No modificar `done-log.md` porque no se está cerrando ninguna spec ni auditoría implementada.
- No añadir aún backlog nuevo en FASE 0 porque los riesgos detectados son requisitos del propio prompt y se resolverán en fases específicas; si persisten tras diagnóstico, se registrarán en FASE 10.

### Riesgos
- Riesgo de duplicar contenido de `architecture.md` si el target futuro explica arquitectura general en vez de contrato semántico específico.
- Riesgo de duplicar backlog PB-SEMANTIC con nuevos PB-ARCH si FASE 10 no marca absorciones o dependencias claras.
- Riesgo de sobrediseñar caches como fuentes de verdad si no se separa `KnowledgeBase` publicada de proyecciones aceleradoras.
- Riesgo de introducir propuestas no escalables a 5000+ archivos si no se ata cada decisión a invalidación incremental y budgets existentes.

### Evidencia consultada
- `.github/prompts/audit-architecture-future.prompt.md`.
- `docs/current-focus.md`.
- `docs/backlog.md`.
- `docs/done-log.md`.
- `docs/roadmap.md`.
- `docs/architecture.md`.
- `docs/architecture-status.md`.
- `docs/architecture-implementation-map.md`.
- `docs/performance-budget.md`.
- `docs/testing.md`.
- `docs/troubleshooting.md`.
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` headings and relevant architecture-oriented sections.
- `package.json` scripts.
- Repo memories: architecture firewall, semantic query explain plan, runtime backpressure policy and multi-root partition isolation.
- Source route search for discovery, indexer, knowledge, caches, semantic query, providers and read-only surfaces.

### Validación pendiente
- Revisión profunda de código real en FASE 2.
- Investigación de patrones modernos en FASE 1.
- Matriz de duplicidades en FASE 3.
- Diseño objetivo y target doc en FASE 4.
- Validación final con `npm run build:test`, `npm run test:docs:drift` y `npm run test:performance:gate` salvo que fases posteriores requieran gates adicionales.

### Impacto en diseño objetivo
- El diseño objetivo debe definir una fuente de verdad semántica publicada, snapshots/versiones, contratos de query, caches como proyecciones y consumers como lectores/proyectores.
- El diseño objetivo debe mantener discovery/indexing incremental y no bloqueante como restricción principal.
- El diseño objetivo debe declarar explícitamente estrategia para 100-800, 800-2500, 2500-5000 y 5000+ archivos.

### Impacto en backlog
- FASE 10 deberá consolidar un backlog arquitectónico accionable y decidir qué ítems quedan nuevos, absorbidos por PB-SEMANTIC existentes, fusionados o degradados.
- Cualquier duda que sobreviva a FASE 2-9 deberá aparecer en backlog o quedar con validación explícita en este ledger.

---

## FASE 1 — Assumption Ledger

### Hechos confirmados
- La guía oficial de VS Code Language Server recomienda separar Language Client y Language Server porque el análisis de lenguaje puede ser costoso en CPU/memoria y debe evitar afectar el rendimiento del editor.
- La guía oficial LSP/VS Code documenta sincronización incremental de documentos, `CancellationToken`, providers por feature, completion resolve, semantic tokens delta/refresh, diagnostics push/pull y watched file changes como primitivas relevantes.
- La arquitectura de rust-analyzer documenta una separación explícita entre input state, derived semantic model, `AnalysisHost.apply_change`, `Analysis` immutable snapshot, API boundary IDE y conversión manual hacia LSP.
- rust-analyzer y Salsa tratan los cálculos semánticos como incrementales, on-demand y derivados de entradas versionadas; los cambios pequeños deben invalidar sólo resultados afectados.
- La documentación local ya usa conceptos compatibles: `semanticEpoch`, snapshots publicados, `DocumentCache`, `HotContextCache`, `ServingCache`, invalidación Salsa-style, hot path guards, no full scan y `SemanticQueryFacade` parcial.

### Patrones recomendados
- **LSP-first thin client:** mantener el cliente VS Code como orquestador fino, con surfaces UI/read-only consumiendo snapshots o comandos LSP, no análisis propio. Encaja con la regla local de thin client y protege activación.
- **Published semantic snapshot:** exponer una vista inmutable/versionada de la verdad semántica publicada. Puede apoyarse en `KnowledgeBase` si FASE 2 confirma que ya cubre epoch, snapshots e índices sin requerir un store nuevo.
- **Query facade único:** concentrar navegación, hover, completion, diagnostics, references y surfaces read-only en un contrato tipo IDE API boundary, con tipos serializables o view models en los bordes.
- **Incremental query / derived-state model:** tratar índices, inheritance graph, diagnostics, DataWindow summaries y reportes como estado derivado invalidado por documentos/proyectos/dependencias, no como verdades independientes.
- **Cancelable hot paths:** cada request interactivo y cada trabajo largo debe aceptar cancellation/staleness y poder abandonar resultados si cambia documento, `semanticEpoch`, configuración o workspace partition.
- **Read-only projections:** caches y panels deben ser proyecciones de snapshots publicados, con epoch/version/sourceOrigin/confidence en la key cuando corresponda.
- **Boundary tests:** concentrar tests en API semántica, provider LSP y gates de hot path, evitando tests que fijen detalles internos de implementación cuando la frontera pública es suficiente.

### Patrones rechazados
- **Full workspace scan por request:** incompatible con 5000+ archivos, budgets interactivos y reglas locales de hot path.
- **Cache como fuente de verdad:** `ServingCache`, negative caches, report caches o view-model caches no deben resolver disputas semánticas ni sobrevivir a cambios de epoch como autoridad.
- **Facade por feature sin contrato común:** duplicaría criterios de confidence, sourceOrigin, staleness y resolución entre hover/completion/definition/read-only surfaces.
- **Serialization directa de tipos internos:** importar estructuras internas completas a API pública o LSP crearía compatibilidad accidental y dificultaría migraciones.
- **Parser/analyzer con error fatal para edición incompleta:** una IDE de PowerScript debe seguir produciendo snapshots parciales y reason codes ante código incompleto.
- **Async global no versionado:** trabajos largos que actualizan mapas globales sin epoch/token/staleness pueden publicar resultados obsoletos y romper surfaces read-only.

### Suposiciones utilizadas
- Owner: arquitectura semántica. Suposición: el patrón rust-analyzer `AnalysisHost`/`Analysis` puede traducirse aquí como `KnowledgeBase` publicada + `SemanticQueryFacade` + snapshots/read-only projections, sin adoptar Salsa como dependencia. Riesgo: medio si el código real ya fragmentó la propiedad semántica. Validación prevista: FASE 2/3.
- Owner: performance. Suposición: la escalabilidad 5000+ depende más de particiones, invalidación granular y queries acotadas que de añadir caches finales para cada feature. Riesgo: medio si alguna feature tiene coste repetido real no cubierto por budgets. Validación prevista: FASE 7 y gates performance.
- Owner: API pública. Suposición: los DTOs read-only deben seguir siendo serializables y desacoplados de tipos internos, siguiendo la frontera IDE/LSP. Riesgo: bajo; coincide con `src/shared/publicApi.ts` y documentación actual. Validación prevista: FASE 6/11.

### Dudas abiertas
- Si `KnowledgeBase` ya puede nombrarse formalmente como `PublishedSemanticSnapshot` o si hace falta una vista wrapper explícita.
- Si todos los consumers interactivos ya atraviesan `SemanticQueryFacade` o si algunos conservan resolución propia aceptable por excepción.
- Si diagnostics necesita una cache/proyección final por snapshot o si el scheduler y `analysisCache` bastan bajo corpus real.
- Si DataWindow requiere una sub-base derivada separada o sólo una proyección domain-scoped con sourceOrigin/confidence.

### Decisiones tomadas
- Usar patrones LSP/rust-analyzer/Salsa como inspiración arquitectónica, no como dependencia obligatoria.
- Priorizar snapshot publicado + facade + proyecciones read-only sobre introducir un semantic database paralelo.
- Exigir que cualquier target futuro declare explícitamente qué es verdad, qué es derivado y qué es cache.
- Mantener FASE 10 como punto de consolidación de backlog arquitectónico para evitar ítems duplicados prematuros.

### Riesgos
- Riesgo de sobreajustar el diseño a rust-analyzer y perder particularidades PowerBuilder/DataWindow si FASE 2 no aterriza el diagnóstico en código real.
- Riesgo de naming confuso si `PublishedSemanticSnapshot`, `KnowledgeBase`, `DocumentCache` y `ActiveDocumentServingSnapshot` se documentan como capas distintas sin explicar propiedad y dirección de datos.
- Riesgo de performance si la arquitectura objetivo añade wrappers que hacen copias profundas de snapshots grandes en cada request.
- Riesgo de deuda pública si las APIs read-only exponen estructuras internas no diseñadas para compatibilidad.

### Evidencia consultada
- LSP 3.17 specification: cancellation, work done progress, text document sync, watched files, diagnostics, semantic tokens, references and workspace symbols.
- VS Code Language Server Extension Guide: client/server split, separate process, incremental document sync, testing boundaries and error-tolerant parser guidance.
- VS Code API reference: `CancellationToken`, providers, `workspace.findFiles`, watchers, diagnostics, semantic tokens and provider result contracts.
- VS Code Programmatic Language Features: mapping providers to LSP methods and completion resolve/diagnostics behavior.
- rust-analyzer architecture: input/derived state, no IO in analyzer core, API boundaries, immutable `Analysis`, `AnalysisHost.apply_change`, cancellation, testing and serialization boundaries.
- Salsa documentation: incremental, on-demand programs adapting outputs to input changes.
- Local docs grep: architecture status, implementation map, backlog, performance and existing snapshot/cache/epoch references.

### Validación pendiente
- Confirmar en FASE 2 qué patrones ya están implementados y cuáles sólo existen como documentación objetivo.
- Confirmar en FASE 3 si hay truth stores duplicados o sólo proyecciones derivadas con nombres distintos.
- Confirmar en FASE 7 si caches existentes usan keys suficientes para epoch/version/sourceOrigin/locale/confidence.

### Impacto en diseño objetivo
- El target debe incluir un diagrama/contrato de flujo: workspace/doc changes → parsed document snapshot → published semantic state → semantic query facade → LSP/read-only projections → presentation caches.
- El target debe prohibir explícitamente IO, full scans y deep copies en hot path normal.
- El target debe separar input state, derived state, published snapshot, query API, projections y caches.
- El target debe documentar staleness/cancellation como parte del contrato, no como detalle de implementación.

### Impacto en backlog
- Candidato para FASE 10: consolidar `PublishedSemanticSnapshot` como contrato documental o wrapper real según resultado de FASE 2/5.
- Candidato para FASE 10: matriz consumer-by-consumer de adopción `SemanticQueryFacade` con excepciones explícitas.
- Candidato para FASE 10: gates que impidan caches sin epoch/version/sourceOrigin cuando sirven hot paths o surfaces read-only.
- Candidato para FASE 10: pruebas de no copia profunda/no full scan en el contrato target si todavía no existen para alguna surface.

---

## FASE 2 — Assumption Ledger

### Hechos confirmados
- `KnowledgeBase` mantiene `publishedState`, `semanticEpoch`, batch/staged state y publicación atómica por `publishState`; es el candidato real a fuente de verdad semántica publicada.
- `workspaceIndexer` prioriza archivo activo/proyecto activo, usa `CancellationToken`, progreso, budgets por slice y límites de tamaño; su diseño apunta a indexación cooperativa no bloqueante.
- `ProjectRegistry` y `UnifiedProjectModel` comparten `resolveProjectRouting`, pero exponen dos modelos y consumidores distintos; la ruta común reduce divergencia, aunque el ownership público sigue duplicado.
- `SemanticQueryFacade` existe, pero la adopción es parcial: hover y definition la usan directamente, mientras completion, signature help, references, diagnostics y semantic tokens todavía invocan `queryContext`, `resolveTargetEntityDetailed` o lógica propia.
- `NegativeCache` no existe como clase separada; hover, completion resolve y definition usan `PresentationCache` con `cacheClass: 'negative'` y claves de serving.
- `TransactionModel` no existe como módulo propietario; la inferencia transaccional aparece en `embeddedSqlAnchors.ts` y en `diagnostics.ts` mediante regex y diagnósticos de binding.
- Las surfaces read-only están declaradas como API pública serializable en `publicApi.ts`, y varios reportes usan workloads acotados o límites adaptativos, pero no hay todavía un contrato único de proyección semántica común.

### Suposiciones utilizadas
- Owner: arquitectura semántica. Suposición: para FASE 4, `KnowledgeBase` debe mantenerse como implementación de la verdad publicada y `PublishedSemanticSnapshot` debe definirse primero como contrato/vista estable, no como store paralelo. Riesgo: medio si alguna surface necesita DTOs inmutables adicionales. Validación prevista: FASE 5.
- Owner: arquitectura/performance. Suposición: `ProjectRegistry` puede considerarse compatibilidad histórica y `UnifiedProjectModel` el modelo objetivo si FASE 3 no encuentra consumidores que requieran ambas formas. Riesgo: medio por compatibilidad de consumidores actuales. Validación prevista: FASE 3 y FASE 9.
- Owner: arquitectura/DataWindow-SQL. Suposición: SQL anchors y transactions deben degradarse a submodelos con confidence/evidence explícitos, no a verdad fuerte. Riesgo: alto si diagnostics comunica certezas demasiado fuertes. Validación prevista: FASE 5, FASE 6 y FASE 8.
- Owner: API/read-only. Suposición: las read-only surfaces deben seguir siendo DTOs serializables y con límites/paginación, no imports de tipos internos. Riesgo: medio en workspaces 5000+ si alguna surface materializa listas completas. Validación prevista: FASE 6, FASE 7 y gates de performance.

### Dudas abiertas
- Si `ProjectRegistry` debe eliminarse tras migrar consumidores o conservarse como adaptador fino de `UnifiedProjectModel`.
- Si `TransactionModel` merece owner propio por su valor diagnóstico o debe quedar como advisory/report-only dentro de DataWindow/SQL.
- Si `SemanticQueryFacade` debe cubrir absolutamente todos los consumers o admitir excepciones explícitas para tokens estructurales y diagnostics batch.
- Si las read-only surfaces actuales tienen límites suficientes para corpus 5000+ en todas las rutas, especialmente snapshot/manifest, dependency graph, technical debt y current object context.

### Decisiones tomadas
- Mantener Discovery, WorkspaceIndexer, SourceOrigin, DocumentFacts, KnowledgeBase, InheritanceGraph, SystemCatalog, SemanticQueryService, QueryContext y caches existentes como base; no proponer stores paralelos.
- Marcar `ProjectModel`/`LibrarySearchPath`, `SemanticQueryFacade` adoption, `TransactionModel` y read-only surfaces como zonas de convergencia para fases posteriores.
- Tratar `NegativeCache` como función de `PresentationCache` y contrato de key/invalidation, no como componente independiente obligatorio.
- Reservar la creación de `docs/semantic-design-target.md` para FASE 4, como estaba previsto.

### Diagnóstico por capa

## Capa: Discovery

- Responsabilidad actual: descubrir archivos PowerBuilder, roots, topología y orígenes iniciales sin cargar análisis semántico profundo.
- Archivos: `src/server/workspace/discovery.ts`, `src/server/workspace/workspaceState.ts`, `src/server/workspace/topology.ts`, handlers de intake/watch.
- Produce: `WorkspaceDiscoverySnapshot`, roots, source files, artifacts de discovery, source origins iniciales.
- Consume: filesystem, watchers, configuración workspace, markers `.pbw`, `.pbt`, `.pbsln`, `.pbproj`, `.pbl`.
- Consumers: `WorkspaceState`, `workspaceIndexer`, project routing, status/runtime stats, reports.
- Caches: estado de workspace y known files; no debe cachear verdad semántica.
- Qué considera verdad: presencia de archivos/markers y roots normalizados.
- Duplicidades: puede solaparse con ProjectModel al clasificar libraries/roots.
- Ownership difuso: bajo; la frontera discovery/topology está bastante clara.
- Riesgo hot path: bajo si permanece fuera de providers interactivos.
- Escala a 5000+ archivos: sí, con discovery incremental/watchers y sin análisis profundo en activación.
- Mantener/fusionar/degradar/eliminar: mantener.
- Motivo: es la capa input necesaria; el riesgo principal es que fases futuras no la conviertan en scan por request.

## Capa: WorkspaceIndexer

- Responsabilidad actual: analizar documentos descubiertos, publicar facts/snapshots en `KnowledgeBase`, priorizar activo/proyecto y reportar progreso.
- Archivos: `src/server/indexer/workspaceIndexer.ts`, `src/server/analysis/documentAnalysis.ts`, `src/server/analysis/semanticSnapshot.ts`.
- Produce: `DocumentFacts`, scopes, structural/enriched snapshots, estados de indexación, progreso.
- Consume: `WorkspaceState`, `DocumentCache`, `KnowledgeBase`, filesystem, cancellation token.
- Consumers: `KnowledgeBase`, readiness/status, LSP providers, reports/read-only surfaces.
- Caches: `DocumentCache` y batch updates en `KnowledgeBase`.
- Qué considera verdad: contenido/hash del documento y análisis vigente bajo versión/epoch.
- Duplicidades: structural/enriched passes pueden confundirse con dos verdades si no se documenta publicación final.
- Ownership difuso: medio en readiness/degraded state.
- Riesgo hot path: bajo-medio; es background, pero puede afectar si no cede al event loop.
- Escala a 5000+ archivos: sí/parcial; tiene slice budget, max file bytes y prioridad, pero requiere gates de corpus masivo.
- Mantener/fusionar/degradar/eliminar: mantener y formalizar budgets/readiness.
- Motivo: ya encarna el requisito “rápido sin bloquear”; necesita contrato explícito de publicación incremental.

## Capa: ProjectModel

- Responsabilidad actual: mapear archivo a proyecto/target/library y exponer proyectos, files y libraries.
- Archivos: `src/server/workspace/unifiedProjectModel.ts`, `src/server/workspace/projectRegistry.ts`, `src/server/workspace/projectRouting.ts`, `src/server/workspace/workspaceState.ts`.
- Produce: `UnifiedProjectModel`, `ProjectRegistry`, project-to-files, file-to-project, active project context.
- Consume: topología, source files, library roots, aliases de library source.
- Consumers: indexer priority, workspace state, cache store, library order, reports.
- Caches: modelos in-memory reconstruidos por `refreshProjectRouting`.
- Qué considera verdad: `resolveProjectRouting` como algoritmo común; modelos expuestos como vistas.
- Duplicidades: `ProjectRegistry` y `UnifiedProjectModel` duplican surface pública sobre el mismo routing.
- Ownership difuso: medio; hay compatibilidad histórica y modelo objetivo coexistiendo.
- Riesgo hot path: medio si consumers recalculan o consultan sin cache de routing.
- Escala a 5000+ archivos: sí/parcial; routing es precomputado, pero la coexistencia aumenta coste cognitivo y riesgo.
- Mantener/fusionar/degradar/eliminar: fusionar hacia `UnifiedProjectModel`, conservar adaptador si hace falta.
- Motivo: una sola verdad de proyecto reduce duplicidad de library order y reportes.

## Capa: LibrarySearchPath

- Responsabilidad actual: ordenar candidatos por proyecto activo e índice de library.
- Archivos: `src/server/knowledge/resolution/libraryOrder.ts`, `src/server/workspace/projectRouting.ts`, `src/server/workspace/unifiedProjectModel.ts`.
- Produce: candidatos reordenados por library order.
- Consume: `WorkspaceState.getProjectModel()`, URI activa, entidades candidatas.
- Consumers: dependency graph, ancestor descriptor, resolución de definiciones/candidatos.
- Caches: ninguno propio; depende de ProjectModel precomputado.
- Qué considera verdad: orden de libraries del proyecto/target actual.
- Duplicidades: la noción de library order vive entre ProjectModel, routing y resolver.
- Ownership difuso: medio; falta nombrar un owner de `LibrarySearchPath`.
- Riesgo hot path: medio si se aplica sobre listas grandes sin caps.
- Escala a 5000+ archivos: parcial; funciona si ProjectModel está precomputado y los candidatos ya están acotados.
- Mantener/fusionar/degradar/eliminar: fusionar como subcontrato de ProjectModel/QueryFacade.
- Motivo: el orden de búsqueda debe ser input común del query result, no heurística lateral por feature.

## Capa: SourceOrigin

- Responsabilidad actual: clasificar origen de fuentes y priorizar solución, ws_objects, pbl folders, manual export, ORCA staging, dump, generated, backup y unknown.
- Archivos: `src/shared/sourceOrigin.ts`, `src/server/workspace/workspaceState.ts`, `src/server/knowledge/KnowledgeBase.ts`, `src/server/knowledge/resolution/semanticQueryService.ts`.
- Produce: `SourceOrigin`, prioridad, resumen y políticas de acceso.
- Consume: URI, roots de solución/workspace, lineage de entidades.
- Consumers: `KnowledgeBase`, query service, serving keys, diagnostics/reports.
- Caches: source origins en workspace state y lineage internado en KB.
- Qué considera verdad: clasificación contextual del archivo y prioridad declarada.
- Duplicidades: inferencia por URI vs source origins explícitos de discovery.
- Ownership difuso: bajo-medio; shared model es claro, pero consumers aplican políticas.
- Riesgo hot path: bajo si está precalculado o inferido por URI simple.
- Escala a 5000+ archivos: sí.
- Mantener/fusionar/degradar/eliminar: mantener y documentar política común.
- Motivo: es parte del evidence/confidence y de la compatibilidad con fuentes múltiples.

## Capa: DocumentFacts

- Responsabilidad actual: representar símbolos, scopes, masked text, snapshots structural/enriched y fingerprint de documento.
- Archivos: `src/server/analysis/documentAnalysis.ts`, `src/server/analysis/semanticSnapshot.ts`, `src/server/knowledge/types.ts`, `src/server/knowledge/DocumentCache.ts`.
- Produce: facts, scopes, semantic snapshots, dependencies/fingerprints.
- Consume: texto del documento, parser/analyzer, source origin contextual.
- Consumers: `KnowledgeBase`, `DocumentCache`, providers, DataWindow model, diagnostics.
- Caches: `DocumentCache` y snapshot publicado en `KnowledgeBase`.
- Qué considera verdad: facts extraídos del documento bajo una versión/fingerprint.
- Duplicidades: `DocumentCache` conserva snapshot y `KnowledgeBase` también puede tener document snapshot.
- Ownership difuso: bajo si se declara `DocumentCache` como cache y `KnowledgeBase` como publicación.
- Riesgo hot path: medio si se recalcula desde texto en providers en vez de snapshot/cache.
- Escala a 5000+ archivos: sí/parcial; depende de incrementalidad y evitar copias profundas.
- Mantener/fusionar/degradar/eliminar: mantener, formalizando quién publica y quién cachea.
- Motivo: es el input semántico mínimo para todo el sistema.

## Capa: KnowledgeBase

- Responsabilidad actual: almacenar entidades, scopes, document snapshots, dependencias e índices publicados con `semanticEpoch`.
- Archivos: `src/server/knowledge/KnowledgeBase.ts`.
- Produce: verdad semántica publicada, consultas por nombre/URI/container, stats y cache records.
- Consume: facts/scopes/snapshots del indexer y restore cache.
- Consumers: semantic query service, inheritance graph, providers, read-only reports, API snapshots.
- Caches: string interner, staged state, scope index; no debe ser una cache efímera.
- Qué considera verdad: `publishedState` actual.
- Duplicidades: snapshot documental también puede vivir en `DocumentCache`; eso debe quedar cache vs publicación.
- Ownership difuso: bajo; es el owner más claro de verdad semántica.
- Riesgo hot path: bajo-medio; consultas deben ser readonly/acotadas.
- Escala a 5000+ archivos: sí/parcial; requiere evitar clones completos por request.
- Mantener/fusionar/degradar/eliminar: mantener como implementación de `PublishedSemanticSnapshot`.
- Motivo: ya tiene epoch, batch publish y atomicidad básica.

## Capa: InheritanceGraph

- Responsabilidad actual: resolver ancestros, jerarquía, miembros heredados, closures y descendientes con invalidación por versión KB.
- Archivos: `src/server/knowledge/resolution/InheritanceGraph.ts`, `src/server/knowledge/system/nativeAncestors.ts`.
- Produce: ancestors, descendants, member closures.
- Consume: `KnowledgeBase`, tipos nativos conocidos, visibility/scope priority.
- Consumers: query service, completion, semantic facade, diagnostics, reports.
- Caches: caches internas limpiadas al cambiar `KnowledgeBase.version`; `HotContextCache` acelera miembros activos.
- Qué considera verdad: tipos y miembros publicados en KB más ancestros nativos declarados.
- Duplicidades: algunos providers pueden consultar miembros directamente fuera de facade.
- Ownership difuso: bajo.
- Riesgo hot path: medio; cálculo de closures debe apoyarse en versión/cache.
- Escala a 5000+ archivos: sí/parcial; depende del tamaño de jerarquías y cache hits.
- Mantener/fusionar/degradar/eliminar: mantener como submodelo derivado.
- Motivo: separa derivaciones de herencia de la verdad publicada.

## Capa: SystemCatalog

- Responsabilidad actual: fachada de símbolos PowerBuilder del sistema, manual/generated/localized, con resolutores por dominio/owner.
- Archivos: `src/server/knowledge/system/SystemCatalog.ts`, `src/server/knowledge/system/services/queryService.ts`, `src/server/knowledge/system/generated/**`, `src/server/knowledge/system/manual/**`.
- Produce: built-ins, keywords, datatypes, functions/events, DataWindow constants/functions y metadata catalogada.
- Consume: catálogos generados/manuales/localizados.
- Consumers: hover, completion, signature help, diagnostics, semantic tokens, facade.
- Caches: registry generado/importado en memoria.
- Qué considera verdad: registry de catálogo compatible y políticas de prioridad manual/generated.
- Duplicidades: built-ins pueden aparecer como sistema y como entidades/documentación si se copian a providers.
- Ownership difuso: bajo si se respeta el catálogo como owner.
- Riesgo hot path: bajo si queries son indexadas.
- Escala a 5000+ archivos: sí; no depende del tamaño workspace.
- Mantener/fusionar/degradar/eliminar: mantener.
- Motivo: es verdad externa/manual controlada, no derivada del workspace.

## Capa: DataWindowModel

- Responsabilidad actual: parsear `.srd`/DataWindow source y producir bands, columns, controls, expressions, reports, retrieve args y SQL references simples.
- Archivos: `src/server/semantic/submodels/datawindow/index.ts`, `src/server/semantic/submodels/datawindow/bindingProjection.ts`, `src/server/features/dataWindowModel.ts`, `src/server/features/dataWindowBindingModel.ts`, `src/server/features/dataWindowFastContext.ts`, `src/server/features/dataWindowServingAdapters.ts`.
- Produce: `DataWindowModel`, bindings, fast context, completion/signature adapters, columns/expressions.
- Consume: semantic snapshots, KB, system catalog, receiver owner types.
- Consumers: hover, completion, signature help, diagnostics, current object context, SQL lineage.
- Caches: fast context key con document/kb/sourceOrigin/fingerprint; snapshot model derivado.
- Qué considera verdad: DataWindow source publicado y bindings con confidence.
- Duplicidades: diagnostics y adapters pueden replicar reglas de binding/arity.
- Ownership difuso: medio en binding vs diagnostics.
- Riesgo hot path: medio; deep SQL lineage ya se omite en fast context.
- Escala a 5000+ archivos: parcial; necesita submodelo publicado y límites.
- Mantener/fusionar/degradar/eliminar: mantener y publicar como submodelo derivado con confidence.
- Motivo: aporta valor alto, pero no debe ejecutarse como análisis profundo en cada request.
- Estado validado 2026-05 (Wave 07): existe un boundary mínimo `src/server/semantic/submodels/datawindow/` y `bindingProjection` ya vive ahí con re-export compatible desde `src/server/features/dataWindowBindingProjection.ts`.

## Capa: SqlAnchors

- Responsabilidad actual: detectar regiones SQL embebidas y construir lineage DataWindow bajo petición.
- Archivos: `src/server/parsing/sqlRegions.ts`, `src/server/features/embeddedSqlAnchors.ts`, `src/server/features/dataWindowSqlLineage.ts`, `src/server/features/dynamicStringReferences.ts`.
- Produce: anchors SQL, lineage SQL, dynamic-sql findings.
- Consume: masked text, snapshots, DataObject bindings, KB.
- Consumers: current object context, technical debt report, dataWindow SQL lineage, diagnostics/advisory.
- Caches: no cache propia robusta; lineage usa límites de depth.
- Qué considera verdad: evidencia heurística derivada de texto y DataWindow model.
- Duplicidades: SQL refs en DataWindowModel, anchors embebidos y reports técnicos son modelos cercanos.
- Ownership difuso: medio-alto.
- Riesgo hot path: alto si lineage profundo entra en providers; actualmente fast context marca deep computation skipped.
- Escala a 5000+ archivos: parcial; viable como report/proyección con caps, no como hot path global.
- Mantener/fusionar/degradar/eliminar: fusionar/degradar a `SqlAnchorSubmodel` advisory.
- Motivo: útil para IA/reportes, pero heurístico y debe llevar confidence/evidence.

## Capa: TransactionModel

- Responsabilidad actual: inferir bindings `SetTransObject`/`SetTrans`, SQLCA y transaction targets para diagnostics/anchors.
- Archivos: `src/server/features/diagnostics.ts`, `src/server/features/embeddedSqlAnchors.ts`, `src/server/utils/invocationContext.ts`.
- Produce: diagnostics de transaction binding, transactionTarget en SQL anchors, invocation kind/risk para `sqlca`.
- Consume: logical statements, regex, qualifier type, system catalog y KB.
- Consumers: diagnostics, current object context/anchors, query risk.
- Caches: ninguno propio.
- Qué considera verdad: heurísticas locales por scope/statement y tipos publicados.
- Duplicidades: diagnóstico de transaction y inferencia de SQL anchor no comparten owner/submodelo.
- Ownership difuso: alto.
- Riesgo hot path: medio-alto si crece dentro de diagnostics sin submodelo acotado.
- Escala a 5000+ archivos: parcial; aceptable por documento/scope, no como workspace-wide scan.
- Mantener/fusionar/degradar/eliminar: degradar/fusionar en `TransactionSubmodel` advisory.
- Motivo: valor diagnóstico real, pero debe explicitar low confidence y no sobreprometer certeza runtime.

## Capa: ExternalNativeModel

- Responsabilidad actual: parsear funciones externas/library/rpcfunc y marcar entidades `isExternal`, library, alias y dependency kind.
- Archivos: `src/server/parsing/externalFunctions.ts`, `src/server/analysis/documentAnalysis.ts`, `src/server/knowledge/types.ts`, `src/server/knowledge/enrichEntity.ts`, `src/server/knowledge/resolution/semanticQueryService.ts`.
- Produce: metadata de external callable, invocation risk external, policy filtering.
- Consume: declaraciones PowerScript, grammar, source origin policy.
- Consumers: semantic query, hover/presentation, diagnostics/reports.
- Caches: entidad publicada en KB.
- Qué considera verdad: declaración fuente y clasificación dll/pbx/unknown/rpcfunc.
- Duplicidades: metadata nativa puede solaparse con SystemCatalog documentation.
- Ownership difuso: bajo-medio; falta nombre de submodelo objetivo.
- Riesgo hot path: bajo.
- Escala a 5000+ archivos: sí.
- Mantener/fusionar/degradar/eliminar: mantener como `ExternalNativeSubmodel` con límites de certeza.
- Motivo: aporta risk/evidence, pero no valida runtime real.

## Capa: SemanticQueryFacade

- Responsabilidad actual: fachada semántica para position context, target symbol/info, receiver, callable, inheritance, enum/catalog callable.
- Archivos: `src/server/features/semanticQueryFacade.ts`.
- Produce: modelos resueltos serializables/parciales para consumers.
- Consume: `KnowledgeBase`, `InheritanceGraph`, `SystemCatalog`, `HotContextCache`, `queryContext`.
- Consumers: hover, definition y potencialmente todos los providers/read-only.
- Caches: delega en `HotContextCache` y graph/KB.
- Qué considera verdad: resultados de `queryContext`/semanticQueryService, no lógica propia profunda.
- Duplicidades: adoption parcial deja múltiples rutas de resolución.
- Ownership difuso: medio; objetivo claro, cumplimiento incompleto.
- Riesgo hot path: bajo si se mantiene thin; medio si añade conversiones costosas.
- Escala a 5000+ archivos: sí/parcial; requiere caps por consumer.
- Mantener/fusionar/degradar/eliminar: mantener y convertir en frontera obligatoria con excepciones documentadas.
- Motivo: es la pieza natural para unificar confidence/evidence/reason codes.

## Capa: SemanticQueryService

- Responsabilidad actual: resolver targets, confidence, evidence, reason codes, source origin policy, invocation kind/risk.
- Archivos: `src/server/knowledge/resolution/semanticQueryService.ts`, `src/server/knowledge/resolution/resolvedSemanticModels.ts`.
- Produce: `ResolvedTargetInfo`, evidence entries, confidence, ambiguity, filtered candidates.
- Consume: KB, graph, hot context, invocation context, source origin policy.
- Consumers: queryContext, facade, signature help, references, semantic tokens, diagnostics/explain.
- Caches: usa `HotContextCache` para entidades/members; no es cache owner.
- Qué considera verdad: entidades publicadas en KB, graph derivado y políticas explícitas.
- Duplicidades: providers lo llaman directamente saltando la facade.
- Ownership difuso: bajo en core, medio en integración.
- Riesgo hot path: medio por resolución en providers; budgets existen por policy.
- Escala a 5000+ archivos: sí/parcial con budgets y candidates acotados.
- Mantener/fusionar/degradar/eliminar: mantener como motor core detrás de la facade.
- Motivo: concentra semántica real y evidence.

## Capa: QueryContext

- Responsabilidad actual: construir contexto de documento/posición, invocation context, current object y resolution summary.
- Archivos: `src/server/features/queryContext.ts`, `src/server/features/queryScopePolicy.ts`.
- Produce: `DocumentQueryContext`, resolution confidence, reason, risk, evidence kinds.
- Consume: document, position, KB, graph, hot context y consumer policy.
- Consumers: completion, references, rename, linked editing, current object context, feature handlers, facade.
- Caches: `HotContextCache` por documento activo.
- Qué considera verdad: snapshot/entidades publicados y resolved targets del query service.
- Duplicidades: si consumers usan queryContext directamente se salta DTO común de facade.
- Ownership difuso: medio; puede ser implementación interna de facade o API compartida controlada.
- Riesgo hot path: medio; corre en requests interactivos.
- Escala a 5000+ archivos: sí/parcial con hot context y budgets.
- Mantener/fusionar/degradar/eliminar: mantener como helper interno, no como frontera pública principal.
- Motivo: necesario, pero debe quedar subordinado al contrato `SemanticQueryResult`.

## Capa: ServingCache

- Responsabilidad actual: cache LRU por feature/URI/posición/KB version para hover, completion, signature help y definition.
- Archivos: `src/server/knowledge/ServingCache.ts`, `src/server/serving/cacheKeyContract.ts`, `src/server/serving/interactiveServingPipeline.ts`.
- Produce: entries de serving, stats, hits/misses/evictions.
- Consume: feature key parts, kbVersion, URI, posición y extra discriminators.
- Consumers: feature handlers, runtime stats, performance gates.
- Caches: sí, es cache de resultados servidos.
- Qué considera verdad: nada; acelera resultados bajo versión.
- Duplicidades: keys legacy vs structured keys pueden coexistir.
- Ownership difuso: bajo-medio por transición de key contract.
- Riesgo hot path: bajo si keys evitan invalidaciones globales; alto si cachea verdad obsoleta.
- Escala a 5000+ archivos: sí/parcial con LRU y invalidación selectiva.
- Mantener/fusionar/degradar/eliminar: mantener y formalizar key/invalidation.
- Motivo: protege latencia interactiva sin ser truth store.

## Capa: HotContextCache

- Responsabilidad actual: cachear entidades del documento activo y miembros heredados por versión KB.
- Archivos: `src/server/knowledge/HotContextCache.ts`, `src/server/knowledge/resolution/semanticQueryService.ts`.
- Produce: active entities y inherited members cacheados.
- Consume: active URI, KB version, entidades/miembros derivados.
- Consumers: query service, providers interactivos, active document snapshot.
- Caches: sí, cache caliente por active document.
- Qué considera verdad: nada; valida por active URI y KB version.
- Duplicidades: puede solaparse con InheritanceGraph caches, pero en nivel distinto.
- Ownership difuso: bajo.
- Riesgo hot path: bajo; existe para hot path.
- Escala a 5000+ archivos: sí, porque reduce scope al documento activo.
- Mantener/fusionar/degradar/eliminar: mantener.
- Motivo: encaja con objetivo de priorizar ventana activa/herencias sin scans.

## Capa: DocumentCache

- Responsabilidad actual: cache documental LRU/pinned/warm/cold con entries y snapshots por URI.
- Archivos: `src/server/knowledge/DocumentCache.ts`, `src/server/cache/cacheStore.ts`, `src/server/serving/activeDocumentServingSnapshot.ts`.
- Produce: cached document entries, readonly entries, snapshots, cache records.
- Consume: document analysis entries, pin/unpin events, restore cache.
- Consumers: indexer, active serving snapshot, persistence/cache store.
- Caches: sí, documental y snapshot cache.
- Qué considera verdad: nada final; acelera acceso a snapshot/document facts.
- Duplicidades: snapshot también puede estar publicado en KB.
- Ownership difuso: medio si se confunde con `PublishedSemanticSnapshot`.
- Riesgo hot path: bajo-medio; clones/freeze pueden costar si snapshots son grandes.
- Escala a 5000+ archivos: sí/parcial con max entries y eviction.
- Mantener/fusionar/degradar/eliminar: mantener como cache, documentar prioridad frente a KB.
- Motivo: necesario para documentos abiertos/cálidos sin convertirlo en verdad.

## Capa: NegativeCache

- Responsabilidad actual: cachear resultados negativos de hover, completion resolve y definition mediante `PresentationCache`.
- Archivos: `src/server/server.ts`, `src/server/handlers/featureHandlers.ts`, `src/server/serving/presentationCache.ts`, `src/server/serving/cacheKeyContract.ts`.
- Produce: negative hits, negative reasons, memory-pressure bounded entries.
- Consume: structured serving key, document version/fingerprint, KB version, source origin, locale.
- Consumers: feature handlers, runtime self-test/stats.
- Caches: `PresentationCache` con `cacheClass: 'negative'`.
- Qué considera verdad: nada; sólo ausencia cacheable bajo contexto estable.
- Duplicidades: nombre conceptual `NegativeCache` vs implementación `PresentationCache`.
- Ownership difuso: bajo-medio por naming.
- Riesgo hot path: bajo si se invalida por key; medio si una razón negativa vive demasiado.
- Escala a 5000+ archivos: sí; acotada y local a requests.
- Mantener/fusionar/degradar/eliminar: mantener como clase conceptual dentro de PresentationCache.
- Motivo: evita recomputación de misses; no necesita módulo nuevo salvo contrato documental.

## Capa: LSP providers

- Responsabilidad actual: servir hover, completion, signature help, definition, references, diagnostics, semantic tokens, rename, linked editing y símbolos.
- Archivos: `src/server/features/hover.ts`, `completion.ts`, `signatureHelp.ts`, `definition.ts`, `references.ts`, `diagnostics.ts`, `semanticTokens.ts`, `documentSymbols.ts`, `workspaceSymbols.ts`, `src/server/handlers/featureHandlers.ts`.
- Produce: respuestas LSP, diagnostics, tokens, locations, completion/signature view models.
- Consume: KB, graph, system catalog, queryContext/service/facade, caches, active snapshot.
- Consumers: VS Code client/LSP runtime.
- Caches: serving/presentation/negative/hot context según feature.
- Qué considera verdad: debería consumir query results; actualmente algunos providers calculan semántica propia.
- Duplicidades: completion/signature/references/semanticTokens/diagnostics tienen rutas directas o heurísticas por feature.
- Ownership difuso: alto en consumers no convergidos.
- Riesgo hot path: alto si cada provider resuelve distinto o escanea sources.
- Escala a 5000+ archivos: parcial; hover/definition mejor, references/reports/tokens necesitan caps/contratos claros.
- Mantener/fusionar/degradar/eliminar: mantener providers, fusionar resolución en facade/contract.
- Motivo: son surface esencial, pero no deben ser owners de semántica.

## Capa: Read-only surfaces

- Responsabilidad actual: exponer API pública, reports, manifests, snapshots, dashboards y herramientas AI-friendly serializables.
- Archivos: `src/shared/publicApi.ts`, `src/server/handlers/reportCommandHandlers.ts`, `src/client/semanticWorkspaceSnapshot.ts`, `src/client/objectExplorer*.ts`, `src/client/currentObjectContextPanel*.ts`, `src/client/diagnosticsExplainabilityPanel*.ts`, `src/client/support/supportBundle.ts`.
- Produce: DTOs read-only, workspace manifests, snapshots, reports, bundles, panels.
- Consume: KB, workspace state, diagnostics summary, server stats, public contract, read-only tool bridge.
- Consumers: developer UI, AI tools, support workflows, tests.
- Caches: workload wrappers, adaptive report limits, support bundle materialization; no common `ReadOnlyReportCache` actual confirmado.
- Qué considera verdad: debería reflejar `KnowledgeBase`/workspace state publicados; algunos reportes agregan heurísticas.
- Duplicidades: Object Explorer, Current Object Context, diagnostics explainability, AI bundle y manifest pueden proyectar entidades similares.
- Ownership difuso: medio-alto; muchas surfaces sin matriz común de projection ownership.
- Riesgo hot path: medio; son no-interactive/reporting, pero pueden materializar mucho en 5000+.
- Escala a 5000+ archivos: parcial; requieren paginación/caps explícitos por surface.
- Mantener/fusionar/degradar/eliminar: mantener las de valor, fusionar contratos y degradar duplicadas a report-only si procede.
- Motivo: alto valor para IA/desarrolladores, pero necesitan gobernanza y budgets.

## Capa: RuntimeSelfTest

- Responsabilidad actual: componer checks de API, LSP/runtime, cache, project model, diagnostics, build, ORCA, functional coverage, views, hover, serving/negative caches.
- Archivos: `src/client/runtimeSelfTest.ts`.
- Produce: `RuntimeSelfTestReport` y checks pass/warning/fail.
- Consume: public contract, runtime stats, semantic manifest, diagnostics snapshot, functional checks.
- Consumers: command/UI de self-test, soporte, release readiness.
- Caches: ninguna propia.
- Qué considera verdad: stats/contract/manifest actuales como evidencia runtime.
- Duplicidades: solapa con health dashboard y status reports.
- Ownership difuso: medio; health vs self-test deben diferenciar validación puntual vs scorecard.
- Riesgo hot path: bajo; no debe ejecutarse en activación crítica.
- Escala a 5000+ archivos: sí/parcial; depende de que manifest/stats ya estén acotados.
- Mantener/fusionar/degradar/eliminar: mantener como smoke/readiness projection.
- Motivo: valor de soporte/release, con contrato de no bloquear activación.

## Capa: Health dashboard

- Responsabilidad actual: scorecard cliente de readiness, diagnostics, build, ORCA, cache, source-origin, performance y support matrix.
- Archivos: `src/client/projectHealthDashboard.ts`, `src/client/statusBarPresentation.ts`, `src/server/runtime/runtimeHealth.ts`, `src/server/runtime/runtimeProgressController.ts`.
- Produce: scorecards, summaries, status/health reports.
- Consume: runtime stats, diagnostics snapshot, workspace manifest, progress notifications.
- Consumers: UI cliente, status bar, support/release workflows.
- Caches: ninguna propia relevante; consume stats ya materializados.
- Qué considera verdad: stats/runtime state publicados.
- Duplicidades: solapa con RuntimeSelfTest y troubleshooting/support bundle.
- Ownership difuso: medio.
- Riesgo hot path: bajo si se mantiene presentation-only.
- Escala a 5000+ archivos: sí/parcial; depende de stats resumidas y no listas completas.
- Mantener/fusionar/degradar/eliminar: mantener como projection, alinear con self-test.
- Motivo: útil para estado operativo, pero no debe calcular semántica ni duplicar reports pesados.

### Riesgos
- La convergencia incompleta de `SemanticQueryFacade` permite que confidence/evidence/reason codes diverjan entre consumers.
- La coexistencia `ProjectRegistry`/`UnifiedProjectModel` puede perpetuar dos modelos de proyecto aunque compartan routing.
- `TransactionModel` y `SqlAnchors` pueden sobreprometer certeza si no se degradan a submodelos heurísticos con evidence.
- Read-only surfaces pueden ser muy útiles para IA, pero sin matriz de caps/paginación pueden romper el objetivo 5000+.
- `DocumentCache` y snapshot en `KnowledgeBase` pueden parecer dos verdades si el target no define dirección de datos.

### Evidencia consultada
- Informe auxiliar FASE 2 de exploración masiva, usado como evidencia asistida y verificado con lecturas/greps propios en los puntos críticos.
- `src/server/features/semanticQueryFacade.ts` y `src/server/features/queryContext.ts`.
- Grep de adopción `SemanticQueryFacade`, `createDocumentQueryContext` y `resolveTargetEntityDetailed` en `src/server/**/*.ts`.
- `src/server/workspace/projectRouting.ts`, `projectRegistry.ts`, `unifiedProjectModel.ts`, `workspaceState.ts`.
- `src/server/indexer/workspaceIndexer.ts`.
- `src/server/knowledge/KnowledgeBase.ts`, `DocumentCache.ts`, `ServingCache.ts`, `HotContextCache.ts`.
- `src/server/serving/activeDocumentServingSnapshot.ts`, `cacheKeyContract.ts` y handlers de negative cache.
- `src/server/features/completion.ts`, `signatureHelp.ts`, `references.ts`, `semanticTokens.ts`, `hover.ts`, `diagnostics.ts`.
- `src/server/features/dataWindowModel.ts`, `dataWindowFastContext.ts`, `dataWindowSqlLineage.ts`, `embeddedSqlAnchors.ts`.
- `src/server/parsing/externalFunctions.ts`, `src/shared/sourceOrigin.ts`, `src/shared/publicApi.ts`, `src/client/runtimeSelfTest.ts`, `src/client/projectHealthDashboard.ts`.

### Validación pendiente
- Ejecutar validaciones de Markdown y docs drift tras las fases documentales finales.
- Confirmar en FASE 3 duplicidades exactas por concepto y decidir fuente/proyección/eliminación.
- Diseñar en FASE 4/5 si `PublishedSemanticSnapshot` es contrato documental, wrapper readonly o ambos.
- Diseñar en FASE 6 una matriz consumer-by-consumer con exceptions explícitas.
- Diseñar en FASE 7 un contrato de cache/invalidation para negative/read-only report caches y document fingerprints.

### Impacto en diseño objetivo
- El target debe nombrar `KnowledgeBase` publicada como única verdad semántica actual y `PublishedSemanticSnapshot` como contrato objetivo sobre esa verdad.
- El target debe convertir `SemanticQueryFacade` en frontera semántica común, dejando `SemanticQueryService` como motor interno.
- El target debe declarar ProjectModel/LibrarySearchPath como input semántico versionado y no como heurística por provider.
- El target debe declarar DataWindow, SQL, Transaction y ExternalNative como submodelos con `sourceOrigin`, confidence, evidence y degradación.
- El target debe incluir read-only surfaces como proyecciones paginadas/acotadas, no como stores paralelos.

### Impacto en backlog
- Candidato FASE 10: `PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01` debe cubrir contrato `PublishedSemanticSnapshot` sobre `KnowledgeBase`.
- Candidato FASE 10: `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01` debe absorber/conectar la adopción incompleta de `SemanticQueryFacade`.
- Candidato FASE 10: `PB-ARCH-P1-CONSUMER-CONVERGENCE-COMPLETION-SIGNATURE-01` debe incluir completion/signature y revisar references/semantic tokens/diagnostics.
- Candidato FASE 10: `PB-ARCH-P1-READONLY-SURFACES-PROJECTIONS-01` debe definir owners, caps y paging por surface.
- Estado 2026-05: `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01` queda como histórico `Open by conformance` con owner ejecutable en `PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01`; `PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01` queda absorbido por `PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01` y por el tramo runtime `PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01`.

---

## FASE 3 — Assumption Ledger

### Hechos confirmados
- La identidad canónica de símbolos vive principalmente en `Entity`/`KnowledgeBase`, pero la API pública expone `ApiSymbol` y el catálogo de sistema expone `PbSystemSymbolEntry`/tipos propios; los campos de lineage se parecen, pero no comparten un contrato único de evidencia y reason codes.
- `ApiSemanticWorkspaceManifest` se construye desde `KnowledgeBase` y `queryApiSymbols`, mientras Object Explorer, Current Object Context, Diagnostics Explainability y AI Task Context Bundle materializan DTOs específicos desde esa información y desde diagnostics/runtime stats.
- `SemanticQueryFacade` ya converge hover y definition, pero completion, signature help, references, diagnostics, current object context y semantic tokens todavía conservan rutas directas a `queryContext`, `resolveTargetEntityDetailed`, `resolveTargetEntity` o reglas locales.
- `EntityLineageConfidence` usa `direct | inherited | fallback`, `SemanticQueryService` y presentation usan `high | medium | low | unknown`, y algunas surfaces publican `confidence: 'high'` de forma hardcoded.
- La taxonomía de semantic tokens está documentada en `docs/symbol-system.md` y validada por tests, pero sus arrays/índices runtime siguen viviendo en `semanticTokens.ts` y cada token proyectado sale con confidence alta.
- DataWindow, SQL anchors y transaction binding tienen piezas valiosas, pero siguen repartidas entre `dataWindowModel`, binding/serving adapters, SQL regions/lineage, `embeddedSqlAnchors` y diagnostics.
- Las caches actuales son útiles y mayoritariamente separan responsabilidad, pero `DocumentCache` y `KnowledgeBase` contienen snapshots documentales; sin contrato explícito pueden leerse como dos verdades en vez de input cache y publicación.

### Suposiciones utilizadas
- Owner: arquitectura semántica. Suposición: las duplicidades deben resolverse con contratos de fuente/proyección, no con eliminación inmediata de módulos, porque varias superficies públicas necesitan DTOs estables. Riesgo: medio si FASE 8 intenta fusionar prematuramente módulos que hoy protegen performance. Validación prevista: FASE 8 y FASE 9.
- Owner: LSP/providers. Suposición: la adopción objetivo de `SemanticQueryFacade` puede admitir excepciones documentadas para tokens estructurales y diagnostics batch, siempre que esas excepciones produzcan `SemanticQueryResult` compatible. Riesgo: medio-alto si la excepción se convierte en segunda semántica. Validación prevista: FASE 6.
- Owner: DataWindow/SQL. Suposición: DataWindow, SQL y Transaction deben publicarse como submodelos advisory con confidence/evidence, no como verdad fuerte equivalente a símbolos PowerScript. Riesgo: alto si diagnostics o AI bundle exponen inferencias heurísticas como certezas. Validación prevista: FASE 5/6.
- Owner: read-only surfaces. Suposición: manifests, panels, health reports y AI bundle deben seguir siendo proyecciones paginadas/acotadas, no stores cacheados de verdad semántica. Riesgo: alto para workspaces 5000+ si se materializan listas completas. Validación prevista: FASE 7/11/12.

### Dudas abiertas
- Si `PbSystemSymbolEntry` debe convertirse internamente a `Entity` o mantenerse como catálogo externo con adaptador determinístico al contrato común.
- Si semantic tokens deben usar directamente `SemanticQueryFacade` para usos resolubles o sólo consumir un subresultado ya publicado por el snapshot para no penalizar hot path.
- Si `ApiSymbolLineage` debe permanecer con `direct | inherited | fallback` por compatibilidad o migrar a un modelo dual que preserve lineage y confidence de query.
- Si diagnostics explainability debe vivir en cliente como explicación de diagnostics publicados o moverse a una surface server-side con evidence trace completo.
- Si `DocumentCache` debe exponer sólo snapshots de análisis o también DTOs ya normalizados para `PublishedSemanticSnapshot`.

### Decisiones tomadas
- Marcar `Entity` publicado en `KnowledgeBase` como verdad objetivo para símbolos de workspace, con `ApiSymbol`, manifest objects, Object Explorer nodes y AI bundle como proyecciones.
- Mantener `SystemCatalog` como verdad externa/manual para built-ins, pero exigir un adaptador explícito hacia el contrato común antes de que consumers mezclen `Entity` y `PbSystemSymbolEntry` directamente.
- Marcar `SemanticQueryFacade` + `SemanticQueryService` como ruta objetivo de resolución para hover targets, definition targets, references candidates, completion candidates y signature overloads.
- Tratar DataWindow/SQL/Transaction como submodelos publicados/advisory con confidence/evidence/reason codes comunes.
- Dejar semantic tokens como proyección visual, no verdad semántica; su taxonomía debe tener owner único y su confidence debe derivar del resultado común cuando represente símbolos resueltos.
- No crear ni modificar backlog todavía; los identificadores de backlog citados aquí son candidatos para consolidación en FASE 10.

### Duplicidad: identidad de symbols, types, functions, events y built-ins

- Verdad A: `Entity`/`EntityKind` en `src/server/knowledge/types.ts`, publicado por `KnowledgeBase` e indexado por URI, kind, container y base type.
- Verdad B: `ApiSymbol`/`ApiSymbolLineage` en `src/shared/publicApi.ts`, generado como DTO por `toApiSymbol` y usado por APIs read-only, manifests y bundles.
- Verdad C: `PbSystemSymbolEntry` y tipos de catálogo en `src/server/knowledge/system/types.ts`, consultados por `SystemCatalog` para built-ins, constants, DataWindow functions, datatypes y enums.
- Archivos: `src/server/knowledge/types.ts`, `src/server/knowledge/KnowledgeBase.ts`, `src/shared/publicApi.ts`, `src/server/features/workspaceSymbols.ts`, `src/server/knowledge/system/types.ts`, `src/server/knowledge/system/SystemCatalog.ts`.
- Consumers afectados: hover, completion, signature help, semantic tokens, workspace symbols, Object Explorer, semantic manifest, AI bundle, explain system symbol.
- Riesgo: alto; nuevos campos semánticos pueden llegar a `Entity` sin llegar a `ApiSymbol`, y built-ins pueden requerir lógica paralela si no hay adaptador común.
- Fuente de verdad objetivo: `PublishedSemanticSnapshot.symbols` basado en `Entity` para workspace y un adaptador `SystemCatalogSymbolProjection` para built-ins con identidad normalizada compatible.
- Qué debe ser proyección: `ApiSymbol`, `ApiSemanticWorkspaceManifest.exportedSymbols`, Object Explorer nodes, AI bundle symbols y explain reports.
- Qué debe eliminarse o fusionarse: reglas de identidad duplicadas dentro de consumers; no eliminar `SystemCatalog`, sino aislarlo como verdad externa con mapping explícito.
- Backlog: candidato FASE 10 `PB-ARCH-P0-SYMBOL-IDENTITY-CONTRACT-01`; puede absorberse con trabajo existente de identity key/catalog compatibility.

### Duplicidad: ancestors, owner resolution y library search path

- Verdad A: `baseTypeName`, `ownerName`, `containerName` y scopes publicados en `Entity`/`KnowledgeBase`.
- Verdad B: `InheritanceGraph` deriva ancestors, descendants y member closures desde KB y native ancestors.
- Verdad C: `currentObjectContext` reconstruye hierarchy, ancestor descriptors, visible variables y related files para la surface activa.
- Verdad D: `ProjectModel`/`libraryOrder` influyen en preferencia de candidates y search path, pero ese criterio no aparece siempre como parte visible del query result.
- Archivos: `src/server/knowledge/resolution/InheritanceGraph.ts`, `src/server/knowledge/system/nativeAncestors.ts`, `src/server/features/currentObjectContext.ts`, `src/server/knowledge/resolution/libraryOrder.ts`, `src/server/workspace/unifiedProjectModel.ts`, `src/server/workspace/projectRegistry.ts`.
- Consumers afectados: definition, references, dependency graph, current object context, workspace manifest inheritance summary, diagnostics owner mismatch, completion inherited members.
- Riesgo: medio-alto; dos consumers pueden explicar ancestors o owner selection de forma distinta aunque partan de la misma KB.
- Fuente de verdad objetivo: `InheritanceSubmodel` derivado de KB + `ProjectModel/LibrarySearchPath` versionado como input de resolución.
- Qué debe ser proyección: `currentObjectContext.ancestorChain`, manifest `inheritanceSummary`, dependency graph y related files.
- Qué debe eliminarse o fusionarse: reconstrucciones locales de hierarchy/member visibility que no pasan por graph/query result o no registran evidence.
- Backlog: candidato FASE 10 `PB-ARCH-P1-INHERITANCE-LIBRARY-PROJECTION-01`.

### Duplicidad: hover targets, definition targets, references candidates, completion candidates y signature overloads

- Verdad A: `SemanticQueryService.resolveTargetEntityDetailed` produce `ResolvedTargetInfo` con targets, confidence, evidence, reason codes, ambiguity, invocation kind/risk.
- Verdad B: `SemanticQueryFacade` encapsula position context, target symbol/info, receiver, callable, inheritance y catalog callable, pero aún no es frontera obligatoria.
- Verdad C: completion, signature help, references, diagnostics, current object context y semantic tokens conservan rutas directas o heurísticas propias para candidates/overloads/usages.
- Archivos: `src/server/knowledge/resolution/semanticQueryService.ts`, `src/server/features/semanticQueryFacade.ts`, `src/server/features/queryContext.ts`, `src/server/features/completion.ts`, `src/server/features/signatureHelp.ts`, `src/server/features/references.ts`, `src/server/features/diagnostics.ts`, `src/server/features/semanticTokens.ts`.
- Consumers afectados: todos los providers LSP y las surfaces que reusan esos resultados.
- Riesgo: crítico para coherencia; completion puede sugerir candidates que definition no resuelve, references puede usar ambiguity distinta y signature help puede ordenar overloads con criterio no compartido.
- Fuente de verdad objetivo: `SemanticQueryResult` común producido por facade/service y parametrizado por consumer policy.
- Qué debe ser proyección: CompletionItem, SignatureHelp, Location, Reference list, Hover markdown, semantic token resolved symbol y diagnostics evidence data.
- Qué debe eliminarse o fusionarse: resolución semántica de scope/candidates/overloads dentro de providers; se permiten sólo filtros/presentación por consumer.
- Backlog: candidato FASE 10 `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01` y `PB-ARCH-P1-LSP-CONSUMER-CONVERGENCE-01`.

### Duplicidad: confidence, evidence y reason codes

- Verdad A: `EntityLineageConfidence` usa `direct | inherited | fallback` y expresa procedencia del símbolo.
- Verdad B: `QueryResolutionConfidence`/presentation usan `high | medium | low | unknown`, con evidence entries y reason codes de query.
- Verdad C: diagnostics, code actions, completion presentation, definition presentation, semantic tokens, current object context y AI bundle publican confidence/reason codes con esquemas propios o valores por defecto.
- Archivos: `src/server/knowledge/types.ts`, `src/server/knowledge/resolution/semanticQueryService.ts`, `src/server/presentation/viewModels.ts`, `src/server/presentation/completionPresentation.ts`, `src/server/presentation/definitionPresentation.ts`, `src/server/features/semanticTokens.ts`, `src/server/features/currentObjectContext.ts`, `src/server/features/diagnostics.ts`, `src/shared/publicApi.ts`, `src/client/aiTaskContextBundle.ts`.
- Consumers afectados: diagnostics explainability, AI bundle, Object Explorer/read-only reports, semantic tokens, completions, safe edit plan y support bundle.
- Riesgo: crítico; una surface puede exponer alta confianza aunque la fuente sea fallback, inherited, dynamic o advisory.
- Fuente de verdad objetivo: `SemanticEvidence`/`ConfidenceEvidenceModel` común en `PublishedSemanticSnapshot` y en cada `SemanticQueryResult`.
- Qué debe ser proyección: confidence visible de completion, tokens, diagnostics, current object context, API DTOs y reports.
- Qué debe eliminarse o fusionarse: confidence hardcoded en presentation para resultados semánticos; reason code enums aislados sin mapping central.
- Backlog: candidato FASE 10 `PB-ARCH-P0-CONFIDENCE-EVIDENCE-CONTRACT-01`; debe absorber items ya abiertos de confidence calibration si existen.

### Duplicidad: semantic tokens y taxonomía visual

- Verdad A: `POWERBUILDER_SEMANTIC_TOKEN_TYPES`, modifiers, masks e índices viven en `src/server/features/semanticTokens.ts`.
- Verdad B: `docs/symbol-system.md` sección 8 documenta `SYMBOL-TOKENS-01`, mapping y límites de extensiones futuras.
- Verdad C: tests de semantic tokens fijan contrato visible y rangos/modifiers.
- Archivos: `src/server/features/semanticTokens.ts`, `src/server/presentation/semanticTokenPresentation.ts`, `test/server/unit/semanticTokens.test.ts`, `docs/symbol-system.md`.
- Consumers afectados: VS Code semantic tokens, tests de contrato, AI/reportes que interpreten colorización como evidencia.
- Riesgo: medio; no es una segunda verdad semántica fuerte, pero sí una taxonomía duplicada entre doc, tests y runtime.
- Fuente de verdad objetivo: un owner explícito de `SemanticTokensTaxonomy` y mapping documentado; runtime y tests deben ser proyecciones/validaciones del mismo contrato.
- Qué debe ser proyección: token entries y modifiers en LSP; confidence de cada token sólo si proviene de símbolo resuelto.
- Qué debe eliminarse o fusionarse: hardcoded `confidence: 'high'` para tokens que representan resolución semántica; mantener keywords/tokens estructurales como visual-only sin prometer evidence.
- Backlog: candidato FASE 10 `PB-ARCH-P1-SEMANTIC-TOKENS-TAXONOMY-OWNER-01` si la gobernanza actual de `docs/symbol-system.md` no basta.

### Duplicidad: DataWindow bindings, retrieve args, columns, controls y DataObject targets

- Verdad A: `DataWindowModel` parsea `.srd`/source y contiene columns, controls, reports, retrieve arguments, expressions y SQL references simples.
- Verdad B: `dataWindowBindingModel`, `dataWindowFastContext` y `dataWindowServingAdapters` resuelven owner types, binding context, accessible members y adapters de completion/signature.
- Verdad C: `currentObjectContext`, definition adapters, diagnostics y semantic consistency oracle vuelven a materializar bindings/DataObject targets para reporting o warnings.
- Archivos: `src/server/features/dataWindowModel.ts`, `src/server/features/dataWindowBindingModel.ts`, `src/server/features/dataWindowFastContext.ts`, `src/server/features/dataWindowServingAdapters.ts`, `src/server/features/definition.ts`, `src/server/features/currentObjectContext.ts`, `src/server/features/diagnostics.ts`, `src/server/features/semanticConsistencyOracle.ts`.
- Consumers afectados: completion, signature help, hover, definition, diagnostics, current object context, SQL lineage y AI bundle.
- Riesgo: alto; DataWindow tiene semántica distinta de PowerScript y puede degradar a dynamic/unknown sin que todas las surfaces lo expresen igual.
- Fuente de verdad objetivo: `DataWindowSubmodel` derivado, publicado por documento/objeto, con source origin, confidence, evidence, owner, columns/properties/retrieve args y DataObject target.
- Qué debe ser proyección: adapters LSP, current object dataWindowBindings, diagnostics, lineage SQL y bundle IA.
- Qué debe eliminarse o fusionarse: reparsers locales y reglas de binding/arity duplicadas fuera del submodelo/adapters oficiales.
- Backlog 2026-05: owner ejecutable activo `PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01`; `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01` permanece sólo como histórico `Open by conformance`.

### Duplicidad: SQL anchors y transactions

- Verdad A: `sqlRegions` y `embeddedSqlAnchors` delimitan SQL embebido, host variables y transaction targets.
- Verdad B: `DataWindowModel.sqlReferences` y `dataWindowSqlLineage` producen referencias/lineage de SQL dentro de DataWindow.
- Verdad C: `diagnostics.ts` infiere `SetTransObject`/`SetTrans`, SQLCA y riesgos de transaction binding con lógica propia.
- Archivos: `src/server/parsing/sqlRegions.ts`, `src/server/features/embeddedSqlAnchors.ts`, `src/server/features/dataWindowSqlLineage.ts`, `src/server/features/dataWindowModel.ts`, `src/server/features/diagnostics.ts`, `src/server/utils/invocationContext.ts`.
- Consumers afectados: diagnostics, current object context, technical debt, semantic consistency oracle, AI bundle, safe edit plan.
- Riesgo: crítico si una inferencia regex/advisory se presenta como verdad runtime; alto para performance si lineage profundo entra en hot path.
- Fuente de verdad objetivo: `SqlAnchorSubmodel` y `TransactionSubmodel` advisory, versionados por document fingerprint/semantic epoch y con evidence/reason codes.
- Qué debe ser proyección: diagnostics transaction warnings, current object embeddedSqlAnchors, dataWindow SQL lineage y reports técnicos.
- Qué debe eliminarse o fusionarse: inferencia transaccional duplicada en diagnostics sin submodelo; SQL lineage profundo en providers interactivos.
- Backlog: candidato FASE 10 `PB-ARCH-P2-SQL-TRANSACTION-SUBMODELS-01`, evitando duplicar `PB-SEMANTIC-P1-SQL-TRANSACTION-ANCHORS-01` si ya cubre el alcance.

### Duplicidad: Object Explorer, Current Object Context, Diagnostics Explainability, health reports y AI bundle

- Verdad A: `buildSemanticWorkspaceManifest` crea objects, inheritance summary y exported symbols desde KB, graph, workspace state, diagnostics summary y system catalog.
- Verdad B: Object Explorer transforma `ApiSemanticWorkspaceManifest.objects` en árbol proyecto/library/kind/object.
- Verdad C: Current Object Context recompone objeto activo, hierarchy, members, visible variables, diagnostics, dataWindowBindings, embeddedSqlAnchors, evidence y related files.
- Verdad D: Diagnostics Explainability en cliente explica diagnostics publicados desde `diagnostic.data`/mensajes, mientras AI bundle agrega workspace/object checks, current object context, safe edit plan, dependency graph y explanations bajo token budget.
- Verdad E: RuntimeSelfTest y Health Dashboard agregan readiness, runtime stats, diagnostics, cache, project model, views y support matrix.
- Archivos: `src/server/features/semanticWorkspaceManifest.ts`, `src/client/objectExplorerModel.ts`, `src/server/features/currentObjectContext.ts`, `src/client/diagnosticsExplainabilityPanelModel.ts`, `src/client/explainDiagnosticReport.ts`, `src/client/aiTaskContextBundle.ts`, `src/client/runtimeSelfTest.ts`, `src/client/projectHealthDashboard.ts`, `src/client/support/supportBundle.ts`.
- Consumers afectados: UI cliente, comandos read-only, soporte, agentes IA, release readiness y troubleshooting.
- Riesgo: alto para trazabilidad; cada surface puede proyectar el mismo objeto/símbolo con distinto estado, confidence, readiness o omisiones.
- Fuente de verdad objetivo: `ReadOnlyProjectionContract` desde `PublishedSemanticSnapshot`, runtime stats y request context, con caps/paginación/redaction.
- Qué debe ser proyección: Object Explorer tree, current object panel, diagnostic explainability panel/report, health dashboard, self-test y AI/support bundles.
- Qué debe eliminarse o fusionarse: acumulación de lógica semántica nueva en cliente; duplicidad entre health/self-test debe quedar como scorecard vs smoke/readiness.
- Backlog: candidato FASE 10 `PB-ARCH-P1-READONLY-SURFACES-PROJECTIONS-01` y `PB-ARCH-P1-AI-BUNDLE-EVIDENCE-SCHEMA-01`.

### Duplicidad: DocumentCache, KnowledgeBase snapshots, HotContextCache, ServingCache y negative cache

- Verdad A: `DocumentCache` conserva snapshots/facts documentales por URI como cache LRU/pinned/warm/cold.
- Verdad B: `KnowledgeBase` publica document snapshots y entidades en `publishedState` con `semanticEpoch`.
- Verdad C: `HotContextCache`, `ServingCache`, active document serving snapshot y `PresentationCache` negative guardan resultados derivados por request/feature/contexto.
- Archivos: `src/server/knowledge/DocumentCache.ts`, `src/server/knowledge/KnowledgeBase.ts`, `src/server/knowledge/HotContextCache.ts`, `src/server/knowledge/ServingCache.ts`, `src/server/serving/activeDocumentServingSnapshot.ts`, `src/server/serving/presentationCache.ts`, `src/server/serving/cacheKeyContract.ts`, `src/server/server.ts`.
- Consumers afectados: indexer, active document serving, hover, completion resolve, definition, signature help, diagnostics, runtime stats.
- Riesgo: medio-alto; una cache con snapshot o negative miss puede parecer autoridad si keys no incluyen version/fingerprint/source origin/locale donde corresponde.
- Fuente de verdad objetivo: `KnowledgeBase.publishedState`/`PublishedSemanticSnapshot`; caches sólo son proyecciones aceleradoras con invalidación explícita.
- Qué debe ser proyección: DocumentCache entries, hot context, serving payloads, negative misses, active document snapshot.
- Qué debe eliminarse o fusionarse: naming que sugiera `NegativeCache` como store independiente; snapshots cacheados usados como verdad final fuera de publicación.
- Backlog: candidato FASE 10 `PB-ARCH-P1-CACHE-PROJECTION-INVALIDATION-CONTRACT-01`; detalle completo queda para FASE 7.

### Riesgos
- Riesgo crítico de “confidence drift” entre query service, presentation, diagnostics, tokens y AI bundle.
- Riesgo alto de resolución divergente entre completion/signature/references y hover/definition si la facade no se vuelve frontera común.
- Riesgo alto de mezclar built-ins, workspace symbols y DataWindow constructs sin identidad/evidence compatible.
- Riesgo alto de surfaces read-only costosas o inconsistentes en 5000+ archivos si no tienen caps, paging y redaction desde el contrato.
- Riesgo medio de sobrerreaccionar fusionando caches útiles; la solución debe convertirlas en proyecciones versionadas, no eliminarlas por nombre.

### Evidencia consultada
- Informe auxiliar FASE 3 de exploración de duplicidades, usado como insumo y corregido donde aparecían rutas no confirmadas.
- `src/server/knowledge/types.ts`, `src/server/knowledge/KnowledgeBase.ts`, `src/server/knowledge/system/types.ts`, `src/shared/publicApi.ts`.
- `src/server/features/semanticQueryFacade.ts`, `src/server/features/queryContext.ts`, `src/server/knowledge/resolution/semanticQueryService.ts`.
- `src/server/features/completion.ts`, `signatureHelp.ts`, `definition.ts`, `references.ts`, `diagnostics.ts`, `semanticTokens.ts`, `currentObjectContext.ts`.
- `src/server/presentation/viewModels.ts`, `completionPresentation.ts`, `definitionPresentation.ts`, `semanticTokenPresentation.ts`.
- `src/server/features/dataWindowModel.ts`, `dataWindowBindingModel.ts`, `dataWindowFastContext.ts`, `dataWindowServingAdapters.ts`, `embeddedSqlAnchors.ts`, `dataWindowSqlLineage.ts`.
- `src/server/features/semanticWorkspaceManifest.ts`, `src/client/objectExplorerModel.ts`, `src/client/diagnosticsExplainabilityPanelModel.ts`, `src/client/aiTaskContextBundle.ts`, `src/client/runtimeSelfTest.ts`, `src/client/projectHealthDashboard.ts`, `src/client/support/supportBundle.ts`.
- `docs/symbol-system.md`, especialmente sección de DataWindow y semantic tokens taxonomy.

### Validación pendiente
- Ejecutar `get_errors` sobre este ledger tras el patch de FASE 3.
- En FASE 4, convertir estas decisiones en arquitectura objetivo sin duplicar contenido owner de `architecture.md`/`architecture-status.md`.
- En FASE 5/6, definir el contrato `PublishedSemanticSnapshot` y `SemanticQueryResult` para que cada duplicidad tenga cierre técnico.
- En FASE 7, bajar la duplicidad de caches a reglas de key/invalidation/epoch/fingerprint/locale.
- En FASE 10, consolidar backlog real, absorbiendo candidatos que ya estén cubiertos por PB-SEMANTIC existentes.

### Impacto en diseño objetivo
- El target debe declarar explícitamente una jerarquía de verdad: inputs documentales/proyecto/catálogo → `KnowledgeBase` publicada → submodelos derivados → `SemanticQueryResult` → proyecciones LSP/read-only → caches.
- El target debe diferenciar `lineage confidence` de `query confidence` o fusionarlas mediante mapping formal, sin borrar información.
- El target debe hacer obligatoria la evidence/reason-code propagation en LSP y read-only surfaces cuando una respuesta sea semántica, advisory o degradada.
- El target debe tratar Object Explorer, Current Object Context, Diagnostics Explainability, Health/SelfTest y AI bundle como readers/projections con budgets, no como productores de semántica.
- El target debe conservar fast discovery/indexing: ninguna unificación puede introducir full scans, reparsers profundos o copias masivas en hot paths.

### Impacto en backlog
- Candidatos P0 para FASE 10: `PB-ARCH-P0-SYMBOL-IDENTITY-CONTRACT-01`, `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`, `PB-ARCH-P0-CONFIDENCE-EVIDENCE-CONTRACT-01`.
- Candidatos P1 para FASE 10: `PB-ARCH-P1-LSP-CONSUMER-CONVERGENCE-01`, `PB-ARCH-P1-READONLY-SURFACES-PROJECTIONS-01`, `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01`, `PB-ARCH-P1-CACHE-PROJECTION-INVALIDATION-CONTRACT-01`.
- Candidatos P2 para FASE 10: `PB-ARCH-P2-SQL-TRANSACTION-SUBMODELS-01`, `PB-ARCH-P2-SEMANTIC-TOKENS-TAXONOMY-OWNER-01`, `PB-ARCH-P2-INHERITANCE-LIBRARY-PROJECTION-01`.
- Todos los candidatos deben revisarse contra `docs/backlog.md` para fusionar/absorber antes de agregar nuevos ítems.

---

## FASE 4 — Assumption Ledger

### Hechos confirmados
- `docs/semantic-design-target.md` no existía antes de FASE 4 y fue creado como owner específico del diseño semántico futuro.
- `docs/architecture.md` ya define arquitectura general normativa; el nuevo target evita duplicarla y se centra en flujo semántico, jerarquía de verdad, componentes objetivo y escala 5000+.
- `docs/architecture-status.md` confirma que `RequestContext`, `SemanticQueryFacade`, providers LSP, read-only surfaces y DataWindow Domain están en estado parcial/riesgo.
- `docs/architecture-implementation-map.md` confirma rutas reales para client/server, discovery/indexing, knowledge backbone, system catalog, features, DataWindow, reporting, runtime y caches.
- La arquitectura objetivo de FASE 4 usa el flujo requerido: Workspace inputs → Discovery → ProjectModel/LibrarySearchPath → DocumentFacts → SemanticEnrichment → PublishedSemanticSnapshot → SemanticQueryFacade → Caches/projections → LSP/read-only surfaces.

### Suposiciones utilizadas
- Owner: documentación/arquitectura. Suposición: `docs/semantic-design-target.md` debe permanecer como owner del diseño semántico futuro mientras `architecture.md` conserve el diseño general del plugin. Riesgo: bajo-medio por posible duplicación documental. Validación prevista: FASE 11 y `test:docs:drift`.
- Owner: Knowledge backbone. Suposición: `PublishedSemanticSnapshot` puede diseñarse como contrato encima de `KnowledgeBase.publishedState` sin crear un store nuevo. Riesgo: medio si FASE 5 descubre que hace falta una vista wrapper inmutable separada. Validación prevista: FASE 5.
- Owner: LSP/providers. Suposición: todos los providers pueden convertirse en readers/projections de `SemanticQueryFacade` con excepciones acotadas para tokens estructurales y diagnostics batch. Riesgo: medio-alto por diferencias actuales de implementation. Validación prevista: FASE 6 y FASE 9.
- Owner: performance/runtime. Suposición: la arquitectura de componentes no introduce coste extra si las fronteras son contratos y no capas con deep clones. Riesgo: alto para 5000+ si se implementa con serialización masiva por request. Validación prevista: FASE 7, FASE 9 y gates de performance.

### Dudas abiertas
- Si `SemanticEnrichment` debe convertirse en módulo owner real o permanecer como nombre de contrato que agrupa enrichment existente en `knowledge`/`features`.
- Si `Domain Submodels` deben publicarse físicamente dentro de `KnowledgeBase` o referenciarse por handles/versiones para evitar copias grandes.
- Si `ReadOnlyProjectionContract` debe tener schema propio o puede formalizarse mediante `publicApi.ts` y docs de cada surface.
- Qué excepciones exactas a `SemanticQueryFacade` serán aceptables para semantic tokens y diagnostics sin reabrir duplicidad de verdad.

### Decisiones tomadas
- Crear `docs/semantic-design-target.md` como documento owner recomendado por el prompt.
- Definir una jerarquía explícita de verdad: inputs → workspace model → document facts → enrichment → snapshot publicado → query result → presentation/cache.
- Definir componentes objetivo con responsabilidad, owner, inputs, outputs, prohibiciones, dependencies, consumers, cache, invalidation, escalabilidad 5000+, tests y docs owner.
- Mantener `KnowledgeBase` como implementación actual del snapshot publicado y posponer detalles de contenido exacto a FASE 5.
- Mantener las caches existentes como capa `Cache / Projection Layer`, no como arquitectura paralela.

### Riesgos
- Riesgo de que `SemanticEnrichment` suene a nuevo subsistema obligatorio; FASE 9 debe transformarlo en pasos incrementales sobre módulos existentes.
- Riesgo de duplicar el owner de DataWindow entre `docs/symbol-system.md` y el target; el target sólo debe gobernar contrato transversal, no catálogo/reglas detalladas.
- Riesgo de convertir read-only surfaces en reports pesados si no se hacen obligatorios caps, paging, receipts y redaction.
- Riesgo de naming: `PublishedSemanticSnapshot` debe aclararse en FASE 5 para que nadie cree otra base semántica paralela.

### Evidencia consultada
- `.github/prompts/audit-architecture-future.prompt.md`, sección FASE 4.
- `docs/architecture.md`.
- `docs/architecture-status.md`.
- `docs/architecture-implementation-map.md`.
- Hallazgos FASE 2 y FASE 3 de este ledger.
- Lecturas verificadas de `src/server/features/semanticWorkspaceManifest.ts`, `src/server/features/semanticQueryFacade.ts`, `src/server/knowledge/KnowledgeBase.ts`, `src/server/features/semanticTokens.ts`, `src/client/aiTaskContextBundle.ts` y `src/shared/publicApi.ts`.

### Validación pendiente
- Ejecutar `get_errors` sobre `docs/semantic-design-target.md` y este ledger tras el patch.
- En FASE 5, completar el contrato detallado de `PublishedSemanticSnapshot`.
- En FASE 6, completar el contrato `SemanticQueryResult` y matriz de consumers.
- En FASE 7, bajar la capa de caches a keys, invalidación, epoch/fingerprint y memory pressure.
- En FASE 11, revisar links y evitar duplicación documental con architecture/status/map.

### Impacto en diseño objetivo
- Ya existe documento objetivo inicial con flujo, jerarquía de verdad, estrategia por escala y componentes objetivo.
- El diseño objetivo queda orientado a no bloquear: discovery incremental, indexación priorizada, snapshot versionado, facade acotada, caches proyectivas y read-only paginado.
- Las fases 5-7 deben ampliar secciones específicas sin reemplazar el flujo base.

### Impacto en backlog
- FASE 10 deberá convertir los componentes objetivo en ítems accionables, no en un refactor big-bang.
- Candidatos FASE 10 ya dependen de esta arquitectura: snapshot contract, query contract, provider convergence, confidence/evidence, read-only projections, cache invalidation y submodelos DataWindow/SQL/Transaction.
- No se añadió backlog real en FASE 4; queda centralizado para consolidación posterior.

---

## FASE 5 — Assumption Ledger

### Hechos confirmados
- `KnowledgeBase` ya publica estado atómico con `publishedState`, `stagedState`, `beginBatchUpdate`, `commitBatchUpdate`, `publishState`, `semanticEpoch` y `publishedAt`.
- `PublishedKnowledgeState` contiene índices por símbolo global, kind, container, base type, URI, scopes, snapshots documentales, dependencias y reverse dependencies.
- `SemanticDocumentSnapshot` contiene URI, version, fingerprint, identity, pass, readiness, container model, symbols, scopes, logical statements, masked text y control blocks.
- `SourceOrigin` ya tiene enum compartido, prioridad e inferencia por URI; `Entity.lineage.sourceOrigin` y summaries de workspace lo reutilizan.
- `SemanticQueryService` ya define confidence de query, reason codes, invocation kind/risk, evidence entries, ambiguity y candidate pool.
- Los nombres `PublishedSemanticSnapshot`, `DataWindowSubmodel`, `SqlAnchorSubmodel`, `TransactionSubmodel`, `FrameworkAdvisorySubmodel` y `ConfidenceEvidenceModel` aún son contratos objetivo, no módulos implementados como tales.

### Suposiciones utilizadas
- Owner: Knowledge backbone. Suposición: `PublishedSemanticSnapshot` debe ser una vista/contrato sobre `KnowledgeBase.publishedState`, no una segunda base de datos. Riesgo: alto si se implementa como store paralelo. Validación prevista: FASE 9 y architecture gates.
- Owner: performance/runtime. Suposición: submodelos grandes deben referenciarse por URI/fingerprint/version o paginarse, no copiarse enteros dentro de cada payload público. Riesgo: alto para 5000+ archivos. Validación prevista: FASE 7 y `test:performance:gate`.
- Owner: catalog. Suposición: `SystemCatalogModel` se referencia como verdad externa versionada con provenance, no se absorbe como `Entity` de workspace salvo projection/adaptador. Riesgo: medio por dualidad built-ins/workspace. Validación prevista: catalog tests y FASE 6.
- Owner: DataWindow/SQL. Suposición: DataWindow/SQL/Transaction submodels pueden publicarse incrementalmente como advisory sin bloquear el snapshot base. Riesgo: medio-alto por implementación parcial actual. Validación prevista: FASE 9 y tests DataWindow/diagnostics.

### Dudas abiertas
- Si `PublishedSemanticSnapshot` necesita una interfaz TypeScript pública real o si basta con documentar el contrato y exponer métodos readonly de `KnowledgeBase`.
- Si `semanticEpoch` debe seguir siendo la única versión global o si el contrato debe formalizar también versiones por submodelo/catalog/project.
- Cómo mapear exactamente `EntityLineageConfidence` (`direct/inherited/fallback`) con `QueryResolutionConfidence` (`high/medium/low/unknown`) sin perder información.
- Qué nivel de unresolved/low-confidence debe conservarse en snapshot frente a query-only result para no inflar memoria.

### Decisiones tomadas
- Definir `PublishedSemanticSnapshot` en `docs/semantic-design-target.md` como contrato detallado de verdad única.
- Declarar que el snapshot contiene o referencia los submodelos requeridos: ProjectModel, SourceOriginModel, DocumentFacts, SymbolModel, CallableModel, ScopeModel, TypeModel, InheritanceModel, SystemCatalogModel, DataWindowSubmodel, SqlAnchorSubmodel, TransactionSubmodel, ExternalNativeSubmodel, FrameworkAdvisorySubmodel y ConfidenceEvidenceModel.
- Declarar que presentation caches, LSP payloads, Object Explorer nodes, AI bundle, reports y negative misses no forman parte del snapshot.
- Declarar que hot path sólo puede hacer lecturas readonly/acotadas; deep DataWindow/SQL lineage y reports van a background/offline.
- Mantener `documentFingerprint` como discriminador por documento para caches/proyecciones aunque el snapshot tenga `semanticEpoch` global.

### Riesgos
- Riesgo de memory bloat si se materializan todos los submodelos por cada snapshot en lugar de referencias/slices.
- Riesgo de drift si `ApiSymbol` y DTOs públicos empiezan a crecer como reemplazo del snapshot.
- Riesgo de sobreprometer `TransactionSubmodel` cuando hoy es inferencia dispersa y advisory.
- Riesgo de que `SystemCatalogModel` duplique catálogo manual/generated/localized si no se trata como referencia externa.

### Evidencia consultada
- `src/server/knowledge/KnowledgeBase.ts`, especialmente `PublishedKnowledgeState`, batch update, `semanticEpoch`, getters readonly, publish/restore/export.
- `src/server/analysis/semanticSnapshot.ts`.
- `src/server/knowledge/resolution/semanticQueryService.ts`.
- `src/server/knowledge/resolution/resolvedSemanticModels.ts`.
- `src/shared/sourceOrigin.ts`.
- Greps de cache key/stale guard para `kbVersion`, `documentFingerprint`, `sourceOrigin`, `locale` y `negative`.
- Hallazgos FASE 2-4 del ledger.

### Validación pendiente
- Ejecutar `get_errors` sobre target y ledger tras el patch.
- En FASE 6, convertir `ConfidenceEvidenceModel` y `SemanticQueryResult` en contrato consumer-by-consumer.
- En FASE 7, definir keys/invalidation para snapshot/projections/caches.
- En FASE 9, decidir si se implementa interfaz TypeScript nueva o sólo adaptación incremental de métodos existentes.
- En FASE 10, abrir backlog concreto para snapshot contract/submodel publication si no está cubierto.

### Impacto en diseño objetivo
- El target ahora contiene la sección `PublishedSemanticSnapshot` exigida por la fase.
- La verdad única queda anclada a `KnowledgeBase.publishedState` y a submodelos referenciados/versionados.
- El diseño separa explícitamente snapshot, query result, cache y DTO público.

### Impacto en backlog
- Candidato FASE 10: `PB-ARCH-P0-PUBLISHED-SEMANTIC-SNAPSHOT-CONTRACT-01`.
- Candidato FASE 10: `PB-ARCH-P0-CONFIDENCE-EVIDENCE-MODEL-01`, posiblemente fusionado con el query contract.
- Candidato FASE 10: subitems de publicación gradual para DataWindow, SQL anchors, Transaction, ExternalNative y FrameworkAdvisory.
- Candidato FASE 10: validar si `ApiSymbol` projection necesita migración o sólo tests de determinismo.

---

## FASE 6 — Assumption Ledger

### Hechos confirmados
- `SemanticQueryService` ya produce `ResolvedTargetInfo` con context, targets, reasonCodes, invocationKind/risk, ambiguity, qualifier type, winnerLineage, confidence, evidence, candidatePool y trace.
- `resolvedSemanticModels.ts` ya define modelos canónicos/resueltos para símbolos, receivers, callables y enum context con confidence/reason codes.
- `SemanticQueryFacade` existe y expone position context, target symbol/info, receiver type, callable, inheritance, enum context y catalog callable, aunque su adopción es parcial.
- `queryScopePolicy.ts` ya define consumer policies con max scope, budgetMs, resultCap, readiness, required confidence, fallback action y source origin policy para varios consumers.
- Hover y definition ya usan `SemanticQueryFacade`; completion/current object/impact/rename usan `createDocumentQueryContext`; signature/references/diagnostics aún llaman `resolveTargetEntityDetailed` directamente en rutas relevantes.

### Suposiciones utilizadas
- Owner: query/facade. Suposición: `ResolvedTargetInfo` puede evolucionar hacia `SemanticQueryResult` sin reemplazo big-bang, añadiendo envelope/projection metadata alrededor de campos existentes. Riesgo: medio por compatibilidad de providers. Validación prevista: FASE 9.
- Owner: providers. Suposición: cada consumer puede expresar su lógica como proyección/filtro sobre `SemanticQueryResult`; las excepciones serán temporales y documentadas. Riesgo: alto para semantic tokens, diagnostics y references. Validación prevista: cross-surface tests.
- Owner: public API. Suposición: `SemanticQueryResult` no debe exponerse crudo en API pública; read-only surfaces reciben DTOs derivados con epoch/evidence suficiente. Riesgo: medio por compatibilidad y payload size. Validación prevista: public API tests.
- Owner: performance. Suposición: incluir evidence/alternatives no rompe budgets si se capan por consumerProjection y sólo se serializan cuando se necesitan. Riesgo: medio-alto. Validación prevista: FASE 7 y payload budget tests.

### Dudas abiertas
- Si `QueryReasonCode` actual debe ampliarse o mapearse a un enum central compartido con diagnostics/API/AI bundle.
- Si `SemanticQueryResult` debe existir como tipo TypeScript único o como contrato documental aplicado por adapters/view models.
- Cómo paginar alternatives/evidence para references, workspace symbols y AI reports sin perder explainability.
- Qué budget exacto debe aplicarse a semantic tokens, document symbols, Object Explorer y AI reports, que hoy no encajan igual que hover/completion.

### Decisiones tomadas
- Añadir a `docs/semantic-design-target.md` el contrato `SemanticQueryResult` con query, target, kind, owner, scope, source, confidence, evidence, reasons, alternatives, degraded, cacheability, semanticEpoch y consumerProjection.
- Definir reglas del contrato: no es presentation, los fallbacks conservan evidence, `unknown` es válido, consumers no recalculan confidence y system/DataWindow/SQL/Transaction comparten envelope.
- Añadir matriz de consumers para hover, completion, signature help, definition, references, semantic tokens, diagnostics, document symbols, workspace symbols, Object Explorer, Current Object Context, Diagnostics Explainability, RuntimeSelfTest, Health dashboard y AI/read-only reports.
- Documentar budgets conocidos desde `queryScopePolicy` cuando existen y marcar los demás como command/report/document budgets a concretar.

### Riesgos
- Riesgo de crear un contrato demasiado amplio que empuje payloads grandes a hot paths; la mitigación es `consumerProjection` y cacheability explícita.
- Riesgo de que references mantenga búsqueda textual como ruta principal si no se fuerza identidad/target común.
- Riesgo de que semantic tokens sigan usando confidence hardcoded si no se distingue token visual de token resuelto.
- Riesgo de que diagnostics explainability en cliente no tenga evidence suficiente si diagnostics no transportan `SemanticQueryResult` derivado.

### Evidencia consultada
- `src/server/features/queryScopePolicy.ts`.
- `src/server/features/semanticQueryFacade.ts`.
- `src/server/features/queryContext.ts`.
- `src/server/knowledge/resolution/semanticQueryService.ts`.
- `src/server/knowledge/resolution/resolvedSemanticModels.ts`.
- Greps de provider usage para `createDocumentQueryContext`, `resolveTargetEntityDetailed`, `provideHover`, `provideCompletion`, `provideSignatureHelp`, `provideDefinition`, `provideReferences`, `provideSemanticTokens`, `buildDiagnosticsForDocument` y `queryApiSymbols`.

### Validación pendiente
- Ejecutar `get_errors` sobre target y ledger tras el patch.
- FASE 7 debe amarrar `cacheability` a keys reales de serving/presentation/report caches.
- FASE 9 debe convertir la matriz en plan incremental por consumer.
- FASE 10 debe abrir backlog sólo para consumers no cubiertos por trabajo PB-SEMANTIC existente.

### Impacto en diseño objetivo
- El target ahora contiene el contrato común `SemanticQueryResult` y matriz consumer-by-consumer.
- La convergencia semántica se formula como migración de consumers a facade/result/projection, no como reescritura de providers.
- El diseño separa contrato semántico, view models/presentation y cacheability.

### Impacto en backlog
- Candidato FASE 10: `PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-01`.
- Candidato FASE 10: `PB-ARCH-P1-CONSUMER-PROJECTION-MATRIX-01`.
- Candidatos por consumer deben priorizar references, diagnostics, signature help, completion confidence y semantic tokens confidence.

---

## FASE 7 — Assumption Ledger

### Hechos confirmados
- `DocumentCache` es LRU con pinned/warm/cold behavior, stores facts/scopes/snapshots por URI y export/restore de document records.
- `KnowledgeBase` contiene el snapshot store publicado y avanza `semanticEpoch` en `publishState`.
- `ServingCache` tiene particiones por feature, LRU, TTL opcional, observer events y stats; keys legacy y structured pueden convivir.
- `HotContextCache` se invalida por active URI y KB version, cachea entidades activas y miembros heredados con cap.
- `PresentationCache` implementa caches de view-model y negative misses por structured key, con invalidate por URI y stats.
- `cacheKeyContract.ts` ya incluye `cacheClass`, feature, URI, documentVersion, `kbVersion`, `documentFingerprint`, sourceOrigin, locale, position/range/context/trigger/prefix/extra.
- `staleGuard.ts` ya compara cancellation, newer request, document version, locale, kbVersion, document fingerprint, source origin y context key.
- `ReadOnlyReportCache` no existe como módulo standalone; reports actuales usan workloads, adaptive limits, reportLimits, support/AI bundle materialization y public API DTOs.

### Suposiciones utilizadas
- Owner: cache/runtime. Suposición: `ReadOnlyReportCache` debe permanecer como contrato de proyección/report pages hasta que una necesidad real justifique módulo propio. Riesgo: medio si reports grandes recalculan demasiado. Validación prevista: FASE 9/10 y performance gates.
- Owner: Knowledge backbone. Suposición: target futuro debe poder evitar `semanticEpoch` global si el texto cambia pero facts públicos no cambian. Riesgo: medio porque la implementación actual incrementa al publicar. Validación prevista: FASE 9.
- Owner: serving. Suposición: `documentFingerprint` + `kbVersion` + sourceOrigin + locale es la base correcta para hot path keys, con diff más fino futuro para evitar invalidaciones globales. Riesgo: bajo-medio. Validación prevista: cache key tests.
- Owner: DataWindow/SQL. Suposición: submodel invalidation debe ser por URI/DataObject/target, no workspace-wide. Riesgo: medio-alto por dependencias dinámicas. Validación prevista: DataWindow/SQL tests.

### Dudas abiertas
- Si se debe implementar un evento explícito `SemanticEpochAdvanced` además de observar `KnowledgeBase.version`.
- Si ServingCache debe migrar completamente a structured keys o conservar legacy keys para compatibilidad interna.
- Si report pages necesitan persistencia entre sesiones o sólo request-local/short-lived cache.
- Cómo medir “facts públicos no cambian” de forma barata antes de publicar KB en todos los casos.

### Decisiones tomadas
- Documentar seis caches objetivo: DocumentCache, KnowledgeBase snapshot store, ServingCache, HotContextCache, NegativeCache y ReadOnlyReportCache.
- Declarar `KnowledgeBase snapshot store` como verdad publicada y el resto como proyecciones/caches.
- Declarar `ReadOnlyReportCache` como contrato, no módulo obligatorio todavía.
- Diseñar eventos de invalidación: DocumentChanged, DocumentFactsChanged, ProjectModelChanged, LibraryOrderChanged, DataWindowFactsChanged, SqlAnchorsChanged, KnowledgeBasePublished y SemanticEpochAdvanced.
- Añadir política anti-invalidación global: cambios textuales sin cambio semántico público no deben invalidar todo el workspace.

### Riesgos
- Riesgo de que el target prometa diff semántico fino antes de que exista implementación; FASE 9 debe convertirlo en slice incremental.
- Riesgo de stale negatives si una miss se conserva sin fingerprint/epoch/sourceOrigin/locale completos.
- Riesgo de reports read-only pesados si no se implementan caps/page tokens/receipts con métricas.
- Riesgo de invalidar demasiado por `semanticEpoch` global en ServingCache aunque `documentFingerprint` ya permita granularidad.

### Evidencia consultada
- `src/server/knowledge/DocumentCache.ts`.
- `src/server/knowledge/KnowledgeBase.ts`.
- `src/server/knowledge/ServingCache.ts`.
- `src/server/knowledge/HotContextCache.ts`.
- `src/server/serving/cacheKeyContract.ts`.
- `src/server/serving/presentationCache.ts`.
- `src/server/serving/staleGuard.ts`.
- Greps de report workloads/adaptive limits y `semanticEpoch` usage.

### Validación pendiente
- Ejecutar `get_errors` sobre target y ledger tras el patch.
- FASE 9 debe mapear qué eventos existen, cuáles son contract-only y cuáles se implementan primero.
- FASE 10 debe definir backlog de cache projection/invalidation sin duplicar specs cache ya cerradas.
- Validación final debe incluir `test:performance:gate` y architecture gates.

### Impacto en diseño objetivo
- El target ahora tiene contrato de caches e invalidación con keys, contents, invalidation, TTL, epoch relation, hot path, metrics, scale y tests.
- La regla anti-full-invalidation queda explícita y vinculada a events.
- `ReadOnlyReportCache` queda definido como projection lane para reports/AI, no truth store.

### Impacto en backlog
- Candidato FASE 10: `PB-ARCH-P1-CACHE-PROJECTION-INVALIDATION-CONTRACT-01`.
- Candidato FASE 10: `PB-ARCH-P1-SEMANTIC-DIFF-NOOP-PUBLISH-GATE-01` para evitar epoch global cuando facts públicos no cambian.
- Candidato FASE 10: `PB-ARCH-P2-READONLY-REPORT-PAGING-CACHE-01` si FASE 9 confirma necesidad.

---

## FASE 8 — Assumption Ledger

### Hechos confirmados
- Hover y definition ya usan `SemanticQueryFacade`; completion, signature help, references, diagnostics, current object context, impact/rename y linked editing siguen usando `createDocumentQueryContext` o `resolveTargetEntityDetailed` directamente en rutas relevantes.
- DataWindow tiene un carril moderno (`dataWindowFastContext`, binding model, property paths, column access, serving adapters) y carril legacy (`dataWindowLegacySafeMode`) aún llamado por hover, definition y document symbols.
- `NegativeCache` no existe como módulo standalone; el contrato real pasa por `PresentationCache` y structured keys con `cacheClass: 'negative'`.
- Code metrics, technical debt, migration assistant, workspace check report y support bundle comparten diagnósticos, source origins, recomendaciones y métricas bajo distintos DTOs.
- Current Object Context, Object Explorer, Diagnostics Explainability, health dashboard, RuntimeSelfTest y AI/support bundles proyectan slices solapados de KB, diagnostics y runtime stats.
- `diagnosticsExtra.ts` contiene checks SD11/SD12/SD13 lexicales conservadores; parte de la política de ruido ya está superseded/absorbida por backlog documental y confidence contract.
- External/native metadata reconoce `external`, `RPCFUNC`, dll/pbx/unknown y aliases, pero el backlog ya marca PBNI, ABI, bitness, marshaling y `PBX_GetDescription` como límites no confirmados.
- `plugin_old` está documentado como referencia aislada y sin import runtime esperado, pero el naming `dataWindowLegacySafeMode` mantiene influencia legacy visible dentro del runtime moderno.

## Candidato: Providers con lógica semántica duplicada

- Qué es: consumers interactivos y read-only que resuelven targets mediante rutas distintas a la facade común.
- Dónde vive: `src/server/features/completion.ts`, `src/server/features/signatureHelp.ts`, `src/server/features/references.ts`, `src/server/features/diagnostics.ts`, `src/server/features/currentObjectContext.ts`, `src/server/handlers/featureHandlers.ts`.
- Valor para desarrollador: alto; son features centrales.
- Valor para IA: alto; alimentan explainability, safe edit, current context y bundles.
- Coste mantenimiento: alto por divergence de confidence/evidence/fallback.
- Riesgo: alto; dos consumers pueden resolver el mismo foco con owners o ambiguity distintos.
- Propuesta: fusionar.
- Motivo: no se eliminan providers; se fusiona la semántica bajo `SemanticQueryFacade`/`SemanticQueryResult` con excepciones explícitas.
- Backlog: absorber en `PB-SEMANTIC-P0-FACADE-CONVERGENCE-01` y FASE 10 `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`.

## Candidato: DataWindow legacy safe mode en runtime moderno

- Qué es: fallback legacy para hover/definition/symbols DataWindow junto al carril moderno de fast context y property paths.
- Dónde vive: `src/server/features/dataWindowLegacySafeMode.ts`, `src/server/features/dataWindowServingAdapters.ts`, `src/server/features/documentSymbols.ts`.
- Valor para desarrollador: medio; evita perder soporte básico `.srd`.
- Valor para IA: bajo-medio; aporta estructura simple pero poca evidencia semántica.
- Coste mantenimiento: medio-alto por coexistencia de dos modelos.
- Riesgo: medio-alto; el fallback puede sobreponerse al carril moderno sin el mismo envelope de confidence/evidence.
- Propuesta: degradar.
- Motivo: mantener como fallback de compatibilidad sólo mientras el carril moderno cubre símbolos/hover/definition; renombrar/encapsular para que no parezca owner semántico.
- Backlog: FASE 10 `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01` y `PB-ARCH-P2-FEATURE-SIMPLIFICATION-AND-DELETION-01`.

## Candidato: DataWindow/SQL heurístico demasiado visible

- Qué es: lineage SQL, dynamic string references, transaction binding y DataWindow SQL references expuestos en diagnostics, current context y reports.
- Dónde vive: `src/server/features/dataWindowSqlLineage.ts`, `src/server/features/embeddedSqlAnchors.ts`, `src/server/features/dynamicStringReferences.ts`, `src/server/features/diagnostics.ts`, `src/server/features/currentObjectContext.ts`.
- Valor para desarrollador: medio-alto cuando el patrón es literal/defendible.
- Valor para IA: medio; ayuda a análisis, pero es frágil si se lee como verdad fuerte.
- Coste mantenimiento: alto por dialectos SQL, strings dinámicos y transacciones runtime.
- Riesgo: alto; puede prometer binding o SQL semantics que no están confirmadas.
- Propuesta: report-only.
- Motivo: hot path sólo debe usar fast anchors seguros; lineage profundo y dynamic SQL deben ser advisory/report-only con confidence y reason code.
- Backlog: absorber en `PB-SEMANTIC-P1-SQL-TRANSACTION-ANCHORS-01`, `PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01` y FASE 10 `PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01`.

## Candidato: Reports read-only redundantes

- Qué es: code metrics, technical debt, migration assistant, workspace check y support bundle repiten diagnósticos, métricas, source origins y recomendaciones.
- Dónde vive: `src/server/features/powerBuilderCodeMetrics.ts`, `src/server/features/powerBuilderTechnicalDebtReport.ts`, `src/server/features/workspaceMigrationAssistant.ts`, `src/client/workspaceCheckReport.ts`, `src/client/support/supportBundle.ts`.
- Valor para desarrollador: medio; útiles en auditoría y soporte.
- Valor para IA: alto; son contexto estructurado.
- Coste mantenimiento: medio-alto por DTOs y markdown builders paralelos.
- Riesgo: medio; recomendaciones inconsistentes o budgets distintos para el mismo hecho.
- Propuesta: fusionar.
- Motivo: conservar surfaces públicas si son necesarias, pero mover datos comunes a report projections/page receipts compartidos.
- Backlog: absorber en `PB-RUNTIME-P1-READONLY-SURFACES-GATES-01` y FASE 10 `PB-ARCH-P1-READONLY-SURFACES-PROJECTIONS-01`.

## Candidato: Superficies AI/UI solapadas

- Qué es: Object Explorer, Current Object Context, Diagnostics Explainability, health dashboard, RuntimeSelfTest y AI/support bundles presentan slices cercanos de KB/diagnostics/runtime.
- Dónde vive: `src/client/objectExplorerModel.ts`, `src/client/currentObjectContextPanelModel.ts`, `src/client/diagnosticsExplainabilityPanelModel.ts`, `src/client/runtimeSelfTest.ts`, `src/client/projectHealthDashboard.ts`, `src/client/aiTaskContextBundle.ts`.
- Valor para desarrollador: medio-alto; cada surface responde a un flujo distinto.
- Valor para IA: alto para bundles y explainability; bajo-medio para paneles visuales duplicados.
- Coste mantenimiento: alto si cada una define su propia verdad/resumen.
- Riesgo: medio-alto; UI y AI pueden divergir en confidence, truncation y estado.
- Propuesta: fusionar.
- Motivo: no borrar vistas útiles; unificar contract/read-only projections, budgets y evidence schema.
- Backlog: absorber en `PB-RUNTIME-P1-READONLY-SURFACES-GATES-01`, `PB-ARCH-P1-READONLY-SURFACES-PROJECTIONS-01` y posible `PB-ARCH-P1-AI-BUNDLE-EVIDENCE-SCHEMA-01`.

## Candidato: Caches redundantes o mal nombradas

- Qué es: `DocumentCache`, `ServingCache`, `HotContextCache`, `PresentationCache`/negative y persistence cache pueden parecer stores de verdad paralelos.
- Dónde vive: `src/server/knowledge/DocumentCache.ts`, `src/server/knowledge/ServingCache.ts`, `src/server/knowledge/HotContextCache.ts`, `src/server/serving/presentationCache.ts`, `src/server/cache/**`.
- Valor para desarrollador: alto; mantienen el editor rápido.
- Valor para IA: medio; aceleran projections pero no son contexto por sí mismas.
- Coste mantenimiento: medio por invalidación cruzada.
- Riesgo: medio; stale payloads si una cache se trata como verdad.
- Propuesta: mantener.
- Motivo: las caches aportan valor claro; la simplificación es contractual: `NegativeCache` como clase conceptual de `PresentationCache`, ServingCache structured keys y un coordinador de invalidación.
- Backlog: FASE 10 `PB-ARCH-P1-CACHE-SEMANTIC-EPOCH-CONTRACT-01` y `PB-ARCH-P1-CROSS-CACHE-INVALIDATION-COORDINATOR-01`.

## Candidato: Diagnostics de baja acción

- Qué es: diagnósticos lexicales y contextuales conservadores que pueden añadir ruido en Problems.
- Dónde vive: `src/server/features/diagnosticsExtra.ts`, `src/server/features/diagnostics.ts`, `docs/backlog.md` item superseded de severity noise.
- Valor para desarrollador: bajo-medio; hints útiles pero no bloqueantes.
- Valor para IA: bajo; suelen aportar poco a razonamiento semántico profundo.
- Coste mantenimiento: bajo.
- Riesgo: bajo-medio; ruido visual o confianza inflada.
- Propuesta: degradar.
- Motivo: mantener como hint/advisory con severity policy, no como problema central; no reabrir trabajo ya superseded salvo contrato cross-surface.
- Backlog: absorber en `PB-SEMANTIC-P1-CONFIDENCE-CONTRACT-01`; no crear ítem duplicado salvo FASE 10 si falta acceptance de diagnostics presentation.

## Candidato: Metadata nativa que sobrepromete

- Qué es: clasificación external/RPCFUNC/dll/pbx y aliases sin garantía ABI/PBNI/marshaling completa.
- Dónde vive: `src/server/parsing/externalFunctions.ts`, `src/server/analysis/documentAnalysis.ts`, `src/server/knowledge/types.ts`, `src/server/knowledge/resolution/semanticQueryService.ts`, docs técnicas.
- Valor para desarrollador: medio-alto para riesgo e inventario.
- Valor para IA: medio; útil para migración y soporte.
- Coste mantenimiento: medio por documentación oficial y variantes runtime.
- Riesgo: medio-alto; puede aparentar soporte nativo profundo.
- Propuesta: degradar.
- Motivo: conservar metadata mínima como `ExternalNativeSubmodel`, pero marcar ABI/PBNI/bitness como unsupported o needs official confirmation.
- Backlog 2026-05: `PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01` queda superseded por `PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01`; la trazabilidad histórica se mantiene en backlog/spec, no como owner ejecutable independiente.

## Candidato: Influencia legacy no suficientemente aislada en nombres/runtime

- Qué es: `plugin_old` está aislado como referencia, pero quedan conceptos legacy nombrados en runtime moderno y riesgo de port por inercia.
- Dónde vive: `plugin_old/**`, `src/server/features/dataWindowLegacySafeMode.ts`, `docs/legacy-isolation.md`, `docs/technical-debt-inventory.md`.
- Valor para desarrollador: bajo como runtime; medio como evidencia histórica.
- Valor para IA: bajo; puede confundir fuente actual con referencia.
- Coste mantenimiento: medio por ruido de búsqueda y review.
- Riesgo: medio; patrones legacy pueden colarse sin owner moderno.
- Propuesta: eliminar.
- Motivo: no eliminar necesariamente la carpeta de evidencia sin plan, pero sí eliminar dependencias conceptuales/runtime no justificadas y exigir ADR/backlog para cada extracción.
- Backlog: FASE 10 `PB-ARCH-P2-FEATURE-SIMPLIFICATION-AND-DELETION-01`; coordinar con `docs/legacy-isolation.md` y architecture import tests.

## Candidato: Duplicación documental y owners de estado

- Qué es: arquitectura, status, backlog, current focus, done-log, technical debt y target pueden repetir estado, alcance o claims.
- Dónde vive: `docs/architecture.md`, `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/done-log.md`, `docs/technical-debt-inventory.md`, este ledger.
- Valor para desarrollador: alto cuando hay owner claro.
- Valor para IA: alto para orientación, pero negativo si hay drift.
- Coste mantenimiento: alto si se duplican facts.
- Riesgo: alto; backlog ya contiene un item P0 de doc alignment por drift de estado.
- Propuesta: fusionar.
- Motivo: cada fact debe tener un owner; este target debe describir contrato futuro, no estado real ni backlog detallado.
- Backlog: absorber en `PB-AUDIT-P0-DOC-ALIGNMENT-01`; FASE 11 debe actualizar docs owner sin duplicar.

### Decisiones tomadas
- No proponer eliminación de capacidades core de hover/completion/signature/definition/references/diagnostics; el valor es alto y la corrección es convergencia de contrato.
- No proponer eliminación de caches; el problema es invalidación/ownership, no existencia.
- Degradar DataWindow/SQL/Transaction heurístico a advisory/report-only salvo slices seguros con evidence.
- Tratar `NegativeCache` y `ReadOnlyReportCache` como contratos/proyecciones, no nuevos stores obligatorios.
- Reusar backlog existente cuando ya cubre el candidato, para evitar duplicación documental.

### Riesgos
- Riesgo de podar UI útil antes de medir uso real; FASE 9 debe convertir fusión en etapas reversibles.
- Riesgo de ocultar demasiado DataWindow/SQL y perder valor práctico; la mitigación es whitelist defendible y report-only rico.
- Riesgo de crear backlog duplicado en FASE 10; hay que absorber en items existentes cuando el objetivo ya está cubierto.
- Riesgo de sobrecorregir legacy eliminando evidencia útil; la carpeta `plugin_old` sigue referencia-only hasta decisión explícita.

### Evidencia consultada
- Exploración read-only por subagente sobre FASE 8.
- Greps de `SemanticQueryFacade`, `createDocumentQueryContext`, `resolveTargetEntityDetailed`, reports, `plugin_old`, diagnostics y native metadata.
- `src/server/features/dataWindowServingAdapters.ts` y `src/server/features/documentSymbols.ts`.
- `src/server/features/diagnosticsExtra.ts`.
- `src/server/features/powerBuilderCodeMetrics.ts`, `powerBuilderTechnicalDebtReport.ts`, `workspaceMigrationAssistant.ts`.
- `docs/backlog.md`, especialmente facade convergence, confidence contract, DataWindow, SQL, native metadata, read-only gates y doc alignment.

### Validación pendiente
- Ejecutar `get_errors` sobre el ledger tras el patch.
- FASE 9 debe convertir estos candidatos en etapas no big-bang.
- FASE 10 debe crear sólo backlog arquitectónico no absorbido por items existentes.
- FASE 11 debe actualizar docs owner sin copiar esta lista completa a múltiples archivos.

### Impacto en diseño objetivo
- La arquitectura objetivo gana una política de simplificación: fusionar semántica, degradar heurísticas, mantener caches como proyecciones y eliminar influencia legacy no justificada.
- Se aclara que el diseño final no busca más features, sino menos fuentes de verdad y menos surfaces redundantes.

### Impacto en backlog
- Absorber: `PB-SEMANTIC-P0-FACADE-CONVERGENCE-01`, `PB-SEMANTIC-P1-CONFIDENCE-CONTRACT-01`, `PB-SEMANTIC-P1-DATAWINDOW-ADVANCED-SLICE-01`, `PB-SEMANTIC-P1-SQL-TRANSACTION-ANCHORS-01`, `PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01`, `PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01`, `PB-RUNTIME-P1-READONLY-SURFACES-GATES-01`, `PB-AUDIT-P0-DOC-ALIGNMENT-01`.
- Candidatos FASE 10 nuevos sólo si no quedan absorbidos: `PB-ARCH-P2-FEATURE-SIMPLIFICATION-AND-DELETION-01`, `PB-ARCH-P1-AI-BUNDLE-EVIDENCE-SCHEMA-01` y un item menor para retirement de `dataWindowLegacySafeMode` si la etapa incremental lo exige.

---

## FASE 9 — Assumption Ledger

### Hechos confirmados
- El prompt exige plan incremental sin big-bang con nueve etapas específicas.
- `package.json` expone gates relevantes: `test:architecture:rapid`, `test:architecture:metrics`, `test:docs:drift`, `test:performance:gate`, `build:test`, `compile` y `release:verify`.
- El backlog existente ya cubre varios candidatos de FASE 8: facade convergence, confidence contract, DataWindow, SQL/transaction anchors, dynamic SQL, native metadata, read-only gates y doc alignment.
- Las fases 4-8 ya dejaron target, snapshot contract, query result, caches/invalidation y simplification candidates; FASE 9 debe ordenar ejecución, no crear implementación.

### Suposiciones utilizadas
- Owner: arquitectura. Suposición: el plan debe vivir en `docs/semantic-design-target.md` porque define camino hacia el target, mientras el ledger conserva riesgos/supuestos. Riesgo: bajo. Validación prevista: FASE 11 doc owner review.
- Owner: backlog. Suposición: FASE 10 debe absorber items existentes y sólo crear IDs nuevos para huecos arquitectónicos. Riesgo: medio por duplicación. Validación prevista: comparar con `docs/backlog.md` antes de editarlo.
- Owner: performance. Suposición: cada etapa puede mantener hot paths verdes si migra un consumer/submodelo por vez y conserva fallback. Riesgo: medio-alto. Validación prevista: performance gate y cross-surface tests.
- Owner: public API/read-only. Suposición: read-only surface consolidation puede hacerse sin romper API pública usando projections/adapters primero y cleanup al final. Riesgo: medio. Validación prevista: public API contract tests.

### Dudas abiertas
- Si la Etapa 2 debe introducir un tipo TypeScript `SemanticQueryResult` o empezar como adapter documental alrededor de `ResolvedTargetInfo`.
- Si la Etapa 7 debe añadir un coordinador de invalidación explícito o formalizar eventos dentro de runtime/controllers existentes.
- Si `dataWindowLegacySafeMode` debe retirarse en Etapa 8 o esperar a Etapa 9 después de parity tests.
- Cuánto del plan debe reflejarse en `docs/roadmap.md` durante FASE 11 frente a quedar en backlog FASE 10.

### Decisiones tomadas
- Añadir en `docs/semantic-design-target.md` un plan de nueve etapas con objetivo, archivos afectados, riesgos, tests, docs, criterio de salida y backlog items.
- Mantener Etapa 1 documental/conformance antes de cualquier cambio de código.
- Priorizar `SemanticQuery` y consumers interactivos antes de reports/caches/submodelos profundos.
- Dejar cleanup/deletion como Etapa 9, después de parity y tests, no antes.
- Marcar DataWindow/SQL/native como Etapa 8 para evitar que heurísticas profundas bloqueen la convergencia de providers core.

### Riesgos
- Riesgo de que FASE 10 genere backlog excesivo si cada etapa se descompone sin absorber items existentes.
- Riesgo de retrasar cleanup demasiado y prolongar duplicidad; se mitiga con criterios de salida por etapa.
- Riesgo de migrar completion/signature antes de estabilizar query payload; Etapa 2 debe ser salida real, no sólo docs.
- Riesgo de que read-only surfaces queden para después y sigan duplicando confidence; Etapa 6 exige public API/panel tests.

### Evidencia consultada
- `.github/prompts/audit-architecture-future.prompt.md` FASE 9.
- `package.json` scripts de validación.
- `docs/backlog.md` items existentes sobre facade, confidence, DataWindow, SQL, native metadata, read-only gates y doc alignment.
- FASES 4-8 de `docs/semantic-design-target.md` y de este ledger.

### Validación pendiente
- Ejecutar `get_errors` sobre target y ledger tras el patch.
- FASE 10 debe transformar el plan en backlog arquitectónico final con absorciones explícitas.
- FASE 11 debe actualizar owner docs sin copiar el plan entero donde no corresponde.

### Impacto en diseño objetivo
- El target ahora contiene camino incremental no big-bang desde diseño/conformance hasta cleanup.
- Las etapas establecen que performance, docs y tests son gates por slice, no una validación final tardía.

### Impacto en backlog
- FASE 10 debe priorizar P0: target/conformance/source-of-truth/query contract.
- FASE 10 debe priorizar P1: completion/signature, references, cache coordinator, read-only projections, DataWindow submodel.
- FASE 10 debe dejar P2 para SQL advanced, native metadata, cleanup/deletion y legacy retirement cuando no exista item previo.

---

## FASE 10 — Assumption Ledger

### Hechos confirmados
- `docs/backlog.md` es el owner natural del backlog ejecutable.
- El prompt exige backlog arquitectónico final con campos específicos por item.
- El backlog ya contiene items previos que cubren partes del plan: facade convergence, confidence, DataWindow, SQL, dynamic SQL, native metadata, build/source metadata, read-only gates y doc alignment.
- La FASE 9 definió nueve etapas; FASE 10 debe convertirlas en items ejecutables sin big-bang.

### Suposiciones utilizadas
- Owner: backlog. Suposición: añadir sección `4.2` mantiene el backlog final junto al backlog derivado existente sin reordenar historial. Riesgo: bajo-medio. Validación prevista: FASE 11 doc alignment.
- Owner: architecture. Suposición: los IDs `PB-ARCH-*` pueden coexistir con `PB-SEMANTIC-*` si declaran absorción/dependencia y no sustituyen items vivos automáticamente. Riesgo: medio. Validación prevista: revisión del backlog antes de ejecución.
- Owner: planning. Suposición: `PB-ARCH-P1-SEMANTIC-TOKENS-EVIDENCE-CONTRACT-01` es necesario aunque no aparezca en la lista sugerida, porque FASE 9 lo exige y el backlog existente lo cubre sólo parcialmente vía confidence contract. Riesgo: bajo.

### Dudas abiertas
- Si algunos `PB-ARCH-*` deben pasar a `Superseded` inmediatamente cuando se confirme absorción por `PB-SEMANTIC-*` existente.
- Si el backlog final debe convertirse después en specs numeradas bajo `specs/` o mantenerse como items padre hasta ejecución.
- Si semantic diff no-op publish merece ID independiente o queda dentro de cache epoch contract.

### Decisiones tomadas
- Añadir en `docs/backlog.md` la sección `4.2. Backlog arquitectónico final — Diseño semántico objetivo`.
- Crear items P0/P1/P2 siguiendo el formato requerido por el prompt.
- Incluir `PB-ARCH-P1-SEMANTIC-TOKENS-EVIDENCE-CONTRACT-01` como item adicional necesario por FASE 9.
- Absorber semantic diff/no-op publish dentro de `PB-ARCH-P1-CACHE-SEMANTIC-EPOCH-CONTRACT-01` para no fragmentar backlog.
- Absorber AI bundle evidence schema dentro de `PB-ARCH-P1-READONLY-SURFACES-PROJECTIONS-01` salvo que FASE 11/12 detecte necesidad de item propio.

### Riesgos
- Riesgo de backlog voluminoso; mitigación: cada item tiene priority, acceptance criteria y plan incremental.
- Riesgo de duplicación con backlog existente; mitigación: notas de absorción y ejecución posterior a auditoría.
- Riesgo de que items P2 de cleanup se ejecuten antes de parity; acceptance criteria exige cierre de etapas previas.

### Evidencia consultada
- FASE 10 del prompt.
- `docs/backlog.md` sección inicial y final.
- `docs/semantic-design-target.md` plan incremental FASE 9.
- `docs/semantic-design-assumptions.md` FASES 8-9.

### Validación pendiente
- Ejecutar `get_errors` sobre `docs/backlog.md` y el ledger.
- FASE 11 debe alinear current-focus/roadmap/status sin copiar todo el backlog.
- FASE 12 debe revisar que los IDs requeridos por prompt están presentes o intencionalmente absorbidos.

### Impacto en diseño objetivo
- El diseño objetivo ya tiene backlog ejecutable para llegar al target sin implementación inmediata.
- La eliminación de duplicados/legacy queda explícitamente condicionada por parity tests.

### Impacto en backlog
- `docs/backlog.md` ahora contiene sección final PB-ARCH con P0/P1/P2 y acceptance criteria.
- Items existentes siguen siendo válidos; la sección nueva actúa como plan arquitectónico padre y ruta de absorción.

---

## FASE 11 — Assumption Ledger

### Hechos confirmados
- El prompt exige actualizar `docs/semantic-design-target.md`, `docs/semantic-design-assumptions.md`, `docs/architecture.md`, `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/performance-budget.md`, `docs/testing.md`, `docs/troubleshooting.md`, `backlog.md`, `current-focus.md` y `roadmap.md`.
- `docs/semantic-design-target.md`, `docs/semantic-design-assumptions.md` y `docs/backlog.md` ya fueron actualizados en FASES 4-10.
- `docs/done-log.md` no debe actualizarse porque no hay cierre real de implementación.

### Suposiciones utilizadas
- Owner: docs. Suposición: FASE 11 debe añadir enlaces y reglas de ownership, no duplicar el target ni copiar la sección PB-ARCH completa. Riesgo: bajo. Validación prevista: docs drift y review final.
- Owner: roadmap/current-focus. Suposición: estos docs deben reconocer el target semántico y PB-ARCH sin convertir el roadmap en backlog ni el focus en lista completa de tareas. Riesgo: medio. Validación prevista: FASE 12.
- Owner: performance/testing/troubleshooting. Suposición: basta con extender reglas/gates para epoch/fingerprint/sourceOrigin/read-only projections y no repetir todos los caches/events. Riesgo: bajo.

### Dudas abiertas
- Si `docs/ai-context/powerbuilder-plugin-context.md` debe enlazar el target semántico en una sesión posterior; no estaba en la lista obligatoria de FASE 11.
- Si `docs/architecture.md` debe incorporar una sección propia de `PublishedSemanticSnapshot` o seguir enlazando al target para evitar duplicación.

### Decisiones tomadas
- Enlazar `docs/semantic-design-target.md` desde arquitectura, status, implementation map, performance, testing, troubleshooting, focus y roadmap.
- Cambiar el status de Cache Layer a parcial para reflejar que el runtime base está estabilizado, pero el target futuro requiere coordinator/epoch contract.
- Añadir en performance/testing/troubleshooting reglas de epoch/fingerprint/sourceOrigin/locale, read-only projections, caps y receipts.
- Actualizar current-focus para incluir PB-ARCH P0 target/conformance como parte de la cadena activa, sin marcar implementación como cerrada.
- No tocar `docs/done-log.md`.

### Riesgos
- Riesgo de que Cache Layer parezca regresada; la nota distingue estabilidad actual frente a trabajo futuro PB-ARCH.
- Riesgo de que current-focus crezca demasiado; se añadió sólo la cadena P0 mínima.
- Riesgo de duplicación entre architecture y target; se usaron enlaces, no contenido repetido.

### Evidencia consultada
- `docs/architecture.md`.
- `docs/architecture-status.md`.
- `docs/architecture-implementation-map.md`.
- `docs/performance-budget.md`.
- `docs/testing.md`.
- `docs/troubleshooting.md`.
- `docs/current-focus.md`.
- `docs/roadmap.md`.
- Skill `docs-governance`.

### Validación pendiente
- Ejecutar `get_errors` sobre todos los docs tocados en FASE 11.
- FASE 12 debe revisar estrictamente fases, required files, backlog IDs y ausencia de implementación.

### Impacto en diseño objetivo
- El target semántico queda integrado como contrato futuro enlazado por los owner docs.
- Estado real, ejecución y roadmap quedan separados: status para adopción actual, backlog para trabajo, roadmap para dirección macro.

### Impacto en backlog
- No se agregaron nuevos items en FASE 11; se enlazó la sección PB-ARCH creada en FASE 10 desde focus/roadmap/status.

---

## FASE 12 — Assumption Ledger

### Hechos confirmados
- La fuente única de verdad queda definida en `docs/semantic-design-target.md`: `KnowledgeBase.publishedState` es la implementación actual y `PublishedSemanticSnapshot` es el contrato objetivo.
- El flujo objetivo discovery/indexing produce `DocumentFacts`, enrichment y snapshot publicado antes de servir `SemanticQueryFacade`, caches y consumers.
- Las caches quedan documentadas como proyecciones/aceleradores, excepto `KnowledgeBase snapshot store`, que se declara verdad publicada.
- Los consumers LSP/read-only quedan documentados como proyecciones de `SemanticQueryResult`, snapshots y runtime stats, con excepciones futuras obligadas a owner/reason/evidence.
- Confidence, evidence y reason codes quedan tratados como contrato común en `SemanticQueryResult`, `ConfidenceEvidenceModel`, diagnostics y read-only projections.
- La estrategia 5000+ archivos queda explícita: discovery incremental, indexación priorizada, queries acotadas, no full scans en hot paths, caps, paginación, receipts y backpressure.
- FASE 8 propuso simplificaciones, fusiones, degradaciones, report-only y eliminaciones; FASE 9 las ordenó en etapas y FASE 10 las convirtió en backlog ejecutable.
- `docs/backlog.md` contiene la sección `4.2. Backlog arquitectónico final — Diseño semántico objetivo` con items P0/P1/P2, acceptance criteria, docs, tests y validación.
- Los owner docs requeridos por FASE 11 enlazan el target sin duplicar el diseño completo.
- El ledger contiene secciones completas FASE 0 a FASE 12.
- `docs/done-log.md` no se actualizó porque no hubo cierre real de implementación.

### Suposiciones utilizadas
- Owner: arquitectura/documentación. Suposición: la revisión final puede cerrar el plan maestro como diseño y backlog, no como implementación runtime. Riesgo: bajo si el resultado final distingue claramente estado futuro y estado actual. Validación prevista: final output de FASE 12 y revisión de `docs/architecture-status.md`.
- Owner: backlog. Suposición: las dudas que no tienen ID propio quedan cubiertas por items absorbentes: identidad/confidence en source-of-truth/query/conformance, no-op publish en cache epoch, AI bundle evidence en read-only projections, SQL/transaction en SQL anchors submodel y legacy cleanup en simplification/deletion. Riesgo: medio si ejecución futura pierde esa trazabilidad. Validación prevista: revisar acceptance criteria de cada item antes de abrir specs.
- Owner: performance/testing. Suposición: `get_errors` documental es la validación inmediata correcta para esta fase de diseño; los scripts npm quedan como gates de ejecución posterior indicados en backlog/testing. Riesgo: bajo, porque no se modificó código productivo. Validación prevista: ejecutar gates cuando se implemente cada item PB-ARCH.

### Dudas abiertas
- No quedan dudas arquitectónicas fuera del backlog final; las decisiones implementables se trasladan a los items PB-ARCH o quedan absorbidas por backlog PB-SEMANTIC existente.
- Queda para ejecución decidir si `SemanticQueryResult` nace como tipo TypeScript único o como envelope incremental alrededor de `ResolvedTargetInfo`.
- Queda para ejecución decidir si el coordinador cross-cache será módulo dedicado o contrato event-driven sobre controllers/caches existentes.

### Decisiones tomadas
- Cerrar FASE 12 sin volver a fases previas porque los trece checks del prompt tienen evidencia documental y backlog asociado.
- Mantener `docs/semantic-design-target.md` como documento claro de estructura objetivo exacta.
- Mantener `docs/backlog.md` sección 4.2 como backlog ejecutable posterior a la auditoría.
- No añadir más items ni tocar `docs/done-log.md` en FASE 12.
- Reportar validación documental final y comandos/resultados exactos en la salida final obligatoria.

### Riesgos
- Riesgo residual de que ejecución futura implemente wrappers costosos o clones profundos; queda mitigado por los criterios de performance y acceptance criteria PB-ARCH.
- Riesgo residual de que consumers mantengan rutas directas demasiado tiempo; queda mitigado por `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01` y los items de convergence.
- Riesgo residual de que read-only/AI surfaces crezcan sin caps; queda mitigado por `PB-ARCH-P1-READONLY-SURFACES-PROJECTIONS-01` y los gates de testing/performance.
- Riesgo residual de que DataWindow/SQL/transaction advisory se presente como certeza runtime; queda mitigado por submodelos advisory y confidence/evidence común.

### Evidencia consultada
- `.github/prompts/audit-architecture-future.prompt.md`, FASE 12 y salida final obligatoria.
- `docs/semantic-design-target.md` secciones de principios, flujo, `PublishedSemanticSnapshot`, `SemanticQueryResult`, caches/invalidation, consumers y plan incremental.
- `docs/semantic-design-assumptions.md` FASES 0-11.
- `docs/backlog.md` sección 4.2 y backlog previo PB-SEMANTIC absorbente.
- `docs/architecture.md`, `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/performance-budget.md`, `docs/testing.md`, `docs/troubleshooting.md`, `docs/current-focus.md` y `docs/roadmap.md`.
- Revisión de cambios git y búsqueda de referencias a `done-log.md`.

### Validación pendiente
- Ejecutar `get_errors` sobre todos los documentos tocados tras añadir esta sección.
- Ejecutar gates npm específicos cuando se implemente código para cada item PB-ARCH; esta auditoría no modifica runtime.

### Impacto en diseño objetivo
- La estructura objetivo queda cerrada como contrato documental: inputs, discovery, ProjectModel, DocumentFacts, enrichment, snapshot publicado, query facade, caches/projections y consumers.
- La fase final no cambia el diseño; sólo confirma que cumple las restricciones del prompt.

### Impacto en backlog
- No se agregan items nuevos en FASE 12.
- El backlog final queda accionable y cubre dudas residuales por items explícitos o absorbentes.