# Orquestador de IA del repositorio

## 1. Objetivo

El orquestador IA enruta tareas al mecanismo adecuado sin perder gobernanza técnica.

No sustituye al desarrollador principal ni al flujo SDD.

---

## 2. Mecanismos

### Custom agents

Roles persistentes con reglas, herramientas y handoffs.

### Prompt files

Tareas ligeras y repetibles.

### Skills

Capacidades portables y reutilizables con lógica o recursos propios.

---

## 3. Principios

- Contexto mínimo.
- Especialización clara.
- La spec manda.
- Write-enabled solo con tarea madura.
- Herramientas mínimas por rol.
- Lean antes que proliferación.
- Documentación viva obligatoria.

---

## 4. Handoffs válidos

- `spec-orchestrator` → `research-analyst`, `architecture-reviewer`, `docs-auditor`, `codebase-analyst`
- `research-analyst` → `spec-orchestrator` o `architecture-reviewer`
- `codebase-analyst` → `spec-orchestrator` o `architecture-reviewer`
- `architecture-reviewer` → `spec-orchestrator` o `implementation-agent` solo si la tarea está madura
- `implementation-agent` → `test-writer` → `docs-updater`
- revisión final → `architecture-reviewer` y/o `docs-auditor`

---

## 5. Flujo — Nueva feature

1. `spec-orchestrator`
2. `research-analyst` si falta contexto
3. `architecture-reviewer`
4. `docs-auditor`
5. si está madura:
   - `implementation-agent`
   - `test-writer`
   - `docs-updater`
6. revisión final:
   - `architecture-reviewer`
   - `docs-auditor`

---

## 6. Flujo — Cierre de spec

1. `codebase-analyst`
   - verifica estado real del código;
   - identifica módulos afectados.

2. `test-writer`
   - añade o valida tests;
   - ejecuta baseline proporcional.

3. `docs-updater`
   - actualiza documentación viva;
   - mueve Done a done-log si aplica.

4. `docs-auditor`
   - revisa backlog/current-focus/done-log/roadmap.

5. `architecture-reviewer`
   - valida que no rompe constitución ni arquitectura.

6. `spec-orchestrator`
   - resume cierre;
   - propone siguiente foco.

---

## 7. Flujo — Reorganización documental

1. `docs-auditor`
   - detecta duplicidades, contradicciones y documentos desactualizados.

2. `architecture-reviewer`
   - valida autoridad documental y separación de responsabilidades.

3. `docs-updater`
   - aplica cambios.

4. `spec-orchestrator`
   - actualiza backlog derivado si aparecen nuevas specs.

---

## 8. Salida mínima del sistema

- objetivo;
- contexto mínimo;
- módulos afectados;
- documentación afectada;
- riesgos;
- plan por pasos;
- validación requerida;
- recomendación final.

---

## 9. Guardrails

- Ningún write-enabled ejecuta sin spec, plan o tarea madura.
- Ningún agente cierra tarea sin validación y documentación.
- Cambios pequeños y revisables.
- Si hay ambigüedad, vuelve a `spec-orchestrator`.
- Si una tarea es repetible y simple, usar prompt file.
- Si una capacidad es estable y reusable, evaluar skill.
