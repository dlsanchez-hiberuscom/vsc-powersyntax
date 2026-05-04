# Spec 409 — B298 Extension upgrade compatibility checker

## Estado

- done

## Relación backlog

- Backlog item: `B298 — Extension upgrade compatibility checker`

## Objetivo

Detectar problemas al actualizar versión de la extensión revisando cache schema, settings legacy, snapshots, `apiVersion` y artefactos locales del workspace sin abrir un motor paralelo al runtime.

## Resultado de cierre

- `workspace-check` añade el modo `upgrade`, reutilizando `server-stats`, `semanticWorkspaceManifest`, settings governance y `workspaceMigrationAssistant` para revisar runtime persistente, `cache policy`, settings legacy, `apiVersion/schemaVersion` y ruido local del workspace;
- el cliente publica el comando `PowerSyntax: Check Extension Upgrade Compatibility`, que abre el mismo reporte Markdown AI-readable del rail `workspace-check` en modo `upgrade`;
- el reporte consolida findings y acciones recomendadas explícitas para drift de settings, runtime cache persistente, artefactos locales/staging legacy y revisión de versiones exportadas antes de reutilizar snapshots o bundles viejos.

## Validación ejecutada

- `npm run test:unit -- --grep "unit/extensionUpgradeCompatibilityChecker"`
- `npm run test:smoke -- --grep "la extensión se activa en menos de 500ms"`

## Nota de validación

- La smoke focal pasó y abrió el nuevo checker. El log sigue mostrando el warning histórico de activación por encima de 500 ms en entorno local de test, pero no abrió una regresión nueva del slice `B298`.

## Fuera de alcance del corte cerrado

- convertir el checker de upgrade en un motor separado del runtime o duplicar validación ya disponible en `workspace-check`;
- corregir hotspots históricos de activación o problemas globales ajenos del repo;
- endurecer todavía el self-test del VSIX empaquetado, que queda para `B315`.
