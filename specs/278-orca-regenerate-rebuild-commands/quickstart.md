# Quickstart - Spec 278 ORCA regenerate and rebuild commands (B194)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/orcaStagingImport.test.js out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/fileSystem.test.js
npm run test:smoke -- --grep "ORCA legacy"
```