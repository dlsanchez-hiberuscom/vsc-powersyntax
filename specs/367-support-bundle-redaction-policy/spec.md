# Spec 367: Support bundle redaction policy

## Status

Closed.

## Backlog mapping

- B295 — Support bundle redaction policy.

## Objective

Hacer explícita la redacción del support bundle según el perfil activo del workspace, cubriendo paths, snippets, diagnostics, settings y manifest sin volver inútil el bundle para soporte offline.

## Implemented scope

- `src/client/support/supportBundle.ts` publica una `redactionPolicy` por perfil y la proyecta tanto en `manifest.json` como en `README.md` del bundle.
- Los perfiles `ci-support` y `support-safe` pueden endurecer la salida a `summary-only`, mientras el resto mantiene baseline `sanitized`.
- `src/client/extension.ts` añade un reintento corto al obtener el `semanticWorkspaceManifest` durante la exportación real del support bundle.
- `test/server/unit/supportBundle.test.ts` y `test/smoke/support-bundle.extension.test.ts` fijan la policy, la redacción `summary-only` y el bundle exportado en VS Code real.

## Out of scope

- Copiar código bruto del workspace al support bundle.
- Crear un segundo exportador de soporte o un bundle paralelo.
- Refactorizar cliente/servidor fuera del carril del support bundle. Eso queda para B346/B347.

## Acceptance evidence

- El bundle exportado publica `redactionProfile` y `redactionPolicy` explícitos.
- Paths, snippets, diagnostics, settings y manifest cambian de redacción según el perfil activo.
- La smoke real del comando sigue exportando el bundle sin código bruto.