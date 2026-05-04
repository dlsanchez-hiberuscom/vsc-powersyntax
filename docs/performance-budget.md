# Performance Budget — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Definir los límites y objetivos de rendimiento del plugin para proteger la experiencia del usuario a medida que el producto crece.

Este documento no es una lista de optimizaciones aisladas.  
Es una **restricción de diseño** que condiciona arquitectura, backlog, validación y evolución del motor.

---

## 2. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Todo presupuesto de rendimiento debe apoyar simultáneamente:

1. descubrimiento rápido,
2. indexación progresiva no bloqueante,
3. prioridad real al archivo activo,
4. latencia interactiva baja,
5. persistencia útil entre sesiones,
6. observabilidad del motor,
7. y degradación segura cuando no haya contexto suficiente.

---

## 3. Principios no negociables

### 3.1 El archivo activo tiene presupuesto privilegiado
La experiencia del documento activo está por encima del trabajo global del workspace.

### 3.2 El trabajo global no puede bloquear la interacción
La indexación, el enriquecimiento y el background nunca deben degradar perceptiblemente hover, completion, definition o edición.

### 3.3 Toda tarea costosa debe ceder
Toda operación costosa debe diseñarse con:
- yielding,
- cancelación,
- preempción,
- o reprogramación.

### 3.4 Medir antes de asumir
No se considera mejora ni regresión sin evidencia suficiente.

### 3.5 Degradar con seguridad
Si el sistema no dispone aún de contexto suficiente, puede degradar profundidad o cobertura, pero no debe devolver resultados engañosos.

### 3.6 Warm debe ser claramente mejor que cold
La persistencia y la caché deben traducirse en mejoras visibles al reabrir workspaces y repetir consultas.

---

## 4. Rutas de rendimiento que deben protegerse

### 4.1 Interactive path
Incluye:
- hover,
- completion,
- definition,
- signature help,
- diagnostics del archivo activo,
- document symbols del archivo abierto.

**Regla:** esta ruta tiene máxima prioridad.

### 4.2 Discovery / indexing path
Incluye:
- discovery del workspace,
- parseo estructural,
- indexación progresiva,
- enriquecimiento semántico,
- background indexing.

**Regla:** debe ser progresiva, cancelable y no bloqueante.

### 4.3 Warm / resume path
Incluye:
- reapertura del workspace,
- recuperación de checkpoints,
- reuse de caché persistente,
- serving acelerado sobre conocimiento ya materializado.

**Regla:** debe mejorar claramente frente al arranque en frío.

### 4.4 Massive change path
Incluye:
- git pull,
- cambio de rama,
- cambios masivos de archivos,
- invalidaciones amplias,
- reescaneo por watcher.

**Regla:** debe absorber ráfagas sin tormentas de trabajo ni degradación caótica.

---

## 5. Presupuestos no negociables

Estos presupuestos son de **comportamiento**, no de milisegundos exactos.

### 5.1 Nunca bloquear el editor
El editor no debe congelarse por trabajo del plugin.

### 5.2 El background no roba latencia al foreground
Las tareas globales nunca deben impedir responder con prioridad al usuario.

### 5.3 Toda operación costosa debe ser interrumpible
Toda tarea larga debe poder:
- cancelarse,
- pausarse,
- o ceder.

### 5.4 Toda tarea larga debe ser observable
Si una operación supera un umbral razonable, debe exponer progreso, estado o readiness útil.

### 5.5 Ninguna mejora visible puede apoyarse en recomputación innecesaria
El sistema debe tender a:
- invalidación fina,
- reuso de snapshots,
- query cache segura,
- persistencia útil,
- y serving incremental.

### 5.6 Protecciones ya materializadas en el runtime
Hoy el runtime ya dispone de:
- budgets dinámicos en el indexador,
- yielding cooperativo,
- cancelación/preempción del background gobernada por `backpressurePolicy`, preservando `build/legacy-orca` una vez arrancan y manteniendo cancelables `background-indexing`, `export-reporting`, `maintenance` y `ai-tooling`,
- admisión unificada de workloads `background-indexing`, `export-reporting`, `build`, `legacy-orca` y `maintenance` detrás del mismo scheduler + latency governor, con yielding previo para reports read-only y observabilidad explícita de `throttledBackgroundWorkload/reason`,
- backpressure del watcher,
- refresco incremental de routing/provenance para markers de topología y altas calientes de SR* sin rediscovery completo,
- diff snapshot-aware con dependencias `DataObject`/`report`/`dddw` y contrato retrieve de `.srd`, de modo que el fan-out incremental alcance solo a los consumidores necesarios sin abrir otro motor de invalidación,
- policy v2 `queryScopePolicy` por consumer semántico, con `maxScope`, `budgetMs`, `resultCap`, readiness/confidence/fallback y allowances `staging/generated/external` servidos desde un registro único,
- pool acotado de fuentes para `references`/`rename`/CodeLens con reuso de `maskedText` ya indexado, sin widening a `workspace` cuando la policy del consumer queda en `project` y sin materializar `orca-staging/generated` salvo allowance explícito,
- mutaciones `upsert/remove` de `KnowledgeBase` con copy-on-write por bucket y consultas/conteos acotados por `kind` para serving y manifest, evitando clonar o recorrer toda la base cuando el hot path ya conoce el subconjunto necesario,
- guard estructural local/CI sobre hot path para impedir `document.getText().split(...)`, `JSON.stringify`, `getAllEntities`/`exportDocumentRecords`, clonación global del catálogo de sistema y renormalización redundante del workspace en `queryContext`, `completion`, `diagnostics` y `referenceSourcePool`,
- caché CodeLens LRU acotada y visible en stats/health,
- el LRU de CodeLens vive ahora en un módulo server-side puro (`features/codeLensResultCache`) con tests propios de límite, hits/misses, evictions e invalidación; `server.ts` ya dejó de registrar directamente lifecycle/document/features/commands y conserva bootstrap + runtime orchestration, mientras el wiring movedizo vive en `handlers/lifecycleHandlers`, `handlers/documentHandlers`, `handlers/featureHandlers`, `handlers/buildCommandHandlers`, `handlers/reportCommandHandlers` y `handlers/runtimeCommandHandlers`,
- reporte unificado de memory budgets por capa con estimates soft y estado agregado visible en stats/health/status,
- degradación adaptativa por presión de memoria que purga serving cache, pausa nuevas escrituras en esa caché, aplaza `background-indexing/maintenance/ai-tooling` y acota payloads de reports read-only pesados sin apagar `hover`/`completion`/`near-context`,
- persistencia dañada o malformada que cae a `rebuild` limpio sin exponer estado semántico medio ni bloquear el carril interactivo,
- cierre de documento sin borrar conocimiento semántico publicado mientras el archivo siga siendo fuente del workspace,
- y progreso/readiness/modo degradado observables.

Cualquier cambio que relaje estas protecciones debe validar como mínimo `npm test` y, cuando toque latencia o presión sostenida, también `npm run test:performance`.

La auditoría 2026-05-03 no cambia budgets numéricos; para descomposiciones mayores de `extension.ts` o `server.ts`, el cierre debe revalidar activación, smoke real y PFC/STD mediante `npm run test:architecture:rapid`.

Estado operativo tras `B346`: el wiring de comandos cliente ya vive en `src/client/commandRegistration.ts` y `Object Explorer`/`Current Object Context`/`Diagnostics Explainability` quedan bajo demanda; no se deben reintroducir `createTreeView(...)` eager ni materialización anticipada de API/UX read-only dentro de `activate()`.

---

## 6. Objetivos calibrados actuales

Estos valores ya quedan calibrados sobre **PFC 2025 Workspace/Solution**, un **legacy PBL dump** real y el corpus enterprise local **STD_FC_OrderEntry** en host de pruebas compartido, con smoke semántica adicional sobre objetos representativos y ruido no fuente.
No son promesas absolutas por máquina, pero sí budgets ejecutables y trazables.

### 6.1 Activación y disponibilidad inicial
- activación efectiva del cliente/servidor: assert duro `< 2000ms` en `vscode-test` y warning operativo por encima de `500ms`;
- primer `Document Symbols` en archivo pequeño: `< 50ms`;
- primer `Hover` sobre archivo activo real: `< 50ms`;
- primera evaluación de diagnósticos estructurales sobre archivo activo real: `< 100ms`.

### 6.2 Archivo activo
Objetivo general:
- archivos pequeños: respuesta **muy rápida**
- archivos medianos: respuesta **fluida**
- archivos grandes legacy: respuesta **útil y estable**, aunque no instantánea

### 6.3 Workspace
Objetivo general:
- discovery inicial sobre PFC: `< 2000ms`;
- indexación cold sobre PFC: `< 15000ms`;
- indexación warm sobre PFC: `< 1000ms` y claramente mejor que cold;
- memoria: **controlada y estable**

### 6.4 Calibración corpus-driven de confidence

La revisión actual de thresholds por feature queda cerrada por `B283` con baseline ejecutable sobre **PFC Solution**, **STD_FC_OrderEntry** y el **legacy PBL dump**:
- `test/server/performance/confidenceCalibration.smoke.test.ts` congela escenarios reales `low`, `medium` y `high` y exige `0 false positives / 0 false negatives` al comparar la policy declarativa con el comportamiento observado de `hover`, `completion`, `definition`, `references`, `rename` y `signature-help`;
- mientras ese baseline siga verde, los thresholds actuales se consideran calibrados y no deben ajustarse por intuición local o incidentes aislados;
- cualquier cambio futuro de thresholds o de inferencia de confidence debe revalidar esta smoke corpus-driven además de la golden matrix semántica.

### 6.5 Validación corpus-driven de catálogo por dominio

La revisión actual del consumo/cobertura catalog-driven sobre corpora reales queda cerrada por `B336` con baseline ejecutable sobre **PFC Solution**, **STD_FC_OrderEntry** y el **legacy PBL dump**:
- `test/server/performance/catalogCorpusValidation.smoke.test.ts` congela cinco probes reales sobre `system-globals`, `global-functions` y `datawindow-functions`, y exige `0 misses / 0 ambigüedades / 0 budget violations` al revisar la ruta warm de `hover`, `completion` y `diagnostics`;
- la smoke calienta una pasada no medida por probe para aislar la latencia servida del cold parse inicial, que ya sigue cubierto por `active-file.perf.test.ts` y el baseline general de archivo activo;
- el cierre de `B363` añade consumers catalog-driven ligeros para enums: `signatureHelp` y `diagnostics` comparten `enumeratedContext.ts` sobre indices ya materializados del catálogo, y `semanticTokens` solo verifica tokens con sufijo `!` contra `SystemCatalog` sin scans globales por documento o por dominio;
- `B329` amplía ese carril con un fast path catalog-driven para `keywords`, `reserved-words`, `datatypes`, `system-globals`, `pronouns` y `global-functions` cuando no hay qualifier: la clasificación sigue apoyándose en resolutores directos de `SystemCatalog`, evita scans completos o clones de catálogo por token y mantiene verde `test/server/unit/hotPathAllocationBudget.test.ts`;
- `B372` añade el siguiente guardrail de serving localizado sin reabrir el hot path: `documentationService.ts` resuelve textos por `entry.id` sobre el índice memoizado de `localization/`, cae a inglés original cuando falta overlay, reutiliza arrays existentes para `usageNotes` y cachea documentación de parámetros por entry/overlay en vez de recorrer todos los overlays o clonar entries por locale;
- `B373` mantiene ese guardrail ya en producto visible: hover/completion/signatureHelp solo leen locale efectiva y texto servido, `featureHandlers.ts` mete la locale en la `ServingCache` key para no mezclar resultados entre idiomas y `documentationService.ts` añade alias memoizados manual/generated más fallback O(1) por nombre de parámetro único cuando el `signatureLabel` visible difiere del overlay, sin abrir scans por item ni reordenar la selección semántica del consumer;
- `test/server/performance/enumCatalogCorpusValidation.smoke.test.ts` fija `B364`: tras indexar PFC Solution, STD_FC_OrderEntry y legacy PBL dump, el scan corpus-driven de valores con `!` completa en aproximadamente `3.35s` sobre PFC, `5.47s` sobre OrderEntry y `0.14s` sobre legacy, reporta `13068` ocurrencias (`1554` catalogadas, `5296` unknown, `6214` false positives, `4` out-of-context, `0` candidates) y deja esas familias para `B368/B370` sin meter el corpus en el hot path interactivo ni convertirlo en autoridad de catálogo;
- cualquier cambio futuro de catálogo o de sus consumers reales debe revalidar esta smoke corpus-driven junto con `catalogV2.test.ts`, `completion.test.ts`, `hover.test.ts`, `semanticTokens.test.ts`, `signatureHelp.test.ts` y `diagnostics.test.ts` antes de tocar claims de cobertura.

---

## 7. Presupuestos por categoría

### 7.1 Activación
Se vigila:
- coste añadido al arranque,
- tiempo hasta cliente/servidor disponibles,
- tiempo hasta primera capacidad útil en archivo activo.

### 7.2 Serving interactivo
Se vigila:
- hover,
- completion,
- definition,
- signature help,
- document symbols,
- respuesta de diagnostics del archivo activo.

### 7.3 Indexación
Se vigila:
- discovery,
- parseo,
- enriquecimiento,
- progreso por fases,
- fairness del background,
- tiempo hasta “active-context-ready”.

### 7.4 Persistencia
Se vigila:
- tiempo de reapertura,
- tiempo de resume,
- mejora warm vs cold,
- tasa de reutilización útil,
- coste de invalidación tras reapertura,
- bytes persistidos por workspace y journal,
- deriva de `workspaceKey` obsoletos,
- y que la compactación/limpieza ocurra fuera del hot path o bajo comando explícito.

### 7.5 Memoria
Se vigila:
- memoria base del servidor,
- memoria por documento caliente,
- crecimiento del índice,
- picos durante indexación,
- densidad de caché,
- activación de la policy adaptativa de presión (`serving cache relief`, deferrals y caps de reports).

---

## 8. Métricas mínimas obligatorias

Toda evolución relevante del motor debe poder medir, como mínimo:

- tiempo hasta primer `Document Symbols`,
- tiempo hasta primer `Hover`,
- tiempo hasta primera publicación de diagnósticos,
- tiempo de análisis de documento por tamaño,
- tiempo de discovery,
- tiempo de cold indexing,
- tiempo de warm indexing,
- memoria base del servidor,
- pico de memoria durante indexación,
- hit ratio de caché de serving,
- hit ratio de caché persistente,
- fan-out de invalidación,
- y tiempo hasta `active-context-ready`.

---

## 9. Política de regresión

Se considera regresión relevante cualquiera de estos casos:

- aumento claro de latencia en una ruta crítica,
- aumento sostenido de memoria sin beneficio proporcional,
- pérdida de cancelación o yielding,
- bloqueo visible del editor,
- warm path que deje de mejorar claramente al cold path,
- o degradación de precisión causada por presión sin contrato explícito de degradación.

Ante una regresión:

1. medir antes/después,
2. documentar el cambio,
3. identificar la causa,
4. decidir si se revierte, se mitiga o se acepta,
5. y dejar rastro en la spec o documento técnico correspondiente.

### 9.1 Gate ejecutable actual

El gate ejecutable actual del presupuesto es `npm run test:performance:gate`.

El soak local opt-in actual es `npm run test:performance:soak`; genera `artifacts/performance/session-stability-soak.json` y `artifacts/performance/session-stability-soak.md` para dejar evidencia de estabilidad prolongada sin meter ese coste en CI por defecto.

El guard local/CI actual contra allocations accidentales en hot path es `test/server/unit/hotPathAllocationBudget.test.ts`; queda revalidado junto con `queryContext/completion/diagnostics/referenceSourcePool/references/definition/rename` para bloquear patrones estructurales antes de que se conviertan en regresión de latencia.

Hoy ese carril debe:

- ejecutar budgets deterministas sobre el corpus publico `fixtures-local/public/legacy-pbl-dump` para hover, diagnostics y batch analysis del archivo activo;
- incluir la suite `performance/large-workspace-incremental` para rafagas moderadas y masivas sobre workspaces sinteticos grandes;
- seguir verde junto con la proof suite `semanticDiff + watchedFileIntake` que fija el fan-out incremental de `B265` para cambios cosméticos, implementation/prototype/ancestor, `.srd`/`DataObject`, markers, `sourceOrigin`, ORCA staging y external functions;
- seguir verde junto con la suite `queryScopePolicy + referenceSourcePool + featureReadiness + references/rename/CodeLens + completion/signatureHelp/currentObjectContext/impactAnalysis`, que fija la policy v2 de `B266`, los caps por consumer y la no materialización global fuera del contract;
- seguir verde junto con la suite `backpressurePolicy + scheduler + diagnosticScheduler + runtimeHealth + statusBarPresentation`, y con la batería read-only/build/legacy reencolada (`currentObjectContext`, `impactAnalysis`, `safeEditPlan`, `safeBatchRefactorPlan`, `semanticWorkspaceManifest`, `crossProjectSymbolConflicts`, `workspaceMigrationAssistant`, `powerBuilderCodeMetrics`, `powerBuilderTechnicalDebtReport`, `pbAutoBuildRunner`, `orcaRunner`, `specDrivenPblUpdate`, `specDrivenPblUpdateBatch`), que fija la policy runtime v2 de `B267` sobre el scheduler común;
- serializar evidencia en `artifacts/performance/performance-budget-gate.json`;
- y quedar reutilizable tanto en CI como en el release lane (`npm run release:verify`).

---

## 10. Estrategia de medición

### 10.1 Qué medir primero
Prioridad de medición:

1. activación efectiva,
2. primer valor en archivo activo,
3. analysis time por documento,
4. discovery/indexing,
5. warm vs cold,
6. memoria,
7. invalidación y fan-out,
8. hit ratio de caché.

### 10.2 Cómo medir
Métodos válidos:
- timers internos,
- `performance.now()`,
- tests automatizados,
- corpus reales,
- herramientas de profiling,
- snapshots de memoria,
- y validación manual guiada cuando proceda.

### 10.3 Cuándo medir
- al cerrar una spec sensible a rendimiento,
- al cerrar una fase,
- antes de release,
- cuando se sospeche regresión,
- y al introducir cambios de arquitectura en runtime, caché, scheduler o queries.

---

## 11. Estado actual del presupuesto

### 11.1 Ya exigible
Ya es exigible que:
- el editor no se bloquee,
- el archivo activo tenga prioridad,
- el background no robe latencia interactiva,
- el sistema exponga estado y progreso razonables,
- y toda tarea costosa tenga camino de yielding/cancelación.

### 11.2 Pendiente de calibración fuerte
Debe calibrarse mejor sobre corpus reales:
- calibración fina de estimates y thresholds de memory budgets sobre portfolios enterprise más amplios,
- query cache hit ratio,
- fan-out de invalidación,
- coste copy-on-write de mutaciones `KnowledgeBase` en workspaces grandes,
- calibración fina de budgets del formatter server-side sobre documentos sintéticos/enterprise grandes,
- y budgets en portfolios enterprise más amplios que el baseline actual de PFC + legacy + OrderEntry.

### 11.3 Baseline real actual

Mediciones registradas en `test/results/003-real-corpora-baseline.md`:

- discovery PFC Workspace (`831` archivos): `112.09ms`;
- batch `analyzeDocument + documentSymbols` sobre `25` archivos PFC: `121.38ms`;
- primer hover real en archivo activo PFC: `1.05ms`;
- primeros diagnostics estructurales en archivo activo PFC: `0.75ms`;
- indexación cold PFC (`21575` entidades): `13333.28ms`;
- indexación warm PFC: `0.59ms`;
- discovery OrderEntry (`744` archivos): `463.63ms`;
- indexación cold OrderEntry (`23872` entidades): `12873.54ms`;
- indexación warm OrderEntry: `0.75ms`.
- smoke semántica OrderEntry: `OK` sobre objetos representativos, solution-mode parcial y exclusión de `.srj`/`.pblmeta`/recursos no fuente.

---

## 12. Revisión del presupuesto

Este documento debe revisarse cuando:

- cambie el scheduler,
- cambie la estrategia de caché,
- se introduzca persistencia nueva,
- cambie el pipeline de parsing/knowledge,
- se cierre una fase relevante del roadmap,
- o se obtengan mediciones nuevas sobre PFC 2025, OrderEntry y corpus legacy representativos.

---

## 13. Relación con otros documentos

Este documento debe alinearse siempre con:

- `docs/constitution.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/current-focus.md`
- `docs/testing.md`
- y las specs que modifiquen comportamiento crítico de rendimiento

---

## 14. Regla final

El presupuesto de rendimiento no existe para “ganar benchmarks”.

Existe para asegurar que el plugin siga siendo:

- rápido,
- no bloqueante,
- estable,
- predecible,
- medible,
- y útil en proyectos reales grandes y legacy.