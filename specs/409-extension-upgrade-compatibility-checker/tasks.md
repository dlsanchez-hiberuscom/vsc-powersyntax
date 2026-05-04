# Tasks — Spec 409

## Estado

- done

## Tasks

- [x] Extender `workspace-check` con un modo `upgrade` sin abrir un segundo motor de validación.
- [x] Reutilizar settings governance, runtime persistence y `workspaceMigrationAssistant` para consolidar warnings y acciones de upgrade.
- [x] Añadir el comando `PowerSyntax: Check Extension Upgrade Compatibility` sobre el mismo reporte Markdown AI-readable.
- [x] Validar compatibilidad con fixtures legacy de contrato/snapshot.
- [x] Cubrir el wiring real del comando en smoke.
- [x] Alinear arquitectura, workflows, testing y artefactos canónicos de backlog/foco/done-log.

## Riesgos residuales registrados

- El checker de upgrade sigue dependiendo de las señales ya publicadas por runtime/settings/migration assistant; si alguna de esas surfaces no publica estado suficiente, el reporte degradará con warnings en vez de inventar compatibilidad.
- El warning histórico de activación en la smoke local sigue existiendo fuera del alcance del slice `B298`.
