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

### Fase 2 — Persistencia robusta y hot path compartido

Este es el foco principal actual.

### Objetivo de esta fase

Cerrar la persistencia operativa y el serving compartido para que:

- el servidor reutilice estado seguro entre sesiones,
- las queries repetidas hagan menos trabajo en caliente,
- `HotContextCache` y `ServingCache` se conviertan en aceleraciones reales,
- y la observabilidad interna explique readiness, cachés y winner paths.

La base de esta fase ya quedó implementada y validada como segundo corte operativo; `Specs 173-174` cierran `B071A` con checkpoints y journals persistidos por proyecto, restore agregado por partición y ancla de workspace para huérfanos. `Specs 175-184` cierran `B071B` con `ServingCache` exportable/rehidratable, snapshot persistente en `cacheStore`, wiring de restore/persist en runtime, parseo de epoch, filtro simétrico por epoch, coordinador dirty, flush oportuno al poblar/invalidate/shutdown y observabilidad básica en `powerbuilder.showStats`. `Specs 185-192` cierran `B172` con el contrato base de lineage, su población documental inicial, normalización común, visibilidad en `semanticDiff`, `winnerLineage` en resolución, puente con el catálogo de sistema, surface visible en hover y exportación mínima estable en `ApiSymbol`. El siguiente paso inmediato es endurecer confidence gates sobre esta base.

### Ola 149-174 ya materializada como base operativa de persistencia y serving

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

Validación registrada:

- `npm run compile`
- `npm run test:unit` → `350 passing`
- `npm test` → smoke `2 passing`, unit `350 passing`, integration `4 passing`

### Siguiente cierre natural dentro de esta fase

1. **B171** — confidence gates por feature  
2. **B031** — referencias más precisas y robustas  
3. **B032** — rename controlado sobre evidencia fuerte  
4. **B066** — CodeLens fiable sobre serving compartido  
5. **B065** — hierarchy inspection madura  
6. **B109** — API pública para integración  
7. **B164** — Interning y compactación de memoria

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
- y documentación técnica actualizada y alineada con la ola 153-192.

---

## 10. Siguiente paso natural

El siguiente paso natural, una vez cerrado este foco, es:

### Fase 3 — Confidence gates y serving seguro

Orden previsto:

1. **B171** — Confidence gates por feature  
2. **B031** — Referencias más precisas y robustas  
3. **B032** — Rename controlado  
4. **B066** — CodeLens de referencias y herencia  
5. **B065** — Ancestor script navigation + hierarchy inspection  
6. **B109** — API pública para integración  
7. **B164** — Interning y compactación de memoria

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
