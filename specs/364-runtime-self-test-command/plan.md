# Plan — Spec 364 Runtime self-test command

## Phase 1 — Confirm owning abstraction

- [x] Verificar que el self-test podía salir desde el cliente reutilizando `getPublicContract()`, `ApiServerStats` y `semanticWorkspaceManifest`.
- [x] Confirmar que no hacía falta abrir una API nueva del servidor.

## Phase 2 — Pure model

- [x] Añadir un builder puro del self-test y su render Markdown.
- [x] Fijar degradación honesta cuando faltan snapshots auxiliares.

## Phase 3 — Client wiring

- [x] Registrar `vscPowerSyntax.runRuntimeSelfTest`.
- [x] Integrar el comando en el core maintenance pack y en el menú/status visibles.

## Phase 4 — Closure

- [x] Añadir validación unitaria focal.
- [x] Añadir/ajustar smoke de comando.
- [x] Alinear `README.md`, `docs/testing.md`, backlog, current-focus y done-log.