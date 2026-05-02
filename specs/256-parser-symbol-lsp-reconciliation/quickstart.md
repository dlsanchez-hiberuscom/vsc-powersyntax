# Quickstart - Spec 256 (B162)

## Validación focal

`npm run build:test ; npx mocha --ui tdd out/test/server/unit/documentSymbols.test.js out/test/server/unit/documentSymbolsReconciliation.test.js`

## Qué revisar

- snapshots sanos devuelven `healthy` sin findings;
- snapshots inconsistentes generan reason codes claros;
- el servidor puede registrar el drift antes de devolver el outline.