# AI Orchestrator — Compatibility Entry

Este documento se mantiene por compatibilidad con referencias históricas.

El owner canónico de la orquestación IA es [docs/ai-orchestration.md](ai-orchestration.md).

El entrypoint corto operativo para tareas IA del repositorio es [docs/ai-context/powerbuilder-plugin-context.md](ai-context/powerbuilder-plugin-context.md).

Fuentes canónicas actuales:

- [AGENTS.md](../AGENTS.md)
- [.github/copilot-instructions.md](../.github/copilot-instructions.md)
- [docs/ai-orchestration.md](ai-orchestration.md)
- [docs/ai/README.md](ai/README.md)
- [docs/ai/agent-skill-routing.md](ai/agent-skill-routing.md)

Reglas:

- usar el context pack como bootstrap corto;
- escalar después al documento owner de la superficie tocada;
- no duplicar aquí reglas extensas de agentes, skills o arquitectura;
- retirar este archivo cuando no queden referencias históricas, tests ni documentación externa que apunten a [docs/ai-orchestrator.md](ai-orchestrator.md).