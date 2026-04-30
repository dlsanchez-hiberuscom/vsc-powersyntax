# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento refleja el foco operativo **real e inmediato** del proyecto.

Debe responder siempre a estas preguntas:

- qué estamos cerrando ahora,
- por qué es prioritario,
- qué no debemos tocar salvo necesidad,
- cuál es el siguiente paso natural,
- y qué condición debe cumplirse para cambiar el foco.

Este documento no describe aspiraciones a largo plazo, sino el **trabajo inmediato y realista** que debe cerrarse antes de abrir nuevas capas del producto.

---

## 2. Meta maestra vigente

La meta no negociable del producto es:

> **descubrir e indexar muy rápido sin bloquear**

Todo el foco actual debe evaluarse contra esa meta.

Eso implica que el plugin debe mejorar simultáneamente en:

1. descubrimiento rápido del workspace/solution,
2. indexación progresiva y no bloqueante,
3. prioridad real al contexto activo,
4. latencia interactiva baja para hover/completion/definition,
5. persistencia útil para evitar recomputado innecesario,
6. estado observable del motor,
7. y base semántica fuerte sin sacrificar tiempo hasta valor.

---

## 3. Estado real del proyecto

### Base ya cerrada

El proyecto ya dispone de una base fuerte y funcional en:

- cliente ligero y servidor LSP separados,
- activación perezosa,
- Document Symbols jerárquicos,
- hover semántico,
- go to definition,
- completado contextual,
- signature help,
- diagnósticos estructurales y semánticos base,
- caché documental inicial,
- KnowledgeBase,
- InheritanceGraph,
- SemanticQueryService,
- SystemCatalog,
- descubrimiento inicial de workspace,
- watcher de archivos PowerBuilder,
- y base de tests smoke/unit/integration/performance.

### Bloques ya cerrados

Se consideran ya cerrados como base operativa:

- bootstrap profesional,
- base operativa rápida,
- workspace/runtime/observabilidad inicial,
- parsing/caché/invalidez base,
- backbone semántico inicial,
- navegación profesional,
- infraestructura de escala inicial,
- topología real y resolución fuerte base,
- hardening principal de parser/lexer,
- sprintes de hardening 1, 2 y 3 ya completados.

### Consecuencia

El foco actual **ya no es construir la base inicial**.

El foco actual es **hacer que el motor sea más correcto, más incremental, más reanudable, más observable y más rápido bajo carga real**.

---

## 4. Foco actual real

## Fase activa actual

### Fase 1 — Atomicidad + incrementalidad fina

Este es el foco principal actual.

### Objetivo de esta fase

Cerrar el núcleo del motor para que:

- publique estado semántico de forma atómica,
- recompute solo lo mínimo necesario,
- priorice el archivo activo y sus dependencias cercanas,
- pueda degradar de forma segura,
- y siga descubriendo/indexando rápido sin bloquear.

### Ítems del backlog dentro del foco actual

Orden exacto:

1. **B151** — Semantic snapshot canónico por documento  
2. **B165** — Publicación atómica del Knowledge Base y de los índices  
3. **B166** — Versionado semántico interno del workspace  
4. **B170** — Semantic diff engine  
5. **B153** — Índice de dependencias semánticas inversas  
6. **B154** — Invalidation engine explícito  
7. **B152** — Pipeline de indexación en dos fases reales  
8. **B122** — Priorización por dependencias semánticas cercanas  
9. **B123** — Presupuestos de trabajo y yielding cooperativo  
10. **B124** — Cancelación y preempción real de tareas de fondo  
11. **B169** — Watcher intake pipeline con backpressure real  
12. **B125** — Indexación progresiva del workspace completo  
13. **B126** — Superficie de estado del indexador  
14. **B134** — Modelo de progreso y readiness del indexador  
15. **B158** — Modo degradado formal  
16. **B159** — Gobernador de latencia del servidor

---

## 5. Por qué esto es prioritario

Este bloque es prioritario porque ataca directamente la meta maestra:

> descubrir e indexar muy rápido sin bloquear

Si esta fase no se cierra bien, todo lo demás se apoya sobre una base menos profesional:

- la persistencia será menos fiable,
- el query engine reutilizará peor la información,
- las queries visibles serán menos coherentes,
- la latencia sufrirá más en workspaces grandes,
- y el crecimiento del producto será más caro de mantener.

En otras palabras:

**antes de abrir más superficie funcional, hay que cerrar mejor el corazón del motor.**

---

## 6. Qué sí debe hacerse ahora

### Trabajo permitido y prioritario

- construir el snapshot semántico canónico,
- introducir publicación atómica del estado semántico,
- introducir versionado semántico interno,
- clasificar cambios por diff semántico,
- modelar dependencias inversas,
- centralizar la invalidación,
- separar indexación estructural vs enriquecida,
- endurecer yielding, preempción y budgets,
- mejorar backpressure del watcher,
- exponer progreso, readiness y estado del indexador,
- y mantener alineada la documentación técnica con el nuevo modelo del core.

### Resultado esperado de esta etapa

Al final de esta fase, el plugin debe:

- descubrir e indexar el workspace de forma progresiva y sin bloquear,
- priorizar de verdad el contexto activo,
- publicar resultados coherentes sin estados a medias,
- invalidar y recomputar con granularidad fina,
- exponer progreso real y readiness,
- y dejar preparada una base sólida para persistencia robusta y query engine unificado.

---

## 7. Qué no debe hacerse ahora salvo causa clara

### Trabajo explícitamente fuera de foco

No debe hacerse ahora, salvo bug, deuda bloqueante o necesidad muy justificada:

- adelantar DataWindow avanzado,
- abrir integraciones profundas de build/ORCA,
- ampliar automatización externa,
- abrir una API pública más ambiciosa,
- meter features visibles nuevas por encima del cierre del core,
- hacer refactors estéticos sin impacto real,
- o reabrir arquitectura general sin relación directa con la fase activa.

### No tocar todavía salvo necesidad real

- DataWindow safe mode completo,
- build moderno profundo,
- automatización externa,
- ORCA,
- expansión fuerte de API pública,
- formatter ambicioso,
- features vistosas no apoyadas todavía en el query engine unificado.

---

## 8. Riesgos actuales a vigilar

### Riesgos principales

- seguir acumulando lógica semántica fuera de un snapshot/documento canónico,
- invalidación todavía demasiado dispersa,
- recomputación más amplia de lo necesario,
- estados parciales del motor visibles por features interactivas,
- watchers que generen tormentas de trabajo en cambios masivos,
- caché persistente futura sin versionado ni journaling sólido,
- y documentación desalineada respecto al nuevo modelo del core.

---

## 9. Evidencia mínima que debe salir de este foco

Antes de mover el foco, esta fase debe dejar evidencia razonable de mejora.

### Evidencias mínimas esperadas

- snapshot semántico por documento operativo,
- publicación atómica del estado semántico,
- semantic diff engine funcionando en casos base,
- índice de dependencias inversas operativo,
- invalidation engine centralizado,
- pipeline de indexación en dos fases,
- yielding y preempción reales medibles,
- progreso/readiness visibles y estables,
- watcher intake con backpressure controlado,
- y documentación técnica actualizada y alineada.

---

## 10. Siguiente paso natural

El siguiente paso natural, una vez cerrado este foco, es:

### Fase 2 — Persistencia robusta

Orden previsto:

1. **B141** — Library graph / project model unificado  
2. **B155** — Checkpoints reales de indexación y resume robusto  
3. **B167** — Journaling transaccional de caché persistente  
4. **B168** — Cache schema versioning + migraciones  
5. **B071** — Warm indexing y resume de caché persistente  
6. **B071A** — Caché persistente por workspace y por proyecto  
7. **B071B** — Caché de consultas frecuentes  
8. **B164** — Interning y compactación de memoria  
9. **B174** — Resultados semánticos inmutables

---

## 11. Condición para mover el foco

El foco actual solo debe cambiar cuando:

- el snapshot semántico sea la unidad real de consumo del motor,
- la publicación del estado sea atómica,
- la invalidación esté centralizada y opere con granularidad fina,
- el scheduler responda bien a contexto activo + background,
- el progreso/readiness sean observables y estables,
- y exista evidencia de mejora real en tiempo hasta valor y no bloqueo.

Si estas condiciones no se cumplen, no debe abrirse de forma agresiva la siguiente fase.

---

## 12. Regla final de foco

Mientras este documento siga vigente, la regla operativa es:

> **no abrir más superficie funcional de la que el núcleo actual puede sostener sin comprometer descubrimiento rápido, indexación progresiva no bloqueante, estabilidad semántica, latencia interactiva o documentación viva.**
