# Quickstart — Spec 359 System globals and runtime singleton catalog

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/catalogV2.test.js out/test/server/unit/completion.test.js out/test/server/unit/hover.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/signatureHelp.test.js
```

## Expected result

`system-globals` should expose typed singleton metadata (`SQLCA : Transaction`, `SQLDA : DynamicDescriptionArea`, etc.), completion and hover should read that metadata from the catalog, diagnostics should keep accepting `SQLCA` in transaction flows, and signature help should select transaction overloads when the argument is `SQLCA`.