# Quickstart — Spec 364 Runtime self-test command

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/runtimeSelfTest.test.js out/test/server/unit/coreMaintenanceCommandCatalog.test.js
npm run test:smoke -- --grep "el runtime self-test se ejecuta como comando read-only"
```

## Expected result

El comando `vscPowerSyntax.runRuntimeSelfTest` debe devolver un reporte Markdown read-only con checks visibles para API, LSP/runtime, cache, project model, diagnósticos, build y ORCA, sin abrir ninguna API nueva del servidor.