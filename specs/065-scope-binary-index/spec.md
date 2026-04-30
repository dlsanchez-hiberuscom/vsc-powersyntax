# Spec 065-scope-binary-index

## Titulo
Position->Scope binary index O(log n)

## Motivacion
`getScopeAt` recursivo era O(n); reemplazar por indice plano + binary search.

## Alcance
- Cambios localizados en server.
- Sin nuevas features de usuario.

## Criterios
- Tests verdes.
- Cero regresiones.
