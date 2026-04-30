# Spec 062 — Obsolete detector sanity

## Motivación
Smoke que asegura que `findObsoleteCalls` detecta funciones deprecadas
del catálogo.

## Alcance
- `test/server/unit/obsoleteDetectorSanity.test.ts`.

## Criterios
1. Detecta función conocida como obsoleta (o si no hay obsoletas, smoke vacío sin fallo).
