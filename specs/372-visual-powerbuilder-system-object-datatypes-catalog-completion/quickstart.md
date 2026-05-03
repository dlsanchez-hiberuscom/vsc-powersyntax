# Quickstart — Spec 372 Visual PowerBuilder system object datatypes catalog completion

## Focused validation

```bash
npm run build:test
npm run test:unit -- --grep "visualCatalogDatatypes|catalogV2"
```

## Expected result

El carril visual del catálogo queda separado bajo `manual/visual/`, `Application` permanece en runtime/system, `OLEControl`/`OLECustomControl` quedan en `OLE visual` y tipos avanzados como `MDIFrame`, `MDIClient`, `MenuCascade`, `RibbonApplicationMenu`, `RibbonPanelItem` y `WindowActiveX` resuelven ya desde el catálogo estable con owner groups, ancestros nativos y `PB_BUILTIN_TYPES` alineados.