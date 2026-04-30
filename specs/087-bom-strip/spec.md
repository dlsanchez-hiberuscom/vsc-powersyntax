# Spec 087-bom-strip

## Titulo
BOM strip al inicio del documento

## Motivacion
Si la primera linea empieza con U+FEFF se elimina antes de tokenizar para no contaminar el primer token.

## Alcance
- Cambio localizado en server.
- Sin nuevas features de usuario.

## Criterios
- Tests verdes.
- Cero regresiones.
