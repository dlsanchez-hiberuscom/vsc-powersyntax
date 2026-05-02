# Roadmap — Plugin PowerBuilder 2025 para VS Code

**Documento técnico asociado:**
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

---

## 1. Objetivo de producto

Construir un plugin profesional para PowerBuilder 2025 en VS Code que combine:

1. descubrimiento e indexación muy rápidos sin bloquear;
2. latencia interactiva baja en el archivo activo;
3. núcleo semántico fuerte y reutilizable;
4. buen comportamiento en proyectos grandes y legacy;
5. valor real para el desarrollador;
6. automatización/IA solo sobre base madura.

---

## 2. Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Todo el roadmap se ordena alrededor de esta meta.

---

## 3. Principios de producto

Se prioriza siempre:

1. rendimiento percibido;
2. arquitectura limpia;
3. separación de responsabilidades;
4. atomicidad del estado semántico;
5. incrementalidad fina;
6. persistencia robusta;
7. explicabilidad/observabilidad;
8. validación real sobre corpus grandes;
9. especialización PowerBuilder;
10. automatización avanzada al final.

---

## 4. Reglas base del producto

- Soportar Workspace y Solution como modos distintos.
- En Workspace, `ws_objects` es fuente relevante.
- En Solution, carpetas `*.pbl` con `*.sr*` son fuente canónica.
- `.pb`, `build` y `_BackupFiles` se ignoran por defecto.
- Separar parser de contenedor SR* y lenguaje embebido.
- DataWindow es subdominio propio.
- PBAutoBuild es backend moderno preferente.
- ORCA/OrcaScript es integración legacy adicional.
- Toda decisión semántica relevante debe reflejarse en la guía técnica.

---

## 5. Equivalencia roadmap/backlog

| Roadmap | Backlog | Objetivo |
|---|---|---|
| Fase A | L0 | Core semántico, readiness y latencia |
| Fase B | L1 | Persistencia y reanudación |
| Fase C | L2 + L2.5 | Query engine, serving y entendimiento PowerBuilder |
| Fase D | L3 | Validación, performance y health |
| Fase E | L4 | Especialización PowerBuilder |
| Fase F | L4.5 | Plataforma abierta para automatización segura |
| Fase G | L5 | Documentación IA-first y workflows que sostienen la automatización |

---

## 6. Estado actual resumido

### Base ya conseguida

El producto ya dispone de:

- cliente ligero y servidor LSP separados;
- activación perezosa;
- symbols/hover/definition/completion/signature help base;
- backbone semántico inicial;
- topología Workspace/Solution;
- visibilidad y herencia base;
- scheduler, caches y readiness;
- parser hardening principal;
- catálogo built-in;
- tests smoke/unit/integration/performance;
- query engine unificado operativo;
- latency governor operativo;
- API pública mínima;
- diagnostics snapshot agrupado;
- hierarchy inspection y CodeLens robustecidos.

### Lectura estratégica

La siguiente etapa no es abrir más superficie, sino reforzar:

- evidence;
- confidence gates;
- cache semántica estable;
- validación real;
- workflows útiles para desarrolladores.

---

## 7. Fases del roadmap

## Fase A — Core semántico de próxima generación

### Objetivo

Cerrar el corazón del motor para que publique estado coherente, recalcule solo lo necesario y mantenga interactividad real.

### Incluye

- snapshot semántico canónico;
- publicación atómica;
- semantic epoch;
- semantic diff;
- dependencias inversas;
- invalidación explícita;
- indexación en dos fases;
- prioridad al contexto activo;
- yielding/cancelación/preempción;
- readiness/degraded mode;
- latency governor.

### Estado

Cerrada como bloque operativo. Los detalles de specs cerradas viven en `done-log.md`.

---

## Fase B — Persistencia robusta y reanudación real

### Objetivo

Evitar recomputado innecesario entre sesiones y convertir la persistencia en una capacidad seria.

### Incluye

- checkpoints reales;
- resume robusto;
- caché persistente por workspace/proyecto;
- journaling transaccional;
- schema versioning;
- warm resume;
- project model compartido.

### Estado

Bloque ya materializado y cerrado a nivel operativo inicial.

Specs cerradas de esta fase ya trazadas en `done-log.md`:

- `B155`;
- `B167`;
- `B168`;
- `B071`.

---

## Fase C — Serving profesional y productividad segura

### Objetivo

Unificar consultas semánticas y elevar calidad visible de features del editor.

### Incluye

- query engine unificado;
- semantic evidence;
- provenance/lineage;
- confidence gates;
- query result cache;
- references robustas;
- rename controlado;
- CodeLens fiable;
- navegación jerárquica;
- status contextual.

### Estado

Base materializada. Ya cerrados como bloque operativo:

- `B156` query engine unificado;
- `B173` member closures;
- `B066` CodeLens referencias/herencia;
- `B065` hierarchy inspection;
- `B109` API pública mínima;
- `B157` Semantic evidence de primera clase;
- `B171` Confidence gates por feature;
- `B160` Query result cache con claves semánticas estables;
- `B031` References robustas;
- `B032` Rename controlado;
- `B164` compactación de memoria;
- `B063` diagnostics snapshot agrupado.

---

## Fase D — Escala, salud interna y excelencia operativa

### Objetivo

Convertir el producto en herramienta robusta para proyectos enterprise y legacy reales.

### Incluye

- corpus reales;
- performance budgets medidos;
- memory budgets;
- fixtures permanentes;
- golden tests;
- reconciliación parser/symbol/LSP;
- event log;
- repro packs;
- health checker.

### Pendientes principales

- `B070`;
- `B162`;
- `B175`.

Bloque ya cerrado dentro de la fase:

- `B030` validación real sobre workspace grande;
- `B069` fixtures reales permanentes;
- `B068` calibración real del performance budget;
- `B119` performance regression suite;
- `B118` integration test matrix del plugin;
- `B161` golden tests semánticos end-to-end;
- `B163` runtime journal exportable del motor;
- `B176` health checker interno estructurado.

---

## Fase E — Especialización PowerBuilder

### Objetivo

Extender el producto a piezas diferenciales del ecosistema PowerBuilder sin comprometer el core.

### Líneas principales

1. DataWindow safe mode;
2. DataWindow como subdominio semántico;
3. DataWindow avanzado;
4. PBAutoBuild;
5. build health;
6. auditoría técnica y convenciones.

### Pendientes principales

- `B042`;
- `B081`;
- `B181-B187`;
- `B214-B216`.

Bloque ya cerrado dentro de la fase:

- `B117` DataWindow safe mode mínimo;
- `B139` DataWindow safe-mode desde `plugin_old` rediseñado;
- `B041` catálogo y navegación de DataWindow.

Notas de orden:

- `B043` se mantiene como épica contenedora; el trabajo ejecutable vive en `B181-B187`.
- `B214-B216` deben consumir contratos read-only ya cerrados (`B217`, `B220`, `B176`, `B107`) y no abrir un segundo motor semántico o de health.

---

## Fase F — Plataforma abierta para automatización

### Objetivo

Abrir contratos estables para consumo externo sin contaminar el núcleo.

### Incluye

- API pública estable;
- exportación de superficies semánticas;
- contratos versionados;
- manifiestos consumibles por automatización;
- soporte progresivo a tools/agentes.

### Pendientes principales

- `B110`;
- `B111`;
- `B132`;
- `B140`;
- futuras AI context packs.

---

## Fase G — Automatización avanzada e IA

### Objetivo

Aprovechar plataforma madura para automatización e IA sin reescribir arquitectura.

### Incluye

- automatización semántica avanzada;
- explotación de API/tools;
- refactorizaciones complejas apoyadas en backbone;
- context packs;
- impact analysis;
- safe edit plans.

---

## 8. Líneas transversales obligatorias

### 8.1 Catálogo oficial

El catálogo oficial del lenguaje/runtime alimenta hover, completion, signature help, diagnósticos, navegación y automatización futura.

### 8.2 Documentación viva

Cambios relevantes sobre PowerScript, scopes, SR*, Workspace/Solution, DataWindow, encoding o build deben reflejarse en la guía técnica.

### 8.3 Referencias a `plugin_old`

`plugin_old` se usa como referencia de heurísticas, datasets y patrones, pero no como fuente de port masivo.

---

## 9. Política de WIP

Para un equipo pequeño:

- máximo 1 fase principal activa;
- máximo 1 línea transversal de deuda;
- máximo 1 línea de validación/corpus;
- no abrir simultáneamente DataWindow profundo, build avanzado, API pública ambiciosa y automatización externa fuerte.

---

## 10. Próximo foco recomendado

### Prioridad inmediata

**Fase E — Especialización PowerBuilder**

Con foco en:

- `B042` — Soporte avanzado de DataWindow;
- `B081` — Inteligencia de DataWindow y acceso a `.Object`.

### Trabajo paralelo permitido

**Fase D — Escala, salud interna y excelencia operativa**

Solo si no bloquea el foco principal:

- `B070`;
- `B162`;
- `B175`.

### Validación temprana permitida

Mantener verde la base ya cerrada sin reabrir superficie funcional:

- corpus reales;
- smoke matrix;
- golden suite semántica;
- performance regression suite.

---

## 11. Regla final de producto

El objetivo no es llegar rápido a muchas features, sino llegar a un plugin que combine:

- rapidez;
- estabilidad;
- valor profesional real;
- soporte para proyectos grandes y legacy;
- conocimiento fuerte de PowerBuilder 2025;
- capacidad de crecer sin rehacer el núcleo;
- base limpia para automatización futura.
