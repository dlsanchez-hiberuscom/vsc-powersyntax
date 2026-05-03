# Quickstart - Spec 295 ORCA packaging policy behind feature flag (B195)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/orcaDetection.test.js out/test/server/unit/statusBarPresentation.test.js out/test/server/unit/projectHealthDashboard.test.js
npm run test:smoke -- --grep "ORCA legacy"
```

Comprobación funcional mínima:

1. Verificar que `stats.orcaTooling.packagingPolicy.exposure === "not-exposed"`.
2. Verificar que status/stats/dashboard muestran la policy sin abrir comandos ORCA nuevos.
3. Verificar que backlog/current-focus/roadmap/done-log ya no tratan `B195` como deuda activa.
