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

### Fase 2 — Persistencia robusta, hot path compartido y cierre de residuales Partial

Este es el foco principal actual.

### Objetivo de esta fase

Cerrar la persistencia operativa y el serving compartido para que:

- el servidor reutilice estado seguro entre sesiones,
- las queries repetidas hagan menos trabajo en caliente,
- `HotContextCache` y `ServingCache` se conviertan en aceleraciones reales,
- y la observabilidad interna explique readiness, cachés y winner paths.

La base de esta fase ya quedó implementada y validada como segundo corte operativo; `Specs 173-174` cierran `B071A` con checkpoints y journals persistidos por proyecto, restore agregado por partición y ancla de workspace para huérfanos. `Specs 175-184` cierran `B071B` con `ServingCache` exportable/rehidratable, snapshot persistente en `cacheStore`, wiring de restore/persist en runtime, parseo de epoch, filtro simétrico por epoch, coordinador dirty, flush oportuno al poblar/invalidate/shutdown y observabilidad básica en `powerbuilder.showStats`. `Specs 185-192` cierran `B172` con el contrato base de lineage, su población documental inicial, normalización común, visibilidad en `semanticDiff`, `winnerLineage` en resolución, puente con el catálogo de sistema, surface visible en hover y exportación mínima estable en `ApiSymbol`. `Specs 193-197` cierran `B165`, `B166`, `B170`, `B153`, `B154`, `B126` y `B174`. `Specs 198-204` hacen snapshot-first `documentSymbols`, `completion`, `signatureHelp`, `diagnostics` y `semanticTokens`, con lo que cierran `B151A` y permiten cerrar `B151`. `Specs 205-206`, `216` y `217` convierten el indexador en un two-phase real con pase estructural ligero, publicación `structural-only` y observabilidad por pass, cerrando `B152A` y `B152`. `Specs 207-208` y `210` cablean el intake real del watcher, añaden massive mode y validan backpressure end-to-end, cerrando `B169A` y `B169`. `Specs 209`, `211-215` llevan `UnifiedProjectModel` al routing compartido, al watcher, al status activo y a partes del hot path, pero `B141A` sigue abierta para serving e invariantes finales. Tras esta ola, el único `Partial` activo que queda en esta fase es `B141A`.

### Ola 149-217 ya materializada como base operativa de persistencia, serving y hardening del core

- `Specs 149-152` dejaron listos `UnifiedProjectModel` y la base persistente `schema` + `journal` + `checkpoint`.
- `Specs 153-163` materializan puerto persistente de filesystem, `cacheStore`, `workspaceKey` estable, metadata de checkpoint, validación estricta de journal, export/restore defensivo, `journal` interactivo y warm resume real.
- `Specs 164-172` materializan helper común de contexto de query, `ServingCache` ampliado, consumo real de `HotContextCache`, `queryTrace`, `reasonCodes` y snapshot de stats interno/público ampliado.
- `Specs 173-174` cierran `B071A` con checkpoint y journal persistidos por proyecto, manteniendo ancla de workspace para huérfanos y restore agregado por partición.
- `Specs 175-184` cierran `B071B`: `ServingCache` ya es persistente entre sesiones, filtrado por epoch, sincronizado con populate/invalidation/shutdown y observable vía `powerbuilder.showStats`.
- `Spec 185` abre `B172` con `EntityLineage` como contrato común de origen, fase, rol, herencia y fiabilidad.
- `Spec 186` puebla ese lineage desde `analyzeDocument` para prototype, implementation y herencia documental.
- `Spec 187` normaliza ese lineage en `enrichEntity` y preserva overrides explícitos.
- `Spec 188` hace que el `semanticDiff` vea cambios de lineage y pueda invalidar snapshots exportados por ese motivo.
- `Spec 189` expone `winnerLineage` en `resolveTargetEntityDetailed` para el target ganador.
- `Spec 190` traduce `PbSystemSymbolProvenance` al vocabulario común mediante `systemProvenanceToLineage()`.
- `Spec 191` añade un resumen mínimo de lineage en hover para símbolos de usuario y de sistema.
- `Spec 192` amplía `ApiSymbol` con `ApiSymbolLineage` y fija `toApiSymbol()` como mapper público mínimo y estable.
- `Spec 193` hace snapshot-first a `KnowledgeBase` para `symbols` y `scopes` documentales, reduciendo `B151` al consumo end-to-end pendiente.
- `Spec 194` cierra `B165` con validacion directa sobre publish atomico observable en readers documentales; con el binding por epoch ya implantado, `B166` queda cerrada.
- `Spec 195` hace diff-aware la invalidacion del runtime y cierra `B170`, `B153` y `B154` sobre el grafo inverso ya existente.
- `Spec 196` cierra `B126` ampliando `getIndexerStatus()` con ultima actividad relevante y contador de ejecuciones parciales.
- `Spec 197` cierra `B174` endureciendo `KnowledgeBase`, `DocumentCache` y `HotContextCache` frente a mutacion accidental.
- `Specs 198-204` cierran la migracion snapshot-first visible de `documentSymbols`, `completion`, `signatureHelp`, `diagnostics` y `semanticTokens`, dejando cerradas `B151A` y `B151`.
- `Specs 205-206`, `216` y `217` cierran el publish `structural-only`, el pase estructural ligero y la observabilidad por pass, dejando cerradas `B152A` y `B152`.
- `Specs 207-208` y `210` cierran el intake real del watcher con massive mode, cache sweep selectivo/masivo y validacion end-to-end de backpressure, dejando cerradas `B169A` y `B169`.
- `Specs 209`, `211-215` llevan `UnifiedProjectModel` a `libraryOrder`, `workspaceIndexer`, `projectRouting`, refresh por watcher y status activo, reduciendo `B141A` a serving e invariantes finales.

Validación registrada:

- `npm run build:test`
- `npm run test:unit` → `376 passing`
- `npm test` → smoke `2 passing`, unit `376 passing`, integration `4 passing`

### Siguiente cierre natural dentro de esta fase

1. **B141A** — cierre runtime del `UnifiedProjectModel` compartido  
2. **B122** — priorización por dependencias cercanas sobre el nuevo estado real  
3. **B125** — indexación progresiva del workspace completo con watcher ya cableado  
4. **B134** — modelo único de progreso y readiness  
5. **B158** — modo degradado formal apoyado en readiness por pass  
6. **B159** — gobernador de latencia integrado con serving y scheduler

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

- cerrar `B141A` como último residual `Partial` de esta ola y, sobre esa base ya estabilizada, reabrir `B122`, `B125`, `B134`, `B158` y `B159`,
- conectar `queryTrace` y `reasonCodes` con lineage y confidence gates,
- endurecer `references`, `rename` y `CodeLens` sobre el query engine compartido,
- consolidar la API pública mínima sin abrir aún superficies más ambiciosas,
- y mantener alineada la documentación técnica con el nuevo estado real del runtime.

### Resultado esperado de esta etapa

Al final de esta fase, el plugin debe:

- reabrir workspaces grandes con warm resume seguro y medible,
- reutilizar mejor `definition`, `signatureHelp` y `completion` en rutas repetidas,
- exponer caches, persistence y winner paths desde surfaces internas y públicas ligeras,
- y dejar lista la base para confidence gates y queries más ambiciosas.

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

- persistencia demasiado gruesa si no se completa el particionado por proyecto,
- claves de serving incompletas que generen hits incorrectos,
- evidencia semántica todavía corta para decisiones delicadas como rename o references,
- health checker aún insuficiente para detectar degradación antes del bug visible,
- y documentación desalineada respecto al estado real de persistencia y serving.

---

## 9. Evidencia mínima que debe salir de este foco

Antes de mover el foco, esta fase debe dejar evidencia razonable de mejora.

### Evidencias mínimas esperadas

- warm resume operativo con restore seguro de `DocumentCache` + `KnowledgeBase`,
- persistencia solo en puntos de estabilidad verificables,
- `ServingCache` y `HotContextCache` consumidos de forma real en el hot path,
- `queryTrace` y `reasonCodes` visibles para debugging y stats,
- y documentación técnica actualizada y alineada con la ola 153-217.

---

## 10. Siguiente paso natural

El siguiente paso natural, una vez cerrado este foco, es:

### Fase 3 — Confidence gates y serving seguro

Orden previsto:

1. **B141A** — cierre del project model compartido en runtime  
2. **B122** — priorización por dependencias semánticas cercanas  
3. **B125** — indexación progresiva del workspace completo  
4. **B134** — progreso y readiness unificados  
5. **B158** — modo degradado formal  
6. **B159** — gobernador de latencia  
7. **B156** — query engine unificado sobre esa base  
8. **B066** — CodeLens de referencias y herencia  
9. **B065** — Ancestor script navigation + hierarchy inspection  
10. **B109** — API pública para integración  
11. **B164** — Interning y compactación de memoria

---

## 11. Condición para mover el foco

El foco actual solo debe cambiar cuando:

- el warm resume sea seguro y repetible en reaperturas reales,
- `ServingCache` y `HotContextCache` aporten reuse sin inconsistencias,
- la observabilidad interna permita inspeccionar readiness, persistence y winner paths,
- y exista evidencia de mejora real en tiempo hasta valor y latencia interactiva.

Si estas condiciones no se cumplen, no debe abrirse de forma agresiva la siguiente fase.

---

## 12. Regla final de foco

Mientras este documento siga vigente, la regla operativa es:

> **no abrir más superficie funcional de la que el núcleo actual puede sostener sin comprometer descubrimiento rápido, indexación progresiva no bloqueante, estabilidad semántica, latencia interactiva o documentación viva.**
