# Backlog — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/architecture-implementation-map.md`
- `docs/semantic-design-target.md`
- `docs/semantic-design-assumptions.md`

---

## 0. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Toda spec, auditoría o mejora nueva debe respetar esta meta. Si una mejora aumenta complejidad pero no mejora velocidad percibida, estabilidad, seguridad semántica, entendimiento real de PowerBuilder o utilidad profesional, no debe priorizarse sobre el core.

---

## 0.1. Decisiones cerradas de diseño semántico

Estas decisiones gobiernan la ejecución del backlog semántico y arquitectónico:

1. `SemanticQueryResult` se implementará primero como **envelope incremental sobre `ResolvedTargetInfo`**, no como reescritura big-bang.
2. `PublishedSemanticSnapshot` será **contrato readonly sobre `KnowledgeBase.publishedState`**, no store paralelo.
3. La invalidación empezará como **contrato event-driven con tests y métricas**, no como mega-módulo coordinador inicial.
4. `ReadOnlyReportCache` queda como nombre histórico/conceptual; el nombre objetivo para implementación futura es `ReadOnlyProjectionCache`.
5. `SemanticEnrichment` es **etapa conceptual**, no módulo obligatorio nuevo.
6. `SemanticQueryFacade` admite excepciones sólo para análisis estructural por documento sin identidad global, sin confidence semántica y con tests/documentación.
7. DataWindow, SQL y Transaction serán **submodelos safe/advisory**, no core semántico fuerte equivalente a PowerScript.
8. `PB-ARCH-*` gobierna contrato/arquitectura/conformance; `PB-SEMANTIC-*` implementa funcionalidad concreta/hardening.

---

## 0.2. Orden de ejecución recomendado

> Este orden prevalece sobre la prioridad individual cuando existan dependencias arquitectónicas.

```txt
1. PB-TEST-P0-TESTING-DOCS-LANE-MATRIX-ALIGNMENT-01
2. PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01 (cerrado; ver docs/done-log.md)
3. PB-ARCH-P0-PUBLISHED-SNAPSHOT-IMMUTABILITY-01 (cerrado; ver docs/done-log.md)
4. PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01 (cerrado; ver docs/done-log.md)
5. PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01 (parcial; pipeline cableado, performance gate por tier pendiente)
6. PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01 (parcial; cross-val ejecutable lista, métricas pendientes)
7. PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01 (parcial; cola serializada e invariants ejecutables ya gobiernan runtime/tests, warm restore compatible pendiente)
8. PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01 (parcial; diagnosticScheduler protegido, open/change bounded pendiente)
9. PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01 (parcial; bounded discovery ya es path opt-in/warm-resume, manifest skip real pendiente)
10. PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01 (parcial; conformance scanner cableado, métricas/matriz pendientes)
11. PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01 (parcial; validación local directa lista, CI VS Code pendiente)
12. PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01 (parcial; result state ya versiona `sourceOrigin`/`legendVersion` y el provider degrada a full, host/range/métricas pendientes)
13. PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01
14. PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01 (parcial; `ApiReadOnlyProjectionEnvelope` opcional y piloto en `workspace-check`, adopción cross-surface pendiente)
15. PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01
16. PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01 (parcial; boundary mínimo, wrapper bounded y receipt en Current Object Context listos, convergencia cross-consumer pendiente)
17. PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01
18. PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01 (parcial; estados históricos 46/47/48 reconciliados, cierre final tras convergencia documental completa del submodelo DataWindow)
19. PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01
20. PB-PERF-P2-10K-SEMANTIC-CORPUS-01
21. PB-CI-P1-REGRESSION-GATE-10K-PAYLOAD-01
22. PB-UX-P2-DEGRADED-STALE-MESSAGING-UI-01
23. PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01
24. PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01
25. PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01
26. PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01
--
46. PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01
47. PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01
48. PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01
```

---

## 1. Cómo debe usar este backlog una IA

- Ejecutar por el orden de la sección `0.2` cuando existan dependencias arquitectónicas o solapes entre specs.
- No abrir ítems si sus dependencias no están cerradas, salvo trabajo preparatorio claro.
- No ejecutar ítems `Superseded`.
- No ejecutar `PB-SEMANTIC-*` si su `PB-ARCH-*` padre define un contrato todavía abierto, salvo trabajo preparatorio explícito.
- Crear sub-specs solo cuando vaya a implementarse el ítem.
- No cerrar si falta código real, tests/validación suficiente, documentación alineada y actualización de roadmap/current-focus si aplica.
- Si un ítem crece demasiado, dividir en sub-specs; no duplicar ítems padre.
- Registrar deuda nueva en **Backlog derivado**.
- Tratar `plugin_old` como guía, dataset y referencia de patrones probados, no como código a portar por inercia.
- Las dependencias hacia ítems `Done` se consideran ya satisfechas y quedan solo como trazabilidad histórica.
- No sacrificar la meta maestra por features secundarias.
- `generated` debe representar la fuente oficial reproducible; `manual/curated` solo debe contener gaps, enrichments, overrides o candidates con política explícita.
- La localización no debe duplicar símbolos ni traducir nombres reales de PowerBuilder. Debe aplicarse como overlay de documentación en consumers, con fallback al texto oficial.
- Durante la fase de auditorías, no añadir nuevas features salvo que una auditoría detecte un bug, riesgo o gap arquitectónico real.
- Los hallazgos de auditoría que no se corrijan dentro de la auditoría deben ir a **Backlog derivado**, con evidencia, riesgo, plan y validación.
- Los ítems marcados previamente como `Done` por una auditoría pasan a `Open` si una revisión posterior detecta que necesitan verificación, hardening, corrección de criterio o validación real en runtime.
- Los errores reales capturados en runtime sobre corpus PowerBuilder/PFC tienen prioridad sobre mejoras cosméticas o nuevas features.
- Ningún diagnóstico informativo debe ensuciar el editor por defecto si describe un patrón normal de PowerBuilder y no un problema accionable.
- El lexer/parser debe tokenizar correctamente strings, comentarios y continuaciones antes de ejecutar reglas semánticas, balanceo de paréntesis o resolución de símbolos.
- Un self-test de runtime no puede considerarse suficiente si solo valida snapshots internos. Debe incluir probes funcionales de features interactivas críticas: hover built-in, definition low-confidence, serving cache, view providers y readiness transitions.
- Si `Readiness = ready` e `Indexer = ready`, pero hover/paneles/definition no funcionan, el fallo debe clasificarse como problema de serving/runtime interactivo, no como discovery/indexing salvo evidencia directa.
- Las capacidades opcionales de build/ORCA no deben contaminar el estado de salud del language runtime. Build blocked u ORCA missing deben aparecer como capabilities separadas, no como bloqueo del hover, Object Explorer, Current Context, Diagnostics Explainability o diagnostics.
- Las requests interactivas LSP deben ser deterministas: una request repetida para el mismo provider/URI/posición/documentVersion debe deduplicarse o resolverse desde cache/negative-cache, nunca entrar en spam de scheduler.
- Los built-ins/system functions de PowerScript deben resolverse antes que el workspace index. No deben depender de discovery completo ni de PBAutoBuild/ORCA.
- Las views contribuidas por `package.json` deben registrar siempre su provider durante `activate()`. Los datos pueden degradar; el provider no puede faltar.
- No crear stores semánticos paralelos a `KnowledgeBase.publishedState`.
- No introducir full scans in hot paths de hover, completion, signature help, definition, references, semantic tokens o diagnostics.
- No cachear resultados como verdad: toda cache debe declarar epoch/fingerprint/sourceOrigin/locale/projection cuando aplique.
- Las surfaces read-only grandes deben tener caps, paginación, receipts o truncation explícita.

### 1.1. Checklist final para agentes Copilot

```txt
1. Re-read changed code.
2. Verify no generated/manual ID changed unless the spec explicitly authorizes a breaking change.
3. Verify no full-catalog scans were introduced in hot paths.
4. Verify registry/datasets imports remain stable and not slice-exploded.
5. Verify manual/common.ts contains factories/helpers only.
6. Verify consistency report catches new structural errors.
7. Verify docs/backlog/current-focus/roadmap are aligned.
8. Verify tests are green.
9. Verify done-log is updated only for fully closed specs/audits.
10. If real corpora are required but absent, document honest skip paths and do not fake results.
11. If a finding is not fixed, register it in Backlog derivado with evidence and validation criteria.
12. Do not create new feature specs unless the audit proves a real architectural or correctness need.
13. Validate fixes against the captured PowerBuilder/PFC cases in section 4 before closing parser, diagnostics, hover, discovery, serving-cache or view-provider work.
14. Verify diagnostics severity: real correctness issues may be diagnostics; confidence/context warnings should prefer hover/context panels unless explicitly configured.
15. Verify RuntimeSelfTest has both core checks and functional interactive probes before trusting a green result.
16. Verify hover built-ins such as IsNull/UpperBound/String/Long/MessageBox work without workspace index readiness.
17. Verify contributed views have registered providers and never show VS Code native “no data provider registered”.
18. Verify repeated hover/definition requests are deduplicated or negative-cached.
19. Verify build/ORCA warnings are not used as blockers for interactive language features.
20. Verify no semantic store parallel to KnowledgeBase was introduced.
21. Verify providers do not resolve semantic identity outside SemanticQueryFacade unless exception is documented.
22. Verify cache keys include required epoch/fingerprint/sourceOrigin/locale where applicable.
23. Verify reports/read-only surfaces are capped/paged/receipted.
24. Verify confidence/evidence/reason codes are not hardcoded without evidence.
25. Verify PB-ARCH/PB-SEMANTIC relationship was respected: architecture contract first, functional implementation after.
```

---

## 2. Estados oficiales

- **Open:** pendiente real de auditoría, corrección, revisión o validación.
- **Partial:** implementación parcial o primer corte operativo, pero faltan criterios de cierre.
- **Blocked:** no puede avanzar por dependencia, entorno o decisión explícita.
- **Done:** código, tests, documentación y validación cerrados; vive en `done-log.md`, no en backlog activo.
- **Superseded:** ítem absorbido por otra spec activa o cerrada; no debe ejecutarse de forma independiente.
- **Open by conformance:** ítem histórico cuyo contrato sigue siendo relevante como trazabilidad, pero cuyo owner ejecutable activo vive en otro ítem/spec y requiere evidencia adicional antes de cerrarse.

Un ítem `Partial` debe incluir, siempre que sea posible:

```md
**Pendiente exacto:**
- ...
```

---

# 3. Backlog actual


---

# 4. Backlog arquitectónico y semántico

## 4.1. Backlog arquitectónico final — Diseño semántico objetivo

> Esta sección deriva de docs/semantic-design-target.md y docs/semantic-design-assumptions.md.

---

## PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01 — DataWindow Submodel Publication
- **Estado:** Open by conformance.
- **Prioridad:** P1.
- **Orden recomendado:** 46.
- **Objetivo:** Publicar el submodelo DataWindow (columns, retrieve args, expressions) como parte del snapshot semántico y la fachada.
- **Owner ejecutable:** `PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01`.
- **Estado actual:** existe un boundary mínimo en `src/server/semantic/submodels/datawindow/`, `Current Object Context` ya consume un wrapper bounded de bindings y el path legacy `src/server/features/dataWindowBindingProjection.ts` quedó como compat layer.
- **Pendiente exacto:** publicar el boundary para más consumers sin mover el parser principal ni `propertyPaths` sin paridad adicional.

---

## PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01 — SQL Anchors Submodel
- **Estado:** Superseded.
- **Prioridad:** P2.
- **Orden recomendado:** 47.
- **Objetivo:** Implementar el submodelo de anchors SQL para host variables y lineage de statements.
- **Owner ejecutable:** `specs/PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01.md` y el tramo runtime activo `PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01`.

---

## PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01 — Native Metadata Submodel
- **Estado:** Superseded.
- **Prioridad:** P2.
- **Orden recomendado:** 48.
- **Objetivo:** Clasificar y exponer metadatos de funciones externas y tipos nativos con riesgo de invocación explícito.
- **Owner ejecutable:** `specs/PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01.md`.

---

# 5. Backlog derivado — Macroauditoría Instant Semantic and Indexing Runtime

Esta sección se generó en PHASE 13 de la macroauditoría `audit-instant-semantic-indexing`, después de completar PHASE 24. Los ítems agrupan hallazgos relacionados para evitar specs duplicadas y deben enlazarse con [docs/audits/macro-instant-semantic-indexing-findings.md](audits/macro-instant-semantic-indexing-findings.md) y [docs/instant-semantic-indexing-target.md](instant-semantic-indexing-target.md).

## PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01 — Pipeline diagnostics por tiers y registry de reglas

- **ID:** PB-DIAG-P0-TIERED-DIAGNOSTICS-REGISTRY-01.
- **Estado:** Partial.
- **Prioridad:** P0.
- **Orden recomendado:** 5.
- **Origen:** Macroauditoría PHASE 7/9/11/22.
- **Findings:** FINDING-025, FINDING-029, FINDING-039.
- **Referencias de evidencia:** `src/server/features/diagnostics.ts`, `src/server/features/diagnosticsExtra.ts`, `src/server/features/obsoleteDetector.ts`, `test/server/unit/diagnosticScheduler.test.ts`.
- **Estado actual:** `buildDiagnosticsForDocument` ya usa `DiagnosticRuleRegistry` para separar diagnósticos inmediatos (tier 0/1) de los interactivos (tier 2), valida que todos los códigos emitidos estén registrados y preserva la compatibilidad de `publishDiagnostics`/scheduler.
- **Estado objetivo:** reglas registradas con tier, lane, budget, cap, sourceOrigin policy, confidence floor, reason codes y tests.
- **Riesgo:** ruido, bloqueos en open/change y checks advisory publicados como certeza.
- **Objetivo:** diagnósticos rápidos, honestos y escalables.
- **Depends on:** PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01.
- **Tipo de refactor:** Split.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** alto.
- **Impacto 10,000+ archivos:** alto.
- **Impacto semántico PowerBuilder:** PowerScript, DataWindow, SQL/Transaction, native/external, PFC/STD.
- **Acceptance criteria:** `buildDiagnosticsForDocument` queda compat layer; tiers 0-4 tienen tests; registry metadata obligatoria; paridad de diagnostics actuales validada.
- **Docs afectadas:** `docs/rules-catalog.md`, `docs/testing.md`, target architecture.
- **Tests requeridos:** unit tests de registry/tier/caps/cancellation/stale; performance gate diagnostics.
- **Métricas requeridas:** latencia por tier, count por rule, cap/truncation.
- **Validación:** `npm run test:unit -- --grep "diagnostic"`, performance gate ampliado.
- **Criterios de retirada:** borrar dispatch monolítico cuando registry cubra reglas existentes.
- **Pendiente exacto:**
  - Añadir métricas/performance gate por tier para `diagnostics`.
  - Mantener cobertura de hot path para asegurar que open/change no reintroducen tiers altos inline fuera del scheduler.

## PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01 — Registry de caches y discriminadores fingerprint/epoch/sourceOrigin

- **ID:** PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01.
- **Title:** Registry de caches y discriminadores fingerprint/epoch/sourceOrigin.
- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 6.
- **Origen:** Macroauditoría PHASE 0/5/17.
- **Findings:** FINDING-002, FINDING-017, FINDING-018, FINDING-040.
- **Referencias de evidencia:** `src/server/serving/cacheKeyContract.ts`, `test/server/unit/cacheKeyContract.test.ts`, completion resolve context, `HotContextCache`.
- **Estado actual:** `cacheKeyContract.ts` y `CacheDescriptorRegistry` ya quedan cruzados por tests ejecutables; `prefix` participa tanto en builder como en stale matcher y `completion-resolve` usa `documentFingerprint` del snapshot del documento.
- **Estado objetivo:** registry declarativo de caches con owner, key fields, invalidation, stale policy, memory/persistence y tests de simetría.
- **Riesgo:** stale data, sobreinvalidación por epoch global y hit ratio bajo.
- **Objetivo:** hacer cada cache una proyección invalidable, nunca verdad.
- **Depends on:** PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01.
- **Tipo de refactor:** Cache centralization.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** alto.
- **Impacto 10,000+ archivos:** alto.
- **Impacto semántico PowerBuilder:** completion/hover/current context/DataWindow/sourceOrigin.
- **Acceptance criteria:** todo cache hot/warm declara fields; tests fallan si descriptor y builder divergen; `prefix` y `documentFingerprint` quedan aclarados.
- **Docs afectadas:** `docs/performance-budget.md`, `docs/architecture.md`.
- **Tests requeridos:** cache key symmetry tests, invalidation tests.
- **Métricas requeridas:** hit ratio y invalidation reason counts.
- **Validación:** unit tests y performance smoke de cache hit/miss.
- **Criterios de retirada:** retirar builders ad hoc cuando registry cubra caches interactivos.
- **Pendiente exacto:**
  - Instrumentar métricas de hit ratio y reason counts por cache interactiva.

## PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01 — Invariantes entre index state, caches y persistencia

- **ID:** PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01.
- **Title:** Invariantes entre index state, caches y persistencia.
- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 7.
- **Origen:** Macroauditoría PHASE 4/5/9B.
- **Findings:** FINDING-011, FINDING-015, FINDING-016, FINDING-033.
- **Referencias de evidencia:** `workspaceState`, `analysisCache`, `DocumentCache`, `workspaceIndexer`, cache journal/checkpoint.
- **Estado actual:** `semanticCacheRuntimeController` serializa journal/checkpoint/serving snapshot mediante `PersistenceWriteQueue`, `lifecycleHandlers` persiste checkpoints a través del runtime controller y las invariants ya se ejercitan sobre flujos reales `indexed/restored` y sobre warm start con evicción del `DocumentCache` sin pérdida semántica publicada.
- **Estado objetivo:** state machine con invariantes: indexed/restored/fingerprint/sourceOrigin/published snapshot coherentes; persistence no depende de LRU; writes serializados.
- **Riesgo:** warm start falso, pérdida de mutaciones, reindex costoso y stale state.
- **Objetivo:** hacer warm start seguro y verificable a escala.
- **Depends on:** PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01.
- **Tipo de refactor:** Contract centralization.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** medio.
- **Impacto 10,000+ archivos:** alto.
- **Impacto semántico PowerBuilder:** project routing, sourceOrigin, PBL/PBPROJ/PBSLN y corpus indexado.
- **Acceptance criteria:** invariants test suite; checkpoint persiste corpus completo/particionado; journal writes serializados; warm restore puede evitar full read/hash cuando hay evidencia.
- **Docs afectadas:** performance budget, architecture status.
- **Tests requeridos:** restore clean/dirty, eviction no semantic loss, concurrent journal restore, watcher invalidation.
- **Métricas requeridas:** warm restore time, skipped files, checkpoint size, pending writes.
- **Validación:** unit/performance tests de persistence y warm start.
- **Criterios de retirada:** retirar fallback que trata LRU como corpus persisted.
- **Pendiente exacto:**
  - Conectar warm restore compatible con manifest/fingerprints para evitar full read/hash real cuando la evidencia lo permita.
  - Añadir cobertura de `watcher invalidation` / `dirty restore transitions` sobre el indexer principal.
  - Publicar métricas de warm restore/pending writes en los gates de performance correspondientes.

## PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01 — Migrar open/change y cancelación a Near/Background seguro

- **ID:** PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01.
- **Title:** Migrar open/change y cancelación a Near/Background seguro.
- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 8.
- **Origen:** Macroauditoría PHASE 4/6.
- **Findings:** FINDING-012, FINDING-013.
- **Referencias de evidencia:** scheduler, document handlers, open/change diagnostics/invalidation paths.
- **Estado actual:** `diagnosticScheduler` ya usa `GenerationGuard` y evita commits stale; la migración pendiente se concentra en `open/change` y en los schedulers interactivos restantes que todavía no están acotados a fanout Near/Background.
- **Estado objetivo:** cancelación con generation guards y open/change bounded: local parse/Tier 0-1 inmediato, semantic fanout Near/Background.
- **Riesgo:** commits stale, event loop ocupado y latencia al escribir.
- **Objetivo:** preservar instantaneidad mientras indexa o edita.
- **Depends on:** PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01.
- **Tipo de refactor:** Scheduler migration.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** crítico.
- **Impacto 10,000+ archivos:** alto.
- **Impacto semántico PowerBuilder:** diagnostics, invalidación de ancestors, DataWindow/SQL advisory.
- **Acceptance criteria:** tests demuestran no stale commit tras cancel; open/change no ejecuta full semantic cascade sin budget; diagnostics Tier 0/1 inmediato.
- **Docs afectadas:** developer workflows, testing, target architecture.
- **Tests requeridos:** scheduler cancellation tests, hot path guards, diagnostics open/change tests.
- **Métricas requeridas:** cancel latency, open/change duration, background backlog.
- **Validación:** unit + performance hot path gate.
- **Criterios de retirada:** retirar path síncrono de invalidación semántica completa en open/change.
- **Pendiente exacto:**
  - Integrar `GenerationGuard` en los schedulers interactivos restantes (`references` y cualquier host path adicional que siga sin guard explícito).
  - Migrar open/change a Near/Background bounded para fanout semántico.
  - Tests de hot path guards para open/change sin full semantic cascade.

## PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01 — Discovery bounded async y warm start validable

- **ID:** PB-DISCOVERY-P1-BOUNDED-ASYNC-DISCOVERY-WARMSTART-01.
- **Title:** Discovery bounded async y warm start validable.
- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 9.
- **Origen:** Macroauditoría PHASE 4/19.
- **Findings:** FINDING-011, FINDING-014, FINDING-036.
- **Referencias de evidencia:** workspace discovery, workspaceIndexer, rapid architecture gate, performance tests.
- **Estado actual:** `discoverWorkspaceBounded` ya puede ejecutarse como path real opt-in/warm-resume desde `lifecycleHandlers`, comparte progreso con el discovery clásico y tiene paridad básica probada sin manifest; el skip real por manifest/fingerprints compatibles sigue pendiente.
- **Estado objetivo:** discovery I/O async con concurrencia acotada, ignores/caps, progress receipts y warm start que evita full read/hash si manifest/fingerprints son compatibles.
- **Riesgo:** activación/indexing lentos en workspaces grandes.
- **Objetivo:** descubrir e indexar sin bloquear VS Code.
- **Depends on:** PB-CACHE-P1-PERSISTENCE-INDEX-STATE-INVARIANTS-01.
- **Tipo de refactor:** Scheduler migration.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** medio/alto.
- **Impacto 10,000+ archivos:** crítico.
- **Impacto semántico PowerBuilder:** PBW/PBT/PBPROJ/PBSLN/PBL folders, library paths, paths con espacios.
- **Acceptance criteria:** discovery bounded con progress; warm restore skip real; fallback conservador documentado; tests con paths y corpus sintético.
- **Docs afectadas:** performance budget, troubleshooting.
- **Tests requeridos:** discovery perf, warm start tests, corpus 10k smoke.
- **Métricas requeridas:** files/sec, cancel latency, skipped files, manifest validation time.
- **Validación:** `test:performance:gate` ampliado y nightly 10k.
- **Criterios de retirada:** retirar full index obligatorio en restore compatible.
- **Pendiente exacto:**
  - Wiring de manifest/receipts para materializar `skipped files` reales en warm start compatible.
  - Tests de performance gate con corpus 10k smoke.
  - Integración con el indexer principal para evitar full read/hash cuando el restore sea compatible.

## PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01 — Adapter contract para providers interactivos

- **ID:** PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01.
- **Title:** Adapter contract para providers interactivos.
- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 10.
- **Origen:** Macroauditoría PHASE 6/17/22.
- **Findings:** FINDING-003, FINDING-010, FINDING-020, FINDING-021, FINDING-022, FINDING-023, FINDING-024, FINDING-041.
- **Referencias de evidencia:** `featureHandlers`, references, CodeLens, Current Object Context, document/workspace symbols, health/status providers.
- **Estado actual:** `ProviderAdapterContract` ya declara `cachePolicy`/`sourceScope` además de lane, budget, degradación y `allowsFullScan: false`; `tools/architecture-conformance-scanner.mjs` falla si falta metadata, si `allowsFullScan` cambia o si `cachePolicy`/`cacheFeature` divergen.
- **Estado objetivo:** cada provider declara feature, lane, budget, cache, stale guard, cancel policy, degraded result, metrics y facade usage.
- **Riesgo:** regresiones de latencia y lógica semántica duplicada.
- **Objetivo:** thin providers sobre facade/caches/projections.
- **Depends on:** PB-ARCH-P0-SEMANTIC-QUERY-RESULT-CONTRACT-HARDENING-01, PB-RUNTIME-P1-SCHEDULER-CANCELLATION-HOTPATH-MIGRATION-01.
- **Tipo de refactor:** Adapter.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** crítico.
- **Impacto 10,000+ archivos:** alto.
- **Impacto semántico PowerBuilder:** todos los providers PowerScript/DataWindow-aware.
- **Acceptance criteria:** registry/adapters por provider; conformance falla si falta lane/budget/cache/degraded; providers críticos no hacen full scans.
- **Docs afectadas:** architecture, testing.
- **Tests requeridos:** provider contract tests, hot path guards, cross-surface matrix.
- **Métricas requeridas:** latency/payload/cache per provider.
- **Validación:** unit/integration/provider performance tests.
- **Criterios de retirada:** borrar handlers monolíticos cuando adapters cubran providers.
- **Pendiente exacto:**
  - Extender la matriz cross-surface/hot path por provider crítico.
  - Publicar métricas por provider (latency/payload/cache).

## PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01 — Matriz de integración LSP por provider crítico

- **ID:** PB-TEST-P1-LSP-PROVIDER-INTEGRATION-MATRIX-01.
- **Title:** Matriz de integración LSP por provider crítico.
- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 11.
- **Origen:** Macroauditoría PHASE 11.
- **Findings:** FINDING-041.
- **Referencias de evidencia:** `test/server/integration/lsp-hover.test.ts`, `lsp-documentSymbols.test.ts`, `lsp-diagnostics.test.ts`.
- **Estado actual:** existe una suite de integración mínima para completion, signature help, definition, references, rename, linked editing y semantic tokens; además la validación local directa compilada (`mocha` sobre `out/`) confirma el wiring en sandbox.
- **Estado objetivo:** completion, resolve, signature, definition, references, rename, semantic tokens y linked editing tienen integración mínima.
- **Riesgo:** wiring/capabilities se rompen aunque unit tests pasen.
- **Objetivo:** probar entrypoints LSP reales de providers hot path.
- **Depends on:** PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01.
- **Tipo de refactor:** Test gate.
- **Impacto arquitectónico:** medio.
- **Impacto hot path:** alto.
- **Impacto 10,000+ archivos:** medio.
- **Impacto semántico PowerBuilder:** edición real PowerScript/DataWindow-aware.
- **Acceptance criteria:** suite integration por provider prioritario; fixtures pequeños; caso degraded/stale mientras indexa.
- **Docs afectadas:** `docs/testing.md`.
- **Tests requeridos:** `npm run test:integration`.
- **Métricas requeridas:** duración de integration suite.
- **Validación:** integration tests en CI.
- **Criterios de retirada:** no aplica.
- **Pendiente exacto:**
  - Validar `npm run test:integration` en CI cuando el entorno de VS Code esté disponible.
  - Añadir caso rename y linked editing con fixture real dentro del lane host.

## PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01 — Semantic tokens delta/range/resultId versionado

- **ID:** PB-SEMANTIC-P1-SEMANTIC-TOKENS-DELTA-RESULT-STATE-01.
- **Title:** Semantic tokens delta/range/resultId versionado.
- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 12.
- **Origen:** Macroauditoría PHASE 7/11/20.
- **Findings:** FINDING-019, FINDING-026, FINDING-039.
- **Referencias de evidencia:** `src/server/features/semanticTokensResultState.ts`, `src/server/features/semanticTokens.ts`, `test/server/unit/semanticTokensResultState.test.ts`, `test/server/unit/semanticTokens.test.ts`.
- **Estado actual:** el provider real usa `SemanticTokensResultState` para validar `previousResultId`, generar `resultId` con payload hash y descriptor versionado (`uri`, `documentVersion`, `fingerprint`, `kbVersion`, `sourceOrigin`, `legendVersion`, `createdAt`), degradar a full cuando ese estado deriva y evacuar estado en close/change sin depender de un builder persistente por URI.
- **Estado objetivo:** full/range/delta con estado versionado por URI, documentVersion, fingerprint, epoch/kbVersion, sourceOrigin, legend y payload hash.
- **Riesgo:** tokens obsoletos, coste global por request y payloads grandes.
- **Objetivo:** tokens rápidos, correctos y degradables.
- **Depends on:** PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01.
- **Tipo de refactor:** Contract centralization.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** alto.
- **Impacto 10,000+ archivos:** alto.
- **Impacto semántico PowerBuilder:** scopes, catalog, variables, DataWindow advisory tokens.
- **Acceptance criteria:** tests de full/range/delta/resultId; fallback full o structural-only si previousResultId no coincide; budget/payload metrics.
- **Docs afectadas:** target architecture, testing.
- **Tests requeridos:** unit tokens delta, integration LSP semantic tokens, performance gate.
- **Métricas requeridas:** token compute time, payload bytes, delta hit rate.
- **Validación:** tests tokens + performance gate ampliado.
- **Criterios de retirada:** retirar estado ambiguo y resolution per token no acotada.
- **Pendiente exacto:**
  - Validar el lane host `vscode-test` para semantic tokens delta/full en CI.
  - Añadir soporte `range` sólo cuando el entrypoint LSP y su budget queden defendidos.
  - Implementar presupuesto acotado de resolución semántica por token en el proveedor.
  - Métricas de compute time, payload bytes y delta hit rate.

## PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01 — Object Explorer server-owned paginado/lazy

- **ID:** PB-ARCH-P1-OBJECT-EXPLORER-PAGED-PROJECTIONS-01.
- **Title:** Object Explorer server-owned paginado/lazy.
- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 13.
- **Origen:** Macroauditoría PHASE 0/8/21.
- **Findings:** FINDING-001.
- **Referencias de evidencia:** `objectExplorerProjection`, `objectExplorerProjectionModel`, `objectExplorer`, smoke de foco en archivo activo.
- **Estado actual:** Object Explorer ya expone una proyección server-owned paginada/lazy con cursores, `parentPath`, nodo local `Cargar más`, fallback legado a manifest y validación smoke del foco en archivo activo; la ruta legacy sigue viva como compat layer.
- **Estado objetivo:** TreeDataProvider lazy con proyección server-side, cursores, filtros, receipts y acceso completo sin truncación global.
- **Riesgo:** payload/memoria/render cost en workspaces grandes.
- **Objetivo:** navegación de objetos instantánea y completa.
- **Depends on:** PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01.
- **Tipo de refactor:** DTO/projection centralization.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** alto en UI.
- **Impacto 10,000+ archivos:** crítico.
- **Impacto semántico PowerBuilder:** objetos, bibliotecas, DataWindows, PBL folders.
- **Acceptance criteria:** API paginada; no truncación global como sustituto; tests 10k manifest; payload budget.
- **Docs afectadas:** architecture, testing, troubleshooting.
- **Tests requeridos:** unit model, integration view provider, performance payload.
- **Métricas requeridas:** first render, expand latency, page size, payload bytes.
- **Validación:** smoke UI + performance 10k.
- **Criterios de retirada:** retirar consumo de manifest plano completo para tree normal.
- **Pendiente exacto:**
  - Añadir coverage integration/smoke adicional para expansión paginada y fallback legado.
  - Publicar métricas de payload/expand latency y validar el caso 10k antes de cerrar el compat layer.

## PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01 — Envelope común para proyecciones read-only

- **ID:** PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01.
- **Title:** Envelope común para proyecciones read-only.
- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 14.
- **Origen:** Macroauditoría PHASE 8/21.
- **Findings:** FINDING-006, FINDING-021, FINDING-024, FINDING-027, FINDING-043.
- **Referencias de evidencia:** Current Object Context, Diagnostics Explainability, health/status, SQL anchors, shared public API.
- **Estado actual:** la API pública ya expone `ApiReadOnlyProjectionEnvelope` opcional con helpers para estados `ready/stale/degraded/paged/error`; `workspace-check` sigue siendo el piloto principal, pero Wave 06 ya añadió receipt SQL bounded en Current Object Context, proyección paginada server-owned en Object Explorer y microcopy uniforme de `loading/ready/paged/degraded/error` en las views runtime tocadas.
- **Estado objetivo:** envelope con freshness, source snapshot, cache owner, caps, truncation, readiness, stale/degraded, redaction y refresh trigger.
- **Riesgo:** UI incompleta, payloads grandes y cálculos repetidos.
- **Objetivo:** read-only surfaces reactivas, honestas y presupuestadas.
- **Depends on:** PB-CACHE-P1-CACHE-REGISTRY-FINGERPRINT-EPOCH-01.
- **Tipo de refactor:** DTO/projection centralization.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** medio/alto.
- **Impacto 10,000+ archivos:** alto.
- **Impacto semántico PowerBuilder:** context, diagnostics, DataWindow/SQL summaries.
- **Acceptance criteria:** envelope opcional/backward compatible; cada surface declara caps/receipts; tests de stale/degraded/truncated.
- **Docs afectadas:** architecture, testing.
- **Tests requeridos:** unit projections, smoke panels.
- **Métricas requeridas:** payload, cache hit, refresh latency.
- **Validación:** smoke + performance payload.
- **Criterios de retirada:** retirar DTOs surface-specific duplicados cuando envelope cubra todas.
- **Pendiente exacto:**
  - Extender el envelope/receipt a Diagnostics Explainability, Impact Analysis y Safe Edit Plan sin romper compatibilidad.
  - Añadir receipts/redaction owner y smoke coverage adicional de panels/comandos read-only.
  - Publicar métricas de payload, cache hit y refresh latency por surface.

## PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01 — Planificación previa de coste para bundles IA/soporte

- **ID:** PB-AI-P1-CONTEXT-BUNDLE-EXECUTION-BUDGET-01.
- **Title:** Planificación previa de coste para bundles IA/soporte.
- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 15.
- **Origen:** Macroauditoría PHASE 8.
- **Findings:** FINDING-028.
- **Referencias de evidencia:** `aiTaskContextBundle`, `extension.ts#getAiTaskContextBundle`, smoke del bundle IA read-only.
- **Estado actual:** el bundle IA ya construye un execution plan previo, omite secciones antes de ejecutar cuando el budget no alcanza, publica receipt compacto de skipped sections y deja la poda tardía como guard defensivo.
- **Estado objetivo:** plan de ejecución estima coste/tokens, prioriza por intent y omite antes de ejecutar con reason codes.
- **Riesgo:** comandos IA compiten con hot paths sobre workspaces grandes.
- **Objetivo:** controlar coste antes de ejecutar trabajo read-only pesado.
- **Depends on:** PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01.
- **Tipo de refactor:** Scheduler migration.
- **Impacto arquitectónico:** medio.
- **Impacto hot path:** medio.
- **Impacto 10,000+ archivos:** alto.
- **Impacto semántico PowerBuilder:** dependency graph, diagnostics, DataWindow/SQL anchors, safe edit plans.
- **Acceptance criteria:** secciones de baja prioridad no ejecutan APIs cuando budget no alcanza; receipts de omisión antes de ejecución.
- **Docs afectadas:** AI context docs.
- **Tests requeridos:** unit tests de budget/intent/omissions.
- **Métricas requeridas:** skippedBeforeExecution, sections executed, estimated tokens.
- **Validación:** unit tests y smoke bundle.
- **Criterios de retirada:** retirar poda tardía como mecanismo principal; queda solo guard defensivo.
- **Pendiente exacto:**
  - Extender el mismo preflight a support bundles o documentar explícitamente la excepción.
  - Publicar métricas de `skippedBeforeExecution`/`estimatedScheduledTokens` fuera de las unit tests.

## PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01 — Split modular del submodelo DataWindow con caps

- **ID:** PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01.
- **Title:** Split modular del submodelo DataWindow con caps.
- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 16.
- **Origen:** Macroauditoría PHASE 2/8/9B/22.
- **Findings:** FINDING-030.
- **Referencias de evidencia:** `src/server/semantic/submodels/datawindow/index.ts`, `src/server/semantic/submodels/datawindow/bindingProjection.ts`, `dataWindowModel`, `dataWindowPropertyPaths`, binding/fast context/serving adapters, `currentObjectContext`.
- **Estado actual:** parser/model/property paths/bindings/fast context siguen repartidos en módulos grandes, pero ya existe un boundary mínimo `src/server/semantic/submodels/datawindow/`; `bindingProjection` se movió allí con re-export compatible desde `src/server/features/dataWindowBindingProjection.ts`, y `Current Object Context` ya publica `dataWindowBindingReceipt` bounded por consumer.
- **Estado objetivo:** `semantic/submodels/datawindow` con parser, model, bindings, property paths, projections, diagnostics advisory y caps.
- **Riesgo:** scans duplicados y confidence/sourceOrigin inconsistentes.
- **Objetivo:** DataWindow separado, advisory y escalable.
- **Depends on:** PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01.
- **Tipo de refactor:** Split.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** medio/alto.
- **Impacto 10,000+ archivos:** alto.
- **Impacto semántico PowerBuilder:** DataWindow/DataStore/Describe/Modify/GetChild/DDDW/columns.
- **Acceptance criteria:** parity tests de model/property paths/bindings; caps/receipts; sourceOrigin/confidence preservados.
- **Docs afectadas:** architecture, semantic assumptions, testing.
- **Tests requeridos:** DataWindow unit/performance fixtures.
- **Métricas requeridas:** parse/context time, payload/cap count.
- **Validación:** datawindow tests + corpus `.srd` grande.
- **Criterios de retirada:** borrar facades viejas cuando imports target path estén migrados.
- **Pendiente exacto:**
- Converger más consumers read-only/advisory sobre el boundary (`code metrics`, bundles y surfaces adicionales) sin mover parser/property paths de alto riesgo.
- Añadir más migraciones seguras de helpers/tipos al boundary y mantener re-exports mientras existan imports legacy.
- Validar corpus `.srd`/consumers adicionales antes de considerar cerrado el histórico `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01`.

## PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01 — SQL anchors bounded por consumer

- **ID:** PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01.
- **Title:** SQL anchors bounded por consumer.
- **Estado:** Partial.
- **Prioridad:** P2.
- **Orden recomendado:** 17.
- **Origen:** Macroauditoría PHASE 2/8.
- **Findings:** FINDING-006.
- **Referencias de evidencia:** `embeddedSqlAnchors`, `currentObjectContext`, `embeddedSqlAnchors.test.ts`, `currentObjectContext.test.ts`.
- **Estado actual:** el collector ya aplica caps por consumer y Current Object Context publica receipt de truncación con envelope nested; quedan consumers secundarios por converger y profundización fuera del path interactivo.
- **Estado objetivo:** caps por consumer, receipts de truncation y análisis profundo fuera de hot/read-only path.
- **Riesgo:** documentos SQL densos inflan payload/latencia.
- **Objetivo:** SQL advisory bounded.
- **Depends on:** PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01.
- **Tipo de refactor:** Adapter.
- **Impacto arquitectónico:** medio.
- **Impacto hot path:** medio.
- **Impacto 10,000+ archivos:** medio/alto.
- **Impacto semántico PowerBuilder:** embedded/dynamic SQL, transactions, host variables.
- **Acceptance criteria:** ningún read-only consumer llama anchors sin cap; tests de truncation receipt.
- **Docs afectadas:** semantic assumptions, testing.
- **Tests requeridos:** SQL dense fixture, Current Object Context cap tests.
- **Métricas requeridas:** anchors scanned/emitted/truncated.
- **Validación:** unit tests SQL/current context.
- **Criterios de retirada:** retirar default no acotado en paths interactivos.
- **Pendiente exacto:**
  - Converger consumers restantes (`ai-bundle`, `support-bundle`, métricas) sobre receipts/caps homogéneos.
  - Mantener el modo unbounded solo en `debug/deep-report` y seguir validando payload real sobre SQL denso.

## PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01 — Normalizar estado backlog/spec de submodelos PowerBuilder

- **ID:** PB-DOCS-P1-SUBMODEL-STATUS-OWNERSHIP-01.
- **Title:** Normalizar estado backlog/spec de submodelos PowerBuilder.
- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 18.
- **Origen:** Macroauditoría PHASE 2.
- **Findings:** FINDING-005.
- **Referencias de evidencia:** `docs/backlog.md`, `specs/PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01.md`, `specs/PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01.md`, `specs/PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01.md`.
- **Estado actual:** Wave 07 normaliza `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01` a histórico `Open by conformance`, y `PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01` / `PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01` a `Superseded` por sus specs absorbentes; el cierre final sigue parcial mientras el submodelo DataWindow continúe abierto y haya que mantener compat layers/documentación de transición.
- **Estado objetivo:** un owner de estado por submodelo: Open, Done, Superseded o Open por conformance.
- **Riesgo:** reabrir trabajo cerrado o saltar hardening pendiente.
- **Objetivo:** alinear arquitectura y specs funcionales.
- **Depends on:** PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01, PB-SQL-P2-SQL-ANCHORS-BOUNDED-PROJECTION-01.
- **Tipo de refactor:** None.
- **Impacto arquitectónico:** medio.
- **Impacto hot path:** indirecto.
- **Impacto 10,000+ archivos:** indirecto.
- **Impacto semántico PowerBuilder:** DataWindow, SQL, native/external.
- **Acceptance criteria:** backlog/specs enlazan estados; ítems absorbidos marcados; no hay duplicación de owner.
- **Docs afectadas:** backlog, specs, architecture-status.
- **Tests requeridos:** docs drift/link checks.
- **Métricas requeridas:** ninguna.
- **Validación:** `npm run test:docs:drift`.
- **Criterios de retirada:** cuando estado submodelo sea único y estable.
- **Pendiente exacto:**
- Mantener el estado histórico de DataWindow en `Open by conformance` hasta que `PB-DW-P1-DATAWINDOW-SUBMODEL-SPLIT-AND-CAPS-01` cierre boundary, consumers y documentación de salida.
- Revisar futuras docs de submodelos para que no reintroduzcan a `46/47/48` como owners ejecutables independientes.

## PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01 — PerformanceEvent y métricas runtime unificadas

- **ID:** PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01.
- **Title:** PerformanceEvent y métricas runtime unificadas.
- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 19.
- **Origen:** Macroauditoría PHASE 10/18.
- **Findings:** FINDING-034, FINDING-035, FINDING-042.
- **Referencias de evidencia:** `interactiveServingStats`, `interactiveServingPipeline`, `workerPool`, `scheduler`, `memoryBudgets`, performance budget.
- **Estado actual:** `src/server/runtime/performanceEvents.ts` ya define el contrato homogéneo; `interactiveServingStats` proyecta `PerformanceEvent` al snapshot legacy compatible, `powerbuilder.showStats` expone snapshots bounded de `performanceEvents`, scheduler lanes, worker pool, event loop y memory pressure, `runtimeCommandHandlers` ya emite eventos bounded también para `powerbuilder.objectExplorerProjection` y `powerbuilder.semanticWorkspaceManifest` con `duration/payload/resultSize`, y el snapshot agregado ya publica percentiles `p50/p95/p99` para `durationMs`, `payloadBytes` y `resultSize` sobre la ventana bounded.
- **Estado objetivo:** `PerformanceEvent` homogéneo con method/URI/version/fingerprint/lane/cache/payload/cancel/error/budget/epoch y percentiles.
- **Riesgo:** regresiones invisibles y p95 oculto por promedio.
- **Objetivo:** probar y explicar performance real.
- **Depends on:** PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01.
- **Tipo de refactor:** Contract centralization.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** alto.
- **Impacto 10,000+ archivos:** alto.
- **Impacto semántico PowerBuilder:** todos los providers/submodelos.
- **Acceptance criteria:** event schema probado; worker/scheduler/event-loop metrics; provider coverage gate; JSON artifacts.
- **Docs afectadas:** performance budget, testing.
- **Tests requeridos:** runtime metrics unit tests, performance gate update.
- **Métricas requeridas:** p50/p95/p99, payload, wait/run, worker busy/idle, event loop delay, memory.
- **Validación:** performance tests y report JSON.
- **Criterios de retirada:** retirar métricas ad hoc no derivadas del event contract.
- **Pendiente exacto:**
- Extender la emisión de `PerformanceEvent` a más providers/workloads adicionales una vez cubiertos `objectExplorerProjection` y `semanticWorkspaceManifest`, sin reescribir providers en bloque.
- Publicar ratchets adicionales donde exista ventana estadística estable y bajo overhead, a partir del snapshot bounded que ya expone `p50/p95/p99` para `durationMs/payloadBytes/resultSize`.

## PB-PERF-P2-10K-SEMANTIC-CORPUS-01 — Corpus sintético 10,000+ PowerBuilder multi-dominio

- **ID:** PB-PERF-P2-10K-SEMANTIC-CORPUS-01.
- **Title:** Corpus sintético 10,000+ PowerBuilder multi-dominio.
- **Estado:** Partial.
- **Prioridad:** P2.
- **Orden recomendado:** 20.
- **Origen:** Macroauditoría PHASE 2/19.
- **Findings:** FINDING-007, FINDING-036.
- **Referencias de evidencia:** performance tests 5000 KB, 256 watcher, PFC/OrderEntry optional.
- **Estado actual:** `test/server/helpers/syntheticPowerBuilderCorpus.ts` y `tools/generate-synthetic-powerbuilder-corpus.mjs` ya materializan corpus determinísticos `smoke`, `medium` y `10k`; el helper ya cubre `.sru/.srw/.srm/.srd/.sra/.srf/.srp`, publica metadata con resumen por extensión y expone una mutación deterministic `while-indexing` para reescritura controlada; existe smoke release-facing y lane opcional `10k` con artefactos JSON.
- **Estado objetivo:** generador determinístico con SR*, herencia, DataWindow, SQL, native, PFC/STD-like, edit while indexing, Object Explorer, references/rename.
- **Riesgo:** escalabilidad basada en extrapolación.
- **Objetivo:** validar arquitectura objetivo en escala realista.
- **Depends on:** PB-PERF-P1-RUNTIME-METRICS-EVENT-CONTRACT-01.
- **Tipo de refactor:** Test gate.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** alto.
- **Impacto 10,000+ archivos:** crítico.
- **Impacto semántico PowerBuilder:** todos los dominios obligatorios.
- **Acceptance criteria:** generador seedable; smoke reducido y full 10k; artifacts JSON; cubre dominios listados.
- **Docs afectadas:** testing, performance budget.
- **Tests requeridos:** corpus generator tests, performance suite.
- **Métricas requeridas:** indexing throughput, memory, payload, latency per provider.
- **Validación:** gate local/nightly.
- **Criterios de retirada:** reemplaza extrapolaciones parciales como evidencia de escala.
- **Pendiente exacto:**
- Enriquecer el generador con más superficie native/external y otros dominios aún no cubiertos por el helper, además de consumers read-only/interactivos adicionales sobre el corpus mutado.
- Añadir consumers adicionales del corpus sintético a más suites read-only e interactivas sin duplicar datasets.

## PB-CI-P1-REGRESSION-GATE-10K-PAYLOAD-01 — Gates CI/release para 10k, payload y performance regression

- **ID:** PB-CI-P1-REGRESSION-GATE-10K-PAYLOAD-01.
- **Title:** Gates CI/release para 10k, payload y performance regression.
- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 21.
- **Origen:** Macroauditoría PHASE 20.
- **Findings:** FINDING-036, FINDING-042.
- **Referencias de evidencia:** `package.json` `release:verify`, `.github/workflows/release-readiness.yml`, `run-performance-budget-gate`.
- **Estado actual:** `test:performance:gate` ya incluye el smoke sintético y genera `artifacts/performance/performance-budget-gate.json`; `.github/workflows/release-readiness.yml` conserva `release:verify` bounded y añade un lane `synthetic-10k` opcional/scheduled con `performance-10k-gate.json` en modo `report-only`.
- **Estado objetivo:** fast PR gate, release gate y optional/nightly 10k con payload budgets y metrics artifacts.
- **Riesgo:** release verde sin probar escala/payload.
- **Objetivo:** hacer no-regresable la velocidad.
- **Depends on:** PB-PERF-P2-10K-SEMANTIC-CORPUS-01.
- **Tipo de refactor:** Architecture gate.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** alto.
- **Impacto 10,000+ archivos:** crítico.
- **Impacto semántico PowerBuilder:** corpus PB completo.
- **Acceptance criteria:** scripts nuevos documentados; release contract test actualizado; payload gate report-only inicialmente; nightly/optional definido.
- **Docs afectadas:** testing, release, performance budget.
- **Tests requeridos:** release readiness contract, performance gates.
- **Métricas requeridas:** payload bytes, latency, memory, worker/event-loop, corpus size.
- **Validación:** `npm run release:verify` y lane nuevo cuando estable.
- **Criterios de retirada:** no aplica; gate permanece.
- **Pendiente exacto:**
- Decidir cuándo el lane `10k` deja de ser `report-only` y pasa a `fail mode` con budgets ratcheted.
- Añadir cobertura específica de payload/tokens delta/read-only surfaces grandes sobre el carril 10k cuando el contrato de métricas esté más extendido.

## PB-UX-P2-DEGRADED-STALE-MESSAGING-UI-01 — UX uniforme para stale/degraded/paged/loading

- **ID:** PB-UX-P2-DEGRADED-STALE-MESSAGING-UI-01.
- **Title:** UX uniforme para stale/degraded/paged/loading.
- **Estado:** Partial.
- **Prioridad:** P2.
- **Orden recomendado:** 22.
- **Origen:** Macroauditoría PHASE 21.
- **Findings:** FINDING-027, FINDING-043.
- **Referencias de evidencia:** `readOnlyProjectionState`, `objectExplorer`, `currentObjectContextPanel`, `diagnosticsExplainabilityPanel`.
- **Estado actual:** las views runtime de Wave 06 ya usan microcopy compacta y uniforme para `loading/error` y, cuando existe envelope, también para `ready/paged/degraded`; faltan casos `stale` reales y coverage más amplia de readiness incompleto.
- **Estado objetivo:** UI compacta y consistente para loading/degraded/stale/ready/paged/error, con refresh manual y receipts.
- **Riesgo:** el plugin puede sentirse vacío o roto durante indexing.
- **Objetivo:** mejorar instantaneidad percibida.
- **Depends on:** PB-ARCH-P1-READONLY-SURFACE-PROJECTION-ENVELOPE-01.
- **Tipo de refactor:** DTO/projection centralization.
- **Impacto arquitectónico:** medio.
- **Impacto hot path:** medio.
- **Impacto 10,000+ archivos:** alto.
- **Impacto semántico PowerBuilder:** Object Explorer, Current Context, diagnostics, bundles.
- **Acceptance criteria:** surfaces principales renderizan state envelope; tests de hover/completion while indexing; refresh feedback visible.
- **Docs afectadas:** testing, troubleshooting.
- **Tests requeridos:** smoke/UI tests, integration readiness cases.
- **Métricas requeridas:** time-to-first-useful-state, refresh latency.
- **Validación:** smoke tests y manual UX check.
- **Criterios de retirada:** retirar mensajes/sentinels específicos cuando envelope sea común.
- **Pendiente exacto:**
  - Cubrir `stale` y degradación por indexing/readiness real en smokes o integration tests.
  - Extender la misma microcopy compacta a surfaces read-only no tocadas aún por Wave 06.

## PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01 — Split incremental de orquestadores principales

- **ID:** PB-ARCH-P2-ORCHESTRATOR-MODULE-SPLIT-01.
- **Title:** Split incremental de orquestadores principales.
- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 23.
- **Origen:** Macroauditoría PHASE 9B/22/23.
- **Findings:** FINDING-031, FINDING-038.
- **Referencias de evidencia:** `src/client/extension.ts`, `src/shared/publicApi.ts`, `src/server/handlers/featureHandlers.ts`, `src/server/server.ts`, `reportCommandHandlers`.
- **Estado actual:** módulos grandes concentran registration, adapters, commands, public API, status y compat.
- **Estado objetivo:** activation/commands/views/lifecycle separados; provider registry por adapter; shared contracts/protocol separados.
- **Riesgo:** blast radius alto y gates difíciles.
- **Objetivo:** reducir responsabilidad y habilitar fitness functions.
- **Depends on:** PB-ARCH-P1-PROVIDER-ADAPTER-HOTPATH-CONTRACT-01, PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01.
- **Tipo de refactor:** Split.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** medio/alto.
- **Impacto 10,000+ archivos:** medio.
- **Impacto semántico PowerBuilder:** transversal.
- **Acceptance criteria:** splits con re-export temporal; behavior snapshots; hotspot guard actualizado con ratchet.
- **Docs afectadas:** architecture implementation map, testing.
- **Tests requeridos:** import boundary, command/provider registration, API contract snapshots.
- **Métricas requeridas:** file size/import count/top-level declarations.
- **Validación:** compile, unit, architecture metrics.
- **Criterios de retirada:** borrar re-exports cuando imports internos migren.

## PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01 — Scaffold de estructura semantic/diagnostics/contracts objetivo

- **ID:** PB-ARCH-P22-TARGET-MODULE-SCAFFOLD-01.
- **Title:** Scaffold de estructura semantic/diagnostics/contracts objetivo.
- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 24.
- **Origen:** Macroauditoría PHASE 22.
- **Findings:** FINDING-029, FINDING-030, FINDING-031, FINDING-040.
- **Referencias de evidencia:** target architecture sección 22, layout actual `src/server`, `src/client`, `src/shared`.
- **Estado actual:** ownership de semantic input/facts/indexes/snapshot/query/cache/submodels no está expresado por folders.
- **Estado objetivo:** scaffolds y moves types-only con re-exports para migración incremental.
- **Riesgo:** moves sin tests o sobre-fragmentación.
- **Objetivo:** preparar organización final sin big-bang.
- **Depends on:** PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01.
- **Tipo de refactor:** Move.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** indirecto.
- **Impacto 10,000+ archivos:** indirecto.
- **Impacto semántico PowerBuilder:** submodelos y query ownership.
- **Acceptance criteria:** scaffold con owners; imports nuevos allowlisted; no cycles; no behavior change.
- **Docs afectadas:** architecture, architecture-status, implementation map.
- **Tests requeridos:** compile, import boundary, cycle gate.
- **Métricas requeridas:** imports/cycles.
- **Validación:** `npm run compile`, architecture gate.
- **Criterios de retirada:** retirar scaffolds vacíos si no reciben migración asociada.

## PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01 — Suite de fitness de simplificación y mantenibilidad

- **ID:** PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01.
- **Title:** Suite de fitness de simplificación y mantenibilidad.
- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 25.
- **Origen:** Macroauditoría PHASE 24.
- **Findings:** FINDING-029, FINDING-031, FINDING-032, FINDING-038, FINDING-040.
- **Referencias de evidencia:** hotspot guard, architecture imports, `plugin_old`, large modules.
- **Estado actual:** hotspot guard existe, pero faltan ratchets de duplicates/legacy/cycles/client projection/source-of-truth.
- **Estado objetivo:** scanner/gate con categorías size, cycles, duplicates, legacy, provider-semantics, projections, stores.
- **Riesgo:** deuda técnica vuelve tras refactors.
- **Objetivo:** impedir crecimiento y duplicación regresiva.
- **Depends on:** PB-ARCH-P0-CONFORMANCE-SCANNER-AST-IMPORT-GATE-01.
- **Tipo de refactor:** Architecture gate.
- **Impacto arquitectónico:** alto.
- **Impacto hot path:** medio.
- **Impacto 10,000+ archivos:** medio.
- **Impacto semántico PowerBuilder:** evita logic duplicada en providers/submodelos.
- **Acceptance criteria:** ratchet de size con exceptions; duplicate builder detection; legacy registry check; no client heavy projection pull; fixtures negativos.
- **Docs afectadas:** testing, architecture-status.
- **Tests requeridos:** architecture metrics, scanner fixtures.
- **Métricas requeridas:** lines/imports/declarations/cycles/duplicates.
- **Validación:** architecture gate y release contract cuando estable.
- **Criterios de retirada:** retirar allowlists temporales cuando módulos se reduzcan.

## PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01 — Plan de retirement para plugin_old y compat paths

- **ID:** PB-LEGACY-P23-PLUGIN-OLD-RETIREMENT-PLAN-01.
- **Title:** Plan de retirement para plugin_old y compat paths.
- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 26.
- **Origen:** Macroauditoría PHASE 9/24.
- **Findings:** FINDING-032.
- **Referencias de evidencia:** `plugin_old/**`, `test/server/unit/architectureImports.test.ts`, `AGENTS.md`, `.github/copilot-instructions.md`.
- **Estado actual:** `plugin_old` está aislado por gate, pero no tiene plan de retirada/owner explícito.
- **Estado objetivo:** registry de legacy paths con owner, rationale, replacement, criteria y retire-by condition.
- **Riesgo:** copiar patrones obsoletos o conservar legacy indefinidamente.
- **Objetivo:** mantener referencia histórica controlada y retirarla cuando haya paridad.
- **Depends on:** PB-ARCH-P24-SIMPLIFICATION-FITNESS-SUITE-01.
- **Tipo de refactor:** Legacy retirement.
- **Impacto arquitectónico:** medio.
- **Impacto hot path:** bajo directo.
- **Impacto 10,000+ archivos:** indirecto.
- **Impacto semántico PowerBuilder:** reglas/formatters/resolvers heredados.
- **Acceptance criteria:** registry creado; gate conserva no-import-runtime; criterios de retiro documentados; docs de legacy actualizadas.
- **Docs afectadas:** `docs/legacy-isolation.md`, architecture-status, backlog.
- **Tests requeridos:** architecture import gate.
- **Métricas requeridas:** ninguna.
- **Validación:** `npm run test:unit -- --grep "architectureImports"`.
- **Criterios de retirada:** borrar o archivar `plugin_old` solo cuando replacement y parity estén cerrados.
