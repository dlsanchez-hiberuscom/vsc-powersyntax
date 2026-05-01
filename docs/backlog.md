# Backlog — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## Cambios aplicados en esta versión

- Se limpia el backlog activo para que no contenga ítems `Done`.
- Los ítems cerrados deben moverse a `done-log.md`.
- Se mantiene la trazabilidad de cierres recientes en una sección de referencia, pero fuera del backlog activo.
- Se aclara que los ítems materializados como primer corte operativo no deben reimplementarse desde cero.
- Se corrige `Current execution focus` eliminando ítems ya cerrados.
- Se mantiene `B071B` fuera del backlog activo.
- Se añade bloque final `L4-final — Build moderno y automatización legacy` con specs nuevas `B181-B198`.
- Se incorporan reglas específicas para PBAutoBuild, ORCA y PBL.

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
- Si un ítem aparece como materializado por specs previas pero sigue `Partial`, **no reimplementarlo desde cero**: completar solo cierre formal, hardening, tests, docs, integración o eliminación de duplicidad.

---

## 2. Estados oficiales

- **Open:** sin slice activa de cierre; puede estar no iniciado o tener groundwork previo que aún no constituye un corte operativo cerrable.
- **Partial:** existe implementación parcial o primer corte operativo, pero faltan criterios de cierre.
- **Ready for closure:** código y tests básicos existen; falta revisión final, documentación o validación ampliada.
- **Blocked:** no puede avanzar por dependencia, entorno o decisión explícita.
- **Done:** código, tests, documentación y validación cerrados; debe vivir en `done-log.md`, no en backlog activo.

Normalización 2026-05:

- cuando un `Partial` legacy se descompone en slices nuevas y más precisas, el ítem padre vuelve a `Open`;
- el trabajo activo pasa a una nueva entrada `Partial` con sufijo (`A`, `B`, etc.) o sub-spec explícita;
- esta normalización evita falsos cierres sin perder trazabilidad del trabajo ya materializado.

Un ítem `Partial` debe incluir, siempre que sea posible:

```md
**Pendiente exacto:**
- ...
```

---

## 3. Pilares del producto

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

## 4. Orden maestro de prioridad

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

## 5. Reglas estructurales del backlog

- Los ítems **abiertos**, **parciales**, **bloqueados** y **ready for closure** viven aquí.
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

### 5.1 Primera ola 133-152 materializada como primer corte operativo

La serie `Spec 133-152` quedó materializada como primer corte operativo. Si algún ítem asociado sigue en `Partial`, la IA **no debe reimplementarlo desde cero**. Debe completar solo lo pendiente para cierre real:

- hardening;
- tests focalizados o end-to-end;
- documentación;
- integración con consumers reales;
- limpieza de duplicidad;
- validación sobre corpus real cuando aplique.

Validación registrada del corte:
- `npm run compile`
- `npm run test:unit`
- `npm test`

### 5.2 Ítems cerrados que deben vivir en done-log.md

Los siguientes ítems ya no deben aparecer en backlog activo:

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

---

# 6. Backlog activo reordenado

# L0 — Core platform no negociable

## B122 — Priorización por dependencias semánticas cercanas
- **Estado:** Open
- **Track:** scheduling
- **Depende de:** B152
- **Desbloquea:** B125
- **Objetivo:** priorizar por valor semántico, no por orden físico.
- **Guía / referencia `plugin_old`:** `projectRegistry.ts`, `PbLibraryGraph`, `owners/`, `InheritanceGraph` y heurísticas previas de proximidad/afinidad semántica.
- **Pendiente exacto:**
  - conectar active document → ancestros → owners/tipos → calls probables → proyecto → workspace;
  - exponer razón de prioridad en estado del scheduler;
  - probar que el contexto activo se indexa antes que el resto del workspace.
- **Cierre:** activo → ancestros → owners/tipos → calls probables → proyecto → workspace.

## B125 — Indexación progresiva del workspace completo
- **Estado:** Open
- **Track:** scheduler/indexer
- **Depende de:** B122, B169
- **Desbloquea:** B134, B155
- **Objetivo:** meter todo el workspace en pipeline con estados conocidos.
- **Guía / referencia `plugin_old`:** indexadores antiguos, runners de corpus, `PbLibraryGraph`, `projectRegistry`, caches documentales y status previo del motor.
- **Pendiente exacto:**
  - estado explícito por archivo relevante;
  - convergencia a workspace ready;
  - reanudación coherente tras cambios durante indexación;
  - tests de workspace con múltiples estados simultáneos.
- **Cierre:** cada archivo relevante tiene estado explícito y el sistema converge hacia workspace ready.

## B134 — Modelo de progreso y readiness del indexador
- **Estado:** Open
- **Track:** observabilidad + UX
- **Depende de:** B125, B152
- **Desbloquea:** B158, B107
- **Objetivo:** una fuente única de verdad para progreso y readiness.
- **Guía / referencia `plugin_old`:** nociones previas de motor listo, contexto listo, proyecto cargado o métricas parciales.
- **Pendiente exacto:**
  - `% discovery`;
  - `% indexing`;
  - active context ready;
  - project ready;
  - workspace ready;
  - transición formal entre readiness levels.
- **Cierre:** progreso y readiness son coherentes en status, health y serving.

## B158 — Modo degradado formal
- **Estado:** Open
- **Track:** seguridad de producto
- **Depende de:** B134, B152
- **Desbloquea:** B171, B032, B031
- **Objetivo:** definir niveles explícitos de disponibilidad semántica.
- **Niveles sugeridos:**
  - `structural-only`
  - `nearby-semantic-ready`
  - `project-semantic-ready`
  - `workspace-semantic-ready`
- **Pendiente exacto:**
  - contrato único de readiness por feature;
  - comportamiento degradado por hover/completion/definition/references/rename;
  - tests de bloqueo/degradación por nivel.
- **Cierre:** las features saben cuándo degradar o bloquearse.

## B159 — Gobernador de latencia del servidor
- **Estado:** Open
- **Track:** latencia
- **Depende de:** B158
- **Desbloquea:** B156, B160
- **Objetivo:** proteger la latencia interactiva con políticas explícitas.
- **Guía / referencia `plugin_old`:** consultas costosas, rutas lentas conocidas y features que ya necesitaban protección.
- **Pendiente exacto:**
  - políticas por tipo de request;
  - integración real con serving y scheduler;
  - métricas de latencia;
  - degradación cuando no hay presupuesto.
- **Cierre:** la interacción se mantiene consistente incluso en presión alta.

---

# L1 — Persistencia y modelo de workspace/proyecto

## B141 — Library graph / project model unificado
- **Estado:** Open
- **Track:** core topology
- **Depende de:** B151
- **Desbloquea:** B155, B071, B107, B171, B164
- **Objetivo:** una única fuente de verdad para targets, librerías y dependencias.
- **Nota:** promovida al core.
- **Guía / referencia `plugin_old`:** `powerbuilder/projecting/*`, `PbLibraryGraph`, `projectRegistry.ts`.
- **Estado reciente:** `UnifiedProjectModel` ya alimenta partición persistente, priorización del indexador, `libraryOrder`, routing compartido, refresh por watcher y status del proyecto activo; el gap real queda en consolidar serving e invariantes finales dentro de `B141A`.
- **Pendiente exacto:**
  - cerrar el consumo restante de serving/cache/query surfaces sobre el mismo modelo sin fallbacks legacy;
  - documentar invariantes de workspace/solution/target/library y el criterio de proyecto activo;
  - mantener tests de routing y refresh project-aware ante cambios externos.
- **Cierre:** el scheduler, cache, status, invalidación y serving reutilizan el mismo modelo.

## B141A — UnifiedProjectModel runtime adoption
- **Estado:** Partial
- **Track:** core topology
- **Depende de:** B151
- **Desbloquea:** B155, B107, B171, B164
- **Estado reciente:** `cacheStore`, `workspaceIndexer`, `libraryOrder`, `projectRouting`, el watcher y `showStats` ya reutilizan `UnifiedProjectModel`, pero el runtime aún conserva superficie legacy alrededor de serving e invariantes de routing.
- **Objetivo:** llevar el modelo unificado al hot path real del motor.
- **Pendiente exacto:**
  - conectar las surfaces restantes de serving y cache al mismo modelo;
  - cerrar el contrato de proyecto activo/routing tras cambios externos sin fallbacks duplicados;
  - documentar invariantes y validarlas con tests de routing por proyecto.
- **Cierre:** el runtime usa un único project model para las decisiones project-aware.

## B155 — Checkpoints reales de indexación y resume robusto
- **Estado:** Open
- **Track:** persistencia
- **Depende de:** B125, B141
- **Desbloquea:** B071
- **Estado reciente:** `Specs 162-163` restauran `DocumentCache`/`KnowledgeBase` y persisten checkpoints solo al alcanzar `readiness` estable.
- **Objetivo:** reaperturas rápidas y resume seguro del pipeline.
- **Pendiente exacto:**
  - persistir/restaurar discovery, parse, enrich y readiness;
  - validar resume parcial en interrupciones;
  - evitar recomputado completo si fingerprints/epochs coinciden.
- **Cierre:** el motor recupera estado de discovery / parse / enrich / readiness sin recomputar todo.

## B167 — Journaling transaccional de caché persistente
- **Estado:** Open
- **Track:** persistencia robusta
- **Depende de:** B155
- **Desbloquea:** B168
- **Estado reciente:** `Specs 153`, `155`, `160` y `161` materializan puerto de escritura, store persistente y journal interactivo en runtime.
- **Objetivo:** evitar corrupción de caché y estados incompletos.
- **Pendiente exacto:**
  - recovery probado ante cierre abrupto;
  - limpieza de journal aplicado;
  - tests de corrupción parcial.
- **Cierre:** cierres abruptos o fallos no dejan la caché en estado incierto.

## B168 — Cache schema versioning + migraciones
- **Estado:** Open
- **Track:** persistencia robusta
- **Depende de:** B167
- **Desbloquea:** B071
- **Estado reciente:** `Specs 157-158` endurecen metadata de checkpoint, decisiones `reuse/rebuild` y validación estricta del journal.
- **Objetivo:** versionar persistencia y decidir migrar/invalidate/rebuild con seguridad.
- **Pendiente exacto:**
  - política explícita de migrate/rebuild;
  - tests por versión incompatible;
  - documentación de schema persistente.
- **Cierre:** la persistencia escala entre versiones del motor sin hacks.

## B071 — Warm indexing y resume de caché persistente
- **Estado:** Open
- **Track:** persistencia
- **Depende de:** B155, B167, B168
- **Desbloquea:** B164, B174
- **Estado reciente:** `Specs 154`, `162` y `163` pasan `cacheStorageUri`, restauran estado reutilizable y fijan persistencia en readiness estable.
- **Objetivo:** evitar cold indexing en cada reapertura.
- **Pendiente exacto:**
  - medir cold vs warm;
  - validar en workspace grande;
  - exponer restored/reused/rebuilt en status.
- **Cierre:** reaperturas claramente más rápidas en workspaces grandes.

## B164 — Interning y compactación de memoria
- **Estado:** Open
- **Track:** escala/memoria
- **Depende de:** B151, B141
- **Desbloquea:** B070
- **Objetivo:** bajar presión de memoria en workspaces grandes.
- **Guía / referencia `plugin_old`:** hot paths del legacy y colecciones con alta repetición de nombres, URIs, tipos, owners, container names e ids.
- **Cierre:** nombres, URIs, tipos, contenedores e ids internos reutilizados/compactados.

## B174 — Resultados semánticos inmutables
- **Estado:** Done
- **Track:** robustez interna
- **Depende de:** B151
- **Desbloquea:** B160, B162
- **Estado reciente:** `Specs 159-160` blindan export/restore y persistencia; `Spec 197` cierra la frontera inmutable en `KnowledgeBase`, `DocumentCache` y `HotContextCache` con tests contra mutación accidental.
- **Objetivo:** evitar mutaciones accidentales de snapshots y resultados.
- **Cierre:** snapshots/facts/resultados publicados son tratados como inmutables.

---

# L2 — Query engine y serving profesional

## B156 — Query engine unificado
- **Estado:** Open
- **Track:** serving
- **Depende de:** B151, B152, B159
- **Desbloquea:** B157, B031, B032, B036, B066, B065, B160
- **Estado reciente:** `Spec 164` centraliza contexto compartido y el resolver detallado alimenta el hot path de `hover`, `definition` y `signatureHelp`.
- **Objetivo:** una capa común para resolver queries semánticas.
- **Pendiente exacto:**
  - completar consumo por completion/references/CodeLens/hierarchy;
  - eliminar resolvers paralelos;
  - tests de consistencia cross-feature.
- **Cierre:** hover/completion/definition/references usan el mismo motor.

## B157 — Semantic evidence de primera clase
- **Estado:** Open
- **Track:** explicabilidad
- **Depende de:** B156
- **Desbloquea:** B171, B175, B109
- **Legacy refs:** absorbe B136
- **Estado reciente:** `Specs 169-170` retienen `queryTrace` y `reasonCodes` del winner path como primera capa de evidencia formal.
- **Objetivo:** modelar formalmente por qué una resolución ganó.
- **Pendiente exacto:**
  - evidence para descartes y candidatos perdedores;
  - confidence formal calculada por feature;
  - exposición segura en API/diagnostics.
- **Cierre:** scope, visibilidad, library order, distance, confidence y descartes quedan trazados.

## B171 — Confidence gates por feature
- **Estado:** Open
- **Track:** seguridad de serving
- **Depende de:** B157, B158, B141
- **Desbloquea:** B031, B032, B036
- **Objetivo:** que cada feature opere solo con el nivel de confianza adecuado.
- **Cierre:** rename y references peligrosas exigen confianza alta; otras degradan con seguridad.

## B160 — Query result cache con claves semánticas estables
- **Estado:** Open
- **Track:** serving performance
- **Depende de:** B156, B174
- **Desbloquea:** B031, B032, B066
- **Estado reciente:** `Specs 165-168` extienden `ServingCache` a `definition`, `signatureHelp` y `completion`, y activan consumo real de `HotContextCache`.
- **Objetivo:** cachear respuestas semánticas seguras.
- **Pendiente exacto:**
  - hit ratio observable;
  - claves estables para más query types;
  - invalidación probada por epoch/readiness/confidence.
- **Cierre:** hit ratio observable, claves estables, invalidación correcta.

## B173 — Precomputed member closures por tipo
- **Estado:** Open
- **Track:** serving performance
- **Depende de:** B141, B156
- **Desbloquea:** B066, B065, B031
- **Objetivo:** precalcular miembros propios/heredados/override/accessibilidad por tipo.
- **Cierre:** completion/hover/hierarchy/references mejoran en latencia y consistencia.

## B031 — Referencias más precisas y robustas
- **Estado:** Open
- **Track:** productividad segura
- **Depende de:** B156, B157, B171, B160
- **Objetivo:** referencias cross-file y contexto fuerte sin matching superficial.
- **Cierre:** results precisos y explicables sobre topología real.

## B032 — Rename controlado
- **Estado:** Open
- **Track:** productividad segura
- **Depende de:** B156, B157, B158, B171
- **Estado previo:** preflight `validateRenameTarget` ya existe.
- **Objetivo:** ampliar rename solo en escenarios semánticamente seguros.
- **Pendiente exacto:**
  - conectar con confidence gates;
  - ampliar rename local/parámetros/miembros tipados;
  - tests negativos para casos ambiguos.
- **Cierre:** rename local / parámetros / miembros tipados seguros según confidence gates.

## B036 — Code actions básicas
- **Estado:** Open
- **Track:** productividad segura
- **Depende de:** B156, B171
- **Estado previo:** quick-fix inicial SD7.
- **Objetivo:** quick fixes pequeños, seguros y explicables.
- **Pendiente exacto:**
  - catálogo mínimo estable;
  - evidence/confidence por action;
  - tests de no modificación peligrosa.
- **Cierre:** catálogo pequeño pero confiable de acciones.

## B066 — CodeLens de referencias y herencia
- **Estado:** Open
- **Track:** productividad segura
- **Depende de:** B156, B173
- **Estado previo:** lens inicial de referencias.
- **Objetivo:** conteos fiables de referencias/override/herencia.
- **Pendiente exacto:**
  - consumir closures;
  - cachear conteos seguros;
  - degradar si readiness insuficiente.
- **Cierre:** CodeLens coherente y rápido.

## B065 — Ancestor script navigation + hierarchy inspection
- **Estado:** Open
- **Track:** productividad segura
- **Depende de:** B156, B173
- **Legacy refs:** absorbe B137
- **Estado previo:** `getAncestorChain` y `buildHierarchyTree` base.
- **Objetivo:** navegación jerárquica completa y segura.
- **Pendiente exacto:**
  - ancestro inmediato;
  - árbol de jerarquía;
  - overrides heredados;
  - integración con evidence y closures.
- **Cierre:** ancestro inmediato + árbol de jerarquía + overrides heredados.

## B067 — Formateador configurable
- **Estado:** Open
- **Track:** productividad
- **Depende de:** B156
- **Objetivo:** formateo configurable solo sobre base sintáctica/semántica ya fiable.
- **Cierre:** formatter sin romper constructs PowerBuilder reales.

## B107 — Status bar con contexto de proyecto
- **Estado:** Open
- **Track:** UX profesional
- **Depende de:** B134, B141
- **Estado previo:** `formatProjectStatus` base.
- **Objetivo:** unificar progreso + proyecto activo + acciones de mantenimiento.
- **Pendiente exacto:**
  - estado de project model;
  - estado de cache/warm indexing;
  - accesos rápidos a stats/health/build;
  - evitar status decorativo sin acción útil.
- **Cierre:** status bar realmente útil, no decorativa.

## B109 — API pública para integración
- **Estado:** Open
- **Track:** plataforma
- **Depende de:** B156, B157, B172
- **Estado previo:** superficie inicial `shared/publicApi`.
- **Estado reciente:** `Spec 172` amplía `ApiServerStats`; `Spec 192` añade `ApiSymbolLineage` y `toApiSymbol()`.
- **Objetivo:** exponer capacidades semánticas sobre contratos maduros, no sobre hacks internos.
- **Pendiente exacto:**
  - estabilizar contratos mínimos;
  - no exponer estructuras internas mutables;
  - versionar API pública;
  - documentar consumo por agentes/tools.
- **Cierre:** API estable y mínima, con modelos explicables.

---

# L3 — Validación fuerte, salud interna y excelencia operativa

## B030 — Validación sobre workspace grande real
- **Estado:** Open
- **Track:** validación
- **Depende de:** B141, B155
- **Objetivo:** validar sobre PFC 2025 Solution/Workspace y corpus legacy.
- **Cierre:** no solo fixtures sintéticos; corpus reales integrados en el ciclo.

## B068 — Calibración real del performance budget
- **Estado:** Open
- **Track:** performance
- **Depende de:** B030
- **Objetivo:** convertir budgets teóricos en budgets medidos.
- **Cierre:** budgets ajustados sobre datos reales.

## B069 — Fixtures reales permanentes de PFC/legacy
- **Estado:** Open
- **Track:** regresión
- **Depende de:** B030
- **Objetivo:** fixtures permanentes y mantenidos.
- **Cierre:** corpus representativos integrados en la regresión.

## B070 — Memory budgets de caché e índice
- **Estado:** Open
- **Track:** escala
- **Depende de:** B164
- **Objetivo:** límites explícitos de memoria y métricas por capa.
- **Cierre:** budgets definidos, medidos y vigilados.

## B063 — Diagnostics snapshot agrupado
- **Estado:** Open
- **Track:** calidad interna
- **Depende de:** B151
- **Estado previo:** `buildDiagnosticsSnapshot` base.
- **Objetivo:** snapshots diagnósticos más profesionales por proyecto/objeto.
- **Pendiente exacto:**
  - agrupar por proyecto/objeto;
  - ligar a snapshot/document version;
  - integrar con export diagnostics.
- **Cierre:** diagnósticos agrupados y consistentes con snapshots/document versions.

## B118 — Integration test matrix del plugin
- **Estado:** Open
- **Track:** QA
- **Depende de:** B030, B155
- **Objetivo:** lifecycle real del plugin y workspaces reales.
- **Cierre:** activation + client/server + Solution + Workspace + disable-extensions + VS Code test tooling.

## B119 — Performance regression suite
- **Estado:** Open
- **Track:** QA/perf
- **Depende de:** B068
- **Objetivo:** medir activación, primer hover, primer diagnostics, discovery, warm/cold index.
- **Cierre:** suite estable de regresión de rendimiento.

## B161 — Golden tests semánticos end-to-end
- **Estado:** Open
- **Track:** QA semántica
- **Depende de:** B156, B157, B030
- **Objetivo:** contratos visibles de comportamiento semántico.
- **Cierre:** hover/definition/references/rename eligibility/readiness cubiertos por goldens.

## B162 — Reconciliación parser / symbol model / salida LSP
- **Estado:** Open
- **Track:** consistencia interna
- **Depende de:** B151, B156
- **Objetivo:** detectar incoherencias internas antes de publicarlas.
- **Cierre:** aserciones internas útiles y reportes claros de inconsistencias.

## B163 — Semantic work journal / event log del motor
- **Estado:** Open
- **Track:** observabilidad
- **Depende de:** B126
- **Objetivo:** event log técnico para tuning y debugging.
- **Cierre:** journal exportable de trabajo del motor con fases, hits/misses, invalidaciones y latencias.

## B175 — Repro packs automáticos para bugs semánticos
- **Estado:** Open
- **Track:** mantenibilidad
- **Depende de:** B157, B163, B162
- **Objetivo:** generar pequeños paquetes de repro cuando falle el motor.
- **Cierre:** un bug semántico complejo puede reproducirse sin reconstruir contexto manualmente.

## B176 — Health checker interno del motor
- **Estado:** Open
- **Track:** salud interna
- **Depende de:** B126, B162, B172
- **Estado reciente:** `Spec 171` amplía `showStats` con caches, readiness, persistence, projectModel y última queryTrace.
- **Objetivo:** revisar coherencia de caches, índices, readiness y snapshots.
- **Pendiente exacto:**
  - checks formales por capa;
  - severidad/warnings/errors;
  - export machine-readable;
  - integración con status y event log.
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
- **Cierre:** safe-mode mejorado sin abrir aún la superficie avanzada completa.

## B041 — Catálogo y navegación de DataWindow
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** B117, B139
- **Objetivo:** DataWindow/DataStore como entidades semánticas de primer nivel.
- **Cierre:** navegación y catálogo básicos integrados.

## B042 — Soporte avanzado de DataWindow
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** B041
- **Objetivo:** expresiones, propiedades avanzadas, funciones, relaciones con DataStore.
- **Cierre:** soporte ampliado y estable.

## B081 — Inteligencia de DataWindow y acceso a `.Object`
- **Estado:** Open
- **Track:** PB ecosystem
- **Depende de:** B042
- **Objetivo:** cubrir `dw_1.Object`.
- **Cierre:** navegación/validación seguras en acceso a `.Object`.

## B043 — Integración con PBAutoBuild
- **Estado:** Open
- **Track:** build
- **Depende de:** B141
- **Objetivo:** build moderno oficial.
- **Guía / referencia `plugin_old`:** `pbAutoBuildService.ts`, `powerbuilder/build/*`.
- **Ajuste:** debe apoyarse en B181, B182 y B183; no debe parsear logs directamente si B184 existe; debe delegar comandos de usuario a B185.
- **Cierre:** lanzar build, validar entorno, capturar errores y alimentar health del workspace.

## B083 — Integración avanzada con PBAutoBuild
- **Estado:** Open
- **Track:** build
- **Depende de:** B043
- **Objetivo:** Problems panel, reporting y validación avanzada.
- **Ajuste:** queda absorbida funcionalmente por B184, B185, B186 y B187, salvo que se mantenga como épica padre.
- **Cierre:** integración madura con reporting profesional.

## B044 — Estado de build y salud del workspace
- **Estado:** Open
- **Track:** build/health
- **Depende de:** B043
- **Objetivo:** detectar readiness de compilación y problemas de configuración.
- **Ajuste:** debe consumir B187 para build moderno y B194 cuando ORCA esté disponible.
- **Cierre:** el usuario entiende si el proyecto está listo para compilar.

## B048 — Integración con OrcaScript / ORCA
- **Estado:** Open
- **Track:** legacy ecosystem
- **Depende de:** B043, B083
- **Objetivo:** soporte legacy tras cerrar camino moderno.
- **Ajuste:** debe dividirse en B188-B196; el primer corte debe ser read-only; import/compile queda separado y protegido.
- **Cierre:** compatibilidad con automatización clásica sin contaminar la ruta principal.

## B045 — Auditoría de arquitectura y convenciones
- **Estado:** Open
- **Track:** auditoría de proyecto
- **Depende de:** motor semántico maduro
- **Objetivo:** revisar consistencia técnica y convenciones sobre base semántica fuerte.
- **Cierre:** auditorías fiables y no superficiales.

## B110 — Exportación de superficie de automatización
- **Estado:** Open
- **Track:** automation
- **Depende de:** B109, B172
- **Objetivo:** exportar manifiestos JSON/YAML del workspace.
- **Cierre:** consumible por CI/agentes/auditorías.

## B111 — Árbol global de diagnósticos exportable
- **Estado:** Open
- **Track:** automation
- **Depende de:** B063, B109
- **Objetivo:** exportar diagnóstico jerárquico machine-readable.
- **Cierre:** vista global exportable y estable.

## B132 — Gobernanza del catálogo oficial + dataset curado
- **Estado:** Open
- **Track:** knowledge governance
- **Depende de:** B109
- **Objetivo:** separar catálogo oficial y dataset curado.
- **Estado previo:** reporte de consistencia parcial.
- **Pendiente exacto:**
  - trazabilidad/versionado de catálogo oficial;
  - separación clara de dataset curado;
  - validación automatizada y reporte de consistencia.
- **Cierre:** trazabilidad/versionado/validación de ambas capas.

## B140 — Language Model Tools
- **Estado:** Open
- **Track:** AI integration
- **Depende de:** B109, B157
- **Objetivo:** exponer tools consumibles por Copilot Chat/otros agentes.
- **Cierre:** tools semánticas sobre contratos maduros, no sobre endpoints frágiles.

## B142 — Auto-build service y build target utils
- **Estado:** Open
- **Track:** build
- **Depende de:** B043, B141
- **Objetivo:** detection de target y auto-build out-of-process.
- **Ajuste:** debe ser base compartida para B183, B185, B186 y B187; debe exponer utilidades reutilizables para detectar target/build profile sin depender de ORCA.
- **Cierre:** build utils estables reutilizables por otras integraciones.

---

# L4-final — Build moderno y automatización legacy

## Base técnica asumida

- `PBAutoBuild250.exe` es la ruta moderna para ejecutar builds desde línea de comandos usando archivos JSON de build; admite ejecución con `/f`, `/l` y `/le` para indicar build file, log general y log de errores. citeturn13search58
- Una PBL es binaria y guarda los objetos PowerBuilder en dos formas: source textual y forma compilada binaria; el Library Painter permite listar, borrar, mover, compilar, exportar e importar objetos. citeturn13search59
- El source exportado puede incluir cabeceras como `$PBExportHeader$...` y `$PBExportComments$...`; ORCA puede exportar a fichero o buffer, controlar formato/encoding y decidir si incluye cabeceras o componente binario. citeturn13search61
- ORCA puede importar source textual, compilarlo, regenerar entradas existentes y hacer rebuild de aplicación; si una importación no compila, el objeto no se importa. citeturn13search60

## Reglas específicas

- PBAutoBuild es la ruta preferente para build moderno, CI/CD, PowerClient y PowerServer.
- ORCA es una ruta legacy opcional para PBL, export/import, regenerate y rebuild.
- ORCA nunca debe participar en el hot path de `hover`, `completion`, `definition`, `signatureHelp`, `references`, `semanticTokens` o `diagnostics` interactivos.
- Toda operación ORCA debe ejecutarse out-of-process, con timeout, logging, health status y errores normalizados.
- El primer soporte ORCA debe ser read-only: discovery de PBL y export a staging.
- Toda escritura sobre PBL requiere acción explícita del usuario, preflight, backup/checkpoint, compile result, rollback documentado y log completo.
- El source plain-text real del workspace siempre tiene prioridad sobre source exportado desde ORCA.
- Todo source exportado desde PBL debe marcarse con provenance `orca-staging` y no debe confundirse con source real versionado.

## B181 — PBAutoBuild capability detection
- **Estado:** Open
- **Track:** build / tooling detection
- **Depende de:** B043, B141
- **Desbloquea:** B182, B183, B187
- **Objetivo:** detectar de forma fiable si `PBAutoBuild250.exe` está disponible, qué versión/capacidades ofrece y si el entorno puede ejecutar builds desde VS Code.
- **Debe contener:** ruta configurable, autodetección, validación de ejecutable/versión, detección de runtime/toolkit, diagnóstico claro y salida en stats/health.
- **Cierre:** el plugin informa si PBAutoBuild está disponible y qué puede hacer, sin bloquear ni lanzar build.

## B182 — PBAutoBuild build-file discovery and validation
- **Estado:** Open
- **Track:** build / project model
- **Depende de:** B181, B141
- **Desbloquea:** B183, B185, B187
- **Objetivo:** descubrir y validar JSON de PBAutoBuild dentro del workspace.
- **Debe contener:** discovery de JSON, identificación de `MetaInfo`, `BuildPlan`, `SourceControl`, `BuildJob`, `Projects`, `Libraries`, clasificación de tipo de proyecto, validación de rutas y detección de secretos.
- **Cierre:** el plugin sabe qué build files existen, qué proyecto representan, qué librerías implican y si son utilizables.

## B183 — PBAutoBuild command runner out-of-process
- **Estado:** Open
- **Track:** build / execution
- **Depende de:** B181, B182, B126
- **Desbloquea:** B184, B185, B187
- **Objetivo:** ejecutar PBAutoBuild desde VS Code sin bloquear Extension Host ni LSP.
- **Debe contener:** ejecución out-of-process, progress UI, timeout, cancelación si procede, stdout/stderr, logs `/l` y `/le`, protección contra builds concurrentes e integración con event journal.
- **Cierre:** VS Code puede lanzar un build PBAutoBuild observable, cancelable y seguro.

## B184 — PBAutoBuild log parser and Problems Panel integration
- **Estado:** Open
- **Track:** build / diagnostics
- **Depende de:** B183, B063
- **Desbloquea:** B185, B187
- **Objetivo:** convertir logs de build/error en diagnósticos navegables cuando sea posible.
- **Debe contener:** parser de logs, mapping target/project/library/object, diagnostics en Problems Panel, degradación segura si solo hay PBL y resumen en status/health.
- **Cierre:** los errores de build aparecen en VS Code como problemas accionables, sin inventar ubicaciones si no hay source fiable.

## B185 — PBAutoBuild build profiles, commands and status UX
- **Estado:** Open
- **Track:** build / UX
- **Depende de:** B183, B184, B107
- **Desbloquea:** B186, B187
- **Objetivo:** ofrecer comandos de usuario para build frecuente desde VS Code.
- **Debe contener:** comandos de build selected JSON, build current project, full rebuild/deploy si procede, selección de perfil, historial, status bar y acceso a logs.
- **Cierre:** el usuario puede ejecutar builds habituales sin recordar comandos manuales.

## B186 — PBAutoBuild CI/CD helper export
- **Estado:** Open
- **Track:** build / automation
- **Depende de:** B185, B110
- **Desbloquea:** B140, B198
- **Objetivo:** generar ayudas reproducibles para CI/CD a partir de JSON detectados.
- **Debe contener:** comando reproducible, plantilla `.bat`, plantilla `.ps1`, plantilla CI genérica, sanitización de credenciales, validación de rutas y manifest machine-readable.
- **Cierre:** el plugin puede ayudar a llevar un build local validado a CI/CD sin acoplarse a un proveedor concreto.

## B187 — Unified build health model
- **Estado:** Open
- **Track:** build / health
- **Depende de:** B181, B182, B184, B176
- **Desbloquea:** B194, B198
- **Objetivo:** unificar estado de build moderno en el health checker.
- **Debe contener:** disponibilidad PBAutoBuild, JSON válidos/invalidos, último build, último error, logs, warnings de secretos, readiness de build y export JSON.
- **Cierre:** el usuario entiende si el workspace está listo para build moderno desde VS Code.

## B188 — ORCA adapter architecture
- **Estado:** Open
- **Track:** legacy ecosystem / ORCA
- **Depende de:** B141, B109, B176
- **Desbloquea:** B189, B190, B191, B193, B194
- **Objetivo:** definir adaptador ORCA opcional, out-of-process y totalmente separado del hot path LSP.
- **Debe contener:** worker externo, contrato JSON-RPC interno, detección de capabilities, timeouts, cancelación/kill controlado, logging, normalización de errores y feature flag `powerbuilder.orca.enabled`.
- **Cierre:** existe skeleton operativo para invocar ORCA sin acoplarlo al core semántico.

## B189 — ORCA capability detection and environment validation
- **Estado:** Open
- **Track:** legacy ecosystem / ORCA
- **Depende de:** B188
- **Desbloquea:** B190, B191
- **Objetivo:** detectar si ORCA puede usarse en la máquina y validar entorno/versiones antes de tocar PBL.
- **Debe contener:** detección de instalación, versión PowerBuilder compatible, runtime/librerías requeridas, workspace/target soportado, modo disabled, mensajes accionables y health status.
- **Cierre:** la ausencia de ORCA no rompe el plugin y queda explicada claramente.

## B190 — PBL library graph and directory discovery read-only
- **Estado:** Open
- **Track:** legacy ecosystem / PBL discovery
- **Depende de:** B188, B189, B141
- **Desbloquea:** B191, B192
- **Objetivo:** listar PBLs y objetos de forma read-only e integrarlos en el project model.
- **Debe contener:** discovery de PBLs desde target/liblist, objetos por PBL, tipo, metadata, orden de librerías, duplicados, object map e integración con B141.
- **Cierre:** el plugin puede entender la topología PBL legacy sin modificar nada.

## B191 — ORCA export to staging source
- **Estado:** Open
- **Track:** legacy ecosystem / export
- **Depende de:** B190, B155
- **Desbloquea:** B192, B193
- **Objetivo:** exportar objetos desde PBL a una carpeta staging indexable.
- **Debe contener:** carpeta `.hiberus-powersyntax/orca-export/`, export incremental, control de encoding, manejo de headers, object map, provenance `orca-staging`, read-only por defecto, recovery y progreso observable.
- **Cierre:** un proyecto PBL-only puede ser analizado desde VS Code mediante source exportado sin modificar la PBL.

## B192 — ORCA staging provenance and source priority
- **Estado:** Open
- **Track:** legacy ecosystem / source model
- **Depende de:** B172, B190, B191
- **Desbloquea:** B193, B194
- **Objetivo:** evitar confusión entre source real del workspace y source exportado desde PBL.
- **Debe contener:** `sourceOrigin = workspace-source | orca-staging | generated | unknown`, prioridad explícita, lineage PBL/staging, warnings por duplicidad e invalidación diferenciada.
- **Cierre:** serving y diagnósticos explican de dónde viene cada símbolo y no mezclan source staging con source real.

## B193 — ORCA import and compile controlled
- **Estado:** Open
- **Track:** legacy ecosystem / import
- **Depende de:** B191, B192, B184
- **Desbloquea:** B194, B196
- **Objetivo:** importar cambios a PBL de forma explícita, controlada y compilada.
- **Debe contener:** comando explícito, preflight, backup/checkpoint, confirmación, validación de provenance, compile result, errores a Problems Panel, rollback documentado y log completo.
- **Cierre:** el usuario puede importar a PBL un objeto editado desde VS Code con seguridad razonable y feedback claro.

## B194 — ORCA regenerate and rebuild commands
- **Estado:** Open
- **Track:** legacy ecosystem / build
- **Depende de:** B193, B176
- **Desbloquea:** B195, B197
- **Objetivo:** exponer comandos legacy de regenerate/rebuild vía ORCA sin bloquear el core.
- **Debe contener:** regenerate current object, regenerate selected object, rebuild application, progress UI, timeout, logs, errores normalizados, protección de concurrencia y health integration.
- **Cierre:** operaciones legacy de regeneración/rebuild se pueden lanzar desde VS Code de forma observable.

## B195 — ORCA executable/PBD operations behind feature flag
- **Estado:** Open
- **Track:** legacy ecosystem / packaging
- **Depende de:** B194
- **Desbloquea:** B198
- **Objetivo:** evaluar si conviene exponer creación de ejecutables/PBD/DLL vía ORCA o descartarlo frente a PBAutoBuild.
- **Debe contener:** análisis de viabilidad, feature flag experimental, validación fuerte, comandos experimentales si procede y decisión explícita.
- **Cierre:** decisión documentada sin contaminar la ruta moderna de PBAutoBuild.

## B196 — PBL/source synchronization safety
- **Estado:** Open
- **Track:** legacy ecosystem / safety
- **Depende de:** B192, B193
- **Desbloquea:** B197
- **Objetivo:** proteger al usuario de inconsistencias entre PBL, staging y source real.
- **Debe contener:** fingerprints PBL export/import, detección de staging obsoleto, detección de source real más reciente que staging, warnings antes de import y bloqueo de import si el source no corresponde.
- **Cierre:** el plugin evita importar source equivocado o desactualizado en PBL.

## B197 — Build and ORCA event journal
- **Estado:** Open
- **Track:** observability / event log
- **Depende de:** B163, B183, B194
- **Desbloquea:** B198
- **Objetivo:** registrar eventos técnicos de build y ORCA para diagnóstico y soporte.
- **Debe contener:** eventos PBAutoBuild, eventos ORCA, correlation id, export de journal, sanitización de secretos e integración con repro packs si procede.
- **Cierre:** cualquier fallo de build/ORCA puede diagnosticarse sin reconstruir manualmente el contexto.

## B198 — Build/ORCA documentation and troubleshooting
- **Estado:** Open
- **Track:** docs / operability
- **Depende de:** B186, B187, B194, B197
- **Desbloquea:** —
- **Objetivo:** documentar claramente el flujo moderno PBAutoBuild y el flujo legacy ORCA.
- **Debe contener:** guía PBAutoBuild, guía JSON build, Problems Panel, ORCA read-only, ORCA export staging, ORCA import seguro, explicación PBL/source/export headers, troubleshooting, límites conocidos y recomendaciones CI/CD.
- **Cierre:** README/docs explican cuándo usar PBAutoBuild, cuándo usar ORCA y qué riesgos existen.

---

# 7. Current execution focus

## Fase 1 — Cerrar atomicidad + incrementalidad fina

**Orden corregido:**
1. B122
2. B125
3. B134
4. B158
5. B159

## Fase 2 — Persistencia robusta

**Orden corregido:**
1. B141A
2. B155
3. B167
4. B168
5. B071
6. B164

## Fase 3 — Query engine y serving profesional

**Orden corregido:**
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

**Orden corregido:**
1. B030
2. B069
3. B068
4. B119
5. B162
6. B176
7. B063
8. B118
9. B161
10. B163
11. B175
12. B070

## Fase 5 — Especialización PowerBuilder y automatización

Ejecutar solo después de cerrar bien L0-L3, salvo investigación preparatoria sin impacto en core.

**Orden recomendado:**
1. B117
2. B139
3. B041
4. B042
5. B081
6. B043
7. B142
8. B083
9. B044
10. B110
11. B111
12. B132
13. B140
14. B045
15. B048
16. B181-B198 como bloque final L4-final

---

# 8. Carril transversal de validación temprana

Aunque L3 se ejecute formalmente después de L2, estos ítems pueden avanzar en modo preparatorio si no bloquean L0/L1:

- B030 — Validación sobre workspace grande real.
- B069 — Fixtures reales permanentes de PFC/legacy.
- B068 — Calibración inicial de performance budget.
- B119 — Performance regression suite inicial.

Este trabajo no debe introducir features nuevas ni condicionar el diseño core salvo que detecte un problema bloqueante de rendimiento, memoria o arquitectura.

---

# 9. Regla LEAN

Toda spec debe entregar valor verificable en el menor corte posible.

Se prohíbe introducir abstracciones genéricas si no:

- reducen latencia;
- mejoran incrementalidad;
- aumentan seguridad semántica;
- simplifican mantenimiento;
- habilitan una feature prioritaria;
- o mejoran observabilidad/persistencia real.

Preferir contratos pequeños, medibles y testeables.

---

# 10. Backlog derivado

Registrar aquí cualquier deuda nueva detectada durante ejecución real, sin contaminar el orden maestro salvo que el hallazgo sea bloqueante de L0/L1.

## Deuda derivada sugerida

- Evaluar si `B083` debe convertirse en épica padre o eliminarse como duplicado funcional una vez añadidos `B181-B187`.
- Evaluar si `B048` debe convertirse en épica padre o eliminarse como duplicado funcional una vez añadidos `B188-B196`.
- Definir política oficial de almacenamiento de `.hiberus-powersyntax/orca-export/` en `.gitignore`.
- Definir si el staging ORCA puede editarse directamente o si debe abrirse siempre como readonly hasta `B193`.
- Definir matriz de soporte: PowerBuilder 2025 workspace/solution, target `.pbt`, PBL-only legacy y source plain-text.