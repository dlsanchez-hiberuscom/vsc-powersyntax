# Spec 278 - ORCA regenerate and rebuild commands (B194)

**Estado:** cerrada y validada.

## 1. Resumen

Completar la operativa legacy visible tras `B193` sin abrir un segundo motor ORCA: el mismo rail write-enabled ahora soporta `regenerate` y `rebuild`, reutilizando preflight, backup binario, scripts dedicados y ledgers persistidos.

## 2. Estado real actual

`B194` queda `Closed`: el servidor generaliza el helper write-enabled ORCA para materializar `regenerate-from-staging.orc` y `rebuild-from-staging.orc`, reaprovecha preflight/backup/ledger del import y bloquea `rebuild` cuando el export persistido no conserva un target/project legacy válido; el cliente publica `vscPowerSyntax.regenerateOrcaLibraries` y `vscPowerSyntax.rebuildOrcaProject` en command palette/status menu sin tocar el hot path.

## 3. Objetivo

Exponer mantenimiento legacy `regenerate/rebuild` desde VS Code sobre el mismo carril ORCA seguro ya abierto por `B193`, dejando el ecosistema listo para `B196` y `B197`.

## 4. Alcance

- reutilizar el rail ORCA write-enabled existente en lugar de abrir otro helper;
- generar scripts específicos `regenerate` y `rebuild` con ledgers persistidos dedicados;
- mantener preflight, backup binario y `compileResult` observables para las nuevas operaciones;
- bloquear `rebuild` si el export persistido no deja target/project legacy suficiente;
- publicar ambos comandos en servidor, cliente, command palette y status menu;
- fijar validación unitaria y smoke proporcional del slice.

## 5. Fuera de alcance

- seguridad source real/staging y stale source (`B196`);
- journal técnico persistente de build/ORCA (`B197`);
- packaging ejecutables/PBD/DLL (`B195`);
- troubleshooting/documentación operativa final (`B198`).

## 6. Criterios de aceptación

- AC1. Existen comandos visibles `regenerate` y `rebuild` sobre el mismo rail ORCA write-enabled.
- AC2. Ambas operaciones reutilizan preflight, backup binario, ledgers persistidos y `compileResult` observable.
- AC3. `rebuild` no se ejecuta cuando el export persistido solo conoce una librería sin target/project legacy válido.
- AC4. La validación cubre script `regenerate`, bloqueo de `rebuild` sin target y wiring visible de los nuevos comandos.
- AC5. El foco canónico se mueve a `B196`.

## 7. Documentación afectada

- `README.md`
- `docs/architecture.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/roadmap.md`
- `docs/testing.md`
- `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`

## 8. Validación requerida

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/orcaStagingImport.test.js out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/fileSystem.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 9. Cierre registrado

- `src/server/build/orcaStagingImport.ts` generaliza el rail write-enabled ORCA y emite scripts/ledgers específicos para `regenerate` y `rebuild`;
- `src/shared/orcaProtocol.ts` y `src/server/server.ts` añaden los nuevos contratos/comandos server-side y bloquean `rebuild` sin target/project legacy válido;
- `src/client/extension.ts`, `src/client/build/orcaDetection.ts` y `package.json` publican los comandos visibles `vscPowerSyntax.regenerateOrcaLibraries` y `vscPowerSyntax.rebuildOrcaProject`;
- `test/server/unit/orcaStagingImport.test.ts` y la smoke ORCA en `test/smoke/extension.test.ts` fijan el nuevo comportamiento y el wiring visible.