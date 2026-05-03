# Quickstart — Spec 362 Catalog corpus validation over real corpora

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/catalogCorpusValidation.test.js out/test/server/performance/catalogCorpusValidation.smoke.test.js
npx mocha --ui tdd out/test/server/performance/catalogCorpusValidation.smoke.test.js out/test/server/performance/pfc-solution.smoke.test.js out/test/server/performance/orderentry.semantic.test.js out/test/server/performance/legacy-pbl-dump.smoke.test.js
npx mocha --ui tdd out/test/server/unit/catalogV2.test.js out/test/server/unit/completion.test.js out/test/server/unit/hover.test.js out/test/server/unit/diagnostics.test.js
```

## Expected result

The real-corpus baseline should remain at `0 misses / 0 ambiguities / 0 budget violations`, with PFC Solution, STD_FC_OrderEntry and the public legacy corpus exercising `hover`, `completion` and `diagnostics` over reviewed catalog domains without reopening confidence thresholds or discovery/indexing budgets.