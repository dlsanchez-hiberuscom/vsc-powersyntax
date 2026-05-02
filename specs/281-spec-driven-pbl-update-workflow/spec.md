# Spec 281 - Spec-driven PBL update workflow (B199)

**Estado:** cerrada y validada.

## 1. Resumen

Automatizar un workflow unitario de actualización PBL para que una spec pueda aplicar edits explícitos sobre source exportado a staging y materializarlos de vuelta en una PBL legacy sin abrir un motor nuevo fuera del rail ORCA ya seguro.

## 2. Estado real actual

`B199` queda `Closed`: la API pública versionada `applySpecDrivenPblUpdate()` reutiliza `safeEditPlan`, ejecuta export ORCA fresco, aplica edits explícitos sobre staging resolviendo los archivos a partir de `trackedSources` y termina con `runOrcaStagingImport()` sobre el mismo rail con backup, ledger y journal persistente.

## 3. Objetivo

Dejar un workflow unitario, trazable y recuperable antes de abrir `B200`.

## 4. Alcance

- publicar un contrato API/LSP para el workflow spec-driven;
- validar que los edits queden dentro del safe edit plan actual;
- forzar export ORCA fresco antes de tocar staging;
- resolver el archivo staged correcto a partir de `trackedSources` persistidos en `last-export.state`;
- reutilizar import ORCA con backup, ledger y journal persistente;
- mover el foco canónico a `B200`.

## 5. Fuera de alcance

- coordinación bulk de múltiples PBL (`B200`);
- troubleshooting/documentación final del carril legacy (`B198`);
- generación automática del contenido del edit por IA dentro del core del plugin;
- cambios en el hot path moderno de discovery o serving semántico.

## 6. Criterios de aceptación

- AC1. Existe una API pública/versionada para aplicar un update PBL spec-driven.
- AC2. El workflow genera y respeta un `safeEditPlan` antes de ejecutar ORCA.
- AC3. El workflow hace export fresco, aplica edits explícitos sobre staging y ejecuta el import sobre el rail ORCA existente.
- AC4. El workflow mantiene backup, ledger y journal ya cerrados en `B193-B197`.
- AC5. El foco canónico se mueve a `B200`.

## 7. Documentación afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`
- `docs/roadmap.md`
- `docs/testing.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/specDrivenPblUpdate.test.js out/test/server/unit/orcaStagingImport.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 9. Cierre registrado

- `src/shared/publicApi.ts`, `src/client/extension.ts` y `src/server/server.ts` publican `applySpecDrivenPblUpdate()` como surface versionada de automatización controlada;
- `src/server/build/specDrivenPblUpdate.ts` orquesta `safeEditPlan`, export fresco, resolución staging por `trackedSources`, edits explícitos e import ORCA seguro;
- `test/server/unit/specDrivenPblUpdate.test.ts` fija el caso feliz y el bloqueo por plan inseguro;
- `B200` pasa a ser el siguiente cuello de botella técnico del carril legacy.