# Product Operating Model — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento define el modelo operativo compacto del proyecto.

Su función es evitar duplicidad documental y dar a humanos e IA una forma clara de decidir:

- qué va primero;
- qué documento contiene cada tipo de información;
- cuándo una tarea está realmente cerrada;
- y qué no debe hacerse nunca.

---

## 2. Prioridad absoluta

> Descubrir e indexar muy rápido sin bloquear.

---

## 3. Orden real de trabajo

1. L0 — Core readiness/latency.
2. L1 — Persistencia y modelo de workspace/proyecto.
3. L2 — Query engine y serving seguro.
4. L2.5 — PowerBuilder semantic understanding.
5. L3 — Validación real, health y performance.
6. L4 — DataWindow y especialización PowerBuilder.
7. L4 build — PBAutoBuild moderno y health asociado.
8. L4 legacy — ORCA/PBL legacy.
9. L4.5 — Contexto semántico read-only para API/IA.
10. L5 — Documentación IA-first y workflows.

---

## 4. Equivalencia roadmap/backlog

| Roadmap | Backlog | Significado |
|---|---|---|
| Fase A | L0 | Core semántico, readiness y latencia |
| Fase B | L1 | Persistencia y reanudación |
| Fase C | L2 + L2.5 | Query engine, serving y entendimiento PowerBuilder |
| Fase D | L3 | Validación, performance y health |
| Fase E | L4 | Especialización PowerBuilder |
| Fase F | L4.5 | Plataforma abierta para automatización segura |
| Fase G | L5 | Documentación IA-first y workflows que sostienen la automatización |

---

## 5. Foco operativo

El foco diario lo define:

`docs/current-focus.md`

El backlog no debe usarse para saltarse el foco vigente.

---

## 6. Definition of Done universal

Una tarea solo está `Done` si tiene:

- implementación real;
- tests o validación proporcional;
- documentación alineada;
- backlog actualizado;
- done-log actualizado si se cierra;
- current-focus actualizado si cambia foco;
- roadmap actualizado si cambia fase;
- sin deuda crítica oculta;
- sin regresión injustificada.

---

## 7. Reglas de decisión

- Source real gana a staging.
- Rename solo con confidence alta.
- References deben separar seguro/probable.
- Hover puede degradar con explicación.
- ORCA solo out-of-process.
- IA consume contratos, no dominio interno.
- DataWindow es sublenguaje propio.
- El archivo activo tiene prioridad absoluta.
- El background no roba latencia al foreground.

---

## 8. Qué nunca hacer

- Reimplementar specs cerradas.
- Abrir DataWindow profundo antes de L0-L2 suficientemente sólidos.
- Abrir ORCA import antes de read-only/export/preflight.
- Meter automatización IA sin API estable.
- Crear features visibles si no tienen readiness/confidence.
- Añadir abstracciones genéricas sin valor medible.
- Cerrar specs sin documentación viva.

---

## 9. Propiedad única de la información

Cada tipo de información vive en un único documento propietario:

- Reglas no negociables → `constitution.md`
- Ruta rápida para IA → `00-ai-entrypoint.md`
- Modelo operativo → `product-operating-model.md`
- Foco inmediato → `current-focus.md`
- Trabajo vivo → `backlog.md`
- Histórico cerrado → `done-log.md`
- Dirección estratégica → `roadmap.md`
- Arquitectura técnica → `architecture.md`
- Dominio PowerBuilder → `powerbuilder-2025-vscode-plugin-technical-guide.md`
- Rendimiento → `performance-budget.md`
- Validación → `testing.md`
- Proceso SDD → `spec-driven-development.md`
- Visión IA → `ai-strategy.md`
- Orquestación IA → `ai-orchestrator.md`
- Catálogo de agentes → `ai-agents-catalog.md`
- Diagnósticos → `rules-catalog.md`
- Workflows de usuario → `developer-workflows.md`
- Ideas aprovechables de `plugin_old` → `plugin-old-migration-opportunities.md`

Los demás documentos pueden referenciar esta información, pero no duplicarla.
