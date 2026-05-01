# Roadmap — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## 1. Objetivo de producto

Construir un plugin profesional para PowerBuilder 2025 en VS Code que combine:

1. **descubrimiento e indexación muy rápidos sin bloquear**,
2. **latencia interactiva baja** en el archivo activo,
3. **núcleo semántico fuerte y reutilizable**,
4. **buen comportamiento en proyectos grandes y legacy**,
5. **valor real para el desarrollador**,
6. y **automatización / IA solo sobre base madura**.

---

## 2. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Todo el roadmap se ordena alrededor de esta meta.

Eso implica que el producto debe mejorar simultáneamente en:

- descubrimiento rápido,
- indexación progresiva,
- prioridad real al contexto activo,
- serving interactivo rápido,
- persistencia útil,
- observabilidad del motor,
- y semántica fuerte sin comprometer UX.

---

## 3. Principios de producto

Se prioriza siempre, en este orden:

1. **rendimiento percibido**,
2. **arquitectura limpia**,
3. **separación de responsabilidades**,
4. **atomicidad del estado semántico**,
5. **incrementalidad fina**,
6. **persistencia robusta**,
7. **explicabilidad / observabilidad**,
8. **validación real sobre corpus grandes**,
9. **especialización PowerBuilder**,
10. **automatización avanzada al final**.

---

## 4. Reglas base del producto

- El plugin debe soportar **Workspace** y **Solution** como modos distintos.
- En Workspace, `ws_objects` es fuente relevante; en Solution, no.
- En Solution, las carpetas `*.pbl` con archivos `*.sr*` son fuente canónica.
- `.pb`, `build` y `_BackupFiles` deben ignorarse por defecto.
- El lenguaje requiere separar:
  - parsing del contenedor SR*,
  - parsing del lenguaje embebido.
- DataWindow se trata como **subdominio propio**.
- El backend moderno de build prioriza **PBAutoBuild**.
- **ORCA / OrcaScript** queda como integración adicional para escenarios legacy.
- Todo cambio semántico o estructural debe reflejarse también en:
  - `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## 5. Estado actual resumido

### Base ya conseguida
El producto ya dispone de:

- cliente ligero y servidor LSP separados,
- activación perezosa,
- symbols / hover / definition / completion / signature help base,
- backbone semántico inicial,
- topología real Workspace/Solution,
- visibilidad y herencia base,
- scheduler inicial, caches iniciales y readiness inicial,
- parser hardening principal,
- catálogo built-in rediseñado,
- y base sólida de tests.

### Lectura estratégica
La siguiente etapa del producto **ya no es abrir más superficie**, sino:

- endurecer el **core**,
- hacerlo más **atómico**,
- más **incremental**,
- más **reanudable**,
- más **observable**,
- y más **fuerte bajo carga real**.

---

## 6. Fases del roadmap

## Fase A — Core semántico de próxima generación
### Objetivo
Cerrar el corazón del motor para que publique estado coherente, recalcule solo lo necesario y mantenga interactividad real.

### Incluye
- snapshot semántico canónico,
- publicación atómica del estado semántico,
- versionado semántico interno,
- semantic diff,
- dependencias semánticas inversas,
- invalidación explícita,
- indexación en dos fases,
- prioridad al contexto activo,
- yielding, cancelación y preempción reales,
- progreso y readiness estables.

### Criterio de salida
- el sistema descubre e indexa sin bloquear,
- el archivo activo tiene prioridad real,
- el motor no publica estado “a medias”,
- la recomputación es claramente más fina,
- y el progreso del indexador es observable y útil.

### Ola 133-148 ya materializada

La primera ola de esta fase ya no es solo documental: las `Specs 133-148` quedaron implementadas y validadas como primer corte operativo del nuevo core semántico. `Specs 193-197` cierran `B165`, `B166`, `B170`, `B153`, `B154`, `B126` y `B174`; `Specs 198-204` cierran `B151A` y `B151`; `Specs 205-206`, `216` y `217` cierran `B152A` y `B152`; `Specs 207-208` y `210` cierran `B169A` y `B169`; y la validacion acumulada permite dar por cerradas `B123` y `B124`. Tras esta ola, el cierre definitivo de la fase queda ligado a `B122`, `B125`, `B134`, `B158`, `B159` y al remate final de `B141A` como residual cross-phase.

---

## Fase B — Persistencia robusta y reanudación real
### Objetivo
Evitar recomputado innecesario entre sesiones y convertir la persistencia en una capacidad de producto seria.

### Incluye
- checkpoints reales del pipeline,
- resume robusto,
- caché persistente por workspace/proyecto,
- journaling transaccional,
- versionado de esquema y migraciones,
- reuse de consultas frecuentes,
- project model / library graph unificado.

### Criterio de salida
- reabrir workspaces grandes es claramente más rápido,
- warm indexing mejora de forma visible al cold indexing,
- la persistencia es segura, versionada y recuperable,
- y el estado del motor puede continuarse con confianza.

### Base 149-163 ya materializada

La serie `Specs 149-163` ya materializa el primer corte operativo de `B141`, `B155`, `B167`, `B168`, `B071` y `B071A` con `UnifiedProjectModel`, `cacheStore`, `workspaceKey` estable, metadata robusta, `journal` validado, export/restore defensivo y warm resume real de `DocumentCache` + `KnowledgeBase`. `Specs 173-174` cierran `B071A` con checkpoints y journals persistidos por proyecto, ancla de workspace para huérfanos y restore agregado por partición. `Specs 175-184` cierran el primer corte real de `B071B`: `ServingCache` ya es serializable, persistente, filtrado por epoch, sincronizado con populate/invalidation/shutdown y observable en `powerbuilder.showStats`. `Specs 185-192` cierran `B172` con el contrato base de lineage, su población documental inicial, una normalización común, un semantic diff que reacciona a lineage, un winner path que ya expone esa información, el bridge del catálogo de sistema, la surface visible en hover y una exportación pública mínima del símbolo. `Spec 197` cierra `B174` blindando las lecturas publicadas de `KnowledgeBase`, `DocumentCache` y `HotContextCache` frente a mutaciones accidentales. `Specs 209`, `211-215` reducen `B141A` llevando el project model compartido al routing real, al watcher y al status activo, pero la fase sigue abierta hasta cerrar serving e invariantes finales.

---

## Fase C — Serving profesional y productividad segura
### Objetivo
Unificar el motor de consultas semánticas y elevar la calidad visible de las features del editor.

### Incluye
- query engine unificado,
- semantic evidence de primera clase,
- provenance / lineage de símbolos,
- confidence gates por feature,
- query result cache,
- member closures precalculados,
- references robustas,
- rename controlado,
- CodeLens fiable,
- navegación jerárquica madura,
- status contextual útil.

### Criterio de salida
- hover / completion / definition / references son más coherentes entre sí,
- rename y references operan solo cuando hay base suficiente,
- el motor puede explicar por qué devuelve un resultado,
- y la experiencia visible del plugin sube de nivel sin reabrir el core.

### Base 164-172 ya materializada

La serie `Specs 164-172` ya materializa un primer corte operativo de `B156`, `B157`, `B160`, `B176` y `B109` con helper común de contexto de query, `ServingCache` ampliado, consumo real de `HotContextCache`, `queryTrace`, `reasonCodes` y snapshot de stats interno/público ampliado. `Specs 185-192` cierran `B172` y extienden `B109` con lineage mínimo por símbolo. El siguiente cierre de Fase C es usar esta evidencia para confidence gates y features de serving más estrictas.

---

## Fase D — Escala, salud interna y excelencia operativa
### Objetivo
Convertir el producto en una herramienta robusta para proyectos enterprise y legacy reales.

### Incluye
- validación sobre corpus grandes reales,
- calibración real de budgets de rendimiento,
- budgets de memoria,
- fixtures permanentes de regresión,
- golden tests semánticos end-to-end,
- reconciliación parser / symbol model / LSP,
- work journal técnico,
- repro packs automáticos,
- health checker interno,
- compactación de memoria.

### Criterio de salida
- el producto evoluciona sobre evidencia real y no sobre hipótesis,
- las regresiones complejas se detectan antes,
- la salud interna del motor es medible,
- y el comportamiento del plugin es estable en corpus grandes.

---

## Fase E — Especialización PowerBuilder
### Objetivo
Extender el producto a las piezas diferenciales del ecosistema PowerBuilder sin comprometer el núcleo.

### Líneas principales
1. DataWindow safe mode,
2. DataWindow como subdominio semántico,
3. DataWindow avanzado,
4. integración con **PBAutoBuild**,
5. estado de build y salud del workspace,
6. auditoría técnica y convenciones.

### Criterio de salida
- el plugin aporta valor diferencial específicamente PowerBuilder,
- y se convierte en herramienta profesional del ecosistema, no solo en soporte básico de lenguaje.

---

## Fase F — Plataforma abierta para automatización
### Objetivo
Abrir contratos estables para consumo externo sin contaminar el núcleo.

### Incluye
- API pública mínima y estable,
- exportación de superficies semánticas,
- contratos versionados,
- herramientas consumibles por automatización externa,
- soporte progresivo a tools / agentes.

### Criterio de salida
- el plugin puede ser consumido externamente con estabilidad de borde,
- sin reabrir el core ni introducir acoplamientos frágiles.

---

## Fase G — Automatización avanzada e IA
### Objetivo
Aprovechar la plataforma madura para automatización e IA sin reescribir la arquitectura.

### Incluye
- automatización semántica avanzada,
- explotación de API/tools para agentes,
- refactorizaciones más complejas apoyadas en el backbone,
- escenarios avanzados de productividad asistida.

### Criterio de salida
- la automatización aprovecha la plataforma madura,
- y el núcleo sigue limpio, explicable y sostenible.

---

## 7. Líneas transversales obligatorias

### 7.1 Catálogo oficial
El catálogo oficial del lenguaje y runtime es un activo estratégico del plugin.
Debe alimentar:

- hover,
- completion,
- signature help,
- diagnósticos,
- navegación,
- automatización futura.

### 7.2 Documentación viva
Todo cambio relevante sobre:
- PowerScript,
- scopes,
- SR*,
- Workspace/Solution,
- DataWindow,
- encoding,
- build/backend,

debe reflejarse también en:

- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

### 7.3 Referencias al `plugin_old`
`plugin_old` debe usarse como:
- guía de arquitectura,
- fuente de heurísticas probadas,
- dataset/catalogado previo,
- y referencia para mejoras avanzadas,

pero **no** como base para portar código sin rediseño.

---

## 8. Política de WIP

Para un equipo pequeño:

- máximo **1 fase principal activa**,
- máximo **1 línea transversal de deuda**,
- máximo **1 línea de validación/corpus**,
- no abrir simultáneamente:
  - DataWindow profundo,
  - build avanzado,
  - API pública ambiciosa,
  - automatización externa fuerte.

---

## 9. Regla de avance entre fases

No se avanza agresivamente si la fase anterior no está consolidada.

**Consolidar** significa:

- implementación estable,
- validación mínima real,
- rendimiento controlado,
- documentación actualizada,
- backlog y current-focus alineados,
- y sin deuda bloqueante oculta.

---

## 10. Próximo foco recomendado

### Prioridad inmediata
**Fase A — Core semántico de próxima generación**

Con foco en:
- atomicidad,
- incrementalidad fina,
- estado observable,
- y cierre real del comportamiento interactivo bajo carga.

### Siguiente objetivo natural
**Fase B — Persistencia robusta y reanudación real**

---

## 11. Regla final de producto

El objetivo no es llegar rápido a muchas features, sino llegar a un plugin que combine:

- rapidez,
- estabilidad,
- valor profesional real,
- soporte para proyectos grandes y legacy,
- conocimiento fuerte de PowerBuilder 2025,
- capacidad de crecer sin rehacer el núcleo,
- y una base suficientemente limpia para automatización futura.
