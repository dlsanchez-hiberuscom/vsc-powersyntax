# Quickstart - Spec 281 Spec-driven PBL update workflow (B199)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/specDrivenPblUpdate.test.js out/test/server/unit/orcaStagingImport.test.js
npm run test:smoke -- --grep "ORCA legacy"
```