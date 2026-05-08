# Semantic Design Target — PowerBuilder VS Code Plugin

## Propósito

Este documento es el owner del diseño objetivo semántico futuro. Complementa a `docs/architecture.md`, que sigue siendo la arquitectura normativa general, a `docs/architecture-status.md`, que sigue describiendo el estado real, a `docs/architecture-implementation-map.md`, que sigue mapeando rutas reales de implementación, a `docs/backlog.md`, que sigue siendo el owner del trabajo accionable, y a `docs/semantic-design-assumptions.md`, que conserva razonamiento, supuestos, dudas y decisiones fase por fase.

No reemplaza el backlog ni el mapa de implementación.

El objetivo es fijar cómo debe fluir la semántica para que el plugin descubra e indexe rápido, publique una verdad semántica versionada, sirva providers LSP sin full scans y exponga superficies read-only útiles para desarrolladores e IA.

## Estado de implementación

Este documento describe el **diseño objetivo futuro**. No implica que todos los componentes existan hoy como módulos completos.

Estado actual resumido:

- `KnowledgeBase.publishedState`: implementado y es la verdad semántica actual más fuerte.
- `PublishedSemanticSnapshot`: contrato objetivo sobre `KnowledgeBase.publishedState`; no debe implementarse como store paralelo.
- `SemanticQueryFacade`: implementado parcialmente; hover y definition están más alineados que completion, signature help, references, diagnostics y semantic tokens.
- `SemanticQueryResult`: envelope activo en la facade para policy efectiva, source metadata, degraded base y evidence/reasons; la convergencia total de consumers y stale signaling de serving sigue siendo incremental.
- `DocumentCache`, `ServingCache`, `HotContextCache` y `PresentationCache`: implementados como caches/aceleradores.
- `NegativeCache`: concepto implementado mediante `PresentationCache` y structured keys con `cacheClass: negative`; no es módulo independiente actual.
- `ReadOnlyReportCache`: contrato objetivo para projections/report pages; no existe necesariamente como módulo standalone. El nombre recomendado para implementación futura es `ReadOnlyProjectionCache`.
- `DataWindowSubmodel`: parcialmente implementado mediante DataWindow model, fast context, binding model, serving adapters y diagnostics.
- `SqlAnchorSubmodel`: parcialmente implementado mediante SQL regions, embedded SQL anchors, dynamic string references y reportes.
- `TransactionSubmodel`: parcialmente implementado/advisory mediante diagnostics, SQL anchors e invocation context.
- `ExternalNativeSubmodel`: parcialmente implementado mediante parsing/classification de external functions/RPCFUNC/native metadata.
- `SemanticEnrichment`: etapa conceptual de enriquecimiento semántico; no implica crear una clase o carpeta nueva si los módulos actuales ya cubren ese rol.

## Principios de diseño semántico

- Una sola verdad semántica publicada: `KnowledgeBase.publishedState` como implementación actual y `PublishedSemanticSnapshot` como contrato objetivo.
- No store paralelo: ningún nuevo módulo debe crear otra base semántica independiente de `KnowledgeBase.publishedState`.
- Caches como proyecciones: ninguna cache decide verdad ni sobrevive a cambios de epoch/fingerprint sin validación.
- Consumers como lectores/proyectores: providers LSP, panels, reports y bundles no reimplementan resolución global.
- Evidence común: toda resolución semántica, advisory o degradada debe transportar confidence, evidence y reason codes compatibles.
- Escala primero: workspaces de 5000+ archivos se sirven con discovery incremental, indexación priorizada, snapshots versionados, caps y paginación.
- PowerBuilder explícito: projects, targets, libraries, objects, inheritance, functions/events, DataWindow, SQL y transactions son dominios nombrados, no heurísticas sueltas.
- No big-bang: la convergencia debe ejecutarse por etapas, con tests y fallback controlado.
- No full scans en hot paths: ninguna feature interactiva debe leer o recorrer el workspace completo por request.

## Regla anti-store paralelo

No se debe crear una nueva base semántica paralela a `KnowledgeBase.publishedState`.

Todo nuevo contrato, módulo o capa debe ser una de estas cosas:

- vista readonly;
- adapter;
- projection;
- submodelo derivado;
- cache invalidable;
- report paginado;
- DTO público;
- test/conformance layer.

Si una spec propone crear un nuevo store semántico, debe justificar explícitamente:

- por qué no puede vivir como submodelo del snapshot;
- por qué no puede ser una projection;
- cómo se invalida;
- cómo evita drift con `KnowledgeBase`;
- cómo escala a 5000+ archivos;
- qué tests impiden que se convierta en verdad paralela.

## Relación PB-ARCH / PB-SEMANTIC

Los ítems `PB-ARCH-*` son contratos de arquitectura objetivo, convergencia y ownership.

Los ítems `PB-SEMANTIC-*` suelen representar implementación funcional o hardening semántico concreto.

Antes de crear una spec de implementación, el agente debe decidir:

- ejecutar el ítem `PB-ARCH-*` como contrato/diseño/conformance;
- ejecutar el ítem `PB-SEMANTIC-*` como implementación funcional;
- marcar uno como `Superseded` por el otro;
- o crear una sub-spec que enlace ambos.

Regla:

```txt
Un PB-ARCH no debe duplicar un PB-SEMANTIC.
Un PB-SEMANTIC no debe ignorar el contrato objetivo definido por PB-ARCH.
```

Ejemplos:

- `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01` gobierna el contrato común.
- `PB-SEMANTIC-P0-FACADE-CONVERGENCE-01` implementa o endurece la adopción funcional de ese contrato.
- `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01` gobierna el submodelo.
- `PB-SEMANTIC-P1-DATAWINDOW-ADVANCED-SLICE-01` implementa slices concretos de DataWindow.

## Flujo definitivo

```text
Workspace inputs
  -> Discovery
  -> ProjectModel / LibrarySearchPath
  -> DocumentFacts
  -> SemanticEnrichment
  -> PublishedSemanticSnapshot
  -> SemanticQueryFacade
  -> Caches / projections
  -> LSP providers / read-only surfaces
```

Regla de dirección: cada flecha va de input a derivación o de verdad publicada a proyección. Ninguna capa posterior puede escribir una verdad paralela hacia atrás.

## Jerarquía de verdad

| Nivel | Qué contiene | Puede resolver disputas | Ejemplos |
| --- | --- | ---: | --- |
| Input | archivos, settings, workspace folders, markers, documentos abiertos | Sí, como entrada versionada | `.srw`, `.sru`, `.srd`, `.pbw`, `.pbt`, cambios LSP |
| Modelo de workspace | discovery, project routing, source origin, library order | Sí, para pertenencia/routing | `WorkspaceState`, `UnifiedProjectModel` |
| Facts documentales | snapshot parseado, scopes, symbols del documento | Sí, para el documento/version | `SemanticDocumentSnapshot`, `Entity`, scopes |
| Enrichment derivado | identidad, owners, inheritance, callable/type resolution, submodelos | Sí, si publica en snapshot/KB | graph, callable model, DataWindow submodel |
| Snapshot publicado | vista versionada/atómica de la semántica vigente | Sí, verdad semántica | `KnowledgeBase.publishedState`, `semanticEpoch` |
| Query result | respuesta semántica acotada para un consumer/contexto | No, proyecta snapshot | `SemanticQueryResult`, `ResolvedTargetInfo` |
| Presentation/cache | DTO LSP, view model, report, negative miss | No | hover markdown, completion item, Object Explorer node |

## Estado actual vs objetivo

| Surface / capa | Estado actual | Objetivo |
| --- | --- | --- |
| Discovery | Fuerte, incremental, con readiness y warm resume | Mantener, reforzar para 5000+ |
| WorkspaceIndexer | Fuerte, priorizado y cooperativo | Mantener, añadir conformance/perf gates masivos |
| KnowledgeBase | Verdad publicada actual | Formalizar como implementación de `PublishedSemanticSnapshot` |
| SemanticQueryFacade | Parcial | Frontera común para resolución semántica |
| Hover | Mayormente alineado | Projection pura del contrato |
| Definition | Mayormente alineado | Projection pura del contrato |
| Completion | Parcial/híbrido | Projection de `SemanticQueryResult` |
| Signature Help | Parcial/híbrido | Projection de callable result común |
| References | Débil/híbrido | Identity-based con pools acotados |
| Semantic Tokens | Parcial; riesgo de confidence hardcoded | Tokens visuales vs tokens resueltos con evidence |
| Diagnostics | Parcial; mezcla structural/semantic/advisory | Diagnostics con source/evidence/reason code común |
| Object Explorer | Projection read-only | Projection paginada/acotada del snapshot |
| Current Object Context | Projection/híbrido | Projection del snapshot/query + evidence |
| Diagnostics Explainability | Projection parcial | Explanation sobre diagnostics con evidence trace |
| AI bundle | Projection útil pero con riesgo de payload | Projection con caps, receipts, redaction y token budget |
| DataWindow | Slice fuerte pero no total | Submodelo advisory/safe slice |
| SQL/Transactions | Heurístico/advisory | Submodelo advisory con confidence |
| External/native | Clasificación útil | Metadata mínima, sin prometer ABI completo |
| Caches | Varias caches útiles | Projections/aceleradores con keys completas |

## Estrategia por escala

| Tamaño workspace | Estrategia |
| --- | --- |
| 100-800 archivos | Indexación completa rápida, caches pequeñas, reports casi completos con límites normales. |
| 800-2500 archivos | Prioridad a archivo/proyecto activo, batches cooperativos, ServingCache y HotContextCache activos, reports con caps visibles. |
| 2500-5000 archivos | Discovery incremental, warm resume agresivo, fan-out por dependencias, read-only surfaces paginadas, diagnostics degradables. |
| 5000+ archivos | Ningún provider interactivo escanea workspace completo; references/reports usan pools acotados, snapshots publicados, paginación/receipts y backpressure. |

---

## Componente objetivo: Workspace Inputs

- Responsabilidad: representar los cambios de entrada que pueden alterar la semántica: archivos, documentos abiertos, watchers, settings relevantes y eventos de workspace.
- Owner: server lifecycle/document/workspace handlers.
- Inputs: filesystem discovery, LSP text sync, watched file changes, settings snapshot, workspace folders.
- Outputs: eventos versionados para discovery, document analysis e invalidación.
- No debe hacer: parsear semántica global, resolver símbolos, publicar diagnostics finales.
- Depende de: VS Code/LSP sync, workspace roots, ignore policy.
- Lo consumen: Discovery, DocumentFacts, invalidation planner, scheduler.
- Cache: ninguna semántica; sólo estado de intake y debounce.
- Invalidación: por URI, document version, settings epoch y watcher event.
- Escalabilidad 5000+: sí, si los eventos se agrupan y no disparan rescans globales.
- Tests: lifecycle/document handler tests, watcher intake tests, architecture hot-path guards.
- Docs owner: `docs/architecture.md`, `docs/architecture-status.md`, este documento para flujo semántico.

## Componente objetivo: Discovery

- Responsabilidad: descubrir roots, archivos PowerBuilder, markers, source origins iniciales y topología mínima sin análisis semántico profundo.
- Owner: `src/server/workspace`.
- Inputs: Workspace Inputs, filesystem, ignore policy, markers `.pbw/.pbt/.pbsln/.pbproj/.pbl`.
- Outputs: discovery snapshot, source files, roots, topology candidates, source origin hints.
- No debe hacer: cargar DataWindows profundamente, resolver inheritance, construir query candidates globales.
- Depende de: workspace folders, file watcher intake, path normalization.
- Lo consumen: ProjectModel, WorkspaceIndexer, runtime stats, reports.
- Cache: estado de workspace/discovery y artifacts; no truth semántica.
- Invalidación: watcher incremental, refresh explícito, cambio de roots/settings.
- Escalabilidad 5000+: sí; debe mantener yielding, ignores y diffs incrementales.
- Tests: discovery/workspace tests, `test:performance:gate`, corpus local opcional.
- Docs owner: `docs/architecture.md`, `docs/performance-budget.md`, `docs/troubleshooting.md`.

## Componente objetivo: ProjectModel / LibrarySearchPath

- Responsabilidad: publicar pertenencia proyecto/target/library, orden de búsqueda y contexto de proyecto activo como input versionado de resolución.
- Owner: `UnifiedProjectModel` con `ProjectRegistry` como adaptador de compatibilidad mientras exista.
- Inputs: discovery snapshot, project routing, build/topology metadata, active URI.
- Outputs: project contexts, file-to-project, project-to-files, libraries ordered, source origin summary.
- No debe hacer: resolver símbolos por sí mismo, ordenar candidates sin devolver evidence de search path.
- Depende de: Discovery, topology, source origin.
- Lo consumen: WorkspaceIndexer, SemanticEnrichment, SemanticQueryFacade, dependency graph, manifests.
- Cache: modelo in-memory reconstruido por routing; adaptadores read-only.
- Invalidación: cambio en discovery/topology/build files/settings o library alias.
- Escalabilidad 5000+: sí/parcial; debe precomputar rutas y evitar recalcular por request.
- Tests: project routing tests, multi-root isolation, architecture rapid gate.
- Docs owner: `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, este documento para ownership semántico.

## Componente objetivo: DocumentFacts

- Responsabilidad: convertir texto de documento en snapshot tolerante a errores con symbols, scopes, masked text, readiness, fingerprint y facts mínimos.
- Owner: `src/server/analysis` y parser.
- Inputs: LSP document text, file content del indexer, source origin, document version.
- Outputs: `SemanticDocumentSnapshot`, `Entity` facts, scopes, dependencies, readiness.
- No debe hacer: mantener verdad global, resolver todos los ancestors, ejecutar reports DataWindow profundos.
- Depende de: parser, section machine, grammar, source origin.
- Lo consumen: KnowledgeBase, DocumentCache, SemanticEnrichment, diagnostics por documento.
- Cache: `DocumentCache` como acelerador por URI/fingerprint/version.
- Invalidación: document version/fingerprint, source origin changes, grammar/settings relevantes.
- Escalabilidad 5000+: sí/parcial; debe ser incremental/cooperativo y evitar clones completos en hot path.
- Tests: parser/analysis unit tests, diagnostic scheduler tests, hot path allocation budget.
- Docs owner: `docs/symbol-system.md`, `docs/testing.md`, este documento para rol en snapshot.

## Componente objetivo: SemanticEnrichment

> `SemanticEnrichment` es una etapa conceptual, no necesariamente una clase o módulo nuevo. Si los módulos actuales ya cubren este rol, deben mantenerse y formalizarse como parte de esta etapa en vez de crear una capa paralela.

- Responsabilidad: derivar identidad estable, owners, callable/type metadata, inheritance links, system catalog projections y submodelos domain-scoped antes de publicar.
- Owner: server/core semantic layer bajo `src/server/knowledge` y `src/server/features` para subdominios hasta migración.
- Inputs: DocumentFacts, ProjectModel, SystemCatalog, SourceOriginModel, cached prior snapshot cuando aplique.
- Outputs: enriched entities, callable/type/scope/inheritance metadata, DataWindow/SQL/Transaction/External/Framework advisory submodels.
- No debe hacer: bloquear providers interactivos, escanear todo el workspace por cada documento, crear DTOs de UI.
- Depende de: KnowledgeBase staging, SystemCatalog, InheritanceGraph, DataWindow parsers, SQL region parser.
- Lo consumen: PublishedSemanticSnapshot, SemanticQueryFacade, diagnostics batch, read-only projections.
- Cache: derived caches por epoch/fingerprint y graph version; no son autoridad independiente.
- Invalidación: document dependency fan-out, project/source origin changes, catalog version, semantic epoch.
- Escalabilidad 5000+: parcial; requiere prioridades, caps, background mode y degradación honesta.
- Tests: semantic golden matrix, catalog consistency, DataWindow tests, architecture/performance gates.
- Docs owner: este documento, `docs/symbol-system.md`, owner docs de DataWindow/catalog.

## Componente objetivo: PublishedSemanticSnapshot

- Responsabilidad: exponer una vista atómica, inmutable para lectores y versionada de la semántica publicada.
- Owner: `KnowledgeBase` como implementación; contrato objetivo definido aquí y ampliado en FASE 5.
- Inputs: staged KnowledgeBase updates, DocumentFacts, SemanticEnrichment, ProjectModel references, SystemCatalog version metadata.
- Outputs: symbols, scopes, document snapshots, indexes, dependencies, semantic epoch/version, submodel references.
- No debe hacer: formatear LSP/UI, conservar respuestas de cache, aceptar writes desde providers/read-only surfaces.
- Depende de: WorkspaceIndexer, KnowledgeBase batch publish, source origin policy.
- Lo consumen: SemanticQueryFacade, InheritanceGraph, providers, reports, cache key builders.
- Cache: no es cache; es verdad publicada. Puede usar índices internos e interning.
- Invalidación: publish atómico por batch, `semanticEpoch`, KB version y dependency fan-out.
- Escalabilidad 5000+: sí/parcial; debe evitar clones completos por request y permitir queries acotadas.
- Tests: KnowledgeBase unit tests, architecture rapid gate, cache invalidation tests.
- Docs owner: este documento; FASE 5 ampliará contrato detallado.

## PublishedSemanticSnapshot

- Qué contiene: una vista versionada de la semántica publicada: entidades/símbolos, scopes, snapshots documentales, índices por nombre/kind/container/base type/URI, dependencias, source origins, metadatos de proyecto suficientes para resolución, referencias a catálogo de sistema, submodelos derivados y un modelo común de confidence/evidence/reason codes.
- Qué no contiene: payloads LSP formateados, hover markdown, completion item docs, Object Explorer nodes, bundles IA, cache entries, full reports, resultados negativos, deep DataWindow/SQL lineage no solicitado ni copias completas del catálogo del sistema.
- Cómo se publica: por batch/staged update desde el indexer y document handlers; las mutaciones preparan estado staged y sólo se hacen visibles cuando `KnowledgeBase` publica el nuevo estado atómico.
- semanticEpoch/version: `semanticEpoch` es la versión de verdad publicada para el workspace; `kbVersion` puede aliasar ese epoch en cache keys. `documentFingerprint` sigue siendo discriminador por documento para hot paths donde el cambio global no afecta el payload visible.
- Invalidación: por URI/fingerprint para hechos documentales, dependency fan-out para dependientes, cambios ProjectModel/SourceOrigin para routing, versión de catálogo para built-ins/localización, y epoch global para lectores que dependen de verdad semántica completa.
- Hot path permitido: lecturas readonly/acotadas por URI, nombre, kind, owner, scope, base type, project context y candidate pool ya reducido; no full scans, deep clones ni serialización masiva.
- Offline/background: discovery, workspace indexing, enrichment profundo, DataWindow/SQL lineage pesado, manifests grandes, reports, cache persistence y warm restore corren fuera del hot path con cancellation/backpressure.
- Low confidence: el snapshot debe conservar entradas `low`, `fallback`, dynamic/advisory y unresolved con reason/evidence cuando sean útiles; los consumers deciden si proyectarlas, ocultarlas o degradarlas.
- Escala 5000+: sí/parcial; el contrato escala si los índices siguen acotados, los submodelos grandes se referencian/paginan y las queries evitan clonar listas completas.
- Tests: KnowledgeBase publish/restore tests, query/cross-surface golden matrix, cache invalidation tests, `test:architecture:rapid`, `test:performance:gate` y tests focales por submodelo.

### Submodelos del snapshot

| Submodelo | Contenido objetivo | Publicación | Hot path |
| --- | --- | --- | --- |
| ProjectModel | projects, file membership, library order, active project context, routing version | referencia a `UnifiedProjectModel`/workspace state versionado | lectura O(1)/acotada por URI |
| SourceOriginModel | source origin por documento/símbolo y prioridad de origen | lineage de `Entity` + workspace summary | lectura directa, sin re-inferir si ya existe |
| DocumentFacts | `SemanticDocumentSnapshot`, symbols, scopes, masked text, logical statements, readiness, fingerprint | dentro de `KnowledgeBase.documentSnapshots` | por URI/fingerprint |
| SymbolModel | `Entity`, identity key, kind, URI, range, owner/container, lineage | índices de `KnowledgeBase` | por nombre/kind/URI/container/base type |
| CallableModel | functions, events, subroutines, signatures, parameterCount, returnType, prototype/implementation/external metadata | campos de `Entity` enriquecidos y query projections | candidates acotados por owner/scope |
| ScopeModel | scope tree e índice por línea/profundidad | `documentScopes`/`scopeIndex` | lookup por URI/línea |
| TypeModel | type entities, baseTypeName, object kind, datatype links | `entitiesByKind`, `typeEntitiesByBaseType` y graph derivado | lookup por type/base type |
| InheritanceModel | ancestors, descendants, inherited members, native ancestors | derivado por `InheritanceGraph` sobre KB versionada | cacheado por KB version/active URI |
| SystemCatalogModel | built-ins, datatypes, enums, DataWindow constants/functions, localization/provenance | referencia a `SystemCatalog` versionado; no copia completa por snapshot | queries indexadas por dominio/owner/name |
| DataWindowSubmodel | DataObject target, columns, controls, retrieve args, expression deps, safe binding confidence | derivado por documento/DataWindow source con fingerprint | fast context seguro; lineage profundo fuera de hot path |
| SqlAnchorSubmodel | SQL regions, host variables, statement anchors, DataWindow SQL references | advisory por document snapshot/fingerprint | anchors ligeros; lineage profundo report-only |
| TransactionSubmodel | SetTransObject/SetTrans/SQLCA bindings, target/risk/confidence | advisory derivado de statements/scopes | por documento/scope, no workspace scan |
| ExternalNativeSubmodel | external functions, dll/pbx/rpcfunc kind, alias/library, invocation risk | metadata en `Entity` + projection | lectura junto a callable resolution |
| FrameworkAdvisorySubmodel | framework knowledge packs, conflicts, workspace-vs-pack advisory | projection desde SystemCatalog/framework packs + workspace symbols | sólo para current object/reports acotados |
| ConfidenceEvidenceModel | confidence, evidence entries, reason codes, ambiguity, degradation, source origin | shared schema para snapshot/query/projections | debe viajar con cada resultado semántico/advisory |

### Contrato de lectura

- Los readers deben pedir slices: por URI, position, symbol name, owner, project, feature policy o page token.
- Las respuestas deben incluir `semanticEpoch` o `kbVersion` cuando se cacheen o crucen el límite público.
- Las surfaces read-only grandes deben devolver límites, truncation flags, receipts o paginación antes que listas completas.
- `ApiSymbol` y otros DTOs públicos son proyecciones determinísticas, no tipos internos exportados.
- `SystemCatalogModel` conserva compatibilidad de catálogo; el snapshot lo referencia como verdad externa con provenance, no lo absorbe como workspace symbol.

## SemanticQueryResult

- query: `{consumer, uri, position/range, identifier, qualifier, invocationKind, expectedKind, project, library, sourceOriginPolicy, budgetMs, resultCap, cancellation, readiness}`.
- target: símbolo/callable/type/DataWindow/SQL/transaction/framework advisory principal, o `null` si no resuelve.
- kind: `workspace-symbol`, `system-symbol`, `datawindow`, `sql-anchor`, `transaction`, `external-native`, `framework-advisory`, `diagnostic`, `unknown`.
- owner: owner lógico normalizado: object/type, container, callable, project/library o system catalog domain.
- scope: scope PowerBuilder, declarationScope, visibility/access, current object, library search path y límites usados.
- source: source origin, authority, provenance/catalog dataset, document URI, range, project, library y snapshot identity.
- confidence: query confidence `high | medium | low | unknown` más lineage confidence `direct | inherited | fallback` cuando aplique.
- evidence: entries tipadas de winner, discarded candidates, ambiguity, source-origin conflict, signature discard, DataWindow binding, SQL anchor, transaction inference, dynamic string, catalog provenance y staleness.
- reasons: reason codes estables y mapeables a diagnostics/API; nunca strings libres sin dominio.
- alternatives: candidates alternativos, overloads, ambiguous targets, fallback targets y rejected candidates con reason.
- degraded: `{state, reason, userVisible, fallbackAction}` para low readiness, timeout, unsupported domain, dynamic/unknown, cap/truncation o source-origin policy.
- cacheability: `{cacheable, cacheClass, keyParts, ttlHint, invalidation}` con epoch/fingerprint/sourceOrigin/locale cuando corresponda.
- semanticEpoch: epoch de `PublishedSemanticSnapshot` usado; si el result cruza API pública, debe exponerse o quedar trazable en metadata.
- consumerProjection: nombre del consumer y reglas aplicadas: fields omitidos, confidence threshold, result cap, payload budget y redaction.

Estado 2026-05: el core de `SemanticQueryFacade` ya deriva `query.sourceOriginPolicy`, `budgetMs`, `resultCap`, `identifier` y `qualifier` desde la policy efectiva del consumer; `SemanticQueryResult` ya publica `source` y un `degraded` base para timeout/dynamic/low-readiness. La señal `stale` sigue viviendo hoy en la serving pipeline y todavía no es un contrato completo del facade.

### Reglas del contrato Query

- El query result es semántica ya resuelta, no presentation; formatters LSP y view models sólo recortan, ordenan o renderizan.
- Cada fallback debe conservar reason/evidence; ocultar el target no permite borrar la evidencia.
- `unknown` es un estado válido si evita inventar certeza.
- Los consumers pueden filtrar por confidence, pero no recalcular confidence.
- Los candidates descartados por source origin, arity, visibility o ambiguity deben poder explicarse en diagnostics/AI surfaces cuando el payload lo permita.
- System catalog y DataWindow/SQL/Transaction usan el mismo envelope aunque sus payloads internos sean domain-specific.

## Excepciones permitidas a SemanticQueryFacade

Una surface puede no entrar directamente por `SemanticQueryFacade` sólo si cumple todas estas condiciones:

- es puramente estructural por documento;
- no resuelve identidad semántica global;
- no publica confidence semántica;
- no consulta workspace/global indexes;
- no decide owner/fallback/evidence;
- tiene tests que demuestran que no duplica lógica semántica;
- queda documentada como excepción en `architecture-status.md` o `architecture-implementation-map.md`.

Ejemplos potencialmente permitidos:

- semantic tokens estructurales;
- document symbols estructurales;
- diagnostics lexer/parser locales;
- masking/string/comment analysis;
- statement splitter local.

Ejemplos no permitidos como excepción sin justificación:

- definition target selection;
- references target identity;
- completion callable candidates;
- signature overload selection;
- diagnostics semánticos de unresolved symbols;
- current object semantic owner;
- AI/report semantic facts.

## Consumer: hover

- Usa: `SemanticQueryResult` para target bajo cursor, system catalog projection y DataWindow fast context.
- Proyección: `HoverViewModel`/Markdown compacto con summary, signature, docs y warning de low confidence si aplica.
- No debe hacer: escanear workspace, resolver candidates por cuenta propia, ocultar dynamic/unknown sin reason.
- Fallback: built-in/system hover, DataWindow adapter, dynamic/unknown hover degradado o negative miss cacheable.
- Cache: ServingCache + PresentationCache/negative con URI, position, `kbVersion`, fingerprint, sourceOrigin, locale.
- Latency budget: 50 ms objetivo según consumer policy.
- Escala 5000+: sí, si usa active-object/project slices y cache.
- Tests: hover format, built-ins, negative cache, cross-surface golden matrix.

## Consumer: completion

- Usa: query result para scope/receiver/enum context, ProjectModel/library order, SystemCatalog y DataWindow adapters.
- Proyección: `CompletionItem[]` inicial ligero y completion resolve enriquecido bajo stale guard.
- No debe hacer: resolver docs completas en lista inicial, publicar confidence hardcoded para semantic candidates, reordenar sin evidence de source/library.
- Fallback: keywords/static snippets, system catalog, DataWindow expression/context, degraded candidates con cap.
- Cache: ServingCache para initial/resolve, negative completion resolve, stale guard por fingerprint/locale/kbVersion.
- Latency budget: 50 ms objetivo; result cap actual 200 para query policy.
- Escala 5000+: sí/parcial; candidates deben venir por scope/project y no por `getAllEntities()` sin límites.
- Tests: completion, completion resolve, payload budget, cross-surface candidates.

## Consumer: signature help

- Usa: callable query result, overload alternatives, system catalog callable projection, DataWindow retrieve adapter.
- Proyección: `SignatureHelp` con active signature/parameter y source/reason.
- No debe hacer: depender sólo de regex local para overloads, recalcular callable confidence, ejecutar deep DataWindow parsing.
- Fallback: system catalog function, DataWindow linked retrieve, null si low readiness/timeout bloquea.
- Cache: ServingCache por URI/position/fingerprint/kbVersion/locale.
- Latency budget: 50 ms objetivo.
- Escala 5000+: sí si overload pool está acotado por owner/scope.
- Tests: signature help unit/golden, DataWindow retrieve signature, query confidence coverage.

## Consumer: definition

- Usa: query result target(s), DataWindow definition adapter y system catalog source/provenance URL.
- Proyección: `Location | Location[] | null` y optional `DefinitionViewModel` para telemetry/read-only.
- No debe hacer: aceptar low-confidence fallback como definitive location sin reason, buscar textual global como camino principal.
- Fallback: catalog definition, DataWindow target, null con negative miss.
- Cache: ServingCache/negative definition key por URI/position/kbVersion/fingerprint/sourceOrigin.
- Latency budget: 50 ms objetivo.
- Escala 5000+: sí, si candidates vienen de índices KB y ProjectModel.
- Tests: definition, system catalog definition, DataWindow definition, cross-surface target alignment.

## Consumer: references

- Usa: identity/target del query result, reference source pool acotado por project/dependency neighborhood y masked text snapshots.
- Proyección: `Location[]` con cap y possible truncation metadata para read-only reports.
- No debe hacer: escanear 5000+ archivos como default, resolver target distinto de definition, ignorar ambiguity.
- Fallback: block si confidence/readiness insuficiente; textual fallback sólo bajo policy y pool acotado.
- Cache: reference source pool/cache cuando exista; ServingCache si se sirve interactivo con stable key.
- Latency budget: 150 ms objetivo para interactive references.
- Escala 5000+: parcial; requiere pools, caps y paginación para reports.
- Tests: references, rename, impact analysis, reference source pool, performance gate.

## Consumer: semantic tokens

- Usa: DocumentFacts, SymbolModel/TypeModel/SystemCatalog projection y query result sólo para usos donde resolver no rompa hot path.
- Proyección: token legend estándar, modifiers y optional resolvedSymbol/confidence para tokens semánticos seguros.
- No debe hacer: resolver deep por cada token, tratar colorización como verdad semántica, hardcodear high confidence para resolved tokens.
- Fallback: structural tokens/keywords sin confidence semántica; skip dynamic DataWindow bindings.
- Cache: document snapshot/fingerprint and LSP semantic token delta cuando aplique.
- Latency budget: presupuesto de documento abierto; no debe competir con hover/completion.
- Escala 5000+: sí, porque trabaja por documento, no por workspace.
- Tests: semantic tokens contract, ranges/modifiers, hot path allocation.

## Consumer: diagnostics

- Usa: DocumentFacts, PublishedSemanticSnapshot, SemanticQueryResult para unresolved callables, DataWindow/SQL/Transaction submodels y SystemCatalog rules.
- Proyección: diagnostics con code, severity, range, source, confidence, evidence kinds y reason codes.
- No debe hacer: mezclar engines sin source/evidence, publicar certeza alta para heurísticas advisory, bloquear edición por análisis profundo.
- Fallback: degraded diagnostics, delayed/background checks, advisory low confidence.
- Cache: diagnostic scheduler/cache by document fingerprint and dependency fan-out; no presentation cache como truth.
- Latency budget: 100 ms para unresolved-callable query slices; batch diagnostics pueden ir scheduler/background.
- Escala 5000+: parcial; por documento/dependents, no workspace-wide en hot path.
- Tests: diagnostics unit/golden, transaction/DataWindow diagnostics, explainability data.

## Consumer: document symbols

- Usa: DocumentFacts/SymbolModel del snapshot documental.
- Proyección: hierarchical document symbols, ranges y selection ranges.
- No debe hacer: resolver workspace/global semántica para mostrar estructura local.
- Fallback: structural-only snapshot cuando enrichment no esté listo.
- Cache: document snapshot/fingerprint.
- Latency budget: documento abierto, comparable a structural parse.
- Escala 5000+: sí, por documento.
- Tests: document symbols, hierarchical symbols, parser recovery.

## Consumer: workspace symbols

- Usa: PublishedSemanticSnapshot `SymbolModel`, ProjectModel/source origin filters y stable identity.
- Proyección: `ApiSymbol`/WorkspaceSymbol DTOs con limit/page.
- No debe hacer: materializar todos los símbolos sin límite para UI/read-only default, reparsear documentos.
- Fallback: partial results with truncation/readiness metadata.
- Cache: KB indexes; report projections may cache pages by epoch/query.
- Latency budget: command/report budget; interactive results capped.
- Escala 5000+: parcial; requires query + limit + pagination.
- Tests: workspace symbols, manifest limits, public API contract.

## Consumer: Object Explorer

- Usa: semantic workspace manifest objects/exported symbols from PublishedSemanticSnapshot and ProjectModel.
- Proyección: tree nodes project/library/kind/object with focus scope.
- No debe hacer: parse PowerBuilder in client, infer semantics beyond manifest fields.
- Fallback: workspace scope if current file/project focus unresolved; readiness/truncation messages.
- Cache: client model per manifest/active URI; server projection by manifest limits.
- Latency budget: view/report budget, lazy under client controller.
- Escala 5000+: parcial; manifest must cap/page objects.
- Tests: object explorer model, manifest contract, UI lazy activation.

## Consumer: Current Object Context

- Usa: SemanticQueryResult, current object slice, inheritance submodel, diagnostics snapshot, DataWindow/SQL submodels and related files.
- Proyección: focused object context with members, visible variables, references, diagnostics, DataWindow bindings, anchors, evidence.
- No debe hacer: force full workspace scans, hardcode framework confidence, recompute diagnostics as a second truth.
- Fallback: unavailable/degraded context with reason; cap referenced symbols.
- Cache: request/report projection by URI/line/fingerprint/kbVersion; HotContextCache for active object.
- Latency budget: 100 ms for query slices; report sections can degrade.
- Escala 5000+: parcial; dependency-neighborhood only and strict caps.
- Tests: current object context, semantic consistency oracle, AI/support bundle integration.

## Consumer: Diagnostics Explainability

- Usa: diagnostic data, SemanticQueryResult evidence trace when available, diagnostic code catalog and source metadata.
- Proyección: explanation report/panel with why, evidence, confidence, next steps and safe fix context.
- No debe hacer: invent cause when diagnostic lacks evidence, parse source in client, replace diagnostics engine.
- Fallback: generic diagnostic explanation with explicit missing-evidence reason.
- Cache: client panel model by active diagnostics snapshot; server/API report by diagnostic identity.
- Latency budget: command/view budget, not activation hot path.
- Escala 5000+: sí/parcial; only active file/selected diagnostics by default.
- Tests: explain diagnostic report, panel model, diagnostic presentation.

## Consumer: RuntimeSelfTest

- Usa: public API contract, runtime stats, semantic manifest, diagnostics summary, cache stats and feature readiness.
- Proyección: pass/warning/fail checks and recommendations.
- No debe hacer: launch deep indexing/build/ORCA as a hidden side effect, resolve symbols itself.
- Fallback: warning for unavailable optional capability.
- Cache: none semantic; consumes latest summaries.
- Latency budget: explicit command budget, not hot path.
- Escala 5000+: parcial; must consume summaries/limits.
- Tests: runtime self-test unit tests, release readiness checks.

## Consumer: Health dashboard

- Usa: runtime stats, manifest summaries, diagnostics, build/ORCA capability summaries, cache metrics and support matrix.
- Proyección: scorecard/status UI.
- No debe hacer: compute semantic truth or load full manifests without caps.
- Fallback: unknown/degraded status with recommendation.
- Cache: client presentation state only.
- Latency budget: UI/report budget, not LSP provider budget.
- Escala 5000+: parcial; summaries only.
- Tests: project health dashboard, status presentation, runtime health.

## Consumer: AI/read-only reports

- Usa: PublishedSemanticSnapshot projections, SemanticQueryResult slices, current object context, diagnostics explainability, dependency graph, safe edit plan, redaction and token budget.
- Proyección: JSON DTOs, support bundle, AI task context bundle, manifests/diffs/reports with pagination.
- No debe hacer: export unrestricted full workspace by default, expose internal paths/evidence without redaction policy, become semantic source.
- Fallback: omissions, truncation reason codes, minimal bundle under token pressure.
- Cache: report workload projections by epoch/focus/request; support materialization only.
- Latency budget: command/report budget; must not block interactive providers.
- Escala 5000+: parcial; requires max tokens, max symbols, max diagnostics, receipts/pages.
- Tests: public API contract, AI bundle tests, support bundle tests, docs drift.

## Componente objetivo: SemanticQueryFacade

- Responsabilidad: ser la frontera única de consulta semántica para consumers, delegando en query service y devolviendo resultados con confidence/evidence/reason codes.
- Owner: `src/server/features/semanticQueryFacade.ts` y `semanticQueryService` como motor interno.
- Inputs: PublishedSemanticSnapshot/KnowledgeBase, InheritanceGraph, SystemCatalog projection, RequestContext, consumer policy, HotContextCache.
- Outputs: `SemanticQueryResult`/modelos resueltos, alternatives, ambiguity, degradation, cacheability.
- No debe hacer: leer disco, escanear workspace completo, formatear UI, ocultar evidence de degradación.
- Depende de: query context, source origin policy, ProjectModel/LibrarySearchPath, ConfidenceEvidenceModel.
- Lo consumen: hover, completion, signature help, definition, references, diagnostics, semantic tokens y read-only surfaces con excepciones documentadas.
- Cache: usa HotContextCache y permite ServingCache aguas abajo; no cachea verdad final.
- Invalidación: semantic epoch, document fingerprint, active URI, consumer policy, catalog/source origin changes.
- Escalabilidad 5000+: sí/parcial; cada query debe estar acotada por consumer policy y cancellation.
- Tests: cross-surface golden matrix, provider convergence tests, query explain plan tests.
- Docs owner: este documento; FASE 6 ampliará contrato `SemanticQueryResult`.

## Componente objetivo: Domain Submodels

- Responsabilidad: publicar modelos derivados y advisory para dominios PowerBuilder especializados sin mezclarlos como heurísticas por feature.
- Owner: cada subdominio: DataWindow, SQL anchors, Transaction, ExternalNative, FrameworkAdvisory, SystemCatalog projection.
- Inputs: DocumentFacts, SourceOriginModel, ProjectModel, SystemCatalog, DataWindow source, SQL regions, declaraciones externas.
- Outputs: submodelos con source, confidence, evidence, reason codes, ranges y cacheability.
- No debe hacer: afirmar runtime certainty donde sólo hay inferencia textual, ejecutar deep lineage en hot path, duplicar symbol identity.
- Depende de: PublishedSemanticSnapshot, SemanticEnrichment, catalog/source origin.
- Lo consumen: SemanticQueryFacade, diagnostics, completion/signature adapters, current object context, reports, AI bundle.
- Cache: por document fingerprint/semantic epoch/submodel version; deep reports con caps.
- Invalidación: cambios de documento, DataObject target, catalog version, source origin, transaction-relevant scopes.
- Escalabilidad 5000+: parcial; viable como submodelo incremental/advisory, no como análisis profundo global por request.
- Tests: DataWindow unit/golden tests, SQL transaction tests, diagnostics tests, performance gates.
- Docs owner: `docs/symbol-system.md`, instrucciones DataWindow/catalog, este documento para contrato transversal.

## Componente objetivo: Cache / Projection Layer

- Responsabilidad: acelerar respuestas derivadas sin convertirse en verdad: document cache, hot context, serving cache, presentation/negative cache, active document snapshot y report projections.
- Owner: `src/server/knowledge`, `src/server/serving`, `src/server/cache`, runtime memory policy.
- Inputs: PublishedSemanticSnapshot, SemanticQueryResult, document fingerprint, URI, position, locale, source origin, consumer policy.
- Outputs: cache hits/misses, DTOs LSP/read-only, negative miss receipts, stats.
- No debe hacer: resolver disputas semánticas, sobrevivir a epoch/fingerprint incompatible, materializar reports ilimitados.
- Depende de: key contract, memory pressure policy, runtime stats.
- Lo consumen: feature handlers, providers, read-only command handlers, runtime self-test, health dashboard.
- Cache: es la capa de caches; cada cache declara scope/key/value/lifecycle/metrics.
- Invalidación: semantic epoch/KB version, document fingerprint, source origin, locale, feature policy, memory pressure.
- Escalabilidad 5000+: sí/parcial; LRU, caps, paging y backpressure son obligatorios.
- Tests: cache key contract, negative cache tests, `test:performance:gate`, memory pressure tests.
- Docs owner: `docs/performance-budget.md`, `docs/architecture-status.md`, FASE 7 en este documento.

## Cache: DocumentCache

- Owner: `src/server/knowledge/DocumentCache.ts`.
- Key: normalized URI + document version/fingerprint in entry; pinned state by URI.
- Contenido: `DocumentCacheEntry`, facts, scopes, semantic snapshot, document records for persistence.
- Qué NO debe contener: global symbol truth, LSP payloads, query results, diagnostics/report DTOs.
- Invalidación: `DocumentChanged` for URI, explicit close/unpin/eviction, memory pressure, cache clear/restore mismatch.
- TTL: no time TTL; LRU max entries with pinned documents protected.
- Relación con semanticEpoch: input/cache ahead of publication; epoch advances only when facts are published to KB.
- Hot path permitido: readonly snapshot/facts lookup by active URI; no full cache export.
- Métricas: size, cached URIs, pinned state, evictions.
- Escala 5000+: sí/parcial; capped LRU and persistence records, not whole-workspace clone on request.
- Tests: DocumentCache LRU/persistence/invalidation, hot path allocation.

## Cache: KnowledgeBase snapshot store

- Owner: `src/server/knowledge/KnowledgeBase.ts`.
- Key: published `semanticEpoch`, normalized URI, symbol id/name, kind, container, base type, dependency key.
- Contenido: `publishedState`, document snapshots, entities, scopes, indexes, dependencies and reverse dependencies.
- Qué NO debe contener: serving/presentation payloads, negative misses, report pages, client tree nodes.
- Invalidación: staged publish replaces document contribution; remove document clears URI facts/indexes/dependencies; restore sets epoch from checkpoint.
- TTL: none; it is truth until next publish/restore/clear.
- Relación con semanticEpoch: primary owner; every publish advances `semanticEpoch` unless target future detects no public semantic diff and suppresses publish.
- Hot path permitido: readonly indexed queries by URI/name/kind/container/base type/scope.
- Métricas: total entities, indexed documents/scopes, snapshot documents, dependency counts, publishedAt, epoch.
- Escala 5000+: sí/parcial; only if readers avoid deep clones and unbounded `getAllEntities`.
- Tests: KnowledgeBase publish/restore/export, dependency fan-out, query performance.

## Cache: ServingCache

- Owner: `src/server/knowledge/ServingCache.ts` plus `src/server/serving/cacheKeyContract.ts` for structured keys.
- Key: feature, URI, position/range, `kbVersion`, `documentFingerprint`, sourceOrigin, locale, trigger/context/prefix/extra.
- Contenido: interactive provider results for hover, completion, signature help, definition and structured generic serving payloads.
- Qué NO debe contener: semantic truth, facts snapshots, report bundles, unbounded references/workspace data.
- Invalidación: URI-specific invalidation, global reset, TTL expiry when configured, memory pressure/partition eviction, stale guard mismatch.
- TTL: optional `ttlMs`; default can be zero/no time expiry with LRU eviction.
- Relación con semanticEpoch: uses `kbVersion` and per-document fingerprint; global epoch alone must not invalidate unrelated document payloads if fingerprint/source/projection are unchanged.
- Hot path permitido: O(1) get/set and selective invalidation; no value recomputation inside cache.
- Métricas: hits, misses, evictions, size, capacity, by-feature stats, observer events.
- Escala 5000+: sí; bounded partitions and selective invalidation.
- Tests: serving cache stats, TTL, structured key, selective invalidation, performance gates.

## Cache: HotContextCache

- Owner: `src/server/knowledge/HotContextCache.ts`.
- Key: active URI + `kbVersion`, inherited member type key.
- Contenido: active document entities and inherited member closures for active context.
- Qué NO debe contener: arbitrary workspace symbols, presentation payloads, report pages, persisted truth.
- Invalidación: active URI change, KB version change, URI invalidation, ancestor/dependency conservative invalidation, reset.
- TTL: none; validity is active URI + KB version + LRU cap for inherited types.
- Relación con semanticEpoch: `kbVersion` guards all entries; epoch advance invalidates active cache through `setActive` mismatch.
- Hot path permitido: active document entities and inherited members for hover/completion/signature/definition.
- Métricas: activeUri, kbVersion, inheritedTypes, capacity.
- Escala 5000+: sí; scope is active document and capped inherited closures.
- Tests: hot context active switching, KB version invalidation, inherited member cap.

## Cache: NegativeCache

- Owner: conceptual cache class implemented through `PresentationCache` and structured keys with `cacheClass: 'negative'`.
- Key: same structured interactive key as serving/presentation, including feature, URI, documentVersion, `kbVersion`, fingerprint, sourceOrigin, locale and position/context.
- Contenido: cacheable miss/degraded reason receipts for hover, completion resolve, definition and future safe misses.
- Qué NO debe contener: unresolved truth across epochs, low-confidence target lists, diagnostics, permanent block decisions.
- Invalidación: same URI/global/policy invalidation as presentation cache; stale guard mismatch; epoch/fingerprint/sourceOrigin/locale key change; memory pressure eviction.
- TTL: no standalone TTL today; target permits short TTL only if reason is non-semantic or stale-safe.
- Relación con semanticEpoch: negative result is valid only for key epoch/fingerprint/sourceOrigin/locale; never across changed semantic truth.
- Hot path permitido: O(1) avoid recomputing known safe misses.
- Métricas: PresentationCache stats per negative cache, serving stats for negative-hit reason.
- Escala 5000+: sí; bounded and local to interactive misses.
- Tests: negative cache hit/miss/invalidation, stale guard, no stale payload after document change.

## Cache: ReadOnlyReportCache

> Nota de naming: `ReadOnlyReportCache` es el nombre conceptual usado durante la auditoría. El nombre objetivo recomendado para implementación futura es `ReadOnlyProjectionCache`, porque la cache no debe almacenar informes completos como verdad, sino proyecciones paginadas, receipts, summaries y payloads acotados.

- Owner: target contract for report projections; currently represented by report workloads, adaptive limits, support bundle materialization and future page/receipt caches.
- Key: report name, request/focus, `semanticEpoch`, project/source origin filters, page token, redaction policy, token budget and report limit policy.
- Contenido: bounded report pages, receipts, summaries, manifest pages, AI/support bundle projections.
- Qué NO debe contener: canonical semantics, unredacted unrestricted full workspace by default, client-only truth, stale reports without epoch/limits metadata.
- Invalidación: `KnowledgeBasePublished`, `ProjectModelChanged`, SourceOrigin/catalog/submodel changes, redaction/token budget changes, memory pressure, explicit refresh.
- TTL: optional short TTL for command UX; epoch/key change is mandatory invalidation.
- Relación con semanticEpoch: report page must declare or be keyed by the epoch it projects; cross-epoch reuse only if data is proven unchanged by diff.
- Hot path permitido: none for interactive providers; read-only/report lane only.
- Métricas: generatedFromCache, page count, truncation, estimated tokens, workload latency, memory-pressure reductions.
- Escala 5000+: parcial; requires caps, pagination, receipts and adaptive limits.
- Tests: public API/report contract, AI bundle budget, manifest limits, support bundle redaction, docs drift.

## Invalidación semántica objetivo

Regla principal: si cambia texto pero no cambia la semántica pública, no se invalida todo el workspace. Se invalidan como máximo el snapshot documental y payloads ligados a ese documento/fingerprint, y sólo se publica epoch nuevo cuando cambian facts, scopes, dependencies o submodelos visibles.

| Evento | Disparador | Invalida | No invalida |
| --- | --- | --- | --- |
| DocumentChanged | cambio LSP/watcher de texto o versión | DocumentCache URI, active snapshot, serving/presentation/negative keys de URI, scheduled analysis | KB global si facts públicos no cambian |
| DocumentFactsChanged | diff de symbols/scopes/dependencies/readiness/submodels | KnowledgeBase staged URI, dependency fan-out, HotContextCache afectado, diagnostics dependientes | unrelated ServingCache entries con fingerprint distinto no afectado |
| ProjectModelChanged | discovery/routing/topology cambia pertenencia | project/library projections, report pages, query source pools, manifests | document facts no afectados |
| LibraryOrderChanged | cambia orden de libraries/target activo | query candidate ordering, references/definition/completion projections for affected project | document snapshots sin cambios |
| DataWindowFactsChanged | cambia `.srd`/DataObject/binding/columns/retrieve args | DataWindowSubmodel, adapters, diagnostics, current object context, related report pages | PowerScript symbol facts no dependientes |
| SqlAnchorsChanged | cambia SQL region/host vars/lineage anchor | SqlAnchorSubmodel, transaction advisory, diagnostics/reports for URI | workspace symbol indexes sin relación |
| KnowledgeBasePublished | staged state se hace visible | `semanticEpoch`, KB readers, HotContextCache by version, report projections keyed by epoch | DocumentCache entries with same fingerprint remain reusable as input cache |
| SemanticEpochAdvanced | visible epoch changed after publish/restore/clear | caches keyed by `kbVersion`, read-only pages, stale tokens/results | per-document serving payloads only if key/fingerprint/projection allow reuse by future diff policy |

### Política anti-invalidación global

- Preferir diff semántico por URI antes de publicar epoch global.
- Separar `documentFingerprint` de `semanticEpoch`: fingerprint protege payloads de documento; epoch protege verdad publicada.
- Usar dependency fan-out para dependientes, no workspace-wide flush.
- Tratar ProjectModel/LibraryOrder como versiones de routing que invalidan ordering/source pools, no snapshots documentales.
- Tratar DataWindow/SQL/Transaction como submodelos advisory con invalidación por documento/target, no por todo el workspace.
- Las read-only surfaces grandes deben regenerar sólo página/foco afectado o declarar truncation/staleness.

## Componente objetivo: LSP Providers

- Responsabilidad: proyectar query results y snapshots en respuestas LSP compactas, cancelables y coherentes.
- Owner: server feature providers y feature handlers.
- Inputs: RequestContext, SemanticQueryFacade, PublishedSemanticSnapshot, Cache/Projection Layer, SystemCatalog projection.
- Outputs: Hover, Completion, SignatureHelp, Definition, References, Diagnostics, SemanticTokens, Document/Workspace Symbols.
- No debe hacer: resolver semántica global por su cuenta, leer 5000+ archivos, duplicar reason/confidence logic, formatear payloads enormes.
- Depende de: facade/query service, view models, serving cache, readiness/cancellation.
- Lo consumen: VS Code client/LSP runtime.
- Cache: ServingCache/PresentationCache/HotContextCache según provider.
- Invalidación: document change, semantic epoch, position, locale, source origin, provider-specific policy.
- Escalabilidad 5000+: sí/parcial; references y workspace symbols requieren pools/caps, semantic tokens no deben resolver deep por token.
- Tests: provider unit tests, cross-surface golden matrix, performance/hot-path guards.
- Docs owner: `docs/architecture-status.md`, `docs/testing.md`, este documento para contrato semantic-reader.

## Componente objetivo: Read-only Surfaces / AI Projections

- Responsabilidad: exponer manifests, panels, diagnostics explainability, object/current context, health/self-test, support bundle y AI bundle como proyecciones acotadas.
- Owner: shared public API, server read-only commands, client panels/support modules.
- Inputs: PublishedSemanticSnapshot, SemanticQueryResult, runtime stats, diagnostics snapshots, request focus, redaction/token budget.
- Outputs: serializable DTOs, tree nodes, reports, bundles, receipts, paginated projections.
- No debe hacer: parsear PowerBuilder en cliente, resolver symbols fuera del server, crear truth stores offline sin schema/version.
- Depende de: public API contracts, read-only tool bridge, caps/paging/redaction.
- Lo consumen: developers, support workflows, IA agents, release/readiness checks.
- Cache: report workloads/projections con caps; support bundle materialization; no semantic truth.
- Invalidación: semantic epoch, runtime stats timestamp, focus URI, token budget, redaction policy.
- Escalabilidad 5000+: parcial; toda surface grande debe paginar, truncar o emitir receipt.
- Tests: public API contract tests, runtime self-test tests, report/bundle tests, docs drift.
- Docs owner: `src/shared/publicApi.ts` contract, `docs/architecture-status.md`, este documento para projection ownership.

## Componente objetivo: Observability / Backpressure

- Responsabilidad: medir readiness, cache behavior, latency, memory pressure, degraded mode y salud de surfaces sin bloquear activación.
- Owner: runtime, health, progress y client dashboards.
- Inputs: scheduler stats, cache stats, semantic epoch, diagnostics summary, manifest limits, memory pressure.
- Outputs: runtime stats, progress, health dashboard, self-test report, warnings/recommendations.
- No debe hacer: ejecutar análisis semántico pesado sólo para mostrar status, bloquear LSP interactivo, duplicar diagnostics engines.
- Depende de: runtime controllers, memory pressure policy, public API stats.
- Lo consumen: status bar, dashboards, support bundle, release readiness.
- Cache: summaries y stats; no caches semánticas.
- Invalidación: runtime event stream, cache updates, readiness transitions, command execution.
- Escalabilidad 5000+: sí/parcial; debe consumir resúmenes y límites, no listas completas.
- Tests: runtime self-test, health dashboard tests, performance gates, release verification.
- Docs owner: `docs/performance-budget.md`, `docs/release.md`, `docs/troubleshooting.md`.

## Reglas de simplificación

- Fusionar sólo cuando dos módulos disputen verdad; conservar adaptadores si protegen compatibilidad o performance.
- Degradar a report-only cuando una feature requiera análisis profundo no apto para hot path.
- Eliminar superficies que no tengan developer value, AI value, soporte operativo o contrato medible.
- Preferir proyecciones DTO determinísticas sobre imports de tipos internos en API pública.
- Cada excepción a la facade debe declarar owner, reason, evidence, fallback y fecha de revisión.

## Plan incremental

No big-bang. Cada etapa debe dejar tests y docs en estado ejecutable, con consumers migrados por slices y con fallback explícito mientras conviven rutas legacy.

## Etapa 1 — Diseño objetivo + Assumption Ledger + conformance tests

- Objetivo: congelar el contrato objetivo, ledger de supuestos y tests de conformidad que eviten regressions de ownership, hot paths y documentación.
- Archivos afectados: `docs/semantic-design-target.md`, `docs/semantic-design-assumptions.md`, `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, tests de architecture/docs drift.
- Riesgos: convertir el target en backlog duplicado o describir implementación inexistente como estado real.
- Tests: `test:docs:drift`, `test:architecture:rapid`, futuros conformance tests del contrato semántico.
- Docs: target/ledger como owner del diseño futuro; status/map como owner del estado real.
- Criterio de salida: target completo, ledger actualizado, sin errores documentales, backlog de ejecución separado.
- Backlog items: `PB-ARCH-P0-SEMANTIC-DESIGN-TARGET-01`, `PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01`.

## Etapa 2 — SemanticQuery contract

- Objetivo: envolver `ResolvedTargetInfo`/facade en un contrato `SemanticQueryResult` con confidence, evidence, reasons, cacheability y consumerProjection.
- Archivos afectados: `src/server/knowledge/resolution/semanticQueryService.ts`, `src/server/features/semanticQueryFacade.ts`, `src/server/features/queryScopePolicy.ts`, presentation/view-model adapters y tests de query.
- Riesgos: payloads demasiado grandes, duplicar tipos, romper consumers que dependen de campos internos.
- Tests: query service/facade unit tests, cross-surface golden matrix, payload budget tests.
- Docs: `docs/symbol-system.md`, `docs/architecture-status.md`, este target.
- Criterio de salida: contrato común disponible detrás de facade, consumers existentes siguen verdes, exceptions documentadas.
- Backlog items: `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`, absorber `PB-SEMANTIC-P0-FACADE-CONVERGENCE-01`.

## Etapa 3 — Completion + Signature Help projections

- Objetivo: migrar completion y signature help a proyecciones del contrato común, preservando latencia y adapters DataWindow/system catalog.
- Archivos afectados: `src/server/features/completion.ts`, `src/server/features/signatureHelp.ts`, `src/server/presentation/**`, `src/server/features/dataWindowServingAdapters.ts`, tests de completion/signature.
- Riesgos: regressions de ranking, overloads, completion resolve y DataWindow retrieve signatures.
- Tests: completion unit/integration, signature help golden, DataWindow retrieve signature, `test:performance:gate`.
- Docs: `docs/testing.md`, `docs/architecture-status.md`, matriz consumer en este target.
- Criterio de salida: completion/signature comparten target/owner/confidence con hover/definition para casos equivalentes.
- Backlog items: `PB-ARCH-P1-CONSUMER-CONVERGENCE-COMPLETION-SIGNATURE-01`.

## Etapa 4 — References structural confirmation

- Objetivo: asegurar que references/rename usan identidad común y source pools acotados, no búsqueda textual global por defecto.
- Archivos afectados: `src/server/features/references.ts`, `src/server/features/rename.ts`, `src/server/features/impactAnalysis.ts`, query source pool/KB dependency indexes, tests de references/rename.
- Riesgos: perder referencias legítimas en herencia, events dinámicos o generated/staging sources; full scan accidental en workspace grande.
- Tests: references/rename unit, impact analysis, architecture performance guards, corpus PFC/OrderEntry opcional.
- Docs: `docs/architecture-status.md`, `docs/testing.md`, `docs/performance-budget.md`.
- Criterio de salida: references comparte target selection con definition y declara truncation/fallback si el pool está capado.
- Backlog items: `PB-ARCH-P1-REFERENCES-STRUCTURAL-CONFIRMATION-01`.

## Etapa 5 — Semantic Tokens evidence contract

- Objetivo: separar tokens visuales estructurales de tokens semánticamente resueltos y eliminar confidence hardcoded.
- Archivos afectados: `src/server/features/semanticTokens.ts`, presentation models, confidence tests, AI/report DTOs que consumen token evidence.
- Riesgos: ralentizar tokenización si se resuelve por token o romper themes/legend.
- Tests: semantic tokens range/legend, confidence calibration, hot path allocation/performance.
- Docs: `docs/symbol-system.md`, `docs/testing.md`, `docs/architecture-status.md`.
- Criterio de salida: tokens estructurales no aparentan semántica fuerte; tokens resueltos llevan evidence o se omite confidence.
- Backlog items: `PB-ARCH-P1-SEMANTIC-TOKENS-EVIDENCE-CONTRACT-01`, absorber `PB-SEMANTIC-P1-CONFIDENCE-CONTRACT-01`.

## Etapa 6 — Read-only surfaces as projections

- Objetivo: convertir Object Explorer, Current Object Context, explainability, health/self-test, workspace reports y AI/support bundles en proyecciones acotadas de snapshot/query/runtime.
- Archivos afectados: `src/shared/publicApi.ts`, `src/server/handlers/reportCommandHandlers.ts`, `src/server/features/semanticWorkspaceManifest.ts`, `src/client/objectExplorerModel.ts`, `src/client/currentObjectContextPanelModel.ts`, `src/client/diagnosticsExplainabilityPanelModel.ts`, `src/client/aiTaskContextBundle.ts`, `src/client/support/supportBundle.ts`.
- Riesgos: payloads enormes, drift entre panels y API, redaction/token budget incompleto.
- Tests: public API contract, panel model tests, support/AI bundle tests, docs drift.
- Docs: `docs/testing.md`, `docs/troubleshooting.md`, `docs/performance-budget.md`, `docs/architecture-status.md`.
- Criterio de salida: cada surface tiene owner, budget, truncation/receipt cuando aplica y no recalcula verdad.
- Backlog items: `PB-ARCH-P1-READONLY-SURFACES-PROJECTIONS-01`, absorber `PB-RUNTIME-P1-READONLY-SURFACES-GATES-01`.

## Etapa 7 — Cache/invalidation coordinator

- Objetivo: coordinar events de invalidación, structured keys, no-op semantic publish y cache metrics sin convertir caches en verdad.
- Archivos afectados: `src/server/knowledge/DocumentCache.ts`, `src/server/knowledge/ServingCache.ts`, `src/server/knowledge/HotContextCache.ts`, `src/server/serving/cacheKeyContract.ts`, `src/server/serving/presentationCache.ts`, `src/server/serving/staleGuard.ts`, `src/server/cache/**`, KnowledgeBase publish path.
- Riesgos: stale negatives, invalidación global innecesaria, memory pressure mal calibrado.
- Tests: cache key/stale guard, cache invalidation, persistence restore, performance gate.
- Docs: `docs/performance-budget.md`, `docs/architecture-status.md`, target FASE 7.
- Criterio de salida: cambios textuales sin diff semántico público no fuerzan flush global; caches exponen métricas y selective invalidation.
- Backlog items: `PB-ARCH-P1-CACHE-SEMANTIC-EPOCH-CONTRACT-01`, `PB-ARCH-P1-CROSS-CACHE-INVALIDATION-COORDINATOR-01`, `PB-ARCH-P1-SEMANTIC-DIFF-NOOP-PUBLISH-GATE-01`.

## Etapa 8 — DataWindow/SQL/native submodels

- Objetivo: publicar o referenciar submodelos DataWindow, SQL anchors, transaction y external native con source origin, confidence, evidence y boundaries explícitos.
- Archivos afectados: `src/server/features/dataWindowModel.ts`, `dataWindowFastContext.ts`, `dataWindowBindingModel.ts`, `dataWindowPropertyPaths.ts`, `embeddedSqlAnchors.ts`, `dataWindowSqlLineage.ts`, `dynamicStringReferences.ts`, `src/server/parsing/externalFunctions.ts`, diagnostics/current context reports.
- Riesgos: sobreprometer heurística, introducir parseo SQL/DataWindow profundo en hot path, confundir metadata nativa con ABI support.
- Tests: DataWindow fast context/model, SQL regions/anchors, transaction diagnostics, externalFunctions, technical debt/workspace reports, performance gate.
- Docs: DataWindow owner docs, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/testing.md`, `docs/troubleshooting.md`.
- Criterio de salida: slices seguros son interactivos y cacheables; lineage profundo/dynamic/unsupported queda advisory/report-only con reason.
- Backlog items: `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01`, `PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01`, `PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01`.

## Etapa 9 — Cleanup/deletion of duplicated logic

- Objetivo: retirar rutas duplicadas ya migradas, fallbacks legacy no necesarios, docs duplicadas y report builders absorbidos por projections comunes.
- Archivos afectados: providers migrados, `dataWindowLegacySafeMode.ts`, report/panel builders, docs de architecture/status/backlog/current focus, tests de architecture imports.
- Riesgos: borrar compatibilidad antes de tener parity o dejar referencias colgantes en comandos/API pública.
- Tests: full targeted unit suite for migrated features, `test:architecture:rapid`, `test:docs:drift`, smoke de commands/panels.
- Docs: `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/technical-debt-inventory.md` si cambia deuda.
- Criterio de salida: no quedan rutas duplicadas sin owner; cada eliminación tiene test de regression y changelog/backlog si afecta superficie pública.
- Backlog items: `PB-ARCH-P2-FEATURE-SIMPLIFICATION-AND-DELETION-01`.

## Validación objetivo

- `npm run test:architecture:rapid` para ownership, layering y hot-path drift.
- `npm run test:performance:gate` para latencia, allocation y budgets interactivos.
- `npm run test:docs:drift` para documentación y links.
- Suites unitarias específicas para query, DataWindow, catalog, providers y public API según el componente tocado.
