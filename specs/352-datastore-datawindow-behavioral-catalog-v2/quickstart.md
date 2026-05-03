# Quickstart — Spec 352 DataStore/DataWindow behavioral catalog v2

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/completion.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/hover.test.js out/test/server/unit/signatureHelp.test.js
```

## Expected result

The focused suite should keep `GetChild` scoped away from `DataWindowChild`, expose richer `Update(...)` metadata and keep the four affected surfaces aligned on the same owner-scoped catalog.