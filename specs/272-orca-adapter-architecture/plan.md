# Plan - Spec 272 ORCA adapter architecture (B188)

## 1. Enfoque técnico

Resolver `B188` como infraestructura base: protocolo compartido + runner server-side + comandos mínimos cliente/servidor. El adapter debe ser completamente out-of-process y no depender todavía de autodetección ni de staging/export.

## 2. Pasos

1. Definir contrato `orcaProtocol` para snapshot/resultados/cancelación.
2. Implementar `OrcaRunner` con spawn, timeout, cancelación y journal.
3. Exponer `powerbuilder.runOrcaScript/cancelOrcaScript` y comandos cliente para el script activo.
4. Hacer visible el snapshot ORCA en stats/dashboard.
5. Validar runner + smoke y mover el foco a `B189`.

## 3. Riesgos

- acoplar la base ORCA al hot path o a surfaces semánticas modernas;
- adivinar autodetección/versionado que en realidad corresponde a `B189`;
- abrir accidentalmente operaciones mutantes sobre PBL antes de tiempo.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaRunner.test.js out/test/server/unit/projectHealthDashboard.test.js out/test/server/unit/currentObjectContextPanelModel.test.js`
- `npm run test:smoke -- --grep "adapter ORCA legacy sobre el archivo activo"`

## 5. Resultado ejecutado

1. El plugin ya tiene un adapter ORCA base real y cancelable.
2. La ejecución legacy queda aislada del hot path moderno y observable en stats/dashboard.
3. `B189` pasa a ser el siguiente foco del carril ORCA.