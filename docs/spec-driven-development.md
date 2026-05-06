# Spec-Driven Development — Plugin PowerBuilder 2025 para VS Code

> **Estado:** documento canónico del proceso SDD / Spec-Driven Development.  
> **Última revisión:** 2026-05-06.  
> **Ámbito:** creación, ejecución, validación y cierre de specs técnicas.  
> **No contiene:** backlog completo, roadmap estratégico, histórico cerrado, arquitectura objetivo completa, testing exhaustivo ni prompts largos.  
> **Documentos relacionados:** `docs/constitution.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md`, `docs/architecture.md`, `docs/architecture-status.md`, `docs/testing.md`, `docs/performance-budget.md`, `docs/developer-workflows.md`, `docs/done-log.md`.

---

## 1. Propósito

Este documento define cómo se trabaja con **Spec-Driven Development** en el plugin profesional de PowerBuilder 2025 para VS Code.

Debe responder a una pregunta:

> ¿Cómo se crea, ejecuta, valida y cierra una spec sin duplicar backlog, roadmap, arquitectura, testing ni documentación histórica?

La spec es la unidad técnica de trabajo cuando una tarea requiere suficiente precisión como para no resolverse solo con una entrada breve de backlog.

---

## 2. Principios SDD

### 2.1. Una spec es una unidad ejecutable de cambio

Una spec debe describir un cambio suficientemente concreto como para que una persona o agente IA pueda implementarlo, probarlo y documentarlo sin reinterpretar el objetivo.

### 2.2. La spec no sustituye al backlog

El backlog decide qué trabajo existe y su estado. La spec desarrolla el detalle técnico de una entrada accionable.

### 2.3. La spec no sustituye a la arquitectura

La arquitectura objetivo vive en `docs/architecture.md`. La spec puede referenciarla, pero no debe copiar secciones completas.

### 2.4. La spec no sustituye al testing

La estrategia de pruebas vive en `docs/testing.md`. La spec solo declara qué pruebas concretas requiere su cambio.

### 2.5. La spec no sustituye al done-log

Cuando una spec se cierra, el cierre histórico debe registrarse en `docs/done-log.md` solo si el proceso del repo lo autoriza. La spec no debe convertirse en histórico global.

---

## 3. Cuándo crear una spec

Crear una spec cuando el trabajo implique al menos una de estas condiciones:

- afecta arquitectura o límites entre capas;
- modifica parser, indexer, symbol graph o semantic facade;
- afecta hot paths LSP como hover, completion, signature help, diagnostics, semantic tokens, definition o references;
- introduce o cambia caches;
- afecta DataWindow;
- integra ORCA, PBAutoBuild u otra herramienta externa;
- requiere fixtures, pruebas de regresión o performance;
- toca varios documentos;
- necesita criterios de aceptación claros;
- será ejecutado por agente IA con poco contexto conversacional.

No crear spec para:

- correcciones triviales de texto;
- cambios documentales pequeños sin impacto estructural;
- ajustes cosméticos;
- tareas que caben claramente en una entrada breve de backlog.

---

## 4. Relación entre roadmap, current-focus, backlog y specs

```text
roadmap.md
  → visión estratégica de alto nivel

current-focus.md
  → foco inmediato activo

backlog.md
  → trabajo accionable y estado de cada iniciativa

docs/specs/*
  → detalle técnico ejecutable de una iniciativa

done-log.md
  → histórico cerrado
```

Reglas:

1. El roadmap no debe listar specs concretas.
2. Current-focus solo debe mencionar el foco activo y, si aplica, las specs activas.
3. Backlog debe enlazar la spec cuando exista.
4. La spec debe enlazar documentos afectados.
5. Done-log solo recibe el cierre cuando la tarea esté realmente completada.

---

## 5. Ubicación y naming

### 5.1. Ubicación recomendada

Las specs deben vivir en:

```text
docs/specs/
```

Si el repositorio todavía no tiene specs individuales, crear el directorio y mantener un índice:

```text
docs/specs/README.md
```

### 5.2. Naming recomendado

Formato:

```text
docs/specs/<AREA>-<short-name>.md
```

Ejemplos conceptuales:

```text
docs/specs/cache-layer-contract.md
docs/specs/semantic-query-facade.md
docs/specs/hover-serving-cache.md
docs/specs/datawindow-domain-model.md
```

Evitar nombres demasiado largos o dependientes del estado temporal.

---

## 6. Estructura mínima de una spec

Toda spec debe seguir esta estructura mínima:

```markdown
# <Título de la spec>

> Estado: Draft / Ready / In Progress / Blocked / Ready for Review / Done
> Área: architecture / cache / lsp / symbols / diagnostics / datawindow / integrations / docs / testing / performance / ai
> Prioridad: P0 / P1 / P2 / P3
> Backlog: enlace a entrada de backlog
> Documentos afectados: lista de documentos

## 1. Contexto

## 2. Problema

## 3. Objetivo

## 4. Alcance

### Incluido

### Excluido

## 5. Diseño propuesto

## 6. Contratos afectados

## 7. Plan de implementación

## 8. Plan de testing

## 9. Impacto en rendimiento

## 10. Impacto documental

## 11. Criterios de aceptación

## 12. Riesgos y mitigaciones

## 13. Criterios de cierre
```

---

## 7. Estados de una spec

```text
Draft             → idea en preparación; no lista para ejecutar.
Ready             → suficientemente definida para implementación.
In Progress       → en ejecución.
Blocked           → bloqueada por dependencia o decisión.
Ready for Review  → implementada y pendiente de revisión/cierre.
Done              → completada, validada y documentada.
```

Reglas:

- Una spec en `Draft` no debe ejecutarse salvo autorización explícita.
- Una spec en `Ready` debe tener criterios de aceptación y plan de testing.
- Una spec en `Done` debe tener documentación afectada actualizada.
- Si una spec queda bloqueada, el bloqueo debe reflejarse en backlog/current-focus si afecta el foco activo.

---

## 8. Tipos de specs

### 8.1. Architecture spec

Usar cuando cambia una capa, límite, contrato o dependencia estructural.

Debe revisar:

- `docs/architecture.md`;
- `docs/architecture-status.md`;
- `docs/testing.md`;
- `docs/performance-budget.md` si afecta hot paths.

### 8.2. LSP feature spec

Usar para hover, completion, signature help, definition, references, diagnostics, semantic tokens o document symbols.

Debe definir:

- provider afectado;
- request context;
- semantic facade/resolver usado;
- caches usadas;
- formatter/result model;
- pruebas y performance.

### 8.3. Cache spec

Usar para añadir o modificar caches.

Debe definir:

```text
owner
scope
key
value
lifecycle
invalidation triggers
max size / memory policy
metrics
fallback
```

### 8.4. DataWindow spec

Usar para extractor, parser, model, SQL model, binding resolver, cache o integración con providers.

Debe separar DataWindow del parser PowerScript principal.

### 8.5. Integration spec

Usar para ORCA, PBAutoBuild u otras herramientas externas.

Debe incluir:

- adapter;
- locator;
- runner/session;
- parser/mapper;
- ausencia de herramienta;
- timeouts/cancelación;
- tests con fake/mock.

### 8.6. Documentation spec

Usar para normalizaciones documentales grandes.

Debe declarar:

- documentos a tocar;
- documentos congelados;
- fuentes canónicas;
- duplicidades a eliminar;
- enlaces a validar.

---

## 9. Criterios de aceptación

Cada spec debe tener criterios verificables.

Ejemplo de formato:

```markdown
## Criterios de aceptación

- [ ] El cambio implementa el objetivo declarado.
- [ ] No introduce duplicidad de responsabilidad.
- [ ] Los tests requeridos pasan.
- [ ] No rompe budgets de rendimiento aplicables.
- [ ] La documentación afectada queda actualizada.
- [ ] Backlog/current-focus quedan alineados si aplica.
```

Los criterios deben ser objetivos. Evitar frases como “mejorar”, “optimizar” o “limpiar” sin métrica o resultado verificable.

---

## 10. Plan de testing dentro de una spec

La spec debe indicar qué tipos de prueba requiere:

```text
static/typecheck
unit
contract
integration
smoke
performance
E2E
manual validation
```

Reglas:

- Cambios de parser requieren tests de parser.
- Cambios de indexer requieren tests de invalidación.
- Cambios de semantic facade requieren contract tests.
- Cambios de provider LSP requieren integration/smoke según criticidad.
- Cambios de cache requieren hit/miss/invalidation tests.
- Cambios de performance requieren medición antes/después.
- Cambios DataWindow requieren fixtures DataWindow.
- Cambios ORCA/PBAutoBuild requieren fake/mock.

---

## 11. Impacto en rendimiento

Toda spec debe declarar una de estas opciones:

```text
No performance impact expected.
Performance-sensitive hot path.
Workspace/indexing impact.
Cache/memory impact.
External tool/process impact.
```

Si afecta rendimiento, debe enlazar `docs/performance-budget.md` y declarar:

```text
hot path afectado
budget objetivo
métrica actual si existe
métrica esperada
fallback previsto
prueba de regresión
```

---

## 12. Impacto documental

Toda spec debe indicar documentos afectados.

Matriz orientativa:

```text
Cambio arquitectónico       → architecture.md + architecture-status.md
Cambio de estado/deuda      → architecture-status.md
Cambio de rendimiento       → performance-budget.md
Cambio de pruebas           → testing.md
Cambio operativo            → developer-workflows.md
Cambio de release/soporte   → release.md + troubleshooting.md
Cambio de IA/agentes        → ai-strategy / ai-orchestration / docs/ai/*
Cambio accionable           → backlog.md
Cambio de foco inmediato    → current-focus.md
Cierre histórico            → done-log.md si se autoriza
```

---

## 13. Ejecución de una spec por agente IA

Un agente IA que ejecute una spec debe cumplir:

1. Leer `docs/constitution.md`.
2. Leer la spec completa.
3. Leer documentos afectados declarados.
4. Revisar código relacionado antes de modificar.
5. Implementar en pasos pequeños.
6. Añadir o actualizar tests.
7. Validar performance si aplica.
8. Actualizar documentación afectada.
9. No tocar documentos congelados salvo instrucción explícita.
10. Dejar resumen de cambios y validaciones.

El agente no debe:

- cerrar una spec sin tests aplicables;
- crear documentos nuevos sin justificarlo;
- duplicar arquitectura/backlog/roadmap;
- mover trabajo pendiente a done-log;
- omitir documentación afectada.

---

## 14. Cierre de una spec

Una spec solo puede cerrarse si:

```text
[ ] Objetivo cumplido.
[ ] Alcance incluido completado.
[ ] Alcance excluido respetado.
[ ] Tests requeridos ejecutados.
[ ] Performance validada si aplica.
[ ] Documentación afectada actualizada.
[ ] Backlog actualizado.
[ ] Current-focus actualizado si era foco activo.
[ ] Riesgos residuales documentados.
[ ] No quedan TODOs sin registrar.
```

Si no se cumple algún punto, la spec no está cerrada: está en `Ready for Review`, `Blocked` o requiere follow-up en backlog.

---

## 15. Relación con done-log

El cierre histórico debe ir a `docs/done-log.md` solo cuando:

- la spec está realmente completada;
- las validaciones requeridas han pasado;
- la documentación afectada está alineada;
- el usuario o el proceso del repo autoriza actualizar histórico.

Durante fases en las que `done-log.md` esté congelado, no se debe modificar aunque una spec quede lista para cierre. En ese caso, registrar el estado en backlog/current-focus y esperar autorización.

---

## 16. Relación con release y troubleshooting

Una spec debe revisar `docs/release.md` si cambia:

- empaquetado;
- comandos de build/release;
- validaciones de release;
- versionado;
- instalación;
- artefactos publicados.

Una spec debe revisar `docs/troubleshooting.md` si introduce o corrige:

- errores recurrentes;
- logs nuevos;
- support bundles;
- fallos de activación;
- fallos LSP;
- problemas de workspace, parser, cache, diagnostics, DataWindow, ORCA o PBAutoBuild.

---

## 17. Antipatrones

No hacer:

- specs que solo dicen “mejorar X” sin criterio verificable;
- specs gigantes que mezclan varias áreas sin fases;
- specs que duplican arquitectura completa;
- specs que contienen roadmap estratégico;
- specs que sustituyen backlog;
- specs sin plan de testing;
- specs sin impacto documental;
- cerrar specs solo porque el código compila;
- dejar hallazgos nuevos sin backlog/spec/follow-up.

---

## 18. Plantilla rápida

```markdown
# <Spec title>

> Estado: Draft
> Área:
> Prioridad:
> Backlog:
> Documentos afectados:

## 1. Contexto

## 2. Problema

## 3. Objetivo

## 4. Alcance

### Incluido

### Excluido

## 5. Diseño propuesto

## 6. Contratos afectados

## 7. Plan de implementación

## 8. Plan de testing

## 9. Impacto en rendimiento

## 10. Impacto documental

## 11. Criterios de aceptación

## 12. Riesgos y mitigaciones

## 13. Criterios de cierre
```