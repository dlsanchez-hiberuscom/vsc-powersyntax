# Spec 277 - ORCA import and compile controlled (B193)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar el primer carril write-enabled del ecosistema ORCA sin mezclar todavía regenerate/rebuild ni la sincronización fina source real/staging: el plugin reutiliza el export persistido, exige preflight sobre fingerprint/layout, hace backup binario de la PBL, ejecuta un script de import desde staging, resume `compileResult` y persiste un ledger rollback-aware.

## 2. Estado real actual

`B193` queda `Closed`: el servidor lee `state/last-export.state`, bloquea imports si falta export, falta staging o cambió la PBL desde el export, copia backups binarios bajo `.vsc-powersyntax/orca-export/backups/<operationId>/`, genera `scripts/import-from-staging.orc`, persiste `state/last-import-ledger.json` y expone `powerbuilder.importOrcaStaging`; el cliente publica `vscPowerSyntax.importOrcaStaging` en command palette/status menu y proyecta preflight/compile result de forma observable sin tocar el hot path.

## 3. Objetivo

Permitir importar de forma explícita y controlada el staging ORCA ya exportado de vuelta a PBL legacy, con garantías mínimas de seguridad y trazabilidad antes de abrir `B194` y `B196`.

## 4. Alcance

- leer el último export ORCA persistido por workspace/focus;
- exigir preflight sobre estado exportado, existencia del staging y fingerprint de la PBL;
- crear backup binario real de la PBL antes de ejecutar ORCA;
- generar `import-from-staging.orc` y persistir ledger con rollback, `compileResult` y fingerprints `pbl before/after`;
- exponer el comando cliente `vscPowerSyntax.importOrcaStaging` y su entrada en status menu;
- fijar validación unitaria y smoke proporcional del slice.

## 5. Fuera de alcance

- explicitar `regenerate/rebuild` legacy (`B194`);
- cerrar conflictos `source real/staging` o stale source más allá del gate por fingerprint de PBL (`B196`);
- event journal histórico y troubleshooting extendido (`B197`, `B198`);
- creación de ejecutables/PBD/DLL (`B195`).

## 6. Criterios de aceptación

- AC1. Existe un comando visible para importar staging ORCA a PBL reutilizando el adapter ya cerrado.
- AC2. El preflight bloquea import si falta `last-export.state`, falta staging, el staging está vacío o la PBL cambió desde el export.
- AC3. Antes de ejecutar ORCA se crea un backup binario real de la PBL y queda rollback documentado.
- AC4. El resultado de import/compile queda observable mediante `compileResult`, `last-import-ledger.json` y journal runtime.
- AC5. La validación cubre helper server-side, export/import state, backup binario y wiring visible del comando.
- AC6. El foco canónico se mueve a `B194`.

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

- `src/server/build/orcaStagingImport.ts`, `src/server/build/orcaStagingExport.ts` y `src/shared/orcaProtocol.ts` introducen el preflight mínimo, la captura de fingerprint de PBL, el backup binario real, el script `import-from-staging.orc` y `last-import-ledger.json`;
- `src/server/system/fileSystem.ts` añade `copyFile()` para preservar binarios y `src/server/server.ts` expone `powerbuilder.importOrcaStaging` sobre el `OrcaRunner`/`RuntimeJournal` existentes;
- `src/client/extension.ts`, `src/client/build/orcaDetection.ts` y `package.json` publican `vscPowerSyntax.importOrcaStaging` en command palette y status menu, manteniendo toda la operativa ORCA fuera del hot path;
- `test/server/unit/orcaStagingImport.test.ts`, `orcaStagingExport.test.ts`, `fileSystem.test.ts` y la smoke ORCA de `test/smoke/extension.test.ts` fijan preflight, backup, ledger y wiring visible.