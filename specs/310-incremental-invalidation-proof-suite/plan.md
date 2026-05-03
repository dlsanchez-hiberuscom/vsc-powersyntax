# Plan - Spec 310 incremental invalidation proof suite (B265)

## 1. Enfoque técnico

No rediseñar la invalidación: reforzar el diff snapshot-aware ya existente y probar el watcher real con cambios falsables, midiendo qué cambia y qué debe permanecer estable. El borde local inicial debía ser discriminante: un `.srd` ligado por `DataObject` no estaba alcanzando a su consumidor porque faltaban dependency keys y contrato retrieve en `semanticDiff`.

## 2. Pasos

1. Añadir dependency keys `DataObject`/`report`/`dddw` y contrato retrieve de `.srd` al diff snapshot-aware.
2. Ampliar `watchedFileIntake.test.ts` con proofs de cambio cosmético, implementation, prototype, ancestor, `.srd`/`DataObject`, external function y ORCA staging.
3. Reutilizar los tests ya existentes de markers/sourceOrigin y ráfagas watcher como parte del cierre de `B265`.
4. Validar el budget incremental con `performance/large-workspace-incremental`.
5. Alinear docs canónicas y mover el foco a `B266`.

## 3. Riesgos

- confundir cambios de cuerpo con cambios semánticos exportados y disparar fan-out innecesario;
- dejar fuera contratos `.srd` y que el watcher no invalide consumers `DataObject`;
- permitir que ORCA staging desplace o invalide de más la surface real preferida.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticDiff.test.js out/test/server/unit/watchedFileIntake.test.js`
- `npx mocha --ui tdd out/test/server/performance/large-workspace-incremental.perf.test.js`

## 5. Resultado ejecutado

1. `semanticDiff` ya reconoce dependencias DataWindow relevantes y contrato retrieve de `.srd`.
2. `watchedFileIntake.test.ts` ya cubre el fan-out fino para todos los casos mínimos de `B265`.
3. El gate incremental de performance sigue dentro del budget antes del cierre canónico.