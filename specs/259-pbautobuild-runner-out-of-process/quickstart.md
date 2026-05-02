# Quickstart - Spec 259 PBAutoBuild command runner out-of-process (B183)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/pbAutoBuildRunner.test.js out/test/server/unit/statusBarPresentation.test.js
npm run test:smoke -- --grep "registra comandos de PBAutoBuild"
```