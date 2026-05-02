# Plan 003 - Descubrimiento de Workspace

**Estado:** cerrada históricamente y normalizada por B233.

## Resumen técnico retroactivo

- introducir una abstracción de filesystem (`IFileSystem` + `NodeFileSystem`) en vez de acoplar discovery a `node:fs`;
- crear `WorkspaceState` y un crawler cooperativo que descubra markers/roots/archivos relevantes sin bloquear el hot path;
- integrar el discovery como tarea de background del servidor, con cancelación y medición de rendimiento;
- dejar tests/unit y performance que fijan el comportamiento base.

## Evidencia actual en el repo

- `src/server/system/fileSystem.ts`
- `src/server/workspace/workspaceState.ts`
- `test/server/unit/workspace.test.ts`
- posteriores refuerzos en `specs/013-discovery-dual-mode`, `018-workspace-topology`, `019-project-registry` y `020-library-order`.

## Validación histórica relevante

- `test/server/unit/workspace.test.ts`
- `test/server/performance/pfc-workspace.perf.test.ts`