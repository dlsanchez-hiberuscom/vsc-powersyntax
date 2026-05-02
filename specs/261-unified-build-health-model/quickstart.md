# Quickstart - Spec 261 Unified build health model (B187)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/pbAutoBuildHealth.test.js out/test/server/unit/statusBarPresentation.test.js
npm run test:smoke -- --grep "registra comandos de PBAutoBuild"
```