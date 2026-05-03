# Quickstart — Spec 349 DataWindow model canonicalization v2

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/architectureImports.test.js out/test/server/unit/dataWindowModel.test.js out/test/server/unit/dataWindowLegacySafeMode.test.js out/test/server/unit/dataWindowSafeMode.test.js out/test/server/unit/dataWindowSqlLineage.test.js out/test/server/unit/documentSymbols.test.js out/test/server/unit/definition.test.js out/test/server/unit/completion.test.js out/test/server/unit/hover.test.js out/test/server/unit/diagnostics.test.js out/test/server/unit/currentObjectContext.test.js out/test/server/unit/signatureHelp.test.js out/test/server/unit/crossSurfaceGoldenMatrix.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js
```

## Notes

- B287 closes canonicalization only; SQL parsing depth beyond the current subset belongs to B288.
- If a future DataWindow surface needs `retrieve`, `retrieveArguments`, bands or table column metadata, it must consume `dataWindowModel` instead of reparsing the snapshot text.