# Quickstart — Spec 357 Official reserved words and keywords catalog generation

## Focused validation

```bash
node script/generate_official_function_catalog.cjs
npm run build:test
npx mocha --ui tdd out/test/server/unit/catalogGeneratorScript.test.js out/test/server/unit/catalogConsistency.test.js out/test/server/unit/catalogV2.test.js
```

## Expected result

`officialCoverage.generated.ts` should report zero missing units for `keywords` and `reserved-words`, `generatedKeywordLexemes.generated.ts` should include official lexemes such as `commit`, `namespace` and `with`, and `catalogV2.test.ts` should keep `PUBLIC`, `COMMIT` and `PB_KEYWORDS` aligned.