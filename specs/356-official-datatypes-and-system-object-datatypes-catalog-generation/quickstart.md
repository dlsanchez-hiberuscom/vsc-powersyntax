# Quickstart — Spec 356 Official datatypes and system object datatypes catalog generation

## Focused validation

```bash
node script/generate_official_function_catalog.cjs
npm run build:test
npx mocha --ui tdd out/test/server/unit/catalogGeneratorScript.test.js out/test/server/unit/catalogConsistency.test.js out/test/server/unit/catalogV2.test.js out/test/server/unit/diagnostics.test.js
npx mocha --ui tdd out/test/server/performance/semanticConsistencyOracle.smoke.test.js
```

## Expected result

`officialCoverage.generated.ts` should report zero missing units for `datatypes` and `system-object-datatypes`, the parser fast-path should recognize the generated official types, and the real-corpus oracle should remain healthy on PFC Solution and OrderEntry.