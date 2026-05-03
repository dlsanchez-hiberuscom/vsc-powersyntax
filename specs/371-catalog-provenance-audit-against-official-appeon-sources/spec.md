# Spec 371: Catalog provenance audit against official Appeon sources

## Status

Closed.

## Backlog mapping

- B339 — Catalog provenance audit against official Appeon sources.

## Objective

Endurecer el contrato de provenance del system catalog para que los rails `manual-core` y `generated` declaren autoridad, fuente y versión de forma ejecutable, sin vender como oficial la cobertura que sigue siendo curada.

## Implemented scope

- `src/server/knowledge/system/consistency.ts` amplía `buildCatalogConsistencyReport()` con un audit de provenance reutilizable: counts por `kind` y `authority`, summaries por dominio, y listas de incidencias para mismatch `dataset -> authority/kind`, ausencia de `source`, `sourceUrl`, `version` y `generatedAt` cuando aplica.
- El audit resume por dominio qué datasets, authorities, kinds, sources y versiones conviven, de modo que dominios mixtos como `global-functions` no se publiquen como oficialmente cerrados por accidente y dominios curados como `system-globals` u `operators` mantengan límites explícitos.
- `test/server/unit/catalogProvenanceAudit.test.ts` fija el contrato de B339 sobre rails `manual-core` y `generated`, incluyendo representative domains y guards de metadata oficial.
- `docs/architecture.md`, `docs/testing.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/roadmap.md`, `docs/backlog.md`, `docs/current-focus.md` y `docs/done-log.md` quedan alineados con el cierre de B339.

## Out of scope

- Generar nuevo contenido oficial desde Appeon o ampliar dominios visuales/runtime; ese trabajo queda para B358/B359.
- Introducir un `sourceAuthority` plano por archivo fuera del contrato actual de `lineage.authority`.
- Cambiar IDs, domains, datasets o el query hot path del system catalog fuera del audit de consistencia/provenance.

## Acceptance evidence

- `buildCatalogConsistencyReport()` publica audit de provenance por dominio y dataset.
- `manual-core` queda fijado como `manual/curated` y `generated` como `generated/official`.
- El audit detecta metadata oficial incompleta (`sourceUrl`, `version`, `generatedAt`) antes de futuras ampliaciones del catálogo.
- `npm run build:test` compila limpio.
- `npm run test:unit -- --grep "catalogConsistency|catalogProvenanceAudit"` pasa limpio.