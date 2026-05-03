# Quickstart — Spec 366 Enterprise configuration policy

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/settingsGovernance.test.js
npm run test:smoke -- --grep "settings governance publica perfiles corporativos y tolera la inspección read-only"
```

## Expected result

La extensión debe publicar y gobernar los perfiles `fast`, `balanced`, `deep-analysis`, `legacy-orca`, `ci-support` y `support-safe`, normalizando aliases legacy conocidos sin romper la inspección read-only del workspace.