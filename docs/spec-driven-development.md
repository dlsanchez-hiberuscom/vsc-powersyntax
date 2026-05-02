# Spec-Driven Development (SDD) — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este repositorio usa un enfoque **Spec-Driven Development** ligero, vivo y pragmático.

La spec no es decoración: dirige el cambio.

---

## 2. Flujo oficial

1. Constitution
2. Specify
3. Plan
4. Tasks
5. Implement
6. Validate
7. Update docs
8. Close / move to done-log

---

## 3. Autoridad documental

1. `docs/constitution.md`
2. `docs/architecture.md`
3. specs activas en `specs/`
4. `docs/roadmap.md`
5. `docs/current-focus.md`
6. `docs/backlog.md`
7. implementación actual

---

## 4. Definition of Ready

Una feature está Ready cuando:

- la spec es clara y acotada;
- el alcance está definido;
- el fuera de alcance está definido;
- la aceptación es verificable;
- el plan técnico es suficiente;
- los riesgos principales son entendibles;
- las tareas son razonables y pequeñas.

---

## 5. Definition of Done

Una feature está Done solo cuando:

- cumple criterios de aceptación;
- pasa validación prevista;
- no degrada injustificadamente la experiencia;
- documentación viva actualizada;
- backlog/done-log/current-focus alineados si aplica;
- no deja deuda crítica oculta sin registrar.

---

## 6. Documentación viva obligatoria

Toda spec debe declarar qué documentación puede verse afectada.

Estructura mínima de una spec activa:

- `spec.md`
- `plan.md`
- `tasks.md`

`quickstart.md` es obligatorio solo cuando aporta una validación o ruta de uso reproducible que no cabe claramente en `plan.md`; para slices históricas o documentación retroactiva puede omitirse si `plan.md` declara validación suficiente.

El número de carpeta en `specs/NNN-*` es un identificador secuencial de spec, no el ID del backlog. Cuando una spec implementa `Bxxx`, debe declararlo explícitamente en título o cuerpo para evitar colisiones como `specs/042-*` frente a `B042`.

Checklist de revisión documental:

- `README.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/rules-catalog.md`
- `docs/developer-workflows.md`
- `docs/ai-strategy.md`
- `docs/ai-orchestrator.md`
- `docs/ai-agents-catalog.md`

Una spec no está Done si la documentación viva afectada no está actualizada.

---

## 7. Matriz de documentación afectada

### Si cambia arquitectura

Actualizar:

- `architecture.md`
- `roadmap.md` si cambia fase
- `backlog.md`
- specs afectadas

### Si cambia rendimiento

Actualizar:

- `performance-budget.md`
- `testing.md`
- `backlog.md`

### Si cambia parsing o semántica PowerBuilder

Actualizar:

- `powerbuilder-2025-vscode-plugin-technical-guide.md`
- `rules-catalog.md` si añade diagnóstico
- `testing.md`
- `backlog.md`

### Si cierra trabajo

Actualizar:

- `backlog.md`
- `done-log.md`
- `current-focus.md`
- `roadmap.md` si aplica

### Si afecta IA/agentes

Actualizar:

- `ai-strategy.md`
- `ai-orchestrator.md`
- `ai-agents-catalog.md`
- `00-ai-entrypoint.md` si cambia regla global

---

## 8. Reglas para IA

La IA debe:

- leer `00-ai-entrypoint.md` antes de cambios relevantes;
- respetar `current-focus.md`;
- no inventar alcance;
- no cerrar sin tests/docs;
- no reimplementar specs cerradas;
- actualizar documentación viva.

La IA no debe:

- abrir features fuera de foco sin causa;
- mover items a Done sin done-log;
- tocar ORCA hot path;
- meter IA dentro del core;
- parsear DataWindow como PowerScript.

Guardrail adicional de arquitectura:

- si una spec retira DTOs de transporte/editor del core, debe dejar tipos internos, mappers de borde y un test arquitectónico que impida la reintroducción del acoplamiento.
- si una spec publica salida LSP derivada de parser + snapshot semántico, debe dejar un reporte o assertions de reconciliación con reason codes antes de ampliar más UX visible.

---

## 9. Cierre de spec

Al cerrar una spec:

1. verificar criterios de aceptación;
2. ejecutar validación proporcional;
3. actualizar documentación afectada;
4. mover ítems cerrados fuera de backlog;
5. añadir entrada en done-log;
6. actualizar current-focus si cambia el foco;
7. actualizar roadmap si cambia fase;
8. registrar deuda derivada si queda algo pendiente.
