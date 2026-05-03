# Quickstart — Spec 350 DataWindow SQL parser safe subset v2

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/architectureImports.test.js out/test/server/unit/dataWindowModel.test.js out/test/server/unit/dataWindowLegacySafeMode.test.js out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/crossSurfaceGoldenMatrix.test.js
```

## Notes

- The subset is intentionally conservative: aliases, simple joins and basic where clauses are in scope.
- Subqueries and other complex SQL constructs must degrade instead of pretending to be fully parsed.
- Any future SQL depth increase must stay on top of `dataWindowModel` rather than creating a second parser.