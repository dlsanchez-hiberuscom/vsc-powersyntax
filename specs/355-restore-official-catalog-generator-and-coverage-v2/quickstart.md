# Quickstart — Spec 355 Restore official catalog generator and coverage v2

## Focused validation

```bash
node script/generate_official_function_catalog.cjs
npm run build:test
npx mocha --ui tdd out/test/server/unit/catalogGeneratorScript.test.js out/test/server/unit/catalogConsistency.test.js
```

## Expected result

The generator should run on the current server layout and `officialCoverage.generated.ts` should expose coverage for `global-functions`, `object-functions`, `datawindow-functions`, `system-events` and `statements`.