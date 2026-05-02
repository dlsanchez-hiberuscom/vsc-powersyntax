# Quickstart - Spec 271 Current Object Context Panel (B215)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/currentObjectContextPanelModel.test.js
npm run test:smoke -- --grep "Current Object Context del archivo activo"
```