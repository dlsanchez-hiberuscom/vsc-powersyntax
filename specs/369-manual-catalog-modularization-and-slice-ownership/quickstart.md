# Quickstart — Spec 369 Manual catalog modularization and slice ownership

## Focused validation

```bash
npm run build:test
npm run test:unit
```

## Expected result

El catálogo manual queda partido por dominios funcionales, `manual/common.ts` conserva solo factories/helpers, el registry consume agregadores estables y la suite unitaria completa no muestra regresiones en catálogo, consumers interactivos ni boundaries arquitectónicos.