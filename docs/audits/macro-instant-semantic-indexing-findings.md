# Registro de hallazgos — Macroauditoría Instant Semantic and Indexing Runtime

Este registro es la fuente viva de hallazgos de la auditoría `audit-instant-semantic-indexing`. Cada entrada conserva su estado aunque se corrija durante la auditoría.

## Estado inicial

- **Auditoría:** Macro Audit — Instant Semantic Runtime, Indexing, Refactoring and Architecture Target.
- **Artefacto relacionado:** [docs/audits/macro-instant-semantic-indexing-audit.md](macro-instant-semantic-indexing-audit.md).
- **Arquitectura objetivo:** [docs/instant-semantic-indexing-target.md](../instant-semantic-indexing-target.md).
- **Regla de backlog:** los IDs propuestos no se agregan al backlog final hasta completar PHASE 24 y ejecutar PHASE 13.

## Mapa PHASE 13 — Hallazgos a backlog derivado

PHASE 13 generó los ítems de [docs/backlog.md](../backlog.md) después de completar PHASE 24. Este mapa mantiene el vínculo finding -> backlog aunque algunas entradas individuales conserven el texto histórico “propuesto” de la fase donde se descubrieron.

| Findings | Backlog derivado |
| --- | --- |
| FINDING-001 | `PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01` |
| FINDING-002, FINDING-017, FINDING-018 | `PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01` |
| FINDING-003, FINDING-020, FINDING-021, FINDING-022, FINDING-023, FINDING-024 | `PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01` |
| FINDING-004, FINDING-040 | `PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01`, `PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01` |
| FINDING-005 | `PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01` |
| FINDING-006 | `PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01` |
| FINDING-007, FINDING-036 | `PB-PERF-P2-10K-SEMANTIC-CORPUS-01`, `PB-CI-P1-REGRESSION-GATE-10K-PAYLOAD-01` |
| FINDING-008 | `PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01` |
| FINDING-009, FINDING-010 | `PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01` |
| FINDING-011, FINDING-015, FINDING-016, FINDING-033 | `PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01`, `PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01` |
| FINDING-012, FINDING-013 | `PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01` |
| FINDING-014 | `PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01` |
| FINDING-019, FINDING-026, FINDING-039 | `PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01` |
| FINDING-025, FINDING-029 | `PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01` |
| FINDING-027, FINDING-043 | `PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01`, `PB-UX-P2-DEGRADED-STALE-MESSAGING-UI-01` |
| FINDING-028 | `PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01` |
| FINDING-030 | `PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01` |
| FINDING-031, FINDING-038 | `PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01`, `PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01`, `PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01` |
| FINDING-032 | `PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01` |
| FINDING-034, FINDING-035, FINDING-042 | `PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01`, `PB-CI-P1-REGRESSION-GATE-10K-PAYLOAD-01` |
| FINDING-037 | `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01` |
| FINDING-041 | `PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01` |
| FINDING-044 | Fixed during PHASE 15; sin backlog abierto. |

## FINDING-001 — Object Explorer depende de manifiesto plano de gran tamaño

- **Fase:** PHASE 0 — Audit preparation and evidence map.
- **Severidad:** High.
- **Tipo:** Performance bottleneck.
- **Área:** Object Explorer.
- **Evidencia:** `src/server/features/semanticWorkspaceManifest.ts` define `DEFAULT_MAX_OBJECTS = 100000`, `DEFAULT_MAX_SYMBOLS = 100000`, materializa `objects` con `kb.queryEntities({ kinds: [EntityKind.Type], limit: maxObjects })` y `exportedSymbols` con `queryApiSymbols('', kb, maxSymbols)`; `src/client/objectExplorerModel.ts` construye un árbol completo por proyecto/biblioteca/tipo desde `manifest.objects` y solo muestra un mensaje cuando `manifest.limits.objectsTruncated`.
- **Comportamiento observado:** la superficie de Object Explorer consume un manifiesto plano amplio y agrupa en cliente; no se observó contrato paginado/lazy en la evidencia de PHASE 0.
- **Comportamiento esperado:** Object Explorer debe usar proyecciones de servidor paginadas o lazy, con filtros, cursores, estados `loading/degraded/stale/ready`, límites explícitos y acceso completo a objetos sin depender de truncación global.
- **Riesgo:** una carga inicial de manifiesto grande puede inflar memoria, payload LSP/API y tiempo de renderizado del cliente, especialmente con miles de objetos.
- **Impacto hot path:** sí; afecta reactividad de UI/read-only surfaces si se solicita o refresca mientras el servidor indexa o publica snapshots.
- **Impacto 10,000+ archivos:** alto; 10,000+ archivos pueden generar decenas de miles de tipos/símbolos y un árbol cliente costoso.
- **Impacto PowerBuilder:** afecta navegación por objetos PowerBuilder, bibliotecas/PBL folders, tipos heredados, ventanas, user objects, DataWindows y manifiestos grandes.
- **Recomendación:** diseñar una proyección paginada/lazy de Object Explorer con contrato de servidor, cache de proyección, cursores, filtros por proyecto/biblioteca/tipo y métricas de payload.
- **Requiere refactor:** sí.
- **Resumen del refactor:** mover la construcción pesada de árbol completo hacia una proyección server-side incremental y mantener en cliente solo nodos visibles o páginas.
- **Backlog relacionado:** `PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** benchmark con manifiesto sintético 10,000+ archivos, payload size, tiempo de primer render, expansión lazy y pruebas de no truncación global.
- **Estado:** Open.

## FINDING-002 — `documentFingerprint` de completion resolve parece usar epoch global

- **Fase:** PHASE 0 — Audit preparation and evidence map.
- **Severidad:** Medium.
- **Tipo:** Contract violation.
- **Área:** Cache.
- **Evidencia:** `src/server/serving/cacheKeyContract.ts` documenta que `documentFingerprint` debe cambiar solo cuando cambia el documento; `src/server/features/completion.ts` crea `CompletionResolveContext` con `documentFingerprint: kb.semanticEpoch`.
- **Comportamiento observado:** el nombre del discriminador sugiere fingerprint de documento, pero la evidencia inicial muestra uso de epoch semántico global en completion resolve.
- **Comportamiento esperado:** los datos de resolve/cache deben distinguir claramente `documentFingerprint` por contenido del documento y `semanticEpoch`/`kbVersion` global, sin sobreinvalidar ni subinvalidar.
- **Riesgo:** un epoch global usado como fingerprint puede reducir hit ratio por sobreinvalidación o encubrir un contrato ambiguo que otros providers copien.
- **Impacto hot path:** sí; completion resolve es interactivo y sensible a latencia.
- **Impacto 10,000+ archivos:** medio; en workspaces grandes los epochs globales cambian más durante indexación y pueden invalidar resolve data innecesariamente.
- **Impacto PowerBuilder:** afecta documentación/resolve de funciones, variables, DataWindow bindings y símbolos del sistema durante edición incremental.
- **Recomendación:** en PHASE 5 confirmar uso real del campo, separar `documentFingerprint` y `semanticEpoch` en contratos de resolve si aplica, y agregar prueba de discriminadores.
- **Requiere refactor:** sí.
- **Resumen del refactor:** centralizar construcción de contextos/cache keys de completion resolve en el contrato de serving cache.
- **Backlog relacionado:** `PB-ARCH-P1-CACHE-FINGERPRINT-CONTRACT-HARDENING-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** pruebas unitarias de cache key/resolve context y smoke de hit ratio con cambios en archivo no relacionado.
- **Estado:** Needs evidence.

## FINDING-003 — References conserva escaneo textual sobre pool de fuentes

- **Fase:** PHASE 0 — Audit preparation and evidence map; confirmado en PHASE 6 — Provider hot path audit.
- **Severidad:** High.
- **Tipo:** Performance bottleneck.
- **Área:** LSP Provider.
- **Evidencia:** `src/server/handlers/featureHandlers.ts` atiende `onReferences` sin `scheduler.runInteractive`, sin serving cache, sin stale guard y sin token de cancelación; antes del provider espera `collectReferenceSourcesForQuery(...)`. `src/server/features/referenceSourcePool.ts` expande candidatos por policy hasta proyecto/workspace y lee cada archivo candidato si no está abierto. `src/server/features/references.ts` recorre `sources`, aplica regex textual y llama `matchesResolvedFamily`, que simula `TextDocument` y vuelve a resolver con facade por ocurrencia candidata.
- **Comportamiento observado:** references mezcla resolución semántica centralizada con una etapa textual project-wide/workspace-wide, sin budget ejecutable, sin partial result y sin cancelación LSP integrada.
- **Comportamiento esperado:** references debe usar pools acotados, índices de ocurrencias o prefiltrado incremental, con budgets, cancelación, parcialidad/stale response y métricas explícitas.
- **Riesgo:** en proyectos grandes, un pool amplio o muchos matches textuales pueden multiplicar llamadas al facade y bloquear o degradar una petición interactiva.
- **Impacto hot path:** sí; Find References es una interacción LSP y puede ejecutarse sobre workspaces grandes.
- **Impacto 10,000+ archivos:** alto si el pool se amplía sin límites estrictos o si no existen índices de ocurrencias/familias.
- **Impacto PowerBuilder:** referencias de eventos, funciones sobrecargadas, variables, PFC/STD patterns y símbolos heredados pueden generar familias amplias y muchas coincidencias textuales.
- **Recomendación:** reemplazar el escaneo textual directo por índice/prefiltro de ocurrencias por símbolo/familia y adapter delgado con budget, cancelación, stale/degraded receipts y métricas de source pool.
- **Requiere refactor:** sí.
- **Resumen del refactor:** migrar el proveedor de referencias a un adapter del facade con source pool presupuestado, índice de ocurrencias y resultados parciales.
- **Backlog relacionado:** `PB-ARCH-P1-REFERENCES-BOUNDED-INDEXED-POOL-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** pruebas de referencias con corpus sintético grande, cancelación, límites de pool, partial results y métricas de tiempo/source count por solicitud.
- **Estado:** Open.

## FINDING-004 — Gates de arquitectura semántica son parciales y textuales

- **Fase:** PHASE 1 — Research modern patterns.
- **Severidad:** Medium.
- **Tipo:** Missing test.
- **Área:** Tests.
- **Evidencia:** `test/server/unit/architectureImports.test.ts` contiene guards útiles de import boundaries y hotspot budget; `test/server/unit/semanticArchitectureConformance.test.ts` usa búsquedas textuales simples para providers y solo comprueba que `cacheKeyContract.ts` contenga `documentSemanticVersion` o `epoch`, sin verificar `documentVersion`, `documentFingerprint`, `kbVersion`, `sourceOrigin`, `locale`, `projection`, `ruleVersion`, lanes, cancelación, degraded behavior ni ausencia amplia de bypass del facade. La investigación PHASE 1 sobre LSP, VS Code API, rust-analyzer/Salsa y arquitectura evolutiva refuerza que estas características deben protegerse con checks automáticos, no solo documentación.
- **Comportamiento observado:** existen gates de arquitectura, pero no una suite completa de fitness functions para los contratos de instant semantics/indexing definidos por la auditoría.
- **Comportamiento esperado:** los contratos críticos deben tener fitness functions verificables: no stores paralelos, no scans globales en hot paths, providers delgados, cache discriminators completos, Object Explorer sin truncación global, submodelos advisory y budgets declarados.
- **Riesgo:** el sistema puede volver a introducir drift semántico, cache keys incompletas o providers pesados sin que CI lo detecte.
- **Impacto hot path:** sí; los gates incompletos permiten regresiones en hover, completion, signature help, definition, references, diagnostics y semantic tokens.
- **Impacto 10,000+ archivos:** alto; sin gates, payloads planos, scans o invalidaciones globales pueden reaparecer y degradar workspaces grandes.
- **Impacto PowerBuilder:** afecta garantías sobre DataWindow/SQL/native como submodelos advisory y sobre resolución PowerScript centralizada.
- **Recomendación:** ampliar la suite de conformance con AST/import analysis y tests de contrato sobre providers, caches, projections, diagnostics tiers, semantic tokens y read-only surfaces.
- **Requiere refactor:** sí.
- **Resumen del refactor:** centralizar fitness functions en tooling/gates reutilizables y convertir checks textuales frágiles en validadores estructurales.
- **Backlog relacionado:** `PB-ARCH-P1-ARCHITECTURE-FITNESS-FUNCTIONS-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** `npm run test:architecture:rapid`, unit tests de gates, fixtures negativos y reporte JSON estable para CI.
- **Estado:** Open.

## FINDING-005 — Estados de backlog y specs de submodelos PowerBuilder no están alineados

- **Fase:** PHASE 2 — PowerBuilder semantic complexity audit.
- **Severidad:** Medium.
- **Tipo:** Docs drift.
- **Área:** Documentation.
- **Evidencia:** [docs/backlog.md](../backlog.md) mantiene `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01`, `PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01` y `PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01` como `Open`; en cambio [specs/PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01.md](../../specs/PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01.md), [specs/PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01.md](../../specs/PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01.md) y [specs/PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01.md](../../specs/PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01.md) declaran esos contratos como `Done` o absorbidos.
- **Comportamiento observado:** el backlog activo y los specs no expresan una misma verdad de estado para DataWindow, SQL y native/external.
- **Comportamiento esperado:** un solo owner por estado: si una spec funcional absorbe una spec arquitectónica, backlog y docs deben decir si queda `Done`, `Open por conformance`, `Partial` o `Superseded`.
- **Riesgo:** agentes posteriores pueden reabrir trabajo ya cerrado o, al revés, saltarse hardening/conformance pendiente creyendo que está terminado.
- **Impacto hot path:** indirecto; afecta priorización de submodelos que alimentan hover, completion, signature help, diagnostics, Object Explorer y Current Object Context.
- **Impacto 10,000+ archivos:** medio; decisiones de escalabilidad dependen de saber qué submodelo está realmente cerrado.
- **Impacto PowerBuilder:** alto en DataWindow, SQL/Transaction y native/external porque son dominios advisory con límites explícitos.
- **Recomendación:** en PHASE 13, normalizar backlog/specs sin duplicar contenido: mantener el backlog como índice de estado y specs como owner de detalle.
- **Requiere refactor:** sí, documental.
- **Resumen del refactor:** consolidar relación `PB-ARCH-*`/`PB-SEMANTIC-*`, estado, dependencia y criterio de conformance.
- **Backlog relacionado:** `PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** link check y docs drift gate tras la normalización.
- **Estado:** Open.

## FINDING-006 — Embedded SQL anchors usan límite por defecto no acotado en superficies read-only

- **Fase:** PHASE 2 — PowerBuilder semantic complexity audit.
- **Severidad:** Medium.
- **Tipo:** Performance risk.
- **Área:** Code.
- **Evidencia:** [src/server/features/embeddedSqlAnchors.ts](../../src/server/features/embeddedSqlAnchors.ts) define `DEFAULT_MAX_ANCHORS = Number.MAX_SAFE_INTEGER`; [src/server/features/currentObjectContext.ts](../../src/server/features/currentObjectContext.ts) llama `collectEmbeddedSqlAnchors(snapshot)` sin pasar un límite explícito. `findSqlRegions` en [src/server/parsing/sqlRegions.ts](../../src/server/parsing/sqlRegions.ts) es heurístico y recorre el contenido enmascarado completo.
- **Comportamiento observado:** una superficie read-only puede materializar todos los anchors SQL de un documento grande por defecto.
- **Comportamiento esperado:** SQL/Transaction debe seguir siendo advisory y bounded, con caps/receipts visibles y posibilidad de pedir más detalle fuera del hot/read-only path.
- **Riesgo:** documentos PowerScript con muchas regiones SQL pueden inflar payloads, memoria y latencia del Current Object Context.
- **Impacto hot path:** medio; Current Object Context y bundles/read-only surfaces se vuelven sensibles al tamaño del documento.
- **Impacto 10,000+ archivos:** medio; en workspaces grandes los documentos calientes pueden tener SQL denso y aumentar coste de snapshots/paneles.
- **Impacto PowerBuilder:** afecta SQL embebido/dinámico, `CONNECT/DISCONNECT USING`, `DECLARE/FETCH/OPEN/CLOSE`, `PREPARE`, `COMMIT/ROLLBACK` y transaction anchors.
- **Recomendación:** definir cap por consumer para anchors SQL, publicar `truncated/receipt` y reservar análisis profundo para comando o background lane.
- **Requiere refactor:** sí.
- **Resumen del refactor:** centralizar `SqlAnchorSubmodel` bounded con owner, confidence y cap por surface.
- **Backlog relacionado:** `PB-ARCH-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** tests de cap/truncation receipt y fixture con documento SQL denso.
- **Estado:** Open.

## FINDING-007 — No existe corpus semántico sintético 10,000+ que combine dominios PowerBuilder

- **Fase:** PHASE 2 — PowerBuilder semantic complexity audit; PHASE 19 — Synthetic 10,000+ workspace and corpus scalability audit.
- **Severidad:** High.
- **Tipo:** Missing test.
- **Área:** Tests.
- **Evidencia:** existen performance tests reales/sintéticos, incluyendo [test/server/performance/knowledgeBase.perf.test.ts](../../test/server/performance/knowledgeBase.perf.test.ts) con `SYNTHETIC_DOCUMENTS = 5000`, [test/server/performance/large-workspace-incremental.perf.test.ts](../../test/server/performance/large-workspace-incremental.perf.test.ts) con `BASELINE_FILES = 256` y bursts incrementales, y corpora reales OrderEntry/PFC/legacy en tests opcionales. PHASE 19 confirmó que no hay un corpus sintético 10,000+ que mezcle objetos SR*, herencia profunda, DataWindow `.srd`, SQL anchors, external/native, PFC/STD-like patterns, diagnostics, semantic tokens, Object Explorer y read-only surfaces.
- **Comportamiento observado:** hay gates de performance parciales y corpora reales, pero no una prueba integral de complejidad semántica PowerBuilder al tamaño objetivo.
- **Comportamiento esperado:** la arquitectura objetivo de 10,000+ archivos debe validarse con corpus reproducible que combine dominios y mida discovery/indexing/providers/caches/payloads.
- **Riesgo:** conclusiones de escalabilidad dependen de extrapolación desde 5,000 docs o corpora opcionales.
- **Impacto hot path:** alto; completion, references, diagnostics, semantic tokens y read-only surfaces pueden degradar por interacciones entre dominios.
- **Impacto 10,000+ archivos:** directo.
- **Impacto PowerBuilder:** cubre todos los dominios obligatorios de PHASE 2.
- **Recomendación:** crear corpus sintético parametrizable y gates de latencia/memoria/payload por dominio; integrar en PHASE 19/20.
- **Requiere refactor:** no necesariamente; requiere test architecture y fixtures.
- **Resumen del refactor:** no aplica al código productivo hasta que el corpus revele fallos concretos.
- **Backlog relacionado:** `PB-PERF-P2-10K-SEMANTIC-CORPUS-01`, `PB-PERF-P1-SYNTHETIC-10000-CORPUS-GATE-01` propuestos; no agregados aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** generación determinística, thresholds documentados y reporte JSON de CI/nightly.
- **Estado:** Open.

## FINDING-008 — Getters readonly de KnowledgeBase mutan `publishedState` al construir `scopeIndex`

- **Fase:** PHASE 3 — Semantic architecture conformance audit.
- **Severidad:** Medium.
- **Tipo:** Contract risk.
- **Área:** Code.
- **Evidencia:** [src/server/knowledge/KnowledgeBase.ts](../../src/server/knowledge/KnowledgeBase.ts) mantiene `publishedState` como fuente viva publicada, pero `getScopeAt` y `getScopeAtReadonly` crean el índice de scopes bajo demanda y hacen `this.publishedState.scopeIndex.set(...)` durante una consulta.
- **Comportamiento observado:** una consulta readonly puede modificar la estructura publicada.
- **Comportamiento esperado:** el snapshot/estado publicado debe ser inmutable desde la perspectiva de consumers; cualquier índice lazy debe vivir en caché derivada versionada o construirse durante publicación.
- **Riesgo:** las fitness functions no pueden afirmar que `publishedState` sea estrictamente readonly; además, caches derivadas pueden confundirse con verdad semántica.
- **Impacto hot path:** bajo/medio; la mutación lazy evita coste inicial, pero ocurre en providers que consultan scopes.
- **Impacto 10,000+ archivos:** medio; scopeIndex lazy puede aparecer de forma no presupuestada en requests interactivos.
- **Impacto PowerBuilder:** afecta resolution de scopes local/argumento/tipo en completion, diagnostics, semantic tokens y query context.
- **Recomendación:** mover `scopeIndex` a proyección/cache derivada por epoch o construirlo en publish; declarar explícitamente si el estado publicado permite índices lazily materialized.
- **Requiere refactor:** sí.
- **Resumen del refactor:** extraer `ScopeIndexProjection` versionada por document fingerprint/semanticEpoch o materializar en `indexDocumentIntoState`.
- **Backlog relacionado:** `PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** test de inmutabilidad/contador de mutaciones para getters readonly y conformance gate contra writes en consultas.
- **Estado:** Open.

## FINDING-009 — `SemanticQueryResult.query.sourceOriginPolicy` no refleja la policy real del consumer

- **Fase:** PHASE 3 — Semantic architecture conformance audit.
- **Severidad:** High.
- **Tipo:** Contract bug.
- **Área:** Code.
- **Evidencia:** [src/server/features/queryContext.ts](../../src/server/features/queryContext.ts) aplica `getQueryConsumerPolicy(...)` y pasa `sourceOriginPolicy` a `resolveTargetEntityDetailed`; sin embargo [src/server/features/semanticQueryFacade.ts](../../src/server/features/semanticQueryFacade.ts) construye `SemanticQueryResult.query.sourceOriginPolicy` con `allowStaging: true`, `allowGenerated: true`, `allowExternal: true` para cualquier consumer.
- **Comportamiento observado:** el resultado puede resolver con una policy restrictiva mientras su metadata declara una policy permisiva.
- **Comportamiento esperado:** el envelope semántico debe transportar la policy efectiva, incluyendo `allowStaging`, `allowGenerated`, `allowExternal`, budget, cap y consumer.
- **Riesgo:** diagnostics/read-only/AI surfaces pueden auditar o explicar decisiones con una policy distinta a la usada realmente, generando falsa certeza sobre staging/generated/external.
- **Impacto hot path:** bajo directo; alto para confianza, explainability y cache keys.
- **Impacto 10,000+ archivos:** medio; source-origin filtering evita ampliar candidate pools en workspaces grandes.
- **Impacto PowerBuilder:** afecta ORCA staging, generated DataWindow, external/native y framework advisory.
- **Recomendación:** derivar el `SemanticQuery` del `DocumentQueryContext`/policy efectiva en vez de hardcodear allow-all; añadir tests por consumer.
- **Requiere refactor:** sí.
- **Resumen del refactor:** `SemanticQueryFacade.resolveTarget` debe obtener la policy efectiva de `queryScopePolicy` y copiarla al envelope junto con cacheability/budget/cap.
- **Backlog relacionado:** `PB-ARCH-P0-SEMANTIC-QUERY-POLICY-ECHO-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** tests para hover/completion/references/rename/diagnostics que verifiquen policy transportada y filtrado de sourceOrigin.
- **Estado:** Open.

## FINDING-010 — Convergencia hacia `SemanticQueryResult` sigue parcial en providers y helpers

- **Fase:** PHASE 3 — Semantic architecture conformance audit.
- **Severidad:** High.
- **Tipo:** Architecture drift.
- **Área:** Code.
- **Evidencia:** [src/server/features/semanticQueryFacade.ts](../../src/server/features/semanticQueryFacade.ts) todavía expone `createPositionContext`, `resolveTargetSymbol` y `resolveTargetInfo` con `DocumentQueryContext`/`ResolvedTargetInfo`; [src/server/features/completion.ts](../../src/server/features/completion.ts) mezcla facade con `kb.getScopeAtReadonly`, `graph.getMembers` y `kb.queryEntities`; [src/server/features/references.ts](../../src/server/features/references.ts) re-resuelve cada match textual con un `TextDocument` simulado; [src/server/features/semanticTokens.ts](../../src/server/features/semanticTokens.ts) combina scope local, catálogo y fallback facade por identificador; [src/server/features/diagnostics.ts](../../src/server/features/diagnostics.ts) mantiene validaciones semánticas propias y solo usa facade en rutas concretas.
- **Comportamiento observado:** el envelope común existe, pero no es la única superficie semántica de providers.
- **Comportamiento esperado:** providers thin consumen DTOs estables de facade/projections; las excepciones estructurales deben estar documentadas, acotadas y cubiertas por conformance tests.
- **Riesgo:** hover, completion, diagnostics, semantic tokens, references y read-only surfaces pueden divergir en identity, confidence, sourceOrigin y degraded behavior.
- **Impacto hot path:** alto; semantic tokens/references/diagnostics hacen loops locales con resolución repetida o checks propios.
- **Impacto 10,000+ archivos:** alto; hybrid routes dificultan imponer budgets/result caps uniformes.
- **Impacto PowerBuilder:** afecta scopes, herencia, overloads, DataWindow adapters, SQL/native advisory y framework packs.
- **Recomendación:** definir una matriz oficial de consumers, DTO permitido y bypass permitido; mover resolución de identity/confidence/evidence a `SemanticQueryFacade` o subfacades por dominio.
- **Requiere refactor:** sí, incremental.
- **Resumen del refactor:** `SemanticQueryFacade` conserva un API estable `SemanticQueryResult`/modelos derivados; raw `ResolvedTargetInfo` queda interno o deprecated con adapters temporales.
- **Backlog relacionado:** `PB-ARCH-P0-SEMANTIC-FACADE-CONVERGENCE-MATRIX-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** conformance tests estructurales por provider y golden matrix cross-surface.
- **Estado:** Open.

## FINDING-011 — Warm resume restaura snapshots pero no puede saltar el full index por `indexDirty`

- **Fase:** PHASE 4 — Indexing and discovery lifecycle audit.
- **Severidad:** High.
- **Tipo:** Performance bug.
- **Área:** Code.
- **Evidencia:** [src/server/handlers/lifecycleHandlers.ts](../../src/server/handlers/lifecycleHandlers.ts) restaura `DocumentCache`/`KnowledgeBase` desde checkpoint antes o después de discovery, pero siempre llama `indexWorkspace` si hay archivos. [src/server/workspace/workspaceState.ts](../../src/server/workspace/workspaceState.ts) deja `indexDirty = true` tras `restoreDiscoverySnapshot`, `replaceFrom`/`recomputeSourceOrigins`, y [src/server/indexer/workspaceIndexer.ts](../../src/server/indexer/workspaceIndexer.ts) solo permite `canSkipFullIndex(...)` cuando `workspaceState.isIndexDirty()` es `false`.
- **Comportamiento observado:** un checkpoint compatible puede restaurar documentos y aun así el indexer recorre todos los archivos para leerlos, hashearlos y confirmar cache hits.
- **Comportamiento esperado:** si el checkpoint de discovery/documentos es compatible con roots, project model y fingerprints, el startup debe publicar readiness warm y evitar full read/hash hasta que una invalidación concreta lo exija.
- **Riesgo:** cold-ish startup en workspaces grandes aunque exista warm cache; degrada activación percibida y consume I/O innecesario.
- **Impacto hot path:** medio; ocurre en background, pero compite por I/O/CPU con primeras interacciones.
- **Impacto 10,000+ archivos:** alto; obliga a tocar miles de archivos por sesión.
- **Impacto PowerBuilder:** afecta corpora con PBW/PBT/PBPROJ/PBL y sourceOrigin restaurado desde cache.
- **Recomendación:** introducir estado `discoveryClean/cacheValidated` o marcar clean tras restore+discovery compatible; validar diferencias por manifest/fingerprint incremental, no por full pass obligatorio.
- **Requiere refactor:** sí.
- **Resumen del refactor:** separar dirty de discovery topology vs dirty de semantic documents; permitir `canSkipFullIndex` con checkpoint validado.
- **Backlog relacionado:** `PB-INDEX-P0-WARM-RESUME-SKIPS-FULL-INDEX-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** test warm restore con N documentos cacheados que no llama `fs.readFile` para cada source file.
- **Estado:** Open.

## FINDING-012 — La cancelación del scheduler libera el slot background antes de que el trabajo cancelado termine

- **Fase:** PHASE 4 — Indexing and discovery lifecycle audit.
- **Severidad:** High.
- **Tipo:** Concurrency risk.
- **Área:** Code.
- **Evidencia:** [src/server/runtime/scheduler.ts](../../src/server/runtime/scheduler.ts) pone `activeBackgroundTask = null` inmediatamente en `cancelActiveBackground(...)`; el `execute(...)` anterior sigue vivo hasta que observe `token.isCancelled`. [src/server/indexer/workspaceIndexer.ts](../../src/server/indexer/workspaceIndexer.ts) revisa cancelación entre batches, mientras los worker tasks en curso siguen resolviendo. [src/server/workspace/watchedFileIntake.ts](../../src/server/workspace/watchedFileIntake.ts) no recibe token y solo se cancela antes de empezar desde [src/server/server.ts](../../src/server/server.ts).
- **Comportamiento observado:** el planificador puede admitir otro trabajo background/near mientras una tarea cancelada sigue haciendo I/O, workers o writes cooperativos.
- **Comportamiento esperado:** un slot cancelado debe permanecer ocupado hasta que el trabajo reconozca la cancelación o quede aislado por epoch/transaction sin posibilidad de publicar estado obsoleto.
- **Riesgo:** solapamiento de indexación, watcher intake, cache writes y KB updates; carreras lógicas aunque Node sea single-threaded.
- **Impacto hot path:** alto; interactive preemption puede dejar trabajo pesado corriendo detrás de la escena.
- **Impacto 10,000+ archivos:** alto; cancelar una indexación grande no garantiza liberación real de I/O/CPU antes de iniciar otra.
- **Impacto PowerBuilder:** afecta discovery/indexing de SR*, rematerialización sourceOrigin, project marker changes y watcher bursts.
- **Recomendación:** el scheduler debe diferenciar `cancellation requested` de `task stopped`; no debe iniciar un background incompatible hasta que el anterior finalice o sea aislado.
- **Requiere refactor:** sí.
- **Resumen del refactor:** mantener active task hasta `finally`, pasar tokens a watcher intake, y agregar run generation/epoch guard para impedir commits stale.
- **Backlog relacionado:** `PB-RUNTIME-P0-BACKGROUND-CANCELLATION-JOIN-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** test con background cancelado que no inicia segundo background hasta que el primero resuelve; test watcher/indexer token-aware.
- **Estado:** Open.

## FINDING-013 — Open/change document ejecuta análisis e invalidación semántica inmediata en el hot path

- **Fase:** PHASE 4 — Indexing and discovery lifecycle audit.
- **Severidad:** High.
- **Tipo:** Performance risk.
- **Área:** Code.
- **Evidencia:** [src/server/handlers/documentHandlers.ts](../../src/server/handlers/documentHandlers.ts) llama `publishDiagnosticsNow(...)` sincrónicamente en `onDidOpen`; en `onDidChangeContent` calcula invalidation plans antes/después, llama `getDocumentAnalysis(event.document)` que puede analizar y hacer `KnowledgeBase.upsertDocument`, invalida caches para `invalidationPlan.allUris` y agenda diagnostics.
- **Comportamiento observado:** abrir o editar un documento puede ejecutar análisis completo del documento activo, update de KB y cascada de invalidación dependiente antes de devolver control al flujo LSP.
- **Comportamiento esperado:** open/change debe publicar un snapshot local mínimo y diferir diagnostics semánticos/cascadas amplias a lane near/background con stale guards y caps.
- **Riesgo:** typing/open latency visible en archivos grandes o jerarquías con muchos dependientes.
- **Impacto hot path:** alto.
- **Impacto 10,000+ archivos:** alto si una clase base impacta muchos documentos o si los reverse dependencies crecen.
- **Impacto PowerBuilder:** frecuente en PFC/STD y jerarquías PB con ancestors compartidos.
- **Recomendación:** convertir open/change en fast path local: parse estructural bounded, diagnostics Tier 0/1 inmediatos, semantic diagnostics e invalidación transitive por scheduler con receipts.
- **Requiere refactor:** sí.
- **Resumen del refactor:** separar `publishDiagnosticsNow` en tiers, usar snapshot-aware invalidation async y throttle/debounce por URI/dependency fanout.
- **Backlog relacionado:** `PB-HOTPATH-P0-OPEN-CHANGE-SEMANTIC-DEFER-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** tests/benchmarks que `onDidOpen` y `onDidChangeContent` no ejecutan semantic cascade síncrona por encima del presupuesto.
- **Estado:** Open.

## FINDING-014 — Discovery de workspace es recursivo secuencial y sin budget configurable de enumeración

- **Fase:** PHASE 4 — Indexing and discovery lifecycle audit.
- **Severidad:** Medium.
- **Tipo:** Performance risk.
- **Área:** Code.
- **Evidencia:** [src/server/workspace/discovery.ts](../../src/server/workspace/discovery.ts) procesa roots y directorios secuencialmente, usa una lista estática de directorios ignorados, hace `fs.readDirectory` por carpeta, parsea topology/build JSON durante traversal y no declara límite de archivos/directorios ni concurrencia acotada configurable.
- **Comportamiento observado:** discovery es cooperativo (`setImmediate`) y cancelable entre directorios, pero no tiene budget explícito de enumeración ni política de partial results más allá del token.
- **Comportamiento esperado:** discovery de 10,000+ archivos debe tener concurrencia acotada, caps/receipts, ignores configurables y publicación progresiva de roots/source files sin bloquear readiness del archivo activo.
- **Riesgo:** workspaces profundos o con muchos artifacts no ignorados retrasan readiness inicial y warm validation.
- **Impacto hot path:** medio; corre en background, pero como `critical-initialization` no se throttlea por latencia.
- **Impacto 10,000+ archivos:** alto.
- **Impacto PowerBuilder:** afecta PBW/PBT/PBPROJ/PBSLN/PBL detection y PBAutoBuild JSON candidates.
- **Recomendación:** crear `DiscoveryPlan` con concurrency, ignore config, max nodes budget y receipts de partial discovery; separar parse de markers pesados en fase near/background posterior.
- **Requiere refactor:** sí, incremental.
- **Resumen del refactor:** discovery producer bounded + marker parser queue + incremental WorkspaceState publication.
- **Backlog relacionado:** `PB-DISCOVERY-P1-BOUNDED-CONCURRENT-DISCOVERY-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** performance test con árbol profundo/ancho y assertions de progress/cancel latency.
- **Estado:** Open.

## FINDING-015 — El checkpoint semántico persiste solo la LRU de `DocumentCache`, no el corpus indexado completo

- **Fase:** PHASE 5 — Cache, invalidation and persistence audit.
- **Severidad:** Critical.
- **Tipo:** Correctness/performance bug.
- **Área:** Code.
- **Evidencia:** [src/server/server.ts](../../src/server/server.ts) crea `DocumentCache(512)`. [src/server/indexer/workspaceIndexer.ts](../../src/server/indexer/workspaceIndexer.ts) escribe cada documento indexado en esa LRU. [src/server/handlers/lifecycleHandlers.ts](../../src/server/handlers/lifecycleHandlers.ts) persiste checkpoints con `documentCache.exportDocumentRecords()`. [src/server/knowledge/DocumentCache.ts](../../src/server/knowledge/DocumentCache.ts) evicta documentos unpinned al superar capacidad.
- **Comportamiento observado:** en un workspace de miles de archivos, el checkpoint final solo puede contener las entradas que sobrevivieron en la LRU de `DocumentCache`, típicamente 512 más pinned.
- **Comportamiento esperado:** la persistencia semántica debe guardar el corpus semántico publicado o un snapshot particionado propio, independiente de la cache LRU interactiva.
- **Riesgo:** warm resume incompleto por diseño; reindexaciones repetidas; particionado por proyecto pierde valor si el input ya está recortado por LRU.
- **Impacto hot path:** medio; reduce hit ratio de snapshots para archivos no recientes.
- **Impacto 10,000+ archivos:** crítico; invalida el objetivo de warm cache completa.
- **Impacto PowerBuilder:** afecta proyectos PBW/PBT/PBL grandes con muchos SR* y PFC/STD-like corpora.
- **Recomendación:** separar `SemanticPersistenceStore` de `DocumentCache`; persistir desde `KnowledgeBase`/published snapshots o desde un writer del indexer sin límite LRU.
- **Requiere refactor:** sí.
- **Resumen del refactor:** `DocumentCache` queda como hot/warm memory cache; checkpoint toma `SemanticDocumentRecord`s de un corpus store append-only/partitioned.
- **Backlog relacionado:** `PB-CACHE-P0-PERSISTED-SEMANTIC-CORPUS-SEPARATE-FROM-LRU-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** test con `DocumentCache(2)` y 5 documentos indexados donde el checkpoint conserva los 5 registros semánticos.
- **Estado:** Open.

## FINDING-016 — Escrituras de journal/checkpoint no están serializadas y pueden perder mutaciones concurrentes

- **Fase:** PHASE 5 — Cache, invalidation and persistence audit.
- **Severidad:** High.
- **Tipo:** Concurrency/persistence risk.
- **Área:** Code.
- **Evidencia:** [src/server/cache/cacheStore.ts](../../src/server/cache/cacheStore.ts) reescribe `semantic-journal.json` completo en cada `appendJournalMutation`. [src/server/analysis/analysisCache.ts](../../src/server/analysis/analysisCache.ts) invoca `void persistenceBackend.appendUpsert(...)`/`appendRemove(...)` sin esperar la escritura. [src/server/cache/semanticCacheRuntimeController.ts](../../src/server/cache/semanticCacheRuntimeController.ts) puede disparar mantenimiento asincrónico mientras siguen mutaciones pendientes.
- **Comportamiento observado:** dos append concurrentes serializan payloads distintos y el último write físico que termina gana, aunque tenga menos mutaciones.
- **Comportamiento esperado:** todas las mutaciones de persistencia deben pasar por una cola ordenada por workspace/partition y checkpoint/maintenance debe hacer flush antes de compactar.
- **Riesgo:** pérdida silenciosa de cache journal, restore parcial, falsos rebuild o cache obsoleta después de reinicio.
- **Impacto hot path:** bajo directo, alto indirecto por warm resume/stale state.
- **Impacto 10,000+ archivos:** alto; más eventos y edits elevan probabilidad de interleaving.
- **Impacto PowerBuilder:** afecta análisis interactivo de archivos abiertos y watcher/indexer cuando conviven con persistencia.
- **Recomendación:** introducir `CacheWriteQueue` por archivo/partition, `flush()` explícito para checkpoint/maintenance/shutdown y tests de append concurrente.
- **Requiere refactor:** sí.
- **Resumen del refactor:** serializar writes, convertir fire-and-forget en journal sink con backpressure/telemetry y flush antes de compaction.
- **Backlog relacionado:** `PB-CACHE-P0-SERIALIZED-PERSISTENCE-WRITES-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** test que lanza muchos `appendJournalMutation` concurrentes y restaura todas las mutaciones en orden.
- **Estado:** Open.

## FINDING-017 — El contrato de cache key declara `prefix` pero el builder no lo incluye en la key

- **Fase:** PHASE 5 — Cache, invalidation and persistence audit.
- **Severidad:** Medium.
- **Tipo:** Contract bug.
- **Área:** Code/tests.
- **Evidencia:** [src/server/serving/cacheKeyContract.ts](../../src/server/serving/cacheKeyContract.ts) incluye `prefix?: string` en `InteractiveServingCacheKeyDescriptor` y lo usa en `buildInteractiveServingStaleKeyMatcher`, pero `buildInteractiveServingCacheKey(...)` no emite segmento `prefix:`. [test/server/unit/cacheKeyContract.test.ts](../../test/server/unit/cacheKeyContract.test.ts) no cubre variaciones de `prefix`.
- **Comportamiento observado:** si un consumer empieza a pasar `prefix`, dos requests con prefijos distintos pueden colisionar en cache; además el matcher stale busca un sufijo que la key real no contiene.
- **Comportamiento esperado:** todo discriminador declarado por el contrato debe estar presente de forma simétrica en key, invalidation scope/matcher y tests.
- **Riesgo:** cache hits incorrectos en completion/filtering o fallos de stale-hit cuando se active prefix.
- **Impacto hot path:** medio.
- **Impacto 10,000+ archivos:** bajo directo.
- **Impacto PowerBuilder:** afecta completion en identificadores y members si se versiona por prefijo.
- **Recomendación:** añadir `prefix:` a `buildInteractiveServingCacheKey` o retirar el campo hasta que exista consumer; agregar test de no colisión.
- **Requiere refactor:** no, fix localizado.
- **Backlog relacionado:** `PB-CACHE-P1-CACHE-KEY-CONTRACT-SYMMETRY-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** unit test que `prefix` cambia la key y que stale matcher encuentra la key.
- **Estado:** Open.

## FINDING-018 — `HotContextCache` usa epoch global y se invalida por cambios no relacionados

- **Fase:** PHASE 5 — Cache, invalidation and persistence audit.
- **Severidad:** Medium.
- **Tipo:** Performance risk.
- **Área:** Code.
- **Evidencia:** [src/server/knowledge/HotContextCache.ts](../../src/server/knowledge/HotContextCache.ts) invalida todo si cambia `semanticEpoch`. [src/server/handlers/featureHandlers.ts](../../src/server/handlers/featureHandlers.ts) llama `hotContextCache.setActive(document.uri, knowledgeBase.version)` en providers interactivos. `KnowledgeBase.semanticEpoch` es global y cambia por publicación de cualquier documento o batch.
- **Comportamiento observado:** cambios en documentos no relacionados invalidan active entities/inherited members del archivo activo.
- **Comportamiento esperado:** hot context debe invalidarse por fingerprint del documento activo, dependency closure relevante y project/sourceOrigin policy, no por cualquier epoch global.
- **Riesgo:** bajo hit ratio durante indexing, edits en otros archivos o watcher bursts; recomputación de herencia en hot path.
- **Impacto hot path:** medio.
- **Impacto 10,000+ archivos:** alto por más publicaciones y dependencias.
- **Impacto PowerBuilder:** afecta jerarquías PFC/STD donde inherited members son costosos y repetidos.
- **Recomendación:** versionar `HotContextCache` con `ActiveContextVersion` (`uri`, `documentFingerprint`, `sourceOrigin`, dependency keys/ancestor version) y fallback a global epoch solo si no hay evidencia.
- **Requiere refactor:** sí, pequeño/medio.
- **Resumen del refactor:** introducir descriptor de versión activo y adaptar providers/tests.
- **Backlog relacionado:** `PB-CACHE-P1-HOT-CONTEXT-DEPENDENCY-VERSIONING-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** test que cambios en URI no dependiente no borran inherited members del activo; cambio en ancestor sí los borra.
- **Estado:** Open.

## FINDING-019 — Semantic tokens resuelve por identificador en un barrido completo del documento

- **Fase:** PHASE 6 — Provider hot path audit; ampliado en PHASE 7 — Diagnostics and semantic tokens audit.
- **Severidad:** High.
- **Tipo:** Performance bottleneck.
- **Área:** LSP Provider.
- **Evidencia:** `src/server/handlers/featureHandlers.ts` registra `semanticTokens.on` y `semanticTokens.onDelta` con `scheduler.runInteractive`, pero no pasa token de cancelación al cálculo ni aplica stale guard/cache por fingerprint. `src/server/features/semanticTokens.ts` llama `getDocumentAnalysis(document)`, recorre todas las líneas enmascaradas, emite declarations, luego ejecuta regex de identificadores por línea, hace lookup local con `getScopeAtLine(...)` y llama `facade.resolveTarget(...)` por identificador que no resuelve por catálogo/local. `src/server/presentation/semanticTokenPresentation.ts` acepta `previousResultId`, pero recibe un view model ya reconstruido completo.
- **Comportamiento observado:** semantic tokens full/delta recomputan y resuelven usos en todo el documento; `onDelta` reutiliza `SemanticTokensBuilder`, pero el provider vuelve a construir el modelo completo antes de pedir edits.
- **Comportamiento esperado:** semantic tokens debe usar facts estructurales, range/delta real, cache por `documentFingerprint`/snapshot y resolución bounded; semantic resolution por token debe ser excepción allowlisted, no el flujo general.
- **Riesgo:** archivos grandes o con muchos identificadores pueden bloquear el lane interactivo y multiplicar consultas al facade durante typing/open.
- **Impacto hot path:** alto.
- **Impacto 10,000+ archivos:** medio/alto; el coste es por documento activo, pero compite con indexing y diagnostics en sesiones grandes.
- **Impacto PowerBuilder:** afecta coloreado de scopes, miembros heredados, eventos, funciones, variables, enumerados y símbolos del sistema.
- **Recomendación:** migrar a `SemanticTokensProjection` incremental con declarations estructurales rápidas, usage index por snapshot, cache/range support y degraded semantic coloring cuando exceda budget.
- **Requiere refactor:** sí.
- **Resumen del refactor:** separar tokenización estructural de resolución semántica, cachear tokens por fingerprint y añadir path range/delta con stale checks.
- **Backlog relacionado:** `PB-HOTPATH-P1-SEMANTIC-TOKENS-INCREMENTAL-PROJECTION-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** benchmark de tokens en archivo grande, test delta/range, cancelación/stale y gate que impida `resolveTarget` por cada identificador sin cap.
- **Estado:** Open.

## FINDING-025 — Diagnostics no tiene contrato ejecutable de tiers y mezcla advisory checks en publish full

- **Fase:** PHASE 7 — Diagnostics and semantic tokens audit.
- **Severidad:** High.
- **Tipo:** Architecture drift.
- **Área:** Diagnostics.
- **Evidencia:** `src/server/features/diagnostics.ts` expone solo `mode: 'syntactic' | 'full'`. `buildDiagnosticsForDocument(..., 'full')` combina `validateStructure`, `validateSemantics`, `runExtraDiagnostics` y `findObsoleteCalls`, luego aplica presentation/dedup/cap global. `validateSemantics` incluye SD2/SD3/unused/shadowing/duplicates/flow, native dependency advisory, DataWindow expression/property path, transaction binding, lifecycle y enumerated context checks. `src/server/analysis/diagnosticScheduler.ts` publica syntactic inmediatamente y agenda `full` en `TaskPriority.Interactive`; `src/server/analysis/openDocumentDiagnostics.ts` republica documentos abiertos con `publishDiagnosticsNow(...)`.
- **Comportamiento observado:** existe separación mínima syntactic/full, pero no hay contrato ejecutable para Tier 0 safety/suppression, Tier 1 syntax local, Tier 2 document semantic, Tier 3 project semantic y Tier 4 advisory/report-only. Las reglas advisory se publican junto con diagnósticos semánticos regulares y comparten cap global de 500.
- **Comportamiento esperado:** diagnostics debe producir envelopes por tier, con budgets, lane, sourceOrigin/confidence/reason, noise policy, cap por tier, stale/degraded metadata y opción de mantener Tier 4 como report-only o bajo severidad/canal explícito.
- **Riesgo:** diagnostics full puede ser ruidoso, costoso y difícil de explicar; las reglas advisory de DataWindow/SQL/native pueden competir con errores reales y ejecutarse en rutas interactivas.
- **Impacto hot path:** sí; open/change, republish de documentos abiertos y Current Object Context invocan full diagnostics.
- **Impacto 10,000+ archivos:** alto; project semantic y advisory checks pueden multiplicarse al re-publicar abiertos durante indexing/watcher bursts.
- **Impacto PowerBuilder:** afecta SD2/SD3/SD4/SD5/SD6/SD8/SD9/SD10/SD11/SD12/SD13, DataWindow, transaction bindings, external/native y lifecycle PFC/STD-like.
- **Recomendación:** introducir `DiagnosticsTierPipeline` con Tier 0/1 inmediato y Tier 2/3/4 separados por scheduler/cache, receipts y caps; mover advisory a Tier 4 report-only salvo evidencia alta y budget disponible.
- **Requiere refactor:** sí.
- **Resumen del refactor:** separar builders por tier, publicar summaries incrementales/stale-aware y mantener compat temporal para LSP diagnostics actuales.
- **Backlog relacionado:** `PB-DIAG-P0-TIERED-DIAGNOSTICS-PIPELINE-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** tests por tier, noise/cap tests, scheduler lane tests, Current Object Context sin full diagnostics inline y performance gate de open/change.
- **Estado:** Open.

## FINDING-026 — Semantic tokens delta no está versionado por fingerprint ni result state propio

- **Fase:** PHASE 7 — Diagnostics and semantic tokens audit.
- **Severidad:** High.
- **Tipo:** Correctness/performance risk.
- **Área:** Semantic Tokens.
- **Evidencia:** `src/server/handlers/featureHandlers.ts` guarda `SemanticTokensBuilder` en `semanticTokensBuilders` por `document.uri`, lo elimina solo en `documents.onDidClose` y lo reutiliza para `semanticTokens.on` y `semanticTokens.onDelta`. `onDelta` pasa `params.previousResultId`, pero no valida `document.version`, `documentFingerprint`, `semanticEpoch`, `sourceOrigin` ni si el resultId anterior corresponde al snapshot actual. `provideSemanticTokens(...)` no recibe token de cancelación ni descriptor de snapshot esperado.
- **Comportamiento observado:** delta existe a nivel de API, pero el estado de delta se acopla a un builder por URI y no a una cache/result state versionada por documento y snapshot.
- **Comportamiento esperado:** cada resultId debe estar asociado a `uri`, `documentVersion`, `documentFingerprint`, `semanticEpoch/kbVersion`, `sourceOrigin`, legend version y payload hash; si no coincide, el provider debe devolver full tokens o degraded structural tokens, no edits basados en estado ambiguo.
- **Riesgo:** tras ediciones, reindexación o cambios de KB, el servidor puede intentar construir edits con base obsoleta o perder oportunidades de full fallback/cache; además el builder por URI puede crecer como estado implícito no auditable.
- **Impacto hot path:** sí; semantic tokens delta se invoca durante edición y repaint.
- **Impacto 10,000+ archivos:** medio; el coste es por documento activo, pero el riesgo aumenta durante indexing parcial y cambios de ancestors/catalog.
- **Impacto PowerBuilder:** afecta coloreado de tipos, variables, funciones/eventos heredados, miembros de instancia/global/shared y símbolos de catálogo.
- **Recomendación:** reemplazar el mapa de builders por `SemanticTokensResultState` versionado, con full fallback cuando `previousResultId` no coincida y eviction explícita por documento/fingerprint.
- **Requiere refactor:** sí.
- **Resumen del refactor:** cache de token projection/resultId con keys completas, builder efímero por respuesta y tests de edición/delta/stale.
- **Backlog relacionado:** `PB-TOKENS-P0-RESULTID-FINGERPRINT-STATE-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** tests de delta con cambio de documento, cambio de KB no relacionado, cambio de ancestor, close/open y fallback full cuando `previousResultId` es desconocido.
- **Estado:** Open.

## FINDING-020 — CodeLens calcula reference counts inline con pools de proyecto

- **Fase:** PHASE 6 — Provider hot path audit.
- **Severidad:** High.
- **Tipo:** Performance bottleneck.
- **Área:** LSP Provider.
- **Evidencia:** `src/server/handlers/featureHandlers.ts` en `onCodeLens` obtiene todas las entidades callable del documento, crea `lensSymbols` y, si readiness no bloquea, espera `buildCodeLensReferenceCounts(lensSymbols)`. Esa función agrupa pools por proyecto/workspace, llama `collectReferenceSourcePool(...)` y ejecuta `provideReferences(...)` para cada símbolo callable.
- **Comportamiento observado:** una solicitud de CodeLens puede leer/usar el pool de fuentes del proyecto y resolver referencias por cada función/subroutine/event del documento antes de devolver las lenses.
- **Comportamiento esperado:** CodeLens debe ser adapter delgado sobre contadores precomputados, cacheados o lazy-resolved por comando; el render inicial no debe disparar N búsquedas de referencias project-wide.
- **Riesgo:** documentos con muchas rutinas y proyectos grandes pueden producir explosión multiplicativa de `symbols * source pool * matches`.
- **Impacto hot path:** alto; CodeLens se solicita automáticamente por el editor.
- **Impacto 10,000+ archivos:** alto si hay proyectos grandes y muchas rutinas por objeto.
- **Impacto PowerBuilder:** afecta objetos PFC/STD con muchos eventos/métodos y jerarquías con overrides.
- **Recomendación:** mover counts a índice incremental de references o a proyección near/background; renderizar CodeLens con estado `calculating/degraded/unavailable` y resolver detalles bajo demanda.
- **Requiere refactor:** sí.
- **Resumen del refactor:** `CodeLensProvider` solo lee `CodeLensProjection` por URI/fingerprint; el cálculo de counts usa source pool indexado, budget, cancelación y cache por dependency key.
- **Backlog relacionado:** `PB-HOTPATH-P0-CODELENS-REFERENCE-COUNTS-PROJECTION-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** test con muchas rutinas que `onCodeLens` no llama `collectReferenceSourcePool` por símbolo; benchmark de primer CodeLens y refresh.
- **Estado:** Open.

## FINDING-021 — Current Object Context se recalcula en cambios de selección con trabajo semántico profundo

- **Fase:** PHASE 6 — Provider hot path audit.
- **Severidad:** High.
- **Tipo:** Performance bottleneck.
- **Área:** Read-only surface.
- **Evidencia:** `src/client/currentObjectContextPanel.ts` refresca el panel en `onDidChangeActiveTextEditor` y `onDidChangeTextEditorSelection` con debounce de 500 ms. El loader llama `powerbuilder.currentObjectContext`; `src/server/handlers/reportCommandHandlers.ts` ejecuta `buildCurrentObjectContext(...)` en near lane. `src/server/features/currentObjectContext.ts` hace `getDocumentAnalysis`, `buildDiagnosticsForDocument(..., 'full')`, `collectDataObjectBindings`, `collectEmbeddedSqlAnchors` y `collectReferencedSymbols` sobre el documento completo, con resoluciones facade por coincidencia hasta el cap.
- **Comportamiento observado:** mover el cursor puede disparar una recomputación de contexto que incluye diagnostics full, bindings DataWindow, SQL anchors y referencias del documento.
- **Comportamiento esperado:** el panel debe consumir una proyección current-object incremental/stale-aware, con secciones lazy y cálculo profundo solo por expansión o comando explícito.
- **Riesgo:** selección frecuente en archivos grandes puede saturar el lane Near y competir con providers interactivos y background indexing.
- **Impacto hot path:** alto; aunque es una vista, se refresca por eventos muy frecuentes del editor.
- **Impacto 10,000+ archivos:** medio/alto; el coste principal es del documento activo, pero los closures/hierarchies/proyectos amplios elevan el tiempo.
- **Impacto PowerBuilder:** afecta jerarquías, miembros heredados, diagnostics, DataWindow bindings, SQL anchors y current object explainability.
- **Recomendación:** dividir la superficie en summary instantáneo y secciones lazy; cachear por URI/fingerprint/line bucket y no ejecutar diagnostics full ni references en cada refresh de selección.
- **Requiere refactor:** sí.
- **Resumen del refactor:** `CurrentObjectContextProvider` fino sobre `CurrentObjectProjection`, con refresh coalescing, stale receipts y workers/near tasks cancelables para secciones profundas.
- **Backlog relacionado:** `PB-HOTPATH-P0-CURRENT-OBJECT-CONTEXT-LAZY-PROJECTION-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** test de debounce/cancelación, benchmark de selección rápida y contrato que summary no ejecuta diagnostics full/references.
- **Estado:** Open.

## FINDING-022 — Document Symbols ejecuta análisis/reconciliación completa en el provider interactivo

- **Fase:** PHASE 6 — Provider hot path audit.
- **Severidad:** Medium.
- **Tipo:** Performance risk.
- **Área:** LSP Provider.
- **Evidencia:** `src/server/handlers/featureHandlers.ts` registra `onDocumentSymbol` con `scheduler.runInteractive` y ejecuta `extractDocumentSymbolsWithReconciliation(document)`. `src/server/features/documentSymbols.ts` llama `getDocumentAnalysis(document)`, construye símbolos internos desde sections/typeBlocks/scopes/facts y además produce un reporte de reconciliación recorriendo facts, scopes y containers.
- **Comportamiento observado:** la petición de Document Symbols puede analizar el documento y ejecutar reconciliación diagnóstica en el mismo lane interactivo; no se observó serving cache, stale guard ni token de cancelación.
- **Comportamiento esperado:** Document Symbols debe leer una proyección derivada del snapshot publicado o analysis cache ya materializado, y relegar reconciliación profunda a telemetry/background salvo primer diagnóstico controlado.
- **Riesgo:** outline/document symbol refresh en archivos grandes puede competir con hover/completion/semantic tokens.
- **Impacto hot path:** medio.
- **Impacto 10,000+ archivos:** bajo/medio; coste por documento activo, pero frecuente en navegación.
- **Impacto PowerBuilder:** afecta navegación por sections, type blocks, functions, subroutines, events y DataWindow legacy symbols.
- **Recomendación:** cachear `DocumentSymbolProjection` por snapshot fingerprint y mover reconciliation report a auditoría/background con sampling.
- **Requiere refactor:** sí, pequeño/medio.
- **Resumen del refactor:** provider fino que convierte `DocumentSymbolProjection` a LSP; reconciliación se ejecuta fuera del path de respuesta o solo cuando cambia el snapshot.
- **Backlog relacionado:** `PB-HOTPATH-P1-DOCUMENT-SYMBOLS-PROJECTION-CACHE-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** test que requests repetidas hit cache por fingerprint y no recomputan reconciliation.
- **Estado:** Open.

## FINDING-023 — Workspace Symbols escanea buckets de KB sin contrato de cancelación/stale/cache

- **Fase:** PHASE 6 — Provider hot path audit.
- **Severidad:** Medium.
- **Tipo:** Performance risk.
- **Área:** LSP Provider.
- **Evidencia:** `src/server/handlers/featureHandlers.ts` registra `onWorkspaceSymbol` y llama directamente `provideWorkspaceSymbols(params.query, knowledgeBase)` con medición de tiempo, pero sin scheduler, token de cancelación, readiness/stale metadata o cache. `src/server/features/workspaceSymbols.ts` delega en `kb.queryEntities({ query, limit: 200 })`, que recorre buckets de entidades hasta alcanzar el límite.
- **Comportamiento observado:** la búsqueda global de símbolos depende de recorrer índices publicados en cada request; el límite de resultados existe, pero no hay contrato de presupuesto ni partial/degraded response.
- **Comportamiento esperado:** workspace symbols debe usar índice/prefix projection preparada para búsqueda, cancelable por request y con receipts cuando el workspace está parcial o latency pressure bloquea el recorrido.
- **Riesgo:** queries amplias o vacías en KB grande pueden recorrer muchos buckets y competir con operaciones interactivas.
- **Impacto hot path:** medio.
- **Impacto 10,000+ archivos:** medio/alto según cardinalidad de símbolos.
- **Impacto PowerBuilder:** afecta navegación global por types/functions/events/variables de proyectos y libraries grandes.
- **Recomendación:** añadir `WorkspaceSymbolProjection` con índice por prefijo/fuzzy token, cache por query normalizada, cancellation token y readiness/degraded behavior.
- **Requiere refactor:** sí.
- **Resumen del refactor:** provider fino sobre proyección de símbolos workspace, con query budget y partial result si LSP/cliente lo soporta.
- **Backlog relacionado:** `PB-HOTPATH-P1-WORKSPACE-SYMBOLS-BOUNDED-PROJECTION-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** benchmark de query vacía/amplia en KB grande y test de cancelación/readiness.
- **Estado:** Open.

## FINDING-024 — Health/status dashboard arma snapshots pesados en la ruta de refresco de estado

- **Fase:** PHASE 6 — Provider hot path audit.
- **Severidad:** Medium.
- **Tipo:** Performance risk.
- **Área:** Runtime/status surface.
- **Evidencia:** `src/client/extension.ts` llama `fetchRuntimeStatusStats()` desde `scheduleStatusRefresh(...)` y comandos de status; esa función ejecuta `powerbuilder.showStats`. `src/server/handlers/runtimeCommandHandlers.ts` en `powerbuilder.showStats` recopila stats de KB, scheduler, workspace, project model, diagnostics, caches, memory, build/orca snapshots, last query trace, persistence, `cacheStore.inspectMaintenance()` y `runtimeJournal.snapshot(50)`, y construye health inline.
- **Comportamiento observado:** la misma ruta de stats sirve comandos/manual UI y refrescos de status; no se observó snapshot cacheado por intervalo, lane/background específico, cancelación ni payload reducido para status bar.
- **Comportamiento esperado:** el status bar debe consumir un snapshot runtime pequeño y cacheado; dashboards completos deben ser comandos/reportes con budget, throttling y degraded receipts.
- **Riesgo:** refrescos frecuentes tras progress/indexing pueden añadir I/O o CPU de mantenimiento justo cuando el runtime está bajo presión.
- **Impacto hot path:** medio; no es LSP editing provider, pero corre en la experiencia interactiva de VS Code.
- **Impacto 10,000+ archivos:** medio; stats de proyectos, diagnostics y cache maintenance crecen con el workspace.
- **Impacto PowerBuilder:** afecta visibilidad de salud de indexación/proyectos/build tools mientras se trabaja con corpora grandes.
- **Recomendación:** separar `showInteractiveServingStats`/status summary de `showStats` completo; cachear health snapshot por TTL corto y mover maintenance inspection a comando explícito o background lane.
- **Requiere refactor:** sí, pequeño/medio.
- **Resumen del refactor:** `RuntimeStatusSnapshotProvider` con niveles `status-bar`, `health-summary`, `full-diagnostics`, cada uno con budget/payload y stale timestamp.
- **Backlog relacionado:** `PB-RUNTIME-P1-STATUS-HEALTH-SNAPSHOT-TIERS-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** test/benchmark que status refresh no llama maintenance inspection ni construye payload completo salvo comando explícito.
- **Estado:** Open.

## FINDING-027 — Superficies read-only no comparten contrato uniforme de frescura, caps y receipts

- **Fase:** PHASE 8 — Read-only surfaces and UI reactivity audit.
- **Severidad:** High.
- **Tipo:** Architecture drift.
- **Área:** Runtime/read-only surfaces.
- **Evidencia:** `src/client/objectExplorer.ts` carga un manifiesto y modelo completo con `loadManifest()`/`buildObjectExplorerModel(...)`; `src/client/currentObjectContextPanel.ts` invalida por selección y carga un contexto compuesto; `src/client/diagnosticsExplainabilityPanel.ts` reconstruye desde `vscode.languages.getDiagnostics(...)`; `src/client/workspaceCheckReport.ts` y `src/client/objectCheckReport.ts` tienen caps/truncated locales; `src/client/aiTaskContextBundle.ts` tiene `reasonCodes`/`pagination` para algunas secciones; `src/client/support/supportBundle.ts` aplica redacción y manifiesto propio. No se observó contrato común que obligue `generatedFromCache`, `semanticEpoch`, `documentFingerprint`, `sourceOrigin`, `projection`, `truncatedReason`, `staleAt` o `degradedReason` en todas las superficies.
- **Comportamiento observado:** cada superficie read-only decide por separado caps, truncation, freshness y errores de sección; algunas tienen receipts ricos y otras solo mensajes o booleanos.
- **Comportamiento esperado:** toda proyección read-only debe declarar source snapshot, freshness, cache/projection owner, caps, truncation reason, redaction receipt, readiness/stale/degraded state y refresh trigger.
- **Riesgo:** UI, support bundles y herramientas AI pueden mezclar datos frescos, obsoletos, truncados y degradados sin una semántica uniforme para el consumidor.
- **Impacto hot path:** medio; varias superficies son manuales, pero Object Explorer, Current Object Context, Diagnostics Explainability y status se refrescan por eventos del editor/runtime.
- **Impacto 10,000+ archivos:** alto; caps y truncation sin contrato común dificultan garantizar acceso completo y payloads acotados.
- **Impacto PowerBuilder:** afecta objetos, diagnostics, DataWindow/SQL/native advisory, workspace topology, migration assistant, technical debt y support bundles.
- **Recomendación:** introducir `ReadOnlyProjectionEnvelope` compartido con metadata de freshness/caps/receipts y migrar superficies por compat layer.
- **Requiere refactor:** sí.
- **Resumen del refactor:** envolver manifests, checks, reports, panels y bundles en un envelope común o adaptar sus DTOs con un bloque `projection` uniforme.
- **Backlog relacionado:** `PB-READONLY-P0-PROJECTION-ENVELOPE-CONTRACT-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** conformance tests por superficie que verifiquen freshness, caps, truncation receipts, sourceOrigin/fingerprint cuando aplique y redaction receipts para bundles.
- **Estado:** Open.

## FINDING-028 — AI task context bundle poda por tokens después de ejecutar secciones potencialmente costosas

- **Fase:** PHASE 8 — Read-only surfaces and UI reactivity audit.
- **Severidad:** Medium.
- **Tipo:** Performance risk.
- **Área:** Runtime/read-only surfaces.
- **Evidencia:** `src/client/aiTaskContextBundle.ts` normaliza `maxTokensHint` y luego `getAiTaskContextBundle(...)` en `src/client/extension.ts` lanza en paralelo `checkWorkspace`, `checkObject`, `getCurrentObjectContext`, `generateSafeEditPlan`, `getPowerBuilderDependencyGraph`, diagnostic explanations y system symbol explanations según flags. La poda por token ocurre después en `buildAiTaskContextBundle(...)` mediante `pruneContextToBudget(...)`. La memoria repo `ai-task-context-bundle-budget-contract-2026-05.md` confirma que el presupuesto de payload y receipts está centralizado, pero no convierte ese presupuesto en planificación previa de cómputo por sección.
- **Comportamiento observado:** el bundle puede calcular secciones que luego se omiten por budget, especialmente cuando el intent incluye workspace/object checks, current object context, dependency graph o safe edit plan.
- **Comportamiento esperado:** el presupuesto debe guiar tanto la composición del payload como el plan de ejecución: ordenar secciones por prioridad, saltar secciones antes de computarlas cuando el presupuesto esperado no alcanza y devolver receipts de omisión anticipada.
- **Riesgo:** comandos de contexto IA pueden disparar trabajo read-only pesado que no aparece en el resultado final, compitiendo con providers y report workloads.
- **Impacto hot path:** medio; es comando/tooling, no typing path, pero puede ejecutarse durante sesiones interactivas y sobre workspace grande.
- **Impacto 10,000+ archivos:** medio/alto si incluye checks o dependency/context sections con límites altos.
- **Impacto PowerBuilder:** afecta workflows IA sobre objetos grandes, dependency graphs, diagnostics, DataWindow/SQL anchors y safe edit plans.
- **Recomendación:** añadir un `AiTaskContextExecutionPlan` que estime coste/tokens antes de ejecutar, priorice secciones por intent y registre `skippedBeforeExecution` con reason codes.
- **Requiere refactor:** sí.
- **Resumen del refactor:** mover la lógica de prioridad de poda a una fase de planificación previa y mantener la poda final como guard defensivo.
- **Backlog relacionado:** `PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** tests de budget donde secciones de baja prioridad no ejecutan llamadas API cuando el token/cost budget está agotado.
- **Estado:** Open.

## FINDING-029 — Dispatch de reglas diagnostics está monolítico y sin registry ejecutable

- **Fase:** PHASE 9 — Duplicate code, contract drift, and dead architecture audit; PHASE 9B — Structural simplification.
- **Severidad:** High.
- **Tipo:** Refactor need.
- **Área:** Diagnostics.
- **Evidencia:** `src/server/features/diagnostics.ts` tiene 1961 líneas y concentra `publishDiagnostics`, `buildDiagnosticsForDocument`, `validateStructure`, `validateSemantics`, summary, overrides, DataWindow checks, transaction bindings, lifecycle, enumerated contexts, flow keywords y helpers. `src/server/features/diagnosticsExtra.ts` agrega SD11/SD12/SD13 como módulo separado, mientras `src/server/features/obsoleteDetector.ts` aporta SD7. PHASE 7 ya registró que el pipeline solo distingue `syntactic/full`.
- **Comportamiento observado:** las reglas se agregan por llamadas hardcodeadas y helpers inline; no existe registry que declare ID, tier, domain, confidence, sourceOrigin policy, cap, cost o owner por regla.
- **Comportamiento esperado:** diagnostics debe tener un `DiagnosticRuleRegistry` o pipeline equivalente donde cada regla declara metadata ejecutable y se compone por tier/consumer.
- **Riesgo:** nuevas reglas pueden entrar en el tier equivocado, duplicar checks, romper noise policy o agrandar el archivo central sin gates.
- **Impacto hot path:** sí; diagnostics se ejecuta en open/change, republish y Current Object Context.
- **Impacto 10,000+ archivos:** alto por acumulación de reglas y republish de documentos abiertos durante indexing.
- **Impacto PowerBuilder:** afecta reglas PowerScript, DataWindow, SQL/Transaction, native/external, lifecycle y PFC/STD-like.
- **Recomendación:** extraer registry y módulos por dominio/tier antes de ampliar diagnostics; mantener `buildDiagnosticsForDocument` como compat layer temporal.
- **Requiere refactor:** sí.
- **Resumen del refactor:** dividir diagnostics en reglas estructurales, semánticas, DataWindow, SQL/transaction, native/advisory y orchestration tiered.
- **Backlog relacionado:** `PB-DIAG-P0-TIERED-DIAGNOSTICS-PIPELINE-01`, `PB-ARCH-P1-DIAGNOSTIC-RULES-REGISTRY-01`, `PB-ARCH-P9-DIAGNOSTICS-MODULE-SPLIT-01` propuestos; no agregados aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** tests de registry, rule metadata, paridad de diagnostics existentes, caps por tier y gate de tamaño/imports.
- **Estado:** Open.

## FINDING-030 — DataWindow model y property paths son módulos sobredimensionados con responsabilidades mezcladas

- **Fase:** PHASE 9B — Structural simplification, duplicate elimination, source-of-truth alignment, and legacy removal.
- **Severidad:** Medium.
- **Tipo:** Refactor need.
- **Área:** DataWindow.
- **Evidencia:** `src/server/features/dataWindowModel.ts` tiene 1385 líneas; `src/server/features/dataWindowPropertyPaths.ts` tiene 777 líneas; además existen `dataWindowBindingModel.ts`, `dataWindowFastContext.ts`, `dataWindowColumnAccess.ts`, `dataWindowServingAdapters.ts`, `dataWindowSqlLineage.ts`, `dataWindowSafeMode.ts` y `dataWindowLegacySafeMode.ts`. PHASE 2 confirmó que DataWindow es submodelo separado y advisory; PHASE 5/6/8 detectaron consumers que reconstruyen modelos o piden contexto compuesto.
- **Comportamiento observado:** parsing `.srd`, expresiones, columnas/controles, property paths, bindings, fast context y serving adapters están repartidos en varios módulos grandes, con riesgo de duplicar scans y reglas de confidence.
- **Comportamiento esperado:** el submodelo DataWindow debe tener límites claros: parser/syntax, model/entity projection, bindings, property paths, fast context, serving adapters y diagnostics advisory.
- **Riesgo:** cambios en DataWindow pueden requerir tocar módulos extensos y replicar confidence/sourceOrigin/caps en varios consumers.
- **Impacto hot path:** medio; fast context, diagnostics, Current Object Context y reports pueden reconstruir slices de DataWindow.
- **Impacto 10,000+ archivos:** alto cuando hay miles de `.srd` y bindings asociados.
- **Impacto PowerBuilder:** directo sobre DataWindow/DataStore, `DataObject`, `GetChild`, `Describe/Modify`, DDDW, columns/controls y expressions.
- **Recomendación:** definir `src/server/semantic/submodels/datawindow/*` como ownership objetivo y migrar por facade/parity tests.
- **Requiere refactor:** sí.
- **Resumen del refactor:** extraer parser `.srd`, expression dependencies, column/control model, property path resolver y projection cache con contracts de confidence.
- **Backlog relacionado:** `PB-ARCH-P9-DATAWINDOW-MODEL-SPLIT-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** paridad de `dataWindowModel`, property paths, bindings, diagnostics y fast context; corpus `.srd` grande y caps.
- **Estado:** Open.

## FINDING-031 — Orquestadores principales concentran demasiadas responsabilidades

- **Fase:** PHASE 9B — Structural simplification, duplicate elimination, source-of-truth alignment, and legacy removal.
- **Severidad:** Medium.
- **Tipo:** Refactor need.
- **Área:** Architecture.
- **Evidencia:** medición PHASE 9B: `src/client/extension.ts` 5371 líneas, `src/shared/publicApi.ts` 3167 líneas, `src/server/handlers/featureHandlers.ts` 1674 líneas, `src/server/server.ts` 957 líneas y `src/server/handlers/reportCommandHandlers.ts` 651 líneas. Estos módulos registran providers/comandos, construyen APIs, ejecutan adapters, manejan status/bundles/reportes y conectan runtime/caches/projections.
- **Comportamiento observado:** los orquestadores son puntos de integración reales, pero mezclan registration, request shaping, cache key construction, scheduling, command routing, public API bridges y compat logic.
- **Comportamiento esperado:** la estructura objetivo debe separar registration, provider adapters, command routers, public API implementation, read-only tools, status runtime y shared contract declarations.
- **Riesgo:** cambios pequeños tienen blast radius alto; conformance gates son más difíciles porque imports y responsibilities se concentran.
- **Impacto hot path:** medio/alto; `featureHandlers.ts` contiene providers interactivos y sus cache/scheduler decisions.
- **Impacto 10,000+ archivos:** medio; los orquestadores no escalan por sí solos, pero bloquean refactors de proyecciones/caches/runtime necesarios para escalar.
- **Impacto PowerBuilder:** transversal a todos los providers y herramientas PB.
- **Recomendación:** en PHASE 22 definir target module structure y migrar estos orquestadores con adapter/registry slices, no big-bang.
- **Requiere refactor:** sí.
- **Resumen del refactor:** split incremental de client API bridge, provider registration, command handlers por dominio, shared public API schemas y runtime status controllers.
- **Backlog relacionado:** `PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** import boundary tests, no behavior change tests para command/provider registration, API contract snapshots.
- **Estado:** Open.

## FINDING-032 — `plugin_old` está aislado por gate, pero aún necesita plan de retirement explícito

- **Fase:** PHASE 9 — Duplicate code, contract drift, and dead architecture audit; PHASE 9B — Structural simplification.
- **Severidad:** Low.
- **Tipo:** Legacy code.
- **Área:** Architecture/Legacy.
- **Evidencia:** `.github/copilot-instructions.md` y `AGENTS.md` declaran `plugin_old` como referencia, nunca dependencia runtime. `grep` en `src/**` solo encontró comentarios que mencionan `plugin_old`, no imports directos. PHASE 11 confirmó que `test/server/unit/architectureImports.test.ts` contiene el gate `src no importa plugin_old como dependencia runtime`.
- **Comportamiento observado:** el aislamiento runtime está cubierto por test unitario, pero `plugin_old/**` sigue presente como referencia histórica sin criterio de retirada documentado en esta auditoría.
- **Comportamiento esperado:** mantener el gate de aislamiento y añadir plan de retirement con owner, criterios de paridad y fecha/condición de borrado si el repositorio decide retirar el código legacy.
- **Riesgo:** aunque no haya dependencia runtime, la carpeta puede seguir induciendo copia manual de patrones obsoletos o ruido mental en refactors.
- **Impacto hot path:** no directo mientras no haya imports.
- **Impacto 10,000+ archivos:** bajo directo; alto indirecto si se reintroducen rutas legacy no escalables.
- **Impacto PowerBuilder:** afecta reglas/formatters/resolvers heredados de plugin viejo.
- **Recomendación:** conservar el gate existente y crear plan de retirement/documentación en PHASE 23.
- **Requiere refactor:** no inmediato; requiere gate y retirement plan.
- **Resumen del refactor:** no aplica a código productivo hasta decidir retiro; mantener aislamiento con test y definir criterios de borrado.
- **Backlog relacionado:** `PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** ejecutar `npm run test:unit -- --grep "architectureImports"` y actualizar docs de legacy isolation/retirement cuando se cree el backlog.
- **Estado:** Open.

## FINDING-033 — Estado de indexación, analysis cache y DocumentCache carecen de invariantes ejecutables compartidas

- **Fase:** PHASE 9B — Structural simplification, duplicate elimination, source-of-truth alignment, and legacy removal.
- **Severidad:** Medium.
- **Tipo:** Architecture drift.
- **Área:** Indexing/Cache.
- **Evidencia:** `src/server/workspace/workspaceState.ts` mantiene estados de archivos/index dirty; `src/server/analysis/analysisCache.ts` cachea análisis y propaga a `DocumentCache`/`KnowledgeBase`; `src/server/knowledge/DocumentCache.ts` guarda records LRU/pinned; `src/server/indexer/workspaceIndexer.ts` coordina publication y file index state. PHASE 4/5 ya registraron `FINDING-011`, `FINDING-015` y `FINDING-016` sobre warm resume y persistencia.
- **Comportamiento observado:** los estados están coordinados por flujo, pero no existe una matriz de invariantes que pruebe, por ejemplo, que un archivo marcado indexado tenga snapshot/fingerprint compatible en cache/published state o que un eviction LRU no se interprete como ausencia semántica.
- **Comportamiento esperado:** el runtime debe declarar invariantes entre workspace state, analysis cache, DocumentCache, KnowledgeBase y persistence store, con tests de coherencia y recovery.
- **Riesgo:** bugs de stale state o warm resume pueden reaparecer al refactorizar caches/indexer sin que los tests detecten incoherencia.
- **Impacto hot path:** medio; open/change y providers dependen de snapshots activos coherentes.
- **Impacto 10,000+ archivos:** alto por warm resume, evictions y batch publication.
- **Impacto PowerBuilder:** afecta sourceOrigin, project routing, PBL/PBPROJ/PBSLN discovery y objetos indexados.
- **Recomendación:** crear `IndexStateInvariantSuite` y, si PHASE 22 lo confirma, separar `WorkspaceIndexValidity` de caches/projections.
- **Requiere refactor:** sí, principalmente tests/contract primero.
- **Resumen del refactor:** documentar y probar el state machine antes de mover owners de persistencia y index validity.
- **Backlog relacionado:** `PB-ARCH-P1-INDEX-STATE-INVARIANTS-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** tests de indexed snapshot/fingerprint, eviction no-semantic loss, restore clean/dirty y watcher invalidation consistency.
- **Estado:** Open.

## FINDING-034 — Métricas interactivas existen pero no cubren todo el contrato de performance

- **Fase:** PHASE 10 — Performance instrumentation and benchmark audit; PHASE 18 — CPU, memory, event loop and worker profiling audit.
- **Severidad:** High.
- **Tipo:** Missing test.
- **Área:** Runtime.
- **Evidencia:** `src/server/runtime/interactiveServingStats.ts` registra `feature`, `reason`, `totalMs`, `providerMs`, `formatterMs`, `cacheWriteMs`, payload y readiness, pero el snapshot expone promedios y últimos eventos. `src/server/serving/interactiveServingPipeline.ts` instrumenta features que pasan por el pipeline. En `src/server/handlers/featureHandlers.ts`, `references`, `linkedEditing` y `semanticTokens/full/delta` miden/loguean latencia pero no registran el mismo evento estructurado; diagnostics open/change usa timing y journal parcial. [docs/performance-budget.md](../performance-budget.md) exige `traceId`, `method`, `documentUri`, `documentVersion`, `workspaceId`, cache hit/miss, fallback, `cancelled`, `resultSize` y `errorKind`. PHASE 18 añadió que activación/startup y payloads LSP no tienen correlación homogénea con estos eventos.
- **Comportamiento observado:** hay observabilidad útil, pero parcial y agregada; no permite calcular p95/p99 por método/documentVersion ni correlacionar cancelaciones/errores/fallbacks en todos los providers.
- **Comportamiento esperado:** cada request interactiva debe emitir un `PerformanceEvent` homogéneo con método, URI/version/fingerprint, workspace/project, lane, cache result, cancellation/error, payload/result size, budget y outcome.
- **Riesgo:** mejoras o regresiones pueden quedar invisibles; `avg` puede ocultar p95; providers fuera del pipeline no entran en stats ni gates.
- **Impacto hot path:** sí; afecta hover, completion, signature, definition, references, diagnostics, semantic tokens, document symbols y linked editing.
- **Impacto 10,000+ archivos:** alto porque se necesita distinguir latencia local, indexación de fondo, cache hit ratio y payloads grandes.
- **Impacto PowerBuilder:** transversal a todos los constructos servidos por LSP.
- **Recomendación:** introducir `PerformanceEventBus`/`RuntimeMetricsRegistry` central y adaptar providers al mismo evento antes de endurecer gates.
- **Requiere refactor:** sí.
- **Resumen del refactor:** unificar medición por request y mantener `InteractiveServingStatsTracker` como proyección derivada.
- **Backlog relacionado:** `PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01`, `PB-HOTPATH-P1-ACTIVATION-METRICS-CENTRALIZED-01` propuestos; no agregados aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** unit tests de event schema, provider coverage gate, snapshot p95/p99 y budget exceed counters.
- **Estado:** Open.

## FINDING-035 — Worker pool, event loop y GC/memoria no tienen instrumentación ejecutable suficiente

- **Fase:** PHASE 10 — Performance instrumentation and benchmark audit; PHASE 18 — CPU, memory, event loop and worker profiling audit.
- **Severidad:** High.
- **Tipo:** Missing test.
- **Área:** Runtime.
- **Evidencia:** `src/server/indexer/workerPool.ts` mantiene `workers`, `taskQueue` y `activeTasks`, pero no expone queue depth, busy/idle, task duration, serialization cost, failures/restarts ni throughput. `src/server/runtime/memoryBudgets.ts` estima capas y llama `process.memoryUsage()`, pero no monitoriza GC pressure ni event-loop delay. `src/server/runtime/scheduler.ts` expone colas/activos/preemptions, pero no duración por lane ni wait time. `src/server/indexer/workspaceIndexer.ts` usa time slices y `LatencyGovernor`, pero sus métricas quedan en `indexerStatus` operativo. PHASE 18 no encontró uso de `performance.eventLoopUtilization()`/delay sampling ni hooks/samples de GC pressure.
- **Comportamiento observado:** hay controles de time slice, scheduler status y memory budgets, pero faltan métricas continuas de worker busy/idle, event loop blocking, wait time, CPU/serialization y GC.
- **Comportamiento esperado:** runtime debe publicar métricas de worker utilization, queue depth, per-task duration, scheduler wait/run duration por lane, event-loop delay, memory/GC pressure y throughput de indexación.
- **Riesgo:** un workspace grande puede sentirse lento por bloqueo de event loop, saturación de workers o serialización sin que los stats actuales expliquen la causa.
- **Impacto hot path:** sí; background indexing puede competir con providers si no se mide backpressure real.
- **Impacto 10,000+ archivos:** crítico para comprobar que worker pool y scheduler escalan.
- **Impacto PowerBuilder:** afecta parsing/facts de SR*, DataWindow `.srd`, SQL anchors y objetos grandes.
- **Recomendación:** instrumentar `WorkerPool`, scheduler lanes y event-loop delay como parte del runtime stats contract.
- **Requiere refactor:** sí.
- **Resumen del refactor:** añadir métricas y snapshots sin cambiar scheduling behavior; luego conectar gates PHASE 18/20.
- **Backlog relacionado:** `PB-PERF-P1-WORKER-EVENT-LOOP-METRICS-01`, `PB-ARCH-P1-WORKER-SERIALIZATION-PROFILING-01`, `PB-RUNTIME-P1-EVENTLOOP-DELAY-INSTRUMENTATION-01` propuestos; no agregados aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** tests de worker stats, scheduler wait/run counters, event loop delay smoke y memory report schema.
- **Estado:** Open.

## FINDING-036 — Performance gate es valioso pero no cubre la matriz 10,000+ ni todas las features críticas

- **Fase:** PHASE 10 — Performance instrumentation and benchmark audit; PHASE 19 — Synthetic 10,000+ workspace and corpus scalability audit; PHASE 20 — CI and release performance regression gates.
- **Severidad:** Medium.
- **Tipo:** Missing test.
- **Área:** Tests.
- **Evidencia:** `tools/run-performance-budget-gate.mjs` ejecuta suites filtradas por `performance/ci-budget-gate|performance/knowledgeBase|performance/large-workspace-incremental` y exige métricas `[perf-budget]`. `test/server/performance/ci-budget-gate.perf.test.ts` cubre hover/diagnostics estructural/completion/signature/definition/documentSymbols/semanticTokens y batch de 20 archivos sobre corpus público. `test/server/performance/knowledgeBase.perf.test.ts` usa 5000 documentos sintéticos para KB upsert/remove. `test/server/performance/large-workspace-incremental.perf.test.ts` usa 256 archivos baseline y ráfagas 24/96. PHASE 20 confirmó que `release:verify` incluye `test:performance:gate`, pero no una lane nightly/optional 10,000+ ni gates de payload/resultId/cache hit ratio/worker utilization integrados.
- **Comportamiento observado:** el gate previene regresiones básicas, pero no valida 10,000+ archivos, Object Explorer paginado, Current Object Context, diagnostics tiering, semantic tokens delta/resultId, cache hit ratios reales, worker utilization, memory/GC ni LSP payloads grandes.
- **Comportamiento esperado:** PHASE 19/20 deben producir una matriz de performance con smoke CI rápido, nightly 10,000+, corpus PowerBuilder representativo, budgets por feature y reporte JSON estable.
- **Riesgo:** pasar `test:performance:gate` puede dar falsa seguridad sobre escalabilidad interactiva real.
- **Impacto hot path:** sí; varios hot paths no están en el gate actual.
- **Impacto 10,000+ archivos:** alto; aún no hay benchmark integral de 10,000+.
- **Impacto PowerBuilder:** faltan escenarios con muchos DataWindows, SQL, native/external, PFC/STD-like e inheritance chains.
- **Recomendación:** mantener gate actual como baseline, añadir matriz por capas y synthetic corpus 10,000+ en fases 19/20.
- **Requiere refactor:** no inmediato; requiere tests/gates nuevos.
- **Resumen del refactor:** no aplica a product code; sí requiere harness de benchmark y reporting.
- **Backlog relacionado:** `PB-PERF-P1-BENCHMARK-MATRIX-COVERAGE-01`, `PB-PERF-P1-SYNTHETIC-10000-CORPUS-GATE-01`, `PB-CI-P1-REGRESSION-GATE-10K-01` propuestos; no agregados aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** nuevo gate con JSON metrics, feature matrix, corpus 10,000+ y nightly/CI split.
- **Estado:** Open.

## FINDING-037 — `testingMatrixDocs.test` espera una matriz documental que no existe en `docs/testing.md`

- **Fase:** PHASE 11 — Test architecture audit.
- **Severidad:** Medium.
- **Tipo:** Documentation drift.
- **Área:** Tests.
- **Evidencia:** `test/server/unit/testingMatrixDocs.test.ts` espera `### 3.6 Matriz canónica de lanes`, comandos como `npm run test:architecture:rapid`, `npm run test:performance:gate`, `npm run test:performance:soak` y el marcador ``missing: test:real-corpora`` en `docs/testing.md`. La lectura y búsqueda de `docs/testing.md` no encontró esa sección ni esos comandos.
- **Comportamiento observado:** el test de governance documental parece desalineado con el documento canónico actual.
- **Comportamiento esperado:** `docs/testing.md` debe contener la matriz que el test exige, o el test debe reflejar la estructura documental real sin debilitar la validación.
- **Riesgo:** `npm test` puede fallar por drift documental; si el test no se ejecuta por algún filtro, la documentación sigue sin declarar lanes reales.
- **Impacto hot path:** no directo.
- **Impacto 10,000+ archivos:** indirecto, porque la matriz debe separar gates rápidos, performance y corpora reales.
- **Impacto PowerBuilder:** indirecto sobre validación de corpora PB/PFC/STD/DataWindow.
- **Recomendación:** fix documental seguro aplicado en PHASE 14 añadiendo una matriz canónica concisa en `docs/testing.md`.
- **Requiere refactor:** no.
- **Resumen del refactor:** no aplica.
- **Backlog relacionado:** `PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01` generado en PHASE 13; cerrado durante PHASE 14.
- **Validación requerida:** PHASE 15 corrigió los bloqueos TS locales y `npm run test:unit -- --grep "testingMatrixDocs"` pasó con 2 tests. `npm run test:docs:drift` también pasó sin findings.
- **Estado:** Fixed during audit.

## FINDING-038 — Hotspot guard requirió un ratchet temporal explícito para `featureHandlers.ts` y `hover.ts`

- **Fase:** PHASE 11 — Test architecture audit.
- **Severidad:** Medium.
- **Tipo:** Missing test.
- **Área:** Tests.
- **Evidencia:** el guard tenía budgets desfasados (`featureHandlers.ts` `1600`, `hover.ts` `420`) frente al tamaño real del árbol. El ajuste temporal explícito en `tools/run-architecture-hotspot-guard.mjs` fija ahora `src/server/handlers/featureHandlers.ts` con `maxLines: 1680` y `src/server/features/hover.ts` con `maxLines: 440`. La validación posterior dejó `npm run test:unit -- --grep "architectureImports"` y `npm run test:architecture:metrics` en verde, con warnings estrechos `featureHandlers.ts` (`1674/1680`) y `hover.ts` (`437/440`).
- **Comportamiento observado:** el guard deja de estar rojo de forma permanente y vuelve a funcionar como ratchet explícito, pero ambos hotspots quedan deliberadamente muy cerca del techo mientras el split pendiente no se materialice.
- **Comportamiento esperado:** los budgets deben estar alineados con el estado actual y servir como ratchet: no se deben debilitar para ocultar deuda, pero tampoco deben quedar en estado rojo permanente sin backlog/fix asociado.
- **Riesgo:** si no se ejecuta el split pendiente, el equipo puede normalizar ceilings temporales y perder presión arquitectónica sobre los hotspots interactivos.
- **Impacto hot path:** sí; `featureHandlers.ts` registra providers interactivos.
- **Impacto 10,000+ archivos:** medio; el tamaño no causa escala por sí solo, pero bloquea split de providers/caches necesario para escalar.
- **Impacto PowerBuilder:** transversal a todos los providers PB.
- **Recomendación:** mantener el ratchet temporal explícito y programar el split de `featureHandlers.ts`/`hover.ts` antes de volver a endurecer los budgets.
- **Requiere refactor:** sí.
- **Resumen del refactor:** el ratchet temporal quedó aterrizado en el guard; el refactor pendiente sigue siendo mover registros de providers y helpers de hover a módulos dedicados sin cambiar comportamiento.
- **Backlog relacionado:** `PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01`, `PB-ARCH-P24-MODULE-SIZE-FITNESS-01` propuestos; no agregados aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** ejecutar `npm run test:architecture:metrics` y `npm run test:unit -- --grep "architectureImports"` después de cualquier cambio adicional sobre estos hotspots.
- **Estado:** Closed.

## FINDING-039 — Faltan tests ejecutables para diagnostics tiers y semantic tokens delta/result state

- **Fase:** PHASE 11 — Test architecture audit.
- **Severidad:** High.
- **Tipo:** Missing test.
- **Área:** Tests.
- **Evidencia:** `test/server/unit/semanticTokens.test.ts` valida token types/modifiers y usos básicos, pero no prueba `previousResultId`, `SemanticTokensDelta`, `buildEdits`, invalidación por fingerprint/result state ni respuesta delta. Búsqueda de `previousResultId|SemanticTokensDelta|buildEdits` en `test/**` no encontró cobertura real. Diagnostics tiene `diagnosticScheduler.test.ts` y múltiples tests de reglas, pero la API sigue `buildDiagnosticsForDocument(document, 'syntactic' | 'full')`; no hay test de Tier 0-4 ni registry de reglas.
- **Comportamiento observado:** PHASE 7 detectó gaps de diseño y PHASE 11 confirma que aún faltan tests que los congelen.
- **Comportamiento esperado:** semantic tokens debe tener tests full/range/delta/resultId/fingerprint; diagnostics debe tener tests de tier pipeline, rule metadata, caps, cancellation y stale version.
- **Riesgo:** refactors de tokens/diagnostics pueden pasar tests actuales y seguir rompiendo instantaneidad, delta correctness o noise policy.
- **Impacto hot path:** sí; diagnostics y semantic tokens son hot paths visibles.
- **Impacto 10,000+ archivos:** alto por documentos grandes, diagnósticos en oleadas y token payloads.
- **Impacto PowerBuilder:** afecta scopes, system catalog, DataWindow advisory diagnostics, SQL/native y tokens semánticos PowerScript.
- **Recomendación:** bloquear refactors PHASE 7 con tests contract-first antes de mover código.
- **Requiere refactor:** no de product code inmediato; requiere test architecture.
- **Resumen del refactor:** no aplica; los refactors productivos dependen de tests nuevos.
- **Backlog relacionado:** `PB-TEST-P1-DIAGNOSTICS-TIER-CONTRACT-TESTS-01`, `PB-TEST-P1-SEMANTIC-TOKENS-DELTA-CONTRACT-TESTS-01` propuestos; no agregados aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** new unit/contract tests and `npm run test:performance:gate` extension for tokens/diagnostics budgets.
- **Estado:** Open.

## FINDING-040 — Architecture conformance tests son útiles pero demasiado textuales para los gates objetivo

- **Fase:** PHASE 11 — Test architecture audit; PHASE 17 — Architecture fitness functions and conformance gates; PHASE 24 — Simplification and maintainability fitness functions.
- **Severidad:** Medium.
- **Tipo:** Missing test.
- **Área:** CI.
- **Evidencia:** `test/server/unit/semanticArchitectureConformance.test.ts` comprueba patrones de texto como `KnowledgeBase.publishedState` y presencia de `documentSemanticVersion`/`epoch` en cache key contract. `test/server/unit/architectureImports.test.ts` sí aporta gates de imports relevantes, pero la protección contra bypass de `SemanticQueryFacade`, direct `resolveTargetEntityDetailed`, full scans en hot paths, duplicate builders o DataWindow/SQL deep logic no usa AST/import graph semántico ni allowlists por método. PHASE 17/24 añadió que tampoco se observó gate de ciclos de imports, provider lane/budget/cache declarations, registry de cache contracts o legacy markers con retirement metadata.
- **Comportamiento observado:** los gates actuales detectan algunas violaciones gruesas, pero no todos los drifts que PHASE 6/9/17 requieren.
- **Comportamiento esperado:** architecture conformance debe tener análisis estructural de imports/calls, allowlists explícitas y coverage por provider/cache/surface, además de cycle detection, cache registry checks, legacy-retirement metadata y ratchets de tamaño/duplicación.
- **Riesgo:** código nuevo puede evitar el patrón textual y aun así violar source-of-truth, facade o hot path rules.
- **Impacto hot path:** sí, por providers y caches.
- **Impacto 10,000+ archivos:** alto si un bypass introduce scans o resolución global.
- **Impacto PowerBuilder:** transversal a submodelos DataWindow/SQL/native y semantics.
- **Recomendación:** PHASE 17 debe transformar estos checks en fitness functions estructurales; mientras tanto, conservar los tests textuales como smoke de bajo coste.
- **Requiere refactor:** sí, de tests/tools.
- **Resumen del refactor:** crear conformance scanner con AST/import graph y allowlists versionadas.
- **Backlog relacionado:** `PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01`, `PB-ARCH-P0-CYCLE-DETECTION-01`, `PB-ARCH-P1-CACHE-KEY-SYMMETRY-01`, `PB-ARCH-P1-PROVIDER-ADAPTER-CONTRACT-01` propuestos; no agregados aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** fixtures de violación negativa y gate `npm run test:architecture:rapid`/`metrics` actualizado.
- **Estado:** Open.

## FINDING-041 — Integración LSP cubre solo parte de los providers críticos

- **Fase:** PHASE 11 — Test architecture audit.
- **Severidad:** Medium.
- **Tipo:** Missing test.
- **Área:** Tests.
- **Evidencia:** `test/server/integration/` contiene 3 tests: `lsp-hover.test.ts`, `lsp-documentSymbols.test.ts` y `lsp-diagnostics.test.ts`. Providers como completion, completion resolve, signature help, definition, references, rename, semantic tokens y linked editing tienen unit tests, pero no se observó integración LSP equivalente.
- **Comportamiento observado:** la suite valida mucha lógica pura, pero no todos los providers críticos conectados al servidor/handlers/capabilities.
- **Comportamiento esperado:** cada provider hot path debe tener al menos un contract/integration test mínimo del entrypoint LSP o handler registration, además de unit tests de lógica.
- **Riesgo:** wiring/capability/cache/stale behavior puede romperse aunque la función pura siga pasando.
- **Impacto hot path:** sí.
- **Impacto 10,000+ archivos:** medio; la integración debe validar degraded/stale mientras indexa.
- **Impacto PowerBuilder:** afecta flujo de edición real para PowerScript/DataWindow-aware features.
- **Recomendación:** ampliar integración LSP por providers prioritarios y usar fixtures pequeños deterministas.
- **Requiere refactor:** no.
- **Resumen del refactor:** no aplica; requiere pruebas nuevas.
- **Backlog relacionado:** `PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** integration tests para completion/signature/definition/references/semanticTokens/rename y smoke mínimo de capabilities.
- **Estado:** Open.

## FINDING-042 — Payload budgets existen pero no están endurecidos como gate de release por superficie

- **Fase:** PHASE 20 — CI and release performance regression gates.
- **Severidad:** Medium.
- **Tipo:** Missing test.
- **Área:** CI.
- **Evidencia:** `src/server/serving/payloadBudget.ts` existe como soporte de presupuesto de payload y PHASE 10 confirmó medición parcial en `InteractiveServingStatsTracker`. PHASE 20 confirmó que `test:performance:gate` cubre latencias y algunas features, pero no fuerza un presupuesto LSP/read-only payload uniforme para hover, completion, diagnostics, semantic tokens, Object Explorer, Current Object Context y support/AI bundles en release.
- **Comportamiento observado:** los límites de payload son parciales y no protegen todas las superficies grandes en CI/release.
- **Comportamiento esperado:** cada provider/superficie con payload potencialmente grande debe emitir `payloadBytes/resultSize`, presupuesto, outcome y failure/warning gate según lane.
- **Riesgo:** una regresión de payload puede pasar por latencia baja en corpus pequeño y degradar VS Code en workspaces grandes.
- **Impacto hot path:** sí, por LSP payload y render de UI.
- **Impacto 10,000+ archivos:** alto; Object Explorer, diagnostics, references y tokens pueden crecer con el corpus.
- **Impacto PowerBuilder:** afecta objetos, DataWindows, diagnostics, SQL anchors, symbols y bundles de soporte.
- **Recomendación:** ampliar `test:performance:gate`/release con budgets de payload por feature y artefacto JSON estable.
- **Requiere refactor:** no inmediato; requiere instrumentation/gate.
- **Resumen del refactor:** conectar payload budget con `PerformanceEvent` y gates de CI.
- **Backlog relacionado:** `PB-ARCH-P1-LSP-PAYLOAD-BUDGET-ENFORCE-01` propuesto; no agregado aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** tests de payload en corpus pequeño y nightly 10,000+, con límites por feature y receipts de truncation/pagination.
- **Estado:** Open.

## FINDING-043 — Estados stale/degraded/paged existen como contrato parcial pero no como UX visible y uniforme

- **Fase:** PHASE 21 — Perceived instantaneity and UX state audit.
- **Severidad:** Medium.
- **Tipo:** UX issue.
- **Área:** UI.
- **Evidencia:** `src/server/workspace/readiness.ts` define estados `idle`, `discovering`, `indexing`, `degraded`, `ready`, `error`. `src/shared/publicApi.ts` contiene campos como `degraded?: boolean` y `staleReason?: string` en algunas superficies. PHASE 8 registró `FINDING-027` sobre ausencia de envelope común de frescura/caps/receipts. PHASE 21 no encontró un contrato UI uniforme que muestre al usuario estados paged/stale/degraded, ETA/progreso o fallback visible en Object Explorer, Current Object Context, Diagnostics Explainability y support bundles.
- **Comportamiento observado:** hay readiness y metadata parcial, pero la UX puede mostrar paneles vacíos, datos parciales o refrescos heurísticos sin mensaje consistente.
- **Comportamiento esperado:** toda superficie read-only debe renderizar loading/degraded/stale/ready/paged/error de forma coherente, con manual refresh fallback y receipts de truncation/pagination cuando aplique.
- **Riesgo:** el plugin puede ser técnicamente no bloqueante pero sentirse roto o incompleto mientras indexa.
- **Impacto hot path:** medio; afecta percepción de instantaneidad y refrescos de paneles.
- **Impacto 10,000+ archivos:** alto; workspaces grandes pasan más tiempo en estados parciales.
- **Impacto PowerBuilder:** afecta navegación por objetos, contexto actual, diagnostics, DataWindow/SQL summaries y bundles IA/soporte.
- **Recomendación:** definir `ReadOnlySurfaceStateEnvelope` visible en cliente y tests/smoke de hover/completion/Object Explorer mientras indexa.
- **Requiere refactor:** sí.
- **Resumen del refactor:** centralizar estados UI/read-only y adaptar views/panels a receipts server-driven.
- **Backlog relacionado:** `PB-UX-P2-DEGRADED-STALE-MESSAGING-UI-01`, `PB-UX-P2-PROGRESS-REPORTING-ETA-01`, `PB-UX-P2-HOVER-COMPLETION-INDEXING-VERIFY-01` propuestos; no agregados aún a [docs/backlog.md](../backlog.md).
- **Validación requerida:** smoke/integration de readiness parcial, Object Explorer lazy state, manual refresh feedback y hover/completion usable durante indexing.
- **Estado:** Open.

## FINDING-044 — SignatureHelp no resolvía funciones globales del catálogo en contexto de llamada

- **Fase:** PHASE 15 — Validation.
- **Severidad:** High.
- **Tipo:** Contract bug.
- **Área:** Semantic resolution.
- **Evidencia:** `npm run test:performance:gate` falló en `performance/ci-budget-gate` con `assert.ok(signature)` aunque el tiempo de `synthetic-hot-signatureHelp` estaba dentro de budget. El test focal `npm run test:unit -- --grep "interactiveHotPathGuards"` reprodujo el mismo fallo en `provideSignatureHelp` sobre `MessageBox("Title", "Message"`.
- **Comportamiento observado:** `resolveTargetEntityDetailed` consultaba el catálogo del sistema para símbolos globales en la rama no-call, pero en la rama call (`argumentCount` definido) sólo probaba candidatos de instancia/workspace y no caía a `resolveSystemGlobalFunction`/`resolveSystemGlobal`.
- **Comportamiento esperado:** una llamada PowerBuilder a una función global del sistema como `MessageBox` debe resolverse contra el catálogo cuando no hay candidato de workspace más específico, preservando reason code/evidencia de fallback global.
- **Riesgo:** Signature Help y cualquier consumidor de `SemanticQueryFacade` podían devolver null para funciones globales del sistema durante escritura, generando una regresión visible en hot path.
- **Impacto hot path:** alto; afecta `signatureHelp` interactivo.
- **Impacto 10,000+ archivos:** bajo directo, pero alto en percepción porque el bug no depende del tamaño del workspace.
- **Impacto PowerBuilder:** alto para funciones globales PowerBuilder del catálogo, incluyendo patrones PFC/STD que usan llamadas de sistema.
- **Recomendación:** fix aplicado durante auditoría: la rama call ahora cae al catálogo del sistema cuando no hay targets de instancia/workspace; el gate de performance usa además un fixture dedicado y estable para `signatureHelp`.
- **Requiere refactor:** no.
- **Resumen del refactor:** cambio puntual en resolución semántica y estabilización del fixture de performance.
- **Backlog relacionado:** ninguno abierto; corregido durante PHASE 15.
- **Validación requerida:** `npm run test:unit -- --grep "interactiveHotPathGuards"` pasó con 2 tests; `npm run test:performance:gate` pasó con 4 tests y todos los budgets en ok.
- **Estado:** Fixed during audit.
