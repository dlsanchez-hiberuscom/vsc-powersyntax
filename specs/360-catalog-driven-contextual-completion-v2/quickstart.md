# Quickstart — Spec 360 Catalog-driven contextual completion v2

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/completion.test.js
npx mocha --ui tdd out/test/server/unit/hotPathAllocationBudget.test.js
```

## Expected result

Completion should suggest catalog-driven `reserved-words`, `pronouns`, `system-globals` and `enumerated-values` only in relevant unqualified contexts, keep locals/project symbols ahead via `sortText`, deduplicate case-insensitively, and keep member contexts such as `SQLCA.sa` free from those global vocabulary domains.