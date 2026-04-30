# Spec 083-analysis-cache-lru

## Titulo
analysisCache LRU bound

## Motivacion
La cache de analisis interactivo crecia ilimitada. Aplicar LRU con MAX_CACHED_ANALYSES=256.

## Alcance
- Cambio localizado en server.
- Sin nuevas features de usuario.

## Criterios
- Tests verdes.
- Cero regresiones.
