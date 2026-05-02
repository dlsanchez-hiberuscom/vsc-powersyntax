# Quickstart - Spec 272 ORCA adapter architecture (B188)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/orcaRunner.test.js out/test/server/unit/projectHealthDashboard.test.js out/test/server/unit/currentObjectContextPanelModel.test.js
npm run test:smoke -- --grep "adapter ORCA legacy sobre el archivo activo"
```