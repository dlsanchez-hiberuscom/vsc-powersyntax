# Backlog — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## META MAESTRA DEL PRODUCTO

**Meta no negociable:** el plugin debe **descubrir e indexar muy rápido sin bloquear**.

Esta meta manda sobre todo el backlog y condiciona todas las decisiones técnicas.

Eso implica que el producto debe perseguir simultáneamente:
1. **descubrimiento rápido del workspace/solution**;
2. **indexación progresiva y no bloqueante**;
3. **prioridad real al contexto activo**;
4. **latencia interactiva baja para hover/completion/definition**;
5. **persistencia y reanudación para evitar recomputado innecesario**;
6. **estado observable del motor** para que el usuario vea progreso real;
7. **base semántica fuerte**, pero sin sacrificar tiempo hasta valor.

Toda spec nueva debe respetar esta meta. Si una mejora aumenta complejidad pero no mejora velocidad percibida, estabilidad o utilidad profesional real, no debe priorizarse sobre el core.

---

## 1. Cómo debe usar este backlog una IA

- Ejecutar **por orden de prioridad global**.
- **No abrir un ítem si sus dependencias no están cerradas**, salvo trabajo preparatorio muy claro.
- Crear sub-specs solo cuando vaya a implementarse el ítem, con formato:
  - `S-<ID>-01`
  - `S-<ID>-02`
  - etc.
- No cerrar un ítem si falta:
  - código real,
  - tests o validación suficiente,
  - documentación alineada,
  - actualización del roadmap/current-focus si impacta la dirección.
- Si un ítem crece demasiado, dividirlo en sub-specs, **no en ítems padre duplicados**.
- Si se detecta deuda nueva, registrarla al final en **Backlog derivado**.
- No sacrificar la meta maestra de **descubrir e indexar muy rápido sin bloquear** por features secundarias.
- Tratar `plugin_old` como **fuente de guía, patrones, datasets y heurísticas probadas**, no como código a portar por inercia.
- Cuando exista una referencia útil a `plugin_old`, revisarla antes de diseñar desde cero la solución nueva.

---

## 2. Pilares del producto

### P1. Atomicidad
El motor no debe publicar estados semánticos a medias ni mezclar estructuras viejas y nuevas.

### P2. Incrementalidad fina
Cada cambio debe provocar **la recomputación mínima necesaria**.

### P3. Persistencia robusta
El conocimiento útil debe sobrevivir entre sesiones con seguridad, versionado y recuperación limpia.

### P4. Explicabilidad / Observabilidad
El sistema debe poder explicar:
- qué sabe,
- por qué lo sabe,
- qué le falta,
- qué está haciendo,
- y por qué una query devolvió ese resultado.

---

## 3. Orden maestro de prioridad

### L0 — Core platform no negociable
Primero:
- snapshot canónico,
- atomicidad,
- versionado semántico,
- diff semántico,
- dependencias inversas,
- invalidación,
- indexación en dos fases,
- preempción/yielding/progreso.

### L1 — Persistencia y modelo de workspace/proyecto
Después:
- checkpoints,
- caché persistente robusta,
- journaling transaccional,
- schema versioning,
- library graph / project model unificado.

### L2 — Query engine y serving profesional
Luego:
- query engine unificado,
- evidence,
- provenance,
- confidence gates,
- query cache,
- closures precalculados,
- references / rename / hierarchy / CodeLens seguras.

### L3 — Validación fuerte, salud interna y excelencia operativa
Después:
- corpus reales,
- budgets,
- golden tests,
- consistencia parser/symbol/LSP,
- repro packs,
- health checker,
- event log técnico,
- compactación de memoria.

### L4 — Especialización PowerBuilder y automatización
Solo después:
- DataWindow safe mode,
- build moderno,
- API pública madura,
- automatización externa,
- ORCA legacy.

---

## 4. Reglas estructurales del backlog

- Los ítems **abiertos** y **parciales** viven aquí.
- Los ítems **cerrados** y sprints históricos salen a `done-log.md`.
- Algunos ítems antiguos quedan **absorbidos** por otros nuevos:
  - **B135** queda absorbido por **B151**.
  - **B136** queda absorbido por **B157**.
  - **B137** queda absorbido por **B065**.
- **B141** sube al core porque ya no es “ecosistema”; afecta directamente a:
  - scheduler,
  - fairness,
  - caché persistente,
  - contexto de proyecto,
  - invalidación,
  - serving.

### 4.1 Primera ola 133-152 implementada y validada

Las primeras 20 prioridades abiertas del backlog ya no están solo preparadas: quedaron implementadas y validadas como primer corte operativo de este bloque.

Serie ya materializada sobre el foco actual:
- `Spec 133` → `B151` semantic snapshot canónico por documento.
- `Spec 134` → `B165` publicación atómica del Knowledge Base y de los índices.
- `Spec 135` → `B166` versionado semántico interno del workspace.
- `Spec 136` → `B170` semantic diff engine.
- `Spec 137` → `B153` índice de dependencias semánticas inversas.
- `Spec 138` → `B154` invalidation engine explícito.
- `Spec 139` → `B152` pipeline de indexación en dos fases reales.
- `Spec 140` → `B122` priorización por dependencias semánticas cercanas.
- `Spec 141` → `B123` presupuestos de trabajo y yielding cooperativo.
- `Spec 142` → `B124` cancelación y preempción real de tareas de fondo.
- `Spec 143` → `B169` watcher intake pipeline con backpressure real.
- `Spec 144` → `B125` indexación progresiva del workspace completo.
- `Spec 145` → `B126` superficie de estado del indexador.
- `Spec 146` → `B134` modelo de progreso y readiness del indexador.
- `Spec 147` → `B158` modo degradado formal.
- `Spec 148` → `B159` gobernador de latencia del servidor.

Serie ya materializada como base de topología y persistencia:
- `Spec 149` → `B141` library graph / project model unificado.
- `Spec 150` → `B155` checkpoints reales de indexación y resume robusto.
- `Spec 151` → `B167` journaling transaccional de caché persistente.
- `Spec 152` → `B168` cache schema versioning + migraciones.

Validación registrada del corte:
- `npm run compile`
- `npm run test:unit`
- `npm test`

---

# 5. Backlog activo reordenado

# L0 — Core platform no negociable

## B151 — Semantic snapshot canónico por documento
- **Estado:** Partial
- **Track:** atomicidad + incrementalidad
- **Depende de:** —
- **Desbloquea:** B152, B153, B154, B156, B160, B162
- **Legacy refs:** absorbe B135
- **Objetivo:** tener una unidad semántica estable por documento.
- **Debe contener:** fingerprint, container model, symbols, scopes, logical statements, masked text, control blocks, facts enriquecidos, readiness local.
- **Guía / referencia `plugin_old`:** `powerScriptDocumentModel.ts`, `mapPositionToStatementOffset`, `getStatementAtPositionFromModel`, estructuras de análisis documental y facts reutilizables.
- **Sub-specs iniciales:**
  - `S-B151-01 buildSemanticSnapshot`
  - `S-B151-02 snapshotIdentity`
  - `S-B151-03 snapshotMergeOrReplace`
- **Cierre:** todas las features core consumen snapshot en lugar de recomponer piezas dispersas.

## B165 — Publicación atómica del Knowledge Base y de los índices
- **Estado:** Partial
- **Track:** atomicidad
- **Depende de:** B151
- **Desbloquea:** B156, B160, B162, B176
- **Objetivo:** evitar estados semánticos “a medias”.
- **Guía / referencia `plugin_old`:** revisar si el legacy ya separaba construcción y exposición de índices/servicios; si no existe una pieza directa, tomar `KnowledgeBase`, `symbolIndex` y servicios de consulta como base conceptual para separar staging y publish.
- **Sub-specs iniciales:**
  - `S-B165-01 stagedSemanticState`
  - `S-B165-02 atomicPublishSwap`
  - `S-B165-03 rollbackOnInvalidPublish`
- **Cierre:** hover/completion/definition nunca ven mezcla de estado viejo + nuevo.

## B166 — Versionado semántico interno del workspace
- **Estado:** Partial
- **Track:** atomicidad + persistencia
- **Depende de:** B151, B165
- **Desbloquea:** B154, B155, B167, B168, B160
- **Objetivo:** introducir epochs/versiones semánticas internas del workspace.
- **Guía / referencia `plugin_old`:** revisar cualquier versionado implícito de caches/snapshots/registries del legacy para reaprovechar contratos o nomenclatura, aunque la implementación nueva sea distinta.
- **Sub-specs iniciales:**
  - `S-B166-01 workspaceSemanticEpoch`
  - `S-B166-02 queryEpochBinding`
  - `S-B166-03 staleEpochDetection`
- **Cierre:** cualquier resultado/caché puede invalidarse por versión semántica y no solo por archivo.

## B170 — Semantic diff engine
- **Estado:** Partial
- **Track:** incrementalidad fina
- **Depende de:** B151, B166
- **Desbloquea:** B153, B154, B160
- **Objetivo:** distinguir qué cambió semánticamente, no solo que “cambió el archivo”.
- **Guía / referencia `plugin_old`:** usar `powerScriptDocumentModel.ts`, `powerScriptStatementUtils.ts`, `powerScriptLexingUtils.ts` y cualquier lógica de facts estructurales del legacy como base para distinguir cambios inocuos de cambios con impacto semántico.
- **Sub-specs iniciales:**
  - `S-B170-01 classifyDocumentSemanticDiff`
  - `S-B170-02 diffImpactLevel`
  - `S-B170-03 noSemanticChangeFastPath`
- **Cierre:** la invalidación se apoya en diffs semánticos, no solo en `document changed`.

## B153 — Índice de dependencias semánticas inversas
- **Estado:** Partial
- **Track:** incrementalidad fina
- **Depende de:** B151, B170
- **Desbloquea:** B154, B155, B031, B032
- **Objetivo:** invalidar y recomputar solo lo afectado.
- **Guía / referencia `plugin_old`:** revisar `symbolIndex.ts`, `projectRegistry.ts`, `InheritanceGraph`, `owners/` y cualquier relación de dependencias ya modelada implícitamente en el legacy.
- **Sub-specs iniciales:**
  - `S-B153-01 extractSemanticDependencies`
  - `S-B153-02 reverseDependencyGraph`
  - `S-B153-03 impactedDocumentsResolver`
- **Cierre:** cambios en herencia/firma/visibilidad recalculan solo el conjunto impactado.

## B154 — Invalidation engine explícito
- **Estado:** Partial
- **Track:** incrementalidad fina
- **Depende de:** B153, B166, B170
- **Desbloquea:** B155, B169, B171
- **Objetivo:** centralizar toda la lógica de invalidación.
- **Guía / referencia `plugin_old`:** revisar invalidación histórica de `DocumentCache`, `KnowledgeBase`, registros de proyecto y services relacionados del legacy para identificar patrones útiles y anti-patrones a evitar.
- **Sub-specs iniciales:**
  - `S-B154-01 classifyChangeKind`
  - `S-B154-02 buildInvalidationPlan`
  - `S-B154-03 selectiveReindexPlan`
- **Cierre:** desaparece la invalidación dispersa por features.

## B152 — Pipeline de indexación en dos fases reales
- **Estado:** Partial
- **Track:** incrementalidad + UX
- **Depende de:** B151, B165
- **Desbloquea:** B158, B159, B156
- **Objetivo:** separar fase estructural rápida y fase semántica enriquecida.
- **Guía / referencia `plugin_old`:** aprovechar como guía `pbDocumentParser.ts`, parser estructural SR*, `projectRegistry`, `PbLibraryGraph`, `semanticEngine.ts` y servicios que ya distinguían pasos baratos y caros del análisis.
- **Sub-specs iniciales:**
  - `S-B152-01 structuralPass`
  - `S-B152-02 enrichedPass`
  - `S-B152-03 readinessByPass`
- **Cierre:** el usuario obtiene valor temprano sin esperar enriquecimiento completo.

## B122 — Priorización por dependencias semánticas cercanas
- **Estado:** Partial
- **Track:** scheduling
- **Depende de:** B152, B153
- **Desbloquea:** B125
- **Objetivo:** priorizar por valor semántico, no por orden físico.
- **Guía / referencia `plugin_old`:** revisar `projectRegistry.ts`, `PbLibraryGraph`, `owners/`, `InheritanceGraph` y heurísticas previas de proximidad/afinidad semántica.
- **Cierre:** activo → ancestros → owners/tipos → calls probables → proyecto → workspace.

## B123 — Presupuestos de trabajo y yielding cooperativo
- **Estado:** Partial
- **Track:** latencia
- **Depende de:** B152
- **Desbloquea:** B159
- **Objetivo:** que ningún batch largo monopolice CPU.
- **Guía / referencia `plugin_old`:** revisar si existía cualquier forma de chunking, lotes o yielding en indexadores/servicios largos; si no, usar el legacy para identificar tareas costosas a trocear.
- **Cierre:** el servidor trabaja en slices pequeños y cede explícitamente.

## B124 — Cancelación y preempción real de tareas de fondo
- **Estado:** Partial
- **Track:** latencia
- **Depende de:** B123
- **Desbloquea:** B159
- **Objetivo:** background nunca debe bloquear consultas interactivas.
- **Guía / referencia `plugin_old`:** revisar llamadas largas del legacy (indexado, análisis de referencias, auditorías) para identificar puntos naturales de cancelación cooperativa.
- **Cierre:** las tareas de fondo ceden/cancelan y se reanudan sin perder progreso útil.

## B169 — Watcher intake pipeline con backpressure real
- **Estado:** Partial
- **Track:** incrementalidad + robustez
- **Depende de:** B154
- **Desbloquea:** B125, B155
- **Objetivo:** absorber cambios masivos de FS sin caos operativo.
- **Guía / referencia `plugin_old`:** revisar watchers, invalidación y triggers del legacy para detectar problemas reales sufridos en repos grandes y reutilizar reglas útiles de debounce/coalescing.
- **Sub-specs iniciales:**
  - `S-B169-01 watcherEventCoalescing`
  - `S-B169-02 backpressurePolicy`
  - `S-B169-03 massiveChangeMode`
- **Cierre:** branch switches / git pulls / cambios masivos no revientan el pipeline.

## B125 — Indexación progresiva del workspace completo
- **Estado:** Partial
- **Track:** scheduler/indexer
- **Depende de:** B122, B123, B124, B169
- **Desbloquea:** B134, B155
- **Objetivo:** meter todo el workspace en pipeline con estados conocidos.
- **Guía / referencia `plugin_old`:** revisar indexadores antiguos, runners de corpus, `PbLibraryGraph`, `projectRegistry`, caches documentales y cualquier status previo del motor.
- **Cierre:** cada archivo relevante tiene estado explícito y el sistema converge hacia workspace ready.

## B126 — Superficie de estado del indexador
- **Estado:** Partial
- **Track:** observabilidad
- **Depende de:** B125
- **Desbloquea:** B163, B176
- **Objetivo:** exponer colas, trabajo actual, invalidaciones, cancelaciones, último archivo, etc.
- **Guía / referencia `plugin_old`:** revisar comandos/stats/logs existentes, mensajes de diagnóstico y cualquier salida operativa útil del legacy.
- **Cierre:** el indexador deja de ser una caja negra.

## B134 — Modelo de progreso y readiness del indexador
- **Estado:** Partial
- **Track:** observabilidad + UX
- **Depende de:** B125, B152
- **Desbloquea:** B158, B107
- **Objetivo:** una fuente única de verdad para progreso y readiness.
- **Guía / referencia `plugin_old`:** usar como guía cualquier noción previa de “motor listo”, “contexto listo”, “proyecto cargado” o métricas parciales del legacy.
- **Cierre:** `% discovery`, `% indexing`, active context ready, project ready, workspace ready.

## B158 — Modo degradado formal
- **Estado:** Partial
- **Track:** seguridad de producto
- **Depende de:** B134, B152
- **Desbloquea:** B171, B032, B031
- **Objetivo:** definir niveles explícitos de disponibilidad semántica.
- **Guía / referencia `plugin_old`:** revisar dónde el legacy ya degradaba comportamiento por falta de contexto o por incertidumbre semántica, aunque no lo formalizara así.
- **Niveles sugeridos:**
  - structural-only
  - nearby-semantic-ready
  - project-semantic-ready
  - workspace-semantic-ready
- **Cierre:** las features saben cuándo degradar o bloquearse.

## B159 — Gobernador de latencia del servidor
- **Estado:** Partial
- **Track:** latencia
- **Depende de:** B123, B124, B158
- **Desbloquea:** B156, B160
- **Objetivo:** proteger la latencia interactiva con políticas explícitas.
- **Guía / referencia `plugin_old`:** usar el legacy para identificar consultas costosas, rutas lentas conocidas y features que ya necesitaban protección de latencia.
- **Cierre:** la interacción se mantiene consistente incluso en presión alta.

---

# L1 — Persistencia y modelo de workspace/proyecto

## B141 — Library graph / project model unificado
- **Estado:** Partial
- **Track:** core topology
- **Depende de:** B151
- **Desbloquea:** B155, B071A, B107, B171
- **Objetivo:** una única fuente de verdad para targets, librerías y dependencias.
- **Nota:** promovida al core.
- **Guía / referencia `plugin_old`:** `powerbuilder/projecting/*`, `PbLibraryGraph`, `projectRegistry.ts`.
- **Cierre:** el scheduler, cache, status, invalidación y serving reutilizan el mismo modelo.

## B155 — Checkpoints reales de indexación y resume robusto
- **Estado:** Partial
- **Track:** persistencia
- **Depende de:** B154, B125, B141
- **Desbloquea:** B071, B071A
- **Estado reciente:** `Specs 162-163` ya restauran `DocumentCache`/`KnowledgeBase` y persisten checkpoints solo al alcanzar `readiness` estable.
- **Objetivo:** reaperturas rápidas y resume seguro del pipeline.
- **Guía / referencia `plugin_old`:** revisar caches persistentes, fingerprints, snapshots y cualquier recuperación parcial del legacy que pueda orientar el diseño nuevo.
- **Cierre:** el motor recupera estado de discovery / parse / enrich / readiness sin recomputar todo.

## B167 — Journaling transaccional de caché persistente
- **Estado:** Partial
- **Track:** persistencia robusta
- **Depende de:** B155
- **Desbloquea:** B168
- **Estado reciente:** `Specs 153`, `155`, `160` y `161` ya materializan puerto de escritura, store persistente y `journal` interactivo en el runtime.
- **Objetivo:** evitar corrupción de caché y estados incompletos.
- **Guía / referencia `plugin_old`:** si existían escrituras persistentes/caches en disco, usarlas como lección; si no, usar los formatos persistidos del legacy para identificar necesidades de recovery/versioning.
- **Cierre:** cierres abruptos o fallos no dejan la caché en estado incierto.

## B168 — Cache schema versioning + migraciones
- **Estado:** Partial
- **Track:** persistencia robusta
- **Depende de:** B166, B167
- **Desbloquea:** B071A, B071B
- **Estado reciente:** `Specs 157-158` endurecen metadata de checkpoint, decisiones `reuse/rebuild` y validación estricta del `journal`.
- **Objetivo:** versionar persistencia y decidir migrar/invalidate/rebuild con seguridad.
- **Guía / referencia `plugin_old`:** revisar contratos, formatos serializados, catálogos, public API contracts o manifests del legacy para definir claves/versiones con sentido.
- **Cierre:** la persistencia escala entre versiones del motor sin hacks.

## B071 — Warm indexing y resume de caché persistente
- **Estado:** Partial
- **Track:** persistencia
- **Depende de:** B155, B167, B168
- **Desbloquea:** B071A, B071B
- **Estado reciente:** `Specs 154`, `162` y `163` ya pasan `cacheStorageUri`, restauran estado reutilizable y fijan persistencia en `readiness` estable.
- **Objetivo:** evitar cold indexing en cada reapertura.
- **Guía / referencia `plugin_old`:** revisar cualquier materialización persistente del knowledge base, project registry, symbol exports o caches del legacy.
- **Cierre:** reaperturas claramente más rápidas en workspaces grandes.

## B071B — Caché de consultas frecuentes
- **Estado:** Done
- **Track:** serving persistence
- **Dependía de:** B071A, B160
- **Desbloquea:** B031, B032, B107
- **Cierre real:** `Specs 175-184` hacen `ServingCache` exportable/rehidratable, añaden a `cacheStore` un snapshot persistente versionado, conectan restore/persist del runtime, filtran por epoch, suman coordinador dirty, reflejan populate/invalidation/shutdown y exponen el estado básico de la snapshot en `powerbuilder.showStats`.
- **Resultado observable:** el servidor expone `lastRestoredEntries` y `lastPersistedEntries` para la snapshot de ServingCache.

## B164 — Interning y compactación de memoria
- **Estado:** Open
- **Track:** escala/memoria
- **Depende de:** B151, B141
- **Desbloquea:** B070
- **Objetivo:** bajar presión de memoria en workspaces grandes.
- **Guía / referencia `plugin_old`:** revisar hot paths del legacy y colecciones con alta repetición de nombres, URIs, tipos, owners, container names e ids.
- **Cierre:** nombres, URIs, tipos, contenedores e ids internos reutilizados/compactados.

## B174 — Resultados semánticos inmutables
- **Estado:** Partial
- **Track:** robustez interna
- **Depende de:** B151, B165
- **Desbloquea:** B160, B162
- **Estado reciente:** `Specs 159-160` aplican copias defensivas y payload persistente versionado en `KnowledgeBase` y `DocumentCache`.
- **Objetivo:** evitar mutaciones accidentales de snapshots y resultados.
- **Guía / referencia `plugin_old`:** revisar dónde el legacy sufría mutaciones implícitas o paso de estructuras compartidas por referencia.
- **Cierre:** snapshots/facts/resultados publicados son tratados como inmutables.

---

# L2 — Query engine y serving profesional

## B156 — Query engine unificado
- **Estado:** Partial
- **Track:** serving
- **Depende de:** B151, B152, B159
- **Desbloquea:** B031, B032, B036, B066, B065, B160
- **Estado reciente:** `Spec 164` ya centraliza contexto compartido y el resolver detallado alimenta el hot path de `hover`, `definition` y `signatureHelp`.
- **Objetivo:** una capa común para resolver queries semánticas.
- **Guía / referencia `plugin_old`:** `semanticEngine.ts`, `owners/`, `hover/presentation.ts`, `queryPrecision.ts`, `ancestorScriptService.ts`, `pbPowerScriptCodeLens.ts` y servicios de resolución repartidos del legacy.
- **Cierre:** hover/completion/definition/references usan el mismo motor.

## B157 — Semantic evidence de primera clase
- **Estado:** Partial
- **Track:** explicabilidad
- **Depende de:** B156
- **Desbloquea:** B171, B175, B109
- **Legacy refs:** absorbe B136
- **Estado reciente:** `Specs 169-170` retienen `queryTrace` y `reasonCodes` del winner path como primera capa de evidencia formal.
- **Objetivo:** modelar formalmente por qué una resolución ganó.
- **Guía / referencia `plugin_old`:** `queryPrecision.ts`, `buildSemanticQueryReasons`, `buildSemanticEvidence`.
- **Cierre:** scope, visibilidad, library order, distance, confidence y descartes quedan trazados.

## B172 — Provenance / lineage de símbolos
- **Estado:** Done
- **Track:** explicabilidad
- **Depende de:** B151, B157
- **Desbloquea:** B176, B109, B111
- **Estado reciente:** `Specs 185-192` introducen `EntityLineage` dentro de `Entity`, lo pueblan desde `analyzeDocument`, lo normalizan en `enrichEntity`, lo incorporan al `semanticDiff`, exponen `winnerLineage`, tienden el puente con el catálogo de sistema, muestran lineage mínimo en hover y lo estabilizan en `ApiSymbol`.
- **Objetivo:** que cada símbolo sepa de dónde viene y qué grado de fiabilidad tiene.
- **Guía / referencia `plugin_old`:** revisar `symbolIndex.ts`, `uniqueSymbols`, catálogo oficial/dataset curado, `publicApi.ts` y cualquier modelo del legacy que ya distinguiera orígenes o tipos de entidades.
- **Cierre:** origen, fase, prototype/implementation, heredado, heurístico, oficial/manual quedan modelados.

## B171 — Confidence gates por feature
- **Estado:** Open
- **Track:** seguridad de serving
- **Depende de:** B157, B158, B141
- **Desbloquea:** B031, B032, B036
- **Objetivo:** que cada feature opere solo con el nivel de confianza adecuado.
- **Guía / referencia `plugin_old`:** revisar dónde el legacy ya bloqueaba, degradaba o filtraba operaciones por seguridad semántica, aunque sin contrato explícito.
- **Cierre:** rename y references peligrosas exigen confianza alta; otras degradan con seguridad.

## B160 — Query result cache con claves semánticas estables
- **Estado:** Partial
- **Track:** serving performance
- **Depende de:** B156, B166, B174
- **Desbloquea:** B031, B032, B066
- **Estado reciente:** `Specs 165-168` extienden `ServingCache` a `definition`, `signatureHelp` y `completion`, y activan consumo real de `HotContextCache`.
- **Objetivo:** cachear respuestas semánticas seguras.
- **Guía / referencia `plugin_old`:** revisar serving cache, hot context cache, document cache y cualquier memoización semántica del legacy.
- **Cierre:** hit ratio observable, claves estables, invalidación correcta.

## B173 — Precomputed member closures por tipo
- **Estado:** Open
- **Track:** serving performance
- **Depende de:** B141, B156
- **Desbloquea:** B066, B065, B031
- **Objetivo:** precalcular miembros propios/heredados/override/accessibilidad por tipo.
- **Guía / referencia `plugin_old`:** `InheritanceGraph`, member caches, distance functions y cualquier ayuda de completado/jerarquía del legacy.
- **Cierre:** completion/hover/hierarchy/references mejoran en latencia y consistencia.

## B031 — Referencias más precisas y robustas
- **Estado:** Open
- **Track:** productividad segura
- **Depende de:** B156, B157, B171, B160
- **Objetivo:** referencias cross-file y contexto fuerte sin matching superficial.
- **Guía / referencia `plugin_old`:** lógica antigua de `find references`, `symbolIndex.ts`, `queryPrecision.ts`, `compareByNesting` y servicios de resolución semántica del legacy.
- **Cierre:** results precisos y explicables sobre topología real.

## B032 — Rename controlado
- **Estado:** Partial
- **Track:** productividad segura
- **Depende de:** B156, B157, B158, B171
- **Estado previo:** preflight `validateRenameTarget` ya existe.
- **Objetivo:** ampliar rename solo en escenarios semánticamente seguros.
- **Guía / referencia `plugin_old`:** revisar si el legacy tenía restricciones fuertes de rename, precondiciones o heurísticas de seguridad reutilizables.
- **Cierre:** rename local / parámetros / miembros tipados seguros según confidence gates.

## B036 — Code actions básicas
- **Estado:** Partial
- **Track:** productividad segura
- **Depende de:** B156, B171
- **Estado previo:** quick-fix inicial SD7.
- **Objetivo:** quick fixes pequeños, seguros y explicables.
- **Guía / referencia `plugin_old`:** `diagnosticResolver.ts`, fixes antiguos y cualquier acción rápida del legacy que pueda servir de catálogo inicial.
- **Cierre:** catálogo pequeño pero confiable de acciones.

## B066 — CodeLens de referencias y herencia
- **Estado:** Partial
- **Track:** productividad segura
- **Depende de:** B156, B173
- **Estado previo:** lens inicial de referencias.
- **Objetivo:** conteos fiables de referencias/override/herencia.
- **Guía / referencia `plugin_old`:** `pbPowerScriptCodeLens.ts`.
- **Cierre:** CodeLens coherente y rápido.

## B065 — Ancestor script navigation + hierarchy inspection
- **Estado:** Partial
- **Track:** productividad segura
- **Depende de:** B156, B173
- **Legacy refs:** absorbe B137
- **Estado previo:** `getAncestorChain` y `buildHierarchyTree` base.
- **Objetivo:** navegación jerárquica completa y segura.
- **Guía / referencia `plugin_old`:** `ancestorScriptService.ts`, `powerbuilder/hierarchy/`, servicios de hierarchy inspection del legacy.
- **Cierre:** ancestro inmediato + árbol de jerarquía + overrides heredados.

## B067 — Formateador configurable
- **Estado:** Open
- **Track:** productividad
- **Depende de:** B156
- **Objetivo:** formateo configurable solo sobre base sintáctica/semántica ya fiable.
- **Guía / referencia `plugin_old`:** revisar normalizadores, statement utils y convenciones que el legacy ya aplicaba o infería sobre PowerScript.
- **Cierre:** formatter sin romper constructs PowerBuilder reales.

## B107 — Status bar con contexto de proyecto
- **Estado:** Partial
- **Track:** UX profesional
- **Depende de:** B134, B141, B071B
- **Estado previo:** `formatProjectStatus` base.
- **Objetivo:** unificar progreso + proyecto activo + acciones de mantenimiento.
- **Guía / referencia `plugin_old`:** mensajes de usuario, stats, project context y cualquier surface operativa del legacy.
- **Cierre:** status bar realmente útil, no decorativa.

## B109 — API pública para integración
- **Estado:** Partial
- **Track:** plataforma
- **Depende de:** B156, B157, B172
- **Estado previo:** superficie inicial `shared/publicApi`.
- **Estado reciente:** `Spec 172` amplía `ApiServerStats` con `readiness`, `indexer`, `projectModel`, `persistence` y `lastQueryTrace`; `Spec 192` añade `ApiSymbolLineage` y `toApiSymbol()` para exportar lineage mínimo estable por símbolo.
- **Objetivo:** exponer capacidades semánticas sobre contratos maduros, no sobre hacks internos.
- **Guía / referencia `plugin_old`:** `publicApi.ts`, `publicApiContract.ts`.
- **Cierre:** API estable y mínima, con modelos explicables.

---

# L3 — Validación fuerte, salud interna y excelencia operativa

## B030 — Validación sobre workspace grande real
- **Estado:** Open
- **Track:** validación
- **Depende de:** B141, B155
- **Objetivo:** validar sobre PFC 2025 Solution/Workspace y corpus legacy.
- **Guía / referencia `plugin_old`:** runners de corpus, fixtures grandes, smoke runners y cualquier harness del legacy usado contra PFC/corpus reales.
- **Cierre:** no solo fixtures sintéticos; corpus reales integrados en el ciclo.

## B068 — Calibración real del performance budget
- **Estado:** Open
- **Track:** performance
- **Depende de:** B030
- **Objetivo:** convertir budgets teóricos en budgets medidos.
- **Guía / referencia `plugin_old`:** métricas, tiempos de análisis, benchmarks y logs de rendimiento del legacy si existen.
- **Cierre:** budgets ajustados sobre datos reales.

## B069 — Fixtures reales permanentes de PFC/legacy
- **Estado:** Open
- **Track:** regresión
- **Depende de:** B030
- **Objetivo:** fixtures permanentes y mantenidos.
- **Guía / referencia `plugin_old`:** corpus reales, PFC, ejemplos, legacy fixtures y muestras complejas ya reunidas en el plugin antiguo.
- **Cierre:** corpus representativos integrados en la regresión.

## B070 — Memory budgets de caché e índice
- **Estado:** Open
- **Track:** escala
- **Depende de:** B164
- **Objetivo:** límites explícitos de memoria y métricas por capa.
- **Guía / referencia `plugin_old`:** revisar tamaños reales de caches/índices del legacy y cualquier punto de presión conocido.
- **Cierre:** budgets definidos, medidos y vigilados.

## B063 — Diagnostics snapshot agrupado
- **Estado:** Partial
- **Track:** calidad interna
- **Depende de:** B151
- **Estado previo:** `buildDiagnosticsSnapshot` base.
- **Objetivo:** snapshots diagnósticos más profesionales por proyecto/objeto.
- **Guía / referencia `plugin_old`:** `diagnosticResolver.ts` y cualquier agrupación/summary de diagnósticos del legacy.
- **Cierre:** diagnósticos agrupados y consistentes con snapshots/document versions.

## B118 — Integration test matrix del plugin
- **Estado:** Open
- **Track:** QA
- **Depende de:** B030, B155
- **Objetivo:** lifecycle real del plugin y workspaces reales.
- **Guía / referencia `plugin_old`:** harnesses de pruebas del legacy, smoke/integration runners, fixtures y scripts de validación ya existentes.
- **Cierre:** activation + client/server + Solution + Workspace + disable-extensions + VS Code test tooling.

## B119 — Performance regression suite
- **Estado:** Open
- **Track:** QA/perf
- **Depende de:** B068
- **Objetivo:** medir activación, primer hover, primer diagnostics, discovery, warm/cold index.
- **Guía / referencia `plugin_old`:** medir sobre casos reales heredados y reutilizar corpus/perf cases del legacy cuando existan.
- **Cierre:** suite estable de regresión de rendimiento.

## B161 — Golden tests semánticos end-to-end
- **Estado:** Open
- **Track:** QA semántica
- **Depende de:** B156, B157, B030
- **Objetivo:** contratos visibles de comportamiento semántico.
- **Guía / referencia `plugin_old`:** usar corpus y casos que el legacy resolvía bien como base de expected behavior.
- **Cierre:** hover/definition/references/rename eligibility/readiness cubiertos por goldens.

## B162 — Reconciliación parser / symbol model / salida LSP
- **Estado:** Open
- **Track:** consistencia interna
- **Depende de:** B151, B156, B165
- **Objetivo:** detectar incoherencias internas antes de publicarlas.
- **Guía / referencia `plugin_old`:** comparar parser, symbol model y surfaces públicas del legacy para identificar invariantes reales del dominio.
- **Cierre:** aserciones internas útiles y reportes claros de inconsistencias.

## B163 — Semantic work journal / event log del motor
- **Estado:** Open
- **Track:** observabilidad
- **Depende de:** B126
- **Objetivo:** event log técnico para tuning y debugging.
- **Guía / referencia `plugin_old`:** logs internos, outputs de stats, comandos de diagnóstico y trazas del legacy.
- **Cierre:** journal exportable de trabajo del motor con fases, hits/misses, invalidaciones y latencias.

## B175 — Repro packs automáticos para bugs semánticos
- **Estado:** Open
- **Track:** mantenibilidad
- **Depende de:** B157, B163, B162
- **Objetivo:** generar pequeños paquetes de repro cuando falle el motor.
- **Guía / referencia `plugin_old`:** usar corpus/fixtures del legacy como formato de base para empaquetar repros pequeños y comparables.
- **Cierre:** un bug semántico complejo puede reproducirse sin reconstruir contexto manualmente.

## B176 — Health checker interno del motor
- **Estado:** Partial
- **Track:** salud interna
- **Depende de:** B126, B162, B172
- **Estado reciente:** `Spec 171` amplía `showStats` con caches, `readiness`, `persistence`, `projectModel` y la última `queryTrace` como base de inspección interna.
- **Objetivo:** revisar coherencia de caches, índices, readiness y snapshots.
- **Guía / referencia `plugin_old`:** revisar stats/commands/diagnósticos internos del legacy para transformar checks ad hoc en health checks formales.
- **Cierre:** comando/servicio que detecta degradación interna antes del bug visible.

---

# L4 — Especialización PowerBuilder y automatización

## B117 — DataWindow safe mode mínimo
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** L0-L3 suficientemente maduros
- **Objetivo:** soporte seguro mínimo de `.srd`.
- **Guía / referencia `plugin_old`:** `powerbuilder/datawindow/*`, `pbDataWindowParser.ts`, `pbDataWindowDefinition.ts`, `pbDataWindowHover.ts`.
- **Cierre:** detección, SQL base, args, columnas, bandas principales, hover/navegación básica.

## B139 — DataWindow safe-mode desde `plugin_old`
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** B117
- **Objetivo:** reaprovechar parser/definition/hover seguros del legacy.
- **Guía / referencia `plugin_old`:** `powerbuilder/datawindow/*`.
- **Cierre:** safe-mode mejorado sin abrir aún la superficie avanzada completa.

## B041 — Catálogo y navegación de DataWindow
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** B117, B139
- **Objetivo:** DataWindow/DataStore como entidades semánticas de primer nivel.
- **Guía / referencia `plugin_old`:** catálogo y helpers DataWindow del legacy, plus parser/definition/hover ya citados.
- **Cierre:** navegación y catálogo básicos integrados.

## B042 — Soporte avanzado de DataWindow
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** B041
- **Objetivo:** expresiones, propiedades avanzadas, funciones, relaciones con DataStore.
- **Guía / referencia `plugin_old`:** `datawindow/` y cualquier lógica avanzada útil del legacy.
- **Cierre:** soporte ampliado y estable.

## B081 — Inteligencia de DataWindow y acceso a `.Object`
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** B042
- **Objetivo:** cubrir `dw_1.Object`.
- **Guía / referencia `plugin_old`:** lógica de DataWindow avanzada y modelado de `.Object` del legacy si existe.
- **Cierre:** navegación/validación seguras en acceso a `.Object`.

## B043 — Integración con PBAutoBuild
- **Estado:** Open
- **Track:** build
- **Depende de:** B141
- **Objetivo:** build moderno oficial.
- **Guía / referencia `plugin_old`:** `pbAutoBuildService.ts`, `powerbuilder/build/*`.
- **Cierre:** lanzar build, validar entorno, capturar errores y alimentar health del workspace.

## B083 — Integración avanzada con PBAutoBuild
- **Estado:** Open
- **Track:** build
- **Depende de:** B043
- **Objetivo:** Problems panel, reporting y validación avanzada.
- **Guía / referencia `plugin_old`:** `pbAutoBuildService.ts` y reporting/harness de build del legacy.
- **Cierre:** integración madura con reporting profesional.

## B044 — Estado de build y salud del workspace
- **Estado:** Open
- **Track:** build/health
- **Depende de:** B043
- **Objetivo:** detectar readiness de compilación y problemas de configuración.
- **Guía / referencia `plugin_old`:** servicios/diagnósticos de build/configuración del legacy.
- **Cierre:** el usuario entiende si el proyecto está listo para compilar.

## B048 — Integración con OrcaScript / ORCA
- **Estado:** Open
- **Track:** legacy ecosystem
- **Depende de:** B043, B083
- **Objetivo:** soporte legacy tras cerrar camino moderno.
- **Guía / referencia `plugin_old`:** integraciones ORCA/OrcaScript previas, scripts legacy y utilidades relacionadas si existían.
- **Cierre:** compatibilidad con automatización clásica sin contaminar la ruta principal.

## B045 — Auditoría de arquitectura y convenciones
- **Estado:** Open
- **Track:** auditoría de proyecto
- **Depende de:** motor semántico maduro
- **Objetivo:** revisar consistencia técnica y convenciones sobre base semántica fuerte.
- **Guía / referencia `plugin_old`:** auditorías, inspectores, revisores o reglas del legacy aplicadas a PowerBuilder/PFC.
- **Cierre:** auditorías fiables y no superficiales.

## B110 — Exportación de superficie de automatización
- **Estado:** Open
- **Track:** automation
- **Depende de:** B109, B172
- **Objetivo:** exportar manifiestos JSON/YAML del workspace.
- **Guía / referencia `plugin_old`:** `publicApiContract.ts`, modelos exportables y contratos externos del legacy.
- **Cierre:** consumible por CI/agentes/auditorías.

## B111 — Árbol global de diagnósticos exportable
- **Estado:** Open
- **Track:** automation
- **Depende de:** B063, B109
- **Objetivo:** exportar diagnóstico jerárquico machine-readable.
- **Guía / referencia `plugin_old`:** árboles/reportes de diagnósticos del legacy si existían.
- **Cierre:** vista global exportable y estable.

## B132 — Gobernanza del catálogo oficial + dataset curado
- **Estado:** Partial
- **Track:** knowledge governance
- **Depende de:** B109
- **Objetivo:** separar catálogo oficial y dataset curado.
- **Estado previo:** reporte de consistencia parcial.
- **Guía / referencia `plugin_old`:** catálogos heredados, datasets curados, `buildCatalogConsistencyReport`, sanity tests y cualquier manifest del legacy.
- **Cierre:** trazabilidad/versionado/validación de ambas capas.

## B140 — Language Model Tools
- **Estado:** Open
- **Track:** AI integration
- **Depende de:** B109, B157
- **Objetivo:** exponer tools consumibles por Copilot Chat/otros agentes.
- **Guía / referencia `plugin_old`:** `powerbuilder/contracts/languageModelTools.ts`, `publicApiContract.ts`.
- **Cierre:** tools semánticas sobre contratos maduros, no sobre endpoints frágiles.

## B142 — Auto-build service y build target utils
- **Estado:** Open
- **Track:** build
- **Depende de:** B043, B141
- **Objetivo:** detection de target y auto-build out-of-process.
- **Guía / referencia `plugin_old`:** `powerbuilder/build/*`.
- **Cierre:** build utils estables reutilizables por otras integraciones.

---

# 6. Current execution focus (muy importante)

## Fase 1 — Cerrar atomicidad + incrementalidad fina
**Orden:**
1. B151  
2. B165  
3. B166  
4. B170  
5. B153  
6. B154  
7. B152  
8. B122  
9. B123  
10. B124  
11. B169  
12. B125  
13. B126  
14. B134  
15. B158  
16. B159

## Fase 2 — Persistencia robusta
**Orden:**
1. B141  
2. B155  
3. B167  
4. B168  
5. B071  
6. B164  
7. B174

## Fase 3 — Query engine y serving profesional
**Orden:**
1. B156  
2. B157  
3. B171  
4. B160  
5. B173  
6. B031  
7. B032  
8. B036  
9. B066  
10. B065  
11. B107  
12. B109

## Fase 4 — Validación / salud / excelencia
**Orden:**
1. B030  
2. B068  
3. B069  
4. B070  
5. B063  
6. B118  
7. B119  
8. B161  
9. B162  
10. B163  
11. B175  
12. B176

## Fase 5 — Especialización PowerBuilder y automatización
Después de cerrar bien las anteriores.

---

# 7. Backlog derivado

Registrar aquí cualquier deuda nueva detectada durante ejecución real, sin contaminar el orden maestro salvo que el hallazgo sea bloqueante de L0/L1.
