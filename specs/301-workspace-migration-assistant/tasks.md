# Tasks - Spec 301 workspace migration assistant (B256)

## 1. Preparación

- [x] T1. Confirmar con tests semilla el comportamiento esperado para layouts `pbl-only` y `mixed`.
- [x] T2. Identificar `WorkspaceState` como owning abstraction del slice.

## 2. Implementación

- [x] T3. Implementar `workspaceMigrationAssistant` con recomendaciones de topología, build y legacy.
- [x] T4. Exponer la surface por API pública v2.8.0, tool bridge, LSP y comando Markdown.
- [x] T5. Hacer robusta la smoke frente al timing de discovery, manteniendo contrato y degradación explícita.
- [x] T6. Alinear la documentación viva y mover el foco canónico del repo.

## 3. Validación

- [x] T7. Ejecutar `npm run build:test`.
- [x] T8. Ejecutar la validación focal de unit sobre feature y contrato público.
- [x] T9. Ejecutar la smoke de activación de la extensión.

## 4. Cierre

- [x] T10. Mover `B256` a `docs/done-log.md`, sacar el ítem del backlog activo y dejar `B257` como siguiente foco natural.