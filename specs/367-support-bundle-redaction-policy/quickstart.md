# Quickstart — Spec 367 Support bundle redaction policy

## Focused validation

```bash
npm run build:test
npx mocha --ui tdd out/test/server/unit/supportBundle.test.js
npm run test:smoke -- --grep "exporta un support bundle saneado desde el workspace activo"
```

## Expected result

El support bundle exportado debe publicar `redactionProfile` y `redactionPolicy` explícitos, endurecer diagnostics/settings/manifest/snippets cuando el perfil activo lo requiera y seguir sin copiar código bruto del workspace.