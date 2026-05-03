# Quickstart — Spec 370 System catalog query/index hardening v2

## Focused validation

```bash
npm run build:test
npm run test:unit -- --grep "systemCatalogQueryHardening|catalogV2"
```

## Expected result

Las queries del system catalog usan índices compuestos readonly para dominio, kind, enum value y owner type por dominio; `SystemCatalog` queda como facade ligera; `resolveLanguageSymbol()` tiene prioridad explícita y los hot paths dejan de depender de concatenaciones o scans completos del catálogo.