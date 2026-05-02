# Spec 272 - ORCA adapter architecture (B188)

**Estado:** cerrada y validada.

## 1. Resumen

Abrir un adapter ORCA base, opcional y out-of-process, capaz de ejecutar el script activo desde VS Code sin mezclarse con discovery, semántica interactiva ni staging/export legacy.

## 2. Estado real actual

`B188` queda `Closed`: el servidor registra un runner ORCA cancelable y observable en `showStats`, mientras el cliente expone comandos mínimos para ejecutar/cancelar el script activo usando `vscPowerSyntax.legacy.orcaPath` como ruta explícita al ejecutable hasta que exista capability detection real.

## 3. Objetivo

Dejar abierto el carril legacy ORCA con una base arquitectónica real y verificable, separada del hot path moderno y lista para que `B189+` construyan detection, discovery, export e import sin reabrir el diseño base.

## 4. Alcance

- definir un protocolo compartido para snapshots/resultados ORCA;
- implementar un runner server-side out-of-process, cancelable y con timeout/journal;
- exponer comandos mínimos cliente/servidor para ejecutar y cancelar el script activo;
- reflejar el snapshot ORCA en `showStats` y en el dashboard read-only;
- validar con unit del runner y smoke del comando visible con un ejecutable de prueba.

## 5. Fuera de alcance

- autodetección/versionado/capability detallada del ejecutable ORCA (`B189`);
- export/import/staging de PBL (`B190+`);
- cualquier operación ORCA mutante sobre PBL real.

## 6. Criterios de aceptación

- AC1. Existe un runner ORCA out-of-process separado del hot path semántico.
- AC2. El cliente puede ejecutar/cancelar el script activo mediante comandos visibles y configuración explícita.
- AC3. El estado del adapter es observable desde `showStats` y dashboard.
- AC4. La base no toca discovery, `sourceOrigin` ni staging/export legacy.
- AC5. Hay validación unitaria del runner y smoke del comando visible.
- AC6. El foco canónico se mueve a `B189`.

## 7. Documentación afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/roadmap.md`
- `docs/testing.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaRunner.test.js out/test/server/unit/projectHealthDashboard.test.js out/test/server/unit/currentObjectContextPanelModel.test.js`
- `npm run test:smoke -- --grep "adapter ORCA legacy sobre el archivo activo"`

## 9. Cierre registrado

- `src/shared/orcaProtocol.ts` y `src/server/build/orcaRunner.ts` formalizan el adapter ORCA base;
- `src/server/server.ts`, `src/client/extension.ts` y `package.json` lo exponen por comandos mínimos y stats;
- `src/client/projectHealthDashboard.ts` consume el snapshot ORCA visible sin abrir un motor paralelo.