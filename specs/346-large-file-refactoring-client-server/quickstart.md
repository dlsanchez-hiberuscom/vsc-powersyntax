# Quickstart — Spec 346 Large-file refactoring

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/codeLensResultCache.test.js out/test/server/unit/architectureImports.test.js
```

## Full validation for future large extractions

```bash
npm run test:unit
npm run test:smoke -- --grep "extension|activation|commands|PBAutoBuild|ORCA"
npm run test:performance -- --grep "PFC|OrderEntry|STD"
npm test
```