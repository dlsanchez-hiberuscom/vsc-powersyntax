# Spec 275 - ORCA export to staging source (B191)

**Estado:** cerrada y validada.

## 1. Resumen

Cerrar el bridge legacy desde roots `.pbl` hacia source indexable sin tocar la librería binaria: el plugin prepara un script ORCA pborca-compatible, exporta a `.vsc-powersyntax/orca-export/orca-staging`, persiste el estado del export y aliasa ese staging al grafo legacy real para que routing, manifest y surfaces read-only sigan atribuyendo proyecto/librería al origen `.pbl`.

## 2. Estado real actual

`B191` queda `Closed`: el servidor prepara `scripts/export-to-staging.orc` y `state/last-export.state` bajo `.vsc-powersyntax/orca-export`, restaura aliases persisted en discovery y proyecta los archivos exportados hacia su librería legacy original; el cliente expone `vscPowerSyntax.exportOrcaStaging`, resuelve la DLL de sesión desde `vscPowerSyntax.legacy.orcaSessionDll` o `PB_ORCA_DLL` y ejecuta el carril ORCA existente sin declarar el staging como fuente canónica.

## 3. Objetivo

Permitir exportar una o varias librerías legacy a un staging explícito, reproducible e indexable desde VS Code, manteniendo la PBL original intacta y dejando el backbone listo para que `B192` formalice provenance y prioridad de source.

## 4. Alcance

- preparar export ORCA a staging bajo `.vsc-powersyntax/orca-export/{orca-staging,scripts,state}`;
- generar un script ORCA pborca-compatible usando la DLL de sesión explícita;
- persistir y restaurar aliases entre cada source root exportado y la librería `.pbl` original;
- hacer alias-aware el routing, el project model y `semanticWorkspaceManifest` para que staging siga perteneciendo al proyecto/librería legacy real;
- exponer el comando cliente `vscPowerSyntax.exportOrcaStaging` y la setting `vscPowerSyntax.legacy.orcaSessionDll`;
- fijar validación unitaria y smoke proporcional del slice.

## 5. Fuera de alcance

- declarar el staging ORCA como fuente canónica o resolver prioridad final frente a source real (`B192`);
- abrir edición/import/compile/regenerate sobre PBL (`B193+`);
- introducir autodetección difusa de DLL ORCA fuera de configuración explícita, entorno o fallback documentado.

## 6. Criterios de aceptación

- AC1. Existe un comando visible para exportar roots legacy a staging usando el adapter ORCA ya cerrado.
- AC2. El staging se materializa bajo `.vsc-powersyntax/orca-export/` y sus carpetas no se presentan como nuevas librerías `.pbl`.
- AC3. Los archivos exportados siguen resolviendo proyecto/librería hacia la PBL legacy original mediante aliases explícitos.
- AC4. El estado del export se persiste y puede restaurar aliases tras un refresh/discovery nuevo.
- AC5. La validación cubre script generado, persistencia de estado, routing/manifest alias-aware y smoke visible del carril ORCA.
- AC6. El foco canónico se mueve a `B192`.

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
- `npx mocha --ui tdd out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/workspace.test.js out/test/server/unit/semanticWorkspaceManifest.test.js`
- `npm run test:smoke -- --grep "ORCA legacy"`

## 9. Cierre registrado

- `src/shared/orcaProtocol.ts`, `src/server/build/orcaStagingExport.ts` y `src/server/server.ts` introducen el export ORCA a staging, su estado persistido y el wiring server-side sobre el runner existente;
- `src/server/workspace/workspaceState.ts`, `projectRouting.ts`, `projectRegistry.ts`, `unifiedProjectModel.ts` y `semanticWorkspaceManifest.ts` resuelven aliases de staging hacia la librería legacy original;
- `src/client/extension.ts`, `package.json` y `.gitignore` publican el comando/configuración visible y formalizan `.vsc-powersyntax/orca-export/` como artefacto local ignorado;
- `test/server/unit/orcaStagingExport.test.ts`, `workspace.test.ts`, `semanticWorkspaceManifest.test.ts` y la smoke ORCA en `test/smoke/extension.test.ts` fijan el layout, el alias restore y el wiring visible.