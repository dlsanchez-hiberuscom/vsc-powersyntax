# AI Agents Catalog — PowerBuilder VS Code Plugin

Catálogo operativo de agentes recomendados para trabajar en este repositorio.

`AGENTS.md` contiene las reglas obligatorias. Este documento define responsabilidades y límites.

## Regla común

Todo agente debe leer `AGENTS.md`, respetar `docs/current-focus.md`, operar contra backlog/spec explícito, actualizar documentación afectada, ejecutar validación, dejar evidencia y no cerrar en parcial.

## Agentes read-only

### `docs-auditor`
Detecta deriva documental, duplicidades, referencias rotas y contradicciones. No modifica código.

### `architecture-reviewer`
Revisa arquitectura vs implementación, capas, imports, hot path, sourceOrigin, readiness/evidence/confidence.

### `performance-auditor`
Revisa hot path, budgets, allocations, scheduler, cache, memory, scans y serving.

### `catalog-auditor`
Revisa system catalog, generated/manual overlays, domains, owner-scoped symbols, coverage, consistency y localization.

### `vsix-release-auditor`
Revisa packaging, VSIX, activation, LSP startup, command ownership, release workflows y smoke instalada.

### `powerbuilder-semantic-auditor`
Revisa semántica PowerBuilder: scopes, prototypes, events, SQL, DataWindow, inheritance, dynamic calls, external functions y RPCFUNC.

## Agentes write-enabled

### `spec-implementation-agent`
Implementa una spec activa. Modifica código, tests y docs. Requiere validación y evidencia.

### `docs-maintainer`
Reorganiza documentación, crea documentos propietarios, elimina duplicidades y actualiza enlaces.

### `catalog-maintainer`
Modifica catálogo, overlays, localization y consistency reports. Respeta `generated-primary-with-manual-overlays`.

### `build-release-maintainer`
Modifica packaging, VSIX, release readiness, PBAutoBuild y ORCA tooling/docs.

### `datawindow-maintainer`
Modifica soporte DataWindow/DataStore/DataWindowChild manteniendo `.srd` como sublenguaje separado.

### `localization-maintainer`
Modifica overlays de documentación localizada. No traduce nombres reales ni anchors técnicos.

### `ai-tools-maintainer`
Mantiene API pública, tool bridge, context bundles y documentación IA.

## Agentes prohibidos

No crear agentes que ejecuten cambios sin spec, hagan rewrites masivos del core, creen parsers DataWindow paralelos, modifiquen generated sin rail oficial, automaticen write-enabled sin receipts o dupliquen reglas de `AGENTS.md`.
