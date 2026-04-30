# Spec 094-diagnostic-dedup

## Titulo
Diagnostic dedup

## Motivacion
Deduplica diagnosticos por (line, char, severity, message) antes de publicarlos.

## Alcance
- Cambio localizado en server.
- Sin nuevas features de usuario.

## Criterios
- Tests verdes.
- Cero regresiones.
