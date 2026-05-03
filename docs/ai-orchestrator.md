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
- Specs activas sin documentación mínima vuelven a `spec-orchestrator` antes de implementación.
- Slices cerradas no cuentan como specs completas ni cierran épicas padre.
- Toda tarea write-enabled debe partir del `taskExecutionCatalog` exportado por el producto; la documentación contextualiza, pero no sustituye el contrato publicado.

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
- `contractId`, dry-run y receipts esperados cuando la tarea sea write-enabled;
- recomendación final.

---

## 9. Reglas de specs faltantes y cierre

- Si el foco activo no tiene spec propia, crear o pedir una spec nueva con siguiente ID libre; no reutilizar carpetas históricas por coincidencia numérica con `Bxxx`.
- Toda spec activa debe tener `spec.md`, `plan.md` y `tasks.md`; `quickstart.md` se añade cuando aporte validación o uso reproducible.
- Un slice puede registrarse como cerrado si su validación y documentación están completas, pero no mueve el ítem padre a Done salvo que todos los criterios del padre estén cumplidos.
- El backlog contiene trabajo activo; el done-log contiene trabajo cerrado; current-focus contiene solo el foco inmediato.
- Si código y documentación divergen, el agente debe alinear ambos o registrar backlog preciso antes de cerrar.

---

## 10. Guardrails

- Ningún write-enabled ejecuta sin spec, plan o tarea madura.
- Ningún agente cierra tarea sin validación y documentación.
- Cambios pequeños y revisables.
- Si hay ambigüedad, vuelve a `spec-orchestrator`.
- Si una tarea es repetible y simple, usar prompt file.
- Si una capacidad es estable y reusable, evaluar skill.
- Toda tarea write-enabled debe citar `contractId`, ejecutar o simular el dry-run declarado y recoger receipts antes del cierre.
