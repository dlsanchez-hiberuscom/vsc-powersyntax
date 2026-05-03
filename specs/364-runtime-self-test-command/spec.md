# Spec 364: Runtime self-test command

## Status

Closed.

## Backlog mapping

- B297 — Runtime self-test command.

## Objective

Exponer un comando read-only y rápido que valide las surfaces críticas del runtime reutilizando sólo contratos ya publicados: API pública, roundtrip LSP, cache/persistencia, project model, diagnósticos, build snapshot y ORCA snapshot.

## Implemented scope

- `src/client/runtimeSelfTest.ts` introduce un builder puro del self-test y su render Markdown, con degradación honesta cuando faltan contrato, stats o manifest.
- `src/client/extension.ts` registra `vscPowerSyntax.runRuntimeSelfTest`, abre el reporte Markdown y compone la evidencia únicamente desde `getPublicContract()`, `refreshRuntimeStatusSnapshot()` y `getSemanticWorkspaceManifest()`.
- `src/client/coreMaintenanceCommandCatalog.ts`, `src/client/statusBarPresentation.ts` y `package.json` integran el comando en el core maintenance pack y en las acciones rápidas visibles del runtime.
- `test/server/unit/runtimeSelfTest.test.ts`, `test/server/unit/coreMaintenanceCommandCatalog.test.ts` y `test/smoke/extension.test.ts` fijan el modelo, el wiring del catálogo y la ejecución real del comando.

## Out of scope

- Introducir nuevas APIs o nuevos comandos del servidor para el self-test.
- Reescaneos del workspace, recálculos semánticos paralelos o otra capa de health separada del runtime actual.
- El score agregado enterprise del workspace. Eso sigue perteneciendo a B296.

## Acceptance evidence

- `vscPowerSyntax.runRuntimeSelfTest` devuelve un reporte Markdown accionable.
- El reporte cubre API pública, LSP/runtime, cache/persistencia, project model, diagnósticos, build snapshot y ORCA snapshot.
- El comando permanece read-only y se apoya sólo en snapshots/contratos ya publicados.
- La validación focal de unit y smoke queda verde.