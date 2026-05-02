# Quickstart - Spec 263 PBAutoBuild CI/CD helper export (B186)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/pbAutoBuildCiHelper.test.js
npm run test:smoke -- --grep "PBAutoBuild"
```