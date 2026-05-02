# Spec 282 - Bulk PBL export/import orchestration (B200)

**Estado:** cerrada y validada.

## 1. Resumen

Coordinar varias actualizaciones PBL sobre el workflow unitario ya cerrado en `B199`, agregando resultados por item y respetando un `stopOnError` explícito sin abrir otro motor ORCA.

## 2. Estado real actual

`B200` queda `Closed`: la API pública `applySpecDrivenPblUpdateBatch()` acepta un lote de requests, carga cada documento, reutiliza `applySpecDrivenPblUpdate()` de forma secuencial, corta temprano cuando se pide, agrega `blocked/succeeded/blockedCount/stoppedEarly` y registra el batch en el journal legacy.

## 3. Objetivo

Escalar la automatización legacy cerrada en `B199` a múltiples PBL antes de volver a la rama semántica `B081`.

## 4. Alcance

- publicar un contrato API/LSP batch para múltiples requests PBL;
- secuenciar cada item sobre `applySpecDrivenPblUpdate()` sin duplicar ORCA;
- soportar `stopOnError` y resumen agregado por item;
- registrar journaling batch sobre el mismo carril legacy;
- mover el foco canónico de vuelta a `B081`.

## 5. Fuera de alcance

- nuevo motor ORCA paralelo;
- paralelización concurrente de updates sobre varias PBL;
- cierre documental/troubleshooting completo de `B198`;
- semántica DataWindow profunda (`B081`).

## 6. Criterios de aceptación

- AC1. Existe una API pública/versionada batch para múltiples updates PBL.
- AC2. Cada item reutiliza el workflow unitario ya cerrado en `B199`.
- AC3. El batch soporta corte temprano opcional y resumen agregado defendible.
- AC4. La validación demuestra caso feliz, corte temprano y continuación sin duplicar ORCA.
- AC5. El foco canónico vuelve a `B081`.

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
- `npx mocha --ui tdd out/test/server/unit/specDrivenPblUpdateBatch.test.js out/test/server/unit/specDrivenPblUpdate.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 9. Cierre registrado

- `src/shared/publicApi.ts`, `src/client/extension.ts` y `src/server/server.ts` publican `applySpecDrivenPblUpdateBatch()`;
- `src/server/build/specDrivenPblUpdate.ts` agrega la orquestación batch secuencial con `stopOnError` y journaling agregado;
- `test/server/unit/specDrivenPblUpdateBatch.test.ts` fija agregado feliz, corte temprano y continuación explícita;
- `B081` vuelve a ser el siguiente foco de semántica PowerBuilder profunda.