# Prompt — Auditoría extensa de cache ultrarrápida, serving layer, indexing, legacy cleanup y escalabilidad 5.000+ archivos

> Prompt preparado para Copilot Agent / agente IA del repositorio.
>
> Objetivo: auditar en profundidad el modelo actual de cache/indexación/serving layer del plugin PowerBuilder 2025 para VS Code, determinar el mejor modelo target para el repo real, detectar código legacy o poco óptimo que engorda/ralentiza el sistema, aplicar quick fixes seguros si existen, y dejar en backlog todas las specs necesarias para llegar al modelo target.

---

# AUDITORÍA EXTENSA — Ultra-fast Cache, Serving Layer, Indexing, Legacy Cleanup y Modelo Target

Actúa como arquitecto senior de VS Code extensions, LSP, TypeScript, caches de baja latencia, profiling, indexing incremental y language servers para codebases legacy grandes.

## Contexto

Estamos desarrollando un plugin profesional de PowerBuilder 2025 para VS Code.

Meta maestra:

> El plugin debe descubrir e indexar muy rápido sin bloquear.

El workspace actual usado para detectar problemas tiene aproximadamente **800 archivos**, pero el diseño final debe soportar proyectos mucho más masivos, incluyendo workspaces reales con **5.000+ archivos**.

No diseñes pensando solo en el caso actual de 800 archivos. Toda decisión de cache, indexación, persistencia, memoria, journal, serving layer, diagnostics y hover debe escalar de forma razonable a 5.000+ archivos.

El plugin debe soportar:

- PowerBuilder 2025 Solution.
- `.pbproj`.
- carpetas exportadas desde PBL.
- rutas con espacios, por ejemplo `pfc libs/...`.
- PFC/STD legacy.
- DataWindow safe mode.
- catálogo built-in/system functions.
- hover.
- diagnostics.
- Object Explorer.
- Current Object Context.
- Diagnostics Explainability.
- localización EN/ES como overlay sin duplicar símbolos reales.

---

## Documentos que debes revisar antes de auditar

Revisa obligatoriamente:

- `docs/architecture-implementation-map.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/performance-budget.md`
- `docs/testing.md`
- `docs/troubleshooting.md`
- `docs/developer-workflows.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/done-log.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`

Si algún documento no existe, no lo inventes. Registra el gap.

Contrasta siempre documentación contra código real.

---

## Referencias técnicas a tener en cuenta

Ten en cuenta estos principios modernos:

- En VS Code/LSP, el análisis pesado debe vivir fuera del hot path del editor; parsing, AST y análisis estático pueden consumir CPU/memoria y deben proteger la experiencia interactiva.
- LSP permite cancelación de requests y ejecución concurrente cuando no afecta a la corrección; úsalo para hover, definition, completion y diagnostics obsoletos.
- VS Code recomienda lazy activation y activar solo cuando la funcionalidad se necesita.
- Para caches rápidas, priorizar estructuras O(1), por ejemplo LRU con `Map + doubly linked list`.
- En language servers grandes se usan caches multicapa, lazy computation, document state `WITH_CONTENT/WITHOUT_CONTENT`, persistent cache compacta, journal con compactación y serialización por documento.
- Usa profiling real: CPU profiler, memory profiler, performance marks, métricas propias y health dashboard.

---

## Problema observado en runtime

Métricas reales observadas:

```txt
Readiness: discovering · discovery
Resumen proyecto: workspace — descubriendo
Workspace: solution · 826 archivos
Scheduler: near 0 · background 0 · interactiveBusy false
Indexer: idle · 0/0
Cachés: analysis 4/256 · serving 0/256 · hit 0% (0/155) · documents 826 · hot 1/128
Persistencia: checkpoint · journal
Memoria: error · 83.3 MiB / 179.0 MiB · document cache 114% · heap 298.5 MiB
Salud: error · 3 warning · 1 error · 0 info
Journal: 50/10537 eventos · health/stats-snapshot
```

También se observó:

```txt
cache persistida fuera de budget (380455762/33554432)
document cache superó su budget estimado
serving cache con hit ratio bajo (0/85)
Último query: hover
```

Síntomas:

- Indexación muy lenta.
- Hover muy lento, incluso en built-ins/system functions como `UpperBound`.
- `serving cache` en `0/256`.
- Hit ratio de serving cache en `0%`.
- `documents 826`, aparentemente manteniendo demasiado en memoria.
- `document cache 114%`.
- Persistencia fuera de budget.
- Journal con más de 10k eventos.
- Workspace queda en `discovering` aunque `indexer` está `idle 0/0`.
- Object Explorer / Current Object Context / Diagnostics Explainability no funcionan.
- Ancestor resolution falla en casos donde el tipo sí existe.
- Hay falsos positivos del parser/lexer que pueden contaminar analysis cache y diagnostics.

---

## Objetivo principal

Realiza una auditoría MUY EXTENSA para determinar:

1. Qué modelo de cache/indexación/serving layer es el mejor para este repo real.
2. Qué arquitectura target debe tener el plugin para soportar 800 archivos y también 5.000+ archivos.
3. Qué partes actuales están mal conectadas, sobredimensionadas, duplicadas o lentas.
4. Qué código legacy, muerto, duplicado o poco óptimo está haciendo engordar o ralentizar el sistema.
5. Qué quick wins seguros pueden arreglarse inmediatamente.
6. Qué specs deben añadirse al backlog para alcanzar el modelo target.

---

## Regla importante sobre implementación

Esta es una auditoría, pero puedes corregir quick wins si cumplen TODAS estas condiciones:

- Son errores claros y localizados.
- No cambian arquitectura pública.
- No rompen compatibilidad.
- Tienen bajo riesgo.
- Tienen test o validación directa.
- No requieren decisiones de diseño abiertas.
- No introducen full scans ni deuda nueva.
- Actualizan documentación afectada si corresponde.

Ejemplos de quick wins permitidos:

- Métrica mal conectada.
- Cache hit/miss no registrado.
- Provider no registrado por orden de activación claro.
- Limpieza de código muerto evidente.
- Import no usado.
- Duplicación trivial.
- Bug pequeño de key canonicalization si es evidente y testeable.
- Compactación no llamada por condición incorrecta evidente.
- Firma de hover que no corta en `;` si el fix es local y testeable.

Si algo requiere diseño, no lo implementes: déjalo como spec en backlog.

---

## Preguntas obligatorias de la auditoría

Responde con evidencia de código real:

1. ¿Por qué `serving cache` no se usa?
2. ¿Por qué hit ratio es 0%?
3. ¿Hover pasa realmente por cache?
4. ¿Hover built-in/system tiene fast path?
5. ¿Hover built-in depende indebidamente de workspace discovery?
6. ¿Hay scans de workspace o catálogo en hover?
7. ¿Las keys de cache son estables?
8. ¿Las invalidaciones son excesivas?
9. ¿Se cachean resultados negativos?
10. ¿El locale EN/ES forma parte correcta de las keys?
11. ¿El catálogo built-in se importa de forma pesada?
12. ¿Se recalcula markdown/localization/enrichment en cada hover?
13. ¿Por qué hay `documents 826`?
14. ¿Qué guarda exactamente document cache?
15. ¿Guarda texto completo de documentos cerrados?
16. ¿Existe estado `WITH_CONTENT/WITHOUT_CONTENT` o equivalente?
17. ¿Hay eviction real?
18. ¿Hay duplicación entre document cache, analysis cache, hot cache y persistence?
19. ¿Por qué persistent cache supera budget?
20. ¿Qué payloads guarda el journal?
21. ¿Por qué el journal crece hasta 10k eventos?
22. ¿Hay compactación automática?
23. ¿Discovery tiene state machine correcta?
24. ¿Por qué queda `discovering` con `indexer idle 0/0`?
25. ¿Build/ORCA ausentes bloquean indebidamente readiness?
26. ¿Object Explorer depende de readiness para registrar provider?
27. ¿TreeDataProviders se registran siempre?
28. ¿Hay servicios mezclando UI/cache/discovery/diagnostics?
29. ¿Hay código legacy que ya no debería ejecutarse?
30. ¿Hay código duplicado entre pipelines viejos y nuevos?
31. ¿Hay imports o módulos obsoletos que engordan startup?
32. ¿Hay JSON parse, filesystem reads o full scans en hot paths?
33. ¿Qué diseño soportaría 5.000+ archivos sin degradarse?
34. ¿Qué specs exactas hay que añadir al backlog?

---

## Escalabilidad obligatoria: 5.000+ archivos

Diseña y evalúa con estos escenarios:

```txt
S1: workspace pequeño: 100-300 archivos
S2: workspace medio: 800-1.500 archivos
S3: workspace grande: 5.000+ archivos
S4: workspace masivo con PFC/STD + DataWindow + solution + PBL folders
```

Para cada escenario, estima o define:

- estrategia de discovery;
- estrategia de indexación incremental;
- memoria máxima aceptable;
- qué se mantiene en RAM;
- qué se persiste;
- qué se calcula lazy;
- qué se precarga;
- qué se descarta;
- cuándo se compacta;
- cuándo se degrada a `degraded-ready`;
- qué operaciones siguen siendo instantáneas.

No aceptes diseños que solo funcionan para 800 archivos.

---

## Hipótesis a validar

### H1 — Serving cache desconectada del hover real

Validar:

- call graph de hover.
- lectura de serving cache.
- escritura de serving cache.
- key usada.
- invalidación.
- métricas hit/miss.
- si hover usa otro pipeline paralelo.

### H2 — Built-ins/system sin fast path

Validar:

- si built-ins están precargados.
- si `UpperBound`, `Len`, `Integer`, `String`, etc. se resuelven sin workspace.
- si el catálogo system se consulta antes de símbolos workspace.
- si localization overlay ralentiza.
- si markdown render se cachea.

### H3 — Document cache demasiado pesada

Validar:

- contenido de cada entrada.
- texto completo.
- AST.
- tokens.
- line maps.
- diagnostics.
- symbol tree.
- si documentos cerrados liberan contenido.
- si hay eviction real.
- si hay estimación de bytes fiable.

### H4 — Persistence/journal fuera de control

Validar:

- eventos repetidos.
- snapshots de health excesivos.
- payloads grandes.
- falta de compactación.
- checkpoint incompleto.
- budget aplicado tarde.
- escritura durante navegación normal.

### H5 — Readiness/discovery inconsistente

Validar:

- estados posibles.
- transiciones.
- bloqueos.
- readiness con indexer idle.
- reason codes.
- relación con build/ORCA.
- relación con Object Explorer.

### H6 — Hot paths con full scans

Validar:

- hover.
- definition.
- references.
- signatureHelp.
- completion.
- current object context.
- diagnostics explainability.
- object explorer refresh.

### H7 — Código legacy o duplicado ralentizando

Validar:

- módulos antiguos todavía importados.
- pipelines duplicados.
- registries duplicados.
- caches antiguas no usadas.
- adapters temporales permanentes.
- fallback legacy ejecutándose siempre.
- code paths muertos.
- imports pesados en activation.
- servicios monolíticos.
- código de debug/profiling accidentalmente activo.
- logs excesivos.
- eventos demasiado frecuentes.

---

## Modelo target que debes evaluar

No impongas este modelo sin auditar. Úsalo como referencia y decide si es el mejor para el repo.

### L0 — Static Catalog Fast Path

Para built-ins/system/global functions/types:

- precarga mínima.
- lookup O(1).
- no depende de workspace.
- no lee disco en hover.
- no escanea catálogo completo.
- cachea hover markdown por locale.
- invalidación por catalogEpoch/locale.

### L1 — Interactive Hot Cache

Para requests interactivos:

- hover;
- definition;
- signatureHelp;
- completion;
- current object context.

Requisitos:

- O(1) get/set.
- LRU por entradas y bytes estimados.
- key canónica.
- singleflight.
- cancellation.
- negative cache.
- TTL corto opcional.
- metrics hit/miss/eviction.

### L2 — Serving Cache

Objetos listos para UI/LSP:

- hover markdown.
- definition target.
- compact symbol summary.
- explainability payload.
- object context.

Debe evitar recalcular:

- localization overlay;
- markdown;
- enrichment;
- symbol summaries;
- reason codes.

### L3 — Analysis Cache

Facts semánticos:

- parse summary.
- declarations.
- signatures.
- inheritance edges.
- source origins.
- diagnostics facts.
- DataWindow safe references.
- lightweight token facts.

No debe guardar texto completo salvo documentos abiertos.

### L4 — Persistent Workspace Cache

Persistencia compacta:

- workspace hash.
- pbproj topology.
- normalized library paths.
- source manifest.
- symbol index.
- inheritance graph.
- file checksums.
- catalog epochs.
- checkpoint compacto.
- journal pequeño y compactable.

### L5 — Cold archive / optional

Solo si aplica:

- datos caros no interactivos.
- reports offline.
- no se carga en activation.
- no participa en hover.

---

## Política de keys canónicas

Audita y propone keys para:

- hover built-in;
- hover workspace symbol;
- definition;
- references;
- diagnostics;
- object context;
- unresolved symbol;
- project topology;
- document facts.

Cada key debe considerar si aplica:

- workspaceId;
- canonical URI;
- file checksum;
- document version;
- symbol identity;
- position bucket;
- query kind;
- locale;
- catalogEpoch;
- indexEpoch;
- settingsEpoch;
- parserVersion;
- pbproj/library path epoch.

---

## Política de invalidación

Define invalidación para:

- cambio de documento abierto;
- cierre de documento;
- cambio en disco;
- cambio en `.pbproj`;
- cambio de library path;
- cambio de locale;
- cambio de settings;
- cambio de generated/manual catalog;
- cambio de parser version;
- cambio de workspace root;
- compactación de journal;
- rebuild parcial;
- rebuild total.

---

## Budgets mínimos esperados

Audita contra estos objetivos o propón mejores:

```txt
Hover built-in/system: < 10 ms p95, ideal < 3 ms desde hot cache.
Hover workspace indexed: < 50 ms p95.
Definition indexed: < 50 ms p95.
Completion base: < 50 ms p95.
Object context actual file: < 100 ms p95.
No full workspace scan en hover/definition/signatureHelp.
Serving cache hit ratio tras navegación normal: > 60%.
Document cache: no mantener texto completo de documentos cerrados.
Persistent cache: dentro de budget o compactación automática.
Journal: no crecimiento indefinido durante navegación normal.
Discovery: no permanecer en discovering si scheduler/indexer están idle.
```

Para 5.000+ archivos, define budgets específicos:

```txt
Initial discovery visible feedback: < 2 s.
Ready/degraded-ready inicial útil: objetivo razonable según hardware, documentar.
Hover built-in: igual de rápido que en 800 archivos.
Hover indexed workspace: no debe escalar linealmente con número total de archivos.
Memory: debe tener budget por archivo y límite global.
Persistent cache: debe ser proporcional a facts compactos, no a texto completo.
```

---

## Instrumentación requerida

Audita y propone/añade métricas:

```txt
hover.totalMs
hover.cacheLookupMs
hover.catalogLookupMs
hover.symbolResolveMs
hover.markdownRenderMs
hover.cacheHit
hover.cacheLayer
hover.cancelled
hover.singleflightJoined

cache.hot.entries
cache.hot.bytesEstimated
cache.hot.hit
cache.hot.miss
cache.hot.eviction

cache.serving.entries
cache.serving.bytesEstimated
cache.serving.hit
cache.serving.miss
cache.serving.eviction
cache.serving.invalidated

cache.analysis.entries
cache.analysis.bytesEstimated
cache.analysis.hit
cache.analysis.miss
cache.analysis.eviction

cache.document.entries
cache.document.openDocuments
cache.document.closedDocumentsWithContent
cache.document.bytesEstimated
cache.document.eviction

cache.persistence.bytes
cache.persistence.budget
cache.persistence.compactionNeeded

journal.events
journal.bytes
journal.compactionMs
journal.lastCompactionReason

index.readyState
index.pendingWork
index.epoch
index.filesIndexed
index.filesPending
index.filesSkipped
index.lastTransitionReason

workspace.discoveryMs
workspace.projectCount
workspace.libraryCount
workspace.rootCount
workspace.sourceOriginCount

legacy.modulesLoaded
legacy.fallbackInvocations
legacy.slowPathInvocations
```

Cada métrica debe tener:

- unidad;
- punto de captura;
- cardinalidad controlada;
- si aparece en health;
- si participa en performance gates;
- si se loguea solo en debug o siempre.

---

## Auditoría de código legacy/poco óptimo

Busca y clasifica:

### Código muerto

- exports no usados.
- imports no usados.
- classes no referenciadas.
- commands no registrados.
- providers no usados.
- adapters sin caller.

### Código legacy activo

- pipelines antiguos todavía en uso.
- fallback legacy usado en hot path.
- duplicación con implementación nueva.
- conversiones innecesarias.
- wrappers permanentes que solo añaden coste.
- bridges antiguos que deberían eliminarse.

### Código poco óptimo

- full scans.
- regex recreadas en cada request.
- JSON parse repetido.
- lectura de disco en hover.
- ordenaciones innecesarias.
- arrays grandes filtrados repetidamente.
- creación excesiva de objetos.
- serialización/deserialización en hot path.
- logs excesivos.
- eventos demasiado frecuentes.
- listeners acumulativos.
- caches sin eviction.
- maps que crecen indefinidamente.
- promises no cancelables.
- debounces inexistentes.

### Código que engorda activation/startup

- imports masivos en `extension.ts`.
- catálogo completo cargado antes de necesitarlo.
- reports cargados en activation.
- ORCA/PBAutoBuild cargados en flujo interactivo.
- webviews o providers pesados prematuros.
- servicios construidos eager sin necesidad.

Para cada hallazgo:

```md
- Archivo:
- Símbolo/módulo:
- Tipo: dead / legacy-active / inefficient / startup-heavy / hot-path-risk
- Evidencia:
- Impacto:
- Riesgo de eliminar/cambiar:
- Recomendación:
- Quick fix posible: sí/no
- Spec necesaria: sí/no
```

---

## Quick fixes permitidos

Si encuentras quick fixes seguros, aplícalos y valida.

Ejemplos:

- provider no registrado por falta de llamada obvia;
- métrica hit/miss no incrementada;
- typo en key de cache;
- import muerto;
- código muerto sin referencias;
- logging excesivo accidental;
- regex constante recreada en hot path;
- compactación no llamada por condición evidente;
- cache no consultada por error obvio de wiring;
- firma de hover que no corta en `;` si el fix es local y testeable.

Después de cada quick fix:

- añade test o validación;
- documenta el cambio;
- registra en informe;
- actualiza backlog/done-log solo si cumple política del repo.

No hagas refactors grandes dentro de esta auditoría. Déjalos como specs.

---

## Entregable obligatorio

Genera un informe Markdown con esta estructura exacta:

```md
# AUDIT — Ultra-fast Cache, Serving Layer, Indexing and Legacy Cleanup

## 1. Executive summary
- Estado global:
- Riesgo principal:
- Causa dominante probable:
- Modelo target recomendado:
- Primeros quick fixes aplicados:
- Primeras specs recomendadas:

## 2. Runtime evidence
Incluye métricas observadas y explicación.

## 3. Scalability assessment: 800 vs 5.000+ files
- Qué aguanta hoy:
- Qué no aguanta:
- Riesgos al escalar:
- Cambios imprescindibles:

## 4. Architecture map vs implementation
- Coincidencias:
- Desviaciones:
- Módulos documentados que no existen:
- Módulos reales no documentados:
- Responsabilidades duplicadas:
- Riesgos:

## 5. Current cache topology
Para cada cache real:
- nombre;
- archivo/clase;
- responsabilidad;
- key;
- value;
- size limit;
- invalidation;
- hit/miss metrics;
- eviction;
- persistence;
- problema detectado.

## 6. Hot path call graphs
Incluye call graphs textuales:
- hover built-in;
- hover workspace symbol;
- definition;
- diagnostics;
- Object Explorer;
- Current Object Context;
- discovery/indexing.

## 7. Root cause analysis
Para H1-H7:
- estado: confirmed / rejected / partial / unknown;
- evidencia;
- archivos;
- impacto;
- fix recomendado.

## 8. Legacy / inefficient code audit
Lista hallazgos:
- dead code;
- legacy-active;
- inefficient;
- startup-heavy;
- hot-path-risk.

## 9. Quick fixes applied
Si aplicaste fixes:
- archivo;
- cambio;
- motivo;
- test/validación;
- riesgo.

Si no aplicaste fixes:
- explicar por qué.

## 10. Recommended target model
Describe el mejor modelo para este repo:
- L0 Static Catalog Fast Path;
- L1 Interactive Hot Cache;
- L2 Serving Cache;
- L3 Analysis Cache;
- L4 Persistent Workspace Cache;
- L5 opcional si aplica.

Explica por qué este modelo es mejor que el actual.

## 11. Cache key canonicalization policy

## 12. Invalidation policy

## 13. Memory, persistence and journal budget

## 14. Instrumentation plan

## 15. Test and performance validation plan
Incluye:
- unit tests;
- integration tests;
- performance tests;
- smoke tests;
- corpus 800 files;
- corpus 5.000+ synthetic/real si existe;
- skip honesto si no existe corpus.

## 16. Backlog proposal
Añade TODAS las specs necesarias para llegar al modelo target.

Separar por:

### P0
Specs imprescindibles para corregir cache/hot path/discovery roto.

### P1
Specs para escalabilidad, memoria, persistence, instrumentation y views.

### P2
Specs para cleanup legacy, hardening, documentación y mejoras no críticas.

Cada spec debe tener:

- ID:
- Estado: Open
- Prioridad:
- Evidencia:
- Riesgo:
- Objetivo:
- Depends on:
- Acceptance criteria:
- Docs:
- Tests:

## 17. Documentation updates required
Lista documentos y cambios exactos.

## 18. Risks and non-goals
Qué NO debe hacerse todavía.

## 19. Final execution order
Lista ordenada de specs/acciones para ejecutar después de esta auditoría.
```

---

## Backlog obligatorio

Al terminar, actualiza `docs/backlog.md` con las specs necesarias, salvo que la política del repo indique que primero debe generarse propuesta.

Las specs deben cubrir, si aplican:

- serving cache wiring;
- built-in hover fast path;
- hot cache LRU O(1);
- key canonicalization;
- invalidation policy;
- document cache eviction;
- document state WITH_CONTENT/WITHOUT_CONTENT;
- persistent cache compaction;
- journal compaction;
- readiness/discovery state machine;
- cache metrics;
- performance gates;
- Object Explorer provider/data readiness;
- legacy cleanup;
- startup slimming;
- full scan removal;
- catalog import slimming;
- localization hover cache;
- negative cache;
- singleflight/cancellation;
- 5.000+ files scalability validation.

---

## Documentación obligatoria

Si se modifica backlog o se aplican quick fixes, revisar y actualizar cuando aplique:

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/performance-budget.md`
- `docs/architecture-implementation-map.md`
- `docs/testing.md`
- `docs/troubleshooting.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`

No duplicar información. Cada documento debe conservar su responsabilidad.

---

## Reglas estrictas

- No hagas cambios cosméticos.
- No cambies IDs de catálogo.
- No rompas compatibilidad con specs cerradas.
- No introduzcas full scans en hot paths.
- No uses ORCA/PBAutoBuild como dependencia para hover/indexing.
- No trates `.srd` como PowerScript normal.
- No dupliques documentación entre documentos.
- No diseñes solo para 800 archivos; diseña para 5.000+ archivos.
- No ocultes problemas de arquitectura.
- No mantengas código legacy si está probado que ralentiza o duplica el sistema: ponlo en backlog o elimínalo si es quick fix seguro.
- Si falta corpus real de 5.000+ archivos, documenta skip honesto y propone fixture/performance test.
- Si propones cache nueva, explica qué reemplaza o complementa.
- Si propones persistencia, debe tener budget y compactación.
- Si propones metrics, deben tener cardinalidad controlada.
- Si aplicas quick fixes, deben tener validación.
- Si no puedes validar algo, márcalo como unknown, no lo inventes.

---

## Resultado esperado

Quiero una auditoría extremadamente profunda y accionable que diga claramente:

1. cuál es el mejor modelo de cache/indexación para nuestro plugin;
2. qué está fallando ahora;
3. qué código legacy o poco óptimo está engordando/ralentizando;
4. qué quick fixes se han aplicado;
5. qué specs exactas quedan en backlog;
6. en qué orden ejecutarlas;
7. cómo garantizar que funcionará también con proyectos de 5.000+ archivos.

No termines con recomendaciones genéricas. Termina con un plan de acción ejecutable.
