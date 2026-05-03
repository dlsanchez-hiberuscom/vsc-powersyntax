# Spec 366: Enterprise configuration policy

## Status

Closed.

## Backlog mapping

- B294 — Enterprise configuration policy.

## Objective

Exponer una policy explícita de settings del workspace con perfiles corporativos visibles y gobernables sobre el carril actual de settings governance, sin abrir overrides opacos fuera del producto.

## Implemented scope

- `src/client/settingsGovernance.ts` amplía los perfiles a `fast`, `balanced`, `deep-analysis`, `legacy-orca`, `ci-support` y `support-safe`.
- La governance normaliza aliases legacy (`interactive`, `legacy-safe`) a IDs canónicos y mantiene la detección de conflictos estructurales.
- `package.json` publica el schema actualizado de `vscPowerSyntax.profile`.
- `test/server/unit/settingsGovernance.test.ts` y la smoke focal de `test/smoke/extension.test.ts` fijan catálogo, compatibilidad y schema visible.

## Out of scope

- Gestionar paths locales de PBAutoBuild u ORCA dentro de perfiles corporativos.
- Cambiar la observabilidad o el score del dashboard/health report.
- Redacción de support bundles. Eso sigue perteneciendo a B295.

## Acceptance evidence

- Los seis perfiles corporativos quedan visibles y gobernables desde la extensión.
- Los aliases legacy se normalizan sin romper la inspección read-only.
- La validación unitaria y la smoke config quedan verdes.