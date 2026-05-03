# Quickstart — Spec 318 Catalog v2

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/catalogV2.test.js out/test/server/unit/catalogGeneratorScript.test.js out/test/server/unit/catalogConsistency.test.js
```

## Full validation

```bash
npm run test:unit
npm test
```

## Notes

- Do not run the official generator casually; it fetches external Appeon documentation and may rewrite generated catalog files.
- If the generator is run for B319, review the generated diff and verify existing IDs, `kind`, `domain` and `namespace` are preserved.