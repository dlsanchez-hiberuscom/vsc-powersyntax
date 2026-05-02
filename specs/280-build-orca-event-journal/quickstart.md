# Quickstart - Spec 280 Build and ORCA event journal (B197)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/runtimeJournal.test.js out/test/server/unit/buildOrcaJournalStore.test.js out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/orcaRunner.test.js
npm run test:smoke -- --grep "ORCA legacy"
```