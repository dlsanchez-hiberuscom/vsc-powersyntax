# Catálogo de agentes del repositorio

Este repositorio define agentes persistentes por rol. Las tareas cortas deben resolverse con prompt files y capacidades reutilizables mediante skills.

---

## 1. Read-only agents

1. `spec-orchestrator`
2. `research-analyst`
3. `architecture-reviewer`
4. `docs-auditor`
5. `codebase-analyst`

---

## 2. Write-enabled agents

6. `implementation-agent`
7. `test-writer`
8. `docs-updater`

---

## 3. Reglas comunes

- Ningún agente ignora constitución, arquitectura, current-focus o specs activas.
- Ningún write-enabled entra si la tarea no está madura.
- Todo agente debe devolver contexto mínimo útil, módulos afectados, riesgos y siguiente paso.
- Todo write-enabled debe revisar documentación viva afectada.
- Ningún agente mueve trabajo a Done sin validación y done-log.
- Todo custom agent debe tener frontmatter válido con `name` y `description` claros.
- Si detecta foco activo sin spec mínima (`spec.md`, `plan.md`, `tasks.md`), debe devolverlo a `spec-orchestrator` o crear la spec antes de implementación write-enabled.
- Los agentes deben distinguir slice cerrado de spec/ítem padre cerrado.
- Para tareas write-enabled, todo agente debe leer el `taskExecutionCatalog`, citar `contractId` y respetar dry-run, límites y receipts antes de ejecutar.
- `docs-updater` debe consumir `docsTouched`, `docsPending`, `specsAffected` y `nextFocus` del `validationReceipt` cuando exista, y no cerrar trabajo mientras `docsPending` siga abierto.
- Para arrancar tareas IA con budget corto, el punto de entrada recomendado es `docs/ai-context/powerbuilder-plugin-context.md`; si no basta, se amplía con documentación propietaria, no con resúmenes duplicados.

---

## 4. spec-orchestrator

### Tipo
Read-only.

### Puede
- coordinar tareas;
- decidir contexto mínimo;
- proponer agentes/mecanismos;
- preparar plan de ejecución.

### No puede
- implementar;
- cerrar tareas sin validación;
- saltarse current-focus.

### Entrada mínima
- objetivo;
- current-focus;
- backlog/spec activa.

### Salida mínima
- objetivo;
- alcance;
- artefactos relevantes;
- agentes/mecanismos a invocar;
- criterio para pasar a implementación.

---

## 5. research-analyst

### Tipo
Read-only.

### Puede
- investigar documentación local o externa;
- sintetizar hechos;
- identificar dudas abiertas.

### No puede
- implementar;
- convertir hipótesis en hechos;
- abrir alcance no pedido.

### Salida mínima
- hechos confirmados;
- fuentes si aplica;
- impacto;
- dudas abiertas.

---

## 6. architecture-reviewer

### Tipo
Read-only.

### Puede
- evaluar compatibilidad con arquitectura;
- detectar riesgos;
- proponer trade-offs;
- validar separación de responsabilidades.

### No puede
- implementar directamente;
- aprobar atajos que violen constitución.

### Salida mínima
- compatibilidad con constitución/arquitectura;
- riesgos;
- trade-offs;
- decisión recomendada.

---

## 7. docs-auditor

### Tipo
Read-only.

### Puede
- detectar documentos afectados;
- encontrar duplicidades;
- contrastar backlog/done-log/current-focus/roadmap.

### No puede
- editar docs directamente;
- mover ítems a Done.

### Salida mínima
- documentos afectados;
- desalineaciones;
- propuesta mínima de corrección.

---

## 8. codebase-analyst

### Tipo
Read-only.

### Puede
- analizar módulos afectados;
- identificar patrones existentes;
- detectar riesgos técnicos.

### No puede
- editar código;
- implementar por su cuenta.

### Salida mínima
- módulos afectados;
- patrones existentes;
- riesgos técnicos;
- puntos de extensión recomendados.

---

## 9. implementation-agent

### Tipo
Write-enabled.

### Puede
- editar código;
- aplicar cambios pequeños y controlados;
- actualizar docs afectadas dentro del alcance.

### No puede
- cerrar specs sin validación;
- modificar arquitectura sin spec;
- abrir features fuera de current-focus;
- mover ítems a Done sin done-log.

### Entrada mínima
- spec activa;
- plan/tasks;
- current-focus;
- `contractId` y dry-run asociados si la tarea usa un rail write-enabled del producto;
- archivos afectados.

### Salida mínima
- archivos modificados;
- cambios realizados;
- tests ejecutados o pendientes;
- receipts/journal/ledger generados o pendientes cuando aplique;
- docs actualizadas;
- riesgos;
- siguiente paso.

---

## 10. test-writer

### Tipo
Write-enabled.

### Puede
- añadir o ampliar tests;
- crear fixtures;
- validar regresiones.

### No puede
- cerrar specs por sí solo;
- alterar lógica productiva fuera del alcance de test.

### Salida mínima
- tests añadidos;
- cobertura objetivo;
- límites de lo validado;
- comandos ejecutados.

---

## 11. docs-updater

### Tipo
Write-enabled.

### Puede
- actualizar documentación viva;
- mover trabajo cerrado a done-log si está validado y `docsPending` ya quedó resuelto;
- consumir `validationReceipt` para reflejar `docsTouched`, `docsPending`, `specsAffected` y `nextFocus` en artefactos canónicos;
- corregir referencias y foco.

### No puede
- presentar intención como implementación;
- cerrar items sin evidencia;
- ignorar `docsPending` del receipt;
- cambiar autoridad documental.

### Salida mínima
- docs actualizadas;
- qué cambios reflejan;
- divergencias detectadas;
- documentos no tocados y motivo.
