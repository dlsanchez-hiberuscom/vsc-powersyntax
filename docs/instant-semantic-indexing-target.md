# Arquitectura objetivo — Instant Semantic and Indexing Runtime

Este documento define la arquitectura objetivo futura para que la extensión descubra, indexe, analice y sirva features interactivas de forma percibida como instantánea en workspaces PowerBuilder de 10,000+ archivos. No es un registro de hallazgos; los hallazgos viven en [docs/audits/macro-instant-semantic-indexing-findings.md](audits/macro-instant-semantic-indexing-findings.md).

## 1. Resumen ejecutivo

La arquitectura objetivo conserva `KnowledgeBase.publishedState` como fuente de verdad semántica y organiza todo lo demás como inputs versionados, facts incrementales, índices hot, snapshots publicados, facade de consulta, caches/proyecciones y providers delgados. El diseño busca que hover, completion, signature help, definition, references, diagnostics, semantic tokens, Object Explorer y las superficies read-only respondan con datos útiles aunque discovery/indexing sigan trabajando en background.

La auditoría PHASE 0-11 confirma que el repositorio ya tiene bases importantes: `KnowledgeBase`, `PublishedSemanticSnapshot`, `SemanticQueryFacade`, scheduler lanes, worker pool, serving cache, performance instrumentation, tests de arquitectura y varias matrices semánticas. La brecha principal no es ausencia total de arquitectura, sino convergencia: eliminar lógica duplicada, endurecer contracts ejecutables, separar submodelos PowerBuilder, completar caches/fingerprints/epochs, paginar proyecciones y probar el comportamiento en workspaces 10,000+.

## 2. Objetivos de diseño

- Respuestas interactivas rápidas aunque la indexación esté parcial o en background.
- Una sola fuente de verdad semántica publicada.
- Providers LSP delgados sobre `SemanticQueryFacade` y caches explícitas.
- Proyecciones read-only lazy/paginadas para manifiestos grandes.
- Submodelos PowerBuilder honestos para PowerScript, DataWindow, SQL y native/external.

## 3. No objetivos

- No introducir un segundo store semántico paralelo.
- No hacer deep scans de workspace en hot paths.
- No convertir DataWindow, SQL, JSON, JavaScript, ORCA/OrcaScript, PBAutoBuild JSON, PBX/PBNI o DLL externas en PowerScript normal.
- No ejecutar refactors amplios dentro de la auditoría sin specs, tests de paridad y plan de retiro.

## 4. Restricciones específicas de PowerBuilder

PowerBuilder mezcla objetos SR*, herencia, eventos, funciones, variables con scopes legacy, bibliotecas/PBL folders, DataWindow `.srd`, SQL embebido/dinámico, transacciones y declarations external/native. El runtime objetivo debe preservar `sourceOrigin`, confidence, reason codes y gates de advisory analysis para dominios no PowerScript.

PHASE 2 confirma que el parser PowerScript objetivo debe seguir siendo conservador: lexical/structural primero, submodelos explícitos para dominios ricos y cero promesas de AST completo cuando solo hay heurística.

## 5. Vista general de arquitectura objetivo

Flujo objetivo:

```txt
Versioned Inputs
  -> Incremental Facts
  -> Semantic Hot Indexes
  -> PublishedSemanticSnapshot
  -> SemanticQueryFacade
  -> Serving/Projection Caches
  -> Thin LSP Providers
  -> Reactive Read-only Surfaces
```

Cada flecha representa un boundary versionado. Ningún provider debe saltar desde `Thin LSP Providers` hacia archivos o stores crudos para reconstruir verdad semántica. Si una feature necesita datos no publicados, debe devolver resultado degraded/stale con reason code o programar trabajo Near/Background.

## 6. Inputs versionados

Los inputs deben incluir URI normalizada, versión de documento, fingerprint de contenido, `sourceOrigin`, proyecto/target/library, configuración relevante y estado de readiness. Los cambios deben publicarse como deltas, no como reconstrucciones globales desde hot paths.

La investigación PHASE 1 incorpora el principio de Salsa/rust-analyzer: los inputs cambian fuera del cálculo derivado y el modelo semántico se recomputa de forma determinística y lazy. En este repositorio eso se traduce a no hacer I/O dentro de la fuente de verdad semántica ni dentro de providers interactivos.

PHASE 4 añade que el estado dirty debe separarse por contrato: discovery/topology dirty, project routing dirty, semantic document dirty y checkpoint validation no son el mismo hecho. Un warm restore compatible debe poder marcar el set semántico como clean aunque la topología se haya refrescado, siempre que manifest/fingerprints/versiones lo demuestren.

## 7. Pipeline incremental de facts

El pipeline objetivo separa clasificación/discovery, parse estructural, facts semánticos enriquecidos y submodelos advisory. `workspaceIndexer` ya muestra pases structural/enriched y publicación por batch; PHASE 4 confirma que falta warm start con skip real de full index y granularidad dirty adicional.

La estrategia de TypeScript project references refuerza que el graph debe ser explícito y up-to-date-aware: cambios locales no deben forzar recomputación global si el project/library graph y los fingerprints demuestran estabilidad.

Discovery objetivo debe ser productor bounded: concurrencia acotada para I/O, ignores configurables, caps de nodos/archivos, receipts de partial discovery y parse de markers pesado separado del traversal cuando sea necesario. El archivo activo no debe esperar a que termine la enumeración completa para tener contexto local utilizable.

## 8. Semantic hot indexes

Los índices hot deben cubrir nombre, kind, contenedor, URI, base type, scopes, dependencias, reverse dependencies, symbol identity y ocurrencias relevantes para references/rename. Deben servir consultas sin scans globales.

## 9. PublishedSemanticSnapshot y fuente de verdad

`KnowledgeBase.publishedState` es la fuente de verdad. `PublishedSemanticSnapshot` debe ser contrato/lectura estable sobre ese estado, no store paralelo. Esta decisión deriva de [docs/semantic-design-target.md](semantic-design-target.md) y se verificará en PHASE 3.

El estado publicado debe ser observablemente readonly para consumers. Los índices derivados, como scope indexes materializados de forma lazy, deben declararse como proyecciones versionadas o construirse durante publicación; no deben confundirse con la verdad semántica autoritativa.

Estado 2026-05: `KnowledgeBase` ya movió `scopeIndex` fuera de `publishedState` a una proyección versionada con owner explícito (`KnowledgeBase.scopeIndexProjection`) y el scanner estructural bloquea nuevas escrituras a `publishedState` desde query paths.

## 10. SemanticQueryFacade y SemanticQueryResult

`SemanticQueryFacade` debe ser el límite para resolver identidad semántica, receivers, callables, inheritance, enum context y targets de workspace/catalog. `SemanticQueryResult` debe transportar confidence, evidence, reason codes y stale/degraded status cuando corresponda.

`SemanticQueryResult.query` debe reflejar la policy efectiva usada por el resolver. No puede declarar `allowStaging`, `allowGenerated` o `allowExternal` con defaults permisivos si el consumer real los bloqueó.

Estado 2026-05: `SemanticQueryFacade` ya copia la policy efectiva del consumer al envelope (`sourceOriginPolicy`, `budgetMs`, `resultCap`, `identifier`, `qualifier`), `SemanticQueryResult` publica `source` y degradación base por timeout/dynamic, y `rename` dejó de depender de `ResolvedTargetInfo` crudo en su preflight principal. La señal `stale` sigue estando por encima, en la serving pipeline.

## 11. Modelo de caché

Las caches son proyecciones invalidables, no verdad. Cada key debe declarar owner, value, discriminadores, política de stale, memoria y evicción.

PHASE 5 fija una separación obligatoria: `DocumentCache` es cache hot/warm de memoria y no puede ser la fuente del checkpoint semántico completo. La persistencia debe tener owner propio, particionable por proyecto, capaz de conservar el corpus semántico publicado aunque la LRU de memoria evicte documentos.

Todo cache key contract debe ser simétrico: cada discriminador declarado debe participar de la key, stale matcher, invalidation scope y tests. Locale y `sourceOrigin` son discriminadores de presentación/policy; no deben cambiar la identidad semántica base salvo que el consumer declare una razón.

La persistencia debe serializar writes por workspace/partition. Journal append, checkpoint persist, serving snapshot persist y maintenance/compaction deben pasar por una cola con `flush()` explícito y telemetry de pending/failed writes.

El objetivo incluye un `CacheRegistry` declarativo liviano: owner, key fields, value type, invalidation policy, memory budget, persistence policy, stale policy y tests de fitness. Este registry no debe forzar reescritura de todas las caches; primero debe hacer observables los contratos.

## 12. Modelo de invalidación y epoch

El modelo objetivo distingue `documentVersion`, `documentFingerprint`, `semanticEpoch`, `kbVersion`, `sourceOrigin`, `locale`, `projection` y `ruleVersion`. La auditoría PHASE 0 abrió `FINDING-002` para confirmar un posible drift en completion resolve.

PHASE 5 añade que caches de contexto activo no deben invalidarse por `semanticEpoch` global si existe evidencia más granular. `HotContextCache` debe evolucionar hacia un `ActiveContextVersion` compuesto por URI, document fingerprint, sourceOrigin, project/dependency closure y versiones de ancestors relevantes, con fallback conservador al epoch global solo cuando falte evidencia.

Flujo objetivo de invalidación:

```txt
Document/workspace change
  -> classify dirty scope
  -> invalidate exact cache scopes
  -> schedule affected facts/indexes by lane
  -> publish new snapshot atomically
  -> notify projection/read-only consumers with freshness receipt
```

Las invalidaciones globales quedan como fallback explícito. Todo fallback debe emitir métrica y reason code para detectar sobre-invalidación.

## 13. Scheduler lanes y worker pool

El scheduler objetivo mantiene lanes `Interactive`, `Near` y `Background`, cancela trabajo obsoleto y evita bloquear el event loop. CPU-bound parsing/facts debe usar worker pool con costos de serialización medidos; I/O-bound discovery debe usar APIs asíncronas y concurrencia acotada.

Node.js `worker_threads` se adopta solo para trabajo CPU-bound. Discovery y lectura de archivos deben usar I/O asíncrona/concurrencia acotada; el worker pool debe medir structured clone, payload size y memoria transferida.

PHASE 4 endurece el contrato de cancelación: solicitar cancelación no libera ownership del slot hasta que el trabajo se detiene o queda aislado por generation/epoch guard. Watcher intake, indexer y worker pool deben recibir token o abort signal, y ningún writer puede publicar estado si su generation quedó stale.

## 14. Diseño hot path de providers

Cada provider debe declarar lane, presupuesto, cache, fuente de datos, fallback degraded, cancelación y stale checks. Hover, completion, signature help, definition, references, rename, diagnostics y semantic tokens deben delegar identidad semántica a `SemanticQueryFacade` salvo excepciones estructurales documentadas.

Las excepciones de fast path estructural, como keyword catalog checks, scope-local lookup o workspace symbol index queries, deben estar en una allowlist probada con budget/cap/sourceOrigin explícitos. El contrato objetivo privilegia `SemanticQueryResult` y modelos derivados; `ResolvedTargetInfo`/`DocumentQueryContext` crudos son detalles internos o capas temporales de compatibilidad.

Las operaciones largas deben exponer cancelación y, cuando el protocolo/superficie lo permita, progreso, resultados parciales y receipts de estado `stale` o `degraded`.

Open/change document es un hot path propio: debe hacer pin/snapshot local, parse estructural bounded y diagnostics Tier 0/1 inmediatos. Diagnostics semánticos, invalidación transitiva, cache fanout y republish amplio deben moverse a Near/Background con debounce, fanout caps y stale receipts.

PHASE 6 añade un contrato explícito de provider adapter: cada entrypoint interactivo debe exponer `feature`, `consumer`, `lane`, `budgetMs`, `sourceScope`, `cachePolicy`, `staleGuard`, `cancelPolicy`, `degradedResult`, métricas y tests de conformidad. Hover/completion/signature/definition son la referencia inicial; references, rename, CodeLens, semantic tokens, document symbols y workspace symbols deben migrar hacia adapters finos o quedar en una allowlist estructural testeada.

References/rename/linked editing/CodeLens no deben depender de leer pools project-wide y hacer regex textual por request como ruta normal. El objetivo es una proyección de ocurrencias indexada por símbolo/familia, con fallback textual solo para documentos no indexados y siempre con receipts degraded, caps y métricas de source pool.

## 15. Diagnostics por tiers

La arquitectura objetivo separa Tier 0 safety/suppression, Tier 1 syntax local, Tier 2 document semantic, Tier 3 project semantic y Tier 4 advisory/report-only. PHASE 7 confirma que el estado actual `syntactic/full` es insuficiente como contrato ejecutable.

El pipeline objetivo declara por regla: tier, lane, budget, cap, sourceOrigin policy, confidence floor, reason codes, stale behavior y policy de supresión/ruido. Tier 0/1 puede publicarse inmediatamente desde el documento activo; Tier 2/3 debe usar scheduler y snapshot/fingerprint; Tier 4 debe preferir report-only o severidad baja con receipt advisory salvo evidencia fuerte.

`buildDiagnosticsForDocument(..., 'full')` puede sobrevivir temporalmente como compat layer, pero debe componerse desde builders tiered. Current Object Context, technical debt reports y Diagnostics Explainability deben consumir snapshots por tier y no invocar diagnostics full como cálculo profundo inline.

## 16. Estrategia de semantic tokens

Semantic tokens deben preferir facts estructurales/hot indexes y evitar resolución global por token. Deben contemplar full/range/delta, resultId/previousResultId, cache/fingerprint y confidence.

La arquitectura objetivo usa semantic tokens full para disponibilidad inicial, range cuando el editor lo solicite y delta/resultId solo cuando pueda garantizar invalidación por fingerprint/snapshot sin pintar tokens obsoletos.

PHASE 6 confirma que semantic tokens debe tratarse como proyección incremental, no como provider que resuelve cada identificador en cada request. La estrategia objetivo separa declarations estructurales, catalog tokens y usages semánticos; si el budget se agota, se devuelven tokens estructurales con confidence/degraded y se difiere enriquecimiento semántico.

PHASE 7 añade que `resultId`/`previousResultId` deben estar respaldados por estado versionado propio: URI, documentVersion, documentFingerprint, semanticEpoch/kbVersion, sourceOrigin, legend version y hash de payload. El builder debe ser efímero por respuesta; si `previousResultId` no coincide con el snapshot actual, el servidor devuelve full tokens o structural-only degraded tokens, no edits basados en estado ambiguo.

Wave 05 reduce esa brecha: `SemanticTokensResultState` ya serializa `sourceOrigin`, `legendVersion` y `createdAt`, y el provider real degrada a full cuando cualquiera de esos discriminadores deriva; siguen abiertos `range`, la validación host `vscode-test` dedicada y las métricas de payload/delta hit rate.

## 17. Submodelo DataWindow

DataWindow es subdominio separado y advisory por defecto. Debe preservar origen `.srd`/generated source, confidence gates, bindings, columnas, controles y property paths sin inyectarse como PowerScript normal.

El submodelo objetivo puede exponer fast context para `.srd`, `DataObject`, `GetChild`, columnas, computed fields, property paths, buffers y built-ins, pero debe usar fingerprint documental real cuando exista y no depender de epoch global como sustituto permanente de identidad documental.

Wave 07 abre el boundary mínimo real en `src/server/semantic/submodels/datawindow/`: por ahora mueve sólo el wrapper bounded de `DataWindow bindings`, mantiene el path legacy como re-export compatible y añade receipt read-only en Current Object Context. Siguen pendientes la migración segura de helpers/tipos adicionales y la convergencia de consumers fuera de ese primer slice.

## 18. Submodelo SQL/Transaction

SQL embebido/dinámico y transaction bindings deben modelarse como anchors/submodelo propio, con seguridad ante strings parciales y análisis profundo fuera de hot paths.

Los SQL anchors deben ser bounded por consumer. El modelo objetivo no valida DBMS/schema ni stored procedure signatures en hot path; publica keyword/range/preview/transaction target/confidence y receipts de truncación cuando aplique.

## 19. Submodelo external/native

External/native declarations, PBX/PBNI y DLL metadata deben ser advisory, con source origin explícito, incertidumbre documentada y sin inventar APIs oficiales.

El contrato objetivo se limita a metadata declarada (`library`, `rpcfunc`, `alias`, dependency kind `dll/pbx/unknown`) y riesgo de invocación. ABI, bitness, existencia física de DLL/PBX y PBNI introspection quedan fuera del runtime interactivo salvo rail opcional explícito.

## 20. Object Explorer y read-only projections

El objetivo es reemplazar dependencias en manifiestos planos por proyecciones lazy/paginadas con cursores, filtros, caps, receipts y refresh server-driven. `FINDING-001` registra la brecha inicial observada.

El cliente debe comportarse como `TreeDataProvider` lazy: `getChildren` de un nodo visible solicita una página o conjunto de hijos estable, no todo el universo de objetos. El servidor es dueño de la proyección y de los receipts de truncación/paginación.

Current Object Context se incluye en el mismo principio de proyecciones read-only: el summary por cursor debe ser instantáneo y las secciones costosas (`diagnostics`, `references`, `DataWindow bindings`, `SQL anchors`, `relatedFiles`) deben cargarse lazy o desde near/background con cache por URI/fingerprint/line bucket. Cambios de selección no deben ejecutar diagnostics full ni references del documento completo.

Runtime health/status también debe tener niveles de snapshot. El status bar consume un snapshot pequeño/cacheado; dashboards completos y maintenance inspection viven en comandos/reportes con TTL, budget y receipts de stale data.

PHASE 8 añade un contrato común para superficies read-only: cada proyección debe exponer de forma compacta freshness, source snapshot, cache/projection owner, caps, truncation reason, readiness/stale/degraded state, redaction receipt y refresh trigger cuando aplique. Este contrato puede entrar como envelope opcional para mantener compatibilidad de API pública.

Wave 05 ya introdujo ese envelope opcional en la API pública (`ApiReadOnlyProjectionEnvelope`) y lo pilotó en `workspace-check`. Wave 06 ya aterrizó el siguiente slice real: Object Explorer consume una proyección paginada server-owned, Current Object Context acota SQL anchors por consumer con truncation receipt y las views runtime principales comparten microcopy compacta de `loading/ready/paged/degraded/error`; siguen pendientes la adopción más amplia de receipts/redaction owner y la cobertura stale/readiness en surfaces restantes.

Los bundles de soporte e IA no deben usar el budget solo para recortar salida. Deben planificar ejecución: estimar coste/tokens por sección, priorizar por intent, omitir antes de ejecutar cuando el presupuesto no alcanza y registrar reason codes de omisión. La poda final sigue siendo guard defensivo, no la primera línea de control de coste.

Estado 2026-05: el bundle IA público ya hace ese preflight de ejecución, publica un receipt compacto de `executionPlan` y deja la poda final como guard defensivo; la extensión del mismo patrón a bundles de soporte sigue abierta.

PHASE 21 añade el contrato de instantaneidad percibida: toda superficie read-only debe renderizar `loading`, `degraded`, `stale`, `ready`, `paged` y `error` de forma uniforme, con refresh manual y receipts visibles cuando el servidor trunca, pagina, usa cache stale o degrada por indexing incompleto. Hover y completion deben tener tests que demuestren utilidad mínima durante `discovering/indexing`, especialmente para built-ins/catalog symbols.

## 21. Warm start y persistencia

El warm start objetivo debe restaurar manifiestos/facts seguros con fingerprints y versiones, publicar readiness parcial rápidamente y revalidar en background. PHASE 4, PHASE 18 y PHASE 19 definirán métricas y riesgos.

PHASE 4 fija que warm start exitoso no puede equivaler a “restaurar y luego leer/hashear todos los archivos”. El checkpoint debe incluir o derivar un manifest validable que permita saltar `indexWorkspace` completo cuando discovery snapshot, project model, cache schema y fingerprints sean compatibles. El fallback sigue siendo full index si falta evidencia.

PHASE 5 precisa que ese checkpoint no puede depender de una LRU de `DocumentCache`. Debe persistir records semánticos completos o particionados con write ordering garantizado; `DocumentCache` puede hidratarse desde el checkpoint como optimización, pero no definir qué documentos existen en el checkpoint.

## 22. Estructura objetivo de módulos

La estructura preliminar se detallará en PHASE 22. Dominios esperados: semantic input/facts/indexes/snapshot/query/cache/scheduler/submodels, runtime, features, diagnostics, indexing, workspace, public API, client views, shared contracts/protocol/types.

PHASE 9B confirma que los orquestadores actuales deben partirse por dominio sin big-bang: `client/extension` como registro fino, `server/handlers/featureHandlers` como registry de provider adapters, `server/handlers/reportCommandHandlers` como routers por read-only tool, y `shared/publicApi` dividido en contracts/schemas/method descriptors con barrel estable.

PHASE 22 fija el mapa objetivo de ownership:

```txt
src/server/semantic/input/          inputs versionados, intake de documentos y dirty scopes
src/server/semantic/facts/          generación incremental de facts
src/server/semantic/indexes/        hot indexes, occurrences, dependency/closure indexes
src/server/semantic/snapshot/       PublishedSemanticSnapshot, epochs, freshness
src/server/semantic/query/          SemanticQueryFacade y SemanticQueryResult
src/server/semantic/cache/          cache registry, key contracts, invalidation policies
src/server/semantic/submodels/      datawindow/, sql/, native/
src/server/diagnostics/             registry, tiers, pipeline, publishers
src/server/features/                adapters LSP delgados por provider
src/client/views/                   TreeDataProvider/list views lazy
src/client/panels/                  view models y panel UI state
src/shared/contracts/               envelopes, cache/provider/projection contracts
src/shared/protocol/                custom LSP/protocol DTOs
```

La migración no debe mover archivos por estética. Cada move/split requiere owner, tests de paridad, re-export temporal cuando aplique y fitness function que impida reintroducir la responsabilidad vieja.

## 23. Simplificación estructural y organización modular

El objetivo es reducir clases/funciones grandes, duplicación de DTOs/proyecciones/cache keys y lógica semántica provider-specific. PHASE 9B confirma como prioridades estructurales: diagnostics registry/split, submodelo DataWindow modular, provider/facade convergence, split de orquestadores y invariant suite de index/cache state.

Los splits deben preservar comportamiento con re-exports temporales y tests de paridad. No se acepta mover código solo para reducir líneas si no mejora ownership, testabilidad o source-of-truth.

## 24. Retirada de legacy y plan de retirement

Todo path legacy activo debe tener owner, tests de paridad, compat layer temporal, criterios de retirada y spec. `plugin_old` sigue siendo referencia, nunca dependencia runtime.

PHASE 9 confirma que no se observaron imports runtime desde `src/**` hacia `plugin_old/**`; aun así el aislamiento debe convertirse en gate ejecutable de arquitectura. ORCA legacy y PBAutoBuild moderno quedan como rails opcionales con ownership explícito; su retiro o coexistencia se planifica en PHASE 23/backlog, no por borrado oportunista.

El backlog/spec status también forma parte del retirement: si un `PB-ARCH-*` queda absorbido por un `PB-SEMANTIC-*`, debe declararse como `Superseded`, `Done` o `Open por conformance` en un solo owner de estado.

## 25. Estrategia de eliminación de código duplicado

Contratos de cache, DTO/projection builders, diagnostics rules, symbol lookup, DataWindow parsing, SQL detection y facade adapters deben tener un owner claro. PHASE 9 registra que la duplicación de resolver logic se absorbe en la convergencia de `SemanticQueryFacade`; diagnostics requiere registry; DataWindow requiere submodelo modular; presentation/read-only builders requieren contratos compartidos antes de refactors masivos.

## 26. Estrategia de alineación a source-of-truth

Las superficies read-only, providers, diagnostics y herramientas AI deben consumir snapshots/facade/proyecciones oficiales; no deben reconstruir semantics profundas desde documentos o manifests paralelos.

La confidence sin evidence o reason code debe considerarse degradada salvo casos estructurales allowlisted. Las read-only surfaces deben mostrar o transportar receipts cuando filtran, truncan o bloquean por policy.

PHASE 9B añade una regla de invariants: workspace state, analysis cache, DocumentCache, KnowledgeBase y persistence deben tener pruebas compartidas que demuestren coherencia de fingerprint, sourceOrigin, snapshot y estado indexed/restored. Las caches siguen siendo proyecciones, no verdad.

## 27. Roadmap de refactor mayor

El roadmap final se cerrará en PHASE 23 y se convertirá en backlog completo en PHASE 13, solo después de cerrar PHASE 24. La secuencia preliminar de migración es:

1. Congelar contracts y tests faltantes: cache key symmetry, diagnostics tiers, semantic tokens delta/result state, provider adapter contract, read-only projection envelope y architecture conformance scanner.
2. Extraer adapters finos de providers y redirigir resolución semántica a `SemanticQueryFacade` con allowlists estructurales.
3. Centralizar caches/projections y añadir invariants compartidos entre `WorkspaceState`, `DocumentCache`, `analysisCache`, `KnowledgeBase` y persistence.
4. Separar submodelos DataWindow, SQL y native/external con advisory gates, caps, sourceOrigin y confidence.
5. Reemplazar manifiestos planos/read-only pulls por proyecciones server-owned lazy/paginadas.
6. Endurecer worker/scheduler/performance events y añadir corpus sintético 10,000+ con CI/nightly split.
7. Retirar compat layers y legacy paths solo cuando existan parity tests, rollback y criterios de retirada cumplidos.

Todo refactor mayor seguirá modernización incremental tipo Strangler: adapters temporales, coexistencia limitada, tests de paridad, rollback y criterios explícitos de retirada.

PHASE 23 ordena los grandes bloques así: primero contracts/tests (`SemanticQueryResult`, diagnostics tiers, tokens delta, cache registry, provider adapters), después extracción de diagnostics y DataWindow, después split de orquestadores, después proyecciones lazy/read-only y, finalmente, retirement de compat layers. Ninguna retirada de legacy se considera completa sin spec de retiro, gate de aislamiento y test de paridad.

## 28. Métricas y performance gates

Métricas objetivo: latencia interactiva, hit ratio, no-op publish, throughput de indexación, worker busy/idle, event loop blocking, diagnostics tiers, semantic tokens, payload de Object Explorer, memoria, GC y LSP payload size.

PHASE 10 confirma que existe una base útil (`InteractiveServingStatsTracker`, runtime journal, cache stats, memory budgets, payload budgets y performance gate), pero el contrato objetivo debe ser un `PerformanceEvent` homogéneo. Cada provider, diagnostics tier, semantic tokens full/delta, read-only projection y workload de background debe emitir eventos con método, URI/version/fingerprint, workspace/project, lane, cache outcome, fallback, cancel/error, payload/result size, budget y semantic epoch. Los snapshots agregados deben exponer promedios y percentiles de ventana acotada; los artefactos CI deben guardar métricas JSON estables.

Wave 08 valida el primer corte ejecutable de ese objetivo: `PerformanceEvent` ya existe, `showStats` publica snapshots bounded de scheduler/worker/event loop/memory pressure y el gate rápido incorpora un corpus sintético smoke mientras el lane `10k` completo vive en un carril opcional/report-only con artefacto JSON propio.

Worker pool y scheduler lanes deben reportar queue depth, busy/idle, wait/run duration, preemptions, restarts, throughput y event-loop delay/GC pressure cuando esté disponible. Estas métricas son observabilidad; no deben introducir trabajo pesado ni serializar payloads completos.

El gate objetivo necesita un corpus semántico sintético 10,000+ que combine SR*, herencia, DataWindow `.srd`, SQL anchors, external/native y PFC/STD-like patterns. Los tests parciales de KB/discovery/watcher no sustituyen esa matriz integral.

PHASE 4 agrega gates mínimos: warm resume no lee/hashea todos los SR* cuando el checkpoint es compatible; cancelación background no permite commits stale ni solapamiento incompatible; `onDidOpen`/`onDidChangeContent` no ejecutan cascadas semánticas síncronas fuera del presupuesto; discovery reporta cancel latency y throughput con caps.

PHASE 5 agrega gates de cache: checkpoint persisted documents no queda limitado por `DocumentCache.capacity`; append journal concurrente restaura todas las mutaciones; cada campo del key descriptor tiene prueba de simetría builder/matcher; HotContext no se invalida por cambios no dependientes cuando hay dependency evidence.

PHASE 6 agrega gates de providers: ningún provider interactivo puede leer pools project-wide/workspace-wide, resolver por identificador en bucles no acotados, recalcular reports profundos por selección o construir payloads planos grandes sin adapter contract, budget, cancelación/stale/degraded behavior y métricas. Las excepciones estructurales deben estar allowlisted y probadas.

PHASE 18 endurece observabilidad: `WorkerPool` debe exponer queue depth, busy/idle, wait/run duration, throughput, failures/restarts y serialization cost; scheduler lanes deben publicar wait/run/preemption por lane; runtime debe muestrear event-loop delay/utilization y GC/memory pressure con bajo overhead. Activación y startup deben entrar en el mismo esquema de eventos o en un snapshot de runtime compatible.

PHASE 19 define el gate 10,000+: corpus sintético parametrizable con SRU/SRW/SRM/SRA/SRF/SRD/SRP, jerarquías largas, PFC/STD-like patterns, DataWindow `.srd`, SQL embebido/dinámico, external/native, miles de funciones/eventos, edición activa mientras indexa, file add/delete/rename, warm start, Object Explorer grande, references/rename y semantic tokens. El gate rápido de CI puede usar una muestra reducida; el gate nightly/optional debe ejecutar escala completa y guardar artefactos JSON.

PHASE 20 requiere que `release:verify` no sea solo “tests pasan”, sino “no hay regresiones de arquitectura/performance”. Los gates objetivo incluyen docs drift, architecture conformance, no hot path scans, cache discriminator coverage, Object Explorer sin truncación global, hover/completion while indexing, payload budgets, diagnostics tiers, semantic tokens full/range/delta, indexing throughput, memory/event loop y corpus 10,000+ en lane apropiada.

## 29. Architecture fitness functions

Se definirán en PHASE 17. Gates esperados: no provider bypass del facade, no store paralelo a `KnowledgeBase.publishedState`, no full scans en hot paths, cache discriminators completos, Object Explorer sin truncación global y submodelos advisory fuera de paths interactivos profundos.

PHASE 1 fija que estos gates deben ser automáticos y preferentemente estructurales. `FINDING-004` registra que la suite existente es valiosa pero todavía parcial para este objetivo.

Los gates objetivo deben usar análisis estructural, no solo búsqueda textual: AST/import analysis, allowlists por consumer, verificación de policies transportadas, no-mutación de snapshots publicados y golden matrix cross-surface para targets compartidos.

PHASE 11 confirma que los tests existentes son numerosos y útiles, pero los gates de conformance deben evolucionar: `semanticArchitectureConformance` no debe quedarse en patrones textuales, el hotspot guard debe funcionar como ratchet con specs de reducción cuando un archivo ya supera budget, y cada provider crítico debe tener unit + integration mínima del entrypoint LSP. Diagnostics tiers y semantic tokens delta/result state son bloqueadores contract-first para los refactors de PHASE 7.

PHASE 17 define los gates mínimos ejecutables:

- no provider resuelve identidad semántica fuera de `SemanticQueryFacade` salvo allowlist estructural;
- no store semántico paralelo a `KnowledgeBase.publishedState`;
- no scans completos de workspace en hot paths;
- cache contracts con discriminadores completos y tests de simetría;
- diagnostics declarados por tier/registry;
- semantic tokens sin resolución global por token y con estado full/range/delta versionado;
- Object Explorer sin truncación global como sustituto de paginación;
- read-only surfaces con projection envelope y receipts;
- DataWindow/SQL/native deep analysis solo advisory/background;
- cada provider declara lane, budget, cancelación, cache, stale/degraded behavior y métricas;
- detección de ciclos de imports en dominios semantic/indexing/runtime/shared.

Estado 2026-05: `test:architecture:rapid` ya ejecuta `tools/architecture-conformance-scanner.mjs` con AST/import graph, JSON estable y artefacto en `artifacts/performance/architecture-conformance-report.json`. El lane queda protegido por fixtures negativos para provider bypass, import cycle, cache contract incompleto, parallel store y full scan en hot path.

## 30. Simplification and maintainability fitness functions

Se definirán en PHASE 24. Gates esperados: no ciclos en módulos semánticos/runtime/indexing, límites de tamaño, no builders duplicados, no legacy activo sin retirement spec y no source-of-truth paralelo.

Los refactors se harán como transformaciones pequeñas y preservadoras de comportamiento, apoyadas por tests, usando Extract/Move/Split/Merge/Delete solo cuando reduzcan complejidad real o centralicen un contrato duplicado.

PHASE 24 define gates de mantenibilidad:

- límites de tamaño por archivo/clase/función con ratchet y excepción documentada;
- no builders duplicados de cache key, DTO/projection o diagnostics rules;
- no provider-specific semantic resolution fuera de boundaries permitidos;
- no import cycles en semantic/indexing/runtime/features/shared;
- no legacy activo sin owner, replacement, criteria y retirement spec;
- no client pull directo de proyecciones pesadas si existe server projection;
- no DataWindow/SQL/native deep logic dentro de providers interactivos;
- no nuevo store source-of-truth fuera de snapshot/facade;
- todo compat layer temporal debe tener criterio de retirada verificable.

## 31. Decisiones abiertas

- Confirmar si el contrato de Object Explorer debe ser comando LSP custom, API compartida o ambos.
- Confirmar si `documentFingerprint` de completion resolve es bug real, nombre ambiguo o metadata no usada para invalidación.
- Confirmar límites reales de references source pools y si ya existe índice de ocurrencias suficiente.
- Confirmar estrategia de warm start/persistencia compatible con seguridad de fingerprints y multi-root.
- Confirmar si `critical-initialization` debe dividirse en restore, discovery e indexing con policies distintas de preemption/throttling.
- Confirmar el manifest mínimo para que warm resume pueda saltar full read/hash de source files.
- Confirmar fanout máximo de invalidación semántica permitido en open/change antes de diferir a scheduler.
- Confirmar si el corpus semántico persistido sale de `KnowledgeBase.exportDocumentRecords()` o de un writer write-through del indexer.
- Confirmar presupuesto de disco y retención para checkpoints particionados 10,000+.
- Confirmar si `prefix` seguirá como discriminador de completion cache o debe retirarse del contrato hasta tener consumer.
- Confirmar si el fallback `DataWindowFastContext.documentFingerprint -> kb.semanticEpoch` es aceptable solo como degraded metadata o debe endurecerse.
- Confirmar owners de estado para DataWindow/SQL/native entre backlog y specs absorbidos.
- Definir caps por consumer para SQL anchors y receipts de truncación.
- Confirmar si `scopeIndex` se materializa al publicar o como cache derivada externa al estado publicado.
- Confirmar el set de APIs crudas de `SemanticQueryFacade` que quedan como compat temporal frente a `SemanticQueryResult`.
