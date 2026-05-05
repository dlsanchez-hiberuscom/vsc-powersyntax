# System Catalog Architecture

## Propósito

Definir la arquitectura viva del catálogo del sistema PowerBuilder.

El detalle operativo de authoring localizado vive en `docs/catalog/catalog-localization-workflow.md`.

## Componentes

- generated catalog como base oficial reproducible
- manual overlays curados para gaps, enrichments y overrides permitidos
- localization overlays documentales, sin cambiar identidad semántica
- consistency, provenance y coverage reports como rail de validación

## Source of truth

La policy vigente es:

```txt
generated-primary-with-manual-overlays
```

`generated` es la base cuando existe evidencia oficial.

`manual` no sustituye masivamente al catálogo generado; solo cubre gaps o dominios explícitamente permitidos.

## Reglas

- El hot path nunca clona el catálogo completo.
- Las queries son owner-scoped y con result caps.
- La localización no traduce anchors técnicos.
- Los nombres reales de PowerBuilder no se traducen.
- Los reports de consistency y release readiness deben detectar orphan overlays, candidate leaks y drift estructural.
- Los consumers interactivos deben reutilizar servicios compartidos y no reconstruir datasets completos por feature.
