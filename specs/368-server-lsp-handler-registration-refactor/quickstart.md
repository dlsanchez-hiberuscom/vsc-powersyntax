# Quickstart — Spec 368 Server LSP handler registration refactor

## Focused validation

```bash
npm run build:test
npm test
npx mocha --ui tdd out/test/server/unit/architectureImports.test.js
npx mocha --ui tdd out/test/server/performance/pfc-workspace.smoke.test.js out/test/server/performance/orderentry.smoke.test.js
npm run test:smoke -- --grep "el formatter devuelve edits reales para un documento PowerBuilder abierto"
npm run test:smoke -- --grep "registra comandos de PBAutoBuild y cancelar degrada sin build activo"
npm run test:smoke -- --grep "puede ejecutar el adapter ORCA legacy sobre el archivo activo"
npm run test:smoke -- --grep "exporta un health report reutilizando stats y manifest del workspace activo"
```

## Expected result

`server.ts` queda reducido a bootstrap y runtime orchestration, mientras lifecycle/document/features/commands viven en módulos dedicados sin romper el comportamiento observable del servidor.