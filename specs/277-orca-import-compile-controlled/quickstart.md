# Quickstart - Spec 277 ORCA import and compile controlled (B193)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/orcaStagingImport.test.js out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/fileSystem.test.js
npm run test:smoke -- --grep "ORCA legacy"
```