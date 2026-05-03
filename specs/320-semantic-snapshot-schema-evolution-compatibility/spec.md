# Spec 320 - semantic snapshot schema evolution and compatibility (B269)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar `B269` fijando fixtures versionadas y pruebas de compatibilidad para snapshots semánticos, manifests, support bundles y payloads públicos exportables, añadiendo además migración segura para snapshots legados compatibles sin `schemaVersion` o `summary` materializado.

## 2. Estado real actual

El repo ya dispone de `test/fixtures/compatibility/*.json`, `test/server/unit/semanticWorkspaceSnapshot.test.ts`, `publicApi.test.ts` y `supportBundle.test.ts` para congelar compatibilidad minor y roundtrips sobre manifest externo, `public-contract`, `read-only-tool-bridge` y `support bundle manifest`. `src/client/semanticWorkspaceSnapshot.ts` migra ya snapshots legados compatibles y rechaza versiones no soportadas con razón explícita.

## 3. Objetivo

Demostrar que la evolución de payloads versionados del carril read-only/exportable no rompe consumo compatible: se migra cuando faltan campos derivables seguros y se rechaza de forma honesta cuando la versión o la forma ya no son seguras.

## 4. Alcance

- migrar snapshots semánticos legados compatibles sin `schemaVersion` o `summary`;
- congelar fixtures versionadas para manifest externo, `public-contract`, `read-only-tool-bridge` y `support bundle manifest`;
- validar roundtrip de serialización/import/export sobre el carril snapshot/manifest;
- validar compatibilidad minor del contrato público y del manifest del support bundle;
- alinear `docs/testing.md`, `docs/architecture.md`, `docs/backlog.md`, `docs/current-focus.md`, `docs/roadmap.md` y `docs/done-log.md` con el cierre.

## 5. Fuera de alcance

- abrir nuevas APIs visibles o un importador nuevo para support bundles;
- aceptar payloads ambiguos sin policy explícita de compatibilidad;
- mezclar `B269` con el contrato de observabilidad local que pertenece a `B271`.

## 6. Criterios de aceptación

- AC1. snapshots legados compatibles sin `schemaVersion` o `summary` importan con migración segura.
- AC2. snapshots con versión no soportada siguen rechazándose con razón explícita.
- AC3. fixtures versionadas cubren manifest, support bundle y contrato público con compatibilidad minor y serialización estable.
- AC4. la batería focal queda verde sin reabrir surfaces ni introducir compatibilidad silenciosa.
- AC5. docs canónicas quedan alineadas y el siguiente foco canónico pasa a `B271`.

## 7. Documentación afectada

- `docs/testing.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/roadmap.md`
- `docs/done-log.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticWorkspaceSnapshot.test.js out/test/server/unit/publicApi.test.js out/test/server/unit/supportBundle.test.js`

## 9. Cierre registrado

- los snapshots legados compatibles ya no rompen por ausencia de campos derivables;
- manifests, support bundles y payloads públicos exportables quedan congelados con fixtures versionadas y roundtrip explícito;
- el siguiente foco canónico del repo pasa a `B271`.