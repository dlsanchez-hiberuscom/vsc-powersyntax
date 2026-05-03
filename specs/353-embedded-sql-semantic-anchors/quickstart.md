# Quickstart — Spec 353 Embedded SQL semantic anchors

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/powerBuilderCodeMetrics.test.js out/test/server/unit/powerBuilderTechnicalDebtReport.test.js
npx mocha --ui tdd out/test/server/unit/currentObjectContextPanelModel.test.js out/test/server/unit/supportBundle.test.js
```

## Expected result

The focused suites should expose embedded SQL anchors with consistent keyword/range/preview/confidence payloads across the current object context, metrics, debt report and sanitized support bundle.