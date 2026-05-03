# Quickstart — Spec 375 Official enumerated datatype extractor and coverage rail

## Focused validation

```bash
node script/generate_official_function_catalog.cjs
npm run compile
npx tsc -p tsconfig.test.json
npx vscode-test --label unit --grep "unit/catalogGeneratorScript|unit/catalogV2|unit/hover"
```

## Expected result

El rail oficial debe regenerar `enumeratedTypes.generated.ts`, `enumeratedValues.generated.ts`, `enumeratedCoverage.generated.ts` y `enumeratedProvenance.generated.ts` sin arrastrar TOCs/navfooters de Appeon, publicar cobertura oficial completa de `enumerated-types` y `enumerated-values`, y dejar el hover de `WindowType` mostrando la unión efectiva de valores manual-core y generated.