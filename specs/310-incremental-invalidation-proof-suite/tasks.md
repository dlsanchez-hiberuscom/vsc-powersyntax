# Tasks - Spec 310 incremental invalidation proof suite (B265)

## 1. Preparación

- [x] T1. Confirmar el owner real del comportamiento en `watchedFileIntake.ts` y `semanticInvalidation.ts`.
- [x] T2. Identificar el primer borde falsable: el `.srd` ligado por `DataObject` no estaba invalidando la cache del consumidor.

## 2. Implementación

- [x] T3. Añadir dependency keys `DataObject`/`report`/`dddw` al diff snapshot-aware.
- [x] T4. Tratar los argumentos retrieve de `.srd` como contrato semántico relevante.
- [x] T5. Ampliar `watchedFileIntake.test.ts` para cambio cosmético, implementation-only, prototype-only heredado y ancestor signature.
- [x] T6. Ampliar `watchedFileIntake.test.ts` para `.srd`/`DataObject`, external function y ORCA staging.
- [x] T7. Reutilizar la cobertura ya existente de markers/sourceOrigin y bursts watcher como parte del cierre de `B265`.
- [x] T8. Alinear docs canónicas y mover el foco a `B266`.

## 3. Validación

- [x] T9. Ejecutar `npm run build:test`.
- [x] T10. Ejecutar `npx mocha --ui tdd out/test/server/unit/semanticDiff.test.js out/test/server/unit/watchedFileIntake.test.js`.
- [x] T11. Ejecutar `npx mocha --ui tdd out/test/server/performance/large-workspace-incremental.perf.test.js`.

## 4. Cierre

- [x] T12. Sacar `B265` del backlog activo, registrar el cierre en `docs/done-log.md` y dejar `B266` como foco siguiente.