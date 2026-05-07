# Agent / Skill Routing — PowerBuilder VS Code Plugin

> **Estado:** documento canónico de selección de agentes/capacidades.  
> **Última revisión:** 2026-05-06.  
> **Ámbito:** decidir qué agente/capacidad participa según el tipo de tarea.  
> **No contiene:** flujo completo de orquestación, prompts largos, backlog, specs concretas ni arquitectura completa.  
> **Documento orquestador:** `docs/ai-orchestration.md`.

---

## 1. Propósito

Este documento responde a una pregunta:

> ¿Qué agente o capacidad debe intervenir según la tarea?

El flujo completo de decisión, ejecución, validación y cierre vive en `docs/ai-orchestration.md`.

---

## 2. Mapa rápido de routing

| Tarea | Capacidad principal | Capacidades de apoyo | Documentos clave |
|---|---|---|---|
| Normalizar documentación | Documentation Agent | AI Ops Agent | `constitution.md`, documento propietario |
| Crear/ejecutar spec | SDD Agent | Documentation Agent, Testing Agent | `spec-driven-development.md`, `backlog.md` |
| Auditar arquitectura | Architecture Agent | Documentation Agent | `architecture.md`, `architecture-status.md` |
| Refactor de parser/indexer | Language Core Agent | Testing Agent, Performance Agent | `architecture.md`, `testing.md` |
| Hover/completion/signature | LSP Feature Agent | Performance Agent, Testing Agent | `architecture.md`, `performance-budget.md`, `testing.md` |
| Diagnostics/semantic tokens | LSP Feature Agent | Language Core Agent, Testing Agent | `architecture.md`, `testing.md` |
| Cache/invalidation | Performance Agent | Architecture Agent, Testing Agent | `performance-budget.md`, `architecture.md` |
| DataWindow | PowerBuilder Domain Agent | LSP Feature Agent, Testing Agent | `architecture.md`, `powerbuilder-plugin-context.md` |
| ORCA/PBAutoBuild | Integration Agent | Troubleshooting Agent, Testing Agent | `developer-workflows.md`, `troubleshooting.md` |
| Release | Release Agent | Testing Agent, Troubleshooting Agent | `release.md`, `testing.md` |
| Incidencia | Troubleshooting Agent | Performance Agent si aplica | `troubleshooting.md`, logs/caso |
| Prompt reusable | AI Ops Agent | Documentation Agent | `prompts/README.md`, `lean-token-policy.md` |

---

## 3. Capacidades

### 3.1. Documentation Agent

Responsable de:

- ownership documental;
- no duplicación;
- normalización;
- enlaces relativos;
- documentos congelados.

Debe leer siempre `docs/constitution.md`.

---

### 3.2. SDD Agent

Responsable de:

- crear specs;
- validar estructura mínima;
- enlazar backlog;
- definir criterios de aceptación;
- verificar cierre.

Debe leer `docs/spec-driven-development.md`.

---

### 3.3. Architecture Agent

Responsable de:

- comparar código real con arquitectura objetivo;
- detectar desviaciones;
- actualizar estado arquitectónico;
- derivar trabajo a backlog/specs.

Debe leer `docs/architecture.md` y `docs/architecture-status.md`.

---

### 3.4. Language Core Agent

Responsable de:

- parser;
- indexer;
- workspace model;
- symbol graph;
- semantic facade;
- scopes/resolution.

Debe coordinarse con Testing Agent si toca lógica semántica.

---

### 3.5. LSP Feature Agent

Responsable de:

- hover;
- completion;
- signature help;
- definition;
- references;
- diagnostics;
- semantic tokens;
- document symbols.

Debe coordinarse con Performance Agent para hot paths.

---

### 3.6. Performance Agent

Responsable de:

- latencia;
- cache hit/miss;
- invalidación;
- memoria;
- fallback;
- budgets.

Debe leer `docs/performance-budget.md`.

---

### 3.7. Testing Agent

Responsable de:

- unit tests;
- contract tests;
- integration tests;
- smoke tests;
- performance tests;
- fixtures/corpora.

Debe leer `docs/testing.md`.

---

### 3.8. PowerBuilder Domain Agent

Responsable de:

- semántica PowerBuilder;
- DataWindow;
- objetos PB;
- eventos/funciones;
- targets/libraries/workspaces;
- adaptación de patrones legacy.

Debe leer `docs/ai-context/powerbuilder-plugin-context.md`.

---

### 3.9. Integration Agent

Responsable de:

- ORCA;
- PBAutoBuild;
- procesos externos;
- runners;
- parsers de salida;
- mapeo de errores.

Debe asegurar degradación segura si la herramienta no está disponible.

---

### 3.10. Release Agent

Responsable de:

- checklist de release;
- empaquetado;
- validación post-package;
- release notes;
- criterios de bloqueo.

Debe leer `docs/release.md`.

---

### 3.11. Troubleshooting Agent

Responsable de:

- síntomas;
- causas probables;
- logs;
- reproducción;
- support bundle;
- workarounds;
- conversión de bugs en tests.

Debe leer `docs/troubleshooting.md`.

---

### 3.12. AI Ops Agent

Responsable de:

- prompts;
- contexto;
- token policy;
- handoffs;
- mejoras del sistema IA.

Debe leer `docs/ai-strategy.md`, `docs/ai-orchestration.md` y `docs/ai/lean-token-policy.md`.

---

## 4. Reglas de combinación

- Toda tarea documental incluye Documentation Agent.
- Toda tarea con spec incluye SDD Agent.
- Toda tarea de hot path incluye Performance Agent.
- Toda tarea de código debe considerar Testing Agent.
- Toda tarea DataWindow incluye PowerBuilder Domain Agent.
- Toda tarea ORCA/PBAutoBuild incluye Integration Agent.
- Toda tarea release incluye Release Agent.
- Toda incidencia incluye Troubleshooting Agent.

---

## 5. Salida esperada por agente

Cada agente/capacidad debe devolver:

```text
role
files reviewed
findings
changes made or proposed
validations
risks
handoff target if needed
```

---

## 6. Registro canónico de agentes y skills versionados

Agentes versionados disponibles en `.github/agents/` y su traducción operacional:

- `docs-auditor`: alias de solo lectura para Documentation Agent.
- `docs-updater`: alias de actualización enfocada para Documentation Agent.
- `docs`: alias operativo corto para Documentation Agent.
- `implementer`: agente ejecutor principal para cambios acotados con tests y documentación alineada.
- `planner`: agente de planificación sin edición para scoping, validación y owner docs.
- `reviewer`: agente de revisión técnica antes de merge.
- `release`: agente de auditoría de CI, VSIX y release-readiness.

Skills versionadas disponibles en `.github/skills/` y su owner natural:

- `build-release`: release lane, CI, VSIX y readiness; coordina con Release Agent e Integration Agent.
- `catalog-maintenance`: catálogos manual/generated/localization; coordina con Language Core Agent.
- `datawindow-analysis`: subdominio DataWindow/DataStore; coordina con PowerBuilder Domain Agent.
- `docs-governance`: ownership documental y no duplicación; coordina con Documentation Agent.
- `official-research`: contraste con documentación oficial antes de cambiar contratos inciertos.
- `performance-hotpath`: budgets, hot paths, invalidación y latencia; coordina con Performance Agent.
- `powerbuilder-semantics`: símbolos, scopes, herencia y resolución PowerBuilder; coordina con Language Core Agent.
- `testing-validation`: diseño y cierre de validación unitaria, integración, smoke y performance; coordina con Testing Agent.

---

## 7. Límites

Este documento no decide el flujo completo. Para eso usar `docs/ai-orchestration.md`.
