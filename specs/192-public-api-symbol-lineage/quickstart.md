# Quickstart - Spec 192 Public API symbol lineage (B109/B172)

## 1. Proposito

Comprobar que la API pública ya puede exponer lineage mínimo por símbolo sin filtrar estructuras internas completas.

## 2. Validacion rapida

1. Ejecutar los tests de `publicApi`.
2. Ejecutar compile y `npm test`.
3. Revisar que `toApiSymbol()` preserve lineage y omita el bloque cuando no exista.

## 3. Checklist

- [x] `ApiSymbol` soporta lineage mínimo.
- [x] Existe mapper puro estable.
- [x] Compile y tests pasan.