# ADR-0001 — System Catalog Source of Truth

## Decisión

El System Catalog se gobierna bajo el principio **generated-primary-with-manual-overlays**.

- `generated`: fuente primaria oficial reproducible.
- `manual/curated`: solo gaps, enrichments, overrides o candidates explícitos.

Los dominios sin rail oficial permanecen en manual-primary hasta disponer de extractor defendible.

## Consecuencias

- Ningún consumer interactivo escanea el catálogo completo.
- Toda localización es overlay documental, nunca identidad semántica.
- Los IDs son estables y no se modifican sin spec explícita.
