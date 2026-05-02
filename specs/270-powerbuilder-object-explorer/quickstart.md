# Quickstart - Spec 270 PowerBuilder Object Explorer (B214)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/objectExplorerModel.test.js out/test/server/unit/semanticWorkspaceManifest.test.js
npm run test:smoke -- --grep "Object Explorer en el archivo activo"
```