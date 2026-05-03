# Quickstart - Spec 303 offline support bundle / support diagnostics export (B258)

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/supportBundle.test.js
npm run test:smoke -- --grep "support-bundle-extension"
```

Comprobación funcional mínima:

1. Verificar que `vscPowerSyntax.exportSupportBundle` genera un bundle bajo `tools/support-bundles` o en el destino explícito indicado.
2. Verificar que `settings-sanitized.json`, `build-orca-snapshot.json`, `runtime-journal-tail.json` y `api-inventory.json` existen y que no incluyen rutas locales en claro.
3. Verificar que el bundle no copia código bruto del workspace por defecto.