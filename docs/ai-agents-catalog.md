# Catálogo de agentes del repositorio

Este repositorio define 8 **custom agents** para VS Code.

Este catálogo cubre solo **agentes persistentes por rol**.  
Las tareas cortas y repetibles deben resolverse preferentemente con **prompt files** y las capacidades reutilizables más complejas con **skills**.

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

- Los agentes read-only solo analizan, revisan, planifican y preparan contexto.
- Los agentes write-enabled ejecutan cambios controlados.
- Ningún agente debe ignorar la constitución, la arquitectura ni las specs activas.
- Ningún agente write-enabled debe entrar si la tarea no está ya madura.
- Toda salida debe dejar contexto mínimo útil, módulos afectados, riesgos y siguiente paso.