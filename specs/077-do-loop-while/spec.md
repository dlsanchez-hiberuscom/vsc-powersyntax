# Spec 077-do-loop-while

## Titulo
`do ... loop while/until expr` no reabre

## Motivacion
Confirmar que `loop while expr` solo cierra do.

## Alcance
- Cambios localizados en server.
- Sin nuevas features de usuario.

## Criterios
- Tests verdes.
- Cero regresiones.
