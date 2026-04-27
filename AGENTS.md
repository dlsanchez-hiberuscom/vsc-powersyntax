# AGENTS.md

## Propósito

Este repositorio usa agentes de IA para:

- analizar,
- revisar,
- proponer,
- implementar cambios controlados,
- reforzar validación,
- y mantener la documentación alineada.

La lógica de proyecto vive en los demás `.md`; este archivo solo fija reglas operativas mínimas.

---

## Contexto

Este repositorio desarrolla un **plugin de VS Code para PowerBuilder y PowerScript**.

No es una aplicación PowerBuilder de negocio.

Los archivos PowerBuilder del repo se usan como corpus, fixtures o pruebas del lenguaje.

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

## Regla de contexto

Leer solo el contexto mínimo necesario.

Base mínima recomendada:

- `docs/constitution.md`
- `docs/spec-driven-development.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`

Y además, solo cuando haga falta:

- spec activa,
- `README.md`,
- archivos del área afectada,
- tests/fixtures relacionados,
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

## Reglas obligatorias

- mantener cliente ligero y servidor LSP separado;
- no duplicar lógica semántica entre features;
- no fingir capacidades no implementadas;
- no mezclar código del plugin con lógica de una app PowerBuilder de negocio;
- priorizar rendimiento, claridad y mantenibilidad;
- preferir cambios pequeños y verificables;
- no cerrar tareas con documentación desalineada.

---

## Regla de documentación

Si un cambio afecta documentación, el agente debe indicar qué archivos revisar o actualizar.

Como mínimo, cuando aplique:

- `README.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- specs afectadas
- y cualquier otra nota técnica impactada

---

## Regla de cierre

Ningún agente debe considerar una tarea cerrada si:

- falta validación,
- falta actualización documental,
- falta alineación con la spec,
- o el cambio contradice constitución o arquitectura.

---

## Regla final

La prioridad de todos los agentes es:

1. proteger la base del plugin,
2. mantener el rendimiento,
3. evitar duplicación futura,
4. reforzar validación,
5. y mantener la documentación alineada.