# Roadmap — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento define el **roadmap de alto nivel** del plugin profesional de PowerBuilder 2025 para Visual Studio Code.

Debe responder a una pregunta:

> ¿En qué grandes fases debe evolucionar el producto para convertirse en un plugin rápido, robusto, mantenible y útil para proyectos reales de PowerBuilder?

El roadmap no es un backlog. No debe contener specs concretas, IDs de tareas, prompts, histórico ni criterios de aceptación detallados. Para trabajo accionable se debe usar `docs/backlog.md` o specs bajo `docs/specs/`. Para el foco inmediato se debe usar `docs/current-focus.md`.

---

## 2. Reglas de uso

### 2.1. Qué debe contener

El roadmap debe contener:

- visión por fases;
- objetivos estratégicos;
- dependencias entre bloques;
- resultado esperado por etapa;
- prioridades macro del producto.

### 2.2. Qué no debe contener

El roadmap no debe contener:

- IDs de specs concretas;
- listas completas de tareas;
- criterios de aceptación detallados;
- estado diario;
- histórico de cierres;
- auditorías completas;
- prompts operativos;
- diseño técnico profundo.

### 2.3. Relación con otros documentos

```text
Roadmap          → hacia dónde vamos a alto nivel.
Current Focus    → qué estamos haciendo ahora.
Backlog          → qué trabajo accionable existe.
Architecture     → cómo debe ser el sistema.
Architecture Status → cómo está realmente.
Done Log         → qué se cerró históricamente.
```

---

## 3. Visión estratégica

La visión del plugin es ofrecer una experiencia profesional de PowerBuilder en VS Code con:

- apertura rápida de workspaces grandes;
- indexación incremental y no bloqueante;
- navegación semántica fiable;
- hover, completion, signature help, diagnostics y semantic tokens útiles;
- soporte progresivo de DataWindow;
- integración segura con herramientas del ecosistema PowerBuilder;
- arquitectura modular y mantenible;
- documentación preparada para trabajo humano e IA.

---

## 4. Fases del roadmap

### Fase 1 — Fundaciones documentales y gobierno del repo

**Objetivo:** asegurar que la documentación tiene fuentes de verdad claras y que cada documento cumple un papel único.

**Resultado esperado:**

- constitución documental estable;
- arquitectura objetivo separada del estado real;
- roadmap de alto nivel separado del backlog;
- current-focus reducido al foco activo;
- backlog reducido a trabajo accionable;
- documentos IA alineados como consumidores de contexto, no como fuentes paralelas.

**Dependencias:** ninguna. Es la base para ejecutar el resto del roadmap sin generar duplicidad documental.

---

### Fase 2 — Bootstrap ligero y separación de composition roots

**Objetivo:** reducir concentración de responsabilidades en los puntos de entrada del cliente y del servidor.

**Resultado esperado:**

- cliente VS Code centrado en activación, comandos, vistas, configuración y arranque del Language Client;
- servidor LSP centrado en lifecycle, registro de handlers y composición de servicios;
- comandos, handlers, providers, servicios y adapters separados en módulos testeables;
- menor riesgo de god files y menor coste de mantenimiento.

**Dependencias:** arquitectura objetivo y estado arquitectónico normalizados.

---

### Fase 3 — Workspace model e indexación incremental

**Objetivo:** consolidar un modelo de workspace PowerBuilder capaz de soportar proyectos modernos y legacy sin bloquear el editor.

**Resultado esperado:**

- discovery incremental de workspaces, targets, projects, libraries y fuentes exportadas;
- separación clara entre descubrimiento, carga de metadatos, parsing, indexación y análisis semántico;
- invalidación controlada ante cambios de fichero, configuración o estructura del proyecto;
- base estable para navegación, diagnósticos y features semánticas.

**Dependencias:** bootstrap limpio y contratos mínimos de servidor.

---

### Fase 4 — Parser, Symbol Graph y Semantic Query Facade

**Objetivo:** unificar la resolución semántica y evitar que cada feature LSP implemente sus propias reglas.

**Resultado esperado:**

- parser tolerante a errores;
- snapshots por versión de documento;
- grafo de símbolos con identidad estable;
- fachada semántica común para resolver símbolos, scopes, callables, receivers, definitions y references;
- menor duplicidad entre hover, completion, diagnostics, semantic tokens y futuras features IA.

**Dependencias:** workspace model e indexación incremental.

---

### Fase 5 — Cache layer ultra rápida y hot paths interactivos

**Objetivo:** asegurar que las features interactivas responden desde caches, snapshots e índices válidos, sin hacer trabajo pesado innecesario.

**Resultado esperado:**

- contrato común de caches por niveles;
- active document snapshot;
- caches específicas para hover, completion, diagnostics, semantic tokens y catálogos;
- invalidación segura;
- métricas de hit/miss, latencia y fallback;
- presupuesto de rendimiento conectado a la implementación.

**Dependencias:** fachada semántica, modelo de workspace y contracts de invalidación.

---

### Fase 6 — Experiencia LSP profesional

**Objetivo:** elevar la utilidad real del plugin en edición diaria de PowerBuilder.

**Resultado esperado:**

- hover informativo para funciones del sistema, funciones de usuario, eventos, variables, objetos, built-ins y DataWindow;
- completion contextual y rápida;
- signature help basada en resolución semántica;
- definition y references apoyadas en identidades de símbolo;
- diagnostics separados por fuente;
- semantic tokens alineados con parser y symbol graph;
- degradación controlada cuando falta información.

**Dependencias:** cache layer, semantic facade y symbol graph.

---

### Fase 7 — DataWindow como subdominio de primera clase

**Objetivo:** tratar DataWindow como parte central del ecosistema PowerBuilder, no como texto secundario.

**Resultado esperado:**

- extracción y modelado específico de DataWindow;
- resolución de bindings entre PowerScript y DataWindow;
- soporte progresivo de columnas, controles, propiedades, SQL lineage y safe mode;
- integración con hover, completion y diagnostics;
- cache propia para modelos DataWindow.

**Dependencias:** semantic facade, cache layer y domain model PowerBuilder.

---

### Fase 8 — Integraciones externas controladas

**Objetivo:** integrar herramientas del ecosistema PowerBuilder sin acoplarlas al core semántico.

**Resultado esperado:**

- adapters aislados para herramientas externas;
- degradación segura si la herramienta no está instalada;
- ejecución no bloqueante;
- parsing de errores y salida de build;
- mapeo a diagnostics cuando aplique;
- workflows documentados para desarrolladores.

**Dependencias:** architecture status estable, testing y contratos de adapters.

---

### Fase 9 — Testing, rendimiento y regresión continua

**Objetivo:** convertir la estabilidad y el rendimiento en garantías verificables.

**Resultado esperado:**

- estrategia clara de unit, integration, smoke, regression y performance tests;
- fixtures representativos y corpora grandes;
- pruebas de parser, indexer, caches, semantic facade, providers y adapters;
- presupuestos de latencia y memoria documentados;
- detección temprana de regresiones.

**Dependencias:** providers, caches y arquitectura modular.

---

### Fase 10 — IA, agentes y consumo estructurado del conocimiento

**Objetivo:** permitir que agentes IA trabajen sobre el repo de forma segura, trazable y alineada con la arquitectura.

**Resultado esperado:**

- contexto compacto del plugin;
- estrategia IA separada de arquitectura y backlog;
- orquestación clara de agentes;
- prompts reutilizables e indexados;
- reglas de no duplicación documental aplicadas;
- capacidad de auditar, refactorizar y proponer cambios sin perder contexto.

**Dependencias:** documentación core normalizada y arquitectura estable.

---

### Fase 11 — Calidad de producto y preparación profesional

**Objetivo:** consolidar el plugin como producto profesional usable por equipos reales.

**Resultado esperado:**

- UX consistente con VS Code;
- comandos y vistas útiles;
- logging y soporte de incidencias;
- release process claro;
- documentación de workflows;
- soporte progresivo a proyectos reales grandes;
- mantenimiento sostenible.

**Dependencias:** testing, performance, workflows y documentación de producto.

---

## 5. Dependencias macro

```text
Documentación y gobierno
  → Arquitectura limpia
    → Workspace/indexing
      → Semantic facade/symbol graph
        → Cache layer
          → Features LSP profesionales
            → DataWindow avanzado
              → Integraciones externas
                → Testing/performance continuo
                  → IA/agentes y calidad de producto
```

---

## 6. Prioridades estratégicas

### 6.1. Prioridad máxima

- no bloquear el editor;
- mantener arquitectura modular;
- evitar duplicidad de resolución semántica;
- asegurar caches con contrato e invalidación;
- documentar cada cambio relevante en su fuente canónica.

### 6.2. Prioridad alta

- hover/completion/signature realmente útiles;
- diagnostics fiables;
- tras cerrar el carril runtime interactivo y discovery real, reducir ruido visual de diagnostics sin perder explainability;
- symbol graph estable;
- soporte incremental de DataWindow;
- pruebas de regresión y performance.

### 6.3. Prioridad progresiva

- integraciones externas;
- workflows avanzados;
- agentes IA especializados;
- enriquecimientos de catálogo;
- automatización de release y soporte.

---

## 7. Criterios de avance entre fases

Una fase puede considerarse madura cuando:

- su documentación propietaria está alineada;
- sus decisiones están reflejadas en arquitectura/status si aplica;
- su trabajo accionable está en backlog/specs, no en roadmap;
- existen pruebas suficientes para evitar regresiones;
- no introduce duplicidad documental;
- no degrada rendimiento interactivo;
- el siguiente foco puede expresarse en `docs/current-focus.md`.

---

## 8. Límites explícitos de este roadmap

Este roadmap no debe listar specs concretas ni tareas con IDs. Si durante una revisión aparecen referencias a specs específicas, deben moverse a:

- `docs/backlog.md`, si son trabajo accionable;
- `docs/current-focus.md`, si son foco inmediato;
- `docs/done-log.md`, si son histórico cerrado;
- `docs/architecture-status.md`, si son desviaciones o riesgos actuales.
