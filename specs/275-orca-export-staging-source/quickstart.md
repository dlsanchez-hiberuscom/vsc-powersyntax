# Quickstart - Spec 275 ORCA export to staging source (B191)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/orcaStagingExport.test.js out/test/server/unit/workspace.test.js out/test/server/unit/semanticWorkspaceManifest.test.js
npm run test:smoke -- --grep "ORCA legacy"
```