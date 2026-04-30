# Spec 089-variable-decl-ignore-assignments

## Titulo
matchVariableDeclaration robusto

## Motivacion
El patron exige type+name; lineas tipo `var = expr` no matchean por construccion. Documentado como regla.

## Alcance
- Cambio localizado en server.
- Sin nuevas features de usuario.

## Criterios
- Tests verdes.
- Cero regresiones.
