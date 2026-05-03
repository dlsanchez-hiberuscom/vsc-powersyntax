# Quickstart — Spec 347 Override/overload hardening

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/documentAnalysis.test.js out/test/server/unit/semanticQueryService.test.js out/test/server/unit/definition.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/impactAnalysis.test.js
```

## Expected result

The focused suite should include B281 cases for overload preservation, signature discard evidence, prototype shadowing, Definition overload routing, Signature Help overload routing and impact override filtering.