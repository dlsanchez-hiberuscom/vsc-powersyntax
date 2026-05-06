# AI Orchestration — Orquestador IA del Plugin PowerBuilder para VS Code

> **Estado:** documento canónico del orquestador IA.  
> **Última revisión:** 2026-05-06.  
> **Ámbito:** decisión, coordinación, ejecución, validación, handoff y cierre de tareas ejecutadas con IA/agentes.  
> **No contiene:** estrategia general de IA, backlog, specs concretas, prompts largos, arquitectura completa ni catálogo exhaustivo de agentes.  
> **Documentos relacionados:** `docs/constitution.md`, `docs/ai-strategy.md`, `docs/ai/agent-skill-routing.md`, `docs/ai/lean-token-policy.md`, `docs/ai-context/powerbuilder-plugin-context.md`, `docs/spec-driven-development.md`, `docs/developer-workflows.md`, `docs/testing.md`, `docs/performance-budget.md`.

---

## 1. Propósito

Este documento es el **orquestador operativo de IA** del repositorio.

Debe responder a una pregunta:

> ¿Cómo decide, coordina, valida y cierra la IA una tarea sin romper arquitectura, documentación, testing, performance ni trazabilidad?

No define la estrategia general de IA. Esa vive en `docs/ai-strategy.md`.  
No define qué agente usar para cada caso. Eso vive en `docs/ai/agent-skill-routing.md`.  
No define prompts concretos. Eso vive en `docs/prompts/README.md` y en archivos de prompt reutilizables.

---

## 2. Rol del orquestador

El orquestador IA gobierna el flujo completo de una tarea asistida por IA:

```text
User Request
  → Intake
  → Task Classification
  → Context Plan
  → Agent / Skill Selection
  → Execution Plan
  → Iterative Execution
  → Validation
  → Documentation Alignment
  → Handoff or Closure
```

Su función es decidir **qué se hace, en qué orden, con qué contexto, con qué agente/capacidad y con qué validaciones mínimas**.

---

## 3. Contrato de entrada

Toda tarea IA debe comenzar con una entrada mínima:

```text
user request
expected output
scope
files or areas mentioned
constraints
whether code changes are allowed
whether docs changes are allowed
whether frozen docs are protected
```

Si la entrada no es suficiente, el orquestador debe determinar si puede avanzar con análisis del repo o si necesita aclaración.

---

## 4. Clasificación de tarea

El orquestador debe clasificar la tarea en una o varias categorías:

```text
documentation-normalization
spec-driven-development
architecture-audit
code-refactor
lsp-feature
performance-hot-path
testing-improvement
datawindow-domain
external-integration
release
troubleshooting
ai-ops
```

Reglas:

1. Si afecta varios documentos canónicos, incluir `documentation-normalization`.
2. Si implica cambio técnico no trivial, evaluar si requiere spec.
3. Si afecta hover, completion, signature, definition, references, diagnostics o semantic tokens, incluir `lsp-feature` y `performance-hot-path`.
4. Si afecta DataWindow, incluir `datawindow-domain`.
5. Si afecta ORCA/PBAutoBuild, incluir `external-integration`.
6. Si afecta release o soporte, incluir `release` o `troubleshooting`.

---

## 5. Decisión: ¿requiere spec?

El orquestador debe aplicar `docs/spec-driven-development.md`.

Requiere spec si:

- afecta arquitectura o límites de capas;
- modifica parser, indexer, symbol graph, semantic facade o cache layer;
- afecta hot paths LSP;
- modifica DataWindow domain;
- integra herramientas externas;
- requiere tests nuevos o fixtures;
- afecta varios documentos;
- tiene riesgo de performance;
- será ejecutado por agente IA de forma autónoma.

No requiere spec si:

- es una corrección documental pequeña;
- es una actualización de índice;
- no cambia código ni contratos;
- el alcance es trivial y verificable.

---

## 6. Plan de contexto

El orquestador debe decidir qué contexto cargar usando `docs/ai/lean-token-policy.md`.

Orden recomendado:

```text
1. docs/constitution.md
2. Documento propietario de la tarea
3. docs/spec-driven-development.md si hay spec o posible spec
4. docs/architecture.md + docs/architecture-status.md si afecta diseño/estado
5. docs/testing.md + docs/performance-budget.md si afecta código/hot path
6. docs/developer-workflows.md si afecta operación diaria
7. docs/release.md + docs/troubleshooting.md si afecta release/soporte
8. docs/ai-context/powerbuilder-plugin-context.md si necesita dominio PowerBuilder
9. Código real afectado
```

Regla: no cargar documentos grandes completos salvo necesidad explícita.

Documentos grandes a evitar por defecto:

```text
docs/done-log.md
docs/architecture-implementation-map.md
docs/powerbuilder-2025-vscode-plugin-technical-guide.md
```

---

## 7. Selección de agente/capacidad

La selección detallada vive en `docs/ai/agent-skill-routing.md`.

El orquestador debe elegir una o varias capacidades:

```text
Documentation Agent
SDD Agent
Architecture Agent
Language Core Agent
LSP Feature Agent
Performance Agent
Testing Agent
PowerBuilder Domain Agent
Integration Agent
Release Agent
Troubleshooting Agent
AI Ops Agent
```

Ejemplo:

```text
Tarea: Hover lento y poco útil
  → LSP Feature Agent
  → Performance Agent
  → Testing Agent
  → Documentation Agent
```

---

## 8. Plan de ejecución

Antes de modificar archivos, el orquestador debe producir un plan breve:

```text
classification
context to load
agents/capabilities
files to inspect
files likely to change
validation plan
documentation impact
risks
```

No debe generar planes largos si la tarea es directa. El plan debe ser útil para ejecutar, no para duplicar documentación.

---

## 9. Ejecución iterativa

Durante la ejecución:

1. Revisar archivos reales antes de modificar.
2. Modificar en pasos pequeños.
3. Mantener cambios dentro del scope.
4. Evitar documentos nuevos si existe propietario.
5. No tocar documentos congelados sin autorización explícita.
6. Añadir tests si aplica.
7. Actualizar documentación afectada.
8. Registrar follow-ups en backlog/spec si aparecen.

---

## 10. Validación obligatoria

El orquestador debe decidir validaciones según tipo de tarea.

### 10.1. Documentación

```text
ownership check
duplicate check
relative links check
frozen docs check
```

### 10.2. Código

```text
typecheck
unit tests
contract tests
integration tests
smoke tests
```

### 10.3. Hot path / performance

```text
performance smoke
latency check
cache hit/miss review
fallback review
```

### 10.4. Release / troubleshooting

```text
release checklist
install/package smoke
known issue review
support data review
```

Si una validación no puede ejecutarse, debe quedar indicada como **not run** con motivo y comando recomendado.

---

## 11. Alineación documental

Antes de cerrar, el orquestador debe revisar si hay que actualizar:

```text
docs/architecture.md
docs/architecture-status.md
docs/current-focus.md
docs/backlog.md
docs/roadmap.md
docs/spec-driven-development.md
docs/testing.md
docs/performance-budget.md
docs/developer-workflows.md
docs/release.md
docs/troubleshooting.md
docs/ai-strategy.md
docs/ai-orchestration.md
docs/ai/*
docs/prompts/README.md
```

Regla: actualizar solo documentos afectados. No reescribir documentación no relacionada.

---

## 12. Handoff entre agentes

Si una tarea pasa a otro agente/capacidad, el handoff debe incluir:

```text
task classification
context already loaded
files inspected
files modified
decisions made
validations run
validations pending
risks
next action
```

No se permite handoff ambiguo cuando hay cambios de código o documentación.

---

## 13. Cierre de tarea

Una tarea IA puede cerrarse si:

```text
[ ] Objetivo cumplido.
[ ] Scope respetado.
[ ] Archivos reales revisados.
[ ] Cambios aplicados.
[ ] Tests/validaciones aplicables ejecutados o justificados.
[ ] Documentación afectada actualizada.
[ ] No hay duplicidad documental nueva.
[ ] No se tocaron documentos congelados sin autorización.
[ ] Riesgos residuales registrados.
[ ] Siguiente paso indicado.
```

---

## 14. Casos de bloqueo

El orquestador debe bloquear o pedir decisión humana si:

- la tarea exige modificar documentos congelados;
- hay conflicto entre documentos canónicos;
- el alcance supera una spec razonable;
- falta código o documentación necesaria;
- la validación crítica no puede ejecutarse;
- hay riesgo de regresión P0/P1;
- se requiere decisión de producto.

---

## 15. Relación con backlog/current-focus

Reglas:

- Si surge trabajo accionable, va a `docs/backlog.md` o a una spec.
- Si la tarea cambia el foco activo, actualizar `docs/current-focus.md`.
- Si es visión estratégica, no va al backlog; va a `docs/roadmap.md`.
- Si está cerrado históricamente, solo va a `docs/done-log.md` cuando se autorice.

---

## 16. Relación con SDD

Si la tarea requiere spec:

1. crear o actualizar spec;
2. enlazarla desde backlog;
3. ejecutar según `docs/spec-driven-development.md`;
4. validar tests/performance/docs;
5. cerrar solo si cumple criterios.

El orquestador no debe convertir `ai-orchestration.md` en índice de specs.

---

## 17. Relación con prompts

Los prompts reutilizables deben seguir este orquestador.

Todo prompt operativo debe declarar:

```text
objective
required context
agent/capability
files to inspect
validation plan
documentation impact
closure format
```

El índice de prompts vive en `docs/prompts/README.md`.

---

## 18. Salida estándar del orquestador

Formato mínimo de salida para tareas ejecutadas:

```text
Classification:
Agents/Capabilities:
Files reviewed:
Files changed:
Validations run:
Validations not run:
Documentation updated:
Risks / follow-ups:
Next step:
```

---

## 19. Antipatrones

No hacer:

- ejecutar sin clasificar tarea;
- cargar todo el repo sin necesidad;
- modificar código sin revisar archivos reales;
- cerrar sin pruebas aplicables;
- duplicar arquitectura en docs IA;
- convertir prompts en specs;
- convertir roadmap en backlog;
- ignorar performance en hot paths;
- tocar done-log/mapa congelado sin autorización.

---

## 20. Límites de este documento

Este documento no debe contener:

- estrategia general de IA;
- catálogo largo de agentes;
- prompts completos;
- backlog;
- specs concretas;
- arquitectura objetivo completa;
- histórico cerrado.
