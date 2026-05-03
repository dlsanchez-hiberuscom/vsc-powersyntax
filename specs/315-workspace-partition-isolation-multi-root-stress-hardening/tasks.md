# Tasks - Spec 315 workspace partition isolation and multi-root stress hardening (B268)

## 1. Preparación

- [x] T1. Confirmar el ancla local: `WorkspaceState`/`project routing` ya eran el punto de control del aislamiento por root.
- [x] T2. Identificar el primer borde falsable: proyectos/librerías homónimos entre roots distintos y `sourceOrigin` mixed-root.

## 2. Implementación

- [x] T3. Añadir probes multi-root para routing con nombres duplicados en `workspace.test.ts`.
- [x] T4. Corregir `WorkspaceState` para inferir `sourceOrigin` por marker topológico más cercano y reutilizarlo en watcher/indexador.
- [x] T5. Añadir coberturas para manifest, Object Explorer, cache partitions, build profile matrix y ORCA staging en multi-root.
- [x] T6. Alinear docs canónicas y mover el foco a `B274`.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar la batería focal `workspace|watchedFileIntake|cacheStore|semanticWorkspaceManifest|objectExplorerModel|pbAutoBuildProfileMatrix|orcaStagingExport`.

## 4. Cierre

- [x] T9. Sacar `B268` del backlog activo, registrar el cierre en `docs/done-log.md`, mover `docs/current-focus.md` a `B274` y dejar la trazabilidad en `specs/315-workspace-partition-isolation-multi-root-stress-hardening`.