# Quickstart — Spec 348 Dynamic invocation risk model v2

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/dynamicStringReferences.test.js out/test/server/unit/references.test.js out/test/server/unit/rename.test.js out/test/server/unit/codeActions.test.js out/test/server/unit/impactAnalysis.test.js out/test/server/unit/safeEditPlan.test.js out/test/server/unit/dependencyGraph.test.js
```

## Expected result

The focused suite should prove that `invocationRisk` is surfaced consistently and that dynamic/fallback/external risks block automated edits instead of returning unsafe results.