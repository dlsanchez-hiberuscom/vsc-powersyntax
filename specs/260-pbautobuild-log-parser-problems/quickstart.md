# Quickstart - Spec 260 PBAutoBuild log parser and Problems Panel integration (B184)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/pbAutoBuildLogParser.test.js
npx mocha --ui tdd out/test/server/unit/pbAutoBuildProblems.test.js out/test/server/unit/pbAutoBuildRunner.test.js
npm run test:smoke -- --grep "registra comandos de PBAutoBuild"
```