# Spec 191 - Hover surface de lineage (B172)

## 1. Resumen

Exponer en hover un resumen mínimo de lineage para símbolos de usuario y de sistema.

## 2. Problema

El modelo ya conoce lineage, pero hover todavía no lo enseña. Eso deja `B172` sin una surface visible para validar el origen y la confianza del símbolo resuelto.

## 3. Objetivo

Añadir una línea compacta de lineage a los hovers existentes.

## 4. Alcance

- Extender el formatter de hover de usuario.
- Añadir provenance-lineage al hover de catálogo de sistema.
- Cubrir ambos casos con tests unitarios.

## 5. Fuera de alcance

- Rediseñar el markdown completo.
- Exponer lineage en completion o signature help.
- Cambiar aún la API pública.

## 6. Criterios de aceptacion

- AC1. Un símbolo de usuario con lineage muestra origen/autoridad/confianza en hover.
- AC2. Un símbolo de sistema muestra lineage derivado desde provenance.
- AC3. El baseline completo sigue verde.