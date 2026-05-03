# Quickstart — Spec 354 System catalog coverage v2

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/catalogV2.test.js out/test/server/unit/completion.test.js out/test/server/unit/hover.test.js out/test/server/unit/powerbuilderSemanticGolden.test.js
```

## Expected result

The focused suites should resolve representative runtime system types from the curated catalog, expose them in visible surfaces and keep the shared catalog lane stable without feature-local hardcode.