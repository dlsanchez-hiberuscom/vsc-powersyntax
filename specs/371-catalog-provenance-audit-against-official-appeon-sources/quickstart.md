# Quickstart — Spec 371 Catalog provenance audit against official Appeon sources

## Focused validation

```bash
npm run build:test
npm run test:unit -- --grep "catalogConsistency|catalogProvenanceAudit"
```

## Expected result

`buildCatalogConsistencyReport()` deja trazado ejecutable de provenance por dominio y dataset, `manual-core` queda marcado como curado, `generated` como oficial y los rails del catálogo ya no pueden exagerar coverage Appeon sin romper tests focales.