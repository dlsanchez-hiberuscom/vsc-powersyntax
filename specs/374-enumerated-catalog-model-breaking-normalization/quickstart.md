# Quickstart — Spec 374 Enumerated catalog model breaking normalization

## Focused validation

```bash
npm run test:unit -- --grep "catalogV2|systemCatalogQueryHardening"
npm run test:unit -- --grep "completion|hover|semanticTokens|signatureHelp"
npm run test:unit -- --grep "catalog|systemCatalog|catalogV2|enumerated|enum"
```

## Expected result

El catálogo debe resolver `SaveAsType` como `enumerated-type`, rechazar `SaveAsType!` como tipo canónico, resolver `Text!` y `Primary!` como `enumerated-value` con `enumValueOf` correcto, mantener `invalidEnumeratedTypeNames = []` y exponer completion/hover alineados con el modelo nuevo sin aliases incompatibles.