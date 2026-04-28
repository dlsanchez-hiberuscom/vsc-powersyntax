# AGENTS.md

## Propósito

Este repositorio usa IA para:

- analizar,
- revisar,
- proponer,
- implementar cambios controlados,
- reforzar validación,
- y mantener la documentación alineada.

La lógica del proyecto vive en los demás `.md`; este archivo solo fija reglas operativas mínimas para el uso de agentes.

---

## Contexto

Este repositorio desarrolla un **plugin de VS Code para PowerBuilder y PowerScript**.

No es una aplicación PowerBuilder de negocio.

Los archivos PowerBuilder del repo se usan como:

- corpus,
- fixtures,
- pruebas del lenguaje,
- o muestras para validación.

---

## Mecanismos de IA permitidos

Este repositorio distingue tres mecanismos:

### 1. Custom agents
Se usan para roles persistentes con reglas y herramientas específicas.

### 2. Prompt files
Se usan para tareas cortas, repetibles y bien acotadas.

### 3. Skills
Se usan para capacidades reutilizables más amplias que no justifican crear más agentes.

Regla: si algo puede resolverse con prompt file o skill, no debe crearse un agente nuevo.

---

## Tipos de agentes

### Read-only
No modifican código ni archivos del producto.

### Write-enabled
Pueden proponer o aplicar cambios, pero siempre respetando:

- `docs/constitution.md`
- `docs/spec-driven-development.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- y la spec activa en `specs/` cuando aplique

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
5. `docs/backlog.md`
6. `docs/current-focus.md`
7. estado real del código

El código existente no invalida por sí solo una decisión documental vigente.

---

## Regla de contexto

Leer solo el contexto mínimo necesario.

### Base mínima recomendada
- `docs/constitution.md`
- `docs/spec-driven-development.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`

### Añadir solo cuando haga falta
- spec activa,
- `README.md`,
- archivos del área afectada,
- tests o fixtures relacionados,
- documentación impactada.

---

## Orden de trabajo

Cuando aplique, los agentes deben:

1. analizar,
2. resumir el estado real,
3. detectar impactos,
4. proponer plan,
5. ejecutar solo si procede,
6. validar,
7. y dejar claro el siguiente paso.

---

## Regla de handoff

- Los agentes **read-only** preparan contexto, riesgos y siguiente paso.
- Los agentes **write-enabled** solo deben entrar cuando la tarea ya está suficientemente madura.
- Si una tarea no está clara, el flujo debe volver a `spec-orchestrator` o al agente read-only adecuado.
- Ningún agente write-enabled debe “empujar” implementación si falta spec, plan o foco claro.

---

## Reglas obligatorias

- mantener cliente ligero y runtime/LSP separado;
- no duplicar lógica semántica entre features;
- no fingir capacidades no implementadas;
- no mezclar código del plugin con lógica de una app PowerBuilder de negocio;
- priorizar rendimiento, claridad y mantenibilidad;
- preferir cambios pequeños y verificables;
- no cerrar tareas con documentación desalineada;
- no abrir superficie funcional que la base actual no pueda sostener;
- no inventar alcance fuera de constitución, arquitectura, roadmap, backlog, current focus o specs activas.

---

## Regla de documentación

Si un cambio afecta documentación, el agente debe indicar qué archivos revisar o actualizar.

Como mínimo, cuando aplique:

- `README.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/spec-driven-development.md`
- specs afectadas
- y cualquier otra nota técnica impactada

---

## Regla de cierre

Ningún agente debe considerar una tarea cerrada si:

- falta validación,
- falta actualización documental,
- falta alineación con la spec,
- el estado real no está reflejado en los artefactos canónicos,
- o el cambio contradice constitución o arquitectura.

---

## Salida mínima esperada

Toda intervención útil de un agente debe dejar, como mínimo:

- contexto mínimo usado,
- módulos o documentos afectados,
- riesgos,
- resultado o hallazgo principal,
- y siguiente paso recomendado.

---

## Regla final

La prioridad de todos los agentes es:

1. proteger la base del plugin,
2. mantener el rendimiento,
3. evitar duplicación futura,
4. reforzar validación,
5. y mantener la documentación alineada.