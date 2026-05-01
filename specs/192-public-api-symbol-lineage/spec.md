# Spec 192 - Public API symbol lineage (B109/B172)

## 1. Resumen

Ampliar `ApiSymbol` con un bloque mínimo de lineage para exportar origen y confianza sin depender del modelo interno del servidor.

## 2. Problema

Hover y resolución ya conocen lineage, pero la API pública todavía no puede transportar esa información de forma estable.

## 3. Objetivo

Definir un subcontrato público y un mapper puro para `ApiSymbol`.

## 4. Alcance

- Añadir `ApiSymbolLineage`.
- Ampliar `ApiSymbol` con `lineage?`.
- Añadir `toApiSymbol()` como mapper puro y defensivo.
- Cubrirlo con tests unitarios.

## 5. Fuera de alcance

- Exponer aún comandos nuevos.
- Versionado mayor de la API.
- Exportar payloads ricos completos del winner path.

## 6. Criterios de aceptacion

- AC1. La API pública puede transportar lineage mínimo por símbolo.
- AC2. El mapper copia solo el subcontrato estable.
- AC3. Compile y baseline completo siguen verdes.