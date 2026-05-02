# Spec 291 - PowerBuilder framework/library knowledge packs (B248)

**Estado:** cerrada y validada.

## 1. Resumen

Publicar knowledge packs curados para frameworks y librerias PowerBuilder conocidas, de forma read-only y reutilizable desde el manifest semantico y la API publica, sin abrir una segunda base semantica manual.

## 2. Estado real actual

`B248` queda `Closed`: `src/server/knowledge/system/frameworkKnowledgePacks.ts` publica packs curados, `src/server/features/semanticWorkspaceManifest.ts` los incorpora al manifest y `src/shared/publicApi.ts` versiona su surface para tooling externo y snapshots.

## 3. Objetivo

Dar contexto util sobre frameworks/librerias conocidas antes de planning batch seguro y release readiness.

## 4. Alcance

- definir un registro curado y versionado de knowledge packs;
- resolver packs por owner types usando `SystemCatalog`;
- incorporar packs al manifest semantico y a la API publica;
- mantener `sourceOrigin` y degradacion read-only consistente.

## 5. Fuera de alcance

- ingestion automatica de knowledge packs externos;
- mutaciones write-enabled del catalogo de sistema;
- inferencia semantica nueva fuera del `SystemCatalog` existente.

## 6. Criterios de aceptacion

- AC1. Existe un registro curado de knowledge packs versionados.
- AC2. Los packs pueden resolverse por owner type reutilizando `SystemCatalog`.
- AC3. El manifest semantico exporta los packs sin romper compatibilidad.
- AC4. La API publica refleja esa nueva surface de forma versionada.

## 7. Documentacion afectada

- `README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/roadmap.md`

## 8. Validacion requerida

- `npm run build:test`
- `npm run test:unit -- --grep "unit/(frameworkKnowledgePacks|semanticWorkspaceManifest)"`

## 9. Cierre registrado

- `src/server/knowledge/system/frameworkKnowledgePacks.ts` define el registro curado y sus ayudas de lookup.
- `src/server/features/semanticWorkspaceManifest.ts` incorpora `knowledgePacks` al manifest exportable.
- `test/server/unit/frameworkKnowledgePacks.test.ts` y `test/server/unit/semanticWorkspaceManifest.test.ts` fijan el contrato.
