# AI Agents Catalog — Compatibility Entry

Este documento se mantiene por compatibilidad documental.

Las fuentes canónicas actuales para agentes, skills y routing son:

- [docs/ai-orchestration.md](ai-orchestration.md)
- [docs/ai/README.md](ai/README.md)
- [docs/ai/agent-skill-routing.md](ai/agent-skill-routing.md)
- [docs/ai-context/powerbuilder-plugin-context.md](ai-context/powerbuilder-plugin-context.md)

Agentes activos del repositorio:

- `planner`
- `implementer`
- `reviewer`
- `docs`
- `release`

Regla de ownership:

- no duplicar aquí el contenido completo de `.github/agents/*.agent.md`;
- mantener este archivo solo como entrypoint estable mientras existan referencias históricas;
- retirarlo cuando no queden referencias históricas, tests ni documentación externa que apunten a [docs/ai-agents-catalog.md](ai-agents-catalog.md).