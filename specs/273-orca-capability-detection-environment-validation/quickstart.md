# Quickstart - Spec 273 ORCA capability detection and environment validation (B189)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/orcaDetection.test.js out/test/server/unit/statusBarPresentation.test.js out/test/server/unit/projectHealthDashboard.test.js
npm run test:smoke -- --grep "adapter ORCA legacy"
```