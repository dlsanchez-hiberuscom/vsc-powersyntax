# Quickstart - Spec 269 Project Health Dashboard (B216)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/projectHealthDashboard.test.js out/test/server/unit/statusBarPresentation.test.js
npm run test:smoke -- --grep "dashboard de salud del proyecto"
```