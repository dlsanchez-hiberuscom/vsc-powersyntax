# Spec 084-cache-invalidation-cascade

## Titulo
Invalidacion en cascada de cache

## Motivacion
invalidateDocumentAnalysis ahora limpia tambien DocumentCache y KnowledgeBase para evitar facts/scopes obsoletos.

## Alcance
- Cambio localizado en server.
- Sin nuevas features de usuario.

## Criterios
- Tests verdes.
- Cero regresiones.
