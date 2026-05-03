# Quickstart — Spec 358 Operators, pronouns and enumerated values catalog hardening

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/catalogV2.test.js
```

## Expected result

`resolveLanguageSymbol('SaveAsType')` should resolve `SaveAsType!` as an `enumerated-value`, and `operators`/`pronouns`/`enumerated-values` should not overlap in lookup space with the official `keywords`/`reserved-words` domains.