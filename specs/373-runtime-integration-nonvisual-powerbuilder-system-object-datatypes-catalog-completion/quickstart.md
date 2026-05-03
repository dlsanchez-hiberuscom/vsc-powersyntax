# Quickstart — Spec 373 Runtime, integration and nonvisual PowerBuilder system object datatypes catalog completion

## Focused validation

```bash
npm run test:unit -- --grep "runtimeCatalogDatatypes|catalogV2"
npm run test:unit -- --grep "catalog|systemCatalog|catalogV2|catalogConsistency|nativeAncestors|ownerTypes"
npm run test:unit -- --grep "completion|hover|signatureHelp"
```

## Expected result

El carril `manual/runtime/` + `manual/integration/` queda cerrado en `manual-core`, con tipos runtime/nonvisual e integration modernos resueltos desde el catálogo estable, casing canónico para `Inet`, `RESTClient`, `MailFileDescription` y `MailMessage`, `PB_BUILTIN_TYPES` alineado para tipos representativos (`HTTPClient`, `PDFPage`, `SMTPClient`, `TraceTreeRoutine`, `ResourceResponse`, etc.) y sin reintroducir controles visuales en el rail nonvisual.