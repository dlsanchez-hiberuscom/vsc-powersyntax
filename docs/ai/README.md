# AI Documentation — PowerBuilder VS Code Plugin

> **Estado:** índice operativo de documentación IA.  
> **Última revisión:** 2026-05-06.  
> **Ámbito:** entrada rápida a estrategia, orquestador, routing, tokens, contexto y prompts.

---

## 1. Propósito

Este directorio agrupa la documentación operativa para IA/agentes.

La pieza central del flujo operativo es:

```text
docs/ai-orchestration.md
```

Ese documento actúa como **orquestador IA**: clasifica tareas, decide contexto, selecciona agentes/capacidades, exige validaciones y define cierre.

---

## 2. Mapa de documentos IA

```text
docs/ai-strategy.md
  → estrategia, principios y límites de IA

docs/ai-orchestration.md
  → ORQUESTADOR IA: flujo completo de decisión, ejecución, validación y cierre

docs/ai/agent-skill-routing.md
  → selección de agente/capacidad según tipo de tarea

docs/ai/lean-token-policy.md
  → política de contexto mínimo suficiente

docs/ai-context/powerbuilder-plugin-context.md
  → contexto compacto del dominio PowerBuilder/plugin

docs/prompts/README.md
  → índice y reglas de prompts reutilizables
```

---

## 3. Uso recomendado

Para cualquier tarea IA:

```text
1. Leer docs/constitution.md
2. Leer docs/ai-orchestration.md
3. Clasificar la tarea
4. Consultar docs/ai/agent-skill-routing.md
5. Cargar contexto con docs/ai/lean-token-policy.md
6. Leer documento propietario de la tarea
7. Ejecutar y validar
```

---

## 4. Documentos no IA pero obligatorios según tarea

```text
docs/spec-driven-development.md
  → obligatorio si hay spec o trabajo técnico no trivial

docs/architecture.md + docs/architecture-status.md
  → obligatorio si afecta arquitectura o estado real

docs/testing.md
  → obligatorio si afecta código o validación

docs/performance-budget.md
  → obligatorio si afecta hot paths, caches o indexación

docs/release.md + docs/troubleshooting.md
  → obligatorio si afecta publicación o soporte
```

---

## 5. Qué no va en docs IA

No colocar en docs IA:

- backlog;
- roadmap;
- specs concretas;
- histórico cerrado;
- arquitectura completa;
- testing completo;
- performance budgets completos;
- prompts largos embebidos en documentos estratégicos.

---

## 6. Criterio de mantenimiento

Si cambia el orquestador, revisar:

```text
docs/ai-orchestration.md
docs/ai/agent-skill-routing.md
docs/ai/lean-token-policy.md
docs/prompts/README.md
```

Si cambia la estrategia general de IA, revisar `docs/ai-strategy.md`.
