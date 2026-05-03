# Quickstart — Spec 376 Enumerated catalog completion and curated gap closure

## Focused validation

```bash
node script/generate_official_function_catalog.cjs
npm run compile
npx tsc -p tsconfig.test.json
npx vscode-test --label unit --grep "unit/catalogGeneratorScript|unit/catalogV2"
```

## Expected result

El catálogo enumerado debe conservar documentación oficial en tipos como `SecureProtocol` sin fabricar miembros nominales, publicar `SeekType` con `FromBeginning!`, `FromCurrent!` y `FromEnd!`, y dejar `missingDocs = []` para `enumerated-types` en el `SystemCatalog` compilado.