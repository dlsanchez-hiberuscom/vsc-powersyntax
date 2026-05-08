# Done Log — Plugin PowerBuilder 2025 para VS Code

**Documento complementario del backlog activo.**

Este archivo recoge trabajo **cerrado** e hitos **históricos** que ya no deben contaminar el backlog operativo principal.

---

## Reglas de uso

- El **backlog activo** contiene solo trabajo **Open**, **Partial**, **Ready for closure** o **Blocked**.
- Este **done-log** conserva:
  - ítems **completamente cerrados**;
  - auditorías ya resueltas;
  - sprints históricos cerrados;
  - decisiones técnicas relevantes que conviene poder rastrear.
- Si un ítem está **cerrado parcialmente**, permanece en el backlog activo y **no** se mueve aquí.
- Si un ítem pasa a `Done`, debe salir del backlog activo y registrarse aquí con:
  - resultado técnico;
  - alcance trazado por spec;
  - validación ejecutada;
  - documentación afectada si aplica.

---

# 1. Ítems cerrados movidos fuera del backlog activo

## 1.246 PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01 — **Cerrado (architecture / semantic-conformance / 2026-05)**

**Objetivo:** Añadir tests de conformidad para source-of-truth, query contract, cache keys, confidence/evidence y read-only projections.

**Resultado registrado:**
- Se redactó la spec oficial en `docs/specs/PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01.md`.
- Se implementó la suite de arquitectura estática en `test/server/unit/semanticArchitectureConformance.test.ts` para verificar que ningún feature bypassa `SemanticQueryFacade`.
- Los tests validan explícitamente el contrato de la caché (epoch, versioning).

**Validación registrada:**
- `npm run test:unit -- --grep "PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01"` (`2 passing`)
- `npm run test:docs:drift` (`status: passed`)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/testing.md`
- `docs/performance-budget.md`

---

## 1.245 PB-ARCH-P0-SEMANTIC-DESIGN-TARGET-01 — **Cerrado (architecture / semantic-design / 2026-05)**

**Objetivo:** Formalizar la especificación arquitectónica para el target semántico, asegurando la separación clara entre diseño objetivo y estado real, protegiendo los principios de "no big-bang" y "no parallel store", y enlazando el diseño desde toda la documentación owner.

**Resultado registrado:**
- Se ha redactado y registrado la spec en `docs/specs/PB-ARCH-P0-SEMANTIC-DESIGN-TARGET-01.md`.
- `docs/architecture.md`, `docs/architecture-status.md` y `docs/architecture-implementation-map.md` apuntan unívocamente a `docs/semantic-design-target.md` como contrato del target de diseño semántico futuro.
- Se fijó la separación arquitectónica y documental.

**Validación registrada:**
- `npm run test:docs:drift` ( findings: 0 )
- `npm run test:architecture:rapid` ( skips/passes correctamente )

**Documentación alineada:**
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/current-focus.md`

---

## 1.244 PB-AUDIT-P0-DOC-ALIGNMENT-01 — **Cerrado (governance / doc-alignment / 2026-05)**

**Objetivo:** restaurar la consistencia absoluta entre backlog, foco activo, histórico y roadmap tras la ultra auditoría semántica, eliminando drift de tareas absorbidas y clarificando claims de conditional compilation.

**Resultado registrado:**
- `PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01` ha sido eliminado del backlog activo y del foco; sus hitos de severidad ya residen en `done-log.md` (1.239) y el backlog (0.2) ahora prohíbe reabrirlo sin evidencia nueva.
- `docs/backlog.md`, `docs/current-focus.md`, `docs/done-log.md` y `docs/roadmap.md` han sido sincronizados, eliminando contradicciones sobre el foco "POST-AUDIT".
- Se ha clarificado en la guía técnica canónica y en el done-log (1.200) que el soporte de conditional compilation es un "gate de evidencia" (detector read-only) y no una promesa de soporte productivo completo, alineando las expectativas del plugin con la realidad del parser.
- Los estados `Done`, `Superseded`, `Open` y `Partial` han sido normalizados a lo largo de los documentos maestros.

**Validación registrada:**
- `npm run test:docs:drift` ( findings: 0 )
- Verificación manual de la cadena de IDs en los 4 documentos maestros.

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/roadmap.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---


**Objetivo:** Finalizar la sanitización e integridad del catálogo de metadatos oficial (PB 2025) para asegurar un rendimiento del LSP de alta fidelidad, eliminando ruido documental y garantizando la coherencia del esquema de símbolos del sistema.

**Resultado registrado:**
- **Sanitización del Generador:** Se ha endurecido el filtro `isSaneOwnerType` en `scripts/generate_official_function_catalog.cjs` para bloquear agresivamente artefactos de ruido (ej. "About events", fragmentos de oraciones, cadenas JSON corruptas).
- **Normalización de Owners:** Implementada normalización multi-etapa (eliminación de plurales, trim de espacios) en los parsers de PowerScript y Eventos para garantizar que solo se registren nombres de tipos canónicos.
- **Preservación de Scopes Globales:** Corregida la lógica de generación del catálogo para preservar correctamente los símbolos válidos para scopes universales (`__any_object__`, `__all_controls__`) que anteriormente eran descartados por filtros demasiado estrictos.
- **Eliminación de Drift (CATALOG-GENERATOR-SCHEMA-DRIFT-01):** Se han reconciliado las firmas faltantes (ej. `GetItemString`) y los metadatos de parámetros ausentes mediante la mejora del motor de extracción de firmas y parámetros del generador.
- **Integridad del Registro:** Re-generación completa de `generated.generated.ts`, confirmando la eliminación de ruido residual (ej. "birthday artifacts") mediante auditorías de grep.

**Validación registrada:**
- `npm run generate:catalog` (Generación limpia de metadatos).
- `npm run report:catalog-consistency` (0 issues de esquema).
- Auditoría manual mediante grep sobre `generated.generated.ts` buscando patrones de ruido conocidos.
- Verificación funcional en VS Code (LSP) confirmando autocompletado limpio de tipos y firmas.

**Documentación alineada:**
- `docs/backlog.md` (Sincronizado).
- `docs/symbol-system.md` (Alineado con el nuevo registro).
- `docs/architecture-status.md` (Reflejando integridad del catálogo).

---


## 1.242 Runtime interactive / parser / discovery / health lane — **Cerrado (runtime / parser / discovery / health / 2026-05)**

**Ámbito cerrado:**
- `PB-RUNTIME-P0-FUNCTIONAL-SELFTEST-INTERACTIVE-01`
- `PB-RUNTIME-P0-LSP-INTERACTIVE-LOOP-GUARD-01`
- `PB-RUNTIME-P1-HOVER-SYSTEM-FASTPATH-01`
- `PB-RUNTIME-P1-VIEW-PROVIDERS-REGISTRATION-01`
- `PB-RUNTIME-P1-SERVING-CACHE-OBSERVABILITY-01`
- `PB-RUNTIME-P0-LEXER-STRINGS-01`
- `PB-RUNTIME-P0-DW-STRING-SUBLANGUAGES-01`
- `PB-RUNTIME-P0-PARSER-INLINE-AFTER-SEMICOLON-01`
- `PB-RUNTIME-P1-DISCOVERY-INDEXING-REAL-WORKSPACE-01`
- `PB-RUNTIME-P2-BUILD-ORCA-HEALTH-SEPARATION-01`

**Resultado registrado:**
- El runtime self-test ya distingue checks base y probes funcionales reales para hover built-in, serving cache, definition negative cache y registro de views.
- Hover built-in/system quedó resuelto por fast path de catálogo, con serving cache observable y suites unitarias/integración estables.
- Los falsos diagnostics por contenido interno de strings, sublenguajes DataWindow y código inline tras `;` quedaron cerrados con cobertura específica del corpus real.
- Discovery/indexing sobre workspaces reales con rutas con espacios quedó revalidado en OrderEntry/PFC; el warm-start vuelve a cortar por snapshots publicados aunque el `DocumentCache` haya evictado parte del corpus.
- Health y dashboard mantienen separación entre runtime language, interactive serving y capacidades opcionales de build/ORCA.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/interactiveLoopGuard.test.js out/test/server/unit/featureHandlers.test.js out/test/server/unit/runtimeSelfTest.test.js out/test/server/unit/hover.test.js out/test/server/integration/lsp-hover.test.js out/test/server/unit/codeMasking.test.js out/test/server/unit/codeMaskingAudit.test.js out/test/server/unit/comments_stripper.test.js out/test/server/unit/statementSplitter.test.js out/test/server/unit/diagnosticsExtra.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/powerbuilderParserResilienceFuzz.test.js out/test/server/unit/readiness.test.js out/test/server/unit/progressReadiness.test.js out/test/server/unit/servingReadiness.test.js out/test/server/unit/featureReadiness.test.js out/test/server/unit/interactiveServingPipeline.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/projectHealthDashboard.test.js out/test/server/unit/pbAutoBuildHealth.test.js out/test/server/unit/buildOrcaFailureClassification.test.js out/test/server/unit/buildOrcaJournalStore.test.js out/test/server/unit/workspaceIndexer.test.js out/test/server/unit/workspace.test.js` → `196 passing`
- `npx mocha --ui tdd out/test/server/performance/orderentry.smoke.test.js out/test/server/performance/orderentry.semantic.test.js out/test/server/performance/orderentry.perf.test.js out/test/server/performance/pfc-solution.smoke.test.js out/test/server/performance/semanticConsistencyOracle.smoke.test.js` → `7 passing`; `discoverWorkspace=545.49ms`, `index cold=17736.90ms`, `warm=9.48ms`
- `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms|el runtime self-test se ejecuta como comando read-only|las views contribuidas registran su provider durante activate|la superficie runtime read-only consulta reportes estructurales|la superficie runtime read-only abre reportes markdown secundarios|la superficie runtime read-only exporta e importa snapshots"` → `6 passing`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/performance-budget.md`
- `docs/roadmap.md`
- `docs/testing.md`
- `docs/troubleshooting.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 1.241 PB-RUNTIME-P2-EMPTY-HOOK-RETURN-01 — **Cerrado (runtime / diagnostics / 2026-05)**

**Objetivo:** Evitar que el diagnóstico estricto SD13 reporte "missing return" como advertencia en funciones con tipo de retorno definido pero que no contienen código ejecutable (patrón común para hooks de herencia).

**Resultado registrado:**
- Se modificó `src/server/features/diagnosticsExtra.ts` (`checkMissingReturn`).
- Ahora evalúa si la función tiene código ejecutable antes de requerir un `return`. Si el cuerpo está vacío (o solo tiene comentarios), no emite advertencias.
- Se previene ruido (falsos positivos) en diseños de frameworks como la PFC.

**Validación registrada:**
- Se actualizaron las pruebas unitarias en `diagnosticsExtra.test.ts`, confirmando que un `hook` con retorno no genera `SD13`, mientras que funciones con código siguen evaluándose correctamente (`npm run test:unit -- --grep "SD13"`).

**Documentación alineada:**
- `docs/backlog.md`
- `docs/done-log.md`

## 1.240 PB-RUNTIME-P2-LIFECYCLE-PFC-PATTERNS-01 — **Cerrado (runtime / lifecycle / 2026-05)**

**Objetivo:** Separar las reglas del lifecycle de inspección para no exigir de forma simultánea `call super::create` y `TriggerEvent(this, "constructor")`, reconociendo patrones válidos en la PFC y PowerBuilder clásico.

**Resultado registrado:**
- Se refactorizó la lógica en `src/server/features/hierarchyInspection.ts` para tolerar la presencia individual de la llamada a la clase ancestro (`super::create` o `super::destroy` con o sin la palabra clave `call`) o la activación del trigger (`TriggerEvent`).
- La validación es ahora menos estricta pero más realista frente al código heredado.

**Validación registrada:**
- Múltiples pruebas unitarias agregadas y revalidadas (`npm run test:unit -- --grep "lifecycle"`).

**Documentación alineada:**
- `docs/backlog.md`
- `docs/done-log.md`

## CACHE-P0-DOCUMENT-CACHE-LRU-EVICTION-01 — Document cache con LRU, pin semántico y eviction por presión

- **Estado:** Done.
- **Prioridad:** P0.
- **Origen:** Cache architecture audit (H2 — Document Cache Unbounded Retention).
- **Implementado:**
  - `DocumentCache` reescrito con LRU, `maxEntries`, `pin()/unpin()`, `evictUnpinned()`.
  - `documentHandlers.ts` llama `pin()` en `onDidOpen` y `unpin()` en `onDidClose`.
  - `server.ts` inicializa con `new DocumentCache(256)`.
  - 10 tests nuevos (LRU, pin, unpin, eviction, stats) + 8 tests existentes validados.
  - Validado empíricamente (benchmark manual en entorno local) mostrando memory pressure estabilizada en workspaces grandes.
- **Evidencia:** `DocumentCache` es un `Map<string, DocumentCacheEntry>` sin límite de capacidad, sin LRU, sin eviction. A 826 archivos supera el budget de 48 MiB (114%). A 5,000 archivos consumiría ~312 MiB. Esto dispara `memoryPressurePolicy` en modo `error`, que bloquea serving cache writes y crea un doom loop.
- **Riesgo:** Crítico. Es la raíz de la cascada que mata al serving cache y bloquea features interactivas.
- **Patrón moderno:** Tiered LRU con pin semántico (inspirado en TSServer `DocumentRegistry` y pools de base de datos):
  - **Pinned tier:** documentos abiertos en el editor → nunca evictar.
  - **Warm tier:** documentos cerrados usados recientemente → LRU, evictar bajo presión.
  - **Cold tier:** documentos cerrados no usados → candidatos inmediatos a eviction.
- **Archivos afectados:**
  - `src/server/knowledge/DocumentCache.ts` — añadir `maxEntries`, LRU con `Map` insertion order, pin/unpin API.
  - `src/server/handlers/documentHandlers.ts` — llamar `pin(uri)` al abrir, `unpin(uri)` al cerrar.
  - `src/server/server.ts` — configurar capacidad (recomendado: 256 documentos ≈ 16 MiB).
- **Diseño técnico:**
  ```typescript
  // Nuevo constructor
  constructor(maxEntries = 256)
  
  // Pin: documento abierto, no se evicta
  pin(uri: string): void
  unpin(uri: string): void
  
  // Set con eviction automática de unpinned LRU
  set(uri: string, entry: DocumentCacheEntry): void {
    // Si cache llena, evictar el unpinned más antiguo
  }
  ```
- **Acceptance criteria:**
  - `DocumentCache` tiene `maxEntries` configurable.
  - Documentos abiertos se pinean y nunca se evictan.
  - Documentos cerrados siguen política LRU.
  - A 826 archivos el cache no supera 256 entries (≈16 MiB).
  - `getStats()` reporta: `size`, `capacity`, `pinnedCount`, `evictions`.
  - Eviction no rompe `KnowledgeBase` (el KB mantiene su propio índice independiente).
- **Docs:** `docs/performance-budget.md` §5, `docs/architecture.md` cache contract.
- **Tests:** Unit tests de capacidad, pin/unpin, eviction LRU, stats coherentes.

---


## CACHE-P0-SERVING-KEY-DOCUMENT-EPOCH-01 — Cache key con document epoch en lugar de global epoch

- **Estado:** Done.
- **Prioridad:** P0.
- **Origen:** Cache architecture audit (H1 — Serving Cache Key Mismatch).
- **Evidencia:** La clave de ServingCache incluye `kbVersion` y `semanticEpoch` globales. Cada `upsertDocument` durante indexación incrementa el epoch, invalidando 100% de las entradas cached. Hit ratio observado: 0% (0/155 hits).
- **Riesgo:** Crítico. Sin hits de cache, cada hover/completion recalcula desde cero (~50-120ms en lugar de ≤20ms).
- **Patrón moderno:** Per-document epoch versioning (inspirado en Salsa/rust-analyzer y TypeScript `DocumentRegistry`):
  - Cada documento tiene su propio `documentSemanticVersion` (hash o contador).
  - La clave de cache usa el `documentSemanticVersion` del documento activo, no el epoch global.
  - Invalidación ocurre solo cuando el documento específico o sus dependencias cambian.
  - Early cutoff: si un documento cambia pero su snapshot semántico es idéntico, no invalida dependientes.
- **Archivos afectados:**
  - `src/server/serving/cacheKeyContract.ts` — reemplazar `kbVersion` + `semanticEpoch` por `documentSemanticVersion`.
  - `src/server/serving/activeDocumentServingSnapshot.ts` — calcular `documentSemanticVersion` desde el snapshot del documento.
  - `src/server/knowledge/KnowledgeBase.ts` — exponer `getDocumentSemanticVersion(uri): number`.
  - `src/server/handlers/featureHandlers.ts` — pasar `documentSemanticVersion` en lugar de `kbVersion`/`semanticEpoch`.
  - `src/server/knowledge/ServingCache.ts` — actualizar `kbVersionFromKey()` para nueva estructura.
- **Diseño técnico:**
  ```typescript
  // KnowledgeBase: versión por documento
  getDocumentSemanticVersion(uri: string): number {
    const snapshot = this.publishedState.documentSnapshots.get(normalizeUri(uri));
    return snapshot?.semanticVersion ?? 0;
  }
  
  // Cache key: reemplazar epoch global por doc version
  // Antes: kb:42|epoch:500
  // Después: docver:7 (solo la versión del documento activo)
  ```
- **Acceptance criteria:**
  - Hover sobre posición fija en archivo A devuelve cache hit aunque archivo B se indexe.
  - La clave de cache no contiene `semanticEpoch` global.
  - Invalidación solo se dispara por cambios en el documento activo o sus dependencias semánticas.
  - Hit ratio del serving cache ≥80% durante navegación normal con indexación paralela.
  - No hay regresión en stale guard: resultados obsoletos no se sirven.
- **Docs:** `docs/performance-budget.md` §6, `docs/architecture.md` cache contract.
- **Tests:** Unit test: hover misma posición antes/después de indexar archivo no relacionado → cache hit. Test: editar archivo activo → cache miss correcto.

---


## CACHE-P0-MEMORY-PRESSURE-GRADUATED-POLICY-01 — Política de presión graduada que no mate serving cache

- **Estado:** Done.
- **Prioridad:** P0.
- **Origen:** Cache architecture audit (doom loop H2+H1).
- **Implementado:**
  - `memoryPressurePolicy.ts`: warning level ya NO purga serving cache ni bloquea writes. Solicita document cache eviction en su lugar.
  - `DEFERRED_WORKLOADS_ON_WARNING` separado: no difiere `background-indexing` (previene discovery deadlock).
  - `server.ts` `ensureRuntimeMemoryPressureRelief()`: coopera con `requestDocumentCacheEviction`, llama `documentCache.evictUnpinned()`.
  - Test actualizado: `warning solicita eviction de document cache sin matar serving cache`.
- **Pendiente exacto:**
  - Completado. Se validó la integración de \`evictUnpinned\` en \`server.ts\` durante la carga.
- **Evidencia:** `memoryPressurePolicy` establece `allowServingCacheWrites: false` y `purgeServingCache: true` en nivel `warning`. Como el document cache no tiene eviction, una vez que se supera 85% la presión nunca baja y el serving cache queda permanentemente deshabilitado.
- **Riesgo:** Crítico. La combinación document cache sin eviction + pressure policy agresiva crea un doom loop permanente.
- **Patrón moderno:** Política de presión graduada:
  - **Healthy:** todo normal.
  - **Warning:** reducir capacidad de serving cache al 50%, permitir writes pero con backpressure. Solicitar eviction al document cache.
  - **Critical:** purgar serving cache, bloquear writes de serving cache, solicitar eviction agresiva al document cache.
  - **Recovery:** cuando la presión baja, restaurar capacidades progresivamente.
- **Archivos afectados:**
  - `src/server/runtime/memoryPressurePolicy.ts` — añadir nivel `warning` que permite writes reducidos.
  - `src/server/runtime/memoryBudgets.ts` — ajustar umbrales con el nuevo document cache LRU.
  - `src/server/server.ts` — coordinar eviction del document cache cuando se detecte presión.
- **Diseño técnico:**
  ```typescript
  // Warning: reducir pero no matar
  if (report.status === 'warning') {
    return {
      level: 'warning',
      purgeServingCache: false,        // ← NO purgar
      allowServingCacheWrites: true,   // ← SÍ permitir writes
      reducedServingCapacity: 0.5,     // ← Nueva: capacidad al 50%
      requestDocumentCacheEviction: true, // ← Nueva: pedir eviction
      deferredWorkloads: ['ai-tooling'],  // ← Solo diferir lo heavy
    };
  }
  ```
- **Depends on:** `CACHE-P0-DOCUMENT-CACHE-LRU-EVICTION-01`.
- **Acceptance criteria:**
  - En nivel `warning`, serving cache permite writes con capacidad reducida.
  - En nivel `error`, serving cache se purga y bloquea (comportamiento actual preservado).
  - Document cache responde a solicitudes de eviction reduciendo su tamaño.
  - La presión puede recuperarse a `healthy` sin reiniciar el servidor.
  - No hay doom loop: presión → eviction document cache → presión baja → serving cache funcional.
- **Docs:** `docs/performance-budget.md` §5.2, `docs/architecture.md` memory model.
- **Tests:** Integration test: simular presión warning → verificar serving cache funcional. Test: simular presión error → verificar purge.

---


## CACHE-P1-FROZEN-REFS-HOT-PATH-01 — Referencias congeladas para consumers de solo lectura en hot path

- **Estado:** Done.
- **Prioridad:** P1.
- **Origen:** Cache architecture audit (H5 — structuredClone overhead).
- **Evidencia:** `KnowledgeBase` y `DocumentCache` usan `structuredClone` en cada lectura. Un hover típico acumula 2-8ms de clonado puro (5-8 clones por request). Presupuesto hover cache hit: ≤20ms; el clonado consume 10-40% del budget.
- **Riesgo:** Alto. Latencia innecesaria en el hot path más frecuente del plugin.
- **Patrón moderno:** Immutable/Frozen references (inspirado en Immer.js produce/freeze y React frozen state):
  - Los datos publicados en `KnowledgeBase.publishedState` son inmutables una vez publicados.
  - Consumers de solo lectura (hover, completion, definition) reciben referencia frozen.
  - Consumers que necesitan mutar (upsert, batch update) trabajan sobre draft/clone.
  - `Object.freeze()` en modo desarrollo para detectar mutaciones accidentales.
- **Archivos afectados:**
  - `src/server/knowledge/KnowledgeBase.ts` — añadir `findDefinitionReadonly()`, `getEntitiesByUriReadonly()`, `getScopeAtReadonly()` que devuelven referencia directa sin clone.
  - `src/server/knowledge/DocumentCache.ts` — añadir `getReadonly(uri)` y `getSnapshotReadonly(uri)`.
  - `src/server/features/hover.ts` — usar APIs readonly.
  - `src/server/features/definition.ts` — usar APIs readonly.
  - `src/server/features/completion.ts` — usar APIs readonly.
  - `src/server/knowledge/resolution/semanticQueryService.ts` — usar APIs readonly donde no mute.
- **Diseño técnico:**
  ```typescript
  // KnowledgeBase: referencia directa para lectura
  findDefinitionReadonly(symbolName: string): Readonly<Entity> | null {
    const entities = this.publishedState.globalSymbols.get(symbolName.toLowerCase());
    return entities?.[0] ?? null; // Sin clone
  }
  
  // En desarrollo: freeze para detectar mutaciones
  if (process.env.NODE_ENV === 'development') {
    Object.freeze(result);
  }
  ```
- **Acceptance criteria:**
  - Hot paths de hover/completion/definition usan APIs `*Readonly()`.
  - Latencia de hover con cache miss se reduce en ≥2ms medido.
  - No hay mutaciones accidentales de estado compartido (tests de freeze en dev).
  - APIs `get()` con clone se mantienen para consumers que mutan (batch update, export).
  - Benchmark antes/después documentado.
- **Docs:** `docs/performance-budget.md` §7.1, `docs/architecture.md` knowledge layer contract.
- **Tests:** Unit test: llamar `findDefinitionReadonly()` y verificar que es la misma referencia que el estado interno. Test: intentar mutar resultado frozen → error en dev mode.

---


## CACHE-P1-READINESS-DISCOVERY-DEADLOCK-01 — Evitar deadlock de readiness cuando memory pressure difiere discovery

- **Estado:** Done.
- **Prioridad:** P1.
- **Origen:** Cache architecture audit (H3 — Readiness State Machine Hang).
- **Evidencia:** Discovery corre como tarea `background-indexing` que es diferida bajo presión de memoria. Pero discovery debe completar para que `discoveryProgress.current` alcance `discoveryProgress.total`. Si la presión nunca baja (document cache sin eviction), readiness queda en `discovering` permanentemente y los features interactivos se bloquean o degradan.
- **Riesgo:** Alto. Deadlock silencioso que deja el plugin inutilizable.
- **Patrón moderno:** Priority lanes + exemptions (inspirado en schedulers de sistema operativo):
  - Discovery es una tarea one-shot irrecuperable: si no completa, el pipeline no puede avanzar.
  - Clasificar discovery como `critical-initialization`, no como `background-indexing`.
  - Las tareas `critical-initialization` no se difieren por presión de memoria.
  - Añadir timeout de seguridad: si `discovering` durante >30s con scheduler idle, forzar transición.
- **Archivos afectados:**
  - `src/server/handlers/lifecycleHandlers.ts` — cambiar `workload: 'background-indexing'` a `workload: 'critical-initialization'` en la tarea de discovery.
  - `src/server/runtime/backpressurePolicy.ts` — registrar `critical-initialization` como workload no diferible.
  - `src/server/runtime/memoryPressurePolicy.ts` — excluir `critical-initialization` de `DEFERRED_WORKLOADS_ON_PRESSURE`.
  - `src/server/features/progressReadiness.ts` — añadir timeout de seguridad en `deriveReadinessState`.
- **Depends on:** `CACHE-P0-DOCUMENT-CACHE-LRU-EVICTION-01` (resuelve la raíz del problema de presión, pero el deadlock protection es necesario como safety net).
- **Acceptance criteria:**
  - Discovery nunca se difiere por presión de memoria.
  - Si discovery se completa, readiness transiciona a `indexing` o `idle`.
  - Si discovery se atasca >30s con scheduler idle, readiness transiciona a `degraded` con reason code `discovery-timeout`.
  - No hay regresión: discovery sigue siendo cancelable por el usuario.
- **Docs:** `docs/architecture.md` readiness FSM, `docs/performance-budget.md` §4.2.
- **Tests:** Integration test: simular presión alta → verificar que discovery no se difiere. Test: simular discovery atascado → verificar timeout.

---


## CACHE-P1-JOURNAL-AUTOCOMPACTION-01 — Auto-compactación del journal de cache semántica

- **Estado:** Done.
- **Prioridad:** P1.
- **Origen:** Cache architecture audit (H4 — Journal Budget Overrun).
- **Evidencia:** `SemanticCacheStore.appendJournalMutation()` no tiene trigger de compactación. Entre checkpoints (que solo ocurren al final de discovery y al final de indexación), el journal puede acumular miles de mutaciones. En workspace de 826 archivos: journal observado en 4,755 y 10,537 eventos.
- **Riesgo:** Medio. Crecimiento de memoria no acotado en el journal entre checkpoints.
- **Patrón moderno:** Write-ahead log con auto-compaction (inspirado en bases de datos y LSM trees):
  - Threshold: cuando el journal alcanza N mutaciones pendientes, disparar checkpoint asíncrono.
  - Backpressure: no acumular más de 2N mutaciones sin checkpoint.
  - Merge: el checkpoint fusiona mutaciones acumuladas en un snapshot compacto.
- **Archivos afectados:**
  - `src/server/cache/cacheStore.ts` — añadir `maxPendingMutations` con threshold (recomendado: 500).
  - `src/server/cache/semanticCacheRuntimeController.ts` — disparar `persistCheckpoint()` asíncrono al alcanzar threshold.
- **Acceptance criteria:**
  - El journal no excede `maxPendingMutations` (default 500) sin checkpoint.
  - Auto-compaction es asíncrona y no bloquea el hot path.
  - `getStats()` reporta `pendingMutations`, `autoCompactions`.
  - El checkpoint post-compaction es válido y restaurable.
- **Docs:** `docs/architecture.md` persistence layer, `docs/performance-budget.md`.
- **Tests:** Unit test: append 600 mutations con threshold 500 → verificar checkpoint. Test: checkpoint restaura estado correcto.

---


## CACHE-P1-KB-DEPENDENCY-INVALIDATION-01 — Invalidación de serving cache por grafo de dependencias

- **Estado:** Done.
- **Prioridad:** P1.
- **Origen:** Cache architecture audit (complemento de CACHE-P0-SERVING-KEY-DOCUMENT-EPOCH-01).
- **Evidencia:** El `KnowledgeBase` ya mantiene `documentDependencies` y `reverseDependencies`. Pero el serving cache no los usa para invalidación selectiva. Actualmente invalida por URI directo o global.
- **Riesgo:** Medio. Sin invalidación por dependencias, un hover sobre `child_class.inherited_method()` puede servir resultado stale si el ancestro cambió.
- **Patrón moderno:** Dependency-driven invalidation (inspirado en Salsa dependency graph):
  - Cuando un documento `A` cambia, invalidar serving cache de `A` Y de todos los documentos que dependen semánticamente de `A` (via `reverseDependencies`).
  - Early cutoff: si el cambio en `A` no modifica su interface pública (mismos exports), no propagar invalidación a dependientes.
- **Archivos afectados:**
  - `src/server/cache/servingCacheRuntime.ts` — extender `invalidateServingCacheEntries` para aceptar lista de URIs dependientes.
  - `src/server/workspace/watchedFileIntake.ts` — al reindexar un archivo, consultar `KnowledgeBase.getDependentDocumentsForUri()` y propagar invalidación.
  - `src/server/knowledge/semanticDiff.ts` — implementar early cutoff: comparar exports antes/después del cambio.
  - `src/server/handlers/documentHandlers.ts` — propagar invalidación de dependientes al cambiar un documento abierto.
- **Depends on:** `CACHE-P0-SERVING-KEY-DOCUMENT-EPOCH-01` (la clave de cache debe ser per-document para que la invalidación selectiva funcione).
- **Acceptance criteria:**
  - Al cambiar `ancestor.sru`, el serving cache invalida entradas de archivos que dependen de `ancestor`.
  - Early cutoff: si `ancestor.sru` cambia whitespace pero no exporta cambios, no invalida dependientes.
  - La invalidación selectiva es O(dependientes), no O(total entries).
  - No hay regresión: cambios globales siguen invalidando todo.
- **Docs:** `docs/architecture.md` knowledge layer, `docs/performance-budget.md` §6.2.
- **Tests:** Unit test: cambiar ancestro → verificar invalidación de descendientes. Test: cambiar whitespace → verificar no invalidación (early cutoff).

## 1.239 PB-RUNTIME-P2-DIAGNOSTIC-SEVERITY-NOISE-01 — **Cerrado (runtime / diagnostics / 2026-05)**

**Objetivo:** Reducir el ruido en el panel de Problems generado por diagnostics informativos dinámicos de DataWindow y Transaction.

**Resultado registrado:**
- Se degradó la severidad de los diagnostics `dataobject-dynamic` y `transaction-binding-dynamic` de `Information` a `Hint` en `src/server/features/diagnostics.ts`.
- Esto oculta las advertencias del panel de Problems por defecto, preservando la información para mostrarla on-hover y en el diagnostic tool de VS Code.
- Los tests unitarios de `diagnostics.test.ts` fueron actualizados para esperar `DiagnosticSeverity.Hint`.

**Validación registrada:**
- `npm run test:unit` validado tras los cambios en severidad de los tests implicados.

**Documentación alineada:**
- `docs/backlog.md`
- `docs/done-log.md`

## 1.238 CACHE-P0-DOCUMENT-CACHE-LRU-EVICTION-01 — **Cerrado (cache / performance / 2026-05)**

**Objetivo:** Implementar un mecanismo LRU y eviction en `DocumentCache` para mitigar memory leaks bajo presión en workspaces grandes.

**Resultado registrado:**
- Se confirmó la implementación de cache eviction mediante políticas de *tiered LRU* y *pinning* en `DocumentCache.ts`.
- Múltiples tests añadidos en sesiones anteriores demuestran el control de capacidad (max 256).

**Validación registrada:**
- Múltiples pruebas unitarias previas validadas.

**Documentación alineada:**
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/backlog.md`

## 1.237 CATALOG-MANUAL-LOCALIZATION-BASE-EN — **Cerrado (symbols / catalog / localization / manual-en / 2026-05)**

**Objetivo:** completar la migración a inglés canónico para los overlays manuales de `visual`, `runtime` y `tooling`, manteniendo la infraestructura de localización `es` paralela, normalizando las keys de categoría y garantizando que las entries sin review pasen el gate CI (B132).

**Resultado registrado:**
- `docs/localization.md` incluye la política manual-base-en formal.
- `manual/visual/*`, `manual/runtime/*` y `manual/tooling/*` convertidos a inglés canónico con categorías estables (ej. `Visual objects`, `System objects`, `Tooling`).
- Creada estructura mirror `localization/es/{visual,runtime,tooling}/` para hospedar los overlays localizados.
- Todos los overlays parciales se flaggean con `reviewed: false` para respetar la validación de schema (`schemaIssues: 0`) según requerimientos arquitectónicos, permitiendo completitud incremental.
- Tests de catálogo (`catalogLocalization.test.ts`, `catalogConsistency.test.ts`, `visualCatalogDatatypes.test.ts`, `runtimeCatalogDatatypes.test.ts`, `publicCorpusDocumentation.test.ts`) endurecidos y sincronizados con los changes, eliminando reportes de drift documental.

**Validación registrada:**
- `npm run test:unit` (`1235 passing`, exit code 0)
- `npm run report:catalog-localization` (`schemaVersion: 1.0.0`, `schemaIssues = 0`, exit code 0)
- `npm run test:docs:drift` (`status: passed`, exit code 0)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/localization.md`
- `docs/done-log.md`

## 1.236 SYMBOL-FRAMEWORKS-01 — **Cerrado (symbols / framework packs / advisory / 2026-05)**

**Objetivo:** añadir enrichments PFC/STD sólo advisory, con `source`, `confidence`, fallback y evidencia real, sin convertir metadata de framework en autoridad sobre el símbolo del workspace.

**Resultado registrado:**
- [src/server/knowledge/system/frameworkKnowledgePackPolicy.ts](../src/server/knowledge/system/frameworkKnowledgePackPolicy.ts) amplía el modelo curado con `advisoryMembers` y `advisoryEvents` y registra dos familias mínimas corpus-backed: `pfc-response-dwsrv` y `std-controller-shells`, ambas con `source` explícito y sin portar runtime legacy;
- [src/server/knowledge/system/frameworkKnowledgePacks.ts](../src/server/knowledge/system/frameworkKnowledgePacks.ts) añade el fallback de summary para owner types framework-specific ausentes del system catalog oficial, reutilizando samples curados en el manifest sin promocionarlos a símbolos reales;
- [test/server/unit/frameworkKnowledgePacks.test.ts](../test/server/unit/frameworkKnowledgePacks.test.ts), [test/server/unit/workspaceSymbols.test.ts](../test/server/unit/workspaceSymbols.test.ts) y [test/server/unit/currentObjectContext.test.ts](../test/server/unit/currentObjectContext.test.ts) fijan el rail visible: el símbolo real del workspace sigue ganando, los packs se publican como advisory y el corpus local PFC/STD sólo se usa de forma gated con skip honesto cuando falta.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(frameworkKnowledgePacks|workspaceSymbols|currentObjectContext)"` (`24 passing`, exit code 0)
- `npm run test:docs:drift` (`status: passed`, `currentFocusId = roadmapFocusId = CATALOG-LOCALIZATION-DOMAINS-01`, exit code 0)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/symbol-system.md`
- `docs/architecture-status.md`
- `docs/testing.md`
- `docs/done-log.md`

## 1.235 SYMBOL-DOCS-EXAMPLES-01 — **Cerrado (symbols / docs / examples / 2026-05)**

**Objetivo:** documentar ejemplos breves de overlays, enrichments y payloads sin copiar catálogos completos ni abrir un documento paralelo de reglas.

**Resultado registrado:**
- [docs/localization.md](localization.md) añade ejemplos mínimos de `overlay localizado` y `targetId/targetKey recovery`, usando shapes cortas y anchors reales (`targetKey`, `source`, `reviewed`) sin duplicar datasets `generated/manual/localization` completos;
- [docs/symbol-system.md](symbol-system.md) añade ejemplos mínimos de `manual-curated enrichment`, `confidence/sourceOrigin` y `completion resolve enrichment`, todos en shape simplificada y enlazados a las reglas ya descritas por los owners canónicos;
- [docs/ai-context/powerbuilder-plugin-context.md](ai-context/powerbuilder-plugin-context.md) queda alineado con un recordatorio compacto de dónde viven esos ejemplos, evitando duplicar su contenido dentro del AI context bootstrap.

**Validación registrada:**
- `npm run test:docs:drift` (`status: passed`, `currentFocusId = roadmapFocusId = SYMBOL-FRAMEWORKS-01`, exit code 0)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/localization.md`
- `docs/symbol-system.md`
- `docs/ai-context/powerbuilder-plugin-context.md`
- `docs/done-log.md`

## 1.234 SYMBOL-CATALOG-STATEMENTS-ENRICH-P2 — **Cerrado (symbols / catalog / statements / localization / 2026-05)**

**Objetivo:** enriquecer `statements`, `keywords` y `reserved-words` visibles sin traducir los lexemas reales del lenguaje ni tocar anchors técnicos del catálogo.

**Resultado registrado:**
- [src/server/knowledge/system/localization/es/generatedStatementLocalization.ts](../src/server/knowledge/system/localization/es/generatedStatementLocalization.ts) añade overlays `es` revisados para `IF...THEN`, `CHOOSE CASE`, `FOR...NEXT`, `IF`, `FOR`, `TRUE`, `FALSE` y `NOT`, todos anclados por `targetKey`, con documentación visible localizada y preservando `name`, `signatureLabel`, `parameterName`, `sourceUrl` y el resto de la identidad canónica del símbolo;
- [test/server/unit/catalogLocalization.test.ts](../test/server/unit/catalogLocalization.test.ts) endurece el slice runtime de `statements`, `keywords` y `reserved-words`, exige ya cobertura mínima en los tres dominios y mantiene `0` `incompleteOverlays`, `schemaIssues`, `invalidParameterTargets`, `recoveredTargetIds` y `orphanOverlays`;
- [test/server/unit/completion.test.ts](../test/server/unit/completion.test.ts) fija que `completion resolve` localiza `FOR` y `TRUE` sin traducir los lexemas reales ni inflar `completion initial`, mientras los greps transversales de `keyword|reserved` revalidan semantic tokens, catálogo y completion contextual;
- el reporte vivo de localización sube el locale `es` de `23` a `31` overlays revisados y abre cobertura limpia en `statements` (`3/16`, `18.75%`), `keywords` (`2/60`, `3.33%`) y `reserved-words` (`3/48`, `6.25%`) sin reabrir la taxonomía de `semanticTokens` ni la identidad semántica del catálogo.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogLocalization"` (`13 passing`, exit code 0)
- `npm run test:unit -- --grep "keyword|reserved|catalogLocalization|catalogConsistency"` (`33 passing`, exit code 0)
- `npm run report:catalog-localization` (`schemaVersion: 1.0.0`, `incompleteOverlays = 0`, `schemaIssues = 0`, `orphanOverlays = 0`, exit code 0)
- `npm run test:docs:drift` (`status: passed`, `currentFocusId = roadmapFocusId = CATALOG-LOCALIZATION-DOMAINS-01`, exit code 0)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/localization.md`
- `docs/symbol-system.md`
- `docs/testing.md`
- `docs/done-log.md`

## 1.233 SYMBOL-CATALOG-DATATYPES-ENRICH-P2 — **Cerrado (symbols / catalog / datatypes / localization / 2026-05)**

**Objetivo:** enriquecer `system-object-datatypes` visibles sin traducir nombres reales de datatypes ni tocar anchors técnicos del catálogo.

**Resultado registrado:**
- [src/server/knowledge/system/localization/es/generatedDatatypeLocalization.ts](../src/server/knowledge/system/localization/es/generatedDatatypeLocalization.ts) añade overlays `es` revisados para `DataStore`, `DataWindowChild`, `Transaction`, `HTTPClient` y `RESTClient`, todos anclados por `targetKey`, con documentación visible localizada y preservando `name`, `signatureLabel`, `parameterName`, `sourceUrl` y el resto de la identidad canónica del datatype;
- [test/server/unit/catalogLocalization.test.ts](../test/server/unit/catalogLocalization.test.ts) endurece el slice runtime de `system-object-datatypes` y el reporte live, exigiendo ya cobertura mínima del dominio y manteniendo `0` `incompleteOverlays`, `schemaIssues`, `invalidParameterTargets`, `recoveredTargetIds` y `orphanOverlays`;
- [test/server/unit/documentationService.test.ts](../test/server/unit/documentationService.test.ts) fija el serving visible del slice para `DataStore` y `HTTPClient`, mientras `systemCatalog` revalida que el runtime base del catálogo sigue intacto y que la localización sólo sustituye texto visible;
- el reporte vivo de localización sube el locale `es` de `18` a `23` overlays revisados y abre cobertura limpia en `system-object-datatypes` (`5/224`, `2.23%`) sin reabrir resolución semántica, completion ni identity keys del catálogo.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogLocalization"` (`12 passing`, exit code 0)
- `npm run test:unit -- --grep "documentationService"` (`8 passing`, exit code 0)
- `npm run test:unit -- --grep "systemCatalog"` (`24 passing`, exit code 0)
- `npm run test:unit -- --grep "catalogConsistency"` (`3 passing`, exit code 0)
- `npm run report:catalog-localization` (`schemaVersion: 1.0.0`, `incompleteOverlays = 0`, `schemaIssues = 0`, `orphanOverlays = 0`, exit code 0)
- `npm run test:docs:drift` (`status: passed`, `currentFocusId = roadmapFocusId = SYMBOL-CATALOG-STATEMENTS-ENRICH-P2`, exit code 0)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/localization.md`
- `docs/symbol-system.md`
- `docs/testing.md`
- `docs/done-log.md`

## 1.232 SYMBOL-CATALOG-ENUMS-ENRICH-P2 — **Cerrado (symbols / catalog / enums / localization / 2026-05)**

**Objetivo:** enriquecer `enumerated-types` y `enumerated-values` visibles sin traducir enum values con `!` ni tocar anchors técnicos del catálogo.

**Resultado registrado:**
- [src/server/knowledge/system/localization/es/generatedEnumLocalization.ts](../src/server/knowledge/system/localization/es/generatedEnumLocalization.ts) añade overlays `es` revisados para `SaveAsType`, `FillPattern`, `SecureProtocol`, `Text!` y `Primary!`, todos anclados por `targetKey`, con documentación visible localizada y preservando `name`, `signatureLabel`, `parameterName`, enum values reales y `obsoleteMessage` cuando la entry canónica lo exige;
- [test/server/unit/catalogLocalization.test.ts](../test/server/unit/catalogLocalization.test.ts) endurece el slice runtime de enums y el reporte live, exigiendo cobertura mínima en `enumerated-types` / `enumerated-values` y manteniendo `0` `incompleteOverlays`, `schemaIssues`, `invalidParameterTargets`, `recoveredTargetIds` y `orphanOverlays`;
- [test/server/unit/documentationService.test.ts](../test/server/unit/documentationService.test.ts) fija el serving visible del slice enum para `SaveAsType` y `Primary!`, mientras el grep transversal `enum` revalida completion, hover, signatureHelp, diagnostics y semantic tokens sobre el contexto enumerado ya compartido;
- el reporte vivo de localización sube el locale `es` de `13` a `18` overlays revisados y abre cobertura limpia en `enumerated-types` (`3/37`, `8.11%`) y `enumerated-values` (`2/245`, `0.82%`) sin reabrir lógica de contexto ni identidad semántica del catálogo.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogLocalization"` (`11 passing`, exit code 0)
- `npm run test:unit -- --grep "documentationService"` (`7 passing`, exit code 0)
- `npm run test:unit -- --grep "enum"` (`31 passing`, exit code 0)
- `npm run test:unit -- --grep "catalogConsistency"` (`3 passing`, exit code 0)
- `npm run report:catalog-localization` (`schemaVersion: 1.0.0`, `incompleteOverlays = 0`, `schemaIssues = 0`, `orphanOverlays = 0`, exit code 0)
- `npm run test:docs:drift` (`status: passed`, `currentFocusId = roadmapFocusId = SYMBOL-CATALOG-DATATYPES-ENRICH-P2`, exit code 0)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/localization.md`
- `docs/symbol-system.md`
- `docs/testing.md`
- `docs/done-log.md`

## 1.231 SYMBOL-TOKENS-01 — **Cerrado (symbols / semantic-tokens / taxonomy / 2026-05)**

**Objetivo:** fijar la taxonomía visible de semantic tokens como contrato explícito, con token types/modifiers defendibles y sin dependencia de texto localizado.

**Resultado registrado:**
- [src/server/features/semanticTokens.ts](../src/server/features/semanticTokens.ts) publica ya el contrato explícito del legend: usa sólo token types estándar (`type`, `class`, `function`, `method`, `property`, `variable`, `parameter`, `event`, `enumMember`, `keyword`), mantiene `defaultLibrary/local/instance/global` como modifiers visibles del repo y separa `class` frente a `type` para tipos de workspace/runtime sin abrir token types custom ni depender de locale/presentation strings;
- el mismo cierre endurece la clasificación runtime para `system-type`/object datatypes (`window`, `DataStore`, `DataWindowChild`, etc.) y deja `enum values` con `!` como `enumMember`, manteniendo `dynamic/unknown` fuera de la tokenización fuerte;
- [src/server/analysis/documentAnalysis.ts](../src/server/analysis/documentAnalysis.ts) preserva ahora `shared/global` inline dentro de `type variables`, evitando que semantic tokens y cualquier consumer del snapshot pierdan el scope real por depender sólo de la cabecera de sección;
- [test/server/unit/semanticTokens.test.ts](../test/server/unit/semanticTokens.test.ts) fija el contrato completo con rangos/modifiers explícitos sobre `class/type`, `parameter`, `local`, `instance`, `shared/global`, built-ins del catálogo y enum values con `!`.

**Validación registrada:**
- `npm run test:unit -- --grep "Semantic Tokens"` (`4 passing`, exit code 0)
- `npm run test:performance:gate` (`passed`, `synthetic-hot-semanticTokens = 5.46ms / 100.00ms`, exit code 0)
- `npm run test:docs:drift` (`status: passed`, `currentFocusId = roadmapFocusId = SYMBOL-CATALOG-ENUMS-ENRICH-P2`, exit code 0)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/symbol-system.md`
- `docs/testing.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/done-log.md`

## 1.230 SYMBOL-DW-01 — **Cerrado (symbols / datawindow / fast-context / 2026-05)**

**Objetivo:** definir enrichments DataWindow sobre `DataWindowFastContext` con `confidence/sourceOrigin` explícitos y sin tratar `.srd` como PowerScript normal.

**Resultado registrado:**
- [src/server/features/dataWindowFastContext.ts](../src/server/features/dataWindowFastContext.ts) queda consolidado como vista rápida segura para `DataWindow control`, `DataStore variable`, `DataWindowChild`, `DataObject literal`, `column`, `computed field`, `property path`, `buffer` y `dynamic/unknown binding`, reutilizando `dataWindowModel` y `dataWindowBindingModel` en lugar de abrir reparsers locales en consumers interactivos;
- el cierre añade `computedFields` modelados desde `expressions` del `.srd`, con dependencias seguras y `sourceOrigin: 'datawindow-model'`, sin inventar resultados fuertes cuando el binding es dinámico o ambiguo;
- [test/server/unit/dataWindowFastContext.test.ts](../test/server/unit/dataWindowFastContext.test.ts) fija ya el contrato completo del fast context, incluyendo degradación honesta para `dynamic/unknown`, ausencia de IO/reanálisis en hot path y el nuevo caso de `computed field` enlazado por `DataObject`.

**Validación registrada:**
- `npm run test:unit -- --grep "dataWindow"` (`19 passing`, exit code 0)
- `npm run test:architecture:rapid` (`passed`, exit code 0)
- `npm run test:docs:drift` (`status: passed`, `currentFocusId = roadmapFocusId = SYMBOL-TOKENS-01`, exit code 0)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/symbol-system.md`
- `docs/architecture-status.md`
- `docs/testing.md`
- `docs/done-log.md`

## 1.229 SYMBOL-I18N-TERMS-01 — **Cerrado (symbols / i18n / presentation / 2026-05)**

**Objetivo:** crear un glosario estable español/inglés para presentation/enrichments sin traducir anchors técnicos ni reintroducir hardcodes visibles en providers.

**Resultado registrado:**
- [src/server/presentation/terminology.ts](../src/server/presentation/terminology.ts) materializa el owner canónico del glosario con keys estables, términos mínimos para `function`, `event`, `variable`, `parameter`, `return value`, `DataWindow`, `DataStore`, `DataWindowChild`, `transaction`, `ancestor`, `override`, `scope`, `source origin`, `confidence`, `deprecated`, `inferred`, `ambiguous` y `unknown`, más fallback de locale `en/es` reutilizable;
- [src/server/features/hoverViewModel.ts](../src/server/features/hoverViewModel.ts), [src/server/features/hover.ts](../src/server/features/hover.ts), [src/server/features/hoverFormat.ts](../src/server/features/hoverFormat.ts) y [src/server/presentation/completionPresentation.ts](../src/server/presentation/completionPresentation.ts) dejan de ensamblar labels visibles repetidos ad hoc y pasan a reutilizar el glosario para headings, warnings y bloques de detalle en hover/completion-resolve, manteniendo identidad semántica y anchors reales intactos;
- [test/server/unit/presentationTerminology.test.ts](../test/server/unit/presentationTerminology.test.ts) fija el contrato del glosario, el fallback de locale y la localización visible de hover/completion, mientras [test/server/unit/hoverFormat.test.ts](../test/server/unit/hoverFormat.test.ts) y [test/server/unit/presentationContracts.test.ts](../test/server/unit/presentationContracts.test.ts) siguen protegiendo los consumers existentes sin abrir una surface paralela.

**Validación registrada:**
- `npm run test:unit -- --grep "presentationTerminology|hoverFormat|presentationContracts"` (`26 passing`, exit code 0)
- `npm run test:unit` (`1224 passing`, exit code 0)
- `npm run test:docs:drift` (`status: passed`, `currentFocusId = roadmapFocusId = CATALOG-LOCALIZATION-ES-01`, exit code 0)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/symbol-system.md`
- `docs/localization.md`
- `docs/testing.md`
- `docs/done-log.md`

## 1.228 SYMBOL-QUALITY-01 — **Cerrado (symbols / regression-matrix / i18n / 2026-05)**

**Objetivo:** consolidar una regression matrix compacta y trazable para symbols, enrichments y localization sin reabrir runtime ni duplicar surfaces ya existentes.

**Resultado registrado:**
- [test/server/unit/symbolQualityRegressionMatrix.test.ts](../test/server/unit/symbolQualityRegressionMatrix.test.ts) fija una matriz única y compacta para `built-in function`, `user function`, `event`, `local variable`, `instance variable`, `shared/global variable`, `parameter`, `inherited`, `ambiguous`, `unknown`, `DataWindow column/property`, `overlay localized` y `completion resolve enrichment`;
- la suite congela además validaciones explícitas de `sourceOrigin`, `confidence`, `reasonCodes`, `i18n fallback` y `payload budget`, reutilizando runtime real (`completion`, `definition`, `diagnostics`, `documentationService`, `semanticQueryService`) en lugar de abrir una arquitectura paralela;
- [docs/symbol-system.md](../docs/symbol-system.md) y [docs/testing.md](../docs/testing.md) quedan actualizados para que el baseline visible de calidad viva en una suite concreta y no dependa solo de cobertura dispersa entre `crossSurfaceGoldenMatrix`, `powerbuilderSemanticGolden`, `completion` y `documentationService`.

**Validación registrada:**
- `npm run test:unit -- --grep "symbolQualityRegressionMatrix"` (`1 passing`, exit code 0)
- `npm run test:unit` (`1221 passing`, exit code 0)
- `npm test` (`1221 passing` en unit + `4 passing` en integration visibles, exit code 0)
- `npm run test:performance:gate` (`4 passing`; todos los budgets reportados como `ok`, exit code 0)
- `npm run test:docs:drift` (`status: passed`, `currentFocusId = roadmapFocusId = SYMBOL-I18N-TERMS-01`, exit code 0)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/symbol-system.md`
- `docs/testing.md`
- `docs/done-log.md`

## 1.227 SYMBOL-CATALOG-DW-ENRICH-P1 — **Cerrado (symbols / catalog / localization / datawindow / 2026-05)**

**Objetivo:** abrir el primer corte pequeño y defendible de enrichments/localización `es` para DataWindow core sin tocar identity, property paths, enum values ni anchors técnicos.

**Resultado registrado:**
- [src/server/knowledge/system/localization/es/generatedFunctionLocalization.ts](../src/server/knowledge/system/localization/es/generatedFunctionLocalization.ts) añade overlays `es` revisados para `Describe`, `Retrieve`, `SetItemStatus`, `SetTransObject` y `Update`, todos con `source: 'manual-curated'`, `reviewed: true` y `targetKey` canónico sobre `datawindow-functions`;
- el rail `es` de `datawindow-functions` pasa de `0/302` a `5/302` overlays revisados (`0%` -> `1.66%`) y el total del locale `es` sube a `13` overlays sin `incompleteOverlays`, `missingFieldsByDomain`, `invalidParameterTargets`, `recoveredTargetIds`, `schemaIssues` ni `orphans`, según el reporte vivo del catálogo;
- [test/server/unit/catalogLocalization.test.ts](../test/server/unit/catalogLocalization.test.ts), [test/server/unit/documentationService.test.ts](../test/server/unit/documentationService.test.ts), [test/server/unit/hover.test.ts](../test/server/unit/hover.test.ts), [test/server/unit/completion.test.ts](../test/server/unit/completion.test.ts) y [test/server/unit/signatureHelp.test.ts](../test/server/unit/signatureHelp.test.ts) congelan el contrato del slice DataWindow: overlays member-scoped con anchors canónicos, documentation service localizado, hover/completion/signatureHelp visibles y budgets intactos.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogLocalization|documentationService|hover|completion|signatureHelp"` (`128 passing`, exit code 0)
- `npm run test:unit -- --grep "dataWindow|catalogLocalization|catalogConsistency|documentationService"` (`37 passing`, exit code 0)
- `npm run report:catalog-localization` (`overlays es: 13`, `datawindow-functions: 5/302`, `schemaIssues: 0`, `invalidParameterTargets: 0`, exit code 0)
- `npm run migrate:catalog-localization-target-ids` (`No hay targetIds recuperados por targetKey. No hace falta migracion.`, exit code 0)
- `npm run test:performance:gate` (`passed`, exit code 0)
- `npm run test:docs:drift` (`passed`, con `currentFocusId = roadmapFocusId = SYMBOL-CATALOG-DW-ENRICH-P1` antes de la promoción documental, exit code 0)

**Documentación alineada:**
- `docs/localization.md`
- `docs/symbol-system.md`
- `docs/architecture-status.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.226 SYMBOL-CATALOG-BUILTINS-ENRICH-P1 — **Cerrado (symbols / catalog / localization / builtins / 2026-05)**

**Objetivo:** iniciar la capa de enriquecimiento visible con un corte pequeño y defendible de built-ins globales de alto uso, sin tocar identidad, anchors técnicos ni firmas reales.

**Resultado registrado:**
- [src/server/knowledge/system/localization/es/generatedFunctionLocalization.ts](../src/server/knowledge/system/localization/es/generatedFunctionLocalization.ts) añade overlays `es` revisados para `IsNull`, `SetNull`, `Len`, `Lower` y `Upper`, todos con `source: 'manual-curated'`, `reviewed: true` y `targetKey` canónico sobre `global-functions`;
- el rail `es` de `global-functions` pasa de `3/285` a `8/285` overlays revisados (`1.05%` -> `2.81%`) sin `incompleteOverlays`, `missingFieldsByDomain`, `invalidParameterTargets`, `recoveredTargetIds`, `schemaIssues` ni `orphans`, según el reporte vivo del catálogo;
- [test/server/unit/catalogLocalization.test.ts](../test/server/unit/catalogLocalization.test.ts), [test/server/unit/documentationService.test.ts](../test/server/unit/documentationService.test.ts), [test/server/unit/hover.test.ts](../test/server/unit/hover.test.ts), [test/server/unit/completion.test.ts](../test/server/unit/completion.test.ts) y [test/server/unit/signatureHelp.test.ts](../test/server/unit/signatureHelp.test.ts) congelan el contrato del slice: anchors técnicos intactos, documentation service localizado y consumers visibles con summary/documentation/usage/return localizados sin inflar `completion initial`.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogLocalization|catalogConsistency|documentationService|hover|completion|signatureHelp"` (`126 passing`, exit code 0)
- `npm run report:catalog-localization` (`overlays es: 8`, `global-functions: 8/285`, `schemaIssues: 0`, `invalidParameterTargets: 0`, exit code 0)
- `npm run migrate:catalog-localization-target-ids` (`No hay targetIds recuperados por targetKey. No hace falta migracion.`, exit code 0)

**Documentación alineada:**
- `docs/localization.md`
- `docs/symbol-system.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.225 SYMBOL-PRESENTATION-01 — **Cerrado (symbols / presentation / lsp-viewmodels / 2026-05)**

**Objetivo:** consolidar ViewModels server-side para presentar símbolos enriquecidos en hover/completion/signatureHelp/diagnostics/semantic tokens sin duplicar resolución semántica.

**Resultado registrado:**
- [src/server/presentation/viewModels.ts](../src/server/presentation/viewModels.ts), [src/server/presentation/hoverPresentation.ts](../src/server/presentation/hoverPresentation.ts) y [src/server/presentation/signatureHelpPresentation.ts](../src/server/presentation/signatureHelpPresentation.ts) publican ahora `SymbolHoverViewModel`, `SymbolCompletionViewModel`, `SymbolSignatureViewModel`, `SymbolDiagnosticViewModel` y `SymbolSemanticTokenViewModel`, con payload policies explícitas para hover/signatureHelp dentro de la capa presentation;
- [src/server/features/hoverViewModel.ts](../src/server/features/hoverViewModel.ts), [src/server/features/hoverFormat.ts](../src/server/features/hoverFormat.ts) y [src/server/features/signatureHelp.ts](../src/server/features/signatureHelp.ts) conservan la resolución semántica y el ensamblado del modelo, pero delegan el shape/formatter visible en `src/server/presentation` en lugar de mantener DTOs LSP dispersos por feature;
- [src/server/presentation/index.ts](../src/server/presentation/index.ts) expone la capa consolidada y [test/server/unit/presentationContracts.test.ts](../test/server/unit/presentationContracts.test.ts) congela el contrato nuevo junto con los guards ya existentes de completion/definition/diagnostics/semantic tokens;
- el cierre mantiene `completion initial` y `completion resolve` como modelos diferenciados y no reabre `KnowledgeBase`, parser, filesystem, discovery ni stores semánticos desde presentation.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/presentationContracts|unit/signatureHelp|unit/hover"` (`63 passing`, exit code 0)
- `npm run test:unit` (`passed`, exit code 0)
- `npm run test:performance:gate` (`passed`, exit code 0)
- `npm run test:docs:drift` (`passed`, exit code 0)

**Documentación alineada:**
- `docs/symbol-system.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.224 SYMBOL-PERF-01 — **Cerrado (symbols / performance / interactive-serving / 2026-05)**

**Objetivo:** proteger velocidad y budgets interactivos al añadir enrichments/traducciones sobre símbolos ya resueltos.

**Resultado registrado:**
- [src/server/features/completion.ts](../src/server/features/completion.ts) publica ya `resolveCompletionItemResult(...)`, separando resolve exitoso de miss reutilizable sin inflar `completion initial` ni duplicar resolución semántica;
- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts) y [src/server/server.ts](../src/server/server.ts) añaden negative cache explícita para misses seguros de `completion-resolve`, particionada por locale/contexto y sujeta a invalidación por documento, epoch, locale, watcher intake, shutdown y pressure policy;
- [test/server/unit/completion.test.ts](../test/server/unit/completion.test.ts), [test/server/unit/cacheKeyContract.test.ts](../test/server/unit/cacheKeyContract.test.ts) y [test/server/unit/interactiveServingPipeline.test.ts](../test/server/unit/interactiveServingPipeline.test.ts) congelan el contrato nuevo: lista inicial compacta, resolve lazy, segregación por locale/contexto, budgets separados y reutilización del negative lane sin reejecutar provider;
- el cierre mantiene verdes los guardrails ya existentes de payload, no IO/no workspace scan/no full parse y el gate de performance corpus-driven sin introducir scans globales ni parse completo por request interactiva.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/completion|unit/cacheKeyContract|unit/interactiveServingPipeline"` (`44 passing`, exit code 0)
- `npm run test:docs:drift` (`passed`, exit code 0)
- `npm run test:performance:gate` (`passed`, exit code 0)
- `npm run test:architecture:rapid` (`passed`, exit code 0)
- `npm run test:unit` (`passed`, exit code 0)

**Documentación alineada:**
- `docs/symbol-system.md`
- `docs/performance-budget.md`
- `docs/testing.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.223 SYMBOL-GENERATED-ENRICHMENT-AUTHORING-01 — **Cerrado (symbols / catalog / enrichment-authoring / 2026-05)**

**Objetivo:** fijar el workflow operativo para authoring incremental de enrichments/manual-curated sobre la base generada y la schema de localización ya cerradas.

**Resultado registrado:**
- [docs/localization.md](localization.md) publica ya el workflow incremental completo: baseline por dominio, elección de prioridad, authoring con `source`/`reviewed` explícitos, uso de `targetId`/`targetKey`, rerun de validaciones, cobertura antes/después y criterio real para promocionar `reviewed: true`;
- [docs/localization.md](localization.md) fija además cuándo una explicación puede considerarse `manual-curated` y cuándo no debe añadirse un overlay por falta de evidencia o por romper anchors/schema;
- [docs/symbol-system.md](symbol-system.md) enlaza el workflow de authoring con la policy de capas y la schema runtime ya cerradas, evitando que el proceso quede repartido en heurísticas implícitas;
- el workflow queda anclado al tooling real ya existente: [scripts/generate_catalog_localization_report.cjs](../scripts/generate_catalog_localization_report.cjs), [scripts/migrate_catalog_localization_target_ids.cjs](../scripts/migrate_catalog_localization_target_ids.cjs) y el report vivo `buildCatalogConsistencyReport().localization`.

**Validación registrada:**
- `npm run report:catalog-localization` (`schemaVersion: 1.0.0`, `schemaIssues: 0`, `orphanOverlays: 0`, exit code 0)
- `npm run test:docs:drift` (`passed`, exit code 0)

**Documentación alineada:**
- `docs/localization.md`
- `docs/symbol-system.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.222 SYMBOL-GENERATED-ENRICHMENT-SCHEMA-01 — **Cerrado (symbols / catalog / enrichment-schema / 2026-05)**

**Objetivo:** materializar un schema estricto para enrichments/generated/localization, con anchors canónicos, metadata obligatoria y reporting reproducible para authoring.

**Resultado registrado:**
- [src/server/knowledge/system/localization/schema.ts](../src/server/knowledge/system/localization/schema.ts) fija `schemaVersion = 1.0.0`, metadata obligatoria (`source`, `reviewed`), anchors válidos (`targetId`/`targetKey`), fields documentales actuales y slots reservados del schema;
- [src/server/knowledge/system/types.ts](../src/server/knowledge/system/types.ts) vuelve `source` y `reviewed` parte explícita del contrato de `PbSystemSymbolLocalizationOverlay`;
- [src/server/knowledge/system/localization/localizationResolver.ts](../src/server/knowledge/system/localization/localizationResolver.ts) publica `schemaIssues` (`missing-source`, `missing-reviewed`, `reviewed-with-issues`) y `missingFieldsByDomain`, además de seguir resolviendo `targetId`/`targetKey` contra la entry runtime canónica;
- [src/server/knowledge/system/consistency.ts](../src/server/knowledge/system/consistency.ts) y [scripts/generate_catalog_localization_report.cjs](../scripts/generate_catalog_localization_report.cjs) propagan `schemaVersion`, `schemaIssues` y `missingFieldsByDomain` al audit serializado en `artifacts/catalog/`;
- [test/server/unit/catalogLocalization.test.ts](../test/server/unit/catalogLocalization.test.ts) y [test/server/unit/documentationService.test.ts](../test/server/unit/documentationService.test.ts) fijan el contrato estricto, incluyendo metadata requerida, `reviewed: true => sin issues` y preservación de anchors técnicos.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogLocalization|documentationService"` (`12 passing`, exit code 0)
- `npm run test:unit -- --grep "catalogLocalization|catalogConsistency|catalogV2"` (`70 passing`, exit code 0)
- `npm run report:catalog-localization` (`schemaVersion: 1.0.0`, `schemaIssues: 0`, `missingFieldsByDomain: 0`, exit code 0)
- `npm run test:docs:drift` (`passed`, exit code 0)

**Documentación alineada:**
- `docs/symbol-system.md`
- `docs/localization.md`
- `docs/testing.md`
- `docs/architecture-implementation-map.md`
- `docs/architecture-status.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.221 SYMBOL-GENERATED-ENRICHMENT-LAYER-01 — **Cerrado (symbols / catalog / enrichment-layer / 2026-05)**

**Objetivo:** fijar la capa de enrichment del catálogo generado sin alterar identidad semántica ni convertir manual/localization en fuentes primarias.

**Resultado registrado:**
- [src/server/knowledge/system/policy.ts](../src/server/knowledge/system/policy.ts) introduce el owner runtime explícito de la policy de capas del catálogo: `generated base -> manual curated enrichment -> localization overlay -> presentation formatter`, con conflict policy `generated-primary-with-manual-overlays`, campos visibles enriquecibles, anchors bloqueados, provenance por capa y exposición por surface;
- [src/server/knowledge/system/registry/registry.ts](../src/server/knowledge/system/registry/registry.ts) deja de conservar wording provisional previo a `B369` en el auto-clasificado de overlays manuales solapados con `generated`;
- [test/server/unit/systemCatalogQueryHardening.test.ts](../test/server/unit/systemCatalogQueryHardening.test.ts) congela el contrato exportado, mantiene el guard contra wording provisional antiguo y fija que completion initial siga compacto mientras completion resolve expone enrichment visible de forma lazy;
- [test/server/unit/documentationService.test.ts](../test/server/unit/documentationService.test.ts) fija que la localización solo cambie documentación visible y preserve anchors técnicos (`name`, `normalizedName`, `signatures.label`, `parameterName`, `sourceUrl`);
- [docs/symbol-system.md](symbol-system.md) y [docs/localization.md](localization.md) pasan a documentar explícitamente capas, campos permitidos, anchors bloqueados, provenance y surfaces visibles alineadas con `ADR-0001`.

**Validación registrada:**
- `npm run test:unit -- --grep "systemCatalogQueryHardening|documentationService"` (`13 passing`, exit code 0)
- `npm run test:unit -- --grep "catalogConsistency|systemCatalog|documentationService"` (`31 passing`, exit code 0)
- `npm run test:docs:drift` (`passed`, exit code 0)

**Documentación alineada:**
- `docs/symbol-system.md`
- `docs/localization.md`
- `docs/architecture-implementation-map.md`
- `docs/architecture-status.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.220 SYMBOL-MODEL-01 — **Cerrado (symbols / canonical-model / semantic-facade / 2026-05)**

**Objetivo:** formalizar el contrato canónico mínimo de símbolo sobre surfaces ya existentes, sin crear un segundo store semántico ni reabrir la cadena runtime del catálogo.

**Resultado registrado:**
- [src/server/knowledge/resolution/resolvedSemanticModels.ts](../src/server/knowledge/resolution/resolvedSemanticModels.ts) publica `CanonicalSymbolModel` como base de `ResolvedSymbolModel`, incorporando `identityKey` exacta vía `buildSymbolKey(...)`, `normalizedName` y shape mínima reutilizable (`declarationScope`, `implementationKind`, `signature`, `returnType`, `parameterCount`, `fileObjectName`, `containerSignature`, `scope` y `datatype` cuando aplica);
- [src/server/features/semanticQueryFacade.ts](../src/server/features/semanticQueryFacade.ts) sigue actuando como fachada read-only y ahora expone ese contrato canónico desde `resolveTargetSymbol(...)` y `resolveCallable(...)` sin introducir stores ni resolución paralela;
- [src/server/presentation/definitionPresentation.ts](../src/server/presentation/definitionPresentation.ts) deja de construir un símbolo reducido manualmente y consume `toResolvedSymbolModel(...)`, manteniendo presentation alineada con el contrato canónico;
- [test/server/unit/semanticQueryFacade.test.ts](../test/server/unit/semanticQueryFacade.test.ts) fija `identityKey`, `normalizedName` y la shape mínima del símbolo publicado por la fachada;
- [docs/symbol-system.md](symbol-system.md), [docs/architecture-implementation-map.md](architecture-implementation-map.md) y [docs/architecture-status.md](architecture-status.md) dejan explícito que el contrato canónico ya está materializado server-side;
- [docs/ai-orchestrator.md](ai-orchestrator.md) y [docs/ai-agents-catalog.md](ai-agents-catalog.md) se restauran como compatibility entries mínimos porque el repo todavía mantiene referencias históricas y tests que los consumen durante la validación global.

**Validación registrada:**
- `npm run test:unit -- --grep "semanticQueryFacade"` (`5 passing`, exit code 0)
- `npm run test:docs:drift` (`passed`, exit code 0)
- `npm run test:architecture:rapid` (`smoke 3 passing`, `performance 7 passing`, gate passed, exit code 0)
- `npm run test:unit -- --grep "aiCustomizationGovernance|aiContextDocs"` (`6 passing`, exit code 0)
- `npm run test:unit` (`1201 passing`, exit code 0)

**Documentación alineada:**
- `docs/symbol-system.md`
- `docs/architecture-implementation-map.md`
- `docs/architecture-status.md`
- `docs/ai-orchestrator.md`
- `docs/ai-agents-catalog.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.219 SYMBOL-I18N-ENRICHMENT-AUDIT-01 — **Cerrado (symbols / i18n / localization / enrichment-audit / 2026-05)**

**Objetivo:** revalidar con evidencia de código y carriles reales la separación `identity -> generated -> manual -> localization -> presentation -> LSP payload` antes de abrir la cadena de enrichments del Bloque 2.

**Resultado registrado:**
- [docs/symbol-i18n-enrichment-audit-01-report.md](symbol-i18n-enrichment-audit-01-report.md) fija la evidencia revisada, el estado factual, los hallazgos y la matriz de validación de la auditoría específica;
- la auditoría confirma que `generated` sigue siendo la base reproducible, `manual-core` funciona como overlay curado gobernado, `documentationService` aplica localización presentation-only y `SystemCatalog` no crea símbolos duplicados por locale;
- el workflow de localización queda verificado en runtime con `overlayCount=3`, `targetKeyCount=3`, `reviewedCount=3`, `targetIdCount=0`, `orphanCount=0`, `incompleteOverlays=0`, `invalidParameterTargets=0`, `recoveredTargetIds=0` y `orphanOverlays=0`;
- el único gap P1 detectado durante la auditoría fue drift documental entre backlog/current-focus/roadmap, corregido dentro del mismo slice sin cambios de runtime;
- [docs/backlog.md](backlog.md), [docs/current-focus.md](current-focus.md) y [docs/roadmap.md](roadmap.md) vuelven a promover `SYMBOL-MODEL-01` como primer slice del Bloque 2 tras cerrar esta auditoría;
- la auditoría se cierra sin features nuevas ni cambios de identidad del catálogo; la cola derivada ya existente en backlog se considera suficiente para continuar.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogLocalization|catalogConsistency|documentationService|completion|hover|signatureHelp"` (`114 passing`, exit code 0)
- `npm run report:catalog-localization` (`locales: es`, `incompleteOverlays: 0`, `invalidParameterTargets: 0`, `recoveredTargetIds: 0`, `orphanOverlays: 0`, exit code 0)
- `npm run migrate:catalog-localization-target-ids` (`No hay targetIds recuperados por targetKey. No hace falta migracion.`, exit code 0)
- `npm run test:docs:drift` (`passed`, exit code 0)
- `npm run test:architecture:rapid` (`smoke 3 passing`, `performance 7 passing`, gate passed, exit code 0)
- `npm run test:performance:gate` (`4 passing`, budgets dentro de objetivo, exit code 0)

**Documentación alineada:**
- `docs/symbol-i18n-enrichment-audit-01-report.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.218 BLOQUE 13. Multi-Audit Final, Symbol System & Catalog Localization Roadmap — **Cerrado (multi-audit / symbols / catalog-localization / 2026-05)**

**Objetivo:** cerrar la macroauditoría final multi-surface, verificar el estado factual de legacy/deuda interna, documentar el sistema de símbolos y el workflow de localización del catálogo, y dejar backlog/focus/roadmap alineados sin abrir features nuevas.

**Resultado registrado:**
- [docs/symbol-system.md](symbol-system.md) queda como owner canónico del modelo conceptual de símbolo, sources, owners, consumers LSP, confidence/sourceOrigin, enrichments, i18n, DataWindow, semantic tokens y regression matrix;
- [docs/bloque13-multi-audit-report.md](bloque13-multi-audit-report.md) fija el snapshot factual de la auditoría final, sus 18 pasadas obligatorias, gaps derivados y el siguiente slice recomendado;
- [docs/localization.md](localization.md) incorpora el roadmap factual de cobertura `es` por dominio y la regla de progreso basada en overlays íntegros, anchors técnicos y métricas antes/después;
- [docs/testing.md](testing.md), [docs/performance-budget.md](performance-budget.md) y [docs/release.md](release.md) quedan alineados con el carril real de símbolos/localización, budgets de payload/cache y la lane adicional requerida cuando cambian overlays del catálogo;
- [docs/plugin-old-migration-opportunities.md](plugin-old-migration-opportunities.md), [docs/architecture.md](architecture.md), [docs/architecture-status.md](architecture-status.md), [docs/architecture-implementation-map.md](architecture-implementation-map.md) y [docs/ai-context/powerbuilder-plugin-context.md](ai-context/powerbuilder-plugin-context.md) quedan enlazados al owner nuevo y dejan explícito que `plugin_old` sigue siendo `Reference-only`;
- [docs/backlog.md](backlog.md) reemplaza el bloque macro por follow-ups derivados y priorizados, con `SYMBOL-MODEL-01` como primer slice recomendado; [docs/current-focus.md](current-focus.md) y [docs/roadmap.md](roadmap.md) promueven ese slice y sacan la auditoría final del foco activo;
- [docs/ai-orchestrator.md](ai-orchestrator.md) y [docs/ai-agents-catalog.md](ai-agents-catalog.md) se restauran como compatibility entries mínimos hacia [docs/ai-orchestration.md](ai-orchestration.md) para mantener verde la gobernanza AI sin duplicar ownership;
- el bloque se cierra sin cambios de runtime: el resultado es documental, de auditoría, de backlog y de validación sobre surfaces ya existentes.

**Validación registrada:**
- `npm run compile` (`tsc -b`, exit code 0)
- `npm run test:unit -- --grep "unit/(aiCustomizationGovernance|aiContextDocs)"` (`6 passing`, exit code 0)
- `npm run test:unit -- --grep "catalogLocalization|catalogConsistency"` (`9 passing`, exit code 0)
- `npm run report:catalog-localization` (`locales: es`, `incompleteOverlays: 0`, `invalidParameterTargets: 0`, `recoveredTargetIds: 0`, `orphanOverlays: 0`, exit code 0)
- `npm run migrate:catalog-localization-target-ids` (`No hay targetIds recuperados por targetKey. No hace falta migracion.`, exit code 0)
- `npm run test:docs:drift` (`passed`; `findings: []`, `currentFocusId: SYMBOL-MODEL-01`, `roadmapFocusId: SYMBOL-MODEL-01`, exit code 0)
- `npm run test:architecture:rapid` (`smoke 3 passing`, `performance 7 passing`, architecture rapid gate passed, exit code 0)
- `npm run test:performance:gate` (`4 passing`; budgets dentro de objetivo, exit code 0)
- `npm run test:unit` (`1201 passing`, exit code 0)
- `npm test` (`unit 1201 passing`, `integration 4 passing`, exit code 0)

**Documentación alineada:**
- `docs/symbol-system.md`
- `docs/bloque13-multi-audit-report.md`
- `docs/localization.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/release.md`
- `docs/plugin-old-migration-opportunities.md`
- `docs/architecture.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/ai-context/powerbuilder-plugin-context.md`
- `docs/ai-orchestrator.md`
- `docs/ai-agents-catalog.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.217 BLOQUE 12. Legacy Isolation, Technical Debt & Controlled Cleanup — **Cerrado (legacy-isolation / technical-debt / cleanup-policy / 2026-05)**

**Objetivo:** fijar una frontera explícita para `plugin_old`, registrar deuda técnica con estados claros y reforzar cleanup controlado sin retirar superficies útiles ni introducir dependencias legacy en runtime.

**Resultado registrado:**
- [docs/legacy-isolation.md](legacy-isolation.md) queda como owner canónico de la política `plugin_old` reference-only, usos permitidos/prohibidos, contrato de extracción, guardrail ejecutable y política de retirada;
- [docs/technical-debt-inventory.md](technical-debt-inventory.md) registra categorías, estados oficiales, owners, decisiones, validación esperada y cleanup receipts para deuda post-bloque;
- [.github/copilot-instructions.md](../.github/copilot-instructions.md) y [AGENTS.md](../AGENTS.md) quedan alineados en tratar `plugin_old` como evidencia reference-only y no como dependencia runtime;
- [test/server/unit/architectureImports.test.ts](../test/server/unit/architectureImports.test.ts) refuerza el guard `src/** -> plugin_old/**` para static imports, dynamic `import()` y CommonJS `require()`;
- [tools/docs-drift-audit.cjs](../tools/docs-drift-audit.cjs) valida prompts, agentes y skills versionados contra documentación AI; [test/server/unit/docsDriftAudit.test.ts](../test/server/unit/docsDriftAudit.test.ts) cubre el caso negativo;
- [docs/release.md](release.md) añade checklist pre-release de cleanup, TODO/deuda, VSIX contents y receipts;
- [README.md](../README.md), [docs/architecture-status.md](architecture-status.md), [docs/architecture-implementation-map.md](architecture-implementation-map.md), [docs/testing.md](testing.md), [docs/backlog.md](backlog.md), [docs/current-focus.md](current-focus.md) y [docs/roadmap.md](roadmap.md) quedan alineados con el cierre y la promoción de Bloque 13;
- no se eliminaron archivos legacy, prompts, agents, skills, fixtures ni scripts durante este bloque.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(docsDriftAudit|architectureImports)"` (`17 passing`, exit code 0)
- `npm run test:docs:drift` (`passed`; `findings: []`, `activeBacklogItems: 1`, `currentFocusId: BLOQUE-13`, `agentFiles: 7`, `skillFiles: 8`, exit code 0)
- `npm run test:architecture:rapid` (`smoke 3 passing`, `performance 7 passing`, architecture rapid gate passed, exit code 0)

**Documentación alineada:**
- `.github/copilot-instructions.md`
- `README.md`
- `docs/legacy-isolation.md`
- `docs/technical-debt-inventory.md`
- `docs/release.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.216 BLOQUE 11. Build, Release, VSIX, ORCA/PBAutoBuild & CI/CD Rails — **Cerrado (release / vsix / ci / external-build-rails / 2026-05)**

**Objetivo:** consolidar un carril profesional y reproducible de release/VSIX/CI junto con documentación y troubleshooting de PBAutoBuild/ORCA como rails externas opcionales, sin convertir herramientas PowerBuilder en dependencia del hot path LSP.

**Resultado registrado:**
- [package.json](../package.json) refuerza `release:verify` para ejecutar `npm test`, architecture rapid, docs drift, performance gate, catalog coverage, package VSIX, verify VSIX contents, installed smoke y summary final;
- [tools/release-readiness-summary.mjs](../tools/release-readiness-summary.mjs) publica versión, commit, artifact `.dist/vsc-powersyntax.vsix` y validaciones ejecutadas al final del carril;
- [.github/workflows/release-readiness.yml](../.github/workflows/release-readiness.yml) ejecuta el mismo lane bajo `xvfb-run -a` y sube `vsc-powersyntax-vsix` con `retention-days: 14` sin publicar Marketplace;
- [docs/release.md](release.md) queda como owner canónico para release readiness, VSIX, smoke instalada, CI artifact, versioning, changelog, Marketplace/pre-release y publish policy con `VSCE_PAT`/approval explícito;
- [docs/troubleshooting.md](troubleshooting.md) queda como owner de failure reasons para release, PBAutoBuild, ORCA, Workspace Trust, redacción de logs y support bundles;
- [test/server/unit/releaseReadinessContract.test.ts](../test/server/unit/releaseReadinessContract.test.ts) fija el nuevo lane, summary, workflow headless/retention y owners documentales; [test/server/unit/vsixPackageSurfaceContract.test.ts](../test/server/unit/vsixPackageSurfaceContract.test.ts) sigue cubriendo la allowlist productiva del VSIX;
- [README.md](../README.md), [docs/developer-workflows.md](developer-workflows.md), [docs/architecture-implementation-map.md](architecture-implementation-map.md), [docs/architecture-status.md](architecture-status.md) y [docs/testing.md](testing.md) quedan alineados con el owner release/troubleshooting.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(releaseReadinessContract|vsixPackageSurfaceContract|architectureImports|buildOrcaFailureClassification)"` (`21 passing`, exit code 0)
- `npm run test:docs:drift` (`passed`; `findings: []`)
- `npm run package:vsix` (`.dist/vsc-powersyntax.vsix`, `21 files`, `1.51 MB`, exit code 0)
- `npm run verify:vsix-contents` (`VSIX verificado correctamente con 19 entradas`, exit code 0)
- `npm run release:summary` (`version: 0.1.0`, `vsix: .dist/vsc-powersyntax.vsix`, exit code 0)
- `npm run test:smoke:installed-vsix` (exit code 0)
- `npm run release:verify` (`npm test`, architecture rapid, docs drift, performance gate, catalog coverage, VSIX package, VSIX verification, installed smoke y summary; `$LASTEXITCODE = 0`)

**Documentación alineada:**
- `README.md`
- `docs/release.md`
- `docs/troubleshooting.md`
- `docs/developer-workflows.md`
- `docs/architecture-implementation-map.md`
- `docs/architecture-status.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.215 BLOQUE 10. AI Tools, Agents, Prompts & Public Contracts — **Cerrado (ai-governance / public-contracts / prompts / 2026-05)**

**Objetivo:** ordenar las superficies AI del repositorio, fijar contratos públicos read-only, context bundles, prompts, agents, skills, política de tools/MCP, safe-edit y validación sin introducir write-enabled tools ni motores semánticos paralelos.

**Resultado registrado:**
- [docs/ai-orchestration.md](ai-orchestration.md) queda como owner canónico de customizations AI, instrucciones, prompts, agents, skills, contratos públicos read-only, context bundles, policy tools/MCP, safe-edit, checklist de validación, token budget y seguridad/data exposure;
- [docs/ai/README.md](ai/README.md), [docs/ai-orchestrator.md](ai-orchestrator.md), [docs/ai-agents-catalog.md](ai-agents-catalog.md) y [docs/ai-context/powerbuilder-plugin-context.md](ai-context/powerbuilder-plugin-context.md) apuntan al nuevo owner sin duplicar arquitectura ni backlog;
- [.github/prompts/audit-architecture-implementation-map.prompt.md](../.github/prompts/audit-architecture-implementation-map.prompt.md) reemplaza el prompt histórico sin extensión ejecutable, alineando la carpeta `.github/prompts` con el contrato `*.prompt.md`;
- [tools/docs-drift-audit.cjs](../tools/docs-drift-audit.cjs) ahora valida también prompt files con extensión inválida en `.github/prompts`, y [test/server/unit/docsDriftAudit.test.ts](../test/server/unit/docsDriftAudit.test.ts) fija el caso negativo;
- [test/server/unit/aiCustomizationGovernance.test.ts](../test/server/unit/aiCustomizationGovernance.test.ts) fija el mapa canónico, contratos read-only, context bundles, safe-edit, política MCP/tooling y condición de retiro de stubs de compatibilidad;
- [README.md](../README.md), [docs/testing.md](testing.md), [docs/architecture-status.md](architecture-status.md), [docs/architecture-implementation-map.md](architecture-implementation-map.md) y [docs/backlog.md](backlog.md) quedan alineados con el owner AI y el guard de prompts.

**Validación registrada:**
- `npm run compile` (`tsc -b`, exit code 0)
- `npm run test:unit -- --grep "unit/(aiContextDocs|aiCustomizationGovernance|aiTaskContextBundle|publicApi|docsDriftAudit)"` (`34 passing`, exit code 0)
- `npm run test:architecture:rapid` (`passed`; smoke `3 passing`, performance `7 passing`)
- `npm run test:docs:drift` (`passed`; `promptFiles: 16`, `findings: []`)
- `npm run test:performance:gate` (`4 passing`; `10` métricas `[perf-budget]` dentro de budget)

**Documentación alineada:**
- `README.md`
- `docs/ai-orchestration.md`
- `docs/ai/README.md`
- `docs/ai-orchestrator.md`
- `docs/ai-agents-catalog.md`
- `docs/ai-context/powerbuilder-plugin-context.md`
- `docs/architecture-implementation-map.md`
- `docs/architecture-status.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.214 BLOQUE 9. Testing, Performance Gates & Regression Safety — **Cerrado (testing / performance / regression-safety / 2026-05)**

**Objetivo:** convertir decisiones de arquitectura, hot path, payload, caché, performance y docs lifecycle en contratos ejecutables y en una matriz de lanes oficial para humanos/agentes.

**Resultado registrado:**
- [docs/testing.md](testing.md) incorpora la matriz canónica de lanes con comandos reales de [package.json](../package.json), coste esperado, riesgo cubierto y regla explícita para `test:real-corpora` como carril opt-in sin dependencia obligatoria de CI;
- [test/server/helpers/hotPathTestHarness.ts](../test/server/helpers/hotPathTestHarness.ts) centraliza `KnowledgeBase`, `InheritanceGraph`, `SystemCatalog`, `analysisCache` caliente y spies de IO/full parse; [interactiveHotPathGuards.test.ts](../test/server/unit/interactiveHotPathGuards.test.ts) consume ese harness para `hover`, `completion`, `signatureHelp`, `definition`, `documentSymbols` y `semanticTokens`;
- [test/server/unit/lspPayloadBudgetContracts.test.ts](../test/server/unit/lspPayloadBudgetContracts.test.ts) mide payloads representativos de `hover`, `completion`, `completion-resolve`, `signatureHelp`, `definition`, `references`, `documentSymbols` y `semanticTokens` contra [payloadBudget.ts](../src/server/serving/payloadBudget.ts);
- [test/server/unit/servingCache.test.ts](../test/server/unit/servingCache.test.ts) añade regresión para claves estructuradas que aíslan `sourceOrigin`, `locale` y `semanticEpoch`, manteniendo invalidación por URI sin colisión entre particiones;
- [test/server/performance/ci-budget-gate.perf.test.ts](../test/server/performance/ci-budget-gate.perf.test.ts) amplía `test:performance:gate` con métricas deterministas hot para `completion`, `signatureHelp`, `definition`, `documentSymbols` y `semanticTokens`, además de hover/diagnostics/batch existentes;
- [tools/run-architecture-hotspot-guard.mjs](../tools/run-architecture-hotspot-guard.mjs) cubre ahora `featureHandlers.ts`, `completion.ts`, `hover.ts`, `signatureHelp.ts`, `definition.ts`, `diagnostics.ts`, `dataWindowFastContext.ts` y `dataWindowServingAdapters.ts`, con budgets y sugerencias accionables;
- [tools/docs-drift-audit.cjs](../tools/docs-drift-audit.cjs) valida referencias a prompts `.prompt.md` existentes en backlog/current-focus/roadmap y [docsDriftAudit.test.ts](../test/server/unit/docsDriftAudit.test.ts) fija el caso negativo;
- [script/generate_official_function_catalog.cjs](../script/generate_official_function_catalog.cjs) vuelve a existir como wrapper de compatibilidad hacia el generador canónico plural, desbloqueando el carril unitario sin mover el source-of-truth real.

**Validación registrada:**
- `npm run build:test`
- `npx vscode-test --label unit --grep "catalogGeneratorScript|testingMatrixDocs|lspPayloadBudgetContracts|docsDriftAudit|interactiveHotPathGuards|architectureImports|ServingCache"` (`69 passing`)
- `npm run test:unit` (`1192 passing`, exit code 0)
- `npm test` (`unit 1192 passing`, `integration 4 passing`, exit code 0)
- `npm run test:architecture:metrics` (`passed`; `17` hotspots, `0` failing)
- `npm run test:architecture:rapid` (`passed`; smoke `3 passing`, performance `7 passing`)
- `npm run test:performance:gate` (`4 passing`; `10` métricas `[perf-budget]` dentro de budget)
- `npm run test:docs:drift` (`passed`, `findings: []`)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture-implementation-map.md`
- `docs/architecture-status.md`
- `docs/developer-workflows.md`
- `docs/performance-budget.md`
- `docs/testing.md`
- `docs/done-log.md`

## 1.213 BLOQUE 8. Architectural Modularization, Boundaries & Composition Roots — **Cerrado (architecture / boundaries / composition-roots / 2026-05)**

**Objetivo:** reforzar boundaries client/server/shared, reducir crecimiento de composition roots y convertir reglas arquitectónicas críticas en fitness functions ejecutables sin hacer un big-bang refactor.

**Resultado registrado:**
- [src/server/handlers/featureHandlerRegistration.ts](../src/server/handlers/featureHandlerRegistration.ts) concentra el registro LSP primario/auxiliar de features y deja [src/server/server.ts](../src/server/server.ts) como wiring de bootstrap más claro;
- [src/server/handlers/commandHandlerRegistration.ts](../src/server/handlers/commandHandlerRegistration.ts) centraliza el pipeline `workspace/executeCommand` hacia build, report y runtime handlers manteniendo el orden estable;
- [test/server/unit/architectureImports.test.ts](../test/server/unit/architectureImports.test.ts) amplía guards para `shared` puro, aislamiento productivo de `plugin_old`, frontera DataWindow/parsing, presentation purity y budgets de hotspots con schema enriquecido;
- [tools/run-architecture-hotspot-guard.mjs](../tools/run-architecture-hotspot-guard.mjs) añade `growthPolicy` y sugerencias accionables por root/slice; [artifacts/performance/architecture-hotspot-guard.json](../artifacts/performance/architecture-hotspot-guard.json) queda como evidencia serializada;
- `server.ts` baja de `966` a `885` líneas en el gate, con handler registration como destino modular inicial; `extension.ts` sigue vigilado como composition root cliente con lazy controllers y `commandRegistration.ts` como wiring declarativo;
- `src/shared/**` queda protegido como capa de contratos puros, permitiendo sólo imports LSP type-only cuando son parte del contrato serializable;
- `src/**` no puede importar `plugin_old/**` como dependencia runtime; la política de retirada legacy queda para el bloque/deuda correspondiente, no para producto activo.

**Validación registrada:**
- `npm run build:test`
- `npx vscode-test --label unit --grep "architectureImports|lspCapabilitiesContract|featureHandlers|runtimeCommandHandlers|buildCommandHandlers|reportCommandHandlers"` (`13 passing`)
- `npm run test:architecture:metrics` (`passed`; `server.ts = 885/1100`, warnings no bloqueantes preexistentes)
- `npm test` (`unit 1186 passing`, `integration 4 passing`, exit code 0)
- `npm run test:architecture:rapid` (`passed`; smoke `3 passing`, performance `7 passing`)
- `npm run test:performance:gate` (`4 passing`; todos los budgets ok)
- `npm run test:docs:drift` (`passed`, `findings: []` tras el cierre documental)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture.md`
- `docs/architecture-implementation-map.md`
- `docs/architecture-status.md`
- `docs/testing.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`

## 1.212 BLOQUE 7. Presentation, ViewModels & UX Contracts — **Cerrado (presentation / viewmodels / UX contracts / 2026-05)**

**Objetivo:** separar la resolución semántica de la presentación visible LSP/AI mediante ViewModels y formatters puros, sin duplicar semántica ni inflar payloads de hot path.

**Resultado registrado:**
- [src/server/presentation/viewModels.ts](../src/server/presentation/viewModels.ts) define contratos de presentación compactos para completion initial/resolve, definition, diagnostics, semantic tokens y AI context, con payload policy común y sin stores semánticos runtime;
- [src/server/presentation/completionPresentation.ts](../src/server/presentation/completionPresentation.ts), [definitionPresentation.ts](../src/server/presentation/definitionPresentation.ts), [diagnosticPresentation.ts](../src/server/presentation/diagnosticPresentation.ts), [semanticTokenPresentation.ts](../src/server/presentation/semanticTokenPresentation.ts) y [aiContextPresentation.ts](../src/server/presentation/aiContextPresentation.ts) materializan formatters/read models feature-specific sobre datos ya resueltos;
- [src/server/features/completion.ts](../src/server/features/completion.ts), [definition.ts](../src/server/features/definition.ts), [diagnostics.ts](../src/server/features/diagnostics.ts) y [semanticTokens.ts](../src/server/features/semanticTokens.ts) delegan la adaptación final a la capa `presentation` sin reabrir resolvers, parser, catálogo ni DataWindowFastContext;
- `completionItem/resolve` conserva lista inicial ligera y aplica overlay localizado en presentación sin cambiar identidad de símbolo, dominio ni lookup keys;
- `DiagnosticMessageViewModel` conserva code, severity, reason codes y confidence antes de publicar DTOs LSP; `SemanticTokensViewModel` ordena/deduplica antes de `SemanticTokensBuilder`; `DefinitionViewModel` mantiene respuesta `null|Location|Location[]` sin internals;
- [test/server/unit/architectureImports.test.ts](../test/server/unit/architectureImports.test.ts) añade guard para que `src/server/presentation` no importe IO, workspace discovery, parser ni stores semánticos runtime.

**Validación registrada:**
- `npm run build:test`
- `npx vscode-test --label unit --grep "presentationContracts|architectureImports|completion|diagnostics|semanticTokens|definition|hoverFormat|signatureHelp|interactiveHotPathGuards"` (`175 passing`)
- `npm run test:unit` (`1183 passing`)
- `npm run test:architecture:metrics` (`passed`; hotspots dentro de budgets, warnings no bloqueantes preexistentes)
- `npm run test:architecture:rapid` (`passed`; smoke `3 passing`, performance `7 passing`)
- `npm run test:performance:gate` (`4 passing`; todos los budgets ok)
- `npm run test:docs:drift` (`passed`, `findings: []` tras el cierre documental)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture-implementation-map.md`
- `docs/architecture-status.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/done-log.md`

## 1.211 BLOQUE 6. DataWindow Fast Mode & Boundary Hardening — **Cerrado (datawindow / hot-path / boundary / 2026-05)**

**Objetivo:** consolidar una ruta rápida, segura y mantenible para DataWindow/DataStore/DataWindowChild en hot path interactivo, sin tratar `.srd` como PowerScript genérico, sin crear parser nuevo y sin duplicar binding logic entre providers.

**Resultado registrado:**
- [src/server/analysis/documentAnalysis.ts](../src/server/analysis/documentAnalysis.ts) blinda la frontera `.srd` como dominio DataWindow y conserva stub navegable sin entrar por el parser PowerScript genérico;
- [src/server/features/dataWindowFastContext.ts](../src/server/features/dataWindowFastContext.ts) publica `DataWindowFastContext` read-only, high-confidence y versionado por URI, document version, `semanticEpoch`, `sourceOrigin`, receiver, binding y DataObject;
- [src/server/features/dataWindowServingAdapters.ts](../src/server/features/dataWindowServingAdapters.ts) centraliza adapters DataWindow para hover, completion, definition y signatureHelp sobre el fast context, incluyendo `GetItem*`/`SetItem*` con columna literal y buffers seguros;
- [src/server/features/dataWindowPropertyPaths.ts](../src/server/features/dataWindowPropertyPaths.ts) expone el lookup reutilizable de property paths seguras para evitar hardcodes duplicados;
- `dataWindowBindingModel.ts`, `dataWindowColumnAccess.ts`, `dataWindowPropertyPaths.ts`, `SystemCatalog` y `DataWindowModel` quedan documentados como owners de binding, columnas, properties, buffers oficiales y modelo canónico;
- la policy `Describe/Modify`/strings dinámicos degrada a `unknown`/low confidence y no expone columnas si el DataObject no es defendible.

**Validación registrada:**
- `npm run build:test`
- `npx vscode-test --label unit --grep "dataWindowFastContext|documentAnalysis|interactiveHotPathGuards|completion|hover|definition|signatureHelp"` (`155 passing`)
- `npm run test:unit` (`1176 passing`)
- `npm run test:architecture:metrics` (`passed`; hotspots dentro de budgets, warnings no bloqueantes preexistentes)
- `npm run test:architecture:rapid` (`passed`; smoke `3 passing`, performance `7 passing`)
- `npm run test:performance:gate` (`4 passing`; todos los budgets ok)
- `npm run test:docs:drift` (`passed`, `findings: []` antes del cierre documental)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture-implementation-map.md`
- `docs/architecture-status.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/done-log.md`

## 1.210 BLOQUE 5. Semantic Query Foundation & Resolver Ownership — **Cerrado (semantic-query / resolver-ownership / facade / 2026-05)**

**Objetivo:** consolidar owners semánticos claros para contexto posicional, symbol resolution, receiver type, callables, inheritance, enum context y modelos de resultado sin reescribir `KnowledgeBase`, parser, catálogo, indexer ni graph.

**Resultado registrado:**
- [src/server/features/semanticQueryFacade.ts](../src/server/features/semanticQueryFacade.ts) publica `SemanticQueryFacade` como fachada read-only sobre `queryContext`, `semanticQueryService`, `InheritanceGraph`, `SystemCatalog`, `enumeratedContext` y `dataWindowBindingModel`;
- [src/server/knowledge/resolution/resolvedSemanticModels.ts](../src/server/knowledge/resolution/resolvedSemanticModels.ts) define modelos neutrales server-side para `ResolvedSymbol`, `ResolvedReceiver`, `ResolvedCallable` y `ResolvedEnumContext`, con confidence/reason/sourceOrigin sin Markdown ni DTO LSP;
- [src/server/features/hover.ts](../src/server/features/hover.ts) y [src/server/features/definition.ts](../src/server/features/definition.ts) empezaron a consumir la fachada sin cambios visibles de comportamiento;
- `semanticQueryFacade.test.ts` fija target symbol, receiver type, callable, inheritance, enum context, catálogo owner-aware y ausencia de IO/full parse sobre contexto publicado;
- `queryContext.ts`, `semanticQueryService.ts`, `InheritanceGraph.ts`, `enumeratedContext.ts`/`SystemCatalog` y `dataWindowBindingModel.ts` quedan documentados como owners explícitos, sin crear DataWindowFastContext ni otro store semántico.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticQueryFacade.test.js out/test/server/unit/interactiveHotPathGuards.test.js out/test/server/unit/queryContext.test.js out/test/server/unit/semanticQueryService.test.js out/test/server/unit/definition.test.js out/test/server/unit/hover.test.js` (`92 passing`)
- `npm run test:unit` (`1171 passing`)
- `npm run test:architecture:metrics` (`passed`; hotspots dentro de budgets, warnings no bloqueantes preexistentes)
- `npm run test:architecture:rapid` (`passed`; PFC Workspace, PFC Solution y STD_FC_OrderEntry presentes)
- `npm run test:performance:gate` (`4 passing`; `legacy-public-active-hover = 6.75ms / 50.00ms`, `legacy-public-active-diagnostics = 5.57ms / 100.00ms`)
- `npm run test:docs:drift` (`passed` antes del cierre documental)
- `npm test` (`unit 1171 passing`, `integration 4 passing`, exit code 0)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture-implementation-map.md`
- `docs/architecture-status.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/done-log.md`

## 1.209 BLOQUE 4. SignatureHelp, Definition, Symbols & Semantic Tokens Alignment — **Cerrado (lsp / serving / symbols / semantic-tokens / 2026-05)**

**Objetivo:** alinear SignatureHelp, Definition, References/Rename, DocumentSymbols, SemanticTokens y CodeLens con los contratos modernos de serving/hot path, evitando payloads no medidos, capabilities implícitas y widening accidental.

**Resultado registrado:**
- [src/server/features/signatureHelp.ts](../src/server/features/signatureHelp.ts) materializa `SignatureHelpViewModel` ligero y mantiene la resolución semántica en los owners existentes;
- [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts) alinea Definition con `ActiveDocumentServingSnapshot`, key estructurada y `InteractiveServingStaleGuard` antes de publicar o cachear misses;
- `references`/`rename` quedan defendidos por source pool acotado, no-widening a workspace, exclusión `orca-staging/generated` según policy y caps declarativos;
- `documentSymbols` mantiene decisión explícita de no cache final mientras snapshot caliente sea suficiente; `semanticTokens` mantiene respuesta `full` sin delta/cache final hasta que haya presión medida;
- CodeLens conserva `codeLensProvider.resolveProvider = false` con `CodeLensResultCache` especializado, y el contrato de capabilities queda cubierto por prueba dedicada;
- el guard de hot path cubre `hover`, `completion`, `signatureHelp`, `definition`, `documentSymbols` y `semanticTokens` sin IO, workspace scan ni full parse cuando el snapshot está caliente.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/queryScopePolicy.test.js out/test/server/unit/interactiveHotPathGuards.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/definition.test.js out/test/server/unit/referenceSourcePool.test.js out/test/server/unit/references.test.js out/test/server/unit/rename.test.js out/test/server/unit/documentSymbols.test.js out/test/server/unit/semanticTokens.test.js out/test/server/unit/codeLensResultCache.test.js out/test/server/unit/codeLensReferences.test.js` (`89 passing`)
- `npx mocha --ui tdd out/test/server/unit/lspCapabilitiesContract.test.js out/test/server/unit/queryScopePolicy.test.js` (`5 passing`)
- `npm run test:unit` (`1166 passing`)
- `npm run test:architecture:rapid` (`passed`; PFC Workspace, PFC Solution y STD_FC_OrderEntry presentes)
- `npm run test:performance:gate` (`4 passing`; `legacy-public-active-hover = 8.23ms / 50.00ms`, `legacy-public-active-diagnostics = 4.72ms / 100.00ms`)
- `npm run test:docs:drift` (`passed` antes del cierre documental)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture-implementation-map.md`
- `docs/architecture-status.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/done-log.md`

## 1.208 BLOQUE 3. Completion Ultra-Fast & Modern LSP Resolve — **Cerrado (completion / lsp-resolve / performance / 2026-05)**

**Objetivo:** convertir completion en una ruta inicial ligera, estable y observable, con documentación/detalle diferidos por `completionItem/resolve` y protección de ranking, dedupe, payload y stale safety.

**Resultado registrado:**
- [src/server/features/completion.ts](../src/server/features/completion.ts) emite items iniciales ligeros con `CompletionItem.data` mínimo y grupos de ranking centralizados en `COMPLETION_RANK_SORT_PREFIX`;
- [src/server/handlers/lifecycleHandlers.ts](../src/server/handlers/lifecycleHandlers.ts) anuncia `completionProvider.resolveProvider = true` y [src/server/handlers/featureHandlers.ts](../src/server/handlers/featureHandlers.ts) registra `connection.onCompletionResolve(...)` dentro de `InteractiveServingPipeline`;
- `completion-resolve` queda separado en métricas, stale guard, cache key estructurada y payload budget `4 KiB`, devolviendo el item original cuando el dato está stale o no es propio;
- la cobertura de completion fija lista inicial ligera, localización diferida, ranking local/argumento/instancia/built-in, boundaries comentario/string/receiver desconocido, dedupe, DataWindow/DataStore, enum values y payload inicial bajo budget;
- el cierre usa la partición explícita existente de `ServingCache` para completion y deja `CompletionListViewModel` standalone como opción futura solo si aparece presión medible.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/completion.test.js out/test/server/unit/interactiveServingPipeline.test.js`
- `npm run test:architecture:rapid`
- `npm run test:performance:gate`
- `npm run test:docs:drift`
- `npm run test:unit` (`1163 passing`)
- `npm test` (`smoke + unit + integration`, exit code 0; unit `1163 passing`, integration `4 passing`)

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture-implementation-map.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/done-log.md`

## 1.207 HOVER-AUDIT-01. Auditoría final end-to-end de hover — **Cerrada (audit / hover / matrix / 2026-05)**

**Objetivo:** cerrar la auditoría transversal del carril interactivo y demostrar que hover, definition, completion, signatureHelp, diagnostics y surfaces relacionadas quedan alineadas y dentro de presupuesto.

**Resultado registrado:**
- la matriz final del carril quedó fijada con `hoverFormat`, `hover`, `definition`, `completion`, `signatureHelp`, `diagnostics`, `diagnosticsExtra`, `documentSymbols`, `workspaceSymbols`, `references` y `crossSurfaceGoldenMatrix`, sin reabrir payload debug ni claims semánticos ya corregidos;
- `test/server/unit/crossSurfaceGoldenMatrix.test.ts` sigue congelando la surface visible resumida del fixture compartido y ahora convive con guards explícitos del cierre devtools LSP sobre descendants custom y hot path del hover;
- el gate `npm run test:performance:gate` quedó verde al cierre del carril, por lo que la auditoría ya no depende de evidencia manual ni de una explicación parcial de runtime.

**Validación registrada:**
- `npx mocha --ui tdd out/test/server/unit/hoverFormat.test.js out/test/server/unit/hover.test.js out/test/server/unit/definition.test.js out/test/server/unit/completion.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/diagnosticsExtra.test.js out/test/server/unit/documentSymbols.test.js out/test/server/unit/workspaceSymbols.test.js out/test/server/unit/references.test.js out/test/server/unit/crossSurfaceGoldenMatrix.test.js`
- `npm run test:performance:gate`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/architecture-status.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/done-log.md`

## 1.206 HOVER-02. Optimizar hover para cache/hot path y evitar fallback global innecesario — **Cerrada (performance / hover / hot-path / 2026-05)**

**Objetivo:** dejar hover dentro de presupuesto real y sin warnings de `workspace fallback` cuando la resolución ya está cerrada por contexto activo, caché caliente o owner chain del catálogo.

**Resultado registrado:**
- `test/server/unit/hover.test.ts` fija que el documento activo resuelto por `member-hierarchy` ya no proyecta `workspace fallback`, y que los built-ins del catálogo sobre descendants custom de DataWindow tampoco degradan a fallback global innecesario;
- el gate `test:performance:gate` quedó verde con `legacy-public-active-hover = 5.00ms / 50.00ms`, manteniendo el carril hover dentro de presupuesto ejecutable CI/local;
- no fue necesario abrir otra rama de resolución: el hardening quedó absorbido por guards de comportamiento y evidencia de performance sobre la ruta real ya materializada.

**Validación registrada:**
- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/hover.test.js`
- `npm run test:performance:gate`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/architecture-status.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/done-log.md`

## 1.205 DW-01. Resolver funciones nativas DataWindow en descendants custom — **Cerrada (semantic / datawindow / inheritance / 2026-05)**

**Objetivo:** completar el soporte semántico de funciones nativas DataWindow cuando el receiver es un tipo custom que hereda transitivamente de `datawindow`.

**Resultado registrado:**
- `src/server/features/definition.ts` ya resuelve `GetColumnName()` y miembros nativos equivalentes sobre descendants custom de DataWindow hacia la documentación oficial del catálogo usando el mismo owner chain jerárquico ya aplicado en hover/completion/signatureHelp/diagnostics;
- `src/server/handlers/featureHandlers.ts` propaga `systemCatalog` al carril de definition sin abrir scans adicionales ni una segunda ruta de resolución;
- `test/server/unit/definition.test.ts`, `references.test.ts`, `documentSymbols.test.ts` y `workspaceSymbols.test.ts` fijan la validación explícita del cierre sobre descendants custom, incluyendo navegación oficial de definition y surfaces auxiliares sin regresión.

**Validación registrada:**
- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/definition.test.js out/test/server/unit/references.test.js out/test/server/unit/documentSymbols.test.js out/test/server/unit/workspaceSymbols.test.js`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/architecture-status.md`
- `docs/testing.md`
- `docs/done-log.md`

## 1.204 HOVER-01. Hover compacto por tipo de símbolo — **Cerrada (hover UX / compact payload / 2026-05)**

**Objetivo:** dejar el hover normal compacto, útil y silencioso, ocultando metadata interna salvo warnings reales o surfaces explain/debug aparte.

**Resultado registrado:**
- `src/server/features/hoverFormat.ts` reduce el payload normal a tipo/firma/contexto útil/warnings reales, oculta `Origen/Autoridad/Fase/Confianza/Motivo/Candidatos` y sanea la presentación de scopes locales;
- `src/server/features/hover.ts` deja de proyectar provenance interna del catálogo del sistema en el hover visible por defecto;
- `test/server/unit/hoverFormat.test.ts` y `hover.test.ts` fijan el contrato compacto, el warning útil de fallback/ambigüedad y la ausencia de metadata interna en el payload servido.

**Validación registrada:**
- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/hoverFormat.test.js out/test/server/unit/hover.test.js`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture-status.md`
- `docs/done-log.md`
- `docs/testing.md`
- `docs/performance-budget.md`

## 1.203 DIAG-01. SD11 no marca cierres estructurales — **Cerrada (diagnostics / false positive removal / 2026-05)**

**Objetivo:** eliminar falsos positivos de `SD11` sobre cierres estructurales tras `return` sin dejar de marcar instrucciones ejecutivas reales inalcanzables.

**Resultado registrado:**
- `src/server/features/diagnosticsExtra.ts` ya resetea la heurística en `END IF`, `END CHOOSE` y `END TRY`, además de aperturas y transiciones estructurales ya soportadas;
- `test/server/unit/diagnosticsExtra.test.ts` fija el caso positivo de línea ejecutiva tras `return` y el caso negativo sobre cierres estructurales;
- el carril visible deja de introducir ruido en Problems/hover para este falso positivo concreto.

**Validación registrada:**
- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/documentAnalysis.test.js out/test/server/unit/diagnosticsExtra.test.js --grep "sanitiza|SD11"`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture-status.md`
- `docs/done-log.md`
- `docs/testing.md`

## 1.202 CALLABLE-01. Separar cabecera callable e instrucción inicial tras `;` — **Cerrada (parser / callable signature hygiene / 2026-05)**

**Objetivo:** separar la cabecera callable del primer statement ejecutable cuando ambos comparten línea, evitando contaminar hover y scope metadata.

**Resultado registrado:**
- `src/server/analysis/documentAnalysis.ts` sanea la firma callable antes del primer `;` tanto para facts como para `containerSignature` de parámetros/locales;
- `test/server/unit/documentAnalysis.test.ts` fija que `event pfc_values; call super::...` conserva `event pfc_values` como firma canónica y no arrastra la sentencia ejecutable al metadata local;
- el hover compacto y cualquier consumer que reutilice `containerSignature` recibe ya el identificador correcto del callable.

**Validación registrada:**
- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/documentAnalysis.test.js out/test/server/unit/diagnosticsExtra.test.js --grep "sanitiza|SD11"`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/architecture-status.md`
- `docs/done-log.md`
- `docs/testing.md`

## 1.201 BL-07. Guards LSP con markers reales minimalistas — **Cerrada (lsp-guard / realistic markers / 2026-05)**

**Objetivo:** sustituir los fixtures sintéticos usados por la smoke de guards LSP por markers PowerBuilder plausibles y minimalistas, manteniendo el mismo borde de no-serving semántico.

**Resultado registrado:**
- `test/fixtures/lsp-guards/guard.pbw`, `guard.pbt`, `guard.pbproj`, `guard.pbsln` y `guard.pbl` dejan de contener PowerScript disfrazado y pasan a usar shapes mínimos plausibles para workspace/target/project/solution/library;
- `test/server/unit/topology.test.ts` valida que esos mismos fixtures son consumibles por `parseTopology()` para workspace, target, project y solution, mientras `.pbl` sigue sin parseo topológico como fuente servible;
- `test/smoke/lsp-guards.extension.test.ts` sigue demostrando que, incluso forzando un lenguaje servido por el cliente, los markers y `.pbl` no reciben `Document Symbols` ni diagnostics, de modo que discovery/topología y borde LSP permanecen alineados.

**Validación registrada:**
- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/topology.test.js`
- `npm run test:smoke -- --grep "lsp-guards"`
- `npm run test:docs:drift`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `docs/testing.md`
- `specs/434-bl-07-lsp-guards-realistic-markers/spec.md`

## 1.200 BL-06. Gate de evidencia para conditional compilation — **Cerrada (parser-governance / evidence gate / 2026-05)**

**Objetivo:** mantener una policy explícita de no-soporte productivo para conditional compilation mientras no exista corpus activo defendible, dejando un detector read-only y tests sentinel reutilizables.

**Resultado registrado:**
- `src/server/parsing/conditionalCompilationGate.ts` añade detección pura de `#IF/#ELSEIF/#ELSE/#END IF/#define` y variantes con `$`, apoyada en `stripCommentsSmart()` para ignorar histórico comentado sin tocar parser, semántica ni serving;
- `test/server/unit/conditionalCompilationGate.test.ts` fija el caso positivo de marcadores activos y el caso negativo de comentarios/strings históricos, mientras `test/server/unit/powerbuilderParserResilienceFuzz.test.ts` refuerza que el histórico real de corpus no se promueve a sintaxis activa;
- `docs/testing.md` y la guía técnica de PowerBuilder dejan explícito que esto es un gate de evidencia y no una promesa de soporte productivo de conditional compilation; backlog, current-focus y roadmap sólo deben reflejarlo si vuelve a abrirse trabajo accionable o foco explícito.

**Validación registrada:**
- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/conditionalCompilationGate.test.js out/test/server/unit/powerbuilderParserResilienceFuzz.test.js`
- `npm run test:docs:drift`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `specs/433-bl-06-conditional-compilation-evidence-gate/spec.md`

## 1.199 BL-05. Extender safe model de DataWindow — **Cerrada (datawindow / literal column access / 2026-05)**

**Objetivo:** ampliar el safe model DataWindow para cubrir edición/lectura de columnas literales y variantes con `DWBuffer` sin simular runtime ni abrir un motor paralelo.

**Resultado registrado:**
- `src/server/features/dataWindowColumnAccess.ts` añade un resolver literal-only para `GetItem*`, `SetItem*` y `SetItemStatus`, reutilizando `dataWindowBindingModel` y `dataWindowModel` para navegar a `table-column` cuando el `DataObject` resuelve de forma literal y única;
- `src/server/features/definition.ts` y `src/server/features/hover.ts` consumen ese rail nuevo sin tocar el query engine general, de modo que definition/hover navegan columnas DataWindow en APIs de edición/lectura y conservan degradación nula en roots dinámicos;
- `test/server/unit/definition.test.ts` y `test/server/unit/hover.test.ts` fijan el caso positivo con `DWBuffer` y el caso negativo con `DataObject` dinámico, mientras `docs/testing.md`, backlog, roadmap y current-focus quedan alineados con la promoción a `BL-06`.

**Validación registrada:**
- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/definition.test.js out/test/server/unit/hover.test.js`
- `npm run test:docs:drift`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `docs/testing.md`
- `specs/432-bl-05-datawindow-column-safe-access/spec.md`

## 1.198 BL-04. Profundizar superficie native, external, RPCFUNC y PBNI — **Cerrada (native-external / rpcfunc distinction / 2026-05)**

**Objetivo:** reforzar el tratamiento de external functions, DLL/PBX, `RPCFUNC` y stored procedures sin prometer implementación PowerScript interna.

**Resultado registrado:**
- el parser distingue `LIBRARY` y `RPCFUNC` dentro del mismo rail seguro de callables sin implementación interna;
- hover, diagnostics y el `powerBuilderTechnicalDebtReport` proyectan `RPCFUNC` como stored procedure DBMS sin degradarlo a `unknown`, mientras PBX sigue siendo la evidencia visible del impacto PBNI/runtime;
- rename y references bloquean/degradan `RPCFUNC` igual que las dependencias nativas externas, manteniendo la degradación segura y evitando navegación ficticia.

**Validación registrada:**
- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/externalFunctions.test.js out/test/server/unit/rename.test.js out/test/server/unit/references.test.js out/test/server/unit/hoverFormat.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js`
- `npm run test:docs:drift`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `docs/testing.md`
- `specs/431-bl-04-native-external-rpcfunc-surface/spec.md`

## 1.197 GOV-01. Gate de prioridad y readiness antes de abrir nuevo código — **Cerrada (governance / priority gate / 2026-05)**

**Objetivo:** impedir que el repositorio vuelva a abrir trabajo disperso sin respetar la cadena de cierre inmediato, el bloque derivado de auditoría y la secuencia posterior de planificación.

**Resultado registrado:**
- la cadena inmediata `VSIX-01 → AUDIT-VSIX → DOC-01 → DOC-02 → AUDIT-DOC` y el bloque derivado `BL-01 → BL-02 → BL-03 → BL-08` ya quedaron cerrados con evidencia y fuera del backlog activo;
- la secuencia posterior `SYM-01 → LOC-01 → CAT-01 → GOV-01` quedó absorbida con specs, done-log y `docs-drift` en verde, sin colisión entre IDs `BL-*` heredados y planes `SYM/LOC/CAT/GOV`;
- la regla de promoción queda fijada: no abrir código nuevo fuera de backlog/roadmap/current-focus/specs, y la continuidad canónica pasa a `BL-04 → BL-05 → BL-06 → BL-07`.

**Validación registrada:**
- `npm run test:docs:drift`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `specs/424-bl-08-priority-chain-and-readiness-gate/spec.md`

## 1.196 CAT-01. Plan de catálogo, ownership y source-of-truth siguiente — **Cerrada (planning / catalog ownership / 2026-05)**

**Objetivo:** ordenar la siguiente ola P1 del catálogo sin reabrir ADR-0001 ni ensanchar el hot path interactivo.

**Resultado registrado:**
- el siguiente slice P1 queda acotado a ownership e identidad de dominios excepción, reforzando `generated-primary-with-manual-overlays` y manteniendo el foco en los únicos dominios `manual-primary` permitidos y en colisiones de identidad capaces de degradar consistency/adoption;
- quedan fijados los no-go: no reabrir la decisión de source-of-truth, no mezclar catálogo con localización y no ensanchar query/serving interactivo mientras el baseline runtime siga cubierto por `catalogV2`, `catalogConsistency`, `catalogAdoptionDecision` y `systemCatalogQueryHardening`;
- la validación focal futura queda definida sobre consistency, adoption, provenance, identity y reporting antes de tocar generator o runtime.

**Validación registrada:**
- `npm run test:docs:drift`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `docs/testing.md`
- `specs/423-bl-03-catalog-follow-up-plan/spec.md`

## 1.195 LOC-01. Plan de localización documental del catálogo y consumers — **Cerrada (planning / localization rail / 2026-05)**

**Objetivo:** ordenar el siguiente slice P1 de localización documental y authoring sin duplicar identidad semántica ni abrir overlays paralelos.

**Resultado registrado:**
- el siguiente slice P1 queda priorizado en authoring incremental guiado por `report:catalog-localization`, reforzando el rail español actual y reconciliando `targetId`/`targetKey` cuando el audit detecte drift recuperable;
- quedan fijados los no-go: no traducir anchors técnicos ni identidad semántica, no duplicar entries por idioma y no abrir cambios de runtime mientras `documentationService`, `documentationLocale` y `catalogLocalization` sigan cubriendo el rail visible;
- la validación focal futura queda definida sobre audit, locale consumers y migración offline, evitando abrir un rail paralelo de localización.

**Validación registrada:**
- `npm run test:docs:drift`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `docs/localization.md`
- `docs/testing.md`
- `specs/422-bl-02-localization-follow-up-plan/spec.md`

## 1.194 SYM-01. Plan de mejora de symbols, references y rename — **Cerrada (planning / symbols follow-up / 2026-05)**

**Objetivo:** dejar priorizado el siguiente slice P1 de symbols/references/rename tras estabilizar el tramo VSIX/docs y el bloque derivado de auditoría.

**Resultado registrado:**
- el primer slice elegido queda acotado a coherencia project-scoped de `workspaceSymbols`, `references`, `rename` y `crossProjectSymbolConflicts` en mixed roots, apoyándose en `referenceSourcePool` y en los fences de `sourceOrigin` ya existentes;
- los no-go explícitos quedan fijados: no widening a `workspace` sin routing, no rename sobre `orca-staging/generated` y no edición cuando la evidencia siga en `dynamic|fallback|external|source-origin-conflict`;
- la validación focal futura queda definida antes de tocar runtime interactivo, evitando abrir varias sublíneas de symbols a la vez.

**Validación registrada:**
- `npm run test:docs:drift`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `docs/testing.md`
- `specs/421-bl-01-symbols-follow-up-plan/spec.md`

## 1.193 BL-08. Corregir deriva documental ORCA/PBAutoBuild — **Cerrada (docs build / ownership gate / 2026-05)**

**Objetivo:** cerrar la deriva documental residual del carril ORCA/PBAutoBuild declarando un documento propietario suficiente y retirando la necesidad de rutas especializadas inexistentes.

**Resultado registrado:**
- `docs/build/README.md` declara ya de forma explícita que es el documento propietario actual del carril build/release/ORCA/PBAutoBuild mientras no exista contenido especializado que justifique otra partición;
- no quedan referencias activas a documentos especializados inexistentes del carril build, y arquitectura/estado arquitectónico siguen apuntando a superficies reales;
- el gate documental derivado queda absorbido con `docs-drift` verde y libera la promoción de la secuencia posterior `SYM-01 → LOC-01 → CAT-01 → GOV-01`.

**Validación registrada:**
- `npm run test:docs:drift`

**Documentación alineada:**
- `docs/build/README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `specs/430-bl-08-orca-pbautobuild-doc-drift/spec.md`

## 1.192 BL-03. Ampliar modelo de SQL embebido y dynamic SQL — **Cerrada (semantic SQL / embedded statements / 2026-05)**

**Objetivo:** ampliar el modelo seguro de SQL embebido para cubrir más statements oficiales sin fingir semántica cuando no exista evidencia.

**Resultado registrado:**
- `findSqlRegions()` detecta ahora de forma conservadora `CONNECT`, `DECLARE`, `FETCH`, `OPEN`, `CLOSE`, `PREPARE`, `COMMIT` y `ROLLBACK` además del subset previo, manteniendo el cierre por `;` y evitando falsos positivos sobre llamadas normales con paréntesis;
- `ApiEmbeddedSqlAnchor` publica ese conjunto ampliado de keywords sin abrir un parser SQL general ni prometer resolución profunda de SQL dinámico complejo;
- `currentObjectContext` proyecta los nuevos anchors reales de SQL embebido y sigue ignorando llamadas normales como `open(w_child)`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/sqlRegions.test.js out/test/server/unit/currentObjectContext.test.js --grep "SQL|embedded SQL|sqlRegions"`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `specs/429-bl-03-embedded-dynamic-sql-coverage/spec.md`

## 1.191 BL-02. Alinear corpus público documentado con estado real — **Cerrada (corpus validation / public slots alignment / 2026-05)**

**Objetivo:** alinear la documentación del corpus público con lo realmente materializado localmente, evitando claims sobre fixtures ausentes y dejando trazado qué slots siguen siendo opcionales.

**Resultado registrado:**
- `publicCorpusPaths.ts` declara explícitamente el conjunto materializado del checkout base y deja `legacy-pbl-dump` como único slot público obligatorio hoy;
- `test/corpora/README.md` separa slots públicos materializados de slots opcionales no materializados por defecto, en vez de presentarlos todos como si ya existieran localmente;
- `publicCorpusDocumentation.test.ts` impide que el README vuelva a promocionar como materializados slots públicos que sigan ausentes en `fixtures-local/public/`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/publicCorpusDocumentation.test.js`

**Documentación alineada:**
- `test/corpora/README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `specs/428-bl-02-public-corpus-alignment/spec.md`

## 1.190 BL-01. Normalizar taxonomía de archivos y artifacts PowerBuilder — **Cerrada (ecosystem discovery / artifact taxonomy / 2026-05)**

**Objetivo:** ampliar y normalizar la taxonomía de artefactos PowerBuilder reconocidos explícitamente por el producto, incluyendo `pbg`, `pbr` y `psr`, sin servirlos como PowerScript ni romper el hot path.

**Resultado registrado:**
- `powerbuilderFiles.ts` clasifica ahora `pbg` como build/support, `pbr` como resource y `psr` como report, manteniéndolos fuera del carril source/semantic/marker;
- `discovery.ts` registra estos artefactos como categorías explícitas del workspace (`artifact-pbg-file`, `artifact-pbr-file`, `artifact-psr-file`) sin parsearlos como PowerScript ni afectar el scheduling cooperativo;
- los tests focales confirman tanto la clasificación no servible como la aparición de estos artefactos en `WorkspaceState.getDiscoveryArtifactSummary()`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/powerbuilderFiles.test.js out/test/server/unit/workspace.test.js`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `specs/427-bl-01-powerbuilder-artifact-taxonomy/spec.md`

## 1.189 AUDIT-DOC. Cierre post-auditoría de deriva documental canónica — **Cerrada (audit closure / docs drift / 2026-05)**

**Objetivo:** cerrar con evidencia la deriva documental detectada tras el barrido read-only, sin volver a dejar backlog, foco o roadmap desacoplados.

**Resultado registrado:**
- la deriva detectada en backlog/current-focus/roadmap y referencias de build quedó absorbida por la cadena `DOC-01` y `DOC-02` sin reabrir ítems cerrados ni dejar placeholders en los artefactos canónicos;
- `docs-drift-audit.cjs` permaneció verde con todos los cierres inmediatos ya movidos a `docs/done-log.md`, confirmando que el relevo hacia el backlog derivado puede hacerse sin pérdida de coherencia;
- la auditoría documental queda cerrada y deja `BL-01` como siguiente foco vivo en la continuidad pedida por el usuario.

**Validación registrada:**
- `npm run test:docs:drift`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `specs/425-audit-doc-post-audit-documentation-closure/spec.md`

## 1.188 DOC-02. Mapa documental canónico de build, packaging, VSIX, PBAutoBuild y ORCA — **Cerrada (docs alignment / build-release map / 2026-05)**

**Objetivo:** consolidar una entrada documental única del carril build/release y retirar referencias rotas hacia documentación inexistente.

**Resultado registrado:**
- `docs/build/README.md` actúa ya como documento propietario del carril build/release/VSIX/PBAutoBuild/ORCA y concentra qué superficie existe, dónde vive y qué comandos la validan;
- `docs/architecture.md` y `docs/architecture-status.md` dejaron de apuntar a documentos rotos y ahora referencian superficies reales como `docs/build/README.md`, `docs/localization.md`, `docs/ai-orchestrator.md` y `docs/ai-agents-catalog.md`;
- se decide no abrir todavía un documento especializado vacío de ORCA/PBAutoBuild mientras el mapa actual siga siendo suficiente y verificable.

**Validación registrada:**
- `npm run test:docs:drift`

**Documentación alineada:**
- `docs/build/README.md`
- `docs/architecture.md`
- `docs/architecture-status.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `specs/420-doc-02-build-doc-map-and-broken-references/spec.md`

## 1.187 DOC-01. Realineación canónica de backlog, foco y continuidad — **Cerrada (docs alignment / canonical continuity / 2026-05)**

**Objetivo:** reanclar backlog, current-focus y roadmap a una misma cadena activa canónica usando los IDs pedidos por el usuario y manteniendo verde la auditoría documental.

**Resultado registrado:**
- `tools/docs-drift-audit.cjs` y `docsDriftAudit.test.ts` aceptan IDs canónicos no `B###`, evitando falsos errores cuando la continuidad activa usa IDs como `VSIX-01`, `DOC-01` o `BL-01`;
- `docs/backlog.md`, `docs/current-focus.md` y `docs/roadmap.md` quedaron alineados sobre una misma continuidad viva y pudieron promover el foco siguiente sin dejar placeholders ni focos agotados;
- los guards documentales quedaron verdes con `findings: 0`, permitiendo mover el trabajo activo a `DOC-02` sin deriva entre artefactos canónicos.

**Validación registrada:**
- `npx mocha --ui tdd out/test/server/unit/docsDriftAudit.test.js out/test/server/unit/docsLifecycleGuard.test.js`
- `npm run test:docs:drift`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `specs/419-doc-01-canonical-doc-realignment/spec.md`

## 1.186 AUDIT-VSIX. Cierre post-fix del fallo real del VSIX instalado — **Cerrada (audit closure / installed-vsix evidence / 2026-05)**

**Objetivo:** cerrar con trazabilidad completa la auditoría del fallo real del VSIX instalado sin degradar el lane release.

**Resultado registrado:**
- la causa raíz queda trazada a la doble titularidad de `powerbuilder.inspectHierarchy`: comando UI del cliente registrado por la extensión y anunciado también por el servidor en `executeCommandProvider.commands`, lo que disparaba `startFailed` en el VSIX instalado;
- el guard `commandOwnership` ya verifica IDs expandidos duplicados y el no solapamiento cliente/servidor, y ahora además puede ejecutarse directamente con `npx mocha --ui tdd ...` en Node puro sin depender del módulo `vscode`;
- la lane release del VSIX instalado permaneció verde tras repetir packaging, verificación de contenidos, listado de superficie y smoke instalada.

**Validación registrada:**
- `npx mocha --ui tdd out/test/server/unit/commandOwnership.test.js`
- `npm run package:vsix`
- `npm run verify:vsix-contents`
- `npm run package:vsix:list`
- `npm run test:smoke:installed-vsix`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`
- `specs/418-vsix-01-installed-vsix-hardening/spec.md`
- `specs/426-audit-vsix-post-fix-evidence-closure/spec.md`

## 1.185 VSIX-01. Hardening del VSIX instalado y del arranque real del runtime — **Cerrada (regression hardening / installed-vsix startup / 2026-05)**

**Objetivo:** cerrar canónicamente la regresión real del VSIX instalado, conservando la separación cliente/servidor de comandos y la verificación del arranque real del runtime empaquetado.

**Resultado registrado:**
- `SERVER_EXECUTE_COMMANDS` dejó de anunciar comandos UI del cliente como `powerbuilder.inspectHierarchy`, evitando que el cliente LSP del VSIX instalado vuelva a registrar IDs ya existentes durante `ExecuteCommandFeature.initialize`;
- la smoke instalada quedó endurecida para fallar si reaparecen `readiness=error`, `startFailed`, `already exists` o `couldn't create connection`, manteniendo el arranque real del runtime empaquetado como contrato de cierre;
- el guard unitario de ownership confirma tanto la deduplicación de IDs expandidos como el aislamiento entre comandos cliente y `executeCommandProvider` del servidor.

**Validación registrada:**
- `npx mocha --ui tdd out/test/server/unit/commandOwnership.test.js`
- `npm run package:vsix`
- `npm run verify:vsix-contents`
- `npm run package:vsix:list`
- `npm run test:smoke:installed-vsix`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/build/README.md`
- `docs/done-log.md`
- `specs/418-vsix-01-installed-vsix-hardening/spec.md`

## 1.184 AUDIT-04-DERIVED-007 — Pasar `HotContextCache` a `resolveQualifierType` — **Cerrada (no-action validated / hot-path reuse / 2026-05)**

**Objetivo:** evitar lecturas redundantes de entidades activas en `resolveQualifierType` cuando el `HotContextCache` ya dispone del contexto del documento activo.

**Resultado registrado:**
- `resolveQualifierType` ya consumía `getDocumentEntities(currentUri, kb, hotContext)` en vez de leer `kb.getEntitiesByUri(currentUri)` directamente, reutilizando así el helper compartido y el cache activo cuando existe;
- la suite focal ya interceptaba `kb.getEntitiesByUri()` para el documento activo y confirmaba que `resolveQualifierType` no debe reler entidades activas si `HotContextCache` está disponible;
- el ítem pendiente era drift documental y no un hot path vivo sin corregir.

**Validación registrada:**
- `npx mocha --ui tdd out/test/server/unit/semanticQueryService.test.js --grep "resolveQualifierType reutiliza activeEntities del HotContextCache para el documento activo"`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.183 AUDIT-04-DERIVED-006 — Instrumentar `budgetMs` con observabilidad en `queryTrace` — **Cerrada (no-action validated / performance observability / 2026-05)**

**Objetivo:** hacer observable `budgetMs` por consumer, emitiendo `budget:exceeded` cuando la resolución semántica supere el budget declarado.

**Resultado registrado:**
- `semanticQueryService` ya añadía el trace step `budget:exceeded` cuando `lastTrace.durationMs` superaba `options.budgetMs`, incluyendo `budgetMs`, `durationMs` y `exceededByMs` en el detalle;
- `queryTrace` ya soportaba `appendLastTraceStep()` con recalculo de fases, acciones y `lastStepName`, por lo que la infraestructura post-trace del backlog estaba implementada y cubierta;
- el ítem pendiente era drift documental: el código y los tests ya cumplían el contrato sin requerir cambios de producto.

**Validación registrada:**
- `npx mocha --ui tdd out/test/server/unit/queryTrace.test.js out/test/server/unit/semanticQueryService.test.js --grep "appendLastTraceStep agrega pasos post-trace y recalcula metadatos|resolveTargetEntityDetailed anota budget:exceeded cuando supera el budget declarado"`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/performance-budget.md`

## 1.182 AUDIT-04-DERIVED-005 — Enforce `sourceOrigin` policy por consumer semántico — **Cerrada (contract enforcement / semantic query / 2026-05)**

**Objetivo:** aplicar la policy declarada en `queryScopePolicy` al winner path real de cada consumer, para que `staging/generated/external` no se resuelvan igual en consumers write-risk e informativos.

**Resultado registrado:**
- `semanticQueryService` acepta ya una policy explícita de `allowStaging/allowGenerated/allowExternal` y la aplica sobre winners, candidate pool y evidence, en vez de dejar el enforcement limitado a `referenceSourcePool`;
- `queryContext`, `rename`, `hover`, `references`, `signatureHelp`, `currentObjectContext`, `impactAnalysis` y `diagnostics` empujan ahora la misma policy declarada por consumer hasta el resolver compartido, evitando winners incompatibles entre surfaces;
- `rename` bloquea targets que solo existen en `orca-staging`, mientras los consumers informativos que sí admiten `external` conservan ese carril y `safeEditPlan` sigue estable al heredar el mismo engine vía `impactAnalysis`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticQueryService.test.js out/test/server/unit/rename.test.js --grep "bloquea candidatos orca-staging cuando el consumer no los admite|conserva dependencias externas solo para consumers que las admiten|rename bloquea targets que solo existen en orca-staging|rename no arrastra edits de orca-staging cuando la familia canónica resuelta es la real"`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/hover.test.js`
- `npx mocha --ui tdd out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/safeBatchRefactorPlan.test.js`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.181 AUDIT-04-DERIVED-004 — Revisar/corregir `Parent` qualifier resolution — **Cerrada (no-action validated / semantic correctness / 2026-05)**

**Objetivo:** asegurar que `Parent.variable` sólo resuelva cuando exista evidencia de contenedor visual real y degrade honestamente fuera de ese contexto.

**Resultado registrado:**
- `documentAnalysis` confirma que un tipo anidado recibe `containerName` desde `type ... within ...`, es decir, desde evidencia sintáctica de nesting visual y no desde un owner lógico arbitrario de tipos raíz;
- `semanticQueryService` ya resuelve `parent.call()` sobre nested types con `within` y degrada a unresolved/dynamic cuando el type actual no tiene ese contexto;
- `definition` revalida el mismo contrato desde el consumer navegable, por lo que el backlog mantenía un drift documental y no un bug vivo en la implementación actual.

**Validación registrada:**
- `npx mocha --ui tdd out/test/server/unit/semanticQueryService.test.js out/test/server/unit/definition.test.js --grep "resolveTargetEntityDetailed resuelve parent.call\(\) desde un type nested|resolveTargetEntityDetailed degrada parent.call\(\) cuando no hay type nested con within|provideDefinition resuelve parent.call\(\) usando el owner real del type nested|provideDefinition no resuelve parent.call\(\) en un root type sin within"`
- `npx mocha --ui tdd out/test/server/unit/documentAnalysis.test.js`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.180 AUDIT-04-DERIVED-003 — Optimizar `InheritanceGraph.getMemberClosure` — **Cerrada (performance hardening / 2026-05)**

**Objetivo:** eliminar el escaneo O(N) sobre todo el workspace en `getMemberClosure` y `getDirectDescendants` sin abrir stores paralelos inconsistentes ni romper los consumers interactivos.

**Resultado registrado:**
- `KnowledgeBase` mantiene ahora un índice por baseType inmediato además del índice por contenedor, reutilizable por `InheritanceGraph` con invalidación natural por `semanticEpoch`;
- `InheritanceGraph.getDirectDescendants()` deja de recorrer `getAllEntities()` y consume el índice por baseType, mientras `getMemberClosure()` conserva el acceso O(1) por contenedor ya exigido por el budget test;
- `inheritanceGraph`, `currentObjectContext` y el performance gate de CI quedan en verde, confirmando que el hardening no rompe consumers ni budgets interactivos.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/knowledgeBase.test.js out/test/server/unit/inheritanceGraph.descendants.test.js out/test/server/unit/hotPathAllocationBudget.test.js`
- `npx mocha --ui tdd out/test/server/unit/inheritanceGraph.test.js out/test/server/unit/currentObjectContext.test.js`
- `npm run test:performance:gate`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.179 AUDIT-04-DERIVED-002 — Consolidar `getDocumentEntities` duplicado — **Cerrada (no-action validated / semantic query hardening / 2026-05)**

**Objetivo:** eliminar la duplicación de `getDocumentEntities` entre `semanticQueryService.ts` y `queryContext.ts` sin perder `queryTrace`, `HotContextCache` ni comportamiento estable en consumers.

**Resultado registrado:**
- el cierre confirma que `queryContext.ts` ya reutilizaba la implementación única de `getDocumentEntities` exportada por `semanticQueryService.ts`, por lo que el trabajo pendiente estaba en el drift documental y no en una duplicación viva del código;
- durante la validación se corrigió un bug adyacente en `semanticQueryService.ts` para la resolución unqualified sin aridad explícita, aplicando `hardenCallableCandidates()` antes del rankeo y restaurando la preferencia implementation > prototype esperada por la suite B281;
- `queryContext`, `semanticQueryService`, `definition` y `hover` quedan revalidados en conjunto, preservando trace, cache activa y resultados de resolución observables por los consumers principales.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticQueryService.test.js --grep "B281 prefiere implementation frente a prototype de la misma firma"`
- `npx mocha --ui tdd out/test/server/unit/queryContext.test.js out/test/server/unit/semanticQueryService.test.js out/test/server/unit/definition.test.js out/test/server/unit/hover.test.js`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.178 AUDIT-04-DERIVED-010 — PBPROJ library routing and cross-PBL ancestor resolution — **Cerrada (workspace model / semantic correctness / 2026-05)**

**Objetivo:** corregir la carga de `.pbproj`, el routing de librerías declaradas en `<Libraries>`, la indexación de carpetas `.pbl` exportadas y la resolución cross-PBL de ancestors/base types sin dejar falsos negativos semánticos persistentes en documentos abiertos.

**Resultado registrado:**
- `workspace.test` valida que `discoverWorkspace()` hidrata `.pbproj`, mapea `<Libraries>` con espacios y enruta archivos `SR*` al proyecto declarado, dejando estable el trayecto temprano `.pbproj -> topology -> discovery -> project routing`;
- `currentObjectContext.test` y `dependencyGraph.test` revalidan que la selección cross-PBL del ancestro/base type respeta `project routing + library order` en escenarios `pbproj` multi-PBL con duplicados;
- `openDocumentDiagnostics.ts`, `lifecycleHandlers.ts`, `server.ts` y `watchedFileIntake.ts` republican diagnósticos de documentos abiertos tras indexación inicial o reindexación por watcher, eliminando el caso en que SD3 quedaba obsoleto aunque el ancestro ya estuviera indexado en KB.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/workspace.test.js out/test/server/unit/dependencyGraph.test.js out/test/server/unit/openDocumentDiagnostics.test.js out/test/server/unit/watchedFileIntake.test.js --grep "discovery hidrata pbproj con Libraries|prioriza el baseType según project routing y library order cuando hay duplicados cross-PBL|republica diagnósticos abiertos tras indexar un ancestro y limpia un SD3 obsoleto|solicita refresh de diagnósticos para documentos abiertos invalidados por un ancestro reindexado"`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js --grep "prioriza el ancestro según project routing y library order en pbproj multi-PBL"`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.177 AUDIT-01 — Installed VSIX, activation and runtime startup hardening — **Cerrada (packaging / activation / installed VSIX 2026-05)**

**Objetivo:** validar que el plugin instalado desde VSIX real activa correctamente, arranca el Language Server, registra comandos y no falla por rutas, packaging o wiring de API pública.

**Resultado registrado:**
- `src/client/extension.ts` conserva ahora la causa real del último fallo de arranque del cliente LSP y deja exportada la API pública incluso si el startup degrada, evitando que `ext.activate()` colapse a `undefined` y permitiendo diagnóstico accionable desde el carril instalado;
- el lane productivo sigue arrancando desde `./dist/client/extension.js` con `dist/server/server.js`, y el artefacto recién empaquetado mantiene la surface mínima esperada (`package.json`, runtime dist, syntaxes, icons, readme/license/changelog) sin depender de `out/` ni de runtime suelto;
- el smoke instalado vuelve a pasar contra `./.dist/vsc-powersyntax.vsix`, revalidando activación, API pública, comandos registrados, defaults de settings y handshake mínimo con el runtime real del VSIX.

**Validación registrada:**
- `npm run build:test`
- `npm run package:vsix`
- `npm run verify:vsix-contents`
- `npm run test:smoke:installed-vsix`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.176 AUDIT-08 — Documentation, backlog and AI readiness drift audit — **Cerrada (docs alignment / AI readiness 2026-05)**

**Objetivo:** detectar y corregir drift entre backlog, done-log, current-focus, roadmap, docs técnicas y entrypoints de documentación/IA.

**Resultado registrado:**
- `docs/backlog.md`, `docs/done-log.md` y `docs/current-focus.md` vuelven a converger con el estado real del repo, retirando trabajo claramente cerrado y dejando visible el backlog realmente vivo;
- `README.md` expone ya como entrypoint público las guías canónicas de `spec-driven-development`, workflows y readiness IA (`ai-orchestrator`, `ai-agents-catalog`, context pack corto), cerrando el gap de descubribilidad documental restante;
- `npm run test:docs:drift` queda en verde y no se detectan findings adicionales de deriva material en los artefactos canónicos auditados.

**Validación registrada:**
- `npm run test:docs:drift`

**Documentación alineada:**
- `README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.175 AUDIT-03 — Hot paths, activation and performance budget audit — **Cerrada (performance / hot-path budgets 2026-05)**

**Objetivo:** detectar operaciones caras o no acotadas en activation, indexing, hover, completion, signatureHelp, diagnostics, semanticTokens, workspace-check, object-check, reports y resolvers DataWindow.

**Resultado registrado:**
- `npm run test:architecture:metrics` quedó en verde y dejó de señalar `src/client/commandRegistration.ts` como hotspot tras extraer `statusMenuActions.ts` del menú de estado;
- `npm run test:architecture:rapid` validó el carril rápido sobre PFC/OrderEntry sin regresiones funcionales en las surfaces críticas ya auditadas;
- `npm run test:performance:gate` mantuvo en verde los budgets interactivos y batch del runtime sin introducir full scans nuevos en hot paths de este corte.

**Validación registrada:**
- `npm run test:architecture:metrics`
- `npm run test:architecture:rapid`
- `npm run test:performance:gate`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/done-log.md`

## 1.174 AUDIT-07 — Reports and analyzers quality/noise audit — **Cerrada (hardening / reports redaction / 2026-05)**

**Objetivo:** validar que analyzers/reportes recientes aporten señal útil con reason codes, confidence y redaction defendible, sin ruido ni payloads inseguros.

**Resultado registrado:**
- `powerBuilderTechnicalDebtReport.ts` endurece la redacción de `modern-integration` para endpoints `host:puerto` sin esquema, manteniendo la evidencia `integration-endpoint:*` útil sin filtrar host, path ni query reales;
- la matriz corta `powerBuilderCodeMetrics` + `powerBuilderTechnicalDebtReport` revalida lifecycle, dependencias nativas (`dll/pbx/unknown`), HTTP/REST/JSON, WebBrowser/WebView2 y riesgo DataWindow sin abrir un segundo rail de scoring;
- no se detectó otro hallazgo práctico en el slice auditado, por lo que el cierre combina un fix puntual con no-action validado para el resto del audit.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/powerBuilderTechnicalDebtReport.test.js`
- `npx mocha --ui tdd out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/testing.md`

## 1.173 AUDIT-05 — DataWindow reliability and sublanguage boundary audit — **Cerrada (no-action validated / DataWindow boundary 2026-05)**

**Objetivo:** validar que DataWindow siga siendo un sublenguaje propio, con bindings, property paths, `Describe/Modify`, SQL lineage, DDDW, child DataWindows y reports degradando honestamente sin mezclarse con PowerScript normal.

**Resultado registrado:**
- no se detectó hueco práctico nuevo: el slice canónico ya cubre parsing read-only de `.srd`, `Describe/Modify/Object/GetChild`, report children, `dddw.name`, safe modes y SQL lineage sin reparsear DataWindow como PowerScript;
- `hover`, `definition`, `completion` y `diagnostics` mantienen degradación honesta cuando el binding `DataObject` o el child target no son deterministas;
- la guía técnica canónica y la matriz focal de tests coinciden con el contrato esperado del audit, por lo que el cierre queda como no-action validado y no como implementación adicional.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/dataWindowModel.test.js out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/dataWindowSafeMode.test.js out/test/server/unit/dataWindowLegacySafeMode.test.js out/test/server/unit/hover.test.js out/test/server/unit/definition.test.js out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js --grep "DataWindow|GetChild|Describe|Modify|dddw|report|unit/dataWindow"`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.172 AUDIT-04 — PowerBuilder semantic core correctness audit — **Cerrada (hardening / semantics / PowerBuilder core 2026-05)**

**Objetivo:** validar que el core semántico modela correctamente símbolos PowerBuilder reales: objetos, funciones, eventos, scopes, prototypes, implementations, inheritance, overrides, dynamic calls, external functions, sourceOrigin, queryTrace y consumers.

**Resultado registrado:**
- Alineación total con el orden de resolución oficial de Appeon: `Local/Argumento (0) → Compartida (1) → Global (2) → Instancia (3)`.
- Implementado soporte para el operador de forzado global `::` y los cualificadores explícitos `This.` y `Parent.`.
- Reforzada la resolución semántica con filtrado de `access rights` (`public`, `protected`, `private`) en todos los niveles (qualified y unqualified) usando el modelo de visibilidad existente.
- Unificada la tabla `VARIABLE_SCOPE_PRIORITY` en un módulo canónico `src/server/knowledge/scopePriority.ts` compartido por `semanticQueryService` e `InheritanceGraph`.
- Sincronizada la lógica de autocompletado para respetar la prioridad de scopes mediante `sortText` (`0_local`, `1_shared`, `2_global`, `3_instance`) e inclusión de variables globales del KB.
- Resolución de `Parent.` alineada con el owner lógico (`containerName`), cubriendo casos de controles en ventanas.
- `invocationRiskModel.test.ts` cubre ya la taxonomía de riesgo defendible consumida por `impactAnalysis`, `dependencyGraph` y `safeEditPlan`, y `queryTrace.ts` rechaza callbacks async para evitar interleaving silencioso en trazas globales.

**Validación registrada:**
- `npm run test:unit -- --grep "scope|variable|shadow|global|instance|shared|local|parent|This"`
- Suite completa de tests unitarios passing (102 tests).
- Verificación de desambiguación mediante tests negativos de shadowing.

**Documentación alineada:**
- `docs/architecture.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/backlog.md`
- `docs/done-log.md`
- `docs/current-focus.md`

## 1.171 AUDIT-06 — Catalog generated/manual/localization governance audit — **Cerrada (hardening / catalog governance 2026-05)**

**Objetivo:** validar cumplimiento de `ADR-0001`, sin reabrir la decisión `generated-primary-with-manual-overlays`.

**Resultado registrado:**
- `generated` sigue siendo la fuente oficial reproducible y `manual` aporta gaps, enrichments, overrides y candidates sin desestabilizar la precedencia.
- `localization` opera estrictamente como un overlay documental (con fallbacks a inglés) y previene exitosamente la sobreescritura o traducción de identificadores o signatures del runtime.
- `workspaceCheckCatalogSummary.ts` endurece `B335` cruzando el conjunto resuelto del hot path con el registro bruto del catálogo, de modo que una fuga sintética de `candidate` ya falla el gate aunque `applyCatalogMergePolicy` siga filtrando candidates en runtime.
- `tools/verify-catalog-coverage.cjs` añade el verificador determinista `npm run verify:catalog-coverage` y `package.json` lo encadena dentro de `release:verify` para cortar drift de `officialCoverage` en CI.
- `scripts/generate_catalog_consistency_report.cjs` imprime ya en consola `manualPrimaryDomains`, `officialCoverageDriftDomains` y `candidateHotPathViolations`, manteniendo visible la provisionalidad `manual-primary` sin abrir otro rail.
- el reporte de consistencia sigue en verde: sin conflictos estructurales, duplicidades inválidas, signatures vacías, drift de coverage ni candidate leakage real.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/workspaceCheckCatalogSummary.test.js out/test/server/unit/releaseReadinessContract.test.js`
- `npm run verify:catalog-coverage`
- `npm run report:catalog-consistency`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/rules-catalog.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.170 AUDIT-02 — Public API, AI tools and command consistency audit — **Cerrada (hardening / public API / AI tooling 2026-05)**

**Objetivo:** comprobar y corregir la coherencia entre API pública, read-only tool bridge, comandos UI, schemas, command registration, mappings para IA, documentación, duplicidades y posibles fusiones/refactorizaciones internas.

**Resultado registrado:**
- mapeo funcional alineado entre `publicApi.ts`, `commandRegistration.ts` y comandos de UI;
- detectado y documentado comando huérfano `powerbuilder.checkObject` como `AUDIT-02-DERIVED-001` (completado) eliminando la redundancia;
- consolidado el namespace canónico `powerbuilder.*` en contribuciones/UI/tests manteniendo aliases legacy `vscPowerSyntax.*` solo donde seguían siendo necesarios por compatibilidad;
- documentados los findings de refactorización en `docs/backlog.md` para evitar debt arquitectónico futuro;
- validación de test suite completa confirmando la solidez del bridge sin regresiones.

**Validación registrada:**
- `npm run build:test`
- `npm test`

**Documentación alineada:**
- `docs/developer-workflows.md`
- `docs/architecture.md`
- `docs/ai-orchestrator.md`
- `docs/ai-agents-catalog.md`
- `docs/backlog.md`
- `docs/done-log.md`

## 1.169 B335. Catalog ADR-0001 compliance dashboard and consistency gate — **Cerrada (catalog governance 2026-05)**

**Objetivo:** publicar un dashboard/gate reproducible que valide el cumplimiento de `ADR-0001` sobre el catálogo real, sin reabrir la decisión `generated-primary-with-manual-overlays` ni mover el audit al hot path interactivo.

**Resultado registrado:**
- `src/server/features/workspaceCheckCatalogSummary.ts` reconsume `buildCatalogConsistencyReport()` y la merge policy real del query layer para publicar `adrCompliance` con policy recomendada, dominios `manual-primary`, coverage drift, `candidateHotPathViolations` y drift de localización documental;
- `src/client/workspaceCheckReport.ts` eleva ese estado a findings/status/Markdown del `workspace-check`, de modo que el gate ADR-0001 puede fallar el summary sin abrir otro rail de catálogo ni reimplementar el source-of-truth;
- `scripts/generate_catalog_consistency_report.cjs`, `package.json` y `artifacts/catalog/catalogConsistencyReport.generated.{json,md}` dejan un reporte determinista ejecutable por `npm run report:catalog-consistency`, mientras `workspaceCheckCatalogSummary.test.ts`, `workspaceCheckReport.test.ts`, `catalogConsistency.test.ts`, `catalogAdoptionDecision.test.ts`, `catalogProvenanceAudit.test.ts` y `systemCatalogQueryHardening.test.ts` fijan el cierre del slice.

**Validación registrada:**
- `npm run compile`
- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/catalogConsistency.test.js out/test/server/unit/catalogAdoptionDecision.test.js out/test/server/unit/catalogProvenanceAudit.test.js out/test/server/unit/systemCatalogQueryHardening.test.js out/test/server/unit/workspaceCheckCatalogSummary.test.js out/test/server/unit/workspaceCheckReport.test.js out/test/server/unit/publicApi.test.js`
- `npm run report:catalog-consistency`
- `npm run test:docs:drift`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/rules-catalog.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.168 B286. Workspace symbols vs framework knowledge pack conflict policy — **Cerrada (knowledge pack governance 2026-05)**

**Objetivo:** definir cómo conviven los símbolos reales del workspace con framework knowledge packs curados sin reabrir la política generated/manual del system catalog ni alterar el winner real del query engine.

**Resultado registrado:**
- `src/server/knowledge/system/frameworkKnowledgePackPolicy.ts` centraliza la policy ligera basada en owner types curados + `sourceOrigin`, donde el source real del workspace gana y los knowledge packs degradan a contexto advisory;
- `src/shared/publicApi.ts`, `src/server/features/workspaceSymbols.ts`, `src/server/features/currentObjectContext.ts`, `src/server/features/impactAnalysis.ts` y `src/server/features/safeEditPlan.ts` publican `frameworkKnowledgeConflict` en las surfaces read-only que ya conocían el símbolo ganador, sin abrir otro motor ni tocar la selección real del winner;
- `src/client/objectCheckReport.ts` y `src/client/currentObjectContextPanelModel.ts` hacen visible esa policy en object check/panel, mientras `test/server/unit/frameworkKnowledgePacks.test.ts`, `workspaceSymbols.test.ts`, `currentObjectContext.test.ts`, `impactAnalysis.test.ts`, `safeEditPlan.test.ts`, `objectCheckReport.test.ts`, `currentObjectContextPanelModel.test.ts` y `publicApi.test.ts` fijan el cierre del slice.

**Validación registrada:**
- `npx tsc -p tsconfig.test.json`
- `npx mocha --ui tdd out/test/server/unit/frameworkKnowledgePacks.test.js out/test/server/unit/workspaceSymbols.test.js out/test/server/unit/currentObjectContext.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/currentObjectContextPanelModel.test.js out/test/server/unit/objectCheckReport.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:docs:drift`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/developer-workflows.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.167 B284. Semantic query explain plan — **Cerrada (query diagnostics 2026-05)**

**Objetivo:** exportar un explain plan legible de una resolución semántica real, con fases, candidatos, descartes, winner, `confidence`, `sourceOrigin` y coste aproximado sin abrir otro motor de resolución.

**Resultado registrado:**
- `src/server/features/explainSemanticQuery.ts` compone el report read-only directamente sobre `queryContext`, `ResolvedTargetInfo` y `queryTrace`, exponiendo phases/candidates/discards/winner/`sourceOrigin` y coste aproximado sobre la resolución real;
- `src/shared/publicApi.ts`, `src/server/handlers/reportCommandHandlers.ts`, `src/server/handlers/lifecycleHandlers.ts` y `src/client/extension.ts` publican `explainSemanticQuery()` como comando/API/tool estable (`powerbuilder.explainSemanticQuery`, `explain-semantic-query`) con fallback por editor activo;
- `src/client/explainSemanticQueryReport.ts`, `src/client/commandRegistration.ts`, `package.json`, `test/fixtures/basic/semantic_query_sample.sru` y `test/smoke/extension.test.ts` añaden la salida Markdown `PowerSyntax: Explain Semantic Query at Cursor` y la validación end-to-end del wiring real.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(explainSemanticQuery|publicApi)"`
- `npm run test:smoke -- --grep "explain semantic query"`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/developer-workflows.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.166 B340. ORCA/PBAutoBuild tooling vocabulary catalog — **Cerrada (tooling catalog 2026-05)**

**Objetivo:** modelar vocabulario de tooling PowerBuilder para ORCA/PBAutoBuild fuera del hot path semántico, de modo que build/health/docs surfaces puedan reutilizarlo sin contaminar resolución PowerScript/DataWindow.

**Resultado registrado:**
- `src/server/knowledge/system/manual/tooling/index.ts` publica `tooling-symbols` bajo el namespace `powerbuilder-tooling` para ORCA, PBAutoBuild, env vars y settings de tooling;
- `src/server/knowledge/system/manual/index.ts` incorpora ese slice al dataset `manual-core` y el consistency report publica ya el nuevo dominio sin romper provenance ni counts del catálogo;
- `src/server/knowledge/system/services/queryService.ts` excluye `tooling-symbols` de `resolveLanguageSymbol()`, manteniendo el vocabulario visible sólo por acceso explícito al catálogo y fuera del hot path interactivo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/toolingCatalog"`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/developer-workflows.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.165 B314. Build/ORCA failure classification v2 — **Cerrada (build / troubleshooting 2026-05)**

**Objetivo:** clasificar fallos comunes de build moderno y ORCA legacy para troubleshooting y support bundle reutilizando el estado ya publicado del runtime, el parser de problemas de PBAutoBuild y el journal técnico persistido.

**Resultado registrado:**
- `src/client/build/buildOrcaFailureClassification.ts` clasifica `missing-tool`, `invalid-env`, `compile-errors`, `stale-staging`, `source-conflict` y `packaging-disabled` sin abrir un segundo checker ni una API nueva;
- `src/client/support/supportBundle.ts` incorpora `failureClassification` en `build-orca-snapshot.json` y `src/client/extension.ts` lee `.vsc-powersyntax/runtime/build-orca-journal.json` de forma read-only para enriquecer el bundle exportado;
- el detalle ORCA del bundle queda path-safe y reutiliza `buildHealth`, `buildProblems`, `orcaTooling`, `orcaRunner` y el `build-orca-journal` persistido para distinguir troubleshooting de tooling, compile y staging.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(buildOrcaFailureClassification|supportBundle|pbAutoBuildProblems|orcaStagingImport)"`

**Documentación alineada:**
- `docs/developer-workflows.md`
- `docs/rules-catalog.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.164 B317. Backlog lifecycle automation guard — **Cerrada (SDD / backlog governance 2026-05)**

**Objetivo:** proteger transiciones `Open/Partial/Done` y el movimiento backlog ↔ done-log reutilizando el audit documental ya publicado, sin abrir un segundo checker ni rehacer la historia completa del repo.

**Resultado registrado:**
- `tools/docs-drift-audit.cjs` endurece `npm run test:docs:drift` para rechazar estados `Done/Closed` todavía presentes en backlog y entradas canónicas modernas del done-log sin `**Validación registrada:**` o `**Documentación alineada:**`;
- `test/server/unit/docsLifecycleGuard.test.ts` congela el nuevo guard de lifecycle documental sobre un caso sintético mínimo;
- el cierre completa el formato canónico de las entradas `B358`, `B359`, `B360`, `B361`, `B362` y `B363` en `docs/done-log.md`, dejando el rail moderno de cierre limpio sobre el repo real.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/docsLifecycleGuard"`
- `npm run test:docs:drift`

**Nota de validación adicional:**
- El guard se apoya deliberadamente en el rail de `B316` y solo endurece el lifecycle canónico actual; no intenta reestructurar retrospectivamente entradas históricas previas al bloque moderno del done-log.

**Documentación alineada:**
- `docs/spec-driven-development.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.163 B316. Documentation drift detector — **Cerrada (docs governance / SDD 2026-05)**

**Objetivo:** detectar drift canónico entre backlog, done-log, specs, roadmap y current-focus con un check local reproducible que no dependa del runtime del producto.

**Resultado registrado:**
- `tools/docs-drift-audit.cjs` publica `npm run test:docs:drift` y marca ítems `Done` todavía activos en backlog, duplicados canónicos en `docs/backlog.md`/`docs/done-log.md`, specs sin `spec.md`/`tasks.md` y desalineación entre `docs/current-focus.md` y `docs/roadmap.md`;
- `test/server/unit/docsDriftAudit.test.ts` congela el rail con un caso sintético de drift y exige que el repo actual pase limpio sin errores ni warnings;
- el cierre corrige drift documental real preexistente añadiendo `specs/377-catalog-driven-enum-consumers/tasks.md`, retirando `B329` del backlog activo y eliminando la entrada duplicada de `B361` en `docs/done-log.md`.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/docsDriftAudit"`
- `npm run test:docs:drift`

**Nota de validación adicional:**
- El audit se limita al drift canónico de backlog/done-log/current-focus/roadmap y a la documentación mínima `spec.md`/`tasks.md`; no intenta normalizar retrospectivamente toda la historia de `plan.md` ni ownership histórico de specs antiguas.

**Documentación alineada:**
- `docs/spec-driven-development.md`
- `docs/ai-orchestrator.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.163 AUDIT-ERRORES. Runtime self-test funcional y smoke scoping del runtime interactivo — **Cerrada (runtime / testing 2026-05)**

**Objetivo:** cerrar la auditoría del runtime interactivo eliminando falsos verdes del self-test, estabilizando hover/definition en hot path y separando la smoke de activación de recorridos read-only pesados.

**Resultado registrado:**
- `src/client/extension.ts`, `src/client/runtimeSelfTest.ts`, `src/server/handlers/featureHandlers.ts` y `src/server/server.ts` dejan el runtime self-test como comando read-only funcional: valida `view providers`, `IsNull` case-insensitive, serving cache, hover negative cache y definition negative cache, con stats ligeras y manifest best-effort para no bloquear el comando;
- `src/server/runtime/interactiveLoopGuard.ts` y su prueba unitaria fijan el single-flight del hot path interactivo, mientras hover/definition quedan reanclados a fingerprint por documento y misses observables;
- `test/smoke/extension.test.ts` separa la smoke de activación del barrido read-only, reduce cada smoke a checks representativos y reemplaza la exportación real de snapshots por importación/diff sobre fixture de compatibilidad para mantener el carril estable y rápido.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/runtimeSelfTest.test.js`
- `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms|el runtime self-test se ejecuta como comando read-only|las views contribuidas registran su provider durante activate|la superficie runtime read-only consulta reportes estructurales|la superficie runtime read-only abre reportes markdown secundarios|la superficie runtime read-only exporta e importa snapshots"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/architecture-status.md`
- `docs/testing.md`
- `docs/done-log.md`

## 1.162 B315. Extension package self-verification v2 — **Cerrada (release / package quality 2026-05)**

**Objetivo:** reforzar la auto-verificación del VSIX empaquetado para que el carril de release instalado compruebe activación, comandos, handshake mínimo con runtime/LSP, defaults de settings y descriptor/API pública.

**Resultado registrado:**
- `test/smoke/extension.test.ts` amplía la smoke instalada para verificar defaults de `vscPowerSyntax.profile`, `progress.show`, `formatting.enabled`, `formatting.formatOnSave`, `formatting.maxDocumentChars` y `formatting.maxDocumentLines`, además de activación, comandos y descriptor/API pública ya cubiertos;
- `test/server/unit/packageSelfVerificationContract.test.ts` congela el alcance del self-verification del paquete y confirma que `release:verify` mantiene `test:smoke:installed-vsix` como parte del lane;
- `release:verify` sigue usando `package:vsix -> verify:vsix-contents -> test:smoke:installed-vsix`, de modo que la verificación ampliada ocurre sobre el VSIX instalado real y no sobre la development extension.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/packageSelfVerificationContract"`
- `npm run test:smoke:installed-vsix`
- `npm run release:verify`

**Nota de validación adicional:**
- `npm run release:verify` sigue bloqueado por los mismos fallos globales preexistentes ajenos a `B315`: `unit/visualCatalogDatatypes`, `unit/systemCatalogQueryHardening`, `unit/runtimeCatalogDatatypes`, `unit/explainSystemSymbol`, `unit/catalogConsistency` y el hotspot histórico de `src/client/extension.ts` en `unit/architectureImports`.

**Documentación alineada:**
- `docs/testing.md`
- `README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.161 B298. Extension upgrade compatibility checker — **Cerrada (upgrade / compatibility 2026-05)**

**Objetivo:** detectar problemas al actualizar versión de la extensión revisando cache schema, settings legacy, snapshots, `apiVersion` y artefactos locales del workspace.

**Resultado registrado:**
- `workspace-check` añade el modo `upgrade`, reutilizando `server-stats`, `semanticWorkspaceManifest`, settings governance y `workspaceMigrationAssistant` para revisar runtime persistente, `cache policy`, settings legacy, `apiVersion/schemaVersion` y ruido local sin abrir un segundo checker;
- el cliente publica el comando `PowerSyntax: Check Extension Upgrade Compatibility`, que abre el mismo reporte Markdown AI-readable del rail `workspace-check` en modo `upgrade`;
- el reporte consolida findings/recommended actions para drift de settings, runtime cache persistente, artefactos locales/staging legacy y revisión explícita de versiones exportadas antes de reutilizar snapshots o bundles viejos.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/extensionUpgradeCompatibilityChecker"`
- `npm run test:smoke -- --grep "la extensión se activa en menos de 500ms"`

**Nota de validación adicional:**
- la smoke focal pasó y abrió el nuevo checker, aunque el log sigue mostrando el warning histórico de activación por encima de 500 ms en entorno local de test; no abrió una regresión nueva del slice `B298`.

**Documentación alineada:**
- `docs/architecture.md`
- `docs/developer-workflows.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.160 B387. Release readiness alignment after bundling — **Cerrada (CI / release / workflows 2026-05)**

**Objetivo:** alinear `release:verify`, workflow de GitHub Actions y documentación con el modelo productivo basado en `dist/**`, verificación de contenido y smoke instalada del VSIX.

**Resultado registrado:**
- `.vscode-test.js` publica el label `smoke-installed` con `extensionDevelopmentPath: []`, `installExtensions: ['.dist/vsc-powersyntax.vsix']` y directorios aislados de user-data/extensions para ejecutar la smoke de activación real sobre la extensión instalada;
- `package.json` añade `test:smoke:installed-vsix` y encadena esa smoke dentro de `release:verify` después de `package:vsix` y `verify:vsix-contents`, dejando el lane release alineado con `bundle -> package -> verify -> installed smoke`;
- `.github/workflows/release-readiness.yml` sigue usando `npm run release:verify` y publica el VSIX/artifacts del mismo carril, mientras la documentación de release/testing/workflows refleja ya el flujo `dist/**` y la validación instalada.

**Validación registrada:**
- `npm run test:smoke:installed-vsix`
- `npm run test:unit -- --grep "unit/releaseReadinessContract"`
- `npm run test:performance:gate`
- `npm run test:architecture:rapid`
- `npm run test:architecture:metrics`
- `npm run release:verify`

**Nota de validación adicional:**
- `npm run test:architecture:metrics` y `npm run release:verify` siguen fallando por bloqueos preexistentes fuera de `B387`: el hotspot histórico de `src/client/extension.ts` en `architecture-hotspot-guard`/`unit/architectureImports` y regresiones ajenas en `unit/visualCatalogDatatypes`, `unit/systemCatalogQueryHardening`, `unit/runtimeCatalogDatatypes`, `unit/explainSystemSymbol` y `unit/catalogConsistency`.

**Documentación alineada:**
- `docs/testing.md`
- `docs/developer-workflows.md`
- `docs/performance-budget.md`
- `README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.159 B386. VSIX package surface hardening and package content verification — **Cerrada (packaging / release / quality gate 2026-05)**

**Objetivo:** endurecer la surface del VSIX para que el paquete final sea pequeño, reproducible y verificable, evitando artefactos de desarrollo y dependencias innecesarias.

**Resultado registrado:**
- `package.json.files` queda fijado sobre la allowlist productiva `dist/**`, `syntaxes/**`, `icons/**`, `language-configuration.json`, `package.json`, `LICENSE`, `README.md` y `CHANGELOG.md`, sin `.vscodeignore` paralelo que contradiga ese modelo;
- `tools/verify-vsix-contents.mjs` comprueba required paths del runtime/publicación y bloquea prefijos prohibidos (`src/`, `test/`, `fixtures-local/`, `node_modules/`, `coverage/`, `.cache/`, `.tmp/`, `tools/`, `scripts/`, `out/`) además de `*.tsbuildinfo`;
- `test/server/unit/vsixPackageSurfaceContract.test.ts` congela el contrato `allowlist + verify-vsix-contents + release:verify` para que el carril VSIX no vuelva a ensancharse por accidente.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/vsixPackageSurfaceContract"`
- `npm run package:vsix:list`
- `npm run verify:vsix-contents`
- `npm run release:verify` ejecutado como comprobación del carril completo

**Nota de validación adicional:**
- `npm run release:verify` sigue fallando por regresiones preexistentes ajenas a `B386` en `unit/visualCatalogDatatypes`, `unit/systemCatalogQueryHardening`, `unit/runtimeCatalogDatatypes`, `unit/explainSystemSymbol`, `unit/catalogConsistency` y por el hotspot histórico de `unit/architectureImports` sobre `src/client/extension.ts`.

**Documentación alineada:**
- `docs/testing.md`
- `docs/developer-workflows.md`
- `README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.158 B385. Production esbuild bundling for client and language server — **Cerrada (packaging / runtime / bundling 2026-05)**

**Objetivo:** sustituir el empaquetado basado en `out/** + node_modules runtime` por bundles de producción con `esbuild`, dejando un runtime VSIX autocontenido y defendible.

**Resultado registrado:**
- `package.json` publica `main = ./dist/client/extension.js`, empaqueta solo `dist/**` y ejecuta `npm run bundle` en `vscode:prepublish`/`package:vsix` para que el carril productivo no dependa de `node_modules` runtime suelto;
- `tools/esbuild.mjs` genera `dist/client/extension.js` y `dist/server/server.js`, manteniendo `vscode` como `external` del cliente y un server bundle Node ejecutable localmente;
- `src/client/extension.ts` arranca el LSP desde `dist/server/server.js` y deja `out/server/server.js` como fallback exclusivo de `Development`, evitando que el paquete productivo dependa del layout de compilación TypeScript.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/productionBundlingContract"`
- `npm run package:vsix`
- `npm run package:vsix:list`

**Nota de validación adicional:**
- `npm run test:unit -- --grep "unit/architectureImports"` sigue fallando por el hotspot preexistente de `src/client/extension.ts` (budgets de líneas/imports), ya documentado previamente y no introducido por `B385`.

**Documentación alineada:**
- `docs/architecture.md`
- `docs/testing.md`
- `docs/developer-workflows.md`
- `README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.157 B313. Workspace artifact cleanup advisor — **Cerrada (workspace hygiene / supportability 2026-05)**

**Objetivo:** sugerir limpieza no destructiva de artefactos locales, staging, logs y caches del workspace reutilizando surfaces read-only ya existentes.

**Resultado registrado:**
- `src/server/features/workspaceMigrationAssistant.ts` añade acciones manuales para inspeccionar ruido local (`.pb`, `build`, `_backupfiles`) y staging legacy ORCA sin ejecutar limpieza automática;
- `src/client/support/supportBundle.ts` exporta `workspace-cleanup-advisor.json`, que resume recomendaciones manuales sobre artefactos locales, runtime cache/journal, drift de settings y revisión de API/schema versions, además de enlazar esa guidance desde `README.md`;
- `src/client/extension.ts` reutiliza `getWorkspaceMigrationAssistant()` durante la exportación del support bundle en vez de abrir una surface paralela.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(workspaceMigrationAssistant|supportBundle|crossSurfaceGoldenMatrix)"`

**Documentación alineada:**
- `docs/developer-workflows.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.156 B309. Source control artifact awareness — **Cerrada (workspace hygiene / scm awareness 2026-05)**

**Objetivo:** reconocer artefactos `Git/SVN/SCC` y outputs locales del workspace para evitar indexar ruido y mejorar `workspaceMigrationAssistant` sin ejecutar SCM ni aplicar limpieza destructiva.

**Resultado registrado:**
- `src/server/workspace/discovery.ts` registra ya metadata/policy files SCM (`.git`, `.svn`, `.gitignore`, `.gitattributes`, `.scc`) y outputs locales (`.pb`, `build`, `_backupfiles`) en `WorkspaceState`, manteniéndolos fuera de roots/source sin perder esa observación read-only;
- `src/server/features/workspaceMigrationAssistant.ts` publica recomendaciones `source-control-artifacts` y `local-artifact-noise` para explicar qué se ignora, qué no debe competir con la topología/build canónicos y qué debe tratarse sólo como governance o ruido local;
- `test/server/unit/workspace.test.ts` y `workspaceMigrationAssistant.test.ts` fijan el carril `discover -> state -> migration assistant` con fixtures de `.git`, `.svn`, `.scc`, `.gitignore`, `.gitattributes`, `build` y `_backupfiles`.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(workspace|workspaceMigrationAssistant)"`

**Documentación alineada:**
- `docs/developer-workflows.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.155 B307. WebBrowser/WebView2 usage analyzer — **Cerrada (web ui interop / reports 2026-05)**

**Objetivo:** detectar superficies `WebBrowser`/`WebView2` y resumir patrones de navegación, bridge JavaScript y settings relevantes para reportes read-only sin inspeccionar contenido web remoto ni abrir un motor nuevo.

**Resultado registrado:**
- `src/server/features/powerBuilderCodeMetrics.ts` publica ya `webBrowserUsages` por objeto y en summary global reutilizando `datatype` y `baseTypeName` del snapshot indexado;
- `src/server/features/powerBuilderTechnicalDebtReport.ts` publica el hotspot `web-ui-integration` con evidencia `web-ui-surface:*`, `web-ui-pattern:*` y `web-ui-risk:no-content-inspection`, distinguiendo navegación, script bridge y remote debugging sin leer HTML, DOM ni payloads remotos;
- `src/client/workspaceCheckReport.ts` resume esa misma evidencia en health, `src/client/extension.ts` la refleja en el Markdown del informe técnico y `src/client/support/supportBundle.ts` la mantiene visible en el debt report saneado;
- `src/shared/publicApi.ts` versiona el contrato visible a `2.22.0` y `test/server/unit/publicApi.test.ts` fija que los nuevos campos WebBrowser/WebView2 forman parte del API público.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(powerBuilderCodeMetrics|powerBuilderTechnicalDebtReport|workspaceCheckReport|supportBundle|publicApi)"`

**Documentación alineada:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`
- `docs/developer-workflows.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.154 B306. HTTPClient/REST/JSON usage analyzer — **Cerrada (modern integration / reports 2026-05)**

**Objetivo:** detectar usos HTTP/REST/JSON y resumir endpoints/patrones de integración moderna para `code metrics`, debt report, health y support bundle sin exponer secretos ni abrir un motor nuevo.

**Resultado registrado:**
- `src/server/features/powerBuilderCodeMetrics.ts` publica ya `httpIntegrationUsages` y `jsonIntegrationUsages` por objeto y en summary global reutilizando `datatype` y `baseTypeName` del snapshot indexado;
- `src/server/features/powerBuilderTechnicalDebtReport.ts` publica el hotspot `modern-integration` con evidencia `integration-surface:*`, `integration-pattern:*`, `integration-endpoint:*` redactado e `integration-risk:redaction-required`, sin filtrar hosts, paths, tokens ni credenciales reales;
- `src/client/workspaceCheckReport.ts` resume la misma evidencia pública en health y `src/client/support/supportBundle.ts` la mantiene visible en el debt report saneado, sin abrir una segunda clasificación;
- `src/shared/publicApi.ts` versiona el contrato visible a `2.21.0` y `test/server/unit/publicApi.test.ts` fija que los nuevos campos HTTP/JSON forman parte del API público.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(powerBuilderCodeMetrics|powerBuilderTechnicalDebtReport|workspaceCheckReport|supportBundle|publicApi)"`

**Documentación alineada:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`
- `docs/developer-workflows.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.153 B308. PBNI/PBX dependency insight v2 — **Cerrada (native dependencies / reports 2026-05)**

**Objetivo:** profundizar dependencias externas `DLL/PBX/unknown` para reportes read-only, health y support bundle reutilizando external functions y `native-dependency`, sin cargar binarios nativos.

**Resultado registrado:**
- `src/server/features/powerBuilderTechnicalDebtReport.ts` desglosa el hotspot `external-dependency` con evidencia `external-kind:dll|pbx|unknown`, `external-alias:*` y `external-consumers=*`, manteniendo el contador base `externalDependencies` sobre el mismo snapshot indexado;
- el mismo debt report añade evidencia visible de riesgo e impacto `external-risk:native-runtime`, `external-build-impact:manual-native-deployment`, `external-risk:pbni-runtime-surface`, `external-orca-impact:manual-pbx-packaging` y `external-risk:unknown-binary-classification` cuando aplica;
- `src/client/workspaceCheckReport.ts` resume esa evidencia pública en health sin ampliar el contrato ni abrir un segundo motor de clasificación;
- `src/client/support/supportBundle.ts` sigue reutilizando el debt report saneado y `test/server/unit/supportBundle.test.ts` fija que la evidencia externa visible llega intacta al bundle.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(externalFunctions|powerBuilderTechnicalDebtReport|workspaceCheckReport|supportBundle)"`

**Documentación alineada:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.152 B310. Object lifecycle risk report v2 — **Cerrada (PowerBuilder lifecycle / diagnostics 2026-05)**

**Objetivo:** elevar lifecycle `create/destroy/constructor/destructor` a reportes de riesgo y modernization reutilizando diagnostics y metrics ya existentes.

**Resultado registrado:**
- `src/server/features/powerBuilderTechnicalDebtReport.ts` publica el hotspot `lifecycle-risk` cuando existen warnings `missing-super-*`, `missing-trigger-*` o `unresolved-*`, con evidencia `diagnostic:lifecycle-*` y summary `lifecycleRiskFindings`;
- el debt report reutiliza `objectEntry.metrics.lifecycleWarnings` ya publicados por `powerBuilderCodeMetrics`, evitando recomputar lifecycle fuera del snapshot de diagnostics;
- `src/client/extension.ts` refleja ya el summary `lifecycle` y el contador lifecycle por hotspot en el Markdown del informe técnico;
- `test/server/unit/diagnostics.test.ts`, `powerBuilderCodeMetrics.test.ts`, `powerBuilderTechnicalDebtReport.test.ts` y `publicApi.test.ts` fijan la cadena `diagnostics -> metrics -> debt report` para este slice.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(diagnostics|powerBuilderCodeMetrics|powerBuilderTechnicalDebtReport|publicApi)"`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/rules-catalog.md`
- `docs/developer-workflows.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.151 B312. SQL dynamic risk taxonomy v2 — **Cerrada (SQL / risk model 2026-05)**

**Objetivo:** clasificar riesgo de SQL embebido/dinámico para `diagnostics`, debt report y `safeEditPlan` con reason codes defendibles, sin intentar parsear SQL dinámico no demostrable.

**Resultado registrado:**
- `src/server/features/invocationRiskModel.ts` conserva `dynamic-strings:n` y añade `dynamic-sql:n` solo cuando `dynamicStringReferences` ya aporta evidencia SQL defendible;
- `test/server/unit/invocationRiskModel.test.ts` fija esa taxonomía local y congela que el contador genérico no se pierde al añadir el subtipo SQL;
- `test/server/unit/safeEditPlan.test.ts` demuestra que `safeEditPlan` hereda `dynamic-sql:n` vía `impactAnalysis`, mientras `codeActions.test.ts` sigue verde para los casos dinámicos no SQL;
- `test/server/unit/powerBuilderTechnicalDebtReport.test.ts` mantiene el hotspot `dynamic-sql` con evidencia y `confidence` explícitas como surface canónica de reportes.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(invocationRiskModel|safeEditPlan|codeActions)"`
- `npm run test:unit -- --grep "unit/powerBuilderTechnicalDebtReport"`

**Documentación alineada:**
- `docs/rules-catalog.md`
- `docs/developer-workflows.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.150 B311. Transaction and DataWindow update flow analyzer — **Cerrada (transaction semantics / reports 2026-05)**

**Objetivo:** analizar flujos `SetTransObject/SetTrans/Retrieve/Update` y proyectar su riesgo real en code metrics y technical debt report sin abrir un parser paralelo ni un segundo motor de scoring.

**Resultado registrado:**
- `src/server/features/powerBuilderTechnicalDebtReport.ts` mantiene `datawindow-risk` aunque el binding no resuelva un `.srd` único, siempre que existan evidencias defendibles en `diagnostic.code` para `dataobject-*`, `transaction-binding-*` o `retrieve-arity-mismatch`;
- el debt report añade evidencia específica por `dataobject-binding`, `transaction-binding`, `retrieve-arity` y `datawindow-path`, evitando colapsar todo el riesgo DataWindow en un único contador opaco;
- `src/server/features/powerBuilderCodeMetrics.ts` publica contadores por objeto y summary para `dataObjectBindingDiagnostics`, `transactionBindingDiagnostics` y `retrieveArityDiagnostics`, reutilizando el mismo snapshot de diagnostics;
- `test/server/unit/powerBuilderTechnicalDebtReport.test.ts` y `powerBuilderCodeMetrics.test.ts` fijan el caso degradado de `Retrieve/Update` con binding dinámico o transacción ausente.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(powerBuilderCodeMetrics|powerBuilderTechnicalDebtReport)"`

**Documentación alineada:**
- `docs/rules-catalog.md`
- `docs/developer-workflows.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.149 B303. Agent task replay from repro/support bundle — **Cerrada (AI supportability 2026-05)**

**Objetivo:** permitir que un agente reconstruya una incidencia desde un semantic repro pack o support bundle saneado sin requerir el repo completo ni abrir side effects.

**Resultado registrado:**
- `src/shared/publicApi.ts` publica `ApiTaskReplayBundleRequest`, `ApiTaskReplayBundleReport` y el tool read-only `task-replay-bundle` como parte del contrato público versionado;
- `src/client/taskExecutionAutomation.ts` detecta manifests `semantic-repro-pack` y `support-bundle`, y genera `minimalContext`, `referencedFiles`, `suggestedCommands` y `recommendedContractId` sin depender del workspace real;
- `src/client/extension.ts` expone `replayTaskFromBundle()` por el read-only bridge, reutilizando el rail contractual existente en vez de abrir un loader paralelo;
- `test/fixtures/agent-task-replay/` y `test/server/unit/taskExecutionAutomation.test.ts` fijan el replay para ambos formatos soportados.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit -- --grep "taskExecutionAutomation|agentDocsPolicy"`

**Documentación alineada:**
- `docs/ai-orchestrator.md`
- `docs/developer-workflows.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.148 B302. Agent-safe documentation updater policy — **Cerrada (docs automation 2026-05)**

**Objetivo:** evitar que agentes dupliquen documentación, cierren trabajo con documentos propietarios pendientes o traten intención como implementación.

**Resultado registrado:**
- `test/server/unit/agentDocsPolicy.test.ts` fija sobre archivos reales del repo que `docs-updater` solo toca documentos afectados, que `docs-auditor` no marca como implementado lo que solo está planificado y que el context pack IA delega el foco vivo a `docs/current-focus.md`;
- `docs/ai-context/powerbuilder-plugin-context.md` deja de conservar foco histórico desalineado y refleja ya los tools read-only actuales del carril IA;
- `docs/ai-orchestrator.md`, `docs/spec-driven-development.md` y `docs/ai-agents-catalog.md` pasan a exigir `validationReceipt` y `docsPending` explícitos antes de cerrar trabajo write-enabled.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit -- --grep "taskExecutionAutomation|agentDocsPolicy"`

**Documentación alineada:**
- `docs/ai-context/powerbuilder-plugin-context.md`
- `docs/ai-orchestrator.md`
- `docs/ai-agents-catalog.md`
- `docs/spec-driven-development.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.147 B300. Agent validation receipt — **Cerrada (SDD / AI governance 2026-05)**

**Objetivo:** generar un recibo estructurado tras una tarea agent-ready para dejar comandos, resultados, artefactos, riesgos, docs pendientes, specs afectadas y siguiente foco.

**Resultado registrado:**
- `src/shared/publicApi.ts` publica `ApiTaskExecutionValidationReceipt` y permite adjuntarlo a `ApiSpecDrivenPblUpdateResult` y `ApiSpecDrivenPblUpdateBatchResult`;
- `src/client/taskExecutionAutomation.ts` compone receipts single y batch con comandos, resultados, `docsTouched`, `docsPending`, `specsAffected`, `artifacts` y `nextFocus`;
- `src/client/extension.ts` adjunta `validationReceipt` a `applySpecDrivenPblUpdate()` y `applySpecDrivenPblUpdateBatch()` sobre el mismo rail seguro de ejecución;
- `test/server/unit/taskExecutionAutomation.test.ts` fija receipts con journal, ledger y riesgos sin abrir un postprocesado paralelo.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit -- --grep "taskExecutionAutomation|agentDocsPolicy"`

**Documentación alineada:**
- `docs/spec-driven-development.md`
- `docs/ai-orchestrator.md`
- `docs/ai-agents-catalog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.146 B299. Agent execution dry-run contract — **Cerrada (AI automation safety 2026-05)**

**Objetivo:** exigir un dry-run declarativo previo para tareas IA write-enabled con plan, impacto, archivos, tests, docs y bloqueos visibles antes de tocar código.

**Resultado registrado:**
- `src/shared/publicApi.ts` publica `ApiTaskExecutionDryRunRequest`, `ApiTaskExecutionDryRunReport`, el método `getTaskExecutionDryRun()` y el tool read-only `task-execution-dry-run` en el contrato público versionado;
- `src/client/extension.ts` expone ese dry-run por el read-only bridge y lo resuelve reutilizando `generateSafeEditPlan()` y `analyzeImpact()` sin abrir otro planner;
- `src/client/taskExecutionAutomation.ts` compone items y summaries del dry-run con archivos, riesgos, tests, docs pendientes y bloqueos defendibles;
- `test/server/unit/taskExecutionAutomation.test.ts` fija el contrato sobre un caso `spec-driven-pbl-update` y mantiene verde el rail agent-ready sin side effects.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit -- --grep "taskExecutionAutomation|agentDocsPolicy"`

**Documentación alineada:**
- `docs/ai-orchestrator.md`
- `docs/spec-driven-development.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.145 B301. Agent context budget enforcement — **Cerrada (AI tooling / performance 2026-05)**

**Objetivo:** limitar payloads y contexto de surfaces agent-ready para que tools/API expongan budgets explícitos, truncado visible y degradación segura sobre workspaces grandes.

**Resultado registrado:**
- `ApiAiTaskContextBundle` publica ya `reasonCodes` machine-readable y `pagination` receipts para `diagnosticExplanations` y `systemSymbolExplanations`, de modo que el truncado deja de depender solo de `omissions` en texto libre;
- `src/client/aiTaskContextBundle.ts` conserva el budget único por `intent` y añade reason codes explícitos para límites de lista, pruning por budget, minimización de meta y bundle mínimo, además de `missing-focus` en el unavailable builder;
- `test/server/unit/aiTaskContextBundle.test.ts` fija budgets bajos, truncado por límites de lista y caps sobre un `workspaceCheck` inflado sin romper el budget declarado;
- el contrato público y el read-only bridge permanecen compatibles mediante la ampliación aditiva validada por `test/server/unit/publicApi.test.ts`.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/aiTaskContextBundle"`
- `npm run test:unit -- --grep "unit/(aiTaskContextBundle|publicApi)"`

**Documentación alineada:**
- `docs/ai-strategy.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.144 B292. PowerBuilder preprocessor / conditional patterns investigation — **Cerrada (parser research 2026-05)**

**Objetivo:** determinar si el producto necesitaba soporte explícito para patrones condicionales/preprocesador PowerBuilder o si debía descartarlos hasta encontrar evidencia activa en corpus reales.

**Resultado registrado:**
- las búsquedas sobre `fixtures-local/`, `src/server/`, `test/` y `plugin_old/` no encontraron directivas activas de preprocesador (`$if/$endif/#if/#endif/#define`) en código PowerBuilder servido por el producto;
- la única evidencia encontrada en corpus real queda limitada a texto comentado o histórico dentro de `STD_FC_OrderEntry`: copias comentadas de `#define` en `nc_winsock_master.sru` y la revisión `Removed old #IF WebService code` en `nc_app_controller_master.sru`;
- la decisión cerrada es `descarte explícito`: no se añade gramática ni semántica nueva de preprocesador mientras no aparezca sintaxis activa defendible en corpus reales;
- `test/server/unit/powerbuilderParserResilienceFuzz.test.ts` fija que esos pseudo-marcadores comentados no contaminan `logicalStatements` ni desestabilizan el análisis estructural.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/powerbuilderParserResilienceFuzz"`

**Documentación alineada:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.143 B354. Server runtime orchestration decomposition — **Cerrada (runtime architecture 2026-05)**

**Objetivo:** separar la orquestación runtime de `server.ts` del wiring LSP sin cambiar `scheduler`, `backpressure`, `memory pressure` ni payloads visibles de stats/health/status.

**Resultado registrado:**
- `src/server/cache/semanticCacheRuntimeController.ts` concentra store activo, append journal, persistencia del serving snapshot, flush coordinator y métricas de restore/persist antes repartidas en `server.ts`;
- `src/server/runtime/runtimeProgressController.ts` concentra la construcción/publicación del snapshot operativo de readiness, manteniendo `buildProgressReadinessSnapshot()` y `toProgressNotification()` como helpers puros reutilizados;
- `src/server/runtime/managedRuntimeWorkloads.ts` concentra ids/yielding cooperativo y los adapters `near-context`, `export-reporting` y `maintenance`, mientras `src/server/runtime/managedBuildWorkloads.ts` concentra `pbautobuild` y `legacy-orca` sobre el mismo helper de background sin duplicar policy runtime;
- `src/server/server.ts` queda reducido a bootstrap y composición de controladores runtime, manteniendo `TaskScheduler`, `backpressurePolicy`, `latencyGovernor` y `memoryPressurePolicy` como centros únicos de decisión y sin reintroducir build/legacy en el hot path interactivo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(scheduler|backpressurePolicy|memoryPressurePolicy|memoryBudgets|runtimeHealth|statusBarPresentation|servingCacheRuntime|cacheStore|progressReadiness|managedRuntimeWorkloads|managedBuildWorkloads)"`
- `npm run test:performance:gate`
- `npm run test:architecture:rapid`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/performance-budget.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.142 B344. DataWindow binding edge cases from plugin_old — **Cerrada (datawindow/plugin_old migration 2026-05)**

**Objetivo:** extraer casos probados de bindings DataWindow `child/report/dddw` desde `plugin_old` como reglas/fixtures sobre el backbone actual, sin portar providers cliente ni parsear `.srd` como PowerScript.

**Resultado registrado:**
- `src/server/features/dataWindowPropertyPaths.ts` expande el root resoluble de `report(...)` durante completion, de modo que `Modify("rpt_orders.")` ya ofrece columnas del DataWindow hijo y `DataWindow`, manteniendo el serving dentro de `DataWindowModel` + bindings `DataObject` actuales;
- `test/server/unit/completion.test.ts` y `hover.test.ts` fijan el camino anidado `report -> column -> dddw.name`, incluyendo `rpt_orders.status_id.dddw.name`, sin ampliar el contrato fuera de bindings deterministas;
- `test/fixtures/datawindow-b344/` y `test/smoke/datawindow-b344.extension.test.ts` validan completion y hover del mismo path sobre `.srd` reales en disco con los providers reales del editor;
- `specs/390-datawindow-binding-edge-cases/` queda cerrada y deja sin gap activo el frente DataWindow `child/report/column occurrences` heredado de `plugin_old`.

**Validación registrada:**
- `npm run test:unit -- --grep "report child y su columna dropdown anidada|report child hacia dddw\.name"`
- `npm run test:smoke -- --grep "report child con columna dropdown"`

**Documentación alineada:**
- `docs/plugin-old-migration-opportunities.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.141 B342. Extract proven symbol heuristics from plugin_old — **Cerrada (plugin_old migration/semantics 2026-05)**

**Objetivo:** revisar heurísticas probadas de `plugin_old` sin crear un motor paralelo y absorber sólo las que puedan vivir sobre `KnowledgeBase`, snapshots y query service actuales.

**Resultado registrado:**
- `docs/plugin-old-migration-opportunities.md` deja una matriz explícita por heurística: `linked editing` queda absorbido, `folding` / `inlay hints` / resúmenes extra de `code lens` quedan como parciales aprovechables y los edge cases DataWindow `child/report/column occurrences` pasan a ser el foco residual de `B344`;
- `src/server/features/linkedEditing.ts` publica linked editing seguro para `Local` y `Argumento`, reutilizando `queryContext` + `references` sobre el documento activo y exigiendo resolución semántica única antes de devolver rangos editables;
- `src/server/handlers/featureHandlers.ts`, `lifecycleHandlers.ts` y `server.ts` cablean `linkedEditingRangeProvider` dentro del servidor actual usando los mismos readiness/confidence gates que rename/references, sin provider host cliente ni índices heredados de `plugin_old`;
- `specs/389-plugin-old-symbol-heuristics/` queda cerrada y deja el siguiente frente real acotado a `B344`.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(linkedEditing|architectureImports)"` — `unit/linkedEditing` verde; `unit/architectureImports` sigue fallando por el hotspot preexistente de `src/client/extension.ts`, no tocado por `B342`.

**Documentación alineada:**
- `docs/plugin-old-migration-opportunities.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.140 B327. DataWindow constants and property path catalog — **Cerrada (knowledge/datawindow 2026-05)**

**Objetivo:** catalogar constantes, property paths y nombres de propiedades DataWindow reutilizables por `Describe/Modify/Object`, manteniéndolos separados del parser PowerScript y sirviéndolos sólo con contexto DataWindow defendible.

**Resultado registrado:**
- `src/server/knowledge/system/generated/dataWindowConstants.generated.ts` proyecta el subconjunto oficial DataWindow de `enumerated-types` / `enumerated-values` sobre el dominio `datawindow-constants`, manteniendo `dataset = generated`, provenance oficial y source URLs `datawindow_reference` sin abrir una segunda fuente de verdad;
- `src/server/knowledge/system/services/queryService.ts` y `src/server/knowledge/system/SystemCatalog.ts` publican queries owner-scoped para `datawindow-constants`, preservan `listValuesForEnumeratedType()` libre de contaminación entre dominios y reutilizan el orden visible ya fijado por el rail enumerado general para `DWBuffer` y análogos;
- `src/server/features/completion.ts` y `signatureHelp.ts` consumen `datawindow-constants` sólo en contextos member-scoped DataWindow, mientras overrides curados de `FileSeek`, `RowsMove`, `Retrieve` y `Update` mantienen la firma corta usada por surfaces interactivas y `dataWindowPropertyPaths.ts` fija además el root completion `Modify("DataWindow.T") -> Table` junto al slice previo `DataWindow.Syntax`;
- `specs/388-datawindow-constants-and-property-path-catalog/` queda cerrada con tasks completas y sin abrir un rail semántico paralelo a `DataWindowModel` + `SystemCatalog`.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(systemCatalog|completion|signatureHelp)"`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.139 B320. DataWindow expression/property official catalog — **Cerrada (knowledge/datawindow 2026-05)**

**Objetivo:** integrar funciones oficiales de expresiones DataWindow y property paths oficiales/curados en el catálogo v2, manteniéndolos separados de PowerScript general y sirviéndolos sólo cuando el contexto DataWindow es defendible.

**Resultado registrado:**
- `src/server/knowledge/system/manual/datawindow/dataWindowProperties.ts` publica el subconjunto inicial de `datawindow-properties` ya fijado por comportamiento observable (`DataWindow`, `DataWindow.DataObject`, `DataWindow.Table`, `DataWindow.Table.Select`, `dddw`, `dddw.name`) y `src/server/features/dataWindowPropertyPaths.ts` reconsume ese dominio para completion/hover/definition/diagnostics sobre `Describe/Modify/Object`;
- `src/server/knowledge/system/manual/datawindow/dataWindowExpressionFunctions.ts` publica la lista oficial de `datawindow-expression-functions` a partir de la referencia Appeon 2025, con namespace `datawindow-expression`, source URLs oficiales y separación explícita respecto a PowerScript general;
- `src/server/knowledge/system/manual/index.ts`, `src/server/knowledge/system/services/queryService.ts` y `src/server/knowledge/system/SystemCatalog.ts` indexan y exponen ambos dominios dentro de `manual-core` sin scans globales ni registries paralelos;
- `src/server/features/completion.ts` consume `datawindow-expression-functions` sólo en expresiones `.srd`, mientras `specs/387-datawindow-expression-property-catalog/` deja la traza SDD mínima de `B320` ya cerrada.

**Validación registrada:**
- `npm run test:unit -- --grep "systemCatalog"`
- `npm run build:test ; npx vscode-test --label unit --grep "debe ofrecer completion segura dentro de Modify para una ruta DataWindow resoluble" ; npx vscode-test --label unit --grep "provideHover resuelve Describe\(DataWindow.Table.Select\) usando el DataObject enlazado" ; npx vscode-test --label unit --grep "provideDefinition navega Modify\(state_id.dddw.name\) al DataWindow hijo verificado" ; npx vscode-test --label unit --grep "validateSemantics avisa cuando una ruta DataWindow completa no es resoluble sobre un root ya enlazado"`
- `npm run build:test ; npx vscode-test --label unit --grep "datawindow-expression-functions publica el catálogo oficial y separa CurrentRow de PowerScript general" ; npx vscode-test --label unit --grep "debe ofrecer completion segura dentro de expresiones DataWindow en .srd"`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/testing.md`
- `docs/developer-workflows.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.138 B381. AI task context bundle orchestration tool — **Cerrada (AI supportability/context orchestration 2026-05)**

**Objetivo:** añadir una surface read-only compacta que orqueste contexto IA local sobre las surfaces ya cerradas (`workspace-check`, `object-check`, `currentObjectContext`, `safeEditPlan`, `dependencyGraph`, `explain-diagnostic`, `explain-system-symbol`) con budget explícito y `omissions` honestas.

**Resultado registrado:**
- `src/shared/publicApi.ts` publica `ApiAiTaskContextBundleRequest`, `ApiAiTaskContextBundle`, el tool `ai-task-context-bundle`, el método público `getAiTaskContextBundle()` y la versión `2.18.0` del contrato para el bridge read-only y la API pública;
- `src/client/aiTaskContextBundle.ts` introduce el builder puro del bundle con defaults por `intent`, estimate conservador de tokens, prioridades de secciones, truncado explícito y degradación a bundle mínimo cuando el presupuesto es extremo;
- `src/client/extension.ts` y `src/client/commandRegistration.ts` cablean el método público, el tool bridge y el comando `powerbuilder.exportAiTaskContextBundle`, componiendo surfaces read-only existentes sin abrir un motor semántico paralelo ni mover datasets completos al prompt;
- `specs/386-ai-task-context-bundle/` deja la traza SDD mínima de `B381` con `spec.md`, `plan.md` y `tasks.md` ya cerradas.

**Validación registrada:**
- `npm run test:unit -- --grep "aiTaskContextBundle"`
- `npm run test:unit -- --grep "aiTaskContextBundle|publicApi"`
- `npm run test:smoke -- --grep "ai task context bundle expone metodo, tool read-only y comando oculto"`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/ai-orchestrator.md`
- `docs/ai-strategy.md`
- `docs/developer-workflows.md`
- `docs/testing.md`
- `docs/ai-context/powerbuilder-plugin-context.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.137 B380. Explain system symbol and catalog lookup tool for AI — **Cerrada (catalog/AI supportability 2026-05)**

**Objetivo:** añadir una surface read-only compacta para explicar símbolos del catálogo PowerBuilder con signatures, ownerTypes, provenance y localización opcional sin cargar `generated/manual/localization` completos al prompt ni mover serving al cliente.

**Resultado registrado:**
- `src/shared/publicApi.ts` publica `ApiExplainSystemSymbolRequest`, `ApiExplainSystemSymbolReport`, el tool `explain-system-symbol`, el método público `explainSystemSymbol()` y la versión `2.17.0` del contrato para el bridge read-only y la API pública;
- `src/server/features/explainSystemSymbol.ts` introduce el builder server-side sobre `SystemCatalog` + `documentationService`, con dedupe por familia semántica para overlays manual/generated, resolución `resolved|ambiguous|unresolved`, signatures, enum info, findings y fallback localizado `es -> en`;
- `src/server/handlers/reportCommandHandlers.ts` y `src/server/handlers/lifecycleHandlers.ts` cablean el comando `powerbuilder.explainSystemSymbol` como carril server-side reutilizable, mientras `src/client/extension.ts`, `src/client/commandRegistration.ts`, `src/client/explainSystemSymbolReport.ts` y `package.json` exponen el método público, el tool bridge y la UX `PowerSyntax: Explain System Symbol at Cursor` sin exportar el catálogo completo ni duplicar serving;
- `specs/385-explain-system-symbol-contract/` deja la traza SDD mínima de `B380` con `spec.md`, `plan.md` y `tasks.md` ya cerradas.

**Validación registrada:**
- `npm run test:unit -- --grep "explainSystemSymbol"`
- `npm run test:unit -- --grep "explainSystemSymbol|publicApi"`
- `npm run test:smoke -- --grep "explain system symbol expone tool read-only y reporte markdown"`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/testing.md`
- `docs/developer-workflows.md`
- `docs/ai-orchestrator.md`
- `docs/ai-context/powerbuilder-plugin-context.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.136 B379. Explain diagnostic tool and suggested safe fix contract — **Cerrada (diagnostics/AI supportability 2026-05)**

**Objetivo:** añadir una surface read-only compacta para explicar un diagnostic concreto con evidencia mínima, `reasonCode` y safe fix sugerido cuando el runtime ya lo pudiera defender, sin releer archivos completos ni abrir un segundo motor de diagnostics.

**Resultado registrado:**
- `src/shared/publicApi.ts` publica `ApiExplainDiagnosticRequest`, `ApiExplainDiagnosticReport`, el tool `explain-diagnostic`, el método público `explainDiagnostic()` y la versión `2.16.0` del contrato para el bridge read-only y la API pública;
- `src/client/explainDiagnosticReport.ts` introduce el builder puro del report con selección determinista por posición/código/`diagnosticIndex`, explicaciones compactas por `diagnostic.code`, evidencia mínima, Markdown `# Explain Diagnostic` y safe fix read-only derivado de `safeEditPlan` cuando aplica;
- `src/client/extension.ts`, `src/client/commandRegistration.ts` y `package.json` cablean el dispatch `powerbuilder.explainDiagnostic`, el wrapper UX `vscPowerSyntax.openExplainDiagnostic` y la apertura Markdown sobre diagnostics ya publicados por VS Code, `currentObjectContext` y `safeEditPlan` sin abrir un carril semántico paralelo;
- `src/client/diagnosticsExplainabilityPanelModel.ts` reutiliza ya `describeExplainableDiagnostic()` desde el builder nuevo, evitando duplicar heurística entre el panel explainability y la surface contractual nueva;
- `specs/384-explain-diagnostic-contract/` deja la traza SDD mínima de `B379` con `spec.md`, `plan.md` y `tasks.md` ya cerradas.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit -- --grep "explainDiagnosticReport|diagnosticsExplainabilityPanelModel|publicApi"`
- `npm run test:smoke -- --grep "explain diagnostic expone tool read-only y reporte markdown"`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/testing.md`
- `docs/developer-workflows.md`
- `docs/ai-orchestrator.md`
- `docs/rules-catalog.md`
- `docs/ai-context/powerbuilder-plugin-context.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.135 B378. AI PowerBuilder context pack and token budget contract — **Cerrada (AI supportability/context budget 2026-05)**

**Objetivo:** crear un context pack compacto, estable y versionado para que tareas IA sobre el plugin puedan arrancar con arquitectura, reglas PowerBuilder, validación y ownership documental sin arrastrar documentación masiva ni datasets completos al prompt.

**Resultado registrado:**
- `docs/ai-context/powerbuilder-plugin-context.md` fija ya el pack corto del repositorio con misión, boundaries, reglas PowerBuilder/SQL/DataWindow, policy de catálogo/localización, comandos de validación, workflow recomendado, `do not do`, foco activo y ownership documental, enlazando siempre a la documentación propietaria en vez de duplicarla;
- `docs/ai-strategy.md`, `docs/ai-orchestrator.md`, `docs/ai-agents-catalog.md`, `docs/developer-workflows.md`, `docs/spec-driven-development.md` y `AGENTS.md` referencian ya ese pack como entrada corta para tareas IA con budget reducido, dejando explícito que la autoridad sigue en constitución/arquitectura/current-focus y resto de docs canónicas;
- `test/server/unit/aiContextDocs.test.ts` detecta si el pack desaparece, pierde headings mínimos, deja de mencionar `workspace-check`/`object-check`, crece más allá de un budget razonable o queda sin referencias desde la documentación canónica;
- `specs/383-ai-context-pack-contract/` deja la traza SDD mínima de `B378` con `spec.md`, `plan.md` y `tasks.md`, respetando la numeración secuencial de specs y evitando reutilizar la carpeta histórica `specs/378-*`.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit -- --grep "docs|ai-context|context-budget|documentation"`
- `npm run test:unit -- --grep "aiContextDocs|documentationService|documentationLocale"`

**Documentación alineada:**
- `docs/ai-context/powerbuilder-plugin-context.md`
- `docs/ai-strategy.md`
- `docs/ai-orchestrator.md`
- `docs/ai-agents-catalog.md`
- `docs/developer-workflows.md`
- `docs/spec-driven-development.md`
- `docs/testing.md`
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/done-log.md`
- `AGENTS.md`

## 1.134 B375. Generated localization compatibility with regenerated catalog IDs — **Cerrada (localization/generated compatibility 2026-05)**

**Objetivo:** garantizar que los overlays localizados sobreviven a regeneraciones del catálogo `generated` cuando la identidad semántica sigue siendo recuperable por `targetKey`, y que el drift residual quede visible y migrable fuera del hot path.

**Resultado registrado:**
- `src/server/knowledge/system/localization/localizationResolver.ts` deja de tratar un `targetId` obsoleto como huérfano automático cuando `targetKey` todavía resuelve un target canónico único, recupera la overlay sobre ese target y publica el caso como `recoveredTargetIds` en lugar de esconderlo o romper serving silenciosamente;
- `src/server/knowledge/system/localization/types.ts`, `index.ts` y `src/server/knowledge/system/consistency.ts` exponen ya `recoveredTargetIds` dentro del audit de `localization`, de forma que el drift recuperable y el drift irrecuperable queden diferenciados contractualmente;
- `scripts/generate_catalog_localization_report.cjs` muestra `recoveredTargetIds` en el snapshot JSON/Markdown y `scripts/migrate_catalog_localization_target_ids.cjs`, expuesto por `npm run migrate:catalog-localization-target-ids`, deja un plan/aplicación offline para reconciliar `targetId` fuente cuando el fallback por `targetKey` ya ha recuperado la identidad nueva;
- `docs/localization.md` fija la policy operativa: `targetId` para entries estables, `targetKey` para recuperación y authoring sobre dominios/generated en evolución, y ambos cuando se quiera drift explícito más ruta segura de migración.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogLocalization|catalogConsistency"`
- `npm run report:catalog-localization`
- `npm run migrate:catalog-localization-target-ids`

**Documentación alineada:**
- `README.md`
- `docs/localization.md`
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/done-log.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/rules-catalog.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 1.133 B374. Spanish catalog localization authoring workflow and coverage gate — **Cerrada (localization/authoring workflow 2026-05)**

**Objetivo:** convertir el rail español de localización documental en un workflow gobernable: cobertura por dominio, detección de overlays incompletos o mal anclados y guía explícita para ampliar traducciones sin drift ni regresiones en producto visible.

**Resultado registrado:**
- `src/server/knowledge/system/localization/localizationResolver.ts`, `types.ts` e `index.ts` publican ya cobertura por dominio (`domainCoverage`), overlays incompletos (`missingFields`) e intentos de traducir anchors técnicos (`invalidParameterTargets`) sobre targets canónicos del catálogo, manteniendo el audit fuera del hot path de hover/completion/signatureHelp;
- `src/server/knowledge/system/consistency.ts` incorpora ese audit ampliado dentro de `buildCatalogConsistencyReport().localization`, de modo que authoring roto o traducciones de `signatureLabel`/`parameterName` fallen como problema de gobernanza del catálogo antes de llegar a los consumers visibles;
- `scripts/generate_catalog_localization_report.cjs`, `package.json` y `artifacts/catalog/catalogLocalizationReport.generated.{json,md}` dejan un workflow determinista para generar snapshots del estado `es` por dominio, reviewed coverage y issues pendientes;
- `docs/localization.md` fija ya el orden incremental de traducción, la guía de estilo, la rutina de authoring y las salidas esperadas del reporte, apoyándose en la primera tanda revisada que ya vivía en `src/server/knowledge/system/localization/es/generatedFunctionLocalization.ts`.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogLocalization|catalogConsistency"`
- `npm run report:catalog-localization`

**Documentación alineada:**
- `README.md`
- `docs/localization.md`
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/done-log.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/rules-catalog.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 1.132 B373. Localized catalog consumers for hover, completion and signatureHelp — **Cerrada (language services/localized consumers 2026-05)**

**Objetivo:** hacer visible el rail de localización documental en producto real, integrando `DocumentationService` en hover, completion y signatureHelp sin traducir identidad semántica, sin duplicar lógica por consumer y sin introducir coste interactivo apreciable.

**Resultado registrado:**
- `src/server/features/hover.ts`, `completion.ts` y `signatureHelp.ts` consumen ya `DocumentationService` con locale explícita, conservan títulos, labels y firmas originales, y limitan la localización a `summary/documentation/usageNotes/obsoleteMessage/return docs/parameter docs` en la capa visible del consumer;
- `src/server/knowledge/system/localization/documentationLocale.ts`, `localizationResolver.ts` y `documentationService.ts` fijan `auto|en|es`, fallback `auto -> locale de VS Code -> en`, alias canónicos manual/generated para overlays por sibling del mismo bucket lógico y fallback O(1) por nombre de parámetro único cuando la firma visible no coincide exactamente con el `signatureLabel` del overlay;
- `src/client/extension.ts`, `src/server/handlers/lifecycleHandlers.ts`, `src/server/handlers/featureHandlers.ts`, `src/server/server.ts`, `src/shared/types.ts` y `package.json` publican y cablean la setting `vscPowerSyntax.languageServices.documentationLocale`, sincronizan la configuración al servidor y segregan `ServingCache` por locale efectiva para hover/completion/signatureHelp;
- `test/server/unit/documentationLocale.test.ts`, junto con nuevas pruebas focales en `hover.test.ts`, `completion.test.ts` y `signatureHelp.test.ts`, fija rendering localizado visible, fallback de locale, ausencia de duplicados por idioma y mantenimiento del guard de hot path.

**Validación registrada:**
- `npm run test:unit -- --grep "documentationLocale|localiza"`
- `npm run test:unit -- --grep "hotPathAllocationBudget"`

**Documentación alineada:**
- `README.md`
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 1.131 B372. DocumentationService locale-aware lazy resolver — **Cerrada (knowledge/localized documentation serving 2026-05)**

**Objetivo:** crear una capa de serving documental locale-aware, reutilizable y barata que resuelva textos visibles del system catalog sobre una entry ya resuelta, con fallback seguro `es -> en` y sin scans globales ni merges por idioma en startup.

**Resultado registrado:**
- `src/server/knowledge/system/localization/documentationService.ts` publica `DocumentationLocale`, `createDocumentationService()` y los helpers `getDisplaySummary|getDisplayDocumentation|getDisplayUsageNotes|getDisplayObsoleteMessage|getDisplayReturnDocumentation|getDisplayParameterDocumentation`, todos apoyados en lookup O(1) por `entry.id` sobre el índice de `B371` y sin mutar `PbSystemSymbolEntry`;
- el servicio cachea de forma lazy la documentación de parámetros por entry y por overlay, reutiliza referencias existentes para `usageNotes` cuando no necesita materializar copias y mantiene el fallback al texto oficial inglés cuando falta overlay español;
- `src/server/knowledge/system/localization/index.ts` deja el servicio exportado como rail reusable para `hover`, `completion` y `signatureHelp` sin tocar todavía los consumers finales;
- `test/server/unit/documentationService.test.ts`, junto con `catalogLocalization` y el guard de hot path, fija prioridad del overlay español, fallback al texto original, soporte de overlays por `targetId`/`targetKey` y ausencia de drift en el carril interactivo.

**Validación registrada:**
- `npm run test:unit -- --grep "documentationService|catalogLocalization|catalogConsistency"`
- `npm run test:unit -- --grep "hotPathAllocationBudget"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/performance-budget.md`

## 1.130 B371. Catalog localization model and immutable overlay contract — **Cerrada (knowledge/catalog localization base 2026-05)**

**Objetivo:** fijar un modelo ligero e inmutable de localización documental para el system catalog sin duplicar símbolos por idioma, sin mutar el texto oficial de `generated` y dejando trazable cualquier drift del rail localizado.

**Resultado registrado:**
- `src/server/knowledge/system/types.ts` y `src/server/knowledge/system/localization/types.ts` publican el contrato de overlays localizados (`PbCatalogLocale`, `PbLocalizedText`, documentación de parámetros y return codes, `targetId/targetKey`, `reviewed/source`) y acotan explícitamente qué campos pueden traducirse y cuáles nunca deben tocar la identidad semántica;
- `src/server/knowledge/system/localization/localizationResolver.ts`, junto con `src/server/knowledge/system/localization/es/`, introduce un índice español parcial y un resolvedor memoizado que enlaza overlays por `targetId` o `targetKey` contra la entry canónica del bucket runtime, alineado con la policy `generated-primary-with-manual-overlays` y sin merges globales por idioma;
- `src/server/knowledge/system/consistency.ts` añade `localization` al audit del catálogo para publicar `locales` y `orphanOverlays`, de modo que cualquier overlay sin target resoluble quede visible como problema de gobernanza antes de llegar a hover/completion/signatureHelp;
- `test/server/unit/catalogLocalization.test.ts` y `test/server/unit/catalogConsistency.test.ts`, apoyados por `catalogAdoptionDecision` y `systemCatalogQueryHardening`, fijan la preservación del summary oficial en inglés, la ausencia de huérfanos en el rail `es` inicial y la resolución estable por `targetId/targetKey`.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogLocalization|catalogConsistency|catalogAdoptionDecision|systemCatalogQueryHardening"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/rules-catalog.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 1.129 B377. Current object/class check command and AI-readable validation report — **Cerrada (workflow/object-level validation 2026-05)**

**Objetivo:** añadir un chequeo consolidado del objeto actual o resuelto por nombre como tool/API/comando read-only para que usuario y agentes puedan decidir cambios locales con una sola llamada defendible.

**Resultado registrado:**
- `src/shared/publicApi.ts` publica `object-check`, `checkObject()`, `powerbuilder.checkCurrentObject` y los schemas `ApiObjectCheckRequest`, `ApiObjectCheckFinding`, `ApiObjectCheckSummary` y `ApiObjectCheckReport` como contrato estable del bridge read-only y la API pública;
- `src/client/objectCheckReport.ts` compone el reporte local del objeto sobre `currentObjectContext`, `dependencyGraph`, `impactAnalysis` y `safeEditPlan`, con source resolution por editor/URI/nombre, findings AI-readable, truncado honesto y Markdown `# Object Check`;
- `src/client/extension.ts`, `src/client/commandRegistration.ts` y `package.json` cablean el método público, el tool dispatch y los comandos `vscPowerSyntax.openCurrentObjectCheck` / `vscPowerSyntax.openObjectCheck`, manteniendo el slice completamente read-only y sin abrir un motor semántico paralelo;
- `test/server/unit/objectCheckReport.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan objeto sano, diagnostics bloqueantes, dependencias ambiguas, bindings DataWindow missing, SQL `EXECUTE` y el wiring real del tool/comando Markdown.

**Validación registrada:**
- `npm run test:unit -- --grep "publicApi|objectCheckReport"`
- `npm run test:smoke -- --grep "object check expone tool read-only y reporte markdown"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/developer-workflows.md`

## 1.128 B376. Workspace check command and AI-readable validation report — **Cerrada (workflow/read-only validation 2026-05)**

**Objetivo:** añadir un chequeo consolidado del workspace como tool/API/comando read-only para que usuario y agentes puedan responder con una sola llamada qué errores, bloqueos y señales relevantes publica ya el plugin.

**Resultado registrado:**
- `src/shared/publicApi.ts` publica `workspace-check`, `checkWorkspace()`, `powerbuilder.checkWorkspace` y los schemas `ApiWorkspaceCheckRequest`, `ApiWorkspaceCheckFinding`, `ApiWorkspaceCheckCatalogSummary` y `ApiWorkspaceCheckReport` como contrato estable del bridge read-only y de la API pública;
- `src/client/workspaceCheckReport.ts` introduce el builder puro del reporte con modos `quick/full/catalog/diagnostics`, findings AI-readable, truncado honesto, acciones recomendadas y render Markdown `# Workspace Check` para producto y handoff de agentes;
- `src/client/extension.ts`, `src/client/commandRegistration.ts` y `package.json` cablean el método público, el tool dispatch, el comando `vscPowerSyntax.openWorkspaceCheck` y la composición read-only sobre surfaces existentes, paralelizando secciones opcionales y evitando bloquear la apertura del preview Markdown;
- `src/server/features/workspaceCheckCatalogSummary.ts`, `src/server/handlers/reportCommandHandlers.ts` y `src/server/handlers/lifecycleHandlers.ts` añaden un summary ligero y memoizado del system catalog para el hot path del check, sin reutilizar el reporte completo de adopción de `B369`.

**Validación registrada:**
- `npm run test:unit -- --grep "publicApi|workspaceCheckReport"`
- `npm run test:smoke -- --grep "workspace check expone tool read-only y reporte markdown"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/developer-workflows.md`

## 1.127 B369. Generated-vs-manual catalog adoption decision gate — **Cerrada (knowledge/source-of-truth decision 2026-05)**

**Objetivo:** decidir con métricas reales si el source-of-truth operativo del system catalog debía quedar en `generated`, en `manual-core` o en un híbrido por dominio antes de seguir ampliando localización y consumers.

**Resultado registrado:**
- `src/server/knowledge/system/consistency.ts` deja de ser solo un guard estructural y publica `adoption`, un reporte comparativo con métricas globales y por dominio para `generated` frente a `manual-core`, incluyendo `officialCount`, `generatedCount`, `manualCount`, `duplicateCount`, overlays, `scraperErrorCount`, calidad de signatures/appliesTo/ownerTypes/returnType/eventId/parameterDocs y política recomendada;
- el summary vigente fija `officialCount = 6601`, `generatedCount = 2146`, `manualCount = 1039`, `duplicateCount = 695`, `gapCount = 343`, `overrideCount = 1`, `enrichmentCount = 695`, `candidateCount = 0` y `scraperErrorCount = 0`, con `officialDomainsWithGaps = []` y recomendación `generated-primary-with-manual-overlays`;
- `test/server/unit/catalogAdoptionDecision.test.ts` y `test/server/unit/catalogConsistency.test.ts` convierten esa decisión en un gate verificable, fijando que el policy baseline siga siendo `generated` como base oficial con overlays manuales explícitos y excepciones solo para dominios sin rail oficial (`datawindow-events`, `operators`, `pronouns`, `system-globals`);
- `docs/adr/ADR-0001-system-catalog-source-of-truth.md` deja la decisión arquitectónica cerrada, con contexto, opciones evaluadas, evidencia cuantitativa, consecuencias, plan de migración y rollback.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogConsistency|catalogAdoptionDecision"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`
- `docs/adr/ADR-0001-system-catalog-source-of-truth.md`

## 1.126 B368. Manual curated overlays, gaps and overrides policy — **Cerrada (knowledge/manual overlay governance 2026-05)**

**Objetivo:** redefinir `manual/` para que no compita silenciosamente con `generated`, sino que actúe como capa explícita de `gaps`, `enrichments`, `overrides` y `candidates` sobre el catálogo oficial ya completo.

**Resultado registrado:**
- `src/server/knowledge/system/types.ts`, `normalization.ts` y `manual/common.ts` publican `manualOverlay` como metadata contractual de entry con `mode`, `targetId/targetKey`, `reason`, `evidence`, `sourceUrl` y `reviewedBy` normalizados;
- `src/server/knowledge/system/registry/registry.ts` clasifica automáticamente `manual-core` frente a `generated`: los overlaps lógicos pasan por defecto a `enrichment`, las ausencias reales quedan como `gap` y los casos curados explícitos como `Clipboard` se publican como `override`;
- `src/server/knowledge/system/consistency.ts` y `test/server/unit/catalogConsistency.test.ts` endurecen el catálogo contra overlaps manual/generated sin overlay explícito y publican contadores por `manualOverlay.mode` para que la gobernanza del rail curado sea auditable;
- `src/server/knowledge/system/services/queryService.ts` hace explícita la merge policy provisional del hot path: `override` manual gana, `generated` sigue siendo la base cuando existe counterpart oficial y los `enrichment` se fusionan sobre esa base, mientras `candidate` queda fuera de las listas/resoluciones interactivas.

**Validación registrada:**
- `npm run test:unit -- --grep systemCatalogQueryHardening`
- `npm run test:unit -- --grep "catalogV2|catalogConsistency|catalogProvenanceAudit"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`

## 1.125 B367. Generated catalog as complete official source v2 — **Cerrada (knowledge/generated source-of-truth 2026-05)**

**Objetivo:** convertir `generated` desde un dataset de huecos filtrado por `manual-core` a un catálogo official completo, medible y comparable por dominio antes de redefinir overlays manuales o decisiones de adopción runtime.

**Resultado registrado:**
- `script/generate_official_function_catalog.cjs` publica ya `generated` en modo `complete` por defecto y deja `gap-fill` solo como compatibilidad explícita; `officialCoverage.generated.ts` pasa a ser comparativo y `generatedCompleteness.generated.ts` mide exclusivamente lo emitido por `generated`;
- `src/server/knowledge/system/generated/generated.generated.ts` incorpora `PB_GENERATED_DATATYPES`, mantiene completos los dominios oficiales incluidos y fusiona overloads oficiales con identidad lógica repetida antes de materializar el dataset, evitando `duplicateIds` intradataset en runtime;
- `src/server/knowledge/system/registry/datasets.ts` registra el nuevo slice `generated` de `datatypes`, mientras la medición de `object-functions` deja de contar la superficie específica de DataWindow que ya pertenece a `datawindow-functions`;
- `generatedCompleteness.generated.ts` queda con `missingCount = 0` en `global-functions`, `object-functions`, `datawindow-functions`, `keywords`, `reserved-words`, `datatypes`, `enumerated-types`, `enumerated-values`, `system-object-datatypes`, `system-events` y `statements`.

**Validación registrada:**
- `node ./script/generate_official_function_catalog.cjs`
- `npm run test:unit -- --grep catalogGeneratorScript`
- `npm run test:unit -- --grep catalogV2`
- `npm run test:unit -- --grep catalogConsistency`
- `npm run test:unit -- --grep catalogProvenanceAudit`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`

## 1.124 B370. Generated catalog regression fixtures and extraction quality gate — **Cerrada (knowledge/generator regression gate 2026-05)**

**Objetivo:** congelar el layout crítico del scraper oficial en fixtures offline revisables para que cambios futuros del extractor no vuelvan a depender de HTML vivo ni reabran silenciosamente el baseline oficial de `B366`.

**Resultado registrado:**
- `test/fixtures/catalog-generator/` introduce ocho snapshots compactos `.html` + `.expected.json` para `ApplyTheme`, `AddItemArray`, `SetItemDate`, `OLEActivate`, `BeginDrag`, `DragDrop`, `PDFDocumentProperties` y `xREF_80481_Reserved_words`, dejando diffs localizados por caso y sin mirror completo de la documentación externa;
- `test/server/unit/catalogGeneratorScript.test.ts` sube a `22 passing` y compara el output del extractor contra JSON compacto para `returnType/returnDocumentation`, `usageNotes`, signatures DW, `eventId/eventIds`, owner mappings, `baseType/properties/functions/events` e `identifierPolicy` de reserved words, todo sin tocar red;
- `script/generate_official_function_catalog.cjs` publica ya `usageNotes` cuando la referencia oficial tiene sección `Usage`, y la regeneración real vuelve a materializar `generated.generated.ts` con el extractor endurecido sin romper el baseline runtime del catálogo;
- `catalogV2`, `catalogConsistency` y `catalogProvenanceAudit` se revalidan tras la regeneración, dejando listo el siguiente cambio de source-of-truth de `B367` sobre un rail regresivo ya estabilizado.

**Validación registrada:**
- `node ./script/generate_official_function_catalog.cjs`
- `npm run test:unit -- --grep catalogGeneratorScript`
- `npm run test:unit -- --grep catalogV2`
- `npm run test:unit -- --grep catalogConsistency`
- `npm run test:unit -- --grep catalogProvenanceAudit`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 1.123 B366. Official Appeon scraper bugfixes and structural enrichment v2 — **Cerrada (knowledge/generator baseline 2026-05)**

**Objetivo:** corregir fallos estructurales del scraper oficial de Appeon y subir el techo real del catálogo `generated` con metadata explotable para runtime/hover/completion sin vender todavía `generated` como source-of-truth completo.

**Resultado registrado:**
- `script/generate_official_function_catalog.cjs` endurece el extractor oficial con reuse de tablas anónimas bajo `Syntax`, parsing de `returnType/returnDocumentation`, `eventId/eventIds`, metadata estructural de reserved words y headings `Properties/Events/Functions` compatibles con anchors inline del layout real de Appeon;
- el rail `system-object-datatypes` ya publica overlays oficiales ricos incluso para tipos ya presentes en `manual-core`, incluyendo `baseType`, `properties`, `functions` y `events`; `src/server/knowledge/system/generated/generated.generated.ts` materializa de forma verificable casos como `PDFDocumentProperties` con `baseType: "PDFModel"`, propiedades `Application/Author/Keywords/Subject/Title`, funciones heredadas/runtime y eventos `Constructor/Destructor`;
- `AddItemArray` queda ya publicado en el catálogo real con cuatro signatures y parámetros estructurados (`ParentItemHandle`, `ParentItemPath`, `Key`) más `returnType: "Long"` y documentación de retorno oficial;
- `src/server/knowledge/system/services/queryService.ts` prioriza el overlay oficial enriquecido de `system-object-datatypes` en `resolveDatatype()` y `resolveLanguageSymbol()` cuando aporta más estructura que la entrada curada base, evitando que tipos runtime como `PDFDocumentProperties` sigan resolviendo sólo contra la versión manual mínima.

**Validación registrada:**
- `node ./script/generate_official_function_catalog.cjs`
- `npm run test:unit -- --grep catalogGeneratorScript`
- `npm run test:unit -- --grep "catalogV2|catalogConsistency|catalogProvenanceAudit"`

**Documentación alineada:**
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 1.122 B329. Catalog-driven semantic tokens integration — **Cerrada (spec 382, catalog-driven-semantic-tokens-fast-path 2026-05)**

**Objetivo:** consumir metadata del catálogo en semantic tokens para colorear símbolos seguros del runtime sin depender siempre del lookup semántico general ni introducir trabajo caro por token.

**Resultado registrado:**
- `src/server/features/semanticTokens.ts` añade un fast path catalog-driven para `keywords`, `reserved-words`, `datatypes`, `enumerated-types`, `system-globals`, `pronouns` y `global-functions` mediante resolutores directos de `SystemCatalog` cuando no hay qualifier;
- la leyenda pública incorpora `keyword` y mantiene `enumMember`, mientras los símbolos del default library siguen usando modifiers compatibles (`defaultLibrary`, `global`) sin clonar catálogos ni escanear dominios completos por token;
- `test/server/unit/semanticTokens.test.ts` fija el caso catalog-driven con `IF`, `IsValid`, `SQLCA` y `This`, y `test/server/unit/hotPathAllocationBudget.test.ts` confirma que el hot path interactivo sigue sin serializar JSON ni clonar catálogos globales completos por inercia;
- el foco operativo del bloque sube a `B366`, porque `B370`, `B367`, `B368` y la cadena de localización exigen primero metadata oficial enriquecida del scraper.

**Validación registrada:**
- `npm run test:unit -- --grep "catalog-driven"`
- `npm run test:unit -- --grep "Semantic Tokens"`
- `npm run test:unit -- --grep hotPathAllocationBudget`

## 1.121 B353. Large-file regression guard and architecture metrics — **Cerrada (spec 381, architecture-hotspot-guard 2026-05)**

**Objetivo:** añadir un guard reproducible de tamaño, imports y responsibility drift para los hotspots TypeScript del repo, separando los hosts críticos del cliente/servidor de los slices generated/manual grandes del catálogo.

**Resultado registrado:**
- `tools/run-architecture-hotspot-guard.mjs` publica el lane `npm run test:architecture:metrics`, genera `artifacts/performance/architecture-hotspot-guard.json` y mide `lines`, `imports` y `topLevelDeclarations` sobre `src/client/extension.ts`, `src/server/server.ts` y `src/client/commandRegistration.ts`;
- el guard mantiene una allowlist explícita para `src/server/knowledge/system/generated/generated.generated.ts`, `src/server/knowledge/system/manual/core/objectFunctions.ts`, `src/server/knowledge/system/manual/datawindow/dataWindowFunctions.ts`, `src/server/knowledge/system/manual/language/enumerations/index.ts`, `src/server/knowledge/system/manual/core/globalFunctions.ts` y `src/server/knowledge/system/manual/core/systemEvents.ts`, con budgets propios y warnings a partir del `90%` del umbral;
- `test/server/unit/architectureImports.test.ts` sigue fijando el firewall por capas y ahora ejecuta además el runner, dejando una única suite focal para imports + budgets de hotspots;
- el baseline actual deja `9` hotspots trazados, `6` allowlisted, `0` failing hotspots y `4` warnings (`extension.ts`, `generated.generated.ts`, `objectFunctions.ts`, `dataWindowFunctions.ts`) sin abrir todavía una refactorización estructural masiva.

**Validación registrada:**
- `npm run test:unit -- --grep architectureImports`
- `npm run test:architecture:metrics`

## 1.120 B364. Enum catalog real-corpus validation against PFC, STD and public PB repositories — **Cerrada (spec 380, enum-real-corpus-validation 2026-05)**

**Objetivo:** validar el catálogo de enumerated types/values contra corpora reales PowerBuilder sin convertir PFC/STD/public dumps en autoridad de catálogo, separando valores catalogados, unknown, falsos positivos textuales y casos fuera de contexto.

**Resultado registrado:**
- `src/server/features/catalogCorpusValidation.ts` publica `collectEnumCatalogCorpusUsageObservations()` y `buildEnumCatalogCorpusUsageReport()` para escanear valores con `!` sobre texto enmascarado y clasificarlos como `official-known`, `curated-known`, `candidate`, `false-positive`, `out-of-context` o `unknown`;
- `test/server/unit/catalogCorpusValidation.test.ts` fija el builder y la clasificación sintética, y `test/server/performance/enumCatalogCorpusValidation.smoke.test.ts` recorre PFC Solution, STD_FC_OrderEntry y legacy PBL dump con breakdown por corpus;
- la evidencia real actual queda trazada en `13068` ocurrencias con `!`: `1554` catalogadas (`724` oficiales, `830` curadas), `5296` unknown, `6214` false positives, `4` out-of-context y `0` candidates;
- no se añadió ningún unknown al catálogo. Las familias detectadas (`contemporarymenu!`, `contemporarytoolbar!`, `HourGlass!`, `OK!`, `Information!`, `Exclamation!`, `ansi!`, `swiss!`, `Exclude!`) quedan encaminadas a `B368/B370` como gaps/candidates/fixtures futuros.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogCorpusValidation"`
- `npm run test:performance -- --grep "enumCatalogCorpusValidation|PFC/OrderEntry/legacy"`
- `npm run test:unit -- --grep "enumerated|enum|catalog"`
- `npm run test:performance -- --grep "PFC|OrderEntry|STD"`

## 1.119 B356. PFC/STD rapid validation gate for architecture refactors — **Cerrada (spec 379, pfc-std-rapid-validation-gate 2026-05)**

**Objetivo:** convertir las suites reales de PFC Workspace/Solution y STD_FC_OrderEntry en un gate corto, reproducible y documentado para refactors arquitectónicos, con skip honesto cuando los corpus no estén disponibles localmente.

**Resultado registrado:**
- `tools/run-architecture-rapid-gate.mjs` detecta disponibilidad de `fixtures-local/pfc/2025-Workspace`, `fixtures-local/pfc/2025-Solution` y `fixtures-local/STD_FC_OrderEntry`, recompila cliente/tests y ejecuta las suites smoke/performance reales ya existentes bajo greps controlados;
- `package.json` publica el lane estable `npm run test:architecture:rapid` y el runner deja evidencia en `artifacts/performance/architecture-rapid-gate.json` con estados `passed`, `passed-with-skips` o `skipped`;
- el gate reutiliza `smoke/pfc-workspace-extension`, `smoke/pfc-solution-extension`, `performance/pfc-workspace`, `performance/pfc-workspace-smoke`, `performance/pfc-solution-smoke`, `performance/orderentry`, `performance/orderentry-smoke` y `performance/orderentry-semantic`, sin duplicar suites ni helpers;
- `docs/testing.md`, `docs/performance-budget.md`, `test/corpora/README.md`, backlog y current-focus quedan alineados para que `B364` vuelva a ser el foco funcional inmediato ya sin validación arquitectónica ad hoc.

**Validación registrada:**
- `npm run test:architecture:rapid`

## 1.118 B346. Client activation and command registration boundaries — **Cerrada (spec 378, client command registration and lazy view activation 2026-05)**

**Objetivo:** reducir `src/client/extension.ts` separando el wiring de comandos del cliente y quitando del hot path de activación superficies de UI que no deben materializarse eagerly, sin romper command IDs, API pública ni restart semantics.

**Resultado registrado:**
- `src/client/commandRegistration.ts` centraliza el registro de comandos por dominios (`core`, panels, reports, status, build/ORCA y support/maintenance), dejando `src/client/extension.ts` como host de lifecycle, bridge y handlers ligeros;
- `src/client/extension.ts` mueve el wiring inline de jerarquía/paneles a helpers nombrados y pasa `PowerBuilderObjectExplorerController`, `CurrentObjectContextPanelController` y `DiagnosticsExplainabilityPanelController` a inicialización bajo demanda mediante `ensure*Controller()`;
- la API pública exportada mantiene su contrato versionado pero deja de materializarse eagerly durante el cold start del módulo cliente;
- `docs/architecture.md`, `docs/testing.md`, `docs/performance-budget.md`, `docs/current-focus.md` y el backlog canónico quedan alineados para que el siguiente cierre operativo pase a `B356` como gate previo a `B364`.

**Validación registrada:**
- `npm run compile`
- `npm run test:unit -- --grep architectureImports`
- `npm run test:smoke -- --grep "la extensión se activa en menos de 500ms"`
- `npx vscode-test --label smoke --grep 'runtime self-test|settings governance|restartServer|PBAutoBuild|ORCA legacy|dashboard de salud|Object Explorer|Current Object Context'`

## 1.1 P0 — Base inmediata de descubrimiento, scheduling, contexto, visibilidad de estado y caché de serving

### B120. Discovery rápido no bloqueante del workspace — **Cerrada (spec 013)**
**Objetivo:** descubrir roots y archivos relevantes sin bloquear el flujo interactivo.

**Resultado registrado:**
- detección rápida de markers de Workspace y Solution;
- detección de archivos PowerBuilder relevantes;
- cola inicial de trabajo sin esperar a la indexación completa;
- devolución temprana del control al usuario.

---

### B121. Scheduler de indexación multinivel con colas por prioridad — **Cerrada (spec 014)**
**Objetivo:** introducir colas explícitas y justas para repartir trabajo sin bloquear.

**Resultado registrado:**
- cola **Interactive**;
- cola **Near**;
- cola **Background**;
- prioridad real al archivo abierto;
- indexación progresiva del resto del workspace.

---

### B133. Barra de estado con progreso de indexación — **Cerrada (spec 015)**
**Objetivo:** reflejar en la barra de estado el progreso real del indexador.

**Resultado registrado:**
- progreso visible;
- estado actual del motor;
- actividad dominante;
- acceso rápido a diagnóstico/mantenimiento.

---

### B054. Contexto posicional semántico reutilizable — **Cerrada (spec 032)**
**Objetivo:** introducir `findInnermostCallableAtPosition()`, `findInnermostTypeAtPosition()` y contexto reutilizable de nesting real.

**Referencia histórica `plugin_old`:** lógica antigua de spans, nesting y comparación por anidamiento.

---

### B055. Parseo documental con secciones / state machine — **Cerrada (spec 033)**
**Objetivo:** sustituir parsing demasiado lineal por una máquina de estados capaz de distinguir con seguridad bloques declarativos y ejecutables.

**Referencia histórica `plugin_old`:** `pbDocumentParser.ts` y lógica útil de reconocimiento de secciones.

---

### B113. Parser canónico del contenedor SR* — **Cerrada (spec 034)**
**Objetivo:** crear un parser explícito para la estructura contenedora de `.sra`, `.srw`, `.sru`, `.srm`, `.srf`.

**Resultado registrado:**
- reconocimiento estable de `forward global type`;
- `global type ... from ...`;
- `global <type> <instance>`;
- `forward prototypes`;
- `on create/destroy`;
- contenedores de callables;
- variables declarativas del objeto.

---

### B061. Completion scoring heredado y normalizado — **Cerrada (spec 035)**
**Objetivo:** portar y normalizar el scoring semántico del `plugin_old` usando distancia de herencia, scope, owner context y visibilidad.

**Referencia histórica `plugin_old`:** `semanticEngine.ts`, `getCompletionScore`.

---

### B134A. Caché caliente del contexto activo — **Cerrada (spec 016)**
**Objetivo:** mantener una caché extremadamente rápida del documento activo y sus dependencias inmediatas.

---

### B134B. Caché de serving para hover / completion / signature help / definition — **Cerrada (spec 017)**
**Objetivo:** diseñar una capa de caché específica para serving de features interactivas.

---

### B034. Diagnóstico de variables no usadas — **Cerrada (spec 026)**
**Objetivo:** detectar variables declaradas pero no utilizadas con conocimiento real de scopes.

**Referencia histórica `plugin_old`:** `diagnosticResolver.ts`, `analyzeUnusedVariables`.

---

### B035. Detección de shadowing — **Cerrada (spec 027)**
**Objetivo:** detectar sombreado entre locals, shared, globals e instance variables.

**Referencia histórica `plugin_old`:** `diagnosticResolver.ts`, `analyzeVariableShadowing`.

---

## 1.2 P1 — Topología real y resolución fuerte de PowerScript

### B056. Workspace topology parser (`.pbw/.pbt/.pbsln/.pbproj`) — **Cerrada (spec 018)**
### B057. Project registry con scoring — **Cerrada (spec 019)**
### B087. Topología de workspace y library order — **Cerrada (spec 020)**
### B064. Enriched symbol model incremental — **Cerrada (spec 021)**
### B059. Symbol visibility real (`public/protected/private/...`) — **Cerrada (spec 022)**
### B058. InheritanceGraph robusto con caches — **Cerrada (spec 023)**
### B060. Owner resolution robusto (estático + dinámico) — **Cerrada (spec 024)**
### B023. Búsqueda de referencias segura en casos base — **Cerrada (spec 025)**

**Resumen del bloque cerrado:**
- topología real Workspace/Solution operativa;
- `projectRegistry` y scoring de pertenencia funcionales;
- `library order` explotado en resolución;
- modelo de símbolo enriquecido;
- visibilidad real;
- herencia robusta con caches;
- owner resolution base;
- references base reconstruidas sobre topología y resolución fuertes.

---

## 1.3 P2 — Hardening del parser y del lexer

### B089. Lexing de precisión: comentarios anidados y escapes — **Cerrada (spec 040)**
### B092. Sistema de máscaras de código (code masking) — **Cerrada (spec 028)**
### B095. Normalizador / splitter de sentencias — **Cerrada (spec 029)**
### B090. Detección enriquecida de SQL embebido — **Cerrada (spec 041)**
### B073. Soporte para funciones externas (`EXTERNAL FUNCTION/SUBROUTINE`) — **Cerrada (spec 039)**
### B099. Resolución por anidamiento (`Range Span Comparison`) — **Cerrada (spec 030)**
### B101. Deduplicación semántica robusta — **Cerrada (spec 031)**

**Resumen del bloque cerrado:**
- masking reutilizable;
- splitting robusto de sentencias;
- SQL embebido identificado;
- externas soportadas;
- resolución por nesting fuerte;
- deduplicación semántica mejorada;
- reducción de falsos positivos y fortalecimiento del pipeline reusable.

---

## 1.4 P3 — Productividad avanzada segura

### B074. Diagnósticos de modernización y funciones obsoletas — **Cerrada (spec 036)**
### B103. Hover enriquecido con metadatos PB — **Cerrada (spec 037)**
### B104. Soporte para eventos calificados y `on-handlers` — **Cerrada (spec 038)**
### B106. Comando de información del objeto actual — **Cerrada (spec 051)**
### B107. Status bar con contexto de proyecto — **Cerrada (spec 052 + cierre runtime 2026-05)**

**Resumen del bloque cerrado:**
- modernización/obsoletas cubierta;
- hover enriquecido con metadatos útiles;
- `ON object_name.event_name` mejor soportado;
- comando de información del objeto operativo;
- barra de estado unificada con resumen del proyecto activo, estado de `projectModel`, caches/persistencia y accesos rápidos a stats/salud/build.

---

## 1.5 P4 — Escala, validación continua y rendimiento

### B127. File watcher estratificado y debounce de invalidación — **Cerrada (spec 043)**
### B128. Estados de readiness del workspace — **Cerrada (spec 044)**
### B129. Fairness por proyecto/root en background indexing — **Cerrada (spec 058)**

**Resumen del bloque cerrado:**
- invalidación agrupada y más estable;
- readiness del workspace formalizado;
- fairness por root/proyecto incorporada.

### B030. Validación sobre workspace grande real — **Cerrada (validación PFC + legacy 2026-05)**
**Objetivo:** validar sobre PFC 2025 Solution/Workspace y corpus legacy.

**Resultado registrado:**
- PFC 2025 Workspace y PFC 2025 Solution quedan integrados como corpus reales del ciclo;
- se añadió un slot legacy reproducible en `fixtures-local/public/legacy-pbl-dump` con helper dedicado y smoke real sobre fuente exportada;
- `test/corpora/README.md` documenta la preparación reproducible y `docs/testing.md` la referencia como matriz activa de corpus.

**Validación registrada:**
- `npm run test:performance -- --grep "(PFC Workspace smoke|PFC Solution smoke|legacy PBL dump smoke)"`
- `npm run test:smoke -- --grep "smoke/pfc-solution-extension"`

### B069. Fixtures reales permanentes de PFC/legacy — **Cerrada (fixtures locales controlados 2026-05)**
**Objetivo:** fixtures permanentes y mantenidos.

**Resultado registrado:**
- `fixtures-local/pfc/2025-Workspace` y `fixtures-local/pfc/2025-Solution` quedan fijados como fixtures reales del producto;
- `fixtures-local/public/legacy-pbl-dump` queda formalizado como slot local permanente para regresión legacy;
- `test/README.md` y `test/server/helpers/publicCorpusPaths.ts` dejan trazado estable para mantener estos corpus fuera de Git y dentro del ciclo de regresión.

**Validación registrada:**
- `npm run test:performance -- --grep "(PFC Workspace smoke|PFC Solution smoke|legacy PBL dump smoke)"`
- `npm run test:smoke -- --grep "smoke/pfc-solution-extension"`

### B221. PowerBuilder public corpus matrix — **Cerrada (matriz reproducible 2026-05)**
**Objetivo:** definir matriz reproducible de corpus públicos PowerBuilder para validar parsing, discovery, serving y performance.

**Resultado registrado:**
- `test/corpora/README.md` define matriz pública reproducible con PFC 2025 Solution, PFC 2025 Workspace, DataWindow examples, PBL dump examples, ORCA/build examples, native/PBNI examples y modern JSON/WebView2 examples;
- la matriz documenta criterios de inclusión/exclusión y modo de descarga/preparación local;
- el ciclo actual deja trazado qué corpus están ya integrados de forma ejecutable y cuáles quedan listos para activarse por área.

**Validación registrada:**
- auditoría documental local de la matriz reproducible;
- `npm run test:performance -- --grep "(PFC Workspace smoke|PFC Solution smoke|legacy PBL dump smoke)"`

### B118. Integration test matrix del plugin — **Cerrada (smoke matrix 2026-05)**
**Objetivo:** lifecycle real del plugin y workspaces reales.

**Resultado registrado:**
- `test/smoke/extension.test.ts` cubre activación y API pública mínima en `vscode-test`;
- `test/smoke/pfc-solution.extension.test.ts` valida el ciclo real sobre PFC Solution;
- `test/smoke/pfc-workspace.extension.test.ts` completa la matriz real sobre PFC Workspace;
- la documentación de testing y corpus deja trazado explícito qué cubre esta matriz y sobre qué corpus se ejecuta.

**Validación registrada:**
- `npm run test:smoke -- --grep "smoke/(extension|pfc-solution-extension|pfc-workspace-extension)"`

### B068. Calibración real del performance budget — **Cerrada (baseline real 2026-05)**
**Objetivo:** convertir budgets teóricos en budgets medidos.

**Resultado registrado:**
- `docs/performance-budget.md` deja de tratar discovery/cold/warm/archivo activo como objetivos solo teóricos y fija budgets ejecutables sobre corpus reales;
- `test/results/003-real-corpora-baseline.md` registra la medición base sobre PFC Workspace/Solution y legacy PBL dump;
- la calibración actual queda trazada para revisión futura sin mezclarla con presupuestos de memoria aún pendientes.

**Validación registrada:**
- `npm run test:performance`

### B119. Performance regression suite — **Cerrada (suite real 2026-05)**
**Objetivo:** medir activación, primer hover, primer diagnostics, discovery, warm/cold index.

**Resultado registrado:**
- la suite de performance ya cubre discovery sobre PFC, cold/warm index, batch documental sobre corpus real, primer hover y primeros diagnostics del archivo activo;
- la activación real queda cubierta por la matriz smoke sobre `vscode-test` y corpus PFC;
- la base queda trazada en `test/results/003-real-corpora-baseline.md` para detectar regresiones futuras.

**Validación registrada:**
- `npm run test:performance`
- `npm run test:smoke -- --grep "smoke/(extension|pfc-solution-extension|pfc-workspace-extension)"`

---

## 1.6 P5 — Ecosistema PowerBuilder, build y automatización

### B112. Herramientas de consistencia del catálogo — **Cerrada (specs 046 y 047)**
### B130. Detector y normalizador de encoding de fuentes — **Cerrada (spec 042)**
### B131. Soporte explícito para `.pblmeta` — **Cerrada (spec 045)**
### B138. Code masking pipeline (strip strings/comments) — **Cerrada**

**Resumen del bloque cerrado:**
- sanity checks y consistencia de catálogo;
- encoding heterogéneo mejor soportado;
- `.pblmeta` parseado;
- pipeline central de masking consolidado.

---

## 1.7 Hito 2026-05 — Ola 133-152 implementada y validada como primer corte operativo

### Resultado técnico registrado

La ola `Specs 133-152` dejó implementado un primer corte operativo de:

- snapshot semántico canónico por documento;
- `KnowledgeBase` con staging/publicación atómica y `semanticEpoch`;
- `semanticDiff`, dependencias semánticas inversas e invalidación dirigida/transitiva;
- indexación en dos fases con prioridad al activo, budgets adaptativos, yielding cooperativo, cancelación/preempción y modo degradado;
- backpressure del watcher, progreso/readiness enriquecidos y observabilidad ampliada;
- `UnifiedProjectModel` como base de topología compartida;
- persistencia base con `cacheSchema`, `cacheJournal` y `cacheCheckpoint`.

### Alcance trazado por spec

- `Specs 133-148` materializan primer corte de `B151`, `B165`, `B166`, `B170`, `B153`, `B154`, `B152`, `B122`, `B123`, `B124`, `B169`, `B125`, `B126`, `B134`, `B158` y `B159`.
- `Specs 149-152` materializan la base de `B141`, `B155`, `B167` y `B168`.

### Nota de gobierno

Este hito no implica que todos los ítems asociados estén cerrados. Los que siguieran `Partial` permanecen en backlog activo hasta cierre formal.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `309 passing`
- `npm test` → smoke `2 passing`, unit `309 passing`, integration `4 passing`

---

## 1.7A Gobernanza documental IA y docs de producto

### B201. IA-first documentation reorganization — **Cerrada**
**Objetivo:** reorganizar la documentación para que IA tenga ruta clara, sin duplicidades ni contradicciones.

**Resultado registrado:**
- `docs/00-ai-entrypoint.md` creado como puerta de entrada mínima y orden de lectura;
- `docs/product-operating-model.md` ampliado como documento propietario del modelo operativo;
- `docs/current-focus.md` simplificado para exponer un único foco ejecutable;
- `docs/spec-driven-development.md` y `docs/constitution.md` alineados con la ruta documental y el Definition of Done;
- catálogo de agentes y propiedad única de información consolidados en la capa documental;
- baseline de validación reforzado en `docs/testing.md`;
- documento de referencia de `plugin_old` reformulado como `docs/plugin-old-migration-opportunities.md`.

**Validación registrada:**
- auditoría documental local contra criterios de cierre en backlog;
- comprobación manual de orden de lectura, propiedad única y ausencia de contradicción operativa en docs canónicas.

### B202. Rules catalog and diagnostics governance — **Cerrada**
**Objetivo:** crear catálogo versionado de reglas diagnósticas.

**Resultado registrado:**
- `docs/rules-catalog.md` define plantilla canónica con ID estable, severidad, readiness, confidence, alcance, riesgo de falso positivo, tests y docs relacionadas;
- se documentaron reglas estructurales, de símbolos, DataWindow, PBL/ORCA y externas con contratos consistentes.

**Validación registrada:**
- auditoría documental local de presencia de IDs, severidad, readiness, confidence, falsos positivos y tests en el catálogo.

### B203. Developer workflows documentation — **Cerrada**
**Objetivo:** documentar workflows reales de programación PowerBuilder.

**Resultado registrado:**
- `docs/developer-workflows.md` fija workflows canónicos para apertura de proyecto, entendimiento del objeto actual, navegación de herencia, DataWindows, build y preparación de contexto para IA;
- backlog y roadmap ya pueden evaluarse contra workflows reales de valor profesional y no contra demos aisladas.

**Validación registrada:**
- auditoría documental local de cobertura de workflows visibles y trazabilidad con prioridades de producto.

---

## 1.8 Hito 2026-05 — Ola 153-172 implementada y validada

### Resultado técnico registrado

La ola `Specs 153-172` consolidó un segundo corte operativo de:

- puerto persistente de filesystem y `cacheStore` real sobre `cacheStorageUri`;
- `workspaceKey` estable, metadata de checkpoint y validación estricta de journal con rebuild seguro;
- export/restore defensivo y versionado en `KnowledgeBase` y `DocumentCache`, más `journal` interactivo desde `analysisCache`;
- warm resume real de `DocumentCache` + `KnowledgeBase` y persistencia solo en `readiness` estable;
- helper común de contexto de query, `ServingCache` ampliado a `definition` / `signatureHelp` / `completion`, y consumo real de `HotContextCache`;
- `queryTrace` retenida, `reasonCodes` del winner path y snapshot ampliado de stats interno/público.

### Alcance trazado por spec

- `Specs 153-163` materializan segundo corte de `B167`, `B168`, `B071`, `B071A` y `B174`.
- `Specs 164-172` materializan primer corte operativo de `B156`, `B157`, `B160`, `B176` y `B109`.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `324 passing`
- `npm test` → smoke `2 passing`, unit `324 passing`, integration `4 passing`

---

## 1.8A B157. Winner evidence contractual del query engine — **Slice cerrada (spec 219)**

### Resultado técnico registrado

`Spec 219` abre una evidencia estructurada minima sobre el ganador actual del query engine:

- `ResolvedTargetInfo` expone `evidence` como contrato derivado y estable;
- el primer item `winner-target` reutiliza `reasonCode`, `confidence` y lineage del target ganador;
- la logica de derivacion queda concentrada en `semanticQueryService`, sin cambiar el comportamiento de resolucion.

### Cierre real

La slice no cierra todavia `B157`, pero deja un contrato reutilizable para las siguientes piezas de descartes, ambiguedad y confidence.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.8B B157. Pool bruto de candidatos del winner path — **Slice cerrada (spec 220)**

### Resultado técnico registrado

`Spec 220` conserva el conjunto de candidatos evaluados antes del filtro final:

- `ResolvedTargetInfo` expone `candidatePool` como contrato estable y pequeño;
- las rutas locales, jerárquicas, cualificadas y globales retienen el pool bruto antes del filtro definitivo;
- la resolución final sigue saliendo por `targets`, sin cambios funcionales en providers.

### Cierre real

La slice no cierra todavía `B157`, pero deja disponible el material base para explicar descartes y empates en slices posteriores.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.8C B157. Descartes explicados por distancia jerarquica — **Slice cerrada (spec 221)**

### Resultado técnico registrado

`Spec 221` convierte el filtro jerarquico minimo en evidence explicable:

- el runtime conserva descartes producidos por la misma distancia usada para elegir el ganador;
- `ResolvedTargetInfo.evidence` añade entradas `discarded-distance` con distancia ganadora y del candidato descartado;
- la resolucion final sigue inalterada y el cambio queda concentrado en `semanticQueryService`.

### Cierre real

La slice no cierra todavia `B157`, pero ya explica por que un ancestro o miembro mas lejano no gana frente al override mas cercano.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.9 Hito 2026-05 — Bloque B241-B250 cerrado y validado

### Resultado técnico registrado

El bloque `B241-B250` deja cerrado, sobre código y documentación viva, un carril completo de plataforma abierta, explainability, validación operativa y release:

- API pública v2 endurecida con descriptor contractual, inventario estable y compatibilidad versionada;
- bridge read-only para tools/agentes locales o JSON-RPC sobre la API pública;
- export/import versionado de semantic workspace snapshots;
- gobernanza de settings y perfiles del producto sobre surfaces ya existentes;
- panel read-only de diagnostics explainability en el cliente;
- gate de budgets de performance en CI/local y suite de estrés incremental para workspaces grandes;
- knowledge packs curados de frameworks/librerías PowerBuilder en el manifest semántico;
- planner read-only de batch rename/refactor reutilizando preflight, impacto y safe edit plan;
- carril de release repetible con VSIX real, changelog y workflow de marketplace readiness.

### Alcance trazado por spec

- `Spec 284` materializa `B241`.
- `Spec 285` materializa `B242`.
- `Spec 286` materializa `B243`.
- `Spec 287` materializa `B244`.
- `Spec 288` materializa `B245`.
- `Spec 289` materializa `B246`.
- `Spec 290` materializa `B247`.
- `Spec 291` materializa `B248`.
- `Spec 292` materializa `B249`.
- `Spec 293` materializa `B250`.

### Validación registrada

- `npm run build:test`
- `npm run test:unit -- --grep "unit/publicApi"`
- `npm run test:unit -- --grep "unit/semanticWorkspaceSnapshot"`
- `npm run test:unit -- --grep "unit/settingsGovernance"`
- `npm run test:unit -- --grep "diagnosticsExplainabilityPanelModel"`
- `npm run test:unit -- --grep "unit/(frameworkKnowledgePacks|semanticWorkspaceManifest)"`
- `npm run test:unit -- --grep "unit/(safeBatchRefactorPlan|publicApi)"`
- `node ./node_modules/@vscode/test-cli/out/bin.mjs --label performance --grep "performance/large-workspace-incremental"`
- `npm run test:performance:gate`
- `npm run test:smoke -- --grep "la extension se activa en menos de 500ms"`
- `npm run package:vsix`
- `npm run release:verify`

### Documentación alineada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/performance-budget.md`
- `docs/roadmap.md`
- `docs/testing.md`

### B318. PowerBuilder Language Knowledge Catalog v2 — **Cerrada (spec 318)**
**Objetivo:** evolucionar el catálogo de callable/event/statement a un modelo de lenguaje completo (keywords, datatypes, operators, etc.).

**Resultado registrado:**
- extensión de tipos base (`PbSystemSymbolKind`, `PbSystemSymbolDomain`, `PbSystemSymbolNamespace`);
- creación de 8 slices manuales curadas (`manual-core`) cubriendo keywords, reserved words, datatypes (primitive/system), pronouns, operators, system globals y enumerated values;
- implementación de APIs de consulta indexadas en `queryService` y `SystemCatalog` facade para acceso $O(1)$;
- integración en `hover.ts` (fallback para símbolos de lenguaje) y `completion.ts` (sugerencias de keywords/datatypes);
- reporte de consistencia ampliado con `kindCounts`.

**Validación registrada:**
- suite `test/server/unit/catalogV2.test.ts` con 30+ casos cubriendo compatibilidad, nuevos dominios, resolución y alias;
- green en la suite completa de 742 tests.

**Documentación afectada:**
- `specs/318-powerbuilder-language-knowledge-catalog-v2/`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`

---

## 1.8D B157. Descartes contextuales de qualifier — **Slice cerrada (spec 222)**

### Resultado técnico registrado

`Spec 222` hace visibles los misses de contexto más inmediatos en rutas cualificadas:

- `ResolvedTargetInfo.evidence` registra `qualifier-unresolved` cuando el qualifier no resuelve a tipo;
- también registra `qualifier-no-match` cuando el tipo resuelto no aporta miembros compatibles;
- los casos negativos siguen devolviendo cero targets, pero dejan de ser opacos para debugging y futuras confidence gates.

### Cierre real

La slice no cierra todavía `B157`, pero añade explicabilidad negativa básica en el punto exacto donde la ruta cualificada se corta.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.8E B157. Ambiguedad explicita de distancia minima — **Slice cerrada (spec 223)**

### Resultado técnico registrado

`Spec 223` hace visible la ambigüedad residual del winner path jerárquico:

- el ranking por distancia conserva cuándo la distancia ganadora deja más de un candidato;
- `ResolvedTargetInfo.evidence` añade entradas `distance-ambiguity` con distancia mínima y número de empatados;
- `targets` mantiene su comportamiento actual, dejando la decisión de gates para slices posteriores.

### Cierre real

La slice no cierra todavía `B157`, pero deja formalizado el caso de empate que luego necesitarán confidence y feature gates.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.8AD B157. Cardinalidad de ganadores en hover de usuario — **Slice cerrada (spec 237)**

### Resultado técnico registrado

`Spec 237` separa la cardinalidad del winner path como dato estable dentro del hover:

- `formatUserHover()` renderiza `Candidatos ganadores`;
- la cardinalidad se reutiliza desde el `targetCount` ya aportado por el provider;
- la cobertura unitaria valida casos simple y ambiguo.

### Cierre real

La slice distingue claramente entre advertencia de ambigüedad y cardinalidad informativa del winner path.

### Validación registrada

- `npm run test:unit -- --grep "unit/hover"`

---

## 1.8AC B157. Reason detallado de confidence insuficiente — **Slice cerrada (spec 244)**

### Resultado técnico registrado

`Spec 244` mejora la explicabilidad de las decisiones motivadas por confidence insuficiente:

- el `reason` incluye la confidence actual y la requerida;
- la acción calculada no cambia respecto a la `Spec 243`;
- la cobertura unitaria valida el detalle del mensaje en el caso `low < medium`.

### Cierre real

La slice deja la decisión lista para diagnosis más precisa cuando se active en callers del servidor.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8AB B157. Último paso del snapshot en queryTrace — **Slice cerrada (spec 248)**

### Resultado técnico registrado

`Spec 248` añade un resumen escalar del cierre de la última traza capturada:

- `TraceSnapshot` expone `lastStepName`;
- el valor refleja el último paso emitido, o queda ausente si no hubo pasos;
- la cobertura unitaria valida la coherencia entre resumen y array real.

### Cierre real

La slice facilita inspección inmediata del último evento observado sin recorrer la colección completa de pasos.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8AA B157. Suficiencia de confidence por feature — **Slice cerrada (spec 240)**

### Resultado técnico registrado

`Spec 240` compone la policy de confidence en un helper booleando reutilizable:

- `featureReadiness` expone `isResolutionConfidenceSufficient()`;
- el helper reutiliza comparador y thresholds ya centralizados;
- la cobertura unitaria valida casos laxos y estrictos por feature.

### Cierre real

La slice deja preparada una comprobación declarativa de sufficiency antes de activar decisiones automáticas en callers.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8Z B157. Resumen de acciones únicas en queryTrace — **Slice cerrada (spec 247)**

### Resultado técnico registrado

`Spec 247` completa el resumen agregado del snapshot con las acciones únicas observadas:

- `TraceSnapshot` expone `actions`;
- el resumen preserva el orden de primera aparición y elimina duplicados;
- la cobertura unitaria valida la agregación sobre una traza con acciones repetidas.

### Cierre real

La slice deja el snapshot listo para inspección rápida por fases y acciones sin reparseo externo.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8Y B157. Resumen de fases únicas en queryTrace — **Slice cerrada (spec 246)**

### Resultado técnico registrado

`Spec 246` añade al snapshot un resumen ligero de fases únicas observadas:

- `TraceSnapshot` expone `phases`;
- el resumen preserva el orden de primera aparición y elimina duplicados;
- la cobertura unitaria valida la agregación sobre una traza con fases repetidas.

### Cierre real

La slice facilita inspección rápida de la traza sin recorrer todos los pasos ni reagruparlos fuera del módulo.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8X B157. Clonado defensivo de pasos en queryTrace — **Slice cerrada (spec 245)**

### Resultado técnico registrado

`Spec 245` blinda la lectura de la última traza frente a mutaciones externas:

- `getLastTrace()` devuelve clones de cada `TraceStep`;
- mutar el snapshot obtenido ya no altera lecturas posteriores;
- la cobertura unitaria valida el encapsulamiento del estado retenido.

### Cierre real

La slice mejora la seguridad del snapshot retenido sin cambiar el comportamiento observable de la traza.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8W B157. Gating de confidence en featureReadiness — **Slice cerrada (spec 243)**

### Resultado técnico registrado

`Spec 243` activa la policy de confidence dentro de la decisión de readiness:

- `decideFeatureReadiness()` compara `actualResolutionConfidence` contra el threshold del feature;
- cuando la confidence es insuficiente y el readiness base ya era suficiente, aplica `fallbackAction`;
- la cobertura unitaria valida casos de `block` y de `allow` con threshold bajo.

### Cierre real

La slice deja operativo el gating por confidence dentro de la decisión, aunque la integración con callers del servidor quede para slices posteriores.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8V B157. Confidence real contextual en la decisión de readiness — **Slice cerrada (spec 242)**

### Resultado técnico registrado

`Spec 242` completa el contrato de decisión con la señal real aportada por el caller:

- `FeatureReadinessContext` acepta `resolutionConfidence`;
- `FeatureReadinessDecision` expone `actualResolutionConfidence`;
- la cobertura unitaria valida la propagación del valor sin alterar aún la acción final.

### Cierre real

La slice prepara decisiones explicables basadas en confidence sin recalcular la resolución dentro de `featureReadiness`.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8U B157. Threshold requerido en la decisión de readiness — **Slice cerrada (spec 241)**

### Resultado técnico registrado

`Spec 241` hace autocontenida la decisión de readiness respecto a la policy de confidence:

- `FeatureReadinessDecision` expone `requiredResolutionConfidence`;
- `decideFeatureReadiness()` rellena el threshold correspondiente al feature en todas sus ramas;
- la cobertura unitaria fija el contrato de decisión enriquecida.

### Cierre real

La slice deja visible la policy aplicada sin necesitar consultas externas adicionales al getter de thresholds.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8T B157. Thresholds mínimos de confidence por feature — **Slice cerrada (spec 239)**

### Resultado técnico registrado

`Spec 239` centraliza la política mínima de confidence de resolución por feature:

- `featureReadiness` expone `getRequiredResolutionConfidence()`;
- hover y completion aceptan `low`, definition exige `medium`, references y rename exigen `high`;
- la cobertura unitaria deja la política fijada antes de activar gates automáticos.

### Cierre real

La slice prepara la activación controlada de decisions por confidence sin dispersar thresholds en handlers del servidor.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8S B157. Orden canónico de confidence por feature — **Slice cerrada (spec 238)**

### Resultado técnico registrado

`Spec 238` fija la comparación básica de confidence de resolución en la capa de readiness:

- `featureReadiness` define un orden canónico `low < medium < high`;
- `compareResolutionConfidence()` centraliza la comparación;
- la cobertura unitaria deja preparada la base para thresholds y gates posteriores.

### Cierre real

La slice elimina la necesidad de comparaciones ad hoc antes de introducir políticas por feature.

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness"`

---

## 1.8R B157. Nota de ambigüedad en hover de usuario — **Slice cerrada (spec 236)**

### Resultado técnico registrado

`Spec 236` hace visible en el hover cuándo la resolución sigue siendo ambigua:

- `provideHover()` proyecta si existen varios targets ganadores y cuántos son;
- `formatUserHover()` renderiza una nota explícita de `Resolución ambigua`;
- la cobertura unitaria valida un caso real con dos candidatos a distancia mínima.

### Cierre real

La slice mantiene el target principal actual, pero ya no oculta al usuario que el winner path sigue siendo ambiguo.

### Validación registrada

- `npm run test:unit -- --grep "unit/hover"`

---

## 1.8Q B157. Reason code principal en hover de usuario — **Slice cerrada (spec 235)**

### Resultado técnico registrado

`Spec 235` añade explicabilidad directa del camino de resolución en el hover de usuario:

- `provideHover()` pasa el `reasonCode` principal desde la resolución detallada;
- `formatUserHover()` renderiza `Motivo de resolución` con el valor canónico del query engine;
- la cobertura unitaria valida la proyección en el caso real de `global-fallback`.

### Cierre real

La slice mejora la trazabilidad visible de la resolución sin reinterpretar ni traducir la semántica del engine.

### Validación registrada

- `npm run test:unit -- --grep "unit/hover"`

---

## 1.8P B157. Confidence general en hover de usuario — **Slice cerrada (spec 234)**

### Resultado técnico registrado

`Spec 234` proyecta la confidence general del winner path en el hover de símbolos de usuario:

- `provideHover()` pasa la confidence desde `ResolvedTargetInfo`;
- `formatUserHover()` renderiza `Confianza de resolución` sin mezclarla con la confidence de lineage;
- la cobertura unitaria recoge tanto el formateador como el caso real de `global-fallback`.

### Cierre real

La slice lleva la primera señal compacta del query engine a una feature visible sin tocar la lógica de selección de targets.

### Validación registrada

- `npm run test:unit -- --grep "unit/hover"`

---

## 1.8O B157. Resumen temporal en queryTrace — **Slice cerrada (spec 233)**

### Resultado técnico registrado

`Spec 233` añade metadatos temporales ligeros al snapshot de la última traza:

- `TraceSnapshot` expone `startedAt`, `endedAt` y `durationMs`;
- la duración se deriva en el cierre de `withTrace()`;
- `getLastTrace()` devuelve un resumen temporal coherente junto al resto del snapshot.

### Cierre real

La slice aporta una señal diagnóstica ligera de coste sin introducir perf tooling adicional en el hot path.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8N B157. Step count en queryTrace — **Slice cerrada (spec 232)**

### Resultado técnico registrado

`Spec 232` añade un resumen directo del tamaño de la última traza capturada:

- `TraceSnapshot` expone `stepCount`;
- el valor se fija al cerrar la traza y coincide con `steps.length`;
- `getLastTrace()` devuelve una copia coherente del resumen.

### Cierre real

La slice permite inspección rápida del volumen de pasos sin recorrer el array completo fuera de `queryTrace`.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8M B157. Acción derivada en queryTrace — **Slice cerrada (spec 231)**

### Resultado técnico registrado

`Spec 231` completa la descomposición ligera del nombre de paso en la traza:

- `TraceStep` expone `action`;
- `recordTraceStep()` deriva el sufijo posterior a `:` cuando existe;
- pasos sin patrón compuesto conservan `action` indefinida.

### Cierre real

La slice evita parseo externo del nombre completo de paso y deja la semántica básica de la traza centralizada en `queryTrace`.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8L B157. Fase derivada en queryTrace — **Slice cerrada (spec 230)**

### Resultado técnico registrado

`Spec 230` enriquece cada paso de traza con una fase derivada del nombre compuesto:

- `TraceStep` expone `phase`;
- `recordTraceStep()` deriva el prefijo antes de `:` cuando existe;
- pasos sin prefijo conservan `phase` indefinida.

### Cierre real

La slice mejora la inspección ligera de la traza sin imponer aún una taxonomía cerrada ni tocar los nombres ya emitidos.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryTrace"`

---

## 1.8K B157. Tipos de evidence en DocumentQueryContext — **Slice cerrada (spec 229)**

### Resultado técnico registrado

`Spec 229` proyecta una vista resumida de la evidence disponible en el contexto documental:

- `DocumentQueryContext` expone `resolutionEvidenceKinds`;
- la lista reutiliza los `kind` de `resolvedTargets?.evidence` sin tocar los payloads canónicos;
- el resumen cubre casos simples, ambiguos y ausencia de contexto.

### Cierre real

La slice permite detectar qué explicaciones están disponibles sin inspeccionar toda la evidence heterogénea.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8J B157. Cardinalidad de targets en DocumentQueryContext — **Slice cerrada (spec 228)**

### Resultado técnico registrado

`Spec 228` proyecta la cardinalidad del resultado de resolución como un escalar directo del contexto documental:

- `DocumentQueryContext` expone `resolutionTargetCount`;
- el valor reutiliza `resolvedTargets?.targets.length` sin recomputar el query;
- la surface cubre resolución simple, ambigua y ausencia de contexto.

### Cierre real

La slice permite a capas superiores leer cardinalidad sin navegar el resultado detallado completo.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8I B157. Bandera de ambigüedad en DocumentQueryContext — **Slice cerrada (spec 227)**

### Resultado técnico registrado

`Spec 227` proyecta la ambigüedad del winner path como surface booleana directa del contexto documental:

- `DocumentQueryContext` expone `hasResolutionAmbiguity`;
- la bandera se deriva de la evidence `distance-ambiguity` ya calculada por el query engine;
- sin contexto resoluble, el valor degrada a `false`.

### Cierre real

La slice evita que capas superiores tengan que inspeccionar evidence estructurada solo para detectar empates mínimos.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8H B157. Reason code principal en DocumentQueryContext — **Slice cerrada (spec 226)**

### Resultado técnico registrado

`Spec 226` proyecta la causa principal del winner path como surface directa del contexto documental:

- `DocumentQueryContext` expone `primaryResolutionReasonCode`;
- el valor se deriva de `resolvedTargets?.reasonCodes[0]` sin recalcular la resolución;
- la surface degrada a `undefined` cuando no existe contexto resoluble.

### Cierre real

La slice simplifica consumidores de reason codes y mantiene la fuente de verdad en el query engine detallado.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8G B157. Surface de confidence en DocumentQueryContext — **Slice cerrada (spec 225)**

### Resultado técnico registrado

`Spec 225` proyecta la confidence general del query engine como surface de conveniencia en el contexto documental:

- `DocumentQueryContext` expone `resolutionConfidence`;
- la proyección reutiliza `resolvedTargets?.confidence` sin recalcular la resolución;
- el contexto degrada a `undefined` cuando no existe invocación resoluble.

### Cierre real

La slice mantiene la fuente de verdad dentro de `semanticQueryService` y prepara surfaces consumidoras más simples en capas superiores.

### Validación registrada

- `npm run test:unit -- --grep "unit/queryContext"`

---

## 1.8F B157. Confidence scorer v1 del winner path — **Slice cerrada (spec 224)**

### Resultado técnico registrado

`Spec 224` sintetiza la evidence estabilizada en una confidence general del query engine:

- `ResolvedTargetInfo` expone `confidence` con buckets `high`, `medium` y `low`;
- el scorer reutiliza `reasonCodes`, lineage, misses contextuales y ambigüedad sin cambiar `targets`;
- quedan cubiertas rutas altas, medias y bajas sobre el mismo módulo de resolución.

### Cierre real

La slice no cierra todavía `B157`, pero deja un scorer puro reutilizable para surfaces posteriores y futuras confidence gates.

### Validación registrada

- `npm run test:unit -- --grep "unit/semanticQueryService"`

---

## 1.9 B071A. Caché persistente por workspace y por proyecto — **Cerrada (specs 173 y 174)**

### Resultado técnico registrado

Las `Specs 173-174` cierran `B071A` como capacidad operativa de persistencia fina:

- `cacheStore` acepta `UnifiedProjectModel` para conocer la pertenencia de los documentos;
- el checkpoint persistido se divide por proyecto;
- el journal persistido se divide por proyecto con secuencias locales por partición;
- los documentos huérfanos permanecen anclados a la partición de workspace;
- el warm resume recompone el conjunto agregado aplicando checkpoint y journal por partición.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `326 passing`
- `npm test` → smoke `2 passing`, unit `326 passing`, integration `4 passing`

---

## 1.10 B071B. Caché de consultas frecuentes — **Cerrada (specs 175-184)**

### Resultado técnico registrado

Las `Specs 175-184` cierran `B071B` como cache persistente de serving:

- `ServingCache` expone `exportEntries()` y `restoreEntries()`;
- `cacheStore` persiste y carga snapshots de `ServingCache` en archivo dedicado y versionado;
- el runtime restaura entries persistidas tras warm resume compatible;
- `kbVersionFromKey()` permite filtrar claves por epoch;
- persistencia y restore descartan claves inválidas u obsoletas;
- `ServingCacheFlushCoordinator` coordina dirty/flush;
- el runtime dispara flush oportuno tras hover, definition, signatureHelp y completion;
- invalidaciones y shutdown fuerzan flush estable;
- `powerbuilder.showStats` expone `lastRestoredEntries` y `lastPersistedEntries` en `persistence.servingSnapshot`.

### Alcance trazado por spec

- `Specs 175-184` materializan el cierre completo de `B071B`.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `341 passing`
- `npm test` → smoke `2 passing`, unit `341 passing`, integration `4 passing`

---

## 1.11 B172. Provenance / lineage de símbolos — **Cerrada (specs 185-192)**

### Resultado técnico registrado

Las `Specs 185-192` cierran `B172`:

- añaden `EntityLineage` al modelo semántico central;
- pueblan lineage desde `analyzeDocument`;
- distinguen prototype frente a implementation;
- propagan herencia documental mínima desde `baseTypeName`;
- normalizan lineage en `enrichEntity`;
- incorporan lineage estable al `semanticDiff`;
- exponen `winnerLineage` en `semanticQueryService`;
- conectan provenance del catálogo de sistema con lineage;
- muestran lineage mínimo en hover;
- estabilizan `ApiSymbolLineage` y `toApiSymbol()` en el contrato público.

### Alcance trazado por spec

- `Specs 185-192` cierran `B172`.
- `Spec 192` amplía `B109` sin cerrar aún la API pública completa.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `350 passing`
- `npm test` → smoke `2 passing`, unit `350 passing`, integration `4 passing`

---

## 1.11A B151. KB snapshot-first readers en KnowledgeBase — **Slice cerrada (spec 193)**

### Resultado técnico registrado

`Spec 193` reduce `B151` en un boundary pequeño y reusable:

- `KnowledgeBase` prioriza `documentSnapshots` en `getEntitiesByUri()` y `getScopeAt()`;
- el fallback legacy se conserva cuando el documento aún no tiene snapshot publicado;
- tests unitarios focalizados cubren la lectura documental snapshot-first.

### Cierre real

`Spec 193` no cerraba por sí sola `B151`, pero deja preparado el consumo snapshot-first de features core y sirve de base a `Specs 198-204`, que terminan cerrando `B151A` y `B151`.

### Validación registrada

- `npm run test:unit -- --grep "unit/knowledgeBase"`
- `npm run compile`

---

## 1.12 B165. Publicación atómica del Knowledge Base y de los índices — **Cerrada (specs 134 y 194)**

### Resultado técnico registrado

`B165` queda cerrado y debe salir del backlog activo:

- se separa construcción/staging de publicación visible;
- el swap atómico evita mezcla de estado viejo y nuevo;
- `rollbackBatchUpdate()` descarta publicaciones incompletas;
- `Spec 194` amplía la validación para cubrir `getEntitiesByUri()`, `getScopeAt()` y `getDocumentSnapshot()` durante batch y tras commit.

### Cierre real

`Specs 134 y 194` prueban que las lecturas documentales y globales no ven estado staged ni mezcla parcial.

### Validación registrada

- `npm run test:unit -- --grep "unit/(ServingCache|servingCachePersistence|knowledge)"`
- `npm run compile`
- `npm run test:unit` → `352 passing`
- `npm test` → smoke `2 passing`, unit `352 passing`, integration `4 passing`

---

## 1.13 B166. Versionado semántico interno del workspace — **Cerrada (specs 135, 178-180)**

### Resultado técnico registrado

`B166` queda cerrado y debe salir del backlog activo:

- `KnowledgeBase` publica `semanticEpoch`;
- `ServingCache` liga sus claves a la epoch/version semántica;
- la persistencia filtra snapshots por epoch activa/esperada;
- resultados y caches se invalidan por versión semántica global y no solo por archivo.

### Cierre real

`Specs 135`, `178`, `179` y `180`, junto con el wiring persistente del runtime, hacen que resultados y caches sean coherentes con la epoch semántica global.

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `352 passing`
- `npm test` → smoke `2 passing`, unit `352 passing`, integration `4 passing`

---

## 1.14 B170. Semantic diff engine — **Cerrada (specs 136 y 195)**

### Resultado técnico registrado

`Spec 195` completa el cierre de `B170`:

- el diff semántico deja de marcar cambio por puro fingerprint;
- distingue cambios cosméticos de cambios semánticos reales;
- los cambios cosméticos invalidan solo el documento origen;
- los cambios semánticos combinan impactos previos y siguientes.

### Validación registrada

- `npm run test:unit -- --grep "unit/(semanticDiff|semanticInvalidation)"`
- `npm run compile`
- `npm run test:unit` → `355 passing`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.15 B153. Índice de dependencias semánticas inversas — **Cerrada (specs 137 y 195)**

### Resultado técnico registrado

`B153` queda cerrado sobre el reverse graph existente:

- `KnowledgeBase` extrae dependencias desde snapshot;
- mantiene el grafo inverso;
- `Spec 195` usa planes previos y siguientes para resolver el conjunto impactado real;
- se resuelven impactos directos/transitivos sin volver a invalidación gruesa por cambio documental.

### Validación registrada

- `npm run test:unit -- --grep "unit/(semanticDiff|semanticInvalidation)"`
- `npm run compile`
- `npm run test:unit` → `355 passing`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.16 B154. Invalidation engine explícito — **Cerrada (specs 138 y 195)**

### Resultado técnico registrado

`B154` queda cerrado:

- `semanticInvalidation.ts` concentra planes explícitos de invalidación;
- soporta invalidación `document-only`, merge de impactos y plan snapshot-aware;
- el servidor deja de decidir ad hoc entre invalidación gruesa o selectiva;
- desaparece la lógica dispersa de invalidación por feature en el hot path.

### Validación registrada

- `npm run test:unit -- --grep "unit/(semanticDiff|semanticInvalidation)"`
- `npm run compile`
- `npm run test:unit` → `355 passing`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.17 B123. Presupuestos de trabajo y yielding cooperativo — **Cerrada (spec 141)**

### Resultado técnico registrado

`B123` queda cerrado:

- `workspaceIndexer` trabaja con `workBudgetMs`;
- integra `latencyGovernor`;
- contabiliza `yielded`;
- cede cooperativamente con `setImmediate()` en ambos pases;
- el indexador ya no monopoliza CPU durante batches largos.

### Validación registrada

- `npm run compile`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.18 B124. Cancelación y preempción real de tareas de fondo — **Cerrada (spec 142)**

### Resultado técnico registrado

`B124` queda cerrado:

- `TaskScheduler` preempta `Background` con `Near` e `Interactive`;
- cancela tareas activas o pendientes;
- expone contadores de preemption;
- el trabajo interactivo y cercano al contexto activo no queda bloqueado por background.

### Validación registrada

- `npm run compile`
- `npm test` → smoke `2 passing`, unit `355 passing`, integration `4 passing`

---

## 1.19 B126. Superficie de estado del indexador — **Cerrada (specs 145 y 196)**

### Resultado técnico registrado

`B126` queda cerrado:

- `getIndexerStatus()` expone fase, pass, progreso, budget y degradación;
- `Spec 196` añade `lastProcessedUri`, `lastFailedUri` y `partialRuns`;
- el indexador deja de ser una caja negra;
- el operador puede ver última actividad relevante sin esperar al event log completo.

### Validación registrada

- `npm run test:unit -- --grep "unit/workspaceIndexer"`
- `npm run compile`
- `npm test` → smoke `2 passing`, unit `357 passing`, integration `4 passing`

---

## 1.20 Hito 2026-05 — Limpieza del backlog activo y traslado de ítems Done

### Resultado técnico registrado

Se actualiza el done-log para reflejar los ítems retirados del backlog activo en la versión corregida del backlog.

### Ítems retirados del backlog activo por estar cerrados

- B165 — Publicación atómica del Knowledge Base y de los índices.
- B166 — Versionado semántico interno del workspace.
- B170 — Semantic diff engine.
- B153 — Índice de dependencias semánticas inversas.
- B154 — Invalidation engine explícito.
- B123 — Presupuestos de trabajo y yielding cooperativo.
- B124 — Cancelación y preempción real de tareas de fondo.
- B126 — Superficie de estado del indexador.
- B071B — Caché de consultas frecuentes.
- B172 — Provenance / lineage de símbolos.

### Nota de gobierno

Estos ítems ya no deben aparecer en el backlog activo. Si quedan referencias a ellos, deben estar solo como dependencias históricas, trazabilidad o notas de cierre, no como trabajo pendiente.

---

## 1.21 B174. Resultados semánticos inmutables — **Cerrada (specs 159-160 y 197)**

### Resultado técnico registrado

`B174` queda cerrado:

- `Specs 159-160` ya blindaban export/restore y el payload persistente versionado de `KnowledgeBase` y `DocumentCache`;
- `Spec 197` completa la frontera inmutable sobre lecturas y escrituras publicas de `KnowledgeBase`, `DocumentCache` y `HotContextCache`;
- mutar entradas o resultados leidos deja de contaminar snapshots, scopes y entidades publicadas.

### Validación registrada

- `npm run test:unit -- --grep "unit/(knowledge|HotContextCache)"`
- `npm run compile`

---

## 1.22 Hito 2026-05 — Specs 198-217: cierre de B151, B152 y B169; reducción de B141A

### Resultado técnico registrado

La ola `Specs 198-217` consolida tres cierres reales del core incremental y reduce el último residual `Partial` de topología compartida:

- Sobre la base de `Spec 193`, `Specs 198-204` hacen snapshot-first `documentSymbols`, `completion`, `signatureHelp`, `diagnostics` y `semanticTokens`, eliminan la recomposición semántica residual por feature y permiten cerrar `B151A` y `B151`.
- `Specs 205-206`, `216` y `217` convierten el indexador en un pipeline de dos fases real con `analyzeDocumentStructural()`, publicación temprana `structural-only`, promoción explícita a `nearby-semantic-ready` y contadores por pass, permitiendo cerrar `B152A` y `B152`.
- `Specs 207-208` y `210` cablean el intake real del watcher sobre el runtime, distinguen modo incremental frente a massive mode, barren caches derivadas de forma selectiva o global según el burst y validan el backpressure extremo a extremo, permitiendo cerrar `B169A` y `B169`.
- `Specs 209`, `211-215` llevan `UnifiedProjectModel` a `workspaceIndexer`, `libraryOrder`, `projectRouting`, refresh por watcher y status activo; `B141A` queda reducido a serving e invariantes finales, pero no cerrado todavía.

### Alcance trazado por spec

- `Specs 198-204` cierran `B151A` y `B151`.
- `Specs 205-206`, `216` y `217` cierran `B152A` y `B152`.
- `Specs 207-208` y `210` cierran `B169A` y `B169`.
- `Specs 209`, `211-215` reducen `B141A`, pero la mantienen en backlog activo.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- suites focalizadas por slice sobre `documentSymbols`, `documentAnalysis`, `workspaceIndexer`, `watchedFileIntake`, `watcherPipeline`, `unifiedProjectModel`, `libraryOrder`, `workspace`, `knowledgeBase` y `scopeResolution`
- `npm run test:unit` → `376 passing`
- `npm test` → smoke `2 passing`, unit `376 passing`, integration `4 passing`

---

## 1.23 B141/B141A. Library graph / project model unificado y adopción runtime — **Cerradas (specs 149-152, 209, 211-215 y 218)**

### Resultado técnico registrado

Las `Specs 149-152`, `209`, `211-215` y `218` dejan cerrado el modelo compartido de proyecto/routing del runtime:

- `UnifiedProjectModel` actúa como única fuente de verdad project-aware en `cacheStore`, `workspaceIndexer`, `libraryOrder`, refresh por watcher y status del proyecto activo;
- `WorkspaceState.clear()` reinicia también `projectRegistry`, evitando arrastrar routing legacy tras un reset completo del workspace;
- el contrato de proyecto activo sigue derivándose del modelo unificado y el reset deja `getProjectContextForFile()` en estado seguro;
- backlog, roadmap y current-focus dejan de tratar `B141A` como residual `Partial`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `379 passing`
- `npm test` → smoke `2 passing`, unit `379 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.24 B122. Priorización por dependencias semánticas cercanas — **Cerrada (spec 140)**

### Resultado técnico registrado

`Spec 140` queda cerrada sobre el runtime real del indexador:

- el servidor pasa `activeDocumentUri` real a `indexWorkspace`, evitando que la prioridad quede reducida a orden físico cuando existe contexto activo;
- `prioritizeFilesForIndexing()` ordena ahora por buckets explicables: activo, ancestros, owners/tipos cercanos, calls probables, proyecto y workspace;
- el grafo inverso publicado y los snapshots semánticos del activo alimentan esa heurística sin reintroducir lógica duplicada en el hot path;
- `getIndexerStatus()` expone `prioritySummary`, dejando visible la razón de prioridad observada por el runtime.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run compile`
- `npm run test:unit` → `381 passing`
- `npm test` → smoke `2 passing`, unit `381 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.25 B125. Indexación progresiva del workspace completo — **Cerrada (spec 144)**

### Resultado técnico registrado

`Spec 144` queda cerrada sobre el runtime real del indexador y del watcher:

- `watchedFileIntake` ya alimenta la misma file state machine que `workspaceIndexer`, dejando estado explícito para `create`, `change`, `delete`, saltos por documento abierto y fallos locales;
- `getFileIndexState()` y `getIndexerStatus()` cubren ahora tanto la indexación completa del workspace como los lotes incrementales del watcher, sin abrir una segunda vía de estado;
- el pipeline mantiene prioridad, yielding, preempción y backpressure ya existentes, pero ahora con visibilidad coherente de estados simultáneos mientras el workspace converge hacia `ready`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/watchedFileIntake"`
- `npm test` → smoke `2 passing`, unit `382 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.26 B134. Modelo de progreso y readiness del indexador — **Cerrada (spec 146)**

### Resultado técnico registrado

`Spec 146` queda cerrada sobre el runtime real del servidor:

- discovery, indexación, watcher intake y `powerbuilder.showStats` derivan ahora del mismo snapshot de progreso/readiness en lugar de mezclar señales separadas de `readiness` e `indexer`;
- el modelo distingue progreso operativo de disponibilidad semántica y publica `activeContextReady`, `projectReady` y `workspaceReady` sobre esa misma fuente;
- `discoverWorkspace` expone progreso monotónico de discovery y el servidor reutiliza esa señal para transiciones coherentes sin abrir un segundo camino de status.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/146-indexer-progress-readiness/quickstart.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/progressReadiness|unit/workspace|unit/watchedFileIntake"`
- `npm test` → smoke `2 passing`, unit `386 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.27 B158. Modo degradado formal — **Cerrada (spec 147)**

### Resultado técnico registrado

`Spec 147` queda cerrada sobre el runtime real de serving:

- existe ya una enumeración formal de niveles (`structural-only`, `nearby-semantic-ready`, `project-semantic-ready`, `workspace-semantic-ready`) y un helper único que decide `allow`, `degrade` o `block` por feature;
- `hover` y `completion` consumen el contrato en modo degradado, mientras `definition`, `references` y `rename` se bloquean o habilitan según el nivel requerido sin fingir precisión semántica;
- el mapping se apoya en la fuente única de progreso/readiness ya cerrada en `B134`, sin duplicar lógica en el query engine ni abrir una segunda vía de elegibilidad.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/147-formal-degraded-mode/quickstart.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/featureReadiness|unit/progressReadiness|unit/definition|unit/references|unit/hover|unit/completion|unit/renamePreflight"`
- `npm test` → smoke `2 passing`, unit `390 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing` (segunda ejecución; la primera fue ruido no reproducible de entorno)

---

## 1.28 B159. Gobernador de latencia del servidor — **Cerrada (spec 148)**

### Resultado técnico registrado

`Spec 148` queda cerrada sobre el runtime real del servidor:

- el `latencyGovernor` deja de estar encapsulado solo en el indexador y pasa a proteger también el serving interactivo y la admisión de trabajo de fondo desde el `scheduler`;
- existe una política explícita por tipo de request: `hover` y `completion` degradan bajo presión, `references` se bloquea bajo presión, y el background queda aplazado durante un cooldown corto sin romper el pipeline;
- la presión de latencia ya es observable y reutilizable en el runtime, alineada con el contrato de degradación de `B158`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/148-server-latency-governor/quickstart.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/latencyGovernor|unit/scheduler|unit/featureReadiness|unit/hover|unit/completion|unit/references"`
- `npm test` → smoke `2 passing`, unit `394 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.29 B156. Query engine unificado — **Cerrada (spec 164 + cierre operativo posterior)**

### Resultado técnico registrado

`B156` queda cerrada como capacidad real del runtime:

- el helper común de contexto de query y el resolver semántico detallado alimentan ya el hot path de `hover`, `definition`, `signatureHelp`, `completion` y la resolución de declaración en `references`;
- `references` deja de elegir definiciones solo por nombre cuando el acceso es cualificado y pasa a usar el mismo winner semántico que `definition`;
- `completion` deja de depender de un contexto documental paralelo para obtener el objeto activo y el tipo del cualificador;
- existe una prueba de consistencia cross-feature que fija el mismo contexto base entre `definition`, `references` y `completion`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/164-query-context-helper/quickstart.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/references|unit/completion|unit/queryEngineConsistency|unit/definition|unit/semanticQueryService"`
- `npm test` → smoke `2 passing`, unit `396 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.30 B173. Precomputed member closures por tipo — **Cerrada**

### Resultado técnico registrado

`B173` queda cerrada como infraestructura reusable del runtime:

- `InheritanceGraph` precomputa una closure de miembros por tipo con `relation`, `distance`, `accessible` y marca de override local;
- `getMembers()` deja de reconstruir la misma lista plana por su cuenta y pasa a reutilizar esa closure cacheada;
- la información precomputada ya queda disponible para consumers del query engine y deja preparada una base honesta para `B066`, `B065` y `B031`.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run test:unit -- --grep "InheritanceGraph|unit/completion|unit/definition|unit/references|unit/hover|unit/semanticQueryService"`
- `npm test` → smoke `2 passing`, unit `397 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.31 B066. CodeLens de referencias y herencia — **Cerrada (spec 050 ampliada)**

### Resultado técnico registrado

`B066` deja de ser una lens cosmética y queda cerrada como feature usable:

- el handler del servidor ya no usa `findAllDefinitions(name)` como proxy bruto de referencias y pasa a calcular conteos sobre el motor compartido de `references`;
- los títulos de CodeLens incorporan información de overrides/herencia consumiendo `member closures` de `B173`;
- existe caché de conteos por documento/epoch para no reescanear el workspace en cada solicitud;
- si `references` no está lista por readiness o presión de latencia, la lens degrada honestamente y deja de exponer un comando engañoso.

### Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/050-codelens-refs/spec.md`
- `specs/050-codelens-refs/tasks.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/codeLensReferences|unit/references|unit/queryEngineConsistency|unit/featureReadiness"`
- `npm test` → smoke `2 passing`, unit `400 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.32 B065. Ancestor script navigation + hierarchy inspection — **Cerrada (spec 059, absorbiendo B137)**

### Resultado técnico registrado

`B065` deja de ser un par de helpers aislados y queda cerrada como inspección jerárquica usable:

- `getAncestorChain` y `buildHierarchyTree` pasan a alimentar una inspección estructurada del tipo activo con ancestro inmediato, cadena de ancestros, árbol de descendencia y overrides heredados;
- el runtime reutiliza `member closures` de `B173` para explicar overrides locales e integrar accesibilidad y origen heredado sin duplicar lógica semántica;
- la extensión publica el comando `PowerSyntax: Inspeccionar Jerarquía Activa`, que ejecuta la inspección sobre el documento y posición activos y expone el resultado de forma visible desde el cliente.

### Documentación afectada

- `README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/059-ancestor-chain/spec.md`
- `specs/059-ancestor-chain/plan.md`
- `specs/059-ancestor-chain/tasks.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/hierarchyInspection|unit/ancestorNav|unit/hierarchyTree"`
- `npm test` → smoke `2 passing`, unit `401 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing` (segunda ejecución; la primera falló por ruido no reproducible del host)

---

## 1.33 B109. API pública para integración — **Cerrada (spec 054 ampliada sobre specs 172 y 192)**

### Resultado técnico registrado

`B109` deja de ser solo un archivo de tipos y queda cerrada como superficie pública mínima real:

- la activación de la extensión exporta una API versionada y estable para consumidores externos;
- la API expone `getServerStats()` sobre el contrato maduro de `ApiServerStats` y `querySymbols()` sobre `ApiQuerySymbolsRequest`/`ApiSymbol`, sin abrir estructuras internas mutables ni prometer evidence que aún pertenece a `B157`;
- el flujo `build:test` recompila ahora cliente y servidor antes de smoke/unit/integration, evitando validar contra artefactos obsoletos del `out/`.

### Documentación afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/testing.md`
- `specs/054-public-api/spec.md`
- `specs/054-public-api/plan.md`
- `specs/054-public-api/tasks.md`

### Validación registrada

- `npm run test:smoke -- --grep "smoke/extension"`
- `npm run test:unit -- --grep "unit/publicApi"`
- `npm test` → smoke `2 passing`, unit `401 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.34 B164. Interning y compactación de memoria — **Cerrada**

### Resultado técnico registrado

`B164` queda cerrada como optimización interna real y observable:

- `KnowledgeBase` y `DocumentCache` compactan por documento las strings calientes de URIs, ids, nombres, owners, tipos y contenedores antes de persistir facts/scopes/snapshots;
- la compactación no introduce fugas silenciosas: al reemplazar o invalidar un documento, el interner libera sus referencias y el pool vuelve a tamaño cero cuando el documento desaparece;
- el estado queda observable vía stats (`internedStrings`) para no dejar la optimización como una caja negra no verificable.

### Documentación afectada

- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/managedStringInterner|unit/knowledge"`
- `npm test` → smoke `2 passing`, unit `404 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

## 1.35 B063. Diagnostics snapshot agrupado — **Cerrada**

## 1.36 B171. Confidence gates por feature — **Cerrada (runtime coverage 2026-05)**

**Objetivo:** que cada feature opere solo con el nivel de confianza adecuado.

**Resultado registrado:**
- `src/server/features/featureReadiness.ts` ya fija comparador, thresholds mínimos y decisión base por feature;
- `src/server/features/servingReadiness.ts` encapsula el gate de runtime consumido por los handlers sensibles;
- `src/server/server.ts` reutiliza ese gate en `references`, `prepareRename` y `rename` para devolver fallback seguro y mensaje estable cuando la confidence no alcanza el umbral requerido;
- `test/server/unit/servingReadiness.test.ts` aporta evidencia negativa ejecutable para `references` y `rename` bajo confidence insuficiente, además del caso positivo con confidence alta.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(servingReadiness|featureReadiness)"`

## 1.37 B167. Journaling transaccional de caché persistente — **Cerrada (recovery robusto 2026-05)**

**Objetivo:** evitar corrupción de caché y estados incompletos.

**Resultado registrado:**
- `src/server/cache/cacheStore.ts` mantiene journal persistente, lo limpia al consolidar checkpoint y recompone el restore aplicando solo entradas válidas;
- el loader distingue ahora entre estado ausente y payload JSON corrupto/truncado, forzando rebuild limpio cuando el journal o el checkpoint quedaron a medias;
- la validación existente de secuencia y entradas del journal en `src/server/cache/cacheCheckpoint.ts` queda reforzada por recovery explícito ante corrupción parcial en disco;
- `test/server/unit/cacheStore.test.ts` y `test/server/unit/cachePersistence.test.ts` cubren limpieza del journal, secuencias inválidas y truncado/corrupción parcial del estado persistido.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(cacheStore|cachePersistence)"`

## 1.38 B168. Cache schema versioning + migraciones — **Cerrada (policy/documentation 2026-05)**

**Objetivo:** versionar persistencia y decidir migrate/invalidate/rebuild con seguridad.

**Resultado registrado:**
- `src/server/cache/cacheSchema.ts` mantiene un schema persistente explícito para `checkpoint` y `journal`, con migradores internos para payloads compatibles del mismo corte;
- `src/server/cache/cacheCheckpoint.ts` conserva la política canónica: payload compatible se normaliza y reutiliza, `schemaVersion` desconocido o incompatible fuerza `rebuild` limpio;
- `docs/architecture.md` documenta la política oficial de migrate/rebuild y el contenido del schema persistente para checkpoint y journal;
- `test/server/unit/cachePersistence.test.ts` cubre tanto el camino compatible sin `schemaVersion` explícito como el rebuild seguro por versión incompatible.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/cachePersistence"`

## 1.39 B071. Warm indexing y resume de caché persistente — **Cerrada (observable closure 2026-05)**

**Objetivo:** evitar cold indexing en cada reapertura.

**Resultado registrado:**
- la base de persistencia ya permite warm resume real de `DocumentCache` y `KnowledgeBase`, con reuse/rebuild seguro sobre `cacheStore` y `checkpoint` persistido;
- `test/results/003-real-corpora-baseline.md` deja medido el delta cold/warm en corpus grandes reales de PFC Workspace;
- `src/shared/publicApi.ts`, `src/server/server.ts` y `src/client/statusBarPresentation.ts` exponen ahora en stats/status si la reapertura quedó en `restored`, `reused` o `rebuilt`, junto con el número de documentos restaurados y la snapshot de serving reaprovechada;
- la barra de estado y sus reportes dejan visible ese estado sin depender solo de logs internos.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(statusBarPresentation|publicApi)"`
- `npm run test:performance`

## 1.40 B205. PowerBuilder grammar canonical module — **Cerrada (shared grammar consolidation 2026-05)**

**Objetivo:** centralizar patrones, keywords y matchers estructurales de PowerBuilder en un módulo canónico.

**Resultado registrado:**
- `src/server/parsing/grammar.ts` consolida keywords, matchers de secciones, bloques ejecutables y patrones estructurales reutilizados por parsing y diagnostics;
- `src/server/parsing/controlBlocks.ts`, `src/server/parsing/sectionMachine.ts`, `src/server/features/diagnosticsExtra.ts` y `src/server/analysis/documentAnalysis.ts` dejan de duplicar regex críticas y consumen patrones compartidos o matchers canónicos;
- la suite de gramática queda reforzada con cobertura de `type prototypes` y `owner type variables` en `test/server/unit/sectionMachine.test.ts`.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(sectionMachine|matchers|documentAnalysis|diagnosticsExtra)"`

## 1.41 B036. Code actions básicas — **Cerrada (safe quick-fix baseline 2026-05)**

**Objetivo:** quick fixes pequeños, seguros y explicables.

**Resultado registrado:**
- `src/server/features/codeActions.ts` fija un catálogo mínimo y estable sobre SD7, limitado a un reemplazo simple dentro del rango diagnosticado;
- cada action expone metadata explícita de `evidence`, `confidence` y tipo de edición segura;
- el provider rechaza sugerencias no seguras fuera del patrón de identificador simple, evitando modificaciones peligrosas o ambiguas.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/codeActions"`

## 1.42 B160. Query result cache con claves semánticas estables — **Cerrada (observable serving cache 2026-05)**

**Objetivo:** cachear respuestas semánticas seguras.

**Resultado registrado:**
- `src/server/knowledge/ServingCache.ts` deja cubiertas claves estables para `hover`, `definition`, `signatureHelp` y `completion`, incluyendo discriminadores extra y epoch semántica;
- `src/server/server.ts` reutiliza `resolveServingReadiness` también en cache hits de `definition`, de modo que el resultado cacheado sigue respetando readiness y `resolutionConfidence` antes de servirse;
- `src/shared/publicApi.ts` y `src/client/statusBarPresentation.ts` hacen observable el hit ratio, misses y evictions del serving cache en stats y status.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(ServingCache|servingReadiness|statusBarPresentation)"`

## 1.43 B157. Semantic evidence de primera clase — **Cerrada (diagnostics parity 2026-05)**

**Objetivo:** modelar formalmente por qué una resolución ganó o fue descartada.

**Resultado registrado:**
- el query engine ya dejaba cubiertos `winner evidence`, `candidatePool`, descartes por distancia/contexto, ambigüedad mínima, `confidence`, `queryContext`, `queryTrace`, hover y policy base por feature;
- `src/server/features/diagnostics.ts` reutiliza ahora `semanticQueryService` también para SD2, evitando reconstruir resolución local y proyectando un resumen seguro de `confidence`, `reasonCodes`, `evidenceKinds` y cardinalidad en `Diagnostic.data`;
- diagnostics, stats/API y consumers sensibles quedan alineados sobre la misma semántica explicable sin abrir una segunda lógica de resolución.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/diagnostics"`

## 1.44 B031. Referencias más precisas y robustas — **Cerrada (topología real + masking + family filtering 2026-05)**

**Objetivo:** referencias cross-file y contexto fuerte sin matching superficial.

**Resultado registrado:**
- `src/server/server.ts` deja de limitar `references` a documentos abiertos y pasa a recopilar fuentes sobre `WorkspaceState`, preservando además documentos abiertos fuera del inventario para no perder contexto activo;
- `src/server/features/references.ts` deja de escanear contenido crudo y reutiliza el masking canónico de strings/comentarios antes del matching textual, evitando falsos positivos en literales y comentarios;
- cada ocurrencia candidata se revalida contra la misma familia semántica resuelta por el query engine compartido, de modo que owners homónimos no contaminan el resultado aunque exista match textual coincidente;
- el resultado sigue bloqueado o habilitado por `confidence/readiness` del runtime ya cerrados en `B171`, manteniendo `references` explicable sobre topología real sin reabrir una segunda lógica de resolución.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/references"`
- `npm run test:unit -- --grep "unit/queryEngineConsistency"`
- `npm run test:unit -- --grep "unit/codeLensReferences|unit/references|unit/queryEngineConsistency|unit/featureReadiness"`

## 1.45 B155. Checkpoints reales de indexación y resume robusto — **Cerrada (discovery snapshot + restore temprano validado 2026-05)**

**Objetivo:** reaperturas rápidas y resume seguro del pipeline.

**Resultado registrado:**
- `src/server/cache/cacheSchema.ts` y `src/server/cache/cacheCheckpoint.ts` amplían el contrato persistente con un snapshot explícito de discovery (`roots` + `sourceFiles`) normalizado junto a la metadata ya existente del checkpoint;
- `src/server/workspace/workspaceState.ts` expone export/restore/reemplazo controlado del snapshot de discovery para separar el estado restaurado del estado redescubierto sin contaminar el inventario real del workspace;
- `src/server/server.ts` aplica ahora restore temprano de `DocumentCache`, `KnowledgeBase`, serving snapshot y discovery snapshot antes del redescubrimiento, ejecuta el discovery real sobre un `WorkspaceState` temporal y valida después la metadata completa antes de indexar o conservar el resume;
- el servidor siembra además un checkpoint actualizado justo tras discovery, de modo que una sesión interrumpida durante la indexación ya conserva discovery/readiness base y puede reencolar solo trabajo pendiente o incompatible en la reapertura siguiente.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/workspace|unit/cachePersistence"`
- `npm run test:unit -- --grep "unit/cacheStore|unit/statusBarPresentation|unit/publicApi"`

## 1.46 B032. Rename controlado — **Cerrada (queryContext real + workspace edit seguro + bloqueo dinámico 2026-05)**

**Objetivo:** ampliar rename solo en escenarios semánticamente seguros.

**Resultado registrado:**
- `src/server/features/rename.ts` introduce un helper puro que reutiliza `queryContext`, `references` y `renamePreflight` para construir `WorkspaceEdit` solo cuando existe un target único y seguro;
- `src/server/server.ts` deja de renombrar por scope léxico local y delega `onRenameRequest` al helper semántico con fuentes reales del workspace;
- el rename queda habilitado para variables locales, parámetros y miembros resueltos por qualifier/hierarchy con confidence alta, y bloqueado con razón estable ante ambigüedad, fallback global o hits dinámicos en strings;
- `test/server/unit/rename.test.ts` cubre parámetros locales, miembros tipados cross-file, bloqueo por fallback global y bloqueo por referencias dinámicas.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/rename|unit/renamePreflight"`
- `npm run test:unit -- --grep "unit/dynamicStringReferences|unit/rename|unit/renamePreflight|unit/references|unit/queryEngineConsistency|unit/featureReadiness|unit/servingReadiness|unit/codeLensReferences"`

## 1.47 B208. Dynamic string reference detector — **Cerrada (clasificación conservadora + degradación honesta 2026-05)**

**Objetivo:** detectar referencias relevantes en strings dinámicos y degradar operaciones peligrosas cuando no exista cobertura fiable.

**Resultado registrado:**
- `src/server/features/dynamicStringReferences.ts` añade un detector reusable con clasificación `safe-literal`, `probable`, `dynamic`, `unknown` sobre `Open`, `DataObject`, `PostEvent`, `TriggerEvent`, `EvaluateJavascriptSync/Async`, JSON paths, SQL dinámico y `Describe/Modify/Evaluate`;
- `src/server/features/rename.ts` bloquea el rename cuando el símbolo aparece en un hit no seguro dentro de strings dinámicos;
- `src/server/features/references.ts` degrada a definiciones cuando detecta ese riesgo, evitando prometer cobertura textual completa en presencia de referencias dinámicas;
- la surface actual de code actions sigue siendo un quick-fix local de diagnóstico de rango único, por lo que no necesita una ruta adicional de degradación semántica para este cierre.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/dynamicStringReferences|unit/rename|unit/renamePreflight|unit/references"`
- `npm run test:unit -- --grep "unit/dynamicStringReferences|unit/rename|unit/renamePreflight|unit/references|unit/queryEngineConsistency|unit/featureReadiness|unit/servingReadiness|unit/codeLensReferences"`

## 1.48 B204. Source origin model unificado — **Cerrada (contrato compartido + persistence + API/diagnostics 2026-05)**

**Objetivo:** clasificar de forma uniforme el origen de cada documento, símbolo y snapshot semántico.

**Resultado registrado:**
- `src/shared/sourceOrigin.ts` introduce un contrato compartido de `sourceOrigin` con prioridad explícita entre source real, staging, export, generated, backup y unknown;
- `src/server/workspace/workspaceState.ts`, `src/server/workspace/discovery.ts`, `src/server/cache/cacheSchema.ts` y `src/server/cache/cacheCheckpoint.ts` persisten y restauran origen por archivo junto al snapshot de discovery del workspace;
- `src/server/analysis/documentAnalysis.ts`, `src/server/knowledge/types.ts` y `src/server/knowledge/resolution/semanticQueryService.ts` propagan `sourceOrigin` a lineage y evidence del query engine;
- `src/server/features/diagnostics.ts`, `src/server/features/diagnosticsSnapshot.ts`, `src/server/features/workspaceSymbols.ts`, `src/server/server.ts` y `src/client/extension.ts` exponen `sourceOrigin` en diagnostics snapshot, stats y API pública de `querySymbols()` sin abrir una surface paralela.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/sourceOrigin|unit/workspace|unit/cachePersistence|unit/publicApi"`
- `npm run test:unit -- --grep "unit/sourceOrigin|unit/workspace|unit/cachePersistence|unit/publicApi|unit/workspaceSymbols|unit/diagnosticsSnapshot|unit/diagnostics"`
- `npm run test:unit -- --grep "unit/sourceOrigin|unit/workspace|unit/cachePersistence|unit/publicApi|unit/workspaceSymbols|unit/diagnosticsSnapshot|unit/diagnostics|unit/queryEngineConsistency|unit/references|unit/rename|unit/renamePreflight|unit/featureReadiness|unit/servingReadiness"`

## 1.49 B206. Rich PowerBuilder symbol metadata — **Cerrada (metadata contractual viva + hover/document analysis 2026-05)**

**Objetivo:** enriquecer progresivamente el modelo de símbolo con metadata específica de PowerBuilder.

**Resultado registrado:**
- `src/server/analysis/documentAnalysis.ts`, `src/server/model/types.ts` y `src/server/knowledge/types.ts` propagan `containerKind`, `containerSignature`, `fileObjectName`, `declarationScope`, `implementationKind`, `ownerName`, `parameterCount`, `returnType`, `access` y `sourceOrigin` en el modelo real cuando aplica;
- `src/server/knowledge/enrichEntity.ts` consolida derivaciones estables para `ownerName`, `declarationScope` e `implementationKind`, incluyendo distinción explícita entre `on-handler` y `external-function`;
- `src/server/features/hoverFormat.ts` consume esa metadata para explicar prototype, implementation, on-handler, external function, member/local/parameter y owner real sin recomputar semántica fuera del backbone;
- `src/server/knowledge/stringInterning.ts` y `src/server/knowledge/semanticDiff.ts` incorporan los nuevos campos para que la metadata enriquecida participe en internado, diff y persistencia sin modelos paralelos.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/documentAnalysis|unit/enrichEntity|unit/hoverFormat"`
- `npm run test:unit -- --grep "unit/documentAnalysis|unit/enrichEntity|unit/hoverFormat|unit/hover|unit/semanticTokens|unit/documentSymbols|unit/references|unit/rename|unit/renamePreflight|unit/queryEngineConsistency"`
- `npm run test:unit -- --grep "unit/documentAnalysis|unit/enrichEntity|unit/hoverFormat|unit/hover|unit/documentSymbols|unit/references|unit/rename|unit/renamePreflight|unit/queryEngineConsistency|unit/cachePersistence|unit/workspaceSymbols"`

## 1.50 B209. PowerBuilder call model and invocation classification — **Cerrada (invocationKind/invocationRisk + parent/ancestor 2026-05)**

**Objetivo:** clasificar llamadas PowerBuilder según forma y riesgo semántico.

**Resultado registrado:**
- `src/server/utils/invocationContext.ts` distingue ya `.` y `::`, preservando la forma sintáctica de invocación para `this`, `parent`, `super`, `ancestor` y qualifiers tipados;
- `src/server/knowledge/resolution/semanticQueryService.ts` resuelve el current object real por línea/scope, añade `invocationKind`, `invocationRisk` y `resolvedQualifierType`, y soporta `parent.uf_xxx()` y `ancestor::event` como rutas explícitas del query engine compartido;
- `src/server/features/queryContext.ts`, `src/server/knowledge/queryTrace.ts` y `src/shared/publicApi.ts` propagan la clasificación de invocación a traces y contexto compartido, de modo que definition/references/rename/completion/signatureHelp puedan explicar cómo se resolvió cada callsite;
- los tests focalizados cubren `invocationContext`, `queryContext`, `semanticQueryService` y `definition`, y la validación lateral mantiene verdes `references`, `rename`, `renamePreflight`, `queryEngineConsistency`, `completion` y `signatureHelp`.

**Validación registrada:**
- `npm run test:unit -- --grep "server/utils/invocationContext|unit/queryContext|unit/semanticQueryService|unit/definition"`
- `npm run test:unit -- --grep "server/utils/invocationContext|unit/queryContext|unit/semanticQueryService|unit/definition|unit/references|unit/rename|unit/renamePreflight|unit/queryEngineConsistency|unit/completion|unit/signatureHelp"`

## 1.51 B210. PowerBuilder event model — **Cerrada (owner real + TriggerEvent/PostEvent estables 2026-05)**

**Objetivo:** modelar eventos PowerBuilder como entidades semánticas de primera clase.

**Resultado registrado:**
- `src/server/parsing/grammar.ts`, `src/server/parsing/matchers.ts` y `src/server/model/types.ts` separan owner y event name en `on object.event`, preservando además la firma cualificada original del handler;
- `src/server/analysis/documentAnalysis.ts` cuelga el scope del evento del owner real, estabiliza `containerName`/`ownerName` de on-handlers y deja de modelar los eventos como nombres planos `owner.event` dentro del backbone semántico;
- `src/server/utils/invocationContext.ts`, `src/server/features/queryContext.ts`, `src/server/features/definition.ts` y `src/server/features/references.ts` sintetizan contexto semántico para literales estables de `TriggerEvent/PostEvent`, permitiendo navegación y referencias sobre eventos reales sin abrir un motor paralelo;
- la validación lateral mantiene verdes `hover`, `hoverFormat`, `documentSymbols`, `semanticTokens`, `completion`, `signatureHelp`, `rename`, `renamePreflight`, `dynamicStringReferences` y `queryEngineConsistency` sobre el modelo nuevo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/matchers|unit/documentAnalysis|unit/definition"`
- `npm run test:unit -- --grep "server/utils/invocationContext|unit/queryContext|unit/definition|unit/references"`
- `npm run test:unit -- --grep "unit/matchers|unit/documentAnalysis|server/utils/invocationContext|unit/queryContext|unit/definition|unit/references|unit/rename|unit/renamePreflight|unit/queryEngineConsistency|unit/hover|unit/hoverFormat|unit/documentSymbols|unit/semanticTokens|unit/completion|unit/signatureHelp|unit/dynamicStringReferences"`

## 1.52 B207. External functions and native dependency model — **Cerrada (dll/pbx/unknown + degradación honesta 2026-05)**

**Objetivo:** modelar funciones externas, DLL/PBX/PBNI y dependencias nativas sin tratarlas como símbolos internos.

**Resultado registrado:**
- `src/server/parsing/externalFunctions.ts`, `src/server/model/types.ts`, `src/server/knowledge/types.ts` y `src/server/analysis/documentAnalysis.ts` conservan ya librería, alias y clasificación `dll`/`pbx`/`unknown` en el modelo real de external functions/subroutines;
- `src/server/features/hoverFormat.ts` explica dependencia externa, alias y tipo nativo, mientras `src/server/features/rename.ts` bloquea rename y `src/server/features/references.ts` degrada a la declaración cuando el target es externo;
- `src/server/features/diagnostics.ts` emite una nota informativa para dependencias nativas sin implementación interna navegable, evitando presentar la declaración externa como definition interna del workspace;
- `src/server/knowledge/stringInterning.ts`, `src/server/knowledge/semanticDiff.ts`, `unit/cachePersistence` y `unit/workspaceSymbols` validan que la metadata nativa no quede muerta fuera del path inmediato de hover/serving.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/externalFunctions|unit/documentAnalysis|unit/hoverFormat|unit/rename|unit/references|unit/diagnostics"`
- `npm run test:unit -- --grep "unit/externalFunctions|unit/documentAnalysis|unit/hoverFormat|unit/hover|unit/rename|unit/renamePreflight|unit/references|unit/diagnostics|unit/queryEngineConsistency|unit/semanticQueryService|unit/cachePersistence|unit/workspaceSymbols"`

## 1.53 B211. Transaction and SQLCA semantic model — **Cerrada (SQLCA especial + binding básico transaction/DataWindow 2026-05)**

**Objetivo:** modelar `Transaction`, `SQLCA`, `SetTransObject`, `SetTrans`, `Retrieve`, `Update` y SQL embebido sin semántica plana ni inventada.

**Resultado registrado:**
- `src/server/knowledge/resolution/semanticQueryService.ts` y `src/server/features/queryContext.ts` tratan ya `SQLCA` como transaction global especial, estabilizando el owner-type de `SQLCA.*` dentro del query engine compartido;
- `src/server/features/completion.ts`, `src/server/features/hover.ts` y `src/server/features/signatureHelp.ts` resuelven members del catálogo filtrando por `ownerType`, con lo que `datastore/datawindow.Retrieve`, `Update`, `SetTransObject`, `SetTrans` y `SQLCA.DBHandle()` explican la entrada correcta del catálogo en vez de una coincidencia plana por nombre;
- `src/server/features/diagnostics.ts` enlaza `SetTransObject`/`SetTrans` con `Retrieve`/`Update`, informa transaction desconocida y degrada la confidence cuando el binding es dinámico;
- la parte de SQL estático/dinámico reaprovecha las piezas ya cerradas en `sqlRegions` y `dynamicStringReferences`, sin abrir un motor paralelo para B211.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/completion"`
- `npm run test:unit -- --grep "unit/diagnostics"`
- `npm run test:unit -- --grep "unit/(hover|signatureHelp)"`
- `npm run test:unit -- --grep "unit/(completion|diagnostics|hover|signatureHelp|sqlRegions|dynamicStringReferences)"`

## 1.54 B213. PowerBuilder object lifecycle model — **Cerrada (create/destroy + hooks constructor/destructor 2026-05)**

**Objetivo:** modelar create/destroy, constructor/destructor y ancestor flow sin tratarlos como eventos o wiring planos.

**Resultado registrado:**
- `src/server/features/hierarchyInspection.ts` proyecta ya lifecycle create/destroy con evidence de `call super::create/destroy`, hook disparado (`constructor/destructor`), resolución del hook y warnings suaves por wiring sospechoso desde el snapshot semántico publicado;
- `src/server/features/hover.ts` reutiliza ese mismo bloque para explicar `constructor/destructor` resueltos desde `TriggerEvent(this, ...)` y no presentarlos como eventos aislados;
- `src/server/features/diagnostics.ts` emite warnings suaves reutilizando el mismo backbone (`missing-super-*`, `missing-trigger-*`, `unresolved-*`) cuando el lifecycle declarado por el tipo es sospechoso;
- la navegación base de `call super::create` y de literales estables de `TriggerEvent/PostEvent` ya permanecía soportada por `definition` y el query engine compartido cerrado en `B210`, así que B213 se cerró como proyección consistente, no como un motor nuevo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/hierarchyInspection"`
- `npm run test:unit -- --grep "unit/hover"`
- `npm run test:unit -- --grep "unit/diagnostics"`
- `npm run test:unit -- --grep "unit/(hierarchyInspection|hover|diagnostics|definition)"`

## 1.55 B212. DataObject binding model — **Cerrada (bridge PowerScript/.srd + retrieve args 2026-05)**

**Objetivo:** modelar bindings básicos entre PowerScript, DataWindow/DataStore y objetos `.srd` sin abrir un parser DataWindow paralelo ni fingir navegación para bindings dinámicos.

**Resultado registrado:**
- `src/server/analysis/documentAnalysis.ts` publica un stub navegable para `.srd` como `datawindow`, de forma que el objeto exportado entra en `KnowledgeBase` y puede servir como target semántico sin parsear `.srd` como PowerScript;
- `src/server/features/definition.ts` y `src/server/features/hover.ts` reutilizan ese mismo backbone para navegar y explicar `DataObject = "d_xxx"` cuando el binding literal apunta a un `.srd` único ya indexado;
- `src/server/features/signatureHelp.ts` especializa `Retrieve(...)` leyendo los args reales desde `arguments=(...)` y `ARG(...)` del snapshot `.srd` enlazado por `DataObject`, en vez de quedarse en la firma plana del catálogo;
- `src/server/features/diagnostics.ts` distingue binding `DataObject` faltante, ambiguo o dinámico y además avisa cuando `Retrieve(...)` no respeta la aridad declarada por el `.srd`, compartiendo transaction, confidence y degradación honesta en el mismo flujo semántico.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(documentAnalysis|definition)"`
- `npm run test:unit -- --grep "unit/signatureHelp"`
- `npm run test:unit -- --grep "unit/diagnostics"`
- `npm run test:unit -- --grep "unit/(documentAnalysis|definition|hover|diagnostics|signatureHelp)"`

## 1.56 B222. PowerBuilder semantic golden suite — **Cerrada (backbone semántico congelado 2026-05)**

**Objetivo:** fijar con evidencia ejecutable el comportamiento semántico PowerBuilder ya soportado por el backbone compartido para detectar regresiones antes de abrir más superficie.

**Resultado registrado:**
- `test/server/unit/powerbuilderSemanticGolden.test.ts` congela scope resolution, prototypes vs implementations, herencia visible, event handlers, external functions, binding `DataObject` literal, downgrade dinámico y conflictos de `sourceOrigin` sobre fixtures reales del repositorio;
- el hallazgo de la suite destapó y corrigió un bug real en `src/server/knowledge/resolution/InheritanceGraph.ts`: para variables miembro a igual distancia de herencia, la closure ahora desempata con prioridad `Compartida -> Global -> Instancia` en vez de depender solo de la distancia;
- `definition`, `hover`, `signatureHelp`, `diagnostics`, `references` y `rename` quedan cubiertos contra esa misma base semántica sin crear harnesses paralelos ni duplicar resolución.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/powerbuilderSemanticGolden"`
- `npm run test:unit -- --grep "unit/(powerbuilderSemanticGolden|scopeResolution|semanticQueryService|definition|hover|signatureHelp|diagnostics|references|rename|renamePreflight|sourceOrigin)"`

## 1.57 B217. AI context pack for current object — **Cerrada (contexto read-only fiable 2026-05)**

**Objetivo:** servir a IA un paquete read-only del objeto activo con contexto semántico rico y trazable, sin releer todo el workspace ni reconstruir semántica fuera del backbone compartido.

**Resultado registrado:**
- `src/server/features/currentObjectContext.ts` construye ya un context pack del objeto activo a partir de `getDocumentAnalysis()`, `KnowledgeBase`, `hierarchyInspection`, diagnostics reales y bindings `DataObject`, incluyendo metadata, excerpt, `sourceOrigin`, proyecto/librería, ancestor chain, functions/events/prototypes, referenced symbols, diagnostics, evidence/confidence y related files;
- `src/server/server.ts` expone el contrato por `powerbuilder.currentObjectContext`, y `src/client/extension.ts` lo publica vía `getCurrentObjectContext()` dentro de la API pública versionada de la extensión;
- `src/server/features/diagnostics.ts` ahora comparte `buildDiagnosticsForDocument()` para que el context pack reutilice exactamente la misma lógica de diagnostics que el publish real, y `src/server/features/dataWindowBindingModel.ts` exporta un resumen de bindings reutilizable sin abrir otro parser o un flujo paralelo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/currentObjectContext"`
- `npm run test:unit -- --grep "unit/(currentObjectContext|objectInfo|hierarchyInspection|diagnostics|signatureHelp|powerbuilderSemanticGolden)"`
- `npm test -- --grep "smoke/extension"`

## 1.58 B218. Spec impact analyzer — **Cerrada (impacto read-only explícito 2026-05)**

**Objetivo:** calcular impacto probable de una spec o cambio usando el backbone semántico real, para que la IA no planifique ni edite a ciegas.

**Resultado registrado:**
- `src/server/features/impactAnalysis.ts` calcula ya símbolos afectados, referencias seguras, descendientes, overrides, eventos relacionados, DataWindows vinculadas, archivos probables de impacto y build targets conocidos reutilizando `references`, `InheritanceGraph`, `currentObjectContext` y `WorkspaceState` en un único resultado serializable;
- `src/server/server.ts` expone el análisis por `powerbuilder.analyzeImpact`, y `src/client/extension.ts` lo añade a la API pública versionada como `analyzeImpact()` sin abrir todavía ejecución automática;
- el análisis degrada con honestidad cuando no puede resolver un símbolo raíz y mantiene confidence/evidence explícitas cuando la resolución sí existe.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/impactAnalysis"`
- `npm run test:unit -- --grep "unit/(impactAnalysis|currentObjectContext|references|hierarchyInspection|diagnostics|signatureHelp|powerbuilderSemanticGolden)"`

## 1.59 B219. Safe edit plan generator — **Cerrada (plan read-only trazable 2026-05)**

**Objetivo:** generar un plan de edición seguro antes de aplicar cambios, dejando explícitos archivos/objetos, razones, riesgos, tests, docs y bloqueos por ambigüedad.

**Resultado registrado:**
- `src/server/features/safeEditPlan.ts` construye ya un plan read-only a partir del impacto explícito, clasificando archivos por rol/riesgo, agregando tests recomendados, docs a revisar y bloqueos honestos cuando la confidence no alcanza;
- `src/server/server.ts` expone el plan por `powerbuilder.safeEditPlan`, y `src/client/extension.ts` lo añade a la API pública versionada como `generateSafeEditPlan()` sin convertirlo en ejecución automática;
- el plan mantiene trazabilidad suficiente para IA: objetos afectados, razones por archivo, riesgos, confidence y casos bloqueados, pero no toca código ni finge seguridad cuando el análisis es ambiguo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/safeEditPlan"`
- `npm run test:unit -- --grep "unit/(safeEditPlan|impactAnalysis|currentObjectContext|references|hierarchyInspection|diagnostics|signatureHelp|powerbuilderSemanticGolden)"`

## 1.60 B220. AI-readable semantic workspace manifest — **Cerrada (manifiesto compacto/versionado 2026-05)**

**Objetivo:** exportar un manifiesto semántico compacto y versionado para agentes IA sin obligarlos a escanear manualmente todo el workspace.

**Resultado registrado:**
- `src/server/features/semanticWorkspaceManifest.ts` compone ya un manifiesto read-only con `projects`, `libraries`, `objects`, `inheritanceSummary`, `exportedSymbols`, `diagnosticsSummary`, `sourceOriginSummary`, `readiness`, `schemaVersion` y límites explícitos de payload;
- `src/server/server.ts` lo expone por `powerbuilder.semanticWorkspaceManifest`, y `src/client/extension.ts` lo añade a la API pública versionada como `getSemanticWorkspaceManifest()`;
- el resultado reutiliza `WorkspaceState`, `UnifiedProjectModel`, `KnowledgeBase`, `InheritanceGraph` y `diagnostics snapshot` ya publicados, sin exportar código bruto ni abrir un canal paralelo fuera del backbone semántico.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/semanticWorkspaceManifest"`
- `npm run test:unit -- --grep "unit/(semanticWorkspaceManifest|safeEditPlan|impactAnalysis|currentObjectContext|references|hierarchyInspection|diagnostics|signatureHelp|powerbuilderSemanticGolden)"`

## 1.61 B117. DataWindow safe mode mínimo — **Cerrada (safe mode .srd explícito 2026-05)**

**Objetivo:** soporte seguro mínimo de `.srd` con detección, SQL base, argumentos, columnas, bandas principales y hover/navegación básica sin parsear DataWindow como PowerScript completo.

**Resultado registrado:**
- `src/server/features/dataWindowSafeMode.ts` resume ya `retrieve`, `arguments`, columnas y bandas principales de snapshots `.srd` como un contrato read-only pequeño y reutilizable;
- `src/server/features/hover.ts` proyecta ese resumen cuando un `DataObject` literal o type stub resuelve hacia un `.srd`, reforzando el safe mode sin abrir soporte avanzado;
- la navegación básica sigue apoyada en los stubs `.srd` ya publicados por `documentAnalysis`, de modo que definition/hover/signatureHelp/diagnostics continúan sobre el mismo backbone semántico y no sobre un parser paralelo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(dataWindowSafeMode|hover)"`
- `npm run test:unit -- --grep "unit/(dataWindowSafeMode|documentAnalysis|definition|hover|signatureHelp|diagnostics|currentObjectContext|impactAnalysis|safeEditPlan|powerbuilderSemanticGolden)"`

## 1.62 B139. DataWindow safe-mode desde `plugin_old` — **Cerrada (legacy-safe rediseñado 2026-05)**

**Objetivo:** reaprovechar parser/definition/hover seguros del legacy para reforzar el safe mode DataWindow sin abrir soporte avanzado completo.

**Resultado registrado:**
- `src/server/features/dataWindowLegacySafeMode.ts` adapta de forma selectiva el conocimiento útil de `plugin_old` a un analizador puro de `.srd` con bandas, columnas `table(column=...)`, `retrieve` y referencias SQL simples dentro del propio DataWindow;
- `src/server/features/definition.ts` y `src/server/features/hover.ts` incorporan un fast-path local para documentos `.srd`, permitiendo navegación y hover seguros sobre bandas y columnas SQL sin depender de stores globales ni del subsistema legacy completo;
- el refuerzo mantiene el backbone actual: no usa `SymbolIndex`, no introduce async en hot path y no abre todavía expresiones, `DataWindowChild`, propiedades avanzadas ni mutación automática.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(dataWindowLegacySafeMode|definition|hover)"`
- `npm run test:unit -- --grep "unit/(dataWindowLegacySafeMode|dataWindowSafeMode|documentAnalysis|definition|hover|signatureHelp|diagnostics|currentObjectContext|impactAnalysis|safeEditPlan|powerbuilderSemanticGolden)"`

## 1.63 B041. Catálogo y navegación de DataWindow — **Cerrada (entidades de primer nivel 2026-05)**

**Objetivo:** promover DataWindow/DataStore a entidades semánticas de primer nivel con catálogo y navegación básicos integrados.

**Resultado registrado:**
- `src/server/features/documentSymbols.ts` ya expone Document Symbols específicos para `.srd` usando el modelo legacy-safe, incluyendo root DataWindow, bandas, tabla, columnas y `retrieve`;
- `workspaceSymbols` y `queryApiSymbols` ya publican los stubs `.srd` como tipos navegables del workspace, de modo que el catálogo básico DataWindow queda integrado también fuera del archivo activo;
- el resultado no abre soporte avanzado todavía: reutiliza el safe mode `.srd` ya cerrado y mantiene la separación entre catálogo básico y DataWindow avanzado.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(documentSymbols|workspaceSymbols)"`
- `npm run test:unit -- --grep "unit/(documentSymbols|workspaceSymbols|dataWindowLegacySafeMode|dataWindowSafeMode|documentAnalysis|definition|hover|signatureHelp|diagnostics|currentObjectContext|impactAnalysis|safeEditPlan|semanticWorkspaceManifest|powerbuilderSemanticGolden)"`

## 1.64 B161. Golden tests semánticos end-to-end — **Cerrada (suite golden ampliada 2026-05)**

**Objetivo:** fijar contratos visibles de comportamiento semántico para hover, definition, references, rename eligibility y readiness sin depender de interpretación manual del estado del motor.

**Resultado registrado:**
- `test/server/unit/powerbuilderSemanticGolden.test.ts` cubre ahora de forma explícita scope resolution, prototypes/implementation, herencia, event handlers, external functions, `DataObject` literal, `rename eligibility`, `readiness gating`, downgrade dinámico y conflictos de `sourceOrigin` sobre la misma base semántica compartida;
- rename y references siguen validados además por sus suites propias, pero la suite golden ya fija también los contratos mínimos de rename eligibility y readiness que faltaban para cerrar `B161` sin depender solo de tests auxiliares separados;
- el cierre no introduce otro harness: reutiliza `validateRenameTarget()`, `decideFeatureReadiness()` y el backbone semántico ya congelado por `B222`.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/powerbuilderSemanticGolden"`
- `npm run test:unit -- --grep "unit/(powerbuilderSemanticGolden|featureReadiness|renamePreflight|scopeResolution|semanticQueryService|definition|hover|signatureHelp|diagnostics|references|rename|sourceOrigin)"`

## 1.65 B163. Semantic work journal / event log del motor — **Cerrada (runtime journal exportable 2026-05)**

**Objetivo:** exponer un event log técnico del runtime para tuning y debugging sin abrir un subsistema paralelo ni romper el hot path.

**Resultado registrado:**
- `src/server/runtime/runtimeJournal.ts` introduce un ring buffer exportable con eventos tipados, fases, severidad, latencia y payload defensivo;
- `src/server/knowledge/queryTrace.ts`, `src/server/knowledge/ServingCache.ts` y `src/server/server.ts` alimentan el journal desde traces resueltas, hits/misses/evictions/invalidationes del serving cache e invalidaciones documentales reales (`change`, `close`, watcher flush);
- `src/shared/publicApi.ts` y `src/client/statusBarPresentation.ts` publican el snapshot del journal en `showStats` y lo resumen en status/health sin recalcular la observabilidad fuera del runtime.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(runtimeJournal|runtimeHealth|queryTrace|ServingCache|statusBarPresentation)"`
- `npm run test:unit -- --grep "unit/(runtimeJournal|runtimeHealth|queryTrace|ServingCache|statusBarPresentation|publicApi|cachePersistence|servingCachePersistence|servingReadiness|featureReadiness)"`
- `npm test -- --grep "smoke/extension"`

## 1.66 B176. Health checker interno del motor — **Cerrada (health report estructurado 2026-05)**

**Objetivo:** detectar degradación interna del motor antes del bug visible, con findings machine-readable reutilizables por stats y status.

**Resultado registrado:**
- `src/server/runtime/runtimeHealth.ts` construye un reporte estructurado `healthy/warning/error` con findings por capa (`runtime`, `scheduler`, `project-model`, `analysis-cache`, `serving-cache`, `hot-context`, `persistence`, `query`) y contadores por severidad;
- `src/server/server.ts` integra ese reporte en `showStats`, reutilizando el estado real de readiness, scheduler, project model, cachés, persistencia y última query en vez de abrir un checker desconectado del runtime;
- `src/client/statusBarPresentation.ts` proyecta counts, findings y tail del journal en el tooltip/health report, dejando alineadas las surfaces visibles con el contrato público compartido.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(runtimeJournal|runtimeHealth|queryTrace|ServingCache|statusBarPresentation)"`
- `npm run test:unit -- --grep "unit/(runtimeJournal|runtimeHealth|queryTrace|ServingCache|statusBarPresentation|publicApi|cachePersistence|servingCachePersistence|servingReadiness|featureReadiness)"`
- `npm test -- --grep "smoke/extension"`

## 1.67 B224. Watcher topology and sourceOrigin reconciliation — **Cerrada (routing/provenance incremental 2026-05)**

**Objetivo:** refrescar incrementalmente `project model`, routing y `sourceOrigin` cuando cambian markers (`.pbw`, `.pbt`, `.pbsln`, `.pbproj`) o aparecen SR* nuevos en caliente.

**Resultado registrado:**
- `src/server/workspace/watchedFileIntake.ts` trata markers de topología como eventos de primer nivel, reprocesa `roots`/topology, recomputa `sourceOrigin` y refresca `project routing` sin exigir rediscovery completo;
- `src/server/workspace/workspaceState.ts` añade operaciones explícitas para retirar `roots` y entradas de topología ya invalidadas, de modo que delete/change de markers no dejan routing obsoleto;
- `src/server/workspace/watchedFileChangeBridge.ts` y `src/server/server.ts` cierran el puente real LSP -> watcher para que los markers lleguen al intake incremental y no queden filtrados antes del runtime.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(watchedFileChangeBridge|watchedFileIntake|watcherPipeline|workspace)"`

## 1.68 B223. References/rename sin barrido global en hot path — **Cerrada (candidate pool acotado 2026-05)**

**Objetivo:** evitar que `references`, `rename` y CodeLens relean/remasqueen todo el workspace en la ruta interactiva.

**Resultado registrado:**
- `src/server/features/referenceSourcePool.ts` introduce un pool compartido de fuentes con scope `direct/project/multi-project/workspace`, basado en URIs candidatas reales y en el `project routing` vigente;
- `src/server/features/references.ts`, `src/server/features/dynamicStringReferences.ts` y `src/server/server.ts` reutilizan líneas y `maskedText` ya publicados por snapshot cuando están disponibles, evitando split/remask globales por request;
- CodeLens, `references` y `rename` ya consultan ese mismo pool acotado, manteniendo degradación honesta y sin relectura global por defecto en el hot path.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/(referenceSourcePool|references|rename|codeLensReferences)"`

## 1.69 B042. Soporte avanzado de DataWindow — **Cerrada (spec 249, modelo puro + relaciones avanzadas 2026-05)**

**Objetivo:** ampliar DataWindow por encima del safe mode, el catálogo básico y el bridge `DataObject/Retrieve` ya cerrados, sin mezclar `.srd` con PowerScript normal.

**Resultado registrado:**
- `src/server/features/dataWindowModel.ts` introduce un modelo DataWindow reutilizable por hover, definition y document symbols, separado de los mappers LSP visibles y centrado en bandas, columnas, `retrieve`, reports y referencias SQL simples;
- `src/server/features/dataWindowLegacySafeMode.ts` reutiliza ese modelo para añadir relaciones avanzadas locales del `.srd`: `report(name=... dataobject=...)`, `column.dddw.name` y publicación de controls/report en el outline del DataWindow;
- `src/server/features/dataWindowPropertyPaths.ts`, junto con `hover` y `definition`, resuelve property paths `Describe/Modify(...DataWindow.Table.Select)` y `Modify(...dddw.name)` sobre bindings `DataObject` literales y child DataWindows deterministas, manteniendo degradación honesta cuando falta binding o la resolución no es única.

**Validación registrada:**
- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/dataWindowLegacySafeMode.test.js out/test/server/unit/documentSymbols.test.js out/test/server/unit/definition.test.js out/test/server/unit/hover.test.js`

## 1.70 B181. PBAutoBuild capability detection — **Cerrada (spec 252, capability detection read-only 2026-05)**

**Objetivo:** detectar `PBAutoBuild250.exe`, su origen y capacidades básicas sin lanzar build ni bloquear Extension Host o LSP.

**Resultado registrado:**
- `src/client/build/pbAutoBuildDetection.ts` introduce un detector puro/cacheado para configuración explícita, `PB_AUTOBUILD_PATH` y candidatos instalados por defecto, con degradación `available/missing/invalid` y capabilities mínimas observables;
- `src/client/extension.ts`, `src/client/statusBarPresentation.ts` y `package.json` proyectan ese snapshot en status/health del cliente, reutilizando surfaces read-only ya existentes y sin abrir runner, parser de logs ni ejecución moderna;
- `test/server/unit/pbAutoBuildDetection.test.ts` y `test/server/unit/statusBarPresentation.test.ts` fijan el contrato visible de detección y la proyección en reports/tooltip.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildDetection.test.js out/test/server/unit/statusBarPresentation.test.js`

## 1.71 B227. Formatter server-side y presupuesto de formato — **Cerrada (spec 253, formatter delegado al LSP 2026-05)**

**Objetivo:** sacar el cálculo del formatter del Extension Host y fijar budgets explícitos para documentos grandes sin perder provider manual ni `formatOnSave`.

**Resultado registrado:**
- `src/server/features/formatDocument.ts` y `src/shared/formatting/formatDocumentProtocol.ts` introducen un contrato server-side para formatear o degradar por presupuesto de caracteres/líneas, reutilizando el motor puro ya existente;
- `src/client/formatting/registerFormatting.ts`, `src/client/extension.ts` y `src/server/server.ts` mueven el trabajo pesado al comando `powerbuilder.formatDocument`, manteniendo el cliente como wiring/configuración y avisando cuando el documento se omite por budget;
- `package.json` publica settings explícitas `vscPowerSyntax.formatting.maxDocumentChars` y `vscPowerSyntax.formatting.maxDocumentLines` para hacer observable el límite operativo.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/formatDocument.test.js out/test/server/unit/powerBuilderFormatter.test.js`
- `npm test -- --grep "smoke/formatting-extension"`

## 1.72 B228. Modelo interno sin DTOs LSP en knowledge/parsing — **Cerrada (spec 254, mappers de borde 2026-05)**

**Objetivo:** retirar `DocumentSymbol` y DTOs LSP equivalentes de `knowledge/parsing/utils`, dejando tipos internos en el core y mappers de borde para la salida visible.

**Resultado registrado:**
- `src/server/model/types.ts`, `src/server/utils/helpers.ts`, `src/server/parsing/sections.ts`, `src/server/knowledge/types.ts` y `src/server/knowledge/stringInterning.ts` pasan a usar tipos internos para posiciones/rangos/símbolos documentales en lugar de DTOs LSP;
- `src/server/features/documentSymbols.ts` se convierte en el borde responsable de mapear el árbol interno hacia `DocumentSymbol`, manteniendo verde la salida visible y dejando `.srd` legacy-safe como feature LSP legítima;
- `test/server/unit/architectureImports.test.ts` fija el guardrail para impedir reintroducciones de `vscode-languageserver` en `knowledge/parsing/utils`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/documentSymbols.test.js out/test/server/unit/architectureImports.test.js`

## 1.73 B070. Memory budgets de caché e índice — **Cerrada (spec 255, budgets visibles por capa 2026-05)**

**Objetivo:** definir, medir y vigilar budgets explícitos de memoria para cachés e índice sin introducir profiling invasivo.

**Resultado registrado:**
- `src/server/runtime/memoryBudgets.ts` introduce un reporte unificado de estimates y budgets por capa (`analysis`, `serving`, `documents`, `hot-context`, `code-lens`, `knowledge`) con estado agregado y métricas de proceso;
- `src/server/server.ts`, `src/server/runtime/runtimeHealth.ts`, `src/shared/publicApi.ts` y `src/client/statusBarPresentation.ts` proyectan ese reporte en `showStats`, health checker y status/tooltip visibles del cliente;
- `test/server/unit/memoryBudgets.test.ts`, junto con `runtimeHealth.test.ts` y `statusBarPresentation.test.ts`, fija el cálculo y la vigilancia visible de esos budgets.

**Validación registrada:**
- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/memoryBudgets.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/statusBarPresentation.test.js`

## 1.74 B162. Reconciliación parser / symbol model / salida LSP — **Cerrada (spec 256, reason codes antes de publicar outline 2026-05)**

**Objetivo:** detectar incoherencias internas entre parser, snapshot semántico y salida LSP antes de publicar el outline del documento.

**Resultado registrado:**
- `src/server/features/documentSymbols.ts` produce ahora un reporte explícito de reconciliación con reason codes (`type-block-missing-fact`, `callable-fact-missing-scope`, `callable-fact-orphan-container`, etc.) comparando `sections/typeBlocks`, facts/scopes y el árbol LSP a publicar;
- `src/server/server.ts` registra ese reporte en consola y `runtimeJournal` cuando detecta drift, de modo que la inconsistencia queda observada antes de devolver `DocumentSymbol[]` al editor;
- `test/server/unit/documentSymbolsReconciliation.test.ts`, junto con `documentSymbols.test.ts`, fija tanto snapshots sanos como snapshots inconsistentes y valida que la salida visible siga estable.

**Validación registrada:**
- `npm run build:test ; npx mocha --ui tdd out/test/server/unit/documentSymbols.test.js out/test/server/unit/documentSymbolsReconciliation.test.js`

## 1.75 B182. PBAutoBuild build-file discovery and validation — **Cerrada (spec 257, discovery read-only 2026-05)**

**Objetivo:** descubrir build files JSON de PBAutoBuild, vincularlos a la topología real del workspace y clasificar su usabilidad sin ejecutar compilaciones.

**Resultado registrado:**
- `src/server/workspace/pbAutoBuildBuildFiles.ts`, junto con `discovery.ts` y `workspaceState.ts`, introduce un contrato read-only para candidatos JSON de PBAutoBuild, reason codes explícitos y clasificación `usable/invalid/ambiguous` contra `.pbw/.pbt/.pbproj/.pbsln` ya descubiertos;
- `src/server/workspace/watchedFileIntake.ts`, `watchedFileChangeBridge.ts` y `src/client/extension.ts` incorporan refresh incremental de build files JSON sin mezclar esos eventos con invalidaciones semánticas masivas ni con el hot path interactivo;
- `src/server/server.ts` y `src/shared/publicApi.ts` publican un resumen mínimo de build files en `showStats`, mientras `test/server/unit/pbAutoBuildBuildFiles.test.ts`, `workspace.test.ts` y `watchedFileIntake.test.ts` fijan parser, discovery, snapshot y watcher incremental.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildBuildFiles.test.js out/test/server/unit/workspace.test.js out/test/server/unit/watchedFileIntake.test.js`

## 1.76 B229. sourceOrigin contextual en análisis documental — **Cerrada (spec 258, contextual provenance 2026-05)**

**Objetivo:** alinear el provenance documental con `WorkspaceState`/routing para que análisis interactivo, indexador y watcher compartan el mismo `sourceOrigin` contextual y no dependan solo de la URI.

**Resultado registrado:**
- `src/server/analysis/documentAnalysis.ts` acepta ya `sourceOrigin` contextual explícito, de modo que lineage y snapshots no quedan fijados únicamente por `inferSourceOrigin(document.uri)`;
- `src/server/analysis/analysisCache.ts` incorpora un resolver contextual y reanaliza cuando cambia el provenance aunque versión y fingerprint del documento se mantengan;
- `src/server/indexer/workspaceIndexer.ts`, `src/server/workspace/watchedFileIntake.ts` y `src/server/server.ts` propagan `sourceOrigin` desde `WorkspaceState`, usan `inferSourceOrigin()` solo como fallback real y rematerializan snapshots cuando un cambio topológico altera el provenance sin tocar el archivo;
- `test/server/unit/documentAnalysis.test.ts`, `analysisCache.test.ts` y `watchedFileIntake.test.ts`, junto con la validación de `sourceOrigin`, workspace, manifest y golden semántico, fijan el nuevo contrato contextual.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/sourceOrigin.test.js out/test/server/unit/documentAnalysis.test.js out/test/server/unit/analysisCache.test.js out/test/server/unit/watchedFileIntake.test.js out/test/server/unit/workspace.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js`

## 1.77 B226. Corpus enterprise OrderEntry como baseline operativo — **Cerrada (spec 251, enterprise baseline 2026-05)**

**Objetivo:** convertir `fixtures-local/STD_FC_OrderEntry` en un baseline enterprise reproducible para discovery, indexación y regresión semántica proporcional sin mezclar corpus privado con el código del producto.

**Resultado registrado:**
- `src/shared/powerbuilderFiles.ts` deja de tratar `.srj` de deployment como fuente semántica del pipeline de workspace, manteniendo `.pblmeta` y recursos fuera del inventario fuente;
- `test/server/performance/orderentry.smoke.test.ts` mantiene la cobertura de solution-mode parcial, `_BackupFiles` y variantes multiidioma reales del corpus;
- `test/server/performance/orderentry.semantic.test.ts` añade smoke semántica reproducible sobre `nc_ac_orderentry`, `vc_oes_toolbar_e`, `wn_dotnet_datastore_e` y `ap_image_build`, fijando `sourceOrigin` de carpetas `.pbl`, topología parcial y exclusión explícita de `.srj`, `.pblmeta` y recursos HTML;
- `test/corpora/README.md`, `docs/testing.md`, `docs/performance-budget.md` y `test/results/003-real-corpora-baseline.md` reflejan ya que OrderEntry deja de ser solo baseline parcial y pasa a baseline operativo local de discovery/indexación + smoke semántica.

**Validación registrada:**
- `npm run build:test ; npx mocha --ui tdd out/test/server/performance/orderentry.smoke.test.js out/test/server/performance/orderentry.semantic.test.js`
- `npm run test:performance -- --grep "OrderEntry"`

## 1.78 B225. Cobertura completa de ancestros nativos PowerBuilder — **Cerrada (spec 250, native runtime ancestors 2026-05)**

**Objetivo:** cerrar falsos positivos y degradaciones read-only cuando la herencia llega a tipos nativos del runtime PowerBuilder servidos por `system catalog`.

**Resultado registrado:**
- `src/server/knowledge/system/nativeAncestors.ts` introduce una fuente compartida de tipos/raíces runtime y de prolongación de cadena nativa sin listas duplicadas por feature;
- `src/server/knowledge/system/SystemCatalog.ts` reconoce ahora también raíces runtime representativas como `powerobject`, `throwable` y `runtimeerror`, además de los owner types ya indexados;
- `src/server/knowledge/resolution/InheritanceGraph.ts` completa la cadena cuando la KB termina en `window` u otros tipos nativos conocidos, de forma que hierarchy/current object context/impact analysis no se cortan antes del borde del runtime;
- `test/server/unit/systemCatalog.test.ts`, `inheritanceGraph.test.ts`, `hierarchyInspection.test.ts`, `currentObjectContext.test.ts`, `diagnostics.test.ts` e `impactAnalysis.test.ts` fijan la nueva proyección estable entre sistema, framework y aplicación.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/systemCatalog.test.js out/test/server/unit/inheritanceGraph.test.js out/test/server/unit/hierarchyInspection.test.js out/test/server/unit/currentObjectContext.test.js out/test/server/unit/diagnostics.test.js`
- `npx mocha --ui tdd out/test/server/unit/impactAnalysis.test.js`

## 1.79 B183. PBAutoBuild command runner out-of-process — **Cerrada (spec 259, modern build runner 2026-05)**

**Objetivo:** ejecutar PBAutoBuild desde VS Code sin bloquear Extension Host ni LSP, dejando el build observable, cancelable y seguro.

**Resultado registrado:**
- `src/server/build/pbAutoBuildRunner.ts` introduce un runner server-side dedicado con selección segura del build file utilizable, proceso hijo out-of-process, timeout y cancelación sin mezclar build moderno con el scheduler general;
- `src/server/server.ts` expone `powerbuilder.runPbAutoBuild` y `powerbuilder.cancelPbAutoBuild`, añade el snapshot del runner a `showStats` y registra eventos del build en `runtimeJournal`;
- `src/client/extension.ts`, `src/client/statusBarPresentation.ts` y `package.json` sustituyen la acción genérica de build por comandos run/cancel reales y proyectan el estado mínimo del runner en status/tooltip/reportes;
- `src/shared/pbAutoBuildProtocol.ts` fija el contrato serializable del runner para cliente/servidor y evita duplicar shape del estado.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild"`

## 1.80 B184. PBAutoBuild log parser and Problems Panel integration — **Cerrada (spec 260, build problems 2026-05)**

**Objetivo:** convertir la salida relevante del build moderno en problemas navegables sin inventar ubicaciones ni sobrescribir los diagnósticos semánticos del LSP.

**Resultado registrado:**
- `src/server/build/pbAutoBuildLogParser.ts` introduce un parser puro para la salida relevante de PBAutoBuild y un resumen estructurado de errores/warnings/fatals;
- `src/server/build/pbAutoBuildProblems.ts` resuelve issues a entidades tipo del workspace solo cuando el objeto del log mapea de forma única y segura;
- `src/server/server.ts`, `src/shared/pbAutoBuildProtocol.ts` y `src/client/extension.ts` transportan los problemas de build y los publican en una colección separada (`vscPowerSyntax-build`), evitando pisar el canal semántico principal;
- los problemas previos se reemplazan por resultado de build y la salida no resoluble permanece en el canal/journal sin convertirse en diagnóstico falso.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildLogParser.test.js out/test/server/unit/pbAutoBuildProblems.test.js out/test/server/unit/pbAutoBuildRunner.test.js`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild"`

## 1.81 B187. Unified build health model — **Cerrada (spec 261, build health 2026-05)**

**Objetivo:** consolidar el estado del build moderno en una lectura única y reutilizable para status, menú y health report sin duplicar reglas entre superficies del cliente.

**Resultado registrado:**
- `src/client/build/pbAutoBuildHealth.ts` introduce el snapshot puro `ready/running/attention/blocked` a partir de capability detection, build files, runner y problemas recientes;
- `src/client/statusBarPresentation.ts` y `src/client/extension.ts` reutilizan ese snapshot en tooltip, stats, health report, menú y API pública enriquecida del cliente;
- la UX visible del build moderno ya consume una sola fuente de verdad sin recalcular disponibilidad o degradación en cada superficie.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildHealth.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild"`

## 1.82 B185. PBAutoBuild build profiles, commands and status UX — **Cerrada (spec 262, build UX 2026-05)**

**Objetivo:** permitir builds frecuentes del carril moderno sin recordar rutas ni comandos manuales y sin duplicar la lógica ya cerrada de runner/parser/health.

**Resultado registrado:**
- `src/server/server.ts` expone al cliente la lista de build files PBAutoBuild utilizables;
- `src/client/extension.ts` añade comandos para repetir el último build, elegir un build file utilizable y recordar el último perfil por workspace;
- `src/client/statusBarPresentation.ts`, `package.json` y `test/smoke/extension.test.ts` proyectan el perfil recordado y los nuevos accesos rápidos en menú, tooltip y reportes visibles.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild"`

## 1.83 B043. Integración con PBAutoBuild — **Cerrada (épica moderna 2026-05)**

**Objetivo:** cerrar la épica contenedora del carril moderno oficial de build tras completar capability detection, discovery, runner, parser, health y UX frecuente.

**Resultado registrado:**
- `B181-B187` quedan cerradas y dejan un carril moderno de PBAutoBuild observable, no bloqueante y usable desde VS Code;
- la deuda restante se desplaza a `B186` como export reproducible de CI/CD, ya fuera del cierre técnico de la épica base `B043`.

## 1.84 B186. PBAutoBuild CI/CD helper export — **Cerrada (spec 263, helper export 2026-05)**

**Objetivo:** exportar una ayuda reproducible y versionable para llevar el build moderno de PBAutoBuild a CI/CD sin acoplarla a un proveedor concreto.

**Resultado registrado:**
- `src/client/build/pbAutoBuildCiHelper.ts` introduce un builder puro que genera `manifest.json`, README y scripts neutrales PowerShell/CMD/Bash a partir del build file/perfil utilizable ya cerrado;
- `src/client/extension.ts` y `package.json` anaden el comando `vscPowerSyntax.exportPbAutoBuildCiHelper`, reutilizan el perfil recordado o uno utilizable del catalogo y escriben el bundle bajo `tools/pbautobuild-ci/<perfil>`;
- el helper evita embeder el path local detectado como dependencia obligatoria y deja la resolucion del ejecutable al runner CI mediante `PB_AUTOBUILD_PATH`, manteniendo la exportacion agnostica del proveedor.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildCiHelper.test.js`
- `npm run test:smoke -- --grep "PBAutoBuild"`

## 1.85 B230. KnowledgeBase copy-on-write e índices de consulta acotada — **Cerrada (spec 264, KB incremental 2026-05)**

**Objetivo:** reducir el coste de `upsert/remove` en `KnowledgeBase` evitando el clon amplio del estado publicado y reforzar las consultas acotadas para que las rutas interactivas no materialicen mas base de la necesaria.

**Resultado registrado:**
- `src/server/knowledge/KnowledgeBase.ts` pasa a publicar drafts con copy-on-write por bucket: clona superficialmente los mapas base y solo duplica arrays/sets tocados para ids, kinds y dependencias inversas, manteniendo atomicidad defensiva;
- `queryEntities/countEntities` reutilizan ahora un indice por `EntityKind` y un total precalculado para evitar recorridos completos cuando el consumer ya conoce `kinds` o solo necesita un conteo acotado;
- `src/server/features/semanticWorkspaceManifest.ts` consume esos conteos acotados y la nueva prueba `test/server/performance/knowledgeBase.perf.test.ts` fija el presupuesto incremental con miles de documentos sinteticos.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/knowledgeBase.test.js out/test/server/performance/knowledgeBase.perf.test.js`
- `npm run test:performance -- --grep "knowledgeBase"`

## 1.86 B231. Guards LSP para markers y PBL binario — **Cerrada (spec 265, lsp boundary guards 2026-05)**

**Objetivo:** reforzar el borde cliente/servidor para que markers `.pbw/.pbt/.pbproj/.pbsln` y `.pbl` binarios sigan alimentando discovery/topologia pero no entren en providers semanticos PowerScript.

**Resultado registrado:**
- `src/shared/powerbuilderFiles.ts` define ahora `isPowerBuilderSemanticUri()` como contrato compartido de URIs servibles por el LSP, separando fuentes/consultas semanticas de markers topologicos y `.pbl` binarios;
- `src/server/server.ts` aplica un guard central sobre diagnostics, documentSymbols, hover, definition, references, completion, semantic tokens, code actions, code lens y rename para devolver degradacion vacia en documentos no servibles aunque el cliente reciba un override de lenguaje;
- `test/server/unit/powerbuilderFiles.test.ts` fija la clasificacion y `test/smoke/lsp-guards.extension.test.ts` fuerza un lenguaje servido sobre `.pbw/.pbt/.pbproj/.pbsln/.pbl` para verificar que no aparecen `Document Symbols` ni diagnostics, mientras `sample.sru` sigue respondiendo.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/powerbuilderFiles.test.js`
- `npm run test:smoke -- --grep "lsp-guards"`

## 1.87 B175. Repro packs automáticos para bugs semánticos — **Cerrada (spec 266, semantic repro pack 2026-05)**

**Objetivo:** generar un bundle reproducible para bugs semánticos complejos sin reconstruir manualmente el contexto del runtime, reutilizando las surfaces read-only ya cerradas.

**Resultado registrado:**
- `src/client/repro/semanticReproPack.ts` introduce un builder puro del bundle con `manifest.json`, README, snapshots JSON (`currentObjectContext`, `impactAnalysis`, `safeEditPlan`, `semanticWorkspaceManifest`, `serverStats`, diagnostics del editor) y copias de archivos relevantes;
- `src/client/extension.ts` y `package.json` añaden el comando `vscPowerSyntax.exportSemanticReproPack`, lo exponen en el menú de estado y exportan el pack bajo `tools/semantic-repros/<slug>-<timestamp>` o en un destino override para tests;
- `test/server/unit/semanticReproPack.test.ts` fija el builder puro y `test/smoke/semantic-repro-pack.extension.test.ts` valida la exportación real desde `sample.sru` sin introducir un motor semántico paralelo ni ensuciar el repo en la smoke.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticReproPack.test.js`
- `npm run test:smoke -- --grep "semantic-repro-pack"`

## 1.88 B232. IDs diagnósticos implementados vs catálogo gobernado — **Cerrada (spec 267, diagnostic id contract 2026-05)**

**Objetivo:** fijar una política estable para los IDs diagnósticos visibles, evitando una mezcla implícita entre catálogo `PB-*`, IDs históricos `SD*`/`dataobject-*` y consumers que parseaban `source`.

**Resultado registrado:**
- `src/shared/diagnosticCodes.ts` introduce la lista única de IDs emitidos hoy y helpers para leer `diagnostic.code` con fallback al sufijo legacy en `source`;
- `src/server/features/diagnostics.ts`, `diagnosticsExtra.ts` y `obsoleteDetector.ts` emiten `diagnostic.code` estable para reglas `SD2-SD13`, `SD7`, familias `dataobject-*`, `retrieve-arity-mismatch`, `transaction-binding-*`, `native-dependency` y warnings lifecycle (`missing-super-*`, `missing-trigger-*`, `unresolved-*`);
- `src/server/features/codeActions.ts` y los tests focales dejan de depender del parseo directo de `source` como contrato primario y consumen `diagnostic.code` con compatibilidad hacia atrás;
- `docs/rules-catalog.md` deja explícito que el contrato emitido actual se gobierna por `diagnostic.code` y que `PB-*` sigue siendo taxonomía documental/objetivo, no ID runtime emitido.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/diagnostics.test.js out/test/server/unit/diagnosticsExtra.test.js out/test/server/unit/codeActions.test.js out/test/server/unit/obsolete.test.js out/test/server/unit/obsoleteDetectorSanity.test.js`

## 1.89 B233. Higiene histórica de specs tempranas — **Cerrada (spec 268, early spec hygiene 2026-05)**

**Objetivo:** dejar de mezclar specs activas con carpetas históricas incompletas (`003-009`, `012`) que podían parecer trabajo vivo solo por faltarles `spec.md`, `plan.md` o `tasks.md` mínimos.

**Resultado registrado:**
- las specs tempranas incompletas `003`, `004`, `005`, `006`, `007`, `008`, `009` y `012` quedan normalizadas con `spec.md/plan.md/tasks.md` mínimos y estado histórico explícito;
- `specs/006-hover-catalog` y `specs/007-hierarchical-symbols` ya no dependen solo de `tasks.md`, y `specs/012-semantic-tokens` ya no queda como carpeta con una sola pieza;
- `docs/spec-driven-development.md` documenta explícitamente cómo normalizar specs retroactivas sin reabrir una feature cerrada por ausencia de plantilla antigua;
- el foco canónico deja de estar en higiene documental y se mueve a `B216`.

**Validación registrada:**
- auditoría local del inventario `specs/001-020` comprobando que las carpetas tempranas ya no carecen de `spec.md`, `plan.md` o `tasks.md`.

## 1.90 B216. Project Health Dashboard — **Cerrada (spec 269, project health dashboard 2026-05)**

**Objetivo:** mostrar la salud del workspace/proyecto en una vista read-only única consumiendo `health report`, status bar, manifest semántico y snapshot de build ya cerrados, sin abrir un segundo motor de health.

**Resultado registrado:**
- `src/client/projectHealthDashboard.ts` compone un dashboard markdown read-only sobre `powerbuilder.showStats`, `semanticWorkspaceManifest`, reports existentes de status/health y degradación honesta de ORCA legacy;
- `src/client/extension.ts` y `package.json` añaden el comando `vscPowerSyntax.openProjectHealthDashboard`, lo registran en el menú de estado y abren el dashboard en un editor markdown lateral;
- `src/client/statusBarPresentation.ts` enlaza el dashboard desde el tooltip de la status bar, manteniendo la UX de mantenimiento sobre el mismo backbone read-only;
- `test/server/unit/projectHealthDashboard.test.ts` y la smoke focal en `test/smoke/extension.test.ts` validan el contenido del dashboard y la ejecución real del comando visible.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/projectHealthDashboard.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npm run test:smoke -- --grep "dashboard de salud del proyecto"`

## 1.91 B214. PowerBuilder Object Explorer — **Cerrada (spec 270, powerbuilder object explorer 2026-05)**

**Objetivo:** ofrecer una vista navegable del modelo PowerBuilder del workspace consumiendo `semanticWorkspaceManifest` y `project model` ya cerrados, sin motor semántico paralelo ni RPCs por nodo.

**Resultado registrado:**
- `src/shared/publicApi.ts` y `src/server/features/semanticWorkspaceManifest.ts` enriquecen el manifest read-only con `projectUri`, `library`, `objectKind` y `readiness` por objeto para sostener la vista sin endpoints nuevos;
- `src/client/objectExplorerModel.ts` construye un árbol puro proyecto -> librería -> kind -> objeto, con foco `workspace/current-project/current-file`, métricas de readiness agregadas y tooltips con `sourceOrigin`;
- `src/client/objectExplorer.ts`, `src/client/extension.ts` y `package.json` registran la vista `powerbuilderObjectExplorer`, sus comandos de foco/refresco y la acción segura de abrir objeto desde el árbol;
- `test/server/unit/objectExplorerModel.test.ts`, `test/server/unit/semanticWorkspaceManifest.test.ts` y la smoke focal en `test/smoke/extension.test.ts` validan el modelo, el contrato read-only y el foco sobre el archivo activo.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/semanticWorkspaceManifest.test.js`
- `npm run test:smoke -- --grep "Object Explorer en el archivo activo"`

## 1.92 B215. Current Object Context Panel — **Cerrada (spec 271, current object context panel 2026-05)**

**Objetivo:** proyectar el contexto semántico del objeto activo en una vista persistente read-only, reutilizando `currentObjectContext` y surfaces públicas ya cerradas sin reconstrucción local.

**Resultado registrado:**
- `src/shared/publicApi.ts` y `src/server/features/currentObjectContext.ts` amplían el contrato con `visibleVariables`, combinando scope activo + member closure para exponer locals/args y miembros heredados sobre el mismo backbone read-only;
- `src/client/currentObjectContextPanelModel.ts` y `src/client/currentObjectContextPanel.ts` construyen y sirven el panel `powerbuilderCurrentObjectContext`, siguiendo el editor activo y agrupando resumen, ancestros, variables visibles, members, diagnostics, bindings `DataObject`, references, related files y evidence;
- `src/client/extension.ts` y `package.json` registran la vista, sus comandos de refresco/foco y la apertura segura de ubicaciones desde el panel;
- `test/server/unit/currentObjectContext.test.ts`, `test/server/unit/currentObjectContextPanelModel.test.ts` y la smoke focal en `test/smoke/extension.test.ts` validan el contrato ampliado, el builder puro y la UX visible sobre archivo activo.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/currentObjectContextPanelModel.test.js`
- `npm run test:smoke -- --grep "Current Object Context del archivo activo"`

## 1.97 B192. ORCA staging provenance and source priority — **Cerrada (spec 276, provenance/source priority 2026-05)**

**Objetivo:** fijar de forma efectiva la prioridad entre source real y `orca-staging` para que serving, query y manifest no dependan del orden de ingestión y expliquen con honestidad de dónde viene cada símbolo.

**Resultado registrado:**
- `src/server/knowledge/KnowledgeBase.ts` ordena buckets globales y por kind según la prioridad explícita de `sourceOrigin`, de modo que `findDefinition` y `findAllDefinitions` ya no dependen del orden en que entró primero el staging o el source real;
- `src/server/knowledge/resolution/semanticQueryService.ts` desempata candidatos equivalentes y el `global-fallback` usando esa misma prioridad de provenance antes de fijar winner/confidence, evitando ambigüedades artificiales entre source real y `orca-staging`;
- `test/server/unit/knowledgeBase.test.ts`, `semanticQueryService.test.ts`, `semanticWorkspaceManifest.test.ts` y `definition.test.ts` fijan el contrato `source real > orca-staging` en KB, query engine, manifest y Definition read-only.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/knowledgeBase.test.js out/test/server/unit/semanticQueryService.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/definition.test.js --grep "prioriza source real|prefiere source real frente a orca-staging"`

## 1.135 B281. Override and overload resolution hardening — **Cerrada (spec 347, override/overload hardening 2026-05)**

**Objetivo:** reforzar la resolución entre overloads, overrides, prototypes e implementations reutilizando identidad canónica B279 y ambigüedad v2 B280.

**Resultado registrado:**
- `src/server/knowledge/callSignature.ts` centraliza claves de firma callable, normalización de parámetros y conteo de aridad;
- `src/server/analysis/documentAnalysis.ts` conserva overloads por firma normalizada y sustituye solo el prototype por la implementation de la misma firma;
- `src/server/utils/invocationContext.ts` y `src/server/features/signatureHelp.ts` propagan aridad y tipos literales simples al query engine compartido;
- `src/server/knowledge/resolution/semanticQueryService.ts` filtra candidatos por firma antes de rankear por distancia de herencia y emite evidence `discarded-signature` para `arity-mismatch`, `type-mismatch` y `prototype-shadowed`;
- `src/server/knowledge/resolution/InheritanceGraph.ts` y `src/server/features/impactAnalysis.ts` dejan de tratar firmas distintas como overrides equivalentes.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/documentAnalysis.test.js out/test/server/unit/semanticQueryService.test.js out/test/server/unit/definition.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/impactAnalysis.test.js` → `65 passing`

## 1.136 B282. Dynamic invocation risk model v2 — **Cerrada (spec 348, invocation risk 2026-05)**

**Objetivo:** unificar el riesgo de llamadas dinámicas, strings, external calls, DataWindow expressions, WebView/HTTP patterns y `sourceOrigin` no canónico sin abrir un segundo motor semántico.

**Resultado registrado:**
- `src/server/features/invocationRiskModel.ts` centraliza la composición de `safe|inherited|fallback|dynamic|external` usando query risk, `sourceOrigin`, strings dinámicos, bindings DataWindow y targets externos;
- `src/shared/publicApi.ts` expone `ApiInvocationRisk` y metadata de riesgo en `impactAnalysis`, `safeEditPlan` y `dependencyGraph`;
- `impactAnalysis` y `safeEditPlan` publican `invocationRisk`, `riskReasons` y bloqueos explícitos para riesgo `dynamic`, `fallback` o `external`;
- `references`, `rename` y `codeActions` degradan o bloquean resultados cuando aparece riesgo dinámico o fallback antes de producir edits;
- `dynamicStringReferences` cubre patrones de eventos, DataWindow, WebView y HTTP request strings.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/dynamicStringReferences.test.js out/test/server/unit/references.test.js out/test/server/unit/rename.test.js out/test/server/unit/codeActions.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/dependencyGraph.test.js`

## 1.137 B287. DataWindow model canonicalization v2 — **Cerrada (spec 349, canonical backbone 2026-05)**

**Objetivo:** consolidar un modelo canónico único de DataWindow consumido por las surfaces existentes sin reparsear snapshots `.srd` por feature.

**Resultado registrado:**
- `src/server/features/dataWindowModel.ts` pasa a ser el backbone único para `.srd`, concentrando `retrieve`, `retrieveArguments`, bandas, columnas `table`, `report(...)` y referencias SQL simples, además de soportar comillas escapadas `~"` y tipos con paréntesis balanceados como `char(40)` o `decimal(18,2)`;
- `src/server/features/dataWindowSafeMode.ts` deja de extraer `retrieve`/columnas/bandas por su cuenta y proyecta el resumen read-only desde `buildDataWindowModelFromSnapshot()`;
- `src/server/features/dataWindowBindingModel.ts` deja de reparsear `arguments=(...)` / `ARG(...)` desde texto raw y reutiliza `retrieveArguments` del modelo canónico para bindings `DataObject`, `signatureHelp`, diagnostics, context packs y métricas enlazadas;
- las surfaces ya apoyadas en `DataWindowModel` (`definition`, `documentSymbols`, property paths, hover local `.srd`, SQL lineage y golden cross-surface`) quedan alineadas sobre el mismo backbone sin abrir un segundo parser DataWindow.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/architectureImports.test.js out/test/server/unit/dataWindowModel.test.js out/test/server/unit/dataWindowLegacySafeMode.test.js out/test/server/unit/dataWindowSafeMode.test.js out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/documentSymbols.test.js out/test/server/unit/definition.test.js out/test/server/unit/completion.test.js out/test/server/unit/hover.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/currentObjectContext.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/crossSurfaceGoldenMatrix.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js`
- `npm test`

## 1.138 B288. DataWindow SQL parser safe subset v2 — **Cerrada (spec 350, safe SQL subset 2026-05)**

**Objetivo:** mejorar el parsing seguro del SQL `retrieve` DataWindow sin abrir un motor SQL completo ni duplicar parsing fuera de `dataWindowModel`.

**Resultado registrado:**
- `src/server/features/dataWindowModel.ts` amplía `sqlReferences` para cubrir `select` con aliases, `JOIN ... ON` simples y `WHERE` básico, resolviendo aliases de tabla hacia nombres reales cuando la evidencia es defendible;
- el mismo parser degrada de forma honesta ante cláusulas complejas con subquery (`select`/`exists`/`case`/`union`) y evita inventar referencias SQL inseguras fuera del subset soportado;
- `dataWindowSqlLineage` reutiliza automáticamente esas referencias más ricas sin cambios de surface, y `provideDataWindowLegacyDefinition()` hereda la navegación segura desde referencias SQL aliased hacia `column=(...)` del `.srd`;
- el subset sigue siendo read-only, no abre una engine SQL general y conserva `retrieveArguments`/bindings sobre el backbone canónico cerrado en `B287`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/architectureImports.test.js out/test/server/unit/dataWindowModel.test.js out/test/server/unit/dataWindowLegacySafeMode.test.js out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/crossSurfaceGoldenMatrix.test.js`
- `npm test`

## 1.139 B289. DataWindow expression safe evaluator metadata — **Cerrada (spec 351, safe expression metadata 2026-05)**

**Objetivo:** modelar metadata segura de expresiones DataWindow y dependencias de columnas/controles dentro de `.srd` sin evaluar valores runtime ni abrir un parser paralelo fuera de `dataWindowModel`.

**Resultado registrado:**
- `src/server/features/dataWindowModel.ts` amplía el backbone canónico con controles nombrados y nodos de expresión extraídos desde `expression=` y atributos quoted con `~t...`, clasificando dependencias como `table-column`, `control` o `unresolved` únicamente desde la evidencia del mismo `.srd`;
- `src/server/features/completion.ts` abre completion conservadora dentro de expresiones `.srd` reutilizando ese mismo modelo, incluso en contexto string DataWindow reconocible, sin caer en completion global ni fingir semántica fuera del rango de la expresión;
- `src/server/features/diagnostics.ts` emite `datawindow-expression-dependency-unresolved` cuando una expresión referencia una dependencia que no resuelve como columna `table` o control nombrado del DataWindow actual;
- `docs/architecture.md`, `docs/rules-catalog.md`, backlog y current-focus dejan trazado que `B289` queda cerrada y que el siguiente foco canónico pasa a `B290`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/dataWindowModel.test.js out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js`

## 1.163 B361. Official enumerated datatype extractor and coverage rail — **Cerrada (spec 375, official enum rail 2026-05)**

**Objetivo:** cerrar el rail oficial reproducible para tipos y valores enumerados PowerBuilder sin abrir un pipeline paralelo al generator actual, dejando cobertura auditable, provenance explícita y consumers runtime capaces de mezclar `manual-core` + `generated` por `enumValueOf`.

**Resultado registrado:**
- `script/generate_official_function_catalog.cjs` endurece el scraper oficial de Appeon con `findDocPageEndIndex()` y `extractPrimaryContentHtml()`, y ajusta `extractSectionHtml`, `parseDataWindowConstantPage`, `extractObjectsPropertyVariantReferences` y `parseObjectsPropertyEnumPageVariant` para impedir que TOCs, índices locales o `navfooter` globales entren como valores enumerados oficiales;
- el mismo rail oficial materializa `src/server/knowledge/system/generated/enumeratedTypes.generated.ts`, `enumeratedValues.generated.ts`, `enumeratedCoverage.generated.ts` y `enumeratedProvenance.generated.ts`, dejando `enumerated-types` con `officialCount = coveredCount = 33` y `enumerated-values` con `officialCount = coveredCount = 233`, sin texto oficial masivo copiado y con provenance/version/sourceUrl trazables;
- `src/server/knowledge/system/registry/datasets.ts` publica ya los slices `generated` de enums junto al rail manual, `buildIndexes.ts`/`queryService.ts` siguen resolviendo la unión efectiva por `byEnumValueOf` y `src/server/features/hover.ts` muestra esa unión real para tipos como `WindowType`, combinando `Main!` con valores generated como `MDIDock!` y `MDIDockHelp!` sin hardcodes paralelos;
- el cierre deja explícito que tipos como `SecureProtocol` pueden permanecer como datatype oficial sin `enumValues` cuando Appeon solo documenta códigos enteros y no tokens enumerados con `!`, de forma que cualquier curación posterior quede reservada para `B362`;
- `docs/architecture.md`, `docs/testing.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/backlog.md`, `docs/current-focus.md` y `docs/roadmap.md` quedan alineados con el cierre formal de B361 y con el paso del foco a `B362`.

**Validación registrada:**
- `node script/generate_official_function_catalog.cjs`
- `npm run compile`
- `npx tsc -p tsconfig.test.json`
- `npx vscode-test --label unit --grep "unit/catalogGeneratorScript|unit/catalogV2|unit/hover"`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 1.164 B362. PowerBuilder enumerated datatypes and values catalog completion — **Cerrada (spec 376, enum catalog completion 2026-05)**

**Objetivo:** completar la integración consumible del catálogo de tipos y valores enumerados reutilizando el rail oficial de `B361`, cerrando gaps curados mínimos y dejando metadata útil y límites honestos para tipos oficiales sin miembros nominales.

**Resultado registrado:**
- `script/generate_official_function_catalog.cjs` conserva ya `documentation` y `allowedOnOwners` en property variants oficiales con título local `For ...`, de modo que `SecureProtocol` queda explicado con evidencia oficial sin inventar `enumValues` con `!` cuando Appeon solo publica códigos enteros;
- `src/server/knowledge/system/manual/language/enumerations/index.ts` completa la documentación de los tipos manual-core de UI/archivo (`Border`, `Alignment`, `FillPattern`, `WindowType`, `WindowState`, `FileAccess`, `FileMode`, `Encoding`) y publica `SeekType` como gap manual-curated con `FromBeginning!`, `FromCurrent!` y `FromEnd!`, respaldado por uso real de `FileSeek(...)` en corpus legacy y por la conversión explícita de `seektype` en PFC;
- `test/server/unit/catalogV2.test.ts` fija que `SecureProtocol` conserva explicación oficial sin valores nominales fabricados, que los tipos manual-core no quedan sin `documentation`, que `FillPattern` mantiene el merge con valores generated y que `SeekType` resuelve sus tres valores canónicos;
- la comprobación runtime sobre `SystemCatalog` compilado deja `missingDocs = []` en `enumerated-types` y confirma presencia documentada de los mínimos del backlog `B362`, por lo que `docs/backlog.md`, `docs/current-focus.md`, `docs/testing.md`, `docs/architecture.md`, `docs/roadmap.md` y `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` quedan alineados con el paso del foco a `B363`.

**Validación registrada:**
- `node script/generate_official_function_catalog.cjs`
- `npm run compile`
- `npx tsc -p tsconfig.test.json`
- `npx vscode-test --label unit --grep "unit/catalogGeneratorScript|unit/catalogV2"`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/testing.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/done-log.md`

## 1.165 B363. Catalog-driven enum hover, completion, signatureHelp and diagnostics — **Cerrada (spec 377, enum consumers 2026-05)**

**Objetivo:** integrar el modelo canonico `enumerated-type` / `enumerated-value` en hover, completion, signatureHelp, semantic tokens de valores con `!` y diagnostics conservadores, reutilizando `SystemCatalog` y sus indices efectivos sin abrir listas paralelas por feature.

**Resultado registrado:**
- `src/server/utils/pbIdentifier.ts` deja de truncar valores con `!`, de modo que hover y consumers basados en identificador resuelven ya `CSV!`, `Primary!` o `FromBeginning!` como `enumerated-value` real del catálogo;
- `src/server/features/enumeratedContext.ts` concentra la resolucion del enum esperado para propiedades y argumentos de llamada, y `completion.ts` / `signatureHelp.ts` reutilizan ese helper junto a `allowedOnProperties`, `allowedOnOwners`, `allowedInParameters` y el fallback desde `signature.label` para contextos como `Alignment`, `FileSeek(...)`, `RowsMove(...)` y `SetItemStatus(...)`;
- `src/server/features/semanticTokens.ts` publica `enumMember` para valores catalogados con `!` y `src/server/handlers/featureHandlers.ts` sirve el `SystemCatalog` al provider sin abrir un consumer catalog-driven mas amplio del necesario;
- `src/server/features/diagnostics.ts` emite el codigo estable `enum-value-context-mismatch` solo cuando el tipo esperado es inequívoco en una asignacion de propiedad o en un argumento de llamada, respetando owner/property context y evitando diagnosticos sobre expresiones dinamicas o ambiguas;
- `docs/backlog.md`, `docs/current-focus.md`, `docs/done-log.md`, `docs/rules-catalog.md`, `docs/testing.md`, `docs/performance-budget.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` y `specs/377-catalog-driven-enum-consumers/spec.md` quedan alineados con el cierre formal de `B363` y con el paso del foco a `B364`.

**Validación registrada:**
- `npm run build:test`
- `npx tsc -p tsconfig.test.json`
- `npx vscode-test --label unit --grep "completion|hover|signatureHelp|semanticTokens|diagnostics|enumerated|enum"`
- `npx vscode-test --label unit --grep "catalog|systemCatalog|catalogV2"`

**Documentación alineada:**
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/rules-catalog.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 1.162 B360. Enumerated catalog model breaking normalization — **Cerrada (spec 374, strict enum type/value split 2026-05)**

**Objetivo:** normalizar de forma estricta el modelo de enumerados PowerBuilder separando `enumerated-type` y `enumerated-value`, eliminando la representación legacy donde tipos con sufijo `!` aparecían como entradas canónicas del catálogo.

**Resultado registrado:**
- `src/server/knowledge/system/types.ts`, `normalization.ts` y `manual/common.ts` amplían el contrato de catálogo con `PbSystemSymbolKind = 'enumerated-type'`, `PbSystemSymbolDomain = 'enumerated-types'` y metadata específica (`documentation`, `enumValues`, `enumValueOf`, `enumNumericValue`, `enumValueMeaning`, `allowedOn*`), sin mantener aliases legacy para tipos como `SaveAsType!` o `DWBuffer!`;
- `src/server/knowledge/system/manual/language/enumerations/index.ts` deja `manual/language/enumerations/` con tipos canónicos (`SaveAsType`, `DWBuffer`, `DWItemStatus`, `Encoding`, `WindowType`, etc.) y valores representativos (`Text!`, `CSV!`, `Primary!`, `EncodingUTF8!`, etc.) ligados por `enumValueOf`, mientras `manual/index.ts` publica ya los dominios separados `enumerated-types` y `enumerated-values`;
- `src/server/knowledge/system/indexes/buildIndexes.ts`, `services/queryService.ts`, `SystemCatalog.ts` y `consistency.ts` endurecen el query layer y el audit: `listEnumeratedTypes()`, `resolveEnumeratedType()`, `resolveEnumeratedValue()` y `listValuesForEnumeratedType()` usan el modelo nuevo, `resolveLanguageSymbol()` prioriza `enumerated-type` antes de `system-global`/`enumerated-value` y `buildCatalogConsistencyReport()` publica `invalidEnumeratedTypeNames` para bloquear regresiones de nombres canónicos con `!`;
- `src/server/features/completion.ts` y `hover.ts`, junto con `catalogV2.test.ts`, `systemCatalogQueryHardening.test.ts`, `completion.test.ts` y `catalogConsistency.test.ts`, alinean completion/hover y los guardrails del catálogo con el breaking split de B360;
- `docs/architecture.md`, `docs/testing.md`, `docs/rules-catalog.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/roadmap.md`, `docs/backlog.md` y `docs/current-focus.md` quedan alineados con el cierre de B360 y con el siguiente foco natural `B361`.

**Validación registrada:**
- `npm run test:unit -- --grep "catalogV2|systemCatalogQueryHardening"`
- `npm run test:unit -- --grep "completion|hover|semanticTokens|signatureHelp"`
- `npm run test:unit -- --grep "catalog|systemCatalog|catalogV2|enumerated|enum"`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/testing.md`
- `docs/rules-catalog.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.161 B359. Runtime, integration and nonvisual system object datatypes catalog completion — **Cerrada (spec 373, manual runtime/integration rails 2026-05)**

**Objetivo:** completar los rails curados `manual/runtime/` y `manual/integration/` para tipos runtime/nonvisual modernos, PDF, correo, profiling/trazas, reflexión, OLE no visual y subsistemas de integración, sin remezclarlos con el carril visual ya cerrado en `B358`.

**Resultado registrado:**
- `src/server/knowledge/system/manual/runtime/` queda consolidado por ownership (`systemTypes.ts`, `errors.ts`, `reflection.ts`, `ole.ts`, `mail.ts`, `profiling.ts`) y `src/server/knowledge/system/manual/integration/` hace lo mismo para `json.ts`, `http.ts`, `rest.ts`, `oauth.ts`, `pdf.ts`, `filesystem.ts`, `compression.ts`, `crypto.ts` y `dotnet.ts`, cerrando el backlog B359 completo como rail curado de overlays y excepciones `manual-only` consumidas hoy sobre el baseline `generated-primary-with-manual-overlays`;
- el catálogo fija además casing canónico para tipos runtime/integration relevantes (`Inet`, `RESTClient`, `MailFileDescription`, `MailMessage`) y completa families que faltaban en profiling (`TraceTreeRoutine`, `TraceTreeObject`, `TraceTreeUser`, etc.), correo (`SMTPClient`) e integración moderna (`ResourceResponse`, `PDFPage`, `PDFTableOfContents`, etc.);
- `src/server/parsing/grammar.ts` alinea `PB_BUILTIN_TYPES` con los tipos runtime/integration/PDF/traza representativos y `test/server/unit/runtimeCatalogDatatypes.test.ts` bloquea ya la resolución B359 según la merge policy vigente (`generated` cuando existe rail oficial y `manual-only` en excepciones como `WSConnection`), junto con la resolución representativa por categoría y la exclusión del extractor noise que solo debe seguir siendo owner-type generado;
- `docs/architecture.md`, `docs/testing.md`, `docs/rules-catalog.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/roadmap.md`, `docs/backlog.md` y `docs/current-focus.md` quedan alineados con el cierre de B359 y con el siguiente foco natural `B360`.

**Validación registrada:**
- `npm run test:unit -- --grep "runtimeCatalogDatatypes|catalogV2"`
- `npm run test:unit -- --grep "catalog|systemCatalog|catalogV2|catalogConsistency|nativeAncestors|ownerTypes"`
- `npm run test:unit -- --grep "completion|hover|signatureHelp"`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/testing.md`
- `docs/rules-catalog.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.160 B358. Visual PowerBuilder system object datatypes catalog completion — **Cerrada (spec 372, manual visual rail 2026-05)**

**Objetivo:** cerrar el rail visual curado del catálogo PowerBuilder bajo `manual/visual/`, separando ventanas, controles, Ribbon y OLE visual del runtime nonvisual y dejando owner groups + ancestros nativos alineados con el catálogo estable.

**Resultado registrado:**
- `src/server/knowledge/system/manual/visual/` queda materializado en slices pequeñas (`visualObjects.ts`, `textControls.ts`, `listControls.ts`, `drawingControls.ts`, `dataControls.ts`, `ribbonControls.ts`, `oleVisualControls.ts`) y `manual/visual/index.ts` publica un agregador estable reutilizable por `manual/index.ts` sin volver a un `systemTypes.ts` monolítico;
- `src/server/knowledge/system/manual/runtime/systemTypes.ts` queda reducido al carril runtime/nonvisual, `Application` pasa a `Objetos de sistema`, `OLEControl`/`OLECustomControl` quedan en `OLE visual` y el agregador manual recompone visual + runtime sin cambiar el dominio público `system-object-datatypes`;
- `visualOwnerTypes.ts`, `nativeAncestors.ts` y `grammar.ts` alinean owner groups, builtins y cadenas nativas para tipos visuales avanzados como `MDIFrame`, `MDIClient`, `MenuCascade`, `RibbonApplicationMenu`, `RibbonPanelItem` y `WindowActiveX`, preservando la separación visual/runtime para el siguiente slice `B359`;
- `test/server/unit/visualCatalogDatatypes.test.ts` fija el cierre de B358 y `catalogV2.test.ts` sigue bloqueando regresiones del catálogo combinado.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit -- --grep "visualCatalogDatatypes|catalogV2"`

**Documentación alineada:**
- `docs/architecture.md`
- `docs/testing.md`
- `docs/rules-catalog.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`

## 1.159 B339. Catalog provenance audit against official Appeon sources — **Cerrada (spec 371, catalog provenance guardrails 2026-05)**

**Objetivo:** auditar provenance, authority, versionado y límites de cobertura del system catalog para distinguir de forma ejecutable rails `generated` oficiales frente a rails `manual-core` curados, sin sobreatribuir cobertura Appeon.

**Resultado registrado:**
- `src/server/knowledge/system/consistency.ts` amplía `buildCatalogConsistencyReport()` con un audit explícito de provenance: counts por `kind`/`authority`, summaries por dominio, guards de mismatch `dataset -> authority/kind` y listas de incidencias para `source`, `sourceUrl`, `version` y `generatedAt` donde aplica;
- `test/server/unit/catalogProvenanceAudit.test.ts` y `catalogConsistency.test.ts` fijan que `manual-core` se publique como `manual/curated`, que `generated` se publique como `generated/official`, que los entries oficiales mantengan `sourceUrl` y `generatedAt`, y que dominios representativos como `global-functions`, `system-globals` y `operators` conserven límites de coverage explícitos;
- `docs/architecture.md`, `docs/testing.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/roadmap.md`, `docs/backlog.md` y `docs/current-focus.md` quedan alineados con el contrato de provenance ya ejecutable.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit -- --grep "catalogConsistency|catalogProvenanceAudit"`

## 1.158 B365. System catalog query/index hardening v2 — **Cerrada (spec 370, composite catalog queries 2026-05)**

**Objetivo:** endurecer `buildIndexes.ts`, `queryService.ts` y `SystemCatalog.ts` para que las queries del system catalog escalen con rails manual/generated/curados crecientes sin scans completos en hot paths interactivos.

**Resultado registrado:**
- `src/server/knowledge/system/indexes/buildIndexes.ts` publica buckets compuestos y congelados para `byDomainAndLookupKey`, `byKindAndLookupKey`, `byEnumValueOf` y `byOwnerTypeAndDomain`, manteniendo construcción determinista y consumo readonly;
- `src/server/knowledge/system/services/queryService.ts` concentra queries indexadas por domain/kind/owner/enum, evita concatenaciones amplias cuando hay owner types conocidos y fija `PB_LANGUAGE_SYMBOL_RESOLUTION_PRIORITY` como orden explícito de `resolveLanguageSymbol()`;
- `src/server/knowledge/system/SystemCatalog.ts` queda como facade delgada sobre `queryService.ts`, sin acceso directo a `PB_SYSTEM_SYMBOL_REGISTRY.indexes` para listados y resoluciones públicas del catálogo;
- `test/server/unit/systemCatalogQueryHardening.test.ts` y `test/server/unit/catalogV2.test.ts` fijan el contrato nuevo para índices compuestos, owner types nativos, queries de enumerados y prioridad explícita de lenguaje.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit -- --grep "systemCatalogQueryHardening|catalogV2"`

## 1.157 B357. Manual catalog modularization and slice ownership — **Cerrada (spec 369, stable manual catalog ownership 2026-05)**

**Objetivo:** reorganizar `src/server/knowledge/system/manual/` en slices funcionales con ownership explícito, sacar provenance y owner groups fuera de `manual/common.ts` y dejar agregadores estables para el registry y sus consumers.

**Resultado registrado:**
- `src/server/knowledge/system/manual/` queda reorganizado en `language/`, `datawindow/`, `runtime/`, `core/`, `ownerTypes/`, `visual/` e `integration/`, moviendo los slices manuales existentes a carpetas funcionales sin tocar IDs ni metadata semántica;
- `src/server/knowledge/system/manual/common.ts` queda helper-only, `manual/sources.ts` centraliza provenance base y `manual/ownerTypes/` concentra owner groups y applies-to compartidos;
- `src/server/knowledge/system/manual/index.ts` publica `PB_MANUAL_CORE_DATASET_SLICES` y `PB_MANUAL_CORE_OWNER_TYPE_GROUPS`, mientras `src/server/knowledge/system/registry/datasets.ts`, `generated/common.ts` y `nativeAncestors.ts` dejan de depender de imports frágiles hacia `manual/common.ts`;
- `test/server/unit/manualCatalogStructure.test.ts` fija la cobertura estructural del rail manual y la suite unitaria completa confirma que no hay regresiones en catálogo, completion, hover, signatureHelp ni boundaries arquitectónicos.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit`

## 1.156 B347. Refactor server LSP handler registration — **Cerrada (spec 368, server entrypoint decomposition 2026-05)**

**Objetivo:** descomponer `src/server/server.ts` en bootstrap, lifecycle/document handlers, feature handlers, command routing y runtime orchestration sin cambiar nombres LSP ni el comportamiento observable del servidor.

**Resultado registrado:**
- `src/server/handlers/featureHandlers.ts` concentra el wiring de `documentSymbol`, `hover`, `workspaceSymbol`, `definition`, `references`, `signatureHelp`, `completion`, `semanticTokens`, `codeAction`, `codeLens` y `rename` mediante contexto explícito;
- `src/server/handlers/documentHandlers.ts` y `src/server/handlers/lifecycleHandlers.ts` sacan del entrypoint los eventos de documento, watcher bridge, shutdown, initialize e initialized, preservando warm resume, discovery e indexación incremental;
- `src/server/handlers/buildCommandHandlers.ts`, `reportCommandHandlers.ts` y `runtimeCommandHandlers.ts` absorben `workspace/executeCommand`, dejando `src/server/server.ts` como bootstrap + runtime orchestration con helpers locales de scheduler/memoria;
- `docs/architecture.md`, `docs/testing.md` y `docs/performance-budget.md` quedan alineados con la estructura real del servidor tras la descomposición.

**Validación registrada:**
- `npm run build:test`
- `npm test`
- `npx mocha --ui tdd out/test/server/unit/architectureImports.test.js`
- `npx mocha --ui tdd out/test/server/performance/pfc-workspace.smoke.test.js out/test/server/performance/orderentry.smoke.test.js`
- `npm run test:smoke -- --grep "el formatter devuelve edits reales para un documento PowerBuilder abierto"`
- `npm run test:smoke -- --grep "registra comandos de PBAutoBuild y cancelar degrada sin build activo"`
- `npm run test:smoke -- --grep "puede ejecutar el adapter ORCA legacy sobre el archivo activo"`
- `npm run test:smoke -- --grep "exporta un health report reutilizando stats y manifest del workspace activo"`

## 1.155 B295. Support bundle redaction policy — **Cerrada (spec 367, profile-aware sanitization 2026-05)**

**Objetivo:** volver explícita la policy de redacción del support bundle según el perfil activo del workspace, manteniendo el bundle útil para soporte offline y sin copiar código bruto.

**Resultado registrado:**
- `src/client/support/supportBundle.ts` añade una `redactionPolicy` explícita por perfil (`sanitized` o `summary-only`) para paths, snippets, diagnostics, settings y manifest, y la publica dentro del `manifest.json` y del `README.md` del bundle;
- `ci-support` y `support-safe` endurecen la redacción donde corresponde, mientras los perfiles de trabajo habituales mantienen el baseline `sanitized` con basename redacted;
- `src/client/extension.ts` endurece la exportación real del bundle con un reintento corto al pedir el `semanticWorkspaceManifest`, evitando fallos transitorios del export en frío;
- `test/server/unit/supportBundle.test.ts` y `test/smoke/support-bundle.extension.test.ts` fijan la policy explícita, la degradación `summary-only` y la exportación real del bundle con el perfil activo.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/supportBundle.test.js`
- `npm run test:smoke -- --grep "exporta un support bundle saneado desde el workspace activo"`

## 1.154 B294. Enterprise configuration policy — **Cerrada (spec 366, governed workspace profiles 2026-05)**

**Objetivo:** cerrar una policy explícita y gobernable de settings del workspace con perfiles corporativos visibles, sin abrir overrides opacos fuera del carril actual de governance.

**Resultado registrado:**
- `src/client/settingsGovernance.ts` amplía el catálogo a los perfiles `fast`, `balanced`, `deep-analysis`, `legacy-orca`, `ci-support` y `support-safe`, con claves gobernadas explícitas y aliases legacy normalizados para `interactive` y `legacy-safe`;
- `package.json` publica el schema actualizado de `vscPowerSyntax.profile` para esos seis perfiles y mantiene `balanced` como baseline por defecto;
- `test/server/unit/settingsGovernance.test.ts` fija el catálogo estable, los conflictos estructurales y la normalización de aliases, mientras `test/smoke/extension.test.ts` fija el schema visible y la inspección read-only de la governance real en la extensión.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/settingsGovernance.test.js`
- `npm run test:smoke -- --grep "settings governance publica perfiles corporativos y tolera la inspección read-only"`

## 1.153 B296. Enterprise health score — **Cerrada (spec 365, health dashboard scoring 2026-05)**

**Objetivo:** añadir un score agregado y explicable del workspace sobre las surfaces ya publicadas del runtime para resumir readiness, diagnostics, build, ORCA, cache, sourceOrigin, performance y support matrix sin abrir otro motor de health.

**Resultado registrado:**
- `src/client/projectHealthDashboard.ts` añade un scorecard puro del enterprise health con ocho dimensiones ponderadas, degradación honesta ante snapshots parciales y proyección Markdown dentro del dashboard ya existente;
- el dashboard y el `health report` exportado reutilizan exclusivamente stats, manifest, build health y support matrix ya publicados, sin tocar servidor ni contrato público;
- `test/server/unit/projectHealthDashboard.test.ts` fija tanto el score puro como su tabla Markdown visible, y `test/smoke/health-report.extension.test.ts` fija que el reporte exportado proyecta el score enterprise real del workspace.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/projectHealthDashboard.test.js`
- `npm run test:smoke -- --grep "exporta un health report reutilizando stats y manifest del workspace activo"`

## 1.152 B297. Runtime self-test command — **Cerrada (spec 364, supportability command 2026-05)**

**Objetivo:** añadir un self-test rápido del runtime que reutilice las surfaces read-only ya públicas para validar API, LSP, cache, project model, diagnósticos, build y ORCA sin abrir otra fuente de verdad.

**Resultado registrado:**
- `src/client/runtimeSelfTest.ts` añade un builder puro del reporte de self-test y su render Markdown, con checks accionables para API pública, roundtrip LSP/runtime, cache/persistencia, project model, diagnósticos, build snapshot y ORCA snapshot;
- `src/client/extension.ts` registra `vscPowerSyntax.runRuntimeSelfTest`, lo incorpora al menú de estado y abre el reporte Markdown reutilizando `getPublicContract()`, `refreshRuntimeStatusSnapshot()` y `getSemanticWorkspaceManifest()` sin tocar el servidor;
- `src/client/coreMaintenanceCommandCatalog.ts`, `src/client/statusBarPresentation.ts` y `package.json` dejan el comando visible dentro del core maintenance pack y de las acciones rápidas del runtime;
- `test/server/unit/runtimeSelfTest.test.ts`, `test/server/unit/coreMaintenanceCommandCatalog.test.ts` y `test/smoke/extension.test.ts` fijan el modelo puro, el catálogo de maintenance actualizado y la ejecución real del comando.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/runtimeSelfTest.test.js out/test/server/unit/coreMaintenanceCommandCatalog.test.js`

## 1.151 B293. Workspace support matrix finalization — **Cerrada (spec 363, visible support contract 2026-05)**

**Objetivo:** cerrar la matriz oficial de soporte del producto sobre un contrato visible y auditable, alineando health report y documentación canónica sin abrir otro rail topológico/semántico en servidor.

**Resultado registrado:**
- `src/client/projectSupportMatrix.ts` añade un builder puro que deriva la matriz de soporte desde `RuntimeStatusStats` + `ApiSemanticWorkspaceManifest`, cubriendo `Workspace`, `Solution`, target `.pbt`, `pbl-only`, source plain-text/exportado, staging ORCA, `DataWindow .srd`, `PBAutoBuild` y build files PowerServer/PowerClient con límites explícitos;
- `src/client/projectHealthDashboard.ts` proyecta esa matriz en el health report exportado, de forma que el artefacto visible reutiliza la misma verdad que el dashboard read-only y no inventa otra capa de cálculo;
- `test/server/unit/projectSupportMatrix.test.ts`, `test/server/unit/projectHealthDashboard.test.ts` y `test/smoke/health-report.extension.test.ts` fijan el contrato puro, su renderizado Markdown y la exportación real del report;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md` y `docs/testing.md` quedan alineados con la matriz oficial y con la derivación cliente-side del contrato.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/projectSupportMatrix.test.js out/test/server/unit/projectHealthDashboard.test.js`
- `npm run test:smoke`

## 1.150 B336. Catalog corpus validation against PFC/OrderEntry/legacy — **Cerrada (spec 362, corpus catalog baseline 2026-05)**

**Objetivo:** validar cobertura y consumo del catálogo contra PFC, STD_FC_OrderEntry y legacy PBL dump con una baseline separada de discovery/indexing general.

**Resultado registrado:**
- `src/server/features/catalogCorpusValidation.ts` añade un builder puro que resume `hits`, `misses`, `ambigüedades` y `budget violations` por dominio y surface a partir de probes reales trazables;
- `test/server/unit/catalogCorpusValidation.test.ts` fija la semántica del reporte y bloquea clasificaciones/budget violations antes de tocar los corpora reales;
- `test/server/performance/catalogCorpusValidation.smoke.test.ts` indexa PFC Solution, STD_FC_OrderEntry y el legacy PBL dump, calienta una pasada interactiva por probe para aislar la latencia servida del cold parse ya cubierto por otras suites, y congela cinco probes reales sobre `system-globals`, `global-functions` y `datawindow-functions`, exigiendo baseline `0 misses / 0 ambigüedades / 0 budget violations` en `hover`, `completion` y `diagnostics`;
- `test/results/003-real-corpora-baseline.md` registra la baseline catalog-driven por dominio/surface sin remezclarla con discovery/indexing general ni con la calibración de confidence cerrada en `B283`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/catalogCorpusValidation.test.js out/test/server/performance/catalogCorpusValidation.smoke.test.js`
- `npx mocha --ui tdd out/test/server/performance/catalogCorpusValidation.smoke.test.js out/test/server/performance/pfc-solution.smoke.test.js out/test/server/performance/orderentry.semantic.test.js out/test/server/performance/legacy-pbl-dump.smoke.test.js`
- `npx mocha --ui tdd out/test/server/unit/catalogV2.test.js out/test/server/unit/completion.test.js out/test/server/unit/hover.test.js out/test/server/unit/diagnostics.test.js`

## 1.149 B283. Semantic confidence calibration over real corpora — **Cerrada (spec 361, corpus-driven confidence baseline 2026-05)**

**Objetivo:** convertir la policy de readiness/confidence en una calibración ejecutable sobre PFC, OrderEntry y el corpus legacy público, fijando baseline de falsos positivos/negativos por feature y revisando thresholds contra evidencia real en lugar de intuición local.

**Resultado registrado:**
- `src/server/features/confidenceCalibration.ts` añade un builder puro de baseline que compara expectativas calibradas con `decideFeatureReadiness(...)` y clasifica desviaciones como `false-positive` o `false-negative`, con resumen por feature y findings trazables por corpus/escenario;
- `test/server/unit/confidenceCalibration.test.ts` fija la semántica del baseline y bloquea las clasificaciones más permisivas/restrictivas, evitando que el reporte esconda desviaciones de policy;
- `test/server/performance/confidenceCalibration.smoke.test.ts` indexa PFC Solution, STD_FC_OrderEntry y el legacy PBL dump, congela cuatro escenarios reales (`low`, `medium`, `high`) y verifica que `hover`, `completion`, `definition`, `references`, `rename` y `signature-help` mantienen baseline `0 false positives / 0 false negatives` con los thresholds actuales;
- la calibración revisa los thresholds por feature sin cambiarlos: `low` sigue siendo suficiente para `hover/completion/signature-help`, `medium` sigue desbloqueando `definition`, y `high` permanece requerido para `references/rename` en snapshot `ready`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/confidenceCalibration.test.js out/test/server/performance/confidenceCalibration.smoke.test.js`

## 1.148 B330. Catalog-driven contextual completion v2 — **Cerrada (spec 360, contextual catalog completion 2026-05)**

**Objetivo:** ampliar completion para consumir `reserved-words`, `pronouns`, `system-globals` y `enumerated-values` desde el catálogo, manteniendo prefix filtering, deduplicación, prioridad estable y bloqueo en member contexts irrelevantes.

**Resultado registrado:**
- `src/server/features/completion.ts` amplía la rama sin qualifier para incorporar `reserved-words`, `pronouns`, `system-globals` y `enumerated-values` desde `SystemCatalog`, reutilizando el conjunto `seen` ya existente para dedupe case-insensitive y manteniendo esos dominios detrás de las prioridades `0_local`, `1_member` y `2_global`;
- `createSystemCompletionItem(...)` deja de tratar todo lo no callable como `Keyword` y ahora clasifica `system-global` y `pronoun` como `Variable`, `enumerated-value` como `EnumMember`, `datatype` como `TypeParameter`, `system-type` como `Class` y `constant`/`property` con kinds específicos;
- `completion.test.ts` fija el nuevo comportamiento contextual: aparecen `COMMIT`, `THIS`, `SQLCA` y `SaveAsType!` cuando el prefijo y el contexto global lo permiten, se deduplican homónimos frente a símbolos locales y se bloquea la mezcla de estos dominios en `member context` como `SQLCA.sa`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/completion.test.js`
- `npx mocha --ui tdd out/test/server/unit/hotPathAllocationBudget.test.js`

## 1.147 B325. System globals and runtime singleton catalog — **Cerrada (spec 359, typed runtime singletons 2026-05)**

**Objetivo:** completar `system-globals` y runtime singletons con tipo, riesgo y contexto útiles para consumers transaccionales y de runtime, eliminando hardcodes de `SQLCA` donde el catálogo ya debía ser la fuente de verdad.

**Resultado registrado:**
- `src/server/knowledge/system/manual/systemGlobals.ts` ahora publica metadata tipada y de riesgo para `SQLCA`, `SQLSA`, `SQLDA`, `Error` y `Message`, usando firmas como `SQLCA : Transaction` y `SQLDA : DynamicDescriptionArea` para exponer tipo/contexto directamente desde el catálogo;
- `src/server/knowledge/resolution/semanticQueryService.ts` deja de hardcodear `SQLCA -> transaction` y resuelve el tipo base del qualifier desde `resolveSystemGlobal(...)`, permitiendo que completion y otros consumers usen el catálogo para system globals en lugar de comparación por nombre crudo;
- `src/server/features/signatureHelp.ts` también deja de inferir `sqlca` por hardcode y consume `valueType` del catálogo, lo que permite seleccionar overloads locales `transaction` cuando el argumento es `SQLCA`;
- los tests focales de catálogo, completion, hover, diagnostics y signatureHelp dejan fijado que `SQLCA` expone `valueType = Transaction`, que el hover muestra tipo/riesgo y que completion/signatureHelp siguen funcionando desde metadata catalog-driven.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/catalogV2.test.js out/test/server/unit/completion.test.js out/test/server/unit/hover.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/signatureHelp.test.js`

## 1.146 B324. Official operators, pronouns and enumerated values catalog generation — **Cerrada (spec 358, curated language-domain hardening 2026-05)**

**Objetivo:** endurecer `operators`, `pronouns` y `enumerated-values` como dominios separados del catálogo, con aliases útiles y guardrails explícitos de no overlap frente a `keywords`/`reserved-words` ya oficializados.

**Resultado registrado:**
- `src/server/knowledge/system/manual/enumeratedValues.ts` introduce aliases sin `!` para tipos enumerados como `SaveAsType!`, `DWItemStatus!`, `Border!`, `WindowType!` o `Encoding!`, de modo que consumers basados en identificadores puedan resolver el dominio sin depender del sufijo léxico;
- `test/server/unit/catalogV2.test.ts` fija que `resolveLanguageSymbol('SaveAsType')` resuelva `SaveAsType!` como `enumerated-value`, bloqueando la regresión que dejaba fuera del catálogo los enumerados cuando el consumer sólo veía el identificador plano;
- el mismo `catalogV2.test.ts` añade un guardrail explícito de no solape entre `operators`/`pronouns`/`enumerated-values` y los lookup keys combinados de `keywords`/`reserved-words`, asegurando que el hardening curado del dominio no contamine el rail oficial recién cerrado en `B322`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/catalogV2.test.js`

## 1.145 B322. Official reserved words and keywords catalog generation — **Cerrada (spec 357, official language vocabulary coverage 2026-05)**

**Objetivo:** oficializar `keywords` y `reserved-words` sobre el rail restaurado en `B319`, alinear `PB_KEYWORDS` con el vocabulario oficial relevante y mantener `pronouns`/`system-globals` como blockers explícitos, no como fuente primaria del dominio.

**Resultado registrado:**
- `script/generate_official_function_catalog.cjs` ahora audita `keywords` y `reserved-words` en `officialCoverage.generated.ts`, donde ambos dominios quedan con `missingCount = 0` y coverage explícita de `60` y `43` unidades respectivamente;
- el generador materializa `PB_GENERATED_KEYWORDS` y `PB_GENERATED_RESERVED_WORDS` en `generated.generated.ts`, cubriendo modifiers oficiales como `PUBLIC` y reserved words oficiales como `COMMIT`, `NAMESPACE`, `WITH`, `XOR`, `SYSTEMREAD` y `SYSTEMWRITE` sin reabrir slices manuales paralelos;
- `generatedKeywordLexemes.generated.ts` pasa a ser el set canónico del fast-path para `PB_KEYWORDS`, mientras `grammar.ts` conserva sólo phrases de bloque y blockers explícitos de `pronouns`/`system-globals` (`this`, `super`, `sqlca`, etc.) fuera de la fuente primaria del dominio;
- el parser de reserved words queda anclado a la tabla oficial real de Appeon y deja de capturar navegación espuria (`Prev`, `Up`, `Sidebar`), cerrando el drift entre el rail oficial y el set rápido del parser.

**Validación registrada:**
- `node script/generate_official_function_catalog.cjs`
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/catalogGeneratorScript.test.js out/test/server/unit/catalogConsistency.test.js out/test/server/unit/catalogV2.test.js`

## 1.144 B323. Official datatypes and system object datatypes catalog generation — **Cerrada (spec 356, official types coverage 2026-05)**

**Objetivo:** oficializar `datatypes` y `system-object-datatypes` sobre el rail restaurado en `B319`, cerrando aliases críticos y alineando el parser fast-path con la cobertura oficial relevante.

**Resultado registrado:**
- `script/generate_official_function_catalog.cjs` ahora audita `datatypes` y `system-object-datatypes` en `officialCoverage.generated.ts`, donde ambos dominios quedan con `missingCount = 0`;
- el generador materializa en `generated.generated.ts` los `system-object-datatypes` oficiales faltantes y publica `generatedBuiltinTypes.generated.ts` para mantener `PB_BUILTIN_TYPES` alineado con los nombres oficiales relevantes sin introducir lógica dinámica en el hot path;
- `UnsignedInt` queda cubierto como alias oficial de `UnsignedInteger`, y tipos oficiales como `SMTPClient`, `WindowObject`, `PDFAction`, `SyncParm` y `PowerServerResult` pasan a resolverse desde el catálogo y el parser fast-path;
- `diagnostics.test.ts` fija el caso SD3 negativo/positivo sobre `windowobject` vs `windowobject_typo`, y `semanticConsistencyOracle.smoke.test.ts` mantiene PFC Solution y OrderEntry saludables sobre corpus real tras la ampliación del catálogo.

**Validación registrada:**
- `node script/generate_official_function_catalog.cjs`
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/catalogGeneratorScript.test.js out/test/server/unit/catalogConsistency.test.js out/test/server/unit/catalogV2.test.js out/test/server/unit/diagnostics.test.js`
- `npx mocha --ui tdd out/test/server/performance/semanticConsistencyOracle.smoke.test.js`

## 1.143 B319. Restore official catalog generator and coverage v2 — **Cerrada (spec 355, official generator rail 2026-05)**

**Objetivo:** restaurar el rail reproducible de generación oficial del catálogo sobre el layout real actual y publicar coverage por dominios relevantes sin depender de rutas históricas.

**Resultado registrado:**
- `script/generate_official_function_catalog.cjs` sigue ya apuntando al layout actual `out/server/...` y ahora serializa `officialCoverage.generated.ts` para `global-functions`, `object-functions`, `datawindow-functions`, `system-events` y `statements`, no sólo para los dos dominios históricos;
- la ejecución real del generador recompone `officialCoverage.generated.ts` con coverage agregada por dominio y actualiza únicamente `generatedAt` en `provenance.generated.ts`, sin churn adicional en `generated.generated.ts` ni `ownerTypes.generated.ts`;
- `test/server/unit/catalogGeneratorScript.test.ts` fija tanto el layout actual/wrapper compatible como la presencia de los dominios oficiales relevantes en `officialCoverage.generated.ts`, mientras `catalogConsistency.test.ts` revalida consistencia del catálogo resultante.

**Validación registrada:**
- `node script/generate_official_function_catalog.cjs`
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/catalogGeneratorScript.test.js out/test/server/unit/catalogConsistency.test.js`

## 1.142 B285. System catalog coverage v2 — **Cerrada (spec 354, runtime catalog coverage 2026-05)**

**Objetivo:** ampliar el catálogo runtime base con system types frecuentes de PFC/OrderEntry sin dispersar hardcode por `hover`, `completion`, `diagnostics` o consumers adyacentes.

**Resultado registrado:**
- `src/server/knowledge/system/manual/systemObjectDatatypes.ts` amplía el slice curado de `system-object-datatypes` con tipos runtime frecuentes usados en corpus real, incluyendo clúster HTTP/JSON/OAuth, controles visuales (`CommandButton`, `TreeView`, `WebBrowser`, `RibbonBar`, etc.), objetos no visuales (`INet`, `InternetResult`, `RestClient`, `WSConnection`, `Pipeline`, profiling/trace) y tipos de reflexión/runtime (`EnumerationDefinition`, `Function_Object`, `PBDOM_*`);
- `src/server/parsing/grammar.ts` alinea `PB_BUILTIN_TYPES` con esa cobertura curada para que el reconocimiento rápido del parser no vuelva a divergir del catálogo base;
- `test/server/unit/catalogV2.test.ts`, `completion.test.ts`, `hover.test.ts` y `powerbuilderSemanticGolden.test.ts` fijan que los nuevos system types resuelven en catálogo, aparecen en surfaces visibles y no dependen de hardcode local por feature;
- una comprobación corpus-backed sobre ancestros `global type ... from ...` en `fixtures-local/pfc` y `fixtures-local/STD_FC_OrderEntry` deja ya solo tipos de proyecto/custom sin resolver tras filtrar prefijos de workspace, sin huecos runtime obvios en el carril base.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/catalogV2.test.js out/test/server/unit/completion.test.js out/test/server/unit/hover.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js`

## 1.141 B291. Embedded SQL semantic anchors — **Cerrada (spec 353, embedded SQL anchors 2026-05)**

**Objetivo:** reutilizar `sqlRegions` y el carril transaccional ya existente para publicar anchors SQL embebidos explicables, con `confidence` y degradación honesta, en context packs, code metrics, debt report y support bundle.

**Resultado registrado:**
- `src/server/features/embeddedSqlAnchors.ts` concentra el modelo reusable de anchors SQL embebido sobre `findSqlRegions(...)`, infiere `transactionTarget` desde `CONNECT/DISCONNECT USING ...` o `SQLCA` y clasifica `confidence` como `high`/`medium`/`low` sin abrir un parser SQL nuevo;
- `src/server/features/currentObjectContext.ts`, `powerBuilderCodeMetrics.ts` y `powerBuilderTechnicalDebtReport.ts` proyectan esos anchors en las APIs read-only del objeto activo, métricas por objeto y hotspots de deuda técnica, manteniendo la degradación honesta cuando el contexto transaccional no es defendible;
- `src/client/currentObjectContextPanelModel.ts`, los markdown reports de métricas/deuda y `src/client/support/supportBundle.ts` exponen los anchors al usuario y los exportan saneados dentro del support bundle offline;
- `test/server/unit/currentObjectContext.test.ts`, `powerBuilderCodeMetrics.test.ts`, `powerBuilderTechnicalDebtReport.test.ts`, `currentObjectContextPanelModel.test.ts` y `supportBundle.test.ts` fijan el cierre del slice con `SQLCA`, confidence y export saneado.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContextPanelModel.test.js out/test/server/unit/supportBundle.test.js`

## 1.140 B290. DataStore/DataWindow behavioral catalog v2 — **Cerrada (spec 352, behavioral catalog 2026-05)**

**Objetivo:** alinear el catálogo contextual de DataStore/DataWindow para `Retrieve`, `Update`, `SetTrans`, `SetTransObject`, `GetChild`, `Describe` y `Modify` sobre un carril único consumido por `hover`, `signatureHelp`, `completion` y `diagnostics`.

**Resultado registrado:**
- `src/server/knowledge/system/manual/dataWindowFunctions.ts` publica firmas, documentación y `risk` coherentes para `Describe`, `Modify`, `Retrieve`, `SetTransObject`, `Update`, `GetChild` y `SetTrans`, y corrige `GetChild` para que solo aplique a DataWindow control y DataStore;
- `src/server/features/hover.ts` y `src/server/features/signatureHelp.ts` dejan de caer al lookup plano por nombre cuando la llamada está cualificada y el `ownerType` ya es conocido, evitando que `DataWindowChild` herede por error APIs incompatibles;
- `src/server/features/diagnostics.ts` emite `sd2UnresolvedCallable` para mismatch de owner en llamadas cualificadas del catálogo comportamental DataWindow en vez de silenciarlas por ser member calls;
- `test/server/unit/completion.test.ts`, `hover.test.ts`, `signatureHelp.test.ts` y `diagnostics.test.ts` fijan `GetChild` ausente en `DataWindowChild`, metadata ampliada de `Update(...)` y routing owner-scoped estable.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/hover.test.js out/test/server/unit/signatureHelp.test.js` → `60 passing`

## 1.103 B081. Inteligencia de DataWindow y acceso a `.Object` — **Cerrada (spec 283, DataWindow Object/GetChild navigation 2026-05)**

**Objetivo:** resolver rutas `dw.Object...` y `GetChild()` sobre DataWindow/DataWindowChild reutilizando el backbone DataWindow ya existente, sin fingir semántica cuando el binding o la cadena child no sean defendibles.

**Resultado registrado:**
- `src/server/features/dataWindowPropertyPaths.ts` amplía el bridge actual para reconocer property paths avanzados no solo en `Describe/Modify`, sino también en acceso directo `.Object.<control|column|property>` y en el primer argumento literal de `GetChild()`;
- la resolución sigue reutilizando `DataWindowModel`, `findNearestDataObjectLiteralBinding()` y la cadena child ya existente para `report(...)` / `dddw.name`, incluyendo rutas hoja directas hacia report child o dropdown child cuando el target es único;
- `test/server/unit/definition.test.ts` fija definición segura para `GetChild("state_id", ...)`, `GetChild("rpt_orders", ...)` y `dw_parent.Object.state_id.dddw.name`;
- `test/server/unit/hover.test.ts` fija hover seguro para `dw_customer.Object.DataWindow.Table.Select`, manteniendo intacto el comportamiento previo de `Describe/Modify` y la degradación honesta cuando no hay binding resoluble.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/definition.test.js out/test/server/unit/hover.test.js`

## 1.134 B280. Ambiguity model v2 for query engine — **Cerrada (spec 325, ambiguity model v2 for query engine 2026-05)**

**Objetivo:** diferenciar ambigüedad real del query engine, `global-fallback` ambiguo y conflicto de `sourceOrigin` sin abrir un segundo motor de resolución ni volver a comparaciones opacas por nombre.

**Resultado registrado:**
- `src/server/knowledge/resolution/semanticQueryService.ts` publica ya `ambiguityKind`, `fallback-ambiguity` y `source-origin-conflict` además de la evidence previa del winner path;
- `src/server/features/queryContext.ts` expone esa clasificación a features del editor, y `src/server/features/hoverFormat.ts` distingue ya entre empate por distancia mínima y ambigüedad de `global-fallback`;
- `test/server/unit/semanticQueryService.test.ts`, `queryContext.test.ts`, `hoverFormat.test.ts`, `hover.test.ts`, `definition.test.ts`, `references.test.ts` y `rename.test.ts` fijan el cierre de `B280` y preservan los guardrails previos;
- `docs/rules-catalog.md`, `docs/testing.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B281`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticQueryService.test.js out/test/server/unit/queryContext.test.js out/test/server/unit/hoverFormat.test.js out/test/server/unit/hover.test.js out/test/server/unit/definition.test.js`
- `npx mocha --ui tdd out/test/server/unit/references.test.js out/test/server/unit/rename.test.js`

## 1.133 B279. Symbol identity canonical key v2 — **Cerrada (spec 324, symbol identity canonical key v2 2026-05)**

**Objetivo:** endurecer la identidad canónica exacta de símbolo para que query engine, reports y surfaces visibles no vuelvan a comparar solo por nombre y no mezclen source real con `orca-staging`.

**Resultado registrado:**
- `src/server/knowledge/symbolKey.ts` publica ya `buildSymbolKey` exacta y `buildConflictFamilyKey` como única agregación relajada permitida para conflictos cross-project/cross-library;
- `src/server/knowledge/resolution/semanticQueryService.ts`, `src/server/features/references.ts`, `src/server/features/rename.ts` y `src/server/features/crossProjectSymbolConflicts.ts` separan ya identidad exacta, family key y preferencia por la surface local o real frente a staging;
- `src/server/features/workspaceSymbols.ts`, `src/server/features/semanticWorkspaceManifest.ts`, `src/server/features/dependencyGraph.ts`, `src/server/features/crossProjectSymbolConflicts.ts` y `src/shared/publicApi.ts` publican `identityKey` canónica en exported symbols, manifest, dependency graph y candidatos de conflicto;
- `test/server/unit/symbolKey.test.ts`, `references.test.ts`, `rename.test.ts`, `semanticWorkspaceManifest.test.ts`, `dependencyGraph.test.ts` y `crossProjectSymbolConflicts.test.ts` fijan el cierre de `B279`;
- `docs/architecture.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/testing.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B280`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/symbolKey.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js`
- `npx mocha --ui tdd out/test/server/unit/references.test.js out/test/server/unit/rename.test.js`
- `npx mocha --ui tdd out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/dependencyGraph.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js`

## 1.132 B278. Core maintenance command pack — **Cerrada (spec 323, core maintenance command pack 2026-05)**

**Objetivo:** exponer un pack homogéneo de comandos seguros para inspeccionar y mantener el core, reutilizando observabilidad local, manifest, support bundle y persistencia v2 sin abrir rails paralelos.

**Resultado registrado:**
- `src/client/coreMaintenanceCommandCatalog.ts` fija el catálogo tipado de los nueve comandos de `B278` y su clasificación `read-only` frente a `confirmable`;
- `src/client/extension.ts`, `src/server/server.ts` y `package.json` exponen ya el pack completo: `exportHealthReport`, `showMemoryBudgets`, `showIndexingState`, `showProjectRouting`, `showSourceOriginConflicts`, `validatePersistentCache`, `clearSemanticCache`, `rebuildWorkspaceIndex` y el `exportSupportBundle` ya existente, integrados además en `openStatusMenu`;
- `test/server/unit/coreMaintenanceCommandCatalog.test.ts`, `test/smoke/extension.test.ts` y `test/smoke/health-report.extension.test.ts` fijan el wiring del pack y el export real del health report sobre dashboard/stats/manifest del workspace;
- `README.md`, `docs/developer-workflows.md`, `docs/testing.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B279`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/coreMaintenanceCommandCatalog.test.js`
- `npm run test:smoke -- --grep "smoke/extension|smoke/health-report-extension"`

## 1.131 B272. PowerBuilder parser resilience fuzzing — **Cerrada (spec 322, powerbuilder parser resilience fuzzing 2026-05)**

**Objetivo:** endurecer parser/masking/splitter con fuzzing determinista sobre entradas PowerBuilder raras o truncadas, sin crash, sin scopes corruptos y sin diagnósticos explosivos.

**Resultado registrado:**
- `test/server/unit/powerbuilderParserResilienceFuzz.test.ts` añade una matriz determinista de corpus + mutaciones sobre comentarios anidados, strings raros, continuaciones `&`, SQL embebido, external functions, prototypes incompletos, eventos, `try/catch/finally`, labels y EOF truncado, comprobando no crash, rangos de scope sanos y diagnósticos acotados;
- `src/server/parsing/statementSplitter.ts` construye ya `logicalStatements` desde `stripCommentsSmart` y sus máscaras, de modo que el texto lógico no arrastra comentarios y `test/server/unit/statementSplitter.test.ts` fija el caso con `;` y `&` dentro de comentarios anidados;
- `src/server/analysis/documentAnalysis.ts` mantiene rangos agregados/monotónicos para scopes de type repetidos en `forward/implementation` y degrada a `global` los callables truncados que aparecen antes del primer `type` real, evitando colgarlos del objeto futuro bajo input malformado;
- `docs/testing.md`, `docs/architecture.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B278`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/codeMasking.test.js out/test/server/unit/nestedComments.test.js out/test/server/unit/statementSplitter.test.js out/test/server/unit/documentAnalysis.test.js out/test/server/unit/externalFunctions.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js out/test/server/unit/corpusRegression.test.js out/test/server/unit/powerbuilderParserResilienceFuzz.test.js`

## 1.130 B271. Core telemetry-free observability contract — **Cerrada (spec 321, telemetry-free observability contract 2026-05)**

**Objetivo:** formalizar un contrato versionado de observabilidad local para readiness, indexing, cache, memory, latency, build, ORCA, diagnostics, query trace, support bundle y health, sin telemetría externa ni rails paralelos de reporting.

**Resultado registrado:**
- `src/shared/publicApi.ts` añade `ApiObservabilityContractDescriptor` dentro de `ApiPublicContractDescriptor`, declarando dominios observables, surfaces `getServerStats`/`server-stats`/`vscPowerSyntax.exportSupportBundle`, privacidad `externalTelemetry = false`, `localOnly = true` y export offline explícito para support bundle;
- `test/server/unit/publicApi.test.ts` fija el contrato versionado y `test/server/unit/supportBundle.test.ts` mantiene verde el carril de redacción/saneamiento que respalda ese descriptor;
- `README.md`, `docs/architecture.md`, `docs/developer-workflows.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B272`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js`

## 1.129 B269. Semantic snapshot schema evolution and compatibility tests — **Cerrada (spec 320, semantic snapshot schema evolution and compatibility 2026-05)**

**Objetivo:** asegurar evolución compatible de snapshots semánticos, manifests, support bundles y payloads públicos exportables, sin compatibilidad silenciosa ni aceptación ambigua de versiones.

**Resultado registrado:**
- `src/client/semanticWorkspaceSnapshot.ts` normaliza snapshots legados compatibles que llegan sin `schemaVersion` o `summary`, recomputa el resumen desde `workspaceManifest` + `serverStats` y mantiene rechazo explícito de versiones no soportadas;
- `test/fixtures/compatibility/*.json`, `test/server/unit/semanticWorkspaceSnapshot.test.ts`, `publicApi.test.ts` y `supportBundle.test.ts` congelan fixtures versionadas y roundtrips sobre manifest externo, `public-contract`, `read-only-tool-bridge` y `support bundle manifest`, validando compatibilidad minor y serialización estable;
- `docs/testing.md`, `docs/architecture.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B271`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticWorkspaceSnapshot.test.js out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js`

## 1.128 B270. Persistent cache corruption/fuzz recovery suite — **Cerrada (spec 319, persistent cache corruption fuzz recovery suite 2026-05)**

**Objetivo:** demostrar que la persistencia semántica degrada de forma segura ante corrupción realista de checkpoint/journal/manifest/particiones, sin crash ni estado semántico a medias.

**Resultado registrado:**
- `src/server/cache/cacheStore.ts` valida ahora explícitamente la forma del manifest de particiones antes de consumirlo, de modo que un manifest malformado o una entrada incompleta fuerzan `rebuild` limpio en vez de lanzar o seguir con estado ambiguo;
- `test/server/unit/cacheStoreCorruptionFuzz.test.ts` añade una matriz determinista de corrupción sobre `project-partitions.json`, checkpoints particionados y journals particionados, verificando que `load()` siempre responde con `decision.action = rebuild` y checkpoint vacío;
- `test/server/unit/cacheStore.test.ts` y `cachePersistence.test.ts` siguen fijando los casos de truncado/corrupción/TTL/schema/version/journal sequence/serving snapshot sobre el mismo carril, y `docs/testing.md`, `docs/performance-budget.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B269`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/cacheStore.test.js out/test/server/unit/cachePersistence.test.js out/test/server/unit/cacheStoreCorruptionFuzz.test.js`

## 1.127 B276. Hot path allocation budget and regression guard — **Cerrada (spec 318, hot path allocation budget and regression guard 2026-05)**

**Objetivo:** impedir regresiones estructurales de allocations en el carril interactivo, bloqueando materializaciones, splits y clonaciones globales antes de que degraden `hover`, `completion`, `definition`, `references`, diagnostics rápidos o `queryContext`.

**Resultado registrado:**
- `src/server/utils/documentLineText.ts` introduce acceso por línea para `TextDocument` sin partir el documento completo; `src/server/features/queryContext.ts` y `src/server/features/diagnostics.ts` pasan a consumir solo la línea activa para resolver contexto e inspección puntual;
- `src/server/features/completion.ts` deja de clonar el catálogo global completo del sistema y consume `listGlobalFunctions()` + `listStatements()`; `src/server/features/referenceSourcePool.ts` deja de renormalizar toda la lista de `getAllSourceFiles()` por cada query;
- `test/server/unit/hotPathAllocationBudget.test.ts`, junto con `queryContext.test.ts`, `completion.test.ts`, `diagnostics.test.ts`, `referenceSourcePool.test.ts`, `references.test.ts`, `definition.test.ts` y `rename.test.ts`, fija el guard local/CI contra `document.getText().split(...)`, `JSON.stringify`, `getAllEntities`/`exportDocumentRecords`, clonación global del catálogo y renormalización redundante del workspace; `docs/testing.md`, `docs/performance-budget.md`, `docs/architecture.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B270`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/queryContext.test.js out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/referenceSourcePool.test.js out/test/server/unit/references.test.js out/test/server/unit/definition.test.js out/test/server/unit/rename.test.js out/test/server/unit/hotPathAllocationBudget.test.js`

## 1.126 B275. Long-running session stability soak tests — **Cerrada (spec 317, long-running session stability soak tests 2026-05)**

**Objetivo:** simular sesiones largas para detectar crecimiento no acotado, readiness roto o cachés huérfanas antes de abrir el siguiente bloque de guards de performance.

**Resultado registrado:**
- `test/server/performance/session-stability-soak.perf.test.ts` añade una soak suite local opt-in que reutiliza el runtime ya existente para simular apertura/cierre de archivos, cambios incrementales, watcher bursts, diagnostics, `hover`/`completion`, build snapshot, support bundle, cache flush y workspace resume sobre un workspace sintético;
- `tools/run-session-stability-soak.mjs` y `package.json` exponen el runner `npm run test:performance:soak`, que compila, ejecuta solo esa suite con opt-in explícito y materializa evidencia en `artifacts/performance/session-stability-soak.json` y `.md`;
- el soak deja trazado explícito de tamaño inicial/final de `DocumentCache` y `KnowledgeBase`, máximo/final de `ServingCache`, flushes, resume checks y health/build snapshot, y `docs/testing.md`, `docs/performance-budget.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B276`.

**Validación registrada:**
- `$env:POWERSYNTAX_SOAK_ITERATIONS='8'; npm run test:performance:soak; Remove-Item Env:POWERSYNTAX_SOAK_ITERATIONS`

## 1.125 B274. Memory pressure adaptive degradation — **Cerrada (spec 316, memory pressure adaptive degradation 2026-05)**

**Objetivo:** actuar automáticamente bajo presión de memoria para proteger el carril interactivo: aliviar `ServingCache`, aplazar carriles no críticos y limitar reports read-only pesados sin convertir el runtime en un apagón global.

**Resultado registrado:**
- `src/server/runtime/memoryPressurePolicy.ts` fija la policy explícita de `B274`: thresholds artificiales sobre el reporte unificado de memoria, purga de `ServingCache`, pausa de nuevas escrituras en esa caché, aplazamiento de `background-indexing|maintenance|ai-tooling` y caps adaptativos por report (`semanticWorkspaceManifest`, `crossProjectSymbolConflicts`, `workspaceMigrationAssistant`, `codeMetrics`, `technicalDebtReport`);
- `src/server/server.ts` consume esa misma policy en el gate de background, en los writes del serving cache y en los comandos read-only pesados, de forma que `hover`, `completion`, `definition` y `signatureHelp` siguen disponibles aunque el runtime entre en modo de alivio;
- `test/server/unit/memoryPressurePolicy.test.ts`, junto con `memoryBudgets.test.ts`, `runtimeHealth.test.ts`, `semanticWorkspaceManifest.test.ts`, `crossProjectSymbolConflicts.test.ts`, `workspaceMigrationAssistant.test.ts`, `powerBuilderCodeMetrics.test.ts` y `powerBuilderTechnicalDebtReport.test.ts`, deja fijado el cierre con thresholds artificiales y revalidación de los reports capados; `docs/performance-budget.md`, `docs/architecture.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B275`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/memoryPressurePolicy.test.js out/test/server/unit/memoryBudgets.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js`

## 1.124 B268. Workspace partition isolation and multi-root stress hardening — **Cerrada (spec 315, workspace partition isolation and multi-root stress hardening 2026-05)**

**Objetivo:** evitar contaminación entre roots, proyectos, librerías, staging y build profiles, de modo que routing, `sourceOrigin`, manifest, Object Explorer, caché persistente y carriles build/ORCA sigan aislados aunque se repitan labels visibles entre roots distintos.

**Resultado registrado:**
- `src/server/workspace/workspaceState.ts` deja de inferir `sourceOrigin` con un `hasSolutionRoots` global y pasa a decidirlo por el marker topológico más cercano; `watchedFileIntake.ts` y `workspaceIndexer.ts` reutilizan la misma inferencia contextual para no divergir del estado canónico;
- `test/server/unit/workspace.test.ts`, `semanticWorkspaceManifest.test.ts` y `objectExplorerModel.test.ts` fijan el aislamiento multi-root para proyectos/librerías homónimos, la separación por `projectUri` y la ausencia de mezcla visible en manifest/Object Explorer;
- `test/server/unit/cacheStore.test.ts`, `pbAutoBuildProfileMatrix.test.ts` y `orcaStagingExport.test.ts` fijan además particiones de caché por proyecto homónimo en roots distintos, último build profile recordado por URI y selección del workspace folder correcto para staging ORCA; `docs/testing.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus quedan alineados para mover el foco canónico a `B274`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/workspace.test.js out/test/server/unit/watchedFileIntake.test.js out/test/server/unit/cacheStore.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/pbAutoBuildProfileMatrix.test.js out/test/server/unit/orcaStagingExport.test.js`

## 1.123 B273. Cross-surface golden contract matrix — **Cerrada (spec 314, cross-surface golden contract matrix 2026-05)**

**Objetivo:** congelar los outputs visibles de las surfaces read-only principales sobre un fixture compartido para que el drift entre `documentSymbols`, navegación, diagnostics, context packs, manifest, lineage y support bundle quede detectado por una única matriz golden explícita.

**Resultado registrado:**
- `test/server/unit/crossSurfaceGoldenMatrix.test.ts` crea un fixture compartido (`w_context`, `w_context_base`, `d_sales_orders`) y resume en una sola matriz estable `documentSymbols`, `workspaceSymbols`, hover, definition, references, rename eligibility, diagnostics, semantic tokens, `currentObjectContext`, `impactAnalysis`, `safeEditPlan`, manifest, dependency graph, DataWindow lineage y support bundle;
- la normalización del golden congela nombres, ubicaciones, reason codes, riesgos, `sourceOrigin`, inventory del support bundle y demás señales visibles sin fijar blobs enteros frágiles ni abrir infraestructura nueva fuera del backbone read-only ya cerrado;
- `docs/testing.md`, backlog, roadmap y current-focus quedan alineados para dejar `B273` fuera del backlog activo y mover el foco canónico a `B268`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/crossSurfaceGoldenMatrix.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js out/test/server/unit/semanticConsistencyOracle.test.js out/test/server/unit/documentSymbols.test.js out/test/server/unit/workspaceSymbols.test.js out/test/server/unit/semanticTokens.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/dependencyGraph.test.js out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/supportBundle.test.js`

## 1.122 B277. Core module dependency firewall — **Cerrada (spec 313, core module dependency firewall 2026-05)**

**Objetivo:** impedir dependencias indebidas entre `client`, `shared`, `runtime`, `features`, `knowledge/parsing/utils` y el carril `build/ORCA`, de modo que el hot path semántico y el contrato entre capas queden protegidos por un guard automático y no por convención difusa.

**Resultado registrado:**
- `test/server/unit/architectureImports.test.ts` deja de ser un guard puntual de `B228` y pasa a escanear reglas por capa: `knowledge/parsing/utils` no pueden importar `vscode`/`vscode-languageserver`, `client` no puede importar `server`, `runtime/features` no pueden importar `client`, `shared` no puede importar `client/server` y `build` no puede tocar el hot path semántico interactivo (`documentAnalysis`, `semanticQueryService`, parsing ni features interactivas);
- la allowlist mínima queda implícita en las reglas y los imports resueltos realmente por archivo, evitando depender de un listado textual frágil o de documentación manual;
- `docs/architecture.md`, `docs/testing.md`, backlog, roadmap y current-focus quedan alineados para tratar `B277` como guardrail previo del siguiente bloque visible (`B273`).

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/architectureImports.test.js`

## 1.121 B267. Runtime backpressure policy v2 for competing workloads — **Cerrada (spec 312, runtime backpressure policy v2 2026-05)**

**Objetivo:** formalizar una policy runtime global por workload para que `interactive`, `near-context`, `diagnostics`, `background-indexing`, `export-reporting`, `build`, `legacy-orca`, `ai-tooling` y `maintenance` compitan sobre el mismo scheduler sin abrir un segundo runtime ni dejar build/ORCA/reporting fuera de control.

**Resultado registrado:**
- `src/server/runtime/backpressurePolicy.ts` fija ya el registro único por workload con `lane`, `throttledByLatency` y `preemptible`, de modo que `build` y `legacy-orca` quedan preservados una vez arrancan mientras `background-indexing`, `export-reporting`, `maintenance` y `ai-tooling` siguen siendo cancelables/preemptibles;
- `src/server/runtime/scheduler.ts` consume esa policy para exponer `pendingWorkloads`, `active*Workload`, `throttledBackgroundWorkload/reason` y respetar la no preempción de `build/legacy-orca`; `src/server/analysis/diagnosticScheduler.ts` clasifica diagnostics como workload propio;
- `src/server/server.ts` ya pasa `pbAutoBuild`, ORCA, maintenance y reports read-only por el scheduler común con yielding previo y admission gating por latencia; `currentObjectContext` y `dependencyGraph` entran por `near-context`, mientras `runtimeHealth` y `statusBarPresentation` proyectan el throttling visible;
- `test/server/unit/backpressurePolicy.test.ts`, `scheduler.test.ts`, `diagnosticScheduler.test.ts`, `runtimeHealth.test.ts`, `statusBarPresentation.test.ts`, junto con la batería `currentObjectContext|impactAnalysis|safeEditPlan|safeBatchRefactorPlan|semanticWorkspaceManifest|crossProjectSymbolConflicts|workspaceMigrationAssistant|powerBuilderCodeMetrics|powerBuilderTechnicalDebtReport|pbAutoBuildRunner|orcaRunner|specDrivenPblUpdate|specDrivenPblUpdateBatch`, fijan la policy runtime y el wiring read-only/build/legacy sobre el scheduler único.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/backpressurePolicy.test.js out/test/server/unit/scheduler.test.js out/test/server/unit/diagnosticScheduler.test.js out/test/server/unit/runtimeHealth.test.js out/test/server/unit/statusBarPresentation.test.js`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/safeBatchRefactorPlan.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/orcaRunner.test.js out/test/server/unit/specDrivenPblUpdate.test.js out/test/server/unit/specDrivenPblUpdateBatch.test.js`

## 1.120 B266. Query scope policy v2 and consumer budget declarations — **Cerrada (spec 311, query scope policy v2 2026-05)**

**Objetivo:** formalizar scope máximo, budget, result cap, readiness, confidence, fallback y allowances `staging/generated/external` por consumer semántico, evitando widening global y materialización no defendible fuera de policy.

**Resultado registrado:**
- `src/server/features/queryScopePolicy.ts` centraliza ya la policy v2 para `hover`, `definition`, `signatureHelp`, `completion`, `references`, `rename`, `CodeLens`, `diagnostics`, `currentObjectContext`, `impactAnalysis` y los planes seguros, con `maxScope`, `budgetMs`, `resultCap`, readiness, confidence, fallback y allowances explícitos por consumer;
- `src/server/features/referenceSourcePool.ts` y `src/server/server.ts` ya consumen esa policy para `references`, `rename` y `CodeLens`, de modo que los consumers acotados a `project` no caen a `workspace` cuando falta routing y no materializan `orca-staging/generated` por defecto;
- `src/server/features/featureReadiness.ts` deriva ya readiness/confidence/fallback del mismo registro y `signatureHelp` entra en el gate común del servidor; `completion`, `currentObjectContext` e `impactAnalysis` consumen además los caps por defecto del mismo contrato central;
- `test/server/unit/queryScopePolicy.test.ts`, `referenceSourcePool.test.ts`, `featureReadiness.test.ts`, `references.test.ts`, `rename.test.ts`, `codeLensReferences.test.ts`, `completion.test.ts`, `signatureHelp.test.ts`, `currentObjectContext.test.ts` e `impactAnalysis.test.ts` fijan la policy, el no-widening a `workspace`, la exclusión de `staging/generated` y el caso negativo de report pesado sin materialización global.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/queryScopePolicy.test.js out/test/server/unit/referenceSourcePool.test.js out/test/server/unit/featureReadiness.test.js out/test/server/unit/references.test.js out/test/server/unit/rename.test.js out/test/server/unit/codeLensReferences.test.js out/test/server/unit/completion.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/currentObjectContext.test.js out/test/server/unit/impactAnalysis.test.js`

## 1.119 B265. Incremental invalidation proof suite — **Cerrada (spec 310, incremental invalidation proof suite 2026-05)**

**Objetivo:** demostrar que cada cambio invalida solo lo necesario sin rediscovery global innecesario, cubriendo cambios cosméticos, implementation/prototype/ancestor, `.srd`/`DataObject`, markers topológicos, `sourceOrigin`, ORCA staging y external functions.

**Resultado registrado:**
- `src/server/knowledge/semanticDiff.ts` ya incorpora dependencias `DataObject`/`report`/`dddw` y trata los argumentos retrieve de `.srd` como contrato semántico, permitiendo que el fan-out incremental alcance a consumidores ligados sin abrir otro motor de invalidación;
- `test/server/unit/watchedFileIntake.test.ts` fija ya la proof suite incremental sobre snapshots, serving cache, dependency graph, manifest, diagnostics y current object context para cambios cosméticos, implementation-only, prototype-only heredado, ancestor signature, `.srd`/`DataObject`, external function, ORCA staging, markers/sourceOrigin y bursts del watcher;
- `test/server/unit/semanticDiff.test.ts` fija los nuevos dependency keys y el cambio de contrato retrieve de `.srd`, mientras `test/server/performance/large-workspace-incremental.perf.test.ts` mantiene el gate de presupuesto incremental y degradación segura para ráfagas watcher;
- `docs/testing.md`, `docs/performance-budget.md`, backlog, roadmap y current-focus dejan trazado que `B265` queda cerrada en `specs/310-incremental-invalidation-proof-suite` y que el siguiente foco canónico pasa a `B266`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticDiff.test.js out/test/server/unit/watchedFileIntake.test.js`
- `npx mocha --ui tdd out/test/server/performance/large-workspace-incremental.perf.test.js`

## 1.118 B264. Semantic consistency oracle across all read-only surfaces — **Cerrada (spec 309, semantic consistency oracle 2026-05)**

**Objetivo:** comprobar que las surfaces read-only cuentan la misma historia sobre el mismo objeto/símbolo y dejar un oracle con reason codes que detecte drift de `objectName`, `objectKind`, `project`, `library`, `sourceOrigin`, ancestros, diagnostics, readiness, confidence y DataObject bindings sin abrir otro motor semántico.

**Resultado registrado:**
- `src/server/features/powerBuilderObjectKind.ts` centraliza la inferencia de `objectKind` por URI y `src/server/features/currentObjectContext.ts` deja de publicar el `EntityKind` genérico (`Type`) para alinearse con el manifest y el resto de surfaces read-only;
- `src/server/features/semanticConsistencyOracle.ts` compone `currentObjectContext`, `semanticWorkspaceManifest`, `dependencyGraph`, diagnostics directos, `dataWindowSqlLineage` y `crossProjectSymbolConflicts` en un oracle interno con reason codes explícitos, comparación honesta de budgets truncados del manifest y detección de drift/casos ambiguos sin otra API pública;
- `test/server/unit/semanticConsistencyOracle.test.ts` fija casos sanos, divergencias forzadas y convivencia real/orca-staging; `test/server/performance/semanticConsistencyOracle.smoke.test.ts` valida además un archivo real de PFC Solution y otro de OrderEntry; `currentObjectContext.test.ts` y `semanticWorkspaceManifest.test.ts` fijan la normalización compartida de `objectKind`;
- `docs/testing.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B264` queda cerrada en `specs/309-semantic-consistency-oracle` y que el siguiente foco canónico pasa a `B265`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/semanticConsistencyOracle.test.js`
- `npx mocha --ui tdd out/test/server/performance/semanticConsistencyOracle.smoke.test.js`

## 1.117 B263. Agent-ready task execution contracts — **Cerrada (spec 308, agent-ready task execution contracts 2026-05)**

**Objetivo:** definir contratos versionados de ejecución de tareas aptos para agentes sobre la surface actual, con dry-run, límites write-enabled, receipts y handoff SDD explícitos, sin meter IA dentro del core.

**Resultado registrado:**
- `src/shared/publicApi.ts` amplía `ApiPublicContractDescriptor` con `taskExecutionCatalog`, publica contratos versionados para `applySpecDrivenPblUpdate` y `applySpecDrivenPblUpdateBatch` y deja una simulación declarativa de dry-run sobre `generateSafeEditPlan` sin abrir otro ejecutor;
- `test/server/unit/publicApi.test.ts` y `test/server/unit/supportBundle.test.ts` fijan schema, copias defensivas, receipts y compatibilidad del descriptor enriquecido con consumers existentes;
- `test/smoke/extension.test.ts` fija que el tool `contract` expone ese catálogo desde el host real de VS Code y que la activación mantiene el presupuesto contractual ya existente bajo el harness del repo;
- `docs/ai-orchestrator.md`, `docs/ai-agents-catalog.md`, `docs/spec-driven-development.md`, `docs/testing.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que toda tarea write-enabled debe partir del `taskExecutionCatalog`, citar `contractId`, dry-run y receipts antes del cierre y que el siguiente foco canónico pasa a `B264`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js`
- `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`

## 1.116 B262. Safe code action framework v2 — **Cerrada (spec 307, safe code action framework v2 2026-05)**

**Objetivo:** endurecer el carril de code actions pequeñas sobre diagnósticos reales, con catálogo versionado, preview, preflight y bloqueos defendibles antes de cualquier edit.

**Resultado registrado:**
- `src/server/features/codeActions.ts` evoluciona el provider existente a un catálogo versionado (`2.0.0`) con `actionId`, `requiredConfidence`, `evidence`, `preview` explícita y acciones bloqueadas cuando fallan preflight, `sourceOrigin` o guards de dynamic strings;
- `src/server/server.ts` propaga `sourceOrigin` contextual al provider de code actions para que la decisión use la misma proveniencia canónica que el resto del runtime;
- `src/server/features/diagnostics.ts` integra `SD7` en el pipeline general de diagnostics, de modo que Problems, explainability, métricas/reportes y code actions consumen la misma señal publicada;
- `test/server/unit/codeActions.test.ts`, `test/server/unit/diagnosticsObsoleteIntegration.test.ts`, `test/server/unit/obsolete.test.ts` y `test/smoke/code-actions.extension.test.ts` fijan catálogo, bloqueos y la integración real editor -> Problems -> CodeAction;
- `docs/rules-catalog.md`, `docs/spec-driven-development.md`, `docs/developer-workflows.md`, `docs/testing.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B262` queda cerrada y que el siguiente foco canónico pasa a `B263`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/codeActions.test.js out/test/server/unit/diagnosticsObsoleteIntegration.test.js out/test/server/unit/obsolete.test.js`
- `npx vscode-test --label smoke --grep "expone quick fixes seguras para diagnósticos obsoletos en Problems/CodeAction"`

## 1.115 B261. Technical debt and modernization report — **Cerrada (spec 306, technical debt and modernization report 2026-05)**

**Objetivo:** consolidar un informe exportable y priorizable de deuda técnica y modernización reutilizando métricas, diagnósticos, `sourceOrigin` y riesgos ORCA/PBL ya publicados, sin abrir un segundo motor de scoring.

**Resultado registrado:**
- `src/server/features/powerBuilderTechnicalDebtReport.ts` compone hotspots y recomendaciones defendibles sobre `code-metrics`, `diagnostic.code`, `sourceOrigin` summary y `workspaceMigrationAssistant`, incluyendo patrones `obsolete`, `dynamic-sql`, `datawindow-risk`, `external-dependency`, complejidad aproximada y riesgos legacy/sourceOrigin;
- `src/shared/publicApi.ts`, `src/server/server.ts`, `src/client/extension.ts` y `package.json` publican el contrato `ApiPowerBuilderTechnicalDebtReport`, el método `getPowerBuilderTechnicalDebtReport`, el tool read-only `technical-debt-report`, el comando servidor `powerbuilder.technicalDebtReport` y el comando cliente `PowerSyntax: Abrir Informe Técnico de Deuda y Modernización PowerBuilder` con export Markdown;
- `test/server/unit/powerBuilderTechnicalDebtReport.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan collector, contrato y wiring del host real, mientras `npm run test:unit` mantiene verde la regresión unitaria completa;
- `docs/developer-workflows.md`, `docs/rules-catalog.md`, `docs/architecture.md`, `docs/testing.md`, backlog, roadmap y current-focus dejan trazado que `B261` queda cerrada y que el siguiente foco canónico pasa a `B262`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/powerBuilderTechnicalDebtReport.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:unit`
- `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`

## 1.114 B260. Advanced PowerBuilder code metrics — **Cerrada (spec 305, advanced powerbuilder code metrics 2026-05)**

**Objetivo:** calcular métricas avanzadas y defendibles de código PowerBuilder sobre la base semántica real y exponerlas como reporte read-only exportable por API/tool/comando.

**Resultado registrado:**
- `src/server/features/powerBuilderCodeMetrics.ts` agrega un collector server-side que deriva por objeto funciones/eventos, complejidad aproximada, SQL embebido, DataWindows enlazadas, dependencias externas, lifecycle warnings, diagnostics por área y footprint build/ORCA reutilizando `KnowledgeBase`, snapshots publicados, bindings `DataObject`, `DiagnosticsSnapshot` y `WorkspaceState`;
- `src/shared/publicApi.ts`, `src/server/server.ts`, `src/client/extension.ts` y `package.json` publican el contrato `ApiPowerBuilderCodeMetrics`, el método `getPowerBuilderCodeMetrics`, el tool read-only `code-metrics`, el comando servidor `powerbuilder.codeMetrics` y el comando cliente `PowerSyntax: Abrir Métricas Avanzadas de Código PowerBuilder` con export Markdown;
- `test/server/unit/powerBuilderCodeMetrics.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan collector, contrato público y wiring/preview del reporte, manteniendo la surface read-only alineada con el host real;
- `docs/developer-workflows.md`, `docs/testing.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B260` queda cerrada y que el siguiente foco canónico pasa a `B261`.

**Validación registrada:**
- `npm run build:test`
- `npm run test:unit`
- `npx vscode-test --label smoke --grep "la extensión se activa en menos de 500ms"`

## 1.113 B259. Semantic cache compaction and retention policy v2 — **Cerrada (spec 304, semantic cache compaction retention policy v2 2026-05)**

**Objetivo:** endurecer la persistencia semántica con una policy v2 observable, con TTL por workspace, budgets de disco/journal, cleanup de workspaces obsoletos y compactación segura del journal sin degradar la ruta interactiva.

**Resultado registrado:**
- `src/server/cache/cacheStore.ts` incorpora la policy v2 con `staleWorkspaceTtlMs`, budgets de journal/disco, métricas por workspace, cleanup de `workspaceKey` obsoletos y `runMaintenance()` con validación explícita del restore tras compactar;
- `src/shared/publicApi.ts`, `src/server/server.ts` y `src/server/runtime/runtimeHealth.ts` publican la policy y el snapshot de mantenimiento por `showStats`, añaden findings de persistencia y exponen el comando servidor `powerbuilder.runSemanticCacheMaintenance`;
- `src/client/extension.ts` y `package.json` exponen `PowerSyntax: Ejecutar Mantenimiento de Cache Semántica` y lo dejan disponible también desde el status menu sin abrir un carril paralelo;
- `test/server/unit/cacheStore.test.ts` fija TTL cleanup y compactación con restore validado; `test/server/unit/runtimeHealth.test.ts` fija findings nuevos de persistencia; la suite existente de `cachePersistence` sigue cubriendo corrupción simulada del payload;
- `docs/performance-budget.md`, `docs/architecture.md`, `docs/testing.md`, backlog, roadmap y current-focus dejan trazado que `B259` queda cerrada y que el siguiente foco canónico pasa a `B260`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/cacheStore.test.js out/test/server/unit/runtimeHealth.test.js`
- `npx mocha --ui tdd out/test/server/unit/cachePersistence.test.js`
- `npx mocha --ui tdd --timeout 30000 out/test/server/performance/indexer.perf.test.js --grep "Cold start|Warm start"`

## 1.112 B258. Offline support bundle / support diagnostics export — **Cerrada (spec 303, offline support bundle support diagnostics export 2026-05)**

**Objetivo:** exportar un bundle offline de soporte con estado técnico relevante, versionado y saneado, útil para troubleshooting sin copiar código bruto del workspace por defecto.

**Resultado registrado:**
- `src/client/support/supportBundle.ts` construye un support bundle cliente-side reutilizando `serverStats`, health, diagnostics snapshot, manifest semántico, gobernanza de settings y el inventario API/tool ya publicado, con redacción explícita de rutas, URIs, ejecutables y artefactos locales;
- `src/client/extension.ts` y `package.json` exponen el comando `PowerSyntax: Exportar Support Bundle Offline`, escribiendo bundles bajo `tools/support-bundles` con `runtime-health.json`, `server-stats.sanitized.json`, `diagnostics-snapshot.sanitized.json`, `semantic-workspace-manifest.reduced.json`, `runtime-journal-tail.json`, `performance-summary.json`, `settings-governance.json`, `settings-sanitized.json`, `build-orca-snapshot.json`, `public-contract.json`, `read-only-tool-bridge.json` y `api-inventory.json`;
- `test/server/unit/supportBundle.test.ts` fija esquema, inventario mínimo y redacción de rutas/settings; `test/smoke/support-bundle.extension.test.ts` valida el wiring real del comando en el host de VS Code y que no se copie código bruto por defecto;
- `README.md`, `docs/developer-workflows.md`, `docs/testing.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B258` queda cerrada y que el siguiente foco canónico pasa a `B259`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/supportBundle.test.js`
- `npm run test:smoke -- --grep "support-bundle-extension"`

## 1.111 B257. Build profiles matrix and environment validation — **Cerrada (spec 302, build profile matrix environment validation 2026-05)**

**Objetivo:** formalizar una matriz reproducible de build profiles y validación de entorno para PBAutoBuild, visible por surface read-only y sin disparar builds para conocer el estado real.

**Resultado registrado:**
- `src/client/build/pbAutoBuildProfileMatrix.ts` construye la matriz read-only combinando inventory completo de build files, capability detection de PBAutoBuild, último profile recordado y build health para proyectar perfiles `usable|ambiguous|invalid` con `canRun` explícito;
- `src/shared/publicApi.ts` eleva la API pública a `2.9.0` con `ApiPbAutoBuildCapabilitySnapshot`, `getBuildProfileMatrix`, el tool `build-profile-matrix` y el schema `ApiBuildProfileMatrix` para consumo externo estable;
- `src/server/server.ts`, `src/client/extension.ts`, `src/client/statusBarPresentation.ts` y `package.json` exponen la nueva surface por inventario servidor + API/tool/comando Markdown + acceso rápido visible desde el status report, sin crear un nuevo rail de ejecución;
- `test/server/unit/pbAutoBuildProfileMatrix.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan comportamiento, contrato y wiring end-to-end del slice;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B257` queda cerrada y que el siguiente foco canónico pasa a `B258`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildProfileMatrix.test.js out/test/server/unit/publicApi.test.js --grep "(B257|pbAutoBuildProfileMatrix|build-profile-matrix|versión exportada|descriptor contractual|bridge read-only)"`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 1.110 B256. Workspace migration assistant for legacy layouts — **Cerrada (spec 301, workspace migration assistant 2026-05)**

**Objetivo:** asistir migraciones desde layouts legacy hacia topologías soportadas por el plugin con recomendaciones read-only, explícitas y defendibles, sin escritura opaca sobre markers o build files.

**Resultado registrado:**
- `src/server/features/workspaceMigrationAssistant.ts` construye el asistente read-only reutilizando `WorkspaceState`, summary de build files, project model y aliases ORCA para recomendar consolidación de `pbl-only`, `mixed`, build files ambiguos/inválidos y staging legacy accidental;
- `src/shared/publicApi.ts` eleva la API pública a `2.8.0` con `getWorkspaceMigrationAssistant`, el tool `workspace-migration-assistant` y el schema `ApiWorkspaceMigrationAssistant` para consumo externo estable;
- `src/server/server.ts`, `src/client/extension.ts` y `package.json` exponen la nueva surface por LSP, tool bridge y el comando `PowerSyntax: Abrir Asistente de Migración de Workspace`, abriendo un Markdown lateral reutilizable incluso cuando discovery todavía degrada a `available: false`;
- `test/server/unit/workspaceMigrationAssistant.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan comportamiento, contrato y wiring end-to-end del slice, evitando una smoke frágil dependiente del timing de discovery;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B256` queda cerrada y que el siguiente foco canónico pasa a `B257`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/workspaceMigrationAssistant.test.js out/test/server/unit/publicApi.test.js --grep "(B256|workspaceMigrationAssistant|workspace-migration-assistant|versión exportada|descriptor contractual|bridge read-only)"`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 1.109 B255. Cross-project symbol conflict analyzer — **Cerrada (spec 300, cross project symbol conflict analyzer 2026-05)**

**Objetivo:** detectar conflictos semánticos defendibles entre proyectos o librerías del mismo workspace reutilizando la base read-only ya indexada, con ranking y evidencia exportable.

**Resultado registrado:**
- `src/server/knowledge/resolution/semanticQueryService.ts` y `src/server/features/queryContext.ts` dejan explícita la ambigüedad cuando el fallback global devuelve múltiples winners cross-project, sin depender solo del empate por distancia;
- `src/server/features/crossProjectSymbolConflicts.ts` construye el analizador read-only agrupando por `buildSymbolKey`, enriqueciendo proyecto/librería/sourceOrigin desde `WorkspaceState` y colapsando staging o duplicados de la misma ubicación;
- `src/shared/publicApi.ts` eleva la API pública a `2.7.0` con `getCrossProjectSymbolConflicts`, el tool `cross-project-symbol-conflicts` y el schema `ApiCrossProjectSymbolConflicts` para consumo externo estable;
- `src/server/server.ts`, `src/client/extension.ts` y `package.json` exponen la nueva surface por LSP, tool bridge y el comando `PowerSyntax: Abrir Analizador de Conflictos Cross-Project`, abriendo un Markdown lateral reutilizable incluso cuando el resultado degrada a `available: false`;
- `test/server/unit/semanticQueryService.test.ts`, `test/server/unit/queryContext.test.ts`, `test/server/unit/crossProjectSymbolConflicts.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan comportamiento, contrato y wiring end-to-end del slice;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B255` queda cerrada y que el siguiente foco canónico pasa a `B256`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticQueryService.test.js out/test/server/unit/queryContext.test.js out/test/server/unit/crossProjectSymbolConflicts.test.js out/test/server/unit/publicApi.test.js --grep "(cross-project|crossProject|publicApi|cross-project-symbol-conflicts)"`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 1.108 B254. DataWindow expression diagnostics and safe completion — **Cerrada (spec 299, datawindow expression diagnostics safe completion 2026-05)**

**Objetivo:** añadir diagnósticos y completion segura sobre expresiones DataWindow reutilizando el backbone semántico ya indexado y sin abrir parsing general dentro de strings.

**Resultado registrado:**
- `src/server/features/completion.ts` deja pasar completion dentro de strings solo cuando `dataWindowPropertyPaths` reconoce un contexto DataWindow defendible, manteniendo el guard general para strings arbitrarios;
- `src/server/features/dataWindowPropertyPaths.ts` expone completion segura e inspección reutilizable sobre property paths, apoyándose en `DataWindowModel`, bindings `DataObject` y child routes `report/dddw` ya publicados;
- `src/server/features/diagnostics.ts` añade warnings conservadores para rutas DataWindow completas no resolubles solo cuando el root está enlazado de forma única, manteniendo degradación honesta cuando el binding es dinámico;
- `src/shared/diagnosticCodes.ts`, `test/server/unit/completion.test.ts`, `test/server/unit/diagnostics.test.ts`, `test/server/unit/powerbuilderSemanticGolden.test.ts` y la estabilización de `test/server/unit/definition.test.ts` fijan contrato, safety rails y convivencia con hover/definition ya cerrados;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B254` queda cerrada y que el siguiente foco canónico pasa a `B255`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js --grep "(Modify|ruta DataWindow|binding raíz es dinámico|property paths DataWindow)"`
- `npx mocha --ui tdd out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/hover.test.js out/test/server/unit/definition.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js --grep "(DataWindow|DataObject|GetChild|Modify|Describe|property paths DataWindow)"`

## 1.107 B253. Advanced DataWindow SQL lineage — **Cerrada (spec 298, datawindow SQL lineage read only 2026-05)**

**Objetivo:** trazar un lineage SQL read-only de DataWindow sobre `retrieve`, report children, dropdown children y bindings `DataObject` reales sin abrir una segunda engine semántica.

**Resultado registrado:**
- `src/server/features/dataWindowSqlLineage.ts` construye un árbol read-only de lineage SQL reutilizando `DataWindowModel`, bindings `DataObject` y child routes `report/dddw`, con estados explícitos `resolved|missing|ambiguous|dynamic` y degradación honesta cuando la ruta no es defendible;
- `src/shared/publicApi.ts` eleva la API pública a `2.6.0` con `getDataWindowSqlLineage`, el tool `datawindow-sql-lineage` y el schema `ApiDataWindowSqlLineage` para consumo externo estable;
- `src/server/server.ts`, `src/client/extension.ts` y `package.json` exponen la nueva surface por LSP, tool bridge y el comando `PowerSyntax: Abrir DataWindow SQL Lineage`, abriendo un Markdown lateral reutilizable incluso cuando el resultado degrada a `available: false`;
- `test/server/unit/dataWindowSqlLineage.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan comportamiento, contrato y wiring end-to-end del slice;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que `B253` queda cerrada y que el siguiente foco canónico pasa a `B254`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 1.106 B252. PowerBuilder dependency graph visual/exportable — **Cerrada (spec 297, powerbuilder dependency graph visual exportable 2026-05)**

**Objetivo:** exponer un grafo inmediato de dependencias PowerBuilder que sea navegable, visualizable y exportable sin duplicar semántica fuera del pipeline ya publicado.

**Resultado registrado:**
- `src/server/features/dependencyGraph.ts` construye un grafo read-only de vecindario inmediato a partir de snapshots, evidencias semánticas y reverse dependencies ya publicadas por `KnowledgeBase`;
- `src/shared/publicApi.ts` eleva la API pública a `2.5.0` con `getPowerBuilderDependencyGraph`, el tool `dependency-graph` y el schema `ApiPowerBuilderDependencyGraph` para consumo externo estable;
- `src/client/extension.ts` expone el grafo por API/tool bridge y añade el comando `PowerSyntax: Abrir Grafo de Dependencias PowerBuilder`, abriendo un Markdown con Mermaid en preview lateral;
- `package.json`, `test/server/unit/dependencyGraph.test.ts`, `test/server/unit/publicApi.test.ts` y `test/smoke/extension.test.ts` fijan registro, contrato y comportamiento end-to-end del slice;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que el grafo queda cerrado y que el siguiente foco canónico pasa a `B253`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/dependencyGraph.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 1.105 B251. Semantic change impact diff between two workspace states — **Cerrada (spec 296, semantic snapshot diff workspace states 2026-05)**

**Objetivo:** comparar dos estados semánticos exportados del workspace y resumir cambios defendibles sin reabrir el motor semántico ni depender del estado vivo del editor.

**Resultado registrado:**
- `src/shared/publicApi.ts` amplía la API pública v2 a `2.4.0` con `diffSemanticWorkspaceSnapshots`, el tool read-only `semantic-snapshot-diff` y el schema `ApiSemanticWorkspaceSnapshotDiff`;
- `src/client/semanticWorkspaceSnapshot.ts` calcula diffs de proyectos, objetos, símbolos exportados, readiness, health, diagnósticos y `sourceOrigin` directamente sobre snapshots serializados ya exportados;
- `src/client/extension.ts` publica el diff tanto como método de API como por el bridge read-only, manteniendo el cliente como única capa de comparación y sin abrir un segundo motor;
- `test/server/unit/publicApi.test.ts`, `test/server/unit/semanticWorkspaceSnapshot.test.ts` y `test/smoke/extension.test.ts` fijan contrato, comportamiento y uso end-to-end del diff sobre snapshots reales exportados;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md`, backlog, roadmap y current-focus dejan trazado que el snapshot diff queda cerrado y que el siguiente foco canónico pasa a `B252`.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticWorkspaceSnapshot.test.js out/test/server/unit/publicApi.test.js`
- `npm run test:smoke -- --grep "la extensión se activa"`

## 1.104 B195. ORCA executable/PBD operations behind feature flag — **Cerrada (spec 295, ORCA packaging policy behind feature flag 2026-05)**

**Objetivo:** decidir si el producto debía exponer creación de `EXE/PBD/DLL` vía ORCA sin contaminar el carril moderno de `PBAutoBuild`.

**Resultado registrado:**
- `src/shared/publicApi.ts` formaliza `orcaTooling.packagingPolicy` como parte de la capability snapshot read-only, declarando `exposure: not-exposed`, `requiresFeatureFlag: true` y los artefactos `exe/pbd/dll` como alcance explícitamente no abierto;
- `src/client/build/orcaDetection.ts` publica esa policy de forma estable en todos los estados de detección ORCA sin abrir comandos nuevos ni relajar el aislamiento del carril moderno;
- `src/client/statusBarPresentation.ts` y `src/client/projectHealthDashboard.ts` proyectan la policy en status/stats/dashboard para que soporte y mantenimiento vean la decisión sin releer código;
- `README.md`, `docs/developer-workflows.md`, `docs/architecture.md` y `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` dejan alineado que el packaging ORCA no está expuesto y requeriría un feature flag dedicado antes de abrir superficie write-enabled nueva.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaDetection.test.js out/test/server/unit/statusBarPresentation.test.js out/test/server/unit/projectHealthDashboard.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.105 B235. Hover ultra-fast & developer-useful UX — **Cerrada (prompt bloque 2 2026-05)**

**Objetivo:** convertir `hover` en un carril extremadamente rápido, compacto y útil para desarrolladores PowerBuilder, apoyado en la serving layer común sin duplicar semántica ni abrir un segundo motor de resolución.

**Resultado registrado:**
- `src/server/features/hoverViewModel.ts`, `src/server/features/hoverFormat.ts` y `src/server/features/hover.ts` separan ya resolución semántica y presentación visible mediante `HoverViewModel`, `HoverKind`, negativos seguros y render compacto por tipo de símbolo, incluyendo built-ins, enum values/types, SQLCA, DataWindow/DataStore, lifecycle hooks y casos ambiguos sin metadata interna ruidosa;
- `src/server/serving/presentationCache.ts`, `src/server/server.ts` y `src/server/handlers/featureHandlers.ts` materializan `HoverViewModel cache` y `NegativeHoverCache` versionadas por URI/documento/epoch/`sourceOrigin`/locale/token-rango, con integración real sobre `InteractiveServingPipeline`, pressure policy, watcher intake, invalidación documental y shutdown;
- `src/server/serving/interactiveServingPipeline.ts` y las métricas runtime ya distinguen `cache-hit`, `viewmodel-hit`, `negative-hit`, `miss`, `stale-discarded` y `readiness-degraded` sin logs por request, y `hover` preserva casos válidos sobre strings/DataWindow/hooks antes de caer a negativo;
- `test/server/unit/hover.test.ts`, `hoverFormat.test.ts`, `interactiveServingPipeline.test.ts`, `cacheKeyContract.test.ts`, `interactiveHotPathGuards.test.ts` y `hotPathAllocationBudget.test.ts` fijan contrato visible, negativos seguros, reasons del fast path, invalidación/versionado y ausencia de full split/IO en hot path.

**Validación registrada:**
- `npm run test:unit`
- `npm run test:performance:gate`
- `npm run test:architecture:rapid`
- `npm run test:docs:drift`

## 1.104 B234. DevTools ultra-fast serving & cache layer — **Cerrada (prompt bloque 1 2026-05)**

**Objetivo:** cerrar una serving layer interactiva ultrarrápida, medible y modular para features LSP calientes sin reescribir la arquitectura global ni duplicar la verdad semántica del servidor.

**Resultado registrado:**
- `src/server/runtime/interactiveServingStats.ts`, `src/shared/publicApi.ts` y el wiring runtime exponen ya observabilidad real por feature/fase/payload/readiness/stale state, con budgets visibles y métricas agregadas reutilizables desde stats/journal sin coste ruidoso en hot path;
- `src/server/serving/interactiveServingPipeline.ts`, `payloadBudget.ts`, `staleGuard.ts`, `activeDocumentServingSnapshot.ts` y `cacheKeyContract.ts` materializan la pipeline común con payload budgets, stale guard, contrato de keys e instantánea read-only del activo reutilizada por `hover`, `completion` y `signatureHelp`;
- `src/server/knowledge/ServingCache.ts`, `src/server/server.ts`, `src/server/handlers/documentHandlers.ts` y `src/server/workspace/watchedFileIntake.ts` endurecen el serving cache con partición por feature, stats `byFeature`, alivio coordinado bajo presión de memoria e invalidación coherente por documento/watcher/shutdown;
- `test/server/unit/servingCache.test.ts`, `runtimeCommandHandlers.test.ts`, `interactiveServingPipeline.test.ts`, `activeDocumentServingSnapshot.test.ts`, `cacheKeyContract.test.ts` e `interactiveHotPathGuards.test.ts` fijan observabilidad, guards no IO/no workspace scan/no full parse, stale safety, payload budgets y reuse read-only del activo.

**Validación registrada:**
- `npm run test:unit`
- `npm run test:performance:gate`
- `npm run test:architecture:rapid`
- `npm run test:docs:drift`

## 1.103 B198. Build/ORCA documentation and troubleshooting — **Cerrada (spec 294, build/ORCA documentation and troubleshooting 2026-05)**

**Objetivo:** dejar una guía operativa única y trazable para decidir cuándo usar `PBAutoBuild`, cuándo usar `ORCA legacy` y cómo diagnosticar ambos carriles sin reabrir arquitectura ya cerrada.

**Resultado registrado:**
- `README.md` incorpora una matriz de decisión entre carril moderno y legacy, más troubleshooting rápido orientado a comandos, settings, env vars y artefactos persistidos reales del producto;
- `docs/developer-workflows.md` añade un workflow explícito para operar y diagnosticar build/ORCA usando status bar, dashboard, stats y los artefactos `tools/pbautobuild-ci`, `.vsc-powersyntax/orca-export/*` y `.vsc-powersyntax/runtime/build-orca-journal.json`;
- `docs/testing.md`, `docs/architecture.md` y `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` dejan alineado el baseline de validación documental, el estado arquitectónico y la frontera entre guía operativa y guía técnica del runtime;
- backlog, roadmap y current-focus dejan de tratar `B198` como deuda abierta y mueven el foco canónico a `B195`.

**Validación registrada:**
- auditoría documental local contra `package.json`, comandos visibles, settings y rutas de artefactos del runtime;
- `npm run build:test`

## 1.102 B200. Bulk PBL export/import orchestration — **Cerrada (spec 282, bulk PBL export/import orchestration 2026-05)**

**Objetivo:** coordinar varias actualizaciones PBL sobre el workflow unitario ya cerrado en `B199` sin reabrir ORCA, manteniendo trazabilidad por item, corte temprano opcional y agregación defendible del resultado batch.

**Resultado registrado:**
- `src/shared/publicApi.ts`, `src/client/extension.ts` y `src/server/server.ts` publican `applySpecDrivenPblUpdateBatch()` como surface versionada para batches de requests con `stopOnError` y resultado agregado por item;
- `src/server/build/specDrivenPblUpdate.ts` añade la orquestación batch secuencial reutilizando `applySpecDrivenPblUpdate()`, carga documental por item, journaling agregado y resumen `blocked/succeeded/blockedCount/stoppedEarly` sin duplicar el rail ORCA;
- `test/server/unit/specDrivenPblUpdateBatch.test.ts` fija el caso feliz multi-item, el corte temprano cuando `stopOnError` es `true` y la continuación explícita cuando se desactiva;
- el carril legacy queda ya automatizado tanto en modo unitario como batch, y el foco puede volver a la rama semántica profunda de DataWindow (`B081`).

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/specDrivenPblUpdateBatch.test.js out/test/server/unit/specDrivenPblUpdate.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.101 B199. Spec-driven PBL update workflow — **Cerrada (spec 281, spec-driven PBL update workflow 2026-05)**

**Objetivo:** permitir que una spec automatice un cambio controlado sobre una sola PBL legacy sin inventar un motor nuevo, reutilizando el safe edit plan, el export/import ORCA ya cerrados y la observabilidad persistente del carril legacy.

**Resultado registrado:**
- `src/shared/publicApi.ts`, `src/client/extension.ts` y `src/server/server.ts` publican la API/versioned command `applySpecDrivenPblUpdate`, resolviendo editor activo/posición igual que `impactAnalysis` y `safeEditPlan` pero permitiendo además edits explícitos sobre staging;
- `src/server/build/specDrivenPblUpdate.ts` orquesta `safeEditPlan`, export ORCA fresco, resolución de archivos staged mediante `trackedSources`, aplicación de edits explícitos y `runOrcaStagingImport()` sobre el mismo rail seguro con backup, ledger y journal técnico ya existentes;
- el workflow bloquea cambios fuera del safe edit plan actual y no degrada la regla `source real > orca-staging` ni los gates de `stale staging` cerrados en `B192/B196`;
- `test/server/unit/specDrivenPblUpdate.test.ts` fija el caso feliz de export + edit + import y el bloqueo cuando el edit queda fuera del plan seguro.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/specDrivenPblUpdate.test.js out/test/server/unit/orcaStagingImport.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.100 B197. Build and ORCA event journal — **Cerrada (spec 280, build and ORCA event journal 2026-05)**

**Objetivo:** dejar una traza técnica persistente y reutilizable de build/ORCA sin abrir un subsistema de logging paralelo al `RuntimeJournal` ya cerrado en `B163`.

**Resultado registrado:**
- `src/server/runtime/runtimeJournal.ts` ahora acepta observers y `src/server/runtime/buildOrcaJournalStore.ts` proyecta solo `phase: build|legacy` a `.vsc-powersyntax/runtime/build-orca-journal.json`, con restore y ring buffer persistente por workspace;
- `src/server/server.ts` conecta ese store al `RuntimeJournal`, expone `showStats.persistence.buildOrcaJournalUri`, enriquece los eventos de `pbautobuild-problems` con contexto del build file y registra eventos específicos de export ORCA además del runner genérico;
- `src/shared/publicApi.ts` publica la nueva URI persistente y mantiene intacto el snapshot exportable del journal en memoria;
- `test/server/unit/buildOrcaJournalStore.test.ts`, `runtimeJournal.test.ts`, `pbAutoBuildRunner.test.ts` y `orcaRunner.test.ts` fijan persistencia, restore, ring buffer y compatibilidad con los runners ya cerrados.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/runtimeJournal.test.js out/test/server/unit/buildOrcaJournalStore.test.js out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/orcaRunner.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.99 B196. PBL/source synchronization safety — **Cerrada (spec 279, PBL/source synchronization safety 2026-05)**

**Objetivo:** impedir que el import ORCA toque una PBL con staging obsoleto respecto al source real, sin bloquear el caso válido en el que solo se edita staging a propósito para un workflow posterior.

**Resultado registrado:**
- `src/server/build/orcaStagingExport.ts` persiste fingerprints textuales del source real rastreado por librería en `last-export.state`, reutilizando el routing del workspace para enlazar source real y export ORCA;
- `src/server/build/orcaStagingImport.ts` amplía el preflight de `import` para comparar los objetos staged con esos fingerprints persistidos, bloquear `PB-PBL-001` cuando el source real cambió desde el export y rechazar conflictos por múltiples candidatos de source real;
- `src/shared/orcaProtocol.ts` publica los nuevos códigos de preflight `stale-staging` y `source-conflict` sin abrir un canal diagnóstico separado del rail ORCA;
- `test/server/unit/orcaStagingImport.test.ts` fija que el import sigue siendo válido cuando solo cambia staging y se bloquea cuando cambió el source real desde el export.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaStagingImport.test.js out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/fileSystem.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.98 B194. ORCA regenerate and rebuild commands — **Cerrada (spec 278, ORCA regenerate/rebuild commands 2026-05)**

**Objetivo:** completar la operativa legacy visible tras `B193`, exponiendo `regenerate/rebuild` sobre el mismo carril ORCA seguro sin abrir un segundo motor ni relajar preflight/backup.

**Resultado registrado:**
- `src/server/build/orcaStagingImport.ts` se generaliza como rail write-enabled ORCA y reutiliza preflight, backup binario, `compileResult` y ledgers persistidos para `regenerate` y `rebuild` además del import ya cerrado;
- `src/shared/orcaProtocol.ts` y `src/server/server.ts` publican los nuevos contratos/comandos `powerbuilder.regenerateOrcaLibraries` y `powerbuilder.rebuildOrcaProject`, bloqueando rebuild cuando el export persistido no tiene target/project legacy válido;
- `src/client/extension.ts`, `src/client/build/orcaDetection.ts` y `package.json` publican `vscPowerSyntax.regenerateOrcaLibraries` y `vscPowerSyntax.rebuildOrcaProject` en command palette/status menu sobre el mismo rail visible del cliente;
- `test/server/unit/orcaStagingImport.test.ts` y la smoke ORCA de `test/smoke/extension.test.ts` fijan el script `regenerate`, el bloqueo de `rebuild` sin target persistido y el registro visible de los comandos nuevos.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaStagingImport.test.js out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/fileSystem.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.97 B193. ORCA import and compile controlled — **Cerrada (spec 277, ORCA import/compile controlled 2026-05)**

**Objetivo:** importar source desde ORCA staging de forma explícita, controlada y observable, con preflight mínimo, backup binario, compile result y rollback documentado antes de abrir regenerate/rebuild.

**Resultado registrado:**
- `src/server/build/orcaStagingImport.ts`, `src/server/build/orcaStagingExport.ts` y `src/shared/orcaProtocol.ts` materializan el rail de import/compile sobre `last-export.state`, la captura de fingerprints de PBL, el backup binario real, `import-from-staging.orc` y `last-import-ledger.json` con `compileResult` y rollback disponible;
- `src/server/system/fileSystem.ts` añade `copyFile()` para preservar PBL binarias reales y `src/server/server.ts` expone `powerbuilder.importOrcaStaging` reutilizando el `OrcaRunner` y el `RuntimeJournal` ya cerrados;
- `src/client/extension.ts`, `src/client/build/orcaDetection.ts` y `package.json` publican `vscPowerSyntax.importOrcaStaging` en command palette y status menu, manteniendo la UX ORCA en el mismo carril visible del cliente;
- `test/server/unit/orcaStagingImport.test.ts`, `orcaStagingExport.test.ts`, `fileSystem.test.ts` y la smoke ORCA de `test/smoke/extension.test.ts` fijan el preflight por fingerprint mismatch, el backup binario, el ledger persistido y el wiring visible del comando.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaStagingImport.test.js out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/fileSystem.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.96 B191. ORCA export to staging source — **Cerrada (spec 275, ORCA staging export 2026-05)**

**Objetivo:** exportar roots `.pbl` a un staging indexable y reproducible sin tocar la PBL binaria, reutilizando el adapter ORCA ya cerrado y sin abrir todavía prioridad de source ni import/compile.

**Resultado registrado:**
- `src/shared/orcaProtocol.ts`, `src/server/build/orcaStagingExport.ts` y `src/server/server.ts` introducen la preparación server-side del export ORCA, el `script` pborca-compatible, el `state` persistido y la restauración de aliases tras discovery para `.vsc-powersyntax/orca-export/{orca-staging,scripts,state}`;
- `src/server/workspace/workspaceState.ts`, `projectRouting.ts`, `projectRegistry.ts`, `unifiedProjectModel.ts` y `src/server/features/semanticWorkspaceManifest.ts` resuelven aliases explícitos desde cada carpeta staging hacia la librería `.pbl` original, evitando materializar el staging como una librería nueva;
- `src/client/extension.ts`, `package.json` y `.gitignore` publican `vscPowerSyntax.exportOrcaStaging`, la setting `vscPowerSyntax.legacy.orcaSessionDll`, el fallback `PB_ORCA_DLL`/`pborc250.dll` y formalizan `orca-export` como artefacto local ignorado;
- `test/server/unit/orcaStagingExport.test.ts`, `workspace.test.ts`, `semanticWorkspaceManifest.test.ts` y la smoke ORCA de `test/smoke/extension.test.ts` fijan el layout, el alias restore y el wiring visible del comando.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/workspace.test.js out/test/server/unit/semanticWorkspaceManifest.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 1.95 B190. PBL library graph and directory discovery read-only — **Cerrada (spec 274, PBL graph/discovery read-only 2026-05)**

**Objetivo:** entender workspaces legacy basados en `.pbl` como topología read-only real, sin staging aún y sin tocar PBL binaria.

**Resultado registrado:**
- `src/server/workspace/workspaceState.ts` detecta `pbl-only` cuando el discovery solo encuentra roots `.pbl` y deja de degradar ese caso a `unknown`;
- `src/server/workspace/projectRouting.ts`, `projectRegistry.ts` y `unifiedProjectModel.ts` sintetizan nodos legacy `kind: library` para roots `.pbl` no cubiertos por `.pbt/.pbproj`, de forma que el proyecto activo y el routing read-only funcionen también en PBL-only;
- `src/shared/publicApi.ts` y `src/server/features/semanticWorkspaceManifest.ts` publican esa topología legacy en el manifest read-only consumido por dashboard/Object Explorer;
- `test/server/unit/workspace.test.ts`, `semanticWorkspaceManifest.test.ts`, `objectExplorerModel.test.ts`, `watchedFileIntake.test.ts` y la smoke focal del Object Explorer fijan el comportamiento de discovery, manifest y UX visible.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/workspace.test.js out/test/server/unit/semanticWorkspaceManifest.test.js out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/watchedFileIntake.test.js`
- `npm run test:smoke -- --grep "Object Explorer"`

## 1.94 B189. ORCA capability detection and environment validation — **Cerrada (spec 273, capability/env validation 2026-05)**

**Objetivo:** detectar cuándo ORCA legacy puede usarse realmente, degradar con mensajes honestos cuando falta el tool o el entorno es inválido y publicar esa capability sin contaminar el hot path.

**Resultado registrado:**
- `src/shared/publicApi.ts` añade `ApiOrcaCapabilitySnapshot` y `orcaTooling` para que la capability ORCA viaje en el snapshot público visible;
- `src/client/build/orcaDetection.ts` resuelve capability ORCA en Windows desde `vscPowerSyntax.legacy.orcaPath` o `PB_ORCA_PATH`, distingue rutas ausentes/directorios inválidos y evita autodetección difusa por instalaciones locales;
- `src/client/extension.ts`, `src/client/statusBarPresentation.ts` y `src/client/projectHealthDashboard.ts` consumen `orcaTooling` para ejecutar ORCA con preflight visible y proyectar capability + runner en menú, tooltip, stats y dashboard;
- `test/server/unit/orcaDetection.test.ts`, `test/server/unit/statusBarPresentation.test.ts`, `test/server/unit/projectHealthDashboard.test.ts` y la smoke focal en `test/smoke/extension.test.ts` fijan la detección, la proyección visible y el comando end-to-end sobre un ejecutable de prueba.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaDetection.test.js out/test/server/unit/statusBarPresentation.test.js out/test/server/unit/projectHealthDashboard.test.js`
- `npm run test:smoke -- --grep "adapter ORCA legacy"`

## 1.93 B188. ORCA adapter architecture — **Cerrada (spec 272, ORCA adapter architecture 2026-05)**

**Objetivo:** abrir un adapter ORCA opcional, out-of-process y separado del hot path, con el mínimo wiring necesario para invocar scripts legacy sin contaminar discovery, semántica ni staging.

**Resultado registrado:**
- `src/shared/orcaProtocol.ts`, `src/server/build/orcaRunner.ts` y `src/server/server.ts` introducen un runner ORCA cancelable, observable en `showStats` y accesible por `powerbuilder.runOrcaScript/cancelOrcaScript` sin mezclarlo con el backbone semántico moderno;
- `src/client/extension.ts` y `package.json` registran `vscPowerSyntax.runActiveOrcaScript` y `vscPowerSyntax.cancelOrcaScript`, apoyados en `vscPowerSyntax.legacy.orcaPath` como configuración explícita hasta que exista capability detection real;
- `src/client/projectHealthDashboard.ts` deja de tratar ORCA como hueco abstracto y refleja el snapshot real del adapter base en el dashboard de salud;
- `test/server/unit/orcaRunner.test.ts`, `test/server/unit/projectHealthDashboard.test.ts` y la smoke focal en `test/smoke/extension.test.ts` validan el runner, la observabilidad mínima y la ejecución end-to-end con un ejecutable de prueba.

**Validación registrada:**
- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaRunner.test.js out/test/server/unit/projectHealthDashboard.test.js out/test/server/unit/currentObjectContextPanelModel.test.js`
- `npm run test:smoke -- --grep "adapter ORCA legacy sobre el archivo activo"`

## 1.69 B067. Formateador configurable — **Cerrada (formatter conservador cliente-side 2026-05)**

**Objetivo:** formateo configurable solo sobre base sintáctica/semántica fiable.

**Resultado registrado:**
- `src/shared/formatting/powerBuilderFormatter.ts` introduce un formatter conservador, puro y configurable que respeta strings/comentarios y opera solo sobre un subconjunto PowerScript soportado;
- `src/client/formatting/registerFormatting.ts` registra `DocumentFormattingEditProvider` y `formatOnSave`, manteniendo el cliente ligero y dejando el motor reutilizable fuera de VS Code;
- `package.json` publica settings explícitas (`keywordCase`, `statementCase`, `eventKeywordCase`, indentación, espacios y `formatOnSave`) para controlar el comportamiento sin tocar DataWindow ni abrir un parser paralelo.

**Validación registrada:**
- `npm run test:unit -- --grep "unit/powerBuilderFormatter"`
- `npm run test:smoke -- --grep "smoke/formatting-extension"`

### Resultado técnico registrado

`B063` deja de ser un contador plano por URI y queda cerrada como snapshot diagnóstico agrupado y versionado:

- `buildDiagnosticsSnapshot()` agrupa ahora por proyecto y por objeto, conserva `documentVersion` y `snapshotVersion`, y mantiene además la vista agregada por archivo/código/severidad para no perder consumidores previos;
- `publishDiagnostics()` deja de mantener un resumen ad hoc divergente y reutiliza el mismo contrato enriquecido, con limpieza coherente al cerrar o eliminar archivos;
- `powerbuilder.showStats` y la API pública mínima heredan ese snapshot agrupado como surface exportable ligera, sin introducir una UI nueva ni duplicar lógica de agregación.

### Documentación afectada

- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `specs/053-diagnostics-snapshot/spec.md`
- `specs/053-diagnostics-snapshot/plan.md`
- `specs/053-diagnostics-snapshot/tasks.md`

### Validación registrada

- `npm run test:unit -- --grep "unit/diagnosticsSnapshot|unit/diagnostics"`
- `npm test` → smoke `2 passing`, unit `406 passing`, integration `4 passing`
- `npm run test:performance` → `4 passing`

---

# 2. Auditoría 2026-04 — bugs críticos corregidos

## B143 — `end if` cerraba el scope de la función — **Corregido**
**Síntoma:** `END_GENERIC_PATTERN = /^end\s+/i` cerraba funciones con `end if`, `end choose`, `end try`, etc.

**Fix registrado:**
- cierre solo con `END_FUNCTION_PATTERN | END_SUBROUTINE_PATTERN | END_EVENT_PATTERN | END_ON_PATTERN`;
- `end type` cierra explícitamente `currentTypeScope`.

**Tests:** `documentAnalysis.test.ts` + fixture `function_with_endif.sru`.

---

## B144 — Declaraciones múltiples no detectadas — **Corregido**
**Síntoma:** `Integer li_a, li_b, li_c` solo registraba el primer identificador.

**Fix registrado:**
- `extractAdditionalNames()`;
- un símbolo por identificador adicional con mismo `datatype/access`.

---

## B145 — IF multi-línea con continuación `&` — **Corregido**
**Síntoma:** `if a > 0 and & \n b < 10 then` no abría correctamente el bloque IF.

**Fix registrado:**
- `validateStructure` acumula líneas lógicas con continuación `&`.

---

## B146 — Parser de parámetros más robusto — **Corregido**
**Síntoma:** `pushScopeArguments` perdía el nombre real en casos como `readonly ref string as_arr[]`.

**Fix registrado:**
- ignora múltiples modificadores iniciales;
- limpia el sufijo `[...]` del nombre.

---

## B149 — SD2 ya no recompila el regex por línea — **Corregido**
**Síntoma:** `validateSemantics` construía `new RegExp(...)` por cada línea visitada en cada scope.

**Fix registrado:**
- `SD2_CALL_REGEX` elevado a constante de módulo;
- `lastIndex` reseteado antes de cada línea.

---

# 3. Sprint de hardening del core (specs 063–082)

**Resultado global:** 275 tests verdes.

## Resueltos
- **Spec 063 — Sub-scope tracker.** `parsing/controlBlocks.ts` con `scanControlBlocks()`; cierra B148.
- **Spec 064 — Multi `type ... within` real.** `documentAnalysis` resuelve `containerName` por anidación efectiva; cierra B147.
- **Spec 065 — `getScopeAt` O(log n).** Índice plano ordenado por `startLine`.
- **Spec 067 — Default param values.** `pushScopeArguments` ignora lo posterior a `=`.
- **Spec 069 — `try/catch/finally` tracking.** Cubierto por `controlBlocks`.
- **Spec 071 — Stable scope IDs.** `stableScopeId(container, name)` en minúsculas.
- **Spec 072 — Dedup robusto.** `mapToSemanticFacts` deduplica por `(kind, container, name)`.
- **Spec 073 — Cancelación cooperativa.** `workspaceIndexer` re-comprueba `token.isCancelled` tras yield.
- **Spec 074 — Document fingerprint.** `DocumentAnalysis.fingerprint` FNV-1a 32-bit.
- **Spec 075 — URI normalization.** `projectRegistry` normaliza marker URIs y libraries.
- **Spec 078 — SD8 declaración duplicada.** Warning por nombre local duplicado.
- **Spec 079 — SD9 `return` huérfano.** Warning fuera de function/subroutine/event/on.
- **Spec 080 — SD10 `exit`/`continue` huérfano.** Warning fuera de bucle.
- **Spec 081 — `END_GENERIC_PATTERN` fuera de SD2.** `visitScopes` enumera cierres reales.
- **Spec 082 — EOF estable.** Regresión preventiva documentada.

## Confirmados como ya correctos
- **Spec 076** (`next [var]` vs `next_xxx`).
- **Spec 077** (`do ... loop while|until expr`).

## Documentación / consumo
- **Spec 066** multi-line impl header con `&`: documentado, sin cambio invasivo.
- **Spec 068** `static`: sin evidencia real en corpus actuales.
- **Spec 070** consumidor centralizado de stripper: ya mayoritariamente cubierto por `analysis.strippedLines`.

---

# 4. Sprint de hardening 2 (specs 083–102)

**Resultado global:** 278 tests verdes (275 baseline + 3 nuevos).

## Resueltos
- **Spec 083 — analysisCache LRU bound.** `MAX_CACHED_ANALYSES = 256`.
- **Spec 084 — Invalidación en cascada.** Limpia también `DocumentCache` y `KnowledgeBase`.
- **Spec 085 — URI normalization en boundary.** `getDocumentAnalysis` normaliza la URI al guardar/leer cache.
- **Spec 087 — BOM strip.** U+FEFF eliminado antes de tokenizar.
- **Spec 092/093/094 — Diagnostic dedup + cap.** dedup + máximo 500 diagnósticos por archivo.
- **Spec 095 — PROGRESS_INTERVAL configurable.** `PB_PROGRESS_INTERVAL`.
- **Spec 096 — projectRegistry orden estable.** listas ordenadas alfabéticamente.
- **Spec 097 — Indexer orden estable.** archivos procesados en orden lexicográfico.
- **Spec 099 — getStats expone indexedScopes.** observabilidad del coste del scopeIndex.
- **Spec 100 — Perf log opt-in.** `PB_PERF_LOG=1` advierte si `analyzeDocument` supera 100ms.
- **Spec 101 — Test fingerprint estable.** contrato FNV-1a determinista.
- **Spec 102 — Test containerAt anidado.** varios `type within`.

## Confirmados como ya correctos
- **Spec 086** `findDefinition` case-insensitive.
- **Spec 088** default param stripper ya cubierto.
- **Spec 089** `matchVariableDeclaration` robusto.
- **Spec 090** `stripCommentsSmart` sin sangrado entre líneas.
- **Spec 091** `getScopeAt` defensivo.
- **Spec 098** `KnowledgeBase.removeDocument` limpia estructuras relevantes.

---

# 5. Sprint de hardening 3 (specs 103–132)

**Resultado global:** 287 tests pasando (278 baseline + 9 nuevos), sin regresiones.

## Wave A — Wiring de features existentes
- **Spec 103 — Code actions wiring.** `provideCodeActions` conectado.
- **Spec 104 — CodeLens wiring.** `provideReferenceCodeLenses` conectado.
- **Spec 105 — Rename wiring.** `onPrepareRename` + `onRenameRequest` con `validateRenameTarget`.
- **Spec 106 — Execute command.** comando `powerbuilder.showStats`.
- **Spec 107 — Server stats snapshot.** snapshot agregado de KB, scheduler y workspace.

## Wave B — Análisis core
- **Spec 108 — Logical statements.** `DocumentAnalysis.logicalStatements`.
- **Spec 109 — findCallable.** `KnowledgeBase.findCallable(name, container?)`.
- **Spec 110 — Signature label.** `enrichEntity` deriva `signatureLabel` y `kindLabel`.
- **Spec 111 — Fingerprint shortcut.** reuse sin reparseo si el contenido es idéntico.
- **Spec 112 — Analysis cache stats.** `getAnalysisCacheStats()`.

## Wave C — Diagnostics nuevos
- **Spec 113 — SD11 unreachable.** línea ejecutiva tras `return` en el mismo bloque.
- **Spec 114 — SD12 unbalanced parens.** conteo simple por línea.
- **Spec 115 — SD13 missing return.** función con `returnType` declarado sin `return`.
- **Spec 116 — Severity overrides.** `PB_SEVERITY_OVERRIDES`.
- **Spec 117 — Diagnostics summary.** `getDiagnosticsSummary(uri?)`.

## Wave D — Cache y serving
- **Spec 118 — ServingCache TTL.** eviction al expirar.
- **Spec 119 — HotContextCache cap.** LRU explícito de 128 tipos.
- **Spec 120 — DocumentCache uris.** `getCachedUris()` y `getStats()`.
- **Spec 121 — ServingCache stats.** hits/misses/evictions/ttl.
- **Spec 122 — KB resync batch.** `resyncDocuments(updates[])`.

## Wave E — Indexer y scheduler
- **Spec 123 — File state machine.** `FileIndexState` y `getFileIndexState(uri)`.
- **Spec 124 — Active priority.** `indexWorkspace(..., activeUri?)` mueve el archivo activo al frente.
- **Spec 125 — Time slice budget.** `PB_TIME_SLICE_MS`.
- **Spec 126 — Max file bytes.** `PB_MAX_FILE_BYTES` con `Skipped` para archivos enormes.
- **Spec 127 — Indexer status.** `getIndexerStatus()`.

## Wave F — Tools y regresión
- **Spec 128 — Public API stats.** `ApiServerStats`.
- **Spec 129 — Public API project.** `ApiProjectInfo`.
- **Spec 130 — Public API diag tree.** `ApiDiagnosticsTreeNode`.
- **Spec 131 — Perf regression.** `perfRegression.test.ts`.
- **Spec 132 — Corpus regression.** `corpusRegression.test.ts` con fragmentos canónicos.

## Resultado funcional destacado
- 4 capabilities LSP nuevas:
  - codeAction;
  - codeLens;
  - rename;
  - executeCommand.

---

# 6. Notas de absorción / trazabilidad

## Ítems absorbidos en backlog activo nuevo

Los siguientes ítems no aparecen ya como piezas separadas en el backlog activo nuevo porque su evolución queda absorbida en líneas más fuertes del core:

- **B135** → absorbido por el snapshot semántico canónico y el nuevo núcleo documental.
- **B136** → absorbido por la línea de semantic evidence de primera clase.
- **B137** → absorbido por ancestor navigation + hierarchy inspection.

## Ítems parciales que permanecen en el backlog activo

Tras la normalización 2026-05, las antiguas épicas legacy ya no viven como `Partial`: vuelven a `Open` cuando el trabajo pendiente no cabe honestamente en un único corte. Después de `Specs 198-218`, ya no queda ningún residual `Partial` heredado de esa ola: `B141A` se cierra con `Spec 218` y el resto del trabajo abierto debe seguir leyéndose directamente desde el backlog activo bajo estado `Open`, `Ready for closure` o `Blocked`.

---

# 7. Uso recomendado

- Usar este archivo como **histórico técnico de referencia**.
- Usar el **backlog activo** para planificación diaria.
- No volver a mezclar aquí trabajo abierto salvo que se cierre completamente.


## CATALOG-MANUAL-BASE-LANGUAGE-POLICY-01 — English base language policy for manual/**

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 29.
- **Origen:** CATALOG-MANUAL-LOCALIZATION-AUDIT.
- **Evidencia:** Todo `manual/**` tenía `summary`, `documentation`, `category` en español. Cuando `locale = en`, los consumers (hover, completion, signatureHelp) podían mostrar texto español al usuario si no existía política formal de base EN + overlay ES.
- **Riesgo:** Sin política formalizada, cada migración posterior inventa criterios ad-hoc y puede introducir inconsistencias.
- **Objetivo:** Documentar en `docs/localization.md` la política final de idioma: `manual/**` = inglés canónico; `localization/es/**` = overlay español. Crear checklist de migración reutilizable.
- **Depends on:** Nada.
- **Acceptance criteria:**
  - `docs/localization.md` incluye sección de política manual-base-en.
  - Checklist documentado para migrar un archivo manual.
  - No hay cambios en código.
- **Docs:** `docs/localization.md`.
- **Tests:** N/A (doc-only).

---


## CATALOG-MANUAL-EN-MIGRATION — Per-domain English migration and ES overlay creation

- **Estado:** Partial.
- **Prioridad:** P1.
- **Orden recomendado:** 30.
- **Origen:** CATALOG-MANUAL-LOCALIZATION-AUDIT.
- **Evidencia:** Auditoría completa en `specs/CATALOG-MANUAL-LOCALIZATION-AUDIT/`.
- **Riesgo:** ~1200+ entries con texto visible español en locale=en si la migración/overlay no queda validada y cerrada formalmente.
- **Objetivo:** Paraguas para la migración EN por dominio y creación de overlays ES. Specs individuales: `CATALOG-MANUAL-CORE-TO-EN-01`, `CATALOG-MANUAL-DW-TO-EN-01`, `CATALOG-MANUAL-VISUAL-TO-EN-01`, `CATALOG-MANUAL-RUNTIME-TO-EN-01`, `CATALOG-MANUAL-LANGUAGE-TO-EN-01`, `CATALOG-MANUAL-INTEGRATION-TO-EN-01`, `CATALOG-MANUAL-TOOLING-TO-EN-01` con sus mirrors `CATALOG-LOCALIZATION-ES-MIRROR-*-01`.
- **Depends on:** `CATALOG-MANUAL-BASE-LANGUAGE-POLICY-01`, `CATALOG-MANUAL-CATEGORIES-KEYS-01`, `CATALOG-LOCALIZATION-MIRROR-STRUCTURE-01`.
- **Pendiente exacto:**
  - ejecutar `npm run report:catalog-localization` y confirmar 0 issues;
  - ejecutar tests `catalogLocalization|catalogConsistency`;
  - si todo está verde, mover el cierre real a `docs/done-log.md` y retirar este paraguas del backlog activo o marcarlo `Done` según política del repo.
- **Acceptance criteria:**
  - Todo `manual/**` en inglés canónico.
  - Overlays ES completos para dominios con documentación visible.
  - 0 issues en reporte de localización.
  - `locale=en` no muestra texto español.
- **Docs:** `docs/localization.md`, spec individual por dominio.
- **Tests:** `npm run test:unit -- --grep "catalogLocalization|catalogConsistency"`, `npm run report:catalog-localization`.

**Status por dominio:**
- [x] runtime (Done: systemGlobals, reflection, profiling, errors, ole, mail, system-object-datatypes: 100%)
- [x] core (Done: systemEvents, objectFunctions, globalFunctions)
- [x] datawindow (Done: dataWindowFunctions, dataWindowExpressionFunctions)
- [x] visual (Done: Ribbon, Visual, OLE)
- [x] language (Done: datatypes, enumerations, keywords, operators, pronouns, reservedWords, statements)
- [x] integration (Done: compression, crypto, dotnet, filesystem, http, json, oauth, pdf, rest)
- [x] tooling (Done: PBAutoBuild, ORCA)

---


## PB-SEMANTIC-P0-FACADE-CONVERGENCE-01 — Convergencia del contrato SemanticQueryFacade entre consumers interactivos

- **Estado:** Done.
- **Prioridad:** P0.
- **Orden recomendado:** 06.
- **Confianza:** High.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 2, 3, 11 y 16.
- **Evidencia:** Hover y Definition ya consumen `semanticQueryFacade`, pero Completion, Signature Help, References y otras surfaces siguen rutas distintas o híbridas. `docs/architecture.md` la presenta como fachada universal, mientras `docs/architecture-implementation-map.md` y el código muestran un slice parcial real.
- **Ejemplo PowerBuilder:**

```powerscript
public function long uf_find(long al_id)
public function long uf_find(string as_code)
```

El mismo símbolo callable debe resolverse con el mismo contrato semántico desde hover, definition, completion y signature help.
- **Fuente:** `src/server/features/hover.ts`, `src/server/features/definition.ts`, `src/server/features/completion.ts`, `src/server/features/signatureHelp.ts`, `src/server/features/references.ts`, `test/server/unit/semanticQueryFacade.test.ts`, `docs/architecture.md`, `docs/architecture-implementation-map.md`.
- **Riesgo:** Crítico. Cada consumer puede divergir en owner, ambiguity, evidence y fallback, generando UX inconsistente y fixes incompletos.
- **Objetivo:** aplicar funcionalmente el contrato común de resolución read-only para surfaces interactivas, con excepciones explícitas y documentadas solo cuando sean inevitables.
- **Pendiente exacto:**
  - fijar la matriz consumer por consumer que debe entrar por la fachada;
  - migrar o encapsular Completion, Signature Help y References hacia la misma capa o documentar claramente las excepciones;
  - unificar exposición de evidence, reason codes y fallback principal.
- **Impacto hot path:** Sí. Debe reutilizar snapshots, query context, hot context y serving cache; prohibido introducir full scans o reparsers por request.
- **Depends on:** `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`.
- **Acceptance criteria:**
  - hover y definition siguen verdes sin cambio de budgets;
  - al menos completion y signature help usan el mismo contrato o una proyección explícita derivada de él;
  - los consumers migrados comparten semantics para owner, ambiguity y target selection sobre un mismo símbolo;
  - las excepciones restantes quedan documentadas en `docs/architecture-status.md` y `docs/architecture-implementation-map.md`.
- **Docs:** `docs/architecture.md`, `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/testing.md`.
- **Tests:** `test/server/unit/semanticQueryFacade.test.ts`, unit tests de hover/completion/definition/signatureHelp/references, integración LSP para consumers afectados, `test:performance:gate`.
- **Validación:** comparar el mismo foco semántico en varios consumers y comprobar que las decisiones semánticas y budgets siguen alineados.

---


## PB-SEMANTIC-P1-CONFIDENCE-CONTRACT-01 — Calibrar confidence y conflictos cross-surface sin valores fijos no defendibles

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 11.
- **Confianza:** High.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 2, 3, 11, 14 y 16.
- **Evidencia:** `semanticTokens` publica `confidence = high` de forma fija y `Current Object Context` arranca `frameworkKnowledgeConflict` con `resolutionConfidence = high` aunque el foco real no lo haya demostrado. El backlog y current-focus hablan de conservar confidence, pero estas dos surfaces siguen rompiendo el contrato.
- **Ejemplo PowerBuilder:**

```powerscript
TriggerEvent(This, "ue_refresh")
dw_parent.DataObject = ls_dynamic_name
```

Un token coloreado o un conflicto de framework no debe aparentar certeza alta cuando la evidencia es dinámica, heredada o advisory.
- **Fuente:** `src/server/features/semanticTokens.ts`, `src/server/features/currentObjectContext.ts`, `test/server/unit/confidenceCalibration.test.ts`, `test/server/unit/currentObjectContext.test.ts`, `test/server/performance/confidenceCalibration.smoke.test.ts`, `docs/backlog.md`.
- **Riesgo:** Alto. La UI y los reportes read-only pueden sobreprometer exactitud y contaminar explainability, AI bundle y troubleshooting.
- **Objetivo:** eliminar confidence hardcoded y publicar confidence, conflicts y reason codes con la misma disciplina en todas las surfaces afectadas.
- **Pendiente exacto:**
  - sustituir valores fijos por evidence real o degradación explícita;
  - alinear `frameworkKnowledgeConflict` con la confidence del query subyacente;
  - revisar cómo semantic tokens publica o omite confidence;
  - alinear read-only reports con la nueva policy.
- **Impacto hot path:** Sí, indirecto. La calibración debe hacerse offline o con thresholds estables; el runtime no puede recalibrar por request.
- **Depends on:** `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`, `PB-SEMANTIC-P0-FACADE-CONVERGENCE-01`.
- **Acceptance criteria:**
  - ninguna surface auditada fija `high` sin evidence defendible;
  - los conflicts advisory no ocultan la naturaleza derivada de la evidencia;
  - los reportes read-only preservan confidence y risk sin inflarla;
  - la calibración de confidence sigue pasando sus smokes y no rompe budgets.
- **Docs:** `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/testing.md`, `docs/troubleshooting.md`, `docs/current-focus.md` si se vuelve foco activo.
- **Tests:** `test/server/unit/confidenceCalibration.test.ts`, `test/server/unit/currentObjectContext.test.ts`, `test/server/unit/semanticTokens.test.ts`, `test/server/performance/confidenceCalibration.smoke.test.ts`.
- **Validación:** revisar casos high, medium y low sobre el mismo símbolo y comprobar que semantic tokens, object context y reportes reflejan la misma policy.

---


## PB-SEMANTIC-P1-QUALIFIER-RESOLUTION-01 — Matriz explícita de qualifiers y owner semantics para this, parent, super y global scope

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 09.
- **Confianza:** Medium.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 3, 5, 13 y 16.
- **Evidencia:** El resolver cubre `this`, `parent`, `super`, `ancestor` y partes de `type::member`, pero siguen abiertos los casos de `global::`, `ParentWindow()` y qualifiers especiales documentados por la guía y no cubiertos de forma equivalente en runtime.
- **Ejemplo PowerBuilder:**

```powerscript
::gs_value
This.is_value
Parent.uf_save()
Super::uf_save()
ParentWindow().TriggerEvent("cancelrequested")
```

- **Fuente:** `src/server/knowledge/resolution/semanticQueryService.ts`, `src/server/knowledge/resolution/ownerResolver.ts`, `test/server/unit/scopePriority.test.ts`, `test/server/unit/semanticQueryService.test.ts`, `test/server/unit/definition.test.ts`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.
- **Riesgo:** Alto. Definition, references y hover fallan o degradan de forma poco defendible en patrones OOP básicos y qualifiers explícitos.
- **Objetivo:** cerrar la matriz soportada de qualifiers y owner semantics con ejemplos mínimos, degradación honesta y documentación alineada.
- **Pendiente exacto:**
  - fijar soporte explícito para `global::`;
  - decidir y modelar `ParentWindow()` como función y no como pseudo-pronoun;
  - consolidar `type::member` con tests literales;
  - documentar la matriz exacta soportada y degradada.
- **Impacto hot path:** Sí. Debe resolverse desde query context, graph e identity ya indexada; prohibido abrir búsquedas amplias por workspace.
- **Depends on:** `PB-SEMANTIC-P0-FACADE-CONVERGENCE-01` para consumers migrados.
- **Acceptance criteria:**
  - los casos mínimos `::gs_value`, `This.is_value`, `Parent.uf_save()`, `Super::uf_save()` y `ParentWindow()` quedan cubiertos o degradados explícitamente;
  - definition y hover convergen en el mismo target o la misma degradación;
  - la documentación owner deja clara la matriz soportada.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-status.md`, `docs/testing.md`.
- **Tests:** `test/server/unit/scopePriority.test.ts`, `test/server/unit/semanticQueryService.test.ts`, `test/server/unit/definition.test.ts`, smokes ligeras sobre corpus PFC/OrderEntry si el cambio toca heurística real.
- **Validación:** abrir los cinco ejemplos mínimos en hover y definition y verificar mismo target o misma degradación.

---


## PB-SEMANTIC-P1-EVENT-DISPATCH-01 — Dispatch explícito de EVENT, TriggerEvent, PostEvent y ancestor calls especiales

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 10.
- **Confianza:** Needs official confirmation.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 3, 5, 6, 13 y 16.
- **Evidencia:** Hay soporte útil para `TriggerEvent` y `PostEvent` con literales, pero siguen fuera del runtime actual `EVENT` directo, `AncestorReturnValue`, `ancestorclass::` y el dispatch explícito `DYNAMIC`. La guía los documenta; el código nuevo no los modela como primer nivel.
- **Ejemplo PowerBuilder:**

```powerscript
This.EVENT ue_refresh()
PostEvent(This, "ue_refresh")
TriggerEvent(This, "ue_refresh")
luo_service.DYNAMIC uf_execute(ls_action)
AncestorReturnValue
```

- **Fuente:** `src/server/utils/invocationContext.ts`, `src/server/features/queryContext.ts`, `src/server/features/references.ts`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, legacy reference in `plugin_old` for `AncestorReturnValue`.
- **Riesgo:** Alto. Event dispatch y ancestor calls quedan modelados a medias y pueden romper definition/references/explainability en código real de framework.
- **Objetivo:** decidir el soporte explícito y la degradación oficial para dispatch directo y llamadas especiales, sin inventar semántica no confirmada.
- **Pendiente exacto:**
  - cubrir o degradar `EVENT` directo;
  - decidir soporte para `AncestorReturnValue` y `ancestorclass::` con evidencia oficial adicional;
  - revisar la invocación `DYNAMIC` explícita como dispatch y no solo como keyword de catálogo.
- **Impacto hot path:** Sí, pero debe reutilizar el carril de invocation context y query context; si la evidencia no es defendible, degradar antes de resolver más.
- **Depends on:** `PB-SEMANTIC-P1-QUALIFIER-RESOLUTION-01` para la parte de qualifiers especiales.
- **Acceptance criteria:**
  - existe una matriz clara de soporte/degradación para `EVENT`, `TriggerEvent`, `PostEvent`, `AncestorReturnValue`, `ancestorclass::` y `DYNAMIC` explícito;
  - definition/references no prometen soporte donde solo hay strings dinámicos;
  - los casos con evidencia oficial insuficiente quedan en `Needs official confirmation` y degradan honestamente.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-status.md`, `docs/testing.md`.
- **Tests:** `test/server/unit/invocationContext.test.ts`, `test/server/unit/definition.test.ts`, `test/server/unit/references.test.ts`, corpus PFC/OrderEntry para ejemplos reales.
- **Validación:** verificar cada caso mínimo con definition/references y revisar que los no soportados no aparentan certeza alta.

---


## PB-SEMANTIC-P1-POWERSCRIPT-CONTROL-SLICE-01 — Cerrar el slice estructural de IF single-line y exception blocks en PowerScript

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 15.
- **Confianza:** Needs official confirmation.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 1, 4, 13, 15 y 16.
- **Evidencia:** El parser/análisis cubre bien comments, strings, splitter y bloques clásicos, pero sigue sin modelar `IF` single-line como forma oficial y deja `TRY/CATCH/FINALLY`, `THROW` y `THROWS` en un estado parcial o solo de catálogo.
- **Ejemplo PowerBuilder:**

```powerscript
IF ll_count > 0 THEN ll_total = 1 ELSE ll_total = 2

TRY
    THROW le_error
CATCH (Exception le_error)
FINALLY
END TRY
```

- **Fuente:** `src/server/parsing/grammar.ts`, `src/server/parsing/controlBlocks.ts`, `src/server/features/diagnostics.ts`, `src/server/features/diagnosticsExtra.ts`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, documentación oficial ya contrastada para `IF` y `THROWS`.
- **Riesgo:** Alto. El runtime puede describir soporte de control flow que el parser estructural aún no representa de forma defendible.
- **Objetivo:** cerrar un slice estructural concreto y testeable para `IF` single-line y exception blocks, sin abrir un “canon” general de todo el lenguaje.
- **Pendiente exacto:**
  - soportar `IF` single-line y su continuación física con `&`;
  - fijar el soporte estructural de `TRY/CATCH/FINALLY`;
  - decidir si `THROW/THROWS` entra como parseo y diagnostics estructural o si queda documentado como partial.
- **Impacto hot path:** Sí, indirecto. Debe convertirse en facts por documento/version; no puede construir CFG pesado por request.
- **Depends on:** Nada.
- **Acceptance criteria:**
  - `IF` single-line deja de caer fuera del modelo estructural;
  - `TRY/CATCH/FINALLY` tiene soporte estructural explícito o degradación documentada;
  - `THROW/THROWS` dejan de existir solo como catálogo si el runtime afirma soporte estructural.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/testing.md`, `docs/architecture-status.md`.
- **Tests:** `test/server/unit/statementSplitter.test.ts`, `test/server/unit/diagnostics.test.ts`, `test/server/unit/diagnosticsExtra.test.ts`, nuevos fixtures unitarios para `IF` single-line y exception blocks.
- **Validación:** correr unit tests del parser/splitter/diagnostics y revisar ejemplos mínimos en document analysis y diagnostics.

---


## PB-SEMANTIC-P2-LEGACY-CONTROL-MATRIX-01 — Confirmar o degradar labels, GOTO, precedencia y compilación condicional integrada

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 16.
- **Confianza:** Needs official confirmation.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 4, 8, 13, 15 y 16.
- **Evidencia:** El repo reconoce keywords y markers, pero no demuestra soporte estructural equivalente para labels, `GOTO`, precedencia expresiva ni compilación condicional integrada al pipeline principal.
- **Ejemplo PowerBuilder:**

```powerscript
goto retry_label
retry_label:

#if DEBUG then
    ls_mode = "debug"
#end if
```

- **Fuente:** `src/server/parsing/conditionalCompilationGate.ts`, `src/server/parsing/generatedKeywordLexemes.generated.ts`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `test/server/unit/conditionalCompilationGate.test.ts`.
- **Riesgo:** Medio-alto. El plugin puede aparentar conocimiento de constructs legacy o gated que hoy solo existen como catálogo o detector aislado.
- **Objetivo:** decidir, con evidencia oficial adicional cuando haga falta, qué parte se soporta, qué parte se mantiene gated y qué parte debe degradar como `Needs official confirmation`.
- **Pendiente exacto:**
  - validar oficialmente el scope de conditional compilation antes de prometer integración;
  - decidir si labels/GOTO y precedencia salen de catálogo o pasan a soporte estructural;
  - documentar la matriz resultante y no sobreprometer semántica.
- **Impacto hot path:** Sí, indirecto. Cualquier integración debe ser index-time o por snapshot, no por request.
- **Depends on:** `PB-SEMANTIC-P1-POWERSCRIPT-CONTROL-SLICE-01` para no mezclar el slice estructural ya decidido con el legacy/dudoso.
- **Acceptance criteria:**
  - la documentación owner deja clara la diferencia entre soporte estructural, detector y `Needs official confirmation`;
  - el pipeline principal no afirma soporte de constructs que solo detecta o lista en catálogo;
  - las dudas mínimas quedan trazadas con fuente oficial o con gap explícito.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-status.md`, `docs/backlog.md`.
- **Tests:** `test/server/unit/conditionalCompilationGate.test.ts`, nuevos tests mínimos solo si el alcance se confirma; `docs:drift` para asegurar que el support matrix quede honesto.
- **Validación:** revisar support matrix final y comprobar que los constructs dudosos degradan o quedan fuera del runtime semántico activo.

---


## PB-SEMANTIC-P1-DATAWINDOW-ADVANCED-SLICE-01 — Extender el slice seguro de DataWindow sin romper budgets ni fronteras de sublenguaje

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 20.
- **Confianza:** Medium.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 3, 7, 10, 14, 15 y 16.
- **Evidencia:** El repo tiene un slice DataWindow fuerte en fast context, bindings literales, `.srd`, property paths seguros y child chains deterministas, pero siguen fuera `Object.column[row]`, `Object.Data.Primary[row,col]`, `Evaluate`, `SyntaxFromSQL -> Create` y gran parte de las operaciones de edición y filas.
- **Ejemplo PowerBuilder:**

```powerscript
ls_name = dw_1.Object.emp_name[1]
ll_value = dw_1.Object.Data.Primary[1, 1]
ls_syntax = SyntaxFromSQL(ls_sql, ls_style, ls_err)
dw_1.Create(ls_syntax, ls_err)
```

- **Fuente:** `src/server/features/dataWindowFastContext.ts`, `src/server/features/dataWindowPropertyPaths.ts`, `src/server/features/dataWindowModel.ts`, `test/server/unit/dataWindowFastContext.test.ts`, `test/server/unit/currentObjectContext.test.ts`, `test/smoke/datawindow-b344.extension.test.ts`, advanced specs 249/283/299.
- **Riesgo:** Alto. El plugin podría confundir cobertura segura actual con soporte total de DataWindow o degradar demasiado poco ante expresiones dinámicas.
- **Objetivo:** ampliar solo el slice defendible, con cache y budgets explícitos, manteniendo la regla de que `.srd` y expresiones DataWindow no son PowerScript normal.
- **Pendiente exacto:**
  - decidir qué property paths y accesos indexados entran en el slice seguro;
  - extender `Evaluate` y `SyntaxFromSQL -> Create` solo si se puede conservar degradación honesta;
  - cubrir operaciones de edición/filas que ya tengan patrón defendible;
  - fijar un gate de performance para el escaneo de diagnostics y property paths avanzadas.
- **Impacto hot path:** Sí. Todo lo pesado debe resolverse en index-time o en modelos cacheables; los casos dinámicos deben degradar por confidence.
- **Depends on:** `PB-ARCH-P1-DATAWINDOW-SUBMODEL-PUBLICATION-01`, specs y slices existentes de DataWindow (`249`, `283`, `299`).
- **Acceptance criteria:**
  - el nuevo slice se expresa como whitelist defendible, no como parser DataWindow general;
  - hover/completion/definition/diagnostics sobre los casos añadidos pasan en el fixture correspondiente;
  - los casos dinámicos o ambiguos degradan de forma honesta;
  - el performance gate sigue verde.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/testing.md`, `docs/performance-budget.md`.
- **Tests:** `test/server/unit/dataWindowFastContext.test.ts`, `test/server/unit/currentObjectContext.test.ts`, `test/server/unit/diagnostics.test.ts`, `test/smoke/datawindow-b344.extension.test.ts`, `test:performance:gate`.
- **Validación:** verificar hover/completion/definition/diagnostics en fixtures DataWindow seguros y revalidar budgets del fast context.

---


## PB-SEMANTIC-P1-SQL-TRANSACTION-ANCHORS-01 — Mejorar anchors SQL y binding transaccional sin abrir un parser SQL de hot path

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 21.
- **Confianza:** Medium.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 3, 8, 10, 14, 15 y 16.
- **Evidencia:** El runtime delimita regiones SQL y proyecta transaction targets a nivel de archivo, pero no valida host variables ni statement-level binding, y el binding DataWindow aún es rígido con descendants de `Transaction`.
- **Ejemplo PowerBuilder:**

```powerscript
DECLARE cur_orders CURSOR FOR
SELECT order_id INTO :ll_order_id FROM orders;

n_tr_desc inv_tr
dw_1.SetTransObject(inv_tr)
```

- **Fuente:** `src/server/parsing/sqlRegions.ts`, `src/server/features/embeddedSqlAnchors.ts`, `src/server/features/diagnostics.ts`, `src/server/features/currentObjectContext.ts`, OrderEntry/PFC corpora, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.
- **Riesgo:** Alto. El plugin puede atribuir mal la transacción activa, degradar mal SQL embebido y dejar fuera descendientes reales de `Transaction`.
- **Objetivo:** endurecer el slice de SQL embebido y binding transaccional que ya existe, sin introducir un parser SQL profundo en el editor.
- **Pendiente exacto:**
  - mejorar `transactionTarget` a nivel de statement o binding defendible;
  - cubrir descendientes de `Transaction` en binding semántico;
  - formalizar qué subset de SQL embebido está realmente anclado.
- **Impacto hot path:** Sí, indirecto. Debe reutilizar anchors y facts por documento; prohibido abrir parseo SQL profundo por request.
- **Depends on:** `PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01`; coordinar con `PB-ARCH-P2-SQL-ANCHORS-SUBMODEL-01`.
- **Acceptance criteria:**
  - el binding transaccional acepta descendientes reales de `Transaction` cuando la evidencia de tipo es suficiente;
  - los anchors SQL distinguen mejor el target transaccional por statement o por binding defendible;
  - la documentación owner deja claro qué subset de SQL embebido está soportado.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-status.md`, `docs/testing.md`.
- **Tests:** `test/server/unit/sqlRegions.test.ts`, `test/server/unit/diagnostics.test.ts`, `test/server/unit/currentObjectContext.test.ts`, corpus OrderEntry/PFC.
- **Validación:** revalidar anchors y bindings sobre ejemplos de corpus real y comprobar que no aparecen regressions en diagnostics ni explainability.

---


## PB-SEMANTIC-P2-DYNAMIC-SQL-PROCEDURES-01 — Registrar alcance real de host variables, dynamic SQL 2-4 y SQL de stored procedures

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 23.
- **Confianza:** Needs official confirmation.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 8, 10, 13, 15 y 16.
- **Evidencia:** `dynamicStringReferences` detecta `EXECUTE IMMEDIATE`, `PREPARE` y algunos patrones, pero no existe un carril semántico equivalente para host variables, indicator variables, `DESCRIBE`, `OPEN DYNAMIC`, `EXECUTE DYNAMIC` ni `DECLARE PROCEDURE` con cobertura estructural real.
- **Ejemplo PowerBuilder:**

```powerscript
PREPARE SQLSA FROM :ls_sql
DECLARE dyn_cur DYNAMIC CURSOR FOR SQLSA
EXECUTE IMMEDIATE :ls_stmt
DECLARE proc_order PROCEDURE FOR sp_order
```

- **Fuente:** `src/server/features/dynamicStringReferences.ts`, `src/server/parsing/sqlRegions.ts`, corpus OrderEntry y legacy dump, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, documentación oficial pendiente de ampliación en este frente.
- **Riesgo:** Medio-alto. La guía puede sobredescribir soporte SQL avanzado que hoy solo existe como boundary o strings heurísticos.
- **Objetivo:** dejar trazado y testeable el alcance real de dynamic SQL avanzado y stored procedure SQL, con soporte solo cuando haya evidencia defendible y degradación cuando no.
- **Pendiente exacto:**
  - validar oficialmente el alcance mínimo viable;
  - decidir si host variables e indicator variables entran en validación semántica o quedan como boundary documentado;
  - fijar la matriz `Implemented / Heuristic only / Needs official confirmation` por constructo.
- **Impacto hot path:** Sí, indirecto. Toda ampliación debe ser index-time o report-only, nunca parser SQL profundo en request interactiva.
- **Depends on:** `PB-SEMANTIC-P1-SQL-TRANSACTION-ANCHORS-01` para el slice SQL básico.
- **Acceptance criteria:**
  - existe una matriz honesta de soporte para host vars, indicator vars, dynamic SQL 2-4 y stored procedure SQL;
  - lo no soportado degrada y no se presenta como semántica fuerte;
  - cualquier soporte nuevo tiene evidencia oficial o corpus de validación explícita.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/backlog.md`, `docs/testing.md`.
- **Tests:** nuevos unit tests solo para el subset confirmado, corpus legacy/OrderEntry, `docs:drift` para support matrix.
- **Validación:** comparar support matrix documental con el subset realmente cubierto por tests y no prometer más de lo que el runtime ejecuta.

---


## PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01 — Formalizar metadata mínima defendible para interop nativo y PBX/PBNI

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 24.
- **Confianza:** Needs official confirmation.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 3, 9, 10, 15 y 16.
- **Evidencia:** El parser/classifier distingue `external`, `RPCFUNC`, `pbx` y `dll`, pero sigue siendo superficial respecto a `REF`, `longptr`, bitness, marshaling, `PBX_GetDescription` y metadatos PBNI. El producto es prudente, pero varias surfaces documentan más de lo que implementan.
- **Ejemplo PowerBuilder:**

```powerscript
FUNCTION long MessageBoxW (ref string as_text) LIBRARY "user32.dll" ALIAS FOR "MessageBoxW"
```

- **Fuente:** `src/server/parsing/externalFunctions.ts`, `src/server/analysis/documentAnalysis.ts`, `src/server/features/diagnostics.ts`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, PFC/STD corpora nativos.
- **Riesgo:** Medio-alto. La clasificación actual puede ser suficiente para reporting, pero no para semántica “segura” de interop ni para claims más profundos en docs.
- **Objetivo:** fijar una metadata mínima defendible para interop nativo, dejando explícitos los límites de no soporte profundo para ABI, bitness y PBNI metadata.
- **Pendiente exacto:**
  - separar lo que es clasificación de lo que es semántica fuerte;
  - decidir cómo reflejar `REF`, `longptr` y bitness en reportes y diagnostics;
  - dejar `PBX_GetDescription` e interfaces PBNI como `Needs official confirmation` hasta tener evidencia fuerte.
- **Impacto hot path:** No directo. Debe vivir en reporting, checks y docs; no en providers interactivos pesados.
- **Depends on:** Nada; recomendado coordinar con `PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01`.
- **Acceptance criteria:**
  - el runtime distingue claramente metadata nativa mínima frente a no soporte profundo;
  - las surfaces read-only no prometen más de lo que el parser y classifier realmente conocen;
  - la documentación owner deja explícitos límites y riesgos.
- **Docs:** `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/architecture-status.md`, `docs/testing.md`, `docs/troubleshooting.md` si se exponen síntomas concretos.
- **Tests:** `test/server/unit/externalFunctions.test.ts`, `test/server/unit/diagnostics.test.ts`, `test/server/unit/powerBuilderTechnicalDebtReport.test.ts`, `test/server/unit/workspaceCheckReport.test.ts`.
- **Validación:** revisar que external/RPCFUNC/PBX/PBNI aparecen con el nivel de detalle realmente soportado y sin claims implícitos de ABI completo.

---


## PB-SEMANTIC-P2-BUILD-SOURCE-METADATA-01 — Separar artefactos build-only y source model semántico, incluyendo PBD y .pblmeta

- **Estado:** Open.
- **Prioridad:** P2.
- **Orden recomendado:** 26.
- **Confianza:** Medium.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 9, 10, 15 y 16.
- **Evidencia:** El repo distingue bien `.pbl` binaria y source origins, pero `PBD` sigue fuera del artifact kind semántico, `.pblmeta` tiene parser mínimo sin integración fuerte, y la documentación mezcla a veces policy de build con source model activo.
- **Ejemplo PowerBuilder:** ejemplo de source exportado afectado por el boundary build/source:

```powerscript
forward
global type n_cst_service from nonvisualobject
end type
```

Ese source exportado debe seguir siendo fuente real, mientras `PBD`, `ORCA staging` y `.pblmeta` se tratan como metadata o artefacto derivado según corresponda.
- **Fuente:** `src/shared/powerbuilderFiles.ts`, `src/shared/sourceOrigin.ts`, `src/server/workspace/pblmeta.ts`, `src/server/build/orcaStagingExport.ts`, `src/server/build/orcaStagingImport.ts`, `src/client/build/orcaDetection.ts`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`.
- **Riesgo:** Medio. Usuarios y agentes pueden confundir artefacto compilado, metadata de build y fuente real, reabriendo round-trip unsafe o claims falsos de soporte semántico.
- **Objetivo:** fijar un contrato claro de artefactos build-only frente a fuente semántica editable, incluyendo `PBD`, `.pblmeta` y staging ORCA.
- **Pendiente exacto:**
  - definir la representación visible de `PBD` como build-only;
  - decidir si `.pblmeta` se integra de verdad o se mantiene como parser experimental;
  - alinear reporting y docs con el source model real y sus prioridades de `sourceOrigin`.
- **Impacto hot path:** No. Debe quedarse en discovery, reports, build lanes y docs.
- **Depends on:** Nada.
- **Acceptance criteria:**
  - `sourceOrigin` y artifact kinds distinguen claramente fuente real, staging y artefacto compilado;
  - las docs owner dejan claro qué queda fuera del serving semántico;
  - `.pblmeta` tiene status explícito como integrado o experimental.
- **Docs:** `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/testing.md`.
- **Tests:** `test/server/unit/sourceOrigin.test.ts`, `test/server/unit/pblmeta.test.ts`, ORCA staging tests existentes, `docs:drift`.
- **Validación:** revisar sourceOrigin, ORCA staging y metadata build/source sin reintroducir serving sobre artefactos no fuente.

---


## PB-RUNTIME-P1-READONLY-SURFACES-GATES-01 — Asignar owners, tests y budgets a surfaces read-only y runtime self-test

- **Estado:** Open.
- **Prioridad:** P1.
- **Orden recomendado:** 13.
- **Confianza:** High.
- **Origen:** Ultra auditoría semántica PowerBuilder, FASES 11, 12, 14, 15 y 16.
- **Evidencia:** Current Object Context, Diagnostics Explainability, Object Explorer, health dashboard, workspace/object check y AI bundle ya existen, pero su ownership documental, sus gates de testing y sus budgets de performance siguen incompletos o dispersos.
- **Ejemplo PowerBuilder:**

```powerscript
dw_parent.DataObject = "d_orders"
dw_parent.Retrieve()
```

El mismo contexto semántico debe llegar de forma coherente a hover, diagnostics explainability, current object context y reportes read-only.
- **Fuente:** `src/shared/publicApi.ts`, `src/client/extension.ts`, `src/client/objectExplorerModel.ts`, `src/client/currentObjectContextPanelModel.ts`, `src/client/diagnosticsExplainabilityPanelModel.ts`, `src/client/runtimeSelfTest.ts`, `docs/testing.md`, `docs/performance-budget.md`.
- **Riesgo:** Alto. Las surfaces read-only pueden parecer sanas mientras consumen solo estado derivado, sin oracles ni budgets suficientes.
- **Objetivo:** asignar owners, matrices de prueba y budgets explícitos a las surfaces read-only y al runtime self-test que ya forman parte del producto.
- **Pendiente exacto:**
  - extender la matriz de testing a las surfaces publicadas por la API pública y los paneles read-only;
  - fijar budgets para esas surfaces en `docs/performance-budget.md`;
  - ampliar runtime self-test con probes funcionales donde hoy solo hay builders o estado derivado.
- **Impacto hot path:** No directo en tipeo, pero sí en activación, reportes on-demand y runtime self-test. Debe usar caps, background y gating explícito.
- **Depends on:** `PB-SEMANTIC-P1-CONFIDENCE-CONTRACT-01` para las surfaces que publiquen confidence y riesgo.
- **Acceptance criteria:**
  - cada surface read-only visible tiene owner documental, suites mínimas y budget explícito si corresponde;
  - runtime self-test cubre probes funcionales adicionales cuando la surface lo requiera;
  - docs de testing, troubleshooting y performance reflejan la superficie real del producto.
- **Docs:** `docs/testing.md`, `docs/troubleshooting.md`, `docs/performance-budget.md`, `docs/architecture-status.md`, `docs/current-focus.md` si pasa a foco activo.
- **Tests:** `test/server/unit/publicApi.test.ts`, `test/server/unit/currentObjectContextPanelModel.test.ts`, `test/server/unit/diagnosticsExplainabilityPanelModel.test.ts`, `test/server/unit/objectExplorerModel.test.ts`, `test/server/unit/runtimeSelfTest.test.ts`, `test/server/unit/docsDriftAudit.test.ts`, `test/server/unit/testingMatrixDocs.test.ts`, smoke ligera sobre views/read-only commands.
- **Validación:** ejecutar docs drift, revisar public API/read-only reports y confirmar que self-test y budgets cubren las surfaces ya publicadas.

---


## PB-ARCH-P0-SEMANTIC-DESIGN-TARGET-01 — Congelar contrato objetivo y ownership documental

- **Estado:** Partial.
- **Prioridad:** P0.
- **Orden recomendado:** 02.
- **Origen:** Plan maestro de diseño semántico.
- **Problema:** el diseño objetivo nuevo vive en documentos de auditoría y todavía no está enlazado como contrato operativo desde los owner docs.
- **Objetivo:** fijar `docs/semantic-design-target.md` como owner del target futuro y declarar su relación con architecture/status/map/backlog.
- **Fuente de verdad afectada:** documentación de arquitectura y estado.
- **Consumers afectados:** agentes, maintainers, reviewers y backlog planning.
- **Caches afectadas:** ninguna runtime.
- **Riesgo actual:** alto; la auditoría puede quedar como informe aislado y no como dirección ejecutable.
- **Diseño objetivo:** target futuro, estado real y backlog viven separados y enlazados, con un solo owner por fact.
- **Plan incremental:** cerrar FASE 12, actualizar owner docs en FASE 11, añadir checks de drift si aplica.
- **Notas de performance:** no debe introducir runtime; protege la meta de discovery/indexing rápido desde docs.
- **Escala 5000+ archivos:** aplica como criterio documental obligatorio.
- **Pendiente exacto:**
  - validar que `docs/semantic-design-target.md` está enlazado desde todos los owner docs;
  - ejecutar `npm run test:docs:drift`;
  - ejecutar `npm run test:architecture:rapid`;
  - actualizar `docs/done-log.md` si se decide cerrar formalmente.
- **Acceptance criteria:** el target está enlazado desde docs owner; status distingue estado real vs futuro; no hay claims duplicados.
- **Docs:** `docs/semantic-design-target.md`, `docs/architecture.md`, `docs/architecture-status.md`, `docs/architecture-implementation-map.md`, `docs/current-focus.md`.
- **Tests:** `npm run test:docs:drift`, `npm run test:architecture:rapid`.
- **Validación:** revisión de enlaces/owners y `get_errors` sobre docs tocados.

																							

				   
					
												 
																																									  
																														
																																	
																														 
																												 
																																  
																														
																											 
																														
																					
																																								
																									 
																														  
																														 
 



---

# 5. Ownership note

Este backlog sólo mantiene trabajo accionable: estado, prioridad, evidencia, dependencias, docs afectadas, tests y validación.

- El foco activo vive en `docs/current-focus.md`.
- Las prioridades macro y el orden por fases viven en `docs/roadmap.md`.
- El histórico de cierres vive en `docs/done-log.md`.
- El diseño objetivo vive en `docs/semantic-design-target.md`.
- El razonamiento/supuestos vive en `docs/semantic-design-assumptions.md`.
- El orden recomendado de ejecución vive en este backlog y puede reflejarse resumido en `docs/roadmap.md`.
- Los criterios operativos de auditoría viven en el prompt/flujo de auditoría y en la validación ejecutable, no en este backlog.

---

# 6. Validación tras aplicar este backlog

Ejecutar:

```bash
npm run test:docs:drift
npm run test:architecture:rapid
```

Si el repo tiene tests específicos de docs/backlog:

```bash
npm run test:architecture:metrics
```

Validar manualmente:

```txt
- No hay IDs duplicados con estados contradictorios.
- No hay PB-SEMANTIC ejecutable antes de su PB-ARCH padre si el padre define contrato abierto.
- PB-ARCH-P0-SEMANTIC-DESIGN-TARGET-01 queda Partial o Done según validación real.
- CATALOG-MANUAL-EN-MIGRATION queda Partial con pendiente de validación o Done con done-log.
- CATALOG-GENERATOR-SCHEMA-DRIFT-01 queda antes de nuevas ampliaciones de overlays si afecta parámetros del catálogo.
```
\n## 31. PB-PERF-P1-DATAWINDOW-REGEX-SCAN-01\n- Completado: 2026-05-07\n- Optimizó el escaneo de propiedades DataWindow cambiando comprobación carácter a carácter por regex pre-filtrado.\n\n## 34. PB-PERF-P2-CATALOG-DICTIONARIES-01\n- Completado: 2026-05-07\n- Memoización de findApplicableMembersForOwnerType y findApplicableEventsForOwnerType en SystemCatalog, logrando O(1).\n\n## 33. PB-PERF-P2-LAZY-DIAGNOSTICS-01\n- Completado: 2026-05-07\n- Diagnósticos semánticos bloqueantes aplazados; Errores sintácticos se publican de inmediato.\n\n## 35. PB-PERF-P2-REACTIVE-EXPLORER-01\n- Completado: 2026-05-07\n- Explorador y Paneles reaccionan exclusivamente a notificaciones de mutación del servidor (Server-Push).\n\n## 32. PB-PERF-P2-REGEX-MEMOIZATION-01\n- Completado: 2026-05-08\n- RegexMemoizer implementado atado al SemanticDocumentSnapshot para O(1) en Semantic Tokens y Diagnósticos.\n\n## 36. PB-PERF-P2-OPTIMISTIC-SNAPSHOTS-01\n- Completado: 2026-05-08\n- Implementado Stale-While-Revalidate en hoverHandlers.ts y completionHandlers.ts a través del InteractiveServingPipeline.\n\n## 37. PB-PERF-P2-SEMANTIC-TOKENS-DELTA-01\n- Completado: 2026-05-08\n- Implementado semanticTokens/full/delta usando SemanticTokensBuilder per-URI en featureHandlers.ts.\n