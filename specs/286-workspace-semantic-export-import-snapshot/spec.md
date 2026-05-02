# Spec 286 - Workspace semantic export/import snapshot (B243)

**Estado:** cerrada y validada.

## 1. Resumen

Publicar un snapshot semantico versionado del workspace para export/import read-only, troubleshooting y automatizacion externa sin exponer estado interno a medias.

## 2. Estado real actual

`B243` queda `Closed`: `src/client/semanticWorkspaceSnapshot.ts`, `src/shared/publicApi.ts` y `src/server/features/semanticWorkspaceManifest.ts` exponen export/import del snapshot semantico con contrato versionado, manifest estable y restauracion segura desde la API publica.

## 3. Objetivo

Dar una unidad portable y versionada del estado semantico observable del workspace antes de ampliar paneles y carriles de release.

## 4. Alcance

- definir un contrato de snapshot versionado;
- exportar e importar manifests/snapshots desde la API publica;
- preservar compatibilidad semantica y degradacion segura ante versiones incompatibles;
- reutilizar surfaces read-only ya cerradas.

## 5. Fuera de alcance

- persistencia write-enabled del workspace real;
- import que muta codigo o project model;
- nuevas semanticas fuera del manifest existente.

## 6. Criterios de aceptacion

- AC1. Existe un snapshot semantico exportable e importable con versionado explicito.
- AC2. El contrato evita publicar estado semantico parcial o incoherente.
- AC3. La importacion valida compatibilidad y degrada seguro ante versiones invalidas.
- AC4. El snapshot reutiliza manifest y contratos ya endurecidos sin duplicacion.

## 7. Documentacion afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/developer-workflows.md`

## 8. Validacion requerida

- `npm run build:test`
- `npm run test:unit -- --grep "unit/semanticWorkspaceSnapshot"`

## 9. Cierre registrado

- `src/client/semanticWorkspaceSnapshot.ts` orquesta export/import versionado del snapshot.
- `src/shared/publicApi.ts` publica los contratos del snapshot y su manifest.
- `test/server/unit/semanticWorkspaceSnapshot.test.ts` fija versionado y compatibilidad basica.
