# Plan — Spec 366 Enterprise configuration policy

## Phase 1 — Anchor existing governance

- [x] Confirmar que `settingsGovernance.ts` ya concentraba el catálogo y la lógica de conflictos.
- [x] Verificar que sólo hacía falta ampliar perfiles y schema, no abrir nuevos comandos.

## Phase 2 — Governed profiles

- [x] Añadir los perfiles `fast`, `balanced`, `deep-analysis`, `legacy-orca`, `ci-support` y `support-safe`.
- [x] Mantener compatibilidad con los aliases legacy `interactive` y `legacy-safe`.

## Phase 3 — Visible contract

- [x] Actualizar el schema de `vscPowerSyntax.profile`.
- [x] Validar la inspección read-only en la extensión real.

## Phase 4 — Closure

- [x] Fijar unit + smoke focal de configuración.
- [x] Alinear README, developer-workflows, backlog, current-focus y done-log.