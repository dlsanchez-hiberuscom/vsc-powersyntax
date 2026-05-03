# Quickstart — Spec 361 Semantic confidence calibration over real corpora

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/confidenceCalibration.test.js out/test/server/performance/confidenceCalibration.smoke.test.js
```

## Expected result

The calibration baseline should remain at `0 false positives / 0 false negatives`, with real `low`, `medium` and `high` scenarios sampled from PFC, OrderEntry and the public legacy corpus, and with the current thresholds still reviewed as valid for `hover`, `completion`, `definition`, `references`, `rename` and `signature-help`.