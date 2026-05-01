# AI Entrypoint — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento es la puerta de entrada obligatoria para cualquier agente IA que trabaje en el repositorio.

Su objetivo es indicar:

- qué leer primero;
- qué documento manda;
- cuál es el foco actual;
- qué está prohibido;
- qué documentación debe actualizarse al cerrar trabajo;
- y cómo evitar duplicidad, cierres falsos o reimplementaciones innecesarias.

---

## 2. Orden obligatorio de lectura

Antes de hacer cambios relevantes, leer en este orden:

1. `docs/product-operating-model.md`
2. `docs/constitution.md`
3. `docs/current-focus.md`
4. `docs/architecture.md`
5. `docs/backlog.md`
6. spec activa en `specs/`
7. `docs/powerbuilder-2025-vscode-plugin-technical-guide.md` si afecta semántica PowerBuilder
8. `docs/testing.md` si afecta validación
9. `docs/performance-budget.md` si afecta rendimiento
10. `docs/ai-orchestrator.md` si participa más de un agente

---

## 3. Meta maestra

> El plugin debe descubrir e indexar muy rápido sin bloquear.

Toda decisión debe proteger:

- carga rápida;
- activación perezosa;
- prioridad al archivo activo;
- indexación progresiva;
- serving interactivo rápido;
- persistencia útil;
- observabilidad;
- degradación segura;
- semántica fuerte sin romper la UX.

---

## 4. Foco vigente

El foco vigente vive siempre en:

`docs/current-focus.md`

No abrir trabajo fuera de foco salvo:

- dependencia real;
- bug bloqueante;
- deuda crítica;
- instrucción explícita del responsable;
- preparación documental sin impacto en core.

---

## 5. Reglas no negociables para IA

- No cerrar specs en parcial.
- No reimplementar specs cerradas.
- No mover trabajo a `Done` sin tests y documentación.
- No usar ORCA en hot path.
- No meter IA dentro del core.
- No parsear DataWindow como PowerScript.
- No hacer rename/references sin confidence suficiente.
- No mezclar source real con staging.
- No modificar backlog sin actualizar done-log si se cierra trabajo.
- No abrir features visibles grandes sin readiness/confidence.
- No portar código de `plugin_old` por inercia.

---

## 6. Al cerrar una spec

Actualizar, si aplica:

- código;
- tests;
- `docs/backlog.md`;
- `docs/done-log.md`;
- `docs/current-focus.md`;
- `docs/roadmap.md`;
- `docs/architecture.md`;
- `docs/testing.md`;
- `docs/performance-budget.md`;
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`;
- `docs/rules-catalog.md`;
- `docs/developer-workflows.md`;
- `README.md`;
- specs afectadas.

Si no aplica actualizar un documento, no lo fuerces; pero revisa explícitamente si aplica.

---

## 7. Autoridad documental

En caso de conflicto, prevalece este orden:

1. `docs/constitution.md`
2. `docs/architecture.md`
3. specs activas en `specs/`
4. `docs/roadmap.md`
5. `docs/current-focus.md`
6. `docs/backlog.md`
7. implementación actual

El código funcionando no invalida por sí solo una decisión documental vigente. Si código y docs divergen, debe corregirse la divergencia.

---

## 8. Propiedad única de información

No dupliques reglas largas entre documentos. Referencia el documento propietario.

- Reglas no negociables → `constitution.md`
- Modelo operativo → `product-operating-model.md`
- Foco inmediato → `current-focus.md`
- Trabajo vivo → `backlog.md`
- Histórico cerrado → `done-log.md`
- Dirección estratégica → `roadmap.md`
- Arquitectura → `architecture.md`
- Dominio PowerBuilder → `powerbuilder-2025-vscode-plugin-technical-guide.md`
- Validación → `testing.md`
- Rendimiento → `performance-budget.md`
- Proceso SDD → `spec-driven-development.md`
- Agentes → `ai-agents-catalog.md`
- Orquestación → `ai-orchestrator.md`
- Visión IA → `ai-strategy.md`
- Diagnósticos → `rules-catalog.md`
- Workflows humanos → `developer-workflows.md`
- `plugin_old` → `plugin-old-migration-opportunities.md`
