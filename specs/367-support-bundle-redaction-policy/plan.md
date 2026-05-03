# Plan — Spec 367 Support bundle redaction policy

## Phase 1 — Anchor existing exporter

- [x] Confirmar que `supportBundle.ts` ya concentraba la sanitización del bundle y que el perfil activo llegaba vía `settingsGovernance`.
- [x] Verificar que la smoke existente del support bundle podía fijar la exportación real.

## Phase 2 — Explicit redaction policy

- [x] Añadir una `redactionPolicy` por perfil para paths, snippets, diagnostics, settings y manifest.
- [x] Proyectar esa policy en `manifest.json` y `README.md` del bundle.

## Phase 3 — Validation and resilience

- [x] Fijar `summary-only` para `ci-support`/`support-safe` donde aplica.
- [x] Añadir el reintento corto del manifest en la exportación real para evitar cancelaciones transitorias en frío.

## Phase 4 — Closure

- [x] Validar `supportBundle.test.ts` y la smoke focal del command export.
- [x] Alinear README, developer-workflows, testing, backlog, current-focus y done-log.