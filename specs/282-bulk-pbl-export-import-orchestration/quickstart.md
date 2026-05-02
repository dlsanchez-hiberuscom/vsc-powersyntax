# Quickstart - Spec 282 Bulk PBL export/import orchestration (B200)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/specDrivenPblUpdateBatch.test.js out/test/server/unit/specDrivenPblUpdate.test.js
npm run test:smoke -- --grep "ORCA legacy"
```