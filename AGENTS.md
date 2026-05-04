# AGENTS.md

## Propósito

Este repositorio usa IA para:

- analizar;
- revisar;
- proponer;
- implementar cambios controlados;
- reforzar validación;
- mantener documentación viva;
- y ayudar a evolucionar un plugin profesional de VS Code para PowerBuilder 2025.

La lógica principal del proyecto vive en `docs/` y en las specs.  
Este archivo fija reglas operativas mínimas para agentes IA.

---

## Contexto del repositorio

Este repositorio desarrolla un **plugin de VS Code para PowerBuilder y PowerScript**.

No es una aplicación PowerBuilder de negocio.

Los archivos PowerBuilder del repo se usan como:

- corpus;
- fixtures;
- pruebas del lenguaje;
- muestras de validación;
- ejemplos de comportamiento real.

Los agentes no deben tratar este repositorio como si fuera una app PowerBuilder empresarial.

---

## Meta maestra

> **El plugin debe descubrir e indexar muy rápido sin bloquear.**

Todos los agentes deben proteger:

- carga rápida;
- activación perezosa;
- cliente ligero;
- servidor LSP separado;
- prioridad al archivo activo;
- indexación progresiva;
- latencia interactiva baja;
- persistencia útil;
- observabilidad;
- degradación segura;
- semántica fuerte.

---

## Orden obligatorio de lectura

Antes de cambios relevantes, leer en este orden:

1. `docs/00-ai-entrypoint.md`
2. `docs/product-operating-model.md`
3. `docs/constitution.md`
4. `docs/current-focus.md`
5. `docs/architecture.md`
6. `docs/backlog.md`
7. `docs/done-log.md`
8. spec activa en `specs/`, si aplica

Añadir según el tipo de cambio:

- si afecta PowerBuilder semantics:
  - `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- si afecta tests:
  - `docs/testing.md`
- si afecta rendimiento:
  - `docs/performance-budget.md`
- si afecta agentes/IA:
  - `docs/ai-orchestrator.md`
  - `docs/ai-agents-catalog.md`
  - `docs/ai-strategy.md`
  - `docs/ai-context/powerbuilder-plugin-context.md` como pack corto de arranque, sin sustituir la autoridad documental
- si afecta diagnósticos:
  - `docs/rules-catalog.md`
- si afecta UX/workflows:
  - `docs/developer-workflows.md`

---

## Mecanismos de IA permitidos

Este repositorio distingue tres mecanismos:

### 1. Custom agents

Se usan para roles persistentes con reglas y herramientas específicas.

### 2. Prompt files

Se usan para tareas cortas, repetibles y bien acotadas.

### 3. Skills

Se usan para capacidades reutilizables más amplias que no justifican crear más agentes.

Regla:

> Si algo puede resolverse con prompt file o skill, no debe crearse un agente nuevo.

---

## Tipos de agentes

### Read-only

No modifican código ni archivos del producto.

Pueden:

- analizar;
- investigar;
- revisar;
- detectar riesgos;
- preparar contexto;
- proponer planes;
- auditar documentación.

### Write-enabled

Pueden aplicar cambios controlados.

Deben respetar siempre:

- `docs/00-ai-entrypoint.md`
- `docs/product-operating-model.md`
- `docs/constitution.md`
- `docs/spec-driven-development.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/current-focus.md`
- `docs/backlog.md`
- `docs/done-log.md`
- spec activa en `specs/`, si aplica

---

## Catálogo actual

### Read-only

- `spec-orchestrator`
- `research-analyst`
- `architecture-reviewer`
- `docs-auditor`
- `codebase-analyst`

### Write-enabled

- `implementation-agent`
- `test-writer`
- `docs-updater`

---

## Regla de autoridad documental

Cuando haya conflicto entre artefactos, los agentes deben respetar este orden:

1. `docs/constitution.md`
2. `docs/architecture.md`
3. specs activas en `specs/`
4. `docs/roadmap.md`
5. `docs/current-focus.md`
6. `docs/backlog.md`
7. estado real del código

El código existente no invalida por sí solo una decisión documental vigente.

Si código y documentación divergen, el agente debe:

1. señalar la divergencia;
2. corregir documentación o código según corresponda;
3. no cerrar trabajo hasta alinear artefactos canónicos.

---

## Propiedad única de información

Los agentes deben evitar duplicar información entre documentos.

Documento propietario por tipo de información:

- Reglas no negociables → `docs/constitution.md`
- Ruta rápida IA → `docs/00-ai-entrypoint.md`
- Modelo operativo → `docs/product-operating-model.md`
- Foco inmediato → `docs/current-focus.md`
- Trabajo vivo → `docs/backlog.md`
- Histórico cerrado → `docs/done-log.md`
- Dirección estratégica → `docs/roadmap.md`
- Arquitectura → `docs/architecture.md`
- Dominio PowerBuilder → `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- Testing → `docs/testing.md`
- Rendimiento → `docs/performance-budget.md`
- SDD → `docs/spec-driven-development.md`
- Agentes → `docs/ai-agents-catalog.md`
- Orquestación IA → `docs/ai-orchestrator.md`
- Visión IA → `docs/ai-strategy.md`
- Context pack corto IA → `docs/ai-context/powerbuilder-plugin-context.md`
- Diagnósticos → `docs/rules-catalog.md`
- Workflows usuario → `docs/developer-workflows.md`
- Referencias de `plugin_old` → `docs/plugin-old-migration-opportunities.md`

Otros documentos pueden referenciar, pero no duplicar reglas completas.

---

## Regla de contexto mínimo

Leer solo el contexto necesario.

### Base mínima para cambios relevantes

- `docs/00-ai-entrypoint.md`
- `docs/product-operating-model.md`
- `docs/constitution.md`
- `docs/current-focus.md`
- `docs/architecture.md`
- `docs/backlog.md`

### Añadir solo cuando haga falta

- spec activa;
- `docs/ai-context/powerbuilder-plugin-context.md` para tareas IA con budget corto;
- `README.md`;
- archivos del área afectada;
- tests o fixtures relacionados;
- documentación impactada;
- guía técnica PowerBuilder;
- performance budget;
- testing strategy;
- rules catalog.

---

## Orden de trabajo

Cuando aplique, los agentes deben:

1. leer contexto mínimo;
2. analizar estado real;
3. detectar impactos;
4. proponer plan;
5. ejecutar solo si procede;
6. validar;
7. actualizar documentación viva;
8. actualizar backlog/done-log/current-focus si aplica;
9. dejar claro el siguiente paso.

---

## Regla de handoff

- Los agentes read-only preparan contexto, riesgos y siguiente paso.
- Los agentes write-enabled solo entran cuando la tarea está suficientemente madura.
- Si una tarea no está clara, vuelve a `spec-orchestrator` o al agente read-only adecuado.
- Ningún write-enabled debe empujar implementación si falta spec, plan o foco claro.
- Ningún write-enabled debe mover un ítem a `Done` sin validación y documentación.

---

## Reglas obligatorias

Los agentes deben:

- mantener cliente ligero y runtime/LSP separado;
- no duplicar lógica semántica entre features;
- no reconstruir semántica fuera del knowledge pipeline;
- no fingir capacidades no implementadas;
- no mezclar código del plugin con lógica de una app PowerBuilder de negocio;
- priorizar rendimiento, claridad y mantenibilidad;
- preferir cambios pequeños y verificables;
- mantener documentación viva alineada;
- respetar readiness/evidence/confidence;
- respetar `sourceOrigin`;
- tratar DataWindow como sublenguaje propio;
- tratar ORCA/PBL como integración legacy separada.

---

## Prohibiciones fuertes

Los agentes no deben:

- cerrar tareas con documentación desalineada;
- cerrar specs en parcial;
- contar slices como specs completas;
- reutilizar carpetas de specs históricas por coincidencia numérica con un ítem de backlog activo;
- reimplementar specs cerradas;
- mover ítems a `Done` sin `done-log.md`;
- abrir superficie funcional que la base actual no pueda sostener;
- inventar alcance fuera de constitución, arquitectura, roadmap, current-focus, backlog o specs activas;
- usar ORCA en hot path;
- parsear DataWindow como PowerScript;
- mezclar source real con `orca-staging`;
- hacer rename/references sin confidence suficiente;
- meter IA dentro del core;
- exponer estructuras internas mutables por API pública;
- portar código de `plugin_old` sin rediseño, tests y alineación arquitectónica.

---

## Regla PowerBuilder

Si un cambio afecta semántica PowerBuilder, revisar:

- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`, si afecta diagnostics
- `docs/developer-workflows.md`, si afecta UX
- fixtures/tests relacionados

Especial atención a:

- Workspace vs Solution;
- `ws_objects`;
- carpetas `*.pbl` modernas;
- SR* container parsing;
- scopes local/shared/global/instance;
- prototypes vs implementations;
- events/on-handlers;
- DataWindow;
- PBAutoBuild;
- ORCA/PBL;
- PBNI/PBX;
- WebView2/JSON/HTTP;
- `sourceOrigin`;
- readiness/evidence/confidence.

---

## Regla de documentación viva

Si un cambio afecta documentación, el agente debe actualizarla o dejar explícitamente qué queda pendiente y por qué.

Revisar como mínimo, cuando aplique:

- `README.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/done-log.md`
- `docs/current-focus.md`
- `docs/spec-driven-development.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`
- `docs/developer-workflows.md`
- specs afectadas

---

## Regla de cierre

Ningún agente debe considerar una tarea cerrada si:

- falta validación;
- faltan tests proporcionales;
- falta actualización documental;
- falta alineación con la spec;
- el estado real no está reflejado en artefactos canónicos;
- el cambio contradice constitución o arquitectura;
- el ítem cerrado sigue apareciendo como activo en `docs/backlog.md`;
- el cierre no está registrado en `docs/done-log.md`.

---

## Validación mínima

Aplicar validación proporcional al cambio.

Como referencia:

- cambios generales:
  - `npm run build:test`
  - `npm test`
- cambios en rendimiento/scheduler/indexing/cache/serving/warm resume:
  - `npm run test:performance`
- cambios en parsing/semántica/diagnostics/references/rename/confidence:
  - tests unitarios focalizados;
  - tests negativos;
  - goldens si aplica.

---

## Salida mínima esperada

Toda intervención útil de un agente debe dejar:

- contexto mínimo usado;
- módulos o documentos afectados;
- riesgos;
- resultado o hallazgo principal;
- validación ejecutada o pendiente;
- documentación actualizada o pendiente;
- siguiente paso recomendado.

---

## Regla final

La prioridad de todos los agentes es:

1. proteger la base del plugin;
2. mantener rendimiento y no bloqueo;
3. evitar duplicación futura;
4. reforzar validación;
5. mejorar entendimiento real de PowerBuilder;
6. y mantener documentación viva alineada.