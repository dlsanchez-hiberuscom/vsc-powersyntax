# Catálogo de agentes del repositorio

Este paquete incluye 8 agentes para VS Code custom agents.

## Read-only

1. `spec-orchestrator`
2. `research-analyst`
3. `architecture-reviewer`
4. `docs-auditor`
5. `codebase-analyst`

## Write-enabled

6. `implementation-agent`
7. `test-writer`
8. `docs-updater`

## Convención

- Los agentes read-only solo analizan, revisan y planifican.
- Los agentes write-enabled ejecutan cambios controlados.
- Ningún agente debe ignorar la constitución, la arquitectura ni las specs activas.
